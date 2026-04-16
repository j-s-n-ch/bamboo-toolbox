<script setup>
import { computed } from "vue";
import WsIcon from "@/components/primitives/WsIcon.vue";
import WsExpandable from "@/components/primitives/WsExpandable.vue";
import DropItemDisplay from "./DropItemDisplay.vue";
import { icons } from "@/constants/iconPaths";
import { n } from "@/utils/number";
import { snakeToTitle } from "@/utils/string";

const props = defineProps({
  chestInfo: {
    type: Object,
    required: true,
  },
});

const dropItems = computed(() => Object.values(props.chestInfo.dropInfoMap));
</script>

<template>
  <ws-expandable
    :aria-label="`${snakeToTitle(chestInfo.name)} loot table`"
    class="chest-loot-table"
  >
    <template #header>
      <ws-icon :icon-path="chestInfo.icon" size="sm" />
      <span class="chest-name">{{ snakeToTitle(chestInfo.name) }}</span>
      <span class="steps-per-chest">
        <ws-icon :icon-path="icons.steps" size="xs" />
        {{ n(chestInfo.stepsPerChest, 0) }}
      </span>
    </template>
    <div class="chest-loot-table">
      <drop-item-display
        v-for="info in dropItems"
        :key="info.id"
        :item-id="info.id"
        :drop-info="info"
      />
    </div>
  </ws-expandable>
</template>

<style lang="scss" scoped>
.chest-loot-table {
  display: flex;
  flex-wrap: wrap;
  gap: $sm;

  border: 1px solid $boxDarkOutline;
  border-radius: $sm;
  padding: 0;

  :deep(.ws-expandable__header) {
    box-sizing: border-box;
    border: 1px solid $boxDarkOutline;
    background-color: $boxDarkBackground;
    padding: $sm;
    border-radius: $sm;
  }
}

.chest-name {
  font-weight: 500;
  margin-left: $xs;
}

.steps-per-chest {
  display: flex;
  align-items: center;
  gap: $xxxxs;
  margin-left: $sm;
}
</style>
