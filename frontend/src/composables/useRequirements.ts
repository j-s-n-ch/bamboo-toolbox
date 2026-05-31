import type { Ref } from "vue";
import { intersect } from "@/utils/intersect";
import { useActivityStore } from "@/store/activity";
import { usePlayerStore } from "@/store/player";
import { useItemsStore } from "@/store/items";
import { useDataStore } from "@/store/data";
import type { Requirement, RequirementItem, RequirementSegment, RequirementSource } from "@/domain/types/common";
import type { ActivityDetail } from "@/domain/types/activity";
import type { ActivityNone } from "@/domain/constants/activityNone";
import type { RecipeDetail } from "@/domain/types/recipe";
import type { LocationDetail } from "@/domain/types/location";
import type { ServiceDetail } from "@/domain/types/service";
import type { Keyword } from "@/domain/types/keyword";
import { serviceTiers } from "@/domain/constants/services";
import {
  getLevelRequirementsMap,
  mergeRequirements,
} from "@/domain/requirements/requirementUtils";
import {
  checkRequirement as pureCheckRequirement,
  checkRequirements as pureCheckRequirements,
} from "@/domain/requirements/checkRequirement";
import icons from "@/constants/iconPaths";
import { capitalize } from "@/utils/string";
import { ItemDetail } from "@/domain/types";
import { n } from "@/utils/number";

// Re-export pure functions so callers only need one import.
export { getLevelRequirementsMap, mergeRequirements };

// ---------------------------------------------------------------------------
// Context types
// ---------------------------------------------------------------------------



/**
 * All reactive references the composable reads when evaluating requirements.
 * Component authors pass this as `ctx`; individual `checkRequirement` calls may
 * override it via the optional second `context` argument.
 */
export type RequirementContext = {
  equippedGear: Ref<RequirementItem[]>;
  activity: Ref<ActivityDetail | ActivityNone | null>;
  recipe: Ref<RecipeDetail | ActivityNone | null>;
  service?: Ref<ServiceDetail | null>;
  location: Ref<LocationDetail | null>;
  segments: Ref<RequirementSegment[]>;
  characterLevel: Ref<number>;
  skillLevels: Ref<Record<string, number>>;
  achievementPoints: Ref<number>;
  factionReputation: Ref<Record<string, number> | null>;
  source: Ref<RequirementSource | null>;
  allGearItems: Ref<Record<string, { name: string; icon: string }>>;
  inputItem?: Ref<ItemDetail>;
};

/** A single rendered requirement entry ready for display in the UI. */
export type RequirementDisplay = {
  prefix?: string;
  text: string;
  icon?: string;
  active: boolean;
};

export type RequirementDisplayType = "stat" | "item";

export type RequirementOwner = {
  requirements?: Requirement[] | null;
};

// ---------------------------------------------------------------------------
// Composable
// ---------------------------------------------------------------------------

