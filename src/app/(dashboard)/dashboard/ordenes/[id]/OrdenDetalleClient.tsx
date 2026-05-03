"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { WorkOrderWithRelations, WorkOrderStatus, WorkOrderItemType } from "@/types/database";
import {
  advanceWorkOrderStatus,
  addWorkOrderItem,
  removeWorkOrderItem,
  generateInvoiceFromWorkOrder,
  updateWorkOrderNotes,
  reassignMechanic,
} from "../actions";
import PrintButton from "./PrintButton";
import WhatsAppButton from "./WhatsAppButton";

const STATUS_STEPS: WorkOrderStatus[] = ["received", "diagnosing", "repairing", "ready", "delivered"];

const STATUS_LABELS: Record<WorkOrderStatus, string> = {
  received: "Recibido",
  diagnosing: "Diagnóstico",
  repairing: "En reparación",
  ready: "Listo",
  delivered: "Entregado",
};

const STATUS_COLORS: Record<WorkOrderStatus, string> = {
  received: "bg-gray-500/20 text-gray-300",
  diagnosing: "bg-yellow-500/20 text-yellow-300",
  repairing: "bg-blue-500/20 text-blue-300",
  ready: "bg-green-500/20 text-green-300",
  delivered: "bg-gray-600/20 text-gray-500",
};

const NEXT_STATUS_LABEL: Partial<Record<WorkOrderStatus, string>> = {
  received: "Iniciar diagnóstico",
  diagnosing: "Iniciar reparación",
  repairing: "Marcar como listo",
  ready: "Registrar entrega",
};

const inputClass =
  "w-full bg-[#1a1a2e] border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-[#e94560]/60 focus:ring-1 focus:ring-[#e94560]/30 transition-colors";

const selectClass =
  "w-full bg-[#1a1a2e] border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#e94560]/60 focus:ring-1 focus:ring-[#e94560]/30 transition-colors appearance-none";

function IconArrowLeft() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
    </svg>
  );
}

function IconChevronDown() {
  return (
    <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
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

function IconCheck() {
  return (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
    </svg>
  );
}

function IconCar() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
        d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
    </svg>
  );
}

function IconUser() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
        d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
    </svg>
  );
}

function IconWrench() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
        d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437l1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008z" />
    </svg>
  );
}

