import {
  makeSessionCookie,
  normalizeEmail,
  publicAccount,
  readAccountByEmail,
  readJsonBody,
  saveAccount,
  verifyPassword,
} from "../../_lib/account.mjs";

function send(response, status, payload, cookies = []) {
  response.statusCode = status;
  response.setHeader("Content-Type", "application/json; charset=utf-8");
  response.setHeader("Cache-Control", "private, no-store");
  if (cookies.length) response.setHeader("Set-Cookie", cookies);
  response.end(JSON.stringify(payload));
}

export default async function handler(request, response) {
  if (request.method !== "POST") return send(response, 405, { error: "method-not-allowed" });
  try {
    const { email, password } = await readJsonBody(request);
    const normalizedEmail = normalizeEmail(email);
    if (!normalizedEmail || !password) return send(response, 400, { error: "bad-credentials" });
    const account = await readAccountByEmail(normalizedEmail);
    if (!account || !verifyPassword(password, account)) return send(response, 401, { error: "invalid-login" });
    account.lastLoginAt = new Date().toISOString();
    await saveAccount(account);
    return send(response, 200, { ok: true, account: publicAccount(account) }, [makeSessionCookie(account)]);
  } catch (error) {
    return send(response, error.message === "cloud-storage-not-configured" ? 503 : 400, { error: error.message || "login-failed" });
  }
}
