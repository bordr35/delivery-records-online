import { readCurrentAccount, readJsonBody, readVault, saveVault } from "../../_lib/account.mjs";

function send(response, status, payload) {
  response.statusCode = status;
  response.setHeader("Content-Type", "application/json; charset=utf-8");
  response.setHeader("Cache-Control", "private, no-store");
  response.end(JSON.stringify(payload));
}

export default async function handler(request, response) {
  try {
    const account = await readCurrentAccount(request);
    if (!account) return send(response, 401, { error: "not-signed-in" });

    if (request.method === "GET") {
      const payload = await readVault(account.accountId);
      if (!payload) return send(response, 200, { exists: false, payload: null });
      return send(response, 200, { exists: true, payload });
    }

    if (request.method === "PUT") {
      const payload = await readJsonBody(request);
      if (!payload || !payload.ciphertext || !payload.iv || !payload.salt) return send(response, 400, { error: "bad-payload" });
      const record = { ...payload, updatedAt: new Date().toISOString(), accountId: account.accountId };
      await saveVault(account.accountId, record);
      return send(response, 200, { ok: true, updatedAt: record.updatedAt });
    }

    response.setHeader("Allow", "GET, PUT");
    return send(response, 405, { error: "method-not-allowed" });
  } catch (error) {
    return send(response, error.message === "cloud-storage-not-configured" ? 503 : 400, { error: error.message || "vault-failed" });
  }
}