export function useRequirements(ctx: RequirementContext) {
  const activityStore = useActivityStore();
  const playerStore = usePlayerStore();
  const itemsStore = useItemsStore();
  const dataStore = useDataStore();

  // -------------------------------------------------------------------------
  // Requirement checking
  // -------------------------------------------------------------------------

  const getContextValue = (context: RequirementContext): any => ({
    equippedGear: context.equippedGear.value,
    characterLevel: context.characterLevel.value,
    skillLevels: context.skillLevels.value,
    achievementPoints: context.achievementPoints.value,
    factionReputation: context.factionReputation.value,
    source: context.source.value,
    activity: context.activity.value,
    recipe: context.recipe.value,
    location: context.location.value,
    segments: context.segments.value,
    skillsMap: playerStore.skillsMap,
    ownedItems: itemsStore.ownedItems,
    service: context.service?.value ?? activityStore.service,
    inputItem: context.inputItem?.value,
  });

  const checkRequirements = (
    reqs: Requirement[] | null | undefined,
    context: RequirementContext = ctx,
  ): boolean => {
    return pureCheckRequirements(reqs, getContextValue(context));
  };

  const canBeEquipped = (
    item: RequirementOwner | null | undefined,
    context: RequirementContext = ctx,
  ): boolean => checkRequirements(item?.requirements, context);

  const checkRequirement = (
    req: Requirement,
    context: RequirementContext = ctx,
  ): boolean => {
    return pureCheckRequirement(req, getContextValue(context));
  };

  // -------------------------------------------------------------------------
  // Requirement display text
  // -------------------------------------------------------------------------

  const mapRequirementsText = (
    requirements: Requirement[],
    requirementsActive: boolean[],
    displayType: RequirementDisplayType = "stat",
  ): RequirementDisplay[] => {
    return requirements.map((req, idx) => {
      const { opposite } = req;
      const active = requirementsActive[idx];
      const requirementPrefix =
        displayType === "item"
          ? `Requires${opposite ? " NOT" : ""}`
          : `While${opposite ? " NOT" : ""}`;

      let out: Omit<RequirementDisplay, "active"> | undefined;

      switch (req.type) {
        case "mainSkill": {
          const skill = playerStore.skillsMap[req.requirement.skill];
          out = {
            prefix: requirementPrefix,
            text: skill.name,
            icon: skill.icon,
          };
          break;
        }

        case "mainSkillType":
          out = {
            prefix: `${requirementPrefix} doing`,
            text: `${req.requirement.type} skills`,
            icon: "",
          };
          break;

        case "traveling":
          out = { prefix: requirementPrefix, text: "Traveling", icon: "" };
          break;

        case "service": {
          const { keywords, serviceKeyword, tier } = req.requirement;
          const reqKeywords = keywords && keywords.length ? [...keywords] : [];
          if (serviceKeyword) reqKeywords.push(serviceKeyword);

          out = {
            prefix: "Requires",
            text: reqKeywords.length
              ? `${tier}+ ${reqKeywords.join(", ")} service`
              : `${tier}+ service`,
            icon: "",
          };
          break;
        }

        case "locationHasKeywords": {
          const resolvedKw = req.requirement.keywords
            .map(dataStore.getKeywordById)
            .filter((kw): kw is Keyword => kw !== null)[0];
          if (resolvedKw) {
            out = {
              prefix: `${requirementPrefix} in`,
              text: `${resolvedKw.name} location`,
              icon: resolvedKw.icon,
            };
          }
          break;
        }

        case "realm": {
          const realm = playerStore.factionsMap[req.requirement.realm];
          out = {
            prefix: `${requirementPrefix} in`,
            text: `${realm.name} area`,
            icon: realm.icon,
          };
          break;
        }

        case "distinctKeywordItemsEquipped": {
          const { keywords, quantity } = req.requirement;
          const resolvedKw = keywords
            .map(dataStore.getKeywordById)
            .filter((kw): kw is Keyword => kw !== null)[0];
          if (resolvedKw) {
            out = {
              prefix: `${requirementPrefix} wearing ${quantity}`,
              text: resolvedKw.name,
              icon: resolvedKw.icon,
            };
          }
          break;
        }

        case "distinctKeywordItemInInventory": {
          const { keywords, quantity } = req.requirement;
          const resolvedKw = keywords
            .map(dataStore.getKeywordById)
            .filter((kw): kw is Keyword => kw !== null)[0];
          if (resolvedKw) {
            out = {
              prefix: `${requirementPrefix} having ${quantity > 1 ? quantity : ""}`,
              text: `${resolvedKw.name} in inventory`,
              icon: resolvedKw.icon,
            };
          }
          break;
        }

        case "keywordEquipped": {
          const kw = dataStore.getKeywordById(req.requirement.keyword);
          if (kw) out = { prefix: "Requires", text: kw.name, icon: kw.icon };
          break;
        }

        case "keywordWithLevelEquipped": {
          const { keyword, level, skill } = req.requirement;
          const kw = dataStore.getKeywordById(keyword);
          if (kw) {
            out = {
              prefix: "Have",
              text: `${kw.name} that requires at least ${level} ${skill}`,
              icon: kw.icon,
            };
          }
          break;
        }

        case "achievementPoint":
          out = {
            prefix: "Have",
            text: `${req.requirement.value} achievement point${req.requirement.value !== 1 ? "s" : ""}`,
            icon: "assets/icons/text/general_icons/achievement_point.png",
          };
          break;

        case "historyData": {
          const { category, data, value } = req.requirement;
          const act = activityStore.activitiesMap[data];
          if (category === "stepsWalkedActivity" && act) {
            out = {
              prefix: `Have taken ${value} steps on the`,
              text: `${act.name} activity`,
              icon: act.icon,
            };
          } else if (category === "actionCompleted" && act) {
            out = {
              prefix: `${opposite ? "NOT " : ""}Have completed`,
              text: `${act.name} activity ${value} times`,
              icon: act.icon,
            };
          } else if (category === "stepsWalkedTraveling") {
            out = {
              text: `Walk a total amount of steps dedicated to travel. ${value}`,
            };
          }
          break;
        }

        case "characterLevel": {
          const { level } = req.requirement;
          out = {
            prefix: requirementPrefix,
            text: `Character level ${level}`,
            icon: icons.character,
          };
          break;
        }

        case "skillLevel": {
          const { skill, level } = req.requirement;
          const skillData = playerStore.skillsMap[skill];
          out = {
            prefix: `${requirementPrefix} at least ${level}`,
            text: skillData.name,
            icon: skillData.icon,
          };
          break;
        }

        case "skillTypeLevel": {
          const { type, relativeLevel } = req.requirement;
          const skillsByType = Object.entries(playerStore.skillsMap).filter(
            ([, s]) => s.type === type,
          );
          const skillIds = skillsByType.map(([id]) => id);
          const [, skill] = skillsByType[0];
          const target = relativeLevel * 100;
          const current = skillIds.reduce(
            (a, b) => a + playerStore.skillLevels[b] - 1,
            0,
          );
          
          out = {
            prefix: `Have ${n(target)}% towards maximum`,
            text: `${capitalize(skill.type)} level (${n(Math.min(current / skillIds.length, target))}/${n(target)})`,
            icon: skill.typeIcon,
          };
          break;
        }

        case "totalSkillLevel": {
          const { levels } = req.requirement;
          const current = Object.values(playerStore.skillLevels).reduce(
            (a, b) => a + b,
            0,
          );
          out = {
            text: `Have ${Math.min(current, levels)}/${levels} total level`,
          };
          break;
        }

        case "totalSkillLevelUps": {
          const { levels } = req.requirement;
          const current = Object.values(playerStore.skillLevels).reduce(
            (a, b) => a + b - 1,
            0,
          );
          out = {
            text: `Level up your skills ${Math.min(current, levels)}/${levels} times`,
          };
          break;
        }

        case "activityType": {
          const { activity: reqActivity, keywords: reqKeywords } =
            req.requirement;
          const act = reqActivity
            ? activityStore.activitiesMap[reqActivity]
            : undefined;
          if (reqKeywords?.length) {
            const kw = dataStore.keywordsMap[reqKeywords[0]];
            if (kw) {
              out = {
                prefix: `${requirementPrefix} doing`,
                text: `${kw.name} activity`,
                icon: kw.icon,
              };
            }
          } else if (act) {
            out = {
              prefix: `${requirementPrefix} doing`,
              text: `${act.name} activity`,
              icon: act.icon,
            };
          }
          break;
        }

        case "itemAnywhere":
        case "itemAnywhereWithYou": {
          const item = itemsStore.allGearItems[req.requirement.item];
          if (item) out = { prefix: "Own a", text: item.name, icon: item.icon };
          break;
        }

        case "gameData": {
          const { gameDataId, data } = req.requirement;
          const rep = (JSON.parse(data) as { double?: number }).double ?? 0;
          const reputationFaction = Object.values(playerStore.factions).find(
            ({ reputation }) => reputation === gameDataId,
          );
          if (reputationFaction) {
            out = {
              prefix: `Requires ${rep}`,
              text: `${reputationFaction.name} reputation`,
              icon: reputationFaction.icon,
            };
          }
          break;
        }

        case "itemEquipped": {
          const item = itemsStore.allGearItems[req.requirement.item];
          if (item) {
            out = {
              prefix: "Have",
              text: `${item.name} equipped`,
              icon: item.icon,
            };
          }
          break;
        }

        case "abilityAvailable": {
          const ability = dataStore.abilitiesMap[req.requirement.ability];
          if (ability) {
            out = {
              prefix: "While having",
              text: `${ability.name} ability available`,
              icon: ability.icon,
            };
          }
          break;
        }
      }

      if (out) return { ...out, active };

      // Fallback for unhandled / unknown requirement types
      return { text: req.type, icon: "", active };
    });
  };

  return {
    checkRequirement,
    checkRequirements,
    canBeEquipped,
    mapRequirementsText,
    mergeRequirements,
    getLevelRequirementsMap,
  };
}
