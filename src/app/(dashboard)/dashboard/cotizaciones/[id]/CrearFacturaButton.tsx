"use client";

import { useState, useTransition } from "react";
import { createInvoiceFromQuoteAction } from "../actions";

function IconSpinner() {
  return (
    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
    </svg>
  );
}

function IconReceipt() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" />
    </svg>
  );
}

export default function CrearFacturaButton({ quoteId }: { quoteId: string }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleClick() {
    setError(null);
    startTransition(async () => {
      try {
        await createInvoiceFromQuoteAction(quoteId);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error al crear la factura");
      }
    });
  }

  return (
    <div className="flex flex-col items-end gap-1 print:hidden">
      <button
        onClick={handleClick}
        disabled={isPending}
        className="flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors"
      >
        {isPending ? <IconSpinner /> : <IconReceipt />}
        {isPending ? "Creando factura..." : "Crear factura"}
      </button>
      {error && <p className="text-red-400 text-xs">{error}</p>}
    </div>
  );
}
