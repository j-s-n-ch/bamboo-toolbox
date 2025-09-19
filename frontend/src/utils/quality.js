import { qualityOptions } from "@/constants/quality";

const qualityRank = Object.fromEntries(
  qualityOptions.map(({ value }, index) => [value, index])
);

export function itemQualityNameSort(a, b, reverseQuality = false) {
  const aRank = qualityRank[a.quality] ?? Infinity;
  const bRank = qualityRank[b.quality] ?? Infinity;

  if (aRank !== bRank) {
    return reverseQuality ? bRank - aRank : aRank - bRank;
  }

  return a.name.localeCompare(b.name);
}
