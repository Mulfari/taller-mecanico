import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";

export const metadata = { title: "Mi vehículo — TallerPro" };

// ── Types ──────────────────────────────────────────────────────────────────

type OrderStatus = "received" | "diagnosing" | "repairing" | "ready" | "delivered";

interface WorkOrder {
  id: string;
  status: OrderStatus;
  description: string | null;
  diagnosis: string | null;
  estimated_cost: number | null;
  final_cost: number | null;
  received_at: string | null;
  estimated_delivery: string | null;
  delivered_at: string | null;
  created_at: string;
}

// ── Constants ──────────────────────────────────────────────────────────────

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
    : null;

const fmtDate = (d: string | null) =>
  d
    ? new Date(d.includes("T") ? d : d + "T00:00:00").toLocaleDateString("es-MX", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      })
    : "—";

// ── Icons ──────────────────────────────────────────────────────────────────

function IconCar() {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
    </svg>
  );
}

function IconWrench() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437l1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008z" />
    </svg>
  );
}

function IconCalendar() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  );
}

function IconSignal() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9.348 14.651a3.75 3.75 0 010-5.303m5.304 0a3.75 3.75 0 010 5.303m-7.425 2.122a6.75 6.75 0 010-9.546m9.546 0a6.75 6.75 0 010 9.546M5.106 18.894c-3.808-3.808-3.808-9.98 0-13.789m13.788 0c3.808 3.808 3.808 9.981 0 13.79M12 12h.008v.008H12V12z" />
    </svg>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-gray-500 text-xs mb-0.5">{label}</p>
      <p className="text-gray-200 text-sm">{value}</p>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────

