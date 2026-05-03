"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

// ── Types ──────────────────────────────────────────────────────────────────

type AppointmentStatus = "pending" | "confirmed" | "completed" | "cancelled";

interface Appointment {
  id: string;
  date: string;
  time_slot: string;
  service_type: string;
  status: AppointmentStatus;
  notes: string | null;
  vehicle: {
    brand: string;
    model: string;
    year: number;
    plate: string | null;
  } | null;
}

// ── Constants ──────────────────────────────────────────────────────────────

const STATUS_LABELS: Record<AppointmentStatus, string> = {
  pending: "Pendiente",
  confirmed: "Confirmada",
  completed: "Completada",
  cancelled: "Cancelada",
};

const STATUS_COLORS: Record<AppointmentStatus, string> = {
  pending: "bg-yellow-500/15 text-yellow-300 border-yellow-500/30",
  confirmed: "bg-green-500/15 text-green-300 border-green-500/30",
  completed: "bg-blue-500/15 text-blue-300 border-blue-500/30",
  cancelled: "bg-gray-600/20 text-gray-500 border-gray-600/30",
};

// ── Icons ──────────────────────────────────────────────────────────────────

function IconCalendar() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  );
}

function IconClock() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function IconCar() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
    </svg>
  );
}

function IconWrench() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437l1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008z" />
    </svg>
  );
}

function IconLock() {
  return (
    <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
    </svg>
  );
}

function IconX() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
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

const TIME_SLOTS = [
  "08:00", "08:30", "09:00", "09:30", "10:00", "10:30",
  "11:00", "11:30", "12:00", "12:30", "13:00", "13:30",
  "14:00", "14:30", "15:00", "15:30", "16:00", "16:30",
  "17:00", "17:30",
];

const inputClass =
  "w-full bg-[#1a1a2e] border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-[#e94560]/60 focus:ring-1 focus:ring-[#e94560]/30 transition-colors";
const selectClass =
  "w-full bg-[#1a1a2e] border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#e94560]/60 focus:ring-1 focus:ring-[#e94560]/30 transition-colors appearance-none";

function IconChevronDown() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  );
}

function IconRefresh() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
  );
}

// ── Reschedule Modal ───────────────────────────────────────────────────────

function RescheduleModal({
  appt,
  onClose,
  onSaved,
}: {
  appt: Appointment;
  onClose: () => void;
  onSaved: (id: string, date: string, timeSlot: string) => void;
}) {
  const [date, setDate] = useState(appt.date);
  const [timeSlot, setTimeSlot] = useState(appt.time_slot);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const today = new Date().toISOString().slice(0, 10);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (date < today) {
      setError("La fecha debe ser hoy o en el futuro.");
      return;
    }
    setSaving(true);
    setError(null);
    const supabase = createClient();
    const { error: updateError } = await supabase
      .from("appointments")
      .update({ date, time_slot: timeSlot })
      .eq("id", appt.id);

    if (updateError) {
      setError("No se pudo reprogramar la cita. Intenta de nuevo.");
      setSaving(false);
      return;
    }
    onSaved(appt.id, date, timeSlot);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 overflow-y-auto">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[#16213e] border border-white/10 rounded-2xl w-full max-w-md shadow-2xl my-8">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <h2 className="text-white font-semibold text-lg">Reprogramar cita</h2>
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

          <div className="bg-white/[0.03] border border-white/5 rounded-lg px-4 py-3 text-sm text-gray-400">
            <p className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-1">Servicio</p>
            <p className="text-gray-200">{appt.service_type}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              Nueva fecha <span className="text-[#e94560]">*</span>
            </label>
            <input
              type="date"
              className={inputClass}
              value={date}
              min={today}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              Nuevo horario <span className="text-[#e94560]">*</span>
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
                  <IconSpinner /> Guardando…
                </>
              ) : "Confirmar cambio"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Appointment Card ───────────────────────────────────────────────────────

