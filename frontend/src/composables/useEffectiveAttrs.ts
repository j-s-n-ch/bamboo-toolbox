import { computed, type ComputedRef, type Ref } from "vue";
import { useRequirements, type RequirementContext } from "./useRequirements";
import { useLevelBonus, type LevelBonusContext } from "./useLevelBonus";
import { usedAttrs, type Attribute } from "@/domain/quality/qualityAttrs";
import { toDeepRaw } from "../utils/rawData";
import { makePseudoStat } from "@/domain/gear/pseudoStat";
import type { Requirement } from "@/domain/types/common";
import type { Stat, ItemDetail } from "@/domain/types/item";
import type { ServiceDetail } from "@/domain/types/service";
import type { LevelBonusAttr } from "@/domain/levelBonus";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * Minimal shape of a single entry in the effective-attrs collection.
 * All three sources (gear, level-bonus, service) satisfy this interface.
 */
export type EffectiveAttrEntry = {
  requirements: Requirement[];
  stats: Stat[];
  item: { id: string; name: string; icon: string };
};

type StatBucket = {
  sum: number;
  positive: number;
  negative: number;
};

export type StatTotals = Record<
  string,
  { flat: StatBucket; percent: StatBucket }
>;

export type EffectiveAttrsContext = LevelBonusContext & {
  ownedItemsByCategory: (category: string) => ItemDetail[];
  service: Ref<ServiceDetail | null>;
};

// ---------------------------------------------------------------------------
// Composable
// ---------------------------------------------------------------------------

export function useEffectiveAttrs(ctx: EffectiveAttrsContext): {
  allAttrs: ComputedRef<EffectiveAttrEntry[]>;
  effectiveAttrs: ComputedRef<EffectiveAttrEntry[]>;
  totalsByStat: ComputedRef<StatTotals>;
} {
  const { checkRequirements } = useRequirements(ctx);
  const { workEfficiencyBonus, qualityOutcomeBonus } = useLevelBonus(ctx);

  const allEquippedItems = computed(() => {
    const gearSet = ctx.equippedGear.value as ItemDetail[];

    const ownedCollectibles = ctx.ownedItemsByCategory("collectibles");

    return [...ownedCollectibles, ...gearSet]
      .map((item) => {
        const rawItem = toDeepRaw(item);
        return {
          ...item,
          attrs: usedAttrs(rawItem, rawItem.quality),
        };
      })
      .filter(({ attrs }) => attrs.length);
  });

  const allAttrs = computed<EffectiveAttrEntry[]>(() => {
    const mappedAttrs: EffectiveAttrEntry[] = allEquippedItems.value.flatMap(
      (item) => {
        return item.attrs.map((attr: Attribute): EffectiveAttrEntry => {
          const stat =
            attr?.stats?.[0]?.type !== "rollSpecialTable"
              ? attr
              : makePseudoStat(attr);
          return { ...stat, item };
        });
      },
    );

    const effectiveBonus: LevelBonusAttr | null = workEfficiencyBonus.value;
    if (effectiveBonus) {
      mappedAttrs.push(effectiveBonus);
    }

    const qualityBonus: LevelBonusAttr | null = qualityOutcomeBonus.value;
    if (qualityBonus) {
      mappedAttrs.push(qualityBonus);
    }

    if (ctx.service.value?.attributes.length) {
      const service = ctx.service.value;
      const serviceAttrs: EffectiveAttrEntry[] = service.attributes.map(
        (attr) => ({
          ...attr,
          item: service,
        }),
      );
      mappedAttrs.push(...serviceAttrs);
    }

    return mappedAttrs;
  });

  const effectiveAttrs = computed<EffectiveAttrEntry[]>(() =>
    effectiveAttrsWithContext(ctx),
  );

  const effectiveAttrsWithContext = (
    context: RequirementContext,
  ): EffectiveAttrEntry[] => {
    return allAttrs.value.filter(({ requirements }) =>
      checkRequirements(requirements, context),
    );
  };

  const totalsByStatWithContext = (context: RequirementContext): StatTotals => {
    const totals: StatTotals = {};

    for (const attr of effectiveAttrsWithContext(context)) {
      for (const stat of attr.stats) {
        const { type, isPercent, value, isNegative } = stat;

        if (!(type in totals)) {
          totals[type] = {
            flat: {
              sum: 0,
              positive: 0,
              negative: 0,
            },
            percent: {
              sum: 0,
              positive: 0,
              negative: 0,
            },
          };
        }

        const key = isPercent ? "percent" : "flat";
        totals[type][key]["sum"] += value;
        totals[type][key][isNegative ? "negative" : "positive"] += value;
      }
    }

    return totals;
  };

  const totalsByStat = computed<StatTotals>(() => totalsByStatWithContext(ctx));

  return {
    allAttrs,
    effectiveAttrs,
    totalsByStat,
  };
}
