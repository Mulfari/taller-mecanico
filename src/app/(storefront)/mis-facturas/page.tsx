"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

// ── Types ──────────────────────────────────────────────────────────────────

type InvoiceStatus = "draft" | "sent" | "paid";

interface InvoiceItem {
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
}

interface Invoice {
  id: string;
  status: InvoiceStatus;
  subtotal: number | null;
  tax: number | null;
  total: number | null;
  paid_at: string | null;
  created_at: string;
  items: InvoiceItem[];
  work_order: {
    vehicle: {
      brand: string;
      model: string;
      year: number;
      plate: string | null;
    } | null;
  } | null;
}

// ── Constants ──────────────────────────────────────────────────────────────

const STATUS_LABELS: Record<InvoiceStatus, string> = {
  draft: "Borrador",
  sent: "Emitida",
  paid: "Pagada",
};

const STATUS_BADGE: Record<InvoiceStatus, string> = {
  draft: "bg-gray-500/20 text-gray-300",
  sent: "bg-blue-500/20 text-blue-300",
  paid: "bg-green-500/20 text-green-300",
};

const STATUS_DOT: Record<InvoiceStatus, string> = {
  draft: "bg-gray-400",
  sent: "bg-blue-400",
  paid: "bg-green-400",
};

// ── Icons ──────────────────────────────────────────────────────────────────

function IconReceipt() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" />
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

function IconChevronDown() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  );
}

function IconChevronUp() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
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

// ── Helpers ────────────────────────────────────────────────────────────────

