import { useState } from "react";
import { trpc } from "@/lib/trpc";
import AppLayout from "@/components/AppLayout";
import { useAuth } from "@/_core/hooks/useAuth";
import { Badge } from "@/components/ui/badge";
import { History, ChevronDown, ChevronUp, User, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

type OrderItem = {
  id: number;
  productName: string;
  categoryName: string;
  price: string;
  quantity: number;
  typeNote: string | null;
};

type HistoryOrder = {
  id: number;
  callerNumber: number | null;
  sellerName: string;
  total: string;
  status: string;
  paidAt: Date;
  deliveredAt: Date | null;
  items: OrderItem[];
};

function formatDateTime(date: Date | null) {
  if (!date) return "-";
  return new Date(date).toLocaleString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function OrderRow({ order }: { order: HistoryOrder }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden transition-all">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-4 px-4 py-3 hover:bg-accent/30 transition-colors text-left"
      >
        {/* Caller */}
        <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center shrink-0">
          {order.callerNumber ? (
            <span className="text-sm font-black text-foreground caller-badge">{order.callerNumber}</span>
          ) : (
            <span className="text-xs text-muted-foreground">—</span>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-foreground">Pedido #{order.id}</span>
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <User className="w-3 h-3" />
              {order.sellerName}
            </span>
          </div>
          <div className="flex items-center gap-3 mt-0.5">
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {formatDateTime(order.paidAt)}
            </span>
            <span className="text-xs text-green-400">
              Entregado: {formatDateTime(order.deliveredAt)}
            </span>
          </div>
        </div>

        {/* Total */}
        <div className="flex items-center gap-3">
          <span className="text-base font-bold text-primary">{parseFloat(order.total).toFixed(2)}€</span>
          <Badge variant="secondary" className="text-xs">
            {order.items.length} art.
          </Badge>
          {expanded ? (
            <ChevronUp className="w-4 h-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          )}
        </div>
      </button>

      {/* Expanded items */}
      {expanded && (
        <div className="px-4 pb-3 border-t border-border/50 bg-secondary/20">
          <div className="pt-3 space-y-1.5">
            {order.items.map((item) => (
              <div key={item.id} className="flex justify-between text-sm">
                <span className="text-foreground">
                  {item.quantity > 1 && (
                    <span className="font-bold text-primary mr-1">{item.quantity}×</span>
                  )}
                  {item.productName}
                  {item.typeNote && (
                    <span className="text-xs text-muted-foreground ml-1">({item.typeNote})</span>
                  )}
                </span>
                <span className="text-muted-foreground">
                  {(parseFloat(item.price) * item.quantity).toFixed(2)}€
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function Historial() {
  const { user } = useAuth();
  const { data: orders = [], isLoading } = trpc.orders.history.useQuery({ limit: 200 }, { enabled: !!user });

  const historyOrders = orders as HistoryOrder[];

  // Group by date
  const grouped = historyOrders.reduce<Record<string, HistoryOrder[]>>((acc, order) => {
    const date = new Date(order.deliveredAt || order.paidAt).toLocaleDateString("es-ES", {
      weekday: "long",
      day: "2-digit",
      month: "long",
    });
    if (!acc[date]) acc[date] = [];
    acc[date].push(order);
    return acc;
  }, {});

  const totalRevenue = historyOrders.reduce((s, o) => s + parseFloat(o.total), 0);

  return (
    <AppLayout>
      <div className="flex flex-col h-screen overflow-hidden">
        {/* Header */}
        <div className="h-14 flex items-center px-4 border-b border-border bg-card/50 backdrop-blur-sm shrink-0">
          <History className="w-5 h-5 text-primary mr-2" />
          <h1 className="text-lg font-bold text-foreground">Historial de Pedidos</h1>
          <div className="ml-auto flex items-center gap-4">
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Total recaudado</p>
              <p className="text-sm font-bold text-primary">{totalRevenue.toFixed(2)}€</p>
            </div>
            <Badge variant="secondary" className="text-sm">
              {historyOrders.length} pedidos
            </Badge>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <History className="w-10 h-10 text-primary animate-pulse" />
            </div>
          ) : historyOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <History className="w-12 h-12 text-muted-foreground/30 mb-4" />
              <h2 className="text-xl font-bold text-foreground mb-2">Sin historial</h2>
              <p className="text-muted-foreground">Los pedidos entregados aparecerán aquí</p>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto space-y-6">
              {Object.entries(grouped).map(([date, dayOrders]) => (
                <div key={date}>
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-sm font-semibold text-muted-foreground capitalize">{date}</h2>
                    <span className="text-xs text-primary font-semibold">
                      {dayOrders.reduce((s, o) => s + parseFloat(o.total), 0).toFixed(2)}€
                    </span>
                  </div>
                  <div className="space-y-2">
                    {dayOrders.map((order) => (
                      <OrderRow key={order.id} order={order} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
