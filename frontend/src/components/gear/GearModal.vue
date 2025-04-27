<script setup>
import { ref, computed } from "vue";
import { useGearStore } from "@/store/gear";
import GearPreview from "./GearPreview.vue";
import GearSearch from "./GearSearch.vue";

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

const emit = defineEmits(["update:visible"]);

// Define tabs and map them to their components
const tabs = [
  { label: "Gear Preview", component: GearPreview },
  { label: "Gear Search", component: GearSearch },
];

const gearStore = useGearStore();

const closeDialog = () => {
  emit("update:visible", false);
};

// Computed property to get the active component based on the selected tab
const activeComponent = computed(() => tabs[selectedTab.value].component);

// Function to select a tab
const selectTab = (index) => {
  selectedTab.value = index;
};

// Track which tab is selected
const selectedTab = ref(gearStore.slotFilled(props.slotName) ? 0 : 1);

const handleSelectItem = async (id, quality) => {
  await gearStore.loadItem(props.slotName, id, quality);
  selectTab(0);
};

const handleSelectQuality = async (id, quality) => {
  await gearStore.loadItem(props.slotName, id, quality);
}
</script>

<template>
  <!-- Backdrop (Overlay) -->
  <div class="backdrop" @click="closeDialog"></div>

  <!-- Modal Dialog Content -->
  <transition appear name="slide-up">
    <div class="bottom-dialog">
      <div class="tab-navigation">
        <button
          v-for="(tab, index) in tabs"
          :key="index"
          :class="{ active: selectedTab === index }"
          @click="selectTab(index)"
        >
          {{ tab.label }}
        </button>
        <button class="close-button" @click="closeDialog">x</button>
      </div>

      <!-- Dynamic Content Based on Selected Tab -->
      <div class="tab-content">
        <component
          :is="activeComponent"
          :gear-type="gearType"
          :slot-name="slotName"
          @select-item="handleSelectItem"
          @select-quality="handleSelectQuality"
        />
      </div>
    </div>
  </transition>
</template>

<style lang="scss" scoped>
@use "@/styles/utils/variables.scss";

.backdrop {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1000;
  background-color: rgba(6, 12, 15, 0.5);
}

.bottom-dialog {
  position: fixed;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);

  height: 60dvh;
  width: 100%;
  max-width: 550px;
  padding: 0;
  background-color: variables.$boxDarkBackground;
  border: 2px solid variables.$boxDarkOutline;

  border-top-left-radius: variables.$base;
  border-top-right-radius: variables.$base;
  z-index: 1001;

  display: flex;
  flex-direction: column;
}

.tab-content {
  display: flex;
  flex-direction: column;
  flex-grow: 1;
  overflow-y: auto;
}

.el-dialog__wrapper {
  overflow: hidden;
  display: flex;
  justify-content: center;
  align-items: flex-end;
}

.el-dialog__header,
.el-dialog__footer {
  display: none;
}

/* Slide Up Transition for the Bottom Dialog */
.slide-up-enter-active,
.slide-up-leave-active {
  transition: transform 0.3s ease;
}
.slide-up-enter,
.slide-up-leave-to {
  transform: translateY(100%);
}

/* Tab navigation */
.tab-navigation {
  display: flex;
  justify-content: center;
  margin-bottom: variables.$base;

  button {
    flex-grow: 1;
    background-color: variables.$boxDarkBackground;
    padding: variables.$base variables.$base variables.$xs;
    border: none;
    cursor: pointer;
    color: variables.$txPrimary;

    &:first-child {
      border-top-left-radius: variables.$base;
    }

    &:last-child {
      border-top-right-radius: variables.$base;
    }
  }

  button.active {
    font-weight: bold;
    color: variables.$txLighter;
    border-bottom: 2px solid variables.$txLighter;
  }

  button:hover {
    background-color: variables.$chipBackground;
  }

  .close-button {
    flex-grow: 0;
  }
}
</style>
