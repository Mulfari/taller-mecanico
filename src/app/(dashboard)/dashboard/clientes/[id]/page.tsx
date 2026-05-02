import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { notFound } from "next/navigation";
import AddVehicleModal from "./AddVehicleModal";
import EditClientButton from "./EditClientButton";
import EditVehicleButton from "./EditVehicleModal";

// ── Icons ──────────────────────────────────────────────────────────────────
function IconArrowLeft() {
  return <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>;
}
function IconCar() {
  return <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 17H3a2 2 0 01-2-2v-4a2 2 0 012-2h1l2-4h10l2 4h1a2 2 0 012 2v4a2 2 0 01-2 2h-2m-10 0a2 2 0 104 0m6 0a2 2 0 104 0" /></svg>;
}
function IconWrench() {
  return <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437l1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008z" /></svg>;
}
function IconClipboard() {
  return <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>;
}

// ── Types ──────────────────────────────────────────────────────────────────
type WorkOrderStatus = "received" | "diagnosing" | "repairing" | "ready" | "delivered";
type AppointmentStatus = "pending" | "confirmed" | "completed" | "cancelled";

// ── Status helpers ─────────────────────────────────────────────────────────
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

// ── Page ───────────────────────────────────────────────────────────────────
export default async function ClienteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  // Fetch client profile
  const { data: client } = await supabase
    .from("profiles")
    .select("id, full_name, email, phone, created_at")
    .eq("id", id)
    .maybeSingle();

  if (!client) notFound();

  // Fetch vehicles, work orders, and appointments in parallel
  const [{ data: vehicles }, { data: workOrders }, { data: appointments }] = await Promise.all([
    supabase
      .from("vehicles")
      .select("id, brand, model, year, plate, color, vin, mileage")
      .eq("owner_id", id)
      .order("created_at", { ascending: false }),
    supabase
      .from("work_orders")
      .select(`
        id, status, description, received_at, estimated_cost, final_cost,
        vehicle:vehicles(brand, model, year, plate)
      `)
      .eq("client_id", id)
      .order("received_at", { ascending: false }),
    supabase
      .from("appointments")
      .select(`
        id, date, time_slot, service_type, status,
        vehicle:vehicles(brand, model, year)
      `)
      .eq("client_id", id)
      .order("date", { ascending: false }),
  ]);

  return (
    <div className="space-y-6">
      {/* Back + header */}
      <div>
        <Link href="/dashboard/clientes" className="inline-flex items-center gap-1.5 text-gray-500 hover:text-white text-sm transition-colors mb-4">
          <IconArrowLeft /> Clientes
        </Link>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">{client.full_name}</h1>
            <p className="text-gray-500 text-sm mt-1">
              Cliente desde {formatDate(client.created_at)}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href={`/dashboard/cotizaciones?client=${id}`}
              className="shrink-0 inline-flex items-center gap-2 border border-white/10 hover:border-white/20 text-gray-300 hover:text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
            >
              <IconClipboard />
              Nueva cotización
            </Link>
            <Link
              href={`/dashboard/ordenes/nueva?client=${id}`}
              className="shrink-0 inline-flex items-center gap-2 bg-[#e94560] hover:bg-[#c73652] text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
            >
              <IconWrench />
              Nueva orden
            </Link>
          </div>
        </div>
      </div>

      {/* Contact info */}
      <div className="bg-[#16213e] border border-white/10 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-white font-semibold">Datos de contacto</h2>
          <EditClientButton clientId={id} fullName={client.full_name ?? ""} phone={client.phone ?? ""} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <p className="text-gray-500 text-xs uppercase tracking-wide mb-1">Correo</p>
            <p className="text-gray-200 text-sm">{client.email}</p>
          </div>
          <div>
            <p className="text-gray-500 text-xs uppercase tracking-wide mb-1">Teléfono</p>
            <p className="text-gray-200 text-sm">{client.phone || <span className="text-gray-600">—</span>}</p>
          </div>
          <div>
            <p className="text-gray-500 text-xs uppercase tracking-wide mb-1">Vehículos</p>
            <p className="text-gray-200 text-sm">{vehicles?.length ?? 0}</p>
          </div>
        </div>
      </div>

      {/* Vehicles */}
      <div className="bg-[#16213e] border border-white/10 rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
          <h2 className="text-white font-semibold flex items-center gap-2">
            <IconCar />
            Vehículos registrados
            <span className="text-xs text-gray-500 font-normal">({vehicles?.length ?? 0})</span>
          </h2>
          <AddVehicleModal clientId={id} />
        </div>
        {!vehicles || vehicles.length === 0 ? (
          <p className="py-10 text-center text-gray-600 text-sm">Sin vehículos registrados.</p>
        ) : (
          <div className="divide-y divide-white/5">
            {vehicles.map((v) => (
              <div key={v.id} className="px-5 py-4 flex flex-wrap gap-x-8 gap-y-2 items-start">
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium">{v.brand} {v.model} {v.year}</p>
                  {v.plate && <p className="text-gray-500 text-xs mt-0.5">Placa: {v.plate}</p>}
                </div>
                <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-gray-400 items-center">
                  {v.color && <span>Color: {v.color}</span>}
                  {v.mileage > 0 && <span>{v.mileage.toLocaleString("es-MX")} km</span>}
                  {v.vin && <span className="font-mono text-xs text-gray-600">VIN: {v.vin}</span>}
                </div>
                <EditVehicleButton vehicle={v} clientId={id} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Work orders */}
      <div className="bg-[#16213e] border border-white/10 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-white/5">
          <h2 className="text-white font-semibold">
            Historial de órdenes
            <span className="text-xs text-gray-500 font-normal ml-2">({workOrders?.length ?? 0})</span>
          </h2>
        </div>
        {!workOrders || workOrders.length === 0 ? (
          <p className="py-10 text-center text-gray-600 text-sm">Sin órdenes de trabajo.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[560px]">
              <thead>
                <tr className="text-gray-500 text-xs uppercase tracking-wide border-b border-white/5">
                  <th className="text-left py-3 px-5 font-medium">OT / Descripción</th>
                  <th className="text-left py-3 px-4 font-medium">Vehículo</th>
                  <th className="text-left py-3 px-4 font-medium">Estado</th>
                  <th className="text-left py-3 px-4 font-medium">Fecha</th>
                  <th className="text-right py-3 px-5 font-medium">Costo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {workOrders.map((wo) => {
                  const v = (wo.vehicle as unknown as { brand: string; model: string; year: number; plate: string } | null);
                  const status = wo.status as WorkOrderStatus;
                  return (
                    <tr key={wo.id} className="hover:bg-white/[0.03] transition-colors group">
                      <td className="py-3.5 px-5">
                        <Link href={`/dashboard/ordenes/${wo.id}`} className="block">
                          <span className="text-[#e94560] font-mono text-xs group-hover:underline">
                            OT-{wo.id.slice(0, 6).toUpperCase()}
                          </span>
                          <p className="text-gray-300 text-xs mt-0.5 max-w-[220px] truncate">{wo.description}</p>
                        </Link>
                      </td>
                      <td className="py-3.5 px-4">
                        <Link href={`/dashboard/ordenes/${wo.id}`} className="block">
                          {v ? (
                            <>
                              <p className="text-gray-300 text-xs">{v.brand} {v.model} {v.year}</p>
                              {v.plate && <p className="text-gray-600 text-xs">{v.plate}</p>}
                            </>
                          ) : <span className="text-gray-600 text-xs">—</span>}
                        </Link>
                      </td>
                      <td className="py-3.5 px-4">
                        <Link href={`/dashboard/ordenes/${wo.id}`} className="block">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${WO_STATUS_COLORS[status]}`}>
                            {WO_STATUS_LABELS[status]}
                          </span>
                        </Link>
                      </td>
                      <td className="py-3.5 px-4">
                        <Link href={`/dashboard/ordenes/${wo.id}`} className="block text-gray-400 text-xs whitespace-nowrap">
                          {formatDate(wo.received_at)}
                        </Link>
                      </td>
                      <td className="py-3.5 px-5 text-right">
                        <Link href={`/dashboard/ordenes/${wo.id}`} className="block text-gray-300 text-xs">
                          {(wo.final_cost ?? 0) > 0
                            ? `$${wo.final_cost!.toLocaleString("es-MX")}`
                            : (wo.estimated_cost ?? 0) > 0
                              ? <span className="text-gray-500">Est. ${wo.estimated_cost!.toLocaleString("es-MX")}</span>
                              : <span className="text-gray-600">—</span>}
                        </Link>
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
            <table className="w-full text-sm min-w-[480px]">
              <thead>
                <tr className="text-gray-500 text-xs uppercase tracking-wide border-b border-white/5">
                  <th className="text-left py-3 px-5 font-medium">Servicio</th>
                  <th className="text-left py-3 px-4 font-medium">Vehículo</th>
                  <th className="text-left py-3 px-4 font-medium">Fecha / Hora</th>
                  <th className="text-left py-3 px-4 font-medium">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {appointments.map((a) => {
                  const v = (a.vehicle as unknown as { brand: string; model: string; year: number } | null);
                  const status = a.status as AppointmentStatus;
                  return (
                    <tr key={a.id} className="hover:bg-white/[0.03] transition-colors">
                      <td className="py-3.5 px-5 text-gray-200">{a.service_type}</td>
                      <td className="py-3.5 px-4 text-gray-400 text-xs">
                        {v ? `${v.brand} ${v.model} ${v.year}` : "—"}
                      </td>
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
