import type { Metadata } from "next";
import type { WorkOrderListItem } from "@/types/database";
import Link from "next/link";
import {
  getDashboardMetrics,
  getRecentOrders,
  getUpcomingAppointments,
  getLowStockItems,
  getReadyOrders,
  getPendingQuotes,
  type PendingQuote,
} from "@/lib/supabase/queries/work-orders";

export const metadata: Metadata = { title: "Panel Principal — TallerPro" };

type WorkOrderStatus = "received" | "diagnosing" | "repairing" | "ready" | "delivered";
type AppointmentStatus = "pending" | "confirmed" | "completed" | "cancelled";

const ORDER_STATUS_LABELS: Record<WorkOrderStatus, string> = {
  received: "Recibido",
  diagnosing: "Diagnóstico",
  repairing: "En reparación",
  ready: "Listo",
  delivered: "Entregado",
};

const ORDER_STATUS_COLORS: Record<WorkOrderStatus, string> = {
  received: "bg-gray-500/20 text-gray-300",
  diagnosing: "bg-yellow-500/20 text-yellow-300",
  repairing: "bg-blue-500/20 text-blue-300",
  ready: "bg-green-500/20 text-green-300",
  delivered: "bg-gray-600/20 text-gray-500",
};

const APPT_STATUS_LABELS: Record<AppointmentStatus, string> = {
  pending: "Pendiente",
  confirmed: "Confirmada",
  completed: "Completada",
  cancelled: "Cancelada",
};

const APPT_STATUS_COLORS: Record<AppointmentStatus, string> = {
  pending: "bg-yellow-500/20 text-yellow-300",
  confirmed: "bg-blue-500/20 text-blue-300",
  completed: "bg-green-500/20 text-green-300",
  cancelled: "bg-red-500/20 text-red-400",
};

