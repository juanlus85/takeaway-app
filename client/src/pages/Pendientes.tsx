import { trpc } from "@/lib/trpc";
import AppLayout from "@/components/AppLayout";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { CheckCircle2, ClipboardList, Clock, Package, User } from "lucide-react";
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

type PendingOrder = {
  id: number;
  callerNumber: number | null;
  sellerName: string;
  total: string;
  status: string;
  paidAt: Date;
  requiresKitchen: boolean;
  items: OrderItem[];
};

function formatTime(date: Date) {
  return new Date(date).toLocaleTimeString("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getElapsedMinutes(date: Date) {
  return Math.floor((Date.now() - new Date(date).getTime()) / 60000);
}

export default function Pendientes() {
  const { user } = useAuth();
  const utils = trpc.useUtils();

  const { data: orders = [], isLoading } = trpc.orders.pending.useQuery(undefined, {
    refetchInterval: 10000,
    enabled: !!user,
  });

  const deliverMutation = trpc.orders.deliver.useMutation({
    onSuccess: () => {
      toast.success("Pedido entregado al cliente", { duration: 2000 });
      utils.orders.pending.invalidate();
      utils.callers.available.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const pendingOrders = orders as PendingOrder[];

  return (
    <AppLayout>
      <div className="flex flex-col h-screen overflow-hidden">
        {/* Header */}
        <div className="h-14 flex items-center px-4 border-b border-border bg-card/50 backdrop-blur-sm shrink-0">
          <ClipboardList className="w-5 h-5 text-primary mr-2" />
          <h1 className="text-lg font-bold text-foreground">Pedidos Pendientes</h1>
          <div className="ml-auto flex items-center gap-3">
            {pendingOrders.length > 0 && (
              <Badge className="text-sm px-3 py-1 bg-primary text-primary-foreground">
                {pendingOrders.length} pendiente{pendingOrders.length !== 1 ? "s" : ""}
              </Badge>
            )}
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              Actualización automática
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="flex flex-col items-center gap-3">
                <ClipboardList className="w-10 h-10 text-primary animate-pulse" />
                <p className="text-muted-foreground">Cargando pedidos...</p>
              </div>
            </div>
          ) : pendingOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center mb-4">
                <CheckCircle2 className="w-10 h-10 text-green-500" />
              </div>
              <h2 className="text-xl font-bold text-foreground mb-2">Sin pedidos pendientes</h2>
              <p className="text-muted-foreground">Todos los pedidos han sido entregados</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {pendingOrders.map((order) => {
                const elapsed = getElapsedMinutes(order.paidAt);
                return (
                  <div
                    key={order.id}
                    className="bg-card border border-border rounded-2xl overflow-hidden shadow-md hover:shadow-lg transition-shadow"
                  >
                    {/* Card header */}
                    <div className="flex items-center justify-between px-4 py-3 bg-secondary/30 border-b border-border">
                      {/* Caller number */}
                      {order.callerNumber ? (
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center shadow-md shadow-primary/30">
                            <span className="text-xl font-black text-primary-foreground caller-badge">
                              {order.callerNumber}
                            </span>
                          </div>
                          <div>
                            <p className="text-xs font-medium text-foreground">Llamador</p>
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
                            <p className="text-xs font-medium text-foreground">Sin llamador</p>
                            <p className="text-xs text-muted-foreground">{order.sellerName}</p>
                          </div>
                        </div>
                      )}

                      {/* Time */}
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground flex items-center gap-1 justify-end">
                          <Clock className="w-3 h-3" />
                          {formatTime(order.paidAt)}
                        </p>
                        <p
                          className={cn(
                            "text-xs font-semibold",
                            elapsed >= 15
                              ? "text-red-400"
                              : elapsed >= 10
                              ? "text-orange-400"
                              : elapsed >= 6
                              ? "text-yellow-400"
                              : "text-green-400"
                          )}
                        >
                          {elapsed} min
                        </p>
                      </div>
                    </div>

                    {/* Items */}
                    <div className="p-4 space-y-1.5">
                      {order.items.map((item) => (
                        <div key={item.id} className="flex items-start gap-2">
                          <div
                            className={cn(
                              "w-1.5 h-1.5 rounded-full mt-1.5 shrink-0",
                              item.requiresKitchen ? "bg-primary" : "bg-muted-foreground"
                            )}
                          />
                          <p className="text-sm text-foreground">
                            {item.quantity > 1 && (
                              <span className="font-bold text-primary mr-1">{item.quantity}×</span>
                            )}
                            {item.productName}
                            {item.typeNote && (
                              <span className="text-xs text-muted-foreground ml-1">({item.typeNote})</span>
                            )}
                          </p>
                        </div>
                      ))}
                    </div>

                    {/* Footer */}
                    <div className="px-4 pb-4 flex items-center justify-between">
                      <span className="text-sm font-bold text-primary">{parseFloat(order.total).toFixed(2)}€</span>
                      <Button
                        size="sm"
                        onClick={() => deliverMutation.mutate({ orderId: order.id })}
                        disabled={deliverMutation.isPending}
                        className="font-semibold"
                      >
                        <CheckCircle2 className="w-4 h-4 mr-1.5" />
                        Entregado
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
