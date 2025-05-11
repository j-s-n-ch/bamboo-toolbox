import { achievementService } from "../services/index.js";
import { wrapController } from "./wrapController.js";

export const getItemRewards = wrapController(() => achievementService.list(), {
  mapFunction: (arr) => arr.flatMap(({ itemRewards }) => itemRewards),
});
