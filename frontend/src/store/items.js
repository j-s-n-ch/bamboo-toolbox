import { defineStore } from "pinia";

export const useItemsStore = defineStore("itemStore", {
  state: () => ({
    itemsByCategory: {},
    ownedItems: {},
  }),
  actions: {
    setItems(category, items) {
      this.itemsByCategory[category] = items;
    },
    toggleItem(itemId, quality = null, quality2 = null) {
      if (this.ownedItems[itemId]) {
        delete this.ownedItems[itemId];
      } else {
        this.ownedItems[itemId] = { quality, quality2 };
      }
    },
    setItemQuality(itemId, quality = null, quality2 = null) {
      if (!this.ownedItems[itemId]) this.ownedItems[itemId] = {};
      this.ownedItems[itemId].quality = quality;
      this.ownedItems[itemId].quality2 = quality2;
    },
  },
});
