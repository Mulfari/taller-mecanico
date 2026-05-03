import { createClient } from "@/lib/supabase/server";
import { Suspense } from "react";
import Link from "next/link";
import PeriodFilter from "./PeriodFilter";
import ExportReporteButton from "./ExportReporteButton";

export const metadata = { title: "Reportes — TallerPro" };

// ── Icons ──────────────────────────────────────────────────────────────────

function IconTrend() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
    </svg>
  );
}

function IconClipboard() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
    </svg>
  );
}

function IconWrench() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437l1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008z" />
    </svg>
  );
}

function IconBox() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
    </svg>
  );
}

function IconAlert() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
    </svg>
  );
}

// ── Helpers ────────────────────────────────────────────────────────────────

const fmt = (n: number) =>
  `$${n.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const STATUS_LABELS: Record<string, string> = {
  received: "Recibido",
  diagnosing: "Diagnóstico",
  repairing: "En reparación",
  ready: "Listo",
  delivered: "Entregado",
};

const STATUS_COLORS: Record<string, string> = {
  received: "bg-gray-400",
  diagnosing: "bg-yellow-400",
  repairing: "bg-blue-400",
  ready: "bg-green-400",
  delivered: "bg-gray-600",
};

type Period = "today" | "week" | "month" | "year" | "all";

const PERIOD_LABELS: Record<Period, string> = {
  today: "Hoy",
  week: "Esta semana",
  month: "Este mes",
  year: "Este año",
  all: "Todo",
};

function periodToSince(period: Period): string | null {
  const now = new Date();
  switch (period) {
    case "today": {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      return d.toISOString();
    }
    case "week": {
      const day = now.getDay(); // 0=Sun
      const diff = (day === 0 ? -6 : 1 - day); // Monday
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + diff);
      return d.toISOString();
    }
    case "month": {
      const d = new Date(now.getFullYear(), now.getMonth(), 1);
      return d.toISOString();
    }
    case "year": {
      const d = new Date(now.getFullYear(), 0, 1);
      return d.toISOString();
    }
    default:
      return null;
  }
}

// ── Sub-components ─────────────────────────────────────────────────────────

function KpiCard({
  icon,
  label,
  value,
  sub,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  accent?: boolean;
}) {
  return (
    <div className="bg-[#16213e] border border-white/10 rounded-xl p-5 flex items-start gap-4">
      <div
        className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
          accent ? "bg-[#e94560]/15 text-[#e94560]" : "bg-white/5 text-gray-400"
        }`}
      >
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-gray-500 text-xs font-medium uppercase tracking-wide">{label}</p>
        <p className={`text-2xl font-bold mt-0.5 ${accent ? "text-[#e94560]" : "text-white"}`}>
          {value}
        </p>
        {sub && <p className="text-gray-600 text-xs mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-[#16213e] border border-white/10 rounded-xl p-6">
      <h2 className="text-white font-semibold text-sm uppercase tracking-wide mb-5">{title}</h2>
      {children}
    </div>
  );
}

// ── Data fetching ──────────────────────────────────────────────────────────

