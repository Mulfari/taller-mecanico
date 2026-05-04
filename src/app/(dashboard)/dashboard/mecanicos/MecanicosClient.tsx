"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createMechanic, updateMechanic, deactivateMechanic } from "./actions";

// ── Types ──────────────────────────────────────────────────────────────────

type WorkOrderStatus = "received" | "diagnosing" | "repairing" | "ready" | "delivered";

interface ActiveOrder {
  id: string;
  status: WorkOrderStatus;
  description: string | null;
  received_at: string | null;
  vehicle: { brand: string; model: string; year: number; plate: string | null } | null;
  client: { full_name: string | null; email: string } | null;
}

interface MechanicData {
  id: string;
  full_name: string | null;
  email: string;
  phone: string | null;
  activeOrders: ActiveOrder[];
  deliveredCount: number;
  revenue: number;
}

// ── Icons ──────────────────────────────────────────────────────────────────

function IconPlus() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
  );
}

function IconPhone() {
  return (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
    </svg>
  );
}

function IconCar() {
  return (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
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

function IconSpinner() {
  return (
    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
    </svg>
  );
}

function IconCheck() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
    </svg>
  );
}

function IconEdit() {
  return (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
    </svg>
  );
}

function IconHardHat() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437l1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008z" />
    </svg>
  );
}

function IconTrash() {
  return (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
    </svg>
  );
}

// ── Constants ──────────────────────────────────────────────────────────────

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

const STATUS_DOT: Record<WorkOrderStatus, string> = {
  received: "bg-gray-400",
  diagnosing: "bg-yellow-400",
  repairing: "bg-blue-400",
  ready: "bg-green-400",
  delivered: "bg-gray-600",
};

