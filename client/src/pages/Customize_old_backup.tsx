import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { trpc } from "@/lib/trpc";
import { Loader2, CalendarIcon, Upload } from "lucide-react";
import { ProgressIndicator } from "@/components/ProgressIndicator";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { format } from "date-fns";
import { getCustomOrderPrice } from "../../../shared/customOrderPricing";

// Theme options from PDF
const THEMES = [
  { value: "floralBouquet", label: "Floral Bouquet", hasFlowerSelection: true, hasColorSelection: true },
  { value: "cartoonCharacters", label: "Cartoon Characters", hasCharacterSelection: true },
  { value: "handDrawn", label: "Hand Drawn", hasTextInput: true },
  { value: "lego", label: "Lego" },
  { value: "mahjong", label: "Mahjong" },
  { value: "poker", label: "Poker" },
  { value: "chess", label: "Chess" },
  { value: "underTheSea", label: "Under the Sea" },
  { value: "animalKingdom", label: "Animal Kingdom" },
  { value: "unicorn", label: "Unicorn" },
  { value: "dinosaurs", label: "Dinosaurs" },
  { value: "space", label: "Space" },
  { value: "koiPond", label: "Koi Pond" },
  { value: "golf", label: "Golf" },
  { value: "cars", label: "Cars" },
  { value: "coutureFashion", label: "Couture/High Fashion", hasBrandInput: true },
  { value: "cactus", label: "Cactus" },
  { value: "foliage", label: "Foliage" },
  { value: "butterflies", label: "Butterflies" },
  { value: "sports", label: "Sports" },
  { value: "mermaid", label: "Mermaid" },
  { value: "teddyBear", label: "Teddy Bear" },
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
  { value: "pastels", label: "Pastels" },
];

const CARTOON_CHARACTERS = [
  "Pikachu", "Hello Kitty", "Cinnamoroll", "My Melody", "Kuromi",
  "Miffy", "Sumikko Gurashi", "Super Mario", "Winnie the Pooh"
];

const SHAPES = [
  { value: "round", label: "Round" },
  { value: "square", label: "Square" },
  { value: "octagon", label: "Octagon" },
  { value: "heart", label: "Heart" },
  { value: "star", label: "Star" },
  { value: "teddyBear", label: "Teddy Bear" },
  { value: "fan", label: "Fan" },
  { value: "rectangle", label: "Rectangle" },
  { value: "scalloped", label: "Scalloped Round/Rosette" },
  { value: "platter9", label: "Platter of 9" },
  { value: "platter4", label: "Platter of 4" },
  { value: "numbers", label: "Numbers" },
  { value: "miniGiftBox", label: "Individual Mini Gift Box" },
  { value: "cupcake", label: "Individual Cupcake" },
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
  numbers: [
    { value: "2numbers_8_8", label: '8" + 8" / 20.3 cm' },
  ],
  heart: [
    { value: "7inch", label: '7" / 17.8 cm' },
    { value: "8inch", label: '8" / 20.3 cm' },
    { value: "10inch", label: '10" / 25.4 cm' },
    { value: "2tier_7_8", label: '2 Tier: 7" + 8"' },
    { value: "2tier_7_10", label: '2 Tier: 7" + 10"' },
    { value: "2tier_8_10", label: '2 Tier: 8" + 10"' },
  ],
  star: [{ value: "10inch", label: '10" / 25.4 cm' }],
  teddyBear: [{ value: "10inch", label: '10" / 25.4 cm' }],
  fan: [{ value: "10inch", label: '10" / 25.4 cm' }],
  rectangle: [{ value: "10x7inch", label: '10" x 7" / 25.4 cm x 17.8 cm' }],
  scalloped: [{ value: "8inch", label: '8" / 20.3 cm' }],
  platter9: [{ value: "6cm", label: "6cm (Choose up to 3 shapes: Heart, Square, Round, Clover)" }],
  platter4: [
    { value: "6cm", label: "6cm (Choose 2 shapes: Square, Heart, Clover, Round)" },
    { value: "10cm", label: "10cm (Square only)" },
  ],
  miniGiftBox: [{ value: "10cm", label: "10cm (Square)" }],
  cupcake: [{ value: "6cm", label: "6cm (Round)" }],
};

