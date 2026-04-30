"use client";

import { useState } from "react";
import Link from "next/link";

type WorkOrderStatus = "received" | "diagnosing" | "repairing" | "ready" | "delivered";

interface WorkOrder {
  id: string;
  client: string;
  vehicle: string;
  plate: string;
  mechanic: string;
  status: WorkOrderStatus;
  received_at: string;
  estimated_cost: number;
  description: string;
}

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

const WORK_ORDERS: WorkOrder[] = [
  { id: "OT-0041", client: "Carlos Mendoza", vehicle: "Toyota Corolla 2019", plate: "ABC-123", mechanic: "Luis García", status: "repairing", received_at: "2026-04-29", estimated_cost: 4500, description: "Cambio de embrague y revisión de transmisión" },
  { id: "OT-0040", client: "Ana Rodríguez", vehicle: "Honda Civic 2021", plate: "XYZ-789", mechanic: "Pedro Soto", status: "diagnosing", received_at: "2026-04-29", estimated_cost: 1200, description: "Ruido extraño al frenar" },
  { id: "OT-0039", client: "Miguel Torres", vehicle: "Nissan Sentra 2018", plate: "DEF-456", mechanic: "Luis García", status: "ready", received_at: "2026-04-28", estimated_cost: 2800, description: "Cambio de pastillas y discos delanteros" },
  { id: "OT-0038", client: "Laura Jiménez", vehicle: "Chevrolet Spark 2020", plate: "GHI-321", mechanic: "—", status: "received", received_at: "2026-04-30", estimated_cost: 0, description: "Revisión general, falla en encendido" },
  { id: "OT-0037", client: "Roberto Díaz", vehicle: "Ford Focus 2017", plate: "JKL-654", mechanic: "Pedro Soto", status: "repairing", received_at: "2026-04-27", estimated_cost: 6200, description: "Reparación de motor, fuga de aceite" },
  { id: "OT-0036", client: "Sofía Vargas", vehicle: "Kia Sportage 2022", plate: "MNO-987", mechanic: "Luis García", status: "delivered", received_at: "2026-04-25", estimated_cost: 950, description: "Cambio de aceite y filtros" },
  { id: "OT-0035", client: "Andrés Morales", vehicle: "Hyundai Tucson 2020", plate: "PQR-741", mechanic: "Pedro Soto", status: "delivered", received_at: "2026-04-24", estimated_cost: 3100, description: "Alineación, balanceo y cambio de neumáticos" },
  { id: "OT-0034", client: "Patricia Núñez", vehicle: "Mazda 3 2019", plate: "STU-852", mechanic: "Luis García", status: "diagnosing", received_at: "2026-04-30", estimated_cost: 0, description: "Luz de check engine encendida" },
];

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

function IconPlus() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
  );
}

export default function OrdenesPage() {
  const [activeFilter, setActiveFilter] = useState<WorkOrderStatus | "all">("all");

  const filtered =
    activeFilter === "all" ? WORK_ORDERS : WORK_ORDERS.filter((o) => o.status === activeFilter);

  const countFor = (key: WorkOrderStatus | "all") =>
    key === "all" ? WORK_ORDERS.length : WORK_ORDERS.filter((o) => o.status === key).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Órdenes de Trabajo</h1>
          <p className="text-gray-500 text-sm mt-1">{WORK_ORDERS.length} órdenes en total</p>
        </div>
        <Link
          href="/dashboard/ordenes/nueva"
          className="inline-flex items-center gap-2 bg-[#e94560] hover:bg-[#c73652] text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          <IconPlus />
          Nueva Orden
        </Link>
      </div>

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
              <span
                className={`text-xs px-1.5 py-0.5 rounded-full ${
                  isActive ? "bg-white/20 text-white" : "bg-white/10 text-gray-500"
                }`}
              >
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
                  <td colSpan={7} className="py-12 text-center text-gray-600">
                    No hay órdenes con este estado.
                  </td>
                </tr>
              ) : (
                filtered.map((order) => (
                  <tr key={order.id} className="hover:bg-white/3 transition-colors">
                    <td className="py-3.5 px-4">
                      <p className="text-[#e94560] font-mono text-xs">{order.id}</p>
                      <p className="text-white font-medium mt-0.5">{order.client}</p>
                      <p className="text-gray-600 text-xs mt-0.5 truncate max-w-[180px]">{order.description}</p>
                    </td>
                    <td className="py-3.5 px-4">
                      <p className="text-gray-300">{order.vehicle}</p>
                      <p className="text-gray-500 text-xs mt-0.5">{order.plate}</p>
                    </td>
                    <td className="py-3.5 px-4">
                      <p className={order.mechanic === "—" ? "text-gray-600" : "text-gray-300"}>
                        {order.mechanic}
                      </p>
                    </td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={order.status} />
                    </td>
                    <td className="py-3.5 px-4 text-gray-400 text-xs whitespace-nowrap">
                      {new Date(order.received_at + "T00:00:00").toLocaleDateString("es-MX", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {order.estimated_cost > 0 ? (
                        <span className="text-gray-300 font-medium">
                          ${order.estimated_cost.toLocaleString("es-MX")}
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
    </div>
  );
}
