import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { useEffect } from "react";
import {
  ChefHat,
  ClipboardList,
  History,
  LayoutDashboard,
  LogOut,
  Settings,
  ShoppingCart,
  UtensilsCrossed,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type NavItem = {
  icon: React.ElementType;
  label: string;
  path: string;
  roles: string[];
};

const navItems: NavItem[] = [
  { icon: ShoppingCart, label: "Vendedor", path: "/vendedor", roles: ["seller", "admin"] },
  { icon: ClipboardList, label: "Pendientes", path: "/pendientes", roles: ["seller", "admin"] },
  { icon: ChefHat, label: "Cocina", path: "/cocina", roles: ["kitchen", "admin"] },
  { icon: History, label: "Historial", path: "/historial", roles: ["seller", "kitchen", "admin"] },
  { icon: Settings, label: "Administración", path: "/admin", roles: ["admin"] },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const [location, setLocation] = useLocation();

  useEffect(() => {
    if (!loading && !user) {
      setLocation("/login");
    }
  }, [user, loading, setLocation]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <UtensilsCrossed className="w-10 h-10 text-primary animate-pulse" />
          <p className="text-muted-foreground text-sm">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const role = (user as any).role as string;
  const displayName = (user as any).displayName || (user as any).username || "Usuario";

  const visibleItems = navItems.filter((item) => item.roles.includes(role));

  return (
    <div className="min-h-screen flex bg-background">
      {/* Sidebar */}
      <aside className="w-16 md:w-56 flex flex-col bg-sidebar border-r border-sidebar-border shrink-0 fixed inset-y-0 left-0 z-40">
        {/* Logo */}
        <div className="h-16 flex items-center justify-center md:justify-start md:px-4 border-b border-sidebar-border">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <UtensilsCrossed className="w-4 h-4 text-primary" />
            </div>
            <span className="hidden md:block font-bold text-sidebar-foreground text-sm" style={{ fontFamily: 'Poppins, sans-serif' }}>
              TakeAway
            </span>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
          {visibleItems.map((item) => {
            const isActive = location === item.path || location.startsWith(item.path + "/");
            return (
              <button
                key={item.path}
                onClick={() => setLocation(item.path)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                )}
              >
                <item.icon className="w-5 h-5 shrink-0" />
                <span className="hidden md:block">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* User footer */}
        <div className="p-2 border-t border-sidebar-border">
          <div className="hidden md:flex items-center gap-2 px-2 py-2 mb-1">
            <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
              <span className="text-xs font-bold text-primary">
                {displayName.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-sidebar-foreground truncate">{displayName}</p>
              <p className="text-xs text-muted-foreground capitalize">{role}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center justify-center md:justify-start gap-2 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            <span className="hidden md:block">Salir</span>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 ml-16 md:ml-56 min-h-screen overflow-auto">
        {children}
      </main>
    </div>
  );
}
