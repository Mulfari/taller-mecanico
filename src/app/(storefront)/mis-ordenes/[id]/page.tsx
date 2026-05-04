import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import PrintButton from "./PrintButton";
import ClientRating from "@/components/storefront/ClientRating";

export const metadata = { title: "Orden de trabajo — TallerPro" };

// ── Types ──────────────────────────────────────────────────────────────────

type OrderStatus = "received" | "diagnosing" | "repairing" | "ready" | "delivered";

interface OrderItem {
  type?: "labor" | "part";
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
}

// ── Constants ──────────────────────────────────────────────────────────────

const STATUS_STEPS: OrderStatus[] = ["received", "diagnosing", "repairing", "ready", "delivered"];

const STATUS_LABELS: Record<OrderStatus, string> = {
  received: "Recibido",
  diagnosing: "En diagnóstico",
  repairing: "En reparación",
  ready: "Listo para retirar",
  delivered: "Entregado",
};

const STATUS_BADGE: Record<OrderStatus, string> = {
  received: "bg-gray-500/20 text-gray-300 border-gray-500/30",
  diagnosing: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
  repairing: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  ready: "bg-green-500/20 text-green-300 border-green-500/30",
  delivered: "bg-gray-600/20 text-gray-500 border-gray-600/30",
};

// ── Helpers ────────────────────────────────────────────────────────────────

