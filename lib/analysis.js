import { extname } from "node:path";

const maxFiles = 5;
const maxFileBytes = 3 * 1024 * 1024;
const maxTotalFileBytes = 3 * 1024 * 1024;
const blockedExtensions = new Set([
  ".7z", ".app", ".bin", ".dmg", ".exe", ".gz", ".iso", ".pkg", ".rar", ".tar", ".zip",
]);
const imageExtensions = new Set([".gif", ".jpeg", ".jpg", ".png", ".webp"]);

export function getAnalysisStatus() {
  return {
    configured: Boolean(process.env.OPENAI_API_KEY),
    model: process.env.OPENAI_MODEL || "gpt-5.4-mini",
  };
}

export async function analyzePayload(payload) {
  if (!process.env.OPENAI_API_KEY) {
    throw publicError(
      503,
      "OPENAI_API_KEY is missing. Add it in Vercel Project Settings or a local .env file, then redeploy or restart.",
    );
  }

  const files = validateFiles(payload?.files || []);
  const content = buildInputContent(payload || {}, files);
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
        signal: AbortSignal.timeout(55_000),
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
      : "The server could not reach OpenAI. Check the deployment network and try again.";
    throw publicError(502, message);
  }

  const result = await readOpenAIResponse(openaiResponse);

  if (!openaiResponse.ok) {
    const detail = result.error?.message || `Request failed with status ${openaiResponse.status}.`;
    console.error("OpenAI API error:", detail);
    throw publicError(openaiResponse.status, `OpenAI could not analyze the data: ${detail}`);
  }

  if (result.status === "incomplete") {
    throw publicError(
      502,
      `OpenAI could not finish the analysis: ${result.incomplete_details?.reason || "unknown reason"}.`,
    );
  }

  const refusal = result.output
    ?.flatMap((item) => item.content || [])
    .find((item) => item.type === "refusal")?.refusal;
  if (refusal) {
    throw publicError(422, `OpenAI declined this analysis: ${refusal}`);
  }

  const outputText = extractOutputText(result);
  if (!outputText) {
    throw publicError(502, "OpenAI returned an empty analysis. Try again.");
  }

  try {
    return {
      analysis: JSON.parse(outputText),
      model: result.model,
      sources: files.map(({ name, size }) => ({ name, size })),
    };
  } catch {
    throw publicError(502, "OpenAI returned an unreadable analysis. Try again.");
  }
}

export function publicError(status, message) {
  const error = new Error(message);
  error.status = status;
  error.publicMessage = message;
  return error;
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
    content.push(file.isImage
      ? { type: "input_image", image_url: file.data, detail: "auto" }
      : { type: "input_file", filename: file.name, file_data: file.data });
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

  let totalBytes = 0;
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
      throw publicError(400, `${name} must be smaller than 3 MB.`);
    }

    totalBytes += dataSize;
    if (totalBytes > maxTotalFileBytes) {
      throw publicError(400, "The combined upload must be smaller than 3 MB.");
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
