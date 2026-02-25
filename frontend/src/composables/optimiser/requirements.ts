import { priorityValue } from "./priority";
import {
  getRequirementCandidates as _getRequirementCandidates,
} from "@/domain/optimiser/requirements";
import type { Req, RequirementCandidate } from "@/domain/optimiser/requirements";
import type { OptimiserItem } from "@/domain/optimiser/types";

/**
 * Wrapper that injects the active priority from the settings store so
 * callers do not need to read it themselves.
 */
export const getRequirementCandidates = (
  gearOptions: Record<string, OptimiserItem[]>,
  req: Req,
): RequirementCandidate[] => _getRequirementCandidates(gearOptions, req, priorityValue());
