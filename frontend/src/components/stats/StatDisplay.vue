<script setup>
import { computed } from "vue";
import WsIcon from "@/components/common/WsIcon.vue";

const props = defineProps({
  stat: {
    type: Object,
    required: true,
  },
  attrs: Array,
  isPercent: Boolean,
  activity: Object,
});

const attrStats = computed(() => {
  return props.attrs.map(({ stats }) => stats[0]);
});

const sumTotal = computed(() => {
  const total = attrStats.value.reduce(
    (a, { value: b, isNegative }) => (isNegative ? a - b : a + b),
    0
  );
  const value = Math.round(props.isPercent ? 100 * total : total);
  return props.isPercent ? `${value}%` : value;
});

const sumApplicable = computed(() => {});
</script>

<template>
  <section class="stat">
    <div class="active">
      <span v-if="isPercent">%</span>
      <ws-icon :iconPath="stat.icon" size="sm" />
      <span>{{ stat.name }}</span>
    </div>
    <div class="total-bubble">{{ sumTotal }}</div>
  </section>
</template>

<style lang="scss" scoped>
.stat {
  display: flex;
  justify-content: space-between;

  background-color: $boxDarkBackground;
  border-radius: $sm;
  padding: $xxs;

  .active {
    display: flex;
    gap: $xxxs;
    align-items: center;

    color: $txPositive;
  }
}

.total-bubble {
  background-color: $bgPrimary;
  border: 1px solid $boxDarkOutline;
  padding: $xxxxs $xxs;
  border-radius: $md;
}
</style>