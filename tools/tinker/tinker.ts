import fs from "fs";
import path from "path";
import axios from "axios";
import { fileURLToPath } from "url";

// Resolving ES modules dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import domain logic from frontend/src/domain/ using relative paths
import { parseCharacterImport } from "../../frontend/src/domain/character/characterImport";
import { resolveItemAttrs, buildAllAttrEntries, calculateStatTotals } from "../../frontend/src/domain/effectiveAttrs";
import { calculateSkillModifiers } from "../../frontend/src/domain/skillModifiers";
import { buildWorkEfficiencyBonusAttr, buildQualityOutcomeBonusAttr, calculateWorkEfficiencyBonus, calculateQualityOutcomeBonus } from "../../frontend/src/domain/levelBonus";
import { getLevelRequirementsMap } from "../../frontend/src/domain/requirements/requirementUtils";
import { checkRequirement, checkRequirements } from "../../frontend/src/domain/requirements/checkRequirement";
import { resolveSourceContextTables, resolveGearContextTables, deduplicateAndGroupDrops, mergeTableGroups } from "../../frontend/src/domain/lootTables/contextTables";
import { buildDropItemInfoMap, resolveDropMultiplier } from "../../frontend/src/domain/lootTables/dropInfo";
import { computeGoldTotal, computeTokenTotal } from "../../frontend/src/domain/drops/aggregateDropValue";
import { decodeGearSet } from "../../frontend/src/domain/gearSetExport";

const BACKEND_URL = "http://localhost:3001";

