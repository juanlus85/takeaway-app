import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import AppLayout from "@/components/AppLayout";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { CheckCircle2, ChefHat, Clock, User } from "lucide-react";
import { cn } from "@/lib/utils";

type OrderItem = {
  id: number;
  orderId: number;
  productName: string;
  categoryName: string;
  price: string;
  quantity: number;
  requiresKitchen: boolean;
  typeNote: string | null;
  completedInKitchen: boolean;
};

type KitchenOrder = {
  id: number;
  callerNumber: number | null;
  sellerName: string;
  total: string;
  status: string;
  paidAt: Date;
  items: OrderItem[];
};

function useElapsedTime(paidAt: Date) {
  const [elapsed, setElapsed] = useState(() =>
    Math.floor((Date.now() - new Date(paidAt).getTime()) / 1000)
  );

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - new Date(paidAt).getTime()) / 1000));
    }, 5000); // update every 5s
    return () => clearInterval(interval);
  }, [paidAt]);

  return elapsed;
}

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function getTimerColor(seconds: number) {
  if (seconds >= 15 * 60) return "bg-red-500/20 border-red-500/50 text-red-400";
  if (seconds >= 10 * 60) return "bg-orange-500/20 border-orange-500/50 text-orange-400";
  if (seconds >= 6 * 60) return "bg-yellow-500/20 border-yellow-500/50 text-yellow-400";
  return "bg-green-500/20 border-green-500/50 text-green-400";
}

function getCardBorder(seconds: number) {
  if (seconds >= 15 * 60) return "border-red-500/60 shadow-red-500/20";
  if (seconds >= 10 * 60) return "border-orange-500/60 shadow-orange-500/20";
  if (seconds >= 6 * 60) return "border-yellow-500/60 shadow-yellow-500/20";
  return "border-border";
}

function getCardBg(seconds: number) {
  if (seconds >= 15 * 60) return "bg-red-950/30";
  if (seconds >= 10 * 60) return "bg-orange-950/30";
  if (seconds >= 6 * 60) return "bg-yellow-950/20";
  return "bg-card";
}

