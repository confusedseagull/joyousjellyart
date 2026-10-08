import { describe, it, expect } from "vitest";
import {
  applyItemChange,
  validateCustomItem,
  unitPrice,
  isCheesecakeEligible,
  requiredFlavourCount,
  numberCountOf,
} from "../shared/orderItemRules";

const cake = {
  collection: "custom",
  id: "i1",
  format: "cake",
  theme: "chess",
  themeLabel: "Chess",
  shape: "round",
  size: "6inch",
  flavours: ["Longan"],
  price: 99,
  quantity: 1,
};

describe("applyItemChange", () => {
  it("moves to a size that exists for a new shape and reprices from the price list", () => {
    const next = applyItemChange(cake, { shape: "heart" });

    expect(next.size).toBe("7inch");
    expect(next.price).toBe(99);
    expect(applyItemChange(cake, { size: "10inch" }).price).toBe(138);
  });

  it("keeps a hand-set price when something unrelated to price changes", () => {
    const discounted = { ...cake, price: 80 };

    expect(applyItemChange(discounted, { cakeText: "Happy Birthday" }).price).toBe(80);
    expect(applyItemChange(discounted, { flavours: ["Lychee"] }).price).toBe(80);
    expect(applyItemChange(discounted, { size: "8inch" }).price).toBe(118);
  });

  it("switching to a platter picks a valid shape and size, and asks for the right number of flavours", () => {
    const next = applyItemChange(cake, { format: "jellyPlatter" });

    expect(next.shape).toBe("platter9");
    expect(next.size).toBe("6cm");
    expect(next.flavours).toHaveLength(requiredFlavourCount("platter9"));
    expect(next.flavours[0]).toBe("Longan");
  });

  it("trims platter pieces when the platter gets smaller", () => {
    const platter = applyItemChange(cake, { format: "jellyPlatter", platterShapes: ["heart", "square", "clover"] });

    expect(platter.platterShapes).toEqual(["heart", "square", "clover"]);
    expect(applyItemChange(platter, { shape: "platter4" }).platterShapes).toEqual(["heart", "square"]);
    expect(applyItemChange(platter, { shape: "platter4", size: "10cm" }).platterShapes).toBeUndefined();
  });

  it("drops Cheesecake when the new size can't be made as cheesecake", () => {
    const cheesecake = { ...cake, flavours: ["Cheesecake"] };

    expect(isCheesecakeEligible(cheesecake)).toBe(true);
    expect(applyItemChange(cheesecake, { size: "10inch" }).flavours).toEqual([""]);
    expect(applyItemChange(cheesecake, { size: "8inch" }).flavours).toEqual(["Cheesecake"]);
  });

  it("clears theme-specific extras when the theme changes", () => {
    const floral = { ...cake, theme: "floralBouquet", selectedFlowers: ["Rose"], cartoonCharacter: "Pikachu" };
    const next = applyItemChange(floral, { theme: "chess" });

    expect(next.selectedFlowers).toBeUndefined();
    expect(next.cartoonCharacter).toBeUndefined();
    expect(next.themeLabel).toBe("Chess");
  });

  it("prices a Numbers cake by how many numbers it has", () => {
    const numbers = applyItemChange(cake, { shape: "numbers" });

    expect(numbers.size).toBe("8x8");
    expect(numberCountOf(numbers)).toBe(2);
    expect(unitPrice(numbers)).toBe(158);
    expect(applyItemChange(numbers, { numbers: "8" }).price).toBe(118);
  });

  it("only mini gift boxes can have a quantity above one", () => {
    expect(applyItemChange({ ...cake, quantity: 3 }, {}).quantity).toBe(1);
    expect(applyItemChange({ ...cake, format: "miniGiftBox", shape: "miniGiftBox", size: "10cm", quantity: 3 }, {}).quantity).toBe(3);
  });
});

describe("validateCustomItem", () => {
  it("accepts a complete item", () => {
    expect(validateCustomItem(cake)).toBeNull();
  });

  it("asks for missing flavours, platter shapes and numbers", () => {
    expect(validateCustomItem({ ...cake, flavours: [""] })).toMatch(/flavour/);
    expect(validateCustomItem(applyItemChange(cake, { format: "jellyPlatter", flavours: ["A", "B", "C"].map(() => "Longan") }))).toMatch(
      /platter shape/
    );
    expect(validateCustomItem(applyItemChange(cake, { shape: "numbers" }))).toMatch(/number/);
  });
});
