"use client";

import { useState, useMemo } from "react";

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

function IconChevronDown() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
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

// ── Types & constants ──────────────────────────────────────────────────────

type AppointmentStatus = "pending" | "confirmed" | "completed" | "cancelled";

interface Appointment {
  id: string;
  client: string;
  phone: string;
  vehicle: string;
  plate: string;
  service_type: string;
  date: string;
  time_slot: string;
  status: AppointmentStatus;
  notes: string;
}

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

// swap for Supabase queries later
const MOCK_APPOINTMENTS: Appointment[] = [
  { id: "CIT-001", client: "Carlos Mendoza", phone: "55 1234 5678", vehicle: "Toyota Corolla 2019", plate: "ABC-123", service_type: "Cambio de aceite y filtros", date: "2026-04-30", time_slot: "09:00", status: "confirmed", notes: "" },
  { id: "CIT-002", client: "Ana Rodríguez", phone: "55 9876 5432", vehicle: "Honda Civic 2021", plate: "XYZ-789", service_type: "Frenos (pastillas / discos)", date: "2026-04-30", time_slot: "10:30", status: "pending", notes: "Ruido al frenar en bajada" },
  { id: "CIT-003", client: "Miguel Torres", phone: "55 5555 1234", vehicle: "Nissan Sentra 2018", plate: "DEF-456", service_type: "Alineación y balanceo", date: "2026-04-30", time_slot: "12:00", status: "completed", notes: "" },
  { id: "CIT-004", client: "Laura Jiménez", phone: "55 4444 9999", vehicle: "Chevrolet Spark 2020", plate: "GHI-321", service_type: "Diagnóstico electrónico", date: "2026-04-30", time_slot: "14:00", status: "cancelled", notes: "Cliente canceló por viaje" },
  { id: "CIT-005", client: "Roberto Díaz", phone: "55 3333 7777", vehicle: "Ford Focus 2017", plate: "JKL-654", service_type: "Revisión general", date: "2026-05-02", time_slot: "08:00", status: "pending", notes: "" },
  { id: "CIT-006", client: "Sofía Vargas", phone: "55 2222 8888", vehicle: "Kia Sportage 2022", plate: "MNO-987", service_type: "Cambio de neumáticos", date: "2026-05-02", time_slot: "09:30", status: "confirmed", notes: "Traer 4 neumáticos nuevos" },
  { id: "CIT-007", client: "Andrés Morales", phone: "55 1111 6666", vehicle: "Hyundai Tucson 2020", plate: "PQR-741", service_type: "Suspensión", date: "2026-05-05", time_slot: "10:00", status: "pending", notes: "Golpeteo en baches" },
  { id: "CIT-008", client: "Patricia Núñez", phone: "55 6666 3333", vehicle: "Mazda 3 2019", plate: "STU-852", service_type: "Sistema eléctrico", date: "2026-05-07", time_slot: "11:00", status: "confirmed", notes: "Check engine encendido" },
];

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

function StatusActions({ appt, onUpdate }: { appt: Appointment; onUpdate: (id: string, status: AppointmentStatus) => void }) {
  if (appt.status === "completed" || appt.status === "cancelled") return null;
  return (
    <div className="flex items-center gap-1.5">
      {appt.status === "pending" && (
        <button
          onClick={() => onUpdate(appt.id, "confirmed")}
          className="inline-flex items-center gap-1 px-2 py-1 rounded bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 text-xs transition-colors"
          title="Confirmar"
        >
          <IconCheck /> Confirmar
        </button>
      )}
      {appt.status === "confirmed" && (
        <button
          onClick={() => onUpdate(appt.id, "completed")}
          className="inline-flex items-center gap-1 px-2 py-1 rounded bg-green-500/20 text-green-300 hover:bg-green-500/30 text-xs transition-colors"
          title="Marcar completada"
        >
          <IconCheck /> Completar
        </button>
      )}
      <button
        onClick={() => onUpdate(appt.id, "cancelled")}
        className="inline-flex items-center gap-1 px-2 py-1 rounded bg-red-500/10 text-red-400 hover:bg-red-500/20 text-xs transition-colors"
        title="Cancelar"
      >
        <IconX /> Cancelar
      </button>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────

const FILTER_TABS: { key: AppointmentStatus | "all"; label: string }[] = [
  { key: "all", label: "Todas" },
  { key: "pending", label: "Pendientes" },
  { key: "confirmed", label: "Confirmadas" },
  { key: "completed", label: "Completadas" },
  { key: "cancelled", label: "Canceladas" },
];

export default function CitasDashboardPage() {
  const today = toDateKey(new Date());
  const [appointments, setAppointments] = useState<Appointment[]>(MOCK_APPOINTMENTS);
  const [selectedDate, setSelectedDate] = useState<string>(today);
  const [activeFilter, setActiveFilter] = useState<AppointmentStatus | "all">("all");

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
    setAppointments((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status } : a))
    );
  }

  const countFor = (key: AppointmentStatus | "all") =>
    key === "all"
      ? appointments.filter((a) => a.date === selectedDate).length
      : appointments.filter((a) => a.date === selectedDate && a.status === key).length;

  // Stats for today
  const todayStats = {
    total: todayAppointments.length,
    pending: todayAppointments.filter((a) => a.status === "pending").length,
    confirmed: todayAppointments.filter((a) => a.status === "confirmed").length,
    completed: todayAppointments.filter((a) => a.status === "completed").length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
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
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[280px_1fr] gap-6">
        {/* Left — mini calendar */}
        <div className="space-y-4">
          <MiniCalendar
            selected={selectedDate}
            onSelect={(key) => { setSelectedDate(key); setActiveFilter("all"); }}
            appointmentDates={appointmentDates}
          />

          {/* Quick stats for selected day */}
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
          {/* Date heading */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-white font-semibold capitalize">
              <IconCalendar />
              {isToday(selectedDate) ? "Hoy" : formatDate(selectedDate)}
            </div>
            {isToday(selectedDate) && (
              <span className="px-2 py-0.5 rounded-full bg-[#e94560]/20 text-[#e94560] text-xs font-medium">Hoy</span>
            )}
          </div>

          {/* Filter tabs */}
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

          {/* Appointment cards */}
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
                    {/* Time + service */}
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="flex-shrink-0 w-14 text-center">
                        <div className="text-[#e94560] font-bold text-lg leading-none">{appt.time_slot}</div>
                        <div className="text-gray-600 text-xs mt-0.5">hrs</div>
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-white font-semibold">{appt.client}</p>
                          <StatusBadge status={appt.status} />
                        </div>
                        <p className="text-gray-400 text-sm mt-0.5">{appt.service_type}</p>
                        <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-500">
                          <span>{appt.vehicle}</span>
                          {appt.plate && <span className="font-mono bg-white/5 px-1.5 py-0.5 rounded">{appt.plate}</span>}
                          <span className="flex items-center gap-1"><IconClock />{appt.phone}</span>
                        </div>
                        {appt.notes && (
                          <p className="mt-2 text-xs text-gray-500 bg-white/[0.03] rounded-lg px-3 py-2 border border-white/5">
                            {appt.notes}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex-shrink-0">
                      <StatusActions appt={appt} onUpdate={handleStatusUpdate} />
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
