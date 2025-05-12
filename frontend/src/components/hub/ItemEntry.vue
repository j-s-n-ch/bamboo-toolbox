<script setup>
import { computed } from "vue";
import { craftingQualityOptions } from "@/utils/quality";
import { useItemsStore } from "@/store/items";
import WsIcon from "@/components/common/WsIcon.vue";

const props = defineProps({
  item: Object,
  qualities: Number,
});

const itemsStore = useItemsStore();

const isOwned = computed(() => !!itemsStore.ownedItems[props.item.id]);
const itemState = computed(() => itemsStore.ownedItems[props.item.id] || {});

const colorClass = props.item.quality ? `color-${props.item.quality}` : "";
const ownedBgClass = computed(() => {
  return isOwned.value && props.item.quality
    ? `bg-${props.item.quality}-dark`
    : "";
});

const toggleChecked = () => {
  const { id, quality, quality2 } = props.item;
  itemsStore.toggleItem(id, quality, quality2);
};

const updateQuality = () => {
  const { id, quality, quality2 } = props.item;
  itemsStore.setItemQuality(id, quality, quality2);
};
</script>

<template>
  <div :class="['item-entry', colorClass, ownedBgClass]" @click="toggleChecked">
    <div class="base-info">
      <input type="checkbox" v-model="isOwned" @click.stop />
      <ws-icon :iconPath="item.icon" />
      <span :class="`color-${item.quality}`">{{ item.name }}</span>
    </div>

    <div v-if="qualities > 0" class="quality-inputs">
      <select v-model="item.quality" @click.stop>
        <option
          v-for="q in craftingQualityOptions"
          :key="'q1-' + q.value"
          :value="q.value"
          :class="`color-${q.value}`"
        >
          {{ q.name }}
        </option>
      </select>
      <select v-if="qualities === 2" v-model="item.quality2" @click.stop>
        <option
          v-for="q in craftingQualityOptions"
          :key="'q2-' + q.value"
          :value="q.value"
          :class="`color-${q.value}`"
        >
          {{ q.name }}
        </option>
      </select>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@use "@/styles/utils/variables.scss";

.item-entry {
  display: flex;
  align-items: center;
  justify-content: space-between;

  cursor: pointer;

  background-color: variables.$boxDarkBackground;
  border-radius: variables.$sm;
  border: 1px solid variables.$bgPrimary;

  padding: variables.$xxxs variables.$xxs;

  .base-info {
    display: flex;
    align-items: center;
    gap: variables.$xxs;
  }

  .quality-inputs {
    display: flex;
    align-items: flex;
    gap: variables.$xs;
  }
}
</style>
