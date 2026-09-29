import type { BoreholeInput } from "./validation";

/** Display labels and units, shared by the table, form and detail view. */
export const FIELDS: Record<keyof BoreholeInput, { label: string; unit?: string }> = {
  boreholeId: { label: "Borehole ID" },
  latitude: { label: "Latitude", unit: "°" },
  longitude: { label: "Longitude", unit: "°" },
  elevation: { label: "Elevation", unit: "m asl" },
  depth: { label: "Depth", unit: "m" },
  formation: { label: "Formation" },
  yield: { label: "Yield", unit: "m³/h" },
  location: { label: "Location" },
  county: { label: "County" },
  country: { label: "Country" },
};

export function formatNumber(n: number, digits = 2) {
  return n.toLocaleString("en-KE", { maximumFractionDigits: digits });
}
