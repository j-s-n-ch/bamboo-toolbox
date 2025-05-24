<script setup>
import { computed } from "vue";
import { useGearStore } from "@/store/gear";
import WsIcon from "@/components/common/WsIcon.vue";
import WsLabel from "@/components/common/WsLabel.vue";
import Dropdown from "@/components/common/Dropdown.vue";
import { getWikiUrl } from "@/utils/wiki";

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

const emit = defineEmits(["select-quality"]);

const gearStore = useGearStore();
const item = gearStore.get(props.slotName);

const isCrafted = computed(() => {
  return item.type === "crafted";
});
const qualityOptions = [
  {
    name: "Normal",
    value: "common",
  },
  {
    name: "Good",
    value: "uncommon",
  },
  {
    name: "Great",
    value: "rare",
  },
  {
    name: "Excellent",
    value: "epic",
  },
  {
    name: "Perfect",
    value: "legendary",
  },
  {
    name: "Eternal",
    value: "ethereal",
  },
];
const initialQuality = isCrafted.value
  ? qualityOptions.find((qo) => qo.value === item.quality)
  : null;

const handleQualityChange = (quality) => {
  emit("select-quality", item.id, quality.value);
};


</script>

<template>
  <div v-if="gearStore.slotFilled(slotName)" class="preview-wrapper">
    <div class="base-info">
      <ws-icon :icon-path="item.itemIcon" />
      <p>
        {{ item.name }} (<a :href="getWikiUrl(item.name)" target="_blank"
          >wiki</a
        >)
      </p>

      <div v-if="isCrafted" class="label-wrapper">
        <ws-label class="label" label="Quality" />
        <dropdown
          width="100px"
          :options="qualityOptions"
          :selected-option="initialQuality"
          :addNone="false"
          @change="handleQualityChange"
        />
      </div>
    </div>
    <div class="stats">
      <p v-for="attr in item.itemAttrs" :key="attr.name">
        {{ attr }}
      </p>
    </div>
  </div>
  <div v-else>
    <p>Select an item on the search tab</p>
  </div>
</template>

<style lang="scss" scoped>

.preview-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;

  .base-info {
    padding: $md;
    display: flex;
    align-items: center;
    gap: $md;
  }
}

.label-wrapper {
  display: flex;
  flex-direction: column;
  align-items: flex-start;

  gap: $xxs;
  .label {
    margin-left: $xxs;
  }
}
</style>