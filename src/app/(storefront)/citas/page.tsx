"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";

// ── Icons ──────────────────────────────────────────────────────────────────

function IconCalendar() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
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

function IconCar() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 6H5l-2 6v4h2m14 0h2v-4l-2-6h-8l-1 3" />
    </svg>
  );
}

function IconCheck() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
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

const SERVICE_TYPES = [
  "Cambio de aceite y filtros",
  "Revisión general",
  "Frenos (pastillas / discos)",
  "Alineación y balanceo",
  "Diagnóstico electrónico",
  "Cambio de neumáticos",
  "Suspensión",
  "Sistema eléctrico",
  "Aire acondicionado",
  "Transmisión / embrague",
  "Motor",
  "Otro",
];

const TIME_SLOTS = [
  "08:00", "08:30", "09:00", "09:30", "10:00", "10:30",
  "11:00", "11:30", "12:00", "12:30", "14:00", "14:30",
  "15:00", "15:30", "16:00", "16:30", "17:00",
];


const DAYS_ES = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
const MONTHS_ES = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

// ── Helpers ────────────────────────────────────────────────────────────────

function toDateKey(d: Date) {
  return d.toISOString().slice(0, 10);
}

function isWeekend(d: Date) {
  const day = d.getDay();
  return day === 0 || day === 6;
}

function isPast(d: Date) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return d < today;
}

function isFullyBooked(dateKey: string, bookedSlots: Record<string, string[]>) {
  return (bookedSlots[dateKey] ?? []).length >= TIME_SLOTS.length;
}

// ── Sub-components ─────────────────────────────────────────────────────────

interface CalendarProps {
  selected: string | null;
  onSelect: (key: string) => void;
  bookedSlots: Record<string, string[]>;
  onMonthChange: (year: number, month: number) => void;
}

