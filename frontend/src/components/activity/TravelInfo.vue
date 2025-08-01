<script setup>
import { computed, ref } from "vue";
import WsLabel from "@/components/common/WsLabel.vue";
import InfoBubble from "@/components/common/InfoBubble.vue";
import { useActivityStore } from "@/store/activity";
import { useSkillModifiers } from "@/utils/useSkillModifiers";
import { n } from "@/utils/number";

const activityStore = useActivityStore();

const {
  maxWorkEfficiency,
  workEfficiency,
  uncappedWorkEfficiency,
  effectiveMaxWorkEfficiency,
  stepsRequired,
  stepsPerCompletion,
} = useSkillModifiers();

// Local ref for route count
const routeCount = ref(1);

const routeDistance = computed({
  get: () => activityStore.activity?.workRequired || 1000,
  set: (value) => {
    if (activityStore.activity) {
      activityStore.activity.workRequired = value;
    }
  },
});

const stepsPerNode = (distance) => {
  const we = 1 + workEfficiency.value;
  return Math.ceil(Math.max(10, distance / we / 10 - stepsRequired.value));
};

const routeSteps = computed(() => {
  return stepsPerNode(routeDistance.value) * 10;
});

const statsRow = computed(() => ({
  label: "Stats (current / base)",
  component: InfoBubble,
  items: [
    {
      text: `${routeSteps.value}`,
      tooltip: `${stepsPerCompletion.value} steps per action`,
      iconPath: "assets/icons/text/general_icons/steps.png",
    },
    {
      text: `${n(uncappedWorkEfficiency.value * 100)} / ${Math.round(
        (maxWorkEfficiency.value - 1) * 100
      )}%`,
      tooltip: `Your Work Efficiency: ${Math.round(
        uncappedWorkEfficiency.value * 100
      )}%\nMax Work Efficiency: ${n(
        (maxWorkEfficiency.value - 1) * 100,
        0
      )}%\nMax benefit at: ${
        Math.ceil((effectiveMaxWorkEfficiency.value - 1) * 400) / 4
      }%`,
      iconPath: "assets/icons/text/stats/skilling/work_efficiency.png",
      borderClass:
        workEfficiency.value >= effectiveMaxWorkEfficiency.value - 1
          ? "border-green"
          : "",
    },
  ],
}));
</script>

<template>
  <details open>
    <summary>Travel Info</summary>

    <section :class="['travel-info', 'border-agility']">
      <p>This is still under development</p>

      <div class="route-config">
        <div class="input-group">
          <ws-label label="Route Distance" />
          <input
            v-model.number="routeDistance"
            type="number"
            min="1"
            class="route-input"
            placeholder="Enter route distance"
          />
        </div>

        <div class="input-group">
          <ws-label label="Route Count" />
          <input
            v-model.number="routeCount"
            type="number"
            min="1"
            class="route-input"
            placeholder="Enter route count"
          />
        </div>
      </div>

      <!-- Stats Display -->
      <div class="info-section">
        <ws-label :label="statsRow.label" />
        <div class="info-row">
          <component
            v-for="(item, idx) in statsRow.items"
            :is="statsRow.component"
            v-bind="item"
            :key="idx"
          />
        </div>
      </div>
    </section>
  </details>
</template>

<style lang="scss" scoped>
.travel-info {
  border-radius: $md;
  display: flex;
  flex-wrap: wrap;
  flex-direction: column;
  align-items: flex-start;
  gap: $lg;
  padding: $md;
}

.route-config {
  display: flex;
  flex-wrap: wrap;
  gap: $lg;
  width: 100%;
}

.input-group {
  display: flex;
  flex-direction: column;
  gap: $sm;
  min-width: 200px;
}

.route-input {
  padding: $sm;
  border: 1px solid $boxDarkOutline;
  border-radius: $sm;
  background-color: $boxDarkBackground;
  color: $txPrimary;
  font-size: $base;

  &:focus {
    outline: none;
    border-color: $txPrimary;
    background-color: $boxTransparentDarkBackground;
  }

  &::placeholder {
    color: $txDarker;
  }
}

.info-section {
  display: flex;
  flex-direction: column;
  gap: $sm;
  align-items: flex-start;
  width: 100%;

  .info-row {
    display: flex;
    flex-wrap: wrap;
    gap: $md;
  }
}
</style>
