import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import AppLayout from "@/components/AppLayout";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  CheckCircle2,
  ClipboardList,
  Clock,
  ChefHat,
  Package,
  User,
  Bell,
  Pencil,
  X,
  Plus,
  Minus,
  Trash2,
  Save,
  Search,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

type OrderItem = {
  id: number;
  orderId: number;
  productName: string;
  categoryName: string;
  price: string;
  quantity: number;
  requiresKitchen: boolean;
  typeNote: string | null;
  customNote: string | null;
  completedInKitchen: boolean;
};

type PendingOrder = {
  id: number;
  callerNumber: number | null;
  sellerName: string;
  total: string;
  status: string;
  paidAt: Date;
  requiresKitchen: boolean;
  notes: string | null;
  items: OrderItem[];
};

type EditItem = {
  tempId: string; // local key
  productId: number | null;
  productName: string;
  categoryName: string;
  price: string;
  quantity: number;
  requiresKitchen: boolean;
  typeNote?: string;
  customNote?: string;
};

function formatTime(date: Date) {
  return new Date(date).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
}

function getElapsedMinutes(date: Date) {
  return Math.floor((Date.now() - new Date(date).getTime()) / 60000);
}

function getElapsedLabel(minutes: number) {
  if (minutes < 1) return "< 1 min";
  return `${minutes} min`;
}

