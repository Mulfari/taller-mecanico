"use client";

import { useState, useTransition } from "react";
import { createWorkOrderFromQuoteAction } from "./actions";

function IconSpinner() {
  return (
    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
    </svg>
  );
}

function IconClipboard() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
    </svg>
  );
}

export default function ConvertirOrdenButton({ quoteId }: { quoteId: string }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleClick() {
    setError(null);
    startTransition(async () => {
      try {
        await createWorkOrderFromQuoteAction(quoteId);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error al crear la orden");
      }
    });
  }

  return (
    <div className="flex flex-col items-end gap-1 print:hidden">
      <button
        onClick={handleClick}
        disabled={isPending}
        className="flex items-center gap-2 bg-[#e94560] hover:bg-[#e94560]/90 disabled:opacity-60 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors"
      >
        {isPending ? <IconSpinner /> : <IconClipboard />}
        {isPending ? "Creando orden..." : "Convertir a orden de trabajo"}
      </button>
      {error && <p className="text-red-400 text-xs">{error}</p>}
    </div>
  );
}
