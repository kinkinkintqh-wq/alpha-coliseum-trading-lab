import http from "node:http";
import path from "node:path";
import { readFile, stat } from "node:fs/promises";
import { Readable } from "node:stream";

import worker from "./dist/server/index.js";

const host = process.env.HOST || "127.0.0.1";
const port = Number(process.env.PORT || 3210);
const clientRoot = path.resolve("dist/client");

const mimeTypes = {
  ".css": "text/css; charset=utf-8",
  ".gif": "image/gif",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
};

async function fetchAsset(request) {
  const url = new URL(request.url);
  const relativePath = decodeURIComponent(url.pathname).replace(/^\/+/, "");
  const filePath = path.resolve(clientRoot, relativePath);

  if (filePath !== clientRoot && !filePath.startsWith(`${clientRoot}${path.sep}`)) {
    return new Response("Forbidden", { status: 403 });
  }

  try {
    const fileStat = await stat(filePath);
    if (!fileStat.isFile()) return new Response("Not found", { status: 404 });

    const body = await readFile(filePath);
    const headers = new Headers({
      "Content-Type": mimeTypes[path.extname(filePath).toLowerCase()] || "application/octet-stream",
      "Cache-Control": relativePath.startsWith("_next/static/")
        ? "public, max-age=31536000, immutable"
        : "public, max-age=3600",
    });
    return new Response(request.method === "HEAD" ? null : body, { status: 200, headers });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}

const server = http.createServer(async (incoming, outgoing) => {
  try {
    const origin = `http://${incoming.headers.host || `${host}:${port}`}`;
    const url = new URL(incoming.url || "/", origin);
    const hasBody = incoming.method !== "GET" && incoming.method !== "HEAD";
    const request = new Request(url, {
      method: incoming.method,
      headers: incoming.headers,
      body: hasBody ? incoming : undefined,
      duplex: hasBody ? "half" : undefined,
    });

    let response;
    if (incoming.method === "GET" || incoming.method === "HEAD") {
      const assetResponse = await fetchAsset(request);
      if (assetResponse.status === 200 || assetResponse.status === 403) {
        response = assetResponse;
      }
    }

    if (!response) {
      response = await worker.fetch(
        request,
        { ASSETS: { fetch: fetchAsset } },
        { waitUntil() {} },
      );
    }

    const headers = {};
    response.headers.forEach((value, key) => {
      headers[key] = value;
    });
    outgoing.writeHead(response.status, headers);

    if (!response.body || incoming.method === "HEAD") {
      outgoing.end();
      return;
    }
    Readable.fromWeb(response.body).pipe(outgoing);
  } catch (error) {
    console.error(error);
    if (!outgoing.headersSent) outgoing.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
    outgoing.end("Internal server error");
  }
});

server.listen(port, host, () => {
  console.log(`Alpha Coliseum listening on http://${host}:${port}`);
});
