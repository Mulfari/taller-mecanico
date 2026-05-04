"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateInvoiceStatus } from "../actions";
import type { InvoiceStatus } from "@/types/database";
import PaymentModal from "./PaymentModal";

interface Props {
  invoiceId: string;
  currentStatus: InvoiceStatus;
  invoiceTotal: number;
  totalPaid: number;
}

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

function IconCurrency() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

export default function StatusActions({ invoiceId, currentStatus, invoiceTotal, totalPaid }: Props) {
  const [isPending, startTransition] = useTransition();
  const [done, setDone] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const router = useRouter();

  const remaining = invoiceTotal - totalPaid;
  const hasPartialPayment = totalPaid > 0 && currentStatus !== "paid";

  if (currentStatus === "paid") return null;

  function handleSend() {
    startTransition(async () => {
      await updateInvoiceStatus(invoiceId, "sent");
      setDone(true);
      setTimeout(() => {
        setDone(false);
        router.refresh();
      }, 1200);
    });
  }

  return (
    <>
      <div className="flex items-center gap-2 print:hidden">
        {currentStatus === "draft" && (
          <button
            onClick={handleSend}
            disabled={isPending || done}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-60 bg-blue-500/10 border border-blue-500/30 text-blue-300 hover:bg-blue-500/20 hover:border-blue-500/50"
          >
            {isPending ? (
              <><IconSpinner /> Guardando...</>
            ) : done ? (
              <><IconCheck /> Listo</>
            ) : (
              <><IconSend /> Marcar como enviada</>
            )}
          </button>
        )}

        {(currentStatus === "sent" || currentStatus === "draft") && (
          <button
            onClick={() => setShowPayment(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors bg-green-500/10 border border-green-500/30 text-green-300 hover:bg-green-500/20 hover:border-green-500/50"
          >
            <IconCurrency />
            {hasPartialPayment ? `Registrar pago (pendiente)` : "Registrar pago"}
          </button>
        )}
      </div>

      {showPayment && (
        <PaymentModal
          invoiceId={invoiceId}
          invoiceTotal={invoiceTotal}
          totalPaid={totalPaid}
          onClose={() => setShowPayment(false)}
        />
      )}
    </>
  );
}
