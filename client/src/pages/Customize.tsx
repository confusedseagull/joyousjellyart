import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Check, Minus, Plus } from "lucide-react";
import { SelectablePill } from "@/components/SelectablePill";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { getCustomOrderPrice } from "../../../shared/customOrderPricing";
import { formatPrice } from "@/lib/utils";
import { useCustomCart, type CakeFormat } from "@/contexts/CustomCartContext";

// Theme options
const THEMES = [
  { value: "floralBouquet", label: "Floral Bouquet", images: [
    "/customize/floralBouquet-1.jpg",
    "/customize/floralBouquet-2.png",
    "/customize/floralBouquet-3.png",
    "/customize/floralBouquet-4.png",
    "/customize/floralBouquet-5.jpg",
    "/customize/floralBouquet-6.jpg",
    "/customize/floralBouquet-7.jpg"
  ] },
  { value: "cartoonCharacters", label: "Cartoon Characters", images: [
    "/customize/cartoonCharacters-1.jpg",
    "/customize/cartoonCharacters-2.jpg",
    "/customize/cartoonCharacters-3.jpg",
    "/customize/cartoonCharacters-4.jpg",
    "/customize/cartoonCharacters-5.png",
    "/customize/cartoonCharacters-6.png"
  ] },
  { value: "handDrawn", label: "Hand Drawn", images: [
    "/customize/handDrawn-1.jpg",
    "/customize/handDrawn-2.png",
    "/customize/handDrawn-3.png",
    "/customize/handDrawn-4.jpg"
  ] },
  { value: "lego", label: "Lego", images: [
    "/customize/lego-1.jpg",
    "/customize/lego-2.jpg",
    "/customize/lego-3.jpg",
    "/customize/lego-4.jpg"
  ] },
  { value: "mahjong", label: "Mahjong", images: [
    "/customize/mahjong-1.jpg",
    "/customize/mahjong-2.jpg",
    "/customize/mahjong-3.jpg",
    "/customize/mahjong-4.jpg"
  ] },
  { value: "poker", label: "Poker", images: [
    "/customize/poker-1.jpg",
    "/customize/poker-2.jpg"
  ] },
  { value: "chess", label: "Chess", image: "/customize/chess.jpg" },
  { value: "underTheSea", label: "Under the Sea", images: [
    "/customize/underTheSea-1.jpg",
    "/customize/underTheSea-2.png",
    "/customize/underTheSea-3.png",
    "/customize/underTheSea-4.png",
    "/customize/underTheSea-5.jpg"
  ] },
  { value: "animalKingdom", label: "Animal Kingdom", image: "/animal-kingdom.jpg" },
  { value: "unicorn", label: "Unicorn", images: [
    "/customize/unicorn-1.jpg",
    "/customize/unicorn-2.jpg",
    "/customize/unicorn-3.jpg",
    "/customize/unicorn-4.jpg"
  ] },
  { value: "dinosaurs", label: "Dinosaurs", image: "/dinosaurs.jpg" },
  { value: "space", label: "Space", image: "/customize/space.jpg" },
  { value: "koiPond", label: "Koi Pond", images: [
    "/customize/koiPond-1.jpg",
    "/customize/koiPond-2.jpg"
  ] },
  { value: "golf", label: "Golf", image: "/customize/golf.jpg" },
  { value: "cars", label: "Cars", image: "/customize/cars.jpg" },
  { value: "coutureFashion", label: "Couture/High Fashion", image: "/customize/coutureFashion.jpg" },
  { value: "cactus", label: "Cactus", image: "/customize/cactus.jpg" },
  { value: "foliage", label: "Foliage", image: "/foliage.jpg" },
  { value: "butterflies", label: "Butterflies", image: "/customize/butterflies.jpg" },
  { value: "sports", label: "Sports", image: "/sports.jpg" },
  { value: "mermaid", label: "Mermaid", image: "/customize/mermaid.jpg" },
  { value: "teddyBear", label: "Teddy Bear", image: "/teddy-bear.jpg" },
];

