/**
 * Purpose:
 * Shared pure helpers for extracting common data from a recipe's fields.
 *
 * Does NOT:
 * - Import any Vue / reactive APIs.
 * - Access any stores directly.
 * - Mutate inputs.
 */

import { getLevelRequirementsMap } from "@/domain/requirements/requirementUtils";
import type { Requirement } from "@/domain/types/common";

// ---------------------------------------------------------------------------
// Functions
// ---------------------------------------------------------------------------

/**
 * Returns the skill-level requirement that drives quality odds for a recipe.
 *
 * Recipes currently always have a single skill requirement. If multiple exist,
 * the first (primary) skill is used — `getLevelRequirementsMap` takes the max
 * per skill, and `Object.values` returns entries in insertion order.
 *
 * @param requirements  Recipe requirements array (may be null / undefined).
 * @returns The required level, or 1 when no skill-level requirement is found.
 */
export function getRecipeLevel(
  requirements: Requirement[] | null | undefined,
): number {
  const levels = Object.values(getLevelRequirementsMap(requirements));
  return levels[0] ?? 1;
}
