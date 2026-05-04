"use client";

import { useState, useEffect, useTransition, useCallback, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { WorkOrderListItem, WorkOrderStatus } from "@/types/database";
import { EmptyState } from "@/components/ui";
import { createClient } from "@/lib/supabase/client";
import { generateInvoiceFromWorkOrder, advanceWorkOrderStatus } from "./actions";

// ── Icons ──────────────────────────────────────────────────────────────────

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

function IconList() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
    </svg>
  );
}

function IconKanban() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
    </svg>
  );
}

// ── Constants ──────────────────────────────────────────────────────────────

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

const STATUS_BORDER: Record<WorkOrderStatus, string> = {
  received: "border-gray-500/30",
  diagnosing: "border-yellow-500/30",
  repairing: "border-blue-500/30",
  ready: "border-green-500/30",
  delivered: "border-gray-600/30",
};

const STATUS_DOT: Record<WorkOrderStatus, string> = {
  received: "bg-gray-400",
  diagnosing: "bg-yellow-400",
  repairing: "bg-blue-400",
  ready: "bg-green-400",
  delivered: "bg-gray-600",
};

const KANBAN_COLUMNS: WorkOrderStatus[] = ["received", "diagnosing", "repairing", "ready", "delivered"];

const FILTER_TABS: { key: WorkOrderStatus | "all"; label: string }[] = [
  { key: "all", label: "Todas" },
  { key: "received", label: "Recibido" },
  { key: "diagnosing", label: "Diagnóstico" },
  { key: "repairing", label: "En reparación" },
  { key: "ready", label: "Listo" },
  { key: "delivered", label: "Entregado" },
];

// ── Sub-components ─────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: WorkOrderStatus }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[status]}`}>
      {STATUS_LABELS[status]}
    </span>
  );
}

function CostCell({ order }: { order: WorkOrderListItem }) {
  if (order.status === "delivered") {
    if (order.final_cost != null && order.final_cost > 0) {
      return (
        <div>
          <span className="text-green-400 font-medium">${Number(order.final_cost).toLocaleString("es-MX")}</span>
          <p className="text-gray-600 text-xs mt-0.5">final</p>
        </div>
      );
    }
  }
  if (order.estimated_cost != null && order.estimated_cost > 0) {
    return (
      <div>
        <span className="text-gray-300 font-medium">${Number(order.estimated_cost).toLocaleString("es-MX")}</span>
        <p className="text-gray-600 text-xs mt-0.5">estimado</p>
      </div>
    );
  }
  return <span className="text-gray-600">—</span>;
}

// ── Status flow ────────────────────────────────────────────────────────────

const NEXT_STATUS: Partial<Record<WorkOrderStatus, WorkOrderStatus>> = {
  received: "diagnosing",
  diagnosing: "repairing",
  repairing: "ready",
  ready: "delivered",
};

const NEXT_STATUS_LABEL: Partial<Record<WorkOrderStatus, string>> = {
  received: "Iniciar diagnóstico",
  diagnosing: "Iniciar reparación",
  repairing: "Marcar listo",
  ready: "Entregar",
};

// ── Kanban card ────────────────────────────────────────────────────────────

