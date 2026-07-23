import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useCart } from "@/contexts/CartContext";
import { CartDrawer } from "@/components/CartDrawer";
import { Check } from "lucide-react";

// CNY 2026 Designs data with S3 image URLs
const cnyDesigns = [
  // Prosperity Edition
  {
    id: 1,
    name: "Golden Gallop",
    edition: "Prosperity Edition",
    image: "/GoldenGallop.jpg",
    dimensions: "8\" / 20 cm or 10\" / 25 cm",
    sizes: [
      { size: "8\"", price: "$128" },
      { size: "10\"", price: "$168" }
    ]
  },
  {
    id: 2,
    name: "Mahjong Huat",
    edition: "Prosperity Edition",
    image: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663267774504/JtWRcqgDvsiGsWXI.jpeg",
    dimensions: "8\" / 20 cm or 10\" / 25 cm",
    sizes: [
      { size: "8\"", price: "$128" },
      { size: "10\"", price: "$168" }
    ]
  },
  {
    id: 3,
    name: "Huat Huat Box",
    edition: "Prosperity Edition",
    image: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663267774504/TgniWUzoMxEZDRLu.jpeg",
    dimensions: "7\" x 5\" / 18 cm x 13 cm",
    sizes: [
      { size: "Standard", price: "$118" }
    ]
  },
  {
    id: 4,
    name: "Huat Huat Box (Lion Edition)",
    edition: "Prosperity Edition",
    image: "/Huat-huat-box-lion.jpg",
    dimensions: "7\" x 5\" / 18 cm x 13 cm",
    sizes: [
      { size: "Standard", price: "$118" }
    ]
  },
  {
    id: 5,
    name: "Lucky Stallion",
    edition: "Prosperity Edition",
    image: "/LuckyStallion.jpg",
    dimensions: "8\" / 20 cm or 10\" / 25 cm",
    sizes: [
      { size: "8\"", price: "$128" },
      { size: "10\"", price: "$168" }
    ]
  },
  {
    id: 6,
    name: "Joyful Koi Lux Platter",
    edition: "Prosperity Edition",
    image: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663267774504/ajqLmsXhmWoYbSXY.jpeg",
    dimensions: "10\" / 25 cm",
    sizes: [
      { size: "Standard", price: "$128" }
    ]
  },
  {
    id: 7,
    name: "Lucky Strike",
    edition: "Prosperity Edition",
    image: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663267774504/WmmbSYScYuynQXfC.jpeg",
    dimensions: "3\" / 8 cm each",
    sizes: [
      { size: "Standard", price: "$118" }
    ]
  },
  // Blooms Edition
  {
    id: 8,
    name: "Spring Blossoms",
    edition: "Blooms Edition",
    image: "/SpringBlossoms.jpg",
    dimensions: "8\" / 20 cm or 10\" / 25 cm",
    sizes: [
      { size: "8\"", price: "$128" },
      { size: "10\"", price: "$168" }
    ]
  },
  {
    id: 9,
    name: "Abundance Wealth",
    edition: "Blooms Edition",
    image: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663267774504/IAEpIqmXkRBgKEOe.jpeg",
    dimensions: "8\" / 20 cm or 10\" / 25 cm",
    sizes: [
      { size: "8\"", price: "$128" },
      { size: "10\"", price: "$168" }
    ]
  },
  {
    id: 10,
    name: "Joyous Blooms",
    edition: "Blooms Edition",
    image: "/JoyousBlooms.jpg",
    dimensions: "8\" / 20 cm or 10\" / 25 cm",
    sizes: [
      { size: "8\"", price: "$128" },
      { size: "10\"", price: "$168" }
    ]
  },
  {
    id: 11,
    name: "Bountiful Blessing",
    edition: "Blooms Edition",
    image: "/BountifulBlessing.jpg",
    dimensions: "8\" / 20 cm or 10\" / 25 cm",
    sizes: [
      { size: "8\"", price: "$128" },
      { size: "10\"", price: "$168" }
    ]
  },
  // Fortune Edition
  {
    id: 12,
    name: "Prosperity Koi",
    edition: "Fortune Edition",
    image: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663267774504/kAFTMUzLUrjfAilU.png",
    dimensions: "9\" / 23 cm",
    sizes: [
      { size: "Standard", price: "$88.80" }
    ]
  },
  {
    id: 13,
    name: "Auspicious Angbao",
    edition: "Fortune Edition",
    image: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663267774504/TaEHGgyhwfMtfkyM.jpeg",
    dimensions: "11\" x 7\" / 28 cm x 18 cm",
    sizes: [
      { size: "Standard", price: "$88.80" }
    ]
  },
  {
    id: 14,
    name: "Fortune Ingot",
    edition: "Fortune Edition",
    image: "/Fortune.Ingot.JPEG",
    dimensions: "6\" / 15 cm or 8\" / 20 cm or 10\" / 25 cm",
    sizes: [
      { size: "6\"", price: "$88" },
      { size: "8\"", price: "$128" },
      { size: "10\"", price: "$168" }
    ]
  },
  {
    id: 15,
    name: "Fortune Lion",
    edition: "Fortune Edition",
    image: "/FortuneLion.jpg",
    dimensions: "3\" / 8 cm each",
    sizes: [
      { size: "Standard", price: "$88.80" }
    ]
  },
   {
    id: 16,
    name: "Fortune Koi",
    edition: "Fortune Edition",
    image: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663267774504/PTDZRqpjmayohSUj.png",
    dimensions: "9\" / 23 cm",
    sizes: [
      { size: "Standard", price: "$88.80" }
    ]
  },
  {
    id: 17,
    name: "Gold Wealth Bar",
    edition: "Fortune Edition",
    image: "/Gold-bar2.jpg",
    dimensions: "8\" x 3\" / 20 cm x 8 cm",
    sizes: [
      { size: "Standard", price: "$88.80" }
    ]
  },
  {
    id: 18,
    name: "Firecracker",
    edition: "Fortune Edition",
    image: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663267774504/RixxzHOozCqMbzkL.jpeg",
    dimensions: "10\" / 25 cm",
    sizes: [
      { size: "Standard", price: "$108" }
    ]
  },
  // Auspicious Edition
  {
    id: 19,
    name: "Auspicious Platter 福多多",
    edition: "Auspicious Edition",
    image: "/fuwangwang.JPEG",
    dimensions: "3\" / 8 cm each",
    sizes: [
      { size: "9-piece set", price: "$108" }
    ]
  },
  {
    id: 20,
    name: "Auspicious Platter 发满满",
    edition: "Auspicious Edition",
    image: "/huatman.JPEG",
    dimensions: "3\" / 8 cm each",
    sizes: [
      { size: "9-piece set", price: "$108" }
    ]
  },
  {
    id: 21,
    name: "Blessings Gift Box 福到人间",
    edition: "Auspicious Edition",
    image: "/Test_1.JPEG",
    dimensions: "4\" / 10 cm each",
    sizes: [
      { size: "4-piece set", price: "$68" }
    ]
  },
  {
    id: 22,
    name: "Huat Ah",
    edition: "Auspicious Edition",
    image: "/IMG_20260115_113738.JPEG",
    dimensions: "10\" / 25 cm",
    sizes: [
      { size: "10\"", price: "$168" }
    ]
  }
];

