import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import Link from "next/link"
import VehiculoGallery from "../VehiculoGallery"
import VehiculoContactForm from "../VehiculoContactForm"

export default async function VehiculoDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: v } = await supabase
    .from("vehicles_for_sale")
    .select("*")
    .eq("id", id)
    .single()

  if (!v || v.status === "sold") notFound()

  const { data: photosRaw } = await supabase
    .from("vehicle_photos")
    .select("id, url, order")
    .eq("vehicle_sale_id", id)
    .order("order")

  const photos = (photosRaw ?? []).map((p) => ({
    id: p.id as string,
    url: p.url as string,
    order: p.order as number,
  }))

  const vehicleName = `${v.brand} ${v.model} ${v.year}`

  const features: string[] = Array.isArray(v.features)
    ? v.features
    : typeof v.features === "string" && v.features
    ? (v.features as string).split(",").map((s: string) => s.trim())
    : []

  const specs: { label: string; value: string | number }[] = [
    { label: "Marca", value: v.brand },
    { label: "Modelo", value: v.model },
    { label: "Año", value: v.year },
    { label: "Kilometraje", value: v.mileage != null ? `${(v.mileage as number).toLocaleString("es-AR")} km` : "—" },
    { label: "Color", value: v.color ?? "—" },
    { label: "Transmisión", value: v.transmission ?? "—" },
    { label: "Combustible", value: v.fuel_type ?? "—" },
  ].filter((s) => s.value && s.value !== "—")

  const statusLabel =
    v.status === "available" ? "Disponible" : v.status === "reserved" ? "Reservado" : "Vendido"
  const statusColor =
    v.status === "available"
      ? "bg-green-500/10 text-green-400 border-green-500/20"
      : v.status === "reserved"
      ? "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
      : "bg-red-500/10 text-red-400 border-red-500/20"

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#1a1a2e" }}>
      {/* Breadcrumb */}
      <div style={{ backgroundColor: "#16213e" }} className="border-b border-white/5 py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex items-center gap-2 text-sm text-gray-400">
            <Link href="/" className="hover:text-white transition-colors">Inicio</Link>
            <span>/</span>
            <Link href="/vehiculos" className="hover:text-white transition-colors">Vehículos</Link>
            <span>/</span>
            <span className="text-white truncate max-w-xs">{vehicleName}</span>
          </nav>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* Gallery */}
          <div>
            <VehiculoGallery photos={photos} vehicleName={vehicleName} />
          </div>

          {/* Info */}
          <div className="flex flex-col gap-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${statusColor}`}>
                  {statusLabel}
                </span>
              </div>
              <h1 className="text-3xl font-bold text-white leading-tight">{vehicleName}</h1>
              {v.color && <p className="text-gray-400 mt-1">{v.color}</p>}
            </div>

            <div className="flex items-end gap-4">
              <span className="text-4xl font-bold text-[#e94560]">
                ${(v.price as number)?.toLocaleString("es-AR")}
              </span>
            </div>

            {/* Specs */}
            <div
              className="rounded-xl border border-white/5 p-5 space-y-3"
              style={{ backgroundColor: "#16213e" }}
            >
              <h2 className="text-white font-semibold text-sm uppercase tracking-wider mb-4">
                Especificaciones
              </h2>
              {specs.map((s) => (
                <div key={s.label} className="flex justify-between text-sm">
                  <span className="text-gray-400">{s.label}</span>
                  <span className="text-white capitalize">{s.value}</span>
                </div>
              ))}
            </div>

            {/* Features */}
            {features.length > 0 && (
              <div
                className="rounded-xl border border-white/5 p-5"
                style={{ backgroundColor: "#16213e" }}
              >
                <h2 className="text-white font-semibold text-sm uppercase tracking-wider mb-4">
                  Equipamiento
                </h2>
                <div className="flex flex-wrap gap-2">
                  {features.map((f) => (
                    <span
                      key={f}
                      className="text-sm px-3 py-1 rounded-full text-gray-300 border border-white/10"
                      style={{ backgroundColor: "#0f172a" }}
                    >
                      {f}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Description */}
            {v.description && (
              <div
                className="rounded-xl border border-white/5 p-5"
                style={{ backgroundColor: "#16213e" }}
              >
                <h2 className="text-white font-semibold text-sm uppercase tracking-wider mb-3">
                  Descripción
                </h2>
                <p className="text-gray-400 text-sm leading-relaxed">{v.description}</p>
              </div>
            )}
          </div>
        </div>

        {/* Contact form */}
        {v.status === "available" && (
          <div className="mt-12 max-w-2xl">
            <div
              className="rounded-2xl border border-white/5 p-6 sm:p-8"
              style={{ backgroundColor: "#16213e" }}
            >
              <h2 className="text-white font-bold text-xl mb-1">¿Te interesa este vehículo?</h2>
              <p className="text-gray-400 text-sm mb-6">
                Completá el formulario y te contactamos a la brevedad.
              </p>
              <VehiculoContactForm vehicleId={v.id} vehicleName={vehicleName} />
            </div>
          </div>
        )}

        <div className="mt-10">
          <Link
            href="/vehiculos"
            className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Volver a vehículos
          </Link>
        </div>
      </div>
    </div>
  )
}
