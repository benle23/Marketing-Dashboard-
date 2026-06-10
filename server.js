import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL(".", import.meta.url));
const maxBodyBytes = 48 * 1024 * 1024;
const maxFiles = 5;
const maxFileBytes = 25 * 1024 * 1024;
const blockedExtensions = new Set([
  ".7z", ".app", ".bin", ".dmg", ".exe", ".gz", ".iso", ".pkg", ".rar", ".tar", ".zip",
]);
const imageExtensions = new Set([".gif", ".jpeg", ".jpg", ".png", ".webp"]);

await loadLocalEnv();

const port = Number(process.env.PORT || 5173);
const production = process.env.NODE_ENV === "production";
const vite = production
  ? null
  : await import("vite").then(({ createServer: createViteServer }) =>
      createViteServer({ server: { middlewareMode: true }, appType: "spa" }),
    );

const server = createServer(async (request, response) => {
  try {
    if (request.url === "/api/analyze" && request.method === "POST") {
      await handleAnalysis(request, response);
      return;
    }

    if (request.url === "/api/status" && request.method === "GET") {
      sendJson(response, 200, {
        configured: Boolean(process.env.OPENAI_API_KEY),
        model: process.env.OPENAI_MODEL || "gpt-5.4-mini",
      });
      return;
    }

    if (request.url?.startsWith("/api/")) {
      sendJson(response, 404, { error: "API route not found." });
      return;
    }

    if (vite) {
      vite.middlewares(request, response);
      return;
    }

    await serveStatic(request, response);
  } catch (error) {
    if (!error.status || error.status >= 500) {
      console.error(error);
    }
    sendJson(response, error.status || 500, {
      error: error.publicMessage || "The server could not complete this request.",
    });
  }
});

server.listen(port, () => {
  console.log(`Marketing dashboard running at http://localhost:${port}`);
});

async function handleAnalysis(request, response) {
  if (!process.env.OPENAI_API_KEY) {
    sendJson(response, 503, {
      error: "The server is running, but OPENAI_API_KEY is missing. Add it to .env and restart.",
    });
    return;
  }

  const payload = await readJsonBody(request);
  const files = validateFiles(payload.files || []);
  const content = buildInputContent(payload, files);

  let openaiResponse;
  try {
    openaiResponse = await fetch(
      `${process.env.OPENAI_API_BASE_URL || "https://api.openai.com/v1"}/responses`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
        signal: AbortSignal.timeout(120_000),
        body: JSON.stringify({
          model: process.env.OPENAI_MODEL || "gpt-5.4-mini",
          store: false,
          instructions:
            "You are a concise marketing and business data analyst. Analyze only the supplied dashboard data and uploaded files. Explain the most important pattern, data quality limitations, and exactly three practical next actions. Cite specific values from the supplied data, never invent facts, and use plain English.",
          input: [{ role: "user", content }],
          text: {
            format: {
              type: "json_schema",
              name: "data_analysis",
              strict: true,
              schema: {
                type: "object",
                additionalProperties: false,
                required: ["headline", "summary", "dataSummary", "priorities"],
                properties: {
                  headline: { type: "string" },
                  summary: { type: "string" },
                  dataSummary: { type: "string" },
                  priorities: {
                    type: "array",
                    items: {
                      type: "object",
                      additionalProperties: false,
                      required: ["action", "evidence", "impact", "confidence"],
                      properties: {
                        action: { type: "string" },
                        evidence: { type: "string" },
                        impact: { type: "string" },
                        confidence: { type: "string", enum: ["High", "Medium", "Low"] },
                      },
                    },
                  },
                },
              },
            },
          },
        }),
      },
    );
  } catch (error) {
    const message = error.name === "TimeoutError"
      ? "OpenAI analysis timed out. Try a smaller file or fewer files."
      : "The server could not reach OpenAI. Check the network connection and try again.";
    sendJson(response, 502, { error: message });
    return;
  }

  const result = await readOpenAIResponse(openaiResponse);

  if (!openaiResponse.ok) {
    const detail = result.error?.message || `Request failed with status ${openaiResponse.status}.`;
    console.error("OpenAI API error:", detail);
    sendJson(response, openaiResponse.status, {
      error: `OpenAI could not analyze the data: ${detail}`,
    });
    return;
  }

  if (result.status === "incomplete") {
    sendJson(response, 502, {
      error: `OpenAI could not finish the analysis: ${result.incomplete_details?.reason || "unknown reason"}.`,
    });
    return;
  }

  const refusal = result.output
    ?.flatMap((item) => item.content || [])
    .find((item) => item.type === "refusal")?.refusal;
  if (refusal) {
    sendJson(response, 422, { error: `OpenAI declined this analysis: ${refusal}` });
    return;
  }

  const outputText = extractOutputText(result);
  if (!outputText) {
    sendJson(response, 502, { error: "OpenAI returned an empty analysis. Try again." });
    return;
  }

  try {
    sendJson(response, 200, {
      analysis: JSON.parse(outputText),
      model: result.model,
      sources: files.map(({ name, size }) => ({ name, size })),
    });
  } catch {
    sendJson(response, 502, { error: "OpenAI returned an unreadable analysis. Try again." });
  }
}

