import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Mecánicos — TallerPro" };

// ── Types ──────────────────────────────────────────────────────────────────

type WorkOrderStatus = "received" | "diagnosing" | "repairing" | "ready" | "delivered";

interface ActiveOrder {
  id: string;
  status: WorkOrderStatus;
  description: string | null;
  received_at: string | null;
  vehicle: { brand: string; model: string; year: number; plate: string | null } | null;
  client: { full_name: string | null; email: string } | null;
}

interface RawOrder {
  id: string;
  mechanic_id: string | null;
  status: WorkOrderStatus;
  description: string | null;
  received_at: string | null;
  final_cost: number | null;
  estimated_cost: number | null;
  vehicle: { brand: string; model: string; year: number; plate: string | null } | null;
  client: { full_name: string | null; email: string } | null;
}

interface Mechanic {
  id: string;
  full_name: string | null;
  email: string;
  phone: string | null;
  activeOrders: ActiveOrder[];
  deliveredCount: number;
  revenue: number;
}

// ── Icons ──────────────────────────────────────────────────────────────────

function IconHardHat() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437l1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008z" />
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

function IconPhone() {
  return (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
    </svg>
  );
}

function IconCar() {
  return (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
    </svg>
  );
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
  received: "bg-gray-500/20 text-gray-300",
  diagnosing: "bg-yellow-500/20 text-yellow-300",
  repairing: "bg-blue-500/20 text-blue-300",
  ready: "bg-green-500/20 text-green-300",
  delivered: "bg-gray-600/20 text-gray-500",
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

function daysAgo(dateStr: string | null): string {
  if (!dateStr) return "";
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86_400_000);
  if (diff === 0) return "hoy";
  if (diff === 1) return "ayer";
  return `hace ${diff} días`;
}

// ── Data fetching ──────────────────────────────────────────────────────────

async function getMechanicsData(): Promise<Mechanic[]> {
  const supabase = await createClient();

  const [{ data: profiles }, { data: rawOrders }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, full_name, email, phone")
      .eq("role", "mechanic")
      .order("full_name"),
    supabase
      .from("work_orders")
      .select(
        "id, mechanic_id, status, description, received_at, final_cost, estimated_cost, " +
        "vehicle:vehicles(brand, model, year, plate), " +
        "client:profiles!work_orders_client_id_fkey(full_name, email)"
      )
      .not("mechanic_id", "is", null),
  ]);

  const orders = (rawOrders ?? []) as unknown as RawOrder[];

  const mechanics: Mechanic[] = (profiles ?? []).map((p) => {
    const myOrders = (orders ?? []).filter((o) => o.mechanic_id === p.id);
    const active = myOrders.filter((o) => o.status !== "delivered") as ActiveOrder[];
    const delivered = myOrders.filter((o) => o.status === "delivered");
    const revenue = delivered.reduce(
      (sum, o) => sum + ((o.final_cost ?? o.estimated_cost ?? 0) as number),
      0
    );
    return {
      id: p.id,
      full_name: p.full_name,
      email: p.email,
      phone: p.phone,
      activeOrders: active,
      deliveredCount: delivered.length,
      revenue,
    };
  });

  return mechanics;
}

// ── Sub-components ─────────────────────────────────────────────────────────

function StatPill({ label, value, accent }: { label: string; value: string | number; accent?: boolean }) {
  return (
    <div className="text-center">
      <p className={`text-xl font-bold ${accent ? "text-[#e94560]" : "text-white"}`}>{value}</p>
      <p className="text-gray-500 text-xs mt-0.5">{label}</p>
    </div>
  );
}

