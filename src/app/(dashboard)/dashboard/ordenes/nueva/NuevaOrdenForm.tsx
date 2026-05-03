"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { createWorkOrder, createVehicleForClient } from "../actions";
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
  defaultClientId?: string;
  defaultVehicleId?: string;
  defaultMechanicId?: string;
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

interface AddVehicleFormProps {
  onSave: (vehicle: Vehicle) => void;
  onCancel: () => void;
  clientId: string;
}

function AddVehicleForm({ onSave, onCancel, clientId }: AddVehicleFormProps) {
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [plate, setPlate] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const vehicle = await createVehicleForClient(clientId, {
        brand,
        model,
        year: parseInt(year, 10),
        plate,
      });
      onSave(vehicle);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al crear el vehículo");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-3 bg-[#1a1a2e] border border-[#e94560]/30 rounded-xl p-4 space-y-3"
    >
      <p className="text-white text-sm font-medium">Agregar vehículo</p>

      {error && (
        <p className="text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-gray-400 mb-1" htmlFor="v-brand">
            Marca *
          </label>
          <input
            id="v-brand"
            type="text"
            required
            value={brand}
            onChange={(e) => setBrand(e.target.value)}
            placeholder="Ej. Toyota"
            className={inputClass}
          />
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1" htmlFor="v-model">
            Modelo *
          </label>
          <input
            id="v-model"
            type="text"
            required
            value={model}
            onChange={(e) => setModel(e.target.value)}
            placeholder="Ej. Corolla"
            className={inputClass}
          />
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1" htmlFor="v-year">
            Año *
          </label>
          <input
            id="v-year"
            type="number"
            required
            min="1900"
            max={new Date().getFullYear() + 1}
            value={year}
            onChange={(e) => setYear(e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1" htmlFor="v-plate">
            Placa
          </label>
          <input
            id="v-plate"
            type="text"
            value={plate}
            onChange={(e) => setPlate(e.target.value)}
            placeholder="Ej. ABC-123"
            className={inputClass}
          />
        </div>
      </div>

      <div className="flex gap-2 pt-1">
        <button
          type="button"
          onClick={onCancel}
          className="px-3 py-1.5 rounded-lg border border-white/10 text-gray-400 text-sm hover:text-white hover:border-white/20 transition-colors"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-lg bg-[#e94560] hover:bg-[#c73652] disabled:opacity-60 text-white text-sm font-medium transition-colors"
        >
          {saving ? (
            <>
              <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
              </svg>
              Guardando…
            </>
          ) : (
            "Guardar vehículo"
          )}
        </button>
      </div>
    </form>
  );
}

export default function NuevaOrdenForm({ clients, mechanics, vehiclesByClient, defaultClientId = "", defaultVehicleId = "", defaultMechanicId = "" }: Props) {
  const [clientId, setClientId] = useState(defaultClientId);
  const [vehicleId, setVehicleId] = useState(defaultVehicleId);
  const [mechanicId, setMechanicId] = useState(defaultMechanicId);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [localVehicles, setLocalVehicles] = useState<Record<string, Vehicle[]>>({});
  const [showAddVehicle, setShowAddVehicle] = useState(false);

  const serverVehicles = clientId ? (vehiclesByClient[clientId] ?? []) : [];
  const extraVehicles = clientId ? (localVehicles[clientId] ?? []) : [];
  const clientVehicles = [...serverVehicles, ...extraVehicles];

  function handleClientChange(id: string) {
    setClientId(id);
    setVehicleId("");
    setShowAddVehicle(false);
  }

  function handleVehicleAdded(vehicle: Vehicle) {
    setLocalVehicles((prev) => ({
      ...prev,
      [clientId]: [...(prev[clientId] ?? []), vehicle],
    }));
    setVehicleId(vehicle.id);
    setShowAddVehicle(false);
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

          {/* Add vehicle prompt */}
          {clientId && !showAddVehicle && (
            <button
              type="button"
              onClick={() => setShowAddVehicle(true)}
              className="mt-2 inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-[#e94560] transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              {clientVehicles.length === 0 ? "Este cliente no tiene vehículos — agregar uno" : "Agregar vehículo"}
            </button>
          )}

          {/* Inline add vehicle form */}
          {clientId && showAddVehicle && (
            <AddVehicleForm
              clientId={clientId}
              onSave={handleVehicleAdded}
              onCancel={() => setShowAddVehicle(false)}
            />
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
              <select
                id="mechanic_id"
                name="mechanic_id"
                value={mechanicId}
                onChange={(e) => setMechanicId(e.target.value)}
                className={selectClass}
              >
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
