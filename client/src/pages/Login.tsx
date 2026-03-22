import { useState, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, UtensilsCrossed } from "lucide-react";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();

  const loginMutation = trpc.auth.login.useMutation({
    onSuccess: async (data) => {
      await utils.auth.me.invalidate();
      // Redirect based on role
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

        {/* Card */}
        <div className="bg-card border border-border rounded-2xl p-8 shadow-2xl">
          <h2 className="text-xl font-semibold text-foreground mb-6">Acceso</h2>

          {/*
            Técnicas anti-autofill iOS Safari:
            1. autoComplete="off" en el form
            2. Campo honeypot oculto antes del primer input real (confunde al gestor de contraseñas)
            3. id/name con valores aleatorios que iOS no reconoce como usuario/contraseña
            4. data-form-type="other" para evitar la detección de tipo formulario
            5. Placeholder sin palabras clave como "usuario", "contraseña", "password"
          */}
          <form
            onSubmit={handleSubmit}
            autoComplete="off"
            data-form-type="other"
            className="space-y-5"
          >
            {/* Honeypot fields — hidden from users but confuse iOS autofill detection */}
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
