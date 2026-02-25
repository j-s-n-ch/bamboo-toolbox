import { useRequirements, type RequirementContext } from "@/composables/useRequirements";
import { getRawData } from "@/utils/rawData";
import { usedAttrs, type Attribute } from "@/domain/quality/qualityAttrs";
import { useLootTables, type LootTablesContext } from "./useLootTables";
import type { Requirement } from "@/domain/types/common";
import type { LootTableRef } from "@/domain/types/common";
import type { LevelBonusGearItem } from "@/composables/useLevelBonus";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Minimal item shape used by the display helpers. */
type ItemForDisplay = {
  abilities?: (string | { ability: string; unlockLevel: string })[];
  keywords?: string[];
  tables?: LootTableRef[];
  quality: string | null;
  [key: string]: unknown;
};

/**
 * Minimal activity/recipe shape consumed by the display helpers.
 * Both `ActivityDetail` and `RecipeDetail` satisfy this at runtime.
 */
type ActivityLike = {
  name: string;
  requirements: Requirement[];
  relatedSkillsList?: string[];
  relatedSkills?: string[];
  /** Present on recipes only; used by the quality-outcome filter. */
  itemRewards?: Record<string, number>;
};

type ServiceLike = {
  requirements: Requirement[];
} | null;

// ---------------------------------------------------------------------------
// Composable
// ---------------------------------------------------------------------------

