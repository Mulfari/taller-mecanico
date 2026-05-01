"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { createWorkOrder } from "../actions";
import type { WorkOrderStatus } from "@/types/database";

interface Client {
  id: string;
  full_name: string | null;
  phone: string | null;
}

interface Vehicle {
  id: string;
  brand: string;
  model: string;
  year: number;
  plate: string | null;
}

interface Mechanic {
  id: string;
  full_name: string | null;
}

interface Props {
  clients: Client[];
  mechanics: Mechanic[];
  vehiclesByClient: Record<string, Vehicle[]>;
}

const STATUS_OPTIONS: { value: WorkOrderStatus; label: string }[] = [
  { value: "received", label: "Recibido" },
  { value: "diagnosing", label: "Diagnóstico" },
  { value: "repairing", label: "En reparación" },
  { value: "ready", label: "Listo" },
  { value: "delivered", label: "Entregado" },
];

const inputClass =
  "w-full bg-[#1a1a2e] border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-[#e94560]/60 focus:ring-1 focus:ring-[#e94560]/30 transition-colors";

const selectClass =
  "w-full bg-[#1a1a2e] border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#e94560]/60 focus:ring-1 focus:ring-[#e94560]/30 transition-colors appearance-none";

function FieldLabel({ htmlFor, children }: { htmlFor: string; children: React.ReactNode }) {
  return (
    <label htmlFor={htmlFor} className="block text-sm font-medium text-gray-300 mb-1.5">
      {children}
    </label>
  );
}

function ChevronDown() {
  return (
    <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
      <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    </div>
  );
}

export default function NuevaOrdenForm({ clients, mechanics, vehiclesByClient }: Props) {
  const [clientId, setClientId] = useState("");
  const [vehicleId, setVehicleId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const clientVehicles = clientId ? (vehiclesByClient[clientId] ?? []) : [];

  function handleClientChange(id: string) {
    setClientId(id);
    setVehicleId("");
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      try {
        await createWorkOrder(formData);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error al crear la orden");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Cliente y vehículo */}
      <div className="bg-[#16213e] border border-white/10 rounded-xl p-5 space-y-4">
        <h2 className="text-sm uppercase tracking-wide text-gray-400 font-medium">
          Cliente y vehículo
        </h2>

        <div>
          <FieldLabel htmlFor="client_id">Cliente *</FieldLabel>
          <div className="relative">
            <select
              id="client_id"
              name="client_id"
              value={clientId}
              onChange={(e) => handleClientChange(e.target.value)}
              required
              className={selectClass}
            >
              <option value="" disabled>Seleccionar cliente…</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.full_name ?? c.id} {c.phone ? `— ${c.phone}` : ""}
                </option>
              ))}
            </select>
            <ChevronDown />
          </div>
        </div>

        <div>
          <FieldLabel htmlFor="vehicle_id">Vehículo *</FieldLabel>
          <div className="relative">
            <select
              id="vehicle_id"
              name="vehicle_id"
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
                  {v.brand} {v.model} {v.year}{v.plate ? ` — ${v.plate}` : ""}
                </option>
              ))}
            </select>
            <ChevronDown />
          </div>
          {clientId && clientVehicles.length === 0 && (
            <p className="text-gray-600 text-xs mt-1.5">Este cliente no tiene vehículos registrados.</p>
          )}
        </div>
      </div>

      {/* Detalle */}
      <div className="bg-[#16213e] border border-white/10 rounded-xl p-5 space-y-4">
        <h2 className="text-sm uppercase tracking-wide text-gray-400 font-medium">
          Detalle de la orden
        </h2>

        <div>
          <FieldLabel htmlFor="description">Descripción del problema *</FieldLabel>
          <textarea
            id="description"
            name="description"
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
              <select id="status" name="status" defaultValue="received" className={selectClass}>
                {STATUS_OPTIONS.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
              <ChevronDown />
            </div>
          </div>

          <div>
            <FieldLabel htmlFor="mechanic_id">Mecánico asignado</FieldLabel>
            <div className="relative">
              <select id="mechanic_id" name="mechanic_id" defaultValue="" className={selectClass}>
                <option value="">Sin asignar</option>
                {mechanics.map((m) => (
                  <option key={m.id} value={m.id}>{m.full_name ?? m.id}</option>
                ))}
              </select>
              <ChevronDown />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <FieldLabel htmlFor="estimated_cost">Costo estimado (MXN)</FieldLabel>
            <input
              id="estimated_cost"
              name="estimated_cost"
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              className={inputClass}
            />
          </div>

          <div>
            <FieldLabel htmlFor="estimated_delivery">Entrega estimada</FieldLabel>
            <input
              id="estimated_delivery"
              name="estimated_delivery"
              type="date"
              className={inputClass}
            />
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 pt-1">
        <Link
          href="/dashboard/ordenes"
          className="px-4 py-2 rounded-lg border border-white/10 text-gray-300 text-sm hover:border-white/20 hover:text-white transition-colors"
        >
          Cancelar
        </Link>
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-[#e94560] hover:bg-[#c73652] disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors"
        >
          {isPending ? (
            <>
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
              </svg>
              Guardando…
            </>
          ) : "Crear orden"}
        </button>
      </div>
    </form>
  );
}
