

<script setup>
import { ref } from "vue";
import LabelWithIcon from "../LabelWithIcon.vue";
import DropdownItem from "./DropdownItem.vue";

const props = defineProps({
  category: {
    type: Object,
    required: true,
  },
  noBorder: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["select"]);

const isOpen = ref(false);

function toggle() {
  isOpen.value = !isOpen.value;
}

function handleSelect(item) {
  emit("select", item);
}
</script>

<template>
  <li class="dropdown-category">
    <div
      class="category-header"
      :class="{ 'no-border': noBorder }"
      @click="toggle"
    >
      <LabelWithIcon :icon="category.icon" :text="category.value" />
      <span class="chevron" :class="{ open: isOpen }">▼</span>
    </div>

    <ul v-if="isOpen" class="item-list">
      <DropdownItem
        v-for="(item, idx) in category.items"
        :key="idx"
        :item="item"
        class="item"
        @select="handleSelect"
      />
    </ul>
  </li>
</template>

<style lang="scss" scoped>
.chevron {
  transition: transform 0.2s ease;

  &.open {
    transform: rotate(180deg);
  }
}

.dropdown-category {
  .category-header {
    padding: $xxs $xs;
    background-color: $boxTransparentDarkBackground;
    cursor: pointer;
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-top: 1px solid $boxPrimaryOutline;

    &.no-border {
      border-top: unset;
    }
  }

  .item-list {
    background-color: $boxTransparentDarkBackground;
    list-style: none;
    padding: 0;
    margin: 0;

    .item {
      border-top: 1px solid $boxPrimaryOutline;
      padding-left: $xxlg;
    }
  }
}
</style>
