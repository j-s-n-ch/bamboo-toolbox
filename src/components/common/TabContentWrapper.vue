<script setup></script>

<template>
  <div class="tab-wrapper">
    <slot></slot>
  </div>
</template>

<style lang="scss" scoped>
@import "@/styles/utils/variables.scss";

.tab-wrapper {
  width: 100%;

  flex-grow: 1;
  display: flex;
  flex-direction: column;
  justify-items: center;

  background-color: $boxDarkBackground;

  padding: $xlg;
  border-radius: $base;
  border: 2px solid $boxDarkOutline;
}

.tab-wrapper {
  flex-grow: 1;
}
</style>