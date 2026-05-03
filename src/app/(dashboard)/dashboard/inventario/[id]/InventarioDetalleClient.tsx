"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { Inventory } from "@/types/database";
import { toast, ConfirmDialog } from "@/components/ui";
import { updateInventoryItem, deleteInventoryItem, adjustStock } from "../actions";

export interface StockMovement {
  id: string;
  quantity: number;
  unit_price: number;
  total: number;
  created_at: string;
  work_order_id: string | null;
  work_order_description: string | null;
  work_order_status: string | null;
  work_order_received_at: string | null;
  client_name: string | null;
  vehicle_label: string | null;
}

// ── Icons ──────────────────────────────────────────────────────────────────

function IconPencil() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
    </svg>
  );
}

function IconTrash() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  );
}

function IconX() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

function IconPlus() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
  );
}

function IconMinus() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M20 12H4" />
    </svg>
  );
}

function IconChevronDown() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  );
}

function IconSpinner() {
  return (
    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
    </svg>
  );
}

function IconAlertTriangle() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
    </svg>
  );
}

// ── Helpers ────────────────────────────────────────────────────────────────

type StockStatus = "ok" | "bajo" | "agotado";

function getStockStatus(item: Inventory): StockStatus {
  if (item.quantity === 0) return "agotado";
  if (item.quantity < item.min_stock) return "bajo";
  return "ok";
}

const fmt = (n: number | null) =>
  n != null ? `$${n.toLocaleString("es-MX", { minimumFractionDigits: 2 })}` : "—";

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString("es-MX", { day: "2-digit", month: "long", year: "numeric" });

const inputClass =
  "w-full bg-[#1a1a2e] border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-[#e94560]/60 focus:ring-1 focus:ring-[#e94560]/30 transition-colors";
const selectClass =
  "w-full bg-[#1a1a2e] border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#e94560]/60 focus:ring-1 focus:ring-[#e94560]/30 transition-colors appearance-none";

const CATEGORIES = ["Filtros", "Frenos", "Encendido", "Lubricantes", "Suspension", "Motor", "Electrico", "Carroceria", "Otro"];

// ── Edit Modal ─────────────────────────────────────────────────────────────

interface EditForm {
  name: string; sku: string; category: string; brand: string;
  quantity: string; min_stock: string; cost_price: string;
  sell_price: string; location: string; supplier: string;
}

