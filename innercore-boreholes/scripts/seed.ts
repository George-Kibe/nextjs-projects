/**
 * Seeds sample boreholes across Kenyan counties for testing.
 *
 *   npm run seed           insert or update the sample boreholes (matched by Borehole ID)
 *   npm run seed -- --reset  delete ALL boreholes first, then insert the samples
 */
import mongoose from "mongoose";
import { BoreholeModel } from "../lib/models/Borehole";
import { validateBorehole } from "../lib/validation";

const SAMPLES = [
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
];

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI is not set. Add it to .env.local");
  await mongoose.connect(uri);

  if (process.argv.includes("--reset")) {
    const { deletedCount } = await BoreholeModel.deleteMany({});
    console.log(`Deleted ${deletedCount} existing borehole(s)`);
  }

  for (const sample of SAMPLES) {
    const result = validateBorehole(sample);
    if (!result.ok) throw new Error(`${sample.boreholeId}: ${JSON.stringify(result.errors)}`);
    await BoreholeModel.findOneAndUpdate({ boreholeId: result.data.boreholeId }, result.data, {
      upsert: true,
      runValidators: true,
    });
    console.log(`✓ ${sample.boreholeId}  ${sample.location}, ${sample.county}`);
  }
  console.log(`Seeded ${SAMPLES.length} boreholes`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
