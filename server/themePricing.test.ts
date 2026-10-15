import { describe, it, expect } from "vitest";
import { getCustomOrderPrice, getCustomOrderPriceForThemes } from "../shared/customOrderPricing";

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
    expect(getCustomOrderPrice("floralBouquet", "round", "8inch")).toBe(118);
    expect(getCustomOrderPrice("lego", "round", "2tier_6_10")).toBe(168);
  });
});
