import mongoose, { Schema, type Model } from "mongoose";
import { COUNTRY, KENYAN_COUNTIES } from "../counties";
import { extraFields, KINDS, type KindKey } from "../kinds";
import type { SiteFields } from "../validation";

export type SiteDoc = SiteFields & { [key: string]: unknown };

const text = { type: String, required: true, trim: true, maxlength: 120 } as const;

/** The schema shared by boreholes and minerals, plus the kind's own ID field and extra fields. */
export function createSiteSchema(kind: KindKey) {
  const schema = new Schema<SiteDoc>(
    {
      [KINDS[kind].idField]: { ...text, unique: true, uppercase: true },
      ...Object.fromEntries(extraFields(kind).map((f) => [f.key, text])),
      latitude: { type: Number, required: true, min: -90, max: 90 },
      longitude: { type: Number, required: true, min: -180, max: 180 },
      /** Elevation in metres above sea level */
      elevation: { type: Number, required: true, min: -500, max: 9000 },
      /** Depth in metres */
      depth: { type: Number, required: true, min: 0 },
      formation: text,
      /** Yield in cubic metres per hour */
      yield: { type: Number, required: true, min: 0 },
      location: text,
      county: { type: String, required: true, enum: KENYAN_COUNTIES },
      country: { type: String, required: true, default: COUNTRY },
    },
    { timestamps: true },
  );
  schema.index({ county: 1 });
  return schema;
}

/**
 * Registers the model for a kind. In dev, hot reload re-runs this file after a schema edit; replacing the
 * cached model (instead of reusing `mongoose.models[name]`) keeps Mongoose from silently dropping new fields.
 */
export function defineSiteModel(name: string, kind: KindKey): Model<SiteDoc> {
  if (mongoose.models[name]) mongoose.deleteModel(name);
  return mongoose.model<SiteDoc>(name, createSiteSchema(kind));
}