async function main() {
  const args = process.argv.slice(2);
  const isHelp = args.includes("-h") || args.includes("--help");
  const listActivitiesFlag = args.includes("--list-activities");
  const listRecipesFlag = args.includes("--list-recipes");

  let saveArgIdx = args.indexOf("--save");
  if (saveArgIdx === -1) {
    saveArgIdx = args.indexOf("--character-data");
  }
  const saveFilePath = saveArgIdx !== -1 && args[saveArgIdx + 1]
    ? path.resolve(process.cwd(), args[saveArgIdx + 1])
    : path.resolve(__dirname, "../../frontend/test/fixtures/characterImport.json");

  const gearsetArgIdx = args.indexOf("--gearset-code");
  const gearsetCode = gearsetArgIdx !== -1 && args[gearsetArgIdx + 1]
    ? args[gearsetArgIdx + 1]
    : null;

  const activityArgIdx = args.indexOf("--activity");
  const selectedActivityId = activityArgIdx !== -1 ? args[activityArgIdx + 1] : null;

  const recipeArgIdx = args.indexOf("--recipe");
  const selectedRecipeId = recipeArgIdx !== -1 ? args[recipeArgIdx + 1] : null;

  const locationArgIdx = args.indexOf("--location");
  const cliLocationId = locationArgIdx !== -1 && args[locationArgIdx + 1]
    ? args[locationArgIdx + 1]
    : null;

  const serviceArgIdx = args.indexOf("--service");
  const cliServiceId = serviceArgIdx !== -1 && args[serviceArgIdx + 1]
    ? args[serviceArgIdx + 1]
    : null;

  if (isHelp) {
    printHelp();
    return;
  }

  // Check if local backend is running & load skills
  let skillsRes;
  try {
    skillsRes = await axios.get(`${BACKEND_URL}/api/skills`);
  } catch (error) {
    console.error(`\n❌ Error: Local backend server is not running on ${BACKEND_URL}.`);
    console.error("Please run `npm run serve` in the backend directory first.\n");
    process.exit(1);
  }

  const skillsMap = Object.fromEntries(skillsRes.data.map((s: any) => [s.id, s]));

  // Load pets catalog to resolve imported pet levels
  let petsCatalogRes;
  try {
    petsCatalogRes = await axios.get(`${BACKEND_URL}/api/pets`);
  } catch (error: any) {
    console.error(`\n❌ Error: Failed to fetch pets catalog from ${BACKEND_URL}/api/pets:`, error.message);
    process.exit(1);
  }
  const petsCatalogMap = Object.fromEntries(petsCatalogRes.data.map((p: any) => [p.id, p]));

  if (listActivitiesFlag) {
    console.log("⚡ Fetching activities list...");
    const activitiesListRes = await axios.get(`${BACKEND_URL}/api/activities`);
    console.log("\n📋 Available Activities:");
    activitiesListRes.data.forEach((a: any) => {
      console.log(`- ${a.id} (${a.name})`);
    });
    return;
  }

  if (listRecipesFlag) {
    console.log("⚡ Fetching recipes list...");
    const recipesListRes = await axios.get(`${BACKEND_URL}/api/recipes`);
    console.log("\n📋 Available Recipes:");
    recipesListRes.data.forEach((r: any) => {
      console.log(`- ${r.id} (${r.name})`);
    });
    return;
  }

  if (!selectedActivityId && !selectedRecipeId) {
    console.log("\n💡 Hint: Specify an activity or recipe to simulate using --activity or --recipe flags.");
    console.log("Example: npx --prefix frontend vite-node ../tools/tinker/tinker.ts --activity mine_tin_ore");
    return;
  }

  // Load and parse character save data
  if (!fs.existsSync(saveFilePath)) {
    console.error(`❌ Error: Save file not found at ${saveFilePath}`);
    process.exit(1);
  }

  console.log(`💾 Loading character save: ${path.basename(saveFilePath)}`);
  const rawSaveData = JSON.parse(fs.readFileSync(saveFilePath, "utf8"));

  // Extract equipped gear IDs and qualities from save file first
  const rawGear = rawSaveData.gear || {};
  const equippedSlots: Record<string, { baseId: string; quality: string; hasQualitySuffix: boolean }> = {};

  for (const [slot, fullId] of Object.entries(rawGear)) {
    if (!fullId) continue;
    const normalizedSlot = normalizeSlotName(slot);
    const { baseId, quality, hasQualitySuffix } = parseItemId(fullId as string);
    equippedSlots[normalizedSlot] = { baseId, quality, hasQualitySuffix };
  }

  // If gearset code is provided, decode and apply overrides
  if (gearsetCode) {
    let codeStr = gearsetCode;
    if (fs.existsSync(gearsetCode)) {
      codeStr = fs.readFileSync(gearsetCode, "utf8").trim().replace(/\s+/g, "");
    }
    console.log(`📦 Importing gearset code...`);
    const decoded = decodeGearSet(codeStr);
    if (!decoded.success) {
      console.error(`❌ Error decoding gearset: ${decoded.error}`);
      process.exit(1);
    }

    const oldIds = decoded.data.items
      .map((x: any) => x.item ? JSON.parse(x.item)?.id : null)
      .filter((id): id is string => typeof id === "string" && id !== "");

    // Fetch new item IDs mapping from backend
    let idMap: Record<string, string> = {};
    if (oldIds.length > 0) {
      try {
        const idsRes = await axios.post(`${BACKEND_URL}/api/items/ids`, { ids: oldIds });
        idMap = idsRes.data;
      } catch (error: any) {
        console.error("⚠️ Failed to map old item IDs, using IDs as-is:", error.message);
      }
    }

    // Clear standard gear slots represented in the gearset before applying overrides
    const slotsToClear = [
      "head", "cape", "back", "chest", "primary", "secondary", "hands", "legs", "neck", "feet",
      "ring1", "ring2",
      "tool1", "tool2", "tool3", "tool4", "tool5", "tool6",
      "pet"
    ];
    for (const slot of slotsToClear) {
      delete equippedSlots[slot];
    }

    for (const { type, index, item } of decoded.data.items as any[]) {
      const slotName = ["ring", "tool"].includes(type)
        ? `${type}${index + 1}`
        : type;

      if (!item) {
        continue;
      }

      const parsed = JSON.parse(item);
      if (parsed && parsed.id) {
        const baseId = idMap[parsed.id] || parsed.id;
        const quality = parsed.quality || "common";
        // Explicitly set in gearset code, treat as having a suffix (explicit quality)
        equippedSlots[slotName] = { baseId, quality, hasQualitySuffix: true };
      }
    }
  }

  const collectibleIds = Array.isArray(rawSaveData.collectibles)
    ? rawSaveData.collectibles.map((id: any) => parseItemId(id).baseId)
    : [];

  // Separate items and pets
  const itemIds = Array.from(new Set([
    ...Object.entries(equippedSlots)
      .filter(([slot]) => slot !== "pet")
      .map(([, info]) => info.baseId),
    ...collectibleIds
  ]));
  const petIds = Array.from(new Set(
    Object.entries(equippedSlots)
      .filter(([slot]) => slot === "pet")
      .map(([, info]) => info.baseId)
  ));

  console.log("⚡ Fetching simulation details from backend...");

  const itemsMap: Record<string, any> = {};

  // Fetch items batch
  if (itemIds.length > 0) {
    try {
      const equippedItemsRes = await axios.post(`${BACKEND_URL}/api/items/multiple`, { ids: itemIds });
      equippedItemsRes.data.forEach((item: any) => {
        itemsMap[item.id] = item;
      });
    } catch (error) {
      console.log("⚠️ Batch items fetch failed. Fetching items individually to bypass missing items...");
      const fetchPromises = itemIds.map(async (id) => {
        try {
          const res = await axios.get(`${BACKEND_URL}/api/items/${id}`);
          if (res.data) {
            itemsMap[id] = res.data;
          }
        } catch (e) {
          // ignore
        }
      });
      await Promise.all(fetchPromises);
    }
  }

  // Fetch pets batch
  if (petIds.length > 0) {
    try {
      const petsRes = await axios.post(`${BACKEND_URL}/api/pets/multiple`, { ids: petIds });
      petsRes.data.forEach((pet: any) => {
        itemsMap[pet.id] = pet;
      });
    } catch (error) {
      console.log("⚠️ Batch pets fetch failed. Fetching pets individually...");
      const fetchPromises = petIds.map(async (id) => {
        try {
          const res = await axios.get(`${BACKEND_URL}/api/pets/${id}`);
          if (res.data) {
            itemsMap[id] = res.data;
          }
        } catch (e) {
          // ignore
        }
      });
      await Promise.all(fetchPromises);
    }
  }

  // 2. Fetch the selected activity or recipe
  let source: any = null;
  let activitySelected = false;
  let location: any = null;
  let service: any = null;
  let alternativeLocations: any[] = [];

  // Resolve location from CLI override if specified
  if (cliLocationId) {
    try {
      const locRes = await axios.get(`${BACKEND_URL}/api/locations/${cliLocationId}`);
      location = locRes.data;
    } catch (e: any) {
      console.warn(`⚠️ Failed to fetch location ${cliLocationId}:`, e.message);
    }
  }

  // Resolve service from CLI override if specified
  if (cliServiceId) {
    try {
      const srvRes = await axios.get(`${BACKEND_URL}/api/services/${cliServiceId}`);
      service = srvRes.data;
    } catch (e: any) {
      console.warn(`⚠️ Failed to fetch service ${cliServiceId}:`, e.message);
    }
  }

  if (selectedActivityId) {
    const activityRes = await axios.get(`${BACKEND_URL}/api/activities/${selectedActivityId}`);
    source = activityRes.data;
    activitySelected = true;

    if (!location) {
      try {
        const locationsRes = await axios.get(`${BACKEND_URL}/api/locations/search`, {
          params: { activityList: selectedActivityId }
        });
        if (locationsRes.data && locationsRes.data.length > 0) {
          const sortedLocs = [...locationsRes.data].sort((a, b) => a.id.localeCompare(b.id));
          location = sortedLocs[0];
          if (sortedLocs.length > 1) {
            alternativeLocations = sortedLocs.slice(1);
          }
        }
      } catch (e) {
        // ignore
      }
    }

    // Auto-select a matching service for the activity from the location if not explicitly provided
    if (location && !service && location.serviceList && location.serviceList.length > 0) {
      const serviceReq = source.requirements?.find((r: any) => r.type === "service");
      if (serviceReq) {
        try {
          const srvsRes = await axios.post(`${BACKEND_URL}/api/services/multiple`, { ids: location.serviceList });
          const matched = srvsRes.data.find((s: any) => {
            const { keywords, serviceKeyword } = serviceReq.requirement;
            const reqKeywords = keywords && keywords.length ? [...keywords] : [];
            if (serviceKeyword) reqKeywords.push(serviceKeyword);
            return reqKeywords.every((kw: string) => s.keywords.includes(kw));
          });
          if (matched) {
            service = matched;
          } else if (srvsRes.data.length > 0) {
            service = srvsRes.data[0];
          }
        } catch (e) {
          // ignore
        }
      }
    }
  } else if (selectedRecipeId) {
    const recipeRes = await axios.get(`${BACKEND_URL}/api/recipes/${selectedRecipeId}`);
    source = recipeRes.data;
    activitySelected = false;

    // Default to vastalume for recipes if no location is specified, as it contains all workstations
    if (!location) {
      try {
        const locRes = await axios.get(`${BACKEND_URL}/api/locations/vastalume`);
        location = locRes.data;
      } catch (e) {
        // ignore
      }
    }

    // Auto-select a matching service for the recipe from the location if not explicitly provided
    if (location && !service && location.serviceList && location.serviceList.length > 0) {
      const serviceReq = source.requirements?.find((r: any) => r.type === "service");
      if (serviceReq) {
        try {
          const srvsRes = await axios.post(`${BACKEND_URL}/api/services/multiple`, { ids: location.serviceList });
          const matched = srvsRes.data.find((s: any) => {
            const { keywords, serviceKeyword } = serviceReq.requirement;
            const reqKeywords = keywords && keywords.length ? [...keywords] : [];
            if (serviceKeyword) reqKeywords.push(serviceKeyword);
            return reqKeywords.every((kw: string) => s.keywords.includes(kw));
          });
          if (matched) {
            service = matched;
          } else if (srvsRes.data.length > 0) {
            service = srvsRes.data[0];
          }
        } catch (e) {
          // ignore
        }
      }
    }
  }

  console.log(`\n⚙️ Simulating Action: ${source.name} (${source.id})`);
  if (location) {
    console.log(`  • Location: ${location.name} (${location.id})`);
    if (alternativeLocations.length > 0) {
      console.log(`    💡 Note: Also available at: ${alternativeLocations.map(l => `${l.name} (${l.id})`).join(", ")}`);
      console.log(`       Defaulting to simulate at ${location.name}. Use --location <id> to simulate at another.`);
    }
  }
  if (service) {
    console.log(`  • Service Station: ${service.name} (${service.id})`);
  }
  console.log(`  • Work Required: ${source.workRequired}`);
  console.log(`  • Max Work Efficiency: ${source.maxWorkEfficiency}`);

  // Parse character stats
  const parsedChar = parseCharacterImport(
    rawSaveData,
    Object.keys(skillsMap),
    {}, // Factions map
    itemsMap,
    {}, // Current owned items
    petsCatalogMap, // Pets map
    false
  );

  // Re-build equipped items list with resolved quality
  const equippedGearList: any[] = [];
  console.log("\n🛡️ Equipped Gear:");
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
      const qualityDisplay = formatQuality(resolvedQuality, itemDetail.type);
      console.log(`  • [${slot}] ${itemDetail.name} (${qualityDisplay})`);
      equippedGearList.push({
        ...itemDetail,
        quality: resolvedQuality
      });
    } else {
      console.log(`  • [${slot}] ${slotInfo.baseId} (Not found in database)`);
    }
  }

  // Re-build collectibles list with resolved quality
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

  // Parse player owned items for requirement checks
  const ownedItems: Record<string, boolean> = {};
  if (rawSaveData.inventory) {
    for (const itemId of Object.keys(rawSaveData.inventory)) {
      const { baseId } = parseItemId(itemId);
      ownedItems[baseId] = true;
    }
  }
  if (rawSaveData.bank) {
    for (const itemId of Object.keys(rawSaveData.bank)) {
      const { baseId } = parseItemId(itemId);
      ownedItems[baseId] = true;
    }
  }
  if (rawSaveData.collectibles) {
    if (Array.isArray(rawSaveData.collectibles)) {
      for (const itemId of rawSaveData.collectibles) {
        if (typeof itemId === "string") {
          const { baseId } = parseItemId(itemId);
          ownedItems[baseId] = true;
        }
      }
    } else {
      for (const itemId of Object.keys(rawSaveData.collectibles)) {
        const { baseId } = parseItemId(itemId);
        ownedItems[baseId] = true;
      }
    }
  }
  if (rawSaveData.consumables) {
    for (const itemId of Object.keys(rawSaveData.consumables)) {
      const { baseId } = parseItemId(itemId);
      ownedItems[baseId] = true;
    }
  }
  for (const slotInfo of Object.values(equippedSlots)) {
    ownedItems[slotInfo.baseId] = true;
  }

  // Assemble requirement context
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
    location,
    service
  };

  // Determine main skill and requirement
  const skillsMapFromReqs: Record<string, number> = getLevelRequirementsMap(source.requirements);
  const mainSkill = selectedActivityId
    ? source.relatedSkillsList?.[0]
    : source.relatedSkills?.[0];
  const requiredLevel = skillsMapFromReqs[mainSkill] || 1;
  const playerSkillLevel = parsedChar.skillLevels[mainSkill] || 1;

  console.log(`  • Skill Required: ${mainSkill} (Required: ${requiredLevel}, Player: ${playerSkillLevel})`);

  // Validate activity/recipe requirements
  console.log(`\n📋 Requirements Check:`);
  let allReqsMet = true;
  if (source.requirements && source.requirements.length > 0) {
    for (const req of source.requirements) {
      const met = checkRequirement(req, requirementCtx);
      const reqStr = mapRequirementToString(req);
      if (met) {
        console.log(`  ✅ [Met] ${reqStr}`);
      } else {
        console.log(`  ❌ [MISSING] ${reqStr}`);
        allReqsMet = false;
      }
    }
  } else {
    console.log("  ✅ No requirements for this action.");
  }

  // Validate service station requirements
  if (service && service.requirements && service.requirements.length > 0) {
    console.log(`\n📋 Service Station Requirements (${service.name}):`);
    for (const req of service.requirements) {
      const met = checkRequirement(req, requirementCtx);
      const reqStr = mapRequirementToString(req);
      if (met) {
        console.log(`  ✅ [Met] ${reqStr}`);
      } else {
        console.log(`  ❌ [MISSING] ${reqStr}`);
        allReqsMet = false;
      }
    }
  }

  if (!allReqsMet) {
    console.log("\n⚠️  WARNING: Character does not meet all requirements for this action!");
    console.log("The simulation calculations below might not be active/eligible in-game.");
  }

  // Calculate Level Surplus skilling bonuses
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

  // Resolve attribute entries and aggregate totals
  const resolvedGear = resolveItemAttrs([...equippedGearList, ...collectiblesList]);
  const allEntries = buildAllAttrEntries(
    resolvedGear,
    workEfficiencyBonus,
    qualityOutcomeBonus,
    service, // Service
    [] // Fine input bonus attrs
  );

  // Filter entries based on requirement checks
  const effectiveEntries = allEntries.filter(entry =>
    checkRequirements(entry.requirements, requirementCtx)
  );

  const totals = calculateStatTotals(effectiveEntries);

  // Compute skilling modifiers
  const modifiers = calculateSkillModifiers(totals, source, activitySelected);

  console.log("\n📈 Skilling Modifiers:");
  console.log(`  • Work Efficiency: ${(modifiers.uncappedWorkEfficiency * 100).toFixed(1)}% / ${(modifiers.maxWorkEfficiency * 100).toFixed(1)}%`);
  console.log(`  • Steps per action: ${modifiers.stepsPerCompletion.toFixed(1)}${modifiers.uncappedStepsPerCompletion !== modifiers.stepsPerCompletion ? ` (Uncapped: ${modifiers.uncappedStepsPerCompletion.toFixed(1)})` : ""}`);
  const rewardCount = !activitySelected && source.itemRewards ? Object.values(source.itemRewards)[0] as number : 1;
  console.log(`  • Steps per item: ${(modifiers.stepsPerRewardRoll / rewardCount).toFixed(2)}`);
  console.log(`  • Crafts / Mat: ${modifiers.craftsPerMaterial.toFixed(3)}`);
  console.log(`  • Double Action Chance: ${(modifiers.doubleAction * 100).toFixed(1)}%`);
  console.log(`  • Double Reward Chance: ${(modifiers.doubleRewards * 100).toFixed(1)}%`);
  console.log(`  • No Materials Consumed Chance: ${(modifiers.noMaterialsConsumed * 100).toFixed(1)}%`);
  console.log(`  • Quality Outcome Bonus: +${modifiers.qualityOutcome}`);

  // Fetch detailed loot table context using real checkRequirements predicate
  const sourceContext = resolveSourceContextTables(source);
  const gearContext = resolveGearContextTables(
    equippedGearList.map(g => [g.gearType || "tool", g]),
    (reqs) => checkRequirements(reqs, requirementCtx)
  );

  // Get unique loot table IDs needed
  const tableIds = Array.from(new Set(
    [...sourceContext, ...gearContext].flatMap((c: any) => c.tables || [])
  )).filter((id): id is string => typeof id === "string" && id !== "");

  // 3. Fetch all required detailed loot tables in a single batch
  const fetchedLootTables: Record<string, any> = {};
  if (tableIds.length > 0) {
    try {
      const lootTablesRes = await axios.post(`${BACKEND_URL}/api/lootTables/multiple`, { ids: tableIds });
      lootTablesRes.data.forEach((lt: any) => {
        fetchedLootTables[lt.id] = lt;
      });
    } catch (error) {
      console.log("⚠️ Batch fetch failed. Fetching loot tables individually...");
      const fetchPromises = tableIds.map(async (id) => {
        try {
          const res = await axios.get(`${BACKEND_URL}/api/lootTables/${id}`);
          if (res.data) {
            fetchedLootTables[id] = res.data;
          }
        } catch (e) {
          // ignore
        }
      });
      await Promise.all(fetchPromises);
    }
  }

  // Attach detailed tables
  const allContextTables = [...sourceContext, ...gearContext].map((c: any) => {
    const detailedTables = (c.tables || [])
      .map((tableId: string) => fetchedLootTables[tableId])
      .filter((t: any) => t);
    return {
      ...c,
      tables: detailedTables
    };
  });

  const mergedGroups = mergeTableGroups(allContextTables);
  const groupedDrops = deduplicateAndGroupDrops(mergedGroups);

  // Collect all item IDs that can drop from these tables
  const dropItemIds = Array.from(new Set(groupedDrops.flatMap(sources =>
    sources.map(s => s.rowItemID).filter(id => id && id !== "gold")
  ))).filter((id): id is string => typeof id === "string" && id !== "");

  // 4. Fetch details for all potential drops in a single batch
  if (dropItemIds.length > 0) {
    try {
      const dropItemsRes = await axios.post(`${BACKEND_URL}/api/items/multiple`, { ids: dropItemIds });
      dropItemsRes.data.forEach((item: any) => {
        itemsMap[item.id] = item;
      });
    } catch (error) {
      console.log("⚠️ Batch fetch failed. Fetching drop items individually...");
      const fetchPromises = dropItemIds.map(async (id) => {
        try {
          const res = await axios.get(`${BACKEND_URL}/api/items/${id}`);
          if (res.data) {
            itemsMap[id] = res.data;
          }
        } catch (e) {
          // ignore
        }
      });
      await Promise.all(fetchPromises);
    }
  }

  // 5. Fetch items/item value mapping & fine materials
  const itemValuesRes = await axios.get(`${BACKEND_URL}/api/items/item_value_mapping`);
  const itemValuesMap = itemValuesRes.data;

  const fineMaterialsRes = await axios.get(`${BACKEND_URL}/api/items/fine_materials`);
  const fineMaterialsMap: Record<string, boolean> = {};
  fineMaterialsRes.data.forEach((fm: string) => {
    fineMaterialsMap[fm] = true;
  });

  // Build the complete drop item info map
  const dropMultiplierGetter = (types: string[]) => {
    return resolveDropMultiplier(types, {
      chestFind: modifiers.chestFind,
      findCollectibles: modifiers.findCollectibles,
      findGems: modifiers.findGems,
      findBirdNests: modifiers.findBirdNests
    });
  };

  const skillsIconMap: Record<string, { icon: string }> = {}; // Empty icon map for display
  const dropItemInfoMap = buildDropItemInfoMap(
    groupedDrops,
    modifiers.stepsPerRewardRoll,
    modifiers.fineMaterialFind,
    dropMultiplierGetter,
    fineMaterialsMap,
    skillsIconMap
  );

  // Calculate yield metrics
  const goldPer1kSteps = computeGoldTotal(dropItemInfoMap, {}, itemValuesMap);
  const tokenPer1kSteps = computeTokenTotal(dropItemInfoMap, {});

  const xpReward = modifiers.xpPerStep.find(r => r.skill === mainSkill);
  const xpPer1kSteps = xpReward ? xpReward.value * 1000 : 0;

  console.log("\n💰 Expected Yield per 1,000 steps:");
  console.log(`  • XP: ${xpPer1kSteps.toFixed(1)}`);
  console.log(`  • Gold/Coins: ${goldPer1kSteps.toFixed(1)}`);
  console.log(`  • Faction Tokens: ${tokenPer1kSteps.toFixed(1)}`);

  console.log("\n🎁 Expected Rewards & Drop Rates:");
  console.log(`  ${"Item Name (ID)".padEnd(35)} | ${"Chance".padEnd(8)} | ${"Steps/Item".padEnd(12)} | ${"Steps/Fine".padEnd(12)}`);
  console.log("-".repeat(78));

  Object.entries(dropItemInfoMap).forEach(([itemId, info]: [string, any]) => {
    const itemDetail = itemsMap[itemId];
    const displayName = itemDetail ? `${itemDetail.name} (${itemId})` : itemId;
    const chanceStr = `${info.totalDropChance.toFixed(2)}%`;
    const stepsStr = info.stepsPerItem ? info.stepsPerItem.toFixed(0) : "N/A";
    const fineStepsStr = info.stepsPerFine ? info.stepsPerFine.toFixed(0) : "-";
    console.log(`  ${displayName.padEnd(35)} | ${chanceStr.padEnd(8)} | ${stepsStr.padEnd(12)} | ${fineStepsStr.padEnd(12)}`);
  });
}

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

  const type = itemDetail.type; // "crafted", "loot", "consumable", etc.
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
  // For loot / other - quality is static from catalog
  return itemDetail.quality ?? "common";
}

