import { isValidObjectId, mongo } from "mongoose";
import { isAdmin } from "./auth";

export function jsonError(status: number, error: string, extra?: Record<string, unknown>) {
  return Response.json({ error, ...extra }, { status });
}

/** Returns an error response if the caller isn't logged in, otherwise null. */
export async function requireAdmin() {
  return (await isAdmin()) ? null : jsonError(401, "Login required");
}

export function invalidId(id: string) {
  return isValidObjectId(id) ? null : jsonError(404, "Borehole not found");
}

/** Maps known database errors to HTTP responses. */
export function handleDbError(err: unknown) {
  if (err instanceof mongo.MongoServerError && err.code === 11000) {
    return jsonError(409, "A borehole with this ID already exists", {
      fields: { boreholeId: "Already in use" },
    });
  }
  console.error(err);
  return jsonError(500, "Something went wrong. Please try again.");
}

export async function readJson(request: Request): Promise<Record<string, unknown> | null> {
  try {
    const body = await request.json();
    return body && typeof body === "object" && !Array.isArray(body) ? body : null;
  } catch {
    return null;
  }
}
