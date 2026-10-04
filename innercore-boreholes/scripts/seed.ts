/**
 * Seeds sample boreholes and minerals across Kenyan counties for testing.
 *
 *   npm run seed                          insert or update samples of both kinds (matched by ID)
 *   npm run seed -- --kind=minerals       only one kind (boreholes | minerals)
 *   npm run seed -- --reset               delete ALL records of the seeded kind(s) first
 */
import mongoose from "mongoose";
import { KIND_KEYS, KINDS, parseKind, type KindKey } from "../lib/kinds";
import { getModel } from "../lib/models";
import { validateSite } from "../lib/validation";

type Sample = Record<string, string | number>;

const SAMPLES: Record<KindKey, Sample[]> = {
  boreholes: [
    { boreholeId: "BH-001", latitude: -1.3197, longitude: 36.7073, elevation: 1830, depth: 180, formation: "Kerichwa Valley Tuffs", yield: 6.5, location: "Karen", county: "Nairobi" },
    { boreholeId: "BH-002", latitude: -1.1466, longitude: 36.9609, elevation: 1520, depth: 150, formation: "Nairobi Trachyte", yield: 8.2, location: "Ruiru", county: "Kiambu" },
    { boreholeId: "BH-003", latitude: -0.33, longitude: 35.944, elevation: 2160, depth: 200, formation: "Volcanic tuff", yield: 3.8, location: "Njoro", county: "Nakuru" },
    { boreholeId: "BH-004", latitude: -4.093, longitude: 39.658, elevation: 15, depth: 60, formation: "Coral limestone", yield: 12, location: "Likoni", county: "Mombasa" },
    { boreholeId: "BH-005", latitude: -0.08, longitude: 34.768, elevation: 1150, depth: 90, formation: "Nyanzian volcanics", yield: 2.4, location: "Kondele", county: "Kisumu" },
    { boreholeId: "BH-006", latitude: -1.5177, longitude: 37.2634, elevation: 1600, depth: 220, formation: "Basement gneiss", yield: 1.6, location: "Machakos Town", county: "Machakos" },
    { boreholeId: "BH-007", latitude: 0.5143, longitude: 35.2698, elevation: 2100, depth: 160, formation: "Phonolite", yield: 4.1, location: "Kapsoya", county: "Uasin Gishu" },
    { boreholeId: "BH-008", latitude: -0.4532, longitude: 39.6461, elevation: 150, depth: 110, formation: "Merti aquifer sands", yield: 15.5, location: "Garissa Town", county: "Garissa" },
    { boreholeId: "BH-009", latitude: 3.1191, longitude: 35.5973, elevation: 510, depth: 75, formation: "Alluvial sands", yield: 9.3, location: "Lodwar", county: "Turkana" },
    { boreholeId: "BH-010", latitude: -1.473, longitude: 36.959, elevation: 1560, depth: 250, formation: "Basalt", yield: 2, location: "Kitengela", county: "Kajiado" },
  ],
  minerals: [
    { mineralId: "MN-001", name: "Titanium (ilmenite)", latitude: -4.335, longitude: 39.375, elevation: 60, depth: 15, formation: "Magarini Sands", yield: 0.5, location: "Maumba", county: "Kwale" },
    { mineralId: "MN-002", name: "Gold", latitude: 0.2, longitude: 34.73, elevation: 1580, depth: 120, formation: "Kakamega Greenstone Belt", yield: 0.8, location: "Ikolomani", county: "Kakamega" },
    { mineralId: "MN-003", name: "Gold", latitude: -0.96, longitude: 34.3, elevation: 1350, depth: 90, formation: "Migori Greenstone Belt", yield: 0.6, location: "Macalder", county: "Migori" },
    { mineralId: "MN-004", name: "Coal", latitude: -1.05, longitude: 38.2, elevation: 650, depth: 200, formation: "Karoo sediments", yield: 1.2, location: "Mui Basin", county: "Kitui" },
    { mineralId: "MN-005", name: "Tsavorite (garnet)", latitude: -3.5, longitude: 38.38, elevation: 900, depth: 30, formation: "Mozambique Belt gneiss", yield: 0.2, location: "Mwatate", county: "Taita-Taveta" },
    { mineralId: "MN-006", name: "Soda ash (trona)", latitude: -1.88, longitude: 36.27, elevation: 600, depth: 10, formation: "Lake Magadi evaporites", yield: 3.5, location: "Magadi", county: "Kajiado" },
    { mineralId: "MN-007", name: "Fluorspar", latitude: 0.32, longitude: 35.63, elevation: 1200, depth: 50, formation: "Kerio Valley veins", yield: 0.9, location: "Kimwarer", county: "Elgeyo-Marakwet" },
    { mineralId: "MN-008", name: "Limestone", latitude: -3.8, longitude: 39.8, elevation: 30, depth: 20, formation: "Coral limestone", yield: 2.1, location: "Vipingo", county: "Kilifi" },
    { mineralId: "MN-009", name: "Gold", latitude: 1.24, longitude: 35.11, elevation: 2100, depth: 8, formation: "Alluvial placer", yield: 0.3, location: "Kapenguria", county: "West Pokot" },
    { mineralId: "MN-010", name: "Rare earths", latitude: -0.62, longitude: 34.25, elevation: 1400, depth: 40, formation: "Ruri carbonatite", yield: 0.4, location: "Ruri Hills", county: "Homa Bay" },
  ],
};

async function seed(kind: KindKey, reset: boolean) {
  const Model = getModel(kind);
  const { idField, plural } = KINDS[kind];

  if (reset) {
    const { deletedCount } = await Model.deleteMany({});
    console.log(`Deleted ${deletedCount} existing ${plural}`);
  }

  for (const sample of SAMPLES[kind]) {
    const result = validateSite(kind, sample);
    if (!result.ok) throw new Error(`${sample[idField]}: ${JSON.stringify(result.errors)}`);
    await Model.findOneAndUpdate({ [idField]: result.data[idField] }, result.data, { upsert: true, runValidators: true });
    console.log(`✓ ${sample[idField]}  ${sample.location}, ${sample.county}`);
  }
  console.log(`Seeded ${SAMPLES[kind].length} ${plural}\n`);
}

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI is not set. Add it to .env.local");

  const kindArg = process.argv.find((a) => a.startsWith("--kind="))?.split("=")[1];
  const kind = kindArg ? parseKind(kindArg) : null;
  if (kindArg && !kind) throw new Error(`Unknown --kind=${kindArg}. Use one of: ${KIND_KEYS.join(", ")}`);
  const reset = process.argv.includes("--reset");

  await mongoose.connect(uri);
  for (const k of kind ? [kind] : KIND_KEYS) await seed(k, reset);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
