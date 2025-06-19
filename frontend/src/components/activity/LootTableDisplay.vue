<script setup>
import { computed } from "vue";
import DropItemDisplay from "./DropItemDisplay.vue";
import WsLabel from "@/components/common/WsLabel.vue";

const props = defineProps({
  lootTable: Object,
});

const tableItems = computed(() => {
  const { rollAmount, type } = props.lootTable;
  return props.lootTable?.tables?.flatMap(({ noDropChance, tableRows }) => {
    const mappedRows = tableRows.flatMap((row) => {
      return {
        ...row,
        noDropChance,
      };
    });
    const tableWeight = mappedRows.reduce((acc, row) => {
      return acc + (row.rowWeight || 0);
    }, 0);
    return { mappedRows, tableWeight, rollAmount, type };
  });
});
</script>

<template>
  <section v-if="lootTable.rollAmount > 0" class="loot-table-display">
    <div
      v-for="(
        { mappedRows, tableWeight, rollAmount, type }, index
      ) in tableItems"
      :key="index"
      class="loot-table"
    >
      <ws-label
        v-if="rollAmount > 1"
        :label="`rolls ${rollAmount}x`"
        class="label"
      />
      <div class="table">
        <drop-item-display
          v-for="(item, itemIndex) in mappedRows"
          :key="itemIndex"
          :item="item"
          :total-weight="tableWeight"
          :roll-amount="rollAmount"
          :type="type"
        />
      </div>
    </div>
  </section>
</template>

<style lang="scss" scoped>
.loot-table-display {
  display: flex;
  flex-wrap: wrap;
  gap: $sm;

  .loot-table {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    flex-wrap: wrap;
    gap: $sm;

    padding: $sm;
    border: 1px solid $chipOutline;
    border-radius: $sm;

    .table {
      width: 100%;
      display: flex;
      flex-wrap: wrap;
      gap: $sm;
      justify-content: center;
    }

    .label {
      background-color: $bgPrimary;
      border-radius: $xs;
      padding: $xxxxs;
      margin-top: -$lg;
      margin-bottom: -$sm;
      white-space: nowrap;
    }
  }
}
</style>
