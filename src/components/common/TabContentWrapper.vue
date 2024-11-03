<script setup></script>

<template>
  <div class="tab-wrapper">
    <slot />
  </div>
</template>

<style scoped>
.tab-wrapper {
  width: 100%;

  flex-grow: 1;
  display: flex;
  flex-direction: column;
  justify-items: center;
}

.tab-wrapper {
  flex-grow: 1;
}
</style>