// ─── Modal de edición ────────────────────────────────────────────────────────
function EditOrderModal({
  order,
  onClose,
  onSaved,
}: {
  order: PendingOrder;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [editItems, setEditItems] = useState<EditItem[]>(() =>
    order.items.map((item) => ({
      tempId: String(item.id),
      productId: null,
      productName: item.productName,
      categoryName: item.categoryName,
      price: item.price,
      quantity: item.quantity,
      requiresKitchen: item.requiresKitchen,
      typeNote: item.typeNote ?? undefined,
      customNote: item.customNote ?? undefined,
    }))
  );
  const [searchQuery, setSearchQuery] = useState("");

  const { data: allProducts = [] } = trpc.products.listAll.useQuery();
  const { data: allCategories = [] } = trpc.categories.list.useQuery();

  const updateMutation = trpc.orders.update.useMutation({
    onSuccess: () => {
      toast.success("Pedido actualizado");
      onSaved();
      onClose();
    },
    onError: (err) => toast.error(err.message || "Error al guardar"),
  });

  const filteredProducts = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return allProducts;
    return allProducts.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        allCategories.find((c) => c.id === p.categoryId)?.name.toLowerCase().includes(q)
    );
  }, [allProducts, allCategories, searchQuery]);

  const total = editItems
    .reduce((sum, item) => sum + parseFloat(item.price) * item.quantity, 0)
    .toFixed(2);

  const requiresKitchen = editItems.some((i) => i.requiresKitchen);

  const addProduct = (product: (typeof allProducts)[0]) => {
    const cat = allCategories.find((c) => c.id === product.categoryId);
    const existing = editItems.find((i) => i.productName === product.name && !i.typeNote && !i.customNote);
    if (existing) {
      setEditItems((prev) =>
        prev.map((i) =>
          i.tempId === existing.tempId ? { ...i, quantity: i.quantity + 1 } : i
        )
      );
    } else {
      setEditItems((prev) => [
        ...prev,
        {
          tempId: `new-${Date.now()}-${Math.random()}`,
          productId: product.id,
          productName: product.name,
          categoryName: cat?.name ?? "",
          price: product.price,
          quantity: 1,
          requiresKitchen: product.requiresKitchen,
        },
      ]);
    }
  };

  const changeQty = (tempId: string, delta: number) => {
    setEditItems((prev) =>
      prev
        .map((i) => (i.tempId === tempId ? { ...i, quantity: i.quantity + delta } : i))
        .filter((i) => i.quantity > 0)
    );
  };

  const removeItem = (tempId: string) => {
    setEditItems((prev) => prev.filter((i) => i.tempId !== tempId));
  };

  const handleSave = () => {
    if (editItems.length === 0) {
      toast.error("El pedido no puede quedar vacío");
      return;
    }
    updateMutation.mutate({
      orderId: order.id,
      items: editItems.map((i) => ({
        productId: i.productId,
        productName: i.productName,
        categoryName: i.categoryName,
        price: i.price,
        quantity: i.quantity,
        requiresKitchen: i.requiresKitchen,
        typeNote: i.typeNote,
        customNote: i.customNote,
      })),
      total,
      requiresKitchen,
      notes: order.notes ?? undefined,
    });
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg w-full max-h-[90dvh] flex flex-col gap-0 p-0 overflow-hidden">
        <DialogHeader className="px-5 pt-5 pb-3 border-b border-border shrink-0">
          <DialogTitle className="flex items-center gap-2 text-base">
            <Pencil className="w-4 h-4 text-primary" />
            Editar Pedido #{order.id}
            {order.callerNumber && (
              <span className="ml-auto text-xs font-bold bg-primary/10 text-primary rounded px-2 py-0.5">
                Llamador {order.callerNumber}
              </span>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-0 overflow-hidden flex-1">
          {/* Items actuales */}
          <div className="px-5 py-3 border-b border-border shrink-0">
            <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">
              Artículos del pedido
            </p>
            {editItems.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">Sin artículos — añade productos abajo</p>
            ) : (
              <div className="space-y-1.5 max-h-44 overflow-y-auto">
                {editItems.map((item) => (
                  <div
                    key={item.tempId}
                    className="flex items-center gap-2 bg-secondary/30 rounded-lg px-3 py-2"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{item.productName}</p>
                      {item.typeNote && (
                        <p className="text-xs text-muted-foreground">({item.typeNote})</p>
                      )}
                      {item.customNote && (
                        <p className="text-xs text-amber-400 italic">{item.customNote}</p>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0">
                      {(parseFloat(item.price) * item.quantity).toFixed(2)}€
                    </span>
                    {/* Qty controls */}
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => changeQty(item.tempId, -1)}
                        className="w-6 h-6 rounded bg-secondary hover:bg-secondary/80 flex items-center justify-center"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="text-sm font-bold w-5 text-center">{item.quantity}</span>
                      <button
                        onClick={() => changeQty(item.tempId, 1)}
                        className="w-6 h-6 rounded bg-secondary hover:bg-secondary/80 flex items-center justify-center"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                    <button
                      onClick={() => removeItem(item.tempId)}
                      className="w-6 h-6 rounded text-destructive hover:bg-destructive/10 flex items-center justify-center shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Buscador de productos */}
          <div className="px-5 py-3 flex-1 overflow-hidden flex flex-col gap-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide shrink-0">
              Añadir producto
            </p>
            <div className="relative shrink-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <Input
                placeholder="Buscar producto..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 h-8 text-sm"
              />
            </div>
            <div className="flex-1 overflow-y-auto space-y-1 min-h-0">
              {filteredProducts.map((product) => {
                const cat = allCategories.find((c) => c.id === product.categoryId);
                return (
                  <button
                    key={product.id}
                    onClick={() => addProduct(product)}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-secondary/20 hover:bg-secondary/50 transition-colors text-left"
                  >
                    <div>
                      <p className="text-sm font-medium text-foreground">{product.name}</p>
                      <p className="text-xs text-muted-foreground">{cat?.name}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs text-primary font-semibold">
                        {parseFloat(product.price).toFixed(2)}€
                      </span>
                      <Plus className="w-4 h-4 text-primary" />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <DialogFooter className="px-5 py-4 border-t border-border shrink-0 flex items-center justify-between gap-3">
          <span className="text-base font-bold text-primary">Total: {total}€</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={onClose}>
              Cancelar
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={updateMutation.isPending || editItems.length === 0}
              className="gap-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              Guardar cambios
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Tarjeta de pedido ────────────────────────────────────────────────────────
function OrderCard({
  order,
  onDeliver,
  isDelivering,
  onEdit,
}: {
  order: PendingOrder;
  onDeliver: (id: number) => void;
  isDelivering: boolean;
  onEdit: (order: PendingOrder) => void;
}) {
  const elapsed = getElapsedMinutes(order.paidAt);
  const isReady = order.status === "ready";

  return (
    <div
      className={cn(
        "rounded-2xl overflow-hidden border shadow-md transition-all",
        isReady
          ? "bg-green-950/40 border-green-500/40 shadow-green-900/20"
          : "bg-card border-border"
      )}
    >
      {/* Card header */}
      <div
        className={cn(
          "flex items-center justify-between px-4 py-3 border-b",
          isReady ? "bg-green-900/30 border-green-500/30" : "bg-secondary/30 border-border"
        )}
      >
        {/* Caller / no caller */}
        {order.callerNumber ? (
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "w-12 h-12 rounded-xl flex items-center justify-center shadow-md font-black text-xl",
                isReady
                  ? "bg-green-500 text-white shadow-green-500/40"
                  : "bg-primary text-primary-foreground shadow-primary/30"
              )}
            >
              {order.callerNumber}
            </div>
            <div>
              <p className="text-xs font-semibold text-foreground">Llamador {order.callerNumber}</p>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <User className="w-3 h-3" />
                {order.sellerName}
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
              <Package className="w-5 h-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-xs font-semibold text-foreground">Sin llamador</p>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <User className="w-3 h-3" />
                {order.sellerName}
              </p>
            </div>
          </div>
        )}

        {/* Time + edit button */}
        <div className="text-right space-y-1">
          <p className="text-xs text-muted-foreground flex items-center gap-1 justify-end">
            <Clock className="w-3 h-3" />
            {formatTime(order.paidAt)}
          </p>
          <p
            className={cn(
              "text-xs font-bold",
              elapsed >= 15
                ? "text-red-400"
                : elapsed >= 10
                ? "text-orange-400"
                : elapsed >= 6
                ? "text-yellow-400"
                : "text-green-400"
            )}
          >
            {getElapsedLabel(elapsed)}
          </p>
        </div>
      </div>

      {/* Status banner */}
      <div
        className={cn(
          "flex items-center gap-2 px-4 py-2 text-xs font-semibold",
          isReady
            ? "bg-green-500/15 text-green-400"
            : "bg-amber-500/10 text-amber-400"
        )}
      >
        {isReady ? (
          <>
            <Bell className="w-3.5 h-3.5 animate-bounce" />
            LISTO — Pendiente de entrega al cliente
          </>
        ) : (
          <>
            <ChefHat className="w-3.5 h-3.5" />
            En cocina...
          </>
        )}
      </div>

      {/* Items */}
      <div className="px-4 py-3 space-y-1.5">
        {order.items.map((item) => (
          <div key={item.id} className="flex items-start gap-2">
            <div
              className={cn(
                "w-1.5 h-1.5 rounded-full mt-1.5 shrink-0",
                item.requiresKitchen ? "bg-primary" : "bg-muted-foreground/40"
              )}
            />
            <div className="flex-1">
              <p className="text-sm text-foreground">
                {item.quantity > 1 && (
                  <span className="font-bold text-primary mr-1">{item.quantity}×</span>
                )}
                {item.productName}
                {item.typeNote && (
                  <span className="text-xs text-muted-foreground ml-1">({item.typeNote})</span>
                )}
              </p>
              {item.customNote && (
                <p className="text-xs text-amber-400 mt-0.5">✏️ {item.customNote}</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="px-4 pb-4 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-primary">{parseFloat(order.total).toFixed(2)}€</span>
          {/* Botón editar — solo visible si no está listo (en cocina) */}
          {!isReady && (
            <Button
              size="sm"
              variant="outline"
              className="h-8 text-xs gap-1.5 border-border/60"
              onClick={() => onEdit(order)}
            >
              <Pencil className="w-3 h-3" />
              Editar
            </Button>
          )}
        </div>
        <Button
          size="sm"
          onClick={() => onDeliver(order.id)}
          disabled={isDelivering}
          className={cn(
            "font-semibold",
            isReady && "bg-green-600 hover:bg-green-700 text-white shadow-md shadow-green-700/30"
          )}
        >
          <CheckCircle2 className="w-4 h-4 mr-1.5" />
          Entregado
        </Button>
      </div>
    </div>
  );
}

// ─── Pantalla principal ───────────────────────────────────────────────────────
export default function Pendientes() {
  const { user } = useAuth();
  const utils = trpc.useUtils();
  const [editingOrder, setEditingOrder] = useState<PendingOrder | null>(null);

  const { data: orders = [], isLoading } = trpc.orders.pending.useQuery(undefined, {
    refetchInterval: 5000,
    enabled: !!user,
  });

  const deliverMutation = trpc.orders.deliver.useMutation({
    onSuccess: () => {
      toast.success("Pedido entregado al cliente ✓", { duration: 2000 });
      utils.orders.pending.invalidate();
      utils.callers.available.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const pendingOrders = orders as PendingOrder[];

  // Split by status
  const inKitchen = pendingOrders.filter((o) => o.status === "pending");
  const readyToDeliver = pendingOrders.filter((o) => o.status === "ready");

  return (
    <AppLayout>
      <div className="flex flex-col h-[100dvh] overflow-hidden">
        {/* Header */}
        <div className="h-12 flex items-center px-4 border-b border-border bg-card/50 backdrop-blur-sm shrink-0 gap-3">
          <ClipboardList className="w-4 h-4 text-primary shrink-0" />
          <h1 className="text-base font-bold text-foreground">Pedidos Pendientes</h1>
          <div className="ml-auto flex items-center gap-2">
            {readyToDeliver.length > 0 && (
              <span className="flex items-center gap-1.5 text-xs font-bold bg-green-500/20 text-green-400 border border-green-500/30 rounded-full px-2.5 py-1">
                <Bell className="w-3 h-3" />
                {readyToDeliver.length} listo{readyToDeliver.length !== 1 ? "s" : ""}
              </span>
            )}
            {inKitchen.length > 0 && (
              <span className="flex items-center gap-1.5 text-xs font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-full px-2.5 py-1">
                <ChefHat className="w-3 h-3" />
                {inKitchen.length} en cocina
              </span>
            )}
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              En vivo
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-3 space-y-6">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <ClipboardList className="w-10 h-10 text-primary animate-pulse" />
            </div>
          ) : pendingOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center gap-3">
              <div className="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center">
                <CheckCircle2 className="w-10 h-10 text-green-500" />
              </div>
              <h2 className="text-xl font-bold text-foreground">Sin pedidos pendientes</h2>
              <p className="text-muted-foreground text-sm">Todos los pedidos han sido entregados</p>
            </div>
          ) : (
            <>
              {/* ── LISTOS PARA ENTREGAR ── */}
              {readyToDeliver.length > 0 && (
                <section>
                  <div className="flex items-center gap-2 mb-3">
                    <Bell className="w-4 h-4 text-green-400" />
                    <h2 className="text-sm font-bold text-green-400 uppercase tracking-wider">
                      Listos para entregar al cliente
                    </h2>
                    <span className="text-xs bg-green-500/20 text-green-400 rounded-full px-2 py-0.5 font-bold">
                      {readyToDeliver.length}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                    {readyToDeliver.map((order) => (
                      <OrderCard
                        key={order.id}
                        order={order}
                        onDeliver={(id) => deliverMutation.mutate({ orderId: id })}
                        isDelivering={deliverMutation.isPending}
                        onEdit={setEditingOrder}
                      />
                    ))}
                  </div>
                </section>
              )}

              {/* ── EN COCINA ── */}
              {inKitchen.length > 0 && (
                <section>
                  <div className="flex items-center gap-2 mb-3">
                    <ChefHat className="w-4 h-4 text-amber-400" />
                    <h2 className="text-sm font-bold text-amber-400 uppercase tracking-wider">
                      En cocina
                    </h2>
                    <span className="text-xs bg-amber-500/20 text-amber-400 rounded-full px-2 py-0.5 font-bold">
                      {inKitchen.length}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                    {inKitchen.map((order) => (
                      <OrderCard
                        key={order.id}
                        order={order}
                        onDeliver={(id) => deliverMutation.mutate({ orderId: id })}
                        isDelivering={deliverMutation.isPending}
                        onEdit={setEditingOrder}
                      />
                    ))}
                  </div>
                </section>
              )}
            </>
          )}
        </div>
      </div>

      {/* Modal de edición */}
      {editingOrder && (
        <EditOrderModal
          order={editingOrder}
          onClose={() => setEditingOrder(null)}
          onSaved={() => {
            utils.orders.pending.invalidate();
            utils.orders.kitchen.invalidate();
          }}
        />
      )}
    </AppLayout>
  );
}
