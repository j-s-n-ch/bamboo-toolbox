<script setup>
import { computed } from "vue";
import { useItemsStore } from "@/store/items";
import { useDataStore } from "@/store/data";
import ItemEntry from "./ItemEntry.vue";
import WsIcon from "../primitives/WsIcon.vue";

const props = defineProps({
  keyword: {
    type: String,
    default: null,
  },
});

const emit = defineEmits(["update:keyword"]);

const itemsStore = useItemsStore();
const dataStore = useDataStore();

const allKeywords = computed(() => {
  const kws = new Set();
  for (const item of Object.values(itemsStore.allGearItems)) {
    if (!item.keywords) continue;
    for (const kw of item.keywords) {
      kws.add(kw);
    }
  }
  return [...kws].sort().map((kw) => dataStore.getKeywordById(kw));
});

const filteredItems = computed(() => {
  if (!props.keyword) return [];
  return Object.values(itemsStore.allGearItems).filter((item) =>
    item.keywords && item.keywords.includes(props.keyword),
  );
});

function onSelect(e) {
  emit("update:keyword", e.target.value || null);
}

function clear() {
  emit("update:keyword", null);
}

function toggleItem(data) {
  itemsStore.toggleItem(data);
}

console.log(allKeywords.value);
</script>

<template>
  <div class="keyword-filter">
    <div class="filter-row">
      <label class="filter-label" for="keyword-select">
        Show items with keyword:
      </label>
      <div class="select-wrapper">
        <select
          id="keyword-select"
          :value="keyword ?? ''"
          @change="onSelect"
          class="keyword-select"
        >
          <option value="">— select keyword —</option>
          <option v-for="kw in allKeywords" :key="kw.id" :value="kw.id">
            <ws-icon
              v-if="kw.icon"
              :icon-path="kw.icon"
              size="small"
              alt-text=""
              decorative
              class="keyword-icon"
            />
            {{ kw.name }}
          </option>
        </select>
        <button
          v-if="keyword"
          class="clear-btn"
          @click="clear"
          aria-label="Clear keyword filter"
        >
          ✕
        </button>
      </div>
    </div>

    <div v-if="keyword && filteredItems.length" class="keyword-results">
      <item-entry
        v-for="item in filteredItems"
        :key="item.id"
        :item="item"
        :qualities="0"
        :selected="!!itemsStore.ownedItems[item.id]?.owned"
        @change="toggleItem"
      />
    </div>
    <div v-else-if="keyword && filteredItems.length === 0" class="no-results">
      No items found for "{{ keyword }}".
    </div>
  </div>
</template>

<style lang="scss" scoped>
.keyword-filter {
  display: flex;
  flex-direction: column;
  gap: $sm;
  width: 100%;
}

.filter-row {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: $sm;
  flex-wrap: wrap;
}

.filter-label {
  font-size: $md;
  white-space: nowrap;
}

.select-wrapper {
  display: flex;
  align-items: center;
  gap: $xxs;
}

.keyword-select {
  background: $boxDarkBackground;
  color: $txPrimary;
  border: 1px solid $bgPrimary;
  border-radius: $sm;
  padding: $xxxs $xxs;
  font: inherit;
  font-size: $md;
  cursor: pointer;
}

.clear-btn {
  background: none;
  border: 1px solid $bgPrimary;
  border-radius: $sm;
  color: $txPrimary;
  cursor: pointer;
  font: inherit;
  font-size: $md;
  padding: $xxxs $xxs;
  line-height: 1;

  &:hover {
    background: $boxDarkBackground;
  }
}

.keyword-results {
  display: flex;
  flex-direction: column;
  gap: $xxxs;
}

.no-results {
  font-size: $md;
  opacity: 0.7;
}
</style>
