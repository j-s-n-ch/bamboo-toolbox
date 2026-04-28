/**
 * Purpose:
 * Pure functions for building comparison table row data from two raw scalar values
 * and for diffing XP-per-step arrays across two gear sets.
 *
 * Responsibilities:
 * - Apply isPercent scaling and modifyValue transformation.
 * - Compute the `comp` sign used for highlight direction.
 *
 * Does NOT:
 * - Import any Vue / reactive APIs.
 * - Format numbers for display (formatting requires the Pinia settings store;
 *   that step is handled by the composable layer).
 * - Access any stores or global state.
 */

import type { XpPerStep } from "@/domain/skillModifiers";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * A single XP-per-step comparison row with raw (unformatted) values.
 * Positive `comp` means gear set 1 gives more XP per step (better for set 1).
 */
export type XpComparisonRow = {
  title: string;
  v1: number;
  v2: number;
  comp: number;
};

export type ComparisonRowInput = {
  /** Row header label. */
  title: string;
  /** Raw scalar from the first gear set (pre-scaling). */
  v1: number;
  /** Raw scalar from the second gear set (pre-scaling). */
  v2: number;
  /**
   * When true the values are multiplied by 100 and a "%" suffix is expected
   * by the caller.
   */
  isPercent?: boolean;
  /**
   * Controls the sign of `comp`:
   * - `false` (default): lower is better — `comp = v2scaled - v1scaled`
   *   (positive comp means left/v1 is lower, i.e. better).
   * - `true`: higher is better — `comp = v1scaled - v2scaled`
   *   (positive comp means left/v1 is higher, i.e. better).
   */
  negative?: boolean;
  /**
   * Optional transform applied to both display values AFTER scaling.
   * Does NOT affect the `comp` calculation.
   * Example: `(v) => v / rewardCount` to normalise per-item steps.
   */
  modifyValue?: (v: number) => number;
};

export type ComparisonRowResult = {
  title: string;
  /** v1 after isPercent scaling and modifyValue — ready for number formatting. */
  v1: number;
  /** v2 after isPercent scaling and modifyValue — ready for number formatting. */
  v2: number;
  /**
   * Positive → left (v1) is better; negative → right (v2) is better.
   * Computed from scaled values before modifyValue is applied.
   */
  comp: number;
  /** Convenience flag; consumers should append "%" when true. */
  isPercent: boolean;
};

// ---------------------------------------------------------------------------
// Functions
// ---------------------------------------------------------------------------

/**
 * Builds a single comparison row from two raw scalars and display options.
 */
export function buildComparisonRow(
  input: ComparisonRowInput,
): ComparisonRowResult {
  const {
    title,
    v1,
    v2,
    isPercent = false,
    negative = false,
    modifyValue = (x) => x,
  } = input;

  const multi = isPercent ? 100 : 1;
  const v1scaled = v1 * multi;
  const v2scaled = v2 * multi;

  return {
    title,
    v1: modifyValue(v1scaled),
    v2: modifyValue(v2scaled),
    comp: negative ? v1scaled - v2scaled : v2scaled - v1scaled,
    isPercent,
  };
}

/**
 * Convenience wrapper that maps an array of inputs to results.
 */
export function buildComparisonRows(
  inputs: ComparisonRowInput[],
): ComparisonRowResult[] {
  return inputs.map(buildComparisonRow);
}

/**
 * Diffs two XP-per-step arrays across gear sets, merging by skill name so
 * that a unique-item XP skill in only one set is shown with 0 on the other side.
 *
 * Row order: skills from set 1 in their original order, followed by any
 * skills that appear only in set 2.
 *
 * The "total xp" row (skill === "xp") is included whenever either set has it,
 * which correctly handles the case where one set's unique item triggers the
 * total row while the other set's single-skill activity does not.
 *
 * Positive `comp` means set 1 has more XP per step (better for set 1).
 *
 * @param xpPerStep1  XpPerStep array from gear set 1's skill modifiers.
 * @param xpPerStep2  XpPerStep array from gear set 2's skill modifiers.
 */
export function buildXpComparisonRows(
  xpPerStep1: XpPerStep[],
  xpPerStep2: XpPerStep[],
): XpComparisonRow[] {
  const rows = new Map<string, { skillText: string; v1: number; v2: number }>();

  for (const { skill, skillText, value } of xpPerStep1) {
    rows.set(skill, { skillText, v1: value, v2: 0 });
  }
  for (const { skill, skillText, value } of xpPerStep2) {
    const existing = rows.get(skill);
    if (existing) {
      existing.v2 = value;
    } else {
      rows.set(skill, { skillText, v1: 0, v2: value });
    }
  }

  return Array.from(rows.entries()).map(([, { skillText, v1, v2 }]) => ({
    title: `${skillText} xp`,
    v1,
    v2,
    comp: v1 - v2,
  }));
}
