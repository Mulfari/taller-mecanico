"use client";

import { use, useState } from "react";
import Link from "next/link";

type WorkOrderStatus = "received" | "diagnosing" | "repairing" | "ready" | "delivered";
type ItemType = "labor" | "part";

interface WorkOrderItem {
  id: string;
  type: ItemType;
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
}

interface WorkOrderDetail {
  id: string;
  status: WorkOrderStatus;
  description: string;
  diagnosis: string;
  mechanic_notes: string;
  estimated_cost: number;
  final_cost: number;
  received_at: string;
  estimated_delivery: string;
  delivered_at: string | null;
  client: { name: string; phone: string; email: string };
  vehicle: { brand: string; model: string; year: number; plate: string; color: string; vin: string; mileage: number };
  mechanic: string;
  items: WorkOrderItem[];
}

const STATUS_STEPS: WorkOrderStatus[] = ["received", "diagnosing", "repairing", "ready", "delivered"];

const STATUS_LABELS: Record<WorkOrderStatus, string> = {
  received: "Recibido",
  diagnosing: "Diagnóstico",
  repairing: "En reparación",
  ready: "Listo",
  delivered: "Entregado",
};

const NEXT_STATUS_LABEL: Partial<Record<WorkOrderStatus, string>> = {
  received: "Iniciar diagnóstico",
  diagnosing: "Iniciar reparación",
  repairing: "Marcar como listo",
  ready: "Registrar entrega",
};

const MOCK_ORDERS: Record<string, WorkOrderDetail> = {
  "OT-0041": {
    id: "OT-0041",
    status: "repairing",
    description: "Cambio de embrague y revisión de transmisión",
    diagnosis: "Embrague desgastado al 90%, sincronizadores de 3ra y 4ta con juego excesivo. Se recomienda cambio completo del kit de embrague.",
    mechanic_notes: "Se desmontó la transmisión. Kit de embrague en camino del proveedor. ETA mañana.",
    estimated_cost: 4500,
    final_cost: 0,
    received_at: "2026-04-29",
    estimated_delivery: "2026-05-02",
    delivered_at: null,
    client: { name: "Carlos Mendoza", phone: "555-0101", email: "carlos.mendoza@email.com" },
    vehicle: { brand: "Toyota", model: "Corolla", year: 2019, plate: "ABC-123", color: "Blanco", vin: "1NXBR32E79Z123456", mileage: 87400 },
    mechanic: "Luis García",
    items: [
      { id: "i1", type: "labor", description: "Desmontaje y montaje de transmisión", quantity: 1, unit_price: 1200, total: 1200 },
      { id: "i2", type: "part", description: "Kit de embrague Toyota Corolla 2019", quantity: 1, unit_price: 2800, total: 2800 },
      { id: "i3", type: "part", description: "Líquido de transmisión ATF (1L)", quantity: 2, unit_price: 180, total: 360 },
    ],
  },
  "OT-0040": {
    id: "OT-0040",
    status: "diagnosing",
    description: "Ruido extraño al frenar",
    diagnosis: "",
    mechanic_notes: "",
    estimated_cost: 1200,
    final_cost: 0,
    received_at: "2026-04-29",
    estimated_delivery: "2026-04-30",
    delivered_at: null,
    client: { name: "Ana Rodríguez", phone: "555-0102", email: "ana.rodriguez@email.com" },
    vehicle: { brand: "Honda", model: "Civic", year: 2021, plate: "XYZ-789", color: "Gris", vin: "2HGFC2F59MH123456", mileage: 34200 },
    mechanic: "Pedro Soto",
    items: [],
  },
  "OT-0039": {
    id: "OT-0039",
    status: "ready",
    description: "Cambio de pastillas y discos delanteros",
    diagnosis: "Discos con desgaste irregular y pastillas al límite. Se reemplazaron ambos ejes delanteros.",
    mechanic_notes: "Trabajo completado. Prueba de ruta realizada. Frenos respondiendo correctamente.",
    estimated_cost: 2800,
    final_cost: 2950,
    received_at: "2026-04-28",
    estimated_delivery: "2026-04-29",
    delivered_at: null,
    client: { name: "Miguel Torres", phone: "555-0103", email: "miguel.torres@email.com" },
    vehicle: { brand: "Nissan", model: "Sentra", year: 2018, plate: "DEF-456", color: "Negro", vin: "3N1AB7AP9JY123456", mileage: 62100 },
    mechanic: "Luis García",
    items: [
      { id: "i1", type: "labor", description: "Cambio de discos y pastillas delanteras", quantity: 1, unit_price: 600, total: 600 },
      { id: "i2", type: "part", description: "Discos de freno delanteros (par)", quantity: 1, unit_price: 1400, total: 1400 },
      { id: "i3", type: "part", description: "Pastillas de freno delanteras", quantity: 1, unit_price: 650, total: 650 },
      { id: "i4", type: "part", description: "Líquido de frenos DOT4 (500ml)", quantity: 1, unit_price: 300, total: 300 },
    ],
  },
};

