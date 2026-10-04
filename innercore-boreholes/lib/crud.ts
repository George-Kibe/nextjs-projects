import type { NextRequest } from "next/server";
import { connectDB } from "./db";
import { extraFields, KINDS, type KindKey } from "./kinds";
import { getModel } from "./models";
import { validateSite } from "./validation";
import { handleDbError, invalidId, jsonError, notFound, readJson, requireAdmin } from "./api";

const SHARED_SORTABLE = ["location", "county", "formation", "depth", "yield", "elevation", "createdAt"];
const MAX_LIMIT = 100;
const MAP_LIMIT = 5000;

type ItemContext = { params: Promise<{ id: string }> };

function escapeRegex(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Handlers for /api/<kind>
 *
 * GET query params:
 *   q        text search on ID, extra fields (e.g. mineral name), location, formation, county
 *   county   exact county filter
 *   sort     ID field, an extra field or a shared field (default createdAt)
 *   order    asc | desc (default desc)
 *   page     1-based page (default 1)
 *   limit    page size, max 100 (default 20)
 *   all=1    return every match (up to 5000) with no paging, for the map
 *
 * POST creates a record (login required).
 */
export function collectionHandlers(kind: KindKey) {
  const { idField } = KINDS[kind];
  const Model = getModel(kind);
  const extraKeys = extraFields(kind).map((f) => f.key);
  const sortable = [idField, ...extraKeys, ...SHARED_SORTABLE];

  async function GET(request: NextRequest) {
    const p = request.nextUrl.searchParams;
    const q = p.get("q")?.trim();
    const county = p.get("county")?.trim();
    const sort = sortable.includes(p.get("sort") ?? "") ? p.get("sort")! : "createdAt";
    const order = p.get("order") === "asc" ? 1 : -1;
    const all = p.get("all") === "1";
    const limit = all ? MAP_LIMIT : Math.min(Math.max(Number(p.get("limit")) || 20, 1), MAX_LIMIT);
    const page = all ? 1 : Math.max(Math.floor(Number(p.get("page")) || 1), 1);

    const filter: Record<string, unknown> = {};
    if (county) filter.county = county;
    if (q) {
      const rx = new RegExp(escapeRegex(q), "i");
      filter.$or = [idField, ...extraKeys, "location", "formation", "county"].map((f) => ({ [f]: rx }));
    }

    try {
      await connectDB();
      const [items, total] = await Promise.all([
        Model.find(filter)
          .sort({ [sort]: order, _id: order })
          .skip((page - 1) * limit)
          .limit(limit)
          .lean(),
        Model.countDocuments(filter),
      ]);
      return Response.json({ items, total, page, limit, pages: Math.max(Math.ceil(total / limit), 1) });
    } catch (err) {
      return handleDbError(kind, err);
    }
  }

  async function POST(request: NextRequest) {
    const denied = await requireAdmin();
    if (denied) return denied;

    const body = await readJson(request);
    if (!body) return jsonError(400, "Invalid JSON body");

    const result = validateSite(kind, body);
    if (!result.ok) return jsonError(400, "Validation failed", { fields: result.errors });

    try {
      await connectDB();
      const created = await Model.create(result.data);
      return Response.json(created.toObject(), { status: 201 });
    } catch (err) {
      return handleDbError(kind, err);
    }
  }

  return { GET, POST };
}

/** Handlers for /api/<kind>/:id: GET, PUT (replace all fields) and DELETE. Writes need login. */
export function itemHandlers(kind: KindKey) {
  const Model = getModel(kind);

  async function GET(_request: NextRequest, ctx: ItemContext) {
    const { id } = await ctx.params;
    const bad = invalidId(kind, id);
    if (bad) return bad;

    try {
      await connectDB();
      const doc = await Model.findById(id).lean();
      return doc ? Response.json(doc) : notFound(kind);
    } catch (err) {
      return handleDbError(kind, err);
    }
  }

  async function PUT(request: NextRequest, ctx: ItemContext) {
    const denied = await requireAdmin();
    if (denied) return denied;

    const { id } = await ctx.params;
    const bad = invalidId(kind, id);
    if (bad) return bad;

    const body = await readJson(request);
    if (!body) return jsonError(400, "Invalid JSON body");

    const result = validateSite(kind, body);
    if (!result.ok) return jsonError(400, "Validation failed", { fields: result.errors });

    try {
      await connectDB();
      const updated = await Model.findByIdAndUpdate(id, result.data, {
        returnDocument: "after",
        runValidators: true,
      }).lean();
      return updated ? Response.json(updated) : notFound(kind);
    } catch (err) {
      return handleDbError(kind, err);
    }
  }

  async function DELETE(_request: NextRequest, ctx: ItemContext) {
    const denied = await requireAdmin();
    if (denied) return denied;

    const { id } = await ctx.params;
    const bad = invalidId(kind, id);
    if (bad) return bad;

    try {
      await connectDB();
      const deleted = await Model.findByIdAndDelete(id).lean();
      return deleted ? new Response(null, { status: 204 }) : notFound(kind);
    } catch (err) {
      return handleDbError(kind, err);
    }
  }

  return { GET, PUT, DELETE };
}
