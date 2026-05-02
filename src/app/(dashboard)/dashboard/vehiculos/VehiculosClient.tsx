"use client";

import { useState, useMemo } from "react";
import Link from "next/link";

// ── Icons ──────────────────────────────────────────────────────────────────

function IconSearch() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  );
}

function IconCar() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
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

function IconX() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

// ── Types ──────────────────────────────────────────────────────────────────

interface Vehicle {
  id: string;
  brand: string;
  model: string;
  year: number;
  plate: string | null;
  color: string | null;
  vin: string | null;
  mileage: number | null;
  created_at: string;
  owner: { id: string; full_name: string | null; email: string; phone: string | null } | null;
}

// ── Component ──────────────────────────────────────────────────────────────

export default function VehiculosClient({ vehicles }: { vehicles: Vehicle[] }) {
  const [search, setSearch] = useState("");

  const q = search.trim().toLowerCase();

  const filtered = useMemo(() => {
    if (!q) return vehicles;
    return vehicles.filter(
      (v) =>
        v.brand.toLowerCase().includes(q) ||
        v.model.toLowerCase().includes(q) ||
        String(v.year).includes(q) ||
        v.plate?.toLowerCase().includes(q) ||
        v.color?.toLowerCase().includes(q) ||
        v.vin?.toLowerCase().includes(q) ||
        v.owner?.full_name?.toLowerCase().includes(q) ||
        v.owner?.email?.toLowerCase().includes(q) ||
        v.owner?.phone?.includes(q)
    );
  }, [vehicles, q]);

  // Group by brand for a nicer layout
  const brands = useMemo(() => {
    const map: Record<string, Vehicle[]> = {};
    for (const v of filtered) {
      if (!map[v.brand]) map[v.brand] = [];
      map[v.brand].push(v);
    }
    return Object.entries(map).sort((a, b) => a[0].localeCompare(b[0]));
  }, [filtered]);

  return (
    <div className="space-y-5">
      {/* Search */}
      <div className="relative max-w-sm">
        <span className="absolute inset-y-0 left-3 flex items-center text-gray-500 pointer-events-none">
          <IconSearch />
        </span>
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por marca, patente, cliente…"
          className="w-full bg-[#16213e] border border-white/10 rounded-lg pl-9 pr-8 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#e94560]/60 focus:ring-1 focus:ring-[#e94560]/30 transition-colors"
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

      {/* Results count when searching */}
      {q && (
        <p className="text-gray-500 text-sm">
          {filtered.length} resultado{filtered.length !== 1 ? "s" : ""} para &ldquo;{search}&rdquo;
        </p>
      )}

      {/* Empty state */}
      {filtered.length === 0 && (
        <div className="bg-[#16213e] border border-white/10 rounded-xl p-12 text-center">
          <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4 text-gray-600">
            <IconCar />
          </div>
          <p className="text-gray-400 font-medium">
            {q ? "Sin resultados" : "No hay vehículos registrados"}
          </p>
          <p className="text-gray-600 text-sm mt-1">
            {q ? "Probá con otra búsqueda" : "Los vehículos aparecen aquí cuando los clientes los registran"}
          </p>
        </div>
      )}

      {/* Grouped by brand (when not searching) or flat list (when searching) */}
      {filtered.length > 0 && !q && (
        <div className="space-y-6">
          {brands.map(([brand, brandVehicles]) => (
            <div key={brand}>
              <h2 className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-2 px-1">
                {brand} <span className="text-gray-700 font-normal normal-case">({brandVehicles.length})</span>
              </h2>
              <div className="bg-[#16213e] border border-white/10 rounded-xl overflow-hidden">
                {brandVehicles.map((v, i) => (
                  <VehicleRow key={v.id} vehicle={v} last={i === brandVehicles.length - 1} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {filtered.length > 0 && q && (
        <div className="bg-[#16213e] border border-white/10 rounded-xl overflow-hidden">
          {filtered.map((v, i) => (
            <VehicleRow key={v.id} vehicle={v} last={i === filtered.length - 1} />
          ))}
        </div>
      )}
    </div>
  );
}

function VehicleRow({ vehicle: v, last }: { vehicle: Vehicle; last: boolean }) {
  return (
    <Link
      href={`/dashboard/vehiculos/${v.id}`}
      className={`flex items-center gap-4 px-5 py-4 hover:bg-white/[0.03] transition-colors group ${
        !last ? "border-b border-white/5" : ""
      }`}
    >
      {/* Icon */}
      <div className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center shrink-0 text-gray-500 group-hover:text-[#e94560] group-hover:bg-[#e94560]/10 transition-colors">
        <IconCar />
      </div>

      {/* Main info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-white font-medium text-sm">
            {v.brand} {v.model} {v.year}
          </span>
          {v.plate && (
            <span className="text-xs font-mono px-1.5 py-0.5 rounded bg-white/5 text-gray-400 border border-white/10">
              {v.plate}
            </span>
          )}
          {v.color && (
            <span className="text-xs text-gray-600">{v.color}</span>
          )}
        </div>
        <p className="text-gray-500 text-xs mt-0.5 truncate">
          {v.owner?.full_name ?? v.owner?.email ?? "Sin propietario"}
          {v.mileage ? ` · ${v.mileage.toLocaleString("es-MX")} km` : ""}
        </p>
      </div>

      {/* Chevron */}
      <span className="text-gray-700 group-hover:text-gray-400 transition-colors shrink-0">
        <IconChevronRight />
      </span>
    </Link>
  );
}
