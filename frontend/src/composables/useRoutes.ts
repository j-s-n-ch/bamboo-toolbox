import { ref, computed, type Ref, type ComputedRef } from "vue";
import { MinPriorityQueue } from "@datastructures-js/priority-queue";
import { useRouteStore, type LocationInfo, type RouteSegment, type RouteSegmentStats } from "@/store/route";
import { usePlayerStore } from "@/store/player";
import { useRequirements, type RequirementContext } from "@/composables/useRequirements";
import { useSkillModifiers, type SkillModifiersContext } from "@/composables/useSkillModifiers";
import { argbToRgba } from "@/utils/argbToRgba";
import type { TerrainModifier } from "@/domain/types/terrain";
import type { RouteOption } from "@/domain/types/route";
import type { Requirement } from "@/domain/types/common";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type GraphEdge = {
  to: string;
  distance: number;
  requirements: TerrainModifier[][];
};

type RouteContext = SkillModifiersContext & {
  terrainModifiers: ComputedRef<TerrainModifier[][]>;
};

type PathNode = {
  location: string;
  distance: number;
  missing: Requirement[];
  prev: string | null;
  segment?: RouteSegment;
};

type PathResult = {
  path: string[];
  segments: RouteSegment[];
  missing: Requirement[];
};

type PathfindResult = {
  best: PathResult;
  bestValid: PathResult | null;
};

// ---------------------------------------------------------------------------
// Composable
// ---------------------------------------------------------------------------

