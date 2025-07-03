import { defineStore } from "pinia";
import { getKeywords } from "@/utils/axios/api_routes";

export const useDataStore = defineStore("dataStore", {
  state: () => ({
    isLoaded: false,
    keywords: [],
    keywordsMap: {},
  }),
  getters: {
    getKeywordById: (state) => (id) =>
      (id in state.keywordsMap && state.keywordsMap[id]) || null,
  },
  actions: {
    async fetchGameData() {
      if (this.isLoaded) return;

      const [{ data: keywords }] = await Promise.all([getKeywords()]);

      this.keywords = keywords;
      this.keywordsMap = Object.fromEntries(
        keywords.map(({ id, name, icon }) => [id, { name, icon }])
      );

      this.isLoaded = true;
    },
  },
});
