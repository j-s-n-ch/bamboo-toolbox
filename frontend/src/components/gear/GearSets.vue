<script setup>
import { ref, computed } from "vue";
import { useGearSetStore } from "@/store/gearSet";
import { useGearStore } from "@/store/gear";

const gearSetStore = useGearSetStore();
const gearStore = useGearStore();

const selectedSetId = ref(null);
const newSetName = ref("");
const newSetTags = ref([]);
const isSavingNew = ref(false);

const selectedSet = computed(() =>
  gearSetStore.gearSets.find((set) => set.id === selectedSetId.value)
);

function startNewSet() {
  isSavingNew.value = true;
  newSetName.value = "";
  newSetTags.value = [];
}

const getSetItems = () => {
  const excluded = ["consumable", "potion", "service"];
  return Object.entries(gearStore.gearSlots)
    .filter(([slot, item]) => !excluded.includes(slot) && item)
    .map(([slot, item]) => {
      const match = slot.match(/^([a-zA-Z]+)(\d+)?$/);
      const [slotType, slotIndex] = match
        ? [match[1], match[2] - 1 || 0]
        : ["", ""];

      return {
        slot,
        slotType,
        slotIndex,
        itemId: item?.id || null,
        quality: item?.quality || null,
      };
    });
};

function saveNewSet() {
  gearSetStore.addGearSet({
    name: newSetName.value,
    tags: newSetTags.value,
    items: getSetItems(),
  });
  isSavingNew.value = false;
}

function updateCurrentSet() {
  gearSetStore.addGearSet({
    id: selectedSetId.value,
    name: newSetName.value,
    tags: newSetTags.value,
    items: getSetItems(),
  });
  isSavingNew.value = false;
}
</script>

<template>
  <div class="gear-set-manager">
    <select class="gear-set-select" v-model="selectedSetId">
      <option
        v-for="set in gearSetStore.gearSets"
        :key="set.id"
        :value="set.id"
      >
        {{ set.name }}
      </option>
    </select>
    <div>
      <button class="button" @click="startNewSet">New Gear Set</button>
    </div>

    <div v-if="selectedSet && !isSavingNew" class="set-actions">
      <div>
        <strong>Selected Set:</strong> {{ selectedSet.name }}
        <span v-if="selectedSet.tags && selectedSet.tags.length">
          (Tags: {{ selectedSet.tags.join(", ") }})
        </span>
      </div>
      <button @click="updateCurrentSet">Update This Set</button>
    </div>

    <div v-if="isSavingNew" class="new-set-form">
      <label>
        Name:
        <input v-model="newSetName" placeholder="Enter set name" />
      </label>
      <label>
        Tags:
        <select v-model="newSetTags" multiple>
          <option
            v-for="tag in gearSetStore.gearSetTags"
            :key="tag"
            :value="tag"
          >
            {{ tag }}
          </option>
        </select>
      </label>
      <button class="button" @click="saveNewSet" :disabled="!newSetName">
        Save New Set
      </button>
      <button class="button" @click="isSavingNew = false">Cancel</button>
    </div>
  </div>
</template>

<style scoped lang="scss">
.gear-set-manager {
  display: flex;
  flex-direction: column;
  gap: $base;
}
.set-actions,
.new-set-form {
  margin-top: $base;
}

.gear-set-select {
  cursor: pointer;
  overflow: hidden;
  border-radius: $sm;
  background-color: $boxDarkBackground;
  border: 1px solid $boxDarkOutline;
  padding: $sm;

  &:hover {
    background-color: $boxTransparentDarkBackground;
  }
}

.button {
  cursor: pointer;
  background-color: $boxDarkBackground;
  border: 1px solid $boxDarkOutline;
  border-radius: $md;
  padding: $xxxs;

  &:hover {
    background-color: $boxTransparentDarkBackground;
  }
}
</style>
