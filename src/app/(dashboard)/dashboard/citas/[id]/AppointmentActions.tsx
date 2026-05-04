"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { AppointmentStatus } from "@/types/database";
import {
  updateAppointmentStatusAction,
  updateAppointmentAction,
  createWorkOrderFromAppointmentAction,
} from "../actions";

function IconCheck() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  );
}

function IconX() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
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

function IconCalendarEdit() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v4.5m-18 6.75A2.25 2.25 0 005.25 21h5.25m-7.5-2.25v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v1.5" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M16.862 16.862l1.5-1.5a1.06 1.06 0 011.5 0l.75.75a1.06 1.06 0 010 1.5l-1.5 1.5m-2.25-2.25l-2.625 2.625a.75.75 0 00-.198.348l-.375 1.5 1.5-.375a.75.75 0 00.348-.198l2.625-2.625m-1.275-1.275l2.25 2.25" />
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

const SERVICE_TYPES = [
  "Cambio de aceite y filtros",
  "Diagnóstico electrónico",
  "Revisión general",
  "Frenos (pastillas / discos)",
  "Alineación y balanceo",
  "Sistema eléctrico",
  "Aire acondicionado",
  "Cambio de neumáticos",
  "Suspensión / amortiguadores",
  "Transmisión",
  "Otro",
];

const TIME_SLOTS = [
  "08:00", "08:30", "09:00", "09:30", "10:00", "10:30",
  "11:00", "11:30", "12:00", "12:30", "13:00", "13:30",
  "14:00", "14:30", "15:00", "15:30", "16:00", "16:30",
  "17:00", "17:30",
];

const inputClass =
  "w-full bg-[#1a1a2e] border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-[#e94560]/60 focus:ring-1 focus:ring-[#e94560]/30 transition-colors";

