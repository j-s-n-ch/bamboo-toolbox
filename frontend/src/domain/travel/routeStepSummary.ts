/**
 * Purpose:
 * Pure functions for computing total route step summary and stats ranges
 * from a list of route segments.
 *
 * Responsibilities:
 * - Sum totalAverage, totalMin, totalMax steps across all route segments.
 * - Compute WE and DA ranges across segments.
 * - Map per-segment requirements to active/inactive display data.
 *
 * Does NOT:
 * - Import any Vue / reactive APIs.
 * - Access any stores directly.
 * - Mutate inputs.
 */

import { stepsPerNode, averageStepsPerRoute } from "@/domain/travel/routing";
import type { RouteSegmentStats } from "@/domain/types/route";
import type { Requirement } from "@/domain/types/common";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Minimal segment shape needed for step summary computation. */
export type SegmentForSummary = {
  distance: number;
  stats: RouteSegmentStats;
};

/** WE and DA ranges aggregated across all route segments. */
export type RouteStatsRanges = {
  /** [min, max] work efficiency across all segments (0–1 scale). */
  weRange: [number, number];
  /** [min, max] double-action probability across all segments (0–1 scale). */
  daRange: [number, number];
};

/** A segment's requirement data ready for requirement-check processing. */
export type SegmentWithRequirements = {
  requirements: Requirement[];
  context: unknown;
};

/** Per-segment requirements mapped to active/inactive flags. */
export type MappedSegmentRequirements = {
  requirements: Requirement[];
  active: boolean[];
};

/** Computed step totals across all segments of a route. */
export type RouteStepSummary = {
  /** Expected steps accounting for double-action probability. */
  totalAverage: number;
  /** Best-case steps (full double-action benefit applied). */
  totalMin: number;
  /** Worst-case steps (no double-action bonus). */
  totalMax: number;
};

// ---------------------------------------------------------------------------
// Function
// ---------------------------------------------------------------------------

/**
 * Computes WE and DA ranges across all route segments.
 *
 * Returns `[0, 0]` ranges when `segments` is empty.
 */
export function aggregateRouteStats(
  segments: SegmentForSummary[],
): RouteStatsRanges {
  if (segments.length === 0) return { weRange: [0, 0], daRange: [0, 0] };
  const weValues = segments.map(({ stats }) => stats.workEfficiency);
  const daValues = segments.map(({ stats }) => stats.doubleAction);
  return {
    weRange: [Math.min(...weValues), Math.max(...weValues)],
    daRange: [Math.min(...daValues), Math.max(...daValues)],
  };
}

/**
 * Maps per-segment requirements to active/inactive flags using the provided
 * check function.
 *
 * @param segments  Segments with their requirement lists and route contexts.
 * @param checkFn   Returns true when a single requirement is satisfied.
 */
export function mapSegmentRequirements(
  segments: SegmentWithRequirements[],
  checkFn: (req: Requirement, context: unknown) => boolean,
): MappedSegmentRequirements[] {
  return segments.map(({ requirements, context }) => ({
    requirements,
    active: requirements.map((req) => checkFn(req, context)),
  }));
}

/**
 * Computes aggregated step totals across all route segments.
 *
 * Min completions per segment = 5 when doubleAction > 0 (benefit applies),
 * otherwise 10 (no benefit, same as max).
 *
 * @param segments  Route segments to summarise (may be empty).
 */
export function calculateRouteStepSummary(
  segments: SegmentForSummary[],
): RouteStepSummary {
  let totalAverage = 0;
  let totalMin = 0;
  let totalMax = 0;

  for (const { distance, stats } of segments) {
    totalAverage += averageStepsPerRoute(distance, stats);
    const stepsPerSingle = stepsPerNode(distance, stats);
    const minCompletions = stats.doubleAction > 0 ? 5 : 10;
    const maxCompletions = stats.doubleAction >= 1 ? 5 : 10;
    totalMin += stepsPerSingle * minCompletions;
    totalMax += stepsPerSingle * maxCompletions;
  }

  return { totalAverage, totalMin, totalMax };
}
