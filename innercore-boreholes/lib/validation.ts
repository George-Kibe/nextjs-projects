import { COUNTRY, KENYAN_COUNTIES, type County } from "./counties";

export type BoreholeInput = {
  boreholeId: string;
  latitude: number;
  longitude: number;
  elevation: number;
  depth: number;
  formation: string;
  yield: number;
  location: string;
  county: County;
  country: string;
};

export type Borehole = BoreholeInput & {
  _id: string;
  createdAt: string;
  updatedAt: string;
};

export type FieldErrors = Partial<Record<keyof BoreholeInput, string>>;

type NumberRule = { min?: number; max?: number };

const NUMBER_FIELDS: Record<string, NumberRule> = {
  latitude: { min: -90, max: 90 },
  longitude: { min: -180, max: 180 },
  elevation: { min: -500, max: 9000 },
  depth: { min: 0 },
  yield: { min: 0 },
};

const TEXT_FIELDS = ["boreholeId", "formation", "location"] as const;

/** Validates raw input (JSON body or form values). Shared by the API and the form. */
export function validateBorehole(raw: Record<string, unknown>):
  | { ok: true; data: BoreholeInput }
  | { ok: false; errors: FieldErrors } {
  const errors: FieldErrors = {};
  const data: Record<string, unknown> = {};

  for (const field of TEXT_FIELDS) {
    const value = typeof raw[field] === "string" ? raw[field].trim() : "";
    if (!value) errors[field] = "Required";
    else if (value.length > 120) errors[field] = "Too long (max 120 characters)";
    data[field] = value;
  }
  data.boreholeId = String(data.boreholeId).toUpperCase();

  for (const [field, rule] of Object.entries(NUMBER_FIELDS)) {
    const value = raw[field];
    const num = typeof value === "number" ? value : typeof value === "string" && value.trim() !== "" ? Number(value) : NaN;
    const key = field as keyof BoreholeInput;
    if (value === undefined || value === null || value === "") errors[key] = "Required";
    else if (!Number.isFinite(num)) errors[key] = "Must be a number";
    else if (rule.min !== undefined && num < rule.min) errors[key] = `Must be at least ${rule.min}`;
    else if (rule.max !== undefined && num > rule.max) errors[key] = `Must be at most ${rule.max}`;
    data[field] = num;
  }

  const county = typeof raw.county === "string" ? raw.county : "";
  if (!(KENYAN_COUNTIES as readonly string[]).includes(county)) errors.county = "Select a county";
  data.county = county;
  data.country = COUNTRY;

  if (Object.keys(errors).length > 0) return { ok: false, errors };
  return { ok: true, data: data as BoreholeInput };
}
