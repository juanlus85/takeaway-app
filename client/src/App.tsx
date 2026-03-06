import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Login from "./pages/Login";
import Vendedor from "./pages/Vendedor";
import Cocina from "./pages/Cocina";
import Pendientes from "./pages/Pendientes";
import Historial from "./pages/Historial";
import Admin from "./pages/Admin";
import { useAuth } from "./_core/hooks/useAuth";
import { useLocation } from "wouter";
import { useEffect } from "react";

function RootRedirect() {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      setLocation("/login");
      return;
    }
    const role = (user as any).role;
    if (role === "kitchen") setLocation("/cocina");
    else if (role === "admin") setLocation("/admin");
    else setLocation("/vendedor");
  }, [user, loading, setLocation]);

  return null;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={RootRedirect} />
      <Route path="/login" component={Login} />
      <Route path="/vendedor" component={Vendedor} />
      <Route path="/cocina" component={Cocina} />
      <Route path="/pendientes" component={Pendientes} />
      <Route path="/historial" component={Historial} />
      <Route path="/admin" component={Admin} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster richColors position="top-right" />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