function StatusBadge({ label, color }: { label: string; color: string }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${color}`}>
      {label}
    </span>
  );
}

function IconWrench() {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
        d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437l1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008z" />
    </svg>
  );
}

function IconCalendar() {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
        d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
    </svg>
  );
}

function IconCar() {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
        d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
    </svg>
  );
}

function IconAlert() {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
        d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
    </svg>
  );
}

function IconCurrencyDollar() {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
        d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

interface MetricCardProps {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  accentClass: string;
  bgClass: string;
  note?: string;
  href?: string;
}

function MetricCard({ label, value, icon, accentClass, bgClass, note, href }: MetricCardProps) {
  const inner = (
    <>
      <div className={`shrink-0 w-12 h-12 rounded-lg flex items-center justify-center ${bgClass} ${accentClass}`}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-gray-400 text-sm leading-none mb-1">{label}</p>
        <p className={`text-3xl font-bold leading-none ${accentClass}`}>{value}</p>
        {note && <p className="text-gray-500 text-xs mt-1.5">{note}</p>}
      </div>
    </>
  );

  if (href) {
    return (
      <Link href={href} className="bg-[#16213e] border border-white/10 rounded-xl p-5 flex items-start gap-4 hover:border-white/20 transition-colors group">
        {inner}
      </Link>
    );
  }

  return (
    <div className="bg-[#16213e] border border-white/10 rounded-xl p-5 flex items-start gap-4">
      {inner}
    </div>
  );
}

function SectionHeader({ title, href, linkLabel }: { title: string; href: string; linkLabel: string }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-white font-semibold text-base">{title}</h2>
      <a href={href} className="text-[#e94560] text-sm hover:underline">{linkLabel}</a>
    </div>
  );
}

export default async function DashboardPage() {
  const today = new Date().toLocaleDateString("es-MX", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });

  const [metrics, recentOrders, upcomingAppointments, lowStockItems, readyOrders, pendingQuotes] = await Promise.all([
    getDashboardMetrics(),
    getRecentOrders(5),
    getUpcomingAppointments(5),
    getLowStockItems(8),
    getReadyOrders(5),
    getPendingQuotes(6),
  ]);

  const fmtRevenue = (n: number) => {
    if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}k`;
    return `$${n.toLocaleString("es-MX")}`;
  };

  const metricCards = [
    {
      label: "Ingresos del Mes",
      value: fmtRevenue(metrics.monthlyRevenue),
      icon: <IconCurrencyDollar />,
      accentClass: "text-green-400",
      bgClass: "bg-green-500/10",
      note: "órdenes entregadas este mes",
      href: "/dashboard/reportes",
    },
    {
      label: "Órdenes Activas",
      value: metrics.activeOrders,
      icon: <IconWrench />,
      accentClass: "text-[#e94560]",
      bgClass: "bg-[#e94560]/10",
      note: "en proceso hoy",
      href: "/dashboard/ordenes",
    },
    {
      label: "Citas Pendientes",
      value: metrics.pendingAppointments,
      icon: <IconCalendar />,
      accentClass: "text-blue-400",
      bgClass: "bg-blue-500/10",
      note: "para hoy y mañana",
      href: "/dashboard/citas",
    },
    {
      label: "Vehículos en Venta",
      value: metrics.vehiclesForSale,
      icon: <IconCar />,
      accentClass: "text-yellow-400",
      bgClass: "bg-yellow-500/10",
      note: "disponibles",
      href: "/dashboard/vehiculos-venta",
    },
    {
      label: "Stock Bajo",
      value: metrics.lowStockItems,
      icon: <IconAlert />,
      accentClass: "text-orange-400",
      bgClass: "bg-orange-500/10",
      note: "artículos bajo mínimo",
      href: "/dashboard/inventario",
    },
  ] satisfies MetricCardProps[];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Panel Principal</h1>
        <p className="text-gray-500 text-sm mt-1 capitalize">{today}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
        {metricCards.map((m) => (
          <MetricCard key={m.label} {...m} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

        {/* Recent orders */}
        <div className="lg:col-span-3 bg-[#16213e] border border-white/10 rounded-xl p-5">
          <SectionHeader title="Órdenes Recientes" href="/dashboard/ordenes" linkLabel="Ver todas →" />
          {recentOrders.length === 0 ? (
            <p className="text-gray-500 text-sm py-8 text-center">No hay órdenes registradas.</p>
          ) : (
            <div className="overflow-x-auto -mx-1">
              <table className="w-full text-sm min-w-[520px]">
                <thead>
                  <tr className="text-gray-500 text-xs uppercase tracking-wide border-b border-white/5">
                    <th className="text-left pb-3 px-1 font-medium">OT / Cliente</th>
                    <th className="text-left pb-3 px-1 font-medium">Vehículo</th>
                    <th className="text-left pb-3 px-1 font-medium">Estado</th>
                    <th className="text-right pb-3 px-1 font-medium">Costo Est.</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {recentOrders.map((order: WorkOrderListItem) => (
                    <tr key={order.id} className="hover:bg-white/[0.03] transition-colors group">
                      <td className="py-3 px-1">
                        <Link href={`/dashboard/ordenes/${order.id}`} className="block">
                          <p className="text-[#e94560] font-mono text-xs group-hover:underline">
                            OT-{order.id.slice(0, 6).toUpperCase()}
                          </p>
                          <p className="text-white font-medium mt-0.5">
                            {order.client.full_name ?? "—"}
                          </p>
                        </Link>
                      </td>
                      <td className="py-3 px-1">
                        <Link href={`/dashboard/ordenes/${order.id}`} className="block">
                          <p className="text-gray-300">
                            {order.vehicle.brand} {order.vehicle.model} {order.vehicle.year}
                          </p>
                          <p className="text-gray-500 text-xs mt-0.5">
                            {order.vehicle.plate ?? "—"}
                          </p>
                        </Link>
                      </td>
                      <td className="py-3 px-1">
                        <Link href={`/dashboard/ordenes/${order.id}`} className="block">
                          <StatusBadge
                            label={ORDER_STATUS_LABELS[order.status]}
                            color={ORDER_STATUS_COLORS[order.status]}
                          />
                        </Link>
                      </td>
                      <td className="py-3 px-1 text-right">
                        <Link href={`/dashboard/ordenes/${order.id}`} className="block">
                          {order.estimated_cost && order.estimated_cost > 0 ? (
                            <span className="text-gray-300 font-medium">
                              ${order.estimated_cost.toLocaleString("es-MX")}
                            </span>
                          ) : (
                            <span className="text-gray-600">—</span>
                          )}
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Upcoming appointments */}
        <div className="lg:col-span-2 bg-[#16213e] border border-white/10 rounded-xl p-5">
          <SectionHeader title="Próximas Citas" href="/dashboard/citas" linkLabel="Ver agenda →" />
          {upcomingAppointments.length === 0 ? (
            <p className="text-gray-500 text-sm py-8 text-center">No hay citas próximas.</p>
          ) : (
            <ul className="space-y-3">
              {upcomingAppointments.map((appt) => {
                const clientName = (appt.client as { full_name: string | null } | null)?.full_name ?? "—";
                const vehicleLabel = appt.vehicle
                  ? `${(appt.vehicle as { brand: string }).brand} ${(appt.vehicle as { model: string }).model} ${(appt.vehicle as { year: number }).year}`
                  : "—";
                return (
                  <li key={appt.id} className="flex items-start gap-3 p-3 rounded-lg bg-white/[0.03] hover:bg-white/5 transition-colors">
                    <div className="shrink-0 text-center bg-[#1a1a2e] rounded-lg px-2.5 py-1.5 min-w-[52px]">
                      <p className="text-[#e94560] font-bold text-sm leading-none">{appt.time_slot}</p>
                      <p className="text-gray-500 text-xs mt-1 leading-none">
                        {new Date(appt.date + "T00:00:00").toLocaleDateString("es-MX", { day: "2-digit", month: "short" })}
                      </p>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-white text-sm font-medium truncate">{clientName}</p>
                      <p className="text-gray-400 text-xs truncate mt-0.5">{appt.service_type}</p>
                      <p className="text-gray-600 text-xs truncate">{vehicleLabel}</p>
                    </div>
                    <div className="shrink-0">
                      <StatusBadge
                        label={APPT_STATUS_LABELS[appt.status as AppointmentStatus]}
                        color={APPT_STATUS_COLORS[appt.status as AppointmentStatus]}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

      </div>

      {/* Pending quotes awaiting client response */}
      {pendingQuotes.length > 0 && (
        <div className="bg-[#16213e] border border-blue-500/20 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <h2 className="text-white font-semibold text-base">Cotizaciones sin respuesta</h2>
              <span className="text-xs bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-full font-medium">
                {pendingQuotes.length}
              </span>
            </div>
            <Link href="/dashboard/cotizaciones?status=sent" className="text-[#e94560] text-sm hover:underline">
              Ver todas →
            </Link>
          </div>
          <div className="overflow-x-auto -mx-1">
            <table className="w-full text-sm min-w-[480px]">
              <thead>
                <tr className="text-gray-500 text-xs uppercase tracking-wide border-b border-white/5">
                  <th className="text-left pb-3 px-1 font-medium">Cotización / Cliente</th>
                  <th className="text-left pb-3 px-1 font-medium">Vehículo</th>
                  <th className="text-left pb-3 px-1 font-medium">Vence</th>
                  <th className="text-right pb-3 px-1 font-medium">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {pendingQuotes.map((quote: PendingQuote) => {
                  const isExpired = quote.valid_until
                    ? new Date(quote.valid_until + "T23:59:59") < new Date()
                    : false;
                  const daysLeft = quote.valid_until
                    ? Math.ceil((new Date(quote.valid_until + "T23:59:59").getTime() - Date.now()) / 86400000)
                    : null;
                  return (
                    <tr key={quote.id} className="hover:bg-white/[0.03] transition-colors group">
                      <td className="py-3 px-1">
                        <Link href={`/dashboard/cotizaciones/${quote.id}`} className="block">
                          <p className="text-blue-400 font-mono text-xs group-hover:underline">
                            COT-{quote.id.slice(0, 6).toUpperCase()}
                          </p>
                          <p className="text-white font-medium mt-0.5">
                            {quote.client?.full_name ?? "—"}
                          </p>
                        </Link>
                      </td>
                      <td className="py-3 px-1">
                        <Link href={`/dashboard/cotizaciones/${quote.id}`} className="block text-gray-300">
                          {quote.vehicle
                            ? `${quote.vehicle.brand} ${quote.vehicle.model} ${quote.vehicle.year}`
                            : <span className="text-gray-600">—</span>}
                        </Link>
                      </td>
                      <td className="py-3 px-1">
                        <Link href={`/dashboard/cotizaciones/${quote.id}`} className="block">
                          {quote.valid_until ? (
                            <span className={`text-xs font-medium ${
                              isExpired
                                ? "text-red-400"
                                : daysLeft !== null && daysLeft <= 2
                                ? "text-orange-400"
                                : "text-gray-400"
                            }`}>
                              {isExpired
                                ? "Vencida"
                                : daysLeft === 0
                                ? "Hoy"
                                : daysLeft === 1
                                ? "Mañana"
                                : new Date(quote.valid_until + "T00:00:00").toLocaleDateString("es-MX", { day: "2-digit", month: "short" })}
                            </span>
                          ) : (
                            <span className="text-gray-600 text-xs">Sin fecha</span>
                          )}
                        </Link>
                      </td>
                      <td className="py-3 px-1 text-right">
                        <Link href={`/dashboard/cotizaciones/${quote.id}`} className="block">
                          {quote.total != null && quote.total > 0 ? (
                            <span className="text-gray-300 font-medium">
                              ${quote.total.toLocaleString("es-MX")}
                            </span>
                          ) : (
                            <span className="text-gray-600">—</span>
                          )}
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Alerts row: ready orders + low stock */}
      {(readyOrders.length > 0 || lowStockItems.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Orders ready for pickup */}
          {readyOrders.length > 0 && (
            <div className="bg-[#16213e] border border-green-500/20 rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" aria-hidden="true" />
                  <h2 className="text-white font-semibold text-base">Listos para recoger</h2>
                  <span className="text-xs bg-green-500/20 text-green-300 px-2 py-0.5 rounded-full font-medium">
                    {readyOrders.length}
                  </span>
                </div>
                <Link href="/dashboard/ordenes?status=ready" className="text-[#e94560] text-sm hover:underline">
                  Ver todas →
                </Link>
              </div>
              <ul className="space-y-2">
                {readyOrders.map((order) => (
                  <li key={order.id}>
                    <Link
                      href={`/dashboard/ordenes/${order.id}`}
                      className="flex items-center justify-between p-3 rounded-lg bg-green-500/5 border border-green-500/10 hover:border-green-500/30 hover:bg-green-500/10 transition-colors group"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-green-400 font-mono text-xs">
                            OT-{order.id.slice(0, 6).toUpperCase()}
                          </span>
                          <span className="text-white text-sm font-medium truncate">
                            {order.client.full_name ?? "—"}
                          </span>
                        </div>
                        <p className="text-gray-500 text-xs mt-0.5 truncate">
                          {order.vehicle.brand} {order.vehicle.model} {order.vehicle.year}
                          {order.vehicle.plate ? ` · ${order.vehicle.plate}` : ""}
                        </p>
                      </div>
                      <svg className="w-4 h-4 text-gray-600 group-hover:text-green-400 transition-colors shrink-0 ml-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Low stock alerts */}
          {lowStockItems.length > 0 && (
            <div className="bg-[#16213e] border border-orange-500/20 rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                  </svg>
                  <h2 className="text-white font-semibold text-base">Stock bajo</h2>
                  <span className="text-xs bg-orange-500/20 text-orange-300 px-2 py-0.5 rounded-full font-medium">
                    {lowStockItems.length}
                  </span>
                </div>
                <Link href="/dashboard/inventario" className="text-[#e94560] text-sm hover:underline">
                  Ver inventario →
                </Link>
              </div>
              <ul className="space-y-2">
                {lowStockItems.map((item) => (
                  <li key={item.id} className="flex items-center justify-between p-3 rounded-lg bg-orange-500/5 border border-orange-500/10">
                    <div className="min-w-0">
                      <p className="text-white text-sm font-medium truncate">{item.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        {item.category && (
                          <span className="text-gray-600 text-xs">{item.category}</span>
                        )}
                        {item.sku && (
                          <span className="text-gray-700 text-xs font-mono">{item.sku}</span>
                        )}
                      </div>
                    </div>
                    <div className="shrink-0 ml-3 text-right">
                      <p className={`text-sm font-bold ${item.quantity === 0 ? "text-red-400" : "text-orange-400"}`}>
                        {item.quantity === 0 ? "Sin stock" : `${item.quantity} uds.`}
                      </p>
                      <p className="text-gray-600 text-xs">mín. {item.min_stock}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

        </div>
      )}
    </div>
  );
}
