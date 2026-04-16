/**
 * Purpose:
 * Pure functions for resolving a recipe's materials and level requirement
 * into display-ready objects for the UI.
 *
 * Responsibilities:
 * - Extract the first skillLevel requirement from a requirements array.
 * - Map each recipe material group's options to resolved display objects.
 *
 * Does NOT:
 * - Import any Vue / reactive APIs.
 * - Access any stores directly.
 * - Mutate inputs.
 */

import type { Requirement } from "@/domain/types/common";
import type { RecipeMaterial } from "@/domain/types/recipe";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Resolved level requirement for display. */
export type LevelRequirement = {
  level: number;
  skill: string;
};

/** Minimal item shape needed for material resolution. */
export type ItemRef = {
  name: string;
  icon: string;
};

/** External lookups injected from the store/composable layer. */
export type RecipeMaterialLookups = {
  /** Returns item by ID, or undefined when not found. */
  getItem: (id: string) => ItemRef | undefined;
};

/** A single resolved material option ready for display. */
export type ResolvedMaterialOption = {
  id: string;
  name: string;
  icon: string;
  amount: number;
};

// ---------------------------------------------------------------------------
// Functions
// ---------------------------------------------------------------------------

/**
 * Extracts the first skillLevel requirement from a requirements array.
 * Returns `{ level: 1, skill: "none" }` when no skillLevel requirement exists.
 *
 * @param requirements  Raw requirements array (may be empty).
 */
export function extractLevelRequirement(
  requirements: Requirement[],
): LevelRequirement {
  const first = requirements.find(({ type }) => type === "skillLevel");
  if (!first) return { level: 1, skill: "none" };
  return (first as Extract<Requirement, { type: "skillLevel" }>).requirement;
}

/**
 * Resolves a recipe's materials into display-ready option groups.
 *
 * Each group corresponds to one material slot; its entries are the alternatives
 * the player can choose. Options for items not found in the lookup are skipped.
 *
 * @param materials  Raw recipe materials (each has an `options` array).
 * @param lookups    Store-derived lookup data, injected from the component.
 */
export function resolveMaterials(
  materials: RecipeMaterial[],
  lookups: RecipeMaterialLookups,
): ResolvedMaterialOption[][] {
  return materials.map(({ options }) =>
    options
      .map(({ item, amount }): ResolvedMaterialOption | null => {
        const ref = lookups.getItem(item);
        if (!ref) return null;
        return { id: item, name: ref.name, icon: ref.icon, amount };
      })
      .filter((opt): opt is ResolvedMaterialOption => opt !== null),
  );
}
