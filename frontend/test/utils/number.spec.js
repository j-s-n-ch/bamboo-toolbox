import { describe, it, expect } from "vitest";
import { n } from "@/utils/number";

describe("n utility", () => {
  it("formats integers with thousand separators", () => {
    expect(n(1000)).toBe("1 000");
    expect(n(1000000)).toBe("1 000 000");
    expect(n(123456789)).toBe("123 456 789");
  });

  it("formats decimals with rounding", () => {
    expect(n(1234.5678, 2)).toBe("1 234.57");
    expect(n(1234.561, 2)).toBe("1 234.56");
    expect(n(1234.5, 1)).toBe("1 234.5");
  });

  it("removes trailing zeros after decimal", () => {
    expect(n(1234.5, 3)).toBe("1 234.5");
    expect(n(1000.0, 2)).toBe("1 000");
  });

  it("handles small numbers and zero", () => {
    expect(n(0)).toBe("0");
    expect(n(0.001234, 4)).toBe("0.0012");
    expect(n(-0.001234, 4)).toBe("-0.0012");
  });

  it("handles negative numbers", () => {
    expect(n(-1234.5678, 2)).toBe("-1 234.57");
    expect(n(-1000000)).toBe("-1 000 000");
  });

  it("handles custom decimals", () => {
    expect(n(1234.56789, 4)).toBe("1 234.5679");
    expect(n(1234.56789, 0)).toBe("1 235");
  });

  it("handles very large numbers", () => {
    expect(n(1234567890123)).toBe("1 234 567 890 123");
  });
});
