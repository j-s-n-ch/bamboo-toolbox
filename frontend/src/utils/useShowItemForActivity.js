import { useActivityStore } from "@/store/activity";
import { useRequirements } from "@/utils/useRequirements";
import { getRawData } from "@/utils/rawData";
import { sumAttrs } from "@/utils/qualityAttrs";

export function useShowItemForActivity() {
  const activityStore = useActivityStore();
  const { checkRequirements } = useRequirements();

  const usefulKeywords = (item, activity, service) => {
    if (!activity) return false;
    const kw = activity?.requiredKeywords || [];
    const requirements = activity?.requirements || [];
    const serviceRequirements = service?.requirements || [];

    const kws = kw?.map(({ keyword }) => keyword) ?? [];
    const kwEquipped =
      [...requirements, ...serviceRequirements]
        ?.filter((req) => req.type === "distinctKeywordItemsEquipped")
        .flatMap(({ requirement }) => requirement.keywords) ?? [];

    if (!(kws || kwEquipped)) return false;
    return item.keywords.filter(
      (keyword) => kws.includes(keyword) || kwEquipped.includes(keyword)
    );
  };

  const usefulAttrs = (item, activity, quality, isRecipe) => {
    const baseAttrs = sumAttrs(
      item.itemAttrs,
      item.itemQualityAttrs || [],
      item.buffs || [],
      quality
    );

    const filterActivityOnlyAttrs = (attr) => {
      const activityOnlyAttrs = [
        "Fine material finding",
        "Find gems",
        "Find bird nests",
        "Find collectibles",
      ];
      return (
        !isRecipe || (isRecipe && activityOnlyAttrs.includes(attr.statText))
      );
    };

    const filterRecipeOnlyAttrs = (attr) => {
      const recipeOnlyAttrs = ["Crafting outcome", "No materials consumed"];
      return (
        isRecipe || (!isRecipe && !recipeOnlyAttrs.includes(attr.statText))
      );
    };

    const usefulAttr = baseAttrs.filter(
      (attr) =>
        filterActivityOnlyAttrs(attr) &&
        filterRecipeOnlyAttrs(attr) &&
        checkRequirements(attr.requirements) &&
        attr.stats.some((stat) => !stat.isNegative)
    );
    return usefulAttr;
  };

  const itemTables = (item) => {
    return item.tables || [];
  };

  const checksSkillRequirements = (item, skill) => {
    const skillReqs = skillsInRequirements(item);
    const requiredSkills = skillReqs.map(
      ({ requirement }) => requirement.skill
    );
    const usesSkill = requiredSkills.includes(skill);
    return usesSkill;
  };

  const skillsInRequirements = (item) => {
    const { requirements } = item;
    if (!requirements) return [];

    return requirements.filter((req) => req.type === "skillLevel");
  };

  const showItemForActivity = (
    itemProxy,
    activity = null,
    service = null,
    quality = null,
    isRecipe = null
  ) => {
    // Use store state if parameters are not provided
    const currentActivity =
      activity ||
      (activityStore.activitySelected && activityStore.activity) ||
      (activityStore.recipeSelected && activityStore.recipe);

    const currentService =
      service || (activityStore.recipeSelected && activityStore.service);

    const currentQuality = quality || itemProxy.quality;

    const currentIsRecipe =
      isRecipe !== null ? isRecipe : activityStore.recipeSelected;

    if (!currentActivity) return false;

    const item = getRawData(itemProxy);

    const [skill] = currentActivity.relatedSkillsList ??
      currentActivity.relatedSkills ?? [null];
    const skillReq = checksSkillRequirements(item, skill);

    const hasUsefulKeywords =
      usefulKeywords(item, currentActivity, currentService).length > 0;
    const hasUsefulAttrs =
      usefulAttrs(item, currentActivity, currentQuality, currentIsRecipe)
        .length > 0;
    const hasTables = itemTables(item).length > 0;

    return (
      !skill ||
      (skill && (skillReq || hasUsefulKeywords || hasUsefulAttrs || hasTables))
    );
  };

  return {
    showItemForActivity,
    usefulKeywords,
    usefulAttrs,
    itemTables,
    checksSkillRequirements,
    skillsInRequirements,
  };
}
