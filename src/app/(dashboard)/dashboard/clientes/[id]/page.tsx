"use client";

import { use, useState } from "react";
import Link from "next/link";

// ── Icons ──────────────────────────────────────────────────────────────────
function IconArrowLeft() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
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
function IconX() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
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
function IconCar() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 17H3a2 2 0 01-2-2v-4a2 2 0 012-2h1l2-4h10l2 4h1a2 2 0 012 2v4a2 2 0 01-2 2h-2m-10 0a2 2 0 104 0m6 0a2 2 0 104 0" />
    </svg>
  );
}

// ── Types ──────────────────────────────────────────────────────────────────
type WorkOrderStatus = "received" | "diagnosing" | "repairing" | "ready" | "delivered";
type AppointmentStatus = "pending" | "confirmed" | "completed" | "cancelled";

interface Vehicle {
  id: string;
  brand: string;
  model: string;
  year: number;
  plate: string;
  color: string;
  vin: string;
  mileage: number;
}

interface WorkOrder {
  id: string;
  vehicle: string;
  plate: string;
  status: WorkOrderStatus;
  description: string;
  received_at: string;
  final_cost: number;
  estimated_cost: number;
}

interface Appointment {
  id: string;
  vehicle: string;
  date: string;
  time_slot: string;
  service_type: string;
  status: AppointmentStatus;
}

interface ClientDetail {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  created_at: string;
  vehicles: Vehicle[];
  work_orders: WorkOrder[];
  appointments: Appointment[];
}

