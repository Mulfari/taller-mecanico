"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

// ── Types ──────────────────────────────────────────────────────────────────

type QuoteStatus = "draft" | "sent" | "accepted" | "rejected";

interface QuoteItem {
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
}

interface Quote {
  id: string;
  status: QuoteStatus;
  total: number | null;
  valid_until: string | null;
  created_at: string;
  items: QuoteItem[];
  vehicle: {
    brand: string;
    model: string;
    year: number;
    plate: string | null;
  } | null;
}

// ── Constants ──────────────────────────────────────────────────────────────

const STATUS_LABELS: Record<QuoteStatus, string> = {
  draft: "Borrador",
  sent: "Enviada",
  accepted: "Aceptada",
  rejected: "Rechazada",
};

const STATUS_BADGE: Record<QuoteStatus, string> = {
  draft: "bg-gray-500/20 text-gray-300",
  sent: "bg-blue-500/20 text-blue-300",
  accepted: "bg-green-500/20 text-green-300",
  rejected: "bg-red-500/20 text-red-300",
};

const STATUS_DOT: Record<QuoteStatus, string> = {
  draft: "bg-gray-400",
  sent: "bg-blue-400",
  accepted: "bg-green-400",
  rejected: "bg-red-400",
};

// ── Icons ──────────────────────────────────────────────────────────────────

function IconClipboard() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
    </svg>
  );
}

function IconCar() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
    </svg>
  );
}

function IconChevronRight() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  );
}

function IconCheck() {
  return (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
    </svg>
  );
}

