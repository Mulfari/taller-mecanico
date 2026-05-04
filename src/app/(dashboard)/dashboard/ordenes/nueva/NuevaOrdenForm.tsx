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

interface InventoryItem {
  id: string;
  name: string;
  sku: string;
  category: string | null;
  brand: string | null;
  sell_price: number;
  quantity: number;
}

interface OrderLineItem {
  key: number;
  type: "labor" | "part";
  description: string;
  quantity: number;
  unit_price: number;
  inventory_id?: string;
}

interface Props {
  clients: Client[];
  mechanics: Mechanic[];
  vehiclesByClient: Record<string, Vehicle[]>;
  inventoryItems?: InventoryItem[];
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

export default function NuevaOrdenForm({ clients, mechanics, vehiclesByClient, inventoryItems = [], defaultClientId = "", defaultVehicleId = "", defaultMechanicId = "" }: Props) {
  const [clientId, setClientId] = useState(defaultClientId);
  const [vehicleId, setVehicleId] = useState(defaultVehicleId);
  const [mechanicId, setMechanicId] = useState(defaultMechanicId);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [localVehicles, setLocalVehicles] = useState<Record<string, Vehicle[]>>({});
  const [showAddVehicle, setShowAddVehicle] = useState(false);

  // Items editor state
  const [items, setItems] = useState<OrderLineItem[]>([]);
  const [nextKey, setNextKey] = useState(1);
  const [partSearch, setPartSearch] = useState("");
  const [showPartPicker, setShowPartPicker] = useState<number | null>(null);

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

  const itemsTotal = items.reduce((sum, i) => sum + i.quantity * i.unit_price, 0);
  const laborTotal = items.filter((i) => i.type === "labor").reduce((sum, i) => sum + i.quantity * i.unit_price, 0);
  const partsTotal = items.filter((i) => i.type === "part").reduce((sum, i) => sum + i.quantity * i.unit_price, 0);

  function addItem(type: "labor" | "part") {
    setItems((prev) => [
      ...prev,
      { key: nextKey, type, description: "", quantity: 1, unit_price: 0 },
    ]);
    setNextKey((k) => k + 1);
  }

  function updateItem(key: number, field: keyof OrderLineItem, value: string | number) {
    setItems((prev) =>
      prev.map((i) => (i.key === key ? { ...i, [field]: value } : i))
    );
  }

  function removeItem(key: number) {
    setItems((prev) => prev.filter((i) => i.key !== key));
    if (showPartPicker === key) {
      setShowPartPicker(null);
      setPartSearch("");
    }
  }

  function selectInventoryPart(key: number, inv: InventoryItem) {
    setItems((prev) =>
      prev.map((i) =>
        i.key === key
          ? { ...i, description: inv.name, unit_price: inv.sell_price, inventory_id: inv.id }
          : i
      )
    );
    setShowPartPicker(null);
    setPartSearch("");
  }

  const filteredInventory = partSearch.trim()
    ? inventoryItems.filter(
        (inv) =>
          inv.quantity > 0 &&
          (inv.name.toLowerCase().includes(partSearch.toLowerCase()) ||
            inv.sku.toLowerCase().includes(partSearch.toLowerCase()) ||
            (inv.brand ?? "").toLowerCase().includes(partSearch.toLowerCase()))
      )
    : inventoryItems.filter((inv) => inv.quantity > 0).slice(0, 10);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);

    if (items.length > 0) {
      const validItems = items
        .filter((i) => i.description.trim() && i.unit_price > 0)
        .map((i) => ({
          type: i.type,
          description: i.description.trim(),
          quantity: i.quantity,
          unit_price: i.unit_price,
          ...(i.inventory_id ? { inventory_id: i.inventory_id } : {}),
        }));
      if (validItems.length > 0) {
        formData.set("items", JSON.stringify(validItems));
      }
    }

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

        <div>
          <FieldLabel htmlFor="received_at">Fecha y hora de recepción</FieldLabel>
          <input
            id="received_at"
            name="received_at"
            type="datetime-local"
            defaultValue={new Date(Date.now() - new Date().getTimezoneOffset() * 60000)
              .toISOString()
              .slice(0, 16)}
            className={inputClass}
          />
          <p className="text-gray-600 text-xs mt-1">
            Por defecto: ahora. Ajustá si el vehículo ingresó antes.
          </p>
        </div>
      </div>

