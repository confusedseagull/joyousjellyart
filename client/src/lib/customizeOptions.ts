import type { CakeFormat } from "@/contexts/CartContext";

// Shared source of truth for the Customize builder's option catalogs (theme,
// shape, flavour, format, platter sub-shapes) — imported by both the
// customer-facing builder (Customize.tsx) and the admin order detail page,
// which reuses the image lookups to show a photo next to each selected
// option instead of just its raw value.

export const THEMES = [
  { value: "floralBouquet", label: "Floral Bouquet", images: [
    "/customize/floralBouquet-1.webp",
    "/customize/floralBouquet-2.webp",
    "/customize/floralBouquet-3.webp",
    "/customize/floralBouquet-4.webp",
    "/customize/floralBouquet-5.webp",
    "/customize/floralBouquet-6.webp",
    "/customize/floralBouquet-7.webp"
  ] },
  { value: "cartoonCharacters", label: "Cartoon Characters", images: [
    "/customize/cartoonCharacters-1.webp",
    "/customize/cartoonCharacters-2.webp",
    "/customize/cartoonCharacters-3.webp",
    "/customize/cartoonCharacters-4.webp",
    "/customize/cartoonCharacters-5.webp",
    "/customize/cartoonCharacters-6.webp"
  ] },
  { value: "handDrawn", label: "Hand Drawn", images: [
    "/customize/handDrawn-1.webp",
    "/customize/handDrawn-2.webp",
    "/customize/handDrawn-3.webp",
    "/customize/handDrawn-4.webp",
    "/customize/handDrawn-5.webp"
  ] },
  { value: "lego", label: "Lego", images: [
    "/customize/lego-1.webp",
    "/customize/lego-2.webp",
    "/customize/lego-3.webp",
    "/customize/lego-4.webp"
  ] },
  { value: "mahjong", label: "Mahjong", images: [
    "/customize/mahjong-1.webp",
    "/customize/mahjong-2.webp",
    "/customize/mahjong-3.webp",
    "/customize/mahjong-4.webp"
  ] },
  { value: "poker", label: "Poker", images: [
    "/customize/poker-1.webp",
    "/customize/poker-2.webp"
  ] },
  { value: "chess", label: "Chess", image: "/customize/chess.webp" },
  { value: "underTheSea", label: "Under the Sea", images: [
    "/customize/underTheSea-1.webp",
    "/customize/underTheSea-2.webp",
    "/customize/underTheSea-3.webp",
    "/customize/underTheSea-4.webp",
    "/customize/underTheSea-5.webp"
  ] },
  { value: "animalKingdom", label: "Animal Kingdom", image: "/customize/animalKingdom.webp" },
  { value: "unicorn", label: "Unicorn", images: [
    "/customize/unicorn-1.webp",
    "/customize/unicorn-2.webp",
    "/customize/unicorn-3.webp",
    "/customize/unicorn-4.webp"
  ] },
  { value: "dinosaurs", label: "Dinosaurs", image: "/customize/dinosaurs.webp" },
  { value: "space", label: "Space", image: "/customize/space.webp" },
  { value: "koiPond", label: "Koi Pond", images: [
    "/customize/koiPond-1.webp",
    "/customize/koiPond-2.webp"
  ] },
  { value: "golf", label: "Sports", image: "/customize/golf.webp" },
  { value: "cars", label: "Cars", image: "/customize/cars.webp" },
  { value: "coutureFashion", label: "Couture/High Fashion", image: "/customize/coutureFashion.webp" },
  { value: "cactus", label: "Cactus/Foliage", image: "/customize/cactus.webp" },
  { value: "butterflies", label: "Butterflies", image: "/customize/butterflies.webp" },
  { value: "mermaid", label: "Mermaid", image: "/customize/mermaid.webp" },
  { value: "nameAndInitial", label: "Name and Initial", images: [
    "/customize/nameAndInitial-1.webp",
    "/customize/nameAndInitial-2.webp"
  ] },
];

