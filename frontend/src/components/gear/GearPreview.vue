<script setup>
import { computed } from "vue";
import { useGearStore } from "@/store/gear";
import WsIcon from "@/components/common/WsIcon.vue";
import StatsDisplay from "../common/StatsDisplay.vue";

const props = defineProps({
  gearType: {
    type: String,
    required: true,
  },
  slotName: {
    type: String,
    required: true,
  },
});

defineEmits(["unequip", "close"]);

const gearStore = useGearStore();

const item = computed(() => gearStore.gearSlots[props.slotName]);
</script>

<template>
  <div v-if="gearStore.slotFilled(slotName)" class="preview-wrapper">
    <div class="header">
      <div class="start"></div>
      <div class="mid">
        <div class="base-info">
          <ws-icon :icon-path="item.icon" />
          <p>
            {{ item.name }}
          </p>
        </div>
        <button class="unequip" @click="$emit('unequip')">Unequip</button>
      </div>
      <div class="end">
        <button class="close-button" @click="$emit('close')">x</button>
      </div>
    </div>
    <stats-display :item="item" :quality="item.quality" />
  </div>
  <div v-else>
    <p>Select an item on the search tab</p>
  </div>
</template>

<style lang="scss" scoped>
.preview-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  background-color: $bgPrimary;
  border-radius: $sm $sm $lg $lg;
  border: 2px solid $boxDarkOutline;

  .header {
    background-color: $boxDarkBackground;
    width: 100%;
    display: flex;
    justify-content: space-between;
    gap: $xxlg;
    margin-bottom: $xxs;
    border-radius: calc($sm - 2px) calc($sm - 2px) 0 0;

    .base-info {
      padding: 0;
      display: flex;
      align-items: center;
      align-self: center;
      gap: $md;
    }

    .mid {
      display: flex;
      gap: $md;
    }

    .close-button {
      background-color: $boxDarkBackground;
      padding: $base $base $xs;
      border: none;
      cursor: pointer;
      color: $txPrimary;

      &:hover,
      &:focus {
        background-color: $boxDarkOutline;
      }
    }
  }

  /* Ensure the last child (stats-display) respects bottom border radius */
  > :last-child {
    border-radius: 0 0 calc($lg - 2px) calc($lg - 2px);
    width: 100%;
  }
}

.unequip {
  cursor: pointer;
  border: 1px solid $txNegative;
  color: $txNegative;
  padding: $xxs $sm;
  border-radius: $sm;
  background: $boxDarkBackground;

  &:hover {
    background: $boxDarkOutline;
  }
}

.label-wrapper {
  display: flex;
  flex-direction: column;
  align-items: flex-start;

  gap: $xxs;
  .label {
    margin-left: $xxs;
  }
}
</style>