function KitchenOrderCard({
  order,
  onDeliver,
  onToggleItem,
  isMarkingReady,
}: {
  order: KitchenOrder;
  onDeliver: (id: number) => void;
  onToggleItem: (itemId: number, completed: boolean) => void;
  isMarkingReady?: boolean;
}) {
  const elapsed = useElapsedTime(order.paidAt);
  const allCompleted = order.items.every((i) => i.completedInKitchen);
  const isReady = order.status === "ready";
  const timerColor = isReady ? "bg-green-500/20 border-green-500/50 text-green-400" : getTimerColor(elapsed);
  const cardBorder = isReady ? "border-green-500/70 shadow-green-500/20" : getCardBorder(elapsed);
  const cardBg = isReady ? "bg-green-950/40" : getCardBg(elapsed);

  return (
    <div
      className={cn(
        "rounded-2xl border-2 shadow-lg transition-all duration-500 overflow-hidden",
        cardBorder,
        cardBg
      )}
    >
      {/* Card Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
        {/* Caller number - big and prominent */}
        <div className="flex items-center gap-3">
          {order.callerNumber ? (
            <div className="w-14 h-14 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/30">
              <span className="text-2xl font-black text-primary-foreground caller-badge">
                {order.callerNumber}
              </span>
            </div>
          ) : (
            <div className="w-14 h-14 rounded-xl bg-secondary flex items-center justify-center">
              <span className="text-xs text-muted-foreground font-medium">Sin<br/>llamador</span>
            </div>
          )}
          <div>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <User className="w-3 h-3" />
              {order.sellerName}
            </p>
            <p className="text-xs text-muted-foreground">Pedido #{order.id}</p>
          </div>
        </div>

        {/* Timer */}
        <div className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm font-bold", timerColor)}>
          <Clock className="w-3.5 h-3.5" />
          {formatTime(elapsed)}
        </div>
      </div>

      {/* Items */}
      <div className="p-4 space-y-2">
        {order.items.map((item) => (
          <button
            key={item.id}
            onClick={() => onToggleItem(item.id, !item.completedInKitchen)}
            className={cn(
              "w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all",
              item.completedInKitchen
                ? "bg-green-500/10 border border-green-500/20 opacity-60"
                : "bg-secondary/80 hover:bg-accent border border-transparent"
            )}
          >
            <div
              className={cn(
                "w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all",
                item.completedInKitchen
                  ? "border-green-500 bg-green-500"
                  : "border-muted-foreground"
              )}
            >
              {item.completedInKitchen && (
                <CheckCircle2 className="w-3 h-3 text-white" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p
                className={cn(
                  "text-sm font-semibold transition-all",
                  item.completedInKitchen
                    ? "line-through text-muted-foreground"
                    : "text-foreground"
                )}
              >
                {item.quantity > 1 && (
                  <span className="text-primary font-black mr-1.5">{item.quantity}×</span>
                )}
                {item.productName}
              </p>
              {item.typeNote && (
                <p className="text-xs text-primary/80 mt-0.5">→ {item.typeNote}</p>
              )}
            </div>
          </button>
        ))}
      </div>

      {/* Ready status banner */}
      {isReady && (
        <div className="mx-4 mb-2 flex items-center gap-2 px-3 py-2 rounded-xl bg-green-500/20 border border-green-500/40">
          <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" />
          <span className="text-sm font-bold text-green-300">Pendiente de entrega al cliente</span>
        </div>
      )}

      {/* Footer */}
      <div className="px-4 pb-4">
        {!isReady && (
          <Button
            onClick={() => onDeliver(order.id)}
            disabled={isMarkingReady}
            className={cn(
              "w-full font-bold text-base h-14",
              allCompleted
                ? "bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-700/30"
                : "bg-primary hover:bg-primary/90"
            )}
            size="lg"
          >
            <CheckCircle2 className="w-5 h-5 mr-2" />
            {allCompleted ? "✅ PEDIDO PREPARADO" : "Marcar como Preparado"}
          </Button>
        )}
      </div>
    </div>
  );
}

export default function Cocina() {
  const { user } = useAuth();
  const utils = trpc.useUtils();

  const { data: orders = [], isLoading } = trpc.orders.kitchen.useQuery(undefined, {
    refetchInterval: 5000, // Poll every 5 seconds for real-time updates
    enabled: !!user,
  });

  const markReadyMutation = trpc.orders.markReady.useMutation({
    onSuccess: () => {
      toast.success("✅ Pedido marcado como preparado", { duration: 2000 });
      utils.orders.kitchen.invalidate();
      utils.orders.pending.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const toggleItemMutation = trpc.orders.completeItem.useMutation({
    onMutate: async ({ itemId, completed }) => {
      // Optimistic update
      await utils.orders.kitchen.cancel();
      const prev = utils.orders.kitchen.getData();
      utils.orders.kitchen.setData(undefined, (old) => {
        if (!old) return old;
        return old.map((order) => ({
          ...order,
          items: order.items.map((item) =>
            item.id === itemId ? { ...item, completedInKitchen: completed } : item
          ),
        }));
      });
      return { prev };
    },
    onError: (_err, _vars, context) => {
      if (context?.prev) utils.orders.kitchen.setData(undefined, context.prev);
    },
    onSettled: () => {
      utils.orders.kitchen.invalidate();
    },
  });

  const handleMarkReady = (orderId: number) => {
    markReadyMutation.mutate({ orderId });
  };

  const handleToggleItem = (itemId: number, completed: boolean) => {
    toggleItemMutation.mutate({ itemId, completed });
  };

  return (
    <AppLayout>
      <div className="flex flex-col h-screen overflow-hidden">
        {/* Header */}
        <div className="h-14 flex items-center px-4 border-b border-border bg-card/50 backdrop-blur-sm shrink-0">
          <ChefHat className="w-5 h-5 text-primary mr-2" />
          <h1 className="text-lg font-bold text-foreground">Vista de Cocina</h1>
          <div className="ml-auto flex items-center gap-3">
            {orders.length > 0 && (
              <Badge variant="secondary" className="text-sm px-3 py-1">
                {orders.length} pedido{orders.length !== 1 ? "s" : ""} pendiente{orders.length !== 1 ? "s" : ""}
              </Badge>
            )}
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              En vivo
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 px-4 py-2 border-b border-border bg-background/30 text-xs text-muted-foreground shrink-0">
          <span className="font-medium">Tiempo de espera:</span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded bg-green-500/30 inline-block" /> &lt;6 min
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded bg-yellow-500/30 inline-block" /> +6 min
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded bg-orange-500/30 inline-block" /> +10 min
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded bg-red-500/30 inline-block" /> +15 min
          </span>
          <span className="ml-auto text-xs">Click en un artículo para marcarlo como hecho</span>
        </div>

        {/* Orders grid */}
        <div className="flex-1 overflow-y-auto p-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="flex flex-col items-center gap-3">
                <ChefHat className="w-10 h-10 text-primary animate-pulse" />
                <p className="text-muted-foreground">Cargando pedidos...</p>
              </div>
            </div>
          ) : orders.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center mb-4">
                <CheckCircle2 className="w-10 h-10 text-green-500" />
              </div>
              <h2 className="text-xl font-bold text-foreground mb-2">¡Todo al día!</h2>
              <p className="text-muted-foreground">No hay pedidos pendientes en cocina</p>
            </div>
          ) : (() => {
            const pendingOrders = (orders as KitchenOrder[]).filter((o) => o.status === "pending");
            const readyOrders = (orders as KitchenOrder[]).filter((o) => o.status === "ready");
            return (
              <div className="space-y-6">
                {/* Pending section */}
                {pendingOrders.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-2.5 h-2.5 rounded-full bg-orange-400 animate-pulse" />
                      <h2 className="text-sm font-bold text-foreground uppercase tracking-wide">
                        Por preparar
                        <span className="ml-2 text-xs font-normal text-muted-foreground">({pendingOrders.length})</span>
                      </h2>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                      {pendingOrders.map((order) => (
                        <KitchenOrderCard
                          key={order.id}
                          order={order}
                          onDeliver={handleMarkReady}
                          onToggleItem={handleToggleItem}
                          isMarkingReady={markReadyMutation.isPending}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Ready section */}
                {readyOrders.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
                      <h2 className="text-sm font-bold text-green-400 uppercase tracking-wide">
                        Preparados — pendientes de entrega
                        <span className="ml-2 text-xs font-normal text-muted-foreground">({readyOrders.length})</span>
                      </h2>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 opacity-60">
                      {readyOrders.map((order) => (
                        <KitchenOrderCard
                          key={order.id}
                          order={order}
                          onDeliver={handleMarkReady}
                          onToggleItem={handleToggleItem}
                          isMarkingReady={markReadyMutation.isPending}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      </div>
    </AppLayout>
  );
}
