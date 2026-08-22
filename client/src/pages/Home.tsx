import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Star } from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from "@/components/ui/carousel";

// Reviews curated by hand from the Google Business Profile listing rather
// than pulled live, since Google's API doesn't expose a link to one specific
// review — each `url` here comes from that review's own "Share" option in
// Google Maps/Search instead. To add another: same approach, and save any
// attached customer photos into client/public/reviews/ for the `images` list.
const reviews: {
  author: string;
  rating: number;
  date: string;
  text: string;
  url: string;
  images?: string[];
}[] = [
  {
    author: "RenniEunice SohLim",
    rating: 5,
    date: "3 months ago",
    text: "Doreen from Joyous JellyArt kindly acceded to my request for my teen and preteen to contribute to the making of the jelly cake for my dad's 70th birthday. Doreen conducted a mini hands-on workshop to teach and guide my girls to make the Koi fishes, longevity peaches, 寿 word, and the entire jelly cake (except the flowers). Doreen's patience, kindness, encouragement and jovial personality helped make those tasks less daunting, and I must say that my girls thoroughly enjoyed the session. My girls even had the privilege to bring back samples of their jellywork to savour at home. Appreciate Doreen for going the extra mile beyond crafting the cake, but allowing my girls to have a part in it. Thank you so much Doreen! The cake turned out gorgeous with the skilful addition of intricate flowers. It was delectable and its sweetness level was just right for both the young and old to enjoy.",
    url: "https://share.google/HkzMbfrtmbWQYtTQ5",
    images: ["/reviews/rennieunice-1.jpg", "/reviews/rennieunice-2.jpg", "/reviews/rennieunice-3.jpg"],
  },
  {
    author: "Amanda",
    rating: 5,
    date: "3 months ago",
    text: "Ordered a goldfish jellycake to celebrate my dad's 60th birthday! Look how beautiful it is!\n\nWhen we discussed the design ,doreen was very patient with me and transaction was very smooth!\n\nLychee flavour is delicious, not overly sweet.\nMy parents and old folks loved it!\n\nThank you❤️",
    url: "https://share.google/G83GXnFIEnJZjDjTG",
    images: ["/reviews/amanda-1.jpg", "/reviews/amanda-2.jpg"],
  },
  {
    author: "Evan Loke",
    rating: 5,
    date: "3 months ago",
    text: "Thank you so much for taking my last minute order! The jelly cake was absolutely stunning, delicious and received compliments from my family! Sweetness just right. Osmanthus bloom & lychee was a perfect combination. Such beautiful artwork, you're incredibly talented!\nThank you and will order again!",
    url: "https://share.google/vLDo8FaxjNZB1EkKd",
    images: ["/reviews/evan-1.jpg"],
  },
  {
    author: "phyllis tan",
    rating: 5,
    date: "5 months ago",
    text: "Super talented artwork! 💯 It's not just visually stunning, it tastes so refreshing and yummy too. The coconut flavour is light and not overpowering, and the jellies were perfectly firm and beautifully presented. I love that customised picture designs are available too! My friends were impressed! will definitely be ordering again! 💪",
    url: "https://share.google/B4y9M2X2RRtadigl6",
    images: ["/reviews/phyllis-1.jpg", "/reviews/phyllis-2.jpg", "/reviews/phyllis-3.jpg"],
  },
];

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

      {/* Reviews */}
      <section className="pb-20 md:pb-28">
        <div className="container">
          <h2 className="font-display text-3xl md:text-4xl text-center mb-10 md:mb-14">
            What our customers say
          </h2>
          <Carousel opts={{ align: "start", loop: true }} className="w-full max-w-5xl mx-auto">
            <CarouselContent>
              {reviews.map((review, i) => (
                <CarouselItem key={i} className="md:basis-1/2 lg:basis-1/3">
                  <a
                    href={review.url}
                    target="_blank"
                    rel="noreferrer"
                    className="h-full bg-[#faf7f3] rounded-[16px] md:rounded-[24px] flex flex-col gap-4 p-6 md:p-8 hover:opacity-90 transition-opacity"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex gap-0.5">
                        {Array.from({ length: 5 }).map((_, starIndex) => (
                          <Star
                            key={starIndex}
                            className={`h-4 w-4 ${starIndex < review.rating ? "fill-primary text-primary" : "fill-none text-muted-foreground"}`}
                          />
                        ))}
                      </div>
                      <span className="text-sm text-muted-foreground shrink-0">{review.date}</span>
                    </div>
                    <p className="text-base leading-relaxed flex-1 line-clamp-6">{review.text}</p>
                    {review.images && review.images.length > 0 && (
                      <div className="flex gap-2">
                        {review.images.map((src, imgIndex) => (
                          <img
                            key={imgIndex}
                            src={src}
                            alt={`Photo from ${review.author}'s review`}
                            className="size-16 rounded-lg object-cover"
                          />
                        ))}
                      </div>
                    )}
                    <p className="font-display text-lg font-medium">{review.author}</p>
                  </a>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="hidden md:flex" />
            <CarouselNext className="hidden md:flex" />
          </Carousel>
        </div>
      </section>
    </div>
  );
}