function buildInputContent(payload, files) {
  const question = typeof payload.question === "string" && payload.question.trim()
    ? payload.question.trim().slice(0, 2_000)
    : "Analyze this data and recommend the three most important next actions.";
  const dashboardData = payload.dashboardData && typeof payload.dashboardData === "object"
    ? JSON.stringify(payload.dashboardData)
    : "{}";
  const content = [
    {
      type: "input_text",
      text: `${question}\n\nCurrent dashboard context:\n${dashboardData}`,
    },
  ];

  for (const file of files) {
    if (file.isImage) {
      content.push({ type: "input_image", image_url: file.data, detail: "auto" });
    } else {
      content.push({ type: "input_file", filename: file.name, file_data: file.data });
    }
  }

  return content;
}

function validateFiles(files) {
  if (!Array.isArray(files)) {
    throw publicError(400, "Uploaded files must be sent as a list.");
  }
  if (files.length > maxFiles) {
    throw publicError(400, `Upload no more than ${maxFiles} files at a time.`);
  }

  return files.map((file) => {
    const name = sanitizeFileName(file?.name);
    const extension = extname(name).toLowerCase();
    const size = Number(file?.size || 0);
    const dataSize = estimateDataUrlBytes(file?.data);

    if (!name || dataSize === null) {
      throw publicError(400, "One of the uploaded files is invalid.");
    }
    if (blockedExtensions.has(extension)) {
      throw publicError(400, `${name} is an archive, application, or unsupported binary file.`);
    }
    if (!size || size > maxFileBytes || dataSize > maxFileBytes) {
      throw publicError(400, `${name} must be smaller than 25 MB.`);
    }

    return {
      data: file.data,
      isImage: String(file.type || "").startsWith("image/") || imageExtensions.has(extension),
      name,
      size,
    };
  });
}

function estimateDataUrlBytes(data) {
  if (typeof data !== "string" || !/^data:[^,]+;base64,/.test(data)) {
    return null;
  }
  const encoded = data.slice(data.indexOf(",") + 1);
  return Math.ceil((encoded.length * 3) / 4);
}

function sanitizeFileName(value) {
  return typeof value === "string"
    ? value.replace(/[^\w.\- ()]/g, "_").slice(0, 180)
    : "";
}

function extractOutputText(result) {
  return result.output_text ||
    result.output
      ?.flatMap((item) => item.content || [])
      .find((item) => item.type === "output_text")?.text;
}

async function readOpenAIResponse(response) {
  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch {
    return { error: { message: text.slice(0, 300) || response.statusText } };
  }
}

async function readJsonBody(request) {
  const chunks = [];
  let size = 0;

  for await (const chunk of request) {
    size += chunk.length;
    if (size > maxBodyBytes) {
      throw publicError(413, "The upload is too large. Upload fewer or smaller files.");
    }
    chunks.push(chunk);
  }

  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    throw publicError(400, "The analysis request is not valid JSON.");
  }
}

function publicError(status, message) {
  const error = new Error(message);
  error.status = status;
  error.publicMessage = message;
  return error;
}

function sendJson(response, status, data) {
  response.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  response.end(JSON.stringify(data));
}

async function serveStatic(request, response) {
  const url = new URL(request.url || "/", "http://localhost");
  const requestedPath = url.pathname === "/" ? "index.html" : url.pathname.slice(1);
  const safePath = resolve(root, "dist", requestedPath);
  const distPath = resolve(root, "dist");
  const filePath = safePath.startsWith(distPath) && (await isFile(safePath))
    ? safePath
    : join(distPath, "index.html");
  const content = await readFile(filePath);
  const contentTypes = {
    ".css": "text/css",
    ".html": "text/html",
    ".js": "text/javascript",
    ".json": "application/json",
    ".svg": "image/svg+xml",
  };

  response.writeHead(200, { "Content-Type": contentTypes[extname(filePath)] || "application/octet-stream" });
  response.end(content);
}

async function isFile(path) {
  try {
    return (await stat(path)).isFile();
  } catch {
    return false;
  }
}

async function loadLocalEnv() {
  try {
    const file = await readFile(join(root, ".env"), "utf8");
    for (const line of file.split(/\r?\n/)) {
      const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
      if (match && !process.env[match[1]]) {
        process.env[match[1]] = match[2].replace(/^['"]|['"]$/g, "");
      }
    }
  } catch {
    // Local environment file is optional.
  }
}
