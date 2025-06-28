<script setup>
import { getSkills } from "@/utils/axios/api_routes";
import { upsertPlayerStats } from "@/utils/axios/db_routes";
import { usePlayerStore } from "@/store/player";
import TabContentWrapper from "@/components/common/TabContentWrapper.vue";
import SkillLevelDisplay from "./SkillLevelDisplay.vue";
import AchievementPointDisplay from "./AchievementPointDisplay.vue";
import ItemSelection from "./ItemSelection.vue";
import debounce from "@/utils/debounce";

const playerStore = usePlayerStore();

const postPlayerStats = () => {
  const payload = {
    ...playerStore.skillLevels,
    achievementPoints: playerStore.achievementPoints,
  };
  upsertPlayerStats(payload);
};

const updatePlayerStats = debounce(postPlayerStats, 1000);
</script>

<template>
  <tab-content-wrapper>
    <div class="skill-bubbles">
      <skill-level-display
        v-for="skill in playerStore.skills"
        :key="skill.name"
        :skill="skill"
        @input="updatePlayerStats"
      />
      <achievement-point-display @input="updatePlayerStats" />
    </div>
    <item-selection />
  </tab-content-wrapper>
</template>

<style lang="scss" scoped>
.skill-bubbles {
  display: grid;
  grid-template-columns: repeat(3, max-content);
  justify-content: center;

  column-gap: $md;
  row-gap: $md;
}
</style>
