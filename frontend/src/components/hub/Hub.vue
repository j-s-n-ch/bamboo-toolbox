<script setup>
import { ref } from "vue";
import { getSkills } from "@/utils/axios/api_routes";
import TabContentWrapper from "@/components/common/TabContentWrapper.vue";
import SkillLevelDisplay from "./SkillLevelDisplay.vue";
import AchievementPointDisplay from "./AchievementPointDisplay.vue";
import ItemSelection from "./ItemSelection.vue";

const skills = ref([]);

getSkills().then(({ data }) => (skills.value = data));
</script>

<template>
  <tab-content-wrapper>
    <div class="tab-content">
      <div class="skill-bubbles">
        <skill-level-display
          v-for="skill in skills"
          :key="skill.name"
          :skill="skill"
        />
        <achievement-point-display />
      </div>
    </div>
    <item-selection />
  </tab-content-wrapper>
</template>

<style lang="scss" scoped>
@use "@/styles/utils/variables.scss";

.tab-content {
  flex-grow: 1;

  display: flex;
  flex-direction: column;
  gap: variables.$xlg;
  justify-content: center;
}

.skill-bubbles {
  display: grid;
  grid-template-columns: repeat(3, max-content);
  justify-content: center;

  column-gap: variables.$md;
  row-gap: variables.$md;
}
</style>