export type RouteOption = {
  options: Record<string, boolean>;
  terrainModifiers: string[];
};

export type RouteSummary = {
  id: string;
  name: string;
  locations: string[];
  distance: number;
  distanceModifier: number;
  options?: RouteOption[];
};
