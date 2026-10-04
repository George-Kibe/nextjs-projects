import type { Model } from "mongoose";
import type { KindKey } from "../kinds";
import { BoreholeModel } from "./Borehole";
import { MineralModel } from "./Mineral";
import type { SiteDoc } from "./siteSchema";

const MODELS: Record<KindKey, Model<SiteDoc>> = {
  boreholes: BoreholeModel,
  minerals: MineralModel,
};

export function getModel(kind: KindKey) {
  return MODELS[kind];
}
