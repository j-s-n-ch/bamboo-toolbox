import { describe, it, expect } from "vitest";
import {
  CHEST_ROLLS,
  CHEST_FINE_CHANCE,
  identifyChestItems,
  buildChestDropInfoMap,
} from "@/domain/lootTables/chestLootTables";
import type { LootTableDetail } from "@/domain/types/lootTable";
import type { DropItemInfo } from "@/domain/lootTables/dropInfo";
import woodcuttingChestTableJson from "../../fixtures/lootTables/woodcutting_chest_table.json";

const wcTable = woodcuttingChestTableJson as unknown as LootTableDetail;

// ---------------------------------------------------------------------------
// Fixture-derived constants
// ---------------------------------------------------------------------------

// Sum of non-empty sub-table weights in the woodcutting chest fixture.
// The ethereal sub-table (weight=0.0001, empty tableRows) is excluded:
// 0.2164 + 0.2 + 0.05 + 0.025 + 0.0075 + 0.001 = 0.4999
const SUB_WEIGHT_SUM = wcTable.subTables
  .filter((t) => t.tableRows.length > 0)
  .reduce((s, t) => s + t.weight, 0);
const MAIN_FACTOR = 1 - SUB_WEIGHT_SUM; // 0.5001
const MAIN_TABLE_WEIGHT = wcTable.tableRows.reduce((s, r) => s + r.rowWeight, 0); // 59

const STEPS_PER_CHEST = 10_000;

// Item IDs from the fixture
const BIRCH_LOGS = "birch_logs";
const OAK_LOGS = "oak_logs";
const LUMBERJACK_SANDALS = "lumberjack_sandals";
const LUMBERJACK_PANTS = "lumberjack_pants";
const CIRCULAR_ROOT_TRINKET = "circular_root_trinket";
const LOG_SPLITTER = "log_splitter";
const FORESTERS_BOOTS = "foresters_boots";

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

function makeDropInfo(overrides: Partial<DropItemInfo> = {}): DropItemInfo {
  return {
    id: "test_item",
    icon: undefined,
    sources: [],
    totalDropChance: 5,
    stepsPerItem: 1000,
    itemsPerStep: 1,
    stepsPerNormal: 1000,
    stepsPerFine: 0,
    stepsPerRare: 0,
    dropCounts: "1",
    variableRequirement: null,
    ...overrides,
  };
}

// Minimal table builder for edge-case tests only
function makeSimpleTable(
  rows: Partial<{
    rowItemID: string;
    rowWeight: number;
    rowMinimumAmount: number;
    rowMaximumAmount: number;
    isMoney: boolean;
    icon: string;
  }>[],
): LootTableDetail {
  return {
    id: "table_test",
    category: "chest",
    noDropChance: 0,
    subTables: [],
    tableRows: rows.map((r) => ({
      rowItemID: r.rowItemID ?? "item_01",
      rowWeight: r.rowWeight ?? 100,
      minWeightScale: 1,
      rowMinimumAmount: r.rowMinimumAmount ?? 1,
      rowMaximumAmount: r.rowMaximumAmount ?? 1,
      isMoney: r.isMoney,
      icon: r.icon,
    })),
  };
}

// ---------------------------------------------------------------------------
// identifyChestItems
// ---------------------------------------------------------------------------

describe("identifyChestItems", () => {
  it("returns items that exist in the containers dict", () => {
    const dropMap = {
      wood_chest: makeDropInfo({ id: "wood_chest", stepsPerItem: 5000 }),
      raw_fish: makeDropInfo({ id: "raw_fish", stepsPerItem: 200 }),
    };
    const result = identifyChestItems(dropMap, { wood_chest: {} });
    expect(result).toHaveLength(1);
    expect(result[0].chestItemId).toBe("wood_chest");
    expect(result[0].stepsPerChest).toBe(5000);
  });

  it("returns empty array when no containers are in the drop map", () => {
    expect(identifyChestItems({ raw_fish: makeDropInfo() }, { wood_chest: {} })).toHaveLength(0);
  });

  it("returns empty array when containers dict is empty", () => {
    expect(identifyChestItems({ wood_chest: makeDropInfo() }, {})).toHaveLength(0);
  });

  it("returns multiple chests when present", () => {
    const dropMap = {
      chest_a: makeDropInfo({ id: "chest_a", stepsPerItem: 1000 }),
      chest_b: makeDropInfo({ id: "chest_b", stepsPerItem: 2000 }),
      other: makeDropInfo(),
    };
    expect(identifyChestItems(dropMap, { chest_a: {}, chest_b: {} })).toHaveLength(2);
  });
});

