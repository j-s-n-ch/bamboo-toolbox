import { describe, it, expect } from "vitest";
import {
  buildComparisonRow,
  buildComparisonRows,
} from "@/domain/comparison/comparisonRows";

// ---------------------------------------------------------------------------
// buildComparisonRow
// ---------------------------------------------------------------------------

describe("buildComparisonRow", () => {
  describe("comp direction", () => {
    it("comp = v2scaled - v1scaled when negative is false (lower-is-better default)", () => {
      const result = buildComparisonRow({ title: "steps", v1: 100, v2: 200 });
      expect(result.comp).toBe(200 - 100); // 100 — v1 is lower/better → positive comp
    });

    it("comp is negative when v1 > v2 and negative is false", () => {
      const result = buildComparisonRow({ title: "steps", v1: 200, v2: 100 });
      expect(result.comp).toBeLessThan(0);
    });

    it("comp = v1scaled - v2scaled when negative is true (higher-is-better)", () => {
      const result = buildComparisonRow({
        title: "eff",
        v1: 0.2,
        v2: 0.1,
        negative: true,
      });
      expect(result.comp).toBeGreaterThan(0); // v1 is higher/better → positive
    });

    it("comp is negative when v1 < v2 and negative is true", () => {
      const result = buildComparisonRow({
        title: "eff",
        v1: 0.1,
        v2: 0.2,
        negative: true,
      });
      expect(result.comp).toBeLessThan(0);
    });

    it("comp is 0 when v1 equals v2", () => {
      const result = buildComparisonRow({ title: "steps", v1: 50, v2: 50 });
      expect(result.comp).toBe(0);
    });
  });

  describe("isPercent scaling", () => {
    it("multiplies v1 and v2 by 100 when isPercent is true", () => {
      const result = buildComparisonRow({
        title: "eff",
        v1: 0.2,
        v2: 0.1,
        isPercent: true,
        negative: true,
      });
      expect(result.v1).toBeCloseTo(20);
      expect(result.v2).toBeCloseTo(10);
    });

    it("comp is computed from scaled values when isPercent is true", () => {
      const result = buildComparisonRow({
        title: "eff",
        v1: 0.2,
        v2: 0.1,
        isPercent: true,
        negative: true,
      });
      // comp = v1scaled - v2scaled = 20 - 10 = 10
      expect(result.comp).toBeCloseTo(10);
    });

    it("does not scale when isPercent is false (default)", () => {
      const result = buildComparisonRow({ title: "steps", v1: 100, v2: 50 });
      expect(result.v1).toBe(100);
      expect(result.v2).toBe(50);
    });

    it("sets isPercent flag on the result", () => {
      expect(
        buildComparisonRow({ title: "t", v1: 0, v2: 0, isPercent: true })
          .isPercent,
      ).toBe(true);
      expect(
        buildComparisonRow({ title: "t", v1: 0, v2: 0, isPercent: false })
          .isPercent,
      ).toBe(false);
    });
  });

  describe("modifyValue", () => {
    it("applies modifyValue to v1 and v2 display values", () => {
      const result = buildComparisonRow({
        title: "per item",
        v1: 200,
        v2: 400,
        modifyValue: (v) => v / 2,
      });
      expect(result.v1).toBe(100);
      expect(result.v2).toBe(200);
    });

    it("does NOT apply modifyValue to the comp calculation", () => {
      // Without modifyValue: comp = v2 - v1 = 400 - 200 = 200
      // With modifyValue (/2): display v1=100, v2=200 but comp still = 200
      const result = buildComparisonRow({
        title: "per item",
        v1: 200,
        v2: 400,
        modifyValue: (v) => v / 2,
      });
      expect(result.comp).toBe(400 - 200); // uses raw scaled values
    });

    it("identity modifyValue leaves values unchanged", () => {
      const result = buildComparisonRow({
        title: "t",
        v1: 10,
        v2: 20,
        modifyValue: (v) => v,
      });
      expect(result.v1).toBe(10);
      expect(result.v2).toBe(20);
    });
  });

  describe("title passthrough", () => {
    it("passes title through unchanged", () => {
      expect(
        buildComparisonRow({ title: "Work Efficiency", v1: 0, v2: 0 }).title,
      ).toBe("Work Efficiency");
    });
  });
});

// ---------------------------------------------------------------------------
// buildComparisonRows
// ---------------------------------------------------------------------------

describe("buildComparisonRows", () => {
  it("returns an empty array for empty input", () => {
    expect(buildComparisonRows([])).toEqual([]);
  });

  it("maps each input to a result independently", () => {
    const results = buildComparisonRows([
      { title: "a", v1: 10, v2: 20 },
      { title: "b", v1: 30, v2: 15, negative: true },
    ]);
    expect(results).toHaveLength(2);
    expect(results[0].title).toBe("a");
    expect(results[1].title).toBe("b");
  });

  it("produces the same results as calling buildComparisonRow individually", () => {
    const inputs = [
      { title: "a", v1: 10, v2: 20, isPercent: false },
      { title: "b", v1: 0.2, v2: 0.1, isPercent: true, negative: true },
    ];
    const batch = buildComparisonRows(inputs);
    const individual = inputs.map(buildComparisonRow);
    expect(batch).toEqual(individual);
  });
});