export function useShowItemForActivity(ctx: LootTablesContext): {
  showItemForActivity: (
    itemProxy: ItemForDisplay,
    activity?: ActivityLike | null,
    service?: ServiceLike,
    quality?: string | null,
    isRecipe?: boolean | null,
  ) => boolean;
  usefulKeywords: (
    item: ItemForDisplay,
    activity: ActivityLike,
    service: ServiceLike,
  ) => boolean[];
  usefulAbilities: (
    item: ItemForDisplay,
    activity: ActivityLike | null,
  ) => string[] | false;
  usefulAttrs: (
    item: ItemForDisplay,
    activity: ActivityLike,
    quality: string | null,
    isRecipe: boolean | null,
  ) => Attribute[];
  itemTables: (item: ItemForDisplay) => LootTableRef[];
} {
  const { checkRequirements } = useRequirements(ctx as unknown as RequirementContext);
  const { hasCollectibleDrops, hasFineDrops } = useLootTables(ctx);

  const usefulAbilities = (
    item: ItemForDisplay,
    activity: ActivityLike | null,
  ): string[] | false => {
    if (!activity || !item.abilities) return false;

    const abilityReqs = activity.requirements
      .filter((req): req is typeof req & { type: "abilityAvailable" } =>
        req.type === "abilityAvailable",
      )
      .map(({ requirement }) => requirement.ability);

    const itemAbilityNames = (item.abilities as (string | { ability: string; unlockLevel: string })[])
      .flatMap((abilityVal) => {
        if (typeof abilityVal === "string") return abilityVal;
        const { ability, unlockLevel } = abilityVal;
        return (item.quality ?? "") >= unlockLevel ? ability : null;
      })
      .filter((value): value is string => value !== null);

    return abilityReqs.filter((ability) => itemAbilityNames.includes(ability));
  };

  const usefulKeywords = (
    item: ItemForDisplay,
    activity: ActivityLike,
    service: ServiceLike,
  ): boolean[] => {
    if (!activity || !item.keywords) return [];

    const travelReqs: Requirement[] =
      activity.name === "Travelling"
        ? (ctx.segments.value as unknown as { requirements: Requirement[] }[]).flatMap(
            ({ requirements }) => requirements,
          )
        : [];
    const kwReqs = activity.requirements || [];
    const serviceRequirements = service?.requirements || [];

    const matchingKeywordRequirements = [...kwReqs, ...serviceRequirements, ...travelReqs]
      .filter(({ type }) => type.toLowerCase().includes("keyword"))
      .map((req) => {
        const { requirement } = req as Requirement & { requirement: Record<string, unknown> };
        return "keyword" in requirement
          ? (item.keywords as string[]).includes(requirement["keyword"] as string)
          : (requirement["keywords"] as string[]).some((kw) =>
              (item.keywords as string[]).includes(kw),
            );
      });

    return matchingKeywordRequirements.filter((value) => value);
  };

  const usefulAttrs = (
    item: ItemForDisplay,
    activity: ActivityLike,
    quality: string | null,
    isRecipe: boolean | null,
  ): Attribute[] => {
    const baseAttrs = usedAttrs(item as unknown as Parameters<typeof usedAttrs>[0], quality ?? "common");

    const filterActivityOnlyAttrs = (attr: Attribute): boolean => {
      if (!isRecipe) return true;
      const activityOnlyAttrs = [
        "Fine material finding",
        "Find gems",
        "Find bird nests",
        "Find collectibles",
      ];
      return !activityOnlyAttrs.includes(attr.statText);
    };

    const filterRecipeOnlyAttrs = (attr: Attribute): boolean => {
      if (isRecipe) return true;
      const recipeOnlyAttrs = ["No materials consumed", "Quality outcome"];
      return !recipeOnlyAttrs.includes(attr.statText);
    };

    const filterCO = (attr: Attribute, act: ActivityLike): boolean => {
      const statIsCO = attr.statText === "Quality outcome";
      if (!statIsCO) return true;
      if (!isRecipe) return false;

      const benefitsCO = Object.keys(act.itemRewards ?? {}).some(
        (itemId) =>
          itemId in ctx.allGearItems.value &&
          (ctx.allGearItems.value[itemId] as LevelBonusGearItem).type === "crafted",
      );

      return statIsCO && benefitsCO;
    };

    const filterFindCollectibles = (attr: Attribute): boolean => {
      const statIsFindCollectibles = attr.statText === "Find collectibles";
      if (!statIsFindCollectibles) return true;
      return hasCollectibleDrops.value;
    };

    const filterFineMaterialFinding = (attr: Attribute): boolean => {
      const statIsFineMaterialFinding = attr.statText === "Fine material finding";
      if (!statIsFineMaterialFinding) return true;
      return hasFineDrops.value;
    };

    const unfilteredRequirementTypes = ["distinctKeywordItemsEquipped"];

    return baseAttrs.filter((attr) => {
      const usedRequirements =
        attr?.requirements?.filter(
          (req) => !unfilteredRequirementTypes.includes(req.type),
        ) || [];

      return (
        filterActivityOnlyAttrs(attr) &&
        filterFindCollectibles(attr) &&
        filterFineMaterialFinding(attr) &&
        filterRecipeOnlyAttrs(attr) &&
        filterCO(attr, activity) &&
        checkRequirements(usedRequirements) &&
        attr.stats.some((stat) => !stat.isNegative)
      );
    });
  };

  const itemTables = (item: ItemForDisplay): LootTableRef[] => {
    return (item.tables as LootTableRef[]) || [];
  };

  const showItemForActivity = (
    itemProxy: ItemForDisplay,
    activity: ActivityLike | null = null,
    service: ServiceLike = null,
    quality: string | null = null,
    isRecipe: boolean | null = null,
  ): boolean => {
    // Use store state if parameters are not provided
    const currentActivity = (activity || ctx.source.value) as ActivityLike | null;
    const currentService = service || ctx.service.value;
    const currentQuality = quality || itemProxy.quality;
    const currentIsRecipe = isRecipe !== null ? isRecipe : ctx.recipeSelected.value;

    if (!ctx.source.value || !currentActivity) return false;

    const item = getRawData(itemProxy);

    const [skill] = currentActivity.relatedSkillsList ??
      currentActivity.relatedSkills ?? [null];
    if (!skill) return true;

    const hasUsefulKeywords =
      usefulKeywords(item, currentActivity, currentService).length > 0;
    const hasUsefulAbilities = (usefulAbilities(item, currentActivity) as string[] | false);
    const hasUsefulAbility =
      hasUsefulAbilities !== false && hasUsefulAbilities.length > 0;

    const usefulAttributes = usefulAttrs(
      item,
      currentActivity,
      currentQuality,
      currentIsRecipe,
    );
    const hasUsefulAttrs = usefulAttributes.length > 0;
    const hasTables = itemTables(item).length > 0;

    return hasUsefulKeywords || hasUsefulAttrs || hasUsefulAbility || hasTables;
  };

  return {
    showItemForActivity,
    usefulKeywords,
    usefulAbilities,
    usefulAttrs,
    itemTables,
  };
}
