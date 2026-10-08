import { describe, it, expect } from "vitest";
import { dietaryLabels, sizeLabel, themeLabel, formatLabel, shapeDescription, flavourLabel } from "../shared/orderLabels";

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

  it("names sizes, shapes and flavours as chosen", () => {
    expect(sizeLabel("round", "2tier_6_8")).toBe('2 Tier: 6" + 8"');
    expect(shapeDescription({ shape: "teddyBear" })).toBe("Teddy Bear");
    expect(flavourLabel("Longan")).toBe("Longan");
  });
});
