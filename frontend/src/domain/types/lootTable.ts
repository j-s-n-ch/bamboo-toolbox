import type { LootTableRef } from "./common";

export type LootTableSummary = {
  id: string;
  name: string;
};

// ---------------------------------------------------------------------------
// Loot table row detail
// ---------------------------------------------------------------------------

export type RequirementBonus = {
  levelRequirement: number;
  levelMaxScaling: number;
  relatedSkill: string;
};

export type LootTableRow = {
  rowItemID: string | null;
  rowWeight: number;
  minWeightScale: number;
  rowMinimumAmount: number;
  rowMaximumAmount: number;
  isMoney?: boolean;
  icon?: string;
  requirementsBonuses?: RequirementBonus[];
};

export type DetailedLootTable = {
  noDropChance: number;
  tableRows: LootTableRow[];
};

// ---------------------------------------------------------------------------
// Context loot tables (assembled from gear + activity sources)
// ---------------------------------------------------------------------------

/**
 * An entry produced by getCtxLootTables().
 * `tables` contains unresolved string IDs until detail is fetched.
 */
export type ContextLootTable = LootTableRef & {
  tableSource: string;
  slot?: string;
  stat?: string | null;
  rollChance: number;
};

/**
 * A ContextLootTable after IDs have been resolved to DetailedLootTable objects.
 */
export type DetailedContextLootTable = Omit<ContextLootTable, "tables"> & {
  tables: DetailedLootTable[];
};

// ---------------------------------------------------------------------------
// Flattened rows used for drop-chance calculations
// ---------------------------------------------------------------------------

/**
 * A single row flattened out of a DetailedContextLootTable,
 * enriched with context fields needed for probability math.
 */
export type MappedTableRow = LootTableRow & {
  noDropChance: number;
  tableWeight: number;
  rollAmount: number;
  slot?: string;
  stat?: string | null;
  type: string[];
  tableSource: string;
  rollChance: number;
};
