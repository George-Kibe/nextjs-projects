import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";
import { COUNTRY, KENYAN_COUNTIES } from "../counties";

const BoreholeSchema = new Schema(
  {
    boreholeId: { type: String, required: true, unique: true, trim: true, uppercase: true, maxlength: 120 },
    latitude: { type: Number, required: true, min: -90, max: 90 },
    longitude: { type: Number, required: true, min: -180, max: 180 },
    /** Elevation in metres above sea level */
    elevation: { type: Number, required: true, min: -500, max: 9000 },
    /** Depth in metres */
    depth: { type: Number, required: true, min: 0 },
    formation: { type: String, required: true, trim: true, maxlength: 120 },
    /** Yield in cubic metres per hour */
    yield: { type: Number, required: true, min: 0 },
    location: { type: String, required: true, trim: true, maxlength: 120 },
    county: { type: String, required: true, enum: KENYAN_COUNTIES },
    country: { type: String, required: true, default: COUNTRY },
  },
  { timestamps: true },
);

BoreholeSchema.index({ county: 1 });

export type BoreholeDoc = InferSchemaType<typeof BoreholeSchema>;

export const BoreholeModel: Model<BoreholeDoc> =
  (models.Borehole as Model<BoreholeDoc>) || model<BoreholeDoc>("Borehole", BoreholeSchema);