const FLAVOURS = [
  "Longan", "Lychee", "Coconut", "Osmanthus Bloom", "Yuzu", "Taro",
  "Strawberry", "Jujube & Gojiberries", "Cappuccino", "Earl Grey Black Tea",
  "Valrhona Chocolate", "Passionfruit", "Berries Delight", "Cheesecake"
];

const DIETARY_OPTIONS = ["Dairy Free", "Vegan", "Other"];

export default function Customize() {
  const [, navigate] = useLocation();
  
  // Step 1: Theme
  const [theme, setTheme] = useState<string>("");
  
  // Step 2: Design sub-options
  const [selectedFlowers, setSelectedFlowers] = useState<string[]>([]);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [selectedCharacter, setSelectedCharacter] = useState<string>("");
  const [handDrawnRequest, setHandDrawnRequest] = useState<string>("");
  const [fashionBrand, setFashionBrand] = useState<string>("");
  
  // Step 3: Shape
  const [shape, setShape] = useState<string>("");
  const [numbers, setNumbers] = useState<string>("");
  
  // Step 4: Size
  const [size, setSize] = useState<string>("");
  
  // Step 4.5: Individual shapes for platters
  const [platterShapes, setPlatterShapes] = useState<string[]>([]);
  
  // Quantity for individual items (miniGiftBox, cupcake)
  const [quantity, setQuantity] = useState<number>(1);
  
  // Step 5: Base Flavour
  const [flavours, setFlavours] = useState<string[]>([]);
  
  // Step 6: Text
  const [cakeText, setCakeText] = useState<string>("");
  const [cakeTextLanguage, setCakeTextLanguage] = useState<"english" | "chinese">("english");
  
  // Step 7: Dietary Requirements
  const [dietaryRequirements, setDietaryRequirements] = useState<string[]>([]);
  const [otherDietary, setOtherDietary] = useState<string>("");
  
  // Step 8: Reference Photos/Instructions
  const [referenceLinks, setReferenceLinks] = useState<string>("");
  const [specialInstructions, setSpecialInstructions] = useState<string>("");
  
  // Customer details
  const [customerName, setCustomerName] = useState<string>("");
  const [customerEmail, setCustomerEmail] = useState<string>("");
  const [customerPhone, setCustomerPhone] = useState<string>("");
  const [deliveryMethod, setDeliveryMethod] = useState<"delivery" | "pickup">("pickup");
  const [deliveryAddress, setDeliveryAddress] = useState<string>("");
  const [fulfillmentDate, setFulfillmentDate] = useState<Date | undefined>();
  const [fulfillmentTime, setFulfillmentTime] = useState<string>("");

  // Calculate minimum date (4 days from now)
  const getMinDate = () => {
    const minDate = new Date();
    minDate.setDate(minDate.getDate() + 4);
    minDate.setHours(0, 0, 0, 0);
    return minDate;
  };

  // Dynamic pricing
  const estimatedPrice = useMemo(() => {
    if (!theme || !shape || !size) return null;
    const basePrice = getCustomOrderPrice(theme, shape, size);
    if (!basePrice) return null;
    
    // Multiply by quantity for individual items
    if (shape === "miniGiftBox" || shape === "cupcake") {
      return basePrice * quantity;
    }
    
    return basePrice;
  }, [theme, shape, size, quantity]);

  // Required flavour count
  const requiredFlavourCount = useMemo(() => {
    if (shape === "platter9") return 3;
    if (shape === "platter4") return 2;
    return 1;
  }, [shape]);

  const currentTheme = THEMES.find(t => t.value === theme);

  // Calculate progress steps dynamically
  const progressSteps = useMemo(() => {
    const steps = [
      { id: 1, label: "Theme", completed: !!theme, current: !theme },
      { id: 2, label: "Shape", completed: !!shape, current: !!theme && !shape },
      { id: 3, label: "Size", completed: !!size, current: !!shape && !size },
      { id: 4, label: "Flavour", completed: flavours.length >= requiredFlavourCount, current: !!size && flavours.length < requiredFlavourCount },
      { id: 5, label: "Details", completed: !!customerName && !!customerEmail && !!customerPhone, current: flavours.length >= requiredFlavourCount && (!customerName || !customerEmail || !customerPhone) },
    ];
    return steps;
  }, [theme, shape, size, flavours.length, requiredFlavourCount, customerName, customerEmail, customerPhone]);

  const currentStepNumber = useMemo(() => {
    const currentStepIndex = progressSteps.findIndex(step => step.current);
    return currentStepIndex >= 0 ? currentStepIndex + 1 : progressSteps.length;
  }, [progressSteps]);

  const toggleFlower = (flower: string) => {
    if (selectedFlowers.includes(flower)) {
      setSelectedFlowers(selectedFlowers.filter(f => f !== flower));
    } else if (selectedFlowers.length < 3) {
      setSelectedFlowers([...selectedFlowers, flower]);
    }
  };

  const toggleColor = (color: string) => {
    if (selectedColors.includes(color)) {
      setSelectedColors(selectedColors.filter(c => c !== color));
    } else if (selectedColors.length < 3) {
      setSelectedColors([...selectedColors, color]);
    }
  };

  const toggleFlavour = (flavour: string) => {
    if (flavours.includes(flavour)) {
      setFlavours(flavours.filter(f => f !== flavour));
    } else if (flavours.length < requiredFlavourCount) {
      setFlavours([...flavours, flavour]);
    }
  };

  const toggleDietary = (option: string) => {
    if (dietaryRequirements.includes(option)) {
      setDietaryRequirements(dietaryRequirements.filter(o => o !== option));
    } else {
      setDietaryRequirements([...dietaryRequirements, option]);
    }
  };

  const createOrderMutation = trpc.orders.create.useMutation({
    onSuccess: (order) => {
      toast.success("Order submitted successfully!");
      navigate(`/order-confirmation?order=CST${String(order.id).padStart(6, '0')}`);
    },
    onError: (error) => {
      toast.error(`Failed to submit order: ${error.message}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!theme) {
      toast.error("Please select a theme");
      return;
    }

    if (currentTheme?.hasFlowerSelection && selectedFlowers.length === 0) {
      toast.error("Please select at least one flower");
      return;
    }

    if (currentTheme?.hasColorSelection && selectedColors.length === 0) {
      toast.error("Please select at least one color");
      return;
    }

    if (currentTheme?.hasCharacterSelection && !selectedCharacter) {
      toast.error("Please select a cartoon character");
      return;
    }

    if (currentTheme?.hasTextInput && !handDrawnRequest) {
      toast.error("Please describe your hand-drawn design request");
      return;
    }

    if (currentTheme?.hasBrandInput && !fashionBrand) {
      toast.error("Please enter the fashion brand");
      return;
    }

    if (!shape) {
      toast.error("Please select a shape");
      return;
    }

    if (shape === "numbers" && size === "2numbers_8_8" && numbers.length !== 2) {
      toast.error("Please enter exactly 2 numbers (0-9)");
      return;
    }

    if (!size) {
      toast.error("Please select a size");
      return;
    }

    if ((shape === "platter9" && size === "6cm") || (shape === "platter4" && size === "6cm")) {
      if (platterShapes.length === 0) {
        toast.error("Please select at least one individual shape for your platter");
        return;
      }
    }

    if (flavours.length !== requiredFlavourCount) {
      toast.error(`Please select exactly ${requiredFlavourCount} flavour${requiredFlavourCount > 1 ? 's' : ''}`);
      return;
    }

    if (!customerName || !customerEmail || !customerPhone || !fulfillmentDate || !fulfillmentTime) {
      toast.error("Please fill in all required customer details");
      return;
    }

    if (deliveryMethod === "delivery" && !deliveryAddress) {
      toast.error("Please provide a delivery address");
      return;
    }

    // Parse the time range and create combined date+time (use start time of range)
    const startTime = fulfillmentTime.split('-')[0]; // Get "11:00" from "11:00-13:00"
    const [hours, minutes] = startTime.split(':').map(Number);
    const selectedDateTime = new Date(fulfillmentDate);
    selectedDateTime.setHours(hours, minutes, 0, 0);

    // Check if selected date+time is at least 4 days from now
    const now = new Date();
    const fourDaysFromNow = new Date(now.getTime() + 4 * 24 * 60 * 60 * 1000);
    
    if (selectedDateTime < fourDaysFromNow) {
      toast.error("Please select a date and time at least 4 days from now");
      return;
    }

    const orderData: any = {
      customerName,
      customerEmail,
      customerPhone,
      deliveryMethod,
      deliveryAddress: deliveryMethod === "delivery" ? deliveryAddress : undefined,
      fulfillmentDate: selectedDateTime,
      theme,
      shape,
      size,
      flavours,
      cakeText: cakeText || undefined,
      cakeTextLanguage: cakeText ? cakeTextLanguage : undefined,
      dietaryRequirements: dietaryRequirements.length > 0 ? dietaryRequirements.join(", ") + (otherDietary ? `: ${otherDietary}` : "") : undefined,
      referenceLinks: referenceLinks || undefined,
      specialInstructions: specialInstructions || undefined,
    };

    // Add platter shapes if applicable
    if (shape === "platter9" || shape === "platter4") {
      orderData.platterShapes = platterShapes;
    }

    // Add theme-specific fields
    if (currentTheme?.hasFlowerSelection) {
      orderData.selectedFlowers = selectedFlowers;
      orderData.selectedColors = selectedColors;
    }
    if (currentTheme?.hasCharacterSelection) {
      orderData.cartoonCharacter = selectedCharacter;
    }
    if (currentTheme?.hasTextInput) {
      orderData.themeCustomText = handDrawnRequest;
    }
    if (currentTheme?.hasBrandInput) {
      orderData.fashionBrand = fashionBrand;
    }
    if (shape === "octagon" && size === "2numbers_8_8") {
      orderData.numbers = numbers;
    }

    createOrderMutation.mutate(orderData);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container py-8 max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl text-foreground mb-2">Create Your Custom Jelly Cake</h1>
          <p className="text-muted-foreground">Customize every detail of your perfect jelly art cake</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Progress Indicator */}
          <ProgressIndicator 
            steps={progressSteps}
            currentStep={currentStepNumber}
            totalSteps={progressSteps.length}
          />
          
          {/* Step 1: Theme Selection */}
          <Card>
            <CardHeader>
              <CardTitle>1. Select Your Theme</CardTitle>
              <CardDescription>Choose the design theme for your jelly cake</CardDescription>
            </CardHeader>
            <CardContent>
              <RadioGroup value={theme} onValueChange={(value) => {
                setTheme(value);
                // Reset design sub-options when theme changes
                setSelectedFlowers([]);
                setSelectedColors([]);
                setSelectedCharacter("");
                setHandDrawnRequest("");
                setFashionBrand("");
              }}>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {THEMES.map((t) => (
                    <div key={t.value} className="flex items-center space-x-2 border rounded-lg p-4 hover:bg-accent cursor-pointer">
                      <RadioGroupItem value={t.value} id={t.value} />
                      <Label htmlFor={t.value} className="cursor-pointer flex-1">{t.label}</Label>
                    </div>
                  ))}
                </div>
              </RadioGroup>
            </CardContent>
          </Card>

          {/* Step 2: Design Sub-Options (Conditional) */}
          {currentTheme?.hasFlowerSelection && (
            <Card>
              <CardHeader>
                <CardTitle>2. Choose Flowers & Colors</CardTitle>
                <CardDescription>Select up to 3 flowers and 3 colors for your floral bouquet</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div>
                  <Label className="mb-2 block">Flowers (up to 3)</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {FLOWERS.map((flower) => (
                      <div key={flower} className="flex items-center space-x-2">
                        <Checkbox
                          id={`flower-${flower}`}
                          checked={selectedFlowers.includes(flower)}
                          onCheckedChange={() => toggleFlower(flower)}
                          disabled={!selectedFlowers.includes(flower) && selectedFlowers.length >= 3}
                        />
                        <Label htmlFor={`flower-${flower}`} className="cursor-pointer">{flower}</Label>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <Label className="mb-2 block">Colors (up to 3)</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {COLORS.map((color) => (
                      <div key={color.value} className="flex items-center space-x-2">
                        <Checkbox
                          id={`color-${color.value}`}
                          checked={selectedColors.includes(color.value)}
                          onCheckedChange={() => toggleColor(color.value)}
                          disabled={!selectedColors.includes(color.value) && selectedColors.length >= 3}
                        />
                        <Label htmlFor={`color-${color.value}`} className="cursor-pointer">{color.label}</Label>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {currentTheme?.hasCharacterSelection && (
            <Card>
              <CardHeader>
                <CardTitle>2. Choose Cartoon Character</CardTitle>
                <CardDescription>Select your favorite character</CardDescription>
              </CardHeader>
              <CardContent>
                <RadioGroup value={selectedCharacter} onValueChange={setSelectedCharacter}>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {CARTOON_CHARACTERS.map((char) => (
                      <div key={char} className="flex items-center space-x-2 border rounded-lg p-4 hover:bg-accent cursor-pointer">
                        <RadioGroupItem value={char} id={`char-${char}`} />
                        <Label htmlFor={`char-${char}`} className="cursor-pointer flex-1">{char}</Label>
                      </div>
                    ))}
                  </div>
                </RadioGroup>
              </CardContent>
            </Card>
          )}

          {currentTheme?.hasTextInput && (
            <Card>
              <CardHeader>
                <CardTitle>2. Custom Hand Drawn Design</CardTitle>
                <CardDescription>Tell us about your custom design idea</CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={handDrawnRequest}
                  onChange={(e) => setHandDrawnRequest(e.target.value)}
                  placeholder="Describe your design request in detail..."
                  rows={4}
                />
              </CardContent>
            </Card>
          )}

          {currentTheme?.hasBrandInput && (
            <Card>
              <CardHeader>
                <CardTitle>2. Enter Fashion Brand</CardTitle>
                <CardDescription>Specify the couture/high fashion brand (e.g., Chanel, Hermès)</CardDescription>
              </CardHeader>
              <CardContent>
                <Input
                  value={fashionBrand}
                  onChange={(e) => setFashionBrand(e.target.value)}
                  placeholder="Enter brand name..."
                />
              </CardContent>
            </Card>
          )}

          {/* Step 3: Shape Selection */}
          {theme && (
            <Card>
              <CardHeader>
                <CardTitle>{currentTheme?.hasFlowerSelection || currentTheme?.hasCharacterSelection || currentTheme?.hasTextInput || currentTheme?.hasBrandInput ? '3' : '2'}. Select Shape</CardTitle>
                <CardDescription>Choose the shape of your jelly cake</CardDescription>
              </CardHeader>
              <CardContent>
                <RadioGroup value={shape} onValueChange={(value) => {
                  setShape(value);
                  setSize(""); // Reset size when shape changes
                  setNumbers(""); // Reset numbers
                }}>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {SHAPES.map((s) => (
                      <div 
                        key={s.value} 
                        className="flex items-center space-x-2 border rounded-lg p-4 hover:bg-accent cursor-pointer"
                        onClick={() => {
                          setShape(s.value);
                          setSize("");
                          setNumbers("");
                        }}
                      >
                        <RadioGroupItem value={s.value} id={`shape-${s.value}`} />
                        <Label htmlFor={`shape-${s.value}`} className="cursor-pointer flex-1">{s.label}</Label>
                      </div>
                    ))}
                  </div>
                </RadioGroup>
              </CardContent>
            </Card>
          )}

          {/* Step 4: Size Selection */}
          {shape && SHAPE_SIZES[shape] && (
            <Card>
              <CardHeader>
                <CardTitle>{currentTheme?.hasFlowerSelection || currentTheme?.hasCharacterSelection || currentTheme?.hasTextInput || currentTheme?.hasBrandInput ? '4' : '3'}. Select Size</CardTitle>
                <CardDescription>Choose the size for your {SHAPES.find(s => s.value === shape)?.label} cake</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <RadioGroup value={size} onValueChange={setSize}>
                  <div className="space-y-3">
                    {SHAPE_SIZES[shape].map((s) => (
                      <div key={s.value} className="flex items-center space-x-2 border rounded-lg p-4 hover:bg-accent cursor-pointer">
                        <RadioGroupItem value={s.value} id={`size-${s.value}`} />
                        <Label htmlFor={`size-${s.value}`} className="cursor-pointer flex-1">{s.label}</Label>
                        {estimatedPrice && size === s.value && (
                          <span className="font-semibold text-primary">${estimatedPrice}</span>
                        )}
                      </div>
                    ))}
                  </div>
                </RadioGroup>

                {shape === "numbers" && size === "2numbers_8_8" && (
                  <div>
                    <Label htmlFor="numbers">Enter 2 Numbers (0-9)</Label>
                    <Input
                      id="numbers"
                      value={numbers}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^0-9]/g, '').slice(0, 2);
                        setNumbers(val);
                      }}
                      placeholder="e.g., 25"
                      maxLength={2}
                    />
                  </div>
                )}
                
                {(shape === "miniGiftBox" || shape === "cupcake") && size && (
                  <div>
                    <Label htmlFor="quantity">Quantity</Label>
                    <Input
                      id="quantity"
                      type="number"
                      min="1"
                      value={quantity}
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 1;
                        setQuantity(Math.max(1, val));
                      }}
                      placeholder="Enter quantity"
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Step 4.5: Individual Shapes for Platters */}
          {((shape === "platter9" && size === "6cm") || (shape === "platter4" && size === "6cm")) && (
            <Card>
              <CardHeader>
                <CardTitle>{currentTheme?.hasFlowerSelection || currentTheme?.hasCharacterSelection || currentTheme?.hasTextInput || currentTheme?.hasBrandInput ? '4.5' : '3.5'}. Choose Individual Shapes</CardTitle>
                <CardDescription>
                  Select up to {shape === "platter9" ? "3" : "2"} different shapes for your {shape === "platter9" ? "9" : "4"} pieces
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {PLATTER_INDIVIDUAL_SHAPES.map((s) => (
                    <div key={s.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={`platter-shape-${s.value}`}
                        checked={platterShapes.includes(s.value)}
                        onCheckedChange={() => {
                          if (platterShapes.includes(s.value)) {
                            setPlatterShapes(platterShapes.filter(ps => ps !== s.value));
                          } else {
                            const maxShapes = shape === "platter9" ? 3 : 2;
                            if (platterShapes.length < maxShapes) {
                              setPlatterShapes([...platterShapes, s.value]);
                            }
                          }
                        }}
                        disabled={!platterShapes.includes(s.value) && platterShapes.length >= (shape === "platter9" ? 3 : 2)}
                      />
                      <Label htmlFor={`platter-shape-${s.value}`} className="cursor-pointer">{s.label}</Label>
                    </div>
                  ))}
                </div>
                {platterShapes.length > 0 && (
                  <p className="text-sm text-muted-foreground mt-3">
                    Selected: {platterShapes.map(s => PLATTER_INDIVIDUAL_SHAPES.find(ps => ps.value === s)?.label).join(", ")}
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Step 5: Base Flavour */}
          {((shape !== "platter9" && shape !== "platter4" && size) || (platterShapes.length > 0 && size) || (shape === "platter4" && size === "10cm")) && (
            <Card>
              <CardHeader>
                <CardTitle>{currentTheme?.hasFlowerSelection || currentTheme?.hasCharacterSelection || currentTheme?.hasTextInput || currentTheme?.hasBrandInput ? '5' : '4'}. Select Base Flavour{requiredFlavourCount > 1 ? 's' : ''}</CardTitle>
                <CardDescription>
                  Choose {requiredFlavourCount} flavour{requiredFlavourCount > 1 ? 's' : ''} for your jelly cake
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {FLAVOURS.map((flavour) => (
                    <div key={flavour} className="flex items-center space-x-2">
                      <Checkbox
                        id={`flavour-${flavour}`}
                        checked={flavours.includes(flavour)}
                        onCheckedChange={() => toggleFlavour(flavour)}
                        disabled={!flavours.includes(flavour) && flavours.length >= requiredFlavourCount}
                      />
                      <Label htmlFor={`flavour-${flavour}`} className="cursor-pointer">{flavour}</Label>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 6: Text */}
          {flavours.length === requiredFlavourCount && (
            <Card>
              <CardHeader>
                <CardTitle>{currentTheme?.hasFlowerSelection || currentTheme?.hasCharacterSelection || currentTheme?.hasTextInput || currentTheme?.hasBrandInput ? '6' : '5'}. Add Text (Optional)</CardTitle>
                <CardDescription>Add custom text in English or Chinese</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div>
                  <Label>Language</Label>
                  <RadioGroup value={cakeTextLanguage} onValueChange={(val) => setCakeTextLanguage(val as "english" | "chinese")} className="mt-2">
                    <div className="flex gap-4">
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="english" id="lang-english" />
                        <Label htmlFor="lang-english" className="cursor-pointer">English</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="chinese" id="lang-chinese" />
                        <Label htmlFor="lang-chinese" className="cursor-pointer">Chinese</Label>
                      </div>
                    </div>
                  </RadioGroup>
                </div>
                <div>
                  <Label htmlFor="cakeText">Text</Label>
                  <Input
                    className="mt-2"
                    id="cakeText"
                    value={cakeText}
                    onChange={(e) => setCakeText(e.target.value)}
                    placeholder="Enter text to appear on cake..."
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 7: Dietary Requirements */}
          {flavours.length === requiredFlavourCount && (
            <Card>
              <CardHeader>
                <CardTitle>{currentTheme?.hasFlowerSelection || currentTheme?.hasCharacterSelection || currentTheme?.hasTextInput || currentTheme?.hasBrandInput ? '7' : '6'}. Dietary Requirements (Optional)</CardTitle>
                <CardDescription>Let us know about any dietary restrictions</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="space-y-3">
                  {DIETARY_OPTIONS.map((option) => (
                    <div key={option} className="flex items-center space-x-2">
                      <Checkbox
                        id={`dietary-${option}`}
                        checked={dietaryRequirements.includes(option)}
                        onCheckedChange={() => toggleDietary(option)}
                      />
                      <Label htmlFor={`dietary-${option}`} className="cursor-pointer">{option}</Label>
                    </div>
                  ))}
                </div>
                {dietaryRequirements.includes("Other") && (
                  <div>
                    <Label htmlFor="otherDietary">Please specify</Label>
                    <Input
                      id="otherDietary"
                      value={otherDietary}
                      onChange={(e) => setOtherDietary(e.target.value)}
                      placeholder="Describe other dietary requirements..."
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Step 8: Reference Photos/Instructions */}
          {flavours.length === requiredFlavourCount && (
            <Card>
              <CardHeader>
                <CardTitle>{currentTheme?.hasFlowerSelection || currentTheme?.hasCharacterSelection || currentTheme?.hasTextInput || currentTheme?.hasBrandInput ? '8' : '7'}. Reference Photos & Special Instructions (Optional)</CardTitle>
                <CardDescription>Share Instagram links or other references, and any special requests</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label htmlFor="referencePhotos">Upload Reference Photos</Label>
                  <Input
                    id="referencePhotos"
                    type="file"
                    accept="image/*"
                    multiple
                    className="mt-2"
                  />
                  <p className="text-sm text-muted-foreground mt-1">Upload photos for reference (optional)</p>
                </div>
                <div>
                  <Label htmlFor="referenceLinks">Reference Links from our Instagram</Label>
                  <Textarea
                    id="referenceLinks"
                    value={referenceLinks}
                    onChange={(e) => setReferenceLinks(e.target.value)}
                    placeholder="Paste links to reference images..."
                    rows={3}
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="specialInstructions">Special Instructions</Label>
                  <Textarea
                    id="specialInstructions"
                    value={specialInstructions}
                    onChange={(e) => setSpecialInstructions(e.target.value)}
                    placeholder="Any special requests or instructions..."
                    rows={3}
                    className="mt-2"
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Price Estimate */}
          {estimatedPrice && (
            <Card className="bg-primary/5 border-primary">
              <CardContent className="pt-6">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-medium">Estimated Price:</span>
                  <span className="text-3xl font-bold text-primary">${estimatedPrice}</span>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  Final price may vary based on design complexity
                </p>
              </CardContent>
            </Card>
          )}

          {/* Customer Details */}
          {flavours.length === requiredFlavourCount && (
            <Card>
              <CardHeader>
                <CardTitle>Customer Details</CardTitle>
                <CardDescription>Provide your contact and delivery information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div>
                  <Label htmlFor="customerName">Name</Label>
                  <Input
                    className="mt-2"
                    id="customerName"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="customerEmail">Email</Label>
                  <Input
                    className="mt-2"
                    id="customerEmail"
                    type="email"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="customerPhone">Phone</Label>
                  <Input
                    className="mt-2"
                    id="customerPhone"
                    type="tel"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <Label>Delivery Method *</Label>
                  <RadioGroup value={deliveryMethod} onValueChange={(val) => setDeliveryMethod(val as "delivery" | "pickup")}>
                    <div className="flex gap-4">
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="pickup" id="method-pickup" />
                        <Label htmlFor="method-pickup" className="cursor-pointer">Pickup</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="delivery" id="method-delivery" />
                        <Label htmlFor="method-delivery" className="cursor-pointer">Delivery</Label>
                      </div>
                    </div>
                  </RadioGroup>
                </div>

                {deliveryMethod === "delivery" && (
                  <div>
                    <Label htmlFor="deliveryAddress">Delivery Address *</Label>
                    <Textarea
                      id="deliveryAddress"
                      value={deliveryAddress}
                      onChange={(e) => setDeliveryAddress(e.target.value)}
                      placeholder="Enter full delivery address..."
                      rows={3}
                    />
                  </div>
                )}

                <div>
                  <Label>Fulfillment Date *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {fulfillmentDate ? format(fulfillmentDate, "PPP") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={fulfillmentDate}
                        onSelect={setFulfillmentDate}
                        disabled={(date) => date < getMinDate()}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <p className="text-sm text-muted-foreground mt-1">
                    Minimum 4 days advance notice required
                  </p>
                </div>

                <div>
                  <Label htmlFor="fulfillmentTime">Fulfillment Time *</Label>
                  <select
                    id="fulfillmentTime"
                    value={fulfillmentTime}
                    onChange={(e) => setFulfillmentTime(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-input rounded-md bg-background"
                  >
                    <option value="">Select time range</option>
                    {deliveryMethod === "pickup" ? (
                      // Pickup time slots: 11-1pm, 1-3pm, 3-5pm, 5-7pm
                      <>
                        <option value="11:00-13:00">11:00 AM - 1:00 PM</option>
                        <option value="13:00-15:00">1:00 PM - 3:00 PM</option>
                        <option value="15:00-17:00">3:00 PM - 5:00 PM</option>
                        <option value="17:00-19:00">5:00 PM - 7:00 PM</option>
                      </>
                    ) : (
                      // Delivery time slots: 10-1pm, 2-5pm, 5-7pm
                      <>
                        <option value="10:00-13:00">10:00 AM - 1:00 PM</option>
                        <option value="14:00-17:00">2:00 PM - 5:00 PM</option>
                        <option value="17:00-19:00">5:00 PM - 7:00 PM</option>
                      </>
                    )}
                  </select>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Submit Button */}
          {flavours.length === requiredFlavourCount && (
            <Button
              type="submit"
              size="lg"
              className="w-full"
              disabled={createOrderMutation.isPending}
            >
              {createOrderMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting Order...
                </>
              ) : (
                "Submit Custom Order"
              )}
            </Button>
          )}
        </form>
      </div>
    </div>
  );
}
