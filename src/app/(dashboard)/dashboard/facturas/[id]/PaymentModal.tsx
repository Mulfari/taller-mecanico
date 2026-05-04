"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { recordPayment, type PaymentMethod, PAYMENT_METHOD_LABELS } from "../actions";

interface Props {
  invoiceId: string;
  invoiceTotal: number;
  totalPaid: number;
  onClose: () => void;
}

const fmt = (n: number) =>
  `$${n.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const METHODS: { value: PaymentMethod; icon: string }[] = [
  { value: "cash", icon: "💵" },
  { value: "card", icon: "💳" },
  { value: "transfer", icon: "🏦" },
  { value: "check", icon: "📄" },
  { value: "other", icon: "📋" },
];

function IconX() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
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

export default function PaymentModal({ invoiceId, invoiceTotal, totalPaid, onClose }: Props) {
  const remaining = invoiceTotal - totalPaid;
  const [method, setMethod] = useState<PaymentMethod>("cash");
  const [amount, setAmount] = useState(remaining > 0 ? remaining.toFixed(2) : "0");
  const [reference, setReference] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ fully_paid: boolean; remaining: number } | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setError("El monto debe ser mayor a $0.");
      return;
    }
    if (amountNum > remaining + 0.01) {
      setError(`El monto excede el saldo pendiente de ${fmt(remaining)}.`);
      return;
    }

    startTransition(async () => {
      try {
        const res = await recordPayment(invoiceId, {
          method,
          amount_paid: amountNum,
          reference: reference.trim(),
          notes: notes.trim(),
          paid_at: new Date().toISOString(),
        });
        setResult(res);
        setTimeout(() => {
          router.refresh();
          if (res.fully_paid) onClose();
        }, 2000);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error al registrar el pago.");
      }
    });
  }

  const inputClass =
    "w-full bg-[#1a1a2e] border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-[#e94560]/60 focus:ring-1 focus:ring-[#e94560]/30 transition-colors";

  if (result) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
        <div className="relative bg-[#16213e] border border-white/10 rounded-2xl w-full max-w-md shadow-2xl p-8 text-center">
          <div className={`w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center ${
            result.fully_paid
              ? "bg-green-500/15 border border-green-500/30 text-green-400"
              : "bg-blue-500/15 border border-blue-500/30 text-blue-400"
          }`}>
            {result.fully_paid ? (
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
          </div>
          <h3 className="text-white font-bold text-lg mb-2">
            {result.fully_paid ? "¡Factura pagada!" : "Pago parcial registrado"}
          </h3>
          <p className="text-gray-400 text-sm">
            {result.fully_paid
              ? "El pago se registró correctamente y la factura fue marcada como pagada."
              : `Pago registrado. Saldo pendiente: ${fmt(result.remaining)}`}
          </p>
          <button
            onClick={() => { router.refresh(); onClose(); }}
            className="mt-6 px-6 py-2.5 rounded-lg bg-white/10 hover:bg-white/15 text-white text-sm font-medium transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 overflow-y-auto">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[#16213e] border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl my-8">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <div>
            <h2 className="text-white font-semibold text-lg">Registrar pago</h2>
            <p className="text-gray-500 text-xs mt-0.5">
              Total: {fmt(invoiceTotal)}
              {totalPaid > 0 && <> · Pagado: {fmt(totalPaid)} · Pendiente: {fmt(remaining)}</>}
            </p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors" aria-label="Cerrar">
            <IconX />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">
          {/* Payment method */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Método de pago</label>
            <div className="grid grid-cols-5 gap-2">
              {METHODS.map((m) => (
                <button
                  key={m.value}
                  type="button"
                  onClick={() => setMethod(m.value)}
                  className={`flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border text-xs font-medium transition-all ${
                    method === m.value
                      ? "bg-[#e94560]/10 border-[#e94560]/40 text-[#e94560]"
                      : "bg-white/5 border-white/10 text-gray-400 hover:border-white/20 hover:text-gray-300"
                  }`}
                >
                  <span className="text-lg">{m.icon}</span>
                  {PAYMENT_METHOD_LABELS[m.value]}
                </button>
              ))}
            </div>
          </div>

          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              Monto <span className="text-[#e94560]">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-medium">$</span>
              <input
                type="number"
                step="0.01"
                min="0.01"
                max={remaining + 0.01}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className={`${inputClass} pl-7 text-lg font-semibold`}
                required
              />
            </div>
            {remaining > 0 && (
              <div className="flex gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => setAmount(remaining.toFixed(2))}
                  className="text-xs text-[#e94560] hover:text-[#e94560]/80 transition-colors"
                >
                  Pago total ({fmt(remaining)})
                </button>
                {remaining > 100 && (
                  <button
                    type="button"
                    onClick={() => setAmount((remaining / 2).toFixed(2))}
                    className="text-xs text-gray-500 hover:text-gray-400 transition-colors"
                  >
                    50% ({fmt(remaining / 2)})
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Reference */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              Referencia / No. de operación
            </label>
            <input
              type="text"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              className={inputClass}
              placeholder={
                method === "card" ? "Últimos 4 dígitos o autorización"
                  : method === "transfer" ? "No. de referencia bancaria"
                  : method === "check" ? "No. de cheque"
                  : "Referencia (opcional)"
              }
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Notas</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className={`${inputClass} resize-none`}
              rows={2}
              placeholder="Observaciones sobre el pago…"
            />
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-lg border border-white/10 text-gray-400 text-sm hover:text-white hover:border-white/20 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="flex-1 inline-flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors"
            >
              {isPending ? (
                <><IconSpinner /> Registrando…</>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Registrar pago
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