const FLOWERS = [
  "Peony", "Rose", "Sunflowers", "Magnolias", "Sakuras", "Bengal Rose",
  "Lotus", "Daisy", "Gerbera", "Hydrangeas", "Dahlias", "Orchid",
  "Tulip", "Carnations", "Marigolds", "Dianthus", "Clematis"
];

const CARTOON_CHARACTERS = [
  "Pikachu", "Hello Kitty", "Cinnamoroll", "My Melody", "Kuromi",
  "Miffy", "Sumikko Gurashi", "Super Mario", "Winnie the Pooh"
];

const SHAPES = [
  { value: "round", label: "Round", image: "/customize/shape-round.png" },
  { value: "square", label: "Square", image: "/customize/shape-square.png" },
  { value: "octagon", label: "Octagon", image: "/customize/shape-octagon.png" },
  { value: "heart", label: "Heart", image: "/customize/shape-heart.png" },
  { value: "star", label: "Star", image: "/customize/shape-star.png" },
  { value: "teddyBear", label: "Teddy Bear", image: "/customize/shape-teddyBear.png" },
  { value: "fan", label: "Fan", image: "/customize/shape-fan.png" },
  { value: "rectangle", label: "Rectangle", image: "/customize/shape-rectangle.png" },
  { value: "scalloped", label: "Scalloped Round/Rosette", image: "/customize/shape-scalloped.png" },
  { value: "numbers", label: "Numbers", image: "/customize/shape-numbers.png" },
  { value: "sakura", label: "Sakura", image: "/customize/shape-sakura.png" },
  { value: "platter9", label: "Platter of 9", image: "/customize/shape-platter9.png" },
  { value: "platter4", label: "Platter of 4", image: "/customize/shape-platter4.png" },
  { value: "miniGiftBox", label: "Mini Gift Box", image: "/customize/shape-miniGiftBox.png" },
  { value: "cupcake", label: "Cupcake", image: "/customize/shape-cupcake.png" },
];

const CAKE_SHAPE_VALUES = ["round", "square", "octagon", "heart", "star", "teddyBear", "fan", "rectangle", "scalloped", "numbers", "sakura"];
const CAKE_SHAPES = SHAPES.filter(s => CAKE_SHAPE_VALUES.includes(s.value));
const PLATTER_FORMAT_SHAPES = SHAPES.filter(s => s.value === "platter9" || s.value === "platter4");
const GIFT_BOX_FORMAT_SHAPES = SHAPES.filter(s => s.value === "miniGiftBox" || s.value === "cupcake");

const FORMATS: { value: CakeFormat; label: string; image: string }[] = [
  { value: "cake", label: "Cake", image: "/customize/round.jpg" },
  { value: "jellyPlatter", label: "Jelly Platter", image: "/customize/platter9.jpg" },
  { value: "miniGiftBox", label: "Mini Gift Boxes", image: "/customize/miniGiftBox.jpg" },
];

const PLATTER_INDIVIDUAL_SHAPES = [
  { value: "heart", label: "Heart", image: "/customize/shape-platter-heart.png" },
  { value: "square", label: "Square", image: "/customize/shape-platter-square.png" },
  { value: "circle", label: "Round", image: "/customize/shape-platter-circle.png" },
  { value: "clover", label: "Clover" },
];

