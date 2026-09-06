import { useState, useEffect, useMemo, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, ArrowRight, Check, ChevronDown, Minus, Plus } from "lucide-react";
import { SelectablePill } from "@/components/SelectablePill";
import { toast } from "sonner";
import { getCustomOrderPrice } from "../../../shared/customOrderPricing";
import { formatPrice } from "@/lib/utils";
import { useCart, type CakeFormat } from "@/contexts/CartContext";
import {
  THEMES,
  FLOWERS,
  CARTOON_CHARACTERS,
  SHAPES,
  CAKE_SHAPE_VALUES,
  CAKE_SHAPES,
  PLATTER_FORMAT_SHAPES,
  GIFT_BOX_FORMAT_SHAPES,
  FORMATS,
  PLATTER_INDIVIDUAL_SHAPES,
  SHAPE_SIZES,
  BASE_FLAVORS,
  DIETARY_OPTIONS,
} from "@/lib/customizeOptions";

const inputClass = "h-[52px] rounded-2xl border-[#e5e5e5]";

// Numbered section header, matching the Figma order-page pattern (teal index + Newsreader title)
function StepHeader({ number, title, description }: { number: number; title: string; description?: string }) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline gap-4">
        <span className="font-display font-semibold text-2xl text-primary shrink-0">
          {String(number).padStart(2, "0")}
        </span>
        <h2 className="text-2xl">{title}</h2>
      </div>
      {description && <p className="text-muted-foreground text-[15px]">{description}</p>}
    </div>
  );
}

