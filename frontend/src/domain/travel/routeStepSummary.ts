/**
 * Purpose:
 * Pure function for computing total route step summary from a list of segments.
 *
 * Responsibilities:
 * - Sum totalAverage, totalMin, totalMax steps across all route segments.
 *
 * Does NOT:
 * - Import any Vue / reactive APIs.
 * - Access any stores directly.
 * - Mutate inputs.
 */

import { stepsPerNode, averageStepsPerRoute } from "@/domain/travel/routing";
import type { RouteSegmentStats } from "@/domain/types/route";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Minimal segment shape needed for step summary computation. */
export type SegmentForSummary = {
  distance: number;
  stats: RouteSegmentStats;
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
