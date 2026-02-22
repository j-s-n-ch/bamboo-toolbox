import { computed, watch } from "vue";
import { storeToRefs } from "pinia";
import { useDataStore } from "@/store/data";
import { useSettingsStore } from "@/store/settings";
import { useItemsStore } from "@/store/items";
import { usePlayerStore } from "@/store/player";
import { useSkillModifiers } from "@/composables/useSkillModifiers";
import { usedAttrs } from "@/domain/quality/qualityAttrs";
import { stripHtmlTags } from "@/utils/stripHtmlTags";
import { useRequirements } from "@/composables/useRequirements";
import {
  resolveLootTableWeights,
  mapTableToItems,
  groupSourcesByStat,
  getTotalDropChance,
  getStepsPerItem,
  getDropCounts,
} from "@/domain/lootTables/lootTables";

const getGearLootTables = (ctx) => {
  const { checkRequirements } = useRequirements(ctx);
  return ctx.filledGearSlots.value.flatMap(([slot, item]) =>
    usedAttrs(item, item.quality)
      .filter(
        (attr) =>
          Array.isArray(attr.tables) &&
          attr.tables.length > 0 &&
          checkRequirements(attr.requirements),
      )
      .flatMap((attr) => {
        const { stats, customText } = attr;
        return attr.tables.map((table) => ({
          ...table,
          tableSource: stripHtmlTags(attr.customText) || attr.name || attr.text,
          slot,
          stat: customText,
          rollChance: stats?.[0]?.value || 1,
        }));
      }),
  );
};

const getSourceLootTables = (ctx) => {
  const source = ctx.source.value;
  if (!source) return [];
  const { tables: activityTables, name } = source;
  return (
    activityTables?.map((table) => ({
      ...table,
      tableSource: `activity-${name}`,
      rollChance: 1,
    })) ?? []
  );
};

const getCtxLootTables = (ctx) => [
  ...getSourceLootTables(ctx),
  ...getGearLootTables(ctx),
];

