import { Link } from "wouter";
import { Button } from "@/components/ui/button";

const gallery = [
  { name: "Mahjong Huat", image: "/gallery/mahjong-huat.png" },
  { name: "Fan of Flowers", image: "/gallery/fan-of-flowers.png" },
  { name: "Space Explorer", image: "/gallery/space-explorer.png" },
  { name: "Pikachu", image: "/gallery/pikachu.png" },
  { name: "Under the Sea", image: "/gallery/under-the-sea.png" },
  { name: "Happy Woof-day!", image: "/gallery/happy-woofday.png" },
  { name: "Oriental Blessing", image: "/gallery/oriental-blessing.png" },
  { name: "Koi Pond", image: "/gallery/koi-pond.png" },
  { name: "Princess Choo-Choo Train", image: "/gallery/princess-choochoo.png" },
  { name: "The Muse", image: "/gallery/the-muse.png" },
  { name: "Scarlet Devotion", image: "/gallery/scarlet-devotion.png" },
  { name: "Cactus Valley", image: "/gallery/cactus-valley.png" },
];

export default function Home() {
  return (
    <div className="relative isolate min-h-screen bg-background">
      <img
        src="/rose-watermark.png"
        alt=""
        aria-hidden="true"
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] md:w-[900px] lg:w-[1100px] max-w-none opacity-[0.02] pointer-events-none select-none -z-10"
      />

      {/* Hero */}
      <section className="flex flex-col items-center justify-center text-center gap-8 pt-16 pb-12 md:pt-24 md:pb-16 container">
        <div className="flex flex-col items-center gap-4 max-w-3xl">
          <p className="font-display text-2xl md:text-4xl text-muted-foreground">
            Making memories, creating magical moments
          </p>
          <h1 className="font-normal text-4xl md:text-5xl lg:text-[52px]">
            Create a jelly your loved ones will remember
          </h1>
        </div>
        <Link href="/customize">
          <Button
            size="lg"
            className="bg-primary hover:opacity-90 text-primary-foreground font-medium text-lg md:text-xl rounded-full px-8 py-6"
          >
            Customise your jelly cake
          </Button>
        </Link>
      </section>

      {/* Gallery */}
      <section id="gallery" className="pb-20 md:pb-28">
        <div className="container">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-y-6 gap-x-2 md:gap-x-6 md:gap-y-4">
            {gallery.map((item) => (
              <div
                key={item.name}
                className="bg-[#faf7f3] rounded-[16px] md:rounded-[24px] flex flex-col gap-8 items-center px-5 pt-[12px] pb-[20px] md:pt-6 md:pb-8"
              >
                <p className="font-display w-full text-lg font-medium line-clamp-2">{item.name}</p>
                <div className="w-full flex justify-center">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full max-w-[250px] aspect-square rounded-full object-cover"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