const baseFlavors = [
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
  "Berries Delight"
];

// Product-specific flavor restrictions
const productFlavorRestrictions: Record<number, string[]> = {
  12: ["Jujube & Gojiberries", "Valrhona Chocolate", "Berries Delight"], // Prosperity Koi
  16: ["Jujube & Gojiberries", "Valrhona Chocolate", "Berries Delight"] // Fortune Koi
};

interface SelectedDesign {
  id: number;
  name: string;
  edition: string;
  image: string;
  dimensions?: string;
  sizes: { size: string; price: string }[];
}

export default function CNY2026() {
  const [selectedDesign, setSelectedDesign] = useState<SelectedDesign | null>(null);
  const [selectedSize, setSelectedSize] = useState<string>("");
  const [selectedFlavors, setSelectedFlavors] = useState<string[]>([]);
  const [noDairy, setNoDairy] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCartDrawerOpen, setIsCartDrawerOpen] = useState(false);
  const { addItem, totalItems } = useCart();
  const [addedMessage, setAddedMessage] = useState<string | null>(null);

  const handleAddToCart = (design: SelectedDesign) => {
    setSelectedDesign(design);
    setSelectedSize(design.sizes[0]?.size || "");
    setSelectedFlavors([]);
    setNoDairy(false);
    setIsModalOpen(true);
  };

  const handleConfirmAddToCart = () => {
    if (!selectedDesign || !selectedSize || selectedFlavors.length === 0) return;

    const sizeOption = selectedDesign.sizes.find(s => s.size === selectedSize);
    if (!sizeOption) return;

    addItem({
      designId: selectedDesign.id,
      name: selectedDesign.name,
      edition: selectedDesign.edition,
      size: selectedSize,
      price: sizeOption.price,
      flavors: selectedFlavors,
      image: selectedDesign.image,
      dietaryRequirements: noDairy ? ["No Dairy"] : undefined
    });

    setAddedMessage(`${selectedDesign.name} added to cart!`);
    setTimeout(() => setAddedMessage(null), 3000);

    setIsModalOpen(false);
    setSelectedDesign(null);
    setSelectedSize("");
    setSelectedFlavors([]);
    
    // Open cart drawer after adding item
    setIsCartDrawerOpen(true);
  };

  const getSelectedPrice = () => {
    if (!selectedDesign || !selectedSize) return "";
    const sizeOption = selectedDesign.sizes.find(s => s.size === selectedSize);
    return sizeOption?.price || "";
  };

  const getAvailableFlavors = () => {
    if (!selectedDesign) return baseFlavors;
    const restrictedFlavors = productFlavorRestrictions[selectedDesign.id] || [];
    return baseFlavors.filter(flavor => !restrictedFlavors.includes(flavor));
  };

  // Group designs by edition
  const prosperityDesigns = cnyDesigns.filter(d => d.edition === "Prosperity Edition");
  const bloomsDesigns = cnyDesigns.filter(d => d.edition === "Blooms Edition");
  const fortuneDesigns = cnyDesigns.filter(d => d.edition === "Fortune Edition");
  const auspiciousDesigns = cnyDesigns.filter(d => d.edition === "Auspicious Edition");

  const renderDesignCard = (design: typeof cnyDesigns[0]) => (
    <Card key={design.id} className="overflow-hidden group border-0 shadow-none hover:shadow-none transition-smooth p-0 gap-0 bg-transparent">
      <div className="aspect-[3/4] overflow-hidden rounded-xl">
        <img 
          src={design.image} 
          alt={design.name}
          className="w-full h-full object-cover group-hover:scale-110 transition-all duration-500 ease-out"
        />
      </div>
      <CardContent className="pt-3 pb-4 px-0 flex flex-col h-[160px] justify-between">
        <h3 className="font-semibold text-base mb-0 min-h-[2.5rem] flex items-center tracking-tight leading-tight">{design.name}</h3>
        <div className="min-h-[1.25rem] mb-2">
          {design.dimensions && (
            <p className="text-xs text-muted-foreground">{design.dimensions}</p>
          )}
        </div>
        <p className="mb-3 flex-grow">
          {design.sizes.length > 1 ? (
            <>
              <span className="text-muted-foreground text-xs">From </span>
              <span className="text-xl font-semibold text-primary">{design.sizes[0].price}</span>
            </>
          ) : (
            <span className="text-xl font-semibold text-primary">{design.sizes[0].price}</span>
          )}
        </p>
        <Button 
          size="sm"
          className="w-full mt-auto rounded-lg hover:scale-[1.02] transition-transform" 
          onClick={() => handleAddToCart(design)}
        >
          Add to Cart
        </Button>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative bg-background">
        <div className="container py-16 md:py-20 text-center">
          <h1 className="text-foreground mb-6 font-semibold">
            2026 CNY Collection
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Celebrate the Year of the Horse with our exclusive Chinese New Year jelly art cakes. 
            Each design brings prosperity, joy, and artistry to your festive celebrations.
          </p>
        </div>
      </section>

      {/* Success Message Toast */}
      {addedMessage && (
        <div className="fixed bottom-4 right-4 bg-primary text-primary-foreground px-6 py-3 rounded-lg shadow-lg z-50 animate-in slide-in-from-bottom-5">
          <div className="flex items-center gap-2">
            <Check className="h-5 w-5" />
            <span>{addedMessage}</span>
          </div>
        </div>
      )}

      {/* Prosperity Edition */}
      <section className="py-12 bg-background">
        <div className="container">
          <h2 className="text-2xl font-semibold mb-8 text-center tracking-tight">Prosperity Edition</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {prosperityDesigns.map(renderDesignCard)}
          </div>
        </div>
      </section>

      {/* Blooms Edition */}
      <section className="py-12 bg-background">
        <div className="container">
          <h2 className="text-2xl font-semibold mb-8 text-center tracking-tight">Blooms Edition</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {bloomsDesigns.map(renderDesignCard)}
          </div>
        </div>
      </section>

      {/* Fortune Edition */}
      <section className="py-12 bg-background">
        <div className="container">
          <h2 className="text-2xl font-semibold mb-8 text-center tracking-tight">Fortune Edition</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {fortuneDesigns.map(renderDesignCard)}
          </div>
        </div>
      </section>

      {/* Auspicious Edition */}
      <section className="py-12 bg-background">
        <div className="container">
          <h2 className="text-2xl font-semibold mb-8 text-center tracking-tight">Auspicious Edition</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {auspiciousDesigns.map(renderDesignCard)}
          </div>
        </div>
      </section>

      {/* Customization Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Customize Your Order</DialogTitle>
          </DialogHeader>

          {selectedDesign && (
            <div className="space-y-6">
              {/* Size Selection */}
              {selectedDesign.sizes.length > 1 && (
                <div className="space-y-3">
                  <Label className="text-base font-semibold">Select Size</Label>
                  <RadioGroup value={selectedSize} onValueChange={setSelectedSize}>
                    <div className="grid grid-cols-2 gap-3">
                      {selectedDesign.sizes.map((sizeOption) => (
                        <div key={sizeOption.size} className="relative">
                          <RadioGroupItem
                            value={sizeOption.size}
                            id={`size-${sizeOption.size}`}
                            className="peer sr-only"
                          />
                          <Label
                            htmlFor={`size-${sizeOption.size}`}
                            className="flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                          >
                            <span className="font-medium">{sizeOption.size}</span>
                            <span className="text-sm text-muted-foreground">{sizeOption.price}</span>
                          </Label>
                        </div>
                      ))}
                    </div>
                  </RadioGroup>
                </div>
              )}

              {/* Flavor Selection */}
              <div className="space-y-3">
                <Label className="text-base font-semibold">
                  Select Flavors {selectedDesign.dimensions?.includes('3"') ? '(up to 3)' : selectedDesign.dimensions?.includes('4"') ? '(up to 2)' : ''}
                </Label>
                <div className="grid grid-cols-2 gap-2">
                  {getAvailableFlavors().map((flavor) => {
                    const maxFlavors = selectedDesign.dimensions?.includes('3"') ? 3 : selectedDesign.dimensions?.includes('4"') ? 2 : 1;
                    const isSelected = selectedFlavors.includes(flavor);
                    const isDisabled = !isSelected && selectedFlavors.length >= maxFlavors;
                    
                    return (
                      <div key={flavor} className="relative">
                        <Label
                          className={`flex items-center justify-between rounded-md border-2 px-3 py-2 cursor-pointer text-sm ${
                            isSelected 
                              ? 'border-primary bg-primary/10' 
                              : isDisabled 
                                ? 'border-muted bg-muted/50 opacity-50 cursor-not-allowed'
                                : 'border-muted bg-popover hover:bg-accent hover:text-accent-foreground'
                          }`}
                          onClick={() => {
                            if (isDisabled) return;
                            setSelectedFlavors(prev => 
                              isSelected 
                                ? prev.filter(f => f !== flavor)
                                : [...prev, flavor]
                            );
                          }}
                        >
                          <span>{flavor}</span>
                          {isSelected && (
                            <Check className="h-4 w-4 text-primary" />
                          )}
                        </Label>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Dietary Requirements */}
              <div className="space-y-3">
                <Label className="text-base font-semibold">Dietary Requirements (Optional)</Label>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="noDairy"
                    checked={noDairy}
                    onChange={(e) => setNoDairy(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <Label htmlFor="noDairy" className="text-sm font-normal cursor-pointer">
                    No Dairy
                  </Label>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleConfirmAddToCart}
              disabled={!selectedSize || selectedFlavors.length === 0}
            >
              Add to Cart - {getSelectedPrice()}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cart Drawer */}
      <CartDrawer open={isCartDrawerOpen} onOpenChange={setIsCartDrawerOpen} />
    </div>
  );
}
