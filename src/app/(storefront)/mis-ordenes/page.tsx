"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

// ── Types ──────────────────────────────────────────────────────────────────

type OrderStatus = "received" | "diagnosing" | "repairing" | "ready" | "delivered";

interface WorkOrder {
  id: string;
  status: OrderStatus;
  description: string | null;
  diagnosis: string | null;
  estimated_cost: number | null;
  final_cost: number | null;
  received_at: string | null;
  estimated_delivery: string | null;
  delivered_at: string | null;
  created_at: string;
  vehicle: {
    brand: string;
    model: string;
    year: number;
    plate: string | null;
  } | null;
}

// ── Constants ──────────────────────────────────────────────────────────────

const STATUS_LABELS: Record<OrderStatus, string> = {
  received: "Recibido",
  diagnosing: "En diagnóstico",
  repairing: "En reparación",
  ready: "Listo para retirar",
  delivered: "Entregado",
};

const STATUS_BADGE: Record<OrderStatus, string> = {
  received: "bg-gray-500/20 text-gray-300 border-gray-500/30",
  diagnosing: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
  repairing: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  ready: "bg-green-500/20 text-green-300 border-green-500/30",
  delivered: "bg-gray-600/20 text-gray-500 border-gray-600/30",
};

const STATUS_DOT: Record<OrderStatus, string> = {
  received: "bg-gray-400",
  diagnosing: "bg-yellow-400",
  repairing: "bg-blue-400",
  ready: "bg-green-400 animate-pulse",
  delivered: "bg-gray-600",
};

const ACTIVE_STATUSES: OrderStatus[] = ["received", "diagnosing", "repairing", "ready"];

// ── Icons ──────────────────────────────────────────────────────────────────

function IconWrench() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437l1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008z" />
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

function IconChevronRight() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  );
}

// ── Helpers ────────────────────────────────────────────────────────────────

