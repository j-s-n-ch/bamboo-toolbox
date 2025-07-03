<script setup>
import { computed } from "vue";
import { usePlayerStore } from "@/store/player";
import WsIcon from "@/components/common/WsIcon.vue";
import { n } from "@/utils/number";

const props = defineProps({
  stat: {
    type: Object,
    required: true,
  },
  requirements: {
    type: Array,
    required: true,
  },
});

const playerStore = usePlayerStore();

const storeStat = computed(() => {
  const statType = props.stat.type;
  return playerStore.stats.find((s) => s.type === statType) || props.stat;
});

const displayValue = computed(() => {
  const { value, isPercent } = props.stat;
  const prefix = value > 0 ? "+" : "";
  return isPercent ? `${prefix}${n(100 * value)}%` : `${prefix}${n(value)}`;
});
</script>
<template>
  <div
    class="stat-requirement-display"
    :class="stat.isNegative ? 'negative' : 'positive'"
  >
    <span class="stat-value">{{ displayValue }}</span>
    <ws-icon :iconPath="storeStat.icon" size="sm" />
    <span class="stat-name">{{ stat.name }}</span>
  </div>
</template>

<style lang="scss" scoped>
.stat-requirement-display {
  width: 100%;
  display: flex;
  justify-content: flex-start;
  align-content: center;
  padding: $xxxs $xs;
  gap: $xxs;
  box-sizing: border-box;

  border: 1px solid $boxDarkOutline;

  &.negative {
    color: $txNegative;
  }

  &.positive {
    color: $txPositive;
  }
}
</style>