function AppointmentCard({
  appt,
  onCancel,
  cancelling,
  onReschedule,
}: {
  appt: Appointment;
  onCancel: (id: string) => void;
  cancelling: string | null;
  onReschedule: (appt: Appointment) => void;
}) {
  const canCancel = appt.status === "pending" || appt.status === "confirmed";

  const fmtDate = (d: string) =>
    new Date(d + "T00:00:00").toLocaleDateString("es-MX", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });

  const isPast = new Date(appt.date + "T23:59:59") < new Date();

  return (
    <div
      className={`bg-[#16213e] border rounded-xl overflow-hidden transition-colors ${
        appt.status === "cancelled"
          ? "border-white/5 opacity-60"
          : "border-white/10"
      }`}
    >
      {/* Header */}
      <div className="px-5 py-4 flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 min-w-0">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
              appt.status === "cancelled"
                ? "bg-white/5 text-gray-600"
                : "bg-[#e94560]/10 border border-[#e94560]/20 text-[#e94560]"
            }`}
          >
            <IconCalendar />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${STATUS_COLORS[appt.status]}`}
              >
                {STATUS_LABELS[appt.status]}
              </span>
              {!isPast && canCancel && (
                <span className="inline-flex items-center gap-1 text-xs text-green-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                  Próxima
                </span>
              )}
            </div>
            <p className="text-white font-semibold mt-1 capitalize">{fmtDate(appt.date)}</p>
          </div>
        </div>

        {canCancel && (
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => onReschedule(appt)}
              className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-blue-400 border border-white/10 hover:border-blue-400/30 px-3 py-1.5 rounded-lg transition-colors"
              aria-label="Reprogramar cita"
            >
              <IconRefresh />
              Reprogramar
            </button>
            <button
              onClick={() => onCancel(appt.id)}
              disabled={cancelling === appt.id}
              className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-red-400 border border-white/10 hover:border-red-400/30 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
              aria-label="Cancelar cita"
            >
              {cancelling === appt.id ? <IconSpinner /> : <IconX />}
              Cancelar
            </button>
          </div>
        )}
      </div>

      {/* Details */}
      <div className="px-5 pb-4 grid grid-cols-1 sm:grid-cols-3 gap-3 border-t border-white/5 pt-4">
        <div className="flex items-center gap-2 text-sm">
          <span className="text-gray-500 shrink-0"><IconClock /></span>
          <div>
            <p className="text-gray-500 text-xs">Horario</p>
            <p className="text-gray-200">{appt.time_slot}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-sm">
          <span className="text-gray-500 shrink-0"><IconWrench /></span>
          <div>
            <p className="text-gray-500 text-xs">Servicio</p>
            <p className="text-gray-200 truncate">{appt.service_type}</p>
          </div>
        </div>

        {appt.vehicle && (
          <div className="flex items-center gap-2 text-sm">
            <span className="text-gray-500 shrink-0"><IconCar /></span>
            <div>
              <p className="text-gray-500 text-xs">Vehículo</p>
              <p className="text-gray-200">
                {appt.vehicle.brand} {appt.vehicle.model} {appt.vehicle.year}
                {appt.vehicle.plate && (
                  <span className="text-gray-500 font-mono ml-1 text-xs">({appt.vehicle.plate})</span>
                )}
              </p>
            </div>
          </div>
        )}
      </div>

      {appt.notes && (
        <div className="px-5 pb-4">
          <p className="text-gray-500 text-xs uppercase tracking-wide font-medium mb-1">Notas</p>
          <p className="text-gray-400 text-sm bg-white/[0.03] rounded-lg px-3 py-2 border border-white/5">
            {appt.notes}
          </p>
        </div>
      )}
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────

