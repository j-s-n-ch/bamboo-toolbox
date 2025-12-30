<script setup>
import { computed } from "vue";
import { useItemsStore } from "@/store/items";
import { useDataStore } from "@/store/data";
import InfoBubble from "@/components/common/InfoBubble.vue";
import useBaseContext from "@/composables/useBaseContext";
import { useLootTables } from "@/composables/useLootTables";
import { n } from "@/utils/number";
import { icons } from "@/constants/iconPaths";

const ctx = useBaseContext();
const { dropItemInfoMap } = useLootTables(ctx);

const dataStore = useDataStore();
const itemsStore = useItemsStore();

const goldTotal = computed(() => {
  const data = Object.entries(dropItemInfoMap.value);
  const sum = data.reduce((total, [id, info]) => {
    if (id === "gold") {
      return total + info.itemsPerStep;
    } else if (id in itemsStore.allGearItems) {
      const { quality } = itemsStore.allGearItems[id];
      const { itemsPerStep } = info;
      const prices = dataStore.itemValues[id];

      return total + itemsPerStep * prices[quality];
    } else {
      const { stepsPerNormal, stepsPerFine } = info;
      const normalPerStep = 1000 / stepsPerNormal;
      if (stepsPerFine) {
        const finePerStep = 1000 / stepsPerFine;
        const { common, fine } = dataStore.itemValues[id];
        return total + (common * normalPerStep + fine * finePerStep);
      } else {
        const { common } = dataStore.itemValues[id];
        return total + common * normalPerStep;
      }
    }
  }, 0);

  return n(sum, 2);
});
</script>

<template>
  <info-bubble :text="goldTotal" :icon-path="icons.money" />
</template>

<style lang="scss" scoped></style>
