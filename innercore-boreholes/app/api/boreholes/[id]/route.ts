import type { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { BoreholeModel } from "@/lib/models/Borehole";
import { validateBorehole } from "@/lib/validation";
import { handleDbError, invalidId, jsonError, readJson, requireAdmin } from "@/lib/api";

type Ctx = RouteContext<"/api/boreholes/[id]">;

/** GET /api/boreholes/:id */
export async function GET(_request: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params;
  const bad = invalidId(id);
  if (bad) return bad;

  try {
    await connectDB();
    const borehole = await BoreholeModel.findById(id).lean();
    return borehole ? Response.json(borehole) : jsonError(404, "Borehole not found");
  } catch (err) {
    return handleDbError(err);
  }
}

/** PUT /api/boreholes/:id: replace all fields (login required). */
export async function PUT(request: NextRequest, ctx: Ctx) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { id } = await ctx.params;
  const bad = invalidId(id);
  if (bad) return bad;

  const body = await readJson(request);
  if (!body) return jsonError(400, "Invalid JSON body");

  const result = validateBorehole(body);
  if (!result.ok) return jsonError(400, "Validation failed", { fields: result.errors });

  try {
    await connectDB();
    const updated = await BoreholeModel.findByIdAndUpdate(id, result.data, {
      returnDocument: "after",
      runValidators: true,
    }).lean();
    return updated ? Response.json(updated) : jsonError(404, "Borehole not found");
  } catch (err) {
    return handleDbError(err);
  }
}

/** DELETE /api/boreholes/:id (login required). */
export async function DELETE(_request: NextRequest, ctx: Ctx) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { id } = await ctx.params;
  const bad = invalidId(id);
  if (bad) return bad;

  try {
    await connectDB();
    const deleted = await BoreholeModel.findByIdAndDelete(id).lean();
    return deleted ? new Response(null, { status: 204 }) : jsonError(404, "Borehole not found");
  } catch (err) {
    return handleDbError(err);
  }
}
