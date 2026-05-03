import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import AppointmentActions from "./AppointmentActions";
import type { AppointmentStatus } from "@/types/database";

export const metadata = { title: "Detalle de cita — TallerPro" };

// ── Icons ──────────────────────────────────────────────────────────────────

function IconArrowLeft() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
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

function IconUser() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
    </svg>
  );
}

function IconCar() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
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

function IconPhone() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
    </svg>
  );
}

// ── Constants ──────────────────────────────────────────────────────────────

const STATUS_LABELS: Record<AppointmentStatus, string> = {
  pending: "Pendiente",
  confirmed: "Confirmada",
  completed: "Completada",
  cancelled: "Cancelada",
};

const STATUS_BADGE: Record<AppointmentStatus, string> = {
  pending: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
  confirmed: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  completed: "bg-green-500/20 text-green-300 border-green-500/30",
  cancelled: "bg-gray-500/20 text-gray-400 border-gray-500/30",
};

const STATUS_DOT: Record<AppointmentStatus, string> = {
  pending: "bg-yellow-400",
  confirmed: "bg-blue-400",
  completed: "bg-green-400",
  cancelled: "bg-gray-500",
};

// ── Helpers ────────────────────────────────────────────────────────────────

function fmtDate(d: string) {
  return new Date(d + "T00:00:00").toLocaleDateString("es-MX", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function fmtCreated(d: string) {
  return new Date(d).toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function InfoRow({ label, value, icon }: { label: string; value: React.ReactNode; icon?: React.ReactNode }) {
  return (
    <div>
      <p className="text-gray-500 text-xs uppercase tracking-wide font-medium mb-1">{label}</p>
      <div className="flex items-center gap-1.5 text-gray-200 text-sm">
        {icon && <span className="text-gray-500 shrink-0">{icon}</span>}
        <span>{value}</span>
      </div>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-[#16213e] border border-white/10 rounded-xl p-5 space-y-4">
      <h2 className="text-gray-400 text-xs uppercase tracking-wide font-medium">{title}</h2>
      {children}
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────

export default async function CitaDetallePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: appt } = await supabase
    .from("appointments")
    .select(`
      id, date, time_slot, service_type, status, notes, created_at,
      client:profiles!appointments_client_id_fkey(id, full_name, email, phone),
      vehicle:vehicles!appointments_vehicle_id_fkey(id, brand, model, year, plate, color, mileage)
    `)
    .eq("id", id)
    .maybeSingle();

  if (!appt) notFound();

  // Normalize joined relations (Supabase may return array or object)
  const client = Array.isArray(appt.client) ? appt.client[0] ?? null : appt.client;
  const vehicle = Array.isArray(appt.vehicle) ? appt.vehicle[0] ?? null : appt.vehicle;

  const status = appt.status as AppointmentStatus;
  const shortId = `CITA-${appt.id.slice(0, 6).toUpperCase()}`;

  // Fetch related work orders for this appointment's client + vehicle (if any)
  const { data: relatedOrders } = vehicle && client
    ? await supabase
        .from("work_orders")
        .select("id, status, description, created_at")
        .eq("client_id", client.id)
        .eq("vehicle_id", vehicle.id)
        .order("created_at", { ascending: false })
        .limit(5)
    : { data: [] };

  const WO_STATUS_LABELS: Record<string, string> = {
    received: "Recibido",
    diagnosing: "Diagnóstico",
    repairing: "En reparación",
    ready: "Listo",
    delivered: "Entregado",
  };

  const WO_STATUS_COLORS: Record<string, string> = {
    received: "bg-gray-500/20 text-gray-300",
    diagnosing: "bg-yellow-500/20 text-yellow-300",
    repairing: "bg-blue-500/20 text-blue-300",
    ready: "bg-green-500/20 text-green-300",
    delivered: "bg-gray-600/20 text-gray-500",
  };

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/citas"
            className="text-gray-500 hover:text-white transition-colors"
            aria-label="Volver a citas"
          >
            <IconArrowLeft />
          </Link>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-bold text-white font-mono">{shortId}</h1>
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${STATUS_BADGE[status]}`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[status]}`} />
                {STATUS_LABELS[status]}
              </span>
            </div>
            <p className="text-gray-500 text-sm mt-0.5">
              Solicitada el {fmtCreated(appt.created_at)}
            </p>
          </div>
        </div>
      </div>

      {/* Date & service highlight */}
      <div className="bg-[#16213e] border border-white/10 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-[#e94560]/10 border border-[#e94560]/20 flex items-center justify-center text-[#e94560] shrink-0">
          <IconCalendar />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white font-semibold text-lg capitalize">{fmtDate(appt.date)}</p>
          <p className="text-gray-400 text-sm mt-0.5">
            {appt.time_slot} hs · <span className="text-gray-300">{appt.service_type}</span>
          </p>
        </div>
      </div>

      {/* Actions */}
      <AppointmentActions appointmentId={appt.id} status={status} />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Client */}
        {client && (
          <Card title="Cliente">
            <div className="space-y-3">
              <InfoRow
                label="Nombre"
                value={
                  <Link
                    href={`/dashboard/clientes/${client.id}`}
                    className="text-[#e94560] hover:text-[#c73652] transition-colors font-medium"
                  >
                    {client.full_name ?? client.email}
                  </Link>
                }
                icon={<IconUser />}
              />
              {client.email && (
                <InfoRow label="Email" value={client.email} />
              )}
              {client.phone && (
                <InfoRow label="Teléfono" value={client.phone} icon={<IconPhone />} />
              )}
            </div>
          </Card>
        )}

        {/* Vehicle */}
        {vehicle ? (
          <Card title="Vehículo">
            <div className="space-y-3">
              <InfoRow
                label="Modelo"
                value={
                  <Link
                    href={`/dashboard/vehiculos/${vehicle.id}`}
                    className="text-[#e94560] hover:text-[#c73652] transition-colors font-medium"
                  >
                    {vehicle.brand} {vehicle.model} {vehicle.year}
                  </Link>
                }
                icon={<IconCar />}
              />
              {vehicle.plate && (
                <InfoRow label="Patente" value={vehicle.plate} />
              )}
              {vehicle.color && (
                <InfoRow label="Color" value={vehicle.color} />
              )}
              {vehicle.mileage != null && (
                <InfoRow
                  label="Kilometraje"
                  value={`${vehicle.mileage.toLocaleString("es-MX")} km`}
                />
              )}
            </div>
          </Card>
        ) : (
          <Card title="Vehículo">
            <p className="text-gray-600 text-sm">Sin vehículo asociado</p>
          </Card>
        )}
      </div>

      {/* Notes */}
      {appt.notes && (
        <Card title="Notas del cliente">
          <p className="text-gray-300 text-sm leading-relaxed bg-[#1a1a2e] rounded-lg px-4 py-3 border border-white/5">
            {appt.notes}
          </p>
        </Card>
      )}

      {/* Related work orders */}
      {(relatedOrders ?? []).length > 0 && (
        <Card title="Órdenes de trabajo relacionadas">
          <div className="space-y-2">
            {(relatedOrders ?? []).map((order) => (
              <Link
                key={order.id}
                href={`/dashboard/ordenes/${order.id}`}
                className="flex items-center justify-between gap-3 py-2.5 px-3 rounded-lg bg-[#1a1a2e] border border-white/5 hover:border-[#e94560]/30 transition-colors group"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-[#e94560] shrink-0">
                    <IconWrench />
                  </span>
                  <span className="text-gray-300 text-sm font-mono group-hover:text-white transition-colors truncate">
                    OT-{order.id.slice(0, 6).toUpperCase()}
                  </span>
                  {order.description && (
                    <span className="text-gray-500 text-xs truncate hidden sm:block">
                      · {order.description}
                    </span>
                  )}
                </div>
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium shrink-0 ${
                    WO_STATUS_COLORS[order.status] ?? "bg-gray-500/20 text-gray-400"
                  }`}
                >
                  {WO_STATUS_LABELS[order.status] ?? order.status}
                </span>
              </Link>
            ))}
          </div>
        </Card>
      )}

      {/* Footer */}
      <div className="flex flex-col sm:flex-row gap-3 pt-2 border-t border-white/5">
        <Link
          href="/dashboard/citas"
          className="flex-1 text-center py-3 px-6 rounded-xl font-semibold text-gray-300 border border-white/10 hover:border-white/20 hover:text-white transition-colors text-sm"
        >
          Volver a citas
        </Link>
        {client && (
          <Link
            href={`/dashboard/clientes/${client.id}`}
            className="flex-1 text-center py-3 px-6 rounded-xl font-semibold text-gray-300 border border-white/10 hover:border-white/20 hover:text-white transition-colors text-sm"
          >
            Ver perfil del cliente
          </Link>
        )}
        {status !== "completed" && status !== "cancelled" && (
          <Link
            href={`/dashboard/ordenes/nueva?client=${client?.id ?? ""}&vehicle=${vehicle?.id ?? ""}`}
            className="flex-1 text-center py-3 px-6 rounded-xl font-semibold text-white bg-[#e94560] hover:bg-[#c73652] transition-colors text-sm"
          >
            Nueva orden de trabajo
          </Link>
        )}
      </div>
    </div>
  );
}
