/**
 * Purpose:
 * Pure functions for computing expected quality outcome statistics
 * over multiple crafting attempts.
 *
 * Does NOT:
 * - Import any Vue / reactive APIs.
 * - Access any stores directly.
 * - Mutate inputs.
 */

import type { QualityOutcomeResult } from "@/domain/quality/qualityOutcomeOdds";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type EnrichedQualityOutcome = QualityOutcomeResult & {
  /** Probability of at least one success across `crafts` attempts. */
  odds1: number;
  /** Expected number of successes across `crafts` attempts. */
  avg: number;
};

// ---------------------------------------------------------------------------
// Functions
// ---------------------------------------------------------------------------

/**
 * Probability of getting at least one success in `n` independent trials
 * each with success probability `p`.
 *
 * Formula: `1 - (1 - p)^n`
 *
 * @param p  Per-craft probability of success (0–1).
 * @param n  Number of crafting attempts.
 */
export function chanceOfAtLeastOne(p: number, n: number): number {
  return 1 - (1 - p) ** n;
}

/**
 * Adds per-N-crafts statistics to each quality outcome entry.
 *
 * @param odds    Base quality outcome array from `getOutcomeOdds`.
 * @param crafts  Number of crafting attempts to simulate.
 */
export function enrichOdds(
  odds: QualityOutcomeResult[],
  crafts: number,
): EnrichedQualityOutcome[] {
  return odds.map((item) => ({
    ...item,
    odds1: chanceOfAtLeastOne(item.value, crafts),
    avg: crafts * item.value,
  }));
}
