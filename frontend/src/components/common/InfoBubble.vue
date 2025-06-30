<script setup>
import WsIcon from "@/components/common/WsIcon.vue";

const props = defineProps({
  iconPath: String,
  label: String,
  text: String,
  tooltip: String,
  borderClass: String,
});
</script>

<template>
  <div class="bubble-wrapper">
    <div
      :class="['bubble', borderClass]"
      :title="tooltip"
      :aria-label="tooltip"
    >
      <ws-icon :icon-path="iconPath" size="sm" />
      <p class="text">{{ text }}</p>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.bubble-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;

  .bubble {
    width: fit-content;

    display: flex;
    gap: $xs;
    border-radius: $sm;
    padding: $xxxxs $xxxs;

    border: 2px solid $boxPrimaryOutline;
    background-color: $boxPrimaryBackground;
  }
}

.text {
  margin: 0;
}
</style>
