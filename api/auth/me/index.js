import { publicAccount, readCurrentAccount } from "../../_lib/account.mjs";

function send(response, status, payload) {
  response.statusCode = status;
  response.setHeader("Content-Type", "application/json; charset=utf-8");
  response.setHeader("Cache-Control", "private, no-store");
  response.end(JSON.stringify(payload));
}

export default async function handler(request, response) {
  if (request.method !== "GET") return send(response, 405, { error: "method-not-allowed" });
  try {
    const account = await readCurrentAccount(request);
    if (!account) return send(response, 401, { error: "not-signed-in" });
    return send(response, 200, { ok: true, account: publicAccount(account) });
  } catch (error) {
    return send(response, error.message === "cloud-storage-not-configured" ? 503 : 400, { error: error.message || "me-failed" });
  }
}
