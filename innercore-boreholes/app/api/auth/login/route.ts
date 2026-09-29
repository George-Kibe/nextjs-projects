import { cookies } from "next/headers";
import { checkPassword, createSessionToken, SESSION_COOKIE, SESSION_MAX_AGE } from "@/lib/auth";
import { jsonError, readJson } from "@/lib/api";

/** POST /api/auth/login  { password } */
export async function POST(request: Request) {
  const body = await readJson(request);
  let token: string;
  try {
    if (!checkPassword(body?.password)) return jsonError(401, "Incorrect password");
    token = createSessionToken();
  } catch (err) {
    console.error(err);
    return jsonError(500, "Login is not configured. Set ADMIN_PASSWORD and AUTH_SECRET in .env.local");
  }

  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
  return Response.json({ ok: true });
}
