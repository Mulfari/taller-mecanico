"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import type { InvoiceStatus } from "@/types/database";
import { updateInvoiceStatus } from "./actions";

interface InvoiceRow {
  id: string;
  subtotal: number | null;
  tax: number | null;
  total: number | null;
  status: InvoiceStatus;
  paid_at: string | null;
  created_at: string;
  work_order_id: string | null;
  quote_id: string | null;
  client: { full_name: string | null; email: string | null } | null;
  work_order: { id: string; description: string | null } | null;
}

const STATUS_LABELS: Record<InvoiceStatus, string> = {
  draft: "Borrador",
  sent: "Enviada",
  paid: "Pagada",
};

const STATUS_COLORS: Record<InvoiceStatus, string> = {
  draft: "bg-gray-500/20 text-gray-300",
  sent: "bg-blue-500/20 text-blue-300",
  paid: "bg-green-500/20 text-green-300",
};

const FILTER_TABS: { key: InvoiceStatus | "all"; label: string }[] = [
  { key: "all", label: "Todas" },
  { key: "draft", label: "Borrador" },
  { key: "sent", label: "Enviadas" },
  { key: "paid", label: "Pagadas" },
];

const fmt = (n: number | null) =>
  n != null
    ? `$${n.toLocaleString("es-MX", { minimumFractionDigits: 2 })}`
    : "—";

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

export default function FacturasClient({ facturas: initialFacturas }: { facturas: InvoiceRow[] }) {
  const [activeFilter, setActiveFilter] = useState<InvoiceStatus | "all">("all");
  const [facturas, setFacturas] = useState(initialFacturas);
  const [actionPending, setActionPending] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  async function handleStatusChange(id: string, status: InvoiceStatus) {
    setActionPending(id);
    try {
      await updateInvoiceStatus(id, status);
      setFacturas((prev) =>
        prev.map((f) =>
          f.id === id
            ? { ...f, status, paid_at: status === "paid" ? new Date().toISOString() : f.paid_at }
            : f
        )
      );
    } finally {
      setActionPending(null);
    }
  }

  const filtered =
    activeFilter === "all"
      ? facturas
      : facturas.filter((f) => f.status === activeFilter);

  const countFor = (key: InvoiceStatus | "all") =>
    key === "all" ? facturas.length : facturas.filter((f) => f.status === key).length;

  const totalPaid = facturas
    .filter((f) => f.status === "paid")
    .reduce((sum, f) => sum + (f.total ?? 0), 0);

  const totalPending = facturas
    .filter((f) => f.status === "sent")
    .reduce((sum, f) => sum + (f.total ?? 0), 0);

  return (
    <>
      {/* KPI strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#16213e] border border-white/10 rounded-xl p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-green-500/10 flex items-center justify-center text-green-400 shrink-0">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p className="text-gray-500 text-xs">Cobrado</p>
            <p className="text-white font-bold">{fmt(totalPaid)}</p>
          </div>
        </div>
        <div className="bg-[#16213e] border border-white/10 rounded-xl p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400 shrink-0">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p className="text-gray-500 text-xs">Por cobrar</p>
            <p className="text-white font-bold">{fmt(totalPending)}</p>
          </div>
        </div>
        <div className="bg-[#16213e] border border-white/10 rounded-xl p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-[#e94560]/10 flex items-center justify-center text-[#e94560] shrink-0">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <div>
            <p className="text-gray-500 text-xs">Total facturas</p>
            <p className="text-white font-bold">{facturas.length}</p>
          </div>
        </div>
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
          <table className="w-full text-sm min-w-[640px]">
            <thead>
              <tr className="text-gray-500 text-xs uppercase tracking-wide border-b border-white/5">
                <th className="text-left py-3 px-4 font-medium">Factura / Cliente</th>
                <th className="text-left py-3 px-4 font-medium">Orden de trabajo</th>
                <th className="text-left py-3 px-4 font-medium">Estado</th>
                <th className="text-left py-3 px-4 font-medium">Fecha</th>
                <th className="text-right py-3 px-4 font-medium">Total</th>
                <th className="py-3 px-4" />
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-16 text-center">
                    <p className="text-gray-500 text-sm">
                      {activeFilter === "all"
                        ? "No hay facturas registradas"
                        : `No hay facturas con estado "${STATUS_LABELS[activeFilter as InvoiceStatus]}"`}
                    </p>
                  </td>
                </tr>
              ) : (
                filtered.map((factura) => (
                  <tr key={factura.id} className="hover:bg-white/3 transition-colors">
                    <td className="py-3.5 px-4">
                      <p className="text-[#e94560] font-mono text-xs">
                        #{factura.id.slice(0, 8).toUpperCase()}
                      </p>
                      <p className="text-white font-medium mt-0.5">
                        {factura.client?.full_name ?? "—"}
                      </p>
                      {factura.client?.email && (
                        <p className="text-gray-600 text-xs mt-0.5 truncate max-w-[200px]">
                          {factura.client.email}
                        </p>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      {factura.work_order ? (
                        <Link
                          href={`/dashboard/ordenes/${factura.work_order.id}`}
                          className="text-gray-300 hover:text-[#e94560] transition-colors text-xs font-mono"
                        >
                          #{factura.work_order.id.slice(0, 8).toUpperCase()}
                        </Link>
                      ) : factura.quote_id ? (
                        <span className="text-gray-500 text-xs">
                          Cotización #{factura.quote_id.slice(0, 8).toUpperCase()}
                        </span>
                      ) : (
                        <span className="text-gray-600">—</span>
                      )}
                      {factura.work_order?.description && (
                        <p className="text-gray-600 text-xs mt-0.5 truncate max-w-[180px]">
                          {factura.work_order.description}
                        </p>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[factura.status]}`}
                      >
                        {STATUS_LABELS[factura.status]}
                      </span>
                      {factura.paid_at && (
                        <p className="text-gray-600 text-xs mt-1">
                          Pagado {fmtDate(factura.paid_at)}
                        </p>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-gray-400 text-xs whitespace-nowrap">
                      {fmtDate(factura.created_at)}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div>
                        <p className="text-white font-semibold">{fmt(factura.total)}</p>
                        {factura.tax != null && factura.tax > 0 && (
                          <p className="text-gray-600 text-xs mt-0.5">
                            IVA {fmt(factura.tax)}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/dashboard/facturas/${factura.id}`}
                          className="text-gray-500 hover:text-[#e94560] text-xs transition-colors"
                        >
                          Ver →
                        </Link>
                        {factura.status === "draft" && (
                          <button
                            onClick={() => handleStatusChange(factura.id, "sent")}
                            disabled={actionPending === factura.id}
                            className="inline-flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 disabled:opacity-50 transition-colors whitespace-nowrap"
                            title="Marcar como enviada"
                          >
                            {actionPending === factura.id ? (
                              <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" /></svg>
                            ) : (
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                            )}
                            Enviar
                          </button>
                        )}
                        {factura.status === "sent" && (
                          <button
                            onClick={() => handleStatusChange(factura.id, "paid")}
                            disabled={actionPending === factura.id}
                            className="inline-flex items-center gap-1 text-xs text-green-400 hover:text-green-300 disabled:opacity-50 transition-colors whitespace-nowrap"
                            title="Marcar como pagada"
                          >
                            {actionPending === factura.id ? (
                              <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" /></svg>
                            ) : (
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            )}
                            Cobrada
                          </button>
                        )}
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
