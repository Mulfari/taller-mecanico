"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

// ── Types ──────────────────────────────────────────────────────────────────

interface MonthlyRevenueItem {
  label: string;
  amount: number;
}

interface StatusCountItem {
  status: string;
  label: string;
  count: number;
  color: string;
}

interface TopServiceItem {
  service: string;
  count: number;
}

// ── Shared ─────────────────────────────────────────────────────────────────

const fmt = (n: number) =>
  `$${n.toLocaleString("es-MX", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

const CHART_THEME = {
  bg: "#16213e",
  grid: "rgba(255,255,255,0.06)",
  axis: "#6b7280",
  accent: "#e94560",
  text: "#d1d5db",
  tooltipBg: "#0f172a",
  tooltipBorder: "rgba(255,255,255,0.1)",
};

function ChartTooltipContent({
  active,
  payload,
  label,
  valuePrefix,
  valueSuffix,
}: {
  active?: boolean;
  payload?: Array<{ value: number; name?: string; payload?: Record<string, unknown> }>;
  label?: string;
  valuePrefix?: string;
  valueSuffix?: string;
}) {
  if (!active || !payload?.length) return null;
  const val = payload[0].value;
  const displayLabel = label ?? (payload[0].payload as Record<string, string>)?.label ?? "";
  return (
    <div
      className="rounded-lg px-3 py-2 text-sm shadow-xl border"
      style={{
        backgroundColor: CHART_THEME.tooltipBg,
        borderColor: CHART_THEME.tooltipBorder,
      }}
    >
      <p className="text-gray-400 text-xs mb-0.5">{displayLabel}</p>
      <p className="text-white font-semibold">
        {valuePrefix ?? ""}
        {typeof val === "number" ? val.toLocaleString("es-MX") : val}
        {valueSuffix ?? ""}
      </p>
    </div>
  );
}

// ── Monthly Revenue Bar Chart ──────────────────────────────────────────────

export function MonthlyRevenueChart({ data }: { data: MonthlyRevenueItem[] }) {
  const allZero = data.every((m) => m.amount === 0);

  if (allZero) {
    return (
      <p className="text-gray-600 text-sm text-center py-8">Sin datos de ingresos aún</p>
    );
  }

  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={CHART_THEME.grid} vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fill: CHART_THEME.axis, fontSize: 12 }}
            axisLine={{ stroke: CHART_THEME.grid }}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: CHART_THEME.axis, fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v: number) => fmt(v)}
            width={70}
          />
          <Tooltip
            content={({ active, payload, label }) => (
              <ChartTooltipContent
                active={active}
                payload={payload as Array<{ value: number }>}
                label={label as string}
                valuePrefix="$"
              />
            )}
            cursor={{ fill: "rgba(255,255,255,0.03)" }}
          />
          <Bar dataKey="amount" fill={CHART_THEME.accent} radius={[4, 4, 0, 0]} maxBarSize={48} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ── Orders by Status Pie Chart ─────────────────────────────────────────────

const STATUS_PIE_COLORS: Record<string, string> = {
  received: "#9ca3af",
  diagnosing: "#facc15",
  repairing: "#60a5fa",
  ready: "#4ade80",
  delivered: "#6b7280",
};

export function OrdersByStatusChart({ data }: { data: StatusCountItem[] }) {
  if (data.length === 0) {
    return (
      <p className="text-gray-600 text-sm text-center py-8">Sin órdenes en este período</p>
    );
  }

  const total = data.reduce((s, d) => s + d.count, 0);

  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="count"
            nameKey="label"
            cx="50%"
            cy="50%"
            innerRadius={50}
            outerRadius={85}
            paddingAngle={2}
            strokeWidth={0}
          >
            {data.map((entry) => (
              <Cell
                key={entry.status}
                fill={STATUS_PIE_COLORS[entry.status] ?? "#9ca3af"}
              />
            ))}
          </Pie>
          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const item = payload[0].payload as StatusCountItem;
              const pct = Math.round((item.count / total) * 100);
              return (
                <div
                  className="rounded-lg px-3 py-2 text-sm shadow-xl border"
                  style={{
                    backgroundColor: CHART_THEME.tooltipBg,
                    borderColor: CHART_THEME.tooltipBorder,
                  }}
                >
                  <p className="text-gray-400 text-xs mb-0.5">{item.label}</p>
                  <p className="text-white font-semibold">
                    {item.count} orden{item.count !== 1 ? "es" : ""} ({pct}%)
                  </p>
                </div>
              );
            }}
          />
          <Legend
            verticalAlign="middle"
            align="right"
            layout="vertical"
            iconType="circle"
            iconSize={8}
            formatter={(value: string) => (
              <span className="text-gray-400 text-xs ml-1">{value}</span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

// ── Top Services Horizontal Bar Chart ──────────────────────────────────────

export function TopServicesChart({ data }: { data: TopServiceItem[] }) {
  if (data.length === 0) {
    return (
      <p className="text-gray-600 text-sm text-center py-8">Sin citas en este período</p>
    );
  }

  const chartData = data.map((d) => ({
    ...d,
    shortName: d.service.length > 20 ? d.service.slice(0, 18) + "…" : d.service,
  }));

  return (
    <div className="w-full" style={{ height: Math.max(180, data.length * 40 + 24) }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 4, right: 12, left: 4, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke={CHART_THEME.grid} horizontal={false} />
          <XAxis
            type="number"
            tick={{ fill: CHART_THEME.axis, fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            allowDecimals={false}
          />
          <YAxis
            type="category"
            dataKey="shortName"
            tick={{ fill: CHART_THEME.text, fontSize: 12 }}
            axisLine={false}
            tickLine={false}
            width={130}
          />
          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const item = payload[0].payload as TopServiceItem;
              return (
                <div
                  className="rounded-lg px-3 py-2 text-sm shadow-xl border"
                  style={{
                    backgroundColor: CHART_THEME.tooltipBg,
                    borderColor: CHART_THEME.tooltipBorder,
                  }}
                >
                  <p className="text-gray-400 text-xs mb-0.5">{item.service}</p>
                  <p className="text-white font-semibold">
                    {item.count} cita{item.count !== 1 ? "s" : ""}
                  </p>
                </div>
              );
            }}
            cursor={{ fill: "rgba(255,255,255,0.03)" }}
          />
          <Bar dataKey="count" fill="#60a5fa" radius={[0, 4, 4, 0]} maxBarSize={28} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
