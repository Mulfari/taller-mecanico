import type { Metadata } from "next";

export const metadata: Metadata = { title: "Panel Principal — TallerPro" };

// --- Types matching DB schema ---
type WorkOrderStatus = "received" | "diagnosing" | "repairing" | "ready" | "delivered";
type AppointmentStatus = "pending" | "confirmed" | "completed" | "cancelled";

interface RecentOrder {
  id: string;
  client: string;
  vehicle: string;
  plate: string;
  status: WorkOrderStatus;
  mechanic: string;
  received_at: string;
  estimated_cost: number;
}

interface UpcomingAppointment {
  id: string;
  client: string;
  vehicle: string;
  date: string;
  time_slot: string;
  service_type: string;
  status: AppointmentStatus;
}

// --- Mock data (swap for Supabase queries later) ---
const METRICS = {
  activeOrders: 8,
  pendingAppointments: 5,
  vehiclesForSale: 12,
  lowStockItems: 3,
};

const RECENT_ORDERS: RecentOrder[] = [
  { id: "OT-0041", client: "Carlos Mendoza", vehicle: "Toyota Corolla 2019", plate: "ABC-123", status: "repairing", mechanic: "Luis García", received_at: "2026-04-29", estimated_cost: 4500 },
  { id: "OT-0040", client: "Ana Rodríguez", vehicle: "Honda Civic 2021", plate: "XYZ-789", status: "diagnosing", mechanic: "Pedro Soto", received_at: "2026-04-29", estimated_cost: 1200 },
  { id: "OT-0039", client: "Miguel Torres", vehicle: "Nissan Sentra 2018", plate: "DEF-456", status: "ready", mechanic: "Luis García", received_at: "2026-04-28", estimated_cost: 2800 },
  { id: "OT-0038", client: "Laura Jiménez", vehicle: "Chevrolet Spark 2020", plate: "GHI-321", status: "received", mechanic: "—", received_at: "2026-04-30", estimated_cost: 0 },
  { id: "OT-0037", client: "Roberto Díaz", vehicle: "Ford Focus 2017", plate: "JKL-654", status: "repairing", mechanic: "Pedro Soto", received_at: "2026-04-27", estimated_cost: 6200 },
];

const UPCOMING_APPOINTMENTS: UpcomingAppointment[] = [
  { id: "CIT-0021", client: "Sofía Vargas", vehicle: "Kia Sportage 2022", date: "2026-04-30", time_slot: "10:00", service_type: "Cambio de aceite", status: "confirmed" },
  { id: "CIT-0022", client: "Andrés Morales", vehicle: "Hyundai Tucson 2020", date: "2026-04-30", time_slot: "11:30", service_type: "Revisión de frenos", status: "confirmed" },
  { id: "CIT-0023", client: "Patricia Núñez", vehicle: "Mazda 3 2019", date: "2026-04-30", time_slot: "14:00", service_type: "Diagnóstico general", status: "pending" },
  { id: "CIT-0024", client: "Fernando Castro", vehicle: "Volkswagen Jetta 2021", date: "2026-05-01", time_slot: "09:00", service_type: "Alineación y balanceo", status: "confirmed" },
  { id: "CIT-0025", client: "Isabel Reyes", vehicle: "Renault Logan 2018", date: "2026-05-01", time_slot: "10:30", service_type: "Cambio de correa", status: "pending" },
];

// --- Status helpers ---
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

// --- Metric card icons ---
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

// --- Metric card ---
interface MetricCardProps {
  label: string;
  value: number;
  icon: React.ReactNode;
  accentClass: string;
  bgClass: string;
  note?: string;
}

function MetricCard({ label, value, icon, accentClass, bgClass, note }: MetricCardProps) {
  return (
    <div className="bg-[#16213e] border border-white/10 rounded-xl p-5 flex items-start gap-4">
      <div className={`shrink-0 w-12 h-12 rounded-lg flex items-center justify-center ${bgClass} ${accentClass}`}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-gray-400 text-sm leading-none mb-1">{label}</p>
        <p className={`text-3xl font-bold leading-none ${accentClass}`}>{value}</p>
        {note && <p className="text-gray-500 text-xs mt-1.5">{note}</p>}
      </div>
    </div>
  );
}

// --- Section header ---
function SectionHeader({ title, href, linkLabel }: { title: string; href: string; linkLabel: string }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-white font-semibold text-base">{title}</h2>
      <a href={href} className="text-[#e94560] text-sm hover:underline">{linkLabel}</a>
    </div>
  );
}

