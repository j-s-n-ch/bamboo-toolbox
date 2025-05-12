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
    toggleItem(itemId) {
      if (this.ownedItems[itemId]) {
        delete this.ownedItems[itemId];
      } else {
        this.ownedItems[itemId] = {};
      }
    },
    setItemQuality(itemId, quality1 = null, quality2 = null) {
      if (!this.ownedItems[itemId]) this.ownedItems[itemId] = {};
      this.ownedItems[itemId].quality1 = quality1;
      this.ownedItems[itemId].quality2 = quality2;
    },
  },
});
