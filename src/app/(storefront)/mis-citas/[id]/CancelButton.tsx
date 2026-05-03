"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function CancelButton({ appointmentId }: { appointmentId: string }) {
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleCancel() {
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { error: updateError } = await supabase
      .from("appointments")
      .update({ status: "cancelled" })
      .eq("id", appointmentId);

    if (updateError) {
      setError("No se pudo cancelar la cita. Intenta de nuevo.");
      setLoading(false);
      setConfirming(false);
      return;
    }
    router.refresh();
  }

  if (confirming) {
    return (
      <div className="flex-1 flex flex-col sm:flex-row gap-2">
        {error && (
          <p className="text-red-400 text-xs self-center">{error}</p>
        )}
        <p className="text-gray-400 text-sm self-center sm:flex-1">
          ¿Confirmar cancelación?
        </p>
        <button
          onClick={() => setConfirming(false)}
          disabled={loading}
          className="flex-1 py-3 px-6 rounded-xl font-semibold text-gray-300 border border-white/10 hover:border-white/20 hover:text-white transition-colors text-sm disabled:opacity-50"
        >
          No, mantener
        </button>
        <button
          onClick={handleCancel}
          disabled={loading}
          className="flex-1 py-3 px-6 rounded-xl font-semibold text-white bg-red-600 hover:bg-red-700 transition-colors text-sm disabled:opacity-50 inline-flex items-center justify-center gap-2"
        >
          {loading && (
            <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
            </svg>
          )}
          Sí, cancelar
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="flex-1 py-3 px-6 rounded-xl font-semibold text-red-400 border border-red-500/30 hover:border-red-500/60 hover:bg-red-500/10 transition-colors text-sm"
    >
      Cancelar cita
    </button>
  );
}
