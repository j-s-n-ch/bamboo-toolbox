<script setup>
import { toRef } from "vue";
import LoadingThrobber from "@/components/common/LoadingThrobber.vue";

const props = defineProps({
  title: {
    type: String,
  },
  isLoading: {
    type: Boolean,
    default: false,
  },
});

const loading = toRef(props, "isLoading");
</script>

<template>
  <div class="tab-wrapper">
    <div v-if="loading">
      <loading-throbber />
    </div>
    <slot v-else class="tab-content"></slot>
  </div>
</template>

<style lang="scss" scoped>
.tab-wrapper {
  width: 100%;
  box-sizing: border-box;

  flex-grow: 1;
  display: flex;
  flex-direction: column;
  gap: $base;

  background-color: $boxDarkBackground;

  padding: $xlg;
  border-radius: $base;
  border: 2px solid $boxDarkOutline;
}

.tab-content {
  flex-grow: 1;

  display: flex;
  flex-direction: column;
  gap: $xlg;
  justify-content: center;
}
</style>