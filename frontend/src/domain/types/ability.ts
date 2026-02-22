import type { Requirement } from "./common";

export type AbilitySummary = {
  id: string;
  name: string;
  type: string;
  desc: string;
  icon: string;
};

export type AbilityAction = {
  type: string;
  runtimeType: string;
  [key: string]: unknown;
};

export type AbilityData = {
  dataType: string;
  actions: AbilityAction[];
};

export type AbilityCooldown = {
  steps?: number;
  hours?: number;
  requirements: Requirement[];
};

export type AbilityDetail = AbilitySummary & {
  requirements: Requirement[];
  cooldown?: AbilityCooldown;
  data: AbilityData[];
};
