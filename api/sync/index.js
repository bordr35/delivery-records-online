import { get, put } from "@vercel/blob";

const MAX_BODY_BYTES = 4_200_000;

function sendJson(response, status, payload) {
  response.statusCode = status;
  response.setHeader("Content-Type", "application/json; charset=utf-8");
  response.setHeader("Cache-Control", "private, no-store");
  response.end(JSON.stringify(payload));
}

function validSyncId(value) {
  return typeof value === "string" && /^[a-f0-9]{32,64}$/.test(value);
}

async function readBody(request) {
  const chunks = [];
  let total = 0;
  for await (const chunk of request) {
    total += chunk.length;
    if (total > MAX_BODY_BYTES) throw new Error("payload-too-large");
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString("utf8");
}

export default async function handler(request, response) {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return sendJson(response, 503, { error: "cloud-storage-not-configured" });
  }

  const url = new URL(request.url, "https://delivery-records.local");
  const syncId = url.searchParams.get("id");
  if (!validSyncId(syncId)) return sendJson(response, 400, { error: "bad-sync-id" });

  const pathname = `delivery-records/sync/${syncId}.json`;

  if (request.method === "GET") {
    const result = await get(pathname, { access: "private" }).catch(() => null);
    if (!result || result.statusCode === 404) return sendJson(response, 200, { exists: false, payload: null });
    const text = await new Response(result.stream).text();
    return sendJson(response, 200, { exists: true, payload: JSON.parse(text), etag: result.blob?.etag || "" });
  }

  if (request.method === "PUT") {
    let payload;
    try {
      payload = JSON.parse(await readBody(request));
    } catch (error) {
      return sendJson(response, error.message === "payload-too-large" ? 413 : 400, { error: error.message === "payload-too-large" ? "payload-too-large" : "bad-json" });
    }
    if (!payload || !payload.ciphertext || !payload.iv || !payload.salt) return sendJson(response, 400, { error: "bad-payload" });

    const blob = await put(pathname, JSON.stringify(payload), {
      access: "private",
      allowOverwrite: true,
      contentType: "application/json; charset=utf-8",
      cacheControlMaxAge: 60
    });
    return sendJson(response, 200, { ok: true, pathname: blob.pathname, uploadedAt: new Date().toISOString() });
  }

  response.setHeader("Allow", "GET, PUT");
  return sendJson(response, 405, { error: "method-not-allowed" });
}
