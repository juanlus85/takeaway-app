import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, UtensilsCrossed, Download, Share, X } from "lucide-react";

// Detectar si ya está instalada como PWA
function isRunningAsPWA() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as any).standalone === true
  );
}

// Detectar iOS
function isIOS() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

// Detectar Android / Chrome con soporte de instalación
function isAndroidChrome() {
  return /android/i.test(navigator.userAgent) && /chrome/i.test(navigator.userAgent);
}

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();

  // Estado del banner de instalación
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    // No mostrar si ya es PWA instalada
    if (isRunningAsPWA()) return;

    // No mostrar si el usuario ya lo descartó
    const dismissed = localStorage.getItem("pwa-install-dismissed");
    if (dismissed) return;

    if (isIOS()) {
      // En iOS mostramos instrucciones manuales
      setShowInstallBanner(true);
    } else {
      // En Android/Chrome capturamos el evento beforeinstallprompt
      const handler = (e: Event) => {
        e.preventDefault();
        setDeferredPrompt(e);
        setShowInstallBanner(true);
      };
      window.addEventListener("beforeinstallprompt", handler);
      return () => window.removeEventListener("beforeinstallprompt", handler);
    }
  }, []);

  const handleInstallAndroid = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setShowInstallBanner(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismissBanner = () => {
    setShowInstallBanner(false);
    setShowIOSInstructions(false);
    localStorage.setItem("pwa-install-dismissed", "1");
  };

  const loginMutation = trpc.auth.login.useMutation({
    onSuccess: async (data) => {
      await utils.auth.me.invalidate();
      const role = data.user.role;
      if (role === "kitchen") {
        setLocation("/cocina");
      } else if (role === "admin") {
        setLocation("/admin");
      } else {
        setLocation("/vendedor");
      }
    },
    onError: (err) => {
      toast.error(err.message || "Error al iniciar sesión");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      toast.error("Introduce usuario y contraseña");
      return;
    }
    loginMutation.mutate({ username: username.trim(), password });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      {/* Background gradient */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-primary/5 blur-3xl" />
      </div>

      <div className="relative w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 mb-4">
            <UtensilsCrossed className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-foreground" style={{ fontFamily: 'Poppins, sans-serif' }}>
            TakeAway
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Sistema de Gestión de Pedidos</p>
        </div>

        {/* Banner de instalación PWA */}
        {showInstallBanner && !showIOSInstructions && (
          <div className="mb-4 bg-primary/10 border border-primary/30 rounded-2xl p-4">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                <Download className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground">Instalar como app</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Accede más rápido y sin barra del navegador
                </p>
                <div className="flex gap-2 mt-3">
                  {isIOS() ? (
                    <Button
                      size="sm"
                      variant="default"
                      className="h-8 text-xs px-3"
                      onClick={() => setShowIOSInstructions(true)}
                    >
                      <Share className="w-3 h-3 mr-1" />
                      Cómo instalar
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="default"
                      className="h-8 text-xs px-3"
                      onClick={handleInstallAndroid}
                    >
                      <Download className="w-3 h-3 mr-1" />
                      Instalar
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 text-xs px-2 text-muted-foreground"
                    onClick={handleDismissBanner}
                  >
                    Ahora no
                  </Button>
                </div>
              </div>
              <button
                onClick={handleDismissBanner}
                className="flex-shrink-0 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Instrucciones iOS */}
        {showIOSInstructions && (
          <div className="mb-4 bg-primary/10 border border-primary/30 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold text-foreground">Instalar en iPhone / iPad</p>
              <button onClick={handleDismissBanner} className="text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>
            <ol className="space-y-2">
              <li className="flex items-start gap-2 text-xs text-muted-foreground">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/20 text-primary text-[10px] font-bold flex items-center justify-center">1</span>
                <span>Pulsa el botón <strong className="text-foreground">Compartir</strong> <Share className="inline w-3 h-3 text-primary" /> en la barra inferior de Safari</span>
              </li>
              <li className="flex items-start gap-2 text-xs text-muted-foreground">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/20 text-primary text-[10px] font-bold flex items-center justify-center">2</span>
                <span>Desplázate y pulsa <strong className="text-foreground">"Añadir a pantalla de inicio"</strong></span>
              </li>
              <li className="flex items-start gap-2 text-xs text-muted-foreground">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/20 text-primary text-[10px] font-bold flex items-center justify-center">3</span>
                <span>Pulsa <strong className="text-foreground">"Añadir"</strong> en la esquina superior derecha</span>
              </li>
            </ol>
            <p className="text-xs text-primary mt-3 font-medium">
              La app aparecerá en tu pantalla de inicio como una app nativa
            </p>
          </div>
        )}

        {/* Card de login */}
        <div className="bg-card border border-border rounded-2xl p-8 shadow-2xl">
          <h2 className="text-xl font-semibold text-foreground mb-6">Acceso</h2>

          <form
            onSubmit={handleSubmit}
            autoComplete="off"
            data-form-type="other"
            className="space-y-5"
          >
            {/* Honeypot fields — ocultos, confunden al gestor de contraseñas de iOS */}
            <div style={{ display: 'none' }} aria-hidden="true">
              <input type="text" name="username_fake" tabIndex={-1} />
              <input type="password" name="password_fake" tabIndex={-1} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ta-user" className="text-sm font-medium text-foreground">
                Identificación
              </Label>
              <Input
                id="ta-user"
                name="ta-user-field"
                type="text"
                placeholder="Introduce tu código de acceso"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck={false}
                data-form-type="other"
                autoFocus
                className="h-12 text-base bg-input border-border focus:border-primary"
                disabled={loginMutation.isPending}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ta-pin" className="text-sm font-medium text-foreground">
                Clave de acceso
              </Label>
              <Input
                id="ta-pin"
                name="ta-pin-field"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                data-form-type="other"
                className="h-12 text-base bg-input border-border focus:border-primary"
                disabled={loginMutation.isPending}
              />
            </div>

            <Button
              type="submit"
              className="w-full h-12 text-base font-semibold"
              disabled={loginMutation.isPending}
            >
              {loginMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Entrando...
                </>
              ) : (
                "Entrar"
              )}
            </Button>
          </form>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6">
          v1.0 · {new Date().getFullYear()} TakeAway Manager
        </p>
      </div>
    </div>
  );
}