const fmt = (n: number) =>
  `$${n.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const fmtDate = (d: string) =>
  new Date(d.includes("T") ? d : d + "T00:00:00").toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

// ── Order Card ─────────────────────────────────────────────────────────────

function OrderCard({ order }: { order: WorkOrder }) {
  const isActive = ACTIVE_STATUSES.includes(order.status);
  const vehicle = order.vehicle;
  const shortId = `OT-${order.id.slice(0, 6).toUpperCase()}`;

  return (
    <div
      className={`bg-[#16213e] border rounded-xl overflow-hidden transition-colors ${
        order.status === "delivered" ? "border-white/5" : "border-white/10 hover:border-white/20"
      }`}
    >
      {/* Header */}
      <div className="px-5 py-4 flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 min-w-0">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
              order.status === "delivered"
                ? "bg-white/5 text-gray-600"
                : "bg-[#e94560]/10 border border-[#e94560]/20 text-[#e94560]"
            }`}
          >
            <IconWrench />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <Link
                href={`/mis-ordenes/${order.id}`}
                className="text-white font-semibold text-sm font-mono hover:text-[#e94560] transition-colors"
              >
                {shortId}
              </Link>
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${STATUS_BADGE[order.status]}`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[order.status]}`} />
                {STATUS_LABELS[order.status]}
              </span>
            </div>
            <p className="text-gray-500 text-xs mt-1">
              Ingresó: {fmtDate(order.received_at ?? order.created_at)}
            </p>
          </div>
        </div>

        <div className="shrink-0 flex items-center gap-2">
          {isActive && (
            <Link
              href={`/seguimiento?orden=${order.id}`}
              className="inline-flex items-center gap-1.5 text-xs text-[#e94560] border border-[#e94560]/30 hover:border-[#e94560]/60 hover:bg-[#e94560]/5 px-3 py-1.5 rounded-lg transition-colors"
            >
              Seguir en vivo
              <IconChevronRight />
            </Link>
          )}
          <Link
            href={`/mis-ordenes/${order.id}`}
            className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-white border border-white/10 hover:border-white/20 px-3 py-1.5 rounded-lg transition-colors"
          >
            Ver detalle
            <IconChevronRight />
          </Link>
        </div>
      </div>

      {/* Details grid */}
      <div className="px-5 pb-4 grid grid-cols-1 sm:grid-cols-3 gap-3 border-t border-white/5 pt-4">
        {vehicle && (
          <div className="flex items-center gap-2 text-sm">
            <span className="text-gray-500 shrink-0"><IconCar /></span>
            <div>
              <p className="text-gray-500 text-xs">Vehículo</p>
              <p className="text-gray-200">
                {vehicle.brand} {vehicle.model} {vehicle.year}
                {vehicle.plate && (
                  <span className="text-gray-500 font-mono ml-1 text-xs">({vehicle.plate})</span>
                )}
              </p>
            </div>
          </div>
        )}

        {(order.estimated_cost != null || order.final_cost != null) && (
          <div className="text-sm">
            <p className="text-gray-500 text-xs">Costo</p>
            {order.final_cost != null && order.final_cost > 0 ? (
              <p className="text-[#e94560] font-semibold">{fmt(order.final_cost)}</p>
            ) : order.estimated_cost != null && order.estimated_cost > 0 ? (
              <p className="text-gray-300">
                {fmt(order.estimated_cost)}
                <span className="text-gray-600 text-xs ml-1">(est.)</span>
              </p>
            ) : null}
          </div>
        )}

        {order.estimated_delivery && order.status !== "delivered" && (
          <div className="text-sm">
            <p className="text-gray-500 text-xs">Entrega estimada</p>
            <p className="text-gray-200">{fmtDate(order.estimated_delivery)}</p>
          </div>
        )}

        {order.delivered_at && order.status === "delivered" && (
          <div className="text-sm">
            <p className="text-gray-500 text-xs">Entregado</p>
            <p className="text-green-400">{fmtDate(order.delivered_at)}</p>
          </div>
        )}
      </div>

      {/* Description / diagnosis */}
      {(order.description || order.diagnosis) && (
        <div className="px-5 pb-4 space-y-2">
          {order.description && (
            <div>
              <p className="text-gray-500 text-xs uppercase tracking-wide font-medium mb-1">Descripción</p>
              <p className="text-gray-400 text-sm bg-white/[0.03] rounded-lg px-3 py-2 border border-white/5">
                {order.description}
              </p>
            </div>
          )}
          {order.diagnosis && (
            <div>
              <p className="text-gray-500 text-xs uppercase tracking-wide font-medium mb-1">Diagnóstico</p>
              <p className="text-gray-400 text-sm bg-white/[0.03] rounded-lg px-3 py-2 border border-white/5">
                {order.diagnosis}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────

type FilterKey = OrderStatus | "all" | "active";

const FILTER_TABS: { key: FilterKey; label: string }[] = [
  { key: "all", label: "Todas" },
  { key: "active", label: "En proceso" },
  { key: "delivered", label: "Entregadas" },
];

export default function MisOrdenesPage() {
  const [loading, setLoading] = useState(true);
  const [authed, setAuthed] = useState(false);
  const [orders, setOrders] = useState<WorkOrder[]>([]);
  const [filter, setFilter] = useState<FilterKey>("all");

  const load = useCallback(async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      return;
    }
    setAuthed(true);

    const { data } = await supabase
      .from("work_orders")
      .select(`
        id, status, description, diagnosis,
        estimated_cost, final_cost,
        received_at, estimated_delivery, delivered_at, created_at,
        vehicle:vehicles(brand, model, year, plate)
      `)
      .eq("client_id", user.id)
      .order("created_at", { ascending: false });

    setOrders((data ?? []) as unknown as WorkOrder[]);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = orders.filter((o) => {
    if (filter === "all") return true;
    if (filter === "active") return ACTIVE_STATUSES.includes(o.status);
    return o.status === filter;
  });

  const activeCount = orders.filter((o) => ACTIVE_STATUSES.includes(o.status)).length;

  // ── Loading ──────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#1a1a2e" }}>
        <div className="flex items-center gap-3 text-gray-400">
          <IconSpinner />
          <span className="text-sm">Cargando órdenes…</span>
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
            Iniciá sesión para ver tus órdenes de trabajo.
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

  // ── Main view ────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#1a1a2e" }}>
      {/* Hero */}
      <div style={{ backgroundColor: "#16213e" }} className="border-b border-white/5 py-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex items-center gap-2 text-sm text-gray-500 mb-4">
            <Link href="/" className="hover:text-white transition-colors">Inicio</Link>
            <span>/</span>
            <Link href="/cuenta" className="hover:text-white transition-colors">Mi cuenta</Link>
            <span>/</span>
            <span className="text-white">Mis órdenes</span>
          </nav>
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <div className="flex items-center gap-2 text-[#e94560] text-sm font-medium mb-2">
                <IconWrench />
                Mis órdenes de trabajo
              </div>
              <h1 className="text-3xl font-bold text-white">Historial de servicios</h1>
              <p className="text-gray-400 text-sm mt-1">
                {orders.length === 0
                  ? "Aún no tenés órdenes registradas."
                  : `${orders.length} orden${orders.length !== 1 ? "es" : ""} en total${activeCount > 0 ? ` — ${activeCount} en proceso` : ""}`}
              </p>
            </div>
            {activeCount > 0 && (
              <Link
                href="/seguimiento"
                className="shrink-0 inline-flex items-center gap-2 bg-[#e94560] hover:bg-[#c73652] text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors"
              >
                <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                Seguimiento en vivo
              </Link>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

        {/* Filter tabs */}
        {orders.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {FILTER_TABS.map(({ key, label }) => {
              const count =
                key === "all"
                  ? orders.length
                  : key === "active"
                  ? activeCount
                  : orders.filter((o) => o.status === key).length;
              if (key !== "all" && count === 0) return null;
              return (
                <button
                  key={key}
                  onClick={() => setFilter(key)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    filter === key
                      ? "bg-[#e94560] text-white"
                      : "bg-[#16213e] border border-white/10 text-gray-400 hover:text-white hover:border-white/20"
                  }`}
                >
                  {label}
                  <span
                    className={`text-xs px-1.5 py-0.5 rounded-full ${
                      filter === key ? "bg-white/20 text-white" : "bg-white/10 text-gray-500"
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* Order list */}
        {orders.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 rounded-2xl bg-[#16213e] border border-white/10 flex items-center justify-center mx-auto mb-4 text-gray-600">
              <IconWrench />
            </div>
            <p className="text-gray-400 text-lg mb-2">Sin órdenes registradas</p>
            <p className="text-gray-500 text-sm mb-8">
              Cuando el taller registre un trabajo en tu vehículo, aparecerá aquí.
            </p>
            <Link
              href="/citas"
              className="inline-block py-3 px-6 rounded-xl font-semibold text-white transition-colors"
              style={{ backgroundColor: "#e94560" }}
            >
              Agendar un servicio
            </Link>
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-[#16213e] border border-white/10 rounded-xl py-12 text-center">
            <p className="text-gray-500 text-sm">No hay órdenes con ese filtro.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((order) => (
              <OrderCard key={order.id} order={order} />
            ))}
          </div>
        )}

        {/* Footer links */}
        {orders.length > 0 && (
          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-white/5">
            <Link
              href="/seguimiento"
              className="flex-1 text-center py-3 px-6 rounded-xl font-semibold text-gray-300 border border-white/10 hover:border-white/20 hover:text-white transition-colors text-sm"
            >
              Seguimiento en vivo
            </Link>
            <Link
              href="/cuenta"
              className="flex-1 text-center py-3 px-6 rounded-xl font-semibold text-white transition-colors text-sm"
              style={{ backgroundColor: "#e94560" }}
            >
              Mi cuenta
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
