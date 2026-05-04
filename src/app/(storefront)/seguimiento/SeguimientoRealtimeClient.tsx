"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

// ── Types ──────────────────────────────────────────────────────────────────

type WorkOrderStatus = "received" | "diagnosing" | "repairing" | "ready" | "delivered";

export interface WorkOrder {
  id: string;
  status: WorkOrderStatus;
  description: string;
  diagnosis: string | null;
  estimated_cost: number | null;
  estimated_delivery: string | null;
  received_at: string;
  delivered_at: string | null;
  mechanic: { full_name: string | null } | null;
}

export interface Vehicle {
  id: string;
  brand: string;
  model: string;
  year: number;
  plate: string;
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
  received: "Tu vehículo fue recibido en el taller y está en espera.",
  diagnosing: "El mecánico está revisando y diagnosticando tu vehículo.",
  repairing: "Tu vehículo está siendo reparado por nuestro equipo.",
  ready: "¡Tu vehículo está listo! Podés pasar a retirarlo.",
  delivered: "Tu vehículo fue entregado. ¡Gracias por confiar en nosotros!",
};

const STATUS_BADGE: Record<WorkOrderStatus, string> = {
  received: "bg-gray-500/20 text-gray-300 border-gray-500/30",
  diagnosing: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
  repairing: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  ready: "bg-green-500/20 text-green-300 border-green-500/30",
  delivered: "bg-gray-600/20 text-gray-400 border-gray-600/30",
};

// ── Icons ──────────────────────────────────────────────────────────────────

function IconCheck() {
  return (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
    </svg>
  );
}

