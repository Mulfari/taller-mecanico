"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

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
  mechanic_id: string | null;
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
}

// ── Constants ──────────────────────────────────────────────────────────────

const STATUS_STEPS: WorkOrderStatus[] = ["received", "diagnosing", "repairing", "ready", "delivered"];

const STATUS_LABELS: Record<WorkOrderStatus, string> = {
  received: "Recibido",
  diagnosing: "Diagnóstico",
  repairing: "En reparación",
  ready: "Listo para recoger",
  delivered: "Entregado",
};

const STATUS_DESCRIPTIONS: Record<WorkOrderStatus, string> = {
  received: "Tu vehículo fue recibido en el taller.",
  diagnosing: "El mecánico está revisando tu vehículo.",
  repairing: "Tu vehículo está siendo reparado.",
  ready: "Tu vehículo está listo. Puedes pasar a recogerlo.",
  delivered: "Tu vehículo fue entregado.",
};

const STATUS_BADGE: Record<WorkOrderStatus, string> = {
  received: "bg-gray-500/20 text-gray-300",
  diagnosing: "bg-yellow-500/20 text-yellow-300",
  repairing: "bg-blue-500/20 text-blue-300",
  ready: "bg-green-500/20 text-green-300",
  delivered: "bg-gray-600/20 text-gray-500",
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
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437l1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008z" />
    </svg>
  );
}

function IconUser() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
    </svg>
  );
}