// ── Mock data ──────────────────────────────────────────────────────────────
// swap for Supabase queries later
const MOCK_CLIENTS: Record<string, ClientDetail> = {
  "1": {
    id: "1",
    full_name: "Carlos Mendoza",
    email: "carlos.mendoza@email.com",
    phone: "555-0101",
    created_at: "2024-03-10",
    vehicles: [
      { id: "v1", brand: "Toyota", model: "Corolla", year: 2019, plate: "ABC-123", color: "Blanco", vin: "1NXBR32E79Z123456", mileage: 87400 },
      { id: "v2", brand: "Honda", model: "CR-V", year: 2021, plate: "XYZ-999", color: "Gris", vin: "2HKRW2H59MH123456", mileage: 34200 },
    ],
    work_orders: [
      { id: "OT-0041", vehicle: "Toyota Corolla 2019", plate: "ABC-123", status: "repairing", description: "Cambio de embrague y revisión de transmisión", received_at: "2026-04-29", estimated_cost: 4500, final_cost: 0 },
      { id: "OT-0028", vehicle: "Toyota Corolla 2019", plate: "ABC-123", status: "delivered", description: "Cambio de aceite y filtros", received_at: "2026-02-14", estimated_cost: 950, final_cost: 950 },
    ],
    appointments: [
      { id: "a1", vehicle: "Honda CR-V 2021", date: "2026-05-05", time_slot: "10:00", service_type: "Revisión general", status: "confirmed" },
    ],
  },
  "2": {
    id: "2",
    full_name: "Ana Rodríguez",
    email: "ana.rodriguez@email.com",
    phone: "555-0202",
    created_at: "2024-05-22",
    vehicles: [
      { id: "v3", brand: "Honda", model: "Civic", year: 2021, plate: "XYZ-789", color: "Azul", vin: "2HGFC2F59MH123456", mileage: 41000 },
    ],
    work_orders: [
      { id: "OT-0040", vehicle: "Honda Civic 2021", plate: "XYZ-789", status: "diagnosing", description: "Ruido extraño al frenar", received_at: "2026-04-29", estimated_cost: 1200, final_cost: 0 },
    ],
    appointments: [],
  },
  "3": {
    id: "3",
    full_name: "Miguel Torres",
    email: "miguel.torres@email.com",
    phone: "555-0303",
    created_at: "2024-07-14",
    vehicles: [
      { id: "v4", brand: "Nissan", model: "Sentra", year: 2018, plate: "DEF-456", color: "Negro", vin: "3N1AB7AP9JY123456", mileage: 62000 },
    ],
    work_orders: [
      { id: "OT-0039", vehicle: "Nissan Sentra 2018", plate: "DEF-456", status: "ready", description: "Cambio de pastillas y discos delanteros", received_at: "2026-04-28", estimated_cost: 2800, final_cost: 2800 },
    ],
    appointments: [],
  },
  "4": { id: "4", full_name: "Laura Jiménez", email: "laura.jimenez@email.com", phone: "555-0404", created_at: "2025-01-08", vehicles: [{ id: "v5", brand: "Chevrolet", model: "Spark", year: 2020, plate: "GHI-321", color: "Rojo", vin: "KL8CD6SA9LC123456", mileage: 28000 }], work_orders: [{ id: "OT-0038", vehicle: "Chevrolet Spark 2020", plate: "GHI-321", status: "received", description: "Revisión general, falla en encendido", received_at: "2026-04-30", estimated_cost: 0, final_cost: 0 }], appointments: [] },
  "5": { id: "5", full_name: "Roberto Díaz", email: "roberto.diaz@email.com", phone: "555-0505", created_at: "2023-11-30", vehicles: [{ id: "v6", brand: "Ford", model: "Focus", year: 2017, plate: "JKL-654", color: "Plata", vin: "1FADP3F20HL123456", mileage: 95000 }, { id: "v7", brand: "Volkswagen", model: "Jetta", year: 2019, plate: "MNO-111", color: "Blanco", vin: "3VWF17AT9KM123456", mileage: 55000 }, { id: "v8", brand: "Mazda", model: "CX-5", year: 2022, plate: "PQR-222", color: "Azul", vin: "JM3KFBDM9N0123456", mileage: 18000 }], work_orders: [{ id: "OT-0037", vehicle: "Ford Focus 2017", plate: "JKL-654", status: "repairing", description: "Reparación de motor, fuga de aceite", received_at: "2026-04-27", estimated_cost: 6200, final_cost: 0 }], appointments: [{ id: "a2", vehicle: "Volkswagen Jetta 2019", date: "2026-05-10", time_slot: "09:00", service_type: "Afinación", status: "pending" }] },
  "6": { id: "6", full_name: "Sofía Vargas", email: "sofia.vargas@email.com", phone: "555-0606", created_at: "2024-09-03", vehicles: [{ id: "v9", brand: "Kia", model: "Sportage", year: 2022, plate: "MNO-987", color: "Blanco", vin: "KNDPMCAC9N7123456", mileage: 22000 }], work_orders: [{ id: "OT-0036", vehicle: "Kia Sportage 2022", plate: "MNO-987", status: "delivered", description: "Cambio de aceite y filtros", received_at: "2026-04-25", estimated_cost: 950, final_cost: 950 }], appointments: [] },
  "7": { id: "7", full_name: "Andrés Morales", email: "andres.morales@email.com", phone: "555-0707", created_at: "2024-02-17", vehicles: [{ id: "v10", brand: "Hyundai", model: "Tucson", year: 2020, plate: "PQR-741", color: "Gris", vin: "KM8J3CA46LU123456", mileage: 48000 }, { id: "v11", brand: "Chevrolet", model: "Aveo", year: 2016, plate: "STU-852", color: "Rojo", vin: "KL1TD5DE9GB123456", mileage: 110000 }], work_orders: [{ id: "OT-0035", vehicle: "Hyundai Tucson 2020", plate: "PQR-741", status: "delivered", description: "Alineación, balanceo y cambio de neumáticos", received_at: "2026-04-24", estimated_cost: 3100, final_cost: 3100 }], appointments: [] },
  "8": { id: "8", full_name: "Patricia Núñez", email: "patricia.nunez@email.com", phone: "555-0808", created_at: "2025-03-21", vehicles: [{ id: "v12", brand: "Mazda", model: "3", year: 2019, plate: "STU-852", color: "Rojo", vin: "JM1BN1V79K0123456", mileage: 51000 }], work_orders: [{ id: "OT-0034", vehicle: "Mazda 3 2019", plate: "STU-852", status: "diagnosing", description: "Luz de check engine encendida", received_at: "2026-04-30", estimated_cost: 0, final_cost: 0 }], appointments: [] },
};

