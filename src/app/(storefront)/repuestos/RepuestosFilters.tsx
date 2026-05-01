"use client"

import { useRouter, usePathname } from "next/navigation"
import { useCallback } from "react"

interface Props {
  categorias: string[]
  marcas: string[]
  compatibleMarcas: string[]
  currentParams: {
    q?: string
    categoria?: string
    marca?: string
    compatible_con?: string
    precio_min?: string
    precio_max?: string
    pagina?: string
  }
}

export default function RepuestosFilters({ categorias, marcas, compatibleMarcas, currentParams }: Props) {
  const router = useRouter()
  const pathname = usePathname()

  const updateParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams()
      if (currentParams.q) params.set("q", currentParams.q)
      if (currentParams.categoria) params.set("categoria", currentParams.categoria)
      if (currentParams.marca) params.set("marca", currentParams.marca)
      if (currentParams.compatible_con) params.set("compatible_con", currentParams.compatible_con)
      if (currentParams.precio_min) params.set("precio_min", currentParams.precio_min)
      if (currentParams.precio_max) params.set("precio_max", currentParams.precio_max)

      if (value) {
        params.set(key, value)
      } else {
        params.delete(key)
      }
      params.delete("pagina")
      router.push(`${pathname}?${params.toString()}`)
    },
    [router, pathname, currentParams]
  )

  const clearAll = () => {
    router.push(pathname)
  }

  const hasFilters =
    currentParams.q ||
    currentParams.categoria ||
    currentParams.marca ||
    currentParams.compatible_con ||
    currentParams.precio_min ||
    currentParams.precio_max

  return (
    <div className="space-y-6">
      {/* Búsqueda */}
      <div
        className="rounded-xl border border-white/5 p-4"
        style={{ backgroundColor: "#16213e" }}
      >
        <h3 className="text-white font-semibold mb-3 text-sm uppercase tracking-wider">
          Buscar
        </h3>
        <div className="relative">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="text"
            placeholder="Nombre del repuesto..."
            defaultValue={currentParams.q ?? ""}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                updateParam("q", (e.target as HTMLInputElement).value.trim())
              }
            }}
            onBlur={(e) => {
              const val = e.target.value.trim()
              if (val !== (currentParams.q ?? "")) {
                updateParam("q", val)
              }
            }}
            className="w-full pl-9 pr-3 py-2 rounded-lg text-sm text-white placeholder-gray-500 border border-white/10 focus:border-[#e94560]/50 focus:outline-none transition-colors"
            style={{ backgroundColor: "#0f172a" }}
          />
        </div>
      </div>

      {/* Categoría */}
      {categorias.length > 0 && (
        <div
          className="rounded-xl border border-white/5 p-4"
          style={{ backgroundColor: "#16213e" }}
        >
          <h3 className="text-white font-semibold mb-3 text-sm uppercase tracking-wider">
            Categoría
          </h3>
          <div className="space-y-1.5">
            <button
              onClick={() => updateParam("categoria", "")}
              className={`w-full text-left text-sm px-3 py-1.5 rounded-lg transition-colors ${
                !currentParams.categoria
                  ? "text-[#e94560] bg-[#e94560]/10"
                  : "text-gray-400 hover:text-white hover:bg-white/5"
              }`}
            >
              Todas las categorías
            </button>
            {categorias.map((cat) => (
              <button
                key={cat}
                onClick={() => updateParam("categoria", cat)}
                className={`w-full text-left text-sm px-3 py-1.5 rounded-lg transition-colors ${
                  currentParams.categoria === cat
                    ? "text-[#e94560] bg-[#e94560]/10"
                    : "text-gray-400 hover:text-white hover:bg-white/5"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Marca */}
      {marcas.length > 0 && (
        <div
          className="rounded-xl border border-white/5 p-4"
          style={{ backgroundColor: "#16213e" }}
        >
          <h3 className="text-white font-semibold mb-3 text-sm uppercase tracking-wider">
            Marca
          </h3>
          <div className="space-y-1.5">
            <button
              onClick={() => updateParam("marca", "")}
              className={`w-full text-left text-sm px-3 py-1.5 rounded-lg transition-colors ${
                !currentParams.marca
                  ? "text-[#e94560] bg-[#e94560]/10"
                  : "text-gray-400 hover:text-white hover:bg-white/5"
              }`}
            >
              Todas las marcas
            </button>
            {marcas.map((m) => (
              <button
                key={m}
                onClick={() => updateParam("marca", m)}
                className={`w-full text-left text-sm px-3 py-1.5 rounded-lg transition-colors ${
                  currentParams.marca === m
                    ? "text-[#e94560] bg-[#e94560]/10"
                    : "text-gray-400 hover:text-white hover:bg-white/5"
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Compatible con (marca de auto) */}
      {compatibleMarcas.length > 0 && (
        <div
          className="rounded-xl border border-white/5 p-4"
          style={{ backgroundColor: "#16213e" }}
        >
          <h3 className="text-white font-semibold mb-3 text-sm uppercase tracking-wider">
            Compatible con
          </h3>
          <div className="space-y-1.5">
            <button
              onClick={() => updateParam("compatible_con", "")}
              className={`w-full text-left text-sm px-3 py-1.5 rounded-lg transition-colors ${
                !currentParams.compatible_con
                  ? "text-[#e94560] bg-[#e94560]/10"
                  : "text-gray-400 hover:text-white hover:bg-white/5"
              }`}
            >
              Todas las marcas
            </button>
            {compatibleMarcas.map((m) => (
              <button
                key={m}
                onClick={() => updateParam("compatible_con", m)}
                className={`w-full text-left text-sm px-3 py-1.5 rounded-lg transition-colors ${
                  currentParams.compatible_con === m
                    ? "text-[#e94560] bg-[#e94560]/10"
                    : "text-gray-400 hover:text-white hover:bg-white/5"
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Rango de precio */}
      <div
        className="rounded-xl border border-white/5 p-4"
        style={{ backgroundColor: "#16213e" }}
      >
        <h3 className="text-white font-semibold mb-3 text-sm uppercase tracking-wider">
          Precio
        </h3>
        <div className="flex gap-2 items-center">
          <input
            type="number"
            placeholder="Mín"
            defaultValue={currentParams.precio_min ?? ""}
            onBlur={(e) => updateParam("precio_min", e.target.value)}
            min={0}
            className="w-full px-3 py-2 rounded-lg text-sm text-white placeholder-gray-500 border border-white/10 focus:border-[#e94560]/50 focus:outline-none transition-colors"
            style={{ backgroundColor: "#0f172a" }}
          />
          <span className="text-gray-500 text-sm flex-shrink-0">—</span>
          <input
            type="number"
            placeholder="Máx"
            defaultValue={currentParams.precio_max ?? ""}
            onBlur={(e) => updateParam("precio_max", e.target.value)}
            min={0}
            className="w-full px-3 py-2 rounded-lg text-sm text-white placeholder-gray-500 border border-white/10 focus:border-[#e94560]/50 focus:outline-none transition-colors"
            style={{ backgroundColor: "#0f172a" }}
          />
        </div>
      </div>

      {/* Limpiar filtros */}
      {hasFilters && (
        <button
          onClick={clearAll}
          className="w-full py-2 rounded-lg text-sm text-gray-400 border border-white/10 hover:border-[#e94560]/30 hover:text-[#e94560] transition-colors"
        >
          Limpiar filtros
        </button>
      )}
    </div>
  )
}
