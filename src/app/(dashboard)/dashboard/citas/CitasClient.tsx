"use client";

import { useState, useMemo, useTransition } from "react";
import type { AppointmentWithRelations } from "@/lib/supabase/queries/appointments";
import type { AppointmentStatus } from "@/types/database";
import { updateAppointmentStatusAction, createAppointmentAction, createWorkOrderFromAppointmentAction } from "./actions";

// ── Prop types ─────────────────────────────────────────────────────────────

interface ClientOption {
  id: string;
  full_name: string | null;
  email: string;
  phone: string | null;
}

interface VehicleOption {
  id: string;
  owner_id: string;
  brand: string;
  model: string;
  year: number;
  plate: string | null;
}

const inputClass =
  "w-full bg-[#1a1a2e] border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-[#e94560]/60 focus:ring-1 focus:ring-[#e94560]/30 transition-colors";
const selectClass =
  "w-full bg-[#1a1a2e] border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#e94560]/60 focus:ring-1 focus:ring-[#e94560]/30 transition-colors appearance-none";

const SERVICE_TYPES = [
  "Mantenimiento preventivo",
  "Cambio de aceite",
  "Revisión de frenos",
  "Alineación y balanceo",
  "Diagnóstico general",
  "Reparación de motor",
  "Reparación de transmisión",
  "Servicio de aire acondicionado",
  "Revisión eléctrica",
  "Otro",
];

const TIME_SLOTS = [
  "08:00", "08:30", "09:00", "09:30", "10:00", "10:30",
  "11:00", "11:30", "12:00", "12:30", "13:00", "13:30",
  "14:00", "14:30", "15:00", "15:30", "16:00", "16:30",
  "17:00", "17:30",
];

// ── Icons ──────────────────────────────────────────────────────────────────

function IconCalendar() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  );
}

function IconClock() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function IconChevronLeft() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
    </svg>
  );
}

function IconChevronRight() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
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

function IconX() {
  return (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
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

function IconChevronDown() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  );
}

// ── Constants ──────────────────────────────────────────────────────────────

const STATUS_LABELS: Record<AppointmentStatus, string> = {
  pending: "Pendiente",
  confirmed: "Confirmada",
  completed: "Completada",
  cancelled: "Cancelada",
};

const STATUS_COLORS: Record<AppointmentStatus, string> = {
  pending: "bg-yellow-500/20 text-yellow-300",
  confirmed: "bg-blue-500/20 text-blue-300",
  completed: "bg-green-500/20 text-green-300",
  cancelled: "bg-gray-500/20 text-gray-500",
};

const STATUS_DOT: Record<AppointmentStatus, string> = {
  pending: "bg-yellow-400",
  confirmed: "bg-blue-400",
  completed: "bg-green-400",
  cancelled: "bg-gray-600",
};

const DAYS_ES = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
const MONTHS_ES = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

// ── Helpers ────────────────────────────────────────────────────────────────

function toDateKey(d: Date) {
  return d.toISOString().slice(0, 10);
}

function formatDate(key: string) {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("es-MX", { weekday: "long", day: "numeric", month: "long" });
}

function isToday(key: string) {
  return key === toDateKey(new Date());
}

