import { useState, useEffect, useRef, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { trpc } from "@/lib/trpc";
import { Loader2, CalendarIcon, Check } from "lucide-react";
import { ProgressIndicator } from "@/components/ProgressIndicator";
import { SelectablePill } from "@/components/SelectablePill";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { format } from "date-fns";
import { getCustomOrderPrice } from "../../../shared/customOrderPricing";
import { formatPrice } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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

const COLORS = [
  { value: "red", label: "Red" },
  { value: "pink", label: "Pink" },
  { value: "orange", label: "Orange" },
  { value: "yellow", label: "Yellow" },
  { value: "blue", label: "Blue" },
  { value: "purple", label: "Purple" },
  { value: "white", label: "White" },
  { value: "pastelPink", label: "Pastel Pink" },
  { value: "pastelRed", label: "Pastel Red" },
  { value: "pastelOrange", label: "Pastel Orange" },
  { value: "pastelYellow", label: "Pastel Yellow" },
  { value: "pastelBlue", label: "Pastel Blue" },
  { value: "pastelPurple", label: "Pastel Purple" },
];

const CARTOON_CHARACTERS = [
  "Pikachu", "Hello Kitty", "Cinnamoroll", "My Melody", "Kuromi",
  "Miffy", "Sumikko Gurashi", "Super Mario", "Winnie the Pooh"
];

const SHAPES = [
  { value: "round", label: "Round", image: "/customize/round.jpg" },
  { value: "square", label: "Square", image: "/customize/square.jpg" },
  { value: "octagon", label: "Octagon", image: "/customize/octagon.jpg" },
  { value: "heart", label: "Heart", image: "/customize/heart.jpg" },
  { value: "star", label: "Star", image: "/customize/star.jpg" },
  { value: "teddyBear", label: "Teddy Bear", image: "/customize/teddyBear.jpg" },
  { value: "fan", label: "Fan", image: "/customize/fan.jpg" },
  { value: "rectangle", label: "Rectangle", image: "/customize/rectangle.jpg" },
  { value: "scalloped", label: "Scalloped Round/Rosette", image: "/customize/scalloped.jpg" },
  { value: "platter9", label: "Platter of 9", image: "/customize/platter9.jpg" },
  { value: "platter4", label: "Platter of 4", images: ["/customize/platter4-1.jpg", "/customize/platter4-2.jpg"] },
  { value: "numbers", label: "Numbers", image: "/customize/numbers.jpg" },
  { value: "miniGiftBox", label: "Individual Mini Gift Box", image: "/customize/miniGiftBox.jpg" },
  { value: "cupcake", label: "Individual Cupcake", image: "/customize/cupcake.jpg" },
  { value: "sakura", label: "Sakura", image: "/customize/sakura.jpg" },
];

const PLATTER_INDIVIDUAL_SHAPES = [
  { value: "heart", label: "Heart" },
  { value: "square", label: "Square" },
  { value: "circle", label: "Round" },
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
  "Longan",
  "Lychee",
  "Coconut",
  "Osmanthus Bloom",
  "Yuzu",
  "Taro",
  "Strawberry",
  "Jujube & Gojiberries",
  "Pineapple",
  "Valrhona Chocolate",
  "Passionfruit",
  "Berries Delight",
  "Cheesecake",
];

const DIETARY_OPTIONS = [
  { value: "noDairy", label: "Dairy Free" },
  { value: "noNuts", label: "No Nuts" },
  { value: "vegetarian", label: "Vegetarian" },
  { value: "vegan", label: "Vegan" },
];

const PICKUP_TIME_SLOTS = [
  "11:00 AM - 1:00 PM",
  "1:00 PM - 3:00 PM",
  "3:00 PM - 5:00 PM",
  "5:00 PM - 7:00 PM",
];

const DELIVERY_TIME_SLOTS = [
  "10:00 AM - 1:00 PM",
  "2:00 PM - 5:00 PM",
  "5:00 PM - 7:00 PM",
];

// Orders store a single fulfillment timestamp (no separate time-range column),
// so the slot's start time gets merged onto the picked date before submitting.
function applySlotStartTime(date: Date, slot: string): Date {
  const match = slot.match(/(\d+):(\d+)\s*(AM|PM)/i);
  const combined = new Date(date);
  if (!match) return combined;

  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const period = match[3].toUpperCase();
  if (period === "PM" && hours !== 12) hours += 12;
  if (period === "AM" && hours === 12) hours = 0;

  combined.setHours(hours, minutes, 0, 0);
  return combined;
}

// ThemeCard component with carousel support
function ThemeCard({ themeOption, isSelected, onClick }: { 
  themeOption: any; 
  isSelected: boolean; 
  onClick: () => void;
}) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);
  const images = themeOption.images || [themeOption.image];
  
  // Auto-rotate carousel every 3 seconds
  useEffect(() => {
    if (images.length <= 1) return;
    
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % images.length);
    }, 3000);
    
    return () => clearInterval(interval);
  }, [images.length]);
  
  // Handle touch/swipe gestures
  const handleTouchStart = (e: React.TouchEvent) => {
    if (images.length <= 1) return;
    setTouchStart(e.targetTouches[0].clientX);
  };
  
  const handleTouchMove = (e: React.TouchEvent) => {
    if (images.length <= 1) return;
    setTouchEnd(e.targetTouches[0].clientX);
  };
  
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (images.length <= 1) return;
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const minSwipeDistance = 50;
    
    if (Math.abs(distance) < minSwipeDistance) return;
    
    // Prevent card click when swiping
    e.stopPropagation();
    
    if (distance > 0) {
      // Swipe left - next image
      setCurrentImageIndex((prev) => (prev + 1) % images.length);
    } else {
      // Swipe right - previous image
      setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
    }
    
    setTouchStart(0);
    setTouchEnd(0);
  };
  
  return (
    <Card
      onClick={onClick}
      className={`overflow-hidden group border-0 shadow-none hover:shadow-none transition-smooth p-0 gap-0 bg-transparent cursor-pointer ${
        isSelected ? 'ring-2 ring-primary' : ''
      }`}
    >
      <div 
        className="aspect-square overflow-hidden rounded-xl relative"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <img
          src={images[currentImageIndex]}
          alt={themeOption.label}
          className="w-full h-full object-cover group-hover:scale-110 transition-all duration-500 ease-out"
        />
        {isSelected && (
          <div className="absolute top-2 right-2 bg-primary text-primary-foreground rounded-full p-1">
            <Check className="h-5 w-5" />
          </div>
        )}
        {images.length > 1 && (
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
            {images.map((_: string, index: number) => (
              <div
                key={index}
                className={`h-1.5 rounded-full transition-all ${
                  index === currentImageIndex 
                    ? 'w-4 bg-white' 
                    : 'w-1.5 bg-white/50'
                }`}
              />
            ))}
          </div>
        )}
      </div>
      <CardContent className="pt-3 pb-4 px-0">
        <h3 className="font-semibold text-base text-center tracking-tight leading-tight">
          {themeOption.label}
        </h3>
      </CardContent>
    </Card>
  );
}