// Circular photo swatch with carousel/swipe support, used for Format/Theme/Shape selection
function CircleOption({
  option,
  isSelected,
  onClick,
  caption,
  disabled,
}: {
  option: { value: string; label: string; image?: string; images?: string[] };
  isSelected: boolean;
  onClick: () => void;
  caption?: string;
  disabled?: boolean;
}) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);
  const images = option.images || (option.image ? [option.image] : []);

  useEffect(() => {
    if (images.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % images.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [images.length]);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (images.length <= 1) return;
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (images.length <= 1) return;
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (images.length <= 1 || !touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    if (Math.abs(distance) < 50) return;
    e.stopPropagation();
    if (distance > 0) {
      setCurrentImageIndex((prev) => (prev + 1) % images.length);
    } else {
      setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
    }
    setTouchStart(0);
    setTouchEnd(0);
  };

  return (
    <button
      type="button"
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      className={`flex flex-col items-center gap-2 w-[calc(50%-12px)] sm:w-[110px] px-2 sm:px-0 py-2 rounded-lg group transition-colors ${
        isSelected ? "bg-[#F7F1EB]" : ""
      } ${disabled ? "opacity-40 cursor-not-allowed" : ""}`}
    >
      <div
        className={`relative w-full aspect-square sm:size-24 rounded-full overflow-hidden transition-all ${
          images.length === 0 ? "bg-muted" : ""
        }`}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {images.length > 0 && (
          <img
            src={images[currentImageIndex]}
            alt={option.label}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 ease-out"
          />
        )}
      </div>
      <span className="text-[16px] sm:text-[14px] font-medium text-center leading-tight line-clamp-2">
        {option.label}
      </span>
      {caption && (
        <span className="text-[16px] sm:text-[14px] text-muted-foreground text-center leading-tight">{caption}</span>
      )}
    </button>
  );
}

function QuantityStepper({ value, onChange }: { value: number; onChange: (value: number) => void }) {
  return (
    <div className="inline-flex items-center border border-[#e5e5e5] rounded-2xl overflow-hidden">
      <button
        type="button"
        onClick={() => onChange(Math.max(1, value - 1))}
        className="w-12 h-[52px] flex items-center justify-center hover:bg-muted transition-colors"
      >
        <Minus className="h-4 w-4" />
      </button>
      <div className="w-14 h-[52px] flex items-center justify-center border-x border-[#e5e5e5] font-medium">
        {value}
      </div>
      <button
        type="button"
        onClick={() => onChange(value + 1)}
        className="w-12 h-[52px] flex items-center justify-center hover:bg-muted transition-colors"
      >
        <Plus className="h-4 w-4" />
      </button>
    </div>
  );
}

// "Serves X pax" copy from the Figma size-options frame, keyed by SHAPE_SIZES value.
// Only round/square share this exact size set with real servings data from Figma.
const SERVES_INFO: Record<string, string> = {
  "6inch": "serves 8-12 pax",
  "8inch": "serves 16-22 pax",
  "10inch": "serves 26-38 pax",
  "2tier_6_8": "serves 26-38 pax",
  "2tier_6_10": "serves 26-38 pax",
  "2tier_8_10": "serves 26-38 pax",
};

function getSizeBadge(value: string): string {
  const tierMatch = value.match(/^2tier_(\d+)_(\d+)$/);
  if (tierMatch) return `${tierMatch[1]}+${tierMatch[2]}”`;
  const inchMatch = value.match(/^(\d+)inch$/);
  if (inchMatch) return `${inchMatch[1]}”`;
  const cmMatch = value.match(/^(\d+)cm$/);
  if (cmMatch) return `${cmMatch[1]}cm`;
  const leadingNumber = value.match(/^(\d+)/);
  return leadingNumber ? leadingNumber[1] : value.slice(0, 3);
}

// Size option matching the Figma "size-options" frame: a mint circle badge,
// dimension + servings caption, and price below.
function SizeOption({
  option,
  price,
  isSelected,
  onClick,
}: {
  option: { value: string; label: string };
  price: number | null;
  isSelected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-col items-center gap-2 w-[calc(50%-12px)] sm:w-[110px] px-2 sm:px-0 py-2 rounded-lg transition-colors ${
        isSelected ? "bg-[#F7F1EB]" : ""
      }`}
    >
      <div className="w-full aspect-square sm:size-20 rounded-full bg-[#c8e5e4] flex items-center justify-center">
        <span className="font-display text-black text-2xl md:text-[28px] leading-none">
          {getSizeBadge(option.value)}
        </span>
      </div>
      <div className="text-center text-[16px] sm:text-[14px] leading-tight">
        <p className="font-medium text-foreground">{option.label}</p>
        {SERVES_INFO[option.value] && (
          <p className="text-muted-foreground">{SERVES_INFO[option.value]}</p>
        )}
      </div>
      {price && <p className="font-display text-base font-medium">{formatPrice(price)}</p>}
    </button>
  );
}

// Number-count option matching the Figma "numbers" size-selector: same
// mint-circle-badge + caption + price shape as SizeOption, but with a
// two-line circle badge (count + "Number"/"Numbers" label) since there's no
// single dimension value to abbreviate the way getSizeBadge does.
function NumberCountOption({
  count,
  dimension,
  serves,
  price,
  isSelected,
  onClick,
}: {
  count: 1 | 2;
  dimension: string;
  serves: string;
  price: number;
  isSelected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-col items-center gap-2 w-[calc(50%-12px)] sm:w-[110px] px-2 sm:px-0 py-2 rounded-lg transition-colors ${
        isSelected ? "bg-[#F7F1EB]" : ""
      }`}
    >
      <div className="w-full aspect-square sm:size-20 rounded-full bg-[#c8e5e4] flex flex-col items-center justify-center gap-1">
        <span className="font-display text-black text-2xl leading-none">{count}</span>
        <span className="text-black text-[16px] sm:text-[14px] leading-none">{count === 1 ? "Number" : "Numbers"}</span>
      </div>
      <div className="text-center text-[16px] sm:text-[14px] leading-tight">
        <p className="font-medium text-foreground">{dimension}</p>
        <p className="text-muted-foreground">{serves}</p>
      </div>
      <p className="font-display text-base font-medium">{formatPrice(price)}</p>
    </button>
  );
}

