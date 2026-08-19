import { useState } from "react";
import { Link } from "wouter";
import { Menu, ShoppingCart } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

const NAV_LINKS = [
  { href: "/customize", label: "Customize" },
  { href: "/#gallery", label: "Discover" },
  { href: "/#footer", label: "About" },
];

function CartLink({ totalItems }: { totalItems: number }) {
  return (
    <Link href="/cart">
      <span className="relative flex items-center cursor-pointer text-foreground hover:text-primary transition-colors">
        <ShoppingCart className="h-5 w-5" />
        {totalItems > 0 && (
          <span className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-[10px] font-semibold rounded-full h-4 w-4 flex items-center justify-center">
            {totalItems}
          </span>
        )}
      </span>
    </Link>
  );
}

export default function Header() {
  const { totalItems } = useCart();
  const [menuOpen, setMenuOpen] = useState(false);

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

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-10">
          {NAV_LINKS.map((link) => (
            <Link key={link.href} href={link.href}>
              <span className="text-[15px] font-medium text-foreground hover:text-primary transition-colors cursor-pointer">
                {link.label}
              </span>
            </Link>
          ))}
          <CartLink totalItems={totalItems} />
        </nav>

        {/* Mobile: cart + hamburger */}
        <div className="flex md:hidden items-center gap-6">
          <CartLink totalItems={totalItems} />
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            aria-label="Open menu"
            className="text-foreground"
          >
            <Menu className="h-6 w-6" />
          </button>
        </div>
      </div>

      <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
        <SheetContent side="right" className="w-full sm:max-w-xs">
          <SheetHeader className="border-b">
            <SheetTitle className="font-display text-xl">Menu</SheetTitle>
          </SheetHeader>
          <nav className="flex flex-col gap-1 px-6 py-4">
            {NAV_LINKS.map((link) => (
              <Link key={link.href} href={link.href}>
                <span
                  onClick={() => setMenuOpen(false)}
                  className="block py-3 text-lg font-medium text-foreground hover:text-primary transition-colors cursor-pointer"
                >
                  {link.label}
                </span>
              </Link>
            ))}
          </nav>
        </SheetContent>
      </Sheet>
    </header>
  );
}
