/**
 * Domain Layer
 *
 * Contains pure game logic:
 * - Gear stat aggregation
 * - Activity effectiveness calculations
 * - Optimization algorithms
 * - Character-related utilities (level calculations, toolbelt sizes)
 *
 * Must remain framework-independent.
 */

export * from "./character";
export * from "./effectiveAttrs";
export * from "./skillModifiers";
export * from "./levelBonus";
export * from "./gearSetExport";
export * from "./stats/statSourceList";
export * from "./gear/gearSet";
export * from "./requirements/requirementUtils";
