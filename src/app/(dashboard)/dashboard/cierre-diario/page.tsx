import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import type { Metadata } from "next";
import PrintButton from "./PrintButton";

export const metadata: Metadata = { title: "Cierre Diario — TallerPro" };

// ── Types ──────────────────────────────────────────────────────────────────

type WorkOrderStatus = "received" | "diagnosing" | "repairing" | "ready" | "delivered";

interface DayOrder {
  id: string;
  status: WorkOrderStatus;
  description: string | null;
  estimated_cost: number | null;
  final_cost: number | null;
  received_at: string | null;
  delivered_at: string | null;
  mechanic: { full_name: string | null } | null;
  client: { full_name: string | null } | null;
  vehicle: { brand: string; model: string; year: number; plate: string | null } | null;
}

interface DayAppointment {
  id: string;
  status: string;
  service_type: string;
  time_slot: string;
  client: { full_name: string | null } | null;
  vehicle: { brand: string; model: string; year: number } | null;
}

interface DayInvoice {
  id: string;
  total: number | null;
  status: string;
  paid_at: string | null;
  client: { full_name: string | null } | null;
}

// ── Constants ──────────────────────────────────────────────────────────────

const STATUS_LABELS: Record<WorkOrderStatus, string> = {
  received: "Recibido",
  diagnosing: "Diagnóstico",
  repairing: "En reparación",
  ready: "Listo",
  delivered: "Entregado",
};

const STATUS_COLORS: Record<WorkOrderStatus, string> = {
  received: "bg-gray-500/20 text-gray-300 border-gray-500/30",
  diagnosing: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
  repairing: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  ready: "bg-green-500/20 text-green-300 border-green-500/30",
  delivered: "bg-gray-600/20 text-gray-500 border-gray-600/30",
};

const APPT_STATUS_LABELS: Record<string, string> = {
  pending: "Pendiente",
  confirmed: "Confirmada",
  completed: "Completada",
  cancelled: "Cancelada",
};

// ── Helpers ────────────────────────────────────────────────────────────────

const fmt = (n: number) =>
  `$${n.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

// ── Icons ──────────────────────────────────────────────────────────────────

function IconTrend() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
    </svg>
  );
}

function IconWrench() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085" />
    </svg>
  );
}

function IconCalendar() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
    </svg>
  );
}

function IconReceipt() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 14.25l6-6m4.5-3.493V21.75l-3.75-1.5-3.75 1.5-3.75-1.5-3.75 1.5V4.757c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0c1.1.128 1.907 1.077 1.907 2.185z" />
    </svg>
  );
}

function IconAlert() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
    </svg>
  );
}

function IconClock() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
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
    <div className="bg-[#16213e] border border-white/10 rounded-xl p-5 flex items-start gap-4 print:border-gray-200 print:bg-white">
      <div
        className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
          accent ? "bg-[#e94560]/15 text-[#e94560]" : "bg-white/5 text-gray-400"
        } print:bg-gray-100 print:text-gray-600`}
      >
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-gray-500 text-xs font-medium uppercase tracking-wide print:text-gray-500">{label}</p>
        <p className={`text-2xl font-bold mt-0.5 ${accent ? "text-[#e94560]" : "text-white"} print:text-gray-900`}>
          {value}
        </p>
        {sub && <p className="text-gray-600 text-xs mt-0.5 print:text-gray-500">{sub}</p>}
      </div>
    </div>
  );
}