function IconX() {
  return (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

function IconLock() {
  return (
    <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
    </svg>
  );
}

function IconSpinner() {
  return (
    <svg className="w-6 h-6 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
    </svg>
  );
}

function IconSpinnerSm() {
  return (
    <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
    </svg>
  );
}

// ── Helpers ────────────────────────────────────────────────────────────────

const fmt = (n: number) =>
  `$${n.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const fmtDate = (d: string) =>
  new Date(d.includes("T") ? d : d + "T00:00:00").toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

function isExpired(validUntil: string | null): boolean {
  if (!validUntil) return false;
  return new Date(validUntil + "T23:59:59") < new Date();
}

// ── Quote Card ─────────────────────────────────────────────────────────────

function QuoteCard({
  quote,
  responding,
  onAccept,
  onReject,
}: {
  quote: Quote;
  responding: string | null;
  onAccept: (id: string) => void;
  onReject: (id: string) => void;
}) {
  const expired = quote.status === "sent" && isExpired(quote.valid_until);
  const items: QuoteItem[] = Array.isArray(quote.items) ? quote.items : [];
  const isBusy = responding === quote.id;
  const canRespond = quote.status === "sent" && !expired;

  return (
    <div className="bg-[#16213e] border border-white/10 rounded-xl overflow-hidden hover:border-white/20 transition-colors">
      <div className="p-5">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          {/* Left: ID + status + vehicle */}
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-white font-semibold text-sm font-mono">
                COT-{quote.id.slice(0, 8).toUpperCase()}
              </span>
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_BADGE[quote.status]}`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[quote.status]}`} />
                {STATUS_LABELS[quote.status]}
              </span>
              {expired && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-orange-500/20 text-orange-300">
                  Vencida
                </span>
              )}
            </div>

            {quote.vehicle && (
              <div className="flex items-center gap-1.5 mt-2 text-gray-400 text-sm">
                <IconCar />
                <span>
                  {quote.vehicle.brand} {quote.vehicle.model} {quote.vehicle.year}
                  {quote.vehicle.plate ? ` — ${quote.vehicle.plate}` : ""}
                </span>
              </div>
            )}

            <div className="flex items-center gap-4 mt-2 text-xs text-gray-500 flex-wrap">
              <span>Solicitada: {fmtDate(quote.created_at)}</span>
              {quote.valid_until && (
                <span className={expired ? "text-orange-400" : ""}>
                  Válida hasta: {fmtDate(quote.valid_until)}
                </span>
              )}
              {items.length > 0 && (
                <span>{items.length} ítem{items.length !== 1 ? "s" : ""}</span>
              )}
            </div>
          </div>

          {/* Right: total + link */}
          <div className="flex items-center gap-3 shrink-0">
            {quote.total != null && quote.total > 0 && (
              <span className="text-[#e94560] font-bold text-lg">
                {fmt(quote.total)}
              </span>
            )}
            <Link
              href={`/mis-cotizaciones/${quote.id}`}
              className="inline-flex items-center gap-1 text-gray-400 hover:text-white text-sm transition-colors"
              aria-label={`Ver cotización ${quote.id.slice(0, 8).toUpperCase()}`}
            >
              Ver <IconChevronRight />
            </Link>
          </div>
        </div>

        {/* Items preview (first 3) */}
        {items.length > 0 && (
          <div className="mt-4 space-y-1.5 border-t border-white/5 pt-4">
            {items.slice(0, 3).map((item, i) => (
              <div key={i} className="flex justify-between text-sm">
                <span className="text-gray-400 truncate mr-4">
                  {item.description}
                  {item.quantity > 1 && (
                    <span className="text-gray-600 ml-1">×{item.quantity}</span>
                  )}
                </span>
                <span className="text-gray-500 shrink-0">{fmt(item.total)}</span>
              </div>
            ))}
            {items.length > 3 && (
              <p className="text-gray-600 text-xs">
                +{items.length - 3} ítem{items.length - 3 !== 1 ? "s" : ""} más
              </p>
            )}
          </div>
        )}

        {/* Accept / Reject actions for sent quotes */}
        {canRespond && (
          <div className="mt-4 pt-4 border-t border-white/5 flex flex-col sm:flex-row gap-2">
            <p className="text-xs text-gray-500 sm:self-center sm:flex-1">
              El taller está esperando tu respuesta.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => onReject(quote.id)}
                disabled={isBusy}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 hover:border-red-500/40 disabled:opacity-50 transition-colors"
              >
                {isBusy ? <IconSpinnerSm /> : <IconX />}
                Rechazar
              </button>
              <button
                onClick={() => onAccept(quote.id)}
                disabled={isBusy}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-green-500/20 text-green-300 hover:bg-green-500/30 border border-green-500/20 hover:border-green-500/40 disabled:opacity-50 transition-colors"
              >
                {isBusy ? <IconSpinnerSm /> : <IconCheck />}
                Aceptar
              </button>
            </div>
          </div>
        )}

        {/* Accepted / Rejected confirmation banner */}
        {quote.status === "accepted" && (
          <div className="mt-4 pt-4 border-t border-white/5">
            <p className="text-xs text-green-400 flex items-center gap-1.5">
              <IconCheck /> Aceptaste esta cotización. El taller se pondrá en contacto pronto.
            </p>
          </div>
        )}
        {quote.status === "rejected" && (
          <div className="mt-4 pt-4 border-t border-white/5">
            <p className="text-xs text-red-400 flex items-center gap-1.5">
              <IconX /> Rechazaste esta cotización.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────

export default function MisCotizacionesPage() {
  const [loading, setLoading] = useState(true);
  const [authed, setAuthed] = useState(false);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [filterStatus, setFilterStatus] = useState<QuoteStatus | "all">("all");
  const [responding, setResponding] = useState<string | null>(null);
  const [respondError, setRespondError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      return;
    }
    setAuthed(true);

    const { data } = await supabase
      .from("quotes")
      .select(`
        id, status, total, valid_until, created_at, items,
        vehicle:vehicles(brand, model, year, plate)
      `)
      .eq("client_id", user.id)
      .order("created_at", { ascending: false });

    setQuotes((data ?? []) as unknown as Quote[]);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleRespond(id: string, newStatus: "accepted" | "rejected") {
    setResponding(id);
    setRespondError(null);
    const supabase = createClient();
    const { error } = await supabase
      .from("quotes")
      .update({ status: newStatus })
      .eq("id", id);

    if (error) {
      setRespondError("No se pudo actualizar la cotización. Intenta de nuevo.");
    } else {
      setQuotes((prev) =>
        prev.map((q) => (q.id === id ? { ...q, status: newStatus } : q))
      );
    }
    setResponding(null);
  }

  const filtered =
    filterStatus === "all"
      ? quotes
      : quotes.filter((q) => q.status === filterStatus);

  const counts: Record<QuoteStatus | "all", number> = {
    all: quotes.length,
    draft: quotes.filter((q) => q.status === "draft").length,
    sent: quotes.filter((q) => q.status === "sent").length,
    accepted: quotes.filter((q) => q.status === "accepted").length,
    rejected: quotes.filter((q) => q.status === "rejected").length,
  };

  // ── Loading ──────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#1a1a2e" }}>
        <div className="flex items-center gap-3 text-gray-400">
          <IconSpinner />
          <span className="text-sm">Cargando cotizaciones…</span>
        </div>
      </div>
    );
  }

  // ── Not logged in ────────────────────────────────────────────────────────

  if (!authed) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: "#1a1a2e" }}>
        <div className="text-center max-w-sm">
          <div className="w-20 h-20 rounded-2xl bg-[#16213e] border border-white/10 flex items-center justify-center mx-auto mb-6 text-gray-500">
            <IconLock />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Acceso requerido</h1>
          <p className="text-gray-400 text-sm mb-8">
            Iniciá sesión para ver tus cotizaciones.
          </p>
          <div className="flex flex-col gap-3">
            <Link
              href="/login"
              className="block w-full text-center py-3 px-6 rounded-xl font-semibold text-white transition-colors"
              style={{ backgroundColor: "#e94560" }}
            >
              Iniciar sesión
            </Link>
            <Link
              href="/registro"
              className="block w-full text-center py-3 px-6 rounded-xl font-semibold text-gray-300 border border-white/10 hover:border-white/20 hover:text-white transition-colors"
            >
              Crear cuenta
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ── Main view ────────────────────────────────────────────────────────────

  const pendingSent = quotes.filter(
    (q) => q.status === "sent" && !isExpired(q.valid_until)
  ).length;

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#1a1a2e" }}>
      {/* Hero */}
      <div style={{ backgroundColor: "#16213e" }} className="border-b border-white/5 py-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex items-center gap-2 text-sm text-gray-500 mb-4">
            <Link href="/" className="hover:text-white transition-colors">Inicio</Link>
            <span>/</span>
            <span className="text-white">Mis cotizaciones</span>
          </nav>
          <div className="flex items-center gap-3 mb-2">
            <span className="text-[#e94560]"><IconClipboard /></span>
            <h1 className="text-3xl font-bold text-white">Mis Cotizaciones</h1>
            {pendingSent > 0 && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-500/20 text-blue-300 border border-blue-500/30">
                {pendingSent} esperando respuesta
              </span>
            )}
          </div>
          <p className="text-gray-400 text-sm">
            {quotes.length === 0
              ? "Aún no tienes cotizaciones solicitadas."
              : `${quotes.length} cotización${quotes.length !== 1 ? "es" : ""} en total`}
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

        {respondError && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-red-400 text-sm">
            {respondError}
          </div>
        )}

        {/* Filter tabs */}
        {quotes.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {(["all", "sent", "accepted", "draft", "rejected"] as const).map((key) => {
              const label = key === "all" ? "Todas" : STATUS_LABELS[key];
              const count = counts[key];
              if (key !== "all" && count === 0) return null;
              return (
                <button
                  key={key}
                  onClick={() => setFilterStatus(key)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    filterStatus === key
                      ? "bg-[#e94560] text-white"
                      : "bg-[#16213e] border border-white/10 text-gray-400 hover:text-white hover:border-white/20"
                  }`}
                >
                  {label}
                  <span
                    className={`text-xs px-1.5 py-0.5 rounded-full ${
                      filterStatus === key ? "bg-white/20 text-white" : "bg-white/10 text-gray-500"
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* Quote list */}
        {quotes.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 rounded-2xl bg-[#16213e] border border-white/10 flex items-center justify-center mx-auto mb-4 text-gray-600">
              <IconClipboard />
            </div>
            <p className="text-gray-400 text-lg mb-2">Sin cotizaciones</p>
            <p className="text-gray-500 text-sm mb-8">
              Solicitá una cotización y aparecerá aquí.
            </p>
            <Link
              href="/cotizacion"
              className="inline-block py-3 px-6 rounded-xl font-semibold text-white transition-colors"
              style={{ backgroundColor: "#e94560" }}
            >
              Solicitar cotización
            </Link>
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-[#16213e] border border-white/10 rounded-xl py-12 text-center">
            <p className="text-gray-500 text-sm">
              No hay cotizaciones con estado &ldquo;{STATUS_LABELS[filterStatus as QuoteStatus]}&rdquo;.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((quote) => (
              <QuoteCard
                key={quote.id}
                quote={quote}
                responding={responding}
                onAccept={(id) => handleRespond(id, "accepted")}
                onReject={(id) => handleRespond(id, "rejected")}
              />
            ))}
          </div>
        )}

        {/* Footer links */}
        {quotes.length > 0 && (
          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-white/5">
            <Link
              href="/cotizacion"
              className="flex-1 text-center py-3 px-6 rounded-xl font-semibold text-white transition-colors text-sm"
              style={{ backgroundColor: "#e94560" }}
            >
              Solicitar nueva cotización
            </Link>
            <Link
              href="/cuenta"
              className="flex-1 text-center py-3 px-6 rounded-xl font-semibold text-gray-300 border border-white/10 hover:border-white/20 hover:text-white transition-colors text-sm"
            >
              Mi cuenta
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