const SHAPE_SIZES: { [key: string]: { value: string; label: string }[] } = {
  round: [
    { value: "6inch", label: '6" / 15.2 cm' },
    { value: "8inch", label: '8" / 20.3 cm' },
    { value: "10inch", label: '10" / 25.4 cm' },
    { value: "2tier_6_8", label: '2 Tier: 6" + 8"' },
    { value: "2tier_6_10", label: '2 Tier: 6" + 10"' },
    { value: "2tier_8_10", label: '2 Tier: 8" + 10"' },
  ],
  square: [
    { value: "6inch", label: '6" / 15.2 cm' },
    { value: "8inch", label: '8" / 20.3 cm' },
    { value: "10inch", label: '10" / 25.4 cm' },
    { value: "2tier_6_8", label: '2 Tier: 6" + 8"' },
    { value: "2tier_6_10", label: '2 Tier: 6" + 10"' },
    { value: "2tier_8_10", label: '2 Tier: 8" + 10"' },
  ],
  octagon: [
    { value: "6inch", label: '6" / 15.2 cm' },
    { value: "8inch", label: '8" / 20.3 cm' },
    { value: "2tier_6_8", label: '2 Tier: 6" + 8"' },
  ],
  heart: [
    { value: "7inch", label: '7" / 17.8 cm' },
    { value: "8inch", label: '8" / 20.3 cm' },
    { value: "10inch", label: '10" / 25.4 cm' },
  ],
  star: [
    { value: "10inch", label: '10" / 25.4 cm' },
  ],
  teddyBear: [
    { value: "10inch", label: '10" / 25.4 cm' },
  ],
  fan: [
    { value: "10inch", label: '10" / 25.4 cm' },
  ],
  rectangle: [
    { value: "10x7", label: '10" x 7" / 25.4 cm x 17.8 cm' },
  ],
  scalloped: [
    { value: "10inch", label: '10" / 25.4 cm' },
  ],
  platter9: [
    { value: "6cm", label: '6cm (Choose up to 3 shapes: Heart, Square, Round, Clover)' },
  ],
  platter4: [
    { value: "6cm", label: '6cm (Choose 2 shapes: Square, Heart, Clover, Round)' },
    { value: "10cm", label: '10cm (Square only)' },
  ],
  numbers: [
    { value: "8x8", label: '8" + 8" / 20.3 cm' },
  ],
  miniGiftBox: [
    { value: "10cm", label: '10cm / 25.4 cm' },
  ],
  cupcake: [
    { value: "6cm", label: '6cm' },
  ],
};

const BASE_FLAVORS = [
  { value: "Longan", label: "Longan", image: "/customize/flavour-longan.png" },
  { value: "Lychee", label: "Lychee", image: "/customize/flavour-lychee.png" },
  { value: "Coconut", label: "Coconut", image: "/customize/flavour-coconut.png" },
  { value: "Osmanthus Bloom", label: "Osmanthus Bloom", image: "/customize/flavour-osmanthusBloom.png" },
  { value: "Yuzu", label: "Yuzu", image: "/customize/flavour-yuzu.png" },
  { value: "Taro", label: "Taro", image: "/customize/flavour-taro.png" },
  { value: "Strawberry", label: "Strawberry", image: "/customize/flavour-strawberry.png" },
  { value: "Jujube & Gojiberries", label: "Jujube & Gojiberries", image: "/customize/flavour-jujubeGojiberries.png" },
  { value: "Pineapple", label: "Pineapple" },
  { value: "Valrhona Chocolate", label: "Valrhona Chocolate", image: "/customize/flavour-valrhonaChocolate.png" },
  { value: "Passionfruit", label: "Passionfruit", image: "/customize/flavour-passionfruit.png" },
  { value: "Berries Delight", label: "Berries Delight", image: "/customize/flavour-berriesDelight.png" },
  { value: "Cheesecake", label: "Cheesecake" },
];