export default function Customize() {
  const { addCustomItem } = useCart();

  // Format, shape & size state
  const [format, setFormat] = useState<CakeFormat | "">("");
  const [shape, setShape] = useState("");
  const [size, setSize] = useState("");
  const [platterShapes, setPlatterShapes] = useState<string[]>([]);
  const [number1, setNumber1] = useState("");
  const [number2, setNumber2] = useState("");
  const [numberCount, setNumberCount] = useState<1 | 2>(2);
  const [quantity, setQuantity] = useState(1);

  // Theme & Design state
  const [theme, setTheme] = useState("");
  const [selectedFlowers, setSelectedFlowers] = useState<string[]>([]);
  const [cartoonCharacter, setCartoonCharacter] = useState("");
  const [handDrawnDesign, setHandDrawnDesign] = useState("");
  const [coutureBrand, setCoutureBrand] = useState("");
  const [specialInstructions, setSpecialInstructions] = useState("");
  const [referenceImageNames, setReferenceImageNames] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Flavor state
  const [selectedFlavors, setSelectedFlavors] = useState<string[]>([]);

  // Color preferences (optional, generic, all themes)
  const [color1, setColor1] = useState("");
  const [color2, setColor2] = useState("");
  const [color3, setColor3] = useState("");

  // Personalized text
  const [textOnCake, setTextOnCake] = useState("");

  // Dietary requirements
  const [dietaryRequirements, setDietaryRequirements] = useState<string[]>([]);

  const shapeOptionsForFormat =
    format === "cake" ? CAKE_SHAPES : format === "jellyPlatter" ? PLATTER_FORMAT_SHAPES : GIFT_BOX_FORMAT_SHAPES;

  const getRequiredFlavorCount = () => {
    if (shape === "platter9") return 3;
    if (shape === "platter6") return 2;
    if (shape === "platter4") return 2;
    return 1;
  };

  const getMaxShapeSelection = () => {
    if (shape === "platter9" && size === "6cm") return 3;
    if (shape === "platter6" && size === "6cm") return 3;
    if (shape === "platter4" && size === "6cm") return 2;
    return 0;
  };

  const shouldShowPlatterShapeSelection = () => {
    if (shape === "platter9" && size === "6cm") return true;
    if (shape === "platter6" && size === "6cm") return true;
    if (shape === "platter4" && size === "6cm") return true;
    return false;
  };

  // Cheesecake is only available for a plain 6" or 8" round cake (not the
  // 10" or 2-tier round sizes), the 6cm round piece within a jelly platter,
  // or the 6cm round option in Mini Gift Boxes (the "cupcake" shape).
  const isCheesecakeEligible = () => {
    if (format === "cake") return shape === "round" && (size === "6inch" || size === "8inch");
    if (format === "jellyPlatter") {
      return (
        (shape === "platter9" || shape === "platter6" || shape === "platter4") &&
        size === "6cm" &&
        platterShapes.includes("circle")
      );
    }
    if (format === "miniGiftBox") return shape === "cupcake";
    return false;
  };

  const availableFlavors = isCheesecakeEligible()
    ? BASE_FLAVORS
    : BASE_FLAVORS.filter((flavor) => flavor.value !== "Cheesecake");

  // Drop a previously-selected Cheesecake pick if an earlier step changes
  // (e.g. going back and switching to a 10" round) makes it ineligible.
  useEffect(() => {
    if (!isCheesecakeEligible() && selectedFlavors.includes("Cheesecake")) {
      setSelectedFlavors((prev) => prev.filter((f) => f !== "Cheesecake"));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [format, shape, size, platterShapes]);

  // Calculate estimated unit price
  const estimatedPrice = useMemo(() => {
    if (!theme || !shape || !size) return null;
    const basePrice = getCustomOrderPrice(theme, shape, size, numberCount);
    if (!basePrice) return null;
    return Number(basePrice.toFixed(2));
  }, [theme, shape, size, numberCount]);

  const totalPrice = useMemo(() => {
    if (estimatedPrice === null) return null;
    return format === "miniGiftBox" ? Number((estimatedPrice * quantity).toFixed(2)) : estimatedPrice;
  }, [estimatedPrice, format, quantity]);

  const shapeSizeComplete = useMemo(() => {
    if (!shape || !size) return false;
    if (shape === "platter9" || shape === "platter6" || shape === "platter4") {
      const maxShapes = getMaxShapeSelection();
      return maxShapes === 0 || platterShapes.length > 0;
    }
    if (shape === "numbers") return !!number1;
    return true;
  }, [shape, size, platterShapes, number1]);

  const handleFormatSelect = (value: CakeFormat) => {
    setFormat(value);
    setShape("");
    setSize("");
    setPlatterShapes([]);
    setQuantity(1);
    setNumber1("");
    setNumber2("");
  };

  const handleShapeSelect = (value: string) => {
    setShape(value);
    setPlatterShapes([]);
    setQuantity(1);
    if (value === "miniGiftBox" || value === "cupcake") {
      setSize(SHAPE_SIZES[value][0].value);
    } else {
      setSize("");
    }
  };

  const handleFlavorToggle = (flavor: string) => {
    const maxFlavors = getRequiredFlavorCount();
    const isSelected = selectedFlavors.includes(flavor);
    if (isSelected) {
      setSelectedFlavors(prev => prev.filter(f => f !== flavor));
    } else if (selectedFlavors.length < maxFlavors) {
      setSelectedFlavors(prev => [...prev, flavor]);
    } else {
      // Already at capacity: swap out the oldest pick for the new one
      setSelectedFlavors(prev => [...prev.slice(1), flavor]);
    }
  };

  const handlePlatterShapeToggle = (shapeValue: string) => {
    const maxShapes = getMaxShapeSelection();
    const isSelected = platterShapes.includes(shapeValue);
    if (isSelected) {
      setPlatterShapes(prev => prev.filter(s => s !== shapeValue));
    } else if (platterShapes.length < maxShapes) {
      setPlatterShapes(prev => [...prev, shapeValue]);
    }
  };

  const handleDietaryToggle = (requirement: string) => {
    setDietaryRequirements(prev => {
      if (requirement === "none") {
        return prev.includes("none") ? [] : ["none"];
      }
      const withoutNone = prev.filter(r => r !== "none");
      return withoutNone.includes(requirement)
        ? withoutNone.filter(r => r !== requirement)
        : [...withoutNone, requirement];
    });
  };

  const readyToAddToCart = !!(
    format && theme && shapeSizeComplete && selectedFlavors.length > 0 && totalPrice && dietaryRequirements.length > 0
  );

  // Wizard step navigation: one section visible at a time, matching the
  // Figma order-page's Back/Next pattern instead of a continuous scroll.
  const STEP_COUNT = 7;
  const [currentStep, setCurrentStep] = useState(1);

  // On mobile, "My Order" collapses into a tap-to-expand bar at the top of
  // the page instead of a panel stacked below the builder; desktop keeps the
  // always-visible sticky sidebar regardless of this state.
  const [mobileOrderOpen, setMobileOrderOpen] = useState(false);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [currentStep]);

  useEffect(() => {
    // Only auto-expand the mobile order bar once a dietary requirement has
    // actually been chosen on the final step, so the customer notices it's
    // where "Add to Cart" lives right when it becomes usable.
    setMobileOrderOpen(currentStep === STEP_COUNT && dietaryRequirements.length > 0);
  }, [currentStep, dietaryRequirements]);

  const isStepComplete = (step: number): boolean => {
    switch (step) {
      case 1: return !!format;
      case 2: return shapeSizeComplete;
      case 3: return !!theme;
      case 4: return selectedFlavors.length >= getRequiredFlavorCount();
      case 7: return dietaryRequirements.length > 0;
      default: return true; // steps 5-6 are optional
    }
  };

  const canGoBack = currentStep > 1;
  const canGoNext = currentStep < STEP_COUNT && isStepComplete(currentStep);

  const goBack = () => canGoBack && setCurrentStep((s) => s - 1);
  const goNext = () => canGoNext && setCurrentStep((s) => s + 1);

  const resetBuilder = () => {
    setFormat("");
    setShape("");
    setSize("");
    setPlatterShapes([]);
    setNumber1("");
    setNumber2("");
    setNumberCount(2);
    setQuantity(1);
    setTheme("");
    setSelectedFlowers([]);
    setCartoonCharacter("");
    setHandDrawnDesign("");
    setCoutureBrand("");
    setSpecialInstructions("");
    setReferenceImageNames([]);
    setSelectedFlavors([]);
    setColor1("");
    setColor2("");
    setColor3("");
    setTextOnCake("");
    setDietaryRequirements([]);
  };

  const buildCartItem = () => {
    if (!format || !theme || !shape || !size || !totalPrice) return null;

    const numbers = shape === "numbers" ? (numberCount === 2 ? `${number1},${number2}` : number1) : undefined;
    const selectedColors = [color1, color2, color3].filter(Boolean);
    const themeLabel = THEMES.find(t => t.value === theme)?.label || theme;
    const shapeLabel = SHAPES.find(s => s.value === shape)?.label || shape;
    const sizeLabel =
      shape === "numbers"
        ? `${numberCount} Number${numberCount > 1 ? "s" : ""}`
        : SHAPE_SIZES[shape]?.find(s => s.value === size)?.label || size;
    const image = THEMES.find(t => t.value === theme)?.images?.[0] || THEMES.find(t => t.value === theme)?.image || "";

    return {
      format,
      theme,
      themeLabel,
      selectedFlowers: selectedFlowers.length > 0 ? selectedFlowers : undefined,
      selectedColors: selectedColors.length > 0 ? selectedColors : undefined,
      cartoonCharacter: cartoonCharacter || undefined,
      themeCustomText: handDrawnDesign || undefined,
      fashionBrand: coutureBrand || undefined,
      shape,
      shapeLabel,
      size,
      sizeLabel,
      numbers,
      platterShapes: platterShapes.length > 0 ? platterShapes : undefined,
      flavours: selectedFlavors,
      cakeText: textOnCake || undefined,
      dietaryRequirements: dietaryRequirements.length > 0 ? dietaryRequirements.join(", ") : undefined,
      referenceLinks: referenceImageNames.length > 0 ? `Reference images: ${referenceImageNames.join(", ")}` : undefined,
      specialInstructions: specialInstructions || undefined,
      image,
      price: totalPrice,
      quantity: format === "miniGiftBox" ? quantity : 1,
    };
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      setReferenceImageNames(files.map(f => f.name));
    }
  };

  const handleAddToCart = () => {
    const item = buildCartItem();
    if (!item) {
      toast.error("Please complete all required fields");
      return;
    }
    addCustomItem(item);
    toast.success("Added to cart");
    resetBuilder();
  };

  // Shared between the mobile tap-to-expand bar (below the header) and the
  // always-visible desktop sticky sidebar.
  const sizeLabel = shape === "numbers"
    ? `8" ${numberCount === 2 ? '+ 8"' : ""}`
    : SHAPE_SIZES[shape]?.find(s => s.value === size)?.label;
  const colorPreferences = [color1, color2, color3].filter(Boolean).join(", ");
  const dietaryLabel = dietaryRequirements
    .map((value) => DIETARY_OPTIONS.find((o) => o.value === value)?.label ?? value)
    .join(", ");

  const summaryRows: { label: string; value: string }[] = [
    { label: "Format", value: FORMATS.find(f => f.value === format)?.label ?? "None" },
    { label: "Shape", value: SHAPES.find(s => s.value === shape)?.label ?? "None" },
    { label: "Size", value: sizeLabel ?? "None" },
    { label: "Theme", value: THEMES.find(t => t.value === theme)?.label ?? "None" },
    { label: "Base Flavour", value: selectedFlavors.length > 0 ? selectedFlavors.join(", ") : "None" },
    { label: "Color Preferences", value: colorPreferences || "None" },
    { label: "Personalized Text", value: textOnCake || "None" },
    { label: "Dietary Requirements", value: dietaryLabel || "None" },
  ];

  const orderSummaryContent = (
    <>
      <div className="flex flex-col shrink-0 border border-[#e4e6e8] divide-y divide-[#e4e6e8]">
        {summaryRows.map((row) => (
          <div key={row.label} className="min-h-[95px] flex flex-col justify-center gap-3 px-4 py-5">
            <p className="text-sm uppercase tracking-wide text-muted-foreground">{row.label}</p>
            <p className="font-display text-xl">{row.value}</p>
          </div>
        ))}
        {totalPrice && (
          <div className="min-h-[95px] flex items-center justify-between px-4 py-5">
            <p className="text-sm uppercase tracking-wide text-muted-foreground">Price</p>
            <p className="font-display text-2xl font-medium">{formatPrice(totalPrice)}</p>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-3 shrink-0">
        <Button
          type="button"
          size="lg"
          onClick={handleAddToCart}
          disabled={!readyToAddToCart}
          className="w-full h-[52px] rounded-full text-base bg-primary hover:opacity-90 text-primary-foreground"
        >
          Add to Cart
        </Button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="container py-12">
        <div className="flex flex-col lg:flex-row gap-10 items-stretch">
          {/* Main builder column */}
          <div className="flex-1 min-w-0 flex flex-col gap-12">
            {/* Mobile order summary: fixed full-width bar pinned under the header, so
                it stays reachable no matter how far the user has scrolled. A spacer
                reserves its height in the normal flow since the bar itself is fixed. */}
            <div className="lg:hidden h-16" aria-hidden="true" />
            <div className="lg:hidden fixed top-20 inset-x-0 z-40 bg-[#faf7f3]">
              <button
                type="button"
                onClick={() => setMobileOrderOpen((v) => !v)}
                className="w-full h-16 flex items-center justify-between px-6"
              >
                <span className="font-display text-lg">My Order</span>
                <span className="flex items-center gap-4">
                  {totalPrice && (
                    <span className="font-display text-lg font-medium">{formatPrice(totalPrice)}</span>
                  )}
                  <ChevronDown
                    className={`h-5 w-5 text-muted-foreground transition-transform ${mobileOrderOpen ? "rotate-180" : ""}`}
                  />
                </span>
              </button>
              {mobileOrderOpen && (
                <div className="flex flex-col gap-6 p-6 max-h-[calc(100vh-176px)] overflow-y-auto">
                  {orderSummaryContent}
                </div>
              )}
            </div>

            {/* Hero */}
            <section className="flex flex-col gap-4">
              <h1 className="font-normal text-[28px] md:text-[52px]">Customise your jelly cake</h1>
              <p className="text-muted-foreground text-base md:text-lg max-w-2xl">
                Customize every detail of your perfect jelly art cake — from format and shape to flavour and finishing touches.
              </p>
            </section>

            {/* 01 Format */}
            {currentStep === 1 && (
            <section className="flex flex-col gap-6 animate-in fade-in duration-300">
              <StepHeader
                number={1}
                title="Choose a format"
                description="Choose between a full sized cake, a platter of jellies, or individually packaged jellies"
              />
              <div className="flex flex-wrap gap-6">
                {FORMATS.map((formatOption) => (
                  <CircleOption
                    key={formatOption.value}
                    option={formatOption}
                    isSelected={format === formatOption.value}
                    onClick={() => handleFormatSelect(formatOption.value)}
                  />
                ))}
              </div>
            </section>
            )}

            {/* 02 Shape & Size */}
            {currentStep === 2 && (
                <section className="flex flex-col gap-6 animate-in fade-in duration-300">
                <StepHeader
                  number={2}
                  title="Choose a shape and size"
                  description="Choose a shape to view available size options for the shape."
                />
                <div className="flex flex-wrap gap-6">
                  {shapeOptionsForFormat.map((shapeOption) => (
                    <CircleOption
                      key={shapeOption.value}
                      option={shapeOption}
                      isSelected={shape === shapeOption.value}
                      onClick={() => handleShapeSelect(shapeOption.value)}
                      caption={
                        format === "miniGiftBox"
                          ? shapeOption.value === "miniGiftBox"
                            ? "Square | 10cm"
                            : "Circle | 6cm"
                          : undefined
                      }
                    />
                  ))}
                </div>

                {/* Cake format: size options (or numbers config) */}
                {format === "cake" && shape && shape !== "numbers" && SHAPE_SIZES[shape] && (
                  <>
                    <div className="h-px w-full bg-[#e5e5e5]" />
                    <div className="flex flex-wrap gap-6">
                      {SHAPE_SIZES[shape].map((sizeOption) => {
                        const price = getCustomOrderPrice(theme, shape, sizeOption.value);
                        return (
                          <SizeOption
                            key={sizeOption.value}
                            option={sizeOption}
                            price={price}
                            isSelected={size === sizeOption.value}
                            onClick={() => setSize(sizeOption.value)}
                          />
                        );
                      })}
                    </div>
                  </>
                )}

                {format === "cake" && shape === "numbers" && (
                  <>
                    <div className="h-px w-full bg-[#e5e5e5]" />
                    <div className="flex flex-wrap gap-6">
                      <NumberCountOption
                        count={1}
                        dimension={'8" / 20.3 cm'}
                        serves="serves 12-16 pax"
                        price={getCustomOrderPrice(theme, "numbers", "8x8", 1) || 0}
                        isSelected={numberCount === 1}
                        onClick={() => {
                          setNumberCount(1);
                          setSize("8x8");
                          setNumber2("");
                        }}
                      />
                      <NumberCountOption
                        count={2}
                        dimension={'8+8" / 20.3 cm'}
                        serves="serves 24-30 pax"
                        price={getCustomOrderPrice(theme, "numbers", "8x8", 2) || 0}
                        isSelected={numberCount === 2}
                        onClick={() => {
                          setNumberCount(2);
                          setSize("8x8");
                        }}
                      />
                    </div>
                    <div className="flex flex-col sm:flex-row gap-4">
                      <div className="flex-1 sm:max-w-[380px] border border-[#e5e5e5] rounded-2xl h-[52px] flex items-center gap-7 px-4 focus-within:border-primary/40 transition-colors">
                        <label className="shrink-0 text-sm text-foreground">First Number</label>
                        <input
                          type="number"
                          min="0"
                          max="9"
                          value={number1}
                          onChange={(e) => setNumber1(e.target.value)}
                          placeholder="0-9"
                          className="flex-1 min-w-0 text-sm bg-transparent outline-none placeholder:text-[#808582]"
                        />
                      </div>
                      {numberCount === 2 && (
                        <div className="flex-1 sm:max-w-[380px] border border-[#e5e5e5] rounded-2xl h-[52px] flex items-center gap-7 px-4 focus-within:border-primary/40 transition-colors">
                          <label className="shrink-0 text-sm text-foreground">Second Number</label>
                          <input
                            type="number"
                            min="0"
                            max="9"
                            value={number2}
                            onChange={(e) => setNumber2(e.target.value)}
                            placeholder="0-9"
                            className="flex-1 min-w-0 text-sm bg-transparent outline-none placeholder:text-[#808582]"
                          />
                        </div>
                      )}
                    </div>
                  </>
                )}

                {/* Jelly Platter format: size, then individual piece shapes */}
                {format === "jellyPlatter" && shape && SHAPE_SIZES[shape] && (
                  <>
                    <div className="h-px w-full bg-[#e5e5e5]" />
                    <div className="flex flex-wrap gap-6">
                      {SHAPE_SIZES[shape].map((sizeOption) => {
                        const price = getCustomOrderPrice(theme, shape, sizeOption.value);
                        return (
                          <SizeOption
                            key={sizeOption.value}
                            option={sizeOption}
                            price={price}
                            isSelected={size === sizeOption.value}
                            onClick={() => {
                              setSize(sizeOption.value);
                              setPlatterShapes([]);
                            }}
                          />
                        );
                      })}
                    </div>
                  </>
                )}

                {format === "jellyPlatter" && shouldShowPlatterShapeSelection() && (
                  <>
                    <div className="h-px w-full bg-[#e5e5e5]" />
                    <p className="text-muted-foreground text-[15px]">
                      Select up to {getMaxShapeSelection()} different shapes for your {shape === "platter9" ? "9" : shape === "platter6" ? "6" : "4"} pieces
                    </p>
                    <div className="flex flex-wrap gap-6">
                      {PLATTER_INDIVIDUAL_SHAPES.map((shapeOption) => {
                        const isSelected = platterShapes.includes(shapeOption.value);
                        const isDisabled = !isSelected && platterShapes.length >= getMaxShapeSelection();
                        return (
                          <CircleOption
                            key={shapeOption.value}
                            option={shapeOption}
                            isSelected={isSelected}
                            disabled={isDisabled}
                            onClick={() => handlePlatterShapeToggle(shapeOption.value)}
                          />
                        );
                      })}
                    </div>
                  </>
                )}

                {/* Mini Gift Box format: quantity stepper */}
                {format === "miniGiftBox" && shape && (
                  <>
                    <div className="h-px w-full bg-[#e5e5e5]" />
                    <div>
                      <Label className="mb-2 block">Quantity</Label>
                      <QuantityStepper value={quantity} onChange={setQuantity} />
                    </div>
                  </>
                )}
              </section>
            )}

            {/* 03 Theme */}
            {currentStep === 3 && (
                <section className="flex flex-col gap-6 animate-in fade-in duration-300">
                <StepHeader number={3} title="Choose a theme" description="Choose the design theme for your jelly cake" />
                <div className="flex flex-wrap gap-6">
                  {THEMES.map((themeOption) => (
                    <CircleOption
                      key={themeOption.value}
                      option={themeOption}
                      isSelected={theme === themeOption.value}
                      onClick={() => setTheme(themeOption.value)}
                    />
                  ))}
                </div>

                {theme === "floralBouquet" && (
                  <div className="flex flex-col gap-4">
                    <div className="h-px w-full max-w-2xl bg-[#e5e5e5]" />
                    <p className="text-sm text-muted-foreground">
                      Choose up to 3 flower types. Flower colors will be customised based on the color preferences indicated. Images provided are for reference only.
                    </p>
                    <div className="flex flex-wrap gap-6">
                      {FLOWERS.map((flower) => {
                        const isSelected = selectedFlowers.includes(flower.value);
                        const isDisabled = !isSelected && selectedFlowers.length >= 3;
                        return (
                          <CircleOption
                            key={flower.value}
                            option={flower}
                            isSelected={isSelected}
                            disabled={isDisabled}
                            onClick={() => {
                              setSelectedFlowers(prev =>
                                isSelected ? prev.filter(f => f !== flower.value) : [...prev, flower.value]
                              );
                            }}
                          />
                        );
                      })}
                    </div>
                  </div>
                )}

                {theme === "cartoonCharacters" && (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-w-4xl">
                    {CARTOON_CHARACTERS.map((character) => (
                      <SelectablePill
                        key={character}
                        selected={cartoonCharacter === character}
                        onClick={() => setCartoonCharacter(character)}
                        className="flex items-center justify-between px-4 py-3"
                      >
                        <span>{character}</span>
                        {cartoonCharacter === character && <Check className="h-4 w-4 text-primary" />}
                      </SelectablePill>
                    ))}
                  </div>
                )}

                {theme === "handDrawn" && (
                  <Textarea
                    value={handDrawnDesign}
                    onChange={(e) => setHandDrawnDesign(e.target.value)}
                    placeholder="Describe your custom hand-drawn design..."
                    className="min-h-[120px] rounded-2xl border-[#e5e5e5] max-w-2xl"
                  />
                )}

                {theme === "coutureFashion" && (
                  <Input
                    value={coutureBrand}
                    onChange={(e) => setCoutureBrand(e.target.value)}
                    placeholder="Enter brand name (e.g., Chanel, Dior)..."
                    className={inputClass}
                  />
                )}

                {theme && (
                  <div className="flex flex-col gap-3">
                    <div className="border border-[#e5e5e5] rounded-2xl h-[52px] flex items-center gap-7 px-4 focus-within:border-primary/40 transition-colors">
                      <label className="shrink-0 text-sm text-foreground">Additional Notes</label>
                      <input
                        value={specialInstructions}
                        onChange={(e) => setSpecialInstructions(e.target.value)}
                        placeholder="Tell us more about what your loved one likes or add web links to references"
                        className="flex-1 min-w-0 text-sm bg-transparent outline-none placeholder:text-[#808582]"
                      />
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="border border-[#e5e5e5] rounded-2xl h-[52px] flex items-center justify-center gap-2 px-4 text-sm outline-none hover:border-primary/40 focus-visible:border-primary/40 transition-colors"
                    >
                      <img src="/customize/icon-cloud-upload.svg" alt="" className="size-[18px]" />
                      <span>
                        {referenceImageNames.length > 0
                          ? referenceImageNames.join(", ")
                          : "Upload reference images"}
                      </span>
                    </button>
                  </div>
                )}
              </section>
            )}

            {/* 04 Base Flavour */}
            {currentStep === 4 && (
                <section className="flex flex-col gap-6 animate-in fade-in duration-300">
                <StepHeader
                  number={4}
                  title="Choose a base flavour"
                  description={
                    getRequiredFlavorCount() > 1
                      ? `Choose up to ${getRequiredFlavorCount()} flavours for your jelly cake`
                      : "Choose 1 flavour for your jelly cake"
                  }
                />
                <div className="flex flex-wrap gap-6">
                  {availableFlavors.map((flavor) => {
                    const isSelected = selectedFlavors.includes(flavor.value);
                    return (
                      <CircleOption
                        key={flavor.value}
                        option={flavor}
                        isSelected={isSelected}
                        onClick={() => handleFlavorToggle(flavor.value)}
                      />
                    );
                  })}
                </div>
              </section>
            )}

            {/* 05 Color preferences (optional) */}
            {currentStep === 5 && (
                <section className="flex flex-col gap-6 animate-in fade-in duration-300">
                <StepHeader
                  number={5}
                  title="Let us know your color preferences (optional)"
                  description="Specify up to three colors that you would like on your cake."
                />
                <div className="max-w-2xl space-y-3">
                  <Input value={color1} onChange={(e) => setColor1(e.target.value)} placeholder="Color 1" className={inputClass} />
                  <Input value={color2} onChange={(e) => setColor2(e.target.value)} placeholder="Color 2" className={inputClass} />
                  <Input value={color3} onChange={(e) => setColor3(e.target.value)} placeholder="Color 3" className={inputClass} />
                </div>
              </section>
            )}

            {/* 06 Personalized text (optional) */}
            {currentStep === 6 && (
                <section className="flex flex-col gap-6 animate-in fade-in duration-300">
                <StepHeader number={6} title="Add personalized text (optional)" description="The number of English characters is limited to 30. Simple Chinese phrases and characters are available, such as 生日快乐，福，发财." />
                <div className="max-w-2xl space-y-4">
                  <Input
                    value={textOnCake}
                    onChange={(e) => setTextOnCake(e.target.value.slice(0, 30))}
                    placeholder="Text on cake"
                    className={inputClass}
                  />
                </div>
              </section>
            )}

            {/* 07 Dietary requirements */}
            {currentStep === 7 && (
                <section className="flex flex-col gap-6 animate-in fade-in duration-300">
                <StepHeader number={7} title="Dietary requirements" />
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-2xl">
                  {DIETARY_OPTIONS.map((option) => {
                    const isSelected = dietaryRequirements.includes(option.value);
                    return (
                      <SelectablePill
                        key={option.value}
                        selected={isSelected}
                        onClick={() => handleDietaryToggle(option.value)}
                        className="flex items-center justify-between px-4 py-3"
                      >
                        <span>{option.label}</span>
                        {isSelected && <Check className="h-4 w-4 text-primary" />}
                      </SelectablePill>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Back / Next navigation */}
            <div className="flex items-center justify-between w-full">
              <button
                type="button"
                onClick={goBack}
                disabled={!canGoBack}
                className="flex items-center gap-2 px-5 py-2.5 rounded-full border border-[#eae6e1] bg-white text-sm font-medium text-[#6e7376] disabled:opacity-40 disabled:cursor-not-allowed hover:border-primary/40 transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </button>
              {currentStep < STEP_COUNT && (
                <button
                  type="button"
                  onClick={goNext}
                  disabled={!canGoNext}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-full border border-primary bg-primary text-sm font-medium text-white disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
                >
                  Next
                  <ArrowRight className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          {/* Order summary sidebar (desktop only — mobile has its own tap-to-expand bar below the header) */}
          <div className="hidden lg:block lg:w-[380px] shrink-0 lg:sticky lg:top-6 lg:self-start">
            <div className="bg-[#faf7f3] h-full p-10 flex flex-col gap-6">
              <h2 className="text-2xl">My Order</h2>
              {orderSummaryContent}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