function formatQuality(quality: string, itemType: string): string {
  if (itemType === "crafted") {
    switch (quality) {
      case "common": return "normal";
      case "uncommon": return "good";
      case "rare": return "great";
      case "epic": return "excellent";
      case "legendary": return "perfect";
      case "ethereal": return "eternal";
    }
  }
  return quality;
}



function mapRequirementToString(req: any): string {
  const { opposite } = req;
  const prefix = opposite ? "NOT " : "";
  switch (req.type) {
    case "mainSkill":
      return `${prefix}Related skill is ${req.requirement.skill}`;
    case "mainSkillType":
      return `${prefix}Related skill type is ${req.requirement.type}`;
    case "achievementPoint":
      return `${prefix}Have ${req.requirement.value} achievement points`;
    case "distinctKeywordItemsEquipped":
      return `${prefix}Equip ${req.requirement.quantity} distinct item(s) with keyword "${req.requirement.keywords.join(", ")}"`;
    case "distinctKeywordItemInInventory":
      return `${prefix}Have ${req.requirement.quantity} item(s) with keyword "${req.requirement.keywords.join(", ")}" in inventory`;
    case "realm":
      return `${prefix}In faction area ${req.requirement.realm}`;
    case "traveling":
      return `${prefix}Traveling`;
    case "service":
      return `${prefix}Service tier ${req.requirement.tier} (${req.requirement.keywords?.join(", ") || ""})`;
    case "gameData":
      return `${prefix}Reputation with ${req.requirement.gameDataId}`;
    case "characterLevel":
      return `${prefix}Character level ${req.requirement.level}`;
    case "skillLevel":
      return `${prefix}Level ${req.requirement.level} ${req.requirement.skill}`;
    case "skillTypeLevel":
      return `${prefix}Level in skill type ${req.requirement.type}`;
    case "activityType":
      return `${prefix}Doing activity of type ${req.requirement.activity || req.requirement.keywords?.join(", ")}`;
    case "totalSkillLevel":
      return `${prefix}Total skill levels: ${req.requirement.levels}`;
    case "totalSkillLevelUps":
      return `${prefix}Total skill level ups: ${req.requirement.levels}`;
    case "itemAnywhere":
    case "itemAnywhereWithYou":
      return `${prefix}Own item ${req.requirement.item}`;
    case "keywordEquipped":
      return `${prefix}Equip item with keyword "${req.requirement.keyword}"`;
    case "keywordWithLevelEquipped":
      return `${prefix}Equip item with keyword "${req.requirement.keyword}" requiring level ${req.requirement.level} ${req.requirement.skill}`;
    case "itemEquipped":
      return `${prefix}Equip item "${req.requirement.item}"`;
    case "abilityAvailable":
      return `${prefix}Have ability "${req.requirement.ability}" available`;
    default:
      return `${prefix}${req.type} requirement`;
  }
}

