import type { ReactNode } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import {
  FORMATS,
  CAKE_SHAPES,
  PLATTER_FORMAT_SHAPES,
  GIFT_BOX_FORMAT_SHAPES,
  PLATTER_INDIVIDUAL_SHAPES,
  SHAPE_SIZES,
  SERVES_INFO,
  NUMBER_CAKE_SIZES,
} from "@/lib/customizeOptions";
import { requiredFlavourCount, maxPlatterShapes } from "../../../../shared/orderItemRules";
import { sizeLabel } from "../../../../shared/orderLabels";

// Placeholder marketing copy — a starting point for the client to rewrite.
// Everything factual on this page (which shapes and sizes exist, servings,
// how many flavours or piece shapes a platter allows) comes from the same
// option lists the Customize builder uses, so it can't drift from what can
// actually be ordered.

type Shape = { value: string; label: string; image: string };

// Finished-cake photos for the Cakes section (from the Figma "Discover" frame).
// The builder's mould pictures are kept for the platters. Round
// has no photo of its own, so it shows the round two-tier cake; Numbers has a
// one-number and a two-number cake.
// Photos for the two Mini Gift Box styles (10cm square box, 6cm round cupcake).
const GIFT_BOX_PHOTOS: Record<string, string[]> = {
  miniGiftBox: ["/discover/minigiftbox-10cm.webp"],
  cupcake: ["/discover/minigiftbox-6cm.webp"],
};

const CAKE_PHOTOS: Record<string, string[]> = {
  round: ["/discover/cake-twotier.webp"],
  square: ["/discover/cake-square.webp"],
  octagon: ["/discover/cake-octagon.webp"],
  heart: ["/discover/cake-heart.webp"],
  star: ["/discover/cake-star.webp"],
  teddyBear: ["/discover/cake-teddy.webp"],
  fan: ["/discover/cake-fan.webp"],
  rectangle: ["/discover/cake-rectangle.webp"],
  scalloped: ["/discover/cake-scalloped.webp"],
  numbers: ["/discover/cake-onenumber.webp", "/discover/cake-twonumbers.webp"],
  sakura: ["/discover/cake-sakura.webp"],
};

const FORMAT_IMAGE: Record<string, string> = Object.fromEntries(FORMATS.map((f) => [f.value, f.image]));

function ShapeCard({ shape, images, children }: { shape: Shape; images?: string[]; children: ReactNode }) {
  const pictures = images && images.length > 0 ? images : [shape.image];
  return (
    <div className="flex items-start gap-4">
      {/* Several pictures (e.g. the one- and two-number cakes) overlap slightly. */}
      <div className="flex shrink-0 -space-x-6">
        {pictures.map((src) => (
          <img
            key={src}
            src={src}
            alt={shape.label}
            className="size-20 md:size-24 rounded-full object-cover border-2 border-background"
          />
        ))}
      </div>
      <div className="flex flex-col gap-1 min-w-0">
        <h4 className="font-medium text-base">{shape.label}</h4>
        <div className="text-sm text-muted-foreground leading-relaxed">{children}</div>
      </div>
    </div>
  );
}

// Every size a shape comes in, with servings where we have them.
function SizeList({ shape }: { shape: string }) {
  if (shape === "numbers") {
    return (
      <ul className="flex flex-col gap-0.5">
        {NUMBER_CAKE_SIZES.map((n) => (
          <li key={n.count}>
            {n.count} number{n.count > 1 ? "s" : ""} · {n.dimension} · {n.serves}
          </li>
        ))}
      </ul>
    );
  }
  return (
    <ul className="flex flex-col gap-0.5">
      {(SHAPE_SIZES[shape] ?? []).map((s) => (
        <li key={s.value}>
          {sizeLabel(shape, s.value)}
          {SERVES_INFO[s.value] ? ` · ${SERVES_INFO[s.value]}` : ""}
        </li>
      ))}
    </ul>
  );
}

