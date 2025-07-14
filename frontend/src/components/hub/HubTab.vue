<script setup>
import {
  upsertPlayerStats,
  upsertFactionReputations,
} from "@/utils/axios/db_routes";
import { usePlayerStore } from "@/store/player";
import TabContentWrapper from "@/components/common/TabContentWrapper.vue";
import SkillLevelDisplay from "./SkillLevelDisplay.vue";
import IconInputBubble from "@/components/common/IconInputBubble.vue";
import AchievementPointDisplay from "./AchievementPointDisplay.vue";
import ItemSelection from "./ItemSelection.vue";
import ImportButton from "./ImportButton.vue";
import debounce from "@/utils/debounce";
import { argbToRgba } from "@/utils/argbToRgba";
import { levelFromXp } from "@/utils/skillXp";

const playerStore = usePlayerStore();

const postPlayerStats = () => {
  const payload = {
    ...playerStore.skillLevels,
    achievementPoints: playerStore.achievementPoints,
  };
  upsertPlayerStats(payload);
};

const updatePlayerStats = debounce(postPlayerStats, 1000);

const postFactionReputation = () => {
  const payload = {
    reputations: playerStore.factionReputation,
  };
  upsertFactionReputations(payload);
};

const updateFactionReputation = debounce(postFactionReputation, 1000);

const handleCharacterImport = (data) => {
  if (!data) return;

  try {
    const parsedData = JSON.parse(data);
    let updatedSkills = false;
    let updatedAchievementPoints = false;

    // Process skills safely
    if (parsedData.skills && typeof parsedData.skills === "object") {
      // Start with current skill levels as base
      const updatedSkillLevels = { ...playerStore.skillLevels };

      // Only update skills that exist in player store
      for (const [skillId, xp] of Object.entries(parsedData.skills)) {
        // Validate: skill must exist in our store and xp must be a valid number
        if (
          skillId in updatedSkillLevels &&
          typeof xp === "number" &&
          xp >= 0
        ) {
          const level = levelFromXp(xp);
          updatedSkillLevels[skillId] = level;
        } else {
          console.warn(`Skipped invalid skill data: ${skillId} = ${xp}`);
        }
      }

      // Batch update all skill levels at once
      playerStore.setSkillLevels(updatedSkillLevels);
      updatedSkills = true;
    }

    if (
      parsedData.achievement_points &&
      typeof parsedData.achievement_points === "number"
    ) {
      playerStore.setAchievementPoints(parsedData.achievement_points);
      updatedAchievementPoints = true;
    } else {
      console.warn("Invalid or missing achievement points data.");
    }

    if (updatedSkills || updatedAchievementPoints) {
      postPlayerStats();
    }

    let updatedReputation = false;

    // Process faction reputations safely
    if (parsedData.reputation && typeof parsedData.reputation === "object") {
      const updatedReputations = { ...playerStore.factionReputation };

      // Only update reputations that exist in the player store
      for (const [faction, reputation] of Object.entries(
        parsedData.reputation
      )) {
        if (
          faction in playerStore.factionsMap &&
          typeof reputation === "number" &&
          reputation >= 0
        ) {
          const factionReputation = playerStore.factionsMap[faction].reputation;
          updatedReputations[factionReputation] = Math.floor(reputation);
          updatedReputation = true;
        } else {
          console.warn(
            `Skipped invalid faction data: ${faction} = ${reputation}`
          );
        }
      }

      playerStore.setFactionReputations(updatedReputations);
    }

    if (updatedReputation) {
      postFactionReputation();
    }

    // TODO: process items
  } catch (error) {
    console.error("Failed to parse character import data:", error);
    // TODO: Show user-friendly error message
  }
};
</script>

<template>
  <tab-content-wrapper class="sections">
    <import-button @import-data="handleCharacterImport" />
    <div class="skill-bubbles">
      <skill-level-display
        v-for="skill in playerStore.skills"
        :key="skill.name"
        :skill="skill"
        @input="updatePlayerStats"
      />
      <achievement-point-display @input="updatePlayerStats" />
    </div>
    <div class="faction-bubbles">
      <icon-input-bubble
        v-for="faction in playerStore.factions"
        :key="faction.reputation"
        :id="faction.reputation"
        :icon="faction.icon"
        :get-value="(id) => playerStore.factionReputation[id]"
        :set-value="
          (id, value) => {
            playerStore.setFactionReputation(id, value);
          }
        "
        :min="0"
        :max="999"
        :default-value="0"
        :border-color="argbToRgba(faction.color)"
        @input="updateFactionReputation"
      />
    </div>
    <item-selection />
  </tab-content-wrapper>
</template>

<style lang="scss" scoped>
.sections {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: $xxxlg;
}

.skill-bubbles {
  display: grid;
  grid-template-columns: repeat(3, max-content);
  justify-content: center;

  column-gap: $md;
  row-gap: $md;
}

.faction-bubbles {
  display: grid;
  grid-template-columns: repeat(3, max-content);
  justify-content: center;

  column-gap: $md;
  row-gap: $md;
}
</style>
