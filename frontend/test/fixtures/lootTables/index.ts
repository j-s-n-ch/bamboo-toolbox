import type {
  DetailedContextLootTable,
  LootTableRow,
} from "@/domain/types/lootTable";

export function makeLootTableRow(
  overrides: Partial<LootTableRow> = {},
): LootTableRow {
  return {
    rowItemID: "item_01",
    rowWeight: 100,
    minWeightScale: 1,
    rowMinimumAmount: 1,
    rowMaximumAmount: 1,
    ...overrides,
  };
}

export function makeDetailedContextTable(
  overrides: Partial<DetailedContextLootTable> = {},
): DetailedContextLootTable {
  return {
    isPrimary: true,
    type: ["normal"],
    rollAmount: 1,
    tableSource: "activity-fishing",
    rollChance: 1,
    tables: [{ noDropChance: 0, tableRows: [makeLootTableRow()] }],
    ...overrides,
  };
}
