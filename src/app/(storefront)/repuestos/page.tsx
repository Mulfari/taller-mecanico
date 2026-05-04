import { createClient } from "@/lib/supabase/server"
import Link from "next/link"
import RepuestosFilters from "./RepuestosFilters"
import RepuestosPagination from "./RepuestosPagination"

const PAGE_SIZE = 12

interface SearchParams extends Record<string, string | undefined> {
  q?: string
  categoria?: string
  marca?: string
  compatible_con?: string
  modelo?: string
  anio_min?: string
  anio_max?: string
  precio_min?: string
  precio_max?: string
  pagina?: string
}

export default async function RepuestosPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const params = await searchParams
  const supabase = await createClient()

  const page = Math.max(1, parseInt(params.pagina ?? "1", 10))
  const offset = (page - 1) * PAGE_SIZE

  let query = supabase
    .from("inventory")
    .select("id, name, sku, category, brand, compatible_brands, sell_price, quantity", {
      count: "exact",
    })
    .gt("quantity", 0)

  if (params.q) query = query.ilike("name", `%${params.q}%`)
  if (params.categoria) query = query.eq("category", params.categoria)
  if (params.marca) query = query.eq("brand", params.marca)
  if (params.compatible_con) query = query.ilike("compatible_brands", `%${params.compatible_con}%`)
  if (params.modelo) {
    query = query.or(`name.ilike.%${params.modelo}%,compatible_brands.ilike.%${params.modelo}%`)
  }
  if (params.anio_min && params.anio_max) {
    const minYear = parseInt(params.anio_min, 10)
    const maxYear = parseInt(params.anio_max, 10)
    if (!isNaN(minYear) && !isNaN(maxYear) && maxYear >= minYear) {
      const yearFilters = []
      for (let y = minYear; y <= Math.min(maxYear, minYear + 30); y++) {
        yearFilters.push(`name.ilike.%${y}%`)
        yearFilters.push(`compatible_brands.ilike.%${y}%`)
      }
      query = query.or(yearFilters.join(","))
    }
  } else if (params.anio_min) {
    query = query.or(`name.ilike.%${params.anio_min}%,compatible_brands.ilike.%${params.anio_min}%`)
  } else if (params.anio_max) {
    query = query.or(`name.ilike.%${params.anio_max}%,compatible_brands.ilike.%${params.anio_max}%`)
  }
  if (params.precio_min) query = query.gte("sell_price", parseFloat(params.precio_min))
  if (params.precio_max) query = query.lte("sell_price", parseFloat(params.precio_max))

  const { data: repuestos, count } = await query
    .order("name")
    .range(offset, offset + PAGE_SIZE - 1)

  const [{ data: catRows }, { data: brandRows }, { data: compatRows }] = await Promise.all([
    supabase.from("inventory").select("category").not("category", "is", null).gt("quantity", 0),
    supabase.from("inventory").select("brand").not("brand", "is", null).gt("quantity", 0),
    supabase.from("inventory").select("compatible_brands").not("compatible_brands", "is", null).gt("quantity", 0),
  ])

  const categorias = [...new Set(catRows?.map((r) => r.category as string) ?? [])].sort()
  const marcas = [...new Set(brandRows?.map((r) => r.brand as string) ?? [])].sort()

  // Parse compatible_brands (stored as JSONB array or comma-separated string)
  const compatibleMarcas = [
    ...new Set(
      (compatRows ?? []).flatMap((r) => {
        const val = r.compatible_brands
        if (Array.isArray(val)) return val as string[]
        if (typeof val === "string" && val.trim()) {
          // Handle JSON array string or comma-separated
          try { return JSON.parse(val) as string[] } catch { return val.split(",").map((s: string) => s.trim()) }
        }
        return []
      })
    ),
  ].sort()
  const totalPages = Math.ceil((count ?? 0) / PAGE_SIZE)

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--color-surface)" }}>
      <div style={{ backgroundColor: "var(--color-secondary)" }} className="border-b border-white/5 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-white">Catálogo de Repuestos</h1>
          <p className="text-gray-400 mt-2">
            Encuentra los repuestos que necesitas para tu vehículo
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          <aside className="lg:w-64 flex-shrink-0">
            <RepuestosFilters
              categorias={categorias}
              marcas={marcas}
              compatibleMarcas={compatibleMarcas}
              currentParams={params}
            />
          </aside>

          <main className="flex-1 min-w-0">
            <p className="text-gray-400 text-sm mb-6">
              {count ?? 0} repuesto{(count ?? 0) !== 1 ? "s" : ""} encontrado
              {(count ?? 0) !== 1 ? "s" : ""}
            </p>

            {repuestos && repuestos.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {repuestos.map((item) => (
                  <Link
                    key={item.id}
                    href={`/repuestos/${item.id}`}
                    className="group rounded-xl border border-white/5 overflow-hidden transition-all hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5"
                    style={{ backgroundColor: "var(--color-secondary)" }}
                  >
                    <div
                      className="h-44 flex items-center justify-center"
                      style={{ backgroundColor: "#0f172a" }}
                    >
                      <svg
                        className="w-14 h-14 text-gray-600"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1}
                          d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1}
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                    </div>

                    <div className="p-4">
                      {item.category && (
                        <span className="text-xs font-medium px-2 py-0.5 rounded-full text-primary border border-primary/20 inline-block">
                          {item.category}
                        </span>
                      )}
                      <h3 className="text-white font-semibold mt-2 group-hover:text-primary transition-colors line-clamp-2 leading-snug">
                        {item.name}
                      </h3>
                      {item.brand && (
                        <p className="text-gray-400 text-sm mt-1">{item.brand}</p>
                      )}
                      {item.sku && (
                        <p className="text-gray-500 text-xs mt-0.5">SKU: {item.sku}</p>
                      )}
                      <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/5">
                        <span className="text-primary font-bold text-lg">
                          ${item.sell_price?.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                        </span>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full ${
                            item.quantity > 5
                              ? "bg-green-500/10 text-green-400"
                              : "bg-yellow-500/10 text-yellow-400"
                          }`}
                        >
                          {item.quantity > 5 ? "En stock" : `Últimas ${item.quantity}`}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-20">
                <svg
                  className="w-16 h-16 text-gray-600 mx-auto mb-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1}
                    d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <p className="text-gray-400 text-lg">No se encontraron repuestos</p>
                <p className="text-gray-500 text-sm mt-1">
                  Intenta con otros filtros o términos de búsqueda
                </p>
              </div>
            )}

            {totalPages > 1 && (
              <div className="mt-10">
                <RepuestosPagination
                  currentPage={page}
                  totalPages={totalPages}
                  currentParams={params}
                />
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  )
}
