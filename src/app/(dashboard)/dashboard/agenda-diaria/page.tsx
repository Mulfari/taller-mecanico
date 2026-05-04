import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import PrintButton from "./PrintButton";

export const metadata = { title: "Agenda Diaria — TallerPro" };

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
  received: "bg-gray-500/20 text-gray-300 print:bg-gray-100 print:text-gray-700",
  diagnosing: "bg-yellow-500/20 text-yellow-300 print:bg-yellow-50 print:text-yellow-800",
  repairing: "bg-blue-500/20 text-blue-300 print:bg-blue-50 print:text-blue-800",
  ready: "bg-green-500/20 text-green-300 print:bg-green-50 print:text-green-800",
  delivered: "bg-gray-600/20 text-gray-500 print:bg-gray-50 print:text-gray-500",
};

const APPT_STATUS_LABELS: Record<AppointmentStatus, string> = {
  pending: "Pendiente",
  confirmed: "Confirmada",
  completed: "Completada",
  cancelled: "Cancelada",
};

const APPT_STATUS_COLORS: Record<AppointmentStatus, string> = {
  pending: "bg-yellow-500/20 text-yellow-300 print:bg-yellow-50 print:text-yellow-800",
  confirmed: "bg-blue-500/20 text-blue-300 print:bg-blue-50 print:text-blue-800",
  completed: "bg-green-500/20 text-green-300 print:bg-green-50 print:text-green-800",
  cancelled: "bg-red-500/20 text-red-400 print:bg-red-50 print:text-red-700",
};

