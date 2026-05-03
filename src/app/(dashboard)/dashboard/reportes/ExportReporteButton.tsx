"use client";

interface MonthlyRevenue { label: string; amount: number }
interface TopService { service: string; count: number }
interface TopClient { name: string; email: string; orders: number; revenue: number }
interface MechanicStat { name: string; total: number; delivered: number; revenue: number }
interface LowStockItem { name: string; category: string | null; quantity: number; min_stock: number | null }

interface ExportData {
  period: string;
  totalRevenue: number;
  totalOrders: number;
  activeOrders: number;
  monthlyRevenue: MonthlyRevenue[];
  topServices: TopService[];
  topClients: TopClient[];
  mechanicStats: MechanicStat[];
  lowStock: LowStockItem[];
}

function escape(v: string | number | null | undefined): string {
  const s = String(v ?? "");
  return s.includes(",") || s.includes('"') || s.includes("\n")
    ? `"${s.replace(/"/g, '""')}"`
    : s;
}

function buildCSV(data: ExportData): string {
  const rows: string[] = [];
  const fmt = (n: number) => n.toFixed(2);

  rows.push(`Reporte TallerPro — Período: ${data.period}`);
  rows.push(`Generado: ${new Date().toLocaleString("es-MX")}`);
  rows.push("");

  // KPIs
  rows.push("RESUMEN GENERAL");
  rows.push(["Métrica", "Valor"].map(escape).join(","));
  rows.push(["Ingresos totales", `$${fmt(data.totalRevenue)}`].map(escape).join(","));
  rows.push(["Órdenes totales", data.totalOrders].map(escape).join(","));
  rows.push(["Órdenes activas", data.activeOrders].map(escape).join(","));
  rows.push("");

  // Monthly revenue
  rows.push("INGRESOS POR MES (últimos 6 meses)");
  rows.push(["Mes", "Ingresos"].map(escape).join(","));
  for (const m of data.monthlyRevenue) {
    rows.push([m.label, `$${fmt(m.amount)}`].map(escape).join(","));
  }
  rows.push("");

  // Top services
  if (data.topServices.length > 0) {
    rows.push("SERVICIOS MÁS SOLICITADOS");
    rows.push(["Servicio", "Cantidad"].map(escape).join(","));
    for (const s of data.topServices) {
      rows.push([s.service, s.count].map(escape).join(","));
    }
    rows.push("");
  }

  // Top clients
  if (data.topClients.length > 0) {
    rows.push("TOP CLIENTES POR INGRESOS");
    rows.push(["Cliente", "Email", "Órdenes", "Ingresos"].map(escape).join(","));
    for (const c of data.topClients) {
      rows.push([c.name, c.email, c.orders, `$${fmt(c.revenue)}`].map(escape).join(","));
    }
    rows.push("");
  }

  // Mechanic stats
  if (data.mechanicStats.length > 0) {
    rows.push("RENDIMIENTO POR MECÁNICO");
    rows.push(["Mecánico", "Órdenes totales", "Entregadas", "% Completado", "Ingresos"].map(escape).join(","));
    for (const m of data.mechanicStats) {
      const pct = m.total > 0 ? Math.round((m.delivered / m.total) * 100) : 0;
      rows.push([m.name, m.total, m.delivered, `${pct}%`, `$${fmt(m.revenue)}`].map(escape).join(","));
    }
    rows.push("");
  }

  // Low stock
  if (data.lowStock.length > 0) {
    rows.push("ALERTAS DE STOCK BAJO");
    rows.push(["Artículo", "Categoría", "Stock actual", "Stock mínimo"].map(escape).join(","));
    for (const i of data.lowStock) {
      rows.push([i.name, i.category ?? "", i.quantity, i.min_stock ?? 0].map(escape).join(","));
    }
  }

  return rows.join("\n");
}

export default function ExportReporteButton({ data }: { data: ExportData }) {
  function handleExport() {
    const csv = buildCSV(data);
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `reporte-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <button
      onClick={handleExport}
      className="inline-flex items-center gap-2 bg-[#16213e] border border-white/10 hover:border-white/20 text-gray-300 hover:text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
      </svg>
      Exportar CSV
    </button>
  );
}
