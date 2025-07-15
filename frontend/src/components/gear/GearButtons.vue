<script setup>
import GearSetExport from "./GearSetExport.vue";
import GearUnequipButton from "./GearUnequipButton.vue";
import { useNotificationStore } from "@/store/notifications";

const notificationStore = useNotificationStore();

function showNotification(text) {
  notificationStore.success(text);
}
</script>

<template>
  <div class="buttons-wrapper">
    <gear-unequip-button @notification="showNotification" />
    <gear-set-export @notification="showNotification" />
  </div>
</template>

<style lang="scss" scoped>
.buttons-wrapper {
  width: 100%;

  display: flex;
  justify-content: space-around;
  gap: $sm;
}
</style>