function EditModal({ item, onClose, onSaved }: { item: Inventory; onClose: () => void; onSaved: (updated: Inventory) => void }) {
  const [form, setForm] = useState<EditForm>({
    name: item.name,
    sku: item.sku,
    category: item.category ?? "",
    brand: item.brand ?? "",
    quantity: String(item.quantity),
    min_stock: String(item.min_stock),
    cost_price: item.cost_price != null ? String(item.cost_price) : "",
    sell_price: String(item.sell_price),
    location: item.location ?? "",
    supplier: item.supplier ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Partial<EditForm>>({});

  function set(field: keyof EditForm, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
    setErrors((e) => ({ ...e, [field]: undefined }));
  }

  function validate(): boolean {
    const e: Partial<EditForm> = {};
    if (!form.name.trim()) e.name = "Requerido";
    if (!form.sku.trim()) e.sku = "Requerido";
    if (!form.category) e.category = "Requerido";
    if (!form.quantity || isNaN(Number(form.quantity))) e.quantity = "Número válido";
    if (!form.min_stock || isNaN(Number(form.min_stock))) e.min_stock = "Número válido";
    if (!form.sell_price || isNaN(Number(form.sell_price))) e.sell_price = "Número válido";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      await updateInventoryItem(item.id, {
        name: form.name.trim(),
        sku: form.sku.trim(),
        category: form.category,
        brand: form.brand.trim(),
        quantity: Number(form.quantity),
        min_stock: Number(form.min_stock),
        cost_price: form.cost_price ? Number(form.cost_price) : null,
        sell_price: Number(form.sell_price),
        location: form.location.trim(),
        supplier: form.supplier.trim(),
        compatible_brands: item.compatible_brands ?? [],
      });
      toast("Repuesto actualizado correctamente", "success");
      onSaved({
        ...item,
        name: form.name.trim(),
        sku: form.sku.trim().toUpperCase(),
        category: form.category || null,
        brand: form.brand.trim() || null,
        quantity: Number(form.quantity),
        min_stock: Number(form.min_stock),
        cost_price: form.cost_price ? Number(form.cost_price) : null,
        sell_price: Number(form.sell_price),
        location: form.location.trim() || null,
        supplier: form.supplier.trim() || null,
      });
    } catch {
      toast("Error al actualizar el repuesto", "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[#16213e] border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <h2 className="text-white font-semibold text-lg">Editar repuesto</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors" aria-label="Cerrar">
            <IconX />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4 max-h-[80vh] overflow-y-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Nombre <span className="text-[#e94560]">*</span></label>
              <input className={inputClass} value={form.name} onChange={(e) => set("name", e.target.value)} />
              {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">SKU <span className="text-[#e94560]">*</span></label>
              <input className={inputClass} value={form.sku} onChange={(e) => set("sku", e.target.value)} />
              {errors.sku && <p className="text-red-400 text-xs mt-1">{errors.sku}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Categoría <span className="text-[#e94560]">*</span></label>
              <div className="relative">
                <select className={selectClass} value={form.category} onChange={(e) => set("category", e.target.value)}>
                  <option value="">Seleccionar</option>
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-gray-500"><IconChevronDown /></div>
              </div>
              {errors.category && <p className="text-red-400 text-xs mt-1">{errors.category}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Marca</label>
              <input className={inputClass} value={form.brand} onChange={(e) => set("brand", e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Cantidad <span className="text-[#e94560]">*</span></label>
              <input type="number" min="0" className={inputClass} value={form.quantity} onChange={(e) => set("quantity", e.target.value)} />
              {errors.quantity && <p className="text-red-400 text-xs mt-1">{errors.quantity}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Stock mínimo <span className="text-[#e94560]">*</span></label>
              <input type="number" min="0" className={inputClass} value={form.min_stock} onChange={(e) => set("min_stock", e.target.value)} />
              {errors.min_stock && <p className="text-red-400 text-xs mt-1">{errors.min_stock}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Precio costo</label>
              <input type="number" min="0" step="0.01" className={inputClass} value={form.cost_price} onChange={(e) => set("cost_price", e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Precio venta <span className="text-[#e94560]">*</span></label>
              <input type="number" min="0" step="0.01" className={inputClass} value={form.sell_price} onChange={(e) => set("sell_price", e.target.value)} />
              {errors.sell_price && <p className="text-red-400 text-xs mt-1">{errors.sell_price}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Ubicación</label>
              <input className={inputClass} value={form.location} onChange={(e) => set("location", e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Proveedor</label>
              <input className={inputClass} value={form.supplier} onChange={(e) => set("supplier", e.target.value)} />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 rounded-lg border border-white/10 text-gray-400 text-sm hover:text-white hover:border-white/20 transition-colors">
              Cancelar
            </button>
            <button type="submit" disabled={saving} className="flex-1 inline-flex items-center justify-center gap-2 bg-[#e94560] hover:bg-[#c73652] disabled:opacity-60 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors">
              {saving ? <><IconSpinner /> Guardando…</> : "Guardar cambios"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────

const WO_STATUS_LABELS: Record<string, string> = {
  received: "Recibido",
  diagnosing: "Diagnóstico",
  repairing: "En reparación",
  ready: "Listo",
  delivered: "Entregado",
};

const WO_STATUS_COLORS: Record<string, string> = {
  received: "bg-gray-500/20 text-gray-300",
  diagnosing: "bg-yellow-500/20 text-yellow-300",
  repairing: "bg-blue-500/20 text-blue-300",
  ready: "bg-green-500/20 text-green-300",
  delivered: "bg-gray-600/20 text-gray-500",
};

export default function InventarioDetalleClient({ item: initialItem, stockMovements = [] }: { item: Inventory; stockMovements?: StockMovement[] }) {
  const router = useRouter();
  const [item, setItem] = useState<Inventory>(initialItem);
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [stockBusy, setStockBusy] = useState(false);
  const [, startTransition] = useTransition();

  const status = getStockStatus(item);
  const stockBadge = {
    ok:      { label: "Stock OK",  className: "bg-green-500/20 text-green-300" },
    bajo:    { label: "Stock bajo", className: "bg-yellow-500/20 text-yellow-300" },
    agotado: { label: "Agotado",   className: "bg-red-500/20 text-red-300" },
  }[status];

  async function handleAdjust(delta: number) {
    if (stockBusy) return;
    setStockBusy(true);
    try {
      const newQty = await adjustStock(item.id, delta);
      setItem((prev) => ({ ...prev, quantity: newQty }));
    } catch {
      toast("Error al ajustar el stock", "error");
    } finally {
      setStockBusy(false);
    }
  }

  function handleDeleteConfirm() {
    setShowDelete(false);
    startTransition(async () => {
      try {
        await deleteInventoryItem(item.id);
        toast(`"${item.name}" eliminado`, "success");
        router.push("/dashboard/inventario");
      } catch {
        toast("Error al eliminar el repuesto", "error");
      }
    });
  }

  const margin =
    item.cost_price != null && item.cost_price > 0
      ? (((item.sell_price - item.cost_price) / item.cost_price) * 100).toFixed(1)
      : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold text-white">{item.name}</h1>
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${stockBadge.className}`}>
              {status !== "ok" && <IconAlertTriangle />}
              {stockBadge.label}
            </span>
          </div>
          <p className="text-gray-500 text-sm font-mono">{item.sku}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowEdit(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-white/10 text-gray-300 text-sm hover:text-white hover:border-white/20 transition-colors"
          >
            <IconPencil /> Editar
          </button>
          <button
            onClick={() => setShowDelete(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-red-500/30 text-red-400 text-sm hover:bg-red-500/10 transition-colors"
          >
            <IconTrash /> Eliminar
          </button>
        </div>
      </div>

      {/* Cards grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Stock */}
        <div className="bg-[#16213e] border border-white/10 rounded-xl p-5 space-y-4">
          <h2 className="text-gray-400 text-xs font-semibold uppercase tracking-wide">Stock</h2>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-3xl font-bold text-white tabular-nums">{item.quantity}</p>
              <p className="text-gray-500 text-xs mt-0.5">mínimo: {item.min_stock}</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleAdjust(-1)}
                disabled={stockBusy || item.quantity === 0}
                className="w-9 h-9 rounded-lg flex items-center justify-center border border-white/10 text-gray-400 hover:text-white hover:border-white/20 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                aria-label="Reducir stock"
              >
                <IconMinus />
              </button>
              <button
                onClick={() => handleAdjust(1)}
                disabled={stockBusy}
                className="w-9 h-9 rounded-lg flex items-center justify-center border border-white/10 text-gray-400 hover:text-white hover:border-white/20 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                aria-label="Aumentar stock"
              >
                <IconPlus />
              </button>
            </div>
          </div>
        </div>

        {/* Precios */}
        <div className="bg-[#16213e] border border-white/10 rounded-xl p-5 space-y-3">
          <h2 className="text-gray-400 text-xs font-semibold uppercase tracking-wide">Precios</h2>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-gray-500 text-sm">Venta</span>
              <span className="text-white font-semibold">{fmt(item.sell_price)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-500 text-sm">Costo</span>
              <span className="text-gray-300">{fmt(item.cost_price)}</span>
            </div>
            {margin != null && (
              <div className="flex justify-between items-center pt-1 border-t border-white/5">
                <span className="text-gray-500 text-sm">Margen</span>
                <span className="text-green-400 font-medium">{margin}%</span>
              </div>
            )}
          </div>
        </div>

        {/* Detalles */}
        <div className="bg-[#16213e] border border-white/10 rounded-xl p-5 space-y-3">
          <h2 className="text-gray-400 text-xs font-semibold uppercase tracking-wide">Detalles</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between gap-2">
              <span className="text-gray-500">Categoría</span>
              <span className="text-gray-300 text-right">{item.category ?? <span className="text-gray-600">—</span>}</span>
            </div>
            <div className="flex justify-between gap-2">
              <span className="text-gray-500">Marca</span>
              <span className="text-gray-300 text-right">{item.brand ?? <span className="text-gray-600">—</span>}</span>
            </div>
            <div className="flex justify-between gap-2">
              <span className="text-gray-500">Ubicación</span>
              <span className="text-gray-300 text-right">{item.location ?? <span className="text-gray-600">—</span>}</span>
            </div>
            <div className="flex justify-between gap-2">
              <span className="text-gray-500">Proveedor</span>
              <span className="text-gray-300 text-right">{item.supplier ?? <span className="text-gray-600">—</span>}</span>
            </div>
            <div className="flex justify-between gap-2 pt-1 border-t border-white/5">
              <span className="text-gray-500">Registrado</span>
              <span className="text-gray-400 text-right text-xs">{fmtDate(item.created_at)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stock movements */}
      <div className="bg-[#16213e] border border-white/10 rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-gray-400 text-xs font-semibold uppercase tracking-wide">
            Movimientos de stock
          </h2>
          {stockMovements.length > 0 && (
            <span className="text-xs text-gray-500">
              {stockMovements.length} uso{stockMovements.length !== 1 ? "s" : ""} registrado{stockMovements.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>

        {stockMovements.length === 0 ? (
          <p className="text-gray-600 text-sm py-4 text-center">
            Este repuesto no ha sido utilizado en ninguna orden de trabajo.
          </p>
        ) : (
          <div className="overflow-x-auto -mx-1">
            <table className="w-full text-sm min-w-[580px]">
              <thead>
                <tr className="text-gray-500 text-xs uppercase tracking-wide border-b border-white/5">
                  <th className="text-left pb-3 px-1 font-medium">Orden / Cliente</th>
                  <th className="text-left pb-3 px-1 font-medium">Vehículo</th>
                  <th className="text-left pb-3 px-1 font-medium">Estado</th>
                  <th className="text-right pb-3 px-1 font-medium">Cant.</th>
                  <th className="text-right pb-3 px-1 font-medium">Total</th>
                  <th className="text-right pb-3 px-1 font-medium">Fecha</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {stockMovements.map((mov) => {
                  const woStatus = mov.work_order_status ?? "received";
                  return (
                    <tr key={mov.id} className="hover:bg-white/[0.03] transition-colors group">
                      <td className="py-3 px-1">
                        {mov.work_order_id ? (
                          <Link href={`/dashboard/ordenes/${mov.work_order_id}`} className="block">
                            <p className="text-[#e94560] font-mono text-xs group-hover:underline">
                              OT-{mov.work_order_id.slice(0, 6).toUpperCase()}
                            </p>
                            <p className="text-white text-sm mt-0.5 truncate max-w-[180px]">
                              {mov.client_name ?? "—"}
                            </p>
                          </Link>
                        ) : (
                          <span className="text-gray-600 text-xs">Sin orden</span>
                        )}
                      </td>
                      <td className="py-3 px-1">
                        <span className="text-gray-300 text-sm truncate block max-w-[160px]">
                          {mov.vehicle_label ?? "—"}
                        </span>
                      </td>
                      <td className="py-3 px-1">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${WO_STATUS_COLORS[woStatus] ?? "bg-gray-500/20 text-gray-300"}`}>
                          {WO_STATUS_LABELS[woStatus] ?? woStatus}
                        </span>
                      </td>
                      <td className="py-3 px-1 text-right">
                        <span className="text-orange-400 font-medium">-{mov.quantity}</span>
                      </td>
                      <td className="py-3 px-1 text-right">
                        <span className="text-gray-300">{fmt(mov.total)}</span>
                      </td>
                      <td className="py-3 px-1 text-right">
                        <span className="text-gray-500 text-xs">
                          {fmtDate(mov.work_order_received_at ?? mov.created_at)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Summary row */}
            <div className="flex items-center justify-between pt-3 mt-1 border-t border-white/10 px-1">
              <span className="text-gray-500 text-xs">
                Total consumido: <span className="text-orange-400 font-medium">{stockMovements.reduce((s, m) => s + m.quantity, 0)} uds.</span>
              </span>
              <span className="text-gray-500 text-xs">
                Valor total: <span className="text-white font-medium">{fmt(stockMovements.reduce((s, m) => s + m.total, 0))}</span>
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Compatible brands */}
      {item.compatible_brands && item.compatible_brands.length > 0 && (
        <div className="bg-[#16213e] border border-white/10 rounded-xl p-5 space-y-3">
          <h2 className="text-gray-400 text-xs font-semibold uppercase tracking-wide">Compatible con</h2>
          <div className="flex flex-wrap gap-2">
            {item.compatible_brands.map((brand) => (
              <span key={brand} className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-[#e94560]/15 text-[#e94560] font-medium">
                {brand}
              </span>
            ))}
          </div>
        </div>
      )}

      {showEdit && (
        <EditModal
          item={item}
          onClose={() => setShowEdit(false)}
          onSaved={(updated) => { setItem(updated); setShowEdit(false); }}
        />
      )}

      {showDelete && (
        <ConfirmDialog
          title="Eliminar repuesto"
          message={`¿Seguro que deseas eliminar "${item.name}"? Esta acción no se puede deshacer.`}
          confirmLabel="Eliminar"
          danger
          onConfirm={handleDeleteConfirm}
          onCancel={() => setShowDelete(false)}
        />
      )}
    </div>
  );
}
