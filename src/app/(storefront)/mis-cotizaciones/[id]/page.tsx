import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import QuoteActions from "./QuoteActions";

export const metadata = { title: "Detalle de cotización — TallerPro" };

// ── Types ──────────────────────────────────────────────────────────────────

type QuoteStatus = "draft" | "sent" | "accepted" | "rejected";

interface QuoteItem {
  type?: "labor" | "part";
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
}

// ── Constants ──────────────────────────────────────────────────────────────

const STATUS_LABELS: Record<QuoteStatus, string> = {
  draft:    "Borrador",
  sent:     "Pendiente de respuesta",
  accepted: "Aceptada",
  rejected: "Rechazada",
};

const STATUS_BADGE: Record<QuoteStatus, string> = {
  draft:    "bg-gray-500/20 text-gray-300 border-gray-500/30",
  sent:     "bg-blue-500/20 text-blue-300 border-blue-500/30",
  accepted: "bg-green-500/20 text-green-300 border-green-500/30",
  rejected: "bg-red-500/20 text-red-300 border-red-500/30",
};

// ── Helpers ────────────────────────────────────────────────────────────────

const fmt = (n: number | null) =>
  n != null
    ? `$${n.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    : "—";

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

// ── Icons ──────────────────────────────────────────────────────────────────

function IconCar() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
    </svg>
  );
}

function IconClock() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function IconFileText() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
    </svg>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────

export default async function MisCotizacionesDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/mis-cotizaciones/${id}`);

  const [{ data: quote }, { data: shopConfig }] = await Promise.all([
    supabase
      .from("quotes")
      .select(
        `id, status, total, valid_until, created_at, items,
         vehicle:vehicles(brand, model, year, plate)`
      )
      .eq("id", id)
      .eq("client_id", user.id)
      .maybeSingle(),
    supabase
      .from("shop_config")
      .select("name, phone, address")
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle(),
  ]);

  if (!quote) notFound();

  const status = quote.status as QuoteStatus;
  const vehicle = Array.isArray(quote.vehicle)
    ? (quote.vehicle[0] ?? null)
    : quote.vehicle;

  const items: QuoteItem[] = Array.isArray(quote.items) ? (quote.items as QuoteItem[]) : [];
  const laborItems = items.filter((i) => i.type === "labor");
  const partItems  = items.filter((i) => !i.type || i.type === "part");

  const quoteNumber = quote.id.slice(0, 8).toUpperCase();
  const shopName = shopConfig?.name ?? "TallerPro";

  const isExpired = quote.valid_until
    ? new Date(quote.valid_until + "T23:59:59") < new Date()
    : false;

  return (
    <div className="min-h-screen bg-[#1a1a2e]">
      {/* Header */}
      <div className="bg-[#16213e] border-b border-white/5 py-4">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex items-center gap-2 text-sm text-gray-500">
            <Link href="/" className="hover:text-white transition-colors">Inicio</Link>
            <span>/</span>
            <Link href="/cuenta" className="hover:text-white transition-colors">Mi cuenta</Link>
            <span>/</span>
            <Link href="/mis-cotizaciones" className="hover:text-white transition-colors">Mis cotizaciones</Link>
            <span>/</span>
            <span className="text-white font-mono">COT-{quoteNumber}</span>
          </nav>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

        {/* Title bar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/mis-cotizaciones"
              className="text-gray-500 hover:text-white transition-colors"
              aria-label="Volver a mis cotizaciones"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </Link>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#e94560]/10 border border-[#e94560]/20 flex items-center justify-center text-[#e94560] shrink-0">
                <IconFileText />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-2xl font-bold text-white font-mono">COT-{quoteNumber}</h1>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${STATUS_BADGE[status]}`}
                  >
                    {STATUS_LABELS[status]}
                  </span>
                </div>
                <p className="text-gray-500 text-sm mt-0.5">
                  Emitida el {fmtDate(quote.created_at)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Vehicle info */}
        {vehicle && (
          <div className="bg-[#16213e] border border-white/10 rounded-xl p-5">
            <p className="text-gray-500 text-xs uppercase tracking-wide font-medium mb-3">Vehículo</p>
            <div className="flex items-center gap-3">
              <span className="text-[#e94560]"><IconCar /></span>
              <div>
                <p className="text-white font-semibold">
                  {vehicle.brand} {vehicle.model} {vehicle.year}
                </p>
                {vehicle.plate && (
                  <p className="text-gray-400 text-sm font-mono mt-0.5">{vehicle.plate}</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Line items */}
        <div className="bg-[#16213e] border border-white/10 rounded-xl overflow-hidden">
          {items.length === 0 ? (
            <div className="px-6 py-10 text-center text-gray-600 text-sm">
              Sin ítems registrados en esta cotización.
            </div>
          ) : (
            <div>
              {/* Labor */}
              {laborItems.length > 0 && (
                <div className="p-5">
                  <p className="text-gray-500 text-xs uppercase tracking-wide font-medium mb-3">
                    Mano de obra
                  </p>
                  <div className="space-y-2.5">
                    {laborItems.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-start gap-4 text-sm">
                        <div className="min-w-0">
                          <span className="text-gray-200">{item.description}</span>
                          {item.quantity > 1 && (
                            <span className="text-gray-600 ml-1.5 text-xs">×{item.quantity}</span>
                          )}
                        </div>
                        <span className="text-gray-300 shrink-0 tabular-nums font-medium">
                          {fmt(item.total)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Parts */}
              {partItems.length > 0 && (
                <div className={`p-5 ${laborItems.length > 0 ? "border-t border-white/5" : ""}`}>
                  <p className="text-gray-500 text-xs uppercase tracking-wide font-medium mb-3">
                    {laborItems.length > 0 ? "Repuestos y materiales" : "Servicios y materiales"}
                  </p>
                  <div className="space-y-2.5">
                    {partItems.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-start gap-4 text-sm">
                        <div className="min-w-0">
                          <span className="text-gray-200">{item.description}</span>
                          {item.quantity > 1 && (
                            <span className="text-gray-600 ml-1.5 text-xs">×{item.quantity}</span>
                          )}
                        </div>
                        <span className="text-gray-300 shrink-0 tabular-nums font-medium">
                          {fmt(item.total)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Total */}
              <div className="px-5 py-4 border-t border-white/10 flex justify-between items-center">
                <span className="text-gray-300 font-semibold">Total</span>
                <span className="text-[#e94560] text-2xl font-bold tabular-nums">
                  {fmt(quote.total)}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Validity */}
        {quote.valid_until && (
          <div
            className={`flex items-center gap-2 text-sm px-4 py-3 rounded-xl ${
              isExpired
                ? "bg-red-500/10 border border-red-500/20 text-red-400"
                : "bg-white/5 border border-white/10 text-gray-400"
            }`}
          >
            <span className="shrink-0"><IconClock /></span>
            {isExpired
              ? `Esta cotización venció el ${fmtDate(quote.valid_until)}.`
              : `Válida hasta el ${fmtDate(quote.valid_until)}.`}
          </div>
        )}

        {/* Accept / Reject actions (client component) */}
        <QuoteActions
          quoteId={quote.id}
          initialStatus={status}
          isExpired={isExpired}
        />

        {/* Shop contact */}
        {(shopConfig?.phone || shopConfig?.address) && (
          <div className="bg-[#16213e] border border-white/10 rounded-xl p-5">
            <p className="text-gray-500 text-xs uppercase tracking-wide font-medium mb-3">
              Contacto del taller
            </p>
            <p className="text-white font-semibold text-sm">{shopName}</p>
            {shopConfig.address && (
              <p className="text-gray-400 text-sm mt-1">{shopConfig.address}</p>
            )}
            {shopConfig.phone && (
              <a
                href={`tel:${shopConfig.phone}`}
                className="inline-flex items-center gap-1.5 text-[#e94560] hover:text-white text-sm mt-1 transition-colors"
              >
                {shopConfig.phone}
              </a>
            )}
          </div>
        )}

        {/* Footer nav */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2 border-t border-white/5">
          <Link
            href="/mis-cotizaciones"
            className="flex-1 text-center py-3 px-6 rounded-xl font-semibold text-gray-300 border border-white/10 hover:border-white/20 hover:text-white transition-colors text-sm"
          >
            Volver a mis cotizaciones
          </Link>
          <Link
            href="/cotizacion"
            className="flex-1 text-center py-3 px-6 rounded-xl font-semibold text-white bg-[#e94560] hover:bg-[#c73652] transition-colors text-sm"
          >
            Solicitar nueva cotización
          </Link>
        </div>
      </div>
    </div>
  );
}
