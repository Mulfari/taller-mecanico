"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

// ── Types ──────────────────────────────────────────────────────────────────

type QuoteStatus = "draft" | "sent" | "accepted" | "rejected";

interface QuoteItem {
  id: string;
  type: "labor" | "part";
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
}

interface Quote {
  id: string;
  status: QuoteStatus;
  total: number;
  valid_until: string | null;
  created_at: string;
  items: QuoteItem[];
  client: { full_name: string; email: string } | null;
  vehicle: { brand: string; model: string; year: number; plate: string | null } | null;
}

// ── Constants ──────────────────────────────────────────────────────────────

const STATUS_LABELS: Record<QuoteStatus, string> = {
  draft:    "Borrador",
  sent:     "Pendiente de respuesta",
  accepted: "Aceptada",
  rejected: "Rechazada",
};

const STATUS_BADGE: Record<QuoteStatus, string> = {
  draft:    "bg-gray-500/20 text-gray-300",
  sent:     "bg-blue-500/20 text-blue-300",
  accepted: "bg-green-500/20 text-green-300",
  rejected: "bg-red-500/20 text-red-300",
};

// ── Icons ──────────────────────────────────────────────────────────────────

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

function IconCar() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
    </svg>
  );
}

function IconFileText() {
  return (
    <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  );
}

