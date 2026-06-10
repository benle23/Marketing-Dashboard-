import { getAnalysisStatus } from "../lib/analysis.js";
import { sendJson } from "../lib/http.js";

export default function handler(request, response) {
  if (request.method !== "GET") {
    response.setHeader("Allow", "GET");
    sendJson(response, 405, { error: "Use GET to check analysis status." });
    return;
  }

  sendJson(response, 200, getAnalysisStatus());
}