export const FLOWERS = [
  { value: "Peony", label: "Peony", image: "/customize/flower-peony.webp" },
  { value: "Magnolias", label: "Magnolias", image: "/customize/flower-magnolia.webp" },
  { value: "Rose", label: "Rose", image: "/customize/flower-rose.webp" },
  { value: "Bengal Rose", label: "Bengal Rose", image: "/customize/flower-bengalRose.webp" },
  { value: "Hydrangeas", label: "Hydrangeas", image: "/customize/flower-hydrangea.webp" },
  { value: "Sakuras", label: "Sakuras", image: "/customize/flower-sakura.webp" },
  { value: "Daisy", label: "Daisy", image: "/customize/flower-daisy.webp" },
  { value: "Gerbera", label: "Gerbera", image: "/customize/flower-gerbera.webp" },
  { value: "Carnations", label: "Carnations", image: "/customize/flower-carnation.webp" },
  { value: "Lotus", label: "Lotus", image: "/customize/flower-lotus.webp" },
  { value: "Sunflowers", label: "Sunflowers", image: "/customize/flower-sunflower.webp" },
  { value: "Dahlias", label: "Dahlias", image: "/customize/flower-dahlia.webp" },
  { value: "Orchid", label: "Orchid", image: "/customize/flower-orchid.webp" },
  { value: "Tulip", label: "Tulip", image: "/customize/flower-tulip.webp" },
  { value: "Marigolds", label: "Marigolds", image: "/customize/flower-marigold.webp" },
  { value: "Dianthus", label: "Dianthus", image: "/customize/flower-dianthus.webp" },
  { value: "Clematis", label: "Clematis", image: "/customize/flower-clematis.webp" },
];

export const CARTOON_CHARACTERS = [
  "Pikachu", "Hello Kitty", "Cinnamoroll", "My Melody", "Kuromi",
  "Miffy", "Sumikko Gurashi", "Super Mario", "Winnie the Pooh"
];

export const SHAPES = [
  { value: "round", label: "Round", image: "/customize/shape-round.webp" },
  { value: "square", label: "Square", image: "/customize/shape-square.webp" },
  { value: "octagon", label: "Octagon", image: "/customize/shape-octagon.webp" },
  { value: "heart", label: "Heart", image: "/customize/shape-heart.webp" },
  { value: "star", label: "Star", image: "/customize/shape-star.webp" },
  { value: "teddyBear", label: "Teddy Bear", image: "/customize/shape-teddyBear.webp" },
  { value: "fan", label: "Fan", image: "/customize/shape-fan.webp" },
  { value: "rectangle", label: "Rectangle", image: "/customize/shape-rectangle.webp" },
  { value: "scalloped", label: "Scalloped Round/Rosette", image: "/customize/shape-scalloped.webp" },
  { value: "numbers", label: "Numbers", image: "/customize/shape-numbers.webp" },
  { value: "sakura", label: "Sakura", image: "/customize/shape-sakura.webp" },
  { value: "platter9", label: "Platter of 9", image: "/customize/shape-platter9.webp" },
  { value: "platter6", label: "Platter of 6", image: "/customize/shape-platter4.webp" },
  { value: "platter4", label: "Platter of 4", image: "/customize/shape-platter4.webp" },
  { value: "miniGiftBox", label: "Mini Gift Box", image: "/customize/shape-miniGiftBox.webp" },
  { value: "cupcake", label: "Cupcake", image: "/customize/shape-cupcake.webp" },
];

export const CAKE_SHAPE_VALUES = ["round", "square", "octagon", "heart", "star", "teddyBear", "fan", "rectangle", "scalloped", "numbers", "sakura"];
export const CAKE_SHAPES = SHAPES.filter(s => CAKE_SHAPE_VALUES.includes(s.value));
export const PLATTER_FORMAT_SHAPES = SHAPES.filter(s => s.value === "platter9" || s.value === "platter6" || s.value === "platter4");
export const GIFT_BOX_FORMAT_SHAPES = SHAPES.filter(s => s.value === "miniGiftBox" || s.value === "cupcake");

