"use client";

import { useState, useTransition } from "react";
import { updateQuoteStatus } from "../actions";
import type { QuoteStatus } from "@/types/database";

function IconSpinner() {
  return (
    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
    </svg>
  );
}

interface Props {
  quoteId: string;
  currentStatus: QuoteStatus;
}

export default function QuoteStatusButtons({ quoteId, currentStatus }: Props) {
  const [isPending, startTransition] = useTransition();
  const [activeAction, setActiveAction] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handleUpdate(newStatus: QuoteStatus, label: string) {
    setActiveAction(label);
    setError(null);
    startTransition(async () => {
      try {
        await updateQuoteStatus(quoteId, newStatus);
      } catch {
        setError("Error al actualizar el estado. Intenta de nuevo.");
      } finally {
        setActiveAction(null);
      }
    });
  }

  // Determine which actions are available based on current status
  const actions: { label: string; status: QuoteStatus; style: string }[] = [];

  if (currentStatus === "draft") {
    actions.push({
      label: "Enviar al cliente",
      status: "sent",
      style:
        "bg-blue-500/10 border border-blue-500/30 text-blue-300 hover:bg-blue-500/20 hover:border-blue-500/50",
    });
  }

  if (currentStatus === "sent") {
    actions.push(
      {
        label: "Marcar aceptada",
        status: "accepted",
        style:
          "bg-green-500/10 border border-green-500/30 text-green-300 hover:bg-green-500/20 hover:border-green-500/50",
      },
      {
        label: "Marcar rechazada",
        status: "rejected",
        style:
          "bg-red-500/10 border border-red-500/30 text-red-300 hover:bg-red-500/20 hover:border-red-500/50",
      }
    );
  }

  if (currentStatus === "accepted" || currentStatus === "rejected") {
    actions.push({
      label: "Volver a borrador",
      status: "draft",
      style:
        "bg-gray-500/10 border border-gray-500/30 text-gray-400 hover:bg-gray-500/20 hover:border-gray-500/50",
    });
  }

  if (actions.length === 0) return null;

  return (
    <div className="flex flex-col gap-2">
      {error && (
        <p className="text-red-400 text-xs">{error}</p>
      )}
      <div className="flex flex-wrap gap-2">
        {actions.map((action) => (
          <button
            key={action.status}
            onClick={() => handleUpdate(action.status, action.label)}
            disabled={isPending}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${action.style}`}
          >
            {isPending && activeAction === action.label ? (
              <IconSpinner />
            ) : null}
            {action.label}
          </button>
        ))}
      </div>
    </div>
  );
}