async function getReportData(since: string | null) {
  const supabase = await createClient();

  let ordersQuery = supabase
    .from("work_orders")
    .select("id, status, final_cost, estimated_cost, created_at, delivered_at, mechanic_id, mechanic:profiles!work_orders_mechanic_id_fkey(full_name), client_id, client:profiles!work_orders_client_id_fkey(full_name, email)");
  if (since) ordersQuery = ordersQuery.gte("created_at", since);

  let apptQuery = supabase
    .from("appointments")
    .select("id, status, service_type, created_at");
  if (since) apptQuery = apptQuery.gte("created_at", since);

  let quotesQuery = supabase
    .from("quotes")
    .select("id, total, status, created_at");
  if (since) quotesQuery = quotesQuery.gte("created_at", since);

  const [
    { data: orders },
    { data: inventory },
    { data: appointments },
    { data: quotes },
  ] = await Promise.all([
    ordersQuery,
    supabase.from("inventory").select("id, name, quantity, min_stock, sell_price, category"),
    apptQuery,
    quotesQuery,
  ]);

  // Revenue from delivered orders
  const deliveredOrders = (orders ?? []).filter((o) => o.status === "delivered");
  const totalRevenue = deliveredOrders.reduce(
    (sum, o) => sum + (o.final_cost ?? o.estimated_cost ?? 0),
    0
  );

  // Orders by status
  const statusCounts: Record<string, number> = {};
  for (const o of orders ?? []) {
    statusCounts[o.status] = (statusCounts[o.status] ?? 0) + 1;
  }

  // Monthly revenue (last 6 months) — always all-time for the trend chart
  const now = new Date();
  const monthlyRevenue: { label: string; amount: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const label = d.toLocaleDateString("es-MX", { month: "short", year: "2-digit" });
    const amount = deliveredOrders
      .filter((o) => {
        const date = new Date(o.delivered_at ?? o.created_at);
        return date.getFullYear() === d.getFullYear() && date.getMonth() === d.getMonth();
      })
      .reduce((sum, o) => sum + (o.final_cost ?? o.estimated_cost ?? 0), 0);
    monthlyRevenue.push({ label, amount });
  }

  // Top service types from appointments
  const serviceCount: Record<string, number> = {};
  for (const a of appointments ?? []) {
    if (a.service_type) {
      serviceCount[a.service_type] = (serviceCount[a.service_type] ?? 0) + 1;
    }
  }
  const topServices = Object.entries(serviceCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);

  // Low stock items — always current, not period-filtered
  const lowStock = (inventory ?? [])
    .filter((i) => i.quantity <= (i.min_stock ?? 0))
    .sort((a, b) => a.quantity - b.quantity)
    .slice(0, 8);

  // Inventory value — always current
  const inventoryValue = (inventory ?? []).reduce(
    (sum, i) => sum + i.quantity * (i.sell_price ?? 0),
    0
  );

  // Quotes stats
  const acceptedQuotes = (quotes ?? []).filter((q) => q.status === "accepted");
  const quotesRevenue = acceptedQuotes.reduce((sum, q) => sum + (q.total ?? 0), 0);

  // Top clients by revenue
  type ClientStat = { id: string; name: string; email: string; orders: number; revenue: number };
  const clientMap: Record<string, ClientStat> = {};
  for (const o of orders ?? []) {
    if (!o.client_id) continue;
    const clientProfile = o.client as { full_name?: string | null; email?: string | null } | null;
    const name = clientProfile?.full_name ?? clientProfile?.email ?? "Cliente desconocido";
    const email = clientProfile?.email ?? "";
    if (!clientMap[o.client_id]) {
      clientMap[o.client_id] = { id: o.client_id, name, email, orders: 0, revenue: 0 };
    }
    clientMap[o.client_id].orders += 1;
    if (o.status === "delivered") {
      clientMap[o.client_id].revenue += o.final_cost ?? o.estimated_cost ?? 0;
    }
  }
  const topClients = Object.values(clientMap)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 8);

  // Mechanic performance
  type MechanicStat = { name: string; total: number; delivered: number; revenue: number };
  const mechanicMap: Record<string, MechanicStat> = {};
  for (const o of orders ?? []) {
    if (!o.mechanic_id) continue;
    const name =
      (o.mechanic as { full_name?: string | null } | null)?.full_name ?? "Sin nombre";
    if (!mechanicMap[o.mechanic_id]) {
      mechanicMap[o.mechanic_id] = { name, total: 0, delivered: 0, revenue: 0 };
    }
    mechanicMap[o.mechanic_id].total += 1;
    if (o.status === "delivered") {
      mechanicMap[o.mechanic_id].delivered += 1;
      mechanicMap[o.mechanic_id].revenue += o.final_cost ?? o.estimated_cost ?? 0;
    }
  }
  const mechanicStats = Object.values(mechanicMap).sort((a, b) => b.delivered - a.delivered);

  return {
    totalRevenue,
    totalOrders: (orders ?? []).length,
    activeOrders: (orders ?? []).filter((o) => o.status !== "delivered").length,
    statusCounts,
    monthlyRevenue,
    topServices,
    lowStock,
    inventoryValue,
    totalAppointments: (appointments ?? []).length,
    pendingAppointments: (appointments ?? []).filter((a) => a.status === "pending").length,
    quotesRevenue,
    acceptedQuotesCount: acceptedQuotes.length,
    mechanicStats,
    topClients,
  };
}

