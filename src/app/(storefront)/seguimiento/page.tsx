import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Metadata } from "next";
import SeguimientoRealtimeClient, { type WorkOrder, type Vehicle } from "./SeguimientoRealtimeClient";

export const metadata: Metadata = {
  title: "Seguimiento de Vehículo — TallerPro",
  description: "Consultá el estado de tu vehículo en el taller ingresando la patente.",
};

// ── Icons ──────────────────────────────────────────────────────────────────

function IconSearch() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  );
}

function IconCar() {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
    </svg>
  );
}

// ── Search Form ────────────────────────────────────────────────────────────

function SearchForm({ defaultValue }: { defaultValue?: string }) {
  return (
    <form method="GET" action="/seguimiento" className="flex gap-3 max-w-md mx-auto">
      <div className="relative flex-1">
        <span className="absolute inset-y-0 left-3.5 flex items-center text-gray-500 pointer-events-none">
          <IconSearch />
        </span>
        <input
          type="text"
          name="patente"
          defaultValue={defaultValue}
          placeholder="Ej. ABC123 o AB 123 CD"
          autoComplete="off"
          className="w-full bg-[#1a1a2e] border border-white/10 rounded-xl pl-11 pr-4 py-3.5 text-white text-base placeholder-gray-600 focus:outline-none focus:border-[#e94560]/60 focus:ring-2 focus:ring-[#e94560]/20 transition-colors font-mono uppercase tracking-widest"
          aria-label="Número de patente"
        />
      </div>
      <button
        type="submit"
        className="bg-[#e94560] hover:bg-[#c73652] text-white font-semibold px-6 py-3.5 rounded-xl transition-colors shrink-0"
      >
        Buscar
      </button>
    </form>
  );
}

// ── Data fetching ──────────────────────────────────────────────────────────

async function findByPlate(plate: string): Promise<{ vehicle: Vehicle; orders: WorkOrder[] } | null> {
  const supabase = await createClient();

  const normalized = plate.trim().toUpperCase().replace(/\s+/g, "");

  const { data: vehicles } = await supabase
    .from("vehicles")
    .select("id, brand, model, year, plate, color")
    .ilike("plate", normalized)
    .limit(1);

  if (!vehicles || vehicles.length === 0) return null;

  const vehicle = vehicles[0] as Vehicle;

  const { data: orders } = await supabase
    .from("work_orders")
    .select(`
      id, status, description, diagnosis,
      estimated_cost, estimated_delivery,
      received_at, delivered_at,
      mechanic:profiles!work_orders_mechanic_id_fkey(full_name)
    `)
    .eq("vehicle_id", vehicle.id)
    .order("received_at", { ascending: false })
    .limit(5);

  return { vehicle, orders: (orders ?? []) as unknown as WorkOrder[] };
}

// ── Page ───────────────────────────────────────────────────────────────────

export default async function SeguimientoPage({
  searchParams,
}: {
  searchParams: Promise<{ patente?: string }>;
}) {
  const { patente } = await searchParams;
  const query = patente?.trim() ?? "";

  const result = query ? await findByPlate(query) : null;
  const notFound = query && !result;

  return (
    <div className="min-h-screen bg-[#1a1a2e]">
      {/* Hero */}
      <div className="bg-[#16213e] border-b border-white/5 py-14">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#e94560]/10 border border-[#e94560]/20 text-[#e94560] mx-auto mb-5">
            <IconCar />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">
            Seguimiento de <span className="text-[#e94560]">Vehículo</span>
          </h1>
          <p className="text-gray-400 mb-8 max-w-md mx-auto">
            Ingresá la patente de tu vehículo para ver el estado actual en el taller.
          </p>
          <SearchForm defaultValue={query} />
        </div>
      </div>

      {/* Results */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Not found */}
        {notFound && (
          <div className="text-center py-12">
            <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-5 text-gray-600">
              <IconCar />
            </div>
            <h2 className="text-white font-semibold text-xl mb-2">Vehículo no encontrado</h2>
            <p className="text-gray-500 text-sm max-w-sm mx-auto mb-6">
              No encontramos ningún vehículo con la patente{" "}
              <span className="text-white font-mono font-semibold">{query.toUpperCase()}</span>.
              Verificá que la patente sea correcta o contactanos.
            </p>
            <Link
              href="/citas"
              className="inline-flex items-center gap-2 bg-[#e94560] hover:bg-[#c73652] text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors"
            >
              Agendar una cita
            </Link>
          </div>
        )}

        {/* Vehicle found — realtime client takes over */}
        {result && (
          <SeguimientoRealtimeClient
            vehicle={result.vehicle}
            initialOrders={result.orders}
          />
        )}

        {/* Empty state (no search yet) */}
        {!query && (
          <div className="text-center py-12 text-gray-600">
            <p className="text-sm">Ingresá una patente para comenzar la búsqueda.</p>
          </div>
        )}
      </div>
    </div>
  );
}
