import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import AppLayout from "@/components/AppLayout";
import NumericKeypad from "@/components/NumericKeypad";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ShoppingCart, Trash2, X, ChefHat, CreditCard, Minus, Plus, Ban } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { cn } from "@/lib/utils";

type CartItem = {
  id: string;
  productId: number | null;
  productName: string;
  categoryName: string;
  price: number;
  quantity: number;
  requiresKitchen: boolean;
  typeNote?: string;
};

type Category = {
  id: number;
  name: string;
  color: string;
  icon: string;
};

type Product = {
  id: number;
  categoryId: number;
  name: string;
  price: string;
  fixedPrice: boolean;
  requiresKitchen: boolean;
  requiresTypeInput: boolean;
};

// Virtual "free price" product for each category
type FreeItem = { type: "free"; categoryId: number; categoryName: string; requiresKitchen: boolean };

const ICON_MAP: Record<string, string> = {
  sandwich: "🥪",
  "cup-soda": "🥤",
  pizza: "🍕",
  flame: "🍟",
  "ice-cream-cone": "🍦",
  candy: "🍫",
  package: "📦",
  utensils: "🍽️",
};

export default function Vendedor() {
  const { user } = useAuth();
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);

  // Numpad for fixed products with free price
  const [showNumpad, setShowNumpad] = useState(false);
  const [numpadProduct, setNumpadProduct] = useState<Product | null>(null);

  // Numpad for "Otros" (free item per category)
  const [showFreeNumpad, setShowFreeNumpad] = useState(false);
  const [freeItem, setFreeItem] = useState<FreeItem | null>(null);

  const [showPizzaInput, setShowPizzaInput] = useState(false);
  const [pizzaProduct, setPizzaProduct] = useState<Product | null>(null);
  const [pizzaType, setPizzaType] = useState("");

  const [showPayModal, setShowPayModal] = useState(false);
  const [selectedCaller, setSelectedCaller] = useState<number | null>(null);
  // null = not chosen yet, -1 = explicitly "no caller"
  const [callerChoice, setCallerChoice] = useState<number | null>(null);

  const [showCartPanel, setShowCartPanel] = useState(false);

  const { data: categories = [] } = trpc.categories.list.useQuery();
  const { data: products = [] } = trpc.products.listAll.useQuery();
  const { data: callers = [] } = trpc.callers.available.useQuery(undefined, { enabled: !!user });
  const { data: pendingOrders = [] } = trpc.orders.pending.useQuery(undefined, {
    refetchInterval: 5000,
    enabled: !!user,
  });
  const utils = trpc.useUtils();

  // Count orders ready to deliver (status = 'ready')
  const readyCount = useMemo(
    () => (pendingOrders as Array<{ status: string }>).filter((o) => o.status === "ready").length,
    [pendingOrders]
  );

  const createOrderMutation = trpc.orders.create.useMutation({
    onSuccess: () => {
      toast.success("¡Pedido registrado y cobrado!", { duration: 3000 });
      setCart([]);
      setCallerChoice(null);
      setShowPayModal(false);
      setShowCartPanel(false);
      utils.callers.available.invalidate();
      utils.orders.pending.invalidate();
    },
    onError: (err) => {
      toast.error(err.message || "Error al registrar el pedido");
    },
  });

  const filteredProducts = useMemo(() => {
    if (!selectedCategoryId) return [];
    return products.filter((p) => p.categoryId === selectedCategoryId);
  }, [products, selectedCategoryId]);

  const cartTotal = useMemo(
    () => cart.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [cart]
  );
  const cartCount = useMemo(() => cart.reduce((s, i) => s + i.quantity, 0), [cart]);
  const requiresKitchen = useMemo(() => cart.some((item) => item.requiresKitchen), [cart]);

  // ── Cart helpers ──────────────────────────────────────────────────────────────
  const addToCart = (
    productId: number | null,
    productName: string,
    categoryName: string,
    price: number,
    requiresKitchen: boolean,
    typeNote?: string,
    fixedPrice = true
  ) => {
    const key = `${productId ?? "free"}-${categoryName}-${typeNote || ""}`;
    setCart((prev) => {
      const existing = prev.find((i) => i.id === key);
      if (existing && fixedPrice && productId !== null) {
        return prev.map((i) => i.id === key ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [
        ...prev,
        {
          id: `${productId ?? "free"}-${categoryName}-${Date.now()}`,
          productId,
          productName: productName + (typeNote ? ` (${typeNote})` : ""),
          categoryName,
          price,
          quantity: 1,
          requiresKitchen,
          typeNote,
        },
      ];
    });
    toast.success(`${productName} añadido`, { duration: 800 });
  };

  const handleProductClick = (product: Product) => {
    const category = categories.find((c) => c.id === product.categoryId);
    if (!category) return;
    if (product.requiresTypeInput) {
      setPizzaProduct(product);
      setPizzaType("");
      setShowPizzaInput(true);
      return;
    }
    if (!product.fixedPrice) {
      setNumpadProduct(product);
      setShowNumpad(true);
      return;
    }
    addToCart(product.id, product.name, category.name, parseFloat(product.price), product.requiresKitchen, undefined, true);
  };

  const handleFreeItemClick = (cat: Category) => {
    setFreeItem({ type: "free", categoryId: cat.id, categoryName: cat.name, requiresKitchen: false });
    setShowFreeNumpad(true);
  };

  const handleNumpadConfirm = (amount: number) => {
    if (!numpadProduct) return;
    const category = categories.find((c) => c.id === numpadProduct.categoryId);
    if (!category) return;
    addToCart(numpadProduct.id, numpadProduct.name, category.name, amount, numpadProduct.requiresKitchen, undefined, false);
    setShowNumpad(false);
    setNumpadProduct(null);
  };

  const handleFreeNumpadConfirm = (amount: number) => {
    if (!freeItem) return;
    addToCart(null, `Otros (${freeItem.categoryName})`, freeItem.categoryName, amount, freeItem.requiresKitchen, undefined, false);
    setShowFreeNumpad(false);
    setFreeItem(null);
  };

  const handlePizzaConfirm = () => {
    if (!pizzaProduct || !pizzaType.trim()) return;
    const category = categories.find((c) => c.id === pizzaProduct.categoryId);
    if (!category) return;
    addToCart(pizzaProduct.id, pizzaProduct.name, category.name, parseFloat(pizzaProduct.price), pizzaProduct.requiresKitchen, pizzaType.trim(), false);
    setShowPizzaInput(false);
    setPizzaProduct(null);
    setPizzaType("");
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart((prev) =>
      prev.map((item) => item.id === id ? { ...item, quantity: item.quantity + delta } : item)
        .filter((item) => item.quantity > 0)
    );
  };

  const removeItem = (id: string) => setCart((prev) => prev.filter((item) => item.id !== id));

  const handlePay = () => {
    if (cart.length === 0) { toast.error("El carrito está vacío"); return; }
    setCallerChoice(null);
    setShowPayModal(true);
  };

  const confirmPay = () => {
    if (requiresKitchen && callerChoice === null) {
      toast.error("Selecciona un llamador o elige 'Sin llamador'");
      return;
    }
    const finalCaller = callerChoice === -1 ? null : callerChoice;
    createOrderMutation.mutate({
      callerNumber: finalCaller,
      total: cartTotal.toFixed(2),
      requiresKitchen,
      items: cart.map((item) => ({
        productId: item.productId,
        productName: item.productName,
        categoryName: item.categoryName,
        price: item.price.toFixed(2),
        quantity: item.quantity,
        requiresKitchen: item.requiresKitchen,
        typeNote: item.typeNote,
      })),
    });
  };

  // ── Cart Panel (shared) ───────────────────────────────────────────────────────
  const CartPanel = () => (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-3 space-y-2 min-h-0">
        {cart.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-center">
            <ShoppingCart className="w-8 h-8 text-muted-foreground/30 mb-2" />
            <p className="text-muted-foreground text-sm">Pedido vacío</p>
          </div>
        ) : (
          cart.map((item) => (
            <div key={item.id} className="flex items-center gap-2 p-2.5 rounded-xl bg-secondary/50">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground leading-tight">{item.productName}</p>
                <p className="text-xs text-primary font-bold mt-0.5">
                  {(item.price * item.quantity).toFixed(2)}€
                </p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button onClick={() => updateQuantity(item.id, -1)} className="w-7 h-7 rounded-lg bg-secondary flex items-center justify-center active:scale-95">
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="w-6 text-center text-sm font-bold">{item.quantity}</span>
                <button onClick={() => updateQuantity(item.id, 1)} className="w-7 h-7 rounded-lg bg-secondary flex items-center justify-center active:scale-95">
                  <Plus className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => removeItem(item.id)} className="w-7 h-7 rounded-lg text-destructive/60 hover:text-destructive flex items-center justify-center ml-0.5">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
      <div className="p-3 border-t border-border space-y-3 shrink-0">
        {requiresKitchen && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/10 border border-primary/20">
            <ChefHat className="w-4 h-4 text-primary shrink-0" />
            <p className="text-xs text-primary font-medium">Requiere llamador de cocina</p>
          </div>
        )}
        <div className="flex items-center justify-between px-1">
          <span className="text-muted-foreground font-medium text-sm">Total</span>
          <span className="text-2xl font-bold text-foreground">{cartTotal.toFixed(2)}€</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" onClick={() => setCart([])} disabled={cart.length === 0}
            className="text-destructive border-destructive/30 hover:bg-destructive/10 h-11">
            <Trash2 className="w-4 h-4 mr-1.5" />Limpiar
          </Button>
          <Button onClick={handlePay} disabled={cart.length === 0} className="font-bold h-11 text-base">
            <CreditCard className="w-4 h-4 mr-1.5" />Cobrar
          </Button>
        </div>
      </div>
    </div>
  );

  const selectedCategory = categories.find((c) => c.id === selectedCategoryId);

  return (
    <AppLayout>
      <div className="flex flex-col md:flex-row h-[100dvh] overflow-hidden">

        {/* ── Products area ── */}
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          {/* Header */}
          <div className="flex flex-col shrink-0">
            <div className="h-12 flex items-center px-3 border-b border-border bg-card/60 backdrop-blur-sm">
              <h1 className="text-base font-bold text-foreground">Nuevo Pedido</h1>
              <span className="ml-auto text-xs text-muted-foreground">
                {(user as any)?.displayName || "Vendedor"}
              </span>
            </div>
            {/* Ready orders alert banner */}
            {readyCount > 0 && (
              <div className="flex items-center gap-2 px-4 py-2.5 bg-green-600 text-white text-sm font-bold animate-pulse cursor-pointer"
                onClick={() => window.location.href = '/pendientes'}>
                <span className="text-base">🔔</span>
                <span>
                  {readyCount === 1
                    ? "¡1 PEDIDO PREPARADO — Pendiente de entrega al cliente!"
                    : `¡${readyCount} PEDIDOS PREPARADOS — Pendientes de entrega al cliente!`}
                </span>
                <span className="ml-auto text-xs underline opacity-80">Ver pedidos →</span>
              </div>
            )}
          </div>

          {/* Category chips */}
          <div className="flex gap-2 px-3 py-2 overflow-x-auto shrink-0 border-b border-border bg-background/60"
            style={{ scrollbarWidth: "none", WebkitOverflowScrolling: "touch" }}>
            {categories.map((cat) => (
              <button key={cat.id} onClick={() => setSelectedCategoryId(cat.id)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all shrink-0 active:scale-95",
                  selectedCategoryId === cat.id ? "text-white shadow-md" : "bg-secondary text-secondary-foreground"
                )}
                style={selectedCategoryId === cat.id ? { backgroundColor: cat.color, boxShadow: `0 3px 12px ${cat.color}50` } : {}}>
                <span>{ICON_MAP[cat.icon] || "🍽️"}</span>
                <span>{cat.name}</span>
              </button>
            ))}
          </div>

          {/* Products grid */}
          <div className="flex-1 overflow-y-auto p-2 min-h-0" style={{ scrollbarWidth: "thin" }}>
            {!selectedCategoryId ? (
              <div className="flex flex-col items-center justify-center h-full text-center gap-2 py-8">
                <span className="text-5xl">👆</span>
                <p className="text-muted-foreground font-medium">Selecciona una categoría</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                {filteredProducts.map((product) => {
                  const category = categories.find((c) => c.id === product.categoryId);
                  return (
                    <button key={product.id} onClick={() => handleProductClick(product)}
                      className="relative flex flex-col items-start p-3 rounded-2xl bg-card border border-border active:scale-95 transition-transform text-left touch-manipulation">
                      {product.requiresKitchen && (
                        <div className="absolute top-2 right-2">
                          <ChefHat className="w-3 h-3 text-primary/50" />
                        </div>
                      )}
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg mb-2 shrink-0"
                        style={{ backgroundColor: `${category?.color || "#6366f1"}20` }}>
                        {ICON_MAP[category?.icon || "utensils"] || "🍽️"}
                      </div>
                      <p className="text-sm font-semibold text-foreground leading-tight mb-1 line-clamp-2">{product.name}</p>
                      <p className="text-sm font-bold text-primary mt-auto">
                        {product.fixedPrice ? `${parseFloat(product.price).toFixed(2)}€` : "Precio libre"}
                      </p>
                    </button>
                  );
                })}

                {/* ── "Otros" free-price button for this category ── */}
                {selectedCategory && (
                  <button onClick={() => handleFreeItemClick(selectedCategory)}
                    className="relative flex flex-col items-start p-3 rounded-2xl bg-card border border-dashed border-primary/40 active:scale-95 transition-transform text-left touch-manipulation">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg mb-2 shrink-0 bg-primary/10">
                      💰
                    </div>
                    <p className="text-sm font-semibold text-foreground leading-tight mb-1">
                      Otros
                    </p>
                    <p className="text-sm font-bold text-primary mt-auto">Precio libre</p>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Mobile floating cart button */}
          {cartCount > 0 && (
            <div className="md:hidden px-3 pb-3 shrink-0">
              <button onClick={() => setShowCartPanel(true)}
                className="w-full flex items-center justify-between px-4 py-3 rounded-2xl bg-primary text-primary-foreground font-bold text-base shadow-lg shadow-primary/30 active:scale-95 transition-transform">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5" />
                  <span>{cartCount} {cartCount === 1 ? "artículo" : "artículos"}</span>
                </div>
                <span className="text-lg">{cartTotal.toFixed(2)}€</span>
              </button>
            </div>
          )}
        </div>

        {/* ── Desktop cart sidebar ── */}
        <div className="hidden md:flex w-72 xl:w-80 flex-col bg-card border-l border-border shrink-0">
          <div className="h-12 flex items-center px-4 border-b border-border shrink-0">
            <ShoppingCart className="w-4 h-4 text-primary mr-2" />
            <span className="font-bold text-foreground text-sm">Pedido actual</span>
            {cartCount > 0 && (
              <span className="ml-auto text-xs font-bold bg-primary text-primary-foreground rounded-full px-2 py-0.5">{cartCount}</span>
            )}
          </div>
          <CartPanel />
        </div>
      </div>

      {/* ── Mobile cart bottom sheet ── */}
      {showCartPanel && (
        <div className="md:hidden fixed inset-0 z-50 flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowCartPanel(false)} />
          <div className="relative bg-card rounded-t-3xl shadow-2xl flex flex-col max-h-[85dvh]">
            <div className="flex justify-center pt-3 pb-1 shrink-0">
              <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
            </div>
            <div className="flex items-center px-4 pb-3 border-b border-border shrink-0">
              <ShoppingCart className="w-4 h-4 text-primary mr-2" />
              <span className="font-bold text-foreground">Pedido actual</span>
              <button onClick={() => setShowCartPanel(false)} className="ml-auto w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
                <X className="w-4 h-4" />
              </button>
            </div>
            <CartPanel />
          </div>
        </div>
      )}

      {/* ── Numpad for products with free price ── */}
      <Dialog open={showNumpad} onOpenChange={setShowNumpad}>
        <DialogContent className="max-w-xs mx-auto">
          <DialogHeader><DialogTitle>{numpadProduct?.name}</DialogTitle></DialogHeader>
          {numpadProduct && (
            <NumericKeypad title={`Importe para ${numpadProduct.name}`}
              onConfirm={handleNumpadConfirm} onCancel={() => setShowNumpad(false)} />
          )}
        </DialogContent>
      </Dialog>

      {/* ── Numpad for "Otros" free item ── */}
      <Dialog open={showFreeNumpad} onOpenChange={setShowFreeNumpad}>
        <DialogContent className="max-w-xs mx-auto">
          <DialogHeader>
            <DialogTitle>💰 Otros — {freeItem?.categoryName}</DialogTitle>
          </DialogHeader>
          {freeItem && (
            <NumericKeypad title="Introduce el importe"
              onConfirm={handleFreeNumpadConfirm} onCancel={() => setShowFreeNumpad(false)} />
          )}
        </DialogContent>
      </Dialog>

      {/* ── Pizza type dialog ── */}
      <Dialog open={showPizzaInput} onOpenChange={setShowPizzaInput}>
        <DialogContent className="max-w-xs mx-auto">
          <DialogHeader><DialogTitle>🍕 Tipo de Pizza</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>¿Qué tipo de pizza?</Label>
              <Input placeholder="Ej: 4 quesos, margarita..." value={pizzaType}
                onChange={(e) => setPizzaType(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handlePizzaConfirm()}
                autoFocus className="h-12 text-base" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" onClick={() => setShowPizzaInput(false)}>Cancelar</Button>
              <Button onClick={handlePizzaConfirm} disabled={!pizzaType.trim()}>Añadir</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Pay modal ── */}
      <Dialog open={showPayModal} onOpenChange={setShowPayModal}>
        <DialogContent className="max-w-sm mx-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-primary" />Confirmar Cobro
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Summary */}
            <div className="bg-secondary/50 rounded-xl p-3 space-y-1.5 max-h-48 overflow-y-auto">
              {cart.map((item) => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span className="text-foreground">
                    {item.quantity > 1 && <span className="text-primary font-bold mr-1">{item.quantity}×</span>}
                    {item.productName}
                  </span>
                  <span className="font-semibold shrink-0 ml-2">{(item.price * item.quantity).toFixed(2)}€</span>
                </div>
              ))}
              <div className="border-t border-border pt-2 mt-1 flex justify-between font-bold">
                <span>TOTAL</span>
                <span className="text-primary text-lg">{cartTotal.toFixed(2)}€</span>
              </div>
            </div>

            {/* Caller selection — only when kitchen needed */}
            {requiresKitchen && (
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-sm">
                  <ChefHat className="w-4 h-4 text-primary" />
                  Número de Llamador
                </Label>

                {/* "No caller" option */}
                <button
                  onClick={() => setCallerChoice(-1)}
                  className={cn(
                    "w-full flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium transition-all active:scale-95",
                    callerChoice === -1
                      ? "bg-muted border-muted-foreground text-foreground"
                      : "border-border text-muted-foreground hover:border-muted-foreground"
                  )}
                >
                  <Ban className="w-4 h-4 shrink-0" />
                  Sin llamador (no necesario)
                </button>

                {/* Caller numbers grid */}
                <div className="grid grid-cols-4 gap-2">
                  {callers.map((caller) => (
                    <button key={caller.number} onClick={() => setCallerChoice(caller.number)}
                      className={cn(
                        "h-12 rounded-xl font-bold text-lg transition-all active:scale-95",
                        callerChoice === caller.number
                          ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30"
                          : "bg-secondary text-foreground"
                      )}>
                      {caller.number}
                    </button>
                  ))}
                </div>
                {callers.length === 0 && callerChoice !== -1 && (
                  <p className="text-sm text-amber-500">No hay llamadores disponibles — usa "Sin llamador"</p>
                )}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <Button variant="outline" onClick={() => setShowPayModal(false)}
                disabled={createOrderMutation.isPending} className="h-12">
                Cancelar
              </Button>
              <Button onClick={confirmPay}
                disabled={createOrderMutation.isPending || (requiresKitchen && callerChoice === null)}
                className="font-bold text-base h-12">
                {createOrderMutation.isPending ? "Registrando..." : `Cobrar ${cartTotal.toFixed(2)}€`}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
