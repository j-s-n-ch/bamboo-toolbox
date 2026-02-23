/**
 * Purpose:
 * Transforms a `rollSpecialTable` attribute into a pseudo-stat shape
 * by deriving the stat key and display name from its localization key.
 *
 * Does NOT:
 * - Import any Vue / reactive APIs
 * - Mutate global state
 * - Perform network requests
 */

import { stripHtmlTags } from "@/utils/stripHtmlTags";
import type { Attribute } from "@/domain/types/item";

export function makePseudoStat(attr: Attribute): Attribute {
  const text = stripHtmlTags(attr.customText);
  const split = (attr.customTextLocalizationKey ?? "").split(".");
  const pseudoStat = split[split.length - 2];
  return {
    ...attr,
    statText: text,
    stats: [
      {
        ...attr.stats[0],
        name: text,
        stat: pseudoStat,
        type: pseudoStat,
      },
    ],
  };
}
