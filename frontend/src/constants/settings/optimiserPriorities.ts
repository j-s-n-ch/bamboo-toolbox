import { SettingOption } from "./types";

export const activityOptimiserPriorities: SettingOption[] = [
  { value: "stepsPerRewardRoll", name: "Reward roll" },
  { value: "xpPerStep", name: "XP per step" },
  { value: "stepsPerFineRoll", name: "Steps per fine roll" },
  { value: "stepsPerCollectibleRoll", name: "Steps per collectible roll" },
];

export const recipeOptimiserPriorities: SettingOption[] = [
  { value: "craftsPerMaterial", name: "Crafts per Material" },
  { value: "xpPerStep", name: "XP per step" },
];

export default {
  activityOptimiserPriorities,
  recipeOptimiserPriorities,
};
