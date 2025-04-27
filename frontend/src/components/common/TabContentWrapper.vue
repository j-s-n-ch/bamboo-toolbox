<script setup></script>

<template>
  <div class="tab-wrapper">
    <slot></slot>
  </div>
</template>

<style lang="scss" scoped>
@use "@/styles/utils/variables.scss";

.tab-wrapper {
  width: 100%;
  box-sizing: border-box;

  flex-grow: 1;
  display: flex;
  flex-direction: column;

  background-color: variables.$boxDarkBackground;

  padding: variables.$xlg;
  border-radius: variables.$base;
  border: 2px solid variables.$boxDarkOutline;
}
</style>