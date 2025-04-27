<script setup>
import { ref } from "vue";
import TabContentWrapper from "../common/TabContentWrapper.vue";
import GearSlot from "./GearSlot.vue";
import GearModal from "./GearModal.vue";

const showGearModal = ref(false);
const gearType = ref(null);
const slotName = ref(null);

const handleGearSlotSelect = (gear, slot) => {
  showGearModal.value = true;
  gearType.value = gear;
  slotName.value = slot;
};

const updateVisible = (visibility) => {
  showGearModal.value = visibility;
};
</script>

<template>
  <tab-content-wrapper>
    <div class="tab-content">
      <div class="items">
        <div class="column left">
          <gear-slot gearType="cape" @select="handleGearSlotSelect" />
          <gear-slot gearType="hands" @select="handleGearSlotSelect" />
          <gear-slot
            gearType="primary"
            class="primary"
            @select="handleGearSlotSelect"
          />
          <gear-slot gearType="ring" index="1" @select="handleGearSlotSelect" />
        </div>
        <div class="column middle">
          <gear-slot gearType="head" @select="handleGearSlotSelect" />
          <gear-slot gearType="chest" @select="handleGearSlotSelect" />
          <gear-slot gearType="legs" @select="handleGearSlotSelect" />
          <gear-slot gearType="feet" @select="handleGearSlotSelect" />
        </div>
        <div class="column">
          <gear-slot gearType="back" @select="handleGearSlotSelect" />
          <gear-slot gearType="neck" @select="handleGearSlotSelect" />
          <gear-slot
            gearType="secondary"
            class="secondary"
            @select="handleGearSlotSelect"
          />
          <gear-slot gearType="ring" index="2" @select="handleGearSlotSelect" />
        </div>
      </div>
      <div class="tools">
        <div v-for="index in 6" :key="index" class="tool-wrapper">
          <gear-slot
            gearType="tool"
            :index="`${index}`"
            @select="handleGearSlotSelect"
          />
        </div>
      </div>
      <div class="row">
        <gear-slot gearType="potion" @select="handleGearSlotSelect" />
        <gear-slot gearType="consumable" @select="handleGearSlotSelect" />
        <gear-slot gearType="service" @select="handleGearSlotSelect" />
      </div>
      <div v-if="showGearModal">
        <gear-modal
          :gear-type="gearType"
          :slot-name="slotName"
          @update:visible="updateVisible"
        />
      </div>
    </div>
  </tab-content-wrapper>
</template>

<style lang="scss" scoped>
@use "@/styles/utils/variables.scss";

.tab-content {
  flex-grow: 1;

  min-width: 25rem;
  overflow-y: auto;

  justify-content: center;
  align-items: center;

  display: flex;
  flex-direction: column;
  gap: variables.$xlg;
}

.items {
  display: flex;

  gap: variables.$xxxlg;

  .left {
    align-items: flex-end;
  }

  .middle {
    margin-top: variables.$xxxlg;
  }

  .primary {
    margin-right: variables.$xxxlg;
  }

  .secondary {
    margin-left: variables.$xxxlg;
  }
}

.tools {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: variables.$lg;
  flex-wrap: wrap;

  .tool-wrapper {
    flex: 1 1 30%;
    max-width: 30%;

    display: flex;
    justify-content: center;
  }
}

.column {
  display: flex;
  flex-direction: column;
  gap: variables.$xlg;
}

.row {
  display: flex;
  gap: variables.$xxxlg;
}
</style>