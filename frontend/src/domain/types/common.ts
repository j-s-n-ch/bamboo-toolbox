/**
 * Cross-cutting types shared across multiple domain categories.
 *
 * Does NOT:
 * - Import any Vue / reactive APIs.
 * - Contain any logic.
 */

import type { Requirement } from "./requirement";

// ---------------------------------------------------------------------------
// Requirements
// ---------------------------------------------------------------------------

export type { Requirement };

/** Minimal shape required from each equipped item for requirement evaluation. */
export type RequirementItem = {
  id: string;
  keywords?: string[];
  requirements?: Requirement[];
  /** Some items carry abilities; can be a raw ID string or an object. */
  abilities?: (string | { ability: string })[];
};

/** A route segment - only the location fields needed for requirement checks. */
export type RequirementSegment = {
  from: {
    keywords: string[];
    faction: string;
    subFactions?: string[];
  };
};

/** Activity/recipe source for activityType requirement checks. */
export type RequirementSource = {
  id: string;
  keywords: string[];
  relatedSkillsList?: string[];
  relatedSkills?: string[];
};

// ---------------------------------------------------------------------------
// Loot table references (used by activities, recipes, etc.)
// ---------------------------------------------------------------------------

export type LootTableRef = {
  isPrimary: boolean;
  type: string[];
  rollAmount: number;
  tables: string[];
};
