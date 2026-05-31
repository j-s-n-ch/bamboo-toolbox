/**
 * Purpose:
 * Pure requirement checker function that is framework-agnostic.
 * Can be shared by both the frontend Vue/Pinia composable and the Node CLI tinker script.
 *
 * Does NOT:
 * - Import Vue or Pinia.
 * - Access stores or reactive state.
 * - Contain any side effects.
 */

import { intersect } from "../../utils/intersect";
import { serviceTiers } from "../constants/services";
import { getLevelRequirementsMap } from "./requirementUtils";
import type { Requirement, RequirementItem, RequirementSegment, RequirementSource } from "../types/common";
import type { LocationDetail } from "../types/location";
import type { ServiceDetail } from "../types/service";

export interface PureRequirementContext {
  equippedGear: RequirementItem[];
  characterLevel: number;
  skillLevels: Record<string, number>;
  achievementPoints: number;
  factionReputation: Record<string, number> | null;
  source: RequirementSource | null;
  activity: RequirementSource | null;
  recipe: RequirementSource | null;
  location: LocationDetail | null;
  segments: RequirementSegment[];
  skillsMap: Record<string, { type: string }>;
  ownedItems: Record<string, any>;
  service?: ServiceDetail | null;
  inputItem?: { requirements?: Requirement[] | null } | null;
}