function SectionCard({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="bg-[#16213e] border border-white/10 rounded-xl overflow-hidden print:border-gray-200 print:bg-white print:break-inside-avoid">
      <div className="px-5 py-4 border-b border-white/5 flex items-center gap-2 print:border-gray-200">
        <span className="text-gray-500 print:text-gray-400">{icon}</span>
        <h2 className="text-white font-semibold text-sm uppercase tracking-wide print:text-gray-900">{title}</h2>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

// ── Data fetching ──────────────────────────────────────────────────────────

async function getDailyClosingData(dateStr: string) {
  const supabase = await createClient();

  const dayStart = `${dateStr}T00:00:00`;
  const dayEnd = `${dateStr}T23:59:59`;

  const [
    { data: receivedOrders },
    { data: deliveredOrders },
    { data: activeOrders },
    { data: appointments },
    { data: invoicesPaid },
    { data: invoicesCreated },
    { data: lowStock },
    { data: shopConfig },
    { data: tomorrowAppts },
  ] = await Promise.all([
    supabase
      .from("work_orders")
      .select(
        "id, status, description, estimated_cost, final_cost, received_at, delivered_at, " +
        "mechanic:profiles!work_orders_mechanic_id_fkey(full_name), " +
        "client:profiles!work_orders_client_id_fkey(full_name), " +
        "vehicle:vehicles(brand, model, year, plate)"
      )
      .gte("received_at", dayStart)
      .lte("received_at", dayEnd)
      .order("received_at"),
    supabase
      .from("work_orders")
      .select(
        "id, status, description, estimated_cost, final_cost, received_at, delivered_at, " +
        "mechanic:profiles!work_orders_mechanic_id_fkey(full_name), " +
        "client:profiles!work_orders_client_id_fkey(full_name), " +
        "vehicle:vehicles(brand, model, year, plate)"
      )
      .gte("delivered_at", dayStart)
      .lte("delivered_at", dayEnd)
      .eq("status", "delivered")
      .order("delivered_at"),
    supabase
      .from("work_orders")
      .select(
        "id, status, description, estimated_cost, final_cost, received_at, delivered_at, " +
        "mechanic:profiles!work_orders_mechanic_id_fkey(full_name), " +
        "client:profiles!work_orders_client_id_fkey(full_name), " +
        "vehicle:vehicles(brand, model, year, plate)"
      )
      .in("status", ["received", "diagnosing", "repairing", "ready"])
      .order("received_at"),
    supabase
      .from("appointments")
      .select(
        "id, status, service_type, time_slot, " +
        "client:profiles!appointments_client_id_fkey(full_name), " +
        "vehicle:vehicles!appointments_vehicle_id_fkey(brand, model, year)"
      )
      .eq("date", dateStr)
      .order("time_slot"),
    supabase
      .from("invoices")
      .select("id, total, status, paid_at, client:profiles!invoices_client_id_fkey(full_name)")
      .gte("paid_at", dayStart)
      .lte("paid_at", dayEnd)
      .eq("status", "paid"),
    supabase
      .from("invoices")
      .select("id, total, status, paid_at, client:profiles!invoices_client_id_fkey(full_name)")
      .gte("created_at", dayStart)
      .lte("created_at", dayEnd),
    supabase
      .from("inventory")
      .select("id, name, quantity, min_stock, category")
      .filter("quantity", "lte", "min_stock")
      .order("quantity")
      .limit(10),
    supabase
      .from("shop_config")
      .select("name")
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle(),
    (() => {
      const tomorrow = new Date(dateStr + "T12:00:00");
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().slice(0, 10);
      return supabase
        .from("appointments")
        .select(
          "id, status, service_type, time_slot, " +
          "client:profiles!appointments_client_id_fkey(full_name), " +
          "vehicle:vehicles!appointments_vehicle_id_fkey(brand, model, year)"
        )
        .eq("date", tomorrowStr)
        .in("status", ["pending", "confirmed"])
        .order("time_slot");
    })(),
  ]);

  const normalize = <T,>(rows: unknown): T[] => ((rows ?? []) as T[]);

  const received = normalize<DayOrder>(receivedOrders);
  const delivered = normalize<DayOrder>(deliveredOrders);
  const active = normalize<DayOrder>(activeOrders);
  const appts = normalize<DayAppointment>(appointments);
  const paidInvoices = normalize<DayInvoice>(invoicesPaid);
  const createdInvoices = normalize<DayInvoice>(invoicesCreated);
  const lowStockItems = normalize<{ id: string; name: string; quantity: number; min_stock: number | null; category: string | null }>(lowStock);
  const tomorrowAppointments = normalize<DayAppointment>(tomorrowAppts);

  const dayRevenue = delivered.reduce((sum, o) => sum + (o.final_cost ?? o.estimated_cost ?? 0), 0);
  const dayPaidTotal = paidInvoices.reduce((sum, i) => sum + (i.total ?? 0), 0);

  const mechanicWork: Record<string, { name: string; received: number; delivered: number; active: number; revenue: number }> = {};
  for (const o of [...received, ...delivered, ...active]) {
    const mech = Array.isArray(o.mechanic) ? o.mechanic[0] : o.mechanic;
    const name = mech?.full_name ?? "Sin asignar";
    if (!mechanicWork[name]) mechanicWork[name] = { name, received: 0, delivered: 0, active: 0, revenue: 0 };
  }
  for (const o of received) {
    const mech = Array.isArray(o.mechanic) ? o.mechanic[0] : o.mechanic;
    const name = mech?.full_name ?? "Sin asignar";
    if (mechanicWork[name]) mechanicWork[name].received += 1;
  }
  for (const o of delivered) {
    const mech = Array.isArray(o.mechanic) ? o.mechanic[0] : o.mechanic;
    const name = mech?.full_name ?? "Sin asignar";
    if (mechanicWork[name]) {
      mechanicWork[name].delivered += 1;
      mechanicWork[name].revenue += o.final_cost ?? o.estimated_cost ?? 0;
    }
  }
  for (const o of active) {
    const mech = Array.isArray(o.mechanic) ? o.mechanic[0] : o.mechanic;
    const name = mech?.full_name ?? "Sin asignar";
    if (mechanicWork[name]) mechanicWork[name].active += 1;
  }

  const completedAppts = appts.filter((a) => a.status === "completed").length;
  const cancelledAppts = appts.filter((a) => a.status === "cancelled").length;

  return {
    shopName: shopConfig?.name ?? "TallerPro",
    dateStr,
    received,
    delivered,
    active,
    appts,
    paidInvoices,
    createdInvoices,
    lowStockItems,
    tomorrowAppointments,
    dayRevenue,
    dayPaidTotal,
    mechanicStats: Object.values(mechanicWork).sort((a, b) => b.delivered - a.delivered),
    completedAppts,
    cancelledAppts,
  };
}

// ── Page ──────────────────────────────────────────────────────────────────

export default async function CierreDiarioPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const { date } = await searchParams;
  const today = new Date().toISOString().slice(0, 10);
  const dateStr = date ?? today;

  const d = await getDailyClosingData(dateStr);

  const dateLabel = new Date(dateStr + "T12:00:00").toLocaleDateString("es-MX", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="space-y-6 print:space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 print:flex-row print:items-center">
        <div>
          <h1 className="text-2xl font-bold text-white print:text-black">Cierre Diario</h1>
          <p className="text-gray-400 text-sm mt-1 capitalize print:text-gray-600">{dateLabel}</p>
          <p className="text-gray-600 text-xs print:text-gray-500">{d.shopName}</p>
        </div>
        <div className="flex items-center gap-3 print:hidden">
          <form className="flex items-center gap-2">
            <input
              type="date"
              name="date"
              defaultValue={dateStr}
              className="bg-[#16213e] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#e94560]/50"
            />
            <button
              type="submit"
              className="bg-[#e94560] hover:bg-[#e94560]/80 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
            >
              Ver
            </button>
          </form>
          <PrintButton />
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 print:grid-cols-5">
        <KpiCard icon={<IconTrend />} label="Ingresos del día" value={fmt(d.dayRevenue)} accent />
        <KpiCard icon={<IconWrench />} label="Órdenes recibidas" value={String(d.received.length)} />
        <KpiCard icon={<IconWrench />} label="Órdenes entregadas" value={String(d.delivered.length)} />
        <KpiCard
          icon={<IconReceipt />}
          label="Facturas cobradas"
          value={String(d.paidInvoices.length)}
          sub={fmt(d.dayPaidTotal)}
        />
        <KpiCard icon={<IconClock />} label="Órdenes activas" value={String(d.active.length)} />
      </div>

      {/* Main grid */}
      <div className="grid lg:grid-cols-2 gap-6 print:grid-cols-2 print:gap-4">{/* Delivered */}
        <SectionCard title="Órdenes entregadas hoy" icon={<IconWrench />}>
          {d.delivered.length === 0 ? (
            <p className="text-gray-500 text-sm">Sin entregas hoy.</p>
          ) : (
            <div className="space-y-3">
              {d.delivered.map((o) => {
                const v = Array.isArray(o.vehicle) ? o.vehicle[0] : o.vehicle;
                const c = Array.isArray(o.client) ? o.client[0] : o.client;
                return (
                  <Link
                    key={o.id}
                    href={`/dashboard/ordenes/${o.id}`}
                    className="block bg-white/5 rounded-lg p-3 hover:bg-white/10 transition-colors print:bg-gray-50 print:border print:border-gray-200"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-white text-sm font-medium print:text-gray-900">
                        {v ? `${v.brand} ${v.model} ${v.year}` : "—"}
                      </span>
                      <span className="text-[#e94560] font-semibold text-sm">
                        {fmt(o.final_cost ?? o.estimated_cost ?? 0)}
                      </span>
                    </div>
                    <p className="text-gray-500 text-xs mt-1">{c?.full_name ?? "Sin cliente"}</p>
                    {o.description && (
                      <p className="text-gray-600 text-xs mt-0.5 truncate">{o.description}</p>
                    )}
                  </Link>
                );
              })}
            </div>
          )}
        </SectionCard>

        {/* Received */}
        <SectionCard title="Órdenes recibidas hoy" icon={<IconWrench />}>
          {d.received.length === 0 ? (
            <p className="text-gray-500 text-sm">Sin recepciones hoy.</p>
          ) : (
            <div className="space-y-3">
              {d.received.map((o) => {
                const v = Array.isArray(o.vehicle) ? o.vehicle[0] : o.vehicle;
                const c = Array.isArray(o.client) ? o.client[0] : o.client;
                const m = Array.isArray(o.mechanic) ? o.mechanic[0] : o.mechanic;
                return (
                  <Link
                    key={o.id}
                    href={`/dashboard/ordenes/${o.id}`}
                    className="block bg-white/5 rounded-lg p-3 hover:bg-white/10 transition-colors print:bg-gray-50 print:border print:border-gray-200"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-white text-sm font-medium print:text-gray-900">
                        {v ? `${v.brand} ${v.model} ${v.year}` : "—"}
                      </span>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full border ${STATUS_COLORS[o.status]}`}
                      >
                        {STATUS_LABELS[o.status]}
                      </span>
                    </div>
                    <p className="text-gray-500 text-xs mt-1">
                      {c?.full_name ?? "Sin cliente"} · Mecánico: {m?.full_name ?? "Sin asignar"}
                    </p>
                  </Link>
                );
              })}
            </div>
          )}
        </SectionCard>

        {/* Mechanic Performance */}
        <SectionCard title="Rendimiento por mecánico" icon={<IconWrench />}>
          {d.mechanicStats.length === 0 ? (
            <p className="text-gray-500 text-sm">Sin actividad de mecánicos.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-gray-500 text-xs uppercase border-b border-white/5 print:border-gray-200">
                    <th className="text-left py-2 font-medium">Mecánico</th>
                    <th className="text-center py-2 font-medium">Recibidas</th>
                    <th className="text-center py-2 font-medium">Entregadas</th>
                    <th className="text-center py-2 font-medium">Activas</th>
                    <th className="text-right py-2 font-medium">Ingreso</th>
                  </tr>
                </thead>
                <tbody>
                  {d.mechanicStats.map((m) => (
                    <tr key={m.name} className="border-b border-white/5 last:border-0 print:border-gray-100">
                      <td className="py-2 text-white print:text-gray-900">{m.name}</td>
                      <td className="py-2 text-center text-gray-400 print:text-gray-600">{m.received}</td>
                      <td className="py-2 text-center text-gray-400 print:text-gray-600">{m.delivered}</td>
                      <td className="py-2 text-center text-gray-400 print:text-gray-600">{m.active}</td>
                      <td className="py-2 text-right text-[#e94560] font-medium">{fmt(m.revenue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </SectionCard>

        {/* Appointments */}
        <SectionCard title="Citas del día" icon={<IconCalendar />}>
          {d.appts.length === 0 ? (
            <p className="text-gray-500 text-sm">Sin citas programadas.</p>
          ) : (
            <div className="space-y-2">
              <div className="flex gap-4 text-xs text-gray-500 mb-3">
                <span>Total: {d.appts.length}</span>
                <span>Completadas: {d.completedAppts}</span>
                <span>Canceladas: {d.cancelledAppts}</span>
              </div>
              {d.appts.map((a) => {
                const c = Array.isArray(a.client) ? a.client[0] : a.client;
                const v = Array.isArray(a.vehicle) ? a.vehicle[0] : a.vehicle;
                return (
                  <div
                    key={a.id}
                    className="flex items-center justify-between bg-white/5 rounded-lg px-3 py-2 print:bg-gray-50 print:border print:border-gray-200"
                  >
                    <div>
                      <span className="text-white text-sm print:text-gray-900">
                        {a.time_slot} — {c?.full_name ?? "Sin cliente"}
                      </span>
                      <p className="text-gray-500 text-xs">
                        {v ? `${v.brand} ${v.model} ${v.year}` : "—"} · {a.service_type}
                      </p>
                    </div>
                    <span className="text-xs text-gray-400 print:text-gray-600">
                      {APPT_STATUS_LABELS[a.status] ?? a.status}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </SectionCard>

        {/* Invoices */}
        <SectionCard title="Facturas cobradas hoy" icon={<IconReceipt />}>
          {d.paidInvoices.length === 0 ? (
            <p className="text-gray-500 text-sm">Sin cobros hoy.</p>
          ) : (
            <div className="space-y-2">
              {d.paidInvoices.map((inv) => {
                const c = Array.isArray(inv.client) ? inv.client[0] : inv.client;
                return (
                  <div
                    key={inv.id}
                    className="flex items-center justify-between bg-white/5 rounded-lg px-3 py-2 print:bg-gray-50 print:border print:border-gray-200"
                  >
                    <span className="text-white text-sm print:text-gray-900">
                      {c?.full_name ?? "Sin cliente"}
                    </span>
                    <span className="text-[#e94560] font-semibold text-sm">{fmt(inv.total ?? 0)}</span>
                  </div>
                );
              })}
              <div className="border-t border-white/10 pt-2 mt-2 flex justify-between print:border-gray-200">
                <span className="text-gray-400 text-sm font-medium print:text-gray-600">Total cobrado</span>
                <span className="text-white font-bold print:text-gray-900">{fmt(d.dayPaidTotal)}</span>
              </div>
            </div>
          )}
        </SectionCard>

        {/* Low Stock */}
        {d.lowStockItems.length > 0 && (
          <SectionCard title="Alertas de inventario" icon={<IconAlert />}>
            <div className="space-y-2">
              {d.lowStockItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between bg-yellow-500/5 border border-yellow-500/10 rounded-lg px-3 py-2 print:bg-yellow-50 print:border-yellow-200"
                >
                  <div>
                    <span className="text-white text-sm print:text-gray-900">{item.name}</span>
                    {item.category && (
                      <span className="text-gray-600 text-xs ml-2">({item.category})</span>
                    )}
                  </div>
                  <span className="text-yellow-400 text-sm font-medium">
                    {item.quantity} / {item.min_stock ?? "—"}
                  </span>
                </div>
              ))}
            </div>
          </SectionCard>
        )}

        {/* Tomorrow Preview */}
        {d.tomorrowAppointments.length > 0 && (
          <SectionCard title="Vista previa de mañana" icon={<IconClock />}>
            <p className="text-gray-500 text-xs mb-3">
              {d.tomorrowAppointments.length} cita{d.tomorrowAppointments.length !== 1 ? "s" : ""} programada{d.tomorrowAppointments.length !== 1 ? "s" : ""}
            </p>
            <div className="space-y-2">
              {d.tomorrowAppointments.map((a) => {
                const c = Array.isArray(a.client) ? a.client[0] : a.client;
                const v = Array.isArray(a.vehicle) ? a.vehicle[0] : a.vehicle;
                return (
                  <div
                    key={a.id}
                    className="flex items-center justify-between bg-white/5 rounded-lg px-3 py-2 print:bg-gray-50 print:border print:border-gray-200"
                  >
                    <div>
                      <span className="text-white text-sm print:text-gray-900">
                        {a.time_slot} — {c?.full_name ?? "Sin cliente"}
                      </span>
                      <p className="text-gray-500 text-xs">
                        {v ? `${v.brand} ${v.model} ${v.year}` : "—"} · {a.service_type}
                      </p>
                    </div>
                    <span className="text-xs text-gray-400 print:text-gray-600">
                      {APPT_STATUS_LABELS[a.status] ?? a.status}
                    </span>
                  </div>
                );
              })}
            </div>
          </SectionCard>
        )}
      </div>

      {/* Active orders summary */}
      <SectionCard title={`Órdenes activas en taller (${d.active.length})`} icon={<IconWrench />}>
        {d.active.length === 0 ? (
          <p className="text-gray-500 text-sm">Sin órdenes activas.</p>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 print:grid-cols-3">
            {d.active.map((o) => {
              const v = Array.isArray(o.vehicle) ? o.vehicle[0] : o.vehicle;
              const m = Array.isArray(o.mechanic) ? o.mechanic[0] : o.mechanic;
              return (
                <Link
                  key={o.id}
                  href={`/dashboard/ordenes/${o.id}`}
                  className="bg-white/5 rounded-lg p-3 hover:bg-white/10 transition-colors print:bg-gray-50 print:border print:border-gray-200"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-white text-sm font-medium truncate print:text-gray-900">
                      {v ? `${v.brand} ${v.model}` : "—"}
                    </span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full border shrink-0 ml-2 ${STATUS_COLORS[o.status]}`}
                    >
                      {STATUS_LABELS[o.status]}
                    </span>
                  </div>
                  <p className="text-gray-500 text-xs">
                    {m?.full_name ?? "Sin asignar"}
                  </p>
                </Link>
              );
            })}
          </div>
        )}
      </SectionCard>
    </div>
  );
}
