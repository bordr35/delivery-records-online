import { get, put } from "@vercel/blob";
import { createHash, createHmac, pbkdf2Sync, randomBytes, timingSafeEqual } from "node:crypto";

const PREFIX = "delivery-records";
const SESSION_COOKIE = "dr_session";
const SESSION_MAX_AGE = 60 * 60 * 24 * 30;
const PASSWORD_ITERS = 210000;

function blobSecret() {
  return process.env.BLOB_READ_WRITE_TOKEN || "";
}

function requireSecret() {
  const secret = blobSecret();
  if (!secret) throw new Error("cloud-storage-not-configured");
  return secret;
}

export function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

export function accountIdForEmail(email) {
  return createHash("sha256").update(normalizeEmail(email)).digest("hex");
}

export function randomSalt() {
  return randomBytes(16).toString("base64url");
}

export function hashPassword(password, salt) {
  return pbkdf2Sync(String(password || ""), String(salt || ""), PASSWORD_ITERS, 64, "sha256").toString("hex");
}

export function accountPath(accountId) {
  return `${PREFIX}/accounts/${accountId}.json`;
}

export function vaultPath(accountId) {
  return `${PREFIX}/vaults/${accountId}.json`;
}

export function publicAccount(account) {
  if (!account) return null;
  return {
    accountId: account.accountId,
    email: account.email,
    displayName: account.displayName || "",
    vaultSalt: account.vaultSalt || "",
    createdAt: account.createdAt || "",
    lastLoginAt: account.lastLoginAt || "",
  };
}

async function readBlob(pathname) {
  requireSecret();
  const result = await get(pathname, { access: "private" }).catch(() => null);
  if (!result || result.statusCode === 404) return null;
  const text = await new Response(result.stream).text();
  return JSON.parse(text);
}

async function writeBlob(pathname, payload) {
  requireSecret();
  return put(pathname, JSON.stringify(payload), {
    access: "private",
    allowOverwrite: true,
    contentType: "application/json; charset=utf-8",
    cacheControlMaxAge: 60,
  });
}

export async function readAccount(accountId) {
  return readBlob(accountPath(accountId));
}

export async function readAccountByEmail(email) {
  return readAccount(accountIdForEmail(email));
}

export async function saveAccount(account) {
  return writeBlob(accountPath(account.accountId), account);
}

export async function readVault(accountId) {
  return readBlob(vaultPath(accountId));
}

export async function saveVault(accountId, payload) {
  return writeBlob(vaultPath(accountId), payload);
}

function hmac(value) {
  return createHmac("sha256", requireSecret()).update(value).digest("base64url");
}

function signSessionPayload(payload) {
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${encoded}.${hmac(encoded)}`;
}

function verifySessionPayload(token) {
  if (!token || !token.includes(".")) return null;
  const [encoded, mac] = token.split(".");
  const expected = hmac(encoded);
  const safeA = Buffer.from(mac);
  const safeB = Buffer.from(expected);
  if (safeA.length !== safeB.length || !timingSafeEqual(safeA, safeB)) return null;
  try {
    return JSON.parse(Buffer.from(encoded, "base64url").toString("utf8"));
  } catch {
    return null;
  }
}

export function makeSessionCookie(account) {
  const payload = {
    sub: account.accountId,
    email: account.email,
    exp: Date.now() + SESSION_MAX_AGE * 1000,
  };
  const token = signSessionPayload(payload);
  const secure = process.env.VERCEL ? "; Secure" : "";
  return `${SESSION_COOKIE}=${token}; HttpOnly; Path=/; SameSite=Lax; Max-Age=${SESSION_MAX_AGE}${secure}`;
}

export function clearSessionCookie() {
  const secure = process.env.VERCEL ? "; Secure" : "";
  return `${SESSION_COOKIE}=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0${secure}`;
}

export function readSession(request) {
  const cookieHeader = request.headers?.cookie || request.headers?.Cookie || "";
  const match = cookieHeader.match(new RegExp(`(?:^|; )${SESSION_COOKIE}=([^;]+)`));
  if (!match) return null;
  const payload = verifySessionPayload(match[1]);
  if (!payload || !payload.sub || !payload.exp || payload.exp < Date.now()) return null;
  return payload;
}

export async function readCurrentAccount(request) {
  const session = readSession(request);
  if (!session) return null;
  const account = await readAccount(session.sub);
  return account || null;
}

export async function readJsonBody(request) {
  const chunks = [];
  for await (const chunk of request) chunks.push(chunk);
  if (!chunks.length) return {};
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

export function validatePassword(password) {
  return typeof password === "string" && password.length >= 10;
}

export function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizeEmail(email));
}

export function verifyPassword(password, account) {
  const expected = Buffer.from(account.passwordHash, "hex");
  const actual = Buffer.from(hashPassword(password, account.passwordSalt), "hex");
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}