function StatusTimeline({ current }: { current: WorkOrderStatus }) {
  const currentIdx = STATUS_STEPS.indexOf(current);
  return (
    <div className="flex items-center gap-0">
      {STATUS_STEPS.map((step, idx) => {
        const done = idx < currentIdx;
        const active = idx === currentIdx;
        return (
          <div key={step} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-1.5 min-w-[64px]">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all ${
                done ? "bg-green-500/20 border-green-500 text-green-400"
                  : active ? "bg-[#e94560]/20 border-[#e94560] text-[#e94560]"
                  : "bg-white/5 border-white/10 text-gray-600"
              }`}>
                {done ? <IconCheck /> : <span className="text-xs font-bold">{idx + 1}</span>}
              </div>
              <span className={`text-xs text-center leading-tight ${
                done ? "text-green-400" : active ? "text-[#e94560] font-medium" : "text-gray-600"
              }`}>
                {STATUS_LABELS[step]}
              </span>
            </div>
            {idx < STATUS_STEPS.length - 1 && (
              <div className={`flex-1 h-0.5 mb-5 mx-1 ${idx < currentIdx ? "bg-green-500/40" : "bg-white/10"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-gray-500 text-xs mb-0.5">{label}</p>
      <p className="text-gray-200 text-sm">{value}</p>
    </div>
  );
}

interface InventoryOption {
  id: string;
  name: string;
  sku: string | null;
  sell_price: number | null;
  quantity: number;
}

function AddItemForm({
  onAdd,
  onCancel,
  inventoryItems = [],
}: {
  onAdd: (item: { type: WorkOrderItemType; description: string; quantity: number; unit_price: number; total: number; inventoryItemId?: string }) => void;
  onCancel: () => void;
  inventoryItems?: InventoryOption[];
}) {
  const [type, setType] = useState<WorkOrderItemType>("labor");
  const [description, setDescription] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [unitPrice, setUnitPrice] = useState("");
  const [inventorySearch, setInventorySearch] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedInventoryId, setSelectedInventoryId] = useState<string | undefined>(undefined);

  const filtered = inventorySearch.length >= 1
    ? inventoryItems.filter((i) =>
        i.name.toLowerCase().includes(inventorySearch.toLowerCase()) ||
        (i.sku ?? "").toLowerCase().includes(inventorySearch.toLowerCase())
      ).slice(0, 8)
    : [];

  function selectInventoryItem(item: InventoryOption) {
    setDescription(item.name);
    setUnitPrice(item.sell_price != null ? String(item.sell_price) : "");
    setInventorySearch(item.name);
    setSelectedInventoryId(item.id);
    setShowSuggestions(false);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const qty = parseFloat(quantity) || 1;
    const price = parseFloat(unitPrice) || 0;
    onAdd({ type, description, quantity: qty, unit_price: price, total: qty * price, inventoryItemId: selectedInventoryId });
  }

  return (
    <form onSubmit={handleSubmit} className="bg-[#1a1a2e] border border-[#e94560]/30 rounded-xl p-4 space-y-3">
      <p className="text-white text-sm font-medium">Agregar ítem</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-gray-400 mb-1" htmlFor="item-type">Tipo</label>
          <div className="relative">
            <select
              id="item-type"
              value={type}
              onChange={(e) => {
                setType(e.target.value as WorkOrderItemType);
                setDescription("");
                setInventorySearch("");
                setUnitPrice("");
                setSelectedInventoryId(undefined);
              }}
              className={selectClass}
            >
              <option value="labor">Mano de obra</option>
              <option value="part">Repuesto / Material</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center"><IconChevronDown /></div>
          </div>
        </div>

        {/* Description — inventory picker for parts, plain input for labor */}
        <div className="relative">
          <label className="block text-xs text-gray-400 mb-1" htmlFor="item-desc">
            {type === "part" ? "Buscar en inventario *" : "Descripción *"}
          </label>
          {type === "part" && inventoryItems.length > 0 ? (
            <>
              <input
                id="item-desc"
                type="text"
                required
                autoComplete="off"
                value={inventorySearch}
                onChange={(e) => {
                  setInventorySearch(e.target.value);
                  setDescription(e.target.value);
                  setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                placeholder="Buscar por nombre o SKU…"
                className={inputClass}
              />
              {showSuggestions && filtered.length > 0 && (
                <ul className="absolute z-20 left-0 right-0 top-full mt-1 bg-[#0f172a] border border-white/10 rounded-lg shadow-xl overflow-hidden max-h-52 overflow-y-auto">
                  {filtered.map((item) => (
                    <li key={item.id}>
                      <button
                        type="button"
                        onMouseDown={() => selectInventoryItem(item)}
                        className="w-full text-left px-3 py-2.5 hover:bg-white/5 transition-colors flex items-center justify-between gap-3"
                      >
                        <div className="min-w-0">
                          <p className="text-gray-200 text-sm truncate">{item.name}</p>
                          {item.sku && (
                            <p className="text-gray-600 text-xs font-mono">{item.sku}</p>
                          )}
                        </div>
                        <div className="shrink-0 text-right">
                          {item.sell_price != null && (
                            <p className="text-[#e94560] text-sm font-medium">
                              ${item.sell_price.toLocaleString("es-MX")}
                            </p>
                          )}
                          <p className="text-gray-600 text-xs">{item.quantity} en stock</p>
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              {showSuggestions && inventorySearch.length >= 1 && filtered.length === 0 && (
                <div className="absolute z-20 left-0 right-0 top-full mt-1 bg-[#0f172a] border border-white/10 rounded-lg px-3 py-2.5">
                  <p className="text-gray-600 text-xs">Sin resultados. Podés escribir la descripción manualmente.</p>
                </div>
              )}
            </>
          ) : (
            <input
              id="item-desc"
              type="text"
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ej. Cambio de aceite 5W-30"
              className={inputClass}
            />
          )}
        </div>

        <div>
          <label className="block text-xs text-gray-400 mb-1" htmlFor="item-qty">Cantidad</label>
          <input id="item-qty" type="number" min="0.01" step="0.01" value={quantity} onChange={(e) => setQuantity(e.target.value)} className={inputClass} />
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1" htmlFor="item-price">Precio unitario (MXN)</label>
          <input id="item-price" type="number" min="0" step="0.01" value={unitPrice} onChange={(e) => setUnitPrice(e.target.value)} placeholder="0.00" className={inputClass} />
        </div>
      </div>
      {description && unitPrice && (
        <p className="text-gray-400 text-xs">
          Total: <span className="text-white font-medium">${((parseFloat(quantity) || 1) * (parseFloat(unitPrice) || 0)).toLocaleString("es-MX", { minimumFractionDigits: 2 })}</span>
        </p>
      )}
      <div className="flex gap-2 pt-1">
        <button type="button" onClick={onCancel} className="px-3 py-1.5 rounded-lg border border-white/10 text-gray-400 text-sm hover:text-white hover:border-white/20 transition-colors">Cancelar</button>
        <button type="submit" className="px-4 py-1.5 rounded-lg bg-[#e94560] hover:bg-[#c73652] text-white text-sm font-medium transition-colors">Agregar</button>
      </div>
    </form>
  );
}

// ── Delivery Modal ─────────────────────────────────────────────────────────

function DeliveryModal({
  estimatedCost,
  onConfirm,
  onCancel,
  loading,
}: {
  estimatedCost: string;
  onConfirm: (finalCost: number | null) => void;
  onCancel: () => void;
  loading: boolean;
}) {
  const [value, setValue] = useState(estimatedCost);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = parseFloat(value);
    onConfirm(isNaN(parsed) || parsed <= 0 ? null : parsed);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative bg-[#16213e] border border-white/10 rounded-2xl w-full max-w-sm shadow-2xl p-6">
        <h3 className="text-white font-semibold text-lg mb-1">Registrar entrega</h3>
        <p className="text-gray-400 text-sm mb-5">
          Confirmá el costo final antes de marcar la orden como entregada.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-gray-400 text-xs font-medium mb-1.5">
              Costo final (MXN)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">$</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="0.00"
                className="w-full bg-[#1a1a2e] border border-white/10 rounded-lg pl-7 pr-3 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-[#e94560]/60 focus:ring-1 focus:ring-[#e94560]/30 transition-colors"
                autoFocus
              />
            </div>
            <p className="text-gray-600 text-xs mt-1">
              Dejá en blanco para usar el costo estimado.
            </p>
          </div>
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onCancel}
              disabled={loading}
              className="flex-1 px-4 py-2.5 rounded-lg border border-white/10 text-gray-400 text-sm hover:text-white hover:border-white/20 transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 inline-flex items-center justify-center gap-2 bg-[#e94560] hover:bg-[#c73652] disabled:opacity-60 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors"
            >
              {loading ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                  </svg>
                  Registrando…
                </>
              ) : (
                "Confirmar entrega"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface Mechanic {
  id: string;
  full_name: string | null;
}

interface VehicleHistoryItem {
  id: string;
  status: string;
  description: string | null;
  diagnosis: string | null;
  estimated_cost: number | null;
  final_cost: number | null;
  received_at: string;
  delivered_at: string | null;
}

interface LinkedInvoice {
  id: string;
  status: string;
  total: number | null;
  created_at: string;
  paid_at: string | null;
}

const INVOICE_STATUS_LABELS: Record<string, string> = {
  draft: "Borrador",
  sent: "Enviada",
  paid: "Pagada",
};

const INVOICE_STATUS_COLORS: Record<string, string> = {
  draft: "bg-gray-500/20 text-gray-300",
  sent: "bg-blue-500/20 text-blue-300",
  paid: "bg-green-500/20 text-green-300",
};

export default function OrdenDetalleClient({
  order: initialOrder,
  mechanics = [],
  inventoryItems = [],
  vehicleHistory = [],
  linkedInvoice = null,
}: {
  order: WorkOrderWithRelations;
  mechanics?: Mechanic[];
  inventoryItems?: InventoryOption[];
  vehicleHistory?: VehicleHistoryItem[];
  linkedInvoice?: LinkedInvoice | null;
}) {
  const router = useRouter();
  const [status, setStatus] = useState<WorkOrderStatus>(initialOrder.status);
  const [items, setItems] = useState(initialOrder.items);
  const [showAddItem, setShowAddItem] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [generatingInvoice, setGeneratingInvoice] = useState(false);
  const [diagnosis, setDiagnosis] = useState(initialOrder.diagnosis ?? "");
  const [estimatedCost, setEstimatedCost] = useState(
    initialOrder.estimated_cost != null ? String(initialOrder.estimated_cost) : ""
  );
  const [finalCost, setFinalCost] = useState(
    initialOrder.final_cost != null ? String(initialOrder.final_cost) : ""
  );
  const [savingNotes, setSavingNotes] = useState(false);
  const [notesSaved, setNotesSaved] = useState(false);
  const [mechanicId, setMechanicId] = useState(initialOrder.mechanic_id ?? "");
  const [savingMechanic, setSavingMechanic] = useState(false);
  const [mechanicSaved, setMechanicSaved] = useState(false);
  const [estimatedDelivery, setEstimatedDelivery] = useState(
    initialOrder.estimated_delivery
      ? new Date(initialOrder.estimated_delivery).toISOString().split("T")[0]
      : ""
  );
  const [showDeliveryModal, setShowDeliveryModal] = useState(false);

  const currentIdx = STATUS_STEPS.indexOf(status);
  const nextStatus = currentIdx < STATUS_STEPS.length - 1 ? STATUS_STEPS[currentIdx + 1] : null;
  const nextLabel = nextStatus ? NEXT_STATUS_LABEL[status] : null;

  const laborItems = items.filter((i) => i.type === "labor");
  const partItems = items.filter((i) => i.type === "part");
  const subtotalLabor = laborItems.reduce((s, i) => s + i.total, 0);
  const subtotalParts = partItems.reduce((s, i) => s + i.total, 0);
  const subtotal = subtotalLabor + subtotalParts;

  const fmt = (n: number) => `$${n.toLocaleString("es-MX", { minimumFractionDigits: 2 })}`;
  const fmtDate = (d: string) =>
    new Date(d.includes("T") ? d : d + "T00:00:00").toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" });

  function handleAdvanceStatus() {
    if (!nextStatus) return;
    if (nextStatus === "delivered") {
      setShowDeliveryModal(true);
      return;
    }
    setError(null);
    startTransition(async () => {
      try {
        await advanceWorkOrderStatus(initialOrder.id, nextStatus);
        setStatus(nextStatus);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error al actualizar el estado");
      }
    });
  }

  function handleDeliveryConfirm(finalCostValue: number | null) {
    setError(null);
    startTransition(async () => {
      try {
        await advanceWorkOrderStatus(initialOrder.id, "delivered", finalCostValue);
        setStatus("delivered");
        if (finalCostValue != null) setFinalCost(String(finalCostValue));
        setShowDeliveryModal(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error al registrar la entrega");
        setShowDeliveryModal(false);
      }
    });
  }

  function handleAddItem(item: { type: WorkOrderItemType; description: string; quantity: number; unit_price: number; total: number; inventoryItemId?: string }) {
    setError(null);
    startTransition(async () => {
      try {
        await addWorkOrderItem(initialOrder.id, item);
        setItems((prev) => [...prev, { ...item, id: `temp-${Date.now()}`, work_order_id: initialOrder.id }]);
        setShowAddItem(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error al agregar el ítem");
      }
    });
  }

  function handleRemoveItem(itemId: string) {
    setError(null);
    startTransition(async () => {
      try {
        await removeWorkOrderItem(itemId, initialOrder.id);
        setItems((prev) => prev.filter((i) => i.id !== itemId));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error al eliminar el ítem");
      }
    });
  }

  async function handleSaveMechanic() {
    setSavingMechanic(true);
    setError(null);
    try {
      await reassignMechanic(initialOrder.id, mechanicId || null);
      setMechanicSaved(true);
      setTimeout(() => setMechanicSaved(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al reasignar mecánico");
    } finally {
      setSavingMechanic(false);
    }
  }

  async function handleSaveNotes() {
    setSavingNotes(true);
    setError(null);
    try {
      await updateWorkOrderNotes(initialOrder.id, {
        diagnosis: diagnosis || undefined,
        estimated_cost: estimatedCost ? parseFloat(estimatedCost) : undefined,
        final_cost: finalCost ? parseFloat(finalCost) : undefined,
        estimated_delivery: estimatedDelivery
          ? new Date(estimatedDelivery + "T12:00:00").toISOString()
          : null,
      });
      setNotesSaved(true);
      setTimeout(() => setNotesSaved(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar");
    } finally {
      setSavingNotes(false);
    }
  }

  async function handleGenerateInvoice() {
    setGeneratingInvoice(true);
    setError(null);
    try {
      const invoiceId = await generateInvoiceFromWorkOrder(initialOrder.id);
      router.push(`/dashboard/facturas?highlight=${invoiceId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al generar la factura");
      setGeneratingInvoice(false);
    }
  }

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/ordenes" className="text-gray-500 hover:text-white transition-colors print:hidden" aria-label="Volver a órdenes">
            <IconArrowLeft />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-white font-mono">{initialOrder.id.slice(0, 8).toUpperCase()}</h1>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[status]}`}>
                {STATUS_LABELS[status]}
              </span>
            </div>
            <p className="text-gray-500 text-sm mt-0.5 truncate max-w-sm">{initialOrder.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0 print:hidden">
          <WhatsAppButton
            clientName={initialOrder.client.full_name}
            clientPhone={initialOrder.client.phone}
            vehicleLabel={`${initialOrder.vehicle.brand} ${initialOrder.vehicle.model} ${initialOrder.vehicle.year}`}
            orderCode={`OT-${initialOrder.id.slice(0, 6).toUpperCase()}`}
            status={status}
          />
          <PrintButton />
          {linkedInvoice ? (
            <Link
              href={`/dashboard/facturas/${linkedInvoice.id}`}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 hover:border-white/20 hover:bg-white/10 text-gray-300 text-sm font-medium transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
              Ver factura
            </Link>
          ) : items.length > 0 ? (
            <button
              onClick={handleGenerateInvoice}
              disabled={generatingInvoice || isPending}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 hover:border-white/20 hover:bg-white/10 disabled:opacity-60 disabled:cursor-not-allowed text-gray-300 text-sm font-medium transition-colors"
            >
              {generatingInvoice ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                  </svg>
                  Generando…
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                  </svg>
                  Generar factura
                </>
              )}
            </button>
          ) : null}
          {nextLabel && (
            <button
              onClick={handleAdvanceStatus}
              disabled={isPending}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#e94560] hover:bg-[#c73652] disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors"
            >
              {isPending ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                  </svg>
                  Actualizando…
                </>
              ) : nextLabel}
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 text-red-400 text-sm">{error}</div>
      )}

      {/* Timeline */}
      <div className="bg-[#16213e] border border-white/10 rounded-xl p-5">
        <p className="text-gray-400 text-xs uppercase tracking-wide font-medium mb-5">Progreso de la orden</p>
        <StatusTimeline current={status} />
      </div>

      {/* Vehicle + Client grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Link
          href={`/dashboard/vehiculos/${initialOrder.vehicle.id}`}
          className="block bg-[#16213e] border border-white/10 rounded-xl p-5 space-y-4 hover:border-[#e94560]/30 transition-colors group"
        >
          <div className="flex items-center gap-2 text-gray-400">
            <IconCar />
            <p className="text-xs uppercase tracking-wide font-medium">Vehículo</p>
            <svg className="w-3.5 h-3.5 ml-auto text-gray-600 group-hover:text-[#e94560] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-3">
            <InfoRow label="Marca / Modelo" value={`${initialOrder.vehicle.brand} ${initialOrder.vehicle.model}`} />
            <InfoRow label="Año" value={String(initialOrder.vehicle.year)} />
            <InfoRow label="Placa" value={initialOrder.vehicle.plate ?? "—"} />
            <InfoRow label="Color" value={initialOrder.vehicle.color ?? "—"} />
            <InfoRow label="Kilometraje" value={initialOrder.vehicle.mileage != null ? `${initialOrder.vehicle.mileage.toLocaleString("es-MX")} km` : "—"} />
            <InfoRow label="VIN" value={initialOrder.vehicle.vin ?? "—"} />
          </div>
        </Link>

        <div className="space-y-4">
          <div className="bg-[#16213e] border border-white/10 rounded-xl p-5 space-y-4">
            <div className="flex items-center gap-2 text-gray-400">
              <IconUser />
              <p className="text-xs uppercase tracking-wide font-medium">Cliente</p>
            </div>
            <div className="grid grid-cols-1 gap-3">
              <div>
                <p className="text-gray-500 text-xs mb-0.5">Nombre</p>
                <Link
                  href={`/dashboard/clientes/${initialOrder.client.id}`}
                  className="text-gray-200 text-sm hover:text-[#e94560] transition-colors"
                >
                  {initialOrder.client.full_name ?? "—"}
                </Link>
              </div>
              <div>
                <p className="text-gray-500 text-xs mb-0.5">Teléfono</p>
                {initialOrder.client.phone ? (
                  <a
                    href={`tel:${initialOrder.client.phone}`}
                    className="text-gray-200 text-sm hover:text-[#e94560] transition-colors"
                  >
                    {initialOrder.client.phone}
                  </a>
                ) : (
                  <p className="text-gray-200 text-sm">—</p>
                )}
              </div>
              <div>
                <p className="text-gray-500 text-xs mb-0.5">Correo</p>
                {initialOrder.client.email ? (
                  <a
                    href={`mailto:${initialOrder.client.email}`}
                    className="text-gray-200 text-sm hover:text-[#e94560] transition-colors"
                  >
                    {initialOrder.client.email}
                  </a>
                ) : (
                  <p className="text-gray-200 text-sm">—</p>
                )}
              </div>
            </div>
          </div>
          <div className="bg-[#16213e] border border-white/10 rounded-xl p-5">
            <div className="flex items-center gap-2 text-gray-400 mb-4">
              <IconWrench />
              <p className="text-xs uppercase tracking-wide font-medium">Asignación y fechas</p>
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-3">
              {/* Mechanic inline reassignment */}
              <div className="col-span-2">
                <p className="text-gray-500 text-xs mb-1.5">Mecánico asignado</p>
                {mechanics.length > 0 ? (
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <select
                        value={mechanicId}
                        onChange={(e) => setMechanicId(e.target.value)}
                        className="w-full bg-[#1a1a2e] border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#e94560]/60 focus:ring-1 focus:ring-[#e94560]/30 transition-colors appearance-none"
                        aria-label="Mecánico asignado"
                      >
                        <option value="">Sin asignar</option>
                        {mechanics.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.full_name ?? m.id}
                          </option>
                        ))}
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
                        <IconChevronDown />
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleSaveMechanic}
                      disabled={savingMechanic}
                      className="print:hidden shrink-0 inline-flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed bg-[#e94560]/10 hover:bg-[#e94560]/20 text-[#e94560]"
                    >
                      {savingMechanic ? (
                        <>
                          <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                          </svg>
                          Guardando…
                        </>
                      ) : mechanicSaved ? (
                        <>
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                          </svg>
                          Guardado
                        </>
                      ) : (
                        "Guardar"
                      )}
                    </button>
                  </div>
                ) : (
                  <p className="text-gray-200 text-sm">{initialOrder.mechanic?.full_name ?? "Sin asignar"}</p>
                )}
              </div>
              <InfoRow label="Recibido" value={fmtDate(initialOrder.received_at)} />
              <div>
                <p className="text-gray-500 text-xs mb-1">Entrega estimada</p>
                <input
                  type="date"
                  value={estimatedDelivery}
                  onChange={(e) => setEstimatedDelivery(e.target.value)}
                  className="w-full bg-[#1a1a2e] border border-white/10 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:border-[#e94560]/60 focus:ring-1 focus:ring-[#e94560]/30 transition-colors"
                  aria-label="Fecha de entrega estimada"
                />
              </div>
              <InfoRow label="Entregado" value={initialOrder.delivered_at ? fmtDate(initialOrder.delivered_at) : "—"} />
            </div>
          </div>
        </div>
      </div>

      {/* Diagnosis & notes — editable */}
      <div className="bg-[#16213e] border border-white/10 rounded-xl p-5 space-y-5">
        <div className="flex items-center justify-between">
          <p className="text-gray-400 text-xs uppercase tracking-wide font-medium">Diagnóstico y costo final</p>
          <button
            type="button"
            onClick={handleSaveNotes}
            disabled={savingNotes}
            className="print:hidden inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed bg-[#e94560]/10 hover:bg-[#e94560]/20 text-[#e94560]"
          >
            {savingNotes ? (
              <>
                <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                </svg>
                Guardando…
              </>
            ) : notesSaved ? (
              <>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
                Guardado
              </>
            ) : (
              "Guardar"
            )}
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="space-y-1.5">
            <label htmlFor="diagnosis" className="block text-gray-500 text-xs font-medium">
              Diagnóstico
            </label>
            <textarea
              id="diagnosis"
              rows={4}
              value={diagnosis}
              onChange={(e) => setDiagnosis(e.target.value)}
              placeholder="Describe el diagnóstico del vehículo…"
              className="w-full bg-[#1a1a2e] border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-[#e94560]/60 focus:ring-1 focus:ring-[#e94560]/30 transition-colors resize-none"
            />
          </div>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="estimated_cost" className="block text-gray-500 text-xs font-medium">
                Costo estimado (MXN)
              </label>
              <input
                id="estimated_cost"
                type="number"
                min="0"
                step="0.01"
                value={estimatedCost}
                onChange={(e) => setEstimatedCost(e.target.value)}
                placeholder="0.00"
                className="w-full bg-[#1a1a2e] border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-[#e94560]/60 focus:ring-1 focus:ring-[#e94560]/30 transition-colors"
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="final_cost" className="block text-gray-500 text-xs font-medium">
                Costo final (MXN)
              </label>
              <input
                id="final_cost"
                type="number"
                min="0"
                step="0.01"
                value={finalCost}
                onChange={(e) => setFinalCost(e.target.value)}
                placeholder="0.00"
                className="w-full bg-[#1a1a2e] border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-[#e94560]/60 focus:ring-1 focus:ring-[#e94560]/30 transition-colors"
              />
            </div>
            <div className="space-y-1.5">
              <p className="text-gray-500 text-xs font-medium">Descripción del problema</p>
              <p className="text-gray-300 text-sm leading-relaxed bg-[#1a1a2e] rounded-lg px-3 py-2.5 border border-white/5">
                {initialOrder.description || <span className="text-gray-600 italic">Sin descripción.</span>}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Items */}
      <div className="bg-[#16213e] border border-white/10 rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
          <p className="text-gray-400 text-xs uppercase tracking-wide font-medium">
            Ítems de la orden
            {items.length > 0 && <span className="ml-2 text-gray-600 normal-case">({items.length})</span>}
          </p>
          {!showAddItem && (
            <button onClick={() => setShowAddItem(true)} className="print:hidden inline-flex items-center gap-1.5 text-xs text-[#e94560] hover:text-[#c73652] transition-colors font-medium">
              <IconPlus />
              Agregar ítem
            </button>
          )}
        </div>

        {showAddItem && (
          <div className="p-4 border-b border-white/5">
            <AddItemForm onAdd={handleAddItem} onCancel={() => setShowAddItem(false)} inventoryItems={inventoryItems} />
          </div>
        )}

        {items.length === 0 && !showAddItem ? (
          <div className="py-10 text-center text-gray-600 text-sm">No hay ítems registrados. Agrega mano de obra o repuestos.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[520px]">
              <thead>
                <tr className="text-gray-500 text-xs uppercase tracking-wide border-b border-white/5">
                  <th className="text-left py-3 px-5 font-medium">Descripción</th>
                  <th className="text-left py-3 px-4 font-medium">Tipo</th>
                  <th className="text-right py-3 px-4 font-medium">Cant.</th>
                  <th className="text-right py-3 px-4 font-medium">P. Unit.</th>
                  <th className="text-right py-3 px-4 font-medium">Total</th>
                  <th className="py-3 px-4 w-8" />
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {items.map((item) => (
                  <tr key={item.id} className="hover:bg-white/3 transition-colors group">
                    <td className="py-3 px-5 text-gray-200">{item.description}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${item.type === "labor" ? "bg-blue-500/15 text-blue-300" : "bg-orange-500/15 text-orange-300"}`}>
                        {item.type === "labor" ? "Mano de obra" : "Repuesto"}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right text-gray-400">{item.quantity}</td>
                    <td className="py-3 px-4 text-right text-gray-400">{fmt(item.unit_price)}</td>
                    <td className="py-3 px-4 text-right text-gray-200 font-medium">{fmt(item.total)}</td>
                    <td className="py-3 px-4 text-right print:hidden">
                      <button
                        onClick={() => handleRemoveItem(item.id)}
                        disabled={isPending}
                        className="text-gray-700 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 disabled:cursor-not-allowed"
                        aria-label="Eliminar ítem"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {items.length > 0 && (
          <div className="border-t border-white/5 px-5 py-4 space-y-2">
            <div className="flex justify-between text-sm text-gray-400">
              <span>Mano de obra</span>
              <span>{fmt(subtotalLabor)}</span>
            </div>
            <div className="flex justify-between text-sm text-gray-400">
              <span>Repuestos y materiales</span>
              <span>{fmt(subtotalParts)}</span>
            </div>
            <div className="flex justify-between text-base font-semibold text-white border-t border-white/10 pt-2 mt-2">
              <span>Total</span>
              <span className="text-[#e94560]">{fmt(subtotal)}</span>
            </div>
            {initialOrder.estimated_cost != null && initialOrder.estimated_cost > 0 && (
              <div className="flex justify-between text-xs text-gray-600 pt-1">
                <span>Costo estimado original</span>
                <span>{fmt(initialOrder.estimated_cost)}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Linked invoice */}
      {linkedInvoice && (
        <Link
          href={`/dashboard/facturas/${linkedInvoice.id}`}
          className="block bg-[#16213e] border border-white/10 rounded-xl p-5 hover:border-[#e94560]/30 transition-colors group"
        >
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-lg bg-[#e94560]/10 border border-[#e94560]/20 flex items-center justify-center text-[#e94560] shrink-0">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-white font-medium text-sm group-hover:text-[#e94560] transition-colors">
                    Factura #{linkedInvoice.id.slice(0, 8).toUpperCase()}
                  </p>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${INVOICE_STATUS_COLORS[linkedInvoice.status] ?? "bg-gray-500/20 text-gray-400"}`}>
                    {INVOICE_STATUS_LABELS[linkedInvoice.status] ?? linkedInvoice.status}
                  </span>
                </div>
                <p className="text-gray-500 text-xs mt-0.5">
                  Creada el {new Date(linkedInvoice.created_at).toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" })}
                  {linkedInvoice.paid_at && (
                    <> · Pagada el {new Date(linkedInvoice.paid_at).toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" })}</>
                  )}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              {linkedInvoice.total != null && (
                <p className="text-white font-semibold text-lg">
                  ${linkedInvoice.total.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                </p>
              )}
              <svg className="w-4 h-4 text-gray-600 group-hover:text-[#e94560] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>
        </Link>
      )}

      {/* Vehicle history */}
      {vehicleHistory.length > 0 && (
        <div className="bg-[#16213e] border border-white/10 rounded-xl overflow-hidden print:hidden">
          <div className="px-5 py-4 border-b border-white/5 flex items-center gap-2">
            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-gray-400 text-xs uppercase tracking-wide font-medium">
              Historial del vehículo
            </p>
            <span className="ml-1 text-gray-600 text-xs normal-case">
              ({vehicleHistory.length} orden{vehicleHistory.length !== 1 ? "es" : ""} anterior{vehicleHistory.length !== 1 ? "es" : ""})
            </span>
          </div>
          <div className="divide-y divide-white/5">
            {vehicleHistory.map((h) => {
              const cost = h.final_cost ?? h.estimated_cost;
              return (
                <Link
                  key={h.id}
                  href={`/dashboard/ordenes/${h.id}`}
                  className="flex items-start justify-between gap-4 px-5 py-4 hover:bg-white/[0.02] transition-colors group"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="shrink-0 mt-0.5">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${STATUS_COLORS[h.status as WorkOrderStatus] ?? "bg-gray-500/20 text-gray-400"}`}>
                        {STATUS_LABELS[h.status as WorkOrderStatus] ?? h.status}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-gray-300 text-sm font-mono group-hover:text-white transition-colors">
                        OT-{h.id.slice(0, 8).toUpperCase()}
                      </p>
                      {h.description && (
                        <p className="text-gray-500 text-xs mt-0.5 truncate max-w-xs">{h.description}</p>
                      )}
                      {h.diagnosis && (
                        <p className="text-gray-600 text-xs mt-0.5 truncate max-w-xs italic">{h.diagnosis}</p>
                      )}
                    </div>
                  </div>
                  <div className="shrink-0 text-right space-y-1">
                    <p className="text-gray-500 text-xs">
                      {fmtDate(h.received_at)}
                    </p>
                    {cost != null && cost > 0 && (
                      <p className="text-gray-300 text-sm font-medium">
                        {fmt(cost)}
                        {h.final_cost == null && h.estimated_cost != null && (
                          <span className="text-gray-600 text-xs ml-1">est.</span>
                        )}
                      </p>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {showDeliveryModal && (
        <DeliveryModal
          estimatedCost={estimatedCost}
          onConfirm={handleDeliveryConfirm}
          onCancel={() => setShowDeliveryModal(false)}
          loading={isPending}
        />
      )}
    </div>
  );
}