      {/* Trabajos y repuestos */}
      <div className="bg-[#16213e] border border-white/10 rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm uppercase tracking-wide text-gray-400 font-medium">
            Trabajos y repuestos
          </h2>
          {items.length > 0 && (
            <span className="text-xs text-gray-500">
              {items.length} ítem{items.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>

        {items.length === 0 ? (
          <div className="text-center py-6 border border-dashed border-white/10 rounded-lg">
            <p className="text-gray-500 text-sm mb-3">
              Agrega mano de obra y repuestos a esta orden
            </p>
            <div className="flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => addItem("labor")}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-medium hover:bg-blue-500/20 transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Mano de obra
              </button>
              <button
                type="button"
                onClick={() => addItem("part")}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs font-medium hover:bg-orange-500/20 transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Repuesto
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((item) => (
              <div
                key={item.key}
                className={`rounded-lg border p-3 space-y-2 ${
                  item.type === "labor"
                    ? "border-blue-500/20 bg-blue-500/5"
                    : "border-orange-500/20 bg-orange-500/5"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      item.type === "labor"
                        ? "bg-blue-500/20 text-blue-300"
                        : "bg-orange-500/20 text-orange-300"
                    }`}
                  >
                    {item.type === "labor" ? "Mano de obra" : "Repuesto"}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeItem(item.key)}
                    className="text-gray-600 hover:text-red-400 transition-colors p-0.5"
                    aria-label="Eliminar ítem"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="relative">
                  <input
                    type="text"
                    value={item.description}
                    onChange={(e) => updateItem(item.key, "description", e.target.value)}
                    placeholder={item.type === "labor" ? "Ej. Cambio de aceite" : "Buscar repuesto…"}
                    className={inputClass}
                    onFocus={() => {
                      if (item.type === "part" && !item.inventory_id) {
                        setShowPartPicker(item.key);
                      }
                    }}
                  />
                  {item.inventory_id && (
                    <button
                      type="button"
                      onClick={() => {
                        updateItem(item.key, "inventory_id" as keyof OrderLineItem, "");
                        updateItem(item.key, "description", "");
                        updateItem(item.key, "unit_price", 0);
                        setShowPartPicker(item.key);
                      }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white text-xs transition-colors"
                    >
                      Cambiar
                    </button>
                  )}
                </div>

                {/* Inventory picker dropdown */}
                {item.type === "part" && showPartPicker === item.key && !item.inventory_id && (
                  <div className="bg-[#1a1a2e] border border-white/10 rounded-lg overflow-hidden max-h-48 overflow-y-auto">
                    <div className="p-2 border-b border-white/5">
                      <input
                        type="text"
                        value={partSearch}
                        onChange={(e) => setPartSearch(e.target.value)}
                        placeholder="Buscar por nombre, SKU o marca…"
                        className="w-full bg-transparent text-white text-xs placeholder-gray-600 focus:outline-none"
                        autoFocus
                      />
                    </div>
                    {filteredInventory.length === 0 ? (
                      <p className="text-gray-600 text-xs text-center py-3">Sin resultados</p>
                    ) : (
                      filteredInventory.slice(0, 8).map((inv) => (
                        <button
                          key={inv.id}
                          type="button"
                          onClick={() => selectInventoryPart(item.key, inv)}
                          className="w-full text-left px-3 py-2 hover:bg-white/5 transition-colors flex items-center justify-between gap-2 border-b border-white/5 last:border-0"
                        >
                          <div className="min-w-0">
                            <p className="text-gray-200 text-xs truncate">{inv.name}</p>
                            <p className="text-gray-600 text-[10px]">
                              {inv.sku}{inv.brand ? ` · ${inv.brand}` : ""} · {inv.quantity} en stock
                            </p>
                          </div>
                          <span className="text-orange-400 text-xs font-medium shrink-0">
                            ${inv.sell_price.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                          </span>
                        </button>
                      ))
                    )}
                    <button
                      type="button"
                      onClick={() => { setShowPartPicker(null); setPartSearch(""); }}
                      className="w-full text-center text-gray-500 hover:text-gray-300 text-xs py-2 border-t border-white/5 transition-colors"
                    >
                      Cerrar
                    </button>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] text-gray-500 mb-0.5">Cantidad</label>
                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => updateItem(item.key, "quantity", Math.max(1, parseInt(e.target.value) || 1))}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-gray-500 mb-0.5">Precio unitario</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.unit_price || ""}
                      onChange={(e) => updateItem(item.key, "unit_price", parseFloat(e.target.value) || 0)}
                      placeholder="0.00"
                      className={inputClass}
                    />
                  </div>
                </div>

                {item.quantity > 0 && item.unit_price > 0 && (
                  <div className="text-right">
                    <span className="text-gray-400 text-xs">
                      Subtotal:{" "}
                      <span className="text-white font-medium">
                        ${(item.quantity * item.unit_price).toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                      </span>
                    </span>
                  </div>
                )}
              </div>
            ))}

            {/* Add more buttons */}
            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => addItem("labor")}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/10 text-gray-400 text-xs font-medium hover:text-blue-400 hover:border-blue-500/30 transition-colors"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Mano de obra
              </button>
              <button
                type="button"
                onClick={() => addItem("part")}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/10 text-gray-400 text-xs font-medium hover:text-orange-400 hover:border-orange-500/30 transition-colors"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Repuesto
              </button>
            </div>

            {/* Totals */}
            {itemsTotal > 0 && (
              <div className="border-t border-white/10 pt-3 space-y-1">
                {laborTotal > 0 && (
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">Mano de obra</span>
                    <span className="text-gray-300">${laborTotal.toLocaleString("es-MX", { minimumFractionDigits: 2 })}</span>
                  </div>
                )}
                {partsTotal > 0 && (
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">Repuestos</span>
                    <span className="text-gray-300">${partsTotal.toLocaleString("es-MX", { minimumFractionDigits: 2 })}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-semibold pt-1">
                  <span className="text-gray-300">Total ítems</span>
                  <span className="text-[#e94560]">${itemsTotal.toLocaleString("es-MX", { minimumFractionDigits: 2 })}</span>
                </div>
              </div>
            )}
          </div>
        )}

        <p className="text-gray-600 text-xs">
          Opcional. También puedes agregar ítems después de crear la orden.
        </p>
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
