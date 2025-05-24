<script setup></script>

<template>
  <div class="tab-wrapper">
    <slot></slot>
  </div>
</template>

<style lang="scss" scoped>

.tab-wrapper {
  width: 100%;
  box-sizing: border-box;

  flex-grow: 1;
  display: flex;
  flex-direction: column;

  background-color: $boxDarkBackground;

  padding: $xlg;
  border-radius: $base;
  border: 2px solid $boxDarkOutline;
}
</style>