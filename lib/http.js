import { publicError } from "./analysis.js";

const maxBodyBytes = 4 * 1024 * 1024;

export async function readRequestBody(request) {
  if (request.body && typeof request.body === "object" && !Buffer.isBuffer(request.body)) {
    return request.body;
  }
  if (typeof request.body === "string") {
    return parseJson(request.body);
  }

  const chunks = [];
  let size = 0;
  for await (const chunk of request) {
    size += chunk.length;
    if (size > maxBodyBytes) {
      throw publicError(413, "The upload is too large. Upload fewer or smaller files.");
    }
    chunks.push(chunk);
  }

  return parseJson(Buffer.concat(chunks).toString("utf8"));
}

export function sendApiError(response, error) {
  if (!error.publicMessage) {
    console.error(error);
  }
  sendJson(response, error.status || 500, {
    error: error.publicMessage || "The server could not complete this request.",
  });
}

export function sendJson(response, status, data) {
  response.statusCode = status;
  response.setHeader("Content-Type", "application/json; charset=utf-8");
  response.end(JSON.stringify(data));
}

function parseJson(value) {
  try {
    return JSON.parse(value || "{}");
  } catch {
    throw publicError(400, "The analysis request is not valid JSON.");
  }
}
