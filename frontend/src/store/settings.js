import { defineStore } from "pinia";

export const useSettingsStore = defineStore("settingsStore", {
  state: () => ({
    userSettings: {},
    gearSettings: {},
    activitySettings: {},
    isLoaded: false,
  }),
  actions: {
    fetchSettingsData() {
      const settings = this.defaultSettingsData();
      this.gearSettings = settings.gearSettings;
      this.activitySettings = settings.activitySettings;
      this.isLoaded = true;
    },

    defaultSettingsData() {
      return {
        gearSettings: {
          showOwned: {
            label: "Show only owned items",
            display: 1,
            value: true,
          },
          showUseful: {
            label: "Show  items with applicable stats",
            display: 1,
            value: true,
          },
        },
        activitySettings: {
          showCombined: {
            label: "Show combined drops",
            display: 1,
            value: true,
          },
          hideOwnedCollectibles: {
            label: "Hide owned collectibles",
            display: 1,
            value: true,
          },
        },
      };
    },
  },
});
