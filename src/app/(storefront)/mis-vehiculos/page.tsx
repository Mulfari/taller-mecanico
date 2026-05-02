"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

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
  notes: string | null;
  created_at: string;
}

interface VehicleStats {
  totalOrders: number;
  activeOrders: number;
  lastService: string | null;
}

// ── Icons ──────────────────────────────────────────────────────────────────

function IconCar() {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
    </svg>
  );
}

function IconWrench() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437l1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008z" />
    </svg>
  );
}

function IconSearch() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
    </svg>
  );
}

function IconCalendar() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
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

function IconLock() {
  return (
    <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
    </svg>
  );
}

function IconSpinner() {
  return (
    <svg className="w-6 h-6 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
    </svg>
  );
}

// ── Vehicle Card ───────────────────────────────────────────────────────────

function VehicleCard({ vehicle, stats }: { vehicle: Vehicle; stats: VehicleStats }) {
  const fmtDate = (d: string) =>
    new Date(d.includes("T") ? d : d + "T00:00:00").toLocaleDateString("es-MX", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

  return (
    <div className="bg-[#16213e] border border-white/10 rounded-xl overflow-hidden hover:border-[#e94560]/20 transition-colors">
      {/* Header */}
      <div className="p-5 border-b border-white/5">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-[#e94560]/10 border border-[#e94560]/20 flex items-center justify-center text-[#e94560] shrink-0">
            <IconCar />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-white font-bold text-lg leading-tight">
              {vehicle.brand} {vehicle.model}
            </h2>
            <p className="text-gray-400 text-sm mt-0.5">{vehicle.year}</p>
          </div>
          {stats.activeOrders > 0 && (
            <span className="shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-500/20 text-blue-300">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
              En taller
            </span>
          )}
        </div>
      </div>

      {/* Details grid */}
      <div className="px-5 py-4 grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
        {vehicle.plate && (
          <div>
            <p className="text-gray-500 text-xs uppercase tracking-wide font-medium mb-0.5">Placa</p>
            <p className="text-white font-mono">{vehicle.plate}</p>
          </div>
        )}
        {vehicle.color && (
          <div>
            <p className="text-gray-500 text-xs uppercase tracking-wide font-medium mb-0.5">Color</p>
            <p className="text-gray-300">{vehicle.color}</p>
          </div>
        )}
        {vehicle.mileage != null && (
          <div>
            <p className="text-gray-500 text-xs uppercase tracking-wide font-medium mb-0.5">Kilometraje</p>
            <p className="text-gray-300">{vehicle.mileage.toLocaleString("es-MX")} km</p>
          </div>
        )}
        {vehicle.vin && (
          <div className="col-span-2 sm:col-span-3">
            <p className="text-gray-500 text-xs uppercase tracking-wide font-medium mb-0.5">VIN</p>
            <p className="text-gray-400 font-mono text-xs">{vehicle.vin}</p>
          </div>
        )}
      </div>

      {/* Stats row */}
      <div className="px-5 py-3 bg-white/[0.02] border-t border-white/5 flex items-center gap-6 text-xs text-gray-500">
        <span className="flex items-center gap-1.5">
          <IconWrench />
          {stats.totalOrders} servicio{stats.totalOrders !== 1 ? "s" : ""}
        </span>
        {stats.lastService && (
          <span className="flex items-center gap-1.5">
            <IconCalendar />
            Último: {fmtDate(stats.lastService)}
          </span>
        )}
        <span className="ml-auto text-gray-600">
          Registrado {fmtDate(vehicle.created_at)}
        </span>
      </div>

      {/* Notes */}
      {vehicle.notes && (
        <div className="px-5 py-3 border-t border-white/5">
          <p className="text-gray-500 text-xs leading-relaxed">{vehicle.notes}</p>
        </div>
      )}

      {/* Actions */}
      <div className="px-5 py-4 border-t border-white/5 flex flex-col sm:flex-row gap-2">
        <Link
          href={vehicle.plate ? `/seguimiento?patente=${encodeURIComponent(vehicle.plate)}` : "/seguimiento"}
          className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-medium text-white transition-colors"
          style={{ backgroundColor: "#e94560" }}
        >
          <IconSearch />
          Ver estado actual
        </Link>
        <Link
          href={`/historial?vehiculo=${vehicle.id}`}
          className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-medium text-gray-300 border border-white/10 hover:border-white/20 hover:text-white transition-colors"
        >
          <IconWrench />
          Historial de servicios
        </Link>
        <Link
          href={`/citas?vehiculo=${vehicle.id}`}
          className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-medium text-gray-300 border border-white/10 hover:border-white/20 hover:text-white transition-colors"
        >
          <IconCalendar />
          Agendar cita
        </Link>
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────

export default function MisVehiculosPage() {
  const [loading, setLoading] = useState(true);
  const [authed, setAuthed] = useState(false);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [statsMap, setStatsMap] = useState<Record<string, VehicleStats>>({});

  const load = useCallback(async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      return;
    }
    setAuthed(true);

    const { data: vehicleRows } = await supabase
      .from("vehicles")
      .select("id, brand, model, year, plate, color, vin, mileage, notes, created_at")
      .eq("owner_id", user.id)
      .order("created_at", { ascending: false });

    const vehicleList = (vehicleRows ?? []) as Vehicle[];
    setVehicles(vehicleList);

    if (vehicleList.length === 0) {
      setLoading(false);
      return;
    }

    const vehicleIds = vehicleList.map((v) => v.id);
    const { data: orderRows } = await supabase
      .from("work_orders")
      .select("id, status, received_at, vehicle_id")
      .in("vehicle_id", vehicleIds)
      .order("received_at", { ascending: false });

    const map: Record<string, VehicleStats> = {};
    for (const v of vehicleList) {
      const orders = (orderRows ?? []).filter((o) => o.vehicle_id === v.id);
      const active = orders.filter((o) => o.status !== "delivered").length;
      const lastOrder = orders[0];
      map[v.id] = {
        totalOrders: orders.length,
        activeOrders: active,
        lastService: lastOrder?.received_at ?? null,
      };
    }
    setStatsMap(map);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  // ── Loading ──────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#1a1a2e" }}>
        <div className="flex items-center gap-3 text-gray-400">
          <IconSpinner />
          <span className="text-sm">Cargando vehículos…</span>
        </div>
      </div>
    );
  }

  // ── Not logged in ────────────────────────────────────────────────────────
  if (!authed) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: "#1a1a2e" }}>
        <div className="text-center max-w-sm">
          <div className="w-20 h-20 rounded-2xl bg-[#16213e] border border-white/10 flex items-center justify-center mx-auto mb-6 text-gray-500">
            <IconLock />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Acceso requerido</h1>
          <p className="text-gray-400 text-sm mb-8">
            Iniciá sesión para ver tus vehículos registrados.
          </p>
          <div className="flex flex-col gap-3">
            <Link
              href="/login"
              className="block w-full text-center py-3 px-6 rounded-xl font-semibold text-white transition-colors"
              style={{ backgroundColor: "#e94560" }}
            >
              Iniciar sesión
            </Link>
            <Link
              href="/registro"
              className="block w-full text-center py-3 px-6 rounded-xl font-semibold text-gray-300 border border-white/10 hover:border-white/20 hover:text-white transition-colors"
            >
              Crear cuenta
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ── No vehicles ──────────────────────────────────────────────────────────
  if (vehicles.length === 0) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: "#1a1a2e" }}>
        <div style={{ backgroundColor: "#16213e" }} className="border-b border-white/5 py-10">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <nav className="flex items-center gap-2 text-sm text-gray-500 mb-4">
              <Link href="/cuenta" className="hover:text-white transition-colors">Mi cuenta</Link>
              <span>/</span>
              <span className="text-white">Mis vehículos</span>
            </nav>
            <h1 className="text-3xl font-bold text-white">Mis Vehículos</h1>
          </div>
        </div>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
          <div className="w-16 h-16 rounded-2xl bg-[#16213e] border border-white/10 flex items-center justify-center mx-auto mb-4 text-gray-600">
            <IconCar />
          </div>
          <p className="text-gray-400 text-lg">No tenés vehículos registrados</p>
          <p className="text-gray-500 text-sm mt-2 mb-8">
            Cuando el taller registre tu vehículo, aparecerá aquí.
          </p>
          <Link
            href="/citas"
            className="inline-block py-3 px-6 rounded-xl font-semibold text-white transition-colors"
            style={{ backgroundColor: "#e94560" }}
          >
            Agendar una cita
          </Link>
        </div>
      </div>
    );
  }

  const activeCount = Object.values(statsMap).filter((s) => s.activeOrders > 0).length;

  // ── Main view ────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen" style={{ backgroundColor: "#1a1a2e" }}>
      {/* Hero */}
      <div style={{ backgroundColor: "#16213e" }} className="border-b border-white/5 py-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex items-center gap-2 text-sm text-gray-500 mb-4">
            <Link href="/cuenta" className="hover:text-white transition-colors">Mi cuenta</Link>
            <span>/</span>
            <span className="text-white">Mis vehículos</span>
          </nav>
          <h1 className="text-3xl font-bold text-white">Mis Vehículos</h1>
          <p className="text-gray-400 mt-2">
            {vehicles.length} vehículo{vehicles.length !== 1 ? "s" : ""} registrado{vehicles.length !== 1 ? "s" : ""}
            {activeCount > 0 && (
              <span className="ml-2 text-blue-400">
                · {activeCount} en el taller ahora
              </span>
            )}
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {vehicles.map((vehicle) => (
          <VehicleCard
            key={vehicle.id}
            vehicle={vehicle}
            stats={statsMap[vehicle.id] ?? { totalOrders: 0, activeOrders: 0, lastService: null }}
          />
        ))}

        {/* Footer links */}
        <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-white/5">
          <Link
            href="/historial"
            className="flex-1 inline-flex items-center justify-center gap-2 py-3 px-6 rounded-xl font-semibold text-gray-300 border border-white/10 hover:border-white/20 hover:text-white transition-colors text-sm"
          >
            <IconWrench />
            Ver historial completo
          </Link>
          <Link
            href="/citas"
            className="flex-1 inline-flex items-center justify-center gap-2 py-3 px-6 rounded-xl font-semibold text-white transition-colors text-sm"
            style={{ backgroundColor: "#e94560" }}
          >
            <IconCalendar />
            Agendar nuevo servicio
          </Link>
        </div>
      </div>
    </div>
  );
}