export default function MisCitasPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [dataLoading, setDataLoading] = useState(false);
  const [cancelling, setCancelling] = useState<string | null>(null);
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [reschedulingAppt, setReschedulingAppt] = useState<Appointment | null>(null);

  const loadAppointments = useCallback(async (userId: string) => {
    setDataLoading(true);
    const supabase = createClient();
    const { data } = await supabase
      .from("appointments")
      .select(`
        id, date, time_slot, service_type, status, notes,
        vehicle:vehicles(brand, model, year, plate)
      `)
      .eq("client_id", userId)
      .order("date", { ascending: false })
      .order("time_slot", { ascending: false });

    setAppointments((data as unknown as Appointment[]) ?? []);
    setDataLoading(false);
  }, []);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      setLoading(false);
      if (user) loadAppointments(user.id);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const u = session?.user ?? null;
      setUser(u);
      if (u) loadAppointments(u.id);
    });

    return () => subscription.unsubscribe();
  }, [loadAppointments]);

  function handleReschedule(appt: Appointment) {
    setReschedulingAppt(appt);
  }

  function handleRescheduleSaved(id: string, date: string, timeSlot: string) {
    setAppointments((prev) =>
      prev.map((a) => (a.id === id ? { ...a, date, time_slot: timeSlot } : a))
    );
    setReschedulingAppt(null);
  }

  async function handleCancel(id: string) {
    setCancelling(id);
    setCancelError(null);
    const supabase = createClient();
    const { error } = await supabase
      .from("appointments")
      .update({ status: "cancelled" })
      .eq("id", id);

    if (error) {
      setCancelError("No se pudo cancelar la cita. Intenta de nuevo.");
    } else {
      setAppointments((prev) =>
        prev.map((a) => (a.id === id ? { ...a, status: "cancelled" as AppointmentStatus } : a))
      );
    }
    setCancelling(null);
  }

  // ── Loading ──────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex items-center gap-3 text-gray-500">
          <IconSpinner />
          <span className="text-sm">Cargando…</span>
        </div>
      </div>
    );
  }

  // ── Not logged in ────────────────────────────────────────────────────────

  if (!user) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-5 text-gray-500">
            <IconLock />
          </div>
          <h1 className="text-xl font-bold text-white mb-2">Inicia sesión para continuar</h1>
          <p className="text-gray-500 text-sm mb-6">
            Necesitas una cuenta para ver tus citas agendadas.
          </p>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 bg-[#e94560] hover:bg-[#c73652] text-white text-sm font-medium px-6 py-3 rounded-lg transition-colors"
          >
            Iniciar sesión
          </Link>
        </div>
      </div>
    );
  }

  // ── Split upcoming / past ────────────────────────────────────────────────

  const today = new Date().toISOString().slice(0, 10);
  const upcoming = appointments.filter(
    (a) => a.date >= today && a.status !== "cancelled"
  );
  const past = appointments.filter(
    (a) => a.date < today || a.status === "cancelled"
  );

  // ── Main view ────────────────────────────────────────────────────────────

  return (
    <>
    <div className="min-h-screen bg-[#1a1a2e]">
      {/* Hero */}
      <div className="bg-[#16213e] border-b border-white/5 py-12">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex items-center gap-2 text-sm text-gray-500 mb-5">
            <Link href="/" className="hover:text-white transition-colors">Inicio</Link>
            <span>/</span>
            <Link href="/cuenta" className="hover:text-white transition-colors">Mi cuenta</Link>
            <span>/</span>
            <span className="text-white">Mis citas</span>
          </nav>
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <div className="inline-flex items-center gap-2 text-[#e94560] text-sm font-medium mb-2">
                <IconCalendar />
                Mis citas
              </div>
              <h1 className="text-3xl font-bold text-white">Citas agendadas</h1>
              <p className="text-gray-400 text-sm mt-1">
                Revisá y gestioná tus turnos en el taller.
              </p>
            </div>
            <Link
              href="/citas"
              className="shrink-0 inline-flex items-center gap-2 bg-[#e94560] hover:bg-[#c73652] text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors"
            >
              <IconCalendar />
              Nueva cita
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">

        {cancelError && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-red-400 text-sm">
            {cancelError}
          </div>
        )}

        {dataLoading ? (
          <div className="flex items-center justify-center py-16 gap-3 text-gray-500">
            <IconSpinner />
            <span className="text-sm">Cargando tus citas…</span>
          </div>
        ) : appointments.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-5 text-gray-600">
              <IconCalendar />
            </div>
            <h2 className="text-white font-semibold text-lg mb-2">Sin citas registradas</h2>
            <p className="text-gray-500 text-sm mb-6 max-w-xs mx-auto">
              Todavía no tenés ninguna cita agendada. ¿Querés reservar un turno?
            </p>
            <Link
              href="/citas"
              className="inline-flex items-center gap-2 bg-[#e94560] hover:bg-[#c73652] text-white text-sm font-medium px-6 py-3 rounded-xl transition-colors"
            >
              Agendar una cita
            </Link>
          </div>
        ) : (
          <>
            {/* Upcoming */}
            {upcoming.length > 0 && (
              <section className="space-y-4">
                <h2 className="text-white font-semibold flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#e94560] animate-pulse" />
                  Próximas ({upcoming.length})
                </h2>
                {upcoming.map((appt) => (
                  <AppointmentCard
                    key={appt.id}
                    appt={appt}
                    onCancel={handleCancel}
                    cancelling={cancelling}
                    onReschedule={handleReschedule}
                  />
                ))}
              </section>
            )}

            {/* Past / cancelled */}
            {past.length > 0 && (
              <section className="space-y-4">
                {upcoming.length > 0 ? (
                  <details className="group">
                    <summary className="cursor-pointer list-none flex items-center gap-2 text-sm text-gray-500 hover:text-gray-300 transition-colors py-1">
                      <svg
                        className="w-4 h-4 transition-transform group-open:rotate-90"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                      {past.length} cita{past.length !== 1 ? "s" : ""} pasada{past.length !== 1 ? "s" : ""} o cancelada{past.length !== 1 ? "s" : ""}
                    </summary>
                    <div className="mt-4 space-y-3">
                      {past.map((appt) => (
                        <AppointmentCard
                          key={appt.id}
                          appt={appt}
                          onCancel={handleCancel}
                          cancelling={cancelling}
                          onReschedule={handleReschedule}
                        />
                      ))}
                    </div>
                  </details>
                ) : (
                  <>
                    <h2 className="text-gray-500 font-semibold text-sm uppercase tracking-wide">
                      Historial
                    </h2>
                    {past.map((appt) => (
                      <AppointmentCard
                        key={appt.id}
                        appt={appt}
                        onCancel={handleCancel}
                        cancelling={cancelling}
                        onReschedule={handleReschedule}
                      />
                    ))}
                  </>
                )}
              </section>
            )}

            {/* No upcoming but has past */}
            {upcoming.length === 0 && past.length > 0 && (
              <div className="text-center pt-4 border-t border-white/5">
                <p className="text-gray-500 text-sm mb-4">No tenés citas próximas.</p>
                <Link
                  href="/citas"
                  className="inline-flex items-center gap-2 bg-[#e94560] hover:bg-[#c73652] text-white text-sm font-medium px-5 py-2.5 rounded-xl transition-colors"
                >
                  Agendar nueva cita
                </Link>
              </div>
            )}
          </>
        )}
      </div>
    </div>

    {reschedulingAppt && (
      <RescheduleModal
        appt={reschedulingAppt}
        onClose={() => setReschedulingAppt(null)}
        onSaved={handleRescheduleSaved}
      />
    )}
    </>
  );
}
