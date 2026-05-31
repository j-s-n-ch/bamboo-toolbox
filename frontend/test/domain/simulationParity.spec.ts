import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import { decodeGearSet } from "@/domain/gearSetExport";
import { parseCharacterImport } from "@/domain/character/characterImport";
import { resolveItemAttrs, buildAllAttrEntries, calculateStatTotals } from "@/domain/effectiveAttrs";
import { calculateSkillModifiers } from "@/domain/skillModifiers";
import { buildWorkEfficiencyBonusAttr, buildQualityOutcomeBonusAttr, calculateWorkEfficiencyBonus, calculateQualityOutcomeBonus } from "@/domain/levelBonus";
import { getLevelRequirementsMap } from "@/domain/requirements/requirementUtils";
import { checkRequirements } from "@/domain/requirements/checkRequirement";

// Load fixture catalog
const catalogPath = path.resolve(__dirname, "../fixtures/parity_catalog.json");
const catalog = JSON.parse(fs.readFileSync(catalogPath, "utf8"));

// Load character data
const saveFilePath = path.resolve(__dirname, "../fixtures/character_data.json");
const rawSaveData = JSON.parse(fs.readFileSync(saveFilePath, "utf8"));

const skillsMap = Object.fromEntries(catalog.skillsList.map((s: any) => [s.id, s]));
const petsCatalogMap = Object.fromEntries(catalog.petsCatalogList.map((p: any) => [p.id, p]));

function parseItemId(itemId: string) {
  const qualityOptions = ["common", "uncommon", "rare", "epic", "legendary", "ethereal"];
  if (itemId.endsWith("_fine")) {
    return { baseId: itemId.slice(0, -5), quality: "consumableFine", hasQualitySuffix: true };
  }
  for (const quality of qualityOptions) {
    const suffix = `_${quality}`;
    if (itemId.endsWith(suffix)) {
      return { baseId: itemId.slice(0, -suffix.length), quality, hasQualitySuffix: true };
    }
  }
  return { baseId: itemId, quality: "common", hasQualitySuffix: false };
}

function normalizeSlotName(slot: string): string {
  return slot.replace("_", "");
}

function determineQuality(
  slot: string,
  baseId: string,
  hasQualitySuffix: boolean,
  explicitQuality: string,
  itemDetail: any,
  ownedItems: Record<string, any>
): string {
  if (!itemDetail) return "common";

  if (slot === "pet") {
    const entry = ownedItems[baseId];
    return String(entry?.petLevel ?? 0);
  }

  const type = itemDetail.type;
  const entry = ownedItems[baseId];

  if (type === "crafted") {
    if (hasQualitySuffix) {
      return explicitQuality;
    }
    return entry?.craftedTier ?? itemDetail.quality ?? "common";
  }
  if (type === "consumable") {
    if (hasQualitySuffix) {
      return explicitQuality;
    }
    if (entry?.consumableFine) return "consumableFine";
    if (entry?.consumableCommon) return "consumableCommon";
    return "consumableCommon";
  }
  return itemDetail.quality ?? "common";
}