export default function Customize() {
  // Theme & Design state
  const [theme, setTheme] = useState("");
  const [selectedFlowers, setSelectedFlowers] = useState<string[]>([]);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [cartoonCharacter, setCartoonCharacter] = useState("");
  const [handDrawnDesign, setHandDrawnDesign] = useState("");
  const [coutureBrand, setCoutureBrand] = useState("");

  // Shape & Size state
  const [shape, setShape] = useState("");
  const [size, setSize] = useState("");
  const [platterShapes, setPlatterShapes] = useState<string[]>([]);
  const [number1, setNumber1] = useState("");
  const [number2, setNumber2] = useState("");
  const [numberCount, setNumberCount] = useState<1 | 2>(2); // For Numbers shape: 1 or 2 numbers
  const [quantity, setQuantity] = useState(1);

  // Flavor & Dietary state
  const [selectedFlavors, setSelectedFlavors] = useState<string[]>([]);
  const [dietaryRequirements, setDietaryRequirements] = useState<string[]>([]);

  // Text & References state
  const [textOnCake, setTextOnCake] = useState("");
  const [textLanguage, setTextLanguage] = useState("english");
  const [referenceLinks, setReferenceLinks] = useState("");
  const [specialInstructions, setSpecialInstructions] = useState("");

  // Customer Details state
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [deliveryMethod, setDeliveryMethod] = useState<"pickup" | "delivery">("pickup");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [fulfillmentDate, setFulfillmentDate] = useState<Date>();
  const [fulfillmentTime, setFulfillmentTime] = useState("");

  const [, navigate] = useLocation();

  const createOrderMutation = trpc.orders.create.useMutation({
    onSuccess: (order) => {
      toast.success("Order submitted successfully!");
      navigate(`/confirmation/${order.id}`);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to submit order");
    },
  });

  // Calculate estimated price
  const estimatedPrice = useMemo(() => {
    if (!theme || !shape || !size) return null;
    
    const basePrice = getCustomOrderPrice(theme, shape, size, numberCount);
    if (!basePrice) return null;
    
    // Multiply by quantity for individual items
    let totalPrice = basePrice;
    if (shape === "miniGiftBox" || shape === "cupcake") {
      totalPrice = basePrice * quantity;
    }
    
    // Format to 2 decimal places to avoid floating-point precision errors
    return Number(totalPrice.toFixed(2));
  }, [theme, shape, size, quantity, numberCount]);

  // Progress tracking
  const progressSteps = useMemo(() => {
    const steps = [
      { id: 1, label: "Theme", completed: !!theme, current: !theme },
      { id: 2, label: "Shape", completed: !!shape, current: !!theme && !shape },
      { id: 3, label: "Size", completed: !!size, current: !!shape && !size },
      { id: 4, label: "Flavour", completed: selectedFlavors.length > 0, current: !!size && selectedFlavors.length === 0 },
      { id: 5, label: "Details", completed: !!customerName && !!customerEmail && !!customerPhone, current: selectedFlavors.length > 0 && (!customerName || !customerEmail || !customerPhone) },
    ];

    return steps;
  }, [theme, shape, size, selectedFlavors, customerName, customerEmail, customerPhone]);

  const currentStep = progressSteps.findIndex(s => s.current) + 1 || progressSteps.length;

  // Helper functions
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!theme || !shape || !size || selectedFlavors.length === 0) {
      toast.error("Please complete all required fields");
      return;
    }

    if (!fulfillmentDate || !fulfillmentTime) {
      toast.error("Please select fulfillment date and time");
      return;
    }

    // Validate minimum lead time (3 days)
    const now = new Date();
    const minDate = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
    if (fulfillmentDate < minDate) {
      toast.error("Minimum 3 days advance notice required");
      return;
    }

    const numbers =
      shape === "numbers"
        ? numberCount === 2
          ? `${number1},${number2}`
          : number1
        : undefined;

    createOrderMutation.mutate({
      customerName,
      customerEmail,
      customerPhone,
      deliveryMethod,
      deliveryAddress: deliveryMethod === "delivery" ? deliveryAddress : undefined,
      fulfillmentDate: applySlotStartTime(fulfillmentDate, fulfillmentTime),
      theme,
      selectedFlowers: selectedFlowers.length > 0 ? selectedFlowers : undefined,
      selectedColors: selectedColors.length > 0 ? selectedColors : undefined,
      cartoonCharacter: cartoonCharacter || undefined,
      themeCustomText: handDrawnDesign || undefined,
      fashionBrand: coutureBrand || undefined,
      shape,
      size,
      numbers,
      platterShapes: platterShapes.length > 0 ? platterShapes : undefined,
      flavours: selectedFlavors,
      cakeText: textOnCake || undefined,
      cakeTextLanguage: textOnCake ? (textLanguage as "english" | "chinese") : undefined,
      dietaryRequirements: dietaryRequirements.length > 0 ? dietaryRequirements.join(", ") : undefined,
      referenceLinks: referenceLinks || undefined,
      specialInstructions: specialInstructions || undefined,
    });
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
      prev.includes(requirement)
        ? prev.filter(r => r !== requirement)
        : [...prev, requirement]
    );
  };


  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative bg-background">
        <div className="container text-center">
          <h1 className="text-foreground mb-6 font-semibold" style={{ fontSize: "44px" }}>
            Create Your Custom Jelly Cake
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Customize every detail of your perfect jelly art cake
          </p>
        </div>
      </section>

      {/* Progress Indicator */}
      <ProgressIndicator 
        steps={progressSteps}
        currentStep={currentStep}
        totalSteps={progressSteps.length}
      />

      <form onSubmit={handleSubmit} className="container pb-16">
        {/* Step 1: Theme Selection */}
        <section className="py-12">
          <h2 className="text-2xl font-semibold mb-8 text-center tracking-tight">1. Select Your Theme</h2>
          <p className="text-center text-muted-foreground mb-8">Choose the design theme for your jelly cake</p>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {THEMES.map((themeOption) => (
              <ThemeCard
                key={themeOption.value}
                themeOption={themeOption}
                isSelected={theme === themeOption.value}
                onClick={() => setTheme(themeOption.value)}
              />
            ))}
          </div>
        </section>

        {/* Theme-specific design options */}
        {theme === "floralBouquet" && (
          <section className="py-12">
            <h2 className="text-2xl font-semibold mb-8 text-center tracking-tight">2. Choose Flowers & Colors</h2>
            
            <div className="max-w-4xl mx-auto space-y-8">
              {/* Flower Selection */}
              <div>
                <Label className="text-lg font-semibold mb-4 block">Select Flowers (up to 3)</Label>
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

              {/* Color Selection */}
              <div>
                <Label className="text-lg font-semibold mb-4 block">Select Colors (up to 3)</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {COLORS.map((color) => {
                    const isSelected = selectedColors.includes(color.value);
                    const isDisabled = !isSelected && selectedColors.length >= 3;
                    
                    return (
                      <SelectablePill
                        key={color.value}
                        selected={isSelected}
                        disabled={isDisabled}
                        onClick={() => {
                          setSelectedColors(prev =>
                            isSelected ? prev.filter(c => c !== color.value) : [...prev, color.value]
                          );
                        }}
                        className="flex items-center justify-between px-4 py-3"
                      >
                        <span>{color.label}</span>
                        {isSelected && <Check className="h-4 w-4 text-primary" />}
                      </SelectablePill>
                    );
                  })}
                </div>
              </div>
            </div>
          </section>
        )}

        {theme === "cartoonCharacters" && (
          <section className="py-12">
            <h2 className="text-2xl font-semibold mb-8 text-center tracking-tight">2. Select Character</h2>
            
            <div className="max-w-4xl mx-auto">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
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
            </div>
          </section>
        )}

        {theme === "handDrawn" && (
          <section className="py-12">
            <h2 className="text-2xl font-semibold mb-8 text-center tracking-tight">2. Custom Hand Drawn Design</h2>
            
            <div className="max-w-2xl mx-auto">
              <Textarea
                value={handDrawnDesign}
                onChange={(e) => setHandDrawnDesign(e.target.value)}
                placeholder="Describe your custom hand-drawn design..."
                className="min-h-[120px]"
              />
            </div>
          </section>
        )}

        {theme === "coutureFashion" && (
          <section className="py-12">
            <h2 className="text-2xl font-semibold mb-8 text-center tracking-tight">2. Specify Brand</h2>
            
            <div className="max-w-2xl mx-auto">
              <Input
                value={coutureBrand}
                onChange={(e) => setCoutureBrand(e.target.value)}
                placeholder="Enter brand name (e.g., Chanel, Dior)..."
              />
            </div>
          </section>
        )}


        {/* Step 2: Shape Selection */}
        {theme && (
          <section className="py-12">
            <h2 className="text-2xl font-semibold mb-8 text-center tracking-tight">
              {theme === "floralBouquet" || theme === "cartoonCharacters" || theme === "handDrawn" || theme === "coutureFashion" ? "3" : "2"}. Select Shape
            </h2>
            <p className="text-center text-muted-foreground mb-8">Choose the shape for your jelly cake</p>
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {SHAPES.map((shapeOption) => {
                // Check if this shape has multiple images (carousel)
                const hasCarousel = 'images' in shapeOption && Array.isArray(shapeOption.images);
                
                return hasCarousel ? (
                  <ThemeCard
                    key={shapeOption.value}
                    themeOption={shapeOption}
                    isSelected={shape === shapeOption.value}
                    onClick={() => {
                      setShape(shapeOption.value);
                      setSize("");
                      setPlatterShapes([]);
                      setQuantity(1);
                    }}
                  />
                ) : (
                  <Card
                    key={shapeOption.value}
                    onClick={() => {
                      setShape(shapeOption.value);
                      setSize("");
                      setPlatterShapes([]);
                      setQuantity(1);
                    }}
                    className={`overflow-hidden group border-0 shadow-none hover:shadow-none transition-smooth p-0 gap-0 bg-transparent cursor-pointer ${
                      shape === shapeOption.value ? 'ring-2 ring-primary' : ''
                    }`}
                  >
                    <div className="aspect-square overflow-hidden rounded-xl relative">
                      <img
                        src={shapeOption.image}
                        alt={shapeOption.label}
                        className="w-full h-full object-cover group-hover:scale-110 transition-all duration-500 ease-out"
                      />
                      {shape === shapeOption.value && (
                        <div className="absolute top-2 right-2 bg-primary text-primary-foreground rounded-full p-1">
                          <Check className="h-5 w-5" />
                        </div>
                      )}
                    </div>
                    <CardContent className="pt-3 pb-4 px-0">
                      <h3 className="font-semibold text-base text-center tracking-tight leading-tight">
                        {shapeOption.label}
                      </h3>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </section>
        )}

        {/* Step 3: Size Selection */}
        {shape && SHAPE_SIZES[shape] && shape !== "numbers" && (
          <section className="py-12">
            <h2 className="text-2xl font-semibold mb-8 text-center tracking-tight">
              {theme === "floralBouquet" || theme === "cartoonCharacters" || theme === "handDrawn" || theme === "coutureFashion" ? "4" : "3"}. Select Size
            </h2>
            <p className="text-center text-muted-foreground mb-8">Choose the size for your {SHAPES.find(s => s.value === shape)?.label} cake</p>
            
            <div className="max-w-4xl mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {SHAPE_SIZES[shape].map((sizeOption) => {
                  const price = getCustomOrderPrice(theme, shape, sizeOption.value);
                  
                  return (
                    <SelectablePill
                      key={sizeOption.value}
                      selected={size === sizeOption.value}
                      onClick={() => setSize(sizeOption.value)}
                      className="flex flex-col items-center justify-center p-6"
                    >
                      <span className="font-medium text-center mb-2">{sizeOption.label}</span>
                      {price && (
                        <span className="text-xl font-semibold text-primary">{formatPrice(price)}</span>
                      )}
                      {size === sizeOption.value && (
                        <Check className="h-5 w-5 text-primary mt-2" />
                      )}
                    </SelectablePill>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {/* Platter Individual Shapes Selection */}
        {shouldShowPlatterShapeSelection() && (
          <section className="py-12">
            <h2 className="text-2xl font-semibold mb-8 text-center tracking-tight">
              {theme === "floralBouquet" || theme === "cartoonCharacters" || theme === "handDrawn" || theme === "coutureFashion" ? "4.5" : "3.5"}. Choose Individual Shapes
            </h2>
            <p className="text-center text-muted-foreground mb-8">
              Select up to {getMaxShapeSelection()} different shapes for your {shape === "platter9" ? "4" : "2"} pieces
            </p>
            
            <div className="max-w-2xl mx-auto">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {PLATTER_INDIVIDUAL_SHAPES.map((shapeOption) => {
                  const isSelected = platterShapes.includes(shapeOption.value);
                  const isDisabled = !isSelected && platterShapes.length >= getMaxShapeSelection();
                  
                  return (
                    <SelectablePill
                      key={shapeOption.value}
                      selected={isSelected}
                      disabled={isDisabled}
                      onClick={() => handlePlatterShapeToggle(shapeOption.value)}
                      className="flex items-center justify-center px-4 py-6"
                    >
                      <span className="font-medium">{shapeOption.label}</span>
                      {isSelected && <Check className="h-4 w-4 text-primary ml-2" />}
                    </SelectablePill>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {/* Numbers Configuration - Combined Size and Number Selection */}
        {shape === "numbers" && (
          <section className="py-12">
            <h2 className="text-2xl font-semibold mb-8 text-center tracking-tight">
              {theme === "floralBouquet" || theme === "cartoonCharacters" || theme === "handDrawn" || theme === "coutureFashion" ? "4" : "3"}. Configure Your Numbers
            </h2>
            
            <div className="max-w-md mx-auto space-y-6">
              {/* Number Count Selection with Size and Price */}
              <div>
                <div className="grid grid-cols-2 gap-4">
                  <Card
                    className={`cursor-pointer transition-all ${
                      numberCount === 1
                        ? "ring-2 ring-primary bg-primary/5"
                        : "hover:border-primary/50"
                    }`}
                    onClick={() => {
                      setNumberCount(1);
                      setSize("8inch"); // Set size when selecting number count
                      setNumber2(""); // Clear second number when switching to 1
                    }}
                  >
                    <CardContent className="p-6 text-center">
                      <div className="text-2xl font-bold mb-2">1 Number</div>
                      <div className="text-sm text-muted-foreground mb-1">8" / 20.3 cm</div>
                      <div className="text-lg font-semibold text-primary">$118</div>
                    </CardContent>
                  </Card>
                  <Card
                    className={`cursor-pointer transition-all ${
                      numberCount === 2
                        ? "ring-2 ring-primary bg-primary/5"
                        : "hover:border-primary/50"
                    }`}
                    onClick={() => {
                      setNumberCount(2);
                      setSize("8inch+8inch"); // Set size when selecting number count
                    }}
                  >
                    <CardContent className="p-6 text-center">
                      <div className="text-2xl font-bold mb-2">2 Numbers</div>
                      <div className="text-sm text-muted-foreground mb-1">8" + 8" / 20.3 cm</div>
                      <div className="text-lg font-semibold text-primary">$158</div>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Number Inputs */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label style={{ paddingBottom: "12px" }}>First Number</Label>
                  <Input
                    type="number"
                    min="0"
                    max="9"
                    value={number1}
                    onChange={(e) => setNumber1(e.target.value)}
                    placeholder="0-9"
                  />
                </div>
                {numberCount === 2 && (
                  <div>
                    <Label style={{ paddingBottom: "12px" }}>Second Number</Label>
                    <Input
                      type="number"
                      min="0"
                      max="9"
                      value={number2}
                      onChange={(e) => setNumber2(e.target.value)}
                      placeholder="0-9"
                    />
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {/* Quantity Input for Individual Items */}
        {(shape === "miniGiftBox" || shape === "cupcake") && size && (
          <section className="py-12">
            <h2 className="text-2xl font-semibold mb-8 text-center tracking-tight">Select Quantity</h2>
            
            <div className="max-w-md mx-auto">
              <Label>How many would you like to order?</Label>
              <Input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                placeholder="Enter quantity"
              />
              {estimatedPrice && (
                <p className="mt-4 text-center">
                  <span className="text-muted-foreground">Total: </span>
                  <span className="text-2xl font-semibold text-primary">{formatPrice(estimatedPrice)}</span>
                </p>
              )}
            </div>
          </section>
        )}


        {/* Step 4: Flavor Selection */}
        {size && (shape !== "platter9" || (shape === "platter9" && platterShapes.length > 0)) && (shape !== "platter4" || (shape === "platter4" && (size === "10cm" || platterShapes.length > 0))) && (
          <section className="py-12">
            <h2 className="text-2xl font-semibold mb-8 text-center tracking-tight">
              {theme === "floralBouquet" || theme === "cartoonCharacters" || theme === "handDrawn" || theme === "coutureFashion" ? "5" : "4"}. Select Base Flavours
            </h2>
            <p className="text-center text-muted-foreground mb-8">
              Choose {getRequiredFlavorCount()} flavour{getRequiredFlavorCount() > 1 ? 's' : ''} for your jelly cake
            </p>
            
            <div className="max-w-4xl mx-auto">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {BASE_FLAVORS.map((flavor) => {
                  const isSelected = selectedFlavors.includes(flavor);
                  const isDisabled = !isSelected && selectedFlavors.length >= getRequiredFlavorCount();
                  
                  return (
                    <SelectablePill
                      key={flavor}
                      selected={isSelected}
                      disabled={isDisabled}
                      onClick={() => handleFlavorToggle(flavor)}
                      className="flex items-center justify-between px-4 py-3"
                    >
                      <span>{flavor}</span>
                      {isSelected && <Check className="h-4 w-4 text-primary" />}
                    </SelectablePill>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {/* Step 5: Text on Cake */}
        {selectedFlavors.length > 0 && (
          <section className="py-12">
            <h2 className="text-2xl font-semibold mb-8 text-center tracking-tight">
              {theme === "floralBouquet" || theme === "cartoonCharacters" || theme === "handDrawn" || theme === "coutureFashion" ? "6" : "5"}. Text on Cake (Optional)
            </h2>
            
            <div className="max-w-2xl mx-auto space-y-4">
              <div>
                <Label>Text (English or Chinese)</Label>
                <Input
                  value={textOnCake}
                  onChange={(e) => setTextOnCake(e.target.value)}
                  placeholder="Enter text for your cake..."
                />
              </div>
              
              {textOnCake && (
                <div>
                  <Label>Language</Label>
                  <div className="flex gap-4 mt-2">
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
                </div>
              )}
            </div>
          </section>
        )}

        {/* Step 6: Dietary Requirements */}
        {selectedFlavors.length > 0 && (
          <section className="py-12">
            <h2 className="text-2xl font-semibold mb-8 text-center tracking-tight">
              {theme === "floralBouquet" || theme === "cartoonCharacters" || theme === "handDrawn" || theme === "coutureFashion" ? "7" : "6"}. Dietary Requirements (Optional)
            </h2>
            
            <div className="max-w-2xl mx-auto">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
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
            </div>
          </section>
        )}

        {/* Step 7: Reference Photos */}
        {selectedFlavors.length > 0 && (
          <section className="py-12">
            <h2 className="text-2xl font-semibold mb-8 text-center tracking-tight">
              {theme === "floralBouquet" || theme === "cartoonCharacters" || theme === "handDrawn" || theme === "coutureFashion" ? "8" : "7"}. Reference Links & Instructions (Optional)
            </h2>

            <div className="max-w-2xl mx-auto space-y-4">
              <div>
                <Label>Reference Links</Label>
                <Input
                  value={referenceLinks}
                  onChange={(e) => setReferenceLinks(e.target.value)}
                  placeholder="Paste links to reference images..."
                />
              </div>
              
              <div>
                <Label>Special Instructions</Label>
                <Textarea
                  value={specialInstructions}
                  onChange={(e) => setSpecialInstructions(e.target.value)}
                  placeholder="Any additional instructions or requests..."
                  className="min-h-[100px]"
                />
              </div>
            </div>
          </section>
        )}

        {/* Step 8: Customer Details */}
        {selectedFlavors.length > 0 && (
          <section className="py-12">
            <h2 className="text-2xl font-semibold mb-8 text-center tracking-tight">
              {theme === "floralBouquet" || theme === "cartoonCharacters" || theme === "handDrawn" || theme === "coutureFashion" ? "9" : "8"}. Your Details
            </h2>
            
            <div className="max-w-2xl mx-auto space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Name *</Label>
                  <Input
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Your name"
                  />
                </div>
                
                <div>
                  <Label>Email *</Label>
                  <Input
                    required
                    type="email"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    placeholder="your@email.com"
                  />
                </div>
              </div>
              
              <div>
                <Label>Phone *</Label>
                <Input
                  required
                  type="tel"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="+65 1234 5678"
                />
              </div>
              
              <div>
                <Label>Fulfillment Method *</Label>
                <div className="flex gap-4 mt-2">
                  <SelectablePill
                    selected={deliveryMethod === "pickup"}
                    onClick={() => setDeliveryMethod("pickup")}
                    className="flex-1 flex items-center justify-center px-4 py-3"
                  >
                    <span>Pickup</span>
                    {deliveryMethod === "pickup" && <Check className="h-4 w-4 text-primary ml-2" />}
                  </SelectablePill>
                  <SelectablePill
                    selected={deliveryMethod === "delivery"}
                    onClick={() => setDeliveryMethod("delivery")}
                    className="flex-1 flex items-center justify-center px-4 py-3"
                  >
                    <span>Delivery</span>
                    {deliveryMethod === "delivery" && <Check className="h-4 w-4 text-primary ml-2" />}
                  </SelectablePill>
                </div>
              </div>
              
              {deliveryMethod === "delivery" && (
                <div>
                  <Label>Delivery Address *</Label>
                  <Textarea
                    required
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    placeholder="Enter your delivery address..."
                    className="min-h-[80px]"
                  />
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Fulfillment Date * (Min. 3 days advance notice)</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {fulfillmentDate ? format(fulfillmentDate, "PPP") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={fulfillmentDate}
                        onSelect={setFulfillmentDate}
                        disabled={(date) => {
                          const now = new Date();
                          const minDate = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
                          return date < minDate;
                        }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                
                <div>
                  <Label>Fulfillment Time *</Label>
                  <Select value={fulfillmentTime} onValueChange={setFulfillmentTime}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select time slot" />
                    </SelectTrigger>
                    <SelectContent>
                      {(deliveryMethod === "pickup" ? PICKUP_TIME_SLOTS : DELIVERY_TIME_SLOTS).map((slot) => (
                        <SelectItem key={slot} value={slot}>
                          {slot}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Estimated Price & Submit */}
        {estimatedPrice && customerName && customerEmail && customerPhone && (
          <section className="py-12">
            <div className="max-w-2xl mx-auto">
              <div className="bg-primary/5 border-2 border-primary/20 rounded-xl p-8 mb-8">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold">Estimated Price:</h3>
                  <p className="text-3xl font-bold text-primary">{formatPrice(estimatedPrice)}</p>
                </div>
                <p className="text-sm text-muted-foreground">
                  Final price may vary based on design complexity
                </p>
              </div>
              
              <Button
                type="submit"
                size="lg"
                className="w-full text-lg py-6 hover:scale-[1.02] transition-transform"
                disabled={createOrderMutation.isPending}
              >
                {createOrderMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Submitting Order...
                  </>
                ) : (
                  "Submit Custom Order"
                )}
              </Button>
            </div>
          </section>
        )}
      </form>
    </div>
  );
}
