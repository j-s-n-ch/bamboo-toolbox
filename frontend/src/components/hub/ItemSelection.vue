<script setup>
import { ref } from "vue";
import { useItemsStore } from "@/store/items";
import { getCollectibles, getCrafted, getLoot } from "@/utils/axios/routes";
import ItemCategoryPanel from "./ItemCategoryPanel.vue";
import LoadingThrobber from "@/components/common/LoadingThrobber.vue";

const isLoading = ref(true);
const openCategory = ref(null);
const itemStore = useItemsStore();

const fetchConfigs = [
  { method: getCollectibles, key: "collectibles" },
  { method: getCrafted, key: "crafted" },
  { method: getLoot, key: "loot" },
];

Promise.all(
  fetchConfigs.map(({ method, key }) =>
    method().then(({ data }) => itemStore.setItems(key, data))
  )
).then(() => {
  // All loaded – show content
  isLoading.value = false;
});

const categories = {
  Collectibles: {
    title: "Collectibles",
    display: ["checkbox", "icon", "name"],
    itemCategory: "collectibles",
  },
  // Weapons: { title: "Weapons", display: ["icon", "name", "quality"] },
  // Rings: { title: "Rings", display: ["checkbox", "icon", "quality2"] },
  // Misc: { title: "Miscellaneous", display: ["name", "checkbox"] },
};

// const categorized = Object.entries(categories).map(([key, config]) => ({
//   title: config.title,
//   display: config.display,
//   items: allItems.filter((item) => item.category === key)
// }));

function toggleCategory(category) {
  openCategory.value = openCategory.value === category ? null : category;
}
</script>

<template>
  <div class="wrapper">
    <h2 class="typography-h3">Owned Items</h2>
    <div v-if="isLoading">
      <loading-throbber />
    </div>
    <div v-else class="categories">
      <item-category-panel
        v-for="cat in categories"
        :key="cat.title"
        :title="cat.title"
        :item-category="cat.itemCategory"
        :display="cat.display"
        :is-open="openCategory === cat.title"
        @toggle="() => toggleCategory(cat.title)"
      />
    </div>
  </div>
</template>

<style langs="scss" scoped>
.wrapper {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.categories {
  display: flex;
  flex-direction: column;
  width: 100%;
}
</style>