const DIETARY_OPTIONS = [
  { value: "noDairy", label: "Dairy Free" },
  { value: "noNuts", label: "No Nuts" },
  { value: "vegetarian", label: "Vegetarian" },
  { value: "vegan", label: "Vegan" },
];

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
      className={`flex flex-col items-center gap-2 w-[110px] py-2 rounded-lg group transition-colors ${
        isSelected ? "bg-[#faf7f3]" : ""
      } ${disabled ? "opacity-40 cursor-not-allowed" : ""}`}
    >
      <div
        className={`relative size-24 rounded-full overflow-hidden transition-all ${
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
        {images.length > 1 && (
          <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 flex gap-1">
            {images.map((_, index) => (
              <div
                key={index}
                className={`h-1 rounded-full transition-all ${
                  index === currentImageIndex ? "w-3 bg-white" : "w-1 bg-white/50"
                }`}
              />
            ))}
          </div>
        )}
      </div>
      <span className="text-xs font-semibold text-center leading-tight line-clamp-2">
        {option.label}
      </span>
      {caption && (
        <span className="text-xs text-muted-foreground text-center leading-tight">{caption}</span>
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

export default function Customize() {
  const [, navigate] = useLocation();
  const { addItem } = useCustomCart();

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
  const [referenceLinks, setReferenceLinks] = useState("");
  const [specialInstructions, setSpecialInstructions] = useState("");

  // Flavor state
  const [selectedFlavors, setSelectedFlavors] = useState<string[]>([]);

  // Color preferences (optional, generic, all themes)
  const [color1, setColor1] = useState("");
  const [color2, setColor2] = useState("");
  const [color3, setColor3] = useState("");

  // Personalized text
  const [textOnCake, setTextOnCake] = useState("");
  const [textLanguage, setTextLanguage] = useState("english");

  // Dietary requirements
  const [dietaryRequirements, setDietaryRequirements] = useState<string[]>([]);

  const shapeOptionsForFormat =
    format === "cake" ? CAKE_SHAPES : format === "jellyPlatter" ? PLATTER_FORMAT_SHAPES : GIFT_BOX_FORMAT_SHAPES;

  const getRequiredFlavorCount = () => {
    if (shape === "platter9") return 2;
    if (shape === "platter4") return 2;
    return 1;
  };

  const getMaxShapeSelection = () => {
    if (shape === "platter9" && size === "6cm") return 3;
    if (shape === "platter4" && size === "6cm") return 2;
    return 0;
  };

  const shouldShowPlatterShapeSelection = () => {
    if (shape === "platter9" && size === "6cm") return true;
    if (shape === "platter4" && size === "6cm") return true;
    return false;
  };

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
    if (shape === "platter9" || shape === "platter4") {
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
    setDietaryRequirements(prev =>
      prev.includes(requirement) ? prev.filter(r => r !== requirement) : [...prev, requirement]
    );
  };

  const readyToAddToCart = !!(format && theme && shapeSizeComplete && selectedFlavors.length > 0 && totalPrice);

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
    setReferenceLinks("");
    setSpecialInstructions("");
    setSelectedFlavors([]);
    setColor1("");
    setColor2("");
    setColor3("");
    setTextOnCake("");
    setTextLanguage("english");
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
      cakeTextLanguage: textOnCake ? (textLanguage as "english" | "chinese") : undefined,
      dietaryRequirements: dietaryRequirements.length > 0 ? dietaryRequirements.join(", ") : undefined,
      referenceLinks: referenceLinks || undefined,
      specialInstructions: specialInstructions || undefined,
      image,
      price: totalPrice,
      quantity: format === "miniGiftBox" ? quantity : 1,
    };
  };

  const handleAddToCart = () => {
    const item = buildCartItem();
    if (!item) {
      toast.error("Please complete all required fields");
      return;
    }
    addItem(item);
    toast.success("Added to cart");
    resetBuilder();
  };

  const handleOrderNow = () => {
    const item = buildCartItem();
    if (!item) {
      toast.error("Please complete all required fields");
      return;
    }
    addItem(item);
    navigate("/customize/cart");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="container pt-12 pb-8 md:pt-16 md:pb-10">
        <h1>Customise your jelly cake</h1>
        <p className="text-muted-foreground text-base md:text-lg mt-4 max-w-2xl">
          Customize every detail of your perfect jelly art cake — from format and shape to flavour and finishing touches.
        </p>
      </section>

      <div className="h-px w-full bg-[#e5e5e5]" />

      <div className="container py-12">
        <div className="flex flex-col lg:flex-row gap-10 items-start">
          {/* Main builder column */}
          <div className="flex-1 min-w-0 flex flex-col gap-12">
            {/* 01 Format */}
            <section className="flex flex-col gap-6">
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

            {/* 02 Shape & Size */}
            {format && (
              <section className="flex flex-col gap-6">
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
                    <div className="flex flex-wrap gap-4">
                      {SHAPE_SIZES[shape].map((sizeOption) => {
                        const price = getCustomOrderPrice(theme, shape, sizeOption.value);
                        return (
                          <SelectablePill
                            key={sizeOption.value}
                            selected={size === sizeOption.value}
                            onClick={() => setSize(sizeOption.value)}
                            className="flex flex-col items-center justify-center p-6 min-w-[150px]"
                          >
                            <span className="font-medium text-center mb-2">{sizeOption.label}</span>
                            {price && <span className="text-xl font-semibold text-primary">{formatPrice(price)}</span>}
                            {size === sizeOption.value && <Check className="h-5 w-5 text-primary mt-2" />}
                          </SelectablePill>
                        );
                      })}
                    </div>
                  </>
                )}

                {format === "cake" && shape === "numbers" && (
                  <>
                    <div className="h-px w-full bg-[#e5e5e5]" />
                    <div className="max-w-md space-y-6">
                      <div className="grid grid-cols-2 gap-4">
                        <Card
                          className={`cursor-pointer transition-all rounded-2xl ${
                            numberCount === 1 ? "border-[#e5e5e5] bg-[#faf7f3]" : "border-[#e5e5e5] hover:border-primary/40"
                          }`}
                          onClick={() => {
                            setNumberCount(1);
                            setSize("8inch");
                            setNumber2("");
                          }}
                        >
                          <CardContent className="p-6 text-center">
                            <div className="text-2xl font-semibold mb-2">1 Number</div>
                            <div className="text-sm text-muted-foreground mb-1">8" / 20.3 cm</div>
                            <div className="text-lg font-semibold text-primary">$118</div>
                          </CardContent>
                        </Card>
                        <Card
                          className={`cursor-pointer transition-all rounded-2xl ${
                            numberCount === 2 ? "border-[#e5e5e5] bg-[#faf7f3]" : "border-[#e5e5e5] hover:border-primary/40"
                          }`}
                          onClick={() => {
                            setNumberCount(2);
                            setSize("8inch+8inch");
                          }}
                        >
                          <CardContent className="p-6 text-center">
                            <div className="text-2xl font-semibold mb-2">2 Numbers</div>
                            <div className="text-sm text-muted-foreground mb-1">8" + 8" / 20.3 cm</div>
                            <div className="text-lg font-semibold text-primary">$158</div>
                          </CardContent>
                        </Card>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="mb-2 block">First Number</Label>
                          <Input
                            type="number"
                            min="0"
                            max="9"
                            value={number1}
                            onChange={(e) => setNumber1(e.target.value)}
                            placeholder="0-9"
                            className={inputClass}
                          />
                        </div>
                        {numberCount === 2 && (
                          <div>
                            <Label className="mb-2 block">Second Number</Label>
                            <Input
                              type="number"
                              min="0"
                              max="9"
                              value={number2}
                              onChange={(e) => setNumber2(e.target.value)}
                              placeholder="0-9"
                              className={inputClass}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}

                {/* Jelly Platter format: size, then individual piece shapes */}
                {format === "jellyPlatter" && shape && SHAPE_SIZES[shape] && (
                  <>
                    <div className="h-px w-full bg-[#e5e5e5]" />
                    <div className="flex flex-wrap gap-4">
                      {SHAPE_SIZES[shape].map((sizeOption) => {
                        const price = getCustomOrderPrice(theme, shape, sizeOption.value);
                        return (
                          <SelectablePill
                            key={sizeOption.value}
                            selected={size === sizeOption.value}
                            onClick={() => {
                              setSize(sizeOption.value);
                              setPlatterShapes([]);
                            }}
                            className="flex flex-col items-center justify-center p-6 min-w-[150px]"
                          >
                            <span className="font-medium text-center mb-2">{sizeOption.label}</span>
                            {price && <span className="text-xl font-semibold text-primary">{formatPrice(price)}</span>}
                            {size === sizeOption.value && <Check className="h-5 w-5 text-primary mt-2" />}
                          </SelectablePill>
                        );
                      })}
                    </div>
                  </>
                )}

                {format === "jellyPlatter" && shouldShowPlatterShapeSelection() && (
                  <>
                    <div className="h-px w-full bg-[#e5e5e5]" />
                    <p className="text-muted-foreground text-[15px]">
                      Select up to {getMaxShapeSelection()} different shapes for your {shape === "platter9" ? "9" : "4"} pieces
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
            {format && shapeSizeComplete && (
              <section className="flex flex-col gap-6">
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
                  <div className="max-w-4xl">
                    <Label className="text-base font-semibold mb-4 block">Select Flowers (up to 3)</Label>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                      {FLOWERS.map((flower) => {
                        const isSelected = selectedFlowers.includes(flower);
                        const isDisabled = !isSelected && selectedFlowers.length >= 3;
                        return (
                          <SelectablePill
                            key={flower}
                            selected={isSelected}
                            disabled={isDisabled}
                            onClick={() => {
                              setSelectedFlowers(prev =>
                                isSelected ? prev.filter(f => f !== flower) : [...prev, flower]
                              );
                            }}
                            className="flex items-center justify-between px-4 py-3"
                          >
                            <span>{flower}</span>
                            {isSelected && <Check className="h-4 w-4 text-primary" />}
                          </SelectablePill>
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
                    className={`${inputClass} max-w-2xl`}
                  />
                )}

                {theme && (
                  <div className="max-w-2xl space-y-3">
                    <Input
                      value={referenceLinks}
                      onChange={(e) => setReferenceLinks(e.target.value)}
                      placeholder="Reference links (optional)"
                      className={inputClass}
                    />
                    <Textarea
                      value={specialInstructions}
                      onChange={(e) => setSpecialInstructions(e.target.value)}
                      placeholder="Additional notes — tell us more about what your loved one likes, or any special requests"
                      className="min-h-[90px] rounded-2xl border-[#e5e5e5]"
                    />
                  </div>
                )}
              </section>
            )}

            {/* 04 Base Flavour */}
            {theme && (
              <section className="flex flex-col gap-6">
                <StepHeader
                  number={4}
                  title="Choose a base flavour"
                  description={`Choose ${getRequiredFlavorCount()} flavour${getRequiredFlavorCount() > 1 ? "s" : ""} for your jelly cake`}
                />
                <div className="flex flex-wrap gap-6">
                  {BASE_FLAVORS.map((flavor) => {
                    const isSelected = selectedFlavors.includes(flavor.value);
                    const isDisabled = !isSelected && selectedFlavors.length >= getRequiredFlavorCount();
                    return (
                      <CircleOption
                        key={flavor.value}
                        option={flavor}
                        isSelected={isSelected}
                        disabled={isDisabled}
                        onClick={() => handleFlavorToggle(flavor.value)}
                      />
                    );
                  })}
                </div>
              </section>
            )}

            {/* 05 Color preferences (optional) */}
            {selectedFlavors.length > 0 && (
              <section className="flex flex-col gap-6">
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
            {selectedFlavors.length > 0 && (
              <section className="flex flex-col gap-6">
                <StepHeader number={6} title="Add personalized text (optional)" description="The number of characters is limited to 25." />
                <div className="max-w-2xl space-y-4">
                  <Input
                    value={textOnCake}
                    onChange={(e) => setTextOnCake(e.target.value.slice(0, 25))}
                    placeholder="Text on cake (English or Chinese)"
                    className={inputClass}
                  />
                  {textOnCake && (
                    <div className="flex gap-4">
                      <SelectablePill
                        selected={textLanguage === "english"}
                        onClick={() => setTextLanguage("english")}
                        className="flex-1 flex items-center justify-center px-4 py-3"
                      >
                        <span>English</span>
                        {textLanguage === "english" && <Check className="h-4 w-4 text-primary ml-2" />}
                      </SelectablePill>
                      <SelectablePill
                        selected={textLanguage === "chinese"}
                        onClick={() => setTextLanguage("chinese")}
                        className="flex-1 flex items-center justify-center px-4 py-3"
                      >
                        <span>Chinese</span>
                        {textLanguage === "chinese" && <Check className="h-4 w-4 text-primary ml-2" />}
                      </SelectablePill>
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* 07 Dietary requirements (optional) */}
            {selectedFlavors.length > 0 && (
              <section className="flex flex-col gap-6">
                <StepHeader number={7} title="Dietary requirements (optional)" />
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
          </div>

          {/* Sticky order summary sidebar */}
          <div className="w-full lg:w-[380px] shrink-0 lg:sticky lg:top-24">
            <div className="bg-[#faf7f3] rounded-2xl p-8 flex flex-col gap-6">
              <h2 className="text-2xl">My Order</h2>

              <div className="flex flex-col">
                {format && (
                  <div className="border border-[#e4e6e8] min-h-[95px] flex flex-col justify-center gap-3 px-4 py-6">
                    <p className="text-sm uppercase tracking-wide text-muted-foreground">Format</p>
                    <p className="font-display text-xl">{FORMATS.find(f => f.value === format)?.label}</p>
                  </div>
                )}
                {shape && (
                  <div className="border border-[#e4e6e8] min-h-[95px] flex flex-col justify-center gap-3 px-4 py-6">
                    <p className="text-sm uppercase tracking-wide text-muted-foreground">Shape</p>
                    <p className="font-display text-xl">{SHAPES.find(s => s.value === shape)?.label}</p>
                  </div>
                )}
                {shape && size && (
                  <div className="border border-[#e4e6e8] min-h-[95px] flex flex-col justify-center gap-3 px-4 py-6">
                    <p className="text-sm uppercase tracking-wide text-muted-foreground">Size</p>
                    <p className="font-display text-xl">
                      {shape === "numbers"
                        ? `8" ${numberCount === 2 ? '+ 8"' : ""}`
                        : SHAPE_SIZES[shape]?.find(s => s.value === size)?.label}
                    </p>
                  </div>
                )}
                {theme && (
                  <div className="border border-[#e4e6e8] min-h-[95px] flex flex-col justify-center gap-3 px-4 py-6">
                    <p className="text-sm uppercase tracking-wide text-muted-foreground">Theme</p>
                    <p className="font-display text-xl">{THEMES.find(t => t.value === theme)?.label}</p>
                  </div>
                )}
                {selectedFlavors.length > 0 && (
                  <div className="border border-[#e4e6e8] min-h-[95px] flex flex-col justify-center gap-3 px-4 py-6">
                    <p className="text-sm uppercase tracking-wide text-muted-foreground">Base Flavour</p>
                    <p className="font-display text-xl">{selectedFlavors.join(", ")}</p>
                  </div>
                )}
                {totalPrice && (
                  <div className="border border-[#e4e6e8] min-h-[95px] flex items-center justify-between px-4 py-6">
                    <p className="text-sm uppercase tracking-wide text-muted-foreground">Price</p>
                    <p className="font-display text-2xl font-medium">{formatPrice(totalPrice)}</p>
                  </div>
                )}
                {!format && (
                  <p className="text-sm text-muted-foreground py-4">
                    Your selections will appear here as you build your cake.
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-3">
                <Button
                  type="button"
                  size="lg"
                  onClick={handleAddToCart}
                  disabled={!readyToAddToCart}
                  className="w-full h-[52px] rounded-full text-base bg-[#91b9bb] hover:opacity-90 text-white"
                >
                  Add to Cart
                </Button>
                <Button
                  type="button"
                  size="lg"
                  onClick={handleOrderNow}
                  disabled={!readyToAddToCart}
                  className="w-full h-[52px] rounded-full text-base bg-primary hover:opacity-90 text-primary-foreground"
                >
                  Order Now
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
