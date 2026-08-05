import { Instagram, MapPin, MessageCircle } from "lucide-react";

export default function Footer() {
  const instagramUrl = "https://www.instagram.com/joyousjellyart";
  const whatsappNumber = "6582999559";
  const whatsappMessage = encodeURIComponent("Hi! I'm interested in ordering from Joyous Jelly Art.");
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${whatsappMessage}`;
  const googleMapsUrl = "https://maps.app.goo.gl/TvuRcXYAm97F7q6c9";

  return (
    <footer id="footer" className="bg-[#faf8f5] mt-16">
      <div className="container flex flex-col gap-10 pt-16 pb-12">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <img src="/logo.png" alt="Joyous JellyArt" className="h-8 w-auto" />
          <p className="text-sm text-muted-foreground">
            Handcrafted Jellies • Crafted Memories • Joyous Moments
          </p>
        </div>

        <div className="h-px w-full bg-[#eae6e1]" />

        <div className="flex items-center justify-between gap-4 flex-wrap text-[13px] text-muted-foreground">
          <p>© {new Date().getFullYear()} Joyous JellyArt. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <a
              href={instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 hover:text-primary transition-colors"
            >
              <Instagram className="h-4 w-4" />
              Instagram
            </a>
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 hover:text-primary transition-colors"
            >
              <MessageCircle className="h-4 w-4" />
              WhatsApp
            </a>
            <a
              href={googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 hover:text-primary transition-colors"
            >
              <MapPin className="h-4 w-4" />
              Location
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