// ── Status helpers ─────────────────────────────────────────────────────────
const WO_STATUS_LABELS: Record<WorkOrderStatus, string> = {
  received: "Recibido",
  diagnosing: "Diagnóstico",
  repairing: "En reparación",
  ready: "Listo",
  delivered: "Entregado",
};
const WO_STATUS_COLORS: Record<WorkOrderStatus, string> = {
  received: "bg-gray-500/20 text-gray-300",
  diagnosing: "bg-yellow-500/20 text-yellow-300",
  repairing: "bg-blue-500/20 text-blue-300",
  ready: "bg-green-500/20 text-green-300",
  delivered: "bg-gray-600/20 text-gray-500",
};
const APPT_STATUS_LABELS: Record<AppointmentStatus, string> = {
  pending: "Pendiente",
  confirmed: "Confirmada",
  completed: "Completada",
  cancelled: "Cancelada",
};
const APPT_STATUS_COLORS: Record<AppointmentStatus, string> = {
  pending: "bg-yellow-500/20 text-yellow-300",
  confirmed: "bg-blue-500/20 text-blue-300",
  completed: "bg-green-500/20 text-green-300",
  cancelled: "bg-red-500/20 text-red-300",
};

function WOBadge({ status }: { status: WorkOrderStatus }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${WO_STATUS_COLORS[status]}`}>
      {WO_STATUS_LABELS[status]}
    </span>
  );
}
function ApptBadge({ status }: { status: AppointmentStatus }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${APPT_STATUS_COLORS[status]}`}>
      {APPT_STATUS_LABELS[status]}
    </span>
  );
}

function formatDate(d: string) {
  return new Date(d + "T00:00:00").toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" });
}

// ── Add Vehicle Modal ──────────────────────────────────────────────────────
const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 30 }, (_, i) => CURRENT_YEAR - i);

const inputClass =
  "w-full bg-[#1a1a2e] border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-[#e94560]/60 focus:ring-1 focus:ring-[#e94560]/30 transition-colors";
const selectClass =
  "w-full bg-[#1a1a2e] border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#e94560]/60 focus:ring-1 focus:ring-[#e94560]/30 transition-colors appearance-none";

interface VehicleForm { brand: string; model: string; year: string; plate: string; color: string; vin: string; mileage: string }
const EMPTY_VEHICLE: VehicleForm = { brand: "", model: "", year: String(CURRENT_YEAR), plate: "", color: "", vin: "", mileage: "" };

