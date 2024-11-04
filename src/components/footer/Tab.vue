<script setup>
const props = defineProps({
  name: String,
})

const emit = defineEmits(['click']);
</script>

<template>
  <button class="tab" @click="emit('click', name)">{{ name }}</button>
</template>

<style lang="scss" scoped>
@import "@/styles/utils/variables.scss";

.tab {                                     
  width: 100%;
  padding: $xxxlg;
}

.tab:hover {
  background-color: $boxTransparentPrimaryBackground;
}
</style>