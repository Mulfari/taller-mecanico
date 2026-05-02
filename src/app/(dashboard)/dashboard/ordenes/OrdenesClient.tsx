"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { WorkOrderListItem, WorkOrderStatus } from "@/types/database";
import { EmptyState } from "@/components/ui";
import { generateInvoiceFromWorkOrder } from "./actions";

function IconReceipt() {
  return (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" />
    </svg>
  );
}

function IconSpinner() {
  return (
    <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
    </svg>
  );
}

function IconSearch() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  );
}

function IconX() {
  return (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
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

export default function OrdenesClient({
  orders,
  initialFilter = "all",
}: {
  orders: WorkOrderListItem[];
  initialFilter?: WorkOrderStatus | "all";
}) {
  const router = useRouter();
  const [activeFilter, setActiveFilter] = useState<WorkOrderStatus | "all">(initialFilter);
  const [search, setSearch] = useState("");
  const [generatingInvoice, setGeneratingInvoice] = useState<string | null>(null);

  async function handleGenerateInvoice(orderId: string) {
    setGeneratingInvoice(orderId);
    try {
      const invoiceId = await generateInvoiceFromWorkOrder(orderId);
      router.push(`/dashboard/facturas/${invoiceId}`);
    } finally {
      setGeneratingInvoice(null);
    }
  }

  const q = search.trim().toLowerCase();

  const filtered = orders.filter((o) => {
    const matchesStatus = activeFilter === "all" || o.status === activeFilter;
    if (!matchesStatus) return false;
    if (!q) return true;
    return (
      o.client?.full_name?.toLowerCase().includes(q) ||
      o.vehicle?.plate?.toLowerCase().includes(q) ||
      o.vehicle?.brand?.toLowerCase().includes(q) ||
      o.vehicle?.model?.toLowerCase().includes(q) ||
      o.description?.toLowerCase().includes(q) ||
      o.id.toLowerCase().includes(q)
    );
  });

  const countFor = (key: WorkOrderStatus | "all") =>
    key === "all" ? orders.length : orders.filter((o) => o.status === key).length;

  return (
    <>
      {/* Search + filter row */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search input */}
        <div className="relative flex-1 max-w-sm">
          <span className="absolute inset-y-0 left-3 flex items-center text-gray-500 pointer-events-none">
            <IconSearch />
          </span>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por cliente, patente, vehículo…"
            className="w-full bg-[#16213e] border border-white/10 rounded-lg pl-9 pr-8 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#e94560]/60 focus:ring-1 focus:ring-[#e94560]/30 transition-colors"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute inset-y-0 right-2.5 flex items-center text-gray-500 hover:text-gray-300 transition-colors"
              aria-label="Limpiar búsqueda"
            >
              <IconX />
            </button>
          )}
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
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${isActive ? "bg-white/20 text-white" : "bg-white/10 text-gray-500"}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
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
                <th className="text-right py-3 px-4 font-medium">Costo</th>
                <th className="py-3 px-4" />
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7}>
                    <EmptyState
                      icon={q ? "🔍" : "🔧"}
                      title={
                        q
                          ? `Sin resultados para "${search}"`
                          : activeFilter === "all"
                          ? "Sin órdenes de trabajo"
                          : `Sin órdenes en estado "${FILTER_TABS.find(t => t.key === activeFilter)?.label}"`
                      }
                      description={
                        q
                          ? "Probá con otro nombre, patente o descripción."
                          : activeFilter === "all"
                          ? "Crea la primera orden de trabajo para comenzar."
                          : "No hay órdenes con este estado en este momento."
                      }
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
                      {order.status === "delivered" ? (
                        order.final_cost != null && order.final_cost > 0 ? (
                          <div>
                            <span className="text-green-400 font-medium">
                              ${Number(order.final_cost).toLocaleString("es-MX")}
                            </span>
                            <p className="text-gray-600 text-xs mt-0.5">final</p>
                          </div>
                        ) : order.estimated_cost != null && order.estimated_cost > 0 ? (
                          <div>
                            <span className="text-gray-300 font-medium">
                              ${Number(order.estimated_cost).toLocaleString("es-MX")}
                            </span>
                            <p className="text-gray-600 text-xs mt-0.5">estimado</p>
                          </div>
                        ) : (
                          <span className="text-gray-600">—</span>
                        )
                      ) : order.estimated_cost != null && order.estimated_cost > 0 ? (
                        <div>
                          <span className="text-gray-300 font-medium">
                            ${Number(order.estimated_cost).toLocaleString("es-MX")}
                          </span>
                          <p className="text-gray-600 text-xs mt-0.5">estimado</p>
                        </div>
                      ) : (
                        <span className="text-gray-600">—</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {order.status === "delivered" && (
                          <button
                            onClick={() => handleGenerateInvoice(order.id)}
                            disabled={generatingInvoice === order.id}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded bg-green-500/10 text-green-400 hover:bg-green-500/20 disabled:opacity-50 text-xs transition-colors whitespace-nowrap"
                            title="Generar factura"
                          >
                            {generatingInvoice === order.id ? <IconSpinner /> : <IconReceipt />}
                            Factura
                          </button>
                        )}
                        <Link
                          href={`/dashboard/ordenes/${order.id}`}
                          className="text-gray-500 hover:text-[#e94560] text-xs transition-colors"
                        >
                          Ver →
                        </Link>
                      </div>
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