export default async function MisVehiculosDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/mis-vehiculos/${id}`);

  const [{ data: vehicle }, { data: orderRows }] = await Promise.all([
    supabase
      .from("vehicles")
      .select("id, brand, model, year, plate, color, vin, mileage, notes, created_at")
      .eq("id", id)
      .eq("owner_id", user.id)
      .maybeSingle(),
    supabase
      .from("work_orders")
      .select(
        "id, status, description, diagnosis, estimated_cost, final_cost, received_at, estimated_delivery, delivered_at, created_at"
      )
      .eq("vehicle_id", id)
      .eq("client_id", user.id)
      .order("created_at", { ascending: false }),
  ]);

  if (!vehicle) notFound();

  const orders: WorkOrder[] = (orderRows ?? []) as WorkOrder[];
  const activeOrder = orders.find((o) => o.status !== "delivered");
  const deliveredOrders = orders.filter((o) => o.status === "delivered");
  const totalSpent = deliveredOrders.reduce(
    (sum, o) => sum + (o.final_cost ?? o.estimated_cost ?? 0),
    0
  );

  const vehicleLabel = `${vehicle.brand} ${vehicle.model} ${vehicle.year}`;

  return (
    <div className="min-h-screen bg-[#1a1a2e]">
      {/* Header */}
      <div className="bg-[#16213e] border-b border-white/5 py-4">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex items-center gap-2 text-sm text-gray-500">
            <Link href="/" className="hover:text-white transition-colors">Inicio</Link>
            <span>/</span>
            <Link href="/cuenta" className="hover:text-white transition-colors">Mi cuenta</Link>
            <span>/</span>
            <Link href="/mis-vehiculos" className="hover:text-white transition-colors">Mis vehículos</Link>
            <span>/</span>
            <span className="text-white truncate max-w-[160px]">{vehicleLabel}</span>
          </nav>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

        {/* Title bar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/mis-vehiculos"
              className="text-gray-500 hover:text-white transition-colors"
              aria-label="Volver a mis vehículos"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </Link>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#e94560]/10 border border-[#e94560]/20 flex items-center justify-center text-[#e94560] shrink-0">
                <IconCar />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">{vehicleLabel}</h1>
                {vehicle.plate && (
                  <p className="text-gray-500 text-sm font-mono mt-0.5">{vehicle.plate}</p>
                )}
              </div>
            </div>
          </div>

          {/* Quick actions */}
          <div className="flex items-center gap-2 flex-wrap">
            {activeOrder && (
              <Link
                href={`/seguimiento?orden=${activeOrder.id}`}
                className="inline-flex items-center gap-1.5 bg-[#e94560] hover:bg-[#c73652] text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                Seguimiento
              </Link>
            )}
            <Link
              href={`/citas?vehiculo=${vehicle.id}`}
              className="inline-flex items-center gap-1.5 border border-white/10 hover:border-white/20 text-gray-300 hover:text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
            >
              <IconCalendar />
              Agendar cita
            </Link>
            <Link
              href={`/cotizacion?nombre=${encodeURIComponent(vehicleLabel)}`}
              className="inline-flex items-center gap-1.5 border border-white/10 hover:border-white/20 text-gray-300 hover:text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
            >
              <IconWrench />
              Cotización
            </Link>
          </div>
        </div>

        {/* Vehicle info card */}
        <div className="bg-[#16213e] border border-white/10 rounded-xl p-6">
          <p className="text-gray-500 text-xs uppercase tracking-wide font-medium mb-4">
            Datos del vehículo
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <InfoRow label="Marca" value={vehicle.brand} />
            <InfoRow label="Modelo" value={vehicle.model} />
            <InfoRow label="Año" value={String(vehicle.year)} />
            {vehicle.color && <InfoRow label="Color" value={vehicle.color} />}
            {vehicle.plate && <InfoRow label="Patente" value={vehicle.plate} />}
            {vehicle.mileage != null && (
              <InfoRow label="Kilometraje" value={`${vehicle.mileage.toLocaleString("es-MX")} km`} />
            )}
            {vehicle.vin && (
              <div className="col-span-2 sm:col-span-3">
                <p className="text-gray-500 text-xs mb-0.5">VIN</p>
                <p className="text-gray-200 text-sm font-mono">{vehicle.vin}</p>
              </div>
            )}
            {vehicle.notes && (
              <div className="col-span-2 sm:col-span-3">
                <p className="text-gray-500 text-xs mb-0.5">Notas</p>
                <p className="text-gray-300 text-sm leading-relaxed bg-white/[0.03] rounded-lg px-3 py-2 border border-white/5">
                  {vehicle.notes}
                </p>
              </div>
            )}
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-4 mt-5 pt-5 border-t border-white/5">
            <div>
              <p className="text-gray-500 text-xs">Servicios totales</p>
              <p className="text-white font-bold text-xl mt-0.5">{orders.length}</p>
            </div>
            <div>
              <p className="text-gray-500 text-xs">Completados</p>
              <p className="text-white font-bold text-xl mt-0.5">{deliveredOrders.length}</p>
            </div>
            <div>
              <p className="text-gray-500 text-xs">Total invertido</p>
              <p className="text-[#e94560] font-bold text-xl mt-0.5">
                {totalSpent > 0 ? fmt(totalSpent) : "—"}
              </p>
            </div>
          </div>
        </div>

        {/* Active order banner */}
        {activeOrder && (
          <div className="bg-[#e94560]/10 border border-[#e94560]/30 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="w-2.5 h-2.5 rounded-full bg-[#e94560] animate-pulse shrink-0" />
              <div>
                <p className="text-white font-medium text-sm">
                  Orden activa — {STATUS_LABELS[activeOrder.status]}
                </p>
                {activeOrder.description && (
                  <p className="text-gray-400 text-xs mt-0.5 truncate max-w-xs">
                    {activeOrder.description}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Link
                href={`/mis-ordenes/${activeOrder.id}`}
                className="text-gray-300 hover:text-white text-sm border border-white/10 hover:border-white/20 px-3 py-1.5 rounded-lg transition-colors"
              >
                Ver orden
              </Link>
              <Link
                href={`/seguimiento?orden=${activeOrder.id}`}
                className="inline-flex items-center gap-1.5 bg-[#e94560] hover:bg-[#c73652] text-white text-sm font-medium px-3 py-1.5 rounded-lg transition-colors"
              >
                <IconSignal />
                Seguimiento en vivo
              </Link>
            </div>
          </div>
        )}

        {/* Service history */}
        <div className="bg-[#16213e] border border-white/10 rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
            <p className="text-gray-500 text-xs uppercase tracking-wide font-medium">
              Historial de servicios
            </p>
            <span className="text-gray-600 text-xs">{orders.length} registro{orders.length !== 1 ? "s" : ""}</span>
          </div>

          {orders.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-3 text-gray-600">
                <IconWrench />
              </div>
              <p className="text-gray-500 text-sm">Sin servicios registrados para este vehículo.</p>
              <Link
                href={`/citas?vehiculo=${vehicle.id}`}
                className="inline-flex items-center gap-1.5 mt-4 text-[#e94560] hover:text-white text-sm font-medium transition-colors"
              >
                <IconCalendar />
                Agendar primer servicio
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {orders.map((order) => {
                const shortId = `OT-${order.id.slice(0, 6).toUpperCase()}`;
                const cost = order.final_cost ?? order.estimated_cost;
                const costLabel = order.final_cost != null ? "Final" : "Estimado";
                const isActive = order.status !== "delivered";
                return (
                  <Link
                    key={order.id}
                    href={`/mis-ordenes/${order.id}`}
                    className="flex items-center justify-between gap-4 px-6 py-4 hover:bg-white/[0.03] transition-colors group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-2 h-2 rounded-full shrink-0 ${
                          isActive ? "bg-[#e94560] animate-pulse" : "bg-gray-600"
                        }`}
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-gray-200 text-sm font-mono group-hover:text-white transition-colors">
                            {shortId}
                          </span>
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${STATUS_BADGE[order.status]}`}
                          >
                            {STATUS_LABELS[order.status]}
                          </span>
                        </div>
                        {order.description && (
                          <p className="text-gray-500 text-xs mt-0.5 truncate max-w-xs">
                            {order.description}
                          </p>
                        )}
                        <p className="text-gray-600 text-xs mt-0.5">
                          {fmtDate(order.received_at ?? order.created_at)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      {cost != null && cost > 0 ? (
                        <>
                          <p className="text-gray-200 text-sm font-semibold group-hover:text-white transition-colors">
                            {fmt(cost)}
                          </p>
                          <p className="text-gray-600 text-xs">{costLabel}</p>
                        </>
                      ) : (
                        <p className="text-gray-600 text-xs">Sin costo</p>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2 border-t border-white/5">
          <Link
            href="/mis-vehiculos"
            className="flex-1 text-center py-3 px-6 rounded-xl font-semibold text-gray-300 border border-white/10 hover:border-white/20 hover:text-white transition-colors text-sm"
          >
            Volver a mis vehículos
          </Link>
          <Link
            href={`/seguimiento?placa=${vehicle.plate ?? ""}`}
            className="flex-1 text-center py-3 px-6 rounded-xl font-semibold text-white bg-[#e94560] hover:bg-[#c73652] transition-colors text-sm"
          >
            Consultar estado en taller
          </Link>
        </div>
      </div>
    </div>
  );
}
