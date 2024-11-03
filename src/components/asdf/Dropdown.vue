<script setup>
import { ref } from "vue";

const props = defineProps({
  options: Array,
  selectedOption: {
    type: Object,
    default: { name: "None", value: -1 },
  },
});

const emit = defineEmits(["change"]);

const selection = ref(props.selectedOption);

const handleChange = (option) => {
  selection.value = option;
  emit("change", option);
};
</script>

<template>
  <el-dropdown
    trigger="click"
    placement="bottom-start"
    class="dropdown-main"
    @command="handleChange"
  >
    <span class="el-dropdown">
      <span class="dropdown">{{ selection.name }} </span>
    </span>

    <template #dropdown>
      <el-dropdown-menu>
        <el-dropdown-item
          v-for="item in options"
          :key="item.value"
          :command="item"
          :disabled="item.disabled"
        >
          {{ item.name }}
        </el-dropdown-item>
      </el-dropdown-menu>
    </template>
  </el-dropdown>
</template>

<style scoped>
.dropdown-main {
  cursor: pointer;
}
</style>