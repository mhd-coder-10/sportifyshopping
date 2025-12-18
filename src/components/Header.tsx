import { ShoppingCart, Search, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface HeaderProps {
  cartCount: number;
  onCartClick: () => void;
}

const Header = ({ cartCount, onCartClick }: HeaderProps) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-md border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-accent rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-xl" style={{ fontFamily: 'var(--font-display)' }}>S</span>
            </div>
            <span className="text-2xl md:text-3xl tracking-wider" style={{ fontFamily: 'var(--font-display)' }}>
              SPORTIFY
            </span>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <a href="#" className="text-sm font-medium hover:text-primary transition-colors">NEW ARRIVALS</a>
            <a href="#" className="text-sm font-medium hover:text-primary transition-colors">MEN</a>
            <a href="#" className="text-sm font-medium hover:text-primary transition-colors">WOMEN</a>
            <a href="#" className="text-sm font-medium hover:text-primary transition-colors">SALE</a>
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-2 md:gap-4">
            <Button variant="ghost" size="icon" className="hidden md:flex">
              <Search className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" className="relative" onClick={onCartClick}>
              <ShoppingCart className="h-5 w-5" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-primary-foreground text-xs rounded-full flex items-center justify-center font-semibold">
                  {cartCount}
                </span>
              )}
            </Button>
            <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setIsMenuOpen(!isMenuOpen)}>
              <Menu className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <nav className="md:hidden py-4 border-t border-border">
            <div className="flex flex-col gap-4">
              <a href="#" className="text-sm font-medium hover:text-primary transition-colors">NEW ARRIVALS</a>
              <a href="#" className="text-sm font-medium hover:text-primary transition-colors">MEN</a>
              <a href="#" className="text-sm font-medium hover:text-primary transition-colors">WOMEN</a>
              <a href="#" className="text-sm font-medium hover:text-primary transition-colors">SALE</a>
            </div>
          </nav>
        )}
      </div>
    </header>
  );
};

export default Header;
