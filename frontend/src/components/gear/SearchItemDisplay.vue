<script setup>
import WsIcon from "@/components/common/WsIcon.vue";

const props = defineProps({
  item: {
    type: Object,
    required: true,
  },
});
</script>

<template>
  <button :key="item" class="item" @click="handleClick(item)">
    <ws-icon :iconPath="item.icon" :outline-class="`outline-${item.quality}`" />
    <span :class="`color-${item.quality}`">
      {{ item.name }}
    </span>
  </button>
</template>

<style lang="scss" scoped>
.item {
  display: flex;
  gap: $xxs;

  justify-content: center;
  align-items: center;

  background-color: $boxDarkBackground;
  border-radius: $sm;
  border: 1px solid $bgPrimary;

  padding: $xxxs $xxs;
  cursor: pointer;

  &:hover,
  &:focus {
    background-color: $boxTransparentDarkOutline;
  }
}
</style>