// ── Status badge ───────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: AppointmentStatus }) {
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[status]}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[status]}`} />
      {STATUS_LABELS[status]}
    </span>
  );
}

// ── Status action buttons ──────────────────────────────────────────────────

function IconWrench() {
  return (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437l1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008z" />
    </svg>
  );
}

function StatusActions({
  appt,
  onUpdate,
  pending,
}: {
  appt: AppointmentWithRelations;
  onUpdate: (id: string, status: AppointmentStatus) => void;
  pending: boolean;
}) {
  const [creatingOrder, setCreatingOrder] = useState(false);

  async function handleCreateOrder() {
    setCreatingOrder(true);
    try {
      await createWorkOrderFromAppointmentAction(appt.id);
    } catch {
      setCreatingOrder(false);
    }
  }

  if (appt.status === "completed" || appt.status === "cancelled") return null;
  return (
    <div className="flex items-center gap-1.5 flex-wrap justify-end">
      {appt.status === "pending" && (
        <button
          onClick={() => onUpdate(appt.id, "confirmed")}
          disabled={pending}
          className="inline-flex items-center gap-1 px-2 py-1 rounded bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 disabled:opacity-50 text-xs transition-colors"
        >
          <IconCheck /> Confirmar
        </button>
      )}
      {appt.status === "confirmed" && (
        <button
          onClick={handleCreateOrder}
          disabled={creatingOrder || pending}
          className="inline-flex items-center gap-1 px-2 py-1 rounded bg-[#e94560]/20 text-[#e94560] hover:bg-[#e94560]/30 disabled:opacity-50 text-xs transition-colors"
          title="Crear orden de trabajo y marcar cita como completada"
        >
          {creatingOrder ? (
            <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
            </svg>
          ) : (
            <IconWrench />
          )}
          Crear orden
        </button>
      )}
      <button
        onClick={() => onUpdate(appt.id, "cancelled")}
        disabled={pending || creatingOrder}
        className="inline-flex items-center gap-1 px-2 py-1 rounded bg-red-500/10 text-red-400 hover:bg-red-500/20 disabled:opacity-50 text-xs transition-colors"
      >
        <IconX /> Cancelar
      </button>
    </div>
  );
}

// ── Mini calendar ──────────────────────────────────────────────────────────

interface MiniCalendarProps {
  selected: string;
  onSelect: (key: string) => void;
  appointmentDates: Set<string>;
}

function MiniCalendar({ selected, onSelect, appointmentDates }: MiniCalendarProps) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  const firstDay = new Date(viewYear, viewMonth, 1);
  const lastDay = new Date(viewYear, viewMonth + 1, 0);
  const startOffset = firstDay.getDay();

  const days: (Date | null)[] = [];
  for (let i = 0; i < startOffset; i++) days.push(null);
  for (let d = 1; d <= lastDay.getDate(); d++) days.push(new Date(viewYear, viewMonth, d));

  function prevMonth() {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11); }
    else setViewMonth(m => m - 1);
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0); }
    else setViewMonth(m => m + 1);
  }

  return (
    <div className="bg-[#16213e] border border-white/10 rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <button onClick={prevMonth} className="p-1 rounded text-gray-500 hover:text-white hover:bg-white/10 transition-colors" aria-label="Mes anterior">
          <IconChevronLeft />
        </button>
        <span className="text-white text-sm font-semibold">{MONTHS_ES[viewMonth]} {viewYear}</span>
        <button onClick={nextMonth} className="p-1 rounded text-gray-500 hover:text-white hover:bg-white/10 transition-colors" aria-label="Mes siguiente">
          <IconChevronRight />
        </button>
      </div>

      <div className="grid grid-cols-7 mb-1">
        {DAYS_ES.map(d => (
          <div key={d} className="text-center text-xs text-gray-600 font-medium py-1">{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-0.5">
        {days.map((day, i) => {
          if (!day) return <div key={`e-${i}`} />;
          const key = toDateKey(day);
          const isSelected = selected === key;
          const hasAppts = appointmentDates.has(key);
          const todayDay = isToday(key);

          return (
            <button
              key={key}
              onClick={() => onSelect(key)}
              className={`
                relative aspect-square flex items-center justify-center rounded text-xs font-medium transition-colors
                ${isSelected ? "bg-[#e94560] text-white" : ""}
                ${!isSelected && todayDay ? "border border-[#e94560]/50 text-white" : ""}
                ${!isSelected && !todayDay ? "text-gray-400 hover:bg-white/10 hover:text-white" : ""}
              `}
              aria-label={`${day.getDate()} de ${MONTHS_ES[viewMonth]}`}
              aria-pressed={isSelected}
            >
              {day.getDate()}
              {hasAppts && !isSelected && (
                <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#e94560]" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── New Cita Modal ─────────────────────────────────────────────────────────

function NewCitaModal({
  clients,
  vehicles,
  onClose,
  onSaved,
}: {
  clients: ClientOption[];
  vehicles: VehicleOption[];
  onClose: () => void;
  onSaved: (appt: AppointmentWithRelations) => void;
}) {
  const [clientId, setClientId] = useState("");
  const [vehicleId, setVehicleId] = useState("");
  const [date, setDate] = useState(toDateKey(new Date()));
  const [timeSlot, setTimeSlot] = useState("09:00");
  const [serviceType, setServiceType] = useState("");
  const [customService, setCustomService] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clientVehicles = useMemo(
    () => vehicles.filter((v) => v.owner_id === clientId),
    [vehicles, clientId]
  );

  function handleClientChange(id: string) {
    setClientId(id);
    setVehicleId("");
  }

  const finalService = serviceType === "Otro" ? customService.trim() : serviceType;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!clientId || !date || !timeSlot || !finalService) {
      setError("Completa los campos obligatorios.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await createAppointmentAction({
        client_id: clientId,
        vehicle_id: vehicleId || null,
        date,
        time_slot: timeSlot,
        service_type: finalService,
        notes: notes.trim() || null,
      });
      const client = clients.find((c) => c.id === clientId) ?? null;
      const vehicle = clientVehicles.find((v) => v.id === vehicleId) ?? null;
      onSaved({
        id: crypto.randomUUID(),
        client_id: clientId,
        vehicle_id: vehicleId || null,
        date,
        time_slot: timeSlot,
        service_type: finalService,
        status: "confirmed",
        notes: notes.trim() || null,
        created_at: new Date().toISOString(),
        client: client ? { id: client.id, full_name: client.full_name, phone: client.phone } : null,
        vehicle: vehicle ? { id: vehicle.id, brand: vehicle.brand, model: vehicle.model, year: vehicle.year, plate: vehicle.plate } : null,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar la cita.");
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 overflow-y-auto">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[#16213e] border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl my-8">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <h2 className="text-white font-semibold text-lg">Nueva cita</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors" aria-label="Cerrar">
            <IconX />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Cliente */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              Cliente <span className="text-[#e94560]">*</span>
            </label>
            <div className="relative">
              <select
                className={selectClass}
                value={clientId}
                onChange={(e) => handleClientChange(e.target.value)}
                required
              >
                <option value="">Seleccionar cliente…</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.full_name ?? c.email}{c.phone ? ` — ${c.phone}` : ""}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-gray-500">
                <IconChevronDown />
              </div>
            </div>
          </div>

          {/* Vehículo */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Vehículo</label>
            <div className="relative">
              <select
                className={`${selectClass} disabled:opacity-40 disabled:cursor-not-allowed`}
                value={vehicleId}
                onChange={(e) => setVehicleId(e.target.value)}
                disabled={!clientId}
              >
                <option value="">{clientId ? "Sin vehículo específico" : "Primero selecciona un cliente"}</option>
                {clientVehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.brand} {v.model} {v.year}{v.plate ? ` — ${v.plate}` : ""}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-gray-500">
                <IconChevronDown />
              </div>
            </div>
          </div>

          {/* Fecha y hora */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                Fecha <span className="text-[#e94560]">*</span>
              </label>
              <input
                type="date"
                className={inputClass}
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                Hora <span className="text-[#e94560]">*</span>
              </label>
              <div className="relative">
                <select
                  className={selectClass}
                  value={timeSlot}
                  onChange={(e) => setTimeSlot(e.target.value)}
                >
                  {TIME_SLOTS.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-gray-500">
                  <IconChevronDown />
                </div>
              </div>
            </div>
          </div>

          {/* Tipo de servicio */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              Tipo de servicio <span className="text-[#e94560]">*</span>
            </label>
            <div className="relative">
              <select
                className={selectClass}
                value={serviceType}
                onChange={(e) => setServiceType(e.target.value)}
                required
              >
                <option value="">Seleccionar servicio…</option>
                {SERVICE_TYPES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-gray-500">
                <IconChevronDown />
              </div>
            </div>
            {serviceType === "Otro" && (
              <input
                type="text"
                className={`${inputClass} mt-2`}
                placeholder="Describe el servicio…"
                value={customService}
                onChange={(e) => setCustomService(e.target.value)}
                required
              />
            )}
          </div>

          {/* Notas */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Notas</label>
            <textarea
              rows={2}
              className={`${inputClass} resize-none`}
              placeholder="Observaciones adicionales…"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-lg border border-white/10 text-gray-400 text-sm hover:text-white hover:border-white/20 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 inline-flex items-center justify-center gap-2 bg-[#e94560] hover:bg-[#c73652] disabled:opacity-60 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors"
            >
              {saving ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                  </svg>
                  Guardando…
                </>
              ) : "Crear cita"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────

const FILTER_TABS: { key: AppointmentStatus | "all"; label: string }[] = [
  { key: "all", label: "Todas" },
  { key: "pending", label: "Pendientes" },
  { key: "confirmed", label: "Confirmadas" },
  { key: "completed", label: "Completadas" },
  { key: "cancelled", label: "Canceladas" },
];

export default function CitasClient({
  appointments: initial,
  clients,
  vehicles,
}: {
  appointments: AppointmentWithRelations[];
  clients: ClientOption[];
  vehicles: VehicleOption[];
}) {
  const today = toDateKey(new Date());
  const [appointments, setAppointments] = useState(initial);
  const [selectedDate, setSelectedDate] = useState(today);
  const [activeFilter, setActiveFilter] = useState<AppointmentStatus | "all">("all");
  const [isPending, startTransition] = useTransition();
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [showNewCita, setShowNewCita] = useState(false);

  const appointmentDates = useMemo(
    () => new Set(appointments.map((a) => a.date)),
    [appointments]
  );

  const dayAppointments = useMemo(() => {
    return appointments
      .filter((a) => a.date === selectedDate)
      .filter((a) => activeFilter === "all" || a.status === activeFilter)
      .sort((a, b) => a.time_slot.localeCompare(b.time_slot));
  }, [appointments, selectedDate, activeFilter]);

  const todayAppointments = useMemo(
    () => appointments.filter((a) => a.date === today),
    [appointments, today]
  );

  function handleStatusUpdate(id: string, status: AppointmentStatus) {
    setUpdatingId(id);
    // Optimistic update
    setAppointments((prev) => prev.map((a) => (a.id === id ? { ...a, status } : a)));
    startTransition(async () => {
      try {
        await updateAppointmentStatusAction(id, status);
      } catch {
        // Revert on error
        setAppointments(initial);
      } finally {
        setUpdatingId(null);
      }
    });
  }

  const countFor = (key: AppointmentStatus | "all") =>
    key === "all"
      ? appointments.filter((a) => a.date === selectedDate).length
      : appointments.filter((a) => a.date === selectedDate && a.status === key).length;

  const todayStats = {
    total: todayAppointments.length,
    pending: todayAppointments.filter((a) => a.status === "pending").length,
    confirmed: todayAppointments.filter((a) => a.status === "confirmed").length,
    completed: todayAppointments.filter((a) => a.status === "completed").length,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Citas</h1>
          <p className="text-gray-500 text-sm mt-1">
            Hoy: {todayStats.total} citas —{" "}
            <span className="text-yellow-400">{todayStats.pending} pendientes</span>,{" "}
            <span className="text-blue-400">{todayStats.confirmed} confirmadas</span>,{" "}
            <span className="text-green-400">{todayStats.completed} completadas</span>
          </p>
        </div>
        <button
          onClick={() => setShowNewCita(true)}
          className="inline-flex items-center gap-2 bg-[#e94560] hover:bg-[#c73652] text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          <IconPlus />
          Nueva cita
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[280px_1fr] gap-6">
        {/* Left — mini calendar */}
        <div className="space-y-4">
          <MiniCalendar
            selected={selectedDate}
            onSelect={(key) => { setSelectedDate(key); setActiveFilter("all"); }}
            appointmentDates={appointmentDates}
          />

          <div className="bg-[#16213e] border border-white/10 rounded-xl p-4 space-y-2">
            <p className="text-gray-500 text-xs uppercase tracking-wide font-medium">
              {isToday(selectedDate) ? "Hoy" : formatDate(selectedDate)}
            </p>
            {(["pending", "confirmed", "completed", "cancelled"] as AppointmentStatus[]).map((s) => {
              const count = appointments.filter((a) => a.date === selectedDate && a.status === s).length;
              if (count === 0) return null;
              return (
                <div key={s} className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-sm text-gray-400">
                    <span className={`w-2 h-2 rounded-full ${STATUS_DOT[s]}`} />
                    {STATUS_LABELS[s]}
                  </span>
                  <span className="text-white font-medium text-sm">{count}</span>
                </div>
              );
            })}
            {appointments.filter((a) => a.date === selectedDate).length === 0 && (
              <p className="text-gray-600 text-sm">Sin citas este día.</p>
            )}
          </div>
        </div>

        {/* Right — appointment list */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-white font-semibold capitalize">
              <IconCalendar />
              {isToday(selectedDate) ? "Hoy" : formatDate(selectedDate)}
            </div>
            {isToday(selectedDate) && (
              <span className="px-2 py-0.5 rounded-full bg-[#e94560]/20 text-[#e94560] text-xs font-medium">Hoy</span>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            {FILTER_TABS.map((tab) => {
              const count = countFor(tab.key);
              const isActive = activeFilter === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveFilter(tab.key)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-[#e94560] text-white"
                      : "bg-[#16213e] border border-white/10 text-gray-400 hover:text-white hover:border-white/20"
                  }`}
                >
                  {tab.label}
                  <span className={`text-xs px-1.5 py-0.5 rounded-full ${isActive ? "bg-white/20 text-white" : "bg-white/10 text-gray-500"}`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {dayAppointments.length === 0 ? (
            <div className="bg-[#16213e] border border-white/10 rounded-xl py-16 text-center">
              <p className="text-gray-600">No hay citas{activeFilter !== "all" ? ` con estado "${STATUS_LABELS[activeFilter as AppointmentStatus]}"` : ""} para este día.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {dayAppointments.map((appt) => (
                <div
                  key={appt.id}
                  className={`bg-[#16213e] border rounded-xl p-4 transition-colors ${
                    appt.status === "cancelled" ? "border-white/5 opacity-60" : "border-white/10"
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="flex-shrink-0 w-14 text-center">
                        <div className="text-[#e94560] font-bold text-lg leading-none">{appt.time_slot}</div>
                        <div className="text-gray-600 text-xs mt-0.5">hrs</div>
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-white font-semibold">{appt.client?.full_name ?? "Cliente desconocido"}</p>
                          <StatusBadge status={appt.status} />
                        </div>
                        <p className="text-gray-400 text-sm mt-0.5">{appt.service_type}</p>
                        <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-500 flex-wrap">
                          {appt.vehicle && (
                            <span>{appt.vehicle.brand} {appt.vehicle.model} {appt.vehicle.year}</span>
                          )}
                          {appt.vehicle?.plate && (
                            <span className="font-mono bg-white/5 px-1.5 py-0.5 rounded">{appt.vehicle.plate}</span>
                          )}
                          {appt.client?.phone && (
                            <span className="flex items-center gap-1"><IconClock />{appt.client.phone}</span>
                          )}
                        </div>
                        {appt.notes && (
                          <p className="mt-2 text-xs text-gray-500 bg-white/[0.03] rounded-lg px-3 py-2 border border-white/5">
                            {appt.notes}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex-shrink-0">
                      <StatusActions
                        appt={appt}
                        onUpdate={handleStatusUpdate}
                        pending={isPending && updatingId === appt.id}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
