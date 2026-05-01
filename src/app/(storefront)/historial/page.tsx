"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

// ── Types ──────────────────────────────────────────────────────────────────

type WorkOrderStatus = "received" | "diagnosing" | "repairing" | "ready" | "delivered";

interface WorkOrderItem {
  id: string;
  type: "labor" | "part";
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
}

interface WorkOrder {
  id: string;
  status: WorkOrderStatus;
  description: string;
  diagnosis: string | null;
  estimated_cost: number | null;
  final_cost: number | null;
  received_at: string;
  estimated_delivery: string | null;
  delivered_at: string | null;
  mechanic: { full_name: string } | null;
  work_order_items: WorkOrderItem[];
  vehicle_id: string;
}

interface Vehicle {
  id: string;
  brand: string;
  model: string;
  year: number;
  plate: string | null;
  color: string | null;
  mileage: number | null;
}

// ── Constants ──────────────────────────────────────────────────────────────

const STATUS_LABELS: Record<WorkOrderStatus, string> = {
  received: "Recibido",
  diagnosing: "Diagnóstico",
  repairing: "En reparación",
  ready: "Listo",
  delivered: "Entregado",
};

const STATUS_BADGE: Record<WorkOrderStatus, string> = {
  received: "bg-gray-500/20 text-gray-300",
  diagnosing: "bg-yellow-500/20 text-yellow-300",
  repairing: "bg-blue-500/20 text-blue-300",
  ready: "bg-green-500/20 text-green-300",
  delivered: "bg-gray-600/20 text-gray-400",
};

// ── Icons ──────────────────────────────────────────────────────────────────

function IconCar() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
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

function IconChevronDown() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  );
}

function IconChevronUp() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
    </svg>
  );
}

function IconLock() {
  return (
    <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
    </svg>
  );
}

function IconSpinner() {
  return (
    <svg className="w-6 h-6 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
    </svg>
  );
}

// ── Work Order Card ────────────────────────────────────────────────────────

