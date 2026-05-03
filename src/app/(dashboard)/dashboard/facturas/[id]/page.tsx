import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import PrintButton from "./PrintButton";
import StatusActions from "./StatusActions";
import WhatsAppInvoiceButton from "./WhatsAppInvoiceButton";

export const metadata = { title: "Factura — TallerPro" };

// ── Types ──────────────────────────────────────────────────────────────────

interface InvoiceItem {
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
  new Date(d).toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

const STATUS_LABELS: Record<string, string> = {
  draft: "Borrador",
  sent: "Enviada",
  paid: "Pagada",
};

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-gray-500/20 text-gray-300 border-gray-500/30",
  sent: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  paid: "bg-green-500/20 text-green-300 border-green-500/30",
};

// ── Page ───────────────────────────────────────────────────────────────────

export default async function FacturaDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: invoice }, { data: shopConfig }] = await Promise.all([
    supabase
      .from("invoices")
      .select(
        `id, subtotal, tax, total, status, paid_at, created_at,
         work_order_id, quote_id, items,
         client:profiles!invoices_client_id_fkey(full_name, email, phone),
         work_order:work_orders!invoices_work_order_id_fkey(
           id, description, status, received_at, delivered_at,
           vehicle:vehicles(brand, model, year, plate, vin)
         )`
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

  if (!invoice) notFound();

  // Normalize joined relations (Supabase may return arrays)
  const client = Array.isArray(invoice.client)
    ? (invoice.client[0] ?? null)
    : invoice.client;
  const workOrder = Array.isArray(invoice.work_order)
    ? (invoice.work_order[0] ?? null)
    : invoice.work_order;
  const vehicle = workOrder
    ? Array.isArray(workOrder.vehicle)
      ? (workOrder.vehicle[0] ?? null)
      : workOrder.vehicle
    : null;

  // Parse items JSONB
  const items: InvoiceItem[] = Array.isArray(invoice.items)
    ? (invoice.items as InvoiceItem[])
    : [];

  const laborItems = items.filter((i) => i.type === "labor");
  const partItems = items.filter((i) => !i.type || i.type === "part");

  const invoiceNumber = invoice.id.slice(0, 8).toUpperCase();
  const shopName = shopConfig?.name ?? "TallerPro";

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Screen-only header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 print:hidden">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/facturas"
            className="text-gray-500 hover:text-white transition-colors"
            aria-label="Volver a facturas"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-white font-mono">
                FAC-{invoiceNumber}
              </h1>
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                  STATUS_COLORS[invoice.status] ?? "bg-gray-500/20 text-gray-300 border-gray-500/30"
                }`}
              >
                {STATUS_LABELS[invoice.status] ?? invoice.status}
              </span>
            </div>
            <p className="text-gray-500 text-sm mt-0.5">
              Emitida el {fmtDate(invoice.created_at)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <StatusActions invoiceId={invoice.id} currentStatus={invoice.status as import("@/types/database").InvoiceStatus} />
          <WhatsAppInvoiceButton
            clientName={client?.full_name ?? null}
            clientPhone={client?.phone ?? null}
            invoiceNumber={invoiceNumber}
            total={invoice.total}
            status={invoice.status}
            shopName={shopName}
          />
          <PrintButton />
        </div>
      </div>

      {/* ── Printable invoice document ─────────────────────────────────── */}
      <div
        className="bg-[#16213e] border border-white/10 rounded-2xl overflow-hidden
                   print:bg-white print:border-0 print:rounded-none print:shadow-none"
      >
        {/* Invoice header */}
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

            {/* Invoice meta */}
            <div className="text-right">
              <p className="text-[#e94560] font-bold text-2xl font-mono print:text-gray-900">
                FACTURA
              </p>
              <p className="text-gray-300 font-mono text-sm mt-1 print:text-gray-700">
                #{invoiceNumber}
              </p>
              <p className="text-gray-500 text-xs mt-2 print:text-gray-500">
                Fecha: {fmtDate(invoice.created_at)}
              </p>
              {invoice.paid_at && (
                <p className="text-green-400 text-xs mt-0.5 print:text-green-700">
                  Pagada: {fmtDate(invoice.paid_at)}
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
              Facturar a
            </p>
            {client?.full_name ? (
              <Link
                href={`/dashboard/clientes/${(client as { id?: string }).id ?? ""}`}
                className="text-white font-semibold hover:text-[#e94560] transition-colors print:text-gray-900 print:no-underline"
              >
                {client.full_name}
              </Link>
            ) : (
              <p className="text-white font-semibold print:text-gray-900">—</p>
            )}
            {client?.email && (
              <p className="text-gray-400 text-sm mt-0.5 print:text-gray-600">
                {client.email}
              </p>
            )}
            {client?.phone && (
              <p className="text-gray-400 text-sm print:text-gray-600">
                {client.phone}
              </p>
            )}
          </div>

          {/* Vehicle / work order */}
          {(vehicle || workOrder) && (
            <div>
              <p className="text-gray-500 text-xs uppercase tracking-wide font-medium mb-2 print:text-gray-400">
                Vehículo / Orden
              </p>
              {vehicle && (
                <p className="text-white font-semibold print:text-gray-900">
                  {vehicle.brand} {vehicle.model} {vehicle.year}
                </p>
              )}
              {vehicle?.plate && (
                <p className="text-gray-400 text-sm font-mono mt-0.5 print:text-gray-600">
                  Placa: {vehicle.plate}
                </p>
              )}
              {vehicle?.vin && (
                <p className="text-gray-500 text-xs font-mono print:text-gray-500">
                  VIN: {vehicle.vin}
                </p>
              )}
              {workOrder && (
                <p className="text-gray-500 text-xs mt-1 print:text-gray-500">
                  OT #{workOrder.id.slice(0, 8).toUpperCase()}
                  {workOrder.description ? ` — ${workOrder.description}` : ""}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Line items */}
        <div className="px-8 py-6 print:px-0 print:py-5">
          {items.length === 0 ? (
            <p className="text-gray-600 text-sm text-center py-6 print:text-gray-400">
              Sin ítems registrados en esta factura.
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

        {/* Totals */}
        <div
          className="px-8 py-6 border-t border-white/5 print:border-t print:border-gray-200 print:px-0"
        >
          <div className="flex justify-end">
            <div className="w-full sm:w-72 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400 print:text-gray-600">Subtotal</span>
                <span className="text-gray-200 print:text-gray-800">{fmt(invoice.subtotal)}</span>
              </div>
              {invoice.tax != null && invoice.tax > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400 print:text-gray-600">IVA (16%)</span>
                  <span className="text-gray-200 print:text-gray-800">{fmt(invoice.tax)}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-bold border-t border-white/10 pt-2 print:border-gray-200">
                <span className="text-white print:text-gray-900">Total</span>
                <span className="text-[#e94560] print:text-gray-900">{fmt(invoice.total)}</span>
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
            {invoice.status === "paid"
              ? "Esta factura ha sido pagada. Gracias por su preferencia."
              : "Por favor realice el pago a la brevedad. Gracias por confiar en nosotros."}
          </p>
        </div>
      </div>
    </div>
  );
}