function MechanicCard({ mechanic }: { mechanic: Mechanic }) {
  const initials = (mechanic.full_name ?? mechanic.email)
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const workloadColor =
    mechanic.activeOrders.length === 0
      ? "text-gray-600"
      : mechanic.activeOrders.length <= 2
      ? "text-green-400"
      : mechanic.activeOrders.length <= 4
      ? "text-yellow-400"
      : "text-red-400";

  return (
    <div className="bg-[#16213e] border border-white/10 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 flex items-start gap-4 border-b border-white/5">
        <Link
          href={`/dashboard/mecanicos/${mechanic.id}`}
          className="w-12 h-12 rounded-full bg-[#e94560]/15 border border-[#e94560]/30 flex items-center justify-center shrink-0 hover:bg-[#e94560]/25 transition-colors"
        >
          <span className="text-[#e94560] font-bold text-sm">{initials}</span>
        </Link>
        <div className="flex-1 min-w-0">
          <Link
            href={`/dashboard/mecanicos/${mechanic.id}`}
            className="text-white font-semibold truncate hover:text-[#e94560] transition-colors block"
          >
            {mechanic.full_name ?? mechanic.email}
          </Link>
          <p className="text-gray-500 text-xs truncate">{mechanic.email}</p>
          {mechanic.phone && (
            <p className="text-gray-500 text-xs flex items-center gap-1 mt-0.5">
              <IconPhone /> {mechanic.phone}
            </p>
          )}
        </div>
        <Link
          href={`/dashboard/ordenes/nueva?mechanic=${mechanic.id}`}
          className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#e94560]/10 text-[#e94560] hover:bg-[#e94560]/20 text-xs font-medium transition-colors"
          title="Nueva orden para este mecánico"
        >
          <IconPlus /> Orden
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 divide-x divide-white/5 px-2 py-3">
        <StatPill
          label="Activas"
          value={mechanic.activeOrders.length}
          accent={mechanic.activeOrders.length > 0}
        />
        <StatPill label="Entregadas" value={mechanic.deliveredCount} />
        <StatPill label="Ingresos" value={fmt(mechanic.revenue)} />
      </div>

      {/* Active orders */}
      <div className="border-t border-white/5">
        {mechanic.activeOrders.length === 0 ? (
          <p className="text-gray-600 text-sm text-center py-5">Sin órdenes activas</p>
        ) : (
          <ul className="divide-y divide-white/5">
            {mechanic.activeOrders.slice(0, 5).map((order) => (
              <li key={order.id}>
                <Link
                  href={`/dashboard/ordenes/${order.id}`}
                  className="flex items-start gap-3 px-5 py-3 hover:bg-white/[0.03] transition-colors group"
                >
                  <span
                    className={`mt-0.5 w-2 h-2 rounded-full shrink-0 ${STATUS_DOT[order.status]}`}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      {order.vehicle ? (
                        <span className="text-gray-200 text-sm font-medium group-hover:text-white transition-colors flex items-center gap-1">
                          <IconCar />
                          {order.vehicle.brand} {order.vehicle.model} {order.vehicle.year}
                        </span>
                      ) : (
                        <span className="text-gray-500 text-sm">Vehículo desconocido</span>
                      )}
                      {order.vehicle?.plate && (
                        <span className="font-mono text-xs bg-white/5 px-1.5 py-0.5 rounded text-gray-400">
                          {order.vehicle.plate}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[order.status]}`}
                      >
                        {STATUS_LABELS[order.status]}
                      </span>
                      {order.received_at && (
                        <span className="text-gray-600 text-xs">{daysAgo(order.received_at)}</span>
                      )}
                    </div>
                    {order.client?.full_name && (
                      <p className="text-gray-500 text-xs mt-0.5 truncate">
                        {order.client.full_name}
                      </p>
                    )}
                  </div>
                </Link>
              </li>
            ))}
            {mechanic.activeOrders.length > 5 && (
              <li className="px-5 py-2 text-center">
                <span className="text-gray-600 text-xs">
                  +{mechanic.activeOrders.length - 5} más
                </span>
              </li>
            )}
          </ul>
        )}
      </div>

      {/* Workload indicator */}
      <div className="px-5 py-3 border-t border-white/5 flex items-center justify-between">
        <span className="text-gray-600 text-xs">Carga de trabajo</span>
        <span className={`text-xs font-semibold ${workloadColor}`}>
          {mechanic.activeOrders.length === 0
            ? "Disponible"
            : mechanic.activeOrders.length <= 2
            ? "Normal"
            : mechanic.activeOrders.length <= 4
            ? "Ocupado"
            : "Sobrecargado"}
        </span>
      </div>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────

export default async function MecanicosPage() {
  const mechanics = await getMechanicsData();

  const totalActive = mechanics.reduce((s, m) => s + m.activeOrders.length, 0);
  const totalDelivered = mechanics.reduce((s, m) => s + m.deliveredCount, 0);
  const totalRevenue = mechanics.reduce((s, m) => s + m.revenue, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Mecánicos</h1>
          <p className="text-gray-500 text-sm mt-1">
            {mechanics.length} mecánico{mechanics.length !== 1 ? "s" : ""} registrado{mechanics.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {/* Summary KPIs */}
      {mechanics.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Mecánicos", value: mechanics.length },
            { label: "Órdenes activas", value: totalActive, accent: totalActive > 0 },
            { label: "Entregadas", value: totalDelivered },
            { label: "Ingresos totales", value: fmt(totalRevenue), accent: true },
          ].map((kpi) => (
            <div
              key={kpi.label}
              className="bg-[#16213e] border border-white/10 rounded-xl px-5 py-4"
            >
              <p className="text-gray-500 text-xs uppercase tracking-wide">{kpi.label}</p>
              <p className={`text-2xl font-bold mt-1 ${kpi.accent ? "text-[#e94560]" : "text-white"}`}>
                {kpi.value}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Mechanic cards */}
      {mechanics.length === 0 ? (
        <div className="bg-[#16213e] border border-white/10 rounded-xl py-20 text-center">
          <div className="flex justify-center mb-4 text-gray-600">
            <IconHardHat />
          </div>
          <p className="text-gray-400 font-medium">No hay mecánicos registrados</p>
          <p className="text-gray-600 text-sm mt-1">
            Crea usuarios con rol <span className="font-mono text-gray-500">mechanic</span> en Supabase para verlos aquí.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5">
          {mechanics.map((m) => (
            <MechanicCard key={m.id} mechanic={m} />
          ))}
        </div>
      )}
    </div>
  );
}
