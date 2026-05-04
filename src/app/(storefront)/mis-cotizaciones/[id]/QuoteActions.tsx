"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type QuoteStatus = "draft" | "sent" | "accepted" | "rejected";

function IconCheck() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
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
    <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
    </svg>
  );
}

function ConfirmDialog({
  action,
  onConfirm,
  onCancel,
  loading,
}: {
  action: "accept" | "reject";
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
}) {
  const isAccept = action === "accept";
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative bg-secondary border border-white/10 rounded-2xl w-full max-w-sm p-6 shadow-2xl">
        <h2 className="text-white font-semibold text-lg mb-2">
          {isAccept ? "Aceptar cotización" : "Rechazar cotización"}
        </h2>
        <p className="text-gray-400 text-sm mb-6">
          {isAccept
            ? "Al aceptar, el taller será notificado y se pondrá en contacto contigo para coordinar el trabajo."
            : "Al rechazar, la cotización quedará cancelada. Podés solicitar una nueva si lo necesitás."}
        </p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={loading}
            className="flex-1 px-4 py-2.5 rounded-xl border border-white/10 text-gray-400 text-sm hover:text-white hover:border-white/20 transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`flex-1 inline-flex items-center justify-center gap-2 text-white text-sm font-medium px-4 py-2.5 rounded-xl transition-colors disabled:opacity-60 ${
              isAccept
                ? "bg-green-600 hover:bg-green-700"
                : "bg-red-600 hover:bg-red-700"
            }`}
          >
            {loading ? <IconSpinner /> : isAccept ? "Sí, aceptar" : "Sí, rechazar"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function QuoteActions({
  quoteId,
  initialStatus,
  isExpired,
}: {
  quoteId: string;
  initialStatus: QuoteStatus;
  isExpired: boolean;
}) {
  const router = useRouter();
  const [status, setStatus] = useState<QuoteStatus>(initialStatus);
  const [confirm, setConfirm] = useState<"accept" | "reject" | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAction(action: "accept" | "reject") {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/quotes/${quoteId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: action === "accept" ? "accepted" : "rejected" }),
      });
      if (!res.ok) throw new Error("Error al procesar la solicitud");
      setStatus(action === "accept" ? "accepted" : "rejected");
      router.refresh();
    } catch {
      setError("Ocurrió un error. Por favor intentá de nuevo.");
    } finally {
      setLoading(false);
      setConfirm(null);
    }
  }

  if (status === "accepted") {
    return (
      <div className="flex items-center gap-3 bg-green-500/10 border border-green-500/20 rounded-xl px-5 py-4">
        <span className="text-green-400 shrink-0"><IconCheck /></span>
        <div>
          <p className="text-green-300 font-medium text-sm">Cotización aceptada</p>
          <p className="text-green-400/70 text-xs mt-0.5">
            El taller ha sido notificado y se pondrá en contacto contigo pronto.
          </p>
        </div>
      </div>
    );
  }

  if (status === "rejected") {
    return (
      <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/20 rounded-xl px-5 py-4">
        <span className="text-red-400 shrink-0"><IconX /></span>
        <div>
          <p className="text-red-300 font-medium text-sm">Cotización rechazada</p>
          <p className="text-red-400/70 text-xs mt-0.5">
            Podés contactar al taller si deseás solicitar ajustes.
          </p>
        </div>
      </div>
    );
  }

  if (status !== "sent") return null;

  if (isExpired) {
    return (
      <p className="text-center text-gray-600 text-sm py-2">
        Esta cotización ha vencido. Contactá al taller para solicitar una nueva.
      </p>
    );
  }

  return (
    <>
      {error && (
        <div className="flex items-center gap-2 text-sm px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 mb-4">
          <IconX />
          {error}
        </div>
      )}
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={() => setConfirm("reject")}
          className="flex-1 inline-flex items-center justify-center gap-2 border border-red-500/40 text-red-400 hover:bg-red-500/10 text-sm font-medium px-6 py-3 rounded-xl transition-colors"
        >
          <IconX />
          Rechazar cotización
        </button>
        <button
          onClick={() => setConfirm("accept")}
          className="flex-1 inline-flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-6 py-3 rounded-xl transition-colors"
        >
          <IconCheck />
          Aceptar cotización
        </button>
      </div>
      {confirm && (
        <ConfirmDialog
          action={confirm}
          onConfirm={() => handleAction(confirm)}
          onCancel={() => setConfirm(null)}
          loading={loading}
        />
      )}
    </>
  );
}
