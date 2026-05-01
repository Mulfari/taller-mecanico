"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"

interface Props {
  vehicleId: string
  vehicleName: string
}

export default function VehiculoContactForm({ vehicleId, vehicleName }: Props) {
  const [form, setForm] = useState({ nombre: "", telefono: "", email: "", mensaje: "" })
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle")
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus("sending")
    setErrorMsg(null)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const { error } = await supabase.from("quotes").insert({
      client_id: user?.id ?? null,
      vehicle_id: null,
      items: [
        {
          vehicle_sale_id: vehicleId,
          vehicle_name: vehicleName,
          nombre: form.nombre,
          telefono: form.telefono,
          email: form.email || null,
          mensaje: form.mensaje || null,
        },
      ],
      total: 0,
      status: "draft",
      valid_until: null,
    })

    if (error) {
      setErrorMsg("Ocurrió un error al enviar tu consulta. Por favor intentá de nuevo.")
      setStatus("error")
      return
    }

    setStatus("sent")
  }

  const inputClass =
    "w-full px-4 py-2.5 rounded-lg text-sm text-white placeholder-gray-500 border border-white/10 focus:border-[#e94560]/50 focus:outline-none transition-colors"
  const inputStyle = { backgroundColor: "#0f172a" }

  if (status === "sent") {
    return (
      <div className="rounded-xl border border-green-500/20 bg-green-500/5 p-6 text-center">
        <svg className="w-10 h-10 text-green-400 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="text-white font-semibold">¡Consulta enviada!</p>
        <p className="text-gray-400 text-sm mt-1">Nos pondremos en contacto contigo a la brevedad.</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs text-gray-400 mb-1.5" htmlFor="nombre">
            Nombre *
          </label>
          <input
            id="nombre"
            type="text"
            required
            placeholder="Tu nombre"
            value={form.nombre}
            onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
            className={inputClass}
            style={inputStyle}
          />
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1.5" htmlFor="telefono">
            Teléfono *
          </label>
          <input
            id="telefono"
            type="tel"
            required
            placeholder="Tu teléfono"
            value={form.telefono}
            onChange={(e) => setForm((f) => ({ ...f, telefono: e.target.value }))}
            className={inputClass}
            style={inputStyle}
          />
        </div>
      </div>

      <div>
        <label className="block text-xs text-gray-400 mb-1.5" htmlFor="email">
          Email
        </label>
        <input
          id="email"
          type="email"
          placeholder="tu@email.com"
          value={form.email}
          onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
          className={inputClass}
          style={inputStyle}
        />
      </div>

      <div>
        <label className="block text-xs text-gray-400 mb-1.5" htmlFor="mensaje">
          Mensaje
        </label>
        <textarea
          id="mensaje"
          rows={3}
          placeholder={`Me interesa el ${vehicleName}...`}
          value={form.mensaje}
          onChange={(e) => setForm((f) => ({ ...f, mensaje: e.target.value }))}
          className={`${inputClass} resize-none`}
          style={inputStyle}
        />
      </div>

      {status === "error" && (
        <p className="text-red-400 text-sm">{errorMsg}</p>
      )}

      <button
        type="submit"
        disabled={status === "sending"}
        className="w-full py-3 px-6 rounded-xl font-semibold text-white transition-colors disabled:opacity-60"
        style={{ backgroundColor: "#e94560" }}
        onMouseOver={(e) => { if (status !== "sending") (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#c73652" }}
        onMouseOut={(e) => { if (status !== "sending") (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#e94560" }}
      >
        {status === "sending" ? "Enviando..." : "Consultar por este vehículo"}
      </button>
    </form>
  )
}