function KanbanCard({
  order,
  onGenerateInvoice,
  generatingInvoice,
  onAdvanceStatus,
  advancingId,
  onDragStart,
  isDragging,
}: {
  order: WorkOrderListItem;
  onGenerateInvoice: (id: string) => void;
  generatingInvoice: string | null;
  onAdvanceStatus: (id: string, next: WorkOrderStatus) => void;
  advancingId: string | null;
  onDragStart: (orderId: string) => void;
  isDragging: boolean;
}) {
  const cost =
    order.status === "delivered" && order.final_cost != null && order.final_cost > 0
      ? { value: `$${Number(order.final_cost).toLocaleString("es-MX")}`, label: "final", accent: true }
      : order.estimated_cost != null && order.estimated_cost > 0
      ? { value: `$${Number(order.estimated_cost).toLocaleString("es-MX")}`, label: "est.", accent: false }
      : null;

  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/plain", order.id);
        onDragStart(order.id);
      }}
      className={`bg-[#1a1a2e] border ${STATUS_BORDER[order.status]} rounded-xl p-3.5 space-y-2.5 hover:border-white/20 transition-colors group cursor-grab active:cursor-grabbing ${isDragging ? "opacity-40 scale-95" : ""}`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <Link href={`/dashboard/ordenes/${order.id}`} className="block min-w-0">
          <p className="text-[#e94560] font-mono text-xs group-hover:underline">
            OT-{order.id.slice(0, 6).toUpperCase()}
          </p>
          <p className="text-white font-semibold text-sm mt-0.5 truncate">
            {order.client?.full_name ?? "—"}
          </p>
        </Link>
        {cost && (
          <div className="shrink-0 text-right">
            <p className={`text-xs font-bold ${cost.accent ? "text-green-400" : "text-gray-300"}`}>
              {cost.value}
            </p>
            <p className="text-gray-600 text-xs">{cost.label}</p>
          </div>
        )}
      </div>

      {/* Vehicle */}
      {order.vehicle && (
        <p className="text-gray-400 text-xs truncate">
          {order.vehicle.brand} {order.vehicle.model} {order.vehicle.year}
          {order.vehicle.plate ? ` · ${order.vehicle.plate}` : ""}
        </p>
      )}

      {/* Description */}
      {order.description && (
        <p className="text-gray-500 text-xs line-clamp-2 leading-relaxed">{order.description}</p>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-1 border-t border-white/5">
        <p className={`text-xs ${order.mechanic ? "text-gray-400" : "text-gray-600"}`}>
          {order.mechanic?.full_name ?? "Sin mecánico"}
        </p>
        <div className="flex items-center gap-1.5">
          {order.status === "delivered" && (
            <button
              onClick={() => onGenerateInvoice(order.id)}
              disabled={generatingInvoice === order.id}
              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-green-500/10 text-green-400 hover:bg-green-500/20 disabled:opacity-50 text-xs transition-colors"
              title="Generar factura"
            >
              {generatingInvoice === order.id ? <IconSpinner /> : <IconReceipt />}
            </button>
          )}
          <Link
            href={`/dashboard/ordenes/${order.id}`}
            className="text-gray-600 hover:text-[#e94560] text-xs transition-colors"
          >
            Ver →
          </Link>
        </div>
      </div>

      {/* Advance status button */}
      {NEXT_STATUS[order.status] && (
        <button
          onClick={() => onAdvanceStatus(order.id, NEXT_STATUS[order.status]!)}
          disabled={advancingId === order.id}
          className="w-full mt-1 inline-flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg bg-[#e94560]/10 hover:bg-[#e94560]/20 text-[#e94560] disabled:opacity-50 text-xs font-medium transition-colors border border-[#e94560]/20 hover:border-[#e94560]/40"
        >
          {advancingId === order.id ? (
            <IconSpinner />
          ) : (
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          )}
          {NEXT_STATUS_LABEL[order.status]}
        </button>
      )}
    </div>
  );
}

// ── Kanban view ────────────────────────────────────────────────────────────

function KanbanView({
  orders,
  onGenerateInvoice,
  generatingInvoice,
  onAdvanceStatus,
  advancingId,
  onDropToStatus,
  draggingId,
  onDragStart,
}: {
  orders: WorkOrderListItem[];
  onGenerateInvoice: (id: string) => void;
  generatingInvoice: string | null;
  onAdvanceStatus: (id: string, next: WorkOrderStatus) => void;
  advancingId: string | null;
  onDropToStatus: (orderId: string, newStatus: WorkOrderStatus) => void;
  draggingId: string | null;
  onDragStart: (orderId: string) => void;
}) {
  const [dropTarget, setDropTarget] = useState<WorkOrderStatus | null>(null);
  const dragCounters = useRef<Record<string, number>>({});

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }

  function handleDragEnter(status: WorkOrderStatus, e: React.DragEvent) {
    e.preventDefault();
    dragCounters.current[status] = (dragCounters.current[status] || 0) + 1;
    setDropTarget(status);
  }

  function handleDragLeave(status: WorkOrderStatus) {
    dragCounters.current[status] = (dragCounters.current[status] || 0) - 1;
    if (dragCounters.current[status] <= 0) {
      dragCounters.current[status] = 0;
      if (dropTarget === status) setDropTarget(null);
    }
  }

  function handleDrop(status: WorkOrderStatus, e: React.DragEvent) {
    e.preventDefault();
    dragCounters.current[status] = 0;
    setDropTarget(null);
    const orderId = e.dataTransfer.getData("text/plain");
    if (orderId) {
      const order = orders.find((o) => o.id === orderId);
      if (order && order.status !== status) {
        onDropToStatus(orderId, status);
      }
    }
  }

  return (
    <div className="flex gap-4 overflow-x-auto pb-4 min-h-[400px]" style={{ scrollbarWidth: "thin" }}>
      {KANBAN_COLUMNS.map((status) => {
        const colOrders = orders.filter((o) => o.status === status);
        const isOver = dropTarget === status && draggingId != null;
        const draggingOrder = draggingId ? orders.find((o) => o.id === draggingId) : null;
        const isDifferentColumn = draggingOrder ? draggingOrder.status !== status : false;
        const showHighlight = isOver && isDifferentColumn;

        return (
          <div
            key={status}
            className="flex-none w-72"
            onDragOver={handleDragOver}
            onDragEnter={(e) => handleDragEnter(status, e)}
            onDragLeave={() => handleDragLeave(status)}
            onDrop={(e) => handleDrop(status, e)}
          >
            {/* Column header */}
            <div className="flex items-center gap-2 mb-3 px-1">
              <span className={`w-2 h-2 rounded-full shrink-0 ${STATUS_DOT[status]}`} />
              <span className="text-white font-semibold text-sm">{STATUS_LABELS[status]}</span>
              <span className="ml-auto text-xs bg-white/10 text-gray-400 px-2 py-0.5 rounded-full font-medium">
                {colOrders.length}
              </span>
            </div>

            {/* Cards */}
            <div className={`space-y-3 min-h-[80px] rounded-xl p-1.5 -m-1.5 transition-all duration-200 ${showHighlight ? "bg-[#e94560]/10 ring-2 ring-[#e94560]/40 ring-dashed" : ""}`}>
              {colOrders.length === 0 ? (
                <div className={`border rounded-xl py-8 text-center transition-colors ${showHighlight ? "bg-[#e94560]/5 border-[#e94560]/30" : "bg-[#16213e] border-white/5"}`}>
                  <p className={`text-xs ${showHighlight ? "text-[#e94560]" : "text-gray-600"}`}>
                    {showHighlight ? "Soltar aquí" : "Sin órdenes"}
                  </p>
                </div>
              ) : (
                colOrders.map((order) => (
                  <KanbanCard
                    key={order.id}
                    order={order}
                    onGenerateInvoice={onGenerateInvoice}
                    generatingInvoice={generatingInvoice}
                    onAdvanceStatus={onAdvanceStatus}
                    advancingId={advancingId}
                    onDragStart={onDragStart}
                    isDragging={draggingId === order.id}
                  />
                ))
              )}
              {showHighlight && colOrders.length > 0 && (
                <div className="border-2 border-dashed border-[#e94560]/40 rounded-xl py-4 text-center">
                  <p className="text-[#e94560] text-xs font-medium">Soltar aquí</p>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────

type DateRange = "all" | "today" | "week" | "month" | "year";

const DATE_RANGE_LABELS: Record<DateRange, string> = {
  all: "Todas las fechas",
  today: "Hoy",
  week: "Esta semana",
  month: "Este mes",
  year: "Este año",
};

function getDateRangeStart(range: DateRange): Date | null {
  if (range === "all") return null;
  const now = new Date();
  switch (range) {
    case "today":
      return new Date(now.getFullYear(), now.getMonth(), now.getDate());
    case "week": {
      const day = now.getDay();
      const diff = day === 0 ? -6 : 1 - day;
      return new Date(now.getFullYear(), now.getMonth(), now.getDate() + diff);
    }
    case "month":
      return new Date(now.getFullYear(), now.getMonth(), 1);
    case "year":
      return new Date(now.getFullYear(), 0, 1);
  }
}

export default function OrdenesClient({
  orders: initialOrders,
  initialFilter = "all",
}: {
  orders: WorkOrderListItem[];
  initialFilter?: WorkOrderStatus | "all";
}) {
  const router = useRouter();
  const [orders, setOrders] = useState(initialOrders);
  const [activeFilter, setActiveFilter] = useState<WorkOrderStatus | "all">(initialFilter);
  const [mechanicFilter, setMechanicFilter] = useState<string>("all");
  const [dateRange, setDateRange] = useState<DateRange>("all");
  const [search, setSearch] = useState("");
  const [view, setView] = useState<"list" | "kanban">("list");
  const [generatingInvoice, setGeneratingInvoice] = useState<string | null>(null);
  const [advancingId, setAdvancingId] = useState<string | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [realtimeConnected, setRealtimeConnected] = useState(false);
  const [, startTransition] = useTransition();

  // Supabase Realtime: live order status updates
  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel("dashboard_work_orders")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "work_orders",
        },
        (payload) => {
          if (payload.eventType === "UPDATE") {
            setOrders((prev) =>
              prev.map((o) =>
                o.id === payload.new.id
                  ? {
                      ...o,
                      status: payload.new.status as WorkOrderStatus,
                      description: payload.new.description ?? o.description,
                      diagnosis: payload.new.diagnosis ?? o.diagnosis,
                      estimated_cost: payload.new.estimated_cost ?? o.estimated_cost,
                      final_cost: payload.new.final_cost ?? o.final_cost,
                      mechanic_id: payload.new.mechanic_id ?? o.mechanic_id,
                      received_at: payload.new.received_at ?? o.received_at,
                      estimated_delivery: payload.new.estimated_delivery ?? o.estimated_delivery,
                      delivered_at: payload.new.delivered_at ?? o.delivered_at,
                    }
                  : o
              )
            );
          } else if (payload.eventType === "INSERT") {
            router.refresh();
          } else if (payload.eventType === "DELETE") {
            setOrders((prev) => prev.filter((o) => o.id !== payload.old.id));
          }
        }
      )
      .subscribe((status) => {
        setRealtimeConnected(status === "SUBSCRIBED");
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [router]);

  // Sync with server data when initialOrders changes (e.g. after router.refresh)
  const syncOrders = useCallback(() => {
    setOrders(initialOrders);
  }, [initialOrders]);

  useEffect(() => {
    syncOrders();
  }, [syncOrders]);

  // Clear drag state on global dragend (e.g. user drops outside any column)
  useEffect(() => {
    function onDragEnd() {
      setDraggingId(null);
    }
    document.addEventListener("dragend", onDragEnd);
    return () => document.removeEventListener("dragend", onDragEnd);
  }, []);

  function handleDropToStatus(orderId: string, newStatus: WorkOrderStatus) {
    setDraggingId(null);
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
    );
    startTransition(async () => {
      try {
        await advanceWorkOrderStatus(orderId, newStatus);
      } catch {
        setOrders(initialOrders);
      }
    });
  }

  async function handleGenerateInvoice(orderId: string) {
    setGeneratingInvoice(orderId);
    try {
      const invoiceId = await generateInvoiceFromWorkOrder(orderId);
      router.push(`/dashboard/facturas/${invoiceId}`);
    } finally {
      setGeneratingInvoice(null);
    }
  }

  function handleAdvanceStatus(orderId: string, next: WorkOrderStatus) {
    setAdvancingId(orderId);
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: next } : o))
    );
    startTransition(async () => {
      try {
        await advanceWorkOrderStatus(orderId, next);
      } catch {
        setOrders(initialOrders);
      } finally {
        setAdvancingId(null);
      }
    });
  }

  const q = search.trim().toLowerCase();

  const mechanics = Array.from(
    new Map(
      orders
        .filter((o) => o.mechanic?.id)
        .map((o) => [o.mechanic!.id, o.mechanic!.full_name ?? "Sin nombre"])
    )
  ).sort((a, b) => a[1].localeCompare(b[1]));

  const dateRangeStart = getDateRangeStart(dateRange);

  const filtered = orders.filter((o) => {
    const matchesStatus = view === "kanban" || activeFilter === "all" || o.status === activeFilter;
    if (!matchesStatus) return false;
    if (mechanicFilter !== "all") {
      if (mechanicFilter === "none") {
        if (o.mechanic?.id) return false;
      } else {
        if (o.mechanic?.id !== mechanicFilter) return false;
      }
    }
    if (dateRangeStart) {
      const orderDate = new Date(o.received_at);
      if (orderDate < dateRangeStart) return false;
    }
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
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
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

        <div className="flex items-center gap-2 flex-wrap">
          {/* Mechanic filter */}
          {mechanics.length > 0 && (
            <select
              value={mechanicFilter}
              onChange={(e) => setMechanicFilter(e.target.value)}
              className="bg-[#16213e] border border-white/10 rounded-lg px-3 py-1.5 text-sm text-gray-300 focus:outline-none focus:border-[#e94560]/60 focus:ring-1 focus:ring-[#e94560]/30 transition-colors appearance-none pr-8"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236b7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E")`,
                backgroundRepeat: "no-repeat",
                backgroundPosition: "right 0.5rem center",
                backgroundSize: "1rem",
              }}
              aria-label="Filtrar por mecánico"
            >
              <option value="all">Todos los mecánicos</option>
              <option value="none">Sin mecánico asignado</option>
              {mechanics.map(([id, name]) => (
                <option key={id} value={id}>{name}</option>
              ))}
            </select>
          )}

          {/* Date range filter */}
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value as DateRange)}
            className="bg-[#16213e] border border-white/10 rounded-lg px-3 py-1.5 text-sm text-gray-300 focus:outline-none focus:border-[#e94560]/60 focus:ring-1 focus:ring-[#e94560]/30 transition-colors appearance-none pr-8"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236b7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E")`,
              backgroundRepeat: "no-repeat",
              backgroundPosition: "right 0.5rem center",
              backgroundSize: "1rem",
            }}
            aria-label="Filtrar por fecha"
          >
            {(Object.keys(DATE_RANGE_LABELS) as DateRange[]).map((key) => (
              <option key={key} value={key}>{DATE_RANGE_LABELS[key]}</option>
            ))}
          </select>

          {/* Filter tabs — only in list view */}
          {view === "list" && FILTER_TABS.map((tab) => {
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

          {/* Realtime indicator */}
          <span
            className={`inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded-lg ${
              realtimeConnected
                ? "text-green-400 bg-green-500/10 border border-green-500/20"
                : "text-gray-600 bg-white/5 border border-white/5"
            }`}
            title={realtimeConnected ? "Actualizaciones en tiempo real activas" : "Conectando…"}
            aria-live="polite"
          >
            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${realtimeConnected ? "bg-green-400 animate-pulse" : "bg-gray-600"}`} />
            <span className="hidden sm:inline">{realtimeConnected ? "En vivo" : "Conectando…"}</span>
          </span>

          {/* View toggle */}
          <div className="flex items-center bg-[#16213e] border border-white/10 rounded-lg p-0.5 ml-auto sm:ml-0">
            <button
              onClick={() => setView("list")}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                view === "list" ? "bg-white/10 text-white" : "text-gray-500 hover:text-gray-300"
              }`}
              aria-label="Vista lista"
              title="Vista lista"
            >
              <IconList />
              <span className="hidden sm:inline">Lista</span>
            </button>
            <button
              onClick={() => setView("kanban")}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                view === "kanban" ? "bg-white/10 text-white" : "text-gray-500 hover:text-gray-300"
              }`}
              aria-label="Vista tablero"
              title="Vista tablero"
            >
              <IconKanban />
              <span className="hidden sm:inline">Tablero</span>
            </button>
          </div>
        </div>
      </div>

      {/* Kanban view */}
      {view === "kanban" && (
        <KanbanView
          orders={filtered}
          onGenerateInvoice={handleGenerateInvoice}
          generatingInvoice={generatingInvoice}
          onAdvanceStatus={handleAdvanceStatus}
          advancingId={advancingId}
          onDropToStatus={handleDropToStatus}
          draggingId={draggingId}
          onDragStart={setDraggingId}
        />
      )}

      {/* List view */}
      {view === "list" && (
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
                        <CostCell order={order} />
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {NEXT_STATUS[order.status] && (
                            <button
                              onClick={() => handleAdvanceStatus(order.id, NEXT_STATUS[order.status]!)}
                              disabled={advancingId === order.id}
                              className="inline-flex items-center gap-1 px-2 py-1 rounded bg-[#e94560]/10 text-[#e94560] hover:bg-[#e94560]/20 disabled:opacity-50 text-xs font-medium transition-colors whitespace-nowrap border border-[#e94560]/20 hover:border-[#e94560]/40"
                            >
                              {advancingId === order.id ? (
                                <IconSpinner />
                              ) : (
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                </svg>
                              )}
                              {NEXT_STATUS_LABEL[order.status]}
                            </button>
                          )}
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
      )}
    </>
  );
}
