import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import PrintButton from "./PrintButton";
import ConvertirOrdenButton from "./ConvertirOrdenButton";
import QuoteStatusButtons from "./QuoteStatusButtons";
import EditQuoteItemsButton from "./EditQuoteItemsButton";

export const metadata = { title: "Cotización — TallerPro" };

// ── Types ──────────────────────────────────────────────────────────────────

interface QuoteItem {
  type: "labor" | "part";
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
}

// ── Helpers ────────────────────────────────────────────────────────────────

const fmt = (n: number | null) =>
  n != null
    ? `$${n.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    : "—";

const fmtDate = (d: string) =>
  new Date(d.includes("T") ? d : d + "T00:00:00").toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

const STATUS_LABELS: Record<string, string> = {
  draft:    "Borrador",
  sent:     "Enviada",
  accepted: "Aceptada",
  rejected: "Rechazada",
};

const STATUS_COLORS: Record<string, string> = {
  draft:    "bg-gray-500/20 text-gray-300 border-gray-500/30",
  sent:     "bg-blue-500/20 text-blue-300 border-blue-500/30",
  accepted: "bg-green-500/20 text-green-300 border-green-500/30",
  rejected: "bg-red-500/20 text-red-300 border-red-500/30",
};

// ── Page ───────────────────────────────────────────────────────────────────

export default async function CotizacionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: quote }, { data: shopConfig }] = await Promise.all([
    supabase
      .from("quotes")
      .select(
        `id, client_id, vehicle_id, items, total, status, valid_until, created_at, notes,
         client:profiles!quotes_client_id_fkey(full_name, email, phone),
         vehicle:vehicles!quotes_vehicle_id_fkey(brand, model, year, plate)`
      )
      .eq("id", id)
      .maybeSingle(),
    supabase
      .from("shop_config")
      .select("name, phone, address, logo_url")
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle(),
  ]);

  if (!quote) notFound();

  // Normalize joined relations (Supabase may return arrays)
  const client = Array.isArray(quote.client)
    ? (quote.client[0] ?? null)
    : quote.client;
  const vehicle = Array.isArray(quote.vehicle)
    ? (quote.vehicle[0] ?? null)
    : quote.vehicle;

  const items: QuoteItem[] = Array.isArray(quote.items)
    ? (quote.items as QuoteItem[])
    : [];

  const laborItems = items.filter((i) => i.type === "labor");
  const partItems  = items.filter((i) => i.type === "part");

  const quoteNumber = quote.id.slice(0, 8).toUpperCase();
  const shopName    = shopConfig?.name ?? "TallerPro";

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Screen-only header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 print:hidden">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/cotizaciones"
            className="text-gray-500 hover:text-white transition-colors"
            aria-label="Volver a cotizaciones"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-white font-mono">
                COT-{quoteNumber}
              </h1>
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                  STATUS_COLORS[quote.status] ?? "bg-gray-500/20 text-gray-300 border-gray-500/30"
                }`}
              >
                {STATUS_LABELS[quote.status] ?? quote.status}
              </span>
            </div>
            <p className="text-gray-500 text-sm mt-0.5">
              Creada el {fmtDate(quote.created_at)}
            </p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 print:hidden">
          <QuoteStatusButtons
            quoteId={quote.id}
            currentStatus={quote.status as import("@/types/database").QuoteStatus}
          />
          <div className="flex items-center gap-2 flex-wrap">
            <EditQuoteItemsButton
              quoteId={quote.id}
              items={items}
              disabled={quote.status === "accepted" || quote.status === "rejected"}
            />
            {quote.status === "accepted" && (
              <ConvertirOrdenButton quoteId={quote.id} />
            )}
            <PrintButton />
          </div>
        </div>
      </div>

      {/* ── Printable quote document ───────────────────────────────────── */}
      <div
        className="bg-[#16213e] border border-white/10 rounded-2xl overflow-hidden
                   print:bg-white print:border-0 print:rounded-none print:shadow-none"
      >
        {/* Quote header */}
        <div
          className="px-8 py-7 border-b border-white/5
                     print:border-b print:border-gray-200 print:px-0 print:py-6"
        >
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6">
            {/* Shop info */}
            <div>
              <p className="text-white font-bold text-xl print:text-gray-900 print:text-2xl">
                {shopName}
              </p>
              {shopConfig?.address && (
                <p className="text-gray-400 text-sm mt-1 print:text-gray-600">
                  {shopConfig.address}
                </p>
              )}
              {shopConfig?.phone && (
                <p className="text-gray-400 text-sm print:text-gray-600">
                  Tel: {shopConfig.phone}
                </p>
              )}
            </div>

            {/* Quote meta */}
            <div className="text-right">
              <p className="text-[#e94560] font-bold text-2xl font-mono print:text-gray-900">
                COTIZACIÓN
              </p>
              <p className="text-gray-300 font-mono text-sm mt-1 print:text-gray-700">
                #{quoteNumber}
              </p>
              <p className="text-gray-500 text-xs mt-2 print:text-gray-500">
                Fecha: {fmtDate(quote.created_at)}
              </p>
              {quote.valid_until && (
                <p className="text-gray-500 text-xs mt-0.5 print:text-gray-500">
                  Válida hasta: {fmtDate(quote.valid_until)}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Client + vehicle info */}
        <div
          className="px-8 py-6 grid grid-cols-1 sm:grid-cols-2 gap-6 border-b border-white/5
                     print:border-b print:border-gray-200 print:px-0 print:py-5"
        >
          {/* Bill to */}
          <div>
            <p className="text-gray-500 text-xs uppercase tracking-wide font-medium mb-2 print:text-gray-400">
              Cliente
            </p>
            <p className="text-white font-semibold print:text-gray-900">
              {(client as { full_name?: string | null } | null)?.full_name ?? "—"}
            </p>
            {(client as { email?: string } | null)?.email && (
              <p className="text-gray-400 text-sm mt-0.5 print:text-gray-600">
                {(client as { email: string }).email}
              </p>
            )}
            {(client as { phone?: string | null } | null)?.phone && (
              <p className="text-gray-400 text-sm print:text-gray-600">
                {(client as { phone: string }).phone}
              </p>
            )}
          </div>

          {/* Vehicle */}
          {vehicle && (
            <div>
              <p className="text-gray-500 text-xs uppercase tracking-wide font-medium mb-2 print:text-gray-400">
                Vehículo
              </p>
              <p className="text-white font-semibold print:text-gray-900">
                {(vehicle as { brand: string; model: string; year: number }).brand}{" "}
                {(vehicle as { brand: string; model: string; year: number }).model}{" "}
                {(vehicle as { brand: string; model: string; year: number }).year}
              </p>
              {(vehicle as { plate?: string | null }).plate && (
                <p className="text-gray-400 text-sm font-mono mt-0.5 print:text-gray-600">
                  Placa: {(vehicle as { plate: string }).plate}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Notes (guest contact info or internal notes) */}
        {(quote as { notes?: string | null }).notes && (
          <div
            className="px-8 py-6 border-b border-white/5
                       print:border-b print:border-gray-200 print:px-0 print:py-5"
          >
            <p className="text-gray-500 text-xs uppercase tracking-wide font-medium mb-3 print:text-gray-400">
              Notas / Contacto
            </p>
            <pre className="text-gray-300 text-sm whitespace-pre-wrap font-sans leading-relaxed print:text-gray-700">
              {(quote as { notes: string }).notes}
            </pre>
          </div>
        )}

        {/* Line items */}
        <div className="px-8 py-6 print:px-0 print:py-5">
          {items.length === 0 ? (
            <p className="text-gray-600 text-sm text-center py-6 print:text-gray-400">
              Sin ítems registrados en esta cotización.
            </p>
          ) : (
            <div className="space-y-6">
              {/* Labor */}
              {laborItems.length > 0 && (
                <div>
                  <p className="text-gray-500 text-xs uppercase tracking-wide font-medium mb-3 print:text-gray-400">
                    Mano de obra
                  </p>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-gray-500 text-xs border-b border-white/5 print:border-gray-200">
                        <th className="text-left pb-2 font-medium print:text-gray-400">Descripción</th>
                        <th className="text-right pb-2 font-medium w-16 print:text-gray-400">Cant.</th>
                        <th className="text-right pb-2 font-medium w-28 print:text-gray-400">P. Unit.</th>
                        <th className="text-right pb-2 font-medium w-28 print:text-gray-400">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 print:divide-gray-100">
                      {laborItems.map((item, i) => (
                        <tr key={i}>
                          <td className="py-2.5 text-gray-200 print:text-gray-800">{item.description}</td>
                          <td className="py-2.5 text-right text-gray-400 print:text-gray-600">{item.quantity}</td>
                          <td className="py-2.5 text-right text-gray-400 print:text-gray-600">{fmt(item.unit_price)}</td>
                          <td className="py-2.5 text-right text-gray-200 font-medium print:text-gray-800">{fmt(item.total)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Parts */}
              {partItems.length > 0 && (
                <div>
                  <p className="text-gray-500 text-xs uppercase tracking-wide font-medium mb-3 print:text-gray-400">
                    Repuestos y materiales
                  </p>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-gray-500 text-xs border-b border-white/5 print:border-gray-200">
                        <th className="text-left pb-2 font-medium print:text-gray-400">Descripción</th>
                        <th className="text-right pb-2 font-medium w-16 print:text-gray-400">Cant.</th>
                        <th className="text-right pb-2 font-medium w-28 print:text-gray-400">P. Unit.</th>
                        <th className="text-right pb-2 font-medium w-28 print:text-gray-400">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 print:divide-gray-100">
                      {partItems.map((item, i) => (
                        <tr key={i}>
                          <td className="py-2.5 text-gray-200 print:text-gray-800">{item.description}</td>
                          <td className="py-2.5 text-right text-gray-400 print:text-gray-600">{item.quantity}</td>
                          <td className="py-2.5 text-right text-gray-400 print:text-gray-600">{fmt(item.unit_price)}</td>
                          <td className="py-2.5 text-right text-gray-200 font-medium print:text-gray-800">{fmt(item.total)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Total */}
        <div
          className="px-8 py-6 border-t border-white/5 print:border-t print:border-gray-200 print:px-0"
        >
          <div className="flex justify-end">
            <div className="w-full sm:w-72 space-y-2">
              <div className="flex justify-between text-base font-bold border-t border-white/10 pt-2 print:border-gray-200">
                <span className="text-white print:text-gray-900">Total</span>
                <span className="text-[#e94560] print:text-gray-900">{fmt(Number(quote.total))}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer note */}
        <div
          className="px-8 py-5 border-t border-white/5 bg-white/[0.02]
                     print:border-t print:border-gray-200 print:bg-transparent print:px-0 print:py-4"
        >
          <p className="text-gray-600 text-xs text-center print:text-gray-400">
            {quote.status === "accepted"
              ? "Cotización aceptada. Gracias por su confianza."
              : quote.valid_until
              ? `Esta cotización es válida hasta el ${fmtDate(quote.valid_until)}.`
              : "Esta cotización está sujeta a disponibilidad de repuestos y mano de obra."}
          </p>
        </div>
      </div>
    </div>
  );
}
