<script setup>
import { computed } from "vue";
import WsIcon from "@/components/common/WsIcon.vue";
import { useSkillModifiers } from "@/utils/useSkillModifiers";
import { useItemsStore } from "@/store/items";
import { n } from "@/utils/number";

const props = defineProps({
  item: Object,
  rollAmount: Number,
  totalWeight: Number,
  type: Array,
});

const itemsStore = useItemsStore();

const {
  stepsPerRewardRoll,
  fineMaterialFind,
  chestFind,
  findCollectibles,
  findGems,
  findBirdNests,
} = useSkillModifiers();

const dropChanceMultipliers = computed(() => {
  let multiplier = 1;
  if (props.type.includes("chestTable")) {
    multiplier *= chestFind.value;
  }
  if (props.type.includes("collectible")) {
    multiplier *= findCollectibles.value;
  }
  if (props.type.includes("gem")) {
    multiplier *= findGems.value;
  }
  if (props.type.includes("birdNest")) {
    multiplier *= findBirdNests.value;
  }

  return multiplier;
});

const dropChance = computed(() => {
  const { rowWeight, noDropChance } = props.item;
  const odds =
    (1 - noDropChance) *
    (rowWeight / props.totalWeight) *
    dropChanceMultipliers.value;
  return 1 - (1 - odds) ** props.rollAmount;
});

const stepsPerItem = computed(() => {
  const { rowMinimumAmount, rowMaximumAmount } = props.item;
  const avgAmount = (rowMaximumAmount + rowMinimumAmount) / 2;

  return stepsPerRewardRoll.value / dropChance.value / avgAmount;
});

const canDropFine = computed(() => {
  return (
    !props.type.includes("chestTable") &&
    !(props.item.rowItemID in itemsStore.allItems)
  );
});

const stepsPerFine = computed(() => {
  if (!canDropFine.value) return 0;
  return stepsPerItem.value / fineMaterialFind.value;
});
</script>

<template>
  <div class="drop-item-display" :title="item.name" :aria-label="item.name">
    <ws-icon :icon-path="item.icon" size="md" />
    <span>{{ n(100 * dropChance) }}%</span>

    <span v-if="item.rowMinimumAmount !== item.rowMaximumAmount"
      >{{ item.rowMinimumAmount }} - {{ item.rowMaximumAmount }}</span
    >
    <span v-else>{{ item.rowMinimumAmount }}</span>
    <div class="steps-line">
      <ws-icon iconPath="assets/icons/text/general_icons/steps.png" size="xs" />
      <span>{{ n(stepsPerItem, 1) }}</span>
    </div>
    <div v-if="canDropFine" class="steps-line border-fine">
      <ws-icon iconPath="assets/icons/text/general_icons/steps.png" size="xs" />
      <span>{{ n(stepsPerFine, 1) }}</span>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.drop-item-display {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;

  padding: $xs;
  gap: $xxxxs;


  background-color: $boxDarkBackground;
  border: 1px solid $boxDarkOutline;
  border-radius: $sm;

  font-size: 0.75rem;
}

.steps-line {
  display: flex;
  align-items: center;
  border-radius: $sm;
  padding: $xxxxs;
}
</style>
