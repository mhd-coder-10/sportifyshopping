import { ShoppingCart, Search, Menu, X, User, LogOut, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import CurrencySelector from "./CurrencySelector";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Category {
  name: string;
  slug: string;
}

interface HeaderProps {
  cartCount: number;
  onCartClick: () => void;
  categories?: Category[];
  selectedCategory?: string;
  onCategoryClick?: (slug: string | undefined) => void;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
}

const Header = ({ cartCount, onCartClick, categories, selectedCategory, onCategoryClick, searchQuery, onSearchChange }: HeaderProps) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const navigate = useNavigate();
  const { user, signOut, profile } = useAuth();

  // Filter out cricket-field category from display
  const displayCategories = categories?.filter(cat => cat.slug !== 'cricket-field');

  const handleCategoryClick = (slug: string | undefined) => {
    // Always navigate to home page first, then apply category filter
    navigate('/');
    onCategoryClick?.(slug);
    setIsMenuOpen(false);
  };

  const handleSearchToggle = () => {
    if (isSearchOpen) {
      onSearchChange?.('');
    }
    setIsSearchOpen(!isSearchOpen);
  };

  const handleLogoClick = () => {
    handleCategoryClick(undefined);
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-md border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <button 
              onClick={handleLogoClick}
              className="flex items-center gap-2"
            >
              <div className="w-10 h-10 bg-gradient-accent rounded-lg flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-xl" style={{ fontFamily: 'var(--font-display)' }}>S</span>
              </div>
              <span className="text-2xl md:text-3xl tracking-wider" style={{ fontFamily: 'var(--font-display)' }}>
                SPORTIFY
              </span>
            </button>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            {displayCategories?.map((category) => (
              <button
                key={category.slug}
                onClick={() => handleCategoryClick(category.slug)}
                className={`text-sm font-medium transition-colors ${
                  selectedCategory === category.slug 
                    ? 'text-primary' 
                    : 'text-foreground hover:text-primary'
                }`}
              >
                {category.name.toUpperCase()}
              </button>
            ))}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-2 md:gap-3">
            {/* Currency Selector - Desktop */}
            <div className="hidden md:block">
              <CurrencySelector />
            </div>

            {isSearchOpen && (
              <div className="hidden md:flex items-center gap-2 relative">
                <Search className="absolute left-3 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery || ''}
                  onChange={(e) => onSearchChange?.(e.target.value)}
                  className="w-64 pl-9"
                  autoFocus
                />
              </div>
            )}
            <Button variant="ghost" size="icon" className="hidden md:flex" onClick={handleSearchToggle}>
              {isSearchOpen ? <X className="h-5 w-5" /> : <Search className="h-5 w-5" />}
            </Button>

            {/* User Menu */}
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative">
                    <User className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="px-2 py-1.5">
                    <p className="text-sm font-medium">{profile?.full_name || 'User'}</p>
                    <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate('/orders')}>
                    <Package className="h-4 w-4 mr-2" />
                    My Orders
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={signOut} className="text-destructive">
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button variant="ghost" size="sm" onClick={() => navigate('/auth')} className="hidden md:flex">
                Sign In
              </Button>
            )}

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
              <div className="flex items-center gap-2">
                <CurrencySelector />
                {!user && (
                  <Button variant="outline" size="sm" onClick={() => navigate('/auth')} className="flex-1">
                    Sign In
                  </Button>
                )}
                {user && (
                  <Button variant="outline" size="sm" onClick={() => navigate('/orders')} className="flex-1">
                    <Package className="h-4 w-4 mr-2" />
                    My Orders
                  </Button>
                )}
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery || ''}
                  onChange={(e) => onSearchChange?.(e.target.value)}
                  className="w-full pl-9"
                />
              </div>
              {displayCategories?.map((category) => (
                <button
                  key={category.slug}
                  onClick={() => handleCategoryClick(category.slug)}
                  className={`text-sm font-medium text-left transition-colors ${
                    selectedCategory === category.slug 
                      ? 'text-primary' 
                      : 'text-foreground hover:text-primary'
                  }`}
                >
                  {category.name.toUpperCase()}
                </button>
              ))}
              {user && (
                <Button variant="ghost" onClick={signOut} className="justify-start text-destructive">
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </Button>
              )}
            </div>
          </nav>
        )}
      </div>
    </header>
  );
};

export default Header;