// --- Main page ---
export default function DashboardPage() {
  const today = new Date().toLocaleDateString("es-MX", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });

  const metrics: MetricCardProps[] = [
    {
      label: "Órdenes Activas",
      value: METRICS.activeOrders,
      icon: <IconWrench />,
      accentClass: "text-[#e94560]",
      bgClass: "bg-[#e94560]/10",
      note: "en proceso hoy",
    },
    {
      label: "Citas Pendientes",
      value: METRICS.pendingAppointments,
      icon: <IconCalendar />,
      accentClass: "text-blue-400",
      bgClass: "bg-blue-500/10",
      note: "para hoy y mañana",
    },
    {
      label: "Vehículos en Venta",
      value: METRICS.vehiclesForSale,
      icon: <IconCar />,
      accentClass: "text-yellow-400",
      bgClass: "bg-yellow-500/10",
      note: "disponibles",
    },
    {
      label: "Stock Bajo",
      value: METRICS.lowStockItems,
      icon: <IconAlert />,
      accentClass: "text-orange-400",
      bgClass: "bg-orange-500/10",
      note: "artículos bajo mínimo",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Panel Principal</h1>
        <p className="text-gray-500 text-sm mt-1 capitalize">{today}</p>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {metrics.map((m) => (
          <MetricCard key={m.label} {...m} />
        ))}
      </div>

      {/* Bottom grid: orders + appointments */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

        {/* Recent orders — wider column */}
        <div className="xl:col-span-3 bg-[#16213e] border border-white/10 rounded-xl p-5">
          <SectionHeader title="Órdenes Recientes" href="/dashboard/ordenes" linkLabel="Ver todas →" />
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
                {RECENT_ORDERS.map((order) => (
                  <tr key={order.id} className="hover:bg-white/3 transition-colors">
                    <td className="py-3 px-1">
                      <p className="text-[#e94560] font-mono text-xs">{order.id}</p>
                      <p className="text-white font-medium mt-0.5">{order.client}</p>
                    </td>
                    <td className="py-3 px-1">
                      <p className="text-gray-300">{order.vehicle}</p>
                      <p className="text-gray-500 text-xs mt-0.5">{order.plate}</p>
                    </td>
                    <td className="py-3 px-1">
                      <StatusBadge
                        label={ORDER_STATUS_LABELS[order.status]}
                        color={ORDER_STATUS_COLORS[order.status]}
                      />
                    </td>
                    <td className="py-3 px-1 text-right">
                      {order.estimated_cost > 0 ? (
                        <span className="text-gray-300 font-medium">
                          ${order.estimated_cost.toLocaleString("es-MX")}
                        </span>
                      ) : (
                        <span className="text-gray-600">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Upcoming appointments — narrower column */}
        <div className="xl:col-span-2 bg-[#16213e] border border-white/10 rounded-xl p-5">
          <SectionHeader title="Próximas Citas" href="/dashboard/citas" linkLabel="Ver agenda →" />
          <ul className="space-y-3">
            {UPCOMING_APPOINTMENTS.map((appt) => (
              <li key={appt.id} className="flex items-start gap-3 p-3 rounded-lg bg-white/3 hover:bg-white/5 transition-colors">
                {/* Time block */}
                <div className="shrink-0 text-center bg-[#1a1a2e] rounded-lg px-2.5 py-1.5 min-w-[52px]">
                  <p className="text-[#e94560] font-bold text-sm leading-none">{appt.time_slot}</p>
                  <p className="text-gray-500 text-xs mt-1 leading-none">
                    {new Date(appt.date + "T00:00:00").toLocaleDateString("es-MX", { day: "2-digit", month: "short" })}
                  </p>
                </div>
                {/* Details */}
                <div className="min-w-0 flex-1">
                  <p className="text-white text-sm font-medium truncate">{appt.client}</p>
                  <p className="text-gray-400 text-xs truncate mt-0.5">{appt.service_type}</p>
                  <p className="text-gray-600 text-xs truncate">{appt.vehicle}</p>
                </div>
                {/* Status */}
                <div className="shrink-0">
                  <StatusBadge
                    label={APPT_STATUS_LABELS[appt.status]}
                    color={APPT_STATUS_COLORS[appt.status]}
                  />
                </div>
              </li>
            ))}
          </ul>
        </div>

      </div>
    </div>
  );
}