const inputClass =
  "w-full bg-[#1a1a2e] border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-[#e94560]/60 focus:ring-1 focus:ring-[#e94560]/30 transition-colors";

const selectClass =
  "w-full bg-[#1a1a2e] border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#e94560]/60 focus:ring-1 focus:ring-[#e94560]/30 transition-colors appearance-none";

// --- Icons ---
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

// --- Status timeline ---
function StatusTimeline({ current }: { current: WorkOrderStatus }) {
  const currentIdx = STATUS_STEPS.indexOf(current);
  return (
    <div className="flex items-center gap-0">
      {STATUS_STEPS.map((step, idx) => {
        const done = idx < currentIdx;
        const active = idx === currentIdx;
        const pending = idx > currentIdx;
        return (
          <div key={step} className="flex items-center flex-1 last:flex-none">
            {/* Node */}
            <div className="flex flex-col items-center gap-1.5 min-w-[64px]">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all ${
                  done
                    ? "bg-green-500/20 border-green-500 text-green-400"
                    : active
                    ? "bg-[#e94560]/20 border-[#e94560] text-[#e94560]"
                    : "bg-white/5 border-white/10 text-gray-600"
                }`}
              >
                {done ? <IconCheck /> : (
                  <span className="text-xs font-bold">{idx + 1}</span>
                )}
              </div>
              <span
                className={`text-xs text-center leading-tight ${
                  done ? "text-green-400" : active ? "text-[#e94560] font-medium" : "text-gray-600"
                }`}
              >
                {STATUS_LABELS[step]}
              </span>
            </div>
            {/* Connector */}
            {idx < STATUS_STEPS.length - 1 && (
              <div
                className={`flex-1 h-0.5 mb-5 mx-1 ${
                  idx < currentIdx ? "bg-green-500/40" : "bg-white/10"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// --- Info row helper ---
function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-gray-500 text-xs mb-0.5">{label}</p>
      <p className="text-gray-200 text-sm">{value}</p>
    </div>
  );
}

// --- Add item form ---
interface AddItemFormProps {
  onAdd: (item: Omit<WorkOrderItem, "id">) => void;
  onCancel: () => void;
}

function AddItemForm({ onAdd, onCancel }: AddItemFormProps) {
  const [type, setType] = useState<ItemType>("labor");
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
            <select
              id="item-type"
              value={type}
              onChange={(e) => setType(e.target.value as ItemType)}
              className={selectClass}
            >
              <option value="labor">Mano de obra</option>
              <option value="part">Repuesto / Material</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
              <IconChevronDown />
            </div>
          </div>
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1" htmlFor="item-desc">Descripción *</label>
          <input
            id="item-desc"
            type="text"
            required
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Ej. Cambio de aceite 5W-30"
            className={inputClass}
          />
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1" htmlFor="item-qty">Cantidad</label>
          <input
            id="item-qty"
            type="number"
            min="0.01"
            step="0.01"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1" htmlFor="item-price">Precio unitario (MXN)</label>
          <input
            id="item-price"
            type="number"
            min="0"
            step="0.01"
            value={unitPrice}
            onChange={(e) => setUnitPrice(e.target.value)}
            placeholder="0.00"
            className={inputClass}
          />
        </div>
      </div>
      {description && unitPrice && (
        <p className="text-gray-400 text-xs">
          Total: <span className="text-white font-medium">
            ${((parseFloat(quantity) || 1) * (parseFloat(unitPrice) || 0)).toLocaleString("es-MX", { minimumFractionDigits: 2 })}
          </span>
        </p>
      )}
      <div className="flex gap-2 pt-1">
        <button
          type="button"
          onClick={onCancel}
          className="px-3 py-1.5 rounded-lg border border-white/10 text-gray-400 text-sm hover:text-white hover:border-white/20 transition-colors"
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="px-4 py-1.5 rounded-lg bg-[#e94560] hover:bg-[#c73652] text-white text-sm font-medium transition-colors"
        >
          Agregar
        </button>
      </div>
    </form>
  );
}

// --- Not found state ---
function NotFound({ id }: { id: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 space-y-4">
      <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center">
        <IconWrench />
      </div>
      <h2 className="text-white text-xl font-semibold">Orden no encontrada</h2>
      <p className="text-gray-500 text-sm">No existe una orden con el ID <span className="font-mono text-gray-300">{id}</span>.</p>
      <Link
        href="/dashboard/ordenes"
        className="px-4 py-2 rounded-lg bg-[#e94560] text-white text-sm hover:bg-[#c73652] transition-colors"
      >
        Volver a órdenes
      </Link>
    </div>
  );
}

// --- Main page ---
export default function OrdenDetallePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const [order, setOrder] = useState<WorkOrderDetail | null>(
    () => MOCK_ORDERS[resolvedParams.id] ?? null
  );
  const [showAddItem, setShowAddItem] = useState(false);
  const [advancing, setAdvancing] = useState(false);

  if (!order) return <NotFound id={resolvedParams.id} />;

  const currentIdx = STATUS_STEPS.indexOf(order.status);
  const nextStatus = currentIdx < STATUS_STEPS.length - 1 ? STATUS_STEPS[currentIdx + 1] : null;
  const nextLabel = nextStatus ? NEXT_STATUS_LABEL[order.status] : null;

  const laborItems = order.items.filter((i) => i.type === "labor");
  const partItems = order.items.filter((i) => i.type === "part");
  const subtotalLabor = laborItems.reduce((s, i) => s + i.total, 0);
  const subtotalParts = partItems.reduce((s, i) => s + i.total, 0);
  const subtotal = subtotalLabor + subtotalParts;

  async function handleAdvanceStatus() {
    if (!nextStatus) return;
    setAdvancing(true);
    await new Promise((r) => setTimeout(r, 600));
    setOrder((prev) => prev ? { ...prev, status: nextStatus } : prev);
    setAdvancing(false);
  }

  function handleAddItem(item: Omit<WorkOrderItem, "id">) {
    const newItem: WorkOrderItem = { ...item, id: `i${Date.now()}` };
    setOrder((prev) => prev ? { ...prev, items: [...prev.items, newItem] } : prev);
    setShowAddItem(false);
  }

  function handleRemoveItem(id: string) {
    setOrder((prev) => prev ? { ...prev, items: prev.items.filter((i) => i.id !== id) } : prev);
  }

  const fmt = (n: number) => `$${n.toLocaleString("es-MX", { minimumFractionDigits: 2 })}`;
  const fmtDate = (d: string) =>
    new Date(d + "T00:00:00").toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" });

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/ordenes"
            className="text-gray-500 hover:text-white transition-colors"
            aria-label="Volver a órdenes"
          >
            <IconArrowLeft />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-white">{order.id}</h1>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                order.status === "received" ? "bg-gray-500/20 text-gray-300" :
                order.status === "diagnosing" ? "bg-yellow-500/20 text-yellow-300" :
                order.status === "repairing" ? "bg-blue-500/20 text-blue-300" :
                order.status === "ready" ? "bg-green-500/20 text-green-300" :
                "bg-gray-600/20 text-gray-500"
              }`}>
                {STATUS_LABELS[order.status]}
              </span>
            </div>
            <p className="text-gray-500 text-sm mt-0.5 truncate max-w-sm">{order.description}</p>
          </div>
        </div>
        {nextLabel && (
          <button
            onClick={handleAdvanceStatus}
            disabled={advancing}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#e94560] hover:bg-[#c73652] disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors shrink-0"
          >
            {advancing ? (
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

      {/* Timeline */}
      <div className="bg-[#16213e] border border-white/10 rounded-xl p-5">
        <p className="text-gray-400 text-xs uppercase tracking-wide font-medium mb-5">Progreso de la orden</p>
        <StatusTimeline current={order.status} />
      </div>

      {/* Two-column grid: vehicle+client | dates+mechanic */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Vehicle */}
        <div className="bg-[#16213e] border border-white/10 rounded-xl p-5 space-y-4">
          <div className="flex items-center gap-2 text-gray-400">
            <IconCar />
            <p className="text-xs uppercase tracking-wide font-medium">Vehículo</p>
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-3">
            <InfoRow label="Marca / Modelo" value={`${order.vehicle.brand} ${order.vehicle.model}`} />
            <InfoRow label="Año" value={String(order.vehicle.year)} />
            <InfoRow label="Placa" value={order.vehicle.plate} />
            <InfoRow label="Color" value={order.vehicle.color} />
            <InfoRow label="Kilometraje" value={`${order.vehicle.mileage.toLocaleString("es-MX")} km`} />
            <InfoRow label="VIN" value={order.vehicle.vin} />
          </div>
        </div>

        {/* Client + dates */}
        <div className="space-y-4">
          <div className="bg-[#16213e] border border-white/10 rounded-xl p-5 space-y-4">
            <div className="flex items-center gap-2 text-gray-400">
              <IconUser />
              <p className="text-xs uppercase tracking-wide font-medium">Cliente</p>
            </div>
            <div className="grid grid-cols-1 gap-3">
              <InfoRow label="Nombre" value={order.client.name} />
              <InfoRow label="Teléfono" value={order.client.phone} />
              <InfoRow label="Correo" value={order.client.email} />
            </div>
          </div>
          <div className="bg-[#16213e] border border-white/10 rounded-xl p-5">
            <div className="flex items-center gap-2 text-gray-400 mb-4">
              <IconWrench />
              <p className="text-xs uppercase tracking-wide font-medium">Asignación y fechas</p>
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-3">
              <InfoRow label="Mecánico" value={order.mechanic || "Sin asignar"} />
              <InfoRow label="Recibido" value={fmtDate(order.received_at)} />
              <InfoRow label="Entrega estimada" value={fmtDate(order.estimated_delivery)} />
              <InfoRow label="Entregado" value={order.delivered_at ? fmtDate(order.delivered_at) : "—"} />
            </div>
          </div>
        </div>
      </div>

      {/* Diagnosis & mechanic notes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-[#16213e] border border-white/10 rounded-xl p-5 space-y-2">
          <p className="text-gray-400 text-xs uppercase tracking-wide font-medium">Diagnóstico</p>
          {order.diagnosis ? (
            <p className="text-gray-200 text-sm leading-relaxed">{order.diagnosis}</p>
          ) : (
            <p className="text-gray-600 text-sm italic">Sin diagnóstico registrado aún.</p>
          )}
        </div>
        <div className="bg-[#16213e] border border-white/10 rounded-xl p-5 space-y-2">
          <p className="text-gray-400 text-xs uppercase tracking-wide font-medium">Notas del mecánico</p>
          {order.mechanic_notes ? (
            <p className="text-gray-200 text-sm leading-relaxed">{order.mechanic_notes}</p>
          ) : (
            <p className="text-gray-600 text-sm italic">Sin notas registradas.</p>
          )}
        </div>
      </div>

      {/* Items */}
      <div className="bg-[#16213e] border border-white/10 rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
          <p className="text-gray-400 text-xs uppercase tracking-wide font-medium">
            Ítems de la orden
            {order.items.length > 0 && (
              <span className="ml-2 text-gray-600 normal-case">({order.items.length})</span>
            )}
          </p>
          {!showAddItem && (
            <button
              onClick={() => setShowAddItem(true)}
              className="inline-flex items-center gap-1.5 text-xs text-[#e94560] hover:text-[#c73652] transition-colors font-medium"
            >
              <IconPlus />
              Agregar ítem
            </button>
          )}
        </div>

        {/* Add item form */}
        {showAddItem && (
          <div className="p-4 border-b border-white/5">
            <AddItemForm onAdd={handleAddItem} onCancel={() => setShowAddItem(false)} />
          </div>
        )}

        {order.items.length === 0 && !showAddItem ? (
          <div className="py-10 text-center text-gray-600 text-sm">
            No hay ítems registrados. Agrega mano de obra o repuestos.
          </div>
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
                {order.items.map((item) => (
                  <tr key={item.id} className="hover:bg-white/3 transition-colors group">
                    <td className="py-3 px-5 text-gray-200">{item.description}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        item.type === "labor"
                          ? "bg-blue-500/15 text-blue-300"
                          : "bg-orange-500/15 text-orange-300"
                      }`}>
                        {item.type === "labor" ? "Mano de obra" : "Repuesto"}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right text-gray-400">{item.quantity}</td>
                    <td className="py-3 px-4 text-right text-gray-400">{fmt(item.unit_price)}</td>
                    <td className="py-3 px-4 text-right text-gray-200 font-medium">{fmt(item.total)}</td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleRemoveItem(item.id)}
                        className="text-gray-700 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
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

        {/* Cost summary */}
        {order.items.length > 0 && (
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
            {order.estimated_cost > 0 && (
              <div className="flex justify-between text-xs text-gray-600 pt-1">
                <span>Costo estimado original</span>
                <span>{fmt(order.estimated_cost)}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
