import { computed } from "vue";
import { useActivityStore } from "@/store/activity";
import { usePlayerStore } from "@/store/player";
import { useItemsStore } from "@/store/items";

export function useLevelBonus() {
  const activityStore = useActivityStore();
  const playerStore = usePlayerStore();
  const itemStore = useItemsStore();

  const activityLevelRequirement = (activity, skill) =>
    activity.levelRequirementsMap[skill];

  const recipeLevelRequirement = (recipe) =>
    recipe.requirements
      .map(({ requirement }) => requirement)
      .filter(
        ({ type, requirement }) =>
          type === "skillLevel" && requirement.skill === skill
      )?.[0] || 1;

  const workEfficiencyBonus = computed(() => {
    if (!activityStore.activitySelected && !activityStore.recipeSelected)
      return null;
    const isActivity = activityStore.activitySelected;
    const activity = isActivity ? activityStore.activity : activityStore.recipe;
    const [skill] = isActivity
      ? activity.relatedSkillsList
      : activity.relatedSkills;
    const levelRequirement = isActivity
      ? activityLevelRequirement(activity, skill)
      : recipeLevelRequirement(activity);
    const playerLevel = playerStore.skillLevels[skill] || 1;

    const levelDiff = Math.min(20, Math.max(playerLevel - levelRequirement, 0));
    const value = levelDiff * 0.0125;

    return {
      id: "work_efficiency_bonus",
      requirements: [],
      stats: [
        {
          isMultiplicative: true,
          isNegative: false,
          isPercent: true,
          name: "Work Efficiency",
          stat: "stat-work_efficiency-b0d308d8-68b6-459d-9959-adb9d97e4535",
          type: "workEfficiency",
          value,
        },
      ],
      item: {
        id: "work_efficiency_bonus",
        name: "From levels above requirement",
        icon: "",
      },
      tables: null,
    };
  });

  return {
    workEfficiencyBonus,
  };
}