function StatusBadge({ label, color }: { label: string; color: string }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${color}`}>
      {label}
    </span>
  );
}

function IconCalendar() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
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

const fmt = (n: number) =>
  `$${n.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

interface Appointment {
  id: string;
  date: string;
  time_slot: string;
  service_type: string;
  status: string;
  notes: string | null;
  client: { id: string; full_name: string | null; phone: string | null } | null;
  vehicle: { brand: string; model: string; year: number; plate: string | null } | null;
}

interface ActiveOrder {
  id: string;
  status: string;
  description: string | null;
  estimated_cost: number | null;
  final_cost: number | null;
  received_at: string;
  estimated_delivery: string | null;
  mechanic_id: string | null;
  mechanic: { id: string; full_name: string | null } | null;
  client: { full_name: string | null; phone: string | null } | null;
  vehicle: { brand: string; model: string; year: number; plate: string | null } | null;
}

async function getDailyAgendaData() {
  const supabase = await createClient();
  const today = new Date().toISOString().slice(0, 10);

  const [{ data: appointments }, { data: activeOrders }, { data: shopConfig }] = await Promise.all([
    supabase
      .from("appointments")
      .select(`
        id, date, time_slot, service_type, status, notes,
        client:profiles!appointments_client_id_fkey(id, full_name, phone),
        vehicle:vehicles!appointments_vehicle_id_fkey(brand, model, year, plate)
      `)
      .eq("date", today)
      .in("status", ["pending", "confirmed"])
      .order("time_slot", { ascending: true }),
    supabase
      .from("work_orders")
      .select(`
        id, status, description, estimated_cost, final_cost, received_at, estimated_delivery, mechanic_id,
        mechanic:profiles!work_orders_mechanic_id_fkey(id, full_name),
        client:profiles!work_orders_client_id_fkey(full_name, phone),
        vehicle:vehicles(brand, model, year, plate)
      `)
      .in("status", ["received", "diagnosing", "repairing", "ready"])
      .order("received_at", { ascending: true }),
    supabase
      .from("shop_config")
      .select("name, phone, address")
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle(),
  ]);

  const appts = (appointments ?? []) as unknown as Appointment[];
  const orders = (activeOrders ?? []) as unknown as ActiveOrder[];

  const mechanicMap: Record<string, { name: string; orders: ActiveOrder[] }> = {};
  const unassigned: ActiveOrder[] = [];

  for (const order of orders) {
    const mechanic = Array.isArray(order.mechanic) ? order.mechanic[0] : order.mechanic;
    if (mechanic?.id) {
      if (!mechanicMap[mechanic.id]) {
        mechanicMap[mechanic.id] = { name: mechanic.full_name ?? "Sin nombre", orders: [] };
      }
      mechanicMap[mechanic.id].orders.push(order);
    } else {
      unassigned.push(order);
    }
  }

  const mechanics = Object.entries(mechanicMap)
    .sort((a, b) => a[1].name.localeCompare(b[1].name))
    .map(([id, data]) => ({ id, ...data }));

  return { appts, orders, mechanics, unassigned, shopConfig, today };
}

export default async function AgendaDiariaPage() {
  const { appts, orders, mechanics, unassigned, shopConfig, today } = await getDailyAgendaData();

  const todayFormatted = new Date(today + "T00:00:00").toLocaleDateString("es-MX", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const shopName = shopConfig?.name ?? "TallerPro";

  const statusSummary = {
    received: orders.filter((o) => o.status === "received").length,
    diagnosing: orders.filter((o) => o.status === "diagnosing").length,
    repairing: orders.filter((o) => o.status === "repairing").length,
    ready: orders.filter((o) => o.status === "ready").length,
  };

  return (
    <div className="space-y-6 print:space-y-4">
      {/* Print-only header */}
      <div className="hidden print:block print:mb-4">
        <div className="flex items-start justify-between border-b-2 border-gray-800 pb-3">
          <div>
            <p className="text-gray-900 font-bold text-2xl">{shopName}</p>
            {shopConfig?.address && <p className="text-gray-600 text-sm mt-1">{shopConfig.address}</p>}
            {shopConfig?.phone && <p className="text-gray-600 text-sm">Tel: {shopConfig.phone}</p>}
          </div>
          <div className="text-right">
            <p className="text-gray-900 font-bold text-xl">AGENDA DIARIA</p>
            <p className="text-gray-700 text-sm mt-1 capitalize">{todayFormatted}</p>
          </div>
        </div>
      </div>

      {/* Screen header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-2xl font-bold text-white">Agenda Diaria</h1>
          <p className="text-gray-500 text-sm mt-1 capitalize">{todayFormatted}</p>
        </div>
        <PrintButton />
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 print:grid-cols-4 print:gap-2">
        <div className="bg-[#16213e] border border-white/10 rounded-xl px-4 py-3 print:bg-white print:border print:border-gray-200 print:rounded-lg">
          <p className="text-gray-500 text-xs uppercase tracking-wide font-medium print:text-gray-400">Citas hoy</p>
          <p className="text-2xl font-bold text-[#e94560] mt-0.5 print:text-gray-900">{appts.length}</p>
        </div>
        <div className="bg-[#16213e] border border-white/10 rounded-xl px-4 py-3 print:bg-white print:border print:border-gray-200 print:rounded-lg">
          <p className="text-gray-500 text-xs uppercase tracking-wide font-medium print:text-gray-400">Órdenes activas</p>
          <p className="text-2xl font-bold text-white mt-0.5 print:text-gray-900">{orders.length}</p>
        </div>
        <div className="bg-[#16213e] border border-white/10 rounded-xl px-4 py-3 print:bg-white print:border print:border-gray-200 print:rounded-lg">
          <p className="text-gray-500 text-xs uppercase tracking-wide font-medium print:text-gray-400">En reparación</p>
          <p className="text-2xl font-bold text-blue-400 mt-0.5 print:text-gray-900">{statusSummary.repairing}</p>
        </div>
        <div className="bg-[#16213e] border border-white/10 rounded-xl px-4 py-3 print:bg-white print:border print:border-gray-200 print:rounded-lg">
          <p className="text-gray-500 text-xs uppercase tracking-wide font-medium print:text-gray-400">Listos p/ recoger</p>
          <p className="text-2xl font-bold text-green-400 mt-0.5 print:text-gray-900">{statusSummary.ready}</p>
        </div>
      </div>

      {/* Today's appointments */}
      <div className="bg-[#16213e] border border-white/10 rounded-xl overflow-hidden print:bg-white print:border print:border-gray-200 print:rounded-lg">
        <div className="px-5 py-4 border-b border-white/5 flex items-center gap-2 print:border-gray-200">
          <span className="text-[#e94560] print:text-gray-700"><IconCalendar /></span>
          <h2 className="text-white font-semibold text-base print:text-gray-900">
            Citas del día
          </h2>
          <span className="ml-1 text-xs bg-[#e94560]/20 text-[#e94560] px-2 py-0.5 rounded-full font-medium print:bg-gray-100 print:text-gray-700">
            {appts.length}
          </span>
        </div>

        {appts.length === 0 ? (
          <p className="text-gray-500 text-sm text-center py-8 print:text-gray-400 print:py-4">
            No hay citas programadas para hoy.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[600px]">
              <thead>
                <tr className="text-gray-500 text-xs uppercase tracking-wide border-b border-white/5 print:border-gray-200 print:text-gray-400">
                  <th className="text-left py-3 px-4 font-medium">Hora</th>
                  <th className="text-left py-3 px-4 font-medium">Cliente</th>
                  <th className="text-left py-3 px-4 font-medium">Vehículo</th>
                  <th className="text-left py-3 px-4 font-medium">Servicio</th>
                  <th className="text-left py-3 px-4 font-medium">Estado</th>
                  <th className="text-left py-3 px-4 font-medium print:hidden">Notas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 print:divide-gray-100">
                {appts.map((appt) => {
                  const client = Array.isArray(appt.client) ? appt.client[0] : appt.client;
                  const vehicle = Array.isArray(appt.vehicle) ? appt.vehicle[0] : appt.vehicle;
                  return (
                    <tr key={appt.id} className="hover:bg-white/[0.03] transition-colors print:hover:bg-transparent">
                      <td className="py-3 px-4">
                        <span className="text-[#e94560] font-bold text-sm print:text-gray-900">
                          {appt.time_slot}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <Link href={`/dashboard/citas/${appt.id}`} className="print:no-underline">
                          <p className="text-white font-medium print:text-gray-900">
                            {client?.full_name ?? "—"}
                          </p>
                          {client?.phone && (
                            <p className="text-gray-500 text-xs mt-0.5 print:text-gray-500">{client.phone}</p>
                          )}
                        </Link>
                      </td>
                      <td className="py-3 px-4">
                        {vehicle ? (
                          <>
                            <p className="text-gray-300 print:text-gray-800">
                              {vehicle.brand} {vehicle.model} {vehicle.year}
                            </p>
                            {vehicle.plate && (
                              <p className="text-gray-500 text-xs font-mono mt-0.5">{vehicle.plate}</p>
                            )}
                          </>
                        ) : (
                          <span className="text-gray-600">—</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-gray-300 print:text-gray-800">
                        {appt.service_type}
                      </td>
                      <td className="py-3 px-4">
                        <StatusBadge
                          label={APPT_STATUS_LABELS[appt.status as AppointmentStatus] ?? appt.status}
                          color={APPT_STATUS_COLORS[appt.status as AppointmentStatus] ?? "bg-gray-500/20 text-gray-400"}
                        />
                      </td>
                      <td className="py-3 px-4 print:hidden">
                        {appt.notes ? (
                          <p className="text-gray-500 text-xs truncate max-w-[160px]">{appt.notes}</p>
                        ) : (
                          <span className="text-gray-700">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Active orders by mechanic */}
      <div className="print:break-before-page">
        <div className="flex items-center gap-2 mb-4 print:mb-3">
          <span className="text-[#e94560] print:text-gray-700"><IconWrench /></span>
          <h2 className="text-white font-semibold text-base print:text-gray-900">
            Órdenes activas por mecánico
          </h2>
          <span className="ml-1 text-xs bg-white/10 text-gray-400 px-2 py-0.5 rounded-full font-medium print:bg-gray-100 print:text-gray-700">
            {orders.length}
          </span>
        </div>

        {mechanics.length === 0 && unassigned.length === 0 ? (
          <div className="bg-[#16213e] border border-white/10 rounded-xl py-8 text-center print:bg-white print:border print:border-gray-200">
            <p className="text-gray-500 text-sm print:text-gray-400">No hay órdenes activas.</p>
          </div>
        ) : (
          <div className="space-y-4 print:space-y-3">
            {mechanics.map((mech) => (
              <MechanicSection key={mech.id} name={mech.name} orders={mech.orders} />
            ))}
            {unassigned.length > 0 && (
              <MechanicSection name="Sin mecánico asignado" orders={unassigned} unassigned />
            )}
          </div>
        )}
      </div>

      {/* Print footer */}
      <div className="hidden print:block print:border-t print:border-gray-300 print:pt-3 print:mt-6">
        <p className="text-gray-400 text-xs text-center">
          Agenda generada por {shopName} · {todayFormatted}
        </p>
      </div>
    </div>
  );
}

function MechanicSection({
  name,
  orders,
  unassigned,
}: {
  name: string;
  orders: ActiveOrder[];
  unassigned?: boolean;
}) {
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="bg-[#16213e] border border-white/10 rounded-xl overflow-hidden print:bg-white print:border print:border-gray-200 print:rounded-lg">
      {/* Mechanic header */}
      <div className="px-5 py-3 border-b border-white/5 flex items-center gap-3 print:border-gray-200 print:bg-gray-50">
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${
            unassigned
              ? "bg-gray-500/20 text-gray-400 border border-gray-500/30 print:bg-gray-100 print:text-gray-500 print:border-gray-300"
              : "bg-[#e94560]/15 text-[#e94560] border border-[#e94560]/30 print:bg-gray-100 print:text-gray-700 print:border-gray-300"
          }`}
        >
          {unassigned ? "?" : initials}
        </div>
        <div className="flex-1 min-w-0">
          <p className={`font-semibold text-sm ${unassigned ? "text-gray-400" : "text-white"} print:text-gray-900`}>
            {name}
          </p>
        </div>
        <span className="text-xs bg-white/10 text-gray-400 px-2 py-0.5 rounded-full font-medium print:bg-gray-100 print:text-gray-600">
          {orders.length} orden{orders.length !== 1 ? "es" : ""}
        </span>
      </div>

      {/* Orders table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[650px]">
          <thead>
            <tr className="text-gray-500 text-xs uppercase tracking-wide border-b border-white/5 print:border-gray-200 print:text-gray-400">
              <th className="text-left py-2.5 px-4 font-medium">OT</th>
              <th className="text-left py-2.5 px-4 font-medium">Cliente</th>
              <th className="text-left py-2.5 px-4 font-medium">Vehículo</th>
              <th className="text-left py-2.5 px-4 font-medium">Estado</th>
              <th className="text-left py-2.5 px-4 font-medium">Descripción</th>
              <th className="text-right py-2.5 px-4 font-medium">Costo</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 print:divide-gray-100">
            {orders.map((order) => {
              const client = Array.isArray(order.client) ? order.client[0] : order.client;
              const vehicle = Array.isArray(order.vehicle) ? order.vehicle[0] : order.vehicle;
              const cost = order.final_cost ?? order.estimated_cost;
              const status = order.status as WorkOrderStatus;
              return (
                <tr key={order.id} className="hover:bg-white/[0.03] transition-colors print:hover:bg-transparent">
                  <td className="py-2.5 px-4">
                    <Link
                      href={`/dashboard/ordenes/${order.id}`}
                      className="text-[#e94560] font-mono text-xs hover:underline print:text-gray-700 print:no-underline"
                    >
                      OT-{order.id.slice(0, 6).toUpperCase()}
                    </Link>
                  </td>
                  <td className="py-2.5 px-4">
                    <p className="text-white text-sm print:text-gray-900">{client?.full_name ?? "—"}</p>
                    {client?.phone && (
                      <p className="text-gray-600 text-xs mt-0.5 print:text-gray-500">{client.phone}</p>
                    )}
                  </td>
                  <td className="py-2.5 px-4">
                    {vehicle ? (
                      <>
                        <p className="text-gray-300 print:text-gray-800">
                          {vehicle.brand} {vehicle.model} {vehicle.year}
                        </p>
                        {vehicle.plate && (
                          <p className="text-gray-500 text-xs font-mono mt-0.5">{vehicle.plate}</p>
                        )}
                      </>
                    ) : (
                      <span className="text-gray-600">—</span>
                    )}
                  </td>
                  <td className="py-2.5 px-4">
                    <StatusBadge
                      label={ORDER_STATUS_LABELS[status]}
                      color={ORDER_STATUS_COLORS[status]}
                    />
                  </td>
                  <td className="py-2.5 px-4">
                    <p className="text-gray-400 text-xs truncate max-w-[200px] print:text-gray-600 print:max-w-none print:whitespace-normal">
                      {order.description ?? "—"}
                    </p>
                    {order.estimated_delivery && (
                      <p className="text-gray-600 text-xs mt-0.5 print:text-gray-500">
                        Entrega: {new Date(order.estimated_delivery.includes("T") ? order.estimated_delivery : order.estimated_delivery + "T00:00:00").toLocaleDateString("es-MX", { day: "2-digit", month: "short" })}
                      </p>
                    )}
                  </td>
                  <td className="py-2.5 px-4 text-right">
                    {cost != null && cost > 0 ? (
                      <span className="text-gray-300 text-sm font-medium print:text-gray-800">
                        {fmt(cost)}
                      </span>
                    ) : (
                      <span className="text-gray-600">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
