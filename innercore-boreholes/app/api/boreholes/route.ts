import type { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { BoreholeModel } from "@/lib/models/Borehole";
import { validateBorehole } from "@/lib/validation";
import { handleDbError, jsonError, readJson, requireAdmin } from "@/lib/api";

const SORTABLE = ["boreholeId", "location", "county", "formation", "depth", "yield", "elevation", "createdAt"];
const MAX_LIMIT = 100;
const MAP_LIMIT = 5000;

function escapeRegex(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * GET /api/boreholes
 *   ?q=        text search on ID, location, formation, county
 *   ?county=   exact county filter
 *   ?sort=     one of SORTABLE (default createdAt)
 *   ?order=    asc | desc (default desc)
 *   ?page=     1-based page (default 1)
 *   ?limit=    page size, max 100 (default 20)
 *   ?all=1     return every match (up to 5000) with no paging, for the map
 */
export async function GET(request: NextRequest) {
  const p = request.nextUrl.searchParams;
  const q = p.get("q")?.trim();
  const county = p.get("county")?.trim();
  const sort = SORTABLE.includes(p.get("sort") ?? "") ? p.get("sort")! : "createdAt";
  const order = p.get("order") === "asc" ? 1 : -1;
  const all = p.get("all") === "1";
  const limit = all ? MAP_LIMIT : Math.min(Math.max(Number(p.get("limit")) || 20, 1), MAX_LIMIT);
  const page = all ? 1 : Math.max(Math.floor(Number(p.get("page")) || 1), 1);

  const filter: Record<string, unknown> = {};
  if (county) filter.county = county;
  if (q) {
    const rx = new RegExp(escapeRegex(q), "i");
    filter.$or = [{ boreholeId: rx }, { location: rx }, { formation: rx }, { county: rx }];
  }

  try {
    await connectDB();
    const [items, total] = await Promise.all([
      BoreholeModel.find(filter)
        .sort({ [sort]: order, _id: order })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      BoreholeModel.countDocuments(filter),
    ]);
    return Response.json({ items, total, page, limit, pages: Math.max(Math.ceil(total / limit), 1) });
  } catch (err) {
    return handleDbError(err);
  }
}

/** POST /api/boreholes: create a borehole (login required). */
export async function POST(request: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const body = await readJson(request);
  if (!body) return jsonError(400, "Invalid JSON body");

  const result = validateBorehole(body);
  if (!result.ok) return jsonError(400, "Validation failed", { fields: result.errors });

  try {
    await connectDB();
    const created = await BoreholeModel.create(result.data);
    return Response.json(created.toObject(), { status: 201 });
  } catch (err) {
    return handleDbError(err);
  }
}
