"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { AppointmentStatus } from "@/types/database";
import {
  updateAppointmentStatusAction,
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

function IconSpinner() {
  return (
    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
    </svg>
  );
}

export default function AppointmentActions({
  appointmentId,
  status,
}: {
  appointmentId: string;
  status: AppointmentStatus;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [creatingOrder, setCreatingOrder] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      // redirect happens inside the action
    } catch {
      setError("No se pudo crear la orden de trabajo. Intenta de nuevo.");
      setCreatingOrder(false);
    }
  }

  const busy = isPending || creatingOrder;

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
          onClick={() => handleStatus("cancelled")}
          disabled={busy}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 hover:border-red-500/40 disabled:opacity-50 text-sm font-medium transition-colors"
        >
          {isPending ? <IconSpinner /> : <IconX />}
          Cancelar cita
        </button>
      </div>
    </div>
  );
}
