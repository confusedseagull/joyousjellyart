import { Instagram, MapPin, MessageCircle } from "lucide-react";

export default function Footer() {
  const instagramUrl = "https://www.instagram.com/joyousjellyart";
  const whatsappNumber = "6582999559";
  const whatsappMessage = encodeURIComponent("Hi! I'm interested in ordering from Joyous Jelly Art.");
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${whatsappMessage}`;
  const locationAddress = "2 Jln Lokam #01-27, Singapore 548182";
  const googleMapsUrl = "https://maps.app.goo.gl/TvuRcXYAm97F7q6c9";

  return (
    <footer className="bg-[#8CB9BC] text-white mt-16">
      <div className="container py-12">
        <div className="flex justify-between items-start gap-8">
          {/* About Section - Logo */}
          <div className="flex items-center">
            <img 
              src="/logo.png" 
              alt="Joyous Jelly Art Logo" 
              className="h-10 w-auto" 
            />
          </div>

          {/* Right Section - Contact and Location */}
          <div className="flex gap-8">
            {/* Contact Section */}
            <div className="w-fit">
              <h3 className="text-xl font-bold mb-4" style={{ fontFamily: '"Red Hat Display", system-ui, -apple-system, sans-serif' }}>
                Get in Touch
              </h3>
              <div className="space-y-3">
                <a
                  href={instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-white/90 hover:text-white transition-colors"
                >
                  <Instagram className="h-5 w-5" />
                  <span>@joyousjellyart</span>
                </a>
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-white/90 hover:text-white transition-colors"
                >
                  <MessageCircle className="h-5 w-5" />
                  <span>WhatsApp Us</span>
                </a>
              </div>
            </div>

            {/* Location Section */}
            <div className="w-fit">
              <h3 className="text-xl font-bold mb-4" style={{ fontFamily: '"Red Hat Display", system-ui, -apple-system, sans-serif' }}>
                Location
              </h3>
              <p className="text-sm text-white/90 mb-3">
                2 Jln Lokam #01-27,<br />
                Singapore 548182
              </p>
              <a
                href={googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-white text-[#8CB9BC] rounded-md font-medium text-sm hover:bg-white/90 transition-colors"
              >
                <MapPin className="h-4 w-4" />
                View on Google Maps
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-white/20 mt-8 pt-6 text-center">
          <p className="text-sm text-white/80">
            © {new Date().getFullYear()} Joyous Jelly Art. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