function FormatSection({
  id,
  title,
  description,
  facts,
  cta,
  children,
}: {
  id: string;
  title: string;
  description: string;
  facts: string[];
  cta: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24 py-10 md:py-14 border-b border-[#e5e5e5] last:border-b-0">
      <div className="flex flex-col md:flex-row md:items-center gap-5 md:gap-10 mb-8">
        <img src={FORMAT_IMAGE[id]} alt={title} className="size-40 md:size-48 rounded-full object-cover shrink-0" />
        <div className="flex flex-col gap-3 max-w-2xl">
          <h2 className="text-3xl md:text-4xl font-normal">{title}</h2>
          <p className="text-muted-foreground leading-relaxed">{description}</p>
          <ul className="flex flex-wrap gap-2 mt-1">
            {facts.map((fact) => (
              <li key={fact} className="rounded-full border border-[#e5e5e5] bg-white px-3 py-1 text-sm text-muted-foreground">
                {fact}
              </li>
            ))}
          </ul>
        </div>
      </div>
      {children}
      <div className="mt-8">
        <Link href="/customize">
          <Button className="rounded-full px-6">{cta}</Button>
        </Link>
      </div>
    </section>
  );
}

export function FormatsGuide() {
  const cakeShapes: Shape[] = CAKE_SHAPES;
  const platterShapes: Shape[] = PLATTER_FORMAT_SHAPES;

  return (
    <div className="flex flex-col">
      {/* Jump links between the three formats */}
      <nav aria-label="Formats" className="flex flex-wrap gap-2 mb-2">
        {[
          { id: "cake", label: "Cakes" },
          { id: "jellyPlatter", label: "Jelly Platters" },
          { id: "miniGiftBox", label: "Mini Gift Boxes" },
        ].map((item) => (
          <a
            key={item.id}
            href={`#${item.id}`}
            className="rounded-full border border-[#e5e5e5] bg-white px-4 py-2 text-sm hover:border-primary/40 transition-colors"
          >
            {item.label}
          </a>
        ))}
      </nav>

      {/* Cakes */}
      <FormatSection
        id="cake"
        title="Cakes"
        description="Our signature full-sized jelly cake, made to order. Pick a shape and a size — from a single tier to a stacked two-tier — then choose a theme, flavour and every detail on top."
        facts={[`${cakeShapes.length} shapes`, "Single and two-tier", "1 base flavour"]}
        cta="Customise a cake"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
          {cakeShapes.map((shape) => (
            <ShapeCard key={shape.value} shape={shape} images={CAKE_PHOTOS[shape.value]}>
              <SizeList shape={shape.value} />
            </ShapeCard>
          ))}
        </div>
        <p className="text-sm text-muted-foreground mt-8 max-w-2xl leading-relaxed">
          Two-tier cakes stack the two sizes shown, larger below. The Numbers cake is made from one or two numbers you choose. Servings
          are a guide, shown where we have them.
        </p>
      </FormatSection>

      {/* Jelly platters */}
      <FormatSection
        id="jellyPlatter"
        title="Jelly Platters"
        description="A shareable platter of individual jellies — a lighter way to feed a crowd. Mix and match the piece shapes below, and choose more than one flavour."
        facts={["4, 6 or 9 pieces", "Mix piece shapes", "2–3 flavours"]}
        cta="Customise a jelly platter"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
          {platterShapes.map((shape) => {
            const flavours = requiredFlavourCount(shape.value);
            const pieces = maxPlatterShapes(shape.value, "6cm");
            return (
              <ShapeCard key={shape.value} shape={shape}>
                <SizeList shape={shape.value} />
                <p className="mt-2">
                  {shape.value === "platter4"
                    ? `At 6cm, mix up to ${pieces} piece shapes; the 10cm size is Square only. `
                    : `Mix up to ${pieces} piece shapes. `}
                  Choose up to {flavours} flavours.
                </p>
              </ShapeCard>
            );
          })}
        </div>

        <h3 className="text-xl font-normal mt-10 mb-4">Piece shapes</h3>
        <ul className="flex flex-wrap gap-6">
          {PLATTER_INDIVIDUAL_SHAPES.map((piece) => (
            <li key={piece.value} className="flex flex-col items-center gap-2 w-24">
              <img src={piece.image} alt={piece.label} className="size-20 rounded-full object-cover" />
              <span className="text-sm">{piece.label}</span>
            </li>
          ))}
        </ul>
      </FormatSection>

      {/* Mini gift boxes */}
      <FormatSection
        id="miniGiftBox"
        title="Mini Gift Boxes"
        description="Individually packaged jellies, ready to give — lovely for gifts and party favours. Choose a square box or a round cupcake, then order as many as you need in one go."
        facts={["2 styles", "Order any quantity", "1 base flavour"]}
        cta="Customise mini gift boxes"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
          {GIFT_BOX_FORMAT_SHAPES.map((shape) => (
            <ShapeCard key={shape.value} shape={shape} images={GIFT_BOX_PHOTOS[shape.value]}>
              {shape.value === "miniGiftBox" ? "Square · 10cm" : "Round · 6cm"}
            </ShapeCard>
          ))}
        </div>
        <p className="text-sm text-muted-foreground mt-8 max-w-2xl leading-relaxed">
          Several boxes ordered together are one item in your cart, priced for all of them.
        </p>
      </FormatSection>
    </div>
  );
}
