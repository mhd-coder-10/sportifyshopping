import { useEffect, useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  FolderOpen, 
  LogOut, 
  Loader2,
  Store,
  Shield,
  MessageSquare,
  Users,
  Menu,
  X
} from 'lucide-react';

interface AdminLayoutProps {
  children: React.ReactNode;
}

const AdminLayout = ({ children }: AdminLayoutProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAdmin, loading } = useAdminAuth();
  const { signOut, profile } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!loading && !isAdmin) {
      navigate('/admin/login');
    }
  }, [isAdmin, loading, navigate]);

  const handleLogout = async () => {
    await signOut();
    navigate('/admin/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  const navItems = [
    { path: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/admin/products', icon: Package, label: 'Products' },
    { path: '/admin/orders', icon: ShoppingCart, label: 'Orders' },
    { path: '/admin/categories', icon: FolderOpen, label: 'Categories' },
    { path: '/admin/messages', icon: MessageSquare, label: 'Messages' },
    { path: '/admin/users', icon: Users, label: 'Users' },
  ];

  const NavContent = ({ onNavigate }: { onNavigate?: () => void }) => (
    <>
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={onNavigate}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                isActive 
                  ? 'bg-primary text-primary-foreground' 
                  : 'text-slate-300 hover:bg-slate-700 hover:text-white'
              }`}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-700 space-y-2">
        <Link
          to="/"
          onClick={onNavigate}
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
        >
          <Store className="h-5 w-5" />
          View Store
        </Link>
        <Button
          variant="ghost"
          className="w-full justify-start text-slate-300 hover:bg-slate-700 hover:text-white"
          onClick={handleLogout}
        >
          <LogOut className="h-5 w-5 mr-3" />
          Logout
        </Button>
      </div>

      {profile && (
        <div className="p-4 border-t border-slate-700">
          <p className="text-sm text-slate-400">Logged in as</p>
          <p className="text-sm font-medium text-white truncate">{profile.full_name || 'Admin'}</p>
        </div>
      )}
    </>
  );

  const SidebarHeader = () => (
    <div className="p-4 border-b border-slate-700">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
          <Shield className="h-5 w-5 text-primary-foreground" />
        </div>
        <div>
          <h1 className="font-bold text-white">Sportify</h1>
          <p className="text-xs text-slate-400">Admin Panel</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col lg:flex-row">
      {/* Mobile Header */}
      <header className="lg:hidden bg-slate-800 border-b border-slate-700 p-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <Shield className="h-4 w-4 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-bold text-white text-sm">Sportify</h1>
            <p className="text-xs text-slate-400">Admin</p>
          </div>
        </div>
        
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="text-white hover:bg-slate-700">
              <Menu className="h-6 w-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0 bg-slate-800 border-slate-700">
            <SidebarHeader />
            <div className="flex flex-col h-[calc(100%-73px)]">
              <NavContent onNavigate={() => setMobileOpen(false)} />
            </div>
          </SheetContent>
        </Sheet>
      </header>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 bg-slate-800 border-r border-slate-700 flex-col fixed h-screen">
        <SidebarHeader />
        <div className="flex flex-col flex-1 overflow-y-auto">
          <NavContent />
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto lg:ml-64">
        {children}
      </main>
    </div>
  );
};

export default AdminLayout;
