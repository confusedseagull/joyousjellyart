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
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="flex flex-col items-center justify-center text-center gap-8 pt-16 pb-12 md:pt-24 md:pb-16 container">
        <div className="flex flex-col items-center gap-4 max-w-3xl">
          <p className="font-display text-2xl md:text-4xl text-muted-foreground">
            Making memories, creating magical moments
          </p>
          <h1 className="text-4xl md:text-5xl lg:text-[52px]">
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
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {gallery.map((item) => (
              <div
                key={item.name}
                className="bg-[#faf7f3] flex flex-col gap-8 items-center px-5 pt-6 pb-8"
              >
                <p className="w-full text-lg font-medium truncate">{item.name}</p>
                <div className="w-full flex justify-center">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="size-[250px] max-w-full rounded-full object-cover"
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
