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
    expect(getCustomOrderPriceForThemes(["lego", "mahjong"], "round", "8inch")).toBe(129);
  });

  it("handles Numbers cakes and sizes with no price", () => {
    expect(getCustomOrderPriceForThemes(["floralBouquet", "lego"], "numbers", "8x8", 1)).toBe(118);
    expect(getCustomOrderPriceForThemes(["floralBouquet", "lego"], "numbers", "8x8", 2)).toBe(188);
    expect(getCustomOrderPriceForThemes(["floralBouquet", "lego"], "round", "99inch")).toBeNull();
  });
});

describe("quoting a size before a theme is chosen", () => {
  it("gives the lowest to highest price across themes", () => {
    expect(getCustomOrderPriceRange("round", "6inch")).toEqual({ min: 88, max: 99 });
    expect(getCustomOrderPriceRange("round", "10inch")).toEqual({ min: 158, max: 169 });
    expect(getCustomOrderPriceRange("round", "8inch")).toEqual({ min: 108, max: 129 });

  });

  it("is a single price when every theme costs the same", () => {
    expect(getCustomOrderPriceRange("numbers", "8x8", 1)).toEqual({ min: 118, max: 118 });
    expect(getCustomOrderPriceRange("numbers", "8x8", 2)).toEqual({ min: 188, max: 188 });
    expect(getCustomOrderPriceRange("platter6", "6cm")).toEqual({ min: 78, max: 78 });
    expect(getCustomOrderPriceRange("platter9", "6cm")).toEqual({ min: 129, max: 129 });
    expect(getCustomOrderPriceRange("round", "2tier_6_8")).toEqual({ min: 138, max: 138 });
  });

  it("has no price for a size that does not exist", () => {
    expect(getCustomOrderPriceRange("round", "99inch")).toBeNull();
  });
});

describe("Other themes' pricing", () => {
  it("is $99 at 6 inch, $129 at 8 inch and $169 at 10 inch", () => {
    for (const theme of ["handDrawn", "lego", "cartoonCharacters", "chess"]) {
      for (const shape of ["round", "square"]) {
        expect(getCustomOrderPrice(theme, shape, "6inch")).toBe(99);
        expect(getCustomOrderPrice(theme, shape, "8inch")).toBe(129);
        expect(getCustomOrderPrice(theme, shape, "10inch")).toBe(169);
      }
    }
    expect(getCustomOrderPrice("lego", "heart", "7inch")).toBe(99);
    expect(getCustomOrderPrice("lego", "star", "10inch")).toBe(169);
  });

  it("leaves Floral Bouquet and the 2 Tier sizes alone", () => {
    expect(getCustomOrderPrice("floralBouquet", "round", "6inch")).toBe(88);
    expect(getCustomOrderPrice("floralBouquet", "round", "8inch")).toBe(108);
    expect(getCustomOrderPrice("lego", "round", "2tier_6_10")).toBe(168);
  });
});
