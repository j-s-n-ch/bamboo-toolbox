<script setup>
import { ref, onMounted, onUnmounted, reactive, nextTick } from "vue";
import { usePlayerStore } from "@/store/player";
import { useUrlStore } from "@/store/url";
import { getOrCreateUserUuid } from "@/utils/user";
import Hub from "./components/hub/Hub.vue";
import Activity from "./components/activity/Activity.vue";
import Gear from "./components/gear/Gear.vue";
import Footer from "./components/footer/Footer.vue";

const playerStore = usePlayerStore();
const mappingStore = useUrlStore();
playerStore.setUuid(getOrCreateUserUuid());

const activeTab = ref("Hub");
const isMobile = ref(window.innerWidth <= 768);

const checkScreenSize = () => {
  isMobile.value = window.innerWidth <= 768;
};

const tabs = { Hub, Gear, Activity };

// Refs for each tab panel
const tabRefs = reactive({});

function scrollToTab(tabName) {
  activeTab.value = tabName;
  nextTick(() => {
    const el = tabRefs[tabName];
    if (el && el.scrollIntoView) {
      el.scrollIntoView({ behavior: "instant", block: "start" });
    }
  });
}

onMounted(async () => {
  checkScreenSize();
  window.addEventListener("resize", checkScreenSize);

  await mappingStore.fetchMapping();
  const urlStore = useUrlStore();
  urlStore.decodeFromUrlAndApply();
});

onUnmounted(() => {
  window.removeEventListener("resize", checkScreenSize);
});
</script>

<template>
  <div :class="isMobile ? 'mobile-layout' : 'desktop-layout'">
    <div
      v-for="tabName in Object.keys(tabs)"
      :key="tabName"
      :ref="(el) => (tabRefs[tabName] = el)"
      :class="['tab-panel', { active: activeTab === tabName }]"
      :tabindex="isMobile ? 0 : undefined"
    >
      <component :is="tabs[tabName]" />
    </div>
    <Footer
      v-if="isMobile"
      :tabs="tabs"
      :active-tab="activeTab"
      @selectTab="scrollToTab"
    />
  </div>
</template>

<style lang="scss">
@use "styles/app";

.mobile-layout {
  display: flex;
  flex-direction: column;
  min-height: calc(100dvh - 64px);
  width: 100%;
  overflow-x: hidden;
  padding-bottom: 64px;
}

.desktop-layout {
  display: flex;
  flex-direction: row;
  gap: 20px;
  min-height: 100dvh;
}

.tab-panel {
  width: 100%;
  transition: opacity 0.2s;
}

.mobile-layout .tab-panel {
  display: none;
  min-height: calc(100dvh - 64px);
}
.mobile-layout .tab-panel.active {
  display: block;
}

.desktop-layout .tab-panel {
  display: block;
  flex: 1 1 0;
}
</style>