describe("CLI Tinker vs Frontend UI Parity", () => {
  catalog.rawCases.forEach((rawCase: any, index: number) => {
    it(`should match parity for Case ${index}: ${rawCase.sourceId}`, () => {
      const code = rawCase.code;
      const sourceId = rawCase.sourceId;
      const targetServiceId = rawCase.targetServiceId;
      const targetStats = rawCase.stats;

      const rawGear = rawSaveData.gear || {};
      const equippedSlots: Record<string, { baseId: string; quality: string; hasQualitySuffix: boolean }> = {};
      for (const [slot, fullId] of Object.entries(rawGear)) {
        if (!fullId) continue;
        const normalizedSlot = normalizeSlotName(slot);
        const { baseId, quality, hasQualitySuffix } = parseItemId(fullId as string);
        equippedSlots[normalizedSlot] = { baseId, quality, hasQualitySuffix };
      }

      // Decode gearset
      const decoded = decodeGearSet(code);
      expect(decoded.success).toBe(true);
      if (!decoded.success) return;

      const slotsToClear = [
        "head", "cape", "back", "chest", "primary", "secondary", "hands", "legs", "neck", "feet",
        "ring1", "ring2", "tool1", "tool2", "tool3", "tool4", "tool5", "tool6", "pet"
      ];
      for (const slot of slotsToClear) {
        delete equippedSlots[slot];
      }

      for (const { type, index: slotIndex, item } of decoded.data.items as any[]) {
        const slotName = ["ring", "tool"].includes(type) ? `${type}${slotIndex + 1}` : type;
        if (!item) continue;
        const parsed = JSON.parse(item);
        if (parsed && parsed.id) {
          const baseId = catalog.idMap[parsed.id] || parsed.id;
          const quality = parsed.quality || "common";
          equippedSlots[slotName] = { baseId, quality, hasQualitySuffix: true };
        }
      }

      // Resolve items map
      const itemsMap: Record<string, any> = {};
      Object.values(equippedSlots).forEach((slotInfo) => {
        const item = catalog.itemsMap[slotInfo.baseId];
        if (item) itemsMap[item.id] = item;
      });
      if (rawSaveData.collectibles && Array.isArray(rawSaveData.collectibles)) {
        rawSaveData.collectibles.forEach((id: string) => {
          const { baseId } = parseItemId(id);
          const item = catalog.itemsMap[baseId];
          if (item) itemsMap[item.id] = item;
        });
      }

      // Parse character import
      const parsedChar = parseCharacterImport(
        rawSaveData,
        Object.keys(skillsMap),
        {},
        itemsMap,
        {},
        petsCatalogMap,
        false
      );

      // Re-build equipped items list
      const equippedGearList: any[] = [];
      for (const [slot, slotInfo] of Object.entries(equippedSlots)) {
        const itemDetail = itemsMap[slotInfo.baseId];
        if (itemDetail) {
          const resolvedQuality = determineQuality(
            slot,
            slotInfo.baseId,
            slotInfo.hasQualitySuffix,
            slotInfo.quality,
            itemDetail,
            parsedChar.ownedItems
          );
          equippedGearList.push({
            ...itemDetail,
            quality: resolvedQuality
          });
        }
      }

      const collectiblesList: any[] = [];
      if (rawSaveData.collectibles && Array.isArray(rawSaveData.collectibles)) {
        for (const itemId of rawSaveData.collectibles) {
          const { baseId } = parseItemId(itemId);
          const itemDetail = itemsMap[baseId];
          if (itemDetail) {
            const resolvedQuality = determineQuality(
              "collectible",
              baseId,
              false,
              "common",
              itemDetail,
              parsedChar.ownedItems
            );
            collectiblesList.push({
              ...itemDetail,
              quality: resolvedQuality
            });
          }
        }
      }

      const ownedItems: Record<string, boolean> = {};
      if (rawSaveData.inventory) {
        for (const itemId of Object.keys(rawSaveData.inventory)) {
          ownedItems[parseItemId(itemId).baseId] = true;
        }
      }
      if (rawSaveData.bank) {
        for (const itemId of Object.keys(rawSaveData.bank)) {
          ownedItems[parseItemId(itemId).baseId] = true;
        }
      }
      if (rawSaveData.collectibles) {
        if (Array.isArray(rawSaveData.collectibles)) {
          for (const itemId of rawSaveData.collectibles) {
            if (typeof itemId === "string") {
              ownedItems[parseItemId(itemId).baseId] = true;
            }
          }
        } else {
          for (const itemId of Object.keys(rawSaveData.collectibles)) {
            ownedItems[parseItemId(itemId).baseId] = true;
          }
        }
      }
      if (rawSaveData.consumables) {
        for (const itemId of Object.keys(rawSaveData.consumables)) {
          ownedItems[parseItemId(itemId).baseId] = true;
        }
      }
      for (const slotInfo of Object.values(equippedSlots)) {
        ownedItems[slotInfo.baseId] = true;
      }

      const source = catalog.sourcesMap[sourceId];
      expect(source).toBeDefined();

      // Resolve service for a given location and source
      function resolveService(loc: any, src: any) {
        if (targetServiceId) {
          return catalog.servicesMap[targetServiceId] || null;
        }
        if (!loc || !loc.serviceList || loc.serviceList.length === 0) {
          return null;
        }
        const serviceReq = src.requirements?.find((r: any) => r.type === "service");
        if (!serviceReq) {
          return null;
        }
        const { keywords, serviceKeyword } = serviceReq.requirement;
        const reqKeywords = keywords && keywords.length ? [...keywords] : [];
        if (serviceKeyword) reqKeywords.push(serviceKeyword);

        for (const sId of loc.serviceList) {
          const s = catalog.servicesMap[sId];
          if (s && s.keywords) {
            const hasAll = reqKeywords.every((kw: string) => s.keywords.includes(kw));
            if (hasAll) return s;
          }
        }
        return catalog.servicesMap[loc.serviceList[0]] || null;
      }

      // Gather candidate locations
      const candidates: any[] = [];
      if (targetServiceId) {
        for (const locId in catalog.locationsMap) {
          const loc = catalog.locationsMap[locId];
          if (loc.serviceList && loc.serviceList.includes(targetServiceId)) {
            candidates.push(loc);
          }
        }
      } else if (catalog.isActivityMap[sourceId]) {
        for (const locId in catalog.locationsMap) {
          const loc = catalog.locationsMap[locId];
          if (loc.activityList && loc.activityList.includes(sourceId)) {
            candidates.push(loc);
          }
        }
      } else {
        const vast = catalog.locationsMap["vastalume"];
        if (vast) candidates.push(vast);
      }

      if (candidates.length === 0) {
        const vast = catalog.locationsMap["vastalume"];
        if (vast) candidates.push(vast);
      }

      const skillsMapFromReqs = getLevelRequirementsMap(source.requirements);
      const activitySelected = catalog.isActivityMap[sourceId];
      const mainSkill = activitySelected
        ? source.relatedSkillsList?.[0]
        : source.relatedSkills?.[0];
      const requiredLevel = skillsMapFromReqs[mainSkill] || 1;
      const playerSkillLevel = parsedChar.skillLevels[mainSkill] || 1;

      // Level Surplus skilling bonuses
      const weBonusVal = calculateWorkEfficiencyBonus({
        playerLevel: playerSkillLevel,
        levelRequirement: requiredLevel,
        isTravelling: false
      });
      const qoBonusVal = calculateQualityOutcomeBonus({
        playerLevel: playerSkillLevel,
        levelRequirement: requiredLevel
      });

      const workEfficiencyBonus = buildWorkEfficiencyBonusAttr(weBonusVal);
      const qualityOutcomeBonus = buildQualityOutcomeBonusAttr(qoBonusVal);

      // Loop through all candidate locations to find the one matching the target stats closest
      let bestLocation = candidates[0] || null;
      let bestService = null;
      let bestDiff = Infinity;
      let bestModifiers: any = null;
      let bestRequirementCtx: any = null;

      const weTargetParts = targetStats["Work Efficiency"].split("/");
      const targetUncappedWE = parseFloat(weTargetParts[0].replace("%", "").trim()) / 100;
      const targetDoubleAction = targetStats["Double Action Chance"] ? parseFloat(targetStats["Double Action Chance"].replace("%", "").trim()) / 100 : null;

      for (const cand of candidates) {
        const candService = resolveService(cand, source);
        const requirementCtx = {
          equippedGear: equippedGearList,
          characterLevel: parsedChar.characterLevel,
          skillLevels: parsedChar.skillLevels,
          achievementPoints: parsedChar.achievementPoints,
          factionReputation: parsedChar.factionReputations || {},
          source: {
            id: source.id,
            keywords: source.keywords || [],
            relatedSkillsList: source.relatedSkillsList,
            relatedSkills: source.relatedSkills
          },
          skillsMap,
          ownedItems,
          location: cand,
          service: candService
        };

        const resolvedGear = resolveItemAttrs([...equippedGearList, ...collectiblesList]);
        const allEntries = buildAllAttrEntries(
          resolvedGear,
          workEfficiencyBonus,
          qualityOutcomeBonus,
          candService,
          []
        );

        const effectiveEntries = allEntries.filter(entry =>
          checkRequirements(entry.requirements, requirementCtx)
        );

        const totals = calculateStatTotals(effectiveEntries);
        const modifiers = calculateSkillModifiers(totals, source, activitySelected);

        let diff = Math.abs(modifiers.uncappedWorkEfficiency - targetUncappedWE);
        if (targetDoubleAction !== null) {
          diff += Math.abs(modifiers.doubleAction - targetDoubleAction);
        }

        if (diff < bestDiff) {
          bestDiff = diff;
          bestLocation = cand;
          bestService = candService;
          bestModifiers = modifiers;
          bestRequirementCtx = requirementCtx;
        }
      }

      expect(bestLocation).not.toBeNull();
      expect(bestModifiers).not.toBeNull();

      const location = bestLocation;
      const service = bestService;
      const modifiers = bestModifiers!;
      const requirementCtx = bestRequirementCtx!;

      // Verify Service station requirements
      if (targetServiceId) {
        const serviceReqsMet = checkRequirements(service?.requirements || [], requirementCtx);
        const targetReqsMet = targetStats["Service Requirements Met"] === "true";
        expect(serviceReqsMet).toBe(targetReqsMet);
      }

      // Verify Work Efficiency
      const simulatedUncappedWE = modifiers.uncappedWorkEfficiency;
      expect(simulatedUncappedWE).toBeCloseTo(targetUncappedWE, 2);

      if (weTargetParts.length > 1) {
        const targetWE = parseFloat(weTargetParts[1].replace("%", "").trim()) / 100;
        expect(modifiers.maxWorkEfficiency).toBeCloseTo(targetWE, 2);
      }

      // Verify Steps per action
      const targetStepsPerAction = parseFloat(targetStats["Steps per action"] || targetStats["Steps per completion"]);
      expect(modifiers.stepsPerCompletion).toBeCloseTo(targetStepsPerAction, 1);

      // Verify Steps per item
      const rewardCount = !activitySelected && source.itemRewards ? Object.values(source.itemRewards)[0] as number : 1;
      const targetStepsPerItem = parseFloat(targetStats["Steps per item"] || targetStats["Steps per reward roll"]);
      expect(modifiers.stepsPerRewardRoll / rewardCount).toBeCloseTo(targetStepsPerItem, 2);

      // Verify Crafts / Mat
      if (targetStats["Crafts / Mat"] || targetStats["craftsPerMaterial"]) {
        const targetCraftsPerMat = parseFloat(targetStats["Crafts / Mat"] || targetStats["craftsPerMaterial"]);
        expect(modifiers.craftsPerMaterial).toBeCloseTo(targetCraftsPerMat, 2);
      }

      // Verify Double Action Chance
      if (targetStats["Double Action Chance"]) {
        const targetDoubleActionVal = parseFloat(targetStats["Double Action Chance"].replace("%", "").trim()) / 100;
        expect(modifiers.doubleAction).toBeCloseTo(targetDoubleActionVal, 2);
      }

      // Verify Double Reward Chance
      if (targetStats["Double Reward Chance"]) {
        const targetDoubleRewards = parseFloat(targetStats["Double Reward Chance"].replace("%", "").trim()) / 100;
        expect(modifiers.doubleRewards).toBeCloseTo(targetDoubleRewards, 2);
      }

      // Verify No Materials Consumed Chance
      if (targetStats["No Materials Consumed Chance"]) {
        const targetNoMat = parseFloat(targetStats["No Materials Consumed Chance"].replace("%", "").trim()) / 100;
        expect(modifiers.noMaterialsConsumed).toBeCloseTo(targetNoMat, 2);
      }
    });
  });
});