// ---------------------------------------------------------------------------
// buildChestDropInfoMap – woodcutting chest fixture
// ---------------------------------------------------------------------------

describe("buildChestDropInfoMap - woodcutting chest fixture: main table factor", () => {
  it("main table factor equals 1 minus the sum of non-empty sub-table weights", () => {
    // Ethereal sub-table (weight=0.0001) has empty tableRows and is excluded.
    // Non-empty sub-tables sum to 0.4999, so main factor = 0.5001.
    expect(SUB_WEIGHT_SUM).toBeCloseTo(0.4999, 4);
    expect(MAIN_FACTOR).toBeCloseTo(0.5001, 4);
  });

  it("computes stepsPerItem for a main-table item using the correct factor", () => {
    // birch_logs: rowWeight=11, avg amount=(4+9)/2=6.5
    // rollChance = MAIN_FACTOR * (11 / 59)
    // effectiveChance = 1 - (1 - rollChance)^4
    const result = buildChestDropInfoMap(STEPS_PER_CHEST, [wcTable], {});
    const rollChance = MAIN_FACTOR * (11 / MAIN_TABLE_WEIGHT);
    const effectiveChance = 1 - Math.pow(1 - rollChance, CHEST_ROLLS);
    const avgAmount = (4 + 9) / 2;
    expect(result[BIRCH_LOGS].stepsPerItem).toBeCloseTo(
      STEPS_PER_CHEST / (effectiveChance * avgAmount),
      1,
    );
  });

  it("all 8 main table items are present in the result", () => {
    const result = buildChestDropInfoMap(STEPS_PER_CHEST, [wcTable], {});
    const mainItemIds = wcTable.tableRows.map((r) => r.rowItemID!);
    for (const id of mainItemIds) {
      expect(id in result).toBe(true);
    }
  });

  it("lower-weight main table item has more steps than higher-weight item", () => {
    // schnitzel (w=2) should have more steps than birch_logs (w=11)
    const SCHNITZEL = "schnitzel";
    const result = buildChestDropInfoMap(STEPS_PER_CHEST, [wcTable], {});
    expect(result[SCHNITZEL].stepsPerItem).toBeGreaterThan(result[BIRCH_LOGS].stepsPerItem);
  });
});