// ── Confirm Dialog ─────────────────────────────────────────────────────────

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
      <div className="relative bg-secondary border border-white/10 rounded-2xl w-full max-w-sm shadow-2xl p-6 text-center">
        <div
          className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4 ${
            isAccept ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"
          }`}
        >
          {isAccept ? <IconCheck /> : <IconX />}
        </div>
        <h3 className="text-white font-semibold text-lg mb-2">
          {isAccept ? "¿Aceptar cotización?" : "¿Rechazar cotización?"}
        </h3>
        <p className="text-gray-400 text-sm mb-6">
          {isAccept
            ? "Al aceptar, el taller recibirá una notificación para proceder con el servicio."
            : "Al rechazar, el taller será notificado. Puedes contactarlos para solicitar cambios."}
        </p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={loading}
            className="flex-1 px-4 py-2.5 rounded-lg border border-white/10 text-gray-400 text-sm hover:text-white hover:border-white/20 transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`flex-1 inline-flex items-center justify-center gap-2 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors disabled:opacity-60 ${
              isAccept
                ? "bg-green-600 hover:bg-green-700"
                : "bg-red-600 hover:bg-red-700"
            }`}
          >
            {loading ? (
              <><IconSpinner /> Procesando…</>
            ) : isAccept ? (
              "Sí, aceptar"
            ) : (
              "Sí, rechazar"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────

export default function CotizacionPublicaPage() {
  const params = useParams();
  const id = params?.id as string;

  const [quote, setQuote] = useState<Quote | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [confirm, setConfirm] = useState<"accept" | "reject" | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const supabaseRef = useRef<ReturnType<typeof createClient> | null>(null);

  useEffect(() => {
    supabaseRef.current = createClient();
    const supabase = supabaseRef.current;

    supabase
      .from("quotes")
      .select(
        `id, status, total, valid_until, created_at, items,
         client:profiles(full_name, email),
         vehicle:vehicles(brand, model, year, plate)`
      )
      .eq("id", id)
      .single()
      .then(({ data, error }) => {
        if (error || !data) {
          setNotFound(true);
        } else {
          setQuote(data as unknown as Quote);
        }
        setLoading(false);
      });
  }, [id]);

  async function handleAction(action: "accept" | "reject") {
    const supabase = supabaseRef.current;
    if (!supabase) return;

    setActionLoading(true);
    setActionError(null);

    const newStatus = action === "accept" ? "accepted" : "rejected";
    const { error } = await supabase
      .from("quotes")
      .update({ status: newStatus })
      .eq("id", id);

    if (error) {
      setActionError("No se pudo procesar tu respuesta. Intenta de nuevo.");
    } else {
      setQuote((prev) => prev ? { ...prev, status: newStatus } : prev);
    }

    setActionLoading(false);
    setConfirm(null);
  }

  const fmt = (n: number) => `$${n.toLocaleString("es-MX", { minimumFractionDigits: 2 })}`;

  function formatDate(d: string) {
    return new Date(d + "T00:00:00").toLocaleDateString("es-MX", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  }

  // ── Loading ──────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex items-center gap-3 text-gray-500">
          <IconSpinner />
          <span className="text-sm">Cargando cotización…</span>
        </div>
      </div>
    );
  }

  // ── Not found ────────────────────────────────────────────────────────────

  if (notFound || !quote) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-5 text-gray-600">
            <IconFileText />
          </div>
          <h1 className="text-xl font-bold text-white mb-2">Cotización no encontrada</h1>
          <p className="text-gray-500 text-sm mb-6">
            El enlace puede haber expirado o la cotización no existe.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 bg-primary hover:bg-primary-hover text-white text-sm font-medium px-6 py-3 rounded-lg transition-colors"
          >
            Ir al inicio
          </Link>
        </div>
      </div>
    );
  }

  const items: QuoteItem[] = Array.isArray(quote.items) ? quote.items : [];
  const laborItems = items.filter((i) => i.type === "labor");
  const partItems  = items.filter((i) => i.type === "part");
  const canRespond = quote.status === "sent";
  const isExpired  = quote.valid_until
    ? new Date(quote.valid_until + "T23:59:59") < new Date()
    : false;

  return (
    <div className="max-w-2xl mx-auto px-4 py-10 sm:py-16">
      {/* Header */}
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 text-primary text-sm font-medium mb-3">
          <IconFileText />
          Cotización
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold text-white">
              #{quote.id.slice(0, 8).toUpperCase()}
            </h1>
            <p className="text-gray-500 text-sm mt-1">Emitida el {formatDate(quote.created_at)}</p>
          </div>
          <span
            className={`self-start sm:self-auto inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${STATUS_BADGE[quote.status]}`}
          >
            {STATUS_LABELS[quote.status]}
          </span>
        </div>
      </div>

      {/* Client + Vehicle info */}
      <div className="bg-secondary border border-white/10 rounded-xl p-5 mb-5 grid grid-cols-1 sm:grid-cols-2 gap-5">
        {quote.client && (
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-1.5">Cliente</p>
            <p className="text-white font-medium">{quote.client.full_name}</p>
            <p className="text-gray-400 text-sm">{quote.client.email}</p>
          </div>
        )}
        {quote.vehicle && (
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-1.5">Vehículo</p>
            <div className="flex items-center gap-2">
              <span className="text-primary"><IconCar /></span>
              <div>
                <p className="text-white font-medium">
                  {quote.vehicle.brand} {quote.vehicle.model} {quote.vehicle.year}
                </p>
                {quote.vehicle.plate && (
                  <p className="text-gray-400 text-sm font-mono">{quote.vehicle.plate}</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Items */}
      <div className="bg-secondary border border-white/10 rounded-xl overflow-hidden mb-5">
        {laborItems.length > 0 && (
          <div className="p-5">
            <p className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-3">
              Mano de obra
            </p>
            <div className="space-y-2">
              {laborItems.map((item, idx) => (
                <div key={item.id ?? idx} className="flex justify-between items-start gap-4 text-sm">
                  <span className="text-gray-300">{item.description}</span>
                  <span className="text-gray-400 shrink-0 tabular-nums">{fmt(item.total)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {partItems.length > 0 && (
          <div className={`p-5 ${laborItems.length > 0 ? "border-t border-white/5" : ""}`}>
            <p className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-3">
              Repuestos y materiales
            </p>
            <div className="space-y-2">
              {partItems.map((item, idx) => (
                <div key={item.id ?? idx} className="flex justify-between items-start gap-4 text-sm">
                  <span className="text-gray-300">
                    {item.description}
                    {item.quantity > 1 && (
                      <span className="text-gray-600 ml-1.5 text-xs">×{item.quantity}</span>
                    )}
                  </span>
                  <span className="text-gray-400 shrink-0 tabular-nums">{fmt(item.total)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {items.length === 0 && (
          <div className="p-5 text-center text-gray-600 text-sm">
            Sin ítems registrados.
          </div>
        )}

        {/* Total */}
        <div className="px-5 py-4 border-t border-white/10 flex justify-between items-center">
          <span className="text-gray-300 font-medium">Total</span>
          <span className="text-primary text-2xl font-bold tabular-nums">{fmt(quote.total)}</span>
        </div>
      </div>

      {/* Validity */}
      {quote.valid_until && (
        <div
          className={`flex items-center gap-2 text-sm px-4 py-3 rounded-xl mb-6 ${
            isExpired
              ? "bg-red-500/10 border border-red-500/20 text-red-400"
              : "bg-white/5 border border-white/10 text-gray-400"
          }`}
        >
          <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {isExpired
            ? `Esta cotización venció el ${formatDate(quote.valid_until)}.`
            : `Válida hasta el ${formatDate(quote.valid_until)}.`}
        </div>
      )}

      {/* Action error */}
      {actionError && (
        <div className="flex items-center gap-2 text-sm px-4 py-3 rounded-xl mb-4 bg-red-500/10 border border-red-500/20 text-red-400">
          <IconX />
          {actionError}
        </div>
      )}

      {/* Already responded */}
      {quote.status === "accepted" && (
        <div className="flex items-center gap-3 bg-green-500/10 border border-green-500/20 rounded-xl px-5 py-4 mb-6">
          <span className="text-green-400 shrink-0"><IconCheck /></span>
          <div>
            <p className="text-green-300 font-medium text-sm">Cotización aceptada</p>
            <p className="text-green-400/70 text-xs mt-0.5">
              El taller ha sido notificado y se pondrá en contacto contigo pronto.
            </p>
          </div>
        </div>
      )}

      {quote.status === "rejected" && (
        <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/20 rounded-xl px-5 py-4 mb-6">
          <span className="text-red-400 shrink-0"><IconX /></span>
          <div>
            <p className="text-red-300 font-medium text-sm">Cotización rechazada</p>
            <p className="text-red-400/70 text-xs mt-0.5">
              Puedes contactar al taller si deseas solicitar ajustes.
            </p>
          </div>
        </div>
      )}

      {/* Action buttons */}
      {canRespond && !isExpired && (
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
      )}

      {canRespond && isExpired && (
        <p className="text-center text-gray-600 text-sm">
          Esta cotización ha vencido. Contacta al taller para solicitar una nueva.
        </p>
      )}

      {/* Confirm dialog */}
      {confirm && (
        <ConfirmDialog
          action={confirm}
          onConfirm={() => handleAction(confirm)}
          onCancel={() => setConfirm(null)}
          loading={actionLoading}
        />
      )}
    </div>
  );
}
