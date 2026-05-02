import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { notFound } from "next/navigation";
import EditVehicleButton from "./EditVehicleButton";

function IconArrowLeft() {
  return <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>;
}
function IconWrench() {
  return <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437l1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008z" /></svg>;
}
function IconUser() {
  return <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>;
}

type WorkOrderStatus = "received" | "diagnosing" | "repairing" | "ready" | "delivered";
type AppointmentStatus = "pending" | "confirmed" | "completed" | "cancelled";

const WO_STATUS_LABELS: Record<WorkOrderStatus, string> = {
  received: "Recibido",
  diagnosing: "Diagnóstico",
  repairing: "En reparación",
  ready: "Listo",
  delivered: "Entregado",
};
const WO_STATUS_COLORS: Record<WorkOrderStatus, string> = {
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
  cancelled: "bg-red-500/20 text-red-300",
};

function formatDate(d: string) {
  return new Date(d + "T00:00:00").toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" });
}

function InfoField({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-gray-500 text-xs uppercase tracking-wide mb-1">{label}</p>
      <p className="text-gray-200 text-sm">{value ?? <span className="text-gray-600">—</span>}</p>
    </div>
  );
}

export default async function VehiculoDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: vehicle } = await supabase
    .from("vehicles")
    .select(`
      id, brand, model, year, plate, color, vin, mileage, notes, created_at,
      owner:profiles!vehicles_owner_id_fkey(id, full_name, email, phone)
    `)
    .eq("id", id)
    .maybeSingle();

  if (!vehicle) notFound();

  const owner = Array.isArray(vehicle.owner) ? (vehicle.owner[0] ?? null) : vehicle.owner as { id: string; full_name: string | null; email: string; phone: string | null } | null;

  const [{ data: workOrders }, { data: appointments }] = await Promise.all([
    supabase
      .from("work_orders")
      .select("id, status, description, received_at, estimated_cost, final_cost, mechanic:profiles!work_orders_mechanic_id_fkey(full_name)")
      .eq("vehicle_id", id)
      .order("received_at", { ascending: false }),
    supabase
      .from("appointments")
      .select("id, date, time_slot, service_type, status")
      .eq("vehicle_id", id)
      .order("date", { ascending: false }),
  ]);

  const title = `${vehicle.brand} ${vehicle.model} ${vehicle.year}`;

  return (
    <div className="space-y-6">
      {/* Back + header */}
      <div>
        <Link href="/dashboard/vehiculos" className="inline-flex items-center gap-1.5 text-gray-500 hover:text-white text-sm transition-colors mb-4">
          <IconArrowLeft /> Vehículos
        </Link>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold text-white">{title}</h1>
            <p className="text-gray-500 text-sm mt-1">
              Registrado el {formatDate(vehicle.created_at)}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <EditVehicleButton vehicle={{
              id: vehicle.id,
              brand: vehicle.brand,
              model: vehicle.model,
              year: vehicle.year,
              plate: vehicle.plate,
              color: vehicle.color,
              vin: vehicle.vin,
              mileage: vehicle.mileage,
              notes: vehicle.notes,
            }} />
            <Link
              href={`/dashboard/ordenes/nueva?vehicle=${id}${owner ? `&client=${owner.id}` : ""}`}
              className="inline-flex items-center gap-2 bg-[#e94560] hover:bg-[#c73652] text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
            >
              <IconWrench />
              Nueva orden
            </Link>
          </div>
        </div>
      </div>

      {/* Vehicle info */}
      <div className="bg-[#16213e] border border-white/10 rounded-xl p-5">
        <h2 className="text-white font-semibold mb-4">Datos del vehículo</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          <InfoField label="Marca" value={vehicle.brand} />
          <InfoField label="Modelo" value={vehicle.model} />
          <InfoField label="Año" value={vehicle.year} />
          <InfoField label="Placa" value={vehicle.plate} />
          <InfoField label="Color" value={vehicle.color} />
          <InfoField label="Kilometraje" value={vehicle.mileage ? `${vehicle.mileage.toLocaleString("es-MX")} km` : null} />
          <InfoField label="VIN" value={vehicle.vin ? <span className="font-mono text-xs">{vehicle.vin}</span> : null} />
        </div>
        {vehicle.notes && (
          <div className="mt-4 pt-4 border-t border-white/5">
            <p className="text-gray-500 text-xs uppercase tracking-wide mb-1">Notas</p>
            <p className="text-gray-300 text-sm whitespace-pre-line">{vehicle.notes}</p>
          </div>
        )}
      </div>

      {/* Owner */}
      <div className="bg-[#16213e] border border-white/10 rounded-xl p-5">
        <h2 className="text-white font-semibold mb-4 flex items-center gap-2">
          <IconUser />
          Propietario
        </h2>
        {owner ? (
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 flex-1">
              <InfoField label="Nombre" value={owner.full_name} />
              <InfoField label="Correo" value={owner.email} />
              <InfoField label="Teléfono" value={owner.phone} />
            </div>
            <Link
              href={`/dashboard/clientes/${owner.id}`}
              className="shrink-0 text-sm text-[#e94560] hover:underline"
            >
              Ver perfil →
            </Link>
          </div>
        ) : (
          <p className="text-gray-600 text-sm">Sin propietario registrado.</p>
        )}
      </div>

      {/* Work orders */}
      <div className="bg-[#16213e] border border-white/10 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-white/5">
          <h2 className="text-white font-semibold">
            Órdenes de trabajo
            <span className="text-xs text-gray-500 font-normal ml-2">({workOrders?.length ?? 0})</span>
          </h2>
        </div>
        {!workOrders || workOrders.length === 0 ? (
          <p className="py-10 text-center text-gray-600 text-sm">Sin órdenes de trabajo.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[520px]">
              <thead>
                <tr className="text-gray-500 text-xs uppercase tracking-wide border-b border-white/5">
                  <th className="text-left py-3 px-5 font-medium">OT / Descripción</th>
                  <th className="text-left py-3 px-4 font-medium">Mecánico</th>
                  <th className="text-left py-3 px-4 font-medium">Estado</th>
                  <th className="text-left py-3 px-4 font-medium">Fecha</th>
                  <th className="text-right py-3 px-5 font-medium">Costo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {workOrders.map((wo) => {
                  const mechanic = (wo.mechanic as unknown as { full_name: string | null }[] | null);
                  const mechanicName = Array.isArray(mechanic) ? mechanic[0]?.full_name : null;
                  const status = wo.status as WorkOrderStatus;
                  return (
                    <tr key={wo.id} className="hover:bg-white/[0.03] transition-colors">
                      <td className="py-3.5 px-5">
                        <Link href={`/dashboard/ordenes/${wo.id}`} className="text-[#e94560] font-mono text-xs hover:underline">
                          #{wo.id.slice(0, 8).toUpperCase()}
                        </Link>
                        <p className="text-gray-300 text-xs mt-0.5 max-w-[220px] truncate">{wo.description}</p>
                      </td>
                      <td className="py-3.5 px-4 text-gray-400 text-xs">
                        {mechanicName ?? <span className="text-gray-600">—</span>}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${WO_STATUS_COLORS[status]}`}>
                          {WO_STATUS_LABELS[status]}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-gray-400 text-xs whitespace-nowrap">
                        {formatDate(wo.received_at)}
                      </td>
                      <td className="py-3.5 px-5 text-right text-gray-300 text-xs">
                        {(wo.final_cost ?? 0) > 0
                          ? `$${wo.final_cost!.toLocaleString("es-MX")}`
                          : (wo.estimated_cost ?? 0) > 0
                            ? <span className="text-gray-500">Est. ${wo.estimated_cost!.toLocaleString("es-MX")}</span>
                            : <span className="text-gray-600">—</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Appointments */}
      <div className="bg-[#16213e] border border-white/10 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-white/5">
          <h2 className="text-white font-semibold">
            Historial de citas
            <span className="text-xs text-gray-500 font-normal ml-2">({appointments?.length ?? 0})</span>
          </h2>
        </div>
        {!appointments || appointments.length === 0 ? (
          <p className="py-10 text-center text-gray-600 text-sm">Sin citas registradas.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[420px]">
              <thead>
                <tr className="text-gray-500 text-xs uppercase tracking-wide border-b border-white/5">
                  <th className="text-left py-3 px-5 font-medium">Servicio</th>
                  <th className="text-left py-3 px-4 font-medium">Fecha / Hora</th>
                  <th className="text-left py-3 px-4 font-medium">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {appointments.map((a) => {
                  const status = a.status as AppointmentStatus;
                  return (
                    <tr key={a.id} className="hover:bg-white/[0.03] transition-colors">
                      <td className="py-3.5 px-5 text-gray-200">{a.service_type}</td>
                      <td className="py-3.5 px-4 text-gray-400 text-xs whitespace-nowrap">
                        {formatDate(a.date)} · {a.time_slot}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${APPT_STATUS_COLORS[status]}`}>
                          {APPT_STATUS_LABELS[status]}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
