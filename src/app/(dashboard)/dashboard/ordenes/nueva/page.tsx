"use client";

import { useState } from "react";
import Link from "next/link";

type WorkOrderStatus = "received" | "diagnosing" | "repairing" | "ready" | "delivered";

interface Client {
  id: string;
  name: string;
  phone: string;
}

interface Vehicle {
  id: string;
  owner_id: string;
  label: string;
  plate: string;
}

interface Mechanic {
  id: string;
  name: string;
}

const MOCK_CLIENTS: Client[] = [
  { id: "c1", name: "Carlos Mendoza", phone: "555-0101" },
  { id: "c2", name: "Ana Rodríguez", phone: "555-0102" },
  { id: "c3", name: "Miguel Torres", phone: "555-0103" },
  { id: "c4", name: "Laura Jiménez", phone: "555-0104" },
  { id: "c5", name: "Roberto Díaz", phone: "555-0105" },
];

const MOCK_VEHICLES: Vehicle[] = [
  { id: "v1", owner_id: "c1", label: "Toyota Corolla 2019", plate: "ABC-123" },
  { id: "v2", owner_id: "c2", label: "Honda Civic 2021", plate: "XYZ-789" },
  { id: "v3", owner_id: "c3", label: "Nissan Sentra 2018", plate: "DEF-456" },
  { id: "v4", owner_id: "c4", label: "Chevrolet Spark 2020", plate: "GHI-321" },
  { id: "v5", owner_id: "c5", label: "Ford Focus 2017", plate: "JKL-654" },
];

const MOCK_MECHANICS: Mechanic[] = [
  { id: "m1", name: "Luis García" },
  { id: "m2", name: "Pedro Soto" },
  { id: "m3", name: "Jorge Ramírez" },
];

const STATUS_OPTIONS: { value: WorkOrderStatus; label: string }[] = [
  { value: "received", label: "Recibido" },
  { value: "diagnosing", label: "Diagnóstico" },
  { value: "repairing", label: "En reparación" },
  { value: "ready", label: "Listo" },
  { value: "delivered", label: "Entregado" },
];

function IconArrowLeft() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
    </svg>
  );
}

function FieldLabel({ htmlFor, children }: { htmlFor: string; children: React.ReactNode }) {
  return (
    <label htmlFor={htmlFor} className="block text-sm font-medium text-gray-300 mb-1.5">
      {children}
    </label>
  );
}

const inputClass =
  "w-full bg-[#1a1a2e] border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-[#e94560]/60 focus:ring-1 focus:ring-[#e94560]/30 transition-colors";

const selectClass =
  "w-full bg-[#1a1a2e] border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#e94560]/60 focus:ring-1 focus:ring-[#e94560]/30 transition-colors appearance-none";

