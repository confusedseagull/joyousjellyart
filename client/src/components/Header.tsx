import { Link } from "wouter";
import { ShoppingCart } from "lucide-react";
import { useCustomCart } from "@/contexts/CustomCartContext";

export default function Header() {
  const { totalItems } = useCustomCart();

  return (
    <header className="sticky top-0 z-[100] bg-background">
      <div className="container flex items-center justify-between h-20">
        <Link href="/">
          <img
            src="/logo.png"
            alt="Joyous JellyArt"
            className="h-9 md:h-10 w-auto"
          />
        </Link>

        <nav className="flex items-center gap-10">
          <Link href="/customize">
            <span className="text-[15px] font-medium text-foreground hover:text-primary transition-colors cursor-pointer">
              Customize
            </span>
          </Link>
          <Link href="/#gallery">
            <span className="text-[15px] font-medium text-foreground hover:text-primary transition-colors cursor-pointer">
              Discover
            </span>
          </Link>
          <Link href="/#footer">
            <span className="text-[15px] font-medium text-foreground hover:text-primary transition-colors cursor-pointer">
              About
            </span>
          </Link>
          <Link href="/customize/cart">
            <span className="relative flex items-center cursor-pointer text-foreground hover:text-primary transition-colors">
              <ShoppingCart className="h-5 w-5" />
              {totalItems > 0 && (
                <span className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-[10px] font-semibold rounded-full h-4 w-4 flex items-center justify-center">
                  {totalItems}
                </span>
              )}
            </span>
          </Link>
        </nav>
      </div>
    </header>
  );
}
