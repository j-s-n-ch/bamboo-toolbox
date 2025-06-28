<script setup>
import { onMounted, ref, computed } from "vue";
import { getMultipleLootTables } from "@/utils/axios/api_routes";
import { useActivityStore } from "@/store/activity";
import DropItemDisplay from "./DropItemDisplay.vue";
import LootTableDisplay from "./LootTableDisplay.vue";

const activityStore = useActivityStore();
const resolvedLootTables = ref([]);

onMounted(async () => {
  const tables = activityStore.activity?.tables || [];
  const tableIds = tables.flatMap(({ tables }) => tables);

  const { data: lootTables } = await getMultipleLootTables(tableIds);
  const lootTablesMap = new Map(lootTables.map((table) => [table.id, table]));
  const resolvedTables = tables.flatMap((table) => {
    return {
      ...table,
      tables: table.tables.map((id) => lootTablesMap.get(id)),
    };
  });

  resolvedLootTables.value = resolvedTables;
});

const mapLootTable = (table) => {
  const { rollAmount, type } = table;
  return table.tables?.flatMap(({ noDropChance, tableRows }) => {
    const mappedRows = tableRows.flatMap((row) => {
      return {
        ...row,
        noDropChance,
      };
    });
    const tableWeight = mappedRows.reduce((acc, row) => {
      return acc + (row.rowWeight || 0);
    }, 0);
    return mappedRows.map((row) => {
      return {
        ...row,
        tableWeight,
        rollAmount,
        type,
      };
    });
  });
};

const combinedItems = computed(() => {
  const allItems = resolvedLootTables.value.flatMap((table) => {
    return mapLootTable(table)?.flat() || [];
  });

  const grouped = {};
  for (const item of allItems) {
    const key = item.rowItemID;
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
  for (const table of resolvedLootTables.value) {
    const key = `${table.type}-${table.rollAmount}`;
    if (!grouped[key]) {
      grouped[key] = table;
    } else {
      grouped[key]["tables"].push.apply(grouped[key]["tables"], table.tables);
    }
  }
  return Object.values(grouped);
});
</script>

<template>
  <details open>
    <summary>Drops</summary>
    <div style="margin-bottom: 1em">
      <label>
        <input type="checkbox" v-model="activityStore.showCombined" />
        Show combined drops
      </label>
    </div>
    <section class="drops-info">
      <template v-if="activityStore.showCombined">
        <drop-item-display
          v-for="(items, index) in combinedItems"
          :key="index"
          :sources="items"
        />
      </template>
      <template v-else>
        <loot-table-display
          v-for="(table, index) in groupedLootTables"
          :key="index"
          :loot-table="table"
        />
      </template>
    </section>
  </details>
</template>

<style lang="scss" scoped>
.drops-info {
  border-radius: $md;
  display: flex;
  flex-wrap: wrap;

  align-items: flex-start;
  gap: $md;

  border: 1px solid $boxDarkOutline;
}
</style>
