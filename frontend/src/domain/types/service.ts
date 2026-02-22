import type { Requirement } from "./common";
import type { Attribute } from "./item";

// ---------------------------------------------------------------------------
// Services
// ---------------------------------------------------------------------------

export type ServiceSummary = {
  id: string;
  name: string;
  icon: string;
};

export type ServiceDetail = ServiceSummary & {
  tier: string;
  serviceType: string;
  keywords: string[];
  relatedSkills: string[];
  requirements: Requirement[];
  attributes: Attribute[];
};