function IconClock() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function IconCheck() {
  return (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
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

function IconSignal() {
  return (
    <svg className="w-3 h-3 text-green-400" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="5" />
    </svg>
  );
}

// ── Status Timeline ────────────────────────────────────────────────────────

function StatusTimeline({ current }: { current: WorkOrderStatus }) {
  const currentIdx = STATUS_STEPS.indexOf(current);
  return (
    <div className="flex items-start gap-0 overflow-x-auto pb-1">
      {STATUS_STEPS.map((step, idx) => {
        const done = idx < currentIdx;
        const active = idx === currentIdx;
        return (
          <div key={step} className="flex items-center flex-1 last:flex-none min-w-[72px]">
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all shrink-0 ${
                  done
                    ? "bg-green-500/20 border-green-500 text-green-400"
                    : active
                    ? "bg-[#e94560]/20 border-[#e94560] text-[#e94560]"
                    : "bg-white/5 border-white/10 text-gray-600"
                }`}
              >
                {done ? (
                  <IconCheck />
                ) : (
                  <span className="text-xs font-bold">{idx + 1}</span>
                )}
              </div>
              <span
                className={`text-xs text-center leading-tight whitespace-nowrap ${
                  done ? "text-green-400" : active ? "text-[#e94560] font-medium" : "text-gray-600"
                }`}
              >
                {STATUS_LABELS[step]}
              </span>
            </div>
            {idx < STATUS_STEPS.length - 1 && (
              <div
                className={`flex-1 h-0.5 mb-5 mx-1 min-w-[12px] ${
                  idx < currentIdx ? "bg-green-500/40" : "bg-white/10"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Work Order Card ────────────────────────────────────────────────────────

function WorkOrderCard({ order, vehicle }: { order: WorkOrder; vehicle: Vehicle }) {
  const [expanded, setExpanded] = useState(false);

  const laborItems = order.work_order_items.filter((i) => i.type === "labor");
  const partItems = order.work_order_items.filter((i) => i.type === "part");
  const subtotal = order.work_order_items.reduce((s, i) => s + i.total, 0);

  const fmtDate = (d: string) =>
    new Date(d + "T00:00:00").toLocaleDateString("es-MX", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

  const fmt = (n: number) =>
    `$${n.toLocaleString("es-MX", { minimumFractionDigits: 2 })}`;

  const isActive = order.status !== "delivered";

  return (
    <div className="bg-[#16213e] border border-white/10 rounded-xl overflow-hidden">
      {/* Card header */}
      <div className="p-5">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-white font-semibold text-sm font-mono">
                #{order.id.slice(0, 8).toUpperCase()}
              </span>
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_BADGE[order.status]}`}
              >
                {STATUS_LABELS[order.status]}
              </span>
              {isActive && (
                <span className="inline-flex items-center gap-1 text-xs text-green-400">
                  <IconSignal />
                  En vivo
                </span>
              )}
            </div>
            <p className="text-gray-400 text-sm mt-1 line-clamp-2">{order.description}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0 text-xs text-gray-500">
            <IconClock />
            <span>Recibido {fmtDate(order.received_at)}</span>
          </div>
        </div>

        {/* Timeline */}
        <StatusTimeline current={order.status} />

        {/* Status description */}
        <p className="text-sm text-gray-400 mt-3 bg-white/5 rounded-lg px-4 py-2.5">
          {STATUS_DESCRIPTIONS[order.status]}
        </p>

        {/* Key info row */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-4">
          {order.mechanic && (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-500 shrink-0">
                <IconUser />
              </span>
              <div>
                <p className="text-gray-500 text-xs">Mecánico</p>
                <p className="text-gray-200">{order.mechanic.full_name}</p>
              </div>
            </div>
          )}
          {order.estimated_delivery && (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-500 shrink-0">
                <IconClock />
              </span>
              <div>
                <p className="text-gray-500 text-xs">Entrega estimada</p>
                <p className="text-gray-200">{fmtDate(order.estimated_delivery)}</p>
              </div>
            </div>
          )}
          {(order.estimated_cost ?? 0) > 0 && (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-500 shrink-0">
                <IconWrench />
              </span>
              <div>
                <p className="text-gray-500 text-xs">Costo estimado</p>
                <p className="text-gray-200">{fmt(order.estimated_cost!)}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Expandable items section */}
      {order.work_order_items.length > 0 && (
        <>
          <button
            onClick={() => setExpanded((v) => !v)}
            className="w-full flex items-center justify-between px-5 py-3 border-t border-white/5 text-xs text-gray-500 hover:text-gray-300 hover:bg-white/3 transition-colors"
            aria-expanded={expanded}
          >
            <span>
              {order.work_order_items.length} ítem{order.work_order_items.length !== 1 ? "s" : ""} realizados
            </span>
            <svg
              className={`w-4 h-4 transition-transform ${expanded ? "rotate-180" : ""}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {expanded && (
            <div className="border-t border-white/5">
              {/* Labor */}
              {laborItems.length > 0 && (
                <div className="px-5 py-3">
                  <p className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-2">
                    Mano de obra
                  </p>
                  <div className="space-y-1.5">
                    {laborItems.map((item) => (
                      <div key={item.id} className="flex justify-between text-sm">
                        <span className="text-gray-300">{item.description}</span>
                        <span className="text-gray-400 shrink-0 ml-4">{fmt(item.total)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Parts */}
              {partItems.length > 0 && (
                <div className="px-5 py-3 border-t border-white/5">
                  <p className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-2">
                    Repuestos y materiales
                  </p>
                  <div className="space-y-1.5">
                    {partItems.map((item) => (
                      <div key={item.id} className="flex justify-between text-sm">
                        <span className="text-gray-300">
                          {item.description}
                          {item.quantity > 1 && (
                            <span className="text-gray-600 ml-1">×{item.quantity}</span>
                          )}
                        </span>
                        <span className="text-gray-400 shrink-0 ml-4">{fmt(item.total)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Total */}
              <div className="px-5 py-3 border-t border-white/5 flex justify-between text-sm font-semibold">
                <span className="text-gray-300">Total</span>
                <span className="text-[#e94560]">{fmt(subtotal)}</span>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ── Vehicle Section ────────────────────────────────────────────────────────

function VehicleSection({
  vehicle,
  orders,
}: {
  vehicle: Vehicle;
  orders: WorkOrder[];
}) {
  const activeOrders = orders.filter((o) => o.status !== "delivered");
  const pastOrders = orders.filter((o) => o.status === "delivered");

  return (
    <section className="space-y-4">
      {/* Vehicle header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-[#e94560]/10 border border-[#e94560]/20 flex items-center justify-center text-[#e94560]">
          <IconCar />
        </div>
        <div>
          <h2 className="text-white font-semibold">
            {vehicle.brand} {vehicle.model} {vehicle.year}
          </h2>
          {vehicle.plate && (
            <p className="text-gray-500 text-sm font-mono">{vehicle.plate}</p>
          )}
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="bg-[#16213e] border border-white/10 rounded-xl px-5 py-8 text-center">
          <p className="text-gray-600 text-sm">No hay órdenes de trabajo para este vehículo.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {activeOrders.length > 0 && (
            <div className="space-y-3">
              {activeOrders.map((order) => (
                <WorkOrderCard key={order.id} order={order} vehicle={vehicle} />
              ))}
            </div>
          )}
          {pastOrders.length > 0 && (
            <details className="group">
              <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-300 transition-colors list-none flex items-center gap-2 py-1">
                <svg
                  className="w-4 h-4 transition-transform group-open:rotate-90"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                {pastOrders.length} orden{pastOrders.length !== 1 ? "es" : ""} entregada{pastOrders.length !== 1 ? "s" : ""}
              </summary>
              <div className="mt-3 space-y-3">
                {pastOrders.map((order) => (
                  <WorkOrderCard key={order.id} order={order} vehicle={vehicle} />
                ))}
              </div>
            </details>
          )}
        </div>
      )}
    </section>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────

export default function MiVehiculoPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [orders, setOrders] = useState<WorkOrder[]>([]);
  const [dataLoading, setDataLoading] = useState(false);

  // Supabase client stored in a ref so it's only created on the client
  const supabaseRef = useRef<ReturnType<typeof createClient> | null>(null);

  const loadData = useCallback(async (userId: string) => {
    const supabase = supabaseRef.current;
    if (!supabase) return;
    setDataLoading(true);
    try {
      const { data: vehicleData } = await supabase
        .from("vehicles")
        .select("id, brand, model, year, plate, color")
        .eq("owner_id", userId)
        .order("created_at", { ascending: false });

      if (!vehicleData || vehicleData.length === 0) {
        setVehicles([]);
        setOrders([]);
        return;
      }

      setVehicles(vehicleData);

      const vehicleIds = vehicleData.map((v: Vehicle) => v.id);

      const { data: orderData } = await supabase
        .from("work_orders")
        .select(
          `id, status, description, diagnosis, estimated_cost, final_cost,
           received_at, estimated_delivery, delivered_at, mechanic_id, vehicle_id,
           mechanic:profiles!work_orders_mechanic_id_fkey(full_name),
           work_order_items(id, type, description, quantity, unit_price, total)`
        )
        .in("vehicle_id", vehicleIds)
        .order("received_at", { ascending: false });

      setOrders((orderData as unknown as WorkOrder[]) ?? []);
    } finally {
      setDataLoading(false);
    }
  }, []);

  // Auth — runs only on the client
  useEffect(() => {
    supabaseRef.current = createClient();
    const supabase = supabaseRef.current;

    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      setLoading(false);
      if (user) loadData(user.id);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const u = session?.user ?? null;
      setUser(u);
      if (u) loadData(u.id);
    });

    return () => subscription.unsubscribe();
  }, [loadData]);

  // Realtime subscription for work_orders updates
  useEffect(() => {
    const supabase = supabaseRef.current;
    if (!supabase || !user || vehicles.length === 0) return;

    const vehicleIds = vehicles.map((v) => v.id);

    const channel = supabase
      .channel("work-orders-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "work_orders",
          filter: `vehicle_id=in.(${vehicleIds.join(",")})`,
        },
        (payload) => {
          if (payload.eventType === "UPDATE") {
            setOrders((prev) =>
              prev.map((o) =>
                o.id === payload.new.id ? { ...o, ...(payload.new as Partial<WorkOrder>) } : o
              )
            );
          } else if (payload.eventType === "INSERT") {
            loadData(user.id);
          } else if (payload.eventType === "DELETE") {
            setOrders((prev) => prev.filter((o) => o.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, vehicles, loadData]);

  // ── Render states ──────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex items-center gap-3 text-gray-500">
          <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
          </svg>
          <span className="text-sm">Cargando…</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-5 text-gray-500">
            <IconLock />
          </div>
          <h1 className="text-xl font-bold text-white mb-2">Inicia sesión para continuar</h1>
          <p className="text-gray-500 text-sm mb-6">
            Necesitas una cuenta para consultar el estado de tu vehículo.
          </p>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 bg-[#e94560] hover:bg-[#c73652] text-white text-sm font-medium px-6 py-3 rounded-lg transition-colors"
          >
            Iniciar sesión
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-10 sm:py-16">
      {/* Page header */}
      <div className="mb-10">
        <div className="inline-flex items-center gap-2 text-[#e94560] text-sm font-medium mb-3">
          <IconCar />
          Mi vehículo
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold text-white">Estado de mis vehículos</h1>
        <p className="text-gray-400 mt-2 text-sm">
          Consulta el progreso de las órdenes de trabajo en tiempo real.
        </p>
      </div>

      {dataLoading ? (
        <div className="flex items-center gap-3 text-gray-500 py-12 justify-center">
          <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
          </svg>
          <span className="text-sm">Cargando tus vehículos…</span>
        </div>
      ) : vehicles.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-5 text-gray-600">
            <IconCar />
          </div>
          <h2 className="text-white font-semibold mb-2">Sin vehículos registrados</h2>
          <p className="text-gray-500 text-sm mb-6">
            Aún no tienes vehículos asociados a tu cuenta.
          </p>
          <Link
            href="/citas"
            className="inline-flex items-center gap-2 bg-[#e94560] hover:bg-[#c73652] text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors"
          >
            Agendar una cita
          </Link>
        </div>
      ) : (
        <div className="space-y-10">
          {vehicles.map((vehicle) => (
            <VehicleSection
              key={vehicle.id}
              vehicle={vehicle}
              orders={orders.filter((o) => o.vehicle_id === vehicle.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
