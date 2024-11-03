<script setup>
const props = defineProps({
  name: String,
})

const emit = defineEmits(['click']);
</script>

<template>
  <button class="tab" @click="emit('click', name)">{{ name }}</button>
</template>

<style scoped>
.tab {
  width: 100%;
  height: 100%;
  padding: 2rem;
  margin: 0;
  color: rgba(255, 255, 255, 0.87);
}

.tab:hover {
  background-color: #2a2a2a;
}
</style>