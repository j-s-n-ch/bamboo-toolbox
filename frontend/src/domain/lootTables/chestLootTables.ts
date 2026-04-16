/**
 * Purpose:
 * Pure calculation functions for resolving the contents of chest (container)
 * items dropped by activities.
 *
 * Each chest rolls its loot table CHEST_ROLLS times on opening.
 * Fine material chance is fixed at CHEST_FINE_CHANCE regardless of the
 * player's fine-material-find stat.
 * Chest loot tables have no requirementsBonuses (no weight scaling needed).
 * Chests cannot drop pet eggs (no rare tier calculation).
 *
 * Does NOT:
 * - Import any Vue / reactive APIs.
 * - Access any stores or global state.
 * - Mutate inputs.
 */

import type { LootTableDetail, LootTableRow } from "@/domain/types/lootTable";
import type { DropItemInfo } from "@/domain/lootTables/dropInfo";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const CHEST_ROLLS = 4;
export const CHEST_FINE_CHANCE = 1 / 100;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ChestItem = {
  chestItemId: string;
  stepsPerChest: number;
};

// ---------------------------------------------------------------------------
// Identification
// ---------------------------------------------------------------------------

/**
 * Returns all items in the drop info map that are containers (chests).
 */
export function identifyChestItems(
  dropItemInfoMap: Record<string, DropItemInfo>,
  containers: Record<string, unknown>,
): ChestItem[] {
  return Object.entries(dropItemInfoMap)
    .filter(([id]) => id in containers)
    .map(([id, info]) => ({ chestItemId: id, stepsPerChest: info.stepsPerItem }));
}

// ---------------------------------------------------------------------------
// Drop info map construction
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Processes a set of table rows and adds DropItemInfo entries to the map.
 * `rollChancePerRow` is the per-row probability per single chest-roll
 * (already accounts for table-level noDropChance or sub-table weight).
 */
function processRows(
  rows: LootTableRow[],
  perRollProbabilityFactor: number,
  stepsPerChest: number,
  fineMaterialIds: Record<string, boolean>,
  out: Map<string, DropItemInfo>,
): void {
  const tableWeight = rows.reduce((sum, row) => sum + (row.rowWeight ?? 0), 0);
  if (tableWeight === 0) return;

  for (const row of rows) {
    const id = row.isMoney ? "gold" : row.rowItemID;
    if (!id) continue;

    const rollChance = perRollProbabilityFactor * (row.rowWeight / tableWeight);
    const effectiveChance = 1 - Math.pow(1 - rollChance, CHEST_ROLLS);
    if (effectiveChance === 0) continue;

    const avgAmount = (row.rowMinimumAmount + row.rowMaximumAmount) / 2;
    const stepsPerItem = stepsPerChest / (effectiveChance * avgAmount);

    const canBeFine = !row.isMoney && id in fineMaterialIds;
    const stepsPerFine = canBeFine ? stepsPerItem / CHEST_FINE_CHANCE : 0;
    const stepsPerNormal = canBeFine ? stepsPerItem / (1 - CHEST_FINE_CHANCE) : stepsPerItem;

    const info: DropItemInfo = {
      id,
      icon: row.icon,
      sources: [],
      totalDropChance: effectiveChance * 100,
      stepsPerItem,
      itemsPerStep: 1000 / stepsPerItem,
      stepsPerNormal,
      stepsPerFine,
      stepsPerRare: 0,
      dropCounts:
        row.rowMinimumAmount === row.rowMaximumAmount
          ? `${row.rowMinimumAmount}`
          : `${row.rowMinimumAmount}-${row.rowMaximumAmount}`,
      variableRequirement: null,
    };

    // If the same item appears in multiple tables, combine drop rates (harmonic).
    const existing = out.get(id);
    if (existing) {
      const combinedStepsPerItem =
        1 / (1 / existing.stepsPerItem + 1 / info.stepsPerItem);
      const combinedChance = existing.totalDropChance + info.totalDropChance;
      const combinedCanBeFine = canBeFine || existing.stepsPerFine > 0;
      const combinedStepsPerFine = combinedCanBeFine
        ? combinedStepsPerItem / CHEST_FINE_CHANCE
        : 0;
      const combinedStepsPerNormal = combinedCanBeFine
        ? combinedStepsPerItem / (1 - CHEST_FINE_CHANCE)
        : combinedStepsPerItem;
      out.set(id, {
        ...existing,
        totalDropChance: combinedChance,
        stepsPerItem: combinedStepsPerItem,
        itemsPerStep: 1000 / combinedStepsPerItem,
        stepsPerNormal: combinedStepsPerNormal,
        stepsPerFine: combinedStepsPerFine,
      });
    } else {
      out.set(id, info);
    }
  }
}

// ---------------------------------------------------------------------------
// Drop info map construction
// ---------------------------------------------------------------------------

/**
 * Builds a `Record<itemId, DropItemInfo>` for the items inside a chest.
 *
 * Processes both the main `tableRows` and any `subTables`:
 * - Main rows: per-roll probability = (1 - noDropChance) × (rowWeight / tableWeight)
 * - Sub-table rows: per-roll probability = subTable.weight × (rowWeight / tableWeight)
 *
 * Fine handling uses a fixed CHEST_FINE_CHANCE (not the player's stat).
 * Items appearing in multiple tables have their drop rates combined.
 *
 * @param stepsPerChest    Steps to obtain the chest from the activity.
 * @param chestTables      Full LootTableDetail entries from the chest item.
 * @param fineMaterialIds  Set of item ids that can drop as fine.
 */
export function buildChestDropInfoMap(
  stepsPerChest: number,
  chestTables: LootTableDetail[],
  fineMaterialIds: Record<string, boolean>,
): Record<string, DropItemInfo> {
  const out = new Map<string, DropItemInfo>();

  for (const table of chestTables) {
    // The main table's per-roll probability is the remaining weight after all
    // non-empty sub-tables have taken their share. Sub-tables with no rows
    // (e.g. ethereal placeholders) are ignored so their weight stays in the
    // main table's share.
    const subTableWeightSum = (table.subTables ?? [])
      .filter((sub) => sub.tableRows?.length > 0)
      .reduce((sum, sub) => sum + sub.weight, 0);
    const mainTableFactor = 1 - subTableWeightSum;

    // Main table rows
    if (table.tableRows.length > 0 && mainTableFactor > 0) {
      processRows(table.tableRows, mainTableFactor, stepsPerChest, fineMaterialIds, out);
    }

    // Sub-tables (quality-tiered gear, money, etc.)
    for (const sub of table.subTables ?? []) {
      if (!sub.tableRows?.length || sub.weight <= 0) continue;
      processRows(sub.tableRows, sub.weight, stepsPerChest, fineMaterialIds, out);
    }
  }

  return Object.fromEntries(out);
}