describe("buildChestDropInfoMap - woodcutting chest fixture: sub-tables", () => {
  it("includes items from the common sub-table (weight=0.2)", () => {
    // common sub: weight=0.2, sandals and pants each rowWeight=10, tableWeight=20
    // rollChance = 0.2 * (10/20) = 0.1
    // effectiveChance = 1 - (0.9)^4
    const result = buildChestDropInfoMap(STEPS_PER_CHEST, [wcTable], {});
    const rollChance = 0.2 * (10 / 20);
    const effectiveChance = 1 - Math.pow(1 - rollChance, CHEST_ROLLS);
    expect(result[LUMBERJACK_SANDALS].stepsPerItem).toBeCloseTo(
      STEPS_PER_CHEST / effectiveChance,
      1,
    );
    expect(result[LUMBERJACK_PANTS].stepsPerItem).toBeCloseTo(
      STEPS_PER_CHEST / effectiveChance,
      1,
    );
  });

  it("includes gold from the money sub-table", () => {
    const result = buildChestDropInfoMap(STEPS_PER_CHEST, [wcTable], {});
    expect("gold" in result).toBe(true);
  });

  it("includes the low-weight circular_root_trinket from the money sub-table", () => {
    // money sub: weight=0.2164, circular_root_trinket rowWeight=0.512 vs gold rowWeight=10
    // tableWeight = 10 + 0.512 = 10.512
    // rollChance = 0.2164 * (0.512 / 10.512)
    const result = buildChestDropInfoMap(STEPS_PER_CHEST, [wcTable], {});
    const moneyTableWeight = 10 + 0.512;
    const rollChance = 0.2164 * (0.512 / moneyTableWeight);
    const effectiveChance = 1 - Math.pow(1 - rollChance, CHEST_ROLLS);
    expect(result[CIRCULAR_ROOT_TRINKET].stepsPerItem).toBeCloseTo(STEPS_PER_CHEST / effectiveChance, 0);
  });

  it("includes gear from the rare sub-table (weight=0.025)", () => {
    // rare sub: weight=0.025, log_splitter rowWeight=10, tableWeight=20
    // rollChance = 0.025 * (10/20) = 0.0125
    const result = buildChestDropInfoMap(STEPS_PER_CHEST, [wcTable], {});
    const rollChance = 0.025 * (10 / 20);
    const effectiveChance = 1 - Math.pow(1 - rollChance, CHEST_ROLLS);
    expect(result[LOG_SPLITTER].stepsPerItem).toBeCloseTo(STEPS_PER_CHEST / effectiveChance, 1);
  });

  it("includes the legendary item (weight=0.001)", () => {
    const result = buildChestDropInfoMap(STEPS_PER_CHEST, [wcTable], {});
    expect(FORESTERS_BOOTS in result).toBe(true);
  });

  it("skips the ethereal sub-table because its tableRows is empty", () => {
    // The ethereal sub-table in the fixture has weight=0.0001 but tableRows=[]
    const result = buildChestDropInfoMap(STEPS_PER_CHEST, [wcTable], {});
    // There are 8 main + 13 sub-table items (no ethereal items)
    const itemCount = Object.keys(result).length;
    expect(itemCount).toBe(22); // 8 main + gold + rooted_ring + 2 common + 3 uncommon + 2 rare + 4 epic + 1 legendary
  });

  it("rarer sub-table items have more steps than common sub-table items", () => {
    const result = buildChestDropInfoMap(STEPS_PER_CHEST, [wcTable], {});
    expect(result[LOG_SPLITTER].stepsPerItem).toBeGreaterThan(result[LUMBERJACK_SANDALS].stepsPerItem);
  });

  it("totalDropChance times stepsPerItem approximates stepsPerChest for simple items", () => {
    // For items dropping 1 at a time: stepsPerChest ≈ stepsPerItem * dropChance/100
    const result = buildChestDropInfoMap(STEPS_PER_CHEST, [wcTable], {});
    const sandals = result[LUMBERJACK_SANDALS];
    expect(sandals.stepsPerItem * (sandals.totalDropChance / 100)).toBeCloseTo(
      STEPS_PER_CHEST,
      1,
    );
  });
});

describe("buildChestDropInfoMap - woodcutting chest fixture: oak_logs drop counts", () => {
  it("formats oak_logs dropCounts as a range (5-10)", () => {
    const result = buildChestDropInfoMap(STEPS_PER_CHEST, [wcTable], {});
    expect(result[OAK_LOGS].dropCounts).toBe("5-10");
  });
});

// ---------------------------------------------------------------------------
// buildChestDropInfoMap - edge cases (synthetic data)
// ---------------------------------------------------------------------------