const fmt = (n: number | null) =>
  n != null
    ? `$${n.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    : "—";

const fmtDate = (d: string | null) =>
  d
    ? new Date(d.includes("T") ? d : d + "T00:00:00").toLocaleDateString("es-MX", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      })
    : "—";

// ── Sub-components ─────────────────────────────────────────────────────────

function StatusTimeline({ current }: { current: OrderStatus }) {
  const currentIdx = STATUS_STEPS.indexOf(current);
  return (
    <div className="flex items-start gap-0 overflow-x-auto pb-2">
      {STATUS_STEPS.map((step, idx) => {
        const done = idx < currentIdx;
        const active = idx === currentIdx;
        return (
          <div key={step} className="flex items-center flex-1 last:flex-none min-w-[72px]">
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all shrink-0 ${
                  done
                    ? "bg-green-500/20 border-green-500 text-green-400 print:bg-green-50 print:border-green-600 print:text-green-600"
                    : active
                    ? "bg-primary/20 border-primary text-primary print:bg-gray-100 print:border-gray-800 print:text-gray-800"
                    : "bg-white/5 border-white/10 text-gray-600 print:bg-white print:border-gray-300 print:text-gray-400"
                }`}
              >
                {done ? (
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <span className="text-xs font-bold">{idx + 1}</span>
                )}
              </div>
              <span
                className={`text-xs text-center leading-tight px-1 ${
                  done ? "text-green-400 print:text-green-700" : active ? "text-primary font-medium print:text-gray-900" : "text-gray-600 print:text-gray-400"
                }`}
              >
                {STATUS_LABELS[step]}
              </span>
            </div>
            {idx < STATUS_STEPS.length - 1 && (
              <div
                className={`flex-1 h-0.5 mb-5 mx-1 shrink-0 ${
                  idx < currentIdx ? "bg-green-500/40 print:bg-green-300" : "bg-white/10 print:bg-gray-200"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-gray-500 text-xs mb-0.5 print:text-gray-400">{label}</p>
      <p className="text-gray-200 text-sm print:text-gray-800">{value}</p>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────

export default async function MisOrdenesDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/mis-ordenes/${id}`);

  const [{ data: order }, { data: shopConfig }, { data: ratingData }] = await Promise.all([
    supabase
      .from("work_orders")
      .select(
        `id, status, description, diagnosis,
         estimated_cost, final_cost,
         received_at, estimated_delivery, delivered_at, created_at,
         vehicle:vehicles(brand, model, year, plate, color, vin),
         mechanic:profiles!work_orders_mechanic_id_fkey(full_name),
         work_order_items(id, type, description, quantity, unit_price, total)`
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
    supabase
      .from("work_order_ratings")
      .select("id, rating, comment, created_at")
      .eq("work_order_id", id)
      .eq("client_id", user.id)
      .maybeSingle(),
  ]);

  if (!order) notFound();

  // Normalize joined relations
  const vehicle = Array.isArray(order.vehicle) ? order.vehicle[0] ?? null : order.vehicle;
  const mechanic = Array.isArray(order.mechanic) ? order.mechanic[0] ?? null : order.mechanic;
  const items: OrderItem[] = Array.isArray(order.work_order_items)
    ? (order.work_order_items as OrderItem[])
    : [];

  const laborItems = items.filter((i) => i.type === "labor");
  const partItems = items.filter((i) => !i.type || i.type === "part");

  const shortId = `OT-${order.id.slice(0, 6).toUpperCase()}`;
  const status = order.status as OrderStatus;
  const isActive = status !== "delivered";
  const shopName = shopConfig?.name ?? "TallerPro";

  const costToShow =
    order.final_cost != null && order.final_cost > 0
      ? { label: "Costo final", value: fmt(order.final_cost), highlight: true }
      : order.estimated_cost != null && order.estimated_cost > 0
      ? { label: "Costo estimado", value: fmt(order.estimated_cost), highlight: false }
      : null;

  return (
    <div className="min-h-screen bg-surface print:bg-white">
      {/* Header */}
      <div className="bg-secondary border-b border-white/5 py-4 print:hidden">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex items-center gap-2 text-sm text-gray-500">
            <Link href="/" className="hover:text-white transition-colors">Inicio</Link>
            <span>/</span>
            <Link href="/cuenta" className="hover:text-white transition-colors">Mi cuenta</Link>
            <span>/</span>
            <Link href="/mis-ordenes" className="hover:text-white transition-colors">Mis órdenes</Link>
            <span>/</span>
            <span className="text-white font-mono">{shortId}</span>
          </nav>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

        {/* Title bar — screen only */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 print:hidden">
          <div className="flex items-center gap-3">
            <Link
              href="/mis-ordenes"
              className="text-gray-500 hover:text-white transition-colors"
              aria-label="Volver a mis órdenes"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </Link>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-bold text-white font-mono">{shortId}</h1>
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${STATUS_BADGE[status]}`}
                >
                  {STATUS_LABELS[status]}
                </span>
              </div>
              <p className="text-gray-500 text-sm mt-0.5">
                Ingresó el {fmtDate(order.received_at ?? order.created_at)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <PrintButton />
            {isActive && (
              <Link
                href={`/seguimiento?orden=${order.id}`}
                className="inline-flex items-center gap-2 bg-primary hover:bg-primary-hover text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors"
              >
                <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                Seguimiento en vivo
              </Link>
            )}
          </div>
        </div>

        {/* Print-only header */}
        <div className="hidden print:block print:mb-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-gray-900 font-bold text-xl">{shopName}</p>
              {shopConfig?.address && (
                <p className="text-gray-600 text-sm mt-1">{shopConfig.address}</p>
              )}
              {shopConfig?.phone && (
                <p className="text-gray-600 text-sm">Tel: {shopConfig.phone}</p>
              )}
            </div>
            <div className="text-right">
              <p className="text-gray-900 font-bold text-2xl font-mono">ORDEN DE TRABAJO</p>
              <p className="text-gray-700 font-mono text-sm mt-1">#{shortId}</p>
              <p className="text-gray-500 text-xs mt-2">
                Fecha de ingreso: {fmtDate(order.received_at ?? order.created_at)}
              </p>
              {order.estimated_delivery && status !== "delivered" && (
                <p className="text-gray-500 text-xs mt-0.5">
                  Entrega estimada: {fmtDate(order.estimated_delivery)}
                </p>
              )}
              {order.delivered_at && status === "delivered" && (
                <p className="text-green-700 text-xs mt-0.5">
                  Entregado: {fmtDate(order.delivered_at)}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Status timeline */}
        <div className="bg-secondary border border-white/10 rounded-xl p-5
                        print:bg-white print:border print:border-gray-200 print:rounded-lg">
          <p className="text-gray-500 text-xs uppercase tracking-wide font-medium mb-4 print:text-gray-400">
            Estado del servicio
          </p>
          <StatusTimeline current={status} />
        </div>

        {/* Info grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Vehicle */}
          {vehicle && (
            <div className="bg-secondary border border-white/10 rounded-xl p-5 space-y-3
                            print:bg-white print:border print:border-gray-200 print:rounded-lg">
              <p className="text-gray-500 text-xs uppercase tracking-wide font-medium print:text-gray-400">Vehículo</p>
              <p className="text-white font-semibold print:text-gray-900">
                {vehicle.brand} {vehicle.model} {vehicle.year}
              </p>
              <div className="grid grid-cols-2 gap-3">
                {vehicle.plate && (
                  <InfoRow label="Patente" value={vehicle.plate} />
                )}
                {vehicle.color && (
                  <InfoRow label="Color" value={vehicle.color} />
                )}
                {vehicle.vin && (
                  <div className="col-span-2">
                    <p className="text-gray-500 text-xs mb-0.5 print:text-gray-400">VIN</p>
                    <p className="text-gray-200 text-sm font-mono print:text-gray-800">{vehicle.vin}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Dates & cost */}
          <div className="bg-secondary border border-white/10 rounded-xl p-5 space-y-3
                          print:bg-white print:border print:border-gray-200 print:rounded-lg">
            <p className="text-gray-500 text-xs uppercase tracking-wide font-medium print:text-gray-400">Detalles</p>
            <div className="grid grid-cols-2 gap-3">
              <InfoRow label="Ingreso" value={fmtDate(order.received_at ?? order.created_at)} />
              {order.estimated_delivery && status !== "delivered" && (
                <InfoRow label="Entrega estimada" value={fmtDate(order.estimated_delivery)} />
              )}
              {order.delivered_at && status === "delivered" && (
                <InfoRow label="Entregado" value={fmtDate(order.delivered_at)} />
              )}
              {mechanic?.full_name && (
                <InfoRow label="Mecánico" value={mechanic.full_name} />
              )}
              {costToShow && (
                <div>
                  <p className="text-gray-500 text-xs mb-0.5 print:text-gray-400">{costToShow.label}</p>
                  <p className={`text-sm font-semibold ${costToShow.highlight ? "text-primary" : "text-gray-200"} print:text-gray-900`}>
                    {costToShow.value}
                  </p>
                </div>
              )}
              <InfoRow label="Taller" value={shopName} />
            </div>
          </div>
        </div>

        {/* Description / diagnosis */}
        {(order.description || order.diagnosis) && (
          <div className="bg-secondary border border-white/10 rounded-xl p-5 space-y-4
                          print:bg-white print:border print:border-gray-200 print:rounded-lg">
            {order.description && (
              <div>
                <p className="text-gray-500 text-xs uppercase tracking-wide font-medium mb-2 print:text-gray-400">
                  Descripción del trabajo
                </p>
                <p className="text-gray-300 text-sm leading-relaxed bg-white/[0.03] rounded-lg px-4 py-3 border border-white/5
                              print:text-gray-800 print:bg-gray-50 print:border-gray-200">
                  {order.description}
                </p>
              </div>
            )}
            {order.diagnosis && (
              <div>
                <p className="text-gray-500 text-xs uppercase tracking-wide font-medium mb-2 print:text-gray-400">
                  Diagnóstico
                </p>
                <p className="text-gray-300 text-sm leading-relaxed bg-white/[0.03] rounded-lg px-4 py-3 border border-white/5
                              print:text-gray-800 print:bg-gray-50 print:border-gray-200">
                  {order.diagnosis}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Line items */}
        {items.length > 0 && (
          <div className="bg-secondary border border-white/10 rounded-xl overflow-hidden
                          print:bg-white print:border print:border-gray-200 print:rounded-lg">
            <div className="px-5 py-4 border-b border-white/5 print:border-gray-200">
              <p className="text-gray-500 text-xs uppercase tracking-wide font-medium print:text-gray-400">
                Detalle de trabajos y repuestos
              </p>
            </div>

            <div className="divide-y divide-white/5 print:divide-gray-100">
              {laborItems.length > 0 && (
                <div className="px-5 py-4">
                  <p className="text-gray-500 text-xs font-medium mb-3 print:text-gray-400">Mano de obra</p>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-gray-600 text-xs border-b border-white/5 print:border-gray-200">
                        <th className="text-left pb-2 font-medium print:text-gray-400">Descripción</th>
                        <th className="text-right pb-2 font-medium w-14 print:text-gray-400">Cant.</th>
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

              {partItems.length > 0 && (
                <div className="px-5 py-4">
                  <p className="text-gray-500 text-xs font-medium mb-3 print:text-gray-400">
                    {laborItems.length > 0 ? "Repuestos y materiales" : "Servicios y materiales"}
                  </p>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-gray-600 text-xs border-b border-white/5 print:border-gray-200">
                        <th className="text-left pb-2 font-medium print:text-gray-400">Descripción</th>
                        <th className="text-right pb-2 font-medium w-14 print:text-gray-400">Cant.</th>
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

            {/* Totals */}
            {costToShow && (
              <div className="px-5 py-4 border-t border-white/5 flex justify-end print:border-gray-200">
                <div className="w-full sm:w-64 space-y-2">
                  {order.estimated_cost != null && order.estimated_cost > 0 && order.final_cost != null && order.final_cost > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400 print:text-gray-600">Estimado</span>
                      <span className="text-gray-400 print:text-gray-600">{fmt(order.estimated_cost)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-base font-bold border-t border-white/10 pt-2 print:border-gray-200">
                    <span className="text-white print:text-gray-900">{costToShow.label}</span>
                    <span className="text-primary print:text-gray-900">{costToShow.value}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Client rating — only for delivered orders */}
        {status === "delivered" && (
          <ClientRating
            workOrderId={order.id}
            clientId={user.id}
            existingRating={ratingData ?? null}
          />
        )}

        {/* Footer actions */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2 border-t border-white/5 print:hidden">
          <Link
            href="/mis-ordenes"
            className="flex-1 text-center py-3 px-6 rounded-xl font-semibold text-gray-300 border border-white/10 hover:border-white/20 hover:text-white transition-colors text-sm"
          >
            Volver a mis órdenes
          </Link>
          {isActive && (
            <Link
              href={`/seguimiento?orden=${order.id}`}
              className="flex-1 text-center py-3 px-6 rounded-xl font-semibold text-white transition-colors text-sm"
              style={{ backgroundColor: "var(--color-primary)" }}
            >
              Ver seguimiento en vivo
            </Link>
          )}
        </div>

        {/* Print-only footer */}
        <div className="hidden print:block print:border-t print:border-gray-200 print:pt-4 print:mt-6">
          <p className="text-gray-400 text-xs text-center">
            Documento generado por {shopName}. Gracias por confiar en nosotros.
          </p>
        </div>
      </div>
    </div>
  );
}
