import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

export const SESSION_COOKIE = "bh_admin";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

function secret() {
  const s = process.env.AUTH_SECRET;
  if (!s) throw new Error("AUTH_SECRET is not set. Add it to .env.local");
  return s;
}

function sign(value: string) {
  return createHmac("sha256", secret()).update(value).digest("hex");
}

function safeEqual(a: string, b: string) {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && timingSafeEqual(ab, bb);
}

export function createSessionToken() {
  const expires = String(Date.now() + SESSION_MAX_AGE * 1000);
  return `${expires}.${sign(expires)}`;
}

export function verifySessionToken(token: string | undefined) {
  if (!token) return false;
  const [expires, sig] = token.split(".");
  try {
    if (!expires || !sig || !safeEqual(sig, sign(expires))) return false;
  } catch (err) {
    // Missing AUTH_SECRET: treat everyone as logged out rather than crashing every page.
    console.error(err);
    return false;
  }
  return Number(expires) > Date.now();
}

export function checkPassword(password: unknown) {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) throw new Error("ADMIN_PASSWORD is not set. Add it to .env.local");
  return typeof password === "string" && safeEqual(sign(password), sign(expected));
}

/** For server components and route handlers. */
export async function isAdmin() {
  const store = await cookies();
  return verifySessionToken(store.get(SESSION_COOKIE)?.value);
}