describe("buildChestDropInfoMap - edge cases", () => {
  it("returns empty result for a table with zero total row weight", () => {
    const table: LootTableDetail = {
      id: "t", category: "chest", noDropChance: 0, subTables: [],
      tableRows: [{ rowItemID: "item_01", rowWeight: 0, minWeightScale: 1, rowMinimumAmount: 1, rowMaximumAmount: 1 }],
    };
    expect(Object.keys(buildChestDropInfoMap(10000, [table], {}))).toHaveLength(0);
  });

  it("skips sub-tables with weight=0", () => {
    const table: LootTableDetail = {
      id: "t", category: "chest", noDropChance: 0,
      subTables: [{ id: "s", weight: 0, type: "ethereal", tableRows: [{ rowItemID: "eth_item", rowWeight: 100, minWeightScale: 0, rowMinimumAmount: 1, rowMaximumAmount: 1 }] }],
      tableRows: [],
    };
    expect("eth_item" in buildChestDropInfoMap(10000, [table], {})).toBe(false);
  });

  it("keys money rows as 'gold'", () => {
    const table: LootTableDetail = {
      id: "t", category: "chest", noDropChance: 0, subTables: [],
      tableRows: [{ rowItemID: null, rowWeight: 100, minWeightScale: 1, rowMinimumAmount: 1, rowMaximumAmount: 1, isMoney: true }],
    };
    expect("gold" in buildChestDropInfoMap(10000, [table], {})).toBe(true);
  });

  it("formats single-amount dropCounts as plain number", () => {
    const table = makeSimpleTable([{ rowItemID: "item_01", rowMinimumAmount: 3, rowMaximumAmount: 3 }]);
    expect(buildChestDropInfoMap(1000, [table], {})["item_01"].dropCounts).toBe("3");
  });

  it("always sets stepsPerRare to 0 (chests don't drop pet eggs)", () => {
    const table = makeSimpleTable([{ rowItemID: "oak_log" }]);
    expect(buildChestDropInfoMap(10000, [table], { oak_log: true })["oak_log"].stepsPerRare).toBe(0);
  });

  it("sets stepsPerFine and adjusted stepsPerNormal for fine-able items", () => {
    const table = makeSimpleTable([{ rowItemID: "oak_log" }]);
    const result = buildChestDropInfoMap(10000, [table], { oak_log: true });
    const info = result["oak_log"];
    expect(info.stepsPerFine).toBeCloseTo(info.stepsPerItem / CHEST_FINE_CHANCE, 1);
    expect(info.stepsPerNormal).toBeCloseTo(info.stepsPerItem / (1 - CHEST_FINE_CHANCE), 1);
  });

  it("sets stepsPerFine=0 for non-fine items", () => {
    const table = makeSimpleTable([{ rowItemID: "oak_log" }]);
    const info = buildChestDropInfoMap(10000, [table], {})["oak_log"];
    expect(info.stepsPerFine).toBe(0);
    expect(info.stepsPerNormal).toBe(info.stepsPerItem);
  });

  it("scales stepsPerItem by average amount when min !== max", () => {
    // avgAmount = (1+3)/2 = 2 → stepsPerItem should be halved
    const table = makeSimpleTable([{ rowItemID: "item_01", rowMinimumAmount: 1, rowMaximumAmount: 3 }]);
    const single = makeSimpleTable([{ rowItemID: "item_01", rowMinimumAmount: 2, rowMaximumAmount: 2 }]);
    const resultRange = buildChestDropInfoMap(20000, [table], {})["item_01"].stepsPerItem;
    const resultFixed = buildChestDropInfoMap(20000, [single], {})["item_01"].stepsPerItem;
    expect(resultRange).toBeCloseTo(resultFixed, 1);
  });

  it("combines an item appearing in multiple tables harmonically", () => {
    // Item in both a main-only table (factor=1) and a sub-table (factor=0.5)
    // Main: effectiveChance=1, stepsPerItem=10000
    // Sub: effectiveChance=1-(0.5)^4=0.9375, stepsPerItem≈10667
    // Combined: 1/(1/10000 + 1/10667)
    const table: LootTableDetail = {
      id: "t", category: "chest", noDropChance: 0,
      subTables: [
        {
          id: "s",
          weight: 0.5,
          type: "common",
          tableRows: [{ rowItemID: "shared_item", rowWeight: 100, minWeightScale: 0, rowMinimumAmount: 1, rowMaximumAmount: 1 }],
        },
      ],
      tableRows: [{ rowItemID: "shared_item", rowWeight: 100, minWeightScale: 1, rowMinimumAmount: 1, rowMaximumAmount: 1 }],
    };
    const result = buildChestDropInfoMap(10000, [table], {});
    const mainFactor = 1 - 0.5;
    const mainChance = 1 - Math.pow(1 - mainFactor, CHEST_ROLLS);
    const subChance = 1 - Math.pow(1 - 0.5, CHEST_ROLLS);
    const combinedSteps = 1 / (1 / (10000 / mainChance) + 1 / (10000 / subChance));
    expect(result["shared_item"].stepsPerItem).toBeCloseTo(combinedSteps, 1);
  });
});