const fmt = (n: number) =>
  `$${n.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const fmtDate = (d: string) =>
  new Date(d.includes("T") ? d : d + "T00:00:00").toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

// ── Invoice Card ───────────────────────────────────────────────────────────

function InvoiceCard({ invoice }: { invoice: Invoice }) {
  const [expanded, setExpanded] = useState(false);
  const items: InvoiceItem[] = Array.isArray(invoice.items) ? invoice.items : [];
  const vehicle = invoice.work_order?.vehicle ?? null;

  return (
    <div className="bg-secondary border border-white/10 rounded-xl overflow-hidden hover:border-white/20 transition-colors">
      {/* Header row */}
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full text-left p-5 hover:bg-white/[0.02] transition-colors"
        aria-expanded={expanded}
      >
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-white font-semibold text-sm font-mono">
                FAC-{invoice.id.slice(0, 8).toUpperCase()}
              </span>
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_BADGE[invoice.status]}`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[invoice.status]}`} />
                {STATUS_LABELS[invoice.status]}
              </span>
            </div>

            {vehicle && (
              <div className="flex items-center gap-1.5 mt-2 text-gray-400 text-sm">
                <IconCar />
                <span>
                  {vehicle.brand} {vehicle.model} {vehicle.year}
                  {vehicle.plate ? ` — ${vehicle.plate}` : ""}
                </span>
              </div>
            )}

            <div className="flex items-center gap-4 mt-2 text-xs text-gray-500 flex-wrap">
              <span>Emitida: {fmtDate(invoice.created_at)}</span>
              {invoice.paid_at && (
                <span className="text-green-400">Pagada: {fmtDate(invoice.paid_at)}</span>
              )}
              {items.length > 0 && (
                <span>{items.length} ítem{items.length !== 1 ? "s" : ""}</span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {invoice.total != null && invoice.total > 0 && (
              <span className="text-primary font-bold text-lg">{fmt(invoice.total)}</span>
            )}
            <Link
              href={`/mis-facturas/${invoice.id}`}
              onClick={(e) => e.stopPropagation()}
              className="text-xs text-gray-500 hover:text-primary transition-colors whitespace-nowrap"
              title="Ver e imprimir factura"
            >
              Ver detalle
            </Link>
            <span className="text-gray-500">
              {expanded ? <IconChevronUp /> : <IconChevronDown />}
            </span>
          </div>
        </div>
      </button>

      {/* Expanded detail */}
      {expanded && (
        <div className="border-t border-white/5 px-5 pb-5 pt-4 space-y-4">
          {items.length > 0 ? (
            <>
              <div className="space-y-2">
                {items.map((item, i) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span className="text-gray-300 truncate mr-4">
                      {item.description}
                      {item.quantity > 1 && (
                        <span className="text-gray-500 ml-1">×{item.quantity}</span>
                      )}
                    </span>
                    <span className="text-gray-400 shrink-0">{fmt(item.total)}</span>
                  </div>
                ))}
              </div>

              <div className="border-t border-white/10 pt-3 space-y-1.5">
                {invoice.subtotal != null && (
                  <div className="flex justify-between text-sm text-gray-400">
                    <span>Subtotal</span>
                    <span>{fmt(invoice.subtotal)}</span>
                  </div>
                )}
                {invoice.tax != null && invoice.tax > 0 && (
                  <div className="flex justify-between text-sm text-gray-400">
                    <span>IVA</span>
                    <span>{fmt(invoice.tax)}</span>
                  </div>
                )}
                {invoice.total != null && (
                  <div className="flex justify-between text-sm font-semibold text-white">
                    <span>Total</span>
                    <span className="text-primary">{fmt(invoice.total)}</span>
                  </div>
                )}
              </div>
            </>
          ) : (
            <p className="text-gray-600 text-sm italic">Sin ítems registrados en esta factura.</p>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────

export default function MisFacturasPage() {
  const [loading, setLoading] = useState(true);
  const [authed, setAuthed] = useState(false);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [filterStatus, setFilterStatus] = useState<InvoiceStatus | "all">("all");

  const load = useCallback(async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      return;
    }
    setAuthed(true);

    const { data } = await supabase
      .from("invoices")
      .select(`
        id, status, subtotal, tax, total, paid_at, created_at, items,
        work_order:work_orders(
          vehicle:vehicles(brand, model, year, plate)
        )
      `)
      .eq("client_id", user.id)
      .order("created_at", { ascending: false });

    setInvoices((data ?? []) as unknown as Invoice[]);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered =
    filterStatus === "all"
      ? invoices
      : invoices.filter((inv) => inv.status === filterStatus);

  const counts: Record<InvoiceStatus | "all", number> = {
    all: invoices.length,
    draft: invoices.filter((inv) => inv.status === "draft").length,
    sent: invoices.filter((inv) => inv.status === "sent").length,
    paid: invoices.filter((inv) => inv.status === "paid").length,
  };

  // ── Loading ──────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "var(--color-surface)" }}>
        <div className="flex items-center gap-3 text-gray-400">
          <IconSpinner />
          <span className="text-sm">Cargando facturas…</span>
        </div>
      </div>
    );
  }

  // ── Not logged in ────────────────────────────────────────────────────────

  if (!authed) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: "var(--color-surface)" }}>
        <div className="text-center max-w-sm">
          <div className="w-20 h-20 rounded-2xl bg-secondary border border-white/10 flex items-center justify-center mx-auto mb-6 text-gray-500">
            <IconLock />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Acceso requerido</h1>
          <p className="text-gray-400 text-sm mb-8">
            Iniciá sesión para ver tus facturas.
          </p>
          <div className="flex flex-col gap-3">
            <Link
              href="/login"
              className="block w-full text-center py-3 px-6 rounded-xl font-semibold text-white transition-colors"
              style={{ backgroundColor: "var(--color-primary)" }}
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

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--color-surface)" }}>
      {/* Hero */}
      <div style={{ backgroundColor: "var(--color-secondary)" }} className="border-b border-white/5 py-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex items-center gap-2 text-sm text-gray-500 mb-4">
            <Link href="/" className="hover:text-white transition-colors">Inicio</Link>
            <span>/</span>
            <span className="text-white">Mis facturas</span>
          </nav>
          <div className="flex items-center gap-3 mb-2">
            <span className="text-primary"><IconReceipt /></span>
            <h1 className="text-3xl font-bold text-white">Mis Facturas</h1>
          </div>
          <p className="text-gray-400 text-sm">
            {invoices.length === 0
              ? "Aún no tienes facturas emitidas."
              : `${invoices.length} factura${invoices.length !== 1 ? "s" : ""} en total`}
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

        {/* Filter tabs */}
        {invoices.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {(["all", "sent", "paid", "draft"] as const).map((key) => {
              const label = key === "all" ? "Todas" : STATUS_LABELS[key];
              const count = counts[key];
              if (key !== "all" && count === 0) return null;
              return (
                <button
                  key={key}
                  onClick={() => setFilterStatus(key)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    filterStatus === key
                      ? "bg-primary text-white"
                      : "bg-secondary border border-white/10 text-gray-400 hover:text-white hover:border-white/20"
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

        {/* Invoice list */}
        {invoices.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 rounded-2xl bg-secondary border border-white/10 flex items-center justify-center mx-auto mb-4 text-gray-600">
              <IconReceipt />
            </div>
            <p className="text-gray-400 text-lg mb-2">Sin facturas</p>
            <p className="text-gray-500 text-sm mb-8">
              Cuando el taller emita una factura por tus servicios, aparecerá aquí.
            </p>
            <Link
              href="/citas"
              className="inline-block py-3 px-6 rounded-xl font-semibold text-white transition-colors"
              style={{ backgroundColor: "var(--color-primary)" }}
            >
              Agendar un servicio
            </Link>
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-secondary border border-white/10 rounded-xl py-12 text-center">
            <p className="text-gray-500 text-sm">
              No hay facturas con estado &ldquo;{STATUS_LABELS[filterStatus as InvoiceStatus]}&rdquo;.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((invoice) => (
              <InvoiceCard key={invoice.id} invoice={invoice} />
            ))}
          </div>
        )}

        {/* Footer links */}
        {invoices.length > 0 && (
          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-white/5">
            <Link
              href="/historial"
              className="flex-1 text-center py-3 px-6 rounded-xl font-semibold text-gray-300 border border-white/10 hover:border-white/20 hover:text-white transition-colors text-sm"
            >
              Historial de servicios
            </Link>
            <Link
              href="/cuenta"
              className="flex-1 text-center py-3 px-6 rounded-xl font-semibold text-white transition-colors text-sm"
              style={{ backgroundColor: "var(--color-primary)" }}
            >
              Mi cuenta
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
