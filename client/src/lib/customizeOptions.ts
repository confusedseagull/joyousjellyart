import type { CakeFormat } from "@/contexts/CartContext";

// Shared source of truth for the Customize builder's option catalogs (theme,
// shape, flavour, format, platter sub-shapes) — imported by both the
// customer-facing builder (Customize.tsx) and the admin order detail page,
// which reuses the image lookups to show a photo next to each selected
// option instead of just its raw value.

export const THEMES = [
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

export const FLOWERS = [
  "Peony", "Rose", "Sunflowers", "Magnolias", "Sakuras", "Bengal Rose",
  "Lotus", "Daisy", "Gerbera", "Hydrangeas", "Dahlias", "Orchid",
  "Tulip", "Carnations", "Marigolds", "Dianthus", "Clematis"
];

export const CARTOON_CHARACTERS = [
  "Pikachu", "Hello Kitty", "Cinnamoroll", "My Melody", "Kuromi",
  "Miffy", "Sumikko Gurashi", "Super Mario", "Winnie the Pooh"
];

export const SHAPES = [
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
  { value: "platter6", label: "Platter of 6", image: "/customize/shape-platter4.png" },
  { value: "platter4", label: "Platter of 4", image: "/customize/shape-platter4.png" },
  { value: "miniGiftBox", label: "Mini Gift Box", image: "/customize/shape-miniGiftBox.png" },
  { value: "cupcake", label: "Cupcake", image: "/customize/shape-cupcake.png" },
];

export const CAKE_SHAPE_VALUES = ["round", "square", "octagon", "heart", "star", "teddyBear", "fan", "rectangle", "scalloped", "numbers", "sakura"];
export const CAKE_SHAPES = SHAPES.filter(s => CAKE_SHAPE_VALUES.includes(s.value));
export const PLATTER_FORMAT_SHAPES = SHAPES.filter(s => s.value === "platter9" || s.value === "platter6" || s.value === "platter4");
export const GIFT_BOX_FORMAT_SHAPES = SHAPES.filter(s => s.value === "miniGiftBox" || s.value === "cupcake");

export const FORMATS: { value: CakeFormat; label: string; image: string }[] = [
  { value: "cake", label: "Cake", image: "/customize/round.jpg" },
  { value: "jellyPlatter", label: "Jelly Platter", image: "/customize/platter9.jpg" },
  { value: "miniGiftBox", label: "Mini Gift Boxes", image: "/customize/miniGiftBox.jpg" },
];

export const PLATTER_INDIVIDUAL_SHAPES = [
  { value: "heart", label: "Heart", image: "/customize/shape-platter-heart.png" },
  { value: "square", label: "Square", image: "/customize/shape-platter-square.png" },
  { value: "circle", label: "Round", image: "/customize/shape-platter-circle.png" },
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

export const DIETARY_OPTIONS = [
  { value: "noDairy", label: "Dairy Free" },
  { value: "noNuts", label: "No Nuts" },
  { value: "vegetarian", label: "Vegetarian" },
  { value: "vegan", label: "Vegan" },
];
