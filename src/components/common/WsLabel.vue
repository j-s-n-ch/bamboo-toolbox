<script setup>
const props = defineProps({
  label: {
    type: String,
    required: true,
  },
  labelFor: {
    type: String,
    default: "",
  },
});
</script>

<template>
  <label :for="labelFor" class="typography-label">
    {{ label }}
  </label>
</template>