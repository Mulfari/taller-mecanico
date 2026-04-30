import { createClient } from "@/lib/supabase/server"
import Link from "next/link"
import Image from "next/image"
import VehiculosFilters from "./VehiculosFilters"

interface SearchParams extends Record<string, string | undefined> {
  marca?: string
  precio_min?: string
  precio_max?: string
  anio_min?: string
  anio_max?: string
  transmision?: string
}

export default async function VehiculosPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const params = await searchParams
  const supabase = await createClient()

  let query = supabase
    .from("vehicles_for_sale")
    .select("id, brand, model, year, price, mileage, color, transmission, fuel_type, status", {
      count: "exact",
    })
    .eq("status", "available")

  if (params.marca) query = query.eq("brand", params.marca)
  if (params.precio_min) query = query.gte("price", parseFloat(params.precio_min))
  if (params.precio_max) query = query.lte("price", parseFloat(params.precio_max))
  if (params.anio_min) query = query.gte("year", parseInt(params.anio_min, 10))
  if (params.anio_max) query = query.lte("year", parseInt(params.anio_max, 10))
  if (params.transmision) query = query.eq("transmission", params.transmision)

  const { data: vehiculos, count } = await query.order("created_at", { ascending: false })

  // Fetch main photo for each vehicle
  const vehicleIds = vehiculos?.map((v) => v.id) ?? []
  const { data: photos } = vehicleIds.length
    ? await supabase
        .from("vehicle_photos")
        .select("vehicle_sale_id, url, order")
        .in("vehicle_sale_id", vehicleIds)
        .order("order")
    : { data: [] }

  const photoByVehicle: Record<string, string> = {}
  for (const p of photos ?? []) {
    if (p.vehicle_sale_id && !photoByVehicle[p.vehicle_sale_id]) {
      photoByVehicle[p.vehicle_sale_id] = p.url
    }
  }

  // Filter options
  const [{ data: brandRows }, { data: transRows }] = await Promise.all([
    supabase
      .from("vehicles_for_sale")
      .select("brand")
      .eq("status", "available")
      .not("brand", "is", null),
    supabase
      .from("vehicles_for_sale")
      .select("transmission")
      .eq("status", "available")
      .not("transmission", "is", null),
  ])

  const marcas = [...new Set(brandRows?.map((r) => r.brand as string) ?? [])].sort()
  const transmisiones = [...new Set(transRows?.map((r) => r.transmission as string) ?? [])].sort()

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#1a1a2e" }}>
      <div style={{ backgroundColor: "#16213e" }} className="border-b border-white/5 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-white">Vehículos en Venta</h1>
          <p className="text-gray-400 mt-2">
            Encontrá tu próximo auto entre nuestra selección de vehículos
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          <aside className="lg:w-64 flex-shrink-0">
            <VehiculosFilters
              marcas={marcas}
              transmisiones={transmisiones}
              currentParams={params}
            />
          </aside>

          <main className="flex-1 min-w-0">
            <p className="text-gray-400 text-sm mb-6">
              {count ?? 0} vehículo{(count ?? 0) !== 1 ? "s" : ""} disponible
              {(count ?? 0) !== 1 ? "s" : ""}
            </p>

            {vehiculos && vehiculos.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {vehiculos.map((v) => {
                  const mainPhoto = photoByVehicle[v.id]
                  return (
                    <Link
                      key={v.id}
                      href={`/vehiculos/${v.id}`}
                      className="group rounded-xl border border-white/5 overflow-hidden transition-all hover:border-[#e94560]/30 hover:shadow-lg hover:shadow-[#e94560]/5"
                      style={{ backgroundColor: "#16213e" }}
                    >
                      <div className="relative h-48 overflow-hidden" style={{ backgroundColor: "#0f172a" }}>
                        {mainPhoto ? (
                          <Image
                            src={mainPhoto}
                            alt={`${v.brand} ${v.model} ${v.year}`}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                            sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <svg className="w-16 h-16 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1}
                                d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                          </div>
                        )}
                      </div>

                      <div className="p-4">
                        <h3 className="text-white font-semibold text-lg leading-tight group-hover:text-[#e94560] transition-colors">
                          {v.brand} {v.model}
                        </h3>
                        <p className="text-gray-400 text-sm mt-0.5">{v.year}</p>

                        <div className="flex items-center gap-3 mt-3 text-xs text-gray-500">
                          {v.mileage != null && (
                            <span className="flex items-center gap-1">
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                              </svg>
                              {v.mileage.toLocaleString("es-AR")} km
                            </span>
                          )}
                          {v.transmission && (
                            <span className="capitalize">{v.transmission}</span>
                          )}
                          {v.color && <span>{v.color}</span>}
                        </div>

                        <div className="mt-3 pt-3 border-t border-white/5">
                          <span className="text-[#e94560] font-bold text-xl">
                            ${v.price?.toLocaleString("es-AR")}
                          </span>
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-20">
                <svg className="w-16 h-16 text-gray-600 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1}
                    d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <p className="text-gray-400 text-lg">No se encontraron vehículos</p>
                <p className="text-gray-500 text-sm mt-1">Intentá con otros filtros</p>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  )
}
