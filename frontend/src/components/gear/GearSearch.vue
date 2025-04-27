<script setup>
import { ref, useTemplateRef } from "vue";
import { useGearStore } from "@/store/gear";
import WsIcon from "@/components/common/WsIcon.vue";

const props = defineProps({
  gearType: {
    type: String,
    required: true,
  },
  slotName: {
    type: String,
    required: true,
  },
});

const emit = defineEmits(["selectItem"]);

const gearStore = useGearStore();
const searchValue = useTemplateRef("");
const itemOptions = ref([]);

const search = async ({ gt, searchKey }) =>
  await gearStore.itemSearch({ gearType: gt, searchKey }).then((data) => {
    itemOptions.value = data;
  });

search({ gt: props.gearType });

const handleClick = (item) => {
  emit("selectItem", item.id, item.quality);
} 
</script>

<template>
  <div class="search-wrapper">
    <el-input placeholder="Filter..." v-model="searchValue" />
    <div class="items-wrapper">
      <div
        v-for="item in itemOptions"
        :key="item"
        class="item"
        @click="handleClick(item)"
      >
        <ws-icon :icon-path="item.icon" />
        <span class="text">
          {{ item.name }}
        </span>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@use "@/styles/utils/variables.scss";

.search-wrapper {
  width: 100%;
  display: flex;
  flex-direction: column;

  height: 100%;
}

.items-wrapper {
  flex-grow: 1;
  overflow-y: auto;

  display: flex;
  flex-direction: column;

  .item {
    display: flex;
    gap: 16px;

    justify-content: center;

    padding: variables.$xs;
    border: 2px solid variables.$chipOutline;
    cursor: pointer;

    &:hover {
      background-color: variables.$chipBackground;
    }
  }
}
</style>