export function useLootTables(ctx) {
  const dataStore = useDataStore();
  const itemsStore = useItemsStore();
  const playerStore = usePlayerStore();
  const settingsStore = useSettingsStore();
  const { activitySettings } = storeToRefs(settingsStore);

  const {
    stepsPerRewardRoll,
    fineMaterialFind,
    chestFind,
    findCollectibles,
    findGems,
    findBirdNests,
  } = useSkillModifiers(ctx);

  const lootTables = computed(() => getCtxLootTables(ctx));
  const lootTableIds = computed(() =>
    lootTables.value.flatMap(({ tables }) => tables),
  );

  watch(
    lootTableIds,
    (ids) => {
      dataStore.fetchDetailedLootTables(ids);
    },
    { immediate: true },
  );

  const detailedLootTables = computed(() => {
    return lootTables.value.flatMap((table) => ({
      ...table,
      rollChance: table.rollChance || 1,
      tables: resolveLootTableWeights(
        table.tables.map(dataStore.getDetailedLootTable).filter(Boolean),
        (skill) => playerStore.skillLevels[skill] ?? 1,
      ),
    }));
  });

  const filteredLootTables = computed(() => {
    const hideOwnedCollectibles =
      activitySettings.value.hideOwnedCollectibles.value;

    if (!hideOwnedCollectibles) {
      return detailedLootTables.value;
    }

    const ownedCollectibles = ctx
      .ownedItemsByCategory("collectible")
      .map(({ id }) => id);
    return detailedLootTables.value.filter((table) => {
      if (hideOwnedCollectibles && table.type.includes("collectible")) {
        const id = table.tables?.[0]?.tableRows?.[0]?.rowItemID || null;
        return !ownedCollectibles.includes(id);
      }
      return table.tables.some((t) => t.tableRows.length > 0);
    });
  });

  const combinedItemDrops = computed(() => {
    const allItems = filteredLootTables.value.flatMap((table) => {
      return mapTableToItems(table) || [];
    });

    const seen = new Set();
    const uniqueItems = allItems.filter((item) => {
      const itemId = item.isMoney ? "gold" : item.rowItemID;
      const key = `${itemId}::${item.tableSource}::${item.slot}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    const grouped = {};
    for (const item of uniqueItems) {
      const key = item.isMoney ? "gold" : item.rowItemID;
      if (!key) continue;
      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(item);
    }

    return Object.values(grouped);
  });

  const groupedLootTables = computed(() => {
    const grouped = {};
    for (const table of filteredLootTables.value) {
      const key = `${table.type}-${table.rollAmount}-${table.tableSource}`;
      if (!grouped[key]) {
        // Create a deep copy of the table to avoid mutation
        grouped[key] = {
          ...table,
          tables: [...table.tables],
        };
      } else {
        if (table.stat) {
          // if table comes from stat (item):
          // Combine rollChance values (capped at 1) instead of adding more tables
          const combinedRollChance = Math.min(
            1,
            grouped[key].rollChance + table.rollChance,
          );
          grouped[key] = {
            ...grouped[key],
            rollChance: combinedRollChance,
          };
        } else {
          // if table comes from activity:
          // group tables e.g. collectibles
          grouped[key] = {
            ...grouped[key],
            tables: [...grouped[key].tables, ...table.tables],
          };
        }
      }
    }
    return Object.values(grouped);
  });

  const dropChanceMultipliers = (tableTypes) => {
    let multiplier = 1;
    if (tableTypes.includes("chestTable")) {
      multiplier *= chestFind.value;
    }
    if (tableTypes.includes("collectible")) {
      multiplier *= findCollectibles.value;
    }
    if (tableTypes.includes("gem")) {
      multiplier *= findGems.value;
    }
    if (tableTypes.includes("birdNest")) {
      multiplier *= findBirdNests.value;
    }

    return multiplier;
  };

  const getVariableRequirement = (item) => {
    if (!item || !item.requirementsBonuses) return null;

    const { requirementsBonuses } = item;
    if (!requirementsBonuses.length) return null;
    const { levelRequirement, relatedSkill } = requirementsBonuses[0];

    const icon = playerStore.skillsMap[relatedSkill].icon;
    return { levelRequirement, icon };
  };

  const dropItemInfoMap = computed(() => {
    const getId = (sources) => sources[0].rowItemID || "gold";
    const canDropFine = (item) =>
      !item.isMoney && item.rowItemID in itemsStore.fineMaterials;

    const canDropRare = (item) => item.type.includes("petEgg");

    const data = combinedItemDrops.value.map((sources) => {
      const id = getId(sources);
      const icon = sources[0].icon;
      const statGroupedSources = groupSourcesByStat(sources);
      const stepsPerItem = getStepsPerItem(statGroupedSources, stepsPerRewardRoll.value, dropChanceMultipliers);
      // todo add info for rare pets

      const stepsPerFine = canDropFine(sources[0])
        ? stepsPerItem / fineMaterialFind.value
        : 0;

      const stepsPerRare = canDropRare(sources[0]) ? stepsPerItem * 10 : 0;

      let stepsPerNormal = stepsPerItem;
      if (canDropFine(sources[0]))
        stepsPerNormal = stepsPerItem / (1 - fineMaterialFind.value);
      else if (canDropRare(sources[0]))
        stepsPerNormal = stepsPerItem / (9 / 10);

      const info = {
        id,
        icon,
        sources,
        totalDropChance: getTotalDropChance(statGroupedSources, dropChanceMultipliers),
        stepsPerItem,
        itemsPerStep: 1000 / stepsPerItem,
        stepsPerNormal,
        stepsPerFine,
        stepsPerRare,
        dropCounts: getDropCounts(statGroupedSources),
        variableRequirement: getVariableRequirement(sources[0]),
      };
      return [id, info];
    });
    return Object.fromEntries(data);
  });

  const hasCollectibleDrops = computed(() => {
    return filteredLootTables.value.some(({ type }) =>
      type.includes("collectible"),
    );
  });

  const hasFineDrops = computed(() => {
    return Object.values(dropItemInfoMap.value).some(
      ({ stepsPerFine }) => stepsPerFine > 0,
    );
  });

  return {
    lootTables,
    detailedLootTables,
    filteredLootTables,
    combinedItemDrops,
    groupedLootTables,
    dropItemInfoMap,
    groupSourcesByStat,
    hasCollectibleDrops,
    hasFineDrops,
  };
}
