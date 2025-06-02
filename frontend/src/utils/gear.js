import { getRawData } from "./rawData";
import { sumAttrs } from "./qualityAttrs";
import { intersect } from "./intersect";

export const showItemForActivity = (itemProxy, activity, quality) => {
  const item = getRawData(itemProxy);

  const skill = activity.relatedSkillsList.length
    ? activity.relatedSkillsList[0]
    : null;
  const skillReq = checksSkillRequirements(item, skill);

  const hasUsefulKeywords = usefulKeywords(item, activity).length > 0;
  const hasUsefulAttrs = usefulAttrs(item, activity, quality, false).length > 0;

  return !skill || (skill && (skillReq || hasUsefulKeywords || hasUsefulAttrs));
};

const usefulKeywords = (item, activity) => {
  const { requiredKeywords: kw } = activity;
  if (!kw) return false;
  const kws = kw.map(({ keyword }) => keyword);
  return item.keywords.filter((keyword) => kws.includes(keyword));
};

const usefulAttrs = (item, activity, quality, isRecipe) => {
  const { id } = activity;
  const isTravel = id === "activity-travelling";
  const skill = activity.relatedSkillsList.length
    ? activity.relatedSkillsList[0]
    : null;

  const filterCO = (attr) => {
    return isRecipe || (!isRecipe && attr.statText !== "Crafting outcome");
  };

  const filterGlobal = (attr) => {
    return attr.requirements?.every((reqs) => {
      const reqTypes = reqs.map(({ type }) => type);
      const filteredTypes = ["mainSkill", "traveling"];
      return !intersect(reqTypes, filteredTypes).length;
    });
  };

  const filterSkill = (attr) => {
    return attr.requirements?.some((reqs) => {
      return reqs.some((req) => {
        return (
          (req.type === "mainSkill" && req.requirement.skill === skill) ||
          (req.type === "traveling" && isTravel)
        );
      });
    });
  };

  const attrs = sumAttrs(
    item.itemAttrs,
    item.itemQualityAttrs || [],
    quality
  ).filter((attr) => {
    const co = filterCO(attr);
    const global = filterGlobal(attr);
    const skill = filterSkill(attr);

    return co && (global || skill);
  });
  return attrs;
};

const checksSkillRequirements = (item, skill) => {
  const skillReqs = skillsInRequirements(item);
  const requiredSkills = skillReqs.map(({ skill }) => skill);
  const usesSkill = requiredSkills.includes(skill);
  return usesSkill;
};

const skillsInRequirements = (item) => {
  const { requirements } = item;
  if (!requirements) return [];

  return requirements.flatMap((reqs) =>
    reqs
      .filter((req) => req.type === "skillLevel")
      .flatMap((req) => req.requirement)
  );
};
