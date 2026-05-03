import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Mecánico — TallerPro" };

// ── Types ──────────────────────────────────────────────────────────────────

type WorkOrderStatus = "received" | "diagnosing" | "repairing" | "ready" | "delivered";

interface WorkOrder {
  id: string;
  status: WorkOrderStatus;
  description: string | null;
  diagnosis: string | null;
  estimated_cost: number | null;
  final_cost: number | null;
  received_at: string | null;
  delivered_at: string | null;
  vehicle: { brand: string; model: string; year: number; plate: string | null } | null;
  client: { full_name: string | null; email: string } | null;
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

const STATUS_DOT: Record<WorkOrderStatus, string> = {
  received: "bg-gray-400",
  diagnosing: "bg-yellow-400",
  repairing: "bg-blue-400",
  ready: "bg-green-400",
  delivered: "bg-gray-600",
};

const fmt = (n: number) =>
  `$${n.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const fmtDate = (d: string | null) =>
  d
    ? new Date(d.includes("T") ? d : d + "T00:00:00").toLocaleDateString("es-MX", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";

function daysAgo(dateStr: string | null): string {
  if (!dateStr) return "";
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86_400_000);
  if (diff === 0) return "hoy";
  if (diff === 1) return "ayer";
  return `hace ${diff} días`;
}

// ── Icons ──────────────────────────────────────────────────────────────────

function IconArrowLeft() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
    </svg>
  );
}

function IconPhone() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
    </svg>
  );
}

function IconMail() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
    </svg>
  );
}

function IconPlus() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────

function KpiCard({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string | number;
  sub?: string;
  accent?: boolean;
}) {
  return (
    <div className="bg-[#16213e] border border-white/10 rounded-xl px-5 py-4">
      <p className="text-gray-500 text-xs uppercase tracking-wide font-medium">{label}</p>
      <p className={`text-2xl font-bold mt-1 ${accent ? "text-[#e94560]" : "text-white"}`}>
        {value}
      </p>
      {sub && <p className="text-gray-600 text-xs mt-0.5">{sub}</p>}
    </div>
  );
}

function OrderRow({ order }: { order: WorkOrder }) {
  const status = order.status as WorkOrderStatus;
  const cost = order.final_cost ?? order.estimated_cost;
  return (
    <Link
      href={`/dashboard/ordenes/${order.id}`}
      className="flex items-start gap-3 px-5 py-4 hover:bg-white/[0.03] transition-colors group border-b border-white/5 last:border-0"
    >
      <span className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${STATUS_DOT[status]}`} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-gray-200 text-sm font-mono group-hover:text-white transition-colors">
            OT-{order.id.slice(0, 6).toUpperCase()}
          </span>
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${STATUS_COLORS[status]}`}
          >
            {STATUS_LABELS[status]}
          </span>
          {order.received_at && (
            <span className="text-gray-600 text-xs">{daysAgo(order.received_at)}</span>
          )}
        </div>
        {order.vehicle && (
          <p className="text-gray-400 text-sm mt-0.5">
            {order.vehicle.brand} {order.vehicle.model} {order.vehicle.year}
            {order.vehicle.plate && (
              <span className="ml-1.5 font-mono text-xs bg-white/5 px-1.5 py-0.5 rounded text-gray-500">
                {order.vehicle.plate}
              </span>
            )}
          </p>
        )}
        {order.client?.full_name && (
          <p className="text-gray-600 text-xs mt-0.5">{order.client.full_name}</p>
        )}
        {order.description && (
          <p className="text-gray-600 text-xs mt-0.5 truncate max-w-sm">{order.description}</p>
        )}
      </div>
      <div className="shrink-0 text-right space-y-1">
        {cost != null && cost > 0 && (
          <p className="text-gray-300 text-sm font-medium">
            {fmt(cost)}
            {order.final_cost == null && order.estimated_cost != null && (
              <span className="text-gray-600 text-xs ml-1">est.</span>
            )}
          </p>
        )}
        <p className="text-gray-600 text-xs">{fmtDate(order.received_at)}</p>
      </div>
    </Link>
  );
}

// ── Data fetching ──────────────────────────────────────────────────────────

async function getMechanicData(id: string) {
  const supabase = await createClient();

  const [{ data: profile }, { data: rawOrders }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, full_name, email, phone, created_at")
      .eq("id", id)
      .eq("role", "mechanic")
      .maybeSingle(),
    supabase
      .from("work_orders")
      .select(
        "id, status, description, diagnosis, estimated_cost, final_cost, received_at, delivered_at, " +
        "vehicle:vehicles(brand, model, year, plate), " +
        "client:profiles!work_orders_client_id_fkey(full_name, email)"
      )
      .eq("mechanic_id", id)
      .order("received_at", { ascending: false }),
  ]);

  if (!profile) return null;

  const orders = (rawOrders ?? []) as unknown as WorkOrder[];
  const activeOrders = orders.filter((o) => o.status !== "delivered");
  const deliveredOrders = orders.filter((o) => o.status === "delivered");
  const revenue = deliveredOrders.reduce(
    (sum, o) => sum + (o.final_cost ?? o.estimated_cost ?? 0),
    0
  );

  // Monthly revenue last 6 months
  const now = new Date();
  const monthlyRevenue: { label: string; amount: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const label = d.toLocaleDateString("es-MX", { month: "short", year: "2-digit" });
    const amount = deliveredOrders
      .filter((o) => {
        const date = new Date(o.delivered_at ?? o.received_at ?? "");
        return date.getFullYear() === d.getFullYear() && date.getMonth() === d.getMonth();
      })
      .reduce((sum, o) => sum + (o.final_cost ?? o.estimated_cost ?? 0), 0);
    monthlyRevenue.push({ label, amount });
  }

  const completionRate =
    orders.length > 0 ? Math.round((deliveredOrders.length / orders.length) * 100) : 0;

  return {
    profile,
    orders,
    activeOrders,
    deliveredOrders,
    revenue,
    monthlyRevenue,
    completionRate,
  };
}

// ── Page ───────────────────────────────────────────────────────────────────

export default async function MecanicoDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await getMechanicData(id);

  if (!data) notFound();

  const { profile, orders, activeOrders, deliveredOrders, revenue, monthlyRevenue, completionRate } = data;

  const initials = (profile.full_name ?? profile.email)
    .split(" ")
    .map((w: string) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const workloadLabel =
    activeOrders.length === 0
      ? "Disponible"
      : activeOrders.length <= 2
      ? "Carga normal"
      : activeOrders.length <= 4
      ? "Ocupado"
      : "Sobrecargado";

  const workloadColor =
    activeOrders.length === 0
      ? "text-gray-500"
      : activeOrders.length <= 2
      ? "text-green-400"
      : activeOrders.length <= 4
      ? "text-yellow-400"
      : "text-red-400";

  const maxMonthly = Math.max(...monthlyRevenue.map((m) => m.amount), 1);

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard/mecanicos"
          className="text-gray-500 hover:text-white transition-colors"
          aria-label="Volver a mecánicos"
        >
          <IconArrowLeft />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white">
            {profile.full_name ?? profile.email}
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">Mecánico</p>
        </div>
      </div>

      {/* Profile + KPIs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Profile card */}
        <div className="bg-[#16213e] border border-white/10 rounded-xl p-6 flex flex-col gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-[#e94560]/15 border border-[#e94560]/30 flex items-center justify-center shrink-0">
              <span className="text-[#e94560] font-bold text-xl">{initials}</span>
            </div>
            <div className="min-w-0">
              <p className="text-white font-semibold truncate">
                {profile.full_name ?? "Sin nombre"}
              </p>
              <p className={`text-sm font-medium mt-0.5 ${workloadColor}`}>{workloadLabel}</p>
            </div>
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2 text-gray-400">
              <span className="text-gray-600"><IconMail /></span>
              <span className="truncate">{profile.email}</span>
            </div>
            {profile.phone && (
              <div className="flex items-center gap-2 text-gray-400">
                <span className="text-gray-600"><IconPhone /></span>
                <span>{profile.phone}</span>
              </div>
            )}
          </div>

          <div className="pt-2 border-t border-white/5">
            <p className="text-gray-600 text-xs">
              Miembro desde {fmtDate(profile.created_at)}
            </p>
          </div>

          <Link
            href={`/dashboard/ordenes/nueva?mechanic=${profile.id}`}
            className="mt-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#e94560]/10 hover:bg-[#e94560]/20 text-[#e94560] text-sm font-medium transition-colors"
          >
            <IconPlus />
            Nueva orden
          </Link>
        </div>

        {/* KPIs */}
        <div className="lg:col-span-2 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4 gap-4">
          <KpiCard
            label="Órdenes activas"
            value={activeOrders.length}
            sub="en proceso"
            accent={activeOrders.length > 0}
          />
          <KpiCard
            label="Entregadas"
            value={deliveredOrders.length}
            sub={`de ${orders.length} total`}
          />
          <KpiCard
            label="Completado"
            value={`${completionRate}%`}
            sub="tasa de entrega"
            accent={completionRate >= 80}
          />
          <KpiCard
            label="Ingresos"
            value={fmt(revenue)}
            sub="órdenes entregadas"
            accent
          />
        </div>
      </div>

      {/* Monthly revenue chart */}
      <div className="bg-[#16213e] border border-white/10 rounded-xl p-6">
        <p className="text-gray-400 text-xs uppercase tracking-wide font-medium mb-5">
          Ingresos por mes (últimos 6 meses)
        </p>
        <div className="space-y-3">
          {monthlyRevenue.map((m) => (
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
          {monthlyRevenue.every((m) => m.amount === 0) && (
            <p className="text-gray-600 text-sm text-center py-2">Sin ingresos registrados aún</p>
          )}
        </div>
      </div>

      {/* Active orders */}
      {activeOrders.length > 0 && (
        <div className="bg-[#16213e] border border-white/10 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-white/5 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#e94560] animate-pulse" aria-hidden="true" />
            <p className="text-gray-400 text-xs uppercase tracking-wide font-medium">
              Órdenes activas
            </p>
            <span className="ml-1 text-xs bg-[#e94560]/20 text-[#e94560] px-2 py-0.5 rounded-full font-medium">
              {activeOrders.length}
            </span>
          </div>
          <div>
            {activeOrders.map((order) => (
              <OrderRow key={order.id} order={order} />
            ))}
          </div>
        </div>
      )}

      {/* All orders history */}
      <div className="bg-[#16213e] border border-white/10 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between">
          <p className="text-gray-400 text-xs uppercase tracking-wide font-medium">
            Historial de órdenes
          </p>
          <span className="text-gray-600 text-xs">
            {orders.length} orden{orders.length !== 1 ? "es" : ""} en total
          </span>
        </div>
        {orders.length === 0 ? (
          <p className="text-gray-600 text-sm text-center py-10">
            Sin órdenes asignadas aún.
          </p>
        ) : (
          <div>
            {orders.map((order) => (
              <OrderRow key={order.id} order={order} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
