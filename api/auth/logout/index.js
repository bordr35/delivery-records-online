import { clearSessionCookie } from "../../_lib/account.mjs";

function send(response, status, payload, cookies = []) {
  response.statusCode = status;
  response.setHeader("Content-Type", "application/json; charset=utf-8");
  response.setHeader("Cache-Control", "private, no-store");
  if (cookies.length) response.setHeader("Set-Cookie", cookies);
  response.end(JSON.stringify(payload));
}

export default async function handler(request, response) {
  if (request.method !== "POST") return send(response, 405, { error: "method-not-allowed" });
  return send(response, 200, { ok: true }, [clearSessionCookie()]);
}
