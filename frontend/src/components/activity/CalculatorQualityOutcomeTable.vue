<script setup>
import { computed } from "vue";
import { storeToRefs } from "pinia";
import { useActivityStore } from "@/store/activity";
import { useRequirements } from "@/composables/useRequirements";
import { useSkillModifiers } from "@/composables/useSkillModifiers";
import WsLabel from "@/components/common/WsLabel.vue";
import getOutcomeOdds from "@/utils/qualityOutcomeOdds";
import { n } from "@/utils/number";

const props = defineProps({
  crafts: Number,
});

const activityStore = useActivityStore();
const { recipe } = storeToRefs(activityStore);
const { getLevelRequirementsMap } = useRequirements();

const craftingOdds = computed(() => {
  const levelMap = getLevelRequirementsMap(recipe.value.requirements);
  if (!("crafting" in levelMap)) return [];
  const level = levelMap["crafting"];

  const { qualityOutcome } = useSkillModifiers();

  const odds = getOutcomeOdds(level, qualityOutcome.value, false);
  return odds.map((item) => {
    return {
      ...item,
      odds1: 1 - (1 - item.value) ** props.crafts,
      avg: props.crafts * item.value,
    };
  });
});
</script>

<template>
  <ws-label label="Expected outcomes" />
  <table class="quality-odds-table">
    <thead>
      <tr>
        <th>Quality</th>
        <th>Odds of 1</th>
        <th>Avg. Amount</th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="(item, index) in craftingOdds" :key="`${item.name}-${index}`">
        <td :class="`color-${item.qualityValue}`">{{ item.name }}</td>
        <td>{{ n(item.odds1, 2) }}</td>
        <td>{{ n(item.avg, 2) }}</td>
      </tr>
    </tbody>
  </table>
</template>

<style lang="scss" scoped>
.quality-odds-table {
  width: 100%;
  border-collapse: collapse;
  th,
  td {
    padding: $xxs $sm;
    border-bottom: 1px solid $chipOutline;
    text-align: center;
  }
  th {
    background: $boxPrimaryBackground;
  }
}
</style>
