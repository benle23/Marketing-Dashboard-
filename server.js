import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { analyzePayload, getAnalysisStatus, publicError } from "./lib/analysis.js";
import { readRequestBody, sendApiError, sendJson } from "./lib/http.js";

const root = fileURLToPath(new URL(".", import.meta.url));

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
      sendJson(response, 200, await analyzePayload(await readRequestBody(request)));
      return;
    }

    if (request.url === "/api/status" && request.method === "GET") {
      sendJson(response, 200, getAnalysisStatus());
      return;
    }

    if (request.url?.startsWith("/api/")) {
      throw publicError(404, "API route not found.");
    }

    if (vite) {
      vite.middlewares(request, response);
      return;
    }

    await serveStatic(request, response);
  } catch (error) {
    sendApiError(response, error);
  }
});

server.listen(port, () => {
  console.log(`Marketing dashboard running at http://localhost:${port}`);
});

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
