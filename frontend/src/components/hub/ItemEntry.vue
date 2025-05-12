<script setup>
import { computed } from "vue";
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

const toggleChecked = () => {
  itemsStore.toggleItem(props.item.id);
};

const updateQuality = (q1, q2) => {
  itemsStore.setItemQuality(props.item.id, q1, q2);
};
</script>

<template>
  <div :class="['item-entry', colorClass]" @click="toggleChecked">
    <input type="checkbox" v-model="isOwned" @click.stop />
    <ws-icon :iconPath="item.icon" />
    <span>{{ item.name }}</span>

    <select v-if="qualities === 1" v-model="item.quality">
      <option v-for="q in [1, 2, 3, 4, 5, 6]" :key="q" :value="q">
        Q{{ q }}
      </option>
    </select>

    <div v-if="qualities === 2">
      <select v-model="item.quality1">
        <option v-for="q in [1, 2, 3, 4, 5, 6]" :key="'q1-' + q" :value="q">
          Q{{ q }}
        </option>
      </select>
      <select v-model="item.quality2">
        <option v-for="q in [1, 2, 3, 4, 5, 6]" :key="'q2-' + q" :value="q">
          Q{{ q }}
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
  gap: variables.$xxs;

  cursor: pointer;

  background-color: variables.$boxDarkBackground;
  border-radius: variables.$sm;
  border: 1px solid variables.$bgPrimary;

  padding: variables.$xxxs variables.$xxs;
}
</style>
