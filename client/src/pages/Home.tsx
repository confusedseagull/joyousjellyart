import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Palette, Cake, Sparkles } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function Home() {



  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative bg-background overflow-hidden">
        <div className="relative h-[450px] md:h-[550px] lg:h-[600px]">
          <img
            src="/hero-cny-2026.jpg"
            alt="CNY 2026 Jelly Art Collection"
            className="w-full h-full object-cover"
          />

          {/* Gradient Overlay for Text Readability */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/20 to-black/40 flex items-center justify-center">
            <div className="container text-center text-white">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 drop-shadow-lg">
                Gallop into the Year of the Horse
              </h2>
              <p className="text-base md:text-lg max-w-2xl mx-auto mb-6 drop-shadow-lg">
                Stunning, customizable artisan jelly cakes that are as beautiful as they are delicious.
              </p>
              <Link href="/cny-2026">
                <Button
                  size="lg"
                  className="bg-primary hover:opacity-90 text-primary-foreground font-semibold"
                >
                  Order Now
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Craft Section */}
      <section className="py-20 md:py-28 bg-background">
        <div className="container">
          <div className="max-w-2xl mb-16 md:mb-20">
            <span className="text-sm font-semibold uppercase tracking-widest text-primary">Our Craft</span>
            <h2 className="mt-3 mb-4">The Art of Jelly Sculpture</h2>
            <p className="font-display italic text-xl md:text-2xl text-muted-foreground">
              Four techniques, one obsession: cakes that look like they shouldn't be edible, and taste like they should.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-10 md:gap-16 items-center border-t border-brown/15 pt-12 md:pt-16 mb-12 md:mb-16">
            <div className="md:col-span-2 order-2 md:order-1">
              <h3 className="mb-3">Handcrafted Symbolism</h3>
              <p className="text-base text-muted-foreground">
                Every element is meticulously sculpted by hand, from intricate auspicious symbols to delicate decorative accents.
                Each piece tells a story of tradition and artistry, suspended perfectly within crystal-clear layers.
              </p>
            </div>
            <div className="md:col-span-3 order-1 md:order-2">
              <img
                src="/fortune_3.jpg"
                alt="Prosperity Edition Jelly Art"
                className="w-full aspect-[4/5] object-cover"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-10 md:gap-16 items-center border-t border-brown/15 pt-12 md:pt-16 mb-12 md:mb-16">
            <div className="md:col-span-3">
              <img
                src="/huatNow2.jpg"
                alt="Golden Gallop Collection"
                className="w-full aspect-[4/5] object-cover"
              />
            </div>
            <div className="md:col-span-2">
              <h3 className="mb-3">Three-Dimensional Artistry</h3>
              <p className="text-base text-muted-foreground">
                Our jelly sculptures achieve remarkable depth and dimension through layered construction techniques.
                Edible gold leaf and hand-painted details create stunning visual effects that shimmer from every angle.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-10 md:gap-16 items-center border-t border-brown/15 pt-12 md:pt-16 mb-12 md:mb-16">
            <div className="md:col-span-2 order-2 md:order-1">
              <h3 className="mb-3">Playful Character Design</h3>
              <p className="text-base text-muted-foreground">
                Whimsical expressions and personality shine through each character sculpture.
                Careful attention to proportion and detail brings these edible artworks to life with charm and authenticity.
              </p>
            </div>
            <div className="md:col-span-3 order-1 md:order-2">
              <img
                src="/Image-(48).jpg"
                alt="Fortune Lion Jelly Art"
                className="w-full aspect-[4/5] object-cover"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-10 md:gap-16 items-center border-t border-brown/15 pt-12 md:pt-16">
            <div className="md:col-span-3">
              <img
                src="/IMG_20260115_134503.JPEG"
                alt="Blooms Edition"
                className="w-full aspect-[4/5] object-cover"
              />
            </div>
            <div className="md:col-span-2">
              <h3 className="mb-3">Botanical Precision</h3>
              <p className="text-base text-muted-foreground">
                Delicate petals are shaped one by one, capturing the organic beauty of nature in edible form.
                Translucent layers showcase the intricate floral arrangements from every perspective, creating living art you can taste.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-background">
        <div className="container">
          <h2 className="text-3xl font-bold text-center mb-12">Why Choose Joyous Jelly Art?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card>
              <CardHeader>
                <div className="flex justify-center mb-4">
                  <Palette className="h-12 w-12 text-primary" />
                </div>
                <CardTitle className="text-center">Fully Customizable</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-center">
                  Choose from multiple shapes, themes, colors, and flavours. 
                  Every detail is tailored to your vision.
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex justify-center mb-4">
                  <Cake className="h-12 w-12 text-primary" />
                </div>
                <CardTitle className="text-center">Artisan Quality</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-center">
                  Each jelly cake is handcrafted with premium ingredients and 
                  meticulous attention to artistic detail.
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex justify-center mb-4">
                  <Sparkles className="h-12 w-12 text-primary" />
                </div>
                <CardTitle className="text-center">Perfect for Any Occasion</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-center">
                  From birthdays to celebrations, our jelly art cakes make 
                  every moment memorable and Instagram-worthy.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 bg-background">
        <div className="container max-w-4xl">
          <h2 className="text-3xl font-bold text-center mb-12">How Custom Orders Work (Coming Soon)</h2>
          <div className="space-y-8">
            <div className="flex gap-6 items-start">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-xl">
                1
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Customize Your Cake</h3>
                <p className="text-muted-foreground">
                  Use our intuitive customization tool to select your preferred shape, theme, 
                  colors, flavours, and personalized text.
                </p>
              </div>
            </div>

            <div className="flex gap-6 items-start">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-xl">
                2
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Submit Your Order</h3>
                <p className="text-muted-foreground">
                  Provide your contact details and choose between delivery or pick-up at our location.
                </p>
              </div>
            </div>

            <div className="flex gap-6 items-start">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-xl">
                3
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">We'll Contact You</h3>
                <p className="text-muted-foreground">
                  Our team will reach out within 24 hours to confirm your order and discuss any final details.
                </p>
              </div>
            </div>

            <div className="flex gap-6 items-start">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-xl">
                4
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Enjoy Your Masterpiece</h3>
                <p className="text-muted-foreground">
                  Receive your beautifully crafted jelly art cake and celebrate your special moment!
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-background">
        <div className="container text-center">
          <h2 className="text-4xl font-bold mb-6">Ready to Create Your Jelly Art?</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Start designing your perfect cake today using our Customised Order page, 
            or explore our special 2026 CNY Collection.
          </p>
        </div>
      </section>
    </div>
  );
}
