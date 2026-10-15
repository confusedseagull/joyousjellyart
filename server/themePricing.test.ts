import { describe, it, expect } from "vitest";
import { getCustomOrderPrice, getCustomOrderPriceForThemes, getCustomOrderPriceRange } from "../shared/customOrderPricing";

describe("pricing a design that combines themes", () => {
  it("uses the more expensive theme's price", () => {
    const floral = getCustomOrderPrice("floralBouquet", "round", "6inch")!;
    const chess = getCustomOrderPrice("chess", "round", "6inch")!;
    expect(chess).toBeGreaterThan(floral); // Floral Bouquet is the cheaper list

    expect(getCustomOrderPriceForThemes(["floralBouquet", "chess"], "round", "6inch")).toBe(chess);
    // order of the two themes doesn't matter
    expect(getCustomOrderPriceForThemes(["chess", "floralBouquet"], "round", "6inch")).toBe(chess);
  });

  it("is the same as the single theme's price when only one theme is given", () => {
    expect(getCustomOrderPriceForThemes(["floralBouquet"], "round", "8inch")).toBe(getCustomOrderPrice("floralBouquet", "round", "8inch"));
    expect(getCustomOrderPriceForThemes(["floralBouquet", ""], "round", "8inch")).toBe(getCustomOrderPrice("floralBouquet", "round", "8inch"));
    expect(getCustomOrderPriceForThemes(["lego", "mahjong"], "round", "8inch")).toBe(118);
  });

  it("handles Numbers cakes and sizes with no price", () => {
    expect(getCustomOrderPriceForThemes(["floralBouquet", "lego"], "numbers", "8x8", 1)).toBe(118);
    expect(getCustomOrderPriceForThemes(["floralBouquet", "lego"], "numbers", "8x8", 2)).toBe(158);
    expect(getCustomOrderPriceForThemes(["floralBouquet", "lego"], "round", "99inch")).toBeNull();
  });
});

describe("quoting a size before a theme is chosen", () => {
  it("gives the lowest to highest price across themes", () => {
    expect(getCustomOrderPriceRange("round", "6inch")).toEqual({ min: 88, max: 99 });
    expect(getCustomOrderPriceRange("round", "10inch")).toEqual({ min: 138, max: 158 });
    expect(getCustomOrderPriceRange("platter9", "6cm")).toEqual({ min: 108, max: 128 });
    expect(getCustomOrderPriceRange("numbers", "8x8", 1)).toEqual({ min: 108, max: 118 });
  });

  it("is a single price when every theme costs the same", () => {
    expect(getCustomOrderPriceRange("platter6", "6cm")).toEqual({ min: 78, max: 78 });
    expect(getCustomOrderPriceRange("round", "2tier_6_8")).toEqual({ min: 138, max: 138 });
  });

  it("has no price for a size that does not exist", () => {
    expect(getCustomOrderPriceRange("round", "99inch")).toBeNull();
  });
});
