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

  it("gives Mini Gift Boxes 2 flavours from 4 boxes and 3 from 9 boxes", () => {
    expect(requiredFlavourCount("miniGiftBox", 1)).toBe(1);
    expect(requiredFlavourCount("miniGiftBox", 3)).toBe(1);
    expect(requiredFlavourCount("miniGiftBox", 4)).toBe(2);
    expect(requiredFlavourCount("cupcake", 8)).toBe(2);
    expect(requiredFlavourCount("cupcake", 9)).toBe(3);
    expect(requiredFlavourCount("cupcake", 12)).toBe(3);
    expect(requiredFlavourCount("round", 12)).toBe(1);

    const box = applyItemChange(cake, { format: "miniGiftBox", boxes: 4 });
    expect(box.flavours).toHaveLength(2);
    expect(applyItemChange(box, { boxes: 9 }).flavours).toHaveLength(3);
    expect(applyItemChange(box, { boxes: 2 }).flavours).toHaveLength(1);
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

  it("keeps the chosen sport only while the theme is Sports", () => {
    const sports = { ...cake, theme: "golf", themeLabel: "Sports", sport: "sailing" };

    expect(applyItemChange(sports, { cakeText: "Ahoy" }).sport).toBe("sailing");
    expect(applyItemChange(sports, { theme: "chess" }).sport).toBeUndefined();
    expect(applyItemChange(sports, { sport: "golf" }).sport).toBe("golf");
  });

  it("prices a combined-theme design at the more expensive theme, and back again when the second theme is removed", () => {
    const floral = { ...cake, theme: "floralBouquet", themeLabel: "Floral Bouquet", price: 88 };
    const combined = applyItemChange(floral, { secondTheme: "chess" });

    expect(combined.secondTheme).toBe("chess");
    expect(combined.secondThemeLabel).toBe("Chess");
    expect(combined.price).toBe(99); // Chess is the dearer of the two
    expect(applyItemChange(combined, { secondTheme: undefined }).price).toBe(88);
  });

  it("drops a second theme that repeats the first or isn't offered for the format", () => {
    expect(applyItemChange({ ...cake, secondTheme: "chess" }, {}).secondTheme).toBeUndefined();
    const platter = applyItemChange(cake, { format: "jellyPlatter", secondTheme: "nameAndInitial" });
    expect(platter.secondTheme).toBeUndefined();
  });

  it("keeps each theme's extras while either chosen theme still asks for them", () => {
    const both = applyItemChange(
      { ...cake, theme: "floralBouquet", selectedFlowers: ["Rose"], cartoonCharacter: "Pikachu" },
      { secondTheme: "cartoonCharacters" }
    );
    expect(both.selectedFlowers).toEqual(["Rose"]);
    expect(both.cartoonCharacter).toBe("Pikachu");

    const onlyCartoon = applyItemChange(both, { theme: "cartoonCharacters", secondTheme: undefined });
    expect(onlyCartoon.selectedFlowers).toBeUndefined();
    expect(onlyCartoon.cartoonCharacter).toBe("Pikachu");
  });

  it("keeps typed text per theme slot, so Hand Drawn and Bespoke Signature can be combined", () => {
    const item = applyItemChange(
      { ...cake, theme: "handDrawn", themeCustomText: "A dragon" },
      { secondTheme: "nameAndInitial", secondThemeCustomText: "Doreen" }
    );
    expect(item.themeCustomText).toBe("A dragon");
    expect(item.secondThemeCustomText).toBe("Doreen");
    expect(applyItemChange(item, { secondTheme: "chess" }).secondThemeCustomText).toBeUndefined();
  });

  it("prices a Numbers cake by how many numbers it has", () => {
    const numbers = applyItemChange(cake, { shape: "numbers" });

    expect(numbers.size).toBe("8x8");
    expect(numberCountOf(numbers)).toBe(2);
    expect(unitPrice(numbers)).toBe(158);
    expect(applyItemChange(numbers, { numbers: "8" }).price).toBe(118);
  });

  it("prices a multi-box Mini Gift Box order as one item covering every box", () => {
    const gift = { ...cake, format: "miniGiftBox", shape: "miniGiftBox", size: "10cm", theme: "space", themeLabel: "Space", boxes: 3, quantity: 3 };
    const next = applyItemChange(gift, {});

    expect(next.quantity).toBe(1);
    expect(next.boxes).toBe(3);
    expect(unitPrice(next)).toBe(56.7);
    expect(applyItemChange(next, { boxes: 2 }).price).toBe(37.8);
    expect(applyItemChange(next, { boxes: 1 }).boxes).toBeUndefined();
  });

  it("only mini gift boxes have a box count", () => {
    expect(applyItemChange({ ...cake, boxes: 3 }, {}).boxes).toBeUndefined();
    expect(applyItemChange({ ...cake, quantity: 3 }, {}).quantity).toBe(1);
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
