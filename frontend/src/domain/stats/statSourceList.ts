/**
 * Purpose:
 * Pure function for building a sorted list of stat source entries for display
 * in the stat source breakdown panel.
 *
 * Does NOT:
 * - Import any Vue / reactive APIs.
 * - Access any stores directly.
 */

import type { EffectiveAttrEntry } from "@/domain/effectiveAttrs";
import type { Stat } from "@/domain/types/item";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** A single entry in the stat source breakdown list. */
export type StatSourceEntry = {
  stat: Stat;
  item: { id: string; name: string; icon: string; quality?: string };
  /** Whether this attr passes the current requirement check (is "active"). */
  effective: boolean;
};

// ---------------------------------------------------------------------------
// Function
// ---------------------------------------------------------------------------

/**
 * Filters all attribute entries down to those contributing to a specific stat,
 * then returns them sorted — effective entries first, then by descending value.
 *
 * @param allAttrs         Full list of all attribute entries (equipped + bonuses).
 * @param effectiveAttrIds Set of entry IDs whose requirements are satisfied.
 * @param statId           The `stat` key to filter on (e.g. "work_efficiency").
 * @param isPercent        Whether to match percent or flat stat entries.
 */
export function buildStatSourceList(
  allAttrs: EffectiveAttrEntry[],
  effectiveAttrIds: string[],
  statId: string,
  isPercent: boolean,
): StatSourceEntry[] {
  return allAttrs
    .filter((attr) => {
      const { stat, isPercent: percent } = attr.stats[0];
      return stat === statId && percent === isPercent;
    })
    .map(({ id, stats, item }) => ({
      stat: stats[0],
      item,
      effective: effectiveAttrIds.includes(id),
    }))
    .sort((a, b) => {
      if (a.effective !== b.effective) return a.effective ? -1 : 1;
      return b.stat.value - a.stat.value;
    });
}
