"use client";

import { useState } from "react";
import Link from "next/link";
import type { WorkOrderListItem, WorkOrderStatus } from "@/types/database";
import { EmptyState } from "@/components/ui";

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

const FILTER_TABS: { key: WorkOrderStatus | "all"; label: string }[] = [
  { key: "all", label: "Todas" },
  { key: "received", label: "Recibido" },
  { key: "diagnosing", label: "Diagnóstico" },
  { key: "repairing", label: "En reparación" },
  { key: "ready", label: "Listo" },
  { key: "delivered", label: "Entregado" },
];

function StatusBadge({ status }: { status: WorkOrderStatus }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[status]}`}>
      {STATUS_LABELS[status]}
    </span>
  );
}

export default function OrdenesClient({ orders }: { orders: WorkOrderListItem[] }) {
  const [activeFilter, setActiveFilter] = useState<WorkOrderStatus | "all">("all");

  const filtered =
    activeFilter === "all" ? orders : orders.filter((o) => o.status === activeFilter);

  const countFor = (key: WorkOrderStatus | "all") =>
    key === "all" ? orders.length : orders.filter((o) => o.status === key).length;

  return (
    <>
      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2">
        {FILTER_TABS.map((tab) => {
          const count = countFor(tab.key);
          const isActive = activeFilter === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveFilter(tab.key)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? "bg-[#e94560] text-white"
                  : "bg-[#16213e] border border-white/10 text-gray-400 hover:text-white hover:border-white/20"
              }`}
            >
              {tab.label}
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${isActive ? "bg-white/20 text-white" : "bg-white/10 text-gray-500"}`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Table */}
      <div className="bg-[#16213e] border border-white/10 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[700px]">
            <thead>
              <tr className="text-gray-500 text-xs uppercase tracking-wide border-b border-white/5">
                <th className="text-left py-3 px-4 font-medium">OT / Cliente</th>
                <th className="text-left py-3 px-4 font-medium">Vehículo</th>
                <th className="text-left py-3 px-4 font-medium">Mecánico</th>
                <th className="text-left py-3 px-4 font-medium">Estado</th>
                <th className="text-left py-3 px-4 font-medium">Recibido</th>
                <th className="text-right py-3 px-4 font-medium">Costo Est.</th>
                <th className="py-3 px-4" />
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7}>
                    <EmptyState
                      icon="🔧"
                      title={activeFilter === "all" ? "Sin órdenes de trabajo" : `Sin órdenes en estado "${FILTER_TABS.find(t => t.key === activeFilter)?.label}"`}
                      description={activeFilter === "all" ? "Crea la primera orden de trabajo para comenzar." : "No hay órdenes con este estado en este momento."}
                    />
                  </td>
                </tr>
              ) : (
                filtered.map((order) => (
                  <tr key={order.id} className="hover:bg-white/3 transition-colors">
                    <td className="py-3.5 px-4">
                      <p className="text-[#e94560] font-mono text-xs">{order.id.slice(0, 8).toUpperCase()}</p>
                      <p className="text-white font-medium mt-0.5">{order.client?.full_name ?? "—"}</p>
                      <p className="text-gray-600 text-xs mt-0.5 truncate max-w-[180px]">{order.description}</p>
                    </td>
                    <td className="py-3.5 px-4">
                      <p className="text-gray-300">
                        {order.vehicle ? `${order.vehicle.brand} ${order.vehicle.model} ${order.vehicle.year}` : "—"}
                      </p>
                      <p className="text-gray-500 text-xs mt-0.5">{order.vehicle?.plate ?? "—"}</p>
                    </td>
                    <td className="py-3.5 px-4">
                      <p className={order.mechanic ? "text-gray-300" : "text-gray-600"}>
                        {order.mechanic?.full_name ?? "—"}
                      </p>
                    </td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={order.status} />
                    </td>
                    <td className="py-3.5 px-4 text-gray-400 text-xs whitespace-nowrap">
                      {new Date(order.received_at).toLocaleDateString("es-MX", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {order.estimated_cost != null && order.estimated_cost > 0 ? (
                        <span className="text-gray-300 font-medium">
                          ${Number(order.estimated_cost).toLocaleString("es-MX")}
                        </span>
                      ) : (
                        <span className="text-gray-600">—</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Link
                        href={`/dashboard/ordenes/${order.id}`}
                        className="text-gray-500 hover:text-[#e94560] text-xs transition-colors"
                      >
                        Ver →
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