function AddVehicleModal({ onClose, onAdd }: { onClose: () => void; onAdd: (v: Vehicle) => void }) {
  const [form, setForm] = useState<VehicleForm>(EMPTY_VEHICLE);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Partial<VehicleForm>>({});

  function set(field: keyof VehicleForm, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
    setErrors((e) => ({ ...e, [field]: undefined }));
  }

  function validate(): boolean {
    const e: Partial<VehicleForm> = {};
    if (!form.brand.trim()) e.brand = "Requerido";
    if (!form.model.trim()) e.model = "Requerido";
    if (!form.plate.trim()) e.plate = "Requerido";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    // swap for Supabase insert later
    await new Promise((r) => setTimeout(r, 700));
    onAdd({
      id: String(Date.now()),
      brand: form.brand.trim(),
      model: form.model.trim(),
      year: Number(form.year),
      plate: form.plate.trim().toUpperCase(),
      color: form.color.trim(),
      vin: form.vin.trim().toUpperCase(),
      mileage: Number(form.mileage) || 0,
    });
    setSaving(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[#16213e] border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <h2 className="text-white font-semibold text-lg">Agregar vehículo</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors" aria-label="Cerrar">
            <IconX />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Marca <span className="text-[#e94560]">*</span></label>
              <input className={inputClass} placeholder="Ej. Toyota" value={form.brand} onChange={(e) => set("brand", e.target.value)} />
              {errors.brand && <p className="text-red-400 text-xs mt-1">{errors.brand}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Modelo <span className="text-[#e94560]">*</span></label>
              <input className={inputClass} placeholder="Ej. Corolla" value={form.model} onChange={(e) => set("model", e.target.value)} />
              {errors.model && <p className="text-red-400 text-xs mt-1">{errors.model}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Año</label>
              <div className="relative">
                <select className={selectClass} value={form.year} onChange={(e) => set("year", e.target.value)}>
                  {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-gray-500"><IconChevronDown /></div>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Placa <span className="text-[#e94560]">*</span></label>
              <input className={inputClass} placeholder="ABC-123" value={form.plate} onChange={(e) => set("plate", e.target.value)} />
              {errors.plate && <p className="text-red-400 text-xs mt-1">{errors.plate}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Color</label>
              <input className={inputClass} placeholder="Ej. Blanco" value={form.color} onChange={(e) => set("color", e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Kilometraje</label>
              <input type="number" min="0" className={inputClass} placeholder="0" value={form.mileage} onChange={(e) => set("mileage", e.target.value)} />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-300 mb-1.5">VIN</label>
              <input className={inputClass} placeholder="17 caracteres" maxLength={17} value={form.vin} onChange={(e) => set("vin", e.target.value)} />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 rounded-lg border border-white/10 text-gray-400 text-sm hover:text-white hover:border-white/20 transition-colors">
              Cancelar
            </button>
            <button type="submit" disabled={saving} className="flex-1 inline-flex items-center justify-center gap-2 bg-[#e94560] hover:bg-[#c73652] disabled:opacity-60 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors">
              {saving ? <><IconSpinner /> Guardando…</> : "Guardar vehículo"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────
export default function ClienteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const raw = MOCK_CLIENTS[id];

  const [client, setClient] = useState<ClientDetail | null>(raw ?? null);
  const [showAddVehicle, setShowAddVehicle] = useState(false);

  if (!client) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-4">
        <p className="text-gray-400">Cliente no encontrado.</p>
        <Link href="/dashboard/clientes" className="inline-flex items-center gap-1.5 text-[#e94560] text-sm hover:underline">
          <IconArrowLeft /> Volver a clientes
        </Link>
      </div>
    );
  }

  function handleAddVehicle(v: Vehicle) {
    setClient((prev) => prev ? { ...prev, vehicles: [...prev.vehicles, v] } : prev);
    setShowAddVehicle(false);
  }

  return (
    <div className="space-y-6">
      {/* Back + header */}
      <div>
        <Link href="/dashboard/clientes" className="inline-flex items-center gap-1.5 text-gray-500 hover:text-white text-sm transition-colors mb-4">
          <IconArrowLeft /> Clientes
        </Link>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">{client.full_name}</h1>
            <p className="text-gray-500 text-sm mt-1">
              Cliente desde {formatDate(client.created_at)}
            </p>
          </div>
        </div>
      </div>

      {/* Info card */}
      <div className="bg-[#16213e] border border-white/10 rounded-xl p-5">
        <h2 className="text-white font-semibold mb-4">Datos de contacto</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <p className="text-gray-500 text-xs uppercase tracking-wide mb-1">Correo</p>
            <p className="text-gray-200 text-sm">{client.email}</p>
          </div>
          <div>
            <p className="text-gray-500 text-xs uppercase tracking-wide mb-1">Teléfono</p>
            <p className="text-gray-200 text-sm">{client.phone || <span className="text-gray-600">—</span>}</p>
          </div>
          <div>
            <p className="text-gray-500 text-xs uppercase tracking-wide mb-1">Vehículos</p>
            <p className="text-gray-200 text-sm">{client.vehicles.length}</p>
          </div>
        </div>
      </div>

      {/* Vehicles */}
      <div className="bg-[#16213e] border border-white/10 rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
          <h2 className="text-white font-semibold flex items-center gap-2">
            <IconCar />
            Vehículos registrados
            <span className="text-xs text-gray-500 font-normal">({client.vehicles.length})</span>
          </h2>
          <button
            onClick={() => setShowAddVehicle(true)}
            className="inline-flex items-center gap-1.5 bg-[#e94560] hover:bg-[#c73652] text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
          >
            <IconPlus /> Agregar vehículo
          </button>
        </div>
        {client.vehicles.length === 0 ? (
          <p className="py-10 text-center text-gray-600 text-sm">Sin vehículos registrados.</p>
        ) : (
          <div className="divide-y divide-white/5">
            {client.vehicles.map((v) => (
              <div key={v.id} className="px-5 py-4 flex flex-wrap gap-x-8 gap-y-2">
                <div>
                  <p className="text-white font-medium">{v.brand} {v.model} {v.year}</p>
                  <p className="text-gray-500 text-xs mt-0.5">Placa: {v.plate}</p>
                </div>
                <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-gray-400 items-center">
                  {v.color && <span>Color: {v.color}</span>}
                  {v.mileage > 0 && <span>{v.mileage.toLocaleString("es-MX")} km</span>}
                  {v.vin && <span className="font-mono text-xs text-gray-600">VIN: {v.vin}</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Work orders */}
      <div className="bg-[#16213e] border border-white/10 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-white/5">
          <h2 className="text-white font-semibold">
            Historial de órdenes
            <span className="text-xs text-gray-500 font-normal ml-2">({client.work_orders.length})</span>
          </h2>
        </div>
        {client.work_orders.length === 0 ? (
          <p className="py-10 text-center text-gray-600 text-sm">Sin órdenes de trabajo.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[560px]">
              <thead>
                <tr className="text-gray-500 text-xs uppercase tracking-wide border-b border-white/5">
                  <th className="text-left py-3 px-5 font-medium">OT / Descripción</th>
                  <th className="text-left py-3 px-4 font-medium">Vehículo</th>
                  <th className="text-left py-3 px-4 font-medium">Estado</th>
                  <th className="text-left py-3 px-4 font-medium">Fecha</th>
                  <th className="text-right py-3 px-5 font-medium">Costo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {client.work_orders.map((wo) => (
                  <tr key={wo.id} className="hover:bg-white/[0.03] transition-colors">
                    <td className="py-3.5 px-5">
                      <Link href={`/dashboard/ordenes/${wo.id}`} className="text-[#e94560] font-mono text-xs hover:underline">{wo.id}</Link>
                      <p className="text-gray-300 text-xs mt-0.5 max-w-[220px] truncate">{wo.description}</p>
                    </td>
                    <td className="py-3.5 px-4">
                      <p className="text-gray-300 text-xs">{wo.vehicle}</p>
                      <p className="text-gray-600 text-xs">{wo.plate}</p>
                    </td>
                    <td className="py-3.5 px-4"><WOBadge status={wo.status} /></td>
                    <td className="py-3.5 px-4 text-gray-400 text-xs whitespace-nowrap">{formatDate(wo.received_at)}</td>
                    <td className="py-3.5 px-5 text-right text-gray-300 text-xs">
                      {wo.final_cost > 0
                        ? `$${wo.final_cost.toLocaleString("es-MX")}`
                        : wo.estimated_cost > 0
                          ? <span className="text-gray-500">Est. ${wo.estimated_cost.toLocaleString("es-MX")}</span>
                          : <span className="text-gray-600">—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Appointments */}
      <div className="bg-[#16213e] border border-white/10 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-white/5">
          <h2 className="text-white font-semibold">
            Historial de citas
            <span className="text-xs text-gray-500 font-normal ml-2">({client.appointments.length})</span>
          </h2>
        </div>
        {client.appointments.length === 0 ? (
          <p className="py-10 text-center text-gray-600 text-sm">Sin citas registradas.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[480px]">
              <thead>
                <tr className="text-gray-500 text-xs uppercase tracking-wide border-b border-white/5">
                  <th className="text-left py-3 px-5 font-medium">Servicio</th>
                  <th className="text-left py-3 px-4 font-medium">Vehículo</th>
                  <th className="text-left py-3 px-4 font-medium">Fecha / Hora</th>
                  <th className="text-left py-3 px-4 font-medium">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {client.appointments.map((a) => (
                  <tr key={a.id} className="hover:bg-white/[0.03] transition-colors">
                    <td className="py-3.5 px-5 text-gray-200">{a.service_type}</td>
                    <td className="py-3.5 px-4 text-gray-400 text-xs">{a.vehicle}</td>
                    <td className="py-3.5 px-4 text-gray-400 text-xs whitespace-nowrap">
                      {formatDate(a.date)} · {a.time_slot}
                    </td>
                    <td className="py-3.5 px-4"><ApptBadge status={a.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showAddVehicle && <AddVehicleModal onClose={() => setShowAddVehicle(false)} onAdd={handleAddVehicle} />}
    </div>
  );
}
