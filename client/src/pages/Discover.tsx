import { Button } from "@/components/ui/button";
import { THEMES, FLOWERS, CARTOON_CHARACTERS } from "@/lib/customizeOptions";

const WHATSAPP_NUMBER = "6582999559";
const WHATSAPP_MESSAGE = encodeURIComponent("Hi! I'm interested in a custom jelly cake design.");
const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}?text=${WHATSAPP_MESSAGE}`;

// Placeholder marketing copy per theme — a starting point for the client to
// rewrite, not final copy.
const THEME_DESCRIPTIONS: Record<string, string> = {
  floralBouquet: "A hand-piped bouquet, crafted one petal at a time, with your choice of blooms and colors for a romantic timeless finish.",
  cartoonCharacters: "Your favourite cartoon or anime character recreated in jelly — perfect for birthdays and fans of all ages.",
  handDrawn: "A one-of-a-kind design, hand-illustrated onto the jelly canvas from your own reference photo or idea.",
  lego: "One for the lego lovers. Playful, colorful jelly bricks stacked and arranged in any fun way. Let your imagination run wild!",
  mahjong: "A mahjong table brought to life in jelly, tiles and all — a favourite for birthdays and family celebrations.",
  poker: "Cards, chips, and casino details rendered in jelly for a high-stakes centrepiece.",
  chess: "A checkered board and jelly chess pieces, ideal for the strategist or games lover in your life.",
  underTheSea: "A vibrant underwater scene with coral, fish, and marine life, all crafted in jelly.",
  animalKingdom: "A menagerie of jelly animals, from jungle favourites to beloved pets.",
  unicorn: "A whimsical, pastel-toned unicorn design with flowing manes and magical details.",
  dinosaurs: "Prehistoric jelly creatures big and small — a roaring favourite for kids' parties.",
  space: "Planets, stars, and astronauts drifting across a jelly night sky.",
  koiPond: "Graceful koi swimming through a tranquil jelly pond, a symbol of luck and prosperity.",
  golf: "Celebrate a favourite sport — from the greens to the court — recreated in jelly detail.",
  cars: "A jelly tribute to your favourite ride, from classic models to race-day speedsters.",
  coutureFashion: "An elegant, runway-inspired design featuring your favourite fashion house's signature look.",
  cactus: "A lush, botanical arrangement of jelly cacti and greenery for an earthy, modern finish.",
  butterflies: "Delicate jelly butterflies in flight, in colours and patterns of your choosing.",
  mermaid: "An enchanting underwater mermaid scene with shimmering scales and ocean details.",
  nameAndInitial: "The first alphabet of your loved one's name with their name carved into the side, surrounded by sweet blooms. A fully customised name and initial creation that requires a minimum of two weeks advance ordering.",
};

// Optional "available options" line per theme, listing out the relevant
// choices from the Customize wizard.
const THEME_OPTIONS: Record<string, string> = {
  floralBouquet: `Available flowers: ${FLOWERS.map((f) => f.label).join(", ")}.`,
  cartoonCharacters: `Available characters: ${CARTOON_CHARACTERS.join(", ")}.`,
};

// Optional extra note per theme, shown below the description/options.
const THEME_NOTES: Record<string, string> = {
  cartoonCharacters: "Can't find what you're looking for? Check out our hand drawn creations.",
  handDrawn: "We draw your pets, your loved ones, your favourite characters, your company logo and more.",
  lego: "One of our favourites is the Lego Princess Choo Choo Train with Bunnies and Teddy Bears. Yes, we really meant it when we said your imagination can go wild.",
};

// Extra Discover-only photos per theme, layered on top of the Customize
// wizard's reference photos — e.g. the Lego Princess Choo Choo Train called
// out in that theme's copy above.
const THEME_EXTRA_IMAGES: Record<string, string[]> = {
  lego: ["/gallery/princess-choochoo.png"],
};

// Every reference photo for each customizable theme (the same assets used in
// the Customize wizard's theme picker), so this page doubles as a full
// catalog of what can actually be ordered.
const gallery = THEMES.map((theme) => ({
  name: theme.label,
  description: THEME_DESCRIPTIONS[theme.value] ?? "",
  options: THEME_OPTIONS[theme.value],
  note: THEME_NOTES[theme.value],
  images: [...(theme.images ?? (theme.image ? [theme.image] : [])), ...(THEME_EXTRA_IMAGES[theme.value] ?? [])],
}));

export default function Discover() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container pt-10 md:pt-16 pb-20 md:pb-28">
        <div className="flex flex-col gap-3 mb-10 md:mb-14 max-w-2xl">
          <h1 className="font-normal text-[28px] md:text-[44px]">Discover our designs</h1>
          <p className="text-muted-foreground text-base md:text-lg">
            Every theme we can bring to life on a jelly cake — pick one as inspiration, or use it as a starting point. Customise the format, shape, size, colors, details, wording and flavour and let us bring it to life!
          </p>
        </div>

        <div className="flex flex-col">
          {gallery.map((theme) => (
            <div
              key={theme.name}
              className="flex flex-col md:flex-row md:items-center gap-4 md:gap-10 py-8 border-b border-[#e5e5e5] first:pt-0"
            >
              {/* Name + description */}
              <div className="md:w-64 shrink-0 flex flex-col gap-2">
                <h3 className="font-normal">{theme.name}</h3>
                {theme.description && (
                  <p className="text-muted-foreground text-sm leading-relaxed">{theme.description}</p>
                )}
                {theme.options && (
                  <p className="text-muted-foreground text-sm leading-relaxed mt-3">{theme.options}</p>
                )}
                {theme.note && (
                  <p className="text-muted-foreground text-sm leading-relaxed mt-3">{theme.note}</p>
                )}
              </div>

              {/* All reference photos for this theme */}
              <div className="flex gap-3 md:gap-4 overflow-x-auto pb-1 -mx-1 px-1">
                {theme.images.map((image, i) => (
                  <img
                    key={image + i}
                    src={image}
                    alt={theme.name}
                    className="w-48 h-48 md:w-56 md:h-56 rounded-full object-cover shrink-0"
                  />
                ))}
              </div>
            </div>
          ))}

          {/* Custom / hand-drawn callout — same row format as the theme rows
              above, but freeform rather than driven by THEMES data. TODO:
              swap in a real photo of the alien spaceship + space theme cake
              described below once available. */}
          <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-10 py-8 border-b border-[#e5e5e5]">
            <div className="md:w-64 shrink-0 flex flex-col gap-2">
              <h3 className="font-normal">Can't find what you're looking for?</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Our hand drawn designs are what we use to create your dream cake. For example, we
                illustrated this alien space ship by hand and combined it with our space theme to
                make a little boy's wishes come through.
              </p>
            </div>
          </div>
        </div>

        {/* Contact Us */}
        <div className="flex flex-col items-center text-center gap-5 pt-16 md:pt-24">
          <h2 className="text-3xl md:text-4xl font-normal">Contact Us</h2>
          <p className="text-muted-foreground max-w-md">
            Have a design in mind that's not shown here? Chat with us on WhatsApp and let's bring
            it to life together.
          </p>
          <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer">
            <Button
              size="lg"
              className="bg-primary hover:opacity-90 text-primary-foreground font-medium text-lg rounded-full px-8 py-6"
            >
              Chat with us on WhatsApp
            </Button>
          </a>
        </div>
      </div>
    </div>
  );
}
