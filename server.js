import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL(".", import.meta.url));
const maxBodyBytes = 250_000;

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
    console.error(error);
    sendJson(response, 500, { error: "The server could not complete this request." });
  }
});

server.listen(port, () => {
  console.log(`Marketing dashboard running at http://localhost:${port}`);
});

async function handleAnalysis(request, response) {
  if (!process.env.OPENAI_API_KEY) {
    sendJson(response, 503, {
      error: "Add OPENAI_API_KEY to a local .env file, then restart the dashboard.",
    });
    return;
  }

  const dashboardData = await readJsonBody(request);
  const openaiResponse = await fetch(
    `${process.env.OPENAI_API_BASE_URL || "https://api.openai.com/v1"}/responses`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-5.5",
        store: false,
        reasoning: { effort: "low" },
        instructions:
          "You are a concise marketing analytics advisor. Analyze only the supplied dashboard data. Identify the single most important issue and exactly three practical priorities. Use plain English, cite metrics from the data, avoid invented facts, and keep each field brief.",
        input: JSON.stringify(dashboardData),
        text: {
          verbosity: "low",
          format: {
            type: "json_schema",
            name: "marketing_analysis",
            strict: true,
            schema: {
              type: "object",
              additionalProperties: false,
              required: ["headline", "summary", "priorities"],
              properties: {
                headline: { type: "string" },
                summary: { type: "string" },
                priorities: {
                  type: "array",
                  minItems: 3,
                  maxItems: 3,
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

  const result = await openaiResponse.json();

  if (!openaiResponse.ok) {
    console.error("OpenAI API error:", result.error?.message || openaiResponse.statusText);
    sendJson(response, openaiResponse.status, {
      error: "OpenAI could not analyze the data. Check the API key, model access, and billing.",
    });
    return;
  }

  const outputText =
    result.output_text ||
    result.output
      ?.flatMap((item) => item.content || [])
      .find((item) => item.type === "output_text")?.text;

  if (!outputText) {
    sendJson(response, 502, { error: "OpenAI returned an empty analysis." });
    return;
  }

  sendJson(response, 200, { analysis: JSON.parse(outputText), model: result.model });
}

async function readJsonBody(request) {
  const chunks = [];
  let size = 0;

  for await (const chunk of request) {
    size += chunk.length;
    if (size > maxBodyBytes) {
      throw new Error("Request body is too large.");
    }
    chunks.push(chunk);
  }

  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
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
