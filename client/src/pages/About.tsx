import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function About() {
  return (
    <div className="relative isolate min-h-screen bg-background">
      <img
        src="/rose-watermark.png"
        alt=""
        aria-hidden="true"
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] md:w-[900px] lg:w-[1100px] max-w-none opacity-[0.02] pointer-events-none select-none -z-10"
      />

      <div className="container pt-10 md:pt-16 pb-20 md:pb-28">
        {/* Hero */}
        <div className="flex flex-col gap-6 max-w-3xl mb-16 md:mb-24">
          <h1 className="font-normal text-[32px] md:text-[52px] leading-tight">
            Celebrate every moment. A taste of joy in every bloom.
          </h1>
          <p className="text-muted-foreground text-base md:text-lg max-w-2xl">
            At Joyous JellyArt, we believe joy is not just found in grand milestones — but in the
            quiet, fleeting, beautiful moments that deserve to be honoured, savoured, and
            remembered. Each jelly creation begins with a simple truth: that beauty can be edible,
            and that joy can be shared — one handcrafted bloom at a time.
          </p>
          <p className="font-display italic text-xl md:text-2xl text-primary">
            Let joy be handmade. Let it be edible. Let it be shared.
          </p>
        </div>

        {/* Founder story */}
        <div className="flex flex-col md:flex-row gap-8 md:gap-16 mb-16 md:mb-24">
          <img
            src="/doreen-lee.webp"
            alt="Doreen Lee, founder of Joyous JellyArt"
            className="w-full md:w-72 aspect-[3/4] object-cover rounded-2xl shrink-0"
          />
          <div className="flex flex-col gap-5 max-w-2xl text-[15px] md:text-base leading-relaxed text-foreground">
            <h2 className="text-3xl md:text-4xl font-normal">The Joyous JellyArt Story</h2>
            <p>
              Founded by Doreen Lee, a passionate artist whose work has been honoured with the
              MIVA Award 2024 (Champion in Creative Technical and Traditional category) and
              featured on Channel 8 and The Straits Times, Joyous JellyArt is the embodiment of a
              personal journey. After the passing of her beloved father in 2020, Doreen found
              solace in the meditative process of jelly-making — pouring her grief, her love, and
              her hopes into every layer. What began as therapy became a calling.
            </p>
            <p>
              With every petal piped, every bloom sculpted, she discovered that joy — when shared
              — multiplies. The delighted smiles of friends, family, and customers became her
              compass. Their joy sparked hers, and soon, her hands were creating art not just for
              healing, but for celebration.
            </p>
          </div>
        </div>

        {/* What we make */}
        <div className="flex flex-col md:flex-row gap-8 md:gap-16 mb-16 md:mb-24">
          <div className="flex flex-col gap-5 max-w-2xl text-[15px] md:text-base leading-relaxed text-foreground md:mt-12">
            <h2 className="text-3xl md:text-4xl font-normal">What we make</h2>
            <p>
              Joyous JellyArt creates bespoke, handmade jelly cakes — intricate, floral masterpieces
              that grace birthdays, weddings, baby showers, and everything in between. Each design
              is made to order and crafted to bring light into someone's day.
            </p>
          </div>
          <img
            src="/gallery/floral-dress-jelly-cake.webp"
            alt="A floral dress-shaped jelly cake by Joyous JellyArt"
            className="w-full md:w-72 aspect-square object-cover rounded-2xl shrink-0"
          />
        </div>

        {/* Dedication */}
        <div className="border-t border-[#e5e5e5] pt-12 md:pt-16 max-w-2xl">
          <p className="font-display italic text-xl md:text-2xl leading-relaxed text-foreground">
            To the women who give endlessly, the professionals who live with quiet strength, the
            families who gather in love — these blooms are for you.
          </p>
        </div>

        {/* CTA */}
        <div className="mt-16 md:mt-24">
          <Link href="/customize">
            <Button
              size="lg"
              className="bg-primary hover:opacity-90 text-primary-foreground font-medium text-lg rounded-full px-8 py-6"
            >
              Customise your jelly cake
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
