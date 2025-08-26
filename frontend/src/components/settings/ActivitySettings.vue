<script setup>
import { useSettingsStore } from "@/store/settings";
import SettingsTable from "./SettingsTable.vue";

const settingsStore = useSettingsStore();

function updateSettingValue(key, value) {
  settingsStore.activitySettings[key].value = value;
}

function updateSettingDisplay(key, display) {
  settingsStore.activitySettings[key].display = display ? 1 : 0;
}
</script>

<template>
  <settings-table
    title="Activity Settings"
    :settings="settingsStore.activitySettings"
    @update-setting-value="updateSettingValue"
    @update-setting-display="updateSettingDisplay"
  />
</template>
