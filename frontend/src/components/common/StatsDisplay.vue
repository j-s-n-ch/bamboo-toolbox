<script setup>
import { toDeepRaw } from "@/utils/rawData";
import { sumAttrs } from "@/utils/qualityAttrs";
import StatRequirementDisplay from "./StatRequirementDisplay.vue";

const props = defineProps({
  item: {
    type: Object,
    required: true,
  },
  quality: String,
  showQualityBorder: {
    type: Boolean,
    default: false,
  },
});

const mapAttrs = (quality) => {
  const itemCopy = toDeepRaw(props.item);
  return sumAttrs(
    itemCopy.itemAttrs,
    itemCopy.itemQualityAttrs,
    itemCopy.buffs,
    quality
  ).flatMap(({ stats, requirements }) => {
    return stats.flatMap((stat) => {
      return { stat, requirements: requirements || [] };
    });
  });
};

const attrs = mapAttrs(props.quality);
</script>

<template>
  <div
    :class="[
      'stats-display',
      props.showQualityBorder ? `border-${props.quality}` : '',
    ]"
  >
    <stat-requirement-display
      v-for="({ stat, requirements }, key) in attrs"
      :key="key"
      :stat="stat"
      :requirements="requirements"
    />
  </div>
</template>

<style lang="scss" scoped>
.stats-display {
  border-radius: $sm;
  width: 100%;
  display: flex;
  flex-direction: column;
}
</style>
