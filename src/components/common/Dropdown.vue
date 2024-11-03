<script setup>
import { ref, computed } from "vue";

const props = defineProps({
  options: Array,
  selectedOption: {
    type: Object,
    default: { name: "None", value: -1 },
  },
  searchable: {
    type: Boolean,
    default: true,
  },
});

const emit = defineEmits(["change"]);

const empty = { name: "None", value: -1 };
const searchQuery = ref("");
const selection = ref(props.selectedOption ? props.selectedOption : empty);

const shownOptions = computed(() => {
  const filtered = props.options.filter((option) =>
    option.name.toLowerCase().includes(searchQuery.value.toLowerCase())
  );
  filtered.unshift(empty);
  return filtered;
});

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
      <el-dropdown-menu class="dropdown-menu">
        <div v-if="searchable" class="dropdown-search">
          <el-input v-model="searchQuery" placeholder="Search..." clearable />
        </div>

        <el-dropdown-item
          v-for="item in shownOptions"
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

.dropdown-menu {
  min-height: auto;
  max-height: 330px;
  overflow-y: auto;
}
</style>