function WorkOrderCard({ order }: { order: WorkOrder }) {
  const [expanded, setExpanded] = useState(false);

  const laborItems = order.work_order_items.filter((i) => i.type === "labor");
  const partItems = order.work_order_items.filter((i) => i.type === "part");
  const subtotal = order.work_order_items.reduce((s, i) => s + i.total, 0);

  const fmtDate = (d: string) =>
    new Date(d.includes("T") ? d : d + "T00:00:00").toLocaleDateString("es-MX", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

  const fmt = (n: number) =>
    `$${n.toLocaleString("es-MX", { minimumFractionDigits: 2 })}`;

  return (
    <div className="bg-[#16213e] border border-white/10 rounded-xl overflow-hidden">
      {/* Header */}
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full text-left p-5 hover:bg-white/[0.02] transition-colors"
        aria-expanded={expanded}
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 text-[#e94560]">
              <IconWrench />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-white font-semibold text-sm font-mono">
                  #{order.id.slice(0, 8).toUpperCase()}
                </span>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_BADGE[order.status]}`}>
                  {STATUS_LABELS[order.status]}
                </span>
              </div>
              <p className="text-gray-400 text-sm mt-1 line-clamp-2">{order.description}</p>
              <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                <span>Ingreso: {fmtDate(order.received_at)}</span>
                {order.delivered_at && (
                  <span>Entrega: {fmtDate(order.delivered_at)}</span>
                )}
                {order.mechanic?.full_name && (
                  <span>Mecánico: {order.mechanic.full_name}</span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            {subtotal > 0 && (
              <span className="text-[#e94560] font-bold text-lg">{fmt(subtotal)}</span>
            )}
            <span className="text-gray-500">
              {expanded ? <IconChevronUp /> : <IconChevronDown />}
            </span>
          </div>
        </div>
      </button>

      {/* Expanded detail */}
      {expanded && (
        <div className="border-t border-white/5 px-5 pb-5 pt-4 space-y-5">
          {/* Diagnosis */}
          {order.diagnosis && (
            <div>
              <p className="text-gray-500 text-xs uppercase tracking-wide font-medium mb-2">Diagnóstico</p>
              <p className="text-gray-300 text-sm leading-relaxed bg-[#1a1a2e] rounded-lg px-4 py-3 border border-white/5">
                {order.diagnosis}
              </p>
            </div>
          )}

          {/* Items */}
          {order.work_order_items.length > 0 && (
            <div>
              <p className="text-gray-500 text-xs uppercase tracking-wide font-medium mb-3">Detalle de trabajos</p>
              <div className="space-y-4">
                {laborItems.length > 0 && (
                  <div>
                    <p className="text-blue-400 text-xs font-medium mb-2">Mano de obra</p>
                    <div className="space-y-1">
                      {laborItems.map((item) => (
                        <div key={item.id} className="flex justify-between text-sm">
                          <span className="text-gray-300">
                            {item.description}
                            {item.quantity !== 1 && (
                              <span className="text-gray-500 ml-1">× {item.quantity}</span>
                            )}
                          </span>
                          <span className="text-gray-400 shrink-0 ml-4">{fmt(item.total)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {partItems.length > 0 && (
                  <div>
                    <p className="text-orange-400 text-xs font-medium mb-2">Repuestos y materiales</p>
                    <div className="space-y-1">
                      {partItems.map((item) => (
                        <div key={item.id} className="flex justify-between text-sm">
                          <span className="text-gray-300">
                            {item.description}
                            {item.quantity !== 1 && (
                              <span className="text-gray-500 ml-1">× {item.quantity}</span>
                            )}
                          </span>
                          <span className="text-gray-400 shrink-0 ml-4">{fmt(item.total)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Total */}
              <div className="flex justify-between text-sm font-semibold text-white border-t border-white/10 pt-3 mt-3">
                <span>Total</span>
                <span className="text-[#e94560]">{fmt(subtotal)}</span>
              </div>
            </div>
          )}

          {order.work_order_items.length === 0 && !order.diagnosis && (
            <p className="text-gray-600 text-sm italic">Sin detalles registrados para esta orden.</p>
          )}
        </div>
      )}
    </div>
  );
}

// ── Vehicle Section ────────────────────────────────────────────────────────

function VehicleSection({ vehicle, orders }: { vehicle: Vehicle; orders: WorkOrder[] }) {
  return (
    <div className="space-y-4">
      {/* Vehicle header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-[#e94560]/10 border border-[#e94560]/20 flex items-center justify-center text-[#e94560]">
          <IconCar />
        </div>
        <div>
          <h2 className="text-white font-bold text-lg">
            {vehicle.brand} {vehicle.model} {vehicle.year}
          </h2>
          <div className="flex items-center gap-3 text-xs text-gray-500">
            {vehicle.plate && <span>Placa: {vehicle.plate}</span>}
            {vehicle.color && <span>{vehicle.color}</span>}
            {vehicle.mileage != null && (
              <span>{vehicle.mileage.toLocaleString("es-MX")} km</span>
            )}
          </div>
        </div>
        <span className="ml-auto text-xs text-gray-600 bg-white/5 px-2.5 py-1 rounded-full">
          {orders.length} servicio{orders.length !== 1 ? "s" : ""}
        </span>
      </div>

      {orders.length === 0 ? (
        <div className="bg-[#16213e] border border-white/5 rounded-xl px-5 py-8 text-center">
          <p className="text-gray-600 text-sm">Sin servicios registrados para este vehículo.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <WorkOrderCard key={order.id} order={order} />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────

export default function HistorialPage() {
  const [loading, setLoading] = useState(true);
  const [authed, setAuthed] = useState(false);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [ordersByVehicle, setOrdersByVehicle] = useState<Record<string, WorkOrder[]>>({});
  const [filterVehicleId, setFilterVehicleId] = useState<string>("all");

  const load = useCallback(async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      return;
    }
    setAuthed(true);

    const { data: vehicleRows } = await supabase
      .from("vehicles")
      .select("id, brand, model, year, plate, color, mileage")
      .eq("owner_id", user.id)
      .order("brand");

    const vehicleList = (vehicleRows ?? []) as Vehicle[];
    setVehicles(vehicleList);

    if (vehicleList.length === 0) {
      setLoading(false);
      return;
    }

    const vehicleIds = vehicleList.map((v) => v.id);
    const { data: orderRows } = await supabase
      .from("work_orders")
      .select(`
        id, status, description, diagnosis,
        estimated_cost, final_cost,
        received_at, estimated_delivery, delivered_at,
        vehicle_id,
        mechanic:profiles!work_orders_mechanic_id_fkey(full_name),
        work_order_items(id, type, description, quantity, unit_price, total)
      `)
      .in("vehicle_id", vehicleIds)
      .order("received_at", { ascending: false });

    const grouped: Record<string, WorkOrder[]> = {};
    for (const v of vehicleList) grouped[v.id] = [];
    for (const row of orderRows ?? []) {
      const o = row as unknown as WorkOrder;
      if (grouped[o.vehicle_id]) grouped[o.vehicle_id].push(o);
    }
    setOrdersByVehicle(grouped);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const totalOrders = Object.values(ordersByVehicle).reduce((s, arr) => s + arr.length, 0);

  const visibleVehicles =
    filterVehicleId === "all"
      ? vehicles
      : vehicles.filter((v) => v.id === filterVehicleId);

  // ── Loading ──────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#1a1a2e" }}>
        <div className="flex items-center gap-3 text-gray-400">
          <IconSpinner />
          <span className="text-sm">Cargando historial…</span>
        </div>
      </div>
    );
  }

  // ── Not logged in ────────────────────────────────────────────────────────
  if (!authed) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: "#1a1a2e" }}>
        <div className="text-center max-w-sm">
          <div className="w-20 h-20 rounded-2xl bg-[#16213e] border border-white/10 flex items-center justify-center mx-auto mb-6 text-gray-500">
            <IconLock />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Acceso requerido</h1>
          <p className="text-gray-400 text-sm mb-8">
            Iniciá sesión para ver el historial de servicios de tus vehículos.
          </p>
          <div className="flex flex-col gap-3">
            <Link
              href="/login"
              className="block w-full text-center py-3 px-6 rounded-xl font-semibold text-white transition-colors"
              style={{ backgroundColor: "#e94560" }}
            >
              Iniciar sesión
            </Link>
            <Link
              href="/registro"
              className="block w-full text-center py-3 px-6 rounded-xl font-semibold text-gray-300 border border-white/10 hover:border-white/20 hover:text-white transition-colors"
            >
              Crear cuenta
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ── No vehicles ──────────────────────────────────────────────────────────
  if (vehicles.length === 0) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: "#1a1a2e" }}>
        <div style={{ backgroundColor: "#16213e" }} className="border-b border-white/5 py-10">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <h1 className="text-3xl font-bold text-white">Historial de Servicios</h1>
            <p className="text-gray-400 mt-2">Todos los trabajos realizados en tus vehículos</p>
          </div>
        </div>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
          <div className="w-16 h-16 rounded-2xl bg-[#16213e] border border-white/10 flex items-center justify-center mx-auto mb-4 text-gray-600">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437l1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008z" />
            </svg>
          </div>
          <p className="text-gray-400 text-lg">No tenés vehículos registrados</p>
          <p className="text-gray-500 text-sm mt-2 mb-8">
            Cuando el taller registre tu vehículo, el historial aparecerá aquí.
          </p>
          <Link
            href="/citas"
            className="inline-block py-3 px-6 rounded-xl font-semibold text-white transition-colors"
            style={{ backgroundColor: "#e94560" }}
          >
            Agendar una cita
          </Link>
        </div>
      </div>
    );
  }

  // ── Main view ────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen" style={{ backgroundColor: "#1a1a2e" }}>
      {/* Hero */}
      <div style={{ backgroundColor: "#16213e" }} className="border-b border-white/5 py-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-white">Historial de Servicios</h1>
          <p className="text-gray-400 mt-2">
            {totalOrders} servicio{totalOrders !== 1 ? "s" : ""} registrado{totalOrders !== 1 ? "s" : ""} en {vehicles.length} vehículo{vehicles.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
        {/* Vehicle filter */}
        {vehicles.length > 1 && (
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFilterVehicleId("all")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filterVehicleId === "all"
                  ? "bg-[#e94560] text-white"
                  : "bg-[#16213e] border border-white/10 text-gray-400 hover:text-white hover:border-white/20"
              }`}
            >
              Todos los vehículos
            </button>
            {vehicles.map((v) => (
              <button
                key={v.id}
                onClick={() => setFilterVehicleId(v.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filterVehicleId === v.id
                    ? "bg-[#e94560] text-white"
                    : "bg-[#16213e] border border-white/10 text-gray-400 hover:text-white hover:border-white/20"
                }`}
              >
                {v.brand} {v.model} {v.year}
              </button>
            ))}
          </div>
        )}

        {/* Vehicle sections */}
        {visibleVehicles.map((vehicle) => (
          <VehicleSection
            key={vehicle.id}
            vehicle={vehicle}
            orders={ordersByVehicle[vehicle.id] ?? []}
          />
        ))}

        {/* Footer links */}
        <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-white/5">
          <Link
            href="/mi-vehiculo"
            className="flex-1 text-center py-3 px-6 rounded-xl font-semibold text-gray-300 border border-white/10 hover:border-white/20 hover:text-white transition-colors text-sm"
          >
            Ver estado actual
          </Link>
          <Link
            href="/citas"
            className="flex-1 text-center py-3 px-6 rounded-xl font-semibold text-white transition-colors text-sm"
            style={{ backgroundColor: "#e94560" }}
          >
            Agendar nuevo servicio
          </Link>
        </div>
      </div>
    </div>
  );
}
