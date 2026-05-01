"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import type { WorkOrderWithRelations, WorkOrderStatus, WorkOrderItemType } from "@/types/database";
import {
  advanceWorkOrderStatus,
  addWorkOrderItem,
  removeWorkOrderItem,
} from "../actions";

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

function AddItemForm({ onAdd, onCancel }: { onAdd: (item: Omit<{ type: WorkOrderItemType; description: string; quantity: number; unit_price: number; total: number }, never>) => void; onCancel: () => void }) {
  const [type, setType] = useState<WorkOrderItemType>("labor");
  const [description, setDescription] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [unitPrice, setUnitPrice] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const qty = parseFloat(quantity) || 1;
    const price = parseFloat(unitPrice) || 0;
    onAdd({ type, description, quantity: qty, unit_price: price, total: qty * price });
  }

  return (
    <form onSubmit={handleSubmit} className="bg-[#1a1a2e] border border-[#e94560]/30 rounded-xl p-4 space-y-3">
      <p className="text-white text-sm font-medium">Agregar ítem</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-gray-400 mb-1" htmlFor="item-type">Tipo</label>
          <div className="relative">
            <select id="item-type" value={type} onChange={(e) => setType(e.target.value as WorkOrderItemType)} className={selectClass}>
              <option value="labor">Mano de obra</option>
              <option value="part">Repuesto / Material</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center"><IconChevronDown /></div>
          </div>
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1" htmlFor="item-desc">Descripción *</label>
          <input id="item-desc" type="text" required value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Ej. Cambio de aceite 5W-30" className={inputClass} />
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

export default function OrdenDetalleClient({ order: initialOrder }: { order: WorkOrderWithRelations }) {
  const [status, setStatus] = useState<WorkOrderStatus>(initialOrder.status);
  const [items, setItems] = useState(initialOrder.items);
  const [showAddItem, setShowAddItem] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

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

  function handleAddItem(item: { type: WorkOrderItemType; description: string; quantity: number; unit_price: number; total: number }) {
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

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/ordenes" className="text-gray-500 hover:text-white transition-colors" aria-label="Volver a órdenes">
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
        {nextLabel && (
          <button
            onClick={handleAdvanceStatus}
            disabled={isPending}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#e94560] hover:bg-[#c73652] disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors shrink-0"
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
        <div className="bg-[#16213e] border border-white/10 rounded-xl p-5 space-y-4">
          <div className="flex items-center gap-2 text-gray-400">
            <IconCar />
            <p className="text-xs uppercase tracking-wide font-medium">Vehículo</p>
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-3">
            <InfoRow label="Marca / Modelo" value={`${initialOrder.vehicle.brand} ${initialOrder.vehicle.model}`} />
            <InfoRow label="Año" value={String(initialOrder.vehicle.year)} />
            <InfoRow label="Placa" value={initialOrder.vehicle.plate ?? "—"} />
            <InfoRow label="Color" value={initialOrder.vehicle.color ?? "—"} />
            <InfoRow label="Kilometraje" value={initialOrder.vehicle.mileage != null ? `${initialOrder.vehicle.mileage.toLocaleString("es-MX")} km` : "—"} />
            <InfoRow label="VIN" value={initialOrder.vehicle.vin ?? "—"} />
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-[#16213e] border border-white/10 rounded-xl p-5 space-y-4">
            <div className="flex items-center gap-2 text-gray-400">
              <IconUser />
              <p className="text-xs uppercase tracking-wide font-medium">Cliente</p>
            </div>
            <div className="grid grid-cols-1 gap-3">
              <InfoRow label="Nombre" value={initialOrder.client.full_name ?? "—"} />
              <InfoRow label="Teléfono" value={initialOrder.client.phone ?? "—"} />
              <InfoRow label="Correo" value={initialOrder.client.email ?? "—"} />
            </div>
          </div>
          <div className="bg-[#16213e] border border-white/10 rounded-xl p-5">
            <div className="flex items-center gap-2 text-gray-400 mb-4">
              <IconWrench />
              <p className="text-xs uppercase tracking-wide font-medium">Asignación y fechas</p>
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-3">
              <InfoRow label="Mecánico" value={initialOrder.mechanic?.full_name ?? "Sin asignar"} />
              <InfoRow label="Recibido" value={fmtDate(initialOrder.received_at)} />
              <InfoRow label="Entrega estimada" value={initialOrder.estimated_delivery ? fmtDate(initialOrder.estimated_delivery) : "—"} />
              <InfoRow label="Entregado" value={initialOrder.delivered_at ? fmtDate(initialOrder.delivered_at) : "—"} />
            </div>
          </div>
        </div>
      </div>

      {/* Diagnosis & notes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-[#16213e] border border-white/10 rounded-xl p-5 space-y-2">
          <p className="text-gray-400 text-xs uppercase tracking-wide font-medium">Diagnóstico</p>
          {initialOrder.diagnosis ? (
            <p className="text-gray-200 text-sm leading-relaxed">{initialOrder.diagnosis}</p>
          ) : (
            <p className="text-gray-600 text-sm italic">Sin diagnóstico registrado aún.</p>
          )}
        </div>
        <div className="bg-[#16213e] border border-white/10 rounded-xl p-5 space-y-2">
          <p className="text-gray-400 text-xs uppercase tracking-wide font-medium">Descripción del problema</p>
          {initialOrder.description ? (
            <p className="text-gray-200 text-sm leading-relaxed">{initialOrder.description}</p>
          ) : (
            <p className="text-gray-600 text-sm italic">Sin descripción.</p>
          )}
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
            <button onClick={() => setShowAddItem(true)} className="inline-flex items-center gap-1.5 text-xs text-[#e94560] hover:text-[#c73652] transition-colors font-medium">
              <IconPlus />
              Agregar ítem
            </button>
          )}
        </div>

        {showAddItem && (
          <div className="p-4 border-b border-white/5">
            <AddItemForm onAdd={handleAddItem} onCancel={() => setShowAddItem(false)} />
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
                    <td className="py-3 px-4 text-right">
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
    </div>
  );
}