export function useRoutes(baseContext: SkillModifiersContext): {
  getRoute: (start: string, goal: string) => PathfindResult | undefined;
  stepsPerNode: (distance: number, stats: RouteSegmentStats) => number;
  averageStepsPerRoute: (distance: number, stats: RouteSegmentStats) => number;
} {
  const routeStore = useRouteStore();
  const playerStore = usePlayerStore();
  const { checkRequirement } = useRequirements(baseContext as RequirementContext);

  const graph: Ref<Map<string, GraphEdge[]>> = ref(new Map());

  function addLocation(name: string): void {
    if (!graph.value.has(name)) {
      graph.value.set(name, []);
    }
  }

  function addRoute(
    from: string,
    to: string,
    distance: number,
    requirements: TerrainModifier[][],
  ): void {
    if (!graph.value.has(from)) addLocation(from);
    if (!graph.value.has(to)) addLocation(to);

    graph.value.get(from)!.push({
      to,
      distance,
      requirements,
    });
  }

  const getTerrainModifier = (
    from: string,
    routeOptions: RouteOption[],
  ): TerrainModifier[][] => {
    return routeOptions
      .filter(({ options }) => options[from])
      .map(({ terrainModifiers }) =>
        terrainModifiers.map((tm) => ({ id: tm, ...routeStore.terrainModifiersMap[tm] })),
      );
  };

  const getRouteContext = (from: LocationInfo, route: GraphEdge): RouteContext => {
    return {
      ...baseContext,
      location: computed(() => ({
        faction: from.faction,
        subFactions: from.subFactions,
        keywords: from.keywords,
      })),
      terrainModifiers: computed(() => route.requirements),
    } as unknown as RouteContext;
  };

  const getLocationInfo = (id: string): LocationInfo => {
    const data = routeStore.locationsMap[id];
    const color = argbToRgba(playerStore.factionsMap[data.faction].color);
    return { id, ...data, color };
  };

  const getSegment = (fromId: string, route: GraphEdge): RouteSegment => {
    const from = getLocationInfo(fromId);
    const to = getLocationInfo(route.to);
    const ctx = getRouteContext(from, route);

    const skillModifiers = useSkillModifiers(ctx);
    const stats: RouteSegmentStats = {
      maxWorkEfficiency: skillModifiers.maxWorkEfficiency.value,
      workEfficiency: skillModifiers.workEfficiency.value,
      uncappedWorkEfficiency: skillModifiers.uncappedWorkEfficiency.value,
      effectiveMaxWorkEfficiency: skillModifiers.effectiveMaxWorkEfficiency.value,
      doubleAction: skillModifiers.doubleAction.value,
      stepsRequiredPercent: skillModifiers.stepsRequiredPercent.value,
      stepsRequiredFlat: skillModifiers.stepsRequiredFlat.value,
    };

    return {
      from,
      to,
      stats,
      route,
      context: ctx,
      distance: route.distance,
      terrainModifiers: ctx.terrainModifiers.value,
      requirements: ctx.terrainModifiers.value.flatMap((tm) =>
        tm.flatMap(({ requirements }) => requirements),
      ),
    };
  };

  routeStore.locations.forEach(({ id }) => addLocation(id));
  routeStore.routes.forEach((route) => {
    const { locations, options, distance, distanceModifier } = route;
    const [from, to] = locations;
    const dist = Math.floor(distance * distanceModifier);

    addRoute(from, to, dist, getTerrainModifier(from, options || []));
    addRoute(to, from, dist, getTerrainModifier(to, options || []));
  });

  function isBetter(a: PathNode, b: PathNode): boolean {
    if (a.missing.length !== b.missing.length)
      return a.missing.length < b.missing.length;
    return a.distance < b.distance;
  }

  const pathfind = (start: string, goal: string): PathfindResult | undefined => {
    if (!graph.value.has(start)) {
      console.warn(`${start} not in map`);
      return;
    }
    if (!graph.value.has(goal)) {
      console.warn(`${goal} not in map`);
      return;
    }

    const pq = new MinPriorityQueue<PathNode>(({ distance }) => distance);
    const bestValid = new Map<string, PathNode>();
    const best = new Map<string, PathNode>();

    const startCandidate: PathNode = {
      location: start,
      distance: 0,
      missing: [],
      prev: null,
    };
    bestValid.set(start, startCandidate);
    best.set(start, startCandidate);

    pq.enqueue(startCandidate);

    while (!pq.isEmpty()) {
      const current = pq.dequeue()!;
      if (current.location === goal && !current.missing.length) break;

      for (const edge of graph.value.get(current.location) || []) {
        const segment = getSegment(current.location, edge);
        const unmetReqs = segment.requirements.filter(
          (req) => !checkRequirement(req, baseContext as RequirementContext),
        );

        const candidate: PathNode = {
          location: edge.to,
          distance:
            current.distance +
            averageStepsPerRoute(edge.distance, segment.stats),
          missing: [...current.missing, ...unmetReqs],
          prev: current.location,
          segment,
        };

        if (
          !best.get(edge.to) ||
          candidate.distance < best.get(edge.to)!.distance
        ) {
          best.set(edge.to, candidate);
          pq.enqueue(candidate);
        }
        if (
          !candidate.missing.length &&
          (!bestValid.get(edge.to) || isBetter(candidate, bestValid.get(edge.to)!))
        ) {
          bestValid.set(edge.to, candidate);
          pq.enqueue(candidate);
        }
      }
    }

    const constructPath = (map: Map<string, PathNode>): PathResult => {
      const segments: RouteSegment[] = [];
      const path: string[] = [];
      const missing: Requirement[] = [];
      let u: PathNode | undefined = map.get(goal);
      while (u) {
        if (u.segment) segments.unshift(u.segment);
        if (u.missing) missing.push(...u.missing);
        path.unshift(u.location);
        u = u.prev !== null ? map.get(u.prev) : undefined;
      }
      return { path, segments, missing };
    };

    const bestRoute = constructPath(best);
    const bestValidRoute = bestValid.get(goal) ? constructPath(bestValid) : null;
    return { best: bestRoute, bestValid: bestValidRoute };
  };

  const getRoute = (start: string, goal: string): PathfindResult | undefined => {
    const route = pathfind(start, goal);
    if (!route) return undefined;
    const segments = route.bestValid
      ? route.bestValid.segments
      : route.best.segments;
    routeStore.setSegments(segments);
    return route;
  };

  const stepsPerNode = (distance: number, stats: RouteSegmentStats): number => {
    const we = 1 + stats.workEfficiency;
    return Math.ceil(
      Math.max(
        10,
        (distance / we / 10) * stats.stepsRequiredPercent +
          stats.stepsRequiredFlat,
      ),
    );
  };

  // Calculate expected number of node completions with double action
  const expectedNodeCompletions = (stats: RouteSegmentStats): number =>
    10 / (1 + stats.doubleAction);

  // Calculate average steps for a single route
  const averageStepsPerRoute = (
    distance: number,
    stats: RouteSegmentStats,
  ): number => {
    const stepsPerSingleNode = stepsPerNode(distance, stats);
    return Math.ceil(stepsPerSingleNode * expectedNodeCompletions(stats));
  };

  return {
    getRoute,
    stepsPerNode,
    averageStepsPerRoute,
  };
}