const fmt = (n: number) =>
  `$${n.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

function daysAgo(dateStr: string | null): string {
  if (!dateStr) return "";
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86_400_000);
  if (diff === 0) return "hoy";
  if (diff === 1) return "ayer";
  return `hace ${diff} días`;
}

const inputClass =
  "w-full bg-[#1a1a2e] border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-[#e94560]/60 focus:ring-1 focus:ring-[#e94560]/30 transition-colors";

// ── Add Mechanic Modal ────────────────────────────────────────────────────

function AddMechanicModal({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) {
      setError("El correo electrónico es requerido.");
      return;
    }
    if (!fullName.trim()) {
      setError("El nombre es requerido.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await createMechanic({ email, full_name: fullName, phone });
      setSaved(true);
      setTimeout(() => {
        router.refresh();
        onClose();
      }, 800);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al crear mecánico.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.7)" }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-mechanic-title"
    >
      <div className="bg-[#16213e] border border-white/10 rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
          <h2 id="add-mechanic-title" className="text-white font-semibold text-base">
            Agregar mecánico
          </h2>
          <button type="button" onClick={onClose} className="text-gray-500 hover:text-white transition-colors" aria-label="Cerrar">
            <IconX />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 text-red-400 text-sm">
              {error}
            </div>
          )}
          <div className="space-y-1.5">
            <label htmlFor="mech-name" className="block text-gray-400 text-xs font-medium">
              Nombre completo <span className="text-[#e94560]">*</span>
            </label>
            <input id="mech-name" type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} className={inputClass} placeholder="Ej. Juan Pérez" required autoFocus />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="mech-email" className="block text-gray-400 text-xs font-medium">
              Correo electrónico <span className="text-[#e94560]">*</span>
            </label>
            <input id="mech-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} placeholder="mecanico@taller.com" required />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="mech-phone" className="block text-gray-400 text-xs font-medium">
              Teléfono
            </label>
            <input id="mech-phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className={inputClass} placeholder="Ej. +52 55 1234 5678" />
          </div>
          <p className="text-gray-600 text-xs">
            Si ya existe un perfil con este correo, se actualizará su rol a mecánico.
          </p>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2.5 rounded-lg text-sm font-medium text-gray-400 border border-white/10 hover:border-white/20 hover:text-white transition-colors">
              Cancelar
            </button>
            <button type="submit" disabled={saving || saved} className="inline-flex items-center gap-2 bg-[#e94560] hover:bg-[#c73652] disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors">
              {saving ? (<><IconSpinner /> Guardando…</>) : saved ? (<><IconCheck /> Agregado</>) : (<><IconPlus /> Agregar mecánico</>)}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Edit Mechanic Modal ───────────────────────────────────────────────────

function EditMechanicModal({
  mechanic,
  onClose,
}: {
  mechanic: MechanicData;
  onClose: () => void;
}) {
  const router = useRouter();
  const [fullName, setFullName] = useState(mechanic.full_name ?? "");
  const [phone, setPhone] = useState(mechanic.phone ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!fullName.trim()) {
      setError("El nombre es requerido.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await updateMechanic(mechanic.id, { full_name: fullName, phone });
      setSaved(true);
      setTimeout(() => {
        router.refresh();
        onClose();
      }, 800);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.7)" }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-mechanic-title"
    >
      <div className="bg-[#16213e] border border-white/10 rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
          <h2 id="edit-mechanic-title" className="text-white font-semibold text-base">
            Editar mecánico
          </h2>
          <button type="button" onClick={onClose} className="text-gray-500 hover:text-white transition-colors" aria-label="Cerrar">
            <IconX />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 text-red-400 text-sm">
              {error}
            </div>
          )}
          <div className="space-y-1.5">
            <label htmlFor="edit-mech-name" className="block text-gray-400 text-xs font-medium">
              Nombre completo <span className="text-[#e94560]">*</span>
            </label>
            <input id="edit-mech-name" type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} className={inputClass} placeholder="Nombre del mecánico" required autoFocus />
          </div>
          <div className="space-y-1.5">
            <label className="block text-gray-400 text-xs font-medium">Correo electrónico</label>
            <p className="text-gray-500 text-sm bg-[#1a1a2e] border border-white/5 rounded-lg px-3 py-2.5">{mechanic.email}</p>
          </div>
          <div className="space-y-1.5">
            <label htmlFor="edit-mech-phone" className="block text-gray-400 text-xs font-medium">
              Teléfono
            </label>
            <input id="edit-mech-phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className={inputClass} placeholder="Ej. +52 55 1234 5678" />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2.5 rounded-lg text-sm font-medium text-gray-400 border border-white/10 hover:border-white/20 hover:text-white transition-colors">
              Cancelar
            </button>
            <button type="submit" disabled={saving || saved} className="inline-flex items-center gap-2 bg-[#e94560] hover:bg-[#c73652] disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors">
              {saving ? (<><IconSpinner /> Guardando…</>) : saved ? (<><IconCheck /> Guardado</>) : "Guardar cambios"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Deactivate Confirmation Modal ─────────────────────────────────────────

function DeactivateModal({
  mechanic,
  onClose,
}: {
  mechanic: MechanicData;
  onClose: () => void;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDeactivate() {
    setLoading(true);
    setError(null);
    try {
      await deactivateMechanic(mechanic.id);
      router.refresh();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al desactivar.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.7)" }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="deactivate-mechanic-title"
    >
      <div className="bg-[#16213e] border border-white/10 rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
          <h2 id="deactivate-mechanic-title" className="text-white font-semibold text-base">
            Desactivar mecánico
          </h2>
          <button type="button" onClick={onClose} className="text-gray-500 hover:text-white transition-colors" aria-label="Cerrar">
            <IconX />
          </button>
        </div>
        <div className="px-6 py-5 space-y-4">
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 text-red-400 text-sm">
              {error}
            </div>
          )}
          <p className="text-gray-300 text-sm">
            ¿Estás seguro de que deseas desactivar a <span className="text-white font-medium">{mechanic.full_name ?? mechanic.email}</span>?
          </p>
          <p className="text-gray-500 text-xs">
            Su rol cambiará a cliente y ya no aparecerá en la lista de mecánicos. No se eliminarán sus órdenes anteriores.
          </p>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2.5 rounded-lg text-sm font-medium text-gray-400 border border-white/10 hover:border-white/20 hover:text-white transition-colors">
              Cancelar
            </button>
            <button onClick={handleDeactivate} disabled={loading} className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors">
              {loading ? (<><IconSpinner /> Desactivando…</>) : (<><IconTrash /> Desactivar</>)}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────

function StatPill({ label, value, accent }: { label: string; value: string | number; accent?: boolean }) {
  return (
    <div className="text-center">
      <p className={`text-xl font-bold ${accent ? "text-[#e94560]" : "text-white"}`}>{value}</p>
      <p className="text-gray-500 text-xs mt-0.5">{label}</p>
    </div>
  );
}

function MechanicCard({
  mechanic,
  onEdit,
  onDeactivate,
}: {
  mechanic: MechanicData;
  onEdit: (m: MechanicData) => void;
  onDeactivate: (m: MechanicData) => void;
}) {
  const initials = (mechanic.full_name ?? mechanic.email)
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const workloadColor =
    mechanic.activeOrders.length === 0
      ? "text-gray-600"
      : mechanic.activeOrders.length <= 2
      ? "text-green-400"
      : mechanic.activeOrders.length <= 4
      ? "text-yellow-400"
      : "text-red-400";

  return (
    <div className="bg-[#16213e] border border-white/10 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 flex items-start gap-4 border-b border-white/5">
        <Link
          href={`/dashboard/mecanicos/${mechanic.id}`}
          className="w-12 h-12 rounded-full bg-[#e94560]/15 border border-[#e94560]/30 flex items-center justify-center shrink-0 hover:bg-[#e94560]/25 transition-colors"
        >
          <span className="text-[#e94560] font-bold text-sm">{initials}</span>
        </Link>
        <div className="flex-1 min-w-0">
          <Link
            href={`/dashboard/mecanicos/${mechanic.id}`}
            className="text-white font-semibold truncate hover:text-[#e94560] transition-colors block"
          >
            {mechanic.full_name ?? mechanic.email}
          </Link>
          <p className="text-gray-500 text-xs truncate">{mechanic.email}</p>
          {mechanic.phone && (
            <p className="text-gray-500 text-xs flex items-center gap-1 mt-0.5">
              <IconPhone /> {mechanic.phone}
            </p>
          )}
        </div>
        <div className="shrink-0 flex items-center gap-1">
          <button
            onClick={() => onEdit(mechanic)}
            className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white text-xs font-medium transition-colors"
            title="Editar mecánico"
          >
            <IconEdit />
          </button>
          <button
            onClick={() => onDeactivate(mechanic)}
            className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg bg-white/5 text-gray-400 hover:bg-red-500/20 hover:text-red-400 text-xs font-medium transition-colors"
            title="Desactivar mecánico"
          >
            <IconTrash />
          </button>
          <Link
            href={`/dashboard/ordenes/nueva?mechanic=${mechanic.id}`}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#e94560]/10 text-[#e94560] hover:bg-[#e94560]/20 text-xs font-medium transition-colors"
            title="Nueva orden para este mecánico"
          >
            <IconPlus /> Orden
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 divide-x divide-white/5 px-2 py-3">
        <StatPill label="Activas" value={mechanic.activeOrders.length} accent={mechanic.activeOrders.length > 0} />
        <StatPill label="Entregadas" value={mechanic.deliveredCount} />
        <StatPill label="Ingresos" value={fmt(mechanic.revenue)} />
      </div>

      {/* Active orders */}
      <div className="border-t border-white/5">
        {mechanic.activeOrders.length === 0 ? (
          <p className="text-gray-600 text-sm text-center py-5">Sin órdenes activas</p>
        ) : (
          <ul className="divide-y divide-white/5">
            {mechanic.activeOrders.slice(0, 5).map((order) => (
              <li key={order.id}>
                <Link
                  href={`/dashboard/ordenes/${order.id}`}
                  className="flex items-start gap-3 px-5 py-3 hover:bg-white/[0.03] transition-colors group"
                >
                  <span className={`mt-0.5 w-2 h-2 rounded-full shrink-0 ${STATUS_DOT[order.status]}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      {order.vehicle ? (
                        <span className="text-gray-200 text-sm font-medium group-hover:text-white transition-colors flex items-center gap-1">
                          <IconCar />
                          {order.vehicle.brand} {order.vehicle.model} {order.vehicle.year}
                        </span>
                      ) : (
                        <span className="text-gray-500 text-sm">Vehículo desconocido</span>
                      )}
                      {order.vehicle?.plate && (
                        <span className="font-mono text-xs bg-white/5 px-1.5 py-0.5 rounded text-gray-400">
                          {order.vehicle.plate}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[order.status]}`}>
                        {STATUS_LABELS[order.status]}
                      </span>
                      {order.received_at && (
                        <span className="text-gray-600 text-xs">{daysAgo(order.received_at)}</span>
                      )}
                    </div>
                    {order.client?.full_name && (
                      <p className="text-gray-500 text-xs mt-0.5 truncate">{order.client.full_name}</p>
                    )}
                  </div>
                </Link>
              </li>
            ))}
            {mechanic.activeOrders.length > 5 && (
              <li className="px-5 py-2 text-center">
                <span className="text-gray-600 text-xs">+{mechanic.activeOrders.length - 5} más</span>
              </li>
            )}
          </ul>
        )}
      </div>

      {/* Workload indicator */}
      <div className="px-5 py-3 border-t border-white/5 flex items-center justify-between">
        <span className="text-gray-600 text-xs">Carga de trabajo</span>
        <span className={`text-xs font-semibold ${workloadColor}`}>
          {mechanic.activeOrders.length === 0
            ? "Disponible"
            : mechanic.activeOrders.length <= 2
            ? "Normal"
            : mechanic.activeOrders.length <= 4
            ? "Ocupado"
            : "Sobrecargado"}
        </span>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────

interface Props {
  mechanics: MechanicData[];
}

export default function MecanicosClient({ mechanics }: Props) {
  const [showAdd, setShowAdd] = useState(false);
  const [editTarget, setEditTarget] = useState<MechanicData | null>(null);
  const [deactivateTarget, setDeactivateTarget] = useState<MechanicData | null>(null);

  const totalActive = mechanics.reduce((s, m) => s + m.activeOrders.length, 0);
  const totalDelivered = mechanics.reduce((s, m) => s + m.deliveredCount, 0);
  const totalRevenue = mechanics.reduce((s, m) => s + m.revenue, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Mecánicos</h1>
          <p className="text-gray-500 text-sm mt-1">
            {mechanics.length} mecánico{mechanics.length !== 1 ? "s" : ""} registrado{mechanics.length !== 1 ? "s" : ""}
          </p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="inline-flex items-center gap-2 bg-[#e94560] hover:bg-[#c73652] text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors"
        >
          <IconPlus /> Agregar mecánico
        </button>
      </div>

      {/* Summary KPIs */}
      {mechanics.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Mecánicos", value: mechanics.length },
            { label: "Órdenes activas", value: totalActive, accent: totalActive > 0 },
            { label: "Entregadas", value: totalDelivered },
            { label: "Ingresos totales", value: fmt(totalRevenue), accent: true },
          ].map((kpi) => (
            <div key={kpi.label} className="bg-[#16213e] border border-white/10 rounded-xl px-5 py-4">
              <p className="text-gray-500 text-xs uppercase tracking-wide">{kpi.label}</p>
              <p className={`text-2xl font-bold mt-1 ${kpi.accent ? "text-[#e94560]" : "text-white"}`}>{kpi.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Mechanic cards */}
      {mechanics.length === 0 ? (
        <div className="bg-[#16213e] border border-white/10 rounded-xl py-20 text-center">
          <div className="flex justify-center mb-4 text-gray-600">
            <IconHardHat />
          </div>
          <p className="text-gray-400 font-medium">No hay mecánicos registrados</p>
          <p className="text-gray-600 text-sm mt-1">
            Haz clic en &quot;Agregar mecánico&quot; para registrar al primer técnico del taller.
          </p>
          <button
            onClick={() => setShowAdd(true)}
            className="mt-4 inline-flex items-center gap-2 bg-[#e94560]/10 hover:bg-[#e94560]/20 text-[#e94560] text-sm font-medium px-4 py-2.5 rounded-lg transition-colors"
          >
            <IconPlus /> Agregar mecánico
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5">
          {mechanics.map((m) => (
            <MechanicCard
              key={m.id}
              mechanic={m}
              onEdit={setEditTarget}
              onDeactivate={setDeactivateTarget}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      {showAdd && <AddMechanicModal onClose={() => setShowAdd(false)} />}
      {editTarget && <EditMechanicModal mechanic={editTarget} onClose={() => setEditTarget(null)} />}
      {deactivateTarget && <DeactivateModal mechanic={deactivateTarget} onClose={() => setDeactivateTarget(null)} />}
    </div>
  );
}
