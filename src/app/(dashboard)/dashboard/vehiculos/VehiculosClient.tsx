"use client";

import { useState, useMemo, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { addVehicleAction } from "./actions";

// ── Icons ──────────────────────────────────────────────────────────────────

function IconSearch() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  );
}

function IconCar() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
    </svg>
  );
}

function IconChevronRight() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  );
}

function IconX() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

function IconPlus() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
  );
}

function IconChevronDown() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  );
}

function IconSpinner() {
  return (
    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
    </svg>
  );
}

// ── Types ──────────────────────────────────────────────────────────────────

interface Vehicle {
  id: string;
  brand: string;
  model: string;
  year: number;
  plate: string | null;
  color: string | null;
  vin: string | null;
  mileage: number | null;
  created_at: string;
  owner: { id: string; full_name: string | null; email: string; phone: string | null } | null;
}

interface ClientOption {
  id: string;
  full_name: string | null;
  email: string;
}

// ── Constants ──────────────────────────────────────────────────────────────

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 30 }, (_, i) => CURRENT_YEAR - i);

const inputClass =
  "w-full bg-[#1a1a2e] border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-[#e94560]/60 focus:ring-1 focus:ring-[#e94560]/30 transition-colors";
const selectClass =
  "w-full bg-[#1a1a2e] border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#e94560]/60 focus:ring-1 focus:ring-[#e94560]/30 transition-colors appearance-none";

// ── New Vehicle Modal ──────────────────────────────────────────────────────

interface VehicleForm {
  client_id: string;
  brand: string;
  model: string;
  year: string;
  plate: string;
  color: string;
  vin: string;
  mileage: string;
}

const EMPTY_FORM: VehicleForm = {
  client_id: "",
  brand: "",
  model: "",
  year: String(CURRENT_YEAR),
  plate: "",
  color: "",
  vin: "",
  mileage: "",
};

