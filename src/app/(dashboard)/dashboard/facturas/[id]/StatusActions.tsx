"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateInvoiceStatus } from "../actions";
import type { InvoiceStatus } from "@/types/database";

interface Props {
  invoiceId: string;
  currentStatus: InvoiceStatus;
}

const NEXT_ACTION: Partial<Record<InvoiceStatus, { label: string; next: InvoiceStatus; style: string }>> = {
  draft: {
    label: "Marcar como enviada",
    next: "sent",
    style: "bg-blue-500/10 border border-blue-500/30 text-blue-300 hover:bg-blue-500/20 hover:border-blue-500/50",
  },
  sent: {
    label: "Registrar pago",
    next: "paid",
    style: "bg-green-500/10 border border-green-500/30 text-green-300 hover:bg-green-500/20 hover:border-green-500/50",
  },
};

function IconSpinner() {
  return (
    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
    </svg>
  );
}

function IconCheck() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  );
}

function IconSend() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
    </svg>
  );
}

export default function StatusActions({ invoiceId, currentStatus }: Props) {
  const action = NEXT_ACTION[currentStatus];
  const [isPending, startTransition] = useTransition();
  const [done, setDone] = useState(false);
  const router = useRouter();

  if (!action) return null;

  function handleClick() {
    startTransition(async () => {
      await updateInvoiceStatus(invoiceId, action!.next);
      setDone(true);
      setTimeout(() => {
        setDone(false);
        router.refresh();
      }, 1200);
    });
  }

  return (
    <button
      onClick={handleClick}
      disabled={isPending || done}
      className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-60 print:hidden ${action.style}`}
    >
      {isPending ? (
        <><IconSpinner /> Guardando...</>
      ) : done ? (
        <><IconCheck /> Listo</>
      ) : (
        <>{action.next === "sent" ? <IconSend /> : <IconCheck />} {action.label}</>
      )}
    </button>
  );
}
