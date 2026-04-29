import {
  accountIdForEmail,
  hashPassword,
  makeSessionCookie,
  normalizeEmail,
  publicAccount,
  randomSalt,
  readAccountByEmail,
  readJsonBody,
  saveAccount,
  validateEmail,
  validatePassword,
} from "../_lib/account.mjs";

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
    const { email, password, displayName } = await readJsonBody(request);
    if (!validateEmail(email)) return send(response, 400, { error: "bad-email" });
    if (!validatePassword(password)) return send(response, 400, { error: "weak-password" });
    const normalizedEmail = normalizeEmail(email);
    const existing = await readAccountByEmail(normalizedEmail);
    if (existing) return send(response, 409, { error: "account-exists" });

    const account = {
      accountId: accountIdForEmail(normalizedEmail),
      email: normalizedEmail,
      displayName: String(displayName || "").trim() || normalizedEmail.split("@")[0],
      passwordSalt: randomSalt(),
      vaultSalt: randomSalt(),
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
    };
    account.passwordHash = hashPassword(password, account.passwordSalt);
    await saveAccount(account);
    return send(response, 200, { ok: true, account: publicAccount(account) }, [makeSessionCookie(account)]);
  } catch (error) {
    return send(response, error.message === "cloud-storage-not-configured" ? 503 : 400, { error: error.message || "register-failed" });
  }
}