function printHelp() {
  console.log(`
🏃 Walkscape Gear CLI Tinkerer 🏃
Usage:
  npx --prefix frontend vite-node ../tools/tinker/tinker.ts [options]

Options:
  --save, --character-data <path>  Path to character save JSON file.
                       Defaults to the test fixture.
  --gearset-code <code> Gearset export code to override equipped items.
  --activity <id>      Specify an activity ID to simulate.
  --recipe <id>        Specify a recipe ID to simulate.
  --location <id>      Specify a location ID to simulate at (e.g. vastalume, wraithwater).
  --service <id>       Specify a service station ID to simulate using (e.g. tidal_workshop_advanced).
  --list-activities    List all available activities.
  --list-recipes       List all available recipes.
  -h, --help           Display this help screen.

Examples:
  npx --prefix frontend vite-node ../tools/tinker/tinker.ts --list-activities
  npx --prefix frontend vite-node ../tools/tinker/tinker.ts --activity mine_tin_ore
  npx --prefix frontend vite-node ../tools/tinker/tinker.ts --activity mine_tin_ore --gearset-code <base64_code>
  npx --prefix frontend vite-node ../tools/tinker/tinker.ts --recipe smelt_into_ectoplasm
  npx --prefix frontend vite-node ../tools/tinker/tinker.ts --recipe smelt_into_ectoplasm --location vastalume
`);
}

main().catch(console.error);
