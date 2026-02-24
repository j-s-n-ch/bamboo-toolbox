import type { Requirement } from "./common";

export type TerrainModifier = {
  id: string;
  name: string;
  requirements: Requirement[];
  keyword: string[];
};
