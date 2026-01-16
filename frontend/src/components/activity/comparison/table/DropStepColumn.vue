<script setup>
import { storeToRefs } from "pinia";
import { useSettingsStore } from "@/store/settings";
import DropStepValue from "./DropStepValue.vue";
import WsIcon from "@/components/common/WsIcon.vue";
import { icons } from "@/constants/iconPaths";
import { n } from "@/utils/number";

defineProps({
  data: Object,
  item: Object,
  invert: { type: Boolean, default: false },
});

const settingsStore = useSettingsStore();
const { activitySettings } = storeToRefs(settingsStore);
</script>

<template>
  <td>
    <div v-if="data.item > 0" class="step-counts">
      <div class="steps-line border-common">
        <span
          v-if="activitySettings.shownDropRate.display === 1"
          :class="{
            positive: invert ? item.normalComp > 0 : item.normalComp < 0,
            negative: invert ? item.normalComp < 0 : item.normalComp > 0,
          }"
          >{{ n(data.normal, data.normal < 100 ? 1 : 0) }}</span
        >
        <span
          v-else
          :class="{
            positive: invert ? item.comp > 0 : item.comp < 0,
            negative: invert ? item.comp < 0 : item.comp > 0,
          }"
          >{{ n(data.item, data.item < 100 ? 1 : 0) }}</span
        >
        <ws-icon :iconPath="icons.steps" size="xs" />
      </div>

      <drop-step-value
        class="border-fine"
        :data="data.fine"
        :comp="item.fineComp"
        :invert="invert"
      />
      <drop-step-value
        class="border-petRare"
        :data="data.rare"
        :comp="item.rareComp"
        :invert="invert"
      />
    </div>
  </td>
</template>

<style lang="scss" scoped>
.step-counts {
  min-width: 50px;
  display: flex;
  flex-direction: column;

  .steps-line {
    display: flex;
    justify-content: flex-end;
    align-items: center;
    gap: $xxxs;

    border-radius: $sm;
    padding: $xxxxs;
    width: 100%;
    box-sizing: border-box;

    span {
      text-wrap: nowrap;
      text-align: left;
    }
  }
}
</style>