export default function AppointmentActions({
  appointmentId,
  status,
  currentDate,
  currentTimeSlot,
  currentServiceType,
  currentNotes,
}: {
  appointmentId: string;
  status: AppointmentStatus;
  currentDate: string;
  currentTimeSlot: string;
  currentServiceType: string;
  currentNotes: string | null;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [creatingOrder, setCreatingOrder] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [showReschedule, setShowReschedule] = useState(false);
  const [rescheduleDate, setRescheduleDate] = useState(currentDate);
  const [rescheduleTime, setRescheduleTime] = useState(currentTimeSlot);
  const [rescheduleService, setRescheduleService] = useState(currentServiceType);
  const [rescheduleNotes, setRescheduleNotes] = useState(currentNotes ?? "");
  const [rescheduling, setRescheduling] = useState(false);
  const [rescheduleSuccess, setRescheduleSuccess] = useState(false);

  if (status === "completed" || status === "cancelled") return null;

  function handleStatus(newStatus: AppointmentStatus) {
    setError(null);
    startTransition(async () => {
      try {
        await updateAppointmentStatusAction(appointmentId, newStatus);
        router.refresh();
      } catch {
        setError("No se pudo actualizar el estado. Intenta de nuevo.");
      }
    });
  }

  async function handleCreateOrder() {
    setError(null);
    setCreatingOrder(true);
    try {
      await createWorkOrderFromAppointmentAction(appointmentId);
    } catch {
      setError("No se pudo crear la orden de trabajo. Intenta de nuevo.");
      setCreatingOrder(false);
    }
  }

  async function handleReschedule(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setRescheduling(true);
    setRescheduleSuccess(false);
    try {
      await updateAppointmentAction(appointmentId, {
        date: rescheduleDate,
        time_slot: rescheduleTime,
        service_type: rescheduleService,
        notes: rescheduleNotes || null,
      });
      setRescheduleSuccess(true);
      setTimeout(() => {
        setShowReschedule(false);
        setRescheduleSuccess(false);
      }, 1500);
      router.refresh();
    } catch {
      setError("No se pudo reprogramar la cita. Intenta de nuevo.");
    } finally {
      setRescheduling(false);
    }
  }

  const busy = isPending || creatingOrder || rescheduling;

  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="space-y-3">
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-2.5 text-red-400 text-sm">
          {error}
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        {status === "pending" && (
          <button
            onClick={() => handleStatus("confirmed")}
            disabled={busy}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 border border-blue-500/30 hover:border-blue-500/50 disabled:opacity-50 text-sm font-medium transition-colors"
          >
            {isPending ? <IconSpinner /> : <IconCheck />}
            Confirmar cita
          </button>
        )}

        {status === "confirmed" && (
          <button
            onClick={handleCreateOrder}
            disabled={busy}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#e94560]/20 text-[#e94560] hover:bg-[#e94560]/30 border border-[#e94560]/30 hover:border-[#e94560]/50 disabled:opacity-50 text-sm font-medium transition-colors"
          >
            {creatingOrder ? <IconSpinner /> : <IconWrench />}
            Crear orden de trabajo
          </button>
        )}

        <button
          onClick={() => setShowReschedule((v) => !v)}
          disabled={busy}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-purple-500/10 text-purple-300 hover:bg-purple-500/20 border border-purple-500/20 hover:border-purple-500/40 disabled:opacity-50 text-sm font-medium transition-colors"
        >
          <IconCalendarEdit />
          Reprogramar
        </button>

        <button
          onClick={() => handleStatus("cancelled")}
          disabled={busy}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 hover:border-red-500/40 disabled:opacity-50 text-sm font-medium transition-colors"
        >
          {isPending ? <IconSpinner /> : <IconX />}
          Cancelar cita
        </button>
      </div>

      {showReschedule && (
        <form
          onSubmit={handleReschedule}
          className="bg-[#16213e] border border-purple-500/20 rounded-xl p-5 space-y-4"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-white font-semibold text-sm">Reprogramar cita</h3>
            <button
              type="button"
              onClick={() => setShowReschedule(false)}
              className="text-gray-500 hover:text-white transition-colors"
              aria-label="Cerrar"
            >
              <IconX />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-gray-400 text-xs font-medium">
                Nueva fecha
              </label>
              <input
                type="date"
                value={rescheduleDate}
                onChange={(e) => setRescheduleDate(e.target.value)}
                min={today}
                required
                className={inputClass}
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-gray-400 text-xs font-medium">
                Horario
              </label>
              <select
                value={rescheduleTime}
                onChange={(e) => setRescheduleTime(e.target.value)}
                required
                className={inputClass}
              >
                {TIME_SLOTS.map((slot) => (
                  <option key={slot} value={slot}>
                    {slot} hs
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-gray-400 text-xs font-medium">
              Tipo de servicio
            </label>
            <select
              value={rescheduleService}
              onChange={(e) => setRescheduleService(e.target.value)}
              required
              className={inputClass}
            >
              {SERVICE_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
              {!SERVICE_TYPES.includes(rescheduleService) && (
                <option value={rescheduleService}>{rescheduleService}</option>
              )}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="block text-gray-400 text-xs font-medium">
              Notas (opcional)
            </label>
            <textarea
              value={rescheduleNotes}
              onChange={(e) => setRescheduleNotes(e.target.value)}
              rows={2}
              className={inputClass}
              placeholder="Notas adicionales..."
            />
          </div>

          <div className="flex items-center gap-3 pt-1">
            <button
              type="submit"
              disabled={rescheduling}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-purple-500/20 text-purple-300 hover:bg-purple-500/30 border border-purple-500/30 hover:border-purple-500/50 disabled:opacity-50 text-sm font-medium transition-colors"
            >
              {rescheduling ? (
                <><IconSpinner /> Guardando...</>
              ) : rescheduleSuccess ? (
                <><IconCheck /> Reprogramada</>
              ) : (
                "Guardar cambios"
              )}
            </button>
            <button
              type="button"
              onClick={() => setShowReschedule(false)}
              className="text-gray-500 hover:text-gray-300 text-sm transition-colors"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
