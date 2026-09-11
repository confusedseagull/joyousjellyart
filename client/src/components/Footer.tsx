import { Instagram, MapPin } from "lucide-react";

// lucide-react has no WhatsApp brand mark, so the glyph is inlined here —
// this is the standard, publicly-published WhatsApp logo path (the same one
// shipped by icon packs like Simple Icons/Font Awesome), not a custom design.
function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884M20.52 3.449C18.24 1.245 15.24 0 12.045 0 5.463 0 .104 5.36.101 11.943c0 2.105.549 4.16 1.595 5.976L0 24l6.335-1.652a11.882 11.882 0 005.71 1.454h.005c6.582 0 11.94-5.36 11.943-11.943a11.87 11.87 0 00-3.473-8.41" />
    </svg>
  );
}

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
              className="flex items-center gap-1.5 text-[#25D366] hover:opacity-80 transition-opacity"
            >
              <WhatsAppIcon className="h-4 w-4" />
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
