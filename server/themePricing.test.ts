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
    expect(getCustomOrderPriceForThemes(["lego", "mahjong"], "round", "8inch")).toBe(118);
  });

  it("handles Numbers cakes and sizes with no price", () => {
    expect(getCustomOrderPriceForThemes(["floralBouquet", "lego"], "numbers", "8x8", 1)).toBe(118);
    expect(getCustomOrderPriceForThemes(["floralBouquet", "lego"], "numbers", "8x8", 2)).toBe(158);
    expect(getCustomOrderPriceForThemes(["floralBouquet", "lego"], "round", "99inch")).toBeNull();
  });
});
