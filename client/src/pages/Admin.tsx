import { useState } from "react";
import { trpc } from "@/lib/trpc";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  ChefHat,
  Edit2,
  Package,
  Plus,
  Settings,
  SlidersHorizontal,
  Tag,
  Trash2,
  Users,
  DollarSign,
  ToggleLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Products Tab ─────────────────────────────────────────────────────────────
function ProductsTab() {
  const utils = trpc.useUtils();
  const { data: categories = [] } = trpc.categories.listAdmin.useQuery();
  const { data: products = [] } = trpc.products.listAdmin.useQuery();
  const [showForm, setShowForm] = useState(false);
  const [editProduct, setEditProduct] = useState<any>(null);
  const [form, setForm] = useState({
    categoryId: "",
    name: "",
    price: "0.00",
    fixedPrice: true,
    requiresKitchen: false,
    requiresTypeInput: false,
    sortOrder: 0,
  });

  const createMutation = trpc.products.create.useMutation({
    onSuccess: () => {
      toast.success("Producto creado");
      setShowForm(false);
      resetForm();
      utils.products.listAdmin.invalidate();
      utils.products.listAll.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const updateMutation = trpc.products.update.useMutation({
    onSuccess: () => {
      toast.success("Producto actualizado");
      setShowForm(false);
      setEditProduct(null);
      utils.products.listAdmin.invalidate();
      utils.products.listAll.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteMutation = trpc.products.delete.useMutation({
    onSuccess: () => {
      toast.success("Producto eliminado");
      utils.products.listAdmin.invalidate();
      utils.products.listAll.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const resetForm = () => {
    setForm({ categoryId: "", name: "", price: "0.00", fixedPrice: true, requiresKitchen: false, requiresTypeInput: false, sortOrder: 0 });
  };

  const openEdit = (p: any) => {
    setEditProduct(p);
    setForm({
      categoryId: String(p.categoryId),
      name: p.name,
      price: p.price,
      fixedPrice: p.fixedPrice,
      requiresKitchen: p.requiresKitchen,
      requiresTypeInput: p.requiresTypeInput,
      sortOrder: p.sortOrder,
    });
    setShowForm(true);
  };

  const handleSubmit = () => {
    if (!form.categoryId || !form.name.trim()) {
      toast.error("Rellena todos los campos obligatorios");
      return;
    }
    if (editProduct) {
      updateMutation.mutate({ id: editProduct.id, ...form, categoryId: parseInt(form.categoryId) });
    } else {
      createMutation.mutate({ ...form, categoryId: parseInt(form.categoryId) });
    }
  };

  const getCategoryName = (id: number) => categories.find((c) => c.id === id)?.name || "—";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-foreground">Productos ({products.length})</h2>
        <Button onClick={() => { resetForm(); setEditProduct(null); setShowForm(true); }} size="sm">
          <Plus className="w-4 h-4 mr-1" /> Nuevo Producto
        </Button>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-secondary/30">
              <th className="text-left px-4 py-3 text-muted-foreground font-medium">Nombre</th>
              <th className="text-left px-4 py-3 text-muted-foreground font-medium">Categoría</th>
              <th className="text-left px-4 py-3 text-muted-foreground font-medium">Precio</th>
              <th className="text-center px-4 py-3 text-muted-foreground font-medium">Cocina</th>
              <th className="text-center px-4 py-3 text-muted-foreground font-medium">Tipo</th>
              <th className="text-center px-4 py-3 text-muted-foreground font-medium">Activo</th>
              <th className="text-right px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id} className={cn("border-b border-border/50 hover:bg-accent/20 transition-colors", !p.active && "opacity-50")}>
                <td className="px-4 py-3 font-medium text-foreground">{p.name}</td>
                <td className="px-4 py-3 text-muted-foreground">{getCategoryName(p.categoryId)}</td>
                <td className="px-4 py-3">
                  {p.fixedPrice ? (
                    <span className="font-semibold text-primary">{parseFloat(p.price).toFixed(2)}€</span>
                  ) : (
                    <Badge variant="outline" className="text-xs">Libre</Badge>
                  )}
                </td>
                <td className="px-4 py-3 text-center">
                  {p.requiresKitchen ? <ChefHat className="w-4 h-4 text-primary mx-auto" /> : <span className="text-muted-foreground">—</span>}
                </td>
                <td className="px-4 py-3 text-center">
                  {p.requiresTypeInput ? <Tag className="w-4 h-4 text-blue-400 mx-auto" /> : <span className="text-muted-foreground">—</span>}
                </td>
                <td className="px-4 py-3 text-center">
                  <div className={cn("w-2 h-2 rounded-full mx-auto", p.active ? "bg-green-500" : "bg-muted-foreground")} />
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button onClick={() => openEdit(p)} className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors">
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`¿Eliminar "${p.name}"?`)) deleteMutation.mutate({ id: p.id });
                      }}
                      className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Form Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editProduct ? "Editar Producto" : "Nuevo Producto"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Categoría *</Label>
              <Select value={form.categoryId} onValueChange={(v) => setForm({ ...form, categoryId: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona categoría" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Nombre *</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Nombre del producto" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Precio (€)</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  disabled={!form.fixedPrice}
                />
              </div>
              <div className="space-y-2">
                <Label>Orden</Label>
                <Input
                  type="number"
                  min="0"
                  value={form.sortOrder}
                  onChange={(e) => setForm({ ...form, sortOrder: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium text-foreground">Precio fijo</p>
                    <p className="text-xs text-muted-foreground">Si está desactivado, pedirá importe al vender</p>
                  </div>
                </div>
                <Switch
                  checked={form.fixedPrice}
                  onCheckedChange={(v) => setForm({ ...form, fixedPrice: v })}
                />
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                <div className="flex items-center gap-2">
                  <ChefHat className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium text-foreground">Requiere cocina</p>
                    <p className="text-xs text-muted-foreground">Aparecerá en la vista de cocina</p>
                  </div>
                </div>
                <Switch
                  checked={form.requiresKitchen}
                  onCheckedChange={(v) => setForm({ ...form, requiresKitchen: v })}
                />
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                <div className="flex items-center gap-2">
                  <Tag className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium text-foreground">Pide tipo</p>
                    <p className="text-xs text-muted-foreground">Pedirá especificar el tipo (ej: pizza)</p>
                  </div>
                </div>
                <Switch
                  checked={form.requiresTypeInput}
                  onCheckedChange={(v) => setForm({ ...form, requiresTypeInput: v })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-2">
              <Button variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
              <Button onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending}>
                {editProduct ? "Guardar" : "Crear"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Categories Tab ───────────────────────────────────────────────────────────
function CategoriesTab() {
  const utils = trpc.useUtils();
  const { data: categories = [] } = trpc.categories.listAdmin.useQuery();
  const [showForm, setShowForm] = useState(false);
  const [editCat, setEditCat] = useState<any>(null);
  const [form, setForm] = useState({ name: "", color: "#6366f1", icon: "utensils", sortOrder: 0 });

  const createMutation = trpc.categories.create.useMutation({
    onSuccess: () => { toast.success("Categoría creada"); setShowForm(false); utils.categories.listAdmin.invalidate(); utils.categories.list.invalidate(); },
    onError: (e) => toast.error(e.message),
  });
  const updateMutation = trpc.categories.update.useMutation({
    onSuccess: () => { toast.success("Categoría actualizada"); setShowForm(false); setEditCat(null); utils.categories.listAdmin.invalidate(); utils.categories.list.invalidate(); },
    onError: (e) => toast.error(e.message),
  });
  const deleteMutation = trpc.categories.delete.useMutation({
    onSuccess: () => { toast.success("Categoría eliminada"); utils.categories.listAdmin.invalidate(); utils.categories.list.invalidate(); },
    onError: (e) => toast.error(e.message),
  });

  const openEdit = (c: any) => {
    setEditCat(c);
    setForm({ name: c.name, color: c.color, icon: c.icon, sortOrder: c.sortOrder });
    setShowForm(true);
  };

  const handleSubmit = () => {
    if (!form.name.trim()) { toast.error("El nombre es obligatorio"); return; }
    if (editCat) {
      updateMutation.mutate({ id: editCat.id, ...form });
    } else {
      createMutation.mutate(form);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-foreground">Categorías ({categories.length})</h2>
        <Button onClick={() => { setForm({ name: "", color: "#6366f1", icon: "utensils", sortOrder: 0 }); setEditCat(null); setShowForm(true); }} size="sm">
          <Plus className="w-4 h-4 mr-1" /> Nueva Categoría
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {categories.map((cat) => (
          <div key={cat.id} className={cn("bg-card border border-border rounded-xl p-4 flex items-center gap-3", !cat.active && "opacity-50")}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${cat.color}30` }}>
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-foreground truncate">{cat.name}</p>
              <p className="text-xs text-muted-foreground">Orden: {cat.sortOrder}</p>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={() => openEdit(cat)} className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors">
                <Edit2 className="w-3.5 h-3.5" />
              </button>
              <button onClick={() => { if (confirm(`¿Eliminar "${cat.name}"?`)) deleteMutation.mutate({ id: cat.id }); }} className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{editCat ? "Editar Categoría" : "Nueva Categoría"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nombre *</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Nombre de la categoría" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Color</Label>
                <div className="flex items-center gap-2">
                  <input type="color" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} className="w-10 h-10 rounded-lg border border-border cursor-pointer" />
                  <Input value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} className="flex-1" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Orden</Label>
                <Input type="number" min="0" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: parseInt(e.target.value) || 0 })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Icono (nombre lucide)</Label>
              <Input value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })} placeholder="ej: sandwich, pizza, cup-soda" />
            </div>
            <div className="grid grid-cols-2 gap-2 pt-2">
              <Button variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
              <Button onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending}>
                {editCat ? "Guardar" : "Crear"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Users Tab ────────────────────────────────────────────────────────────────
function UsersTab() {
  const utils = trpc.useUtils();
  const { data: users = [] } = trpc.adminUsers.list.useQuery();
  const [showForm, setShowForm] = useState(false);
  const [editUser, setEditUser] = useState<any>(null);
  const [form, setForm] = useState({ username: "", password: "", displayName: "", role: "seller" as "admin" | "seller" | "kitchen" });

  const createMutation = trpc.adminUsers.create.useMutation({
    onSuccess: () => { toast.success("Usuario creado"); setShowForm(false); utils.adminUsers.list.invalidate(); },
    onError: (e) => toast.error(e.message),
  });
  const updateMutation = trpc.adminUsers.update.useMutation({
    onSuccess: () => { toast.success("Usuario actualizado"); setShowForm(false); setEditUser(null); utils.adminUsers.list.invalidate(); },
    onError: (e) => toast.error(e.message),
  });

  const openEdit = (u: any) => {
    setEditUser(u);
    setForm({ username: u.username, password: "", displayName: u.displayName, role: u.role });
    setShowForm(true);
  };

  const handleSubmit = () => {
    if (!form.displayName.trim()) { toast.error("El nombre es obligatorio"); return; }
    if (editUser) {
      const data: any = { id: editUser.id, displayName: form.displayName, role: form.role };
      if (form.password.trim()) data.password = form.password;
      updateMutation.mutate(data);
    } else {
      if (!form.username.trim() || !form.password.trim()) { toast.error("Usuario y contraseña son obligatorios"); return; }
      createMutation.mutate(form);
    }
  };

  const ROLE_LABELS: Record<string, string> = { admin: "Administrador", seller: "Vendedor", kitchen: "Cocina" };
  const ROLE_COLORS: Record<string, string> = { admin: "bg-primary/20 text-primary", seller: "bg-blue-500/20 text-blue-400", kitchen: "bg-orange-500/20 text-orange-400" };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-foreground">Usuarios ({users.length})</h2>
        <Button onClick={() => { setForm({ username: "", password: "", displayName: "", role: "seller" }); setEditUser(null); setShowForm(true); }} size="sm">
          <Plus className="w-4 h-4 mr-1" /> Nuevo Usuario
        </Button>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-secondary/30">
              <th className="text-left px-4 py-3 text-muted-foreground font-medium">Usuario</th>
              <th className="text-left px-4 py-3 text-muted-foreground font-medium">Nombre</th>
              <th className="text-left px-4 py-3 text-muted-foreground font-medium">Rol</th>
              <th className="text-center px-4 py-3 text-muted-foreground font-medium">Activo</th>
              <th className="text-right px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className={cn("border-b border-border/50 hover:bg-accent/20 transition-colors", !u.active && "opacity-50")}>
                <td className="px-4 py-3 font-mono text-sm text-foreground">{u.username}</td>
                <td className="px-4 py-3 font-medium text-foreground">{u.displayName}</td>
                <td className="px-4 py-3">
                  <span className={cn("px-2 py-0.5 rounded-full text-xs font-semibold", ROLE_COLORS[u.role])}>
                    {ROLE_LABELS[u.role]}
                  </span>
                </td>
                <td className="px-4 py-3 text-center">
                  <div className={cn("w-2 h-2 rounded-full mx-auto", u.active ? "bg-green-500" : "bg-muted-foreground")} />
                </td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => openEdit(u)} className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors">
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{editUser ? "Editar Usuario" : "Nuevo Usuario"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {!editUser && (
              <div className="space-y-2">
                <Label>Usuario *</Label>
                <Input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} placeholder="nombre_usuario" />
              </div>
            )}
            <div className="space-y-2">
              <Label>Nombre visible *</Label>
              <Input value={form.displayName} onChange={(e) => setForm({ ...form, displayName: e.target.value })} placeholder="Nombre que aparece en la app" />
            </div>
            <div className="space-y-2">
              <Label>{editUser ? "Nueva contraseña (dejar vacío para no cambiar)" : "Contraseña *"}</Label>
              <Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder={editUser ? "Nueva contraseña..." : "Contraseña"} />
            </div>
            <div className="space-y-2">
              <Label>Rol</Label>
              <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v as any })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="seller">Vendedor</SelectItem>
                  <SelectItem value="kitchen">Cocina</SelectItem>
                  <SelectItem value="admin">Administrador</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-2">
              <Button variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
              <Button onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending}>
                {editUser ? "Guardar" : "Crear"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Modifiers Tab ───────────────────────────────────────────────────────────
function ModifiersTab() {
  const utils = trpc.useUtils();
  const { data: products = [] } = trpc.products.listAll.useQuery();
  const { data: modifiers = [] } = trpc.modifiers.listAdmin.useQuery();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ productId: "", label: "", sortOrder: 0 });

  const createMutation = trpc.modifiers.create.useMutation({
    onSuccess: () => {
      toast.success("Modificador creado");
      setShowForm(false);
      setForm({ productId: "", label: "", sortOrder: 0 });
      utils.modifiers.listAdmin.invalidate();
      utils.modifiers.byProduct.invalidate();
      utils.modifiers.forProducts.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteMutation = trpc.modifiers.delete.useMutation({
    onSuccess: () => {
      toast.success("Modificador eliminado");
      utils.modifiers.listAdmin.invalidate();
      utils.modifiers.byProduct.invalidate();
      utils.modifiers.forProducts.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const getProductName = (id: number) => products.find((p) => p.id === id)?.name || "—";

  // Group modifiers by product
  const byProduct = modifiers.reduce<Record<number, typeof modifiers>>((acc, m) => {
    if (!acc[m.productId]) acc[m.productId] = [];
    acc[m.productId].push(m);
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-foreground">Modificadores ({modifiers.length})</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Opciones rápidas de personalización que aparecen en el botón ✏️ del vendedor</p>
        </div>
        <Button onClick={() => setShowForm(true)} size="sm">
          <Plus className="w-4 h-4 mr-1" /> Nuevo Modificador
        </Button>
      </div>

      {Object.keys(byProduct).length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-8 text-center">
          <SlidersHorizontal className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground">No hay modificadores todavía</p>
          <p className="text-xs text-muted-foreground/60 mt-1">Crea modificadores para que los vendedores puedan personalizar bocadillos (ej: Sin queso, Sin bacon)</p>
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(byProduct).map(([productIdStr, mods]) => {
            const productId = parseInt(productIdStr);
            return (
              <div key={productId} className="bg-card border border-border rounded-xl overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-3 bg-secondary/30 border-b border-border">
                  <SlidersHorizontal className="w-4 h-4 text-amber-400" />
                  <span className="font-semibold text-foreground">{getProductName(productId)}</span>
                  <Badge variant="outline" className="text-xs ml-auto">{mods.length} opciones</Badge>
                </div>
                <div className="p-3 flex flex-wrap gap-2">
                  {mods.map((mod) => (
                    <div key={mod.id} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary border border-border text-sm">
                      <span className="text-foreground">{mod.label}</span>
                      <button
                        onClick={() => { if (confirm(`¿Eliminar "${mod.label}"?`)) deleteMutation.mutate({ id: mod.id }); }}
                        className="text-muted-foreground hover:text-destructive transition-colors ml-1"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-amber-400" />
              Nuevo Modificador
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Producto *</Label>
              <Select value={form.productId} onValueChange={(v) => setForm({ ...form, productId: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona producto" />
                </SelectTrigger>
                <SelectContent>
                  {products.map((p) => (
                    <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Etiqueta del modificador *</Label>
              <Input
                value={form.label}
                onChange={(e) => setForm({ ...form, label: e.target.value })}
                placeholder="Ej: Sin queso, Sin bacon, Sin tomate..."
                onKeyDown={(e) => e.key === "Enter" && form.productId && form.label.trim() && createMutation.mutate({ productId: parseInt(form.productId), label: form.label.trim(), sortOrder: form.sortOrder })}
              />
            </div>
            <div className="space-y-2">
              <Label>Orden (opcional)</Label>
              <Input
                type="number"
                min="0"
                value={form.sortOrder}
                onChange={(e) => setForm({ ...form, sortOrder: parseInt(e.target.value) || 0 })}
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
              <Button
                onClick={() => {
                  if (!form.productId || !form.label.trim()) { toast.error("Rellena todos los campos"); return; }
                  createMutation.mutate({ productId: parseInt(form.productId), label: form.label.trim(), sortOrder: form.sortOrder });
                }}
                disabled={createMutation.isPending}
              >
                Crear Modificador
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Main Admin Page ──────────────────────────────────────────────────────────
export default function Admin() {
  const buildDate = new Date().toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit", year: "numeric" });

  return (
    <AppLayout>
      <div className="flex flex-col h-screen overflow-hidden">
        {/* Header */}
        <div className="h-14 flex items-center px-4 border-b border-border bg-card/50 backdrop-blur-sm shrink-0">
          <Settings className="w-5 h-5 text-primary mr-2" />
          <h1 className="text-lg font-bold text-foreground">Administración</h1>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="max-w-5xl mx-auto">
            <Tabs defaultValue="products">
              <TabsList className="mb-6 bg-secondary">
                <TabsTrigger value="products" className="flex items-center gap-2">
                  <Package className="w-4 h-4" /> Productos
                </TabsTrigger>
                <TabsTrigger value="categories" className="flex items-center gap-2">
                  <Tag className="w-4 h-4" /> Categorías
                </TabsTrigger>
                <TabsTrigger value="users" className="flex items-center gap-2">
                  <Users className="w-4 h-4" /> Usuarios
                </TabsTrigger>
                <TabsTrigger value="modifiers" className="flex items-center gap-2">
                  <SlidersHorizontal className="w-4 h-4" /> Modificadores
                </TabsTrigger>
              </TabsList>

              <TabsContent value="products">
                <ProductsTab />
              </TabsContent>
              <TabsContent value="categories">
                <CategoriesTab />
              </TabsContent>
              <TabsContent value="users">
                <UsersTab />
              </TabsContent>
              <TabsContent value="modifiers">
                <ModifiersTab />
              </TabsContent>
            </Tabs>

            {/* Version info */}
            <div className="mt-8 text-right">
              <p className="text-xs text-muted-foreground/50">
                Versión v1.0 · {buildDate} · TakeAway Manager
              </p>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
