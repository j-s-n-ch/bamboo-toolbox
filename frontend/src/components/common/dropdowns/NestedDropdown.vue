<script setup>
import { ref, onMounted, onUnmounted } from "vue";
import WsLabel from "../WsLabel.vue";
import WsIcon from "../WsIcon.vue";
import LabelWithIcon from "../LabelWithIcon.vue";
import DropdownItem from "./DropdownItem.vue";
import DropdownCategory from "./DropdownCategory.vue";

const props = defineProps({
  label: String,
  data: {
    type: Array,
    required: true,
  },
});

const emit = defineEmits(["select"]);

onMounted(() => {
  document.addEventListener("click", handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener("click", handleClickOutside);
});

const dropdownRef = ref("dropdownRef");
const isOpen = ref(false);
const openCategory = ref(-1);
const selected = ref("");

const toggle = () => {
  isOpen.value = !isOpen.value;
};

const toggleCategory = (index) => {
  if (index !== openCategory.value) openCategory.value = index;
  else openCategory.value = -1;
};

const selectItem = (item) => {
  isOpen.value = false;
  selected.value = item;
  emit("select", item);
};

const handleClickOutside = (event) => {
  if (dropdownRef.value && !dropdownRef.value.contains(event.target)) {
    isOpen.value = false;
  }
};
</script>
  
<template>
  <div class="wrapper" ref="dropdownRef">
    <div class="header">
      <ws-label :label="label" label-for="dropdown-trigger" />
      <div class="dropdown-trigger" @click="toggle">
        <label-with-icon
          :text="selected.value || 'Select an item'"
          :icon="selected.icon"
        ></label-with-icon>
        <span class="chevron" :class="{ isOpen }">▼</span>
      </div>
    </div>

    <!-- <div v-if="isOpen" class="dropdown-menu">
      <ul class="category-list">
        <li class="category-li" v-for="(category, index) in data" :key="index">
          <div class="category-item" @click="toggleCategory(index)">
            <label-with-icon
              :text="category.value"
              :icon="category.icon"
            ></label-with-icon>
            <span class="chevron" :class="{ isOpen: openCategory === index }"
              >▼</span
            >
          </div>

          <ul v-if="openCategory === index" class="item-list">
            <dropdown-item 
              v-for="(item, idx) in category.items"
              :key="idx"
              @select="selectItem(item)"
            />
          </ul>
        </li>
      </ul>
    </div> -->
  
    <div v-if="isOpen" class="dropdown-menu">
      <ul class="category-list">
        <DropdownCategory
          v-for="(category, index) in data"
          :key="index"
          :category="category"
          :no-border="index === 0"
          @select="selectItem"
        />
      </ul>
    </div>
  </div>
</template>

<style lang="scss" scoped>
ul {
  list-style-type: none;
}

.wrapper {
  display: flex;
  flex-direction: column;
  text-align: left;

  .header {
    display: flex;
    flex-direction: column;
    gap: $xxs;
  }
}

.chevron {
  justify-self: flex-end;
  transition: transform 0.2s ease;
  display: inline-block;
  transform: rotate(0deg);

  &.isOpen {
    transform: rotate(180deg);
  }
}

.dropdown-trigger {
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: $boxTransparentPrimaryBackground;

  padding: $sm;
  border: 1px solid $boxPrimaryOutline;
  border-radius: $md;
}

.dropdown-menu {
  border: 1px solid $boxPrimaryOutline;
  border-radius: $md;
  background-color: $boxTransparentPrimaryBackground;

  .category-list,
  .item-list {
    .category-li {
      border-bottom: 1px solid $boxPrimaryOutline;
    }

    &:last-child {
      border-bottom: unset;
    }
  }
}

</style>