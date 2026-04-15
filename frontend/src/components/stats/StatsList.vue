<script setup>
import { computed } from "vue";
import StatDisplay from "./StatDisplay.vue";
import { useDataStore } from "@/store/data";
import { injectEffectiveAttrs } from "@/composables/context/injectShared";

const { allAttrs } = injectEffectiveAttrs();
const dataStore = useDataStore();

const includedStats = computed(() => {
  const attrStats = allAttrs.value.map(
    ({ stats, customText, statText, skillText }) => ({
      ...stats[0],
      customText,
      statText,
      skillText,
    }),
  );
  const regularStats = dataStore.stats
    .flatMap((stat) => {
      return [
        { stat, isPercent: true },
        { stat, isPercent: false },
      ];
    })
    .filter(({ stat, isPercent }) => {
      return attrStats.some(
        (stats) => stats.isPercent === isPercent && stats.type === stat.type,
      );
    });

  const regularStatIds = dataStore.stats.map(({ id }) => id);
  const pseudoStats = allAttrs.value
    .filter(({ stats }) => {
      return stats.some((stat) => !regularStatIds.includes(stat.stat));
    })
    .map(({ stats, customIcon, customText, skillText, statText }) => {
      const { name, stat, isPercent } = stats[0];
      const data = { skill: skillText, stat: statText };
      const emptyCustomText = !customText || customText === "";
      const usedName = emptyCustomText ? name : customText;

      return {
        stat: { name: usedName, id: stat, type: stat, icon: customIcon },
        isPercent,
        data,
      };
    })
    .filter((item, index, array) => {
      return (
        index ===
        array.findIndex(
          (other) =>
            other.stat.id === item.stat.id &&
            other.isPercent === item.isPercent,
        )
      );
    });

  return regularStats.concat(pseudoStats);
});
</script>

<template>
  <section class="stats">
    <stat-display
      v-for="{ stat, isPercent, data } in includedStats"
      :key="`${stat.id}-${isPercent}`"
      :stat="stat"
      :data="data"
      :isPercent="isPercent"
    />
  </section>
</template>

<style lang="scss" scoped>
.stats {
  display: flex;
  flex-direction: column;
  gap: $md;
  border-radius: $sm;
}
</style>