function Calendar({ selected, onSelect, bookedSlots, onMonthChange }: CalendarProps) {
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
    const newYear = viewMonth === 0 ? viewYear - 1 : viewYear;
    const newMonth = viewMonth === 0 ? 11 : viewMonth - 1;
    setViewYear(newYear);
    setViewMonth(newMonth);
    onMonthChange(newYear, newMonth);
  }
  function nextMonth() {
    const newYear = viewMonth === 11 ? viewYear + 1 : viewYear;
    const newMonth = viewMonth === 11 ? 0 : viewMonth + 1;
    setViewYear(newYear);
    setViewMonth(newMonth);
    onMonthChange(newYear, newMonth);
  }

  const canGoPrev = !(viewYear === today.getFullYear() && viewMonth === today.getMonth());

  return (
    <div className="bg-[#16213e] border border-white/10 rounded-xl p-4">
      {/* Month nav */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={prevMonth}
          disabled={!canGoPrev}
          className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          aria-label="Mes anterior"
        >
          <IconChevronLeft />
        </button>
        <span className="text-white font-semibold text-sm">
          {MONTHS_ES[viewMonth]} {viewYear}
        </span>
        <button
          onClick={nextMonth}
          className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
          aria-label="Mes siguiente"
        >
          <IconChevronRight />
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 mb-2">
        {DAYS_ES.map(d => (
          <div key={d} className="text-center text-xs text-gray-500 font-medium py-1">{d}</div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7 gap-1">
        {days.map((day, i) => {
          if (!day) return <div key={`empty-${i}`} />;
          const key = toDateKey(day);
          const fullyBooked = isFullyBooked(key, bookedSlots);
          const disabled = isPast(day) || isWeekend(day) || fullyBooked;
          const isSelected = selected === key;

          return (
            <button
              key={key}
              onClick={() => !disabled && onSelect(key)}
              disabled={disabled}
              className={`
                relative aspect-square flex items-center justify-center rounded-lg text-sm font-medium transition-colors
                ${isSelected ? "bg-[#e94560] text-white" : ""}
                ${!isSelected && !disabled ? "text-gray-200 hover:bg-white/10" : ""}
                ${disabled && !fullyBooked ? "text-gray-600 cursor-not-allowed" : ""}
                ${fullyBooked ? "text-gray-700 cursor-not-allowed line-through" : ""}
              `}
              aria-label={`${day.getDate()} de ${MONTHS_ES[viewMonth]}`}
              aria-pressed={isSelected}
            >
              {day.getDate()}
              {fullyBooked && !isPast(day) && !isWeekend(day) && (
                <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-red-500/60" />
              )}
            </button>
          );
        })}
      </div>

      <div className="mt-3 flex items-center gap-4 text-xs text-gray-500">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#e94560]" /> Seleccionado
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-red-500/60" /> Sin disponibilidad
        </span>
      </div>
    </div>
  );
}

// ── Time slot picker ───────────────────────────────────────────────────────

interface TimeSlotsProps {
  dateKey: string;
  selected: string | null;
  onSelect: (slot: string) => void;
  bookedSlots: Record<string, string[]>;
  loading?: boolean;
}

function TimeSlots({ dateKey, selected, onSelect, bookedSlots, loading }: TimeSlotsProps) {
  const booked = bookedSlots[dateKey] ?? [];
  return (
    <div className="bg-[#16213e] border border-white/10 rounded-xl p-4">
      <h3 className="text-white font-semibold text-sm mb-3 flex items-center gap-2">
        <IconClock />
        Horario disponible
      </h3>
      {loading ? (
        <div className="flex items-center justify-center py-6 text-gray-500 text-sm gap-2">
          <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
          </svg>
          Cargando horarios…
        </div>
      ) : (
        <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
          {TIME_SLOTS.map((slot) => {
            const isBooked = booked.includes(slot);
            const isSelected = selected === slot;
            return (
              <button
                key={slot}
                onClick={() => !isBooked && onSelect(slot)}
                disabled={isBooked}
                className={`
                  py-2 rounded-lg text-xs font-medium transition-colors
                  ${isSelected ? "bg-[#e94560] text-white" : ""}
                  ${!isSelected && !isBooked ? "bg-[#1a1a2e] border border-white/10 text-gray-300 hover:border-[#e94560]/50 hover:text-white" : ""}
                  ${isBooked ? "bg-[#1a1a2e] border border-white/5 text-gray-700 cursor-not-allowed line-through" : ""}
                `}
                aria-label={`${slot}${isBooked ? " — no disponible" : ""}`}
                aria-pressed={isSelected}
              >
                {slot}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── New vehicle inline form ────────────────────────────────────────────────

interface NewVehicle {
  brand: string;
  model: string;
  year: string;
  plate: string;
}

const EMPTY_VEHICLE: NewVehicle = { brand: "", model: "", year: "", plate: "" };

const inputClass =
  "w-full bg-[#1a1a2e] border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-[#e94560]/60 focus:ring-1 focus:ring-[#e94560]/30 transition-colors";

interface NewVehicleFormProps {
  value: NewVehicle;
  onChange: (v: NewVehicle) => void;
  errors: Partial<NewVehicle>;
}

function NewVehicleForm({ value, onChange, errors }: NewVehicleFormProps) {
  function set(field: keyof NewVehicle, val: string) {
    onChange({ ...value, [field]: val });
  }
  return (
    <div className="grid grid-cols-2 gap-3 mt-3 p-4 bg-[#1a1a2e] rounded-xl border border-white/10">
      <div>
        <label className="block text-xs font-medium text-gray-400 mb-1.5">Marca <span className="text-[#e94560]">*</span></label>
        <input className={inputClass} placeholder="Toyota" value={value.brand} onChange={(e) => set("brand", e.target.value)} />
        {errors.brand && <p className="text-red-400 text-xs mt-1">{errors.brand}</p>}
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-400 mb-1.5">Modelo <span className="text-[#e94560]">*</span></label>
        <input className={inputClass} placeholder="Corolla" value={value.model} onChange={(e) => set("model", e.target.value)} />
        {errors.model && <p className="text-red-400 text-xs mt-1">{errors.model}</p>}
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-400 mb-1.5">Año <span className="text-[#e94560]">*</span></label>
        <input className={inputClass} placeholder="2020" maxLength={4} value={value.year} onChange={(e) => set("year", e.target.value)} />
        {errors.year && <p className="text-red-400 text-xs mt-1">{errors.year}</p>}
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-400 mb-1.5">Placa</label>
        <input className={inputClass} placeholder="ABC-123" value={value.plate} onChange={(e) => set("plate", e.target.value)} />
      </div>
    </div>
  );
}

interface UserVehicle {
  id: string;
  label: string;
}

// ── Main page ──────────────────────────────────────────────────────────────

interface FormState {
  vehicleId: string;
  newVehicle: NewVehicle;
  serviceType: string;
  notes: string;
  name: string;
  phone: string;
  email: string;
}

const EMPTY_FORM: FormState = {
  vehicleId: "",
  newVehicle: EMPTY_VEHICLE,
  serviceType: "",
  notes: "",
  name: "",
  phone: "",
  email: "",
};

export default function CitasPage() {
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [vehicleErrors, setVehicleErrors] = useState<Partial<NewVehicle>>({});
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [bookedSlots, setBookedSlots] = useState<Record<string, string[]>>({});
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [userVehicles, setUserVehicles] = useState<UserVehicle[]>([]);

  // Load user vehicles on mount (only if logged in)
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      const { data } = await supabase
        .from("vehicles")
        .select("id, brand, model, year, plate")
        .eq("owner_id", user.id)
        .order("created_at", { ascending: false });
      if (data) {
        setUserVehicles(
          data.map((v) => ({
            id: v.id as string,
            label: `${v.brand} ${v.model} ${v.year}${v.plate ? ` — ${v.plate}` : ""}`,
          }))
        );
      }
    });
  }, []);

  // Fetch booked slots for a given month from the API
  const fetchMonthSlots = useCallback(async (year: number, month: number) => {
    setSlotsLoading(true);
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const dates: string[] = [];
    for (let d = 1; d <= daysInMonth; d++) {
      const dateKey = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      dates.push(dateKey);
    }
    const results = await Promise.all(
      dates.map((date) =>
        fetch(`/api/citas?date=${date}`)
          .then((r) => r.json())
          .then((j) => ({ date, slots: (j.slots ?? []) as string[] }))
          .catch(() => ({ date, slots: [] }))
      )
    );
    setBookedSlots((prev) => {
      const next = { ...prev };
      for (const { date, slots } of results) next[date] = slots;
      return next;
    });
    setSlotsLoading(false);
  }, []);

  // Load current month on mount
  useEffect(() => {
    const now = new Date();
    fetchMonthSlots(now.getFullYear(), now.getMonth());
  }, [fetchMonthSlots]);

  const isNewVehicle = form.vehicleId === "__new__";

  function setField<K extends keyof FormState>(key: K, val: FormState[K]) {
    setForm((f) => ({ ...f, [key]: val }));
    setFormErrors((e) => ({ ...e, [key]: undefined }));
  }

  function handleDateSelect(key: string) {
    setSelectedDate(key);
    setSelectedSlot(null);
  }

  function validate(): boolean {
    const fe: Partial<Record<keyof FormState, string>> = {};
    const ve: Partial<NewVehicle> = {};

    if (!form.name.trim()) fe.name = "Requerido";
    if (!form.phone.trim()) fe.phone = "Requerido";
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) fe.email = "Email inválido";
    if (!form.vehicleId) fe.vehicleId = "Selecciona o agrega un vehículo";
    if (!form.serviceType) fe.serviceType = "Selecciona el tipo de servicio";
    if (isNewVehicle) {
      if (!form.newVehicle.brand.trim()) ve.brand = "Requerido";
      if (!form.newVehicle.model.trim()) ve.model = "Requerido";
      if (!form.newVehicle.year || !/^\d{4}$/.test(form.newVehicle.year)) ve.year = "Año válido";
    }

    setFormErrors(fe);
    setVehicleErrors(ve);
    return Object.keys(fe).length === 0 && Object.keys(ve).length === 0 && !!selectedDate && !!selectedSlot;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    setSubmitError(null);

    const res = await fetch("/api/citas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        date: selectedDate,
        time_slot: selectedSlot,
        service_type: form.serviceType,
        notes: form.notes,
        name: form.name,
        phone: form.phone,
        email: form.email,
        vehicle_id: isNewVehicle ? null : form.vehicleId || null,
        new_vehicle: isNewVehicle ? form.newVehicle : null,
      }),
    });

    setSubmitting(false);

    if (res.status === 409) {
      setSubmitError("Ese horario ya fue tomado. Por favor elige otro.");
      // Refresh slots for the selected date
      if (selectedDate) {
        const [y, m] = selectedDate.split("-").map(Number);
        fetchMonthSlots(y, m - 1);
      }
      setSelectedSlot(null);
      return;
    }

    if (!res.ok) {
      setSubmitError("Ocurrió un error al agendar la cita. Intenta de nuevo.");
      return;
    }

    setSubmitted(true);
  }

  const dateLabel = useMemo(() => {
    if (!selectedDate) return null;
    const [y, m, d] = selectedDate.split("-").map(Number);
    return new Date(y, m - 1, d).toLocaleDateString("es-MX", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  }, [selectedDate]);

  if (submitted) {
    return (
      <main className="min-h-screen" style={{ background: "#1a1a2e" }}>
        <div className="max-w-lg mx-auto px-4 py-20 text-center">
          <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-6 text-green-400">
            <IconCheck />
          </div>
          <h1 className="text-2xl font-bold text-white mb-3">¡Cita agendada!</h1>
          <p className="text-gray-400 mb-2">
            Tu cita ha sido registrada para el <span className="text-white font-medium">{dateLabel}</span> a las <span className="text-white font-medium">{selectedSlot}</span>.
          </p>
          <p className="text-gray-500 text-sm mb-8">Te contactaremos al {form.phone} para confirmar.</p>
          <button
            onClick={() => { setSubmitted(false); setForm(EMPTY_FORM); setSelectedDate(null); setSelectedSlot(null); }}
            className="inline-flex items-center gap-2 bg-[#e94560] hover:bg-[#c73652] text-white text-sm font-medium px-6 py-3 rounded-lg transition-colors"
          >
            Agendar otra cita
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen" style={{ background: "#1a1a2e" }}>
      <div className="max-w-5xl mx-auto px-4 py-10 sm:py-16">
        {/* Header */}
        <div className="mb-10">
          <div className="inline-flex items-center gap-2 text-[#e94560] text-sm font-medium mb-3">
            <IconCalendar />
            Agenda tu cita
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white">Reserva tu servicio</h1>
          <p className="text-gray-400 mt-2">Elige fecha, horario y tipo de servicio. Te confirmamos en menos de 24 horas.</p>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left column — calendar + slots */}
            <div className="space-y-4">
              <h2 className="text-white font-semibold flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-[#e94560] text-white text-xs flex items-center justify-center font-bold">1</span>
                Selecciona fecha y hora
              </h2>
              <Calendar
                selected={selectedDate}
                onSelect={handleDateSelect}
                bookedSlots={bookedSlots}
                onMonthChange={fetchMonthSlots}
              />
              {selectedDate && (
                <TimeSlots
                  dateKey={selectedDate}
                  selected={selectedSlot}
                  onSelect={setSelectedSlot}
                  bookedSlots={bookedSlots}
                  loading={slotsLoading}
                />
              )}
              {!selectedDate && (
                <p className="text-gray-600 text-sm text-center py-4">Selecciona un día en el calendario para ver los horarios disponibles.</p>
              )}
              {selectedDate && !selectedSlot && (
                <p className="text-[#e94560] text-xs">Selecciona un horario para continuar.</p>
              )}
            </div>

            {/* Right column — form */}
            <div className="space-y-6">
              {/* Contact info */}
              <div>
                <h2 className="text-white font-semibold flex items-center gap-2 mb-4">
                  <span className="w-6 h-6 rounded-full bg-[#e94560] text-white text-xs flex items-center justify-center font-bold">2</span>
                  Tus datos
                </h2>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1.5">Nombre completo <span className="text-[#e94560]">*</span></label>
                    <input className={inputClass} placeholder="Carlos Mendoza" value={form.name} onChange={(e) => setField("name", e.target.value)} />
                    {formErrors.name && <p className="text-red-400 text-xs mt-1">{formErrors.name}</p>}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1.5">Teléfono <span className="text-[#e94560]">*</span></label>
                      <input className={inputClass} placeholder="55 1234 5678" value={form.phone} onChange={(e) => setField("phone", e.target.value)} />
                      {formErrors.phone && <p className="text-red-400 text-xs mt-1">{formErrors.phone}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1.5">Email</label>
                      <input type="email" className={inputClass} placeholder="correo@ejemplo.com" value={form.email} onChange={(e) => setField("email", e.target.value)} />
                      {formErrors.email && <p className="text-red-400 text-xs mt-1">{formErrors.email}</p>}
                    </div>
                  </div>
                </div>
              </div>

              {/* Vehicle */}
              <div>
                <h2 className="text-white font-semibold flex items-center gap-2 mb-4">
                  <span className="w-6 h-6 rounded-full bg-[#e94560] text-white text-xs flex items-center justify-center font-bold">3</span>
                  Vehículo
                </h2>
                <div className="relative">
                  <select
                    value={form.vehicleId}
                    onChange={(e) => { setField("vehicleId", e.target.value); setVehicleErrors({}); }}
                    className="w-full bg-[#1a1a2e] border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#e94560]/60 focus:ring-1 focus:ring-[#e94560]/30 transition-colors appearance-none"
                  >
                    <option value="">Seleccionar vehículo…</option>
                    {userVehicles.map((v) => (
                      <option key={v.id} value={v.id}>{v.label}</option>
                    ))}
                    <option value="__new__">+ Agregar nuevo vehículo</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-gray-500"><IconChevronDown /></div>
                </div>
                {formErrors.vehicleId && <p className="text-red-400 text-xs mt-1">{formErrors.vehicleId}</p>}
                {isNewVehicle && (
                  <NewVehicleForm value={form.newVehicle} onChange={(v) => setField("newVehicle", v)} errors={vehicleErrors} />
                )}
              </div>

              {/* Service type */}
              <div>
                <h2 className="text-white font-semibold flex items-center gap-2 mb-4">
                  <span className="w-6 h-6 rounded-full bg-[#e94560] text-white text-xs flex items-center justify-center font-bold">4</span>
                  Tipo de servicio
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {SERVICE_TYPES.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setField("serviceType", s)}
                      className={`text-left px-3 py-2.5 rounded-lg text-sm border transition-colors ${
                        form.serviceType === s
                          ? "bg-[#e94560]/20 border-[#e94560]/60 text-white"
                          : "bg-[#1a1a2e] border-white/10 text-gray-400 hover:text-white hover:border-white/20"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
                {formErrors.serviceType && <p className="text-red-400 text-xs mt-1">{formErrors.serviceType}</p>}
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Notas adicionales</label>
                <textarea
                  rows={3}
                  className={`${inputClass} resize-none`}
                  placeholder="Describe el problema o cualquier detalle relevante…"
                  value={form.notes}
                  onChange={(e) => setField("notes", e.target.value)}
                />
              </div>

              {/* Summary + submit */}
              {selectedDate && selectedSlot && (
                <div className="bg-[#16213e] border border-[#e94560]/30 rounded-xl p-4 text-sm">
                  <p className="text-gray-400">Resumen de tu cita:</p>
                  <p className="text-white font-medium mt-1 capitalize">{dateLabel}</p>
                  <p className="text-[#e94560] font-semibold">{selectedSlot} hrs</p>
                  {form.serviceType && <p className="text-gray-300 mt-1">{form.serviceType}</p>}
                </div>
              )}

              {submitError && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 text-red-400 text-sm">
                  {submitError}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full inline-flex items-center justify-center gap-2 bg-[#e94560] hover:bg-[#c73652] disabled:opacity-60 text-white font-semibold px-6 py-3.5 rounded-xl transition-colors text-sm"
              >
                {submitting ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                    </svg>
                    Agendando…
                  </>
                ) : (
                  <>
                    <IconCalendar />
                    Confirmar cita
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </main>
  );
}
