import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import Link from "next/link"

export default async function RepuestoDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: item } = await supabase
    .from("inventory")
    .select("*")
    .eq("id", id)
    .single()

  if (!item) notFound()

  const compatibleBrands: string[] = Array.isArray(item.compatible_brands)
    ? item.compatible_brands
    : typeof item.compatible_brands === "string" && item.compatible_brands
    ? item.compatible_brands.split(",").map((s: string) => s.trim())
    : []

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#1a1a2e" }}>
      {/* Breadcrumb */}
      <div style={{ backgroundColor: "#16213e" }} className="border-b border-white/5 py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex items-center gap-2 text-sm text-gray-400">
            <Link href="/" className="hover:text-white transition-colors">
              Inicio
            </Link>
            <span>/</span>
            <Link href="/repuestos" className="hover:text-white transition-colors">
              Repuestos
            </Link>
            <span>/</span>
            <span className="text-white truncate max-w-xs">{item.name}</span>
          </nav>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* Imagen */}
          <div
            className="rounded-2xl flex items-center justify-center aspect-square max-h-96 lg:max-h-none"
            style={{ backgroundColor: "#16213e" }}
          >
            <svg
              className="w-32 h-32 text-gray-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={0.8}
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={0.8}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </div>

          {/* Info */}
          <div className="flex flex-col gap-6">
            <div>
              {item.category && (
                <span className="text-xs font-medium px-2 py-0.5 rounded-full text-[#e94560] border border-[#e94560]/20 inline-block mb-3">
                  {item.category}
                </span>
              )}
              <h1 className="text-3xl font-bold text-white leading-tight">{item.name}</h1>
              {item.brand && (
                <p className="text-gray-400 mt-1 text-lg">{item.brand}</p>
              )}
            </div>

            <div className="flex items-end gap-4">
              <span className="text-4xl font-bold text-[#e94560]">
                ${item.sell_price?.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
              </span>
              <span
                className={`text-sm px-3 py-1 rounded-full mb-1 ${
                  item.quantity > 5
                    ? "bg-green-500/10 text-green-400 border border-green-500/20"
                    : item.quantity > 0
                    ? "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20"
                    : "bg-red-500/10 text-red-400 border border-red-500/20"
                }`}
              >
                {item.quantity > 5
                  ? "En stock"
                  : item.quantity > 0
                  ? `Últimas ${item.quantity} unidades`
                  : "Sin stock"}
              </span>
            </div>

            {/* Detalles */}
            <div
              className="rounded-xl border border-white/5 p-5 space-y-3"
              style={{ backgroundColor: "#16213e" }}
            >
              <h2 className="text-white font-semibold text-sm uppercase tracking-wider mb-4">
                Detalles del producto
              </h2>
              {item.sku && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">SKU</span>
                  <span className="text-white font-mono">{item.sku}</span>
                </div>
              )}
              {item.brand && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Marca</span>
                  <span className="text-white">{item.brand}</span>
                </div>
              )}
              {item.category && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Categoría</span>
                  <span className="text-white">{item.category}</span>
                </div>
              )}
              {item.location && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Ubicación</span>
                  <span className="text-white">{item.location}</span>
                </div>
              )}
              {item.supplier && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Proveedor</span>
                  <span className="text-white">{item.supplier}</span>
                </div>
              )}
            </div>

            {/* Compatibilidad */}
            {compatibleBrands.length > 0 && (
              <div
                className="rounded-xl border border-white/5 p-5"
                style={{ backgroundColor: "#16213e" }}
              >
                <h2 className="text-white font-semibold text-sm uppercase tracking-wider mb-4">
                  Compatible con
                </h2>
                <div className="flex flex-wrap gap-2">
                  {compatibleBrands.map((brand) => (
                    <span
                      key={brand}
                      className="text-sm px-3 py-1 rounded-full text-gray-300 border border-white/10"
                      style={{ backgroundColor: "#0f172a" }}
                    >
                      {brand}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Link
                href={`/cotizacion?repuesto=${item.id}&nombre=${encodeURIComponent(item.name)}`}
                className="flex-1 text-center py-3 px-6 rounded-xl font-semibold text-white transition-colors"
                style={{ backgroundColor: "#e94560" }}
                onMouseOver={(e) =>
                  ((e.currentTarget as HTMLAnchorElement).style.backgroundColor = "#c73652")
                }
                onMouseOut={(e) =>
                  ((e.currentTarget as HTMLAnchorElement).style.backgroundColor = "#e94560")
                }
              >
                Solicitar cotización
              </Link>
              <Link
                href="/citas"
                className="flex-1 text-center py-3 px-6 rounded-xl font-semibold text-gray-300 border border-white/10 hover:border-white/20 hover:text-white transition-colors"
              >
                Agendar instalación
              </Link>
            </div>
          </div>
        </div>

        {/* Volver */}
        <div className="mt-10">
          <Link
            href="/repuestos"
            className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Volver al catálogo
          </Link>
        </div>
      </div>
    </div>
  )
}
