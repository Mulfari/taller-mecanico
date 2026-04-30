"use client"

import { useRouter, usePathname } from "next/navigation"
import { useCallback } from "react"

interface Props {
  marcas: string[]
  transmisiones: string[]
  currentParams: {
    marca?: string
    precio_min?: string
    precio_max?: string
    anio_min?: string
    anio_max?: string
    transmision?: string
  }
}

export default function VehiculosFilters({ marcas, transmisiones, currentParams }: Props) {
  const router = useRouter()
  const pathname = usePathname()

  const updateParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams()
      if (currentParams.marca) params.set("marca", currentParams.marca)
      if (currentParams.precio_min) params.set("precio_min", currentParams.precio_min)
      if (currentParams.precio_max) params.set("precio_max", currentParams.precio_max)
      if (currentParams.anio_min) params.set("anio_min", currentParams.anio_min)
      if (currentParams.anio_max) params.set("anio_max", currentParams.anio_max)
      if (currentParams.transmision) params.set("transmision", currentParams.transmision)

      if (value) params.set(key, value)
      else params.delete(key)

      router.push(`${pathname}?${params.toString()}`)
    },
    [router, pathname, currentParams]
  )

  const hasFilters =
    currentParams.marca ||
    currentParams.precio_min ||
    currentParams.precio_max ||
    currentParams.anio_min ||
    currentParams.anio_max ||
    currentParams.transmision

  const cardStyle = { backgroundColor: "#16213e" }
  const inputStyle = { backgroundColor: "#0f172a" }
  const inputClass =
    "w-full px-3 py-2 rounded-lg text-sm text-white placeholder-gray-500 border border-white/10 focus:border-[#e94560]/50 focus:outline-none transition-colors"

  return (
    <div className="space-y-6">
      {marcas.length > 0 && (
        <div className="rounded-xl border border-white/5 p-4" style={cardStyle}>
          <h3 className="text-white font-semibold mb-3 text-sm uppercase tracking-wider">Marca</h3>
          <div className="space-y-1.5">
            <button
              onClick={() => updateParam("marca", "")}
              className={`w-full text-left text-sm px-3 py-1.5 rounded-lg transition-colors ${!currentParams.marca ? "text-[#e94560] bg-[#e94560]/10" : "text-gray-400 hover:text-white hover:bg-white/5"}`}
            >
              Todas las marcas
            </button>
            {marcas.map((m) => (
              <button
                key={m}
                onClick={() => updateParam("marca", m)}
                className={`w-full text-left text-sm px-3 py-1.5 rounded-lg transition-colors ${currentParams.marca === m ? "text-[#e94560] bg-[#e94560]/10" : "text-gray-400 hover:text-white hover:bg-white/5"}`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="rounded-xl border border-white/5 p-4" style={cardStyle}>
        <h3 className="text-white font-semibold mb-3 text-sm uppercase tracking-wider">Precio</h3>
        <div className="flex gap-2 items-center">
          <input type="number" placeholder="Mín" defaultValue={currentParams.precio_min ?? ""} onBlur={(e) => updateParam("precio_min", e.target.value)} min={0} className={inputClass} style={inputStyle} />
          <span className="text-gray-500 text-sm flex-shrink-0">—</span>
          <input type="number" placeholder="Máx" defaultValue={currentParams.precio_max ?? ""} onBlur={(e) => updateParam("precio_max", e.target.value)} min={0} className={inputClass} style={inputStyle} />
        </div>
      </div>

      <div className="rounded-xl border border-white/5 p-4" style={cardStyle}>
        <h3 className="text-white font-semibold mb-3 text-sm uppercase tracking-wider">Año</h3>
        <div className="flex gap-2 items-center">
          <input type="number" placeholder="Desde" defaultValue={currentParams.anio_min ?? ""} onBlur={(e) => updateParam("anio_min", e.target.value)} min={1990} max={2030} className={inputClass} style={inputStyle} />
          <span className="text-gray-500 text-sm flex-shrink-0">—</span>
          <input type="number" placeholder="Hasta" defaultValue={currentParams.anio_max ?? ""} onBlur={(e) => updateParam("anio_max", e.target.value)} min={1990} max={2030} className={inputClass} style={inputStyle} />
        </div>
      </div>

      {transmisiones.length > 0 && (
        <div className="rounded-xl border border-white/5 p-4" style={cardStyle}>
          <h3 className="text-white font-semibold mb-3 text-sm uppercase tracking-wider">Transmisión</h3>
          <div className="space-y-1.5">
            <button
              onClick={() => updateParam("transmision", "")}
              className={`w-full text-left text-sm px-3 py-1.5 rounded-lg transition-colors ${!currentParams.transmision ? "text-[#e94560] bg-[#e94560]/10" : "text-gray-400 hover:text-white hover:bg-white/5"}`}
            >
              Todas
            </button>
            {transmisiones.map((t) => (
              <button
                key={t}
                onClick={() => updateParam("transmision", t)}
                className={`w-full text-left text-sm px-3 py-1.5 rounded-lg transition-colors capitalize ${currentParams.transmision === t ? "text-[#e94560] bg-[#e94560]/10" : "text-gray-400 hover:text-white hover:bg-white/5"}`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      )}

      {hasFilters && (
        <button
          onClick={() => router.push(pathname)}
          className="w-full py-2 rounded-lg text-sm text-gray-400 border border-white/10 hover:border-[#e94560]/30 hover:text-[#e94560] transition-colors"
        >
          Limpiar filtros
        </button>
      )}
    </div>
  )
}