export default function NuevaOrdenPage() {
  const [clientId, setClientId] = useState("");
  const [vehicleId, setVehicleId] = useState("");
  const [mechanicId, setMechanicId] = useState("");
  const [status, setStatus] = useState<WorkOrderStatus>("received");
  const [description, setDescription] = useState("");
  const [estimatedCost, setEstimatedCost] = useState("");
  const [estimatedDelivery, setEstimatedDelivery] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const clientVehicles = MOCK_VEHICLES.filter((v) => v.owner_id === clientId);

  function handleClientChange(id: string) {
    setClientId(id);
    setVehicleId("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    // Simulate async save — replace with Supabase insert
    await new Promise((r) => setTimeout(r, 800));
    setSubmitting(false);
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-4">
        <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center">
          <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-white text-xl font-semibold">Orden creada</h2>
        <p className="text-gray-500 text-sm">La orden de trabajo fue registrada correctamente.</p>
        <div className="flex gap-3 pt-2">
          <Link
            href="/dashboard/ordenes/nueva"
            onClick={() => setSubmitted(false)}
            className="px-4 py-2 rounded-lg border border-white/10 text-gray-300 text-sm hover:border-white/20 hover:text-white transition-colors"
          >
            Nueva orden
          </Link>
          <Link
            href="/dashboard/ordenes"
            className="px-4 py-2 rounded-lg bg-[#e94560] text-white text-sm hover:bg-[#c73652] transition-colors"
          >
            Ver todas las órdenes
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard/ordenes"
          className="text-gray-500 hover:text-white transition-colors"
          aria-label="Volver a órdenes"
        >
          <IconArrowLeft />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white">Nueva Orden de Trabajo</h1>
          <p className="text-gray-500 text-sm mt-0.5">Registra la recepción de un vehículo</p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">

        {/* Section: Cliente y vehículo */}
        <div className="bg-[#16213e] border border-white/10 rounded-xl p-5 space-y-4">
          <h2 className="text-white font-medium text-sm uppercase tracking-wide text-gray-400">
            Cliente y vehículo
          </h2>

          <div>
            <FieldLabel htmlFor="client">Cliente *</FieldLabel>
            <div className="relative">
              <select
                id="client"
                value={clientId}
                onChange={(e) => handleClientChange(e.target.value)}
                required
                className={selectClass}
              >
                <option value="" disabled>Seleccionar cliente…</option>
                {MOCK_CLIENTS.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} — {c.phone}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>

          <div>
            <FieldLabel htmlFor="vehicle">Vehículo *</FieldLabel>
            <div className="relative">
              <select
                id="vehicle"
                value={vehicleId}
                onChange={(e) => setVehicleId(e.target.value)}
                required
                disabled={!clientId}
                className={`${selectClass} disabled:opacity-40 disabled:cursor-not-allowed`}
              >
                <option value="" disabled>
                  {clientId ? "Seleccionar vehículo…" : "Primero selecciona un cliente"}
                </option>
                {clientVehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.label} — {v.plate}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Section: Detalle de la orden */}
        <div className="bg-[#16213e] border border-white/10 rounded-xl p-5 space-y-4">
          <h2 className="text-sm uppercase tracking-wide text-gray-400 font-medium">
            Detalle de la orden
          </h2>

          <div>
            <FieldLabel htmlFor="description">Descripción del problema *</FieldLabel>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              rows={3}
              placeholder="Describe el problema o servicio solicitado…"
              className={`${inputClass} resize-none`}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <FieldLabel htmlFor="status">Estado inicial</FieldLabel>
              <div className="relative">
                <select
                  id="status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as WorkOrderStatus)}
                  className={selectClass}
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
                  <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>

            <div>
              <FieldLabel htmlFor="mechanic">Mecánico asignado</FieldLabel>
              <div className="relative">
                <select
                  id="mechanic"
                  value={mechanicId}
                  onChange={(e) => setMechanicId(e.target.value)}
                  className={selectClass}
                >
                  <option value="">Sin asignar</option>
                  {MOCK_MECHANICS.map((m) => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
                  <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <FieldLabel htmlFor="estimated_cost">Costo estimado (MXN)</FieldLabel>
              <input
                id="estimated_cost"
                type="number"
                min="0"
                step="0.01"
                value={estimatedCost}
                onChange={(e) => setEstimatedCost(e.target.value)}
                placeholder="0.00"
                className={inputClass}
              />
            </div>

            <div>
              <FieldLabel htmlFor="estimated_delivery">Entrega estimada</FieldLabel>
              <input
                id="estimated_delivery"
                type="date"
                value={estimatedDelivery}
                onChange={(e) => setEstimatedDelivery(e.target.value)}
                className={inputClass}
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-1">
          <Link
            href="/dashboard/ordenes"
            className="px-4 py-2 rounded-lg border border-white/10 text-gray-300 text-sm hover:border-white/20 hover:text-white transition-colors"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-[#e94560] hover:bg-[#c73652] disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors"
          >
            {submitting ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                </svg>
                Guardando…
              </>
            ) : (
              "Crear orden"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
