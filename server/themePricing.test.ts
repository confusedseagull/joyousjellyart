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

  it("prices 2 Tier cakes: Floral Bouquet 148 / 178 / 198, every other theme 159 / 189 / 209", () => {
    const tiers = ["2tier_6_8", "2tier_6_10", "2tier_8_10"];
    expect(tiers.map((t) => getCustomOrderPrice("floralBouquet", "round", t))).toEqual([148, 178, 198]);
    expect(tiers.map((t) => getCustomOrderPrice("lego", "square", t))).toEqual([159, 189, 209]);
    expect(tiers.map((t) => getCustomOrderPrice("handDrawn", "round", t))).toEqual([159, 189, 209]);
    // the other shapes that come in two tiers follow the same three prices
    expect(getCustomOrderPrice("floralBouquet", "heart", "2tier_7_10")).toBe(178);
    expect(getCustomOrderPrice("chess", "octagon", "2tier_6_8")).toBe(159);
    expect(getCustomOrderPrice("floralBouquet", "sakura", "2tier_6_8")).toBe(148);
  });

  it("leaves Floral Bouquet's single-tier sizes alone", () => {
    expect(getCustomOrderPrice("floralBouquet", "round", "6inch")).toBe(88);
    expect(getCustomOrderPrice("floralBouquet", "round", "8inch")).toBe(118);
  });
});