function IconCar() {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
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

function IconUser() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
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
                className={`w-9 h-9 rounded-full flex items-center justify-center border-2 transition-all shrink-0 ${
                  done
                    ? "bg-green-500/20 border-green-500 text-green-400"
                    : active
                    ? "bg-primary/20 border-primary text-primary"
                    : "bg-white/5 border-white/10 text-gray-600"
                }`}
              >
                {done ? <IconCheck /> : <span className="text-xs font-bold">{idx + 1}</span>}
              </div>
              <span
                className={`text-xs text-center leading-tight whitespace-nowrap ${
                  done ? "text-green-400" : active ? "text-primary font-medium" : "text-gray-600"
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

function WorkOrderCard({ order, live }: { order: WorkOrder; live: boolean }) {
  const fmtDate = (d: string) =>
    new Date(d.includes("T") ? d : d + "T00:00:00").toLocaleDateString("es-MX", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });

  const isActive = order.status !== "delivered";

  return (
    <div className="bg-secondary border border-white/10 rounded-2xl overflow-hidden">
      {/* Status banner */}
      <div
        className={`px-6 py-4 border-b border-white/5 flex items-center justify-between gap-4 ${
          order.status === "ready" ? "bg-green-500/10" : "bg-white/[0.02]"
        }`}
      >
        <div className="flex items-center gap-3">
          <span
            className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold border ${STATUS_BADGE[order.status]}`}
          >
            {STATUS_LABELS[order.status]}
          </span>
          {isActive && live && (
            <span className="inline-flex items-center gap-1.5 text-xs text-green-400">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" aria-hidden="true" />
              En tiempo real
            </span>
          )}
        </div>
        <span className="text-gray-600 text-xs font-mono">#{order.id.slice(0, 8).toUpperCase()}</span>
      </div>

      <div className="p-6 space-y-6">
        {/* Status description */}
        <div className="bg-white/[0.03] border border-white/5 rounded-xl px-5 py-4">
          <p className="text-gray-200 text-sm leading-relaxed">{STATUS_DESCRIPTIONS[order.status]}</p>
        </div>

        {/* Timeline */}
        <StatusTimeline current={order.status} />

        {/* Details grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex items-start gap-3">
            <span className="text-gray-500 mt-0.5 shrink-0"><IconClock /></span>
            <div>
              <p className="text-gray-500 text-xs mb-0.5">Ingresó el</p>
              <p className="text-gray-200 text-sm capitalize">{fmtDate(order.received_at)}</p>
            </div>
          </div>

          {order.estimated_delivery && (
            <div className="flex items-start gap-3">
              <span className="text-gray-500 mt-0.5 shrink-0"><IconClock /></span>
              <div>
                <p className="text-gray-500 text-xs mb-0.5">Entrega estimada</p>
                <p className="text-gray-200 text-sm capitalize">{fmtDate(order.estimated_delivery)}</p>
              </div>
            </div>
          )}

          {order.mechanic?.full_name && (
            <div className="flex items-start gap-3">
              <span className="text-gray-500 mt-0.5 shrink-0"><IconUser /></span>
              <div>
                <p className="text-gray-500 text-xs mb-0.5">Mecánico asignado</p>
                <p className="text-gray-200 text-sm">{order.mechanic.full_name}</p>
              </div>
            </div>
          )}

          {order.estimated_cost != null && order.estimated_cost > 0 && (
            <div className="flex items-start gap-3">
              <span className="text-gray-500 mt-0.5 shrink-0">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </span>
              <div>
                <p className="text-gray-500 text-xs mb-0.5">Costo estimado</p>
                <p className="text-gray-200 text-sm font-semibold">
                  ${order.estimated_cost.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Description */}
        <div>
          <p className="text-gray-500 text-xs uppercase tracking-wide font-medium mb-2">Motivo de ingreso</p>
          <p className="text-gray-300 text-sm leading-relaxed bg-surface rounded-xl px-4 py-3 border border-white/5">
            {order.description}
          </p>
        </div>

        {/* Diagnosis */}
        {order.diagnosis && (
          <div>
            <p className="text-gray-500 text-xs uppercase tracking-wide font-medium mb-2">Diagnóstico</p>
            <p className="text-gray-300 text-sm leading-relaxed bg-surface rounded-xl px-4 py-3 border border-white/5">
              {order.diagnosis}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main Client Component ──────────────────────────────────────────────────

interface Props {
  vehicle: Vehicle;
  initialOrders: WorkOrder[];
}

export default function SeguimientoRealtimeClient({ vehicle, initialOrders }: Props) {
  const [orders, setOrders] = useState<WorkOrder[]>(initialOrders);
  const [realtimeConnected, setRealtimeConnected] = useState(false);

  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel(`work_orders_vehicle_${vehicle.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "work_orders",
          filter: `vehicle_id=eq.${vehicle.id}`,
        },
        (payload) => {
          setOrders((prev) =>
            prev.map((o) =>
              o.id === payload.new.id
                ? {
                    ...o,
                    status: payload.new.status as WorkOrderStatus,
                    diagnosis: payload.new.diagnosis ?? o.diagnosis,
                    estimated_cost: payload.new.estimated_cost ?? o.estimated_cost,
                    estimated_delivery: payload.new.estimated_delivery ?? o.estimated_delivery,
                    delivered_at: payload.new.delivered_at ?? o.delivered_at,
                  }
                : o
            )
          );
        }
      )
      .subscribe((status) => {
        setRealtimeConnected(status === "SUBSCRIBED");
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [vehicle.id]);

  const activeOrders = orders.filter((o) => o.status !== "delivered");
  const pastOrders = orders.filter((o) => o.status === "delivered");

  return (
    <div className="space-y-8">
      {/* Vehicle info */}
      <div className="flex items-center gap-4 bg-secondary border border-white/10 rounded-2xl px-6 py-4">
        <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
          <IconCar />
        </div>
        <div>
          <h2 className="text-white font-bold text-lg">
            {vehicle.brand} {vehicle.model} {vehicle.year}
          </h2>
          <div className="flex items-center gap-3 text-sm text-gray-500 mt-0.5">
            <span className="font-mono bg-white/5 px-2 py-0.5 rounded text-gray-300">
              {vehicle.plate}
            </span>
            {vehicle.color && <span>{vehicle.color}</span>}
          </div>
        </div>
        <div className="ml-auto text-right shrink-0">
          <p className="text-gray-500 text-xs">Órdenes</p>
          <p className="text-white font-bold text-lg">{orders.length}</p>
        </div>
      </div>

      {/* No orders */}
      {orders.length === 0 && (
        <div className="text-center py-12 bg-secondary border border-white/10 rounded-2xl">
          <p className="text-gray-500 text-sm">
            No hay órdenes de trabajo registradas para este vehículo.
          </p>
        </div>
      )}

      {/* Active orders */}
      {activeOrders.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-white font-semibold flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" aria-hidden="true" />
            Orden activa
          </h3>
          {activeOrders.map((order) => (
            <WorkOrderCard key={order.id} order={order} live={realtimeConnected} />
          ))}
        </div>
      )}

      {/* Past orders */}
      {pastOrders.length > 0 && (
        <details className="group">
          <summary className="cursor-pointer list-none flex items-center gap-2 text-sm text-gray-500 hover:text-gray-300 transition-colors py-1">
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
          <div className="mt-4 space-y-4">
            {pastOrders.map((order) => (
              <WorkOrderCard key={order.id} order={order} live={false} />
            ))}
          </div>
        </details>
      )}

      {/* CTAs */}
      <div className="flex flex-col sm:flex-row gap-3 pt-2 border-t border-white/5">
        <Link
          href="/citas"
          className="flex-1 text-center py-3 px-6 rounded-xl font-semibold text-white text-sm transition-colors"
          style={{ backgroundColor: "var(--color-primary)" }}
        >
          Agendar nuevo servicio
        </Link>
        <Link
          href="/historial"
          className="flex-1 text-center py-3 px-6 rounded-xl font-semibold text-gray-300 border border-white/10 hover:border-white/20 hover:text-white transition-colors text-sm"
        >
          Ver historial completo
        </Link>
      </div>
    </div>
  );
}
