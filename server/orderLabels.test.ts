import { describe, it, expect } from "vitest";
import { dietaryLabels, sizeLabel, themeLabel, formatLabel, shapeDescription, flavourLabel, sportLabel, themeNames, themeSlots, itemTitle } from "../shared/orderLabels";

describe("order option labels", () => {
  it("names dietary requirements as the builder does, from a list or a comma string", () => {
    expect(dietaryLabels(["noCoconutMilk", "noDairy"])).toEqual(["No Coconut Milk", "No Dairy"]);
    expect(dietaryLabels("noNuts, vegan")).toEqual(["No Nuts", "Vegan"]);
    expect(dietaryLabels(undefined)).toEqual([]);
  });

  it("never shows a raw stored value, even for an option the builder no longer has", () => {
    expect(dietaryLabels(["noShellfish"])).toEqual(["No Shellfish"]);
    expect(themeLabel("someOldTheme")).toBe("Some Old Theme");
    expect(formatLabel("miniGiftBox")).toBe("Mini Gift Box");
  });

  it("names the sports as the builder does, and the Sports theme as Sports", () => {
    expect(sportLabel("sailing")).toBe("Sailing");
    expect(sportLabel("golf")).toBe("Golf");
    expect(sportLabel("diving")).toBe("Diving");
    expect(themeLabel("golf")).toBe("Sports");
  });

  it("names one theme, or two combined themes, with each one's typed text", () => {
    expect(themeNames({ theme: "chess" })).toBe("Chess");
    const combined = {
      theme: "handDrawn",
      secondTheme: "nameAndInitial",
      themeCustomText: "A dragon",
      secondThemeCustomText: "Doreen",
    };
    expect(themeNames(combined)).toBe("Hand Drawn + Bespoke Signature");
    expect(themeSlots(combined).map((s) => s.text)).toEqual(["A dragon", "Doreen"]);
    expect(itemTitle({ format: "cake", theme: "floralBouquet", secondTheme: "chess" })).toBe("Floral Bouquet + Chess Cake");
    expect(itemTitle({ format: "cake", shape: "huatBox", theme: "mahjong" })).toBe("Mahjong Huat Huat Box");
    expect(itemTitle({ format: "miniGiftBox", boxes: 3, theme: "space", secondTheme: "chess" })).toBe("3 Mini Gift Boxes - Space + Chess");
  });

  it("names sizes, shapes and flavours as chosen", () => {
    expect(sizeLabel("round", "2tier_6_8")).toBe('2 Tier: 6" + 8"');
    expect(shapeDescription({ shape: "teddyBear" })).toBe("Teddy Bear");
    expect(flavourLabel("Longan")).toBe("Longan");
  });
});
