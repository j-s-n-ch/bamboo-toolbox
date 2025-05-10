<script setup>
import WsIcon from "@/components/common/WsIcon.vue";

defineProps({
  item: Object,
  display: Array,
});
</script>

<template>
  <div class="item-entry" @click="item.checked != item.checked">
    <input
      v-if="display.includes('checkbox')"
      type="checkbox"
      v-model="item.checked"
    />
    <ws-icon :iconPath="item.icon" />
    <span v-if="display.includes('name')">{{ item.name }}</span>

    <select v-if="display.includes('quality')" v-model="item.quality">
      <option v-for="q in [1, 2, 3, 4, 5, 6]" :key="q" :value="q">
        Q{{ q }}
      </option>
    </select>

    <div v-if="display.includes('quality2')">
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
