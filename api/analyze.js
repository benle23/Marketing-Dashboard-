import { analyzePayload } from "../lib/analysis.js";
import { readRequestBody, sendApiError, sendJson } from "../lib/http.js";

export const config = {
  maxDuration: 60,
};

export default async function handler(request, response) {
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    sendJson(response, 405, { error: "Use POST to analyze data." });
    return;
  }

  try {
    const payload = await readRequestBody(request);
    const result = await analyzePayload(payload);
    sendJson(response, 200, result);
  } catch (error) {
    sendApiError(response, error);
  }
}