// ── Page ───────────────────────────────────────────────────────────────────

export default async function ReportesPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>;
}) {
  const { period: rawPeriod } = await searchParams;
  const period: Period =
    rawPeriod === "today" || rawPeriod === "week" || rawPeriod === "month" || rawPeriod === "year"
      ? rawPeriod
      : "all";

  const since = periodToSince(period);
  const data = await getReportData(since);

  const maxMonthly = Math.max(...data.monthlyRevenue.map((m) => m.amount), 1);
  const maxService = data.topServices[0]?.[1] ?? 1;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Reportes</h1>
          <p className="text-gray-500 text-sm mt-1">
            Resumen de actividad — <span className="text-gray-400">{PERIOD_LABELS[period]}</span>
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <ExportReporteButton
            data={{
              period: PERIOD_LABELS[period],
              totalRevenue: data.totalRevenue,
              totalOrders: data.totalOrders,
              activeOrders: data.activeOrders,
              monthlyRevenue: data.monthlyRevenue,
              topServices: data.topServices.map(([service, count]) => ({ service, count })),
              topClients: data.topClients,
              mechanicStats: data.mechanicStats,
              lowStock: data.lowStock,
            }}
          />
          <Suspense fallback={null}>
            <PeriodFilter current={period} />
          </Suspense>
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard
          icon={<IconTrend />}
          label="Ingresos totales"
          value={fmt(data.totalRevenue)}
          sub="Órdenes entregadas"
          accent
        />
        <KpiCard
          icon={<IconClipboard />}
          label="Órdenes activas"
          value={String(data.activeOrders)}
          sub={`${data.totalOrders} en total`}
        />
        <KpiCard
          icon={<IconBox />}
          label="Valor inventario"
          value={fmt(data.inventoryValue)}
          sub={`${data.lowStock.length} con stock bajo`}
        />
        <KpiCard
          icon={<IconWrench />}
          label="Cotizaciones aceptadas"
          value={String(data.acceptedQuotesCount)}
          sub={fmt(data.quotesRevenue) + " en cotizaciones"}
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Monthly revenue bar chart */}
        <SectionCard title="Ingresos por mes (últimos 6 meses)">
          <div className="space-y-3">
            {data.monthlyRevenue.map((m) => (
              <div key={m.label} className="flex items-center gap-3">
                <span className="text-gray-500 text-xs w-12 shrink-0 text-right">{m.label}</span>
                <div className="flex-1 bg-white/5 rounded-full h-5 overflow-hidden">
                  <div
                    className="h-full bg-[#e94560] rounded-full transition-all"
                    style={{ width: `${(m.amount / maxMonthly) * 100}%` }}
                  />
                </div>
                <span className="text-gray-300 text-xs w-24 shrink-0 text-right font-mono">
                  {fmt(m.amount)}
                </span>
              </div>
            ))}
            {data.monthlyRevenue.every((m) => m.amount === 0) && (
              <p className="text-gray-600 text-sm text-center py-4">Sin datos de ingresos aún</p>
            )}
          </div>
        </SectionCard>

        {/* Orders by status */}
        <SectionCard title="Órdenes por estado">
          {Object.keys(data.statusCounts).length === 0 ? (
            <p className="text-gray-600 text-sm text-center py-4">Sin órdenes en este período</p>
          ) : (
            <div className="space-y-3">
              {Object.entries(data.statusCounts)
                .sort((a, b) => b[1] - a[1])
                .map(([status, count]) => {
                  const pct = Math.round((count / data.totalOrders) * 100);
                  return (
                    <div key={status} className="flex items-center gap-3">
                      <span className="text-gray-400 text-xs w-28 shrink-0">
                        {STATUS_LABELS[status] ?? status}
                      </span>
                      <div className="flex-1 bg-white/5 rounded-full h-5 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${STATUS_COLORS[status] ?? "bg-gray-400"}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-gray-300 text-xs w-16 shrink-0 text-right">
                        {count} ({pct}%)
                      </span>
                    </div>
                  );
                })}
            </div>
          )}
        </SectionCard>

        {/* Top services */}
        <SectionCard title="Servicios más solicitados">
          {data.topServices.length === 0 ? (
            <p className="text-gray-600 text-sm text-center py-4">Sin citas en este período</p>
          ) : (
            <div className="space-y-3">
              {data.topServices.map(([service, count]) => (
                <div key={service} className="flex items-center gap-3">
                  <span className="text-gray-400 text-xs flex-1 truncate">{service}</span>
                  <div className="w-32 bg-white/5 rounded-full h-4 overflow-hidden">
                    <div
                      className="h-full bg-blue-400 rounded-full"
                      style={{ width: `${(count / maxService) * 100}%` }}
                    />
                  </div>
                  <span className="text-gray-300 text-xs w-8 shrink-0 text-right">{count}</span>
                </div>
              ))}
            </div>
          )}
        </SectionCard>

        {/* Mechanic performance */}
        <SectionCard title="Rendimiento por mecánico">
          {data.mechanicStats.length === 0 ? (
            <p className="text-gray-600 text-sm text-center py-4">Sin órdenes asignadas en este período</p>
          ) : (
            <div className="space-y-3">
              {data.mechanicStats.map((m, i) => (
                <div
                  key={m.name + i}
                  className="flex items-center justify-between gap-4 py-2.5 border-b border-white/5 last:border-0"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-[#e94560]/10 border border-[#e94560]/20 flex items-center justify-center shrink-0">
                      <span className="text-[#e94560] text-xs font-bold">
                        {m.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-gray-200 text-sm font-medium truncate">{m.name}</p>
                      <p className="text-gray-500 text-xs">
                        {m.total} orden{m.total !== 1 ? "es" : ""} · {m.delivered} entregada{m.delivered !== 1 ? "s" : ""}
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-white text-sm font-semibold">{fmt(m.revenue)}</p>
                    <p className="text-gray-600 text-xs">
                      {m.total > 0 ? Math.round((m.delivered / m.total) * 100) : 0}% completado
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </SectionCard>

        {/* Top clients */}
        <SectionCard title="Top clientes por ingresos">
          {data.topClients.length === 0 ? (
            <p className="text-gray-600 text-sm text-center py-4">Sin órdenes entregadas en este período</p>
          ) : (
            <div className="space-y-3">
              {data.topClients.map((c, i) => (
                <Link
                  key={c.id}
                  href={`/dashboard/clientes/${c.id}`}
                  className="flex items-center justify-between gap-4 py-2.5 border-b border-white/5 last:border-0 hover:bg-white/[0.03] rounded-lg px-2 -mx-2 transition-colors group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 group-hover:border-[#e94560]/30 flex items-center justify-center shrink-0 transition-colors">
                      <span className="text-gray-400 text-xs font-bold">
                        {c.name.slice(0, 2).toUpperCase()}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-gray-200 text-sm font-medium truncate group-hover:text-white transition-colors">{c.name}</p>
                      <p className="text-gray-500 text-xs">
                        {c.orders} orden{c.orders !== 1 ? "es" : ""}
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-white text-sm font-semibold">{fmt(c.revenue)}</p>
                    {i === 0 && (
                      <p className="text-[#e94560] text-xs font-medium">Mejor cliente</p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </SectionCard>

        {/* Low stock alerts */}
        <SectionCard title="Alertas de stock bajo">
          {data.lowStock.length === 0 ? (
            <p className="text-gray-600 text-sm text-center py-4">
              Todo el inventario está en niveles normales
            </p>
          ) : (
            <div className="space-y-2">
              {data.lowStock.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-3 py-2 border-b border-white/5 last:border-0"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-yellow-400 shrink-0">
                      <IconAlert />
                    </span>
                    <div className="min-w-0">
                      <p className="text-gray-200 text-sm truncate">{item.name}</p>
                      {item.category && (
                        <p className="text-gray-600 text-xs">{item.category}</p>
                      )}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p
                      className={`text-sm font-semibold ${
                        item.quantity === 0 ? "text-red-400" : "text-yellow-400"
                      }`}
                    >
                      {item.quantity === 0 ? "Sin stock" : `${item.quantity} uds.`}
                    </p>
                    <p className="text-gray-600 text-xs">mín. {item.min_stock ?? 0}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </SectionCard>
      </div>
    </div>
  );
}
