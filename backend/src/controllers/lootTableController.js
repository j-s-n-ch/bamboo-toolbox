import { lootTableService } from "../services/index.js";
import { wrapController } from "./wrapController.js";

export const getChests = wrapController(() => {
  return lootTableService.search({ category: "chest", detailed: true });
});
