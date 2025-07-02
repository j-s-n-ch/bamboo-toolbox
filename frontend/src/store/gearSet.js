import { defineStore } from "pinia";
import {
  getGearSetTags,
  getGearSets,
  upsertGearSet,
} from "@/utils/axios/db_routes";

export const useGearSetStore = defineStore("gearSetStore", {
  state: () => ({
    gearSets: [],
    gearSetTags: [],
    isLoaded: false,
  }),
  actions: {
    async fetchGearSets() {
      if (this.isLoaded) return;

      const [gearSetTags, gearSets] = await Promise.all([
        getGearSetTags(),
        getGearSets(),
      ]);

      this.gearSetTags = gearSetTags;
      this.gearSets = gearSets;

      this.isLoaded = true;
    },

    async addGearSet({ id, name, tags, items }) {
      if (!name || !items) {
        throw new Error("Name, and items are required to create a gear set.");
      }

      const payload = {
        id,
        name,
        tags,
        items,
      };
      await upsertGearSet(payload);
    },
  },
});
