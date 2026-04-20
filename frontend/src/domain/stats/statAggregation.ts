/**
 * Purpose:
 * Pure functions for aggregating stat values from effective attribute entries.
 *
 * Responsibilities:
 * - Sum the `.value` field from a collection of stat objects.
 * - Look up the applicable stat total for a given stat type and percent flag.
 *
 * Does NOT:
 * - Import any Vue / reactive APIs.
 * - Access any stores directly.
 * - Mutate inputs.
 */

import type { StatTotals } from "@/domain/effectiveAttrs";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type { StatTotals };

export type StatBucket = {
  sum: number;
  positive: number;
  negative: number;
};

// ---------------------------------------------------------------------------
// Functions
// ---------------------------------------------------------------------------

/**
 * Sums the `value` field from an array of stat-like objects.
 *
 * @param stats  Objects with at least a numeric `value` field.
 */
export function sumStatValues(stats: { value: number }[]): number {
  return stats.reduce((acc, { value }) => acc + value, 0);
}

/**
 * Rounds a stat value to 2 decimal places for display.
 *
 * Percent values are stored as 0–1 (e.g. 0.05 = 5%). Multiplying by 10 000
 * before rounding and dividing by 100 after gives 2 dp in percentage units.
 * Flat values are already in display units; multiply by 100 / divide by 100
 * achieves the same 2-dp rounding.
 *
 * @param value      Raw stat value.
 * @param isPercent  When true the value is in 0–1 range and needs ×100 scaling.
 */
export function roundStatValue(value: number, isPercent: boolean): number {
  return Math.round(isPercent ? 10000 * value : 100 * value) / 100;
}

/**
 * Returns the stat bucket (sum / positive / negative) for a given stat type
 * and percent flag from a `totalsByStat` map.
 *
 * Returns `{ sum: 0, positive: 0, negative: 0 }` when the entry is absent.
 *
 * @param totalsByStat  Accumulated stat totals keyed by stat type.
 * @param type          The stat type to look up (e.g. `"workEfficiency"`).
 * @param isPercent     Whether to look up the `"percent"` bucket or `"flat"`.
 */
export function computeApplicableTotal(
  totalsByStat: StatTotals,
  type: string,
  isPercent: boolean,
): StatBucket {
  const empty: StatBucket = { sum: 0, positive: 0, negative: 0 };
  const key = isPercent ? "percent" : "flat";
  const byType = totalsByStat[type];
  if (!byType) return empty;
  return byType[key] ?? empty;
}
