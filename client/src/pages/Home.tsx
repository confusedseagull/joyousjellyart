import { useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ExternalLink, Star } from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from "@/components/ui/carousel";

// Full-width, auto-rotating photo display for a review's attached customer
// photos — one visible at a time instead of a grid, cycling automatically.
function ReviewPhotoCarousel({ images, author }: { images: string[]; author: string }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (images.length <= 1) return;
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % images.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [images.length]);

  return (
    <div className="w-full aspect-square rounded-lg overflow-hidden">
      <img
        src={images[index]}
        alt={`Photo from ${author}'s review`}
        className="w-full h-full object-cover"
      />
    </div>
  );
}

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
  {
    author: "Amy Yong",
    rating: 5,
    date: "4 months ago",
    text: "The most creative cheesecake I've seen! The jelly art layer is breathtaking and the taste is incredibly yummy. It feels like a total luxury to eat. Highly recommend Joyous Jelly Art for anyone wanting a unique, high-quality dessert.",
    url: "https://share.google/TMlzGiuBlv4qoDUnb",
    images: ["/reviews/amy-1.jpg"],
  },
  {
    author: "Pearly Woo",
    rating: 5,
    date: "2 months ago",
    text: "Great customer service and attention to detail. The cake was a hit at our celebration! Beautifully designed! Thanks for taking special attention to the delivery instructions. Highly recommended",
    url: "https://share.google/uP0lBMzp7lqRFVXhV",
    images: ["/reviews/pearly-1.jpg"],
  },
  {
    author: "Joce Huang",
    rating: 5,
    date: "2 months ago",
    text: "I sent in my order last minute and so glad Joyousjellyart picked up my last minute request! Truly joyous and my mother in law loved the jelly cake and such intricate design. In celebration of Duanwu festival, we even got some mini jelly in bazhang shape. You can truly tell the love and passion from a local bakery! I'd highly recommend! It was such a great experience and the packaging was great too!",
    url: "https://share.google/YxRlQuVAjQHayH3z3",
    images: ["/reviews/joce-1.jpg"],
  },
  {
    author: "C.N L",
    rating: 5,
    date: "4 months ago",
    text: "We couldn't bear to eat the beautiful cake, especially the crane. The birthday guy was happy and impressed with the taste, which was not to sweet and it gave a refreshing afertaste. 'Thank you' to the beautiful artist (Doreen) who created this beautiful cake that melts the heart of many ❤️",
    url: "https://share.google/7yLqSTJfDagBjxd72",
    images: ["/reviews/cnl-1.jpg", "/reviews/cnl-2.jpg", "/reviews/cnl-3.jpg"],
  },
  {
    author: "Nancy Koh",
    rating: 5,
    date: "7 months ago",
    text: "Beautiful jelly cake and my kids had so much fun admiring at the design! And birthday girl likes the lychee flavor too. Communication for the order is very pleasant , prompt and smooth. Thanks for able to fulfil our order for dairy allergy ! 🙏🙏🙏😊",
    url: "https://share.google/4AT8xKQNDiUhe37Wy",
    images: ["/reviews/nancy-1.jpg", "/reviews/nancy-2.jpg"],
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
  // Tracks which review cards actually overflow the 8-line clamp, so "See
  // more" only shows up where there's really more text to reveal, plus
  // which ones the visitor has expanded.
  const [clampedReviews, setClampedReviews] = useState<Set<number>>(new Set());
  const [expandedReviews, setExpandedReviews] = useState<Set<number>>(new Set());
  const reviewTextRefs = useRef<(HTMLParagraphElement | null)[]>([]);

  useEffect(() => {
    const next = new Set<number>();
    reviewTextRefs.current.forEach((el, i) => {
      if (el && el.scrollHeight > el.clientHeight + 1) next.add(i);
    });
    setClampedReviews(next);
  }, []);

  const toggleReviewExpanded = (i: number) => {
    setExpandedReviews((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  };

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
        <div className="flex flex-col items-center gap-4 max-w-3xl lg:max-w-none">
          <p className="font-display text-2xl md:text-4xl text-muted-foreground">
            Making memories, creating magical moments
          </p>
          <h1 className="font-normal text-4xl md:text-5xl lg:text-[52px] lg:whitespace-nowrap">
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
                  <div className="h-full bg-[#faf7f3] rounded-[16px] md:rounded-[24px] flex flex-col gap-4 px-5 py-4 md:px-7 md:py-6">
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
                    <div className="flex-1 flex flex-col gap-1">
                      <p
                        ref={(el) => { reviewTextRefs.current[i] = el; }}
                        className={`text-base leading-relaxed ${expandedReviews.has(i) ? "" : "line-clamp-8"}`}
                      >
                        {review.text}
                      </p>
                      {clampedReviews.has(i) && (
                        <button
                          type="button"
                          onClick={() => toggleReviewExpanded(i)}
                          className="text-sm text-primary font-medium text-left hover:underline w-fit"
                        >
                          {expandedReviews.has(i) ? "See less" : "See more"}
                        </button>
                      )}
                    </div>
                    {review.images && review.images.length > 0 && (
                      <ReviewPhotoCarousel images={review.images} author={review.author} />
                    )}
                    <div className="flex items-center justify-between gap-2 mt-2">
                      <p className="font-display text-lg font-normal">{review.author}</p>
                      <a
                        href={review.url}
                        target="_blank"
                        rel="noreferrer"
                        aria-label="View on Google"
                        title="View on Google"
                        className="inline-flex items-center justify-center text-primary border border-primary/40 rounded-full size-8 hover:bg-primary hover:text-primary-foreground transition-colors shrink-0"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    </div>
                  </div>
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
