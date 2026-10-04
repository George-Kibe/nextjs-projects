import { COUNTRY, KENYAN_COUNTIES, type County } from "./counties";
import { extraFields, KINDS, type ExtraFieldKey, type IdField, type KindKey } from "./kinds";

/** Fields shared by every kind of record. */
export type SiteFields = {
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

/** Validated input: the shared fields plus the kind's ID field (boreholeId / mineralId) and extra fields. */
export type SiteInput = SiteFields & Partial<Record<IdField | ExtraFieldKey, string>>;

/** A stored record as returned by the API. */
export type Site = SiteInput & {
  _id: string;
  createdAt: string;
  updatedAt: string;
};

export type FieldErrors = Partial<Record<keyof SiteFields | IdField | ExtraFieldKey, string>>;

/** The human-readable ID of a record, e.g. "BH-001". */
export function siteCode(kind: KindKey, site: Partial<Site>) {
  return site[KINDS[kind].idField] ?? "";
}

type NumberRule = { min?: number; max?: number };

const NUMBER_FIELDS: Record<string, NumberRule> = {
  latitude: { min: -90, max: 90 },
  longitude: { min: -180, max: 180 },
  elevation: { min: -500, max: 9000 },
  depth: { min: 0 },
  yield: { min: 0 },
};

/** Validates raw input (JSON body or form values). Shared by the API and the form. */
export function validateSite(
  kind: KindKey,
  raw: Record<string, unknown>,
): { ok: true; data: SiteInput } | { ok: false; errors: FieldErrors } {
  const idField = KINDS[kind].idField;
  const errors: FieldErrors = {};
  const data: Record<string, unknown> = {};

  const textFields = [idField, ...extraFields(kind).map((f) => f.key), "formation", "location"] as const;
  for (const field of textFields) {
    const value = typeof raw[field] === "string" ? raw[field].trim() : "";
    if (!value) errors[field] = "Required";
    else if (value.length > 120) errors[field] = "Too long (max 120 characters)";
    data[field] = value;
  }
  data[idField] = String(data[idField]).toUpperCase();

  for (const [field, rule] of Object.entries(NUMBER_FIELDS)) {
    const value = raw[field];
    const num = typeof value === "number" ? value : typeof value === "string" && value.trim() !== "" ? Number(value) : NaN;
    const key = field as keyof SiteFields;
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
  return { ok: true, data: data as SiteInput };
}
