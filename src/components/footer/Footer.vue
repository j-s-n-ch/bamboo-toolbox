<script setup>
import Tab from "./Tab.vue";

const emit = defineEmits(["selectTab"]);

const changeTab = (tabName) => {
  emit("selectTab", tabName);
};
</script>

<template>
  <footer class="footer">
    <tab name="Activity" @click="changeTab"></tab>
    <tab name="Gear" @click="changeTab"></tab>
    <tab name="Stats" @click="changeTab"></tab>
  </footer>
</template>

<style lang="scss" scoped>
@import "@/styles/utils/variables.scss";

.footer {
  width: 100%;
  display: flex;
  justify-content: space-around;
  border-top: 1px solid $chipOutline;
  padding: 0;
}
</style>