export function checkRequirement(req: Requirement, context: PureRequirementContext): boolean {
  const { opposite } = req;

  const getEquippedKeywordCounts = () => {
    const counts: Record<string, number> = {};
    for (const gear of context.equippedGear) {
      if (gear.keywords) {
        for (const kw of gear.keywords) {
          counts[kw] = (counts[kw] || 0) + 1;
        }
      }
    }
    return counts;
  };

  let value = false;

  switch (req.type) {
    case "mainSkill": {
      const { skill } = req.requirement;
      const mainSkill =
        context.activity?.relatedSkillsList?.[0] ||
        context.recipe?.relatedSkills?.[0] ||
        context.source?.relatedSkillsList?.[0] ||
        context.source?.relatedSkills?.[0];
      value = mainSkill === skill;
      break;
    }

    case "mainSkillType": {
      const { type: reqType } = req.requirement;
      const mainSkill =
        context.activity?.relatedSkillsList?.[0] ||
        context.recipe?.relatedSkills?.[0] ||
        context.source?.relatedSkillsList?.[0] ||
        context.source?.relatedSkills?.[0];
      value = mainSkill ? context.skillsMap[mainSkill]?.type === reqType : false;
      break;
    }

    case "locationHasKeywords": {
      const { keywords } = req.requirement;
      if (context.location) {
        value =
          intersect(context.location.keywords, keywords).length ===
          keywords.length;
      } else if (context.segments && context.segments.length > 0) {
        const locationKeywords = context.segments.map(
          ({ from }) => from.keywords,
        );
        value = locationKeywords.some(
          (kw) => intersect(kw, keywords).length === keywords.length,
        );
      }
      break;
    }

    case "achievementPoint":
      value = context.achievementPoints >= req.requirement.value;
      break;

    case "distinctKeywordItemsEquipped": {
      const { keywords, quantity } = req.requirement;
      const counts = getEquippedKeywordCounts();
      value = keywords.every(
        (kw) => (counts[kw] || 0) >= quantity,
      );
      break;
    }

    case "distinctKeywordItemInInventory": {
      value = true;
      break;
    }

    case "historyData":
      value = true;
      break;

    case "realm": {
      const { realm } = req.requirement;
      if (context.location) {
        value =
          context.location.faction === realm ||
          context.location.subFactions?.includes(realm) === true;
      } else if (context.segments && context.segments.length > 0) {
        const factionInfo = context.segments.map(({ from }) => ({
          faction: from.faction,
          subFactions: from.subFactions,
        }));
        value = factionInfo.some(
          ({ faction, subFactions }) =>
            faction === realm || subFactions?.includes(realm) === true,
        );
      }
      break;
    }

    case "traveling": {
      const activity = context.activity || context.source;
      if (activity) value = activity.id === "travelling";
      break;
    }

    case "service": {
      const selectedService = context.service;
      if (!selectedService) {
        value = false;
        break;
      }

      const { keywords, serviceKeyword, tier } = req.requirement;
      const reqKeywords = keywords && keywords.length ? [...keywords] : [];
      if (serviceKeyword) reqKeywords.push(serviceKeyword);

      const selectedTierIndex = serviceTiers.indexOf(
        selectedService.tier as (typeof serviceTiers)[number],
      );
      const reqTierIndex = serviceTiers.indexOf(
        tier as (typeof serviceTiers)[number],
      );

      const tierOk =
        selectedTierIndex >= 0 && reqTierIndex >= 0
          ? selectedTierIndex >= reqTierIndex
          : selectedService.tier === tier;
      const keywordsOk = reqKeywords.every((kw) =>
        selectedService.keywords.includes(kw),
      );

      value = tierOk && keywordsOk;
      break;
    }

    case "gameData": {
      const factionReputation = context.factionReputation;
      if (factionReputation) {
        const { data, gameDataId } = req.requirement;
        const rep = (JSON.parse(data) as { double?: number }).double ?? 0;
        value = factionReputation[gameDataId] >= rep;
      }
      break;
    }

    case "characterLevel": {
      const { level } = req.requirement;
      value = context.characterLevel >= level;
      break;
    }

    case "skillLevel": {
      const { skill, level } = req.requirement;
      value = (context.skillLevels[skill] ?? 1) >= level;
      break;
    }

    case "skillTypeLevel": {
      const { type, relativeLevel } = req.requirement;
      const skillsByType = Object.entries(context.skillsMap).filter(
        ([, s]) => s.type === type,
      );
      const skillIds = skillsByType.map(([id]) => id);
      const maximum = 100 * skillsByType.length;
      const required = relativeLevel * maximum;
      const current = skillIds.reduce(
        (a, id) => a + (context.skillLevels[id] ?? 1) - 1,
        0,
      );
      value = Math.floor(current) >= Math.floor(required);
      break;
    }

    case "activityType": {
      const source = context.source || context.activity;
      if (source) {
        const { activity: reqActivity, keywords: reqKeywords } =
          req.requirement;
        const activityMatches = !reqActivity || source.id === reqActivity;
        const keywordsMatches =
          !reqKeywords?.length ||
          reqKeywords.every((kw) => source.keywords?.includes(kw));
        value = activityMatches && keywordsMatches;
      }
      break;
    }

    case "totalSkillLevel": {
      const current = Object.values(context.skillLevels).reduce(
        (a, b) => a + b,
        0,
      );
      value = current >= req.requirement.levels;
      break;
    }

    case "totalSkillLevelUps": {
      const current = Object.values(context.skillLevels).reduce(
        (a, b) => a + b - 1,
        0,
      );
      value = current >= req.requirement.levels;
      break;
    }

    case "itemAnywhereWithYou":
    case "itemAnywhere":
      value = req.requirement.item in context.ownedItems;
      break;

    case "keywordEquipped":
      value = context.equippedGear.some((gear) =>
        gear.keywords?.includes(req.requirement.keyword),
      );
      break;

    case "keywordWithLevelEquipped": {
      const { keyword, skill, level } = req.requirement;
      value = context.equippedGear.some((gear) => {
        const kwCheck = gear.keywords?.includes(keyword);
        const levelReqs = getLevelRequirementsMap(gear.requirements);
        const levelCheck = skill in levelReqs && levelReqs[skill] >= level;
        return kwCheck && levelCheck;
      });
      break;
    }

    case "inputKeywordWithLevel": {
      if (
        !(
          context.inputItem && "requirements" in context.inputItem
        )
      )
        break;

      const { skill, level } = req.requirement;
      const levelReqs = getLevelRequirementsMap(
        context.inputItem.requirements,
      );
      value = levelReqs[skill] >= level;
      break;
    }

    case "itemEquipped":
      value = context.equippedGear.some(
        ({ id }) => id === req.requirement.item,
      );
      break;

    case "abilityAvailable": {
      const { ability } = req.requirement;
      value = context.equippedGear.some(({ abilities }) =>
        abilities
          ?.flatMap((a: any) => (typeof a === "object" ? a.ability : a))
          .includes(ability),
      );
      break;
    }

    default:
      console.error("unhandled requirement", req);
  }

  return opposite ? !value : value;
}

export function checkRequirements(
  reqs: Requirement[] | null | undefined,
  context: PureRequirementContext,
): boolean {
  if (!reqs || !reqs.length) return true;
  return reqs.every((req) => checkRequirement(req, context));
}
