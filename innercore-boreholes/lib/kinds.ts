/**
 * The record types the app manages. They share every field in lib/fields.ts; each kind adds its own
 * ID field and any `extraFields` (required text fields, shown after the ID).
 */
export const KINDS = {
  boreholes: {
    key: "boreholes",
    singular: "borehole",
    plural: "boreholes",
    title: "Boreholes",
    idField: "boreholeId",
    idLabel: "Borehole ID",
    idPlaceholder: "e.g. BH-001",
    extraFields: [],
    color: "#2563eb",
  },
  minerals: {
    key: "minerals",
    singular: "mineral",
    plural: "minerals",
    title: "Minerals",
    idField: "mineralId",
    idLabel: "Mineral ID",
    idPlaceholder: "e.g. MN-001",
    extraFields: [{ key: "name", label: "Name", placeholder: "e.g. Gold, Fluorspar" }],
    color: "#d97706",
  },
} as const;

export type KindKey = keyof typeof KINDS;
export type Kind = (typeof KINDS)[KindKey];
export type IdField = Kind["idField"];
export type ExtraFieldKey = "name";
export type ExtraField = { key: ExtraFieldKey; label: string; placeholder: string };

export function extraFields(kind: KindKey): readonly ExtraField[] {
  return KINDS[kind].extraFields;
}

export const KIND_KEYS = Object.keys(KINDS) as KindKey[];
export const DEFAULT_KIND: KindKey = "boreholes";

export function parseKind(value: string | null | undefined): KindKey | null {
  return value && value in KINDS ? (value as KindKey) : null;
}

/** URL for a list or map view, omitting `?kind=` for the default kind. */
export function viewHref(path: "/" | "/map", kind: KindKey) {
  return kind === DEFAULT_KIND ? path : `${path}?kind=${kind}`;
}

export function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