export const FORMATS: { value: CakeFormat; label: string; image: string }[] = [
  { value: "cake", label: "Cake", image: "/customize/round.webp" },
  { value: "jellyPlatter", label: "Jelly Platter", image: "/customize/platter9.webp" },
  { value: "miniGiftBox", label: "Mini Gift Boxes", image: "/customize/miniGiftBox.webp" },
];

export const PLATTER_INDIVIDUAL_SHAPES = [
  { value: "heart", label: "Heart", image: "/customize/shape-platter-heart.webp" },
  { value: "square", label: "Square", image: "/customize/shape-platter-square.webp" },
  { value: "circle", label: "Round", image: "/customize/shape-platter-circle.webp" },
  { value: "clover", label: "Clover" },
];

export const SHAPE_SIZES: { [key: string]: { value: string; label: string }[] } = {
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
    { value: "2tier_7_8", label: '2 Tier: 7" + 8"' },
    { value: "2tier_7_10", label: '2 Tier: 7" + 10"' },
    { value: "2tier_8_10", label: '2 Tier: 8" + 10"' },
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
    { value: "10x7inch", label: '10" x 7" / 25.4 cm x 17.8 cm' },
  ],
  scalloped: [
    { value: "8inch", label: '8" / 20.3 cm' },
  ],
  sakura: [
    { value: "6inch", label: '6" / 15.2 cm' },
    { value: "8inch", label: '8" / 20.3 cm' },
    { value: "2tier_6_8", label: '2 Tier: 6" + 8"' },
  ],
  platter9: [
    { value: "6cm", label: '6cm (Choose up to 3 shapes: Heart, Square, Round, Clover)' },
  ],
  platter6: [
    { value: "6cm", label: '6cm (Choose up to 3 shapes: Heart, Square, Round, Clover)' },
  ],
  platter4: [
    { value: "6cm", label: '6cm (Choose up to 2 shapes: Square, Heart, Clover, Round)' },
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

export const BASE_FLAVORS = [
  { value: "Longan", label: "Longan", image: "/customize/flavour-longan.webp" },
  { value: "Lychee", label: "Lychee", image: "/customize/flavour-lychee.webp" },
  { value: "Coconut", label: "Coconut", image: "/customize/flavour-coconut.webp" },
  { value: "Osmanthus Bloom", label: "Osmanthus Bloom", image: "/customize/flavour-osmanthusBloom.webp" },
  { value: "Yuzu", label: "Yuzu", image: "/customize/flavour-yuzu.webp" },
  { value: "Taro", label: "Taro", image: "/customize/flavour-taro.webp" },
  { value: "Strawberry", label: "Strawberry", image: "/customize/flavour-strawberry.webp" },
  { value: "Jujube & Gojiberries", label: "Jujube & Gojiberries", image: "/customize/flavour-jujubeGojiberries.webp" },
  { value: "Pineapple", label: "Pineapple", image: "/customize/flavour-pineapple.webp" },
  { value: "Valrhona Chocolate", label: "Valrhona Chocolate", image: "/customize/flavour-valrhonaChocolate.webp" },
  { value: "Passionfruit", label: "Passionfruit", image: "/customize/flavour-passionfruit.webp" },
  { value: "Berries Delight", label: "Berries Delight", image: "/customize/flavour-berriesDelight.webp" },
  { value: "Cheesecake", label: "Cheesecake", image: "/customize/flavour-cheesecake.webp" },
  { value: "Hawthorn", label: "Hawthorn" },
];

export const DIETARY_OPTIONS = [
  { value: "none", label: "None" },
  { value: "noDairy", label: "No Dairy" },
  { value: "noNuts", label: "No Nuts" },
  { value: "vegetarian", label: "Vegetarian" },
  { value: "vegan", label: "Vegan" },
  { value: "noCoconutMilk", label: "No Coconut Milk" },
];
