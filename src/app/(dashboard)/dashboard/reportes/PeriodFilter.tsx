"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";

const PERIODS = [
  { key: "today", label: "Hoy" },
  { key: "week",  label: "Esta semana" },
  { key: "month", label: "Este mes" },
  { key: "year",  label: "Este año" },
  { key: "all",   label: "Todo" },
] as const;

export default function PeriodFilter({ current }: { current: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function select(key: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (key === "all") params.delete("period");
    else params.set("period", key);
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  }

  return (
    <div className="flex flex-wrap gap-2">
      {PERIODS.map((p) => (
        <button
          key={p.key}
          onClick={() => select(p.key)}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            current === p.key
              ? "bg-[#e94560] text-white"
              : "bg-[#16213e] border border-white/10 text-gray-400 hover:text-white hover:border-white/20"
          }`}
        >
          {p.label}
        </button>
      ))}
    </div>
  );
}
