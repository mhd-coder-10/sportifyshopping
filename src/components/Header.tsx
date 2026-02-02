import { ShoppingCart, Search, Menu, X, User, LogOut, Package, MessageSquare, ClipboardList, Shield, Home, Phone, Info, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface HeaderProps {
  cartCount: number;
  onCartClick: () => void;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  onSearchSubmit?: () => void;
}

const Header = ({ cartCount, onCartClick, searchQuery, onSearchChange, onSearchSubmit }: HeaderProps) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [localSearchQuery, setLocalSearchQuery] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut, profile } = useAuth();
  const { isAdmin } = useAdminAuth();

  const navLinks = [
    { name: "Home", path: "/", icon: Home },
    { name: "Contact Us", path: "/contact", icon: Phone },
    { name: "About Us", path: "/about-us", icon: Info },
    { name: "Support", path: "/support", icon: HelpCircle },
  ];

  const handleSearchToggle = () => {
    if (isSearchOpen) {
      setLocalSearchQuery('');
      onSearchChange?.('');
    }
    setIsSearchOpen(!isSearchOpen);
  };

  const handleSearchSubmit = () => {
    const queryToUse = onSearchChange ? searchQuery : localSearchQuery;
    if (queryToUse?.trim()) {
      if (onSearchSubmit) {
        onSearchSubmit();
      } else {
        navigate(`/search?q=${encodeURIComponent(queryToUse.trim())}`);
      }
      setIsSearchOpen(false);
      setIsMenuOpen(false);
    }
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearchSubmit();
    }
  };

  const handleLocalSearchChange = (value: string) => {
    if (onSearchChange) {
      onSearchChange(value);
    } else {
      setLocalSearchQuery(value);
    }
  };

  const handleLogoClick = () => {
    navigate('/');
    setIsMenuOpen(false);
  };

  const handleNavClick = (path: string) => {
    navigate(path);
    setIsMenuOpen(false);
  };

  const currentSearchQuery = onSearchChange ? searchQuery : localSearchQuery;

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
          <nav className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <button
                key={link.path}
                onClick={() => handleNavClick(link.path)}
                className={`text-sm font-medium transition-colors ${
                  location.pathname === link.path 
                    ? 'text-primary' 
                    : 'text-foreground hover:text-primary'
                }`}
              >
                {link.name}
              </button>
            ))}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-2 md:gap-3">

            {isSearchOpen && (
              <div className="hidden md:flex items-center gap-2 relative">
                <Search className="absolute left-3 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search products..."
                  value={currentSearchQuery || ''}
                  onChange={(e) => handleLocalSearchChange(e.target.value)}
                  onKeyDown={handleSearchKeyDown}
                  className="w-64 pl-9"
                  autoFocus
                />
                <Button size="sm" onClick={handleSearchSubmit} className="h-9">
                  Search
                </Button>
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
                  <DropdownMenuItem onClick={() => navigate('/account')}>
                    <User className="h-4 w-4 mr-2" />
                    My Account
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/account?tab=orders')}>
                    <Package className="h-4 w-4 mr-2" />
                    My Orders
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/account?tab=messages')}>
                    <MessageSquare className="h-4 w-4 mr-2" />
                    My Messages
                  </DropdownMenuItem>
                  {isAdmin && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => navigate('/admin')}>
                        <Shield className="h-4 w-4 mr-2" />
                        Admin Dashboard
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => navigate('/admin/orders')}>
                        <ClipboardList className="h-4 w-4 mr-2" />
                        Order Management
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => navigate('/admin/messages')}>
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Messages
                      </DropdownMenuItem>
                    </>
                  )}
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
                {!user && (
                  <Button variant="outline" size="sm" onClick={() => navigate('/auth')} className="flex-1">
                    Sign In
                  </Button>
                )}
                {user && (
                  <div className="flex gap-2 flex-1">
                    <Button variant="outline" size="sm" onClick={() => navigate('/account')} className="flex-1">
                      <User className="h-4 w-4 mr-2" />
                      Account
                    </Button>
                    {isAdmin && (
                      <Button variant="outline" size="sm" onClick={() => navigate('/admin')} className="flex-1">
                        <Shield className="h-4 w-4 mr-2" />
                        Admin
                      </Button>
                    )}
                  </div>
                )}
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search products..."
                  value={currentSearchQuery || ''}
                  onChange={(e) => handleLocalSearchChange(e.target.value)}
                  onKeyDown={handleSearchKeyDown}
                  className="w-full pl-9"
                />
              </div>
              <Button onClick={handleSearchSubmit} className="w-full">
                Search
              </Button>
              {navLinks.map((link) => (
                <button
                  key={link.path}
                  onClick={() => handleNavClick(link.path)}
                  className={`text-sm font-medium text-left transition-colors flex items-center gap-2 ${
                    location.pathname === link.path 
                      ? 'text-primary' 
                      : 'text-foreground hover:text-primary'
                  }`}
                >
                  <link.icon className="h-4 w-4" />
                  {link.name}
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