function NewVehicleModal({
  clients,
  onClose,
}: {
  clients: ClientOption[];
  onClose: () => void;
}) {
  const router = useRouter();
  const [form, setForm] = useState<VehicleForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Partial<VehicleForm>>({});
  const [serverError, setServerError] = useState<string | null>(null);

  function set(field: keyof VehicleForm, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
    setErrors((e) => ({ ...e, [field]: undefined }));
    setServerError(null);
  }

  function validate(): boolean {
    const e: Partial<VehicleForm> = {};
    if (!form.client_id) e.client_id = "Requerido";
    if (!form.brand.trim()) e.brand = "Requerido";
    if (!form.model.trim()) e.model = "Requerido";
    if (!form.plate.trim()) e.plate = "Requerido";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    setServerError(null);
    try {
      await addVehicleAction(form.client_id, {
        brand: form.brand.trim(),
        model: form.model.trim(),
        year: Number(form.year),
        plate: form.plate.trim().toUpperCase(),
        color: form.color.trim(),
        vin: form.vin.trim().toUpperCase(),
        mileage: Number(form.mileage) || 0,
      });
      router.refresh();
      onClose();
    } catch {
      setServerError("Error al guardar el vehículo. Intenta de nuevo.");
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 overflow-y-auto">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[#16213e] border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl my-8">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <h2 className="text-white font-semibold text-lg">Nuevo vehículo</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors" aria-label="Cerrar">
            <IconX />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {serverError && (
            <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
              {serverError}
            </p>
          )}

          {/* Cliente */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              Propietario <span className="text-[#e94560]">*</span>
            </label>
            <div className="relative">
              <select
                className={selectClass}
                value={form.client_id}
                onChange={(e) => set("client_id", e.target.value)}
                required
              >
                <option value="">Seleccionar cliente…</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.full_name ?? c.email}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-gray-500">
                <IconChevronDown />
              </div>
            </div>
            {errors.client_id && <p className="text-red-400 text-xs mt-1">{errors.client_id}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Marca */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                Marca <span className="text-[#e94560]">*</span>
              </label>
              <input
                className={inputClass}
                placeholder="Ej. Toyota"
                value={form.brand}
                onChange={(e) => set("brand", e.target.value)}
              />
              {errors.brand && <p className="text-red-400 text-xs mt-1">{errors.brand}</p>}
            </div>

            {/* Modelo */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                Modelo <span className="text-[#e94560]">*</span>
              </label>
              <input
                className={inputClass}
                placeholder="Ej. Corolla"
                value={form.model}
                onChange={(e) => set("model", e.target.value)}
              />
              {errors.model && <p className="text-red-400 text-xs mt-1">{errors.model}</p>}
            </div>

            {/* Año */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Año</label>
              <div className="relative">
                <select
                  className={selectClass}
                  value={form.year}
                  onChange={(e) => set("year", e.target.value)}
                >
                  {YEARS.map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-gray-500">
                  <IconChevronDown />
                </div>
              </div>
            </div>

            {/* Placa */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                Placa <span className="text-[#e94560]">*</span>
              </label>
              <input
                className={inputClass}
                placeholder="ABC-123"
                value={form.plate}
                onChange={(e) => set("plate", e.target.value)}
              />
              {errors.plate && <p className="text-red-400 text-xs mt-1">{errors.plate}</p>}
            </div>

            {/* Color */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Color</label>
              <input
                className={inputClass}
                placeholder="Ej. Blanco"
                value={form.color}
                onChange={(e) => set("color", e.target.value)}
              />
            </div>

            {/* Kilometraje */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Kilometraje</label>
              <input
                type="number"
                min="0"
                className={inputClass}
                placeholder="0"
                value={form.mileage}
                onChange={(e) => set("mileage", e.target.value)}
              />
            </div>

            {/* VIN */}
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-300 mb-1.5">VIN</label>
              <input
                className={inputClass}
                placeholder="17 caracteres"
                maxLength={17}
                value={form.vin}
                onChange={(e) => set("vin", e.target.value)}
              />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-lg border border-white/10 text-gray-400 text-sm hover:text-white hover:border-white/20 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 inline-flex items-center justify-center gap-2 bg-[#e94560] hover:bg-[#c73652] disabled:opacity-60 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors"
            >
              {saving ? <><IconSpinner /> Guardando…</> : "Guardar vehículo"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Vehicle row ────────────────────────────────────────────────────────────

function VehicleRow({ vehicle: v, last }: { vehicle: Vehicle; last: boolean }) {
  return (
    <Link
      href={`/dashboard/vehiculos/${v.id}`}
      className={`flex items-center gap-4 px-5 py-4 hover:bg-white/[0.03] transition-colors group ${
        !last ? "border-b border-white/5" : ""
      }`}
    >
      <div className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center shrink-0 text-gray-500 group-hover:text-[#e94560] group-hover:bg-[#e94560]/10 transition-colors">
        <IconCar />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-white font-medium text-sm">
            {v.brand} {v.model} {v.year}
          </span>
          {v.plate && (
            <span className="text-xs font-mono px-1.5 py-0.5 rounded bg-white/5 text-gray-400 border border-white/10">
              {v.plate}
            </span>
          )}
          {v.color && (
            <span className="text-xs text-gray-600">{v.color}</span>
          )}
        </div>
        <p className="text-gray-500 text-xs mt-0.5 truncate">
          {v.owner?.full_name ?? v.owner?.email ?? "Sin propietario"}
          {v.mileage ? ` · ${v.mileage.toLocaleString("es-MX")} km` : ""}
        </p>
      </div>

      <span className="text-gray-700 group-hover:text-gray-400 transition-colors shrink-0">
        <IconChevronRight />
      </span>
    </Link>
  );
}

// ── Main component ─────────────────────────────────────────────────────────

export default function VehiculosClient({
  vehicles,
  clients,
}: {
  vehicles: Vehicle[];
  clients: ClientOption[];
}) {
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);

  const q = search.trim().toLowerCase();

  const filtered = useMemo(() => {
    if (!q) return vehicles;
    return vehicles.filter(
      (v) =>
        v.brand.toLowerCase().includes(q) ||
        v.model.toLowerCase().includes(q) ||
        String(v.year).includes(q) ||
        v.plate?.toLowerCase().includes(q) ||
        v.color?.toLowerCase().includes(q) ||
        v.vin?.toLowerCase().includes(q) ||
        v.owner?.full_name?.toLowerCase().includes(q) ||
        v.owner?.email?.toLowerCase().includes(q) ||
        v.owner?.phone?.includes(q)
    );
  }, [vehicles, q]);

  const brands = useMemo(() => {
    const map: Record<string, Vehicle[]> = {};
    for (const v of filtered) {
      if (!map[v.brand]) map[v.brand] = [];
      map[v.brand].push(v);
    }
    return Object.entries(map).sort((a, b) => a[0].localeCompare(b[0]));
  }, [filtered]);

  return (
    <div className="space-y-5">
      {/* Search + button row */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <span className="absolute inset-y-0 left-3 flex items-center text-gray-500 pointer-events-none">
            <IconSearch />
          </span>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por marca, patente, cliente…"
            className="w-full bg-[#16213e] border border-white/10 rounded-lg pl-9 pr-8 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#e94560]/60 focus:ring-1 focus:ring-[#e94560]/30 transition-colors"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute inset-y-0 right-2.5 flex items-center text-gray-500 hover:text-gray-300 transition-colors"
              aria-label="Limpiar búsqueda"
            >
              <IconX />
            </button>
          )}
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 bg-[#e94560] hover:bg-[#c73652] text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors whitespace-nowrap"
        >
          <IconPlus />
          Nuevo vehículo
        </button>
      </div>

      {/* Results count when searching */}
      {q && (
        <p className="text-gray-500 text-sm">
          {filtered.length} resultado{filtered.length !== 1 ? "s" : ""} para &ldquo;{search}&rdquo;
        </p>
      )}

      {/* Empty state */}
      {filtered.length === 0 && (
        <div className="bg-[#16213e] border border-white/10 rounded-xl p-12 text-center">
          <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4 text-gray-600">
            <IconCar />
          </div>
          <p className="text-gray-400 font-medium">
            {q ? "Sin resultados" : "No hay vehículos registrados"}
          </p>
          <p className="text-gray-600 text-sm mt-1">
            {q
              ? "Probá con otra búsqueda"
              : "Registrá el primer vehículo con el botón \"Nuevo vehículo\""}
          </p>
        </div>
      )}

      {/* Grouped by brand (when not searching) */}
      {filtered.length > 0 && !q && (
        <div className="space-y-6">
          {brands.map(([brand, brandVehicles]) => (
            <div key={brand}>
              <h2 className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-2 px-1">
                {brand}{" "}
                <span className="text-gray-700 font-normal normal-case">
                  ({brandVehicles.length})
                </span>
              </h2>
              <div className="bg-[#16213e] border border-white/10 rounded-xl overflow-hidden">
                {brandVehicles.map((v, i) => (
                  <VehicleRow key={v.id} vehicle={v} last={i === brandVehicles.length - 1} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Flat list when searching */}
      {filtered.length > 0 && q && (
        <div className="bg-[#16213e] border border-white/10 rounded-xl overflow-hidden">
          {filtered.map((v, i) => (
            <VehicleRow key={v.id} vehicle={v} last={i === filtered.length - 1} />
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <NewVehicleModal
          clients={clients}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
}
