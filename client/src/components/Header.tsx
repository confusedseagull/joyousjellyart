import { Link } from "wouter";
import { useState, useEffect } from "react";
import { useCart } from "@/contexts/CartContext";
import { CartDrawer } from "@/components/CartDrawer";
import { ShoppingCart } from "lucide-react";

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isCartDrawerOpen, setIsCartDrawerOpen] = useState(false);
  const { totalItems } = useCart();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header 
      className={`sticky top-0 z-[100] transition-colors duration-300 ${
        isScrolled ? 'bg-[#8CB9BC]' : 'bg-background'
      }`}
    >
      <div className="container">
        {/* Logo and Cart */}
        <div className="flex justify-between items-center py-4">
          <div className="flex-1" />
          <Link href="/">
            <img 
              src="/logo.png" 
              alt="Joyous JellyArt" 
              className="h-10 md:h-16 w-auto"
            />
          </Link>
          <div className="flex-1 flex justify-end">
            <button 
              onClick={() => setIsCartDrawerOpen(true)}
              className="relative p-2 hover:bg-primary/10 rounded-full transition-colors focus:outline-none focus-visible:ring-0"
            >
              <ShoppingCart className="h-6 w-6 text-brown" />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                  {totalItems}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Sub-header Navigation */}
        <nav className="flex justify-center gap-8 pb-3 pt-2">
          <Link href="/customize">
            <span className="text-sm md:text-base font-semibold text-foreground hover:text-primary transition-colors tracking-wide cursor-pointer">
              Custom Order
            </span>
          </Link>
          <Link href="/cny-2026">
            <span className="text-sm md:text-base font-semibold text-foreground hover:text-primary transition-colors tracking-wide cursor-pointer">
              2026 CNY Collection
            </span>
          </Link>
        </nav>
      </div>
      
      {/* Cart Drawer */}
      <CartDrawer open={isCartDrawerOpen} onOpenChange={setIsCartDrawerOpen} />
    </header>
  );
}
