import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import AppLayout from "@/components/AppLayout";
import NumericKeypad from "@/components/NumericKeypad";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Minus, Plus, ShoppingCart, Trash2, X, ChefHat, CreditCard } from "lucide-react";
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

// Icon map for categories
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
  const [showNumpad, setShowNumpad] = useState(false);
  const [numpadProduct, setNumpadProduct] = useState<Product | null>(null);
  const [showPizzaInput, setShowPizzaInput] = useState(false);
  const [pizzaProduct, setPizzaProduct] = useState<Product | null>(null);
  const [pizzaType, setPizzaType] = useState("");
  const [showPayModal, setShowPayModal] = useState(false);
  const [selectedCaller, setSelectedCaller] = useState<number | null>(null);

  const { data: categories = [] } = trpc.categories.list.useQuery();
  const { data: products = [] } = trpc.products.listAll.useQuery();
  const { data: callers = [], refetch: refetchCallers } = trpc.callers.available.useQuery(undefined, { enabled: !!user });
  const utils = trpc.useUtils();

  const createOrderMutation = trpc.orders.create.useMutation({
    onSuccess: () => {
      toast.success("¡Pedido registrado y cobrado!", { duration: 3000 });
      setCart([]);
      setSelectedCaller(null);
      setShowPayModal(false);
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

  const requiresKitchen = useMemo(
    () => cart.some((item) => item.requiresKitchen),
    [cart]
  );

  const addToCart = (product: Product, category: Category, price?: number, typeNote?: string) => {
    const finalPrice = price ?? parseFloat(product.price);
    const key = `${product.id}-${typeNote || ""}`;

    setCart((prev) => {
      const existing = prev.find((i) => i.id === key);
      if (existing && product.fixedPrice) {
        return prev.map((i) =>
          i.id === key ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [
        ...prev,
        {
          id: `${product.id}-${Date.now()}`,
          productId: product.id,
          productName: product.name + (typeNote ? ` (${typeNote})` : ""),
          categoryName: category.name,
          price: finalPrice,
          quantity: 1,
          requiresKitchen: product.requiresKitchen,
          typeNote,
        },
      ];
    });
    toast.success(`${product.name} añadido`, { duration: 1000 });
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

    addToCart(product, category);
  };

  const handleNumpadConfirm = (amount: number) => {
    if (!numpadProduct) return;
    const category = categories.find((c) => c.id === numpadProduct.categoryId);
    if (!category) return;
    addToCart(numpadProduct, category, amount);
    setShowNumpad(false);
    setNumpadProduct(null);
  };

  const handlePizzaConfirm = () => {
    if (!pizzaProduct || !pizzaType.trim()) return;
    const category = categories.find((c) => c.id === pizzaProduct.categoryId);
    if (!category) return;
    addToCart(pizzaProduct, category, undefined, pizzaType.trim());
    setShowPizzaInput(false);
    setPizzaProduct(null);
    setPizzaType("");
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => (item.id === id ? { ...item, quantity: item.quantity + delta } : item))
        .filter((item) => item.quantity > 0)
    );
  };

  const removeItem = (id: string) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
  };

  const handlePay = () => {
    if (cart.length === 0) {
      toast.error("El carrito está vacío");
      return;
    }
    setShowPayModal(true);
  };

  const confirmPay = () => {
    if (requiresKitchen && !selectedCaller) {
      toast.error("Selecciona un número de llamador");
      return;
    }

    createOrderMutation.mutate({
      callerNumber: selectedCaller,
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

  return (
    <AppLayout>
      <div className="flex h-screen overflow-hidden">
        {/* Left: Categories + Products */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="h-14 flex items-center px-4 border-b border-border bg-card/50 backdrop-blur-sm shrink-0">
            <h1 className="text-lg font-bold text-foreground">Nuevo Pedido</h1>
            <span className="ml-auto text-sm text-muted-foreground">
              {(user as any)?.displayName || "Vendedor"}
            </span>
          </div>

          {/* Category tabs */}
          <div className="flex gap-2 p-3 overflow-x-auto shrink-0 border-b border-border bg-background/50">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategoryId(cat.id)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-all shrink-0",
                  selectedCategoryId === cat.id
                    ? "text-white shadow-lg scale-105"
                    : "bg-secondary text-secondary-foreground hover:bg-accent"
                )}
                style={
                  selectedCategoryId === cat.id
                    ? { backgroundColor: cat.color, boxShadow: `0 4px 15px ${cat.color}40` }
                    : {}
                }
              >
                <span className="text-base">{ICON_MAP[cat.icon] || "🍽️"}</span>
                <span>{cat.name}</span>
              </button>
            ))}
          </div>

          {/* Products grid */}
          <div className="flex-1 overflow-y-auto p-4">
            {!selectedCategoryId ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <div className="text-6xl mb-4">👆</div>
                <p className="text-muted-foreground text-lg font-medium">Selecciona una categoría</p>
                <p className="text-muted-foreground text-sm mt-1">para ver los productos disponibles</p>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <p className="text-muted-foreground">No hay productos en esta categoría</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {filteredProducts.map((product) => {
                  const category = categories.find((c) => c.id === product.categoryId);
                  return (
                    <button
                      key={product.id}
                      onClick={() => handleProductClick(product)}
                      className="product-btn relative flex flex-col items-start p-4 rounded-2xl bg-card border border-border hover:border-primary/50 text-left group"
                    >
                      {product.requiresKitchen && (
                        <div className="absolute top-2 right-2">
                          <ChefHat className="w-3.5 h-3.5 text-primary/60" />
                        </div>
                      )}
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-xl mb-3"
                        style={{ backgroundColor: `${category?.color || "#6366f1"}20` }}
                      >
                        {ICON_MAP[category?.icon || "utensils"] || "🍽️"}
                      </div>
                      <p className="text-sm font-semibold text-foreground leading-tight mb-1">
                        {product.name}
                      </p>
                      <p className="text-base font-bold text-primary">
                        {product.fixedPrice
                          ? `${parseFloat(product.price).toFixed(2)}€`
                          : "Precio libre"}
                      </p>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right: Cart */}
        <div className="w-72 xl:w-80 flex flex-col bg-card border-l border-border shrink-0">
          {/* Cart header */}
          <div className="h-14 flex items-center px-4 border-b border-border">
            <ShoppingCart className="w-5 h-5 text-primary mr-2" />
            <span className="font-bold text-foreground">Pedido</span>
            {cart.length > 0 && (
              <Badge className="ml-auto" variant="secondary">
                {cart.reduce((s, i) => s + i.quantity, 0)}
              </Badge>
            )}
          </div>

          {/* Cart items */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center py-8">
                <ShoppingCart className="w-10 h-10 text-muted-foreground/30 mb-3" />
                <p className="text-muted-foreground text-sm">Pedido vacío</p>
              </div>
            ) : (
              cart.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-2 p-2.5 rounded-xl bg-secondary/50 group"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{item.productName}</p>
                    <p className="text-xs text-primary font-semibold">
                      {(item.price * item.quantity).toFixed(2)}€
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => updateQuantity(item.id, -1)}
                      className="w-6 h-6 rounded-lg bg-secondary flex items-center justify-center hover:bg-accent transition-colors"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-6 text-center text-sm font-bold">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.id, 1)}
                      className="w-6 h-6 rounded-lg bg-secondary flex items-center justify-center hover:bg-accent transition-colors"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => removeItem(item.id)}
                      className="w-6 h-6 rounded-lg text-destructive/60 hover:text-destructive hover:bg-destructive/10 flex items-center justify-center transition-colors ml-1"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Cart footer */}
          <div className="p-4 border-t border-border space-y-3">
            {requiresKitchen && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/10 border border-primary/20">
                <ChefHat className="w-4 h-4 text-primary shrink-0" />
                <p className="text-xs text-primary font-medium">Requiere llamador</p>
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground font-medium">Total</span>
              <span className="text-2xl font-bold text-foreground">{cartTotal.toFixed(2)}€</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCart([])}
                disabled={cart.length === 0}
                className="text-destructive border-destructive/30 hover:bg-destructive/10"
              >
                <Trash2 className="w-4 h-4 mr-1" />
                Limpiar
              </Button>
              <Button
                size="sm"
                onClick={handlePay}
                disabled={cart.length === 0}
                className="font-bold"
              >
                <CreditCard className="w-4 h-4 mr-1" />
                Cobrar
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Numeric Keypad Dialog */}
      <Dialog open={showNumpad} onOpenChange={setShowNumpad}>
        <DialogContent className="max-w-xs">
          <DialogHeader>
            <DialogTitle>{numpadProduct?.name}</DialogTitle>
          </DialogHeader>
          {numpadProduct && (
            <NumericKeypad
              title={`Introduce el importe para ${numpadProduct.name}`}
              onConfirm={handleNumpadConfirm}
              onCancel={() => setShowNumpad(false)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Pizza Type Dialog */}
      <Dialog open={showPizzaInput} onOpenChange={setShowPizzaInput}>
        <DialogContent className="max-w-xs">
          <DialogHeader>
            <DialogTitle>🍕 Tipo de Pizza</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>¿Qué tipo de pizza?</Label>
              <Input
                placeholder="Ej: 4 quesos, margarita, barbacoa..."
                value={pizzaType}
                onChange={(e) => setPizzaType(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handlePizzaConfirm()}
                autoFocus
                className="h-12 text-base"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" onClick={() => setShowPizzaInput(false)}>
                Cancelar
              </Button>
              <Button onClick={handlePizzaConfirm} disabled={!pizzaType.trim()}>
                Añadir
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Pay Modal */}
      <Dialog open={showPayModal} onOpenChange={setShowPayModal}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-primary" />
              Confirmar Cobro
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-5">
            {/* Order summary */}
            <div className="bg-secondary/50 rounded-xl p-4 space-y-2">
              {cart.map((item) => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span className="text-foreground">
                    {item.quantity > 1 && <span className="text-primary font-bold mr-1">{item.quantity}×</span>}
                    {item.productName}
                  </span>
                  <span className="font-semibold text-foreground">
                    {(item.price * item.quantity).toFixed(2)}€
                  </span>
                </div>
              ))}
              <div className="border-t border-border pt-2 mt-2 flex justify-between font-bold">
                <span>TOTAL</span>
                <span className="text-primary text-lg">{cartTotal.toFixed(2)}€</span>
              </div>
            </div>

            {/* Caller selection */}
            {requiresKitchen && (
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <ChefHat className="w-4 h-4 text-primary" />
                  Número de Llamador *
                </Label>
                <div className="grid grid-cols-4 gap-2">
                  {callers.map((caller) => (
                    <button
                      key={caller.number}
                      onClick={() => setSelectedCaller(caller.number)}
                      className={cn(
                        "h-12 rounded-xl font-bold text-lg transition-all",
                        selectedCaller === caller.number
                          ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30 scale-105"
                          : "bg-secondary text-foreground hover:bg-accent"
                      )}
                    >
                      {caller.number}
                    </button>
                  ))}
                </div>
                {callers.length === 0 && (
                  <p className="text-sm text-destructive">No hay llamadores disponibles</p>
                )}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                onClick={() => setShowPayModal(false)}
                disabled={createOrderMutation.isPending}
              >
                Cancelar
              </Button>
              <Button
                onClick={confirmPay}
                disabled={
                  createOrderMutation.isPending ||
                  (requiresKitchen && !selectedCaller)
                }
                className="font-bold text-base"
              >
                {createOrderMutation.isPending ? "Registrando..." : `Cobrar ${cartTotal.toFixed(2)}€`}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
