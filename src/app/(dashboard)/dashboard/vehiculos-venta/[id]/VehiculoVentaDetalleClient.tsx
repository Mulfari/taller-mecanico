"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { updateVehicleSaleStatusAction, updateVehicleSaleAction } from "./actions";

// ── Types ──────────────────────────────────────────────────────────────────

type SaleStatus = "available" | "reserved" | "sold";

interface Photo { id: string; url: string; order: number; }

interface Vehicle {
  id: string;
  brand: string;
  model: string;
  year: number;
  price: number;
  mileage: number | null;
  color: string | null;
  transmission: string | null;
  fuel_type: string | null;
  description: string | null;
  features: string[];
  status: SaleStatus;
  created_at: string;
}

// ── Constants ──────────────────────────────────────────────────────────────

const STATUS_MAP: Record<SaleStatus, { label: string; badge: string; dot: string }> = {
  available: { label: "Disponible", badge: "bg-green-500/20 text-green-300",  dot: "bg-green-400" },
  reserved:  { label: "Reservado",  badge: "bg-yellow-500/20 text-yellow-300", dot: "bg-yellow-400" },
  sold:      { label: "Vendido",    badge: "bg-gray-500/20 text-gray-400",    dot: "bg-gray-500" },
};

const BRANDS = ["Chevrolet","Chrysler","Dodge","Ford","Honda","Hyundai","Kia","Mazda","Nissan","Peugeot","Renault","Seat","Suzuki","Toyota","Volkswagen","Otro"];
const TRANSMISSIONS = ["manual","automático","CVT"];
const FUEL_TYPES = ["gasolina","diesel","híbrido","eléctrico","gas"];
const CURRENT_YEAR = new Date().getFullYear();

const inputCls = "w-full bg-[#1a1a2e] border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-[#e94560]/60 focus:ring-1 focus:ring-[#e94560]/30 transition-colors";
const selectCls = "w-full bg-[#1a1a2e] border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#e94560]/60 focus:ring-1 focus:ring-[#e94560]/30 transition-colors appearance-none";

// ── Icons ──────────────────────────────────────────────────────────────────

function IconArrowLeft() {
  return <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>;
}
function IconEdit() {
  return <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>;
}
function IconEye() {
  return <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>;
}
function IconChevronLeft() {
  return <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>;
}
function IconChevronRight() {
  return <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>;
}
function IconChevronDown() {
  return <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>;
}
function IconX() {
  return <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>;
}
function IconSpinner() {
  return <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" /></svg>;
}
function IconCar() {
  return <svg className="w-16 h-16 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" /></svg>;
}

// ── StatusBadge ────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: SaleStatus }) {
  const { label, badge, dot } = STATUS_MAP[status];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${badge}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
      {label}
    </span>
  );
}

// ── PhotoGallery ───────────────────────────────────────────────────────────

function PhotoGallery({ photos, vehicleName }: { photos: Photo[]; vehicleName: string }) {
  const [active, setActive] = useState(0);
  if (photos.length === 0) {
    return (
      <div className="aspect-video bg-[#16213e] border border-white/10 rounded-xl flex items-center justify-center">
        <IconCar />
      </div>
    );
  }
  return (
    <div className="space-y-3">
      <div className="relative aspect-video bg-[#16213e] rounded-xl overflow-hidden border border-white/10">
        <Image src={photos[active].url} alt={vehicleName} fill className="object-cover" sizes="(max-width: 768px) 100vw, 50vw" />
        {photos.length > 1 && (
          <>
            <button
              onClick={() => setActive((a) => (a - 1 + photos.length) % photos.length)}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/60 hover:bg-black/80 rounded-full flex items-center justify-center text-white transition-colors"
              aria-label="Foto anterior"
            >
              <IconChevronLeft />
            </button>
            <button
              onClick={() => setActive((a) => (a + 1) % photos.length)}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/60 hover:bg-black/80 rounded-full flex items-center justify-center text-white transition-colors"
              aria-label="Foto siguiente"
            >
              <IconChevronRight />
            </button>
            <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5">
              {photos.map((_, i) => (
                <button key={i} onClick={() => setActive(i)} className={`w-2 h-2 rounded-full transition-colors ${i === active ? "bg-white" : "bg-white/40"}`} aria-label={`Foto ${i + 1}`} />
              ))}
            </div>
          </>
        )}
        <div className="absolute top-3 left-3 bg-black/60 text-white text-xs px-2 py-1 rounded-full">
          {active + 1} / {photos.length}
        </div>
      </div>
      {photos.length > 1 && (
        <div className="grid grid-cols-5 gap-2">
          {photos.map((p, i) => (
            <button
              key={p.id}
              onClick={() => setActive(i)}
              className={`relative aspect-video rounded-lg overflow-hidden border-2 transition-colors ${i === active ? "border-[#e94560]" : "border-white/10 hover:border-white/30"}`}
              aria-label={`Ver foto ${i + 1}`}
            >
              <Image src={p.url} alt={`Foto ${i + 1}`} fill className="object-cover" sizes="80px" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── EditModal ──────────────────────────────────────────────────────────────

function EditModal({ vehicle, onClose, onSaved }: { vehicle: Vehicle; onClose: () => void; onSaved: (v: Vehicle) => void }) {
  const [form, setForm] = useState({
    brand: vehicle.brand,
    model: vehicle.model,
    year: String(vehicle.year),
    price: String(vehicle.price),
    mileage: vehicle.mileage != null ? String(vehicle.mileage) : "",
    color: vehicle.color ?? "",
    transmission: vehicle.transmission ?? "manual",
    fuel_type: vehicle.fuel_type ?? "gasolina",
    description: vehicle.description ?? "",
    features: vehicle.features.join(", "),
    status: vehicle.status,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const yr = Number(form.year);
    if (!form.brand || !form.model.trim() || isNaN(yr) || yr < 1900 || yr > CURRENT_YEAR + 1) {
      setError("Completa los campos obligatorios correctamente.");
      return;
    }
    const price = Number(form.price);
    if (isNaN(price) || price <= 0) { setError("Precio inválido."); return; }
    setSaving(true);
    setError(null);
    try {
      const payload = {
        brand: form.brand,
        model: form.model.trim(),
        year: yr,
        price,
        mileage: form.mileage ? Number(form.mileage) : null,
        color: form.color.trim() || null,
        transmission: form.transmission || null,
        fuel_type: form.fuel_type || null,
        description: form.description.trim() || null,
        features: form.features ? form.features.split(",").map((f) => f.trim()).filter(Boolean) : null,
        status: form.status as SaleStatus,
      };
      await updateVehicleSaleAction(vehicle.id, payload);
      onSaved({ ...vehicle, ...payload, features: payload.features ?? [] });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar.");
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 overflow-y-auto">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[#16213e] border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl my-8">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <h2 className="text-white font-semibold text-lg">Editar vehículo</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors" aria-label="Cerrar"><IconX /></button>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {error && <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 text-red-400 text-sm">{error}</div>}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Marca <span className="text-[#e94560]">*</span></label>
              <div className="relative">
                <select className={selectCls} value={form.brand} onChange={(e) => set("brand", e.target.value)} required>
                  <option value="">Seleccionar…</option>
                  {BRANDS.map((b) => <option key={b} value={b}>{b}</option>)}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-gray-500"><IconChevronDown /></div>
              </div>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Modelo <span className="text-[#e94560]">*</span></label>
              <input className={inputCls} value={form.model} onChange={(e) => set("model", e.target.value)} placeholder="Ej. Corolla" required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Año <span className="text-[#e94560]">*</span></label>
              <input type="number" className={inputCls} value={form.year} onChange={(e) => set("year", e.target.value)} min={1900} max={CURRENT_YEAR + 1} required />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Precio <span className="text-[#e94560]">*</span></label>
              <input type="number" className={inputCls} value={form.price} onChange={(e) => set("price", e.target.value)} min={1} placeholder="0" required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Kilometraje</label>
              <input type="number" className={inputCls} value={form.mileage} onChange={(e) => set("mileage", e.target.value)} min={0} placeholder="km" />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Color</label>
              <input className={inputCls} value={form.color} onChange={(e) => set("color", e.target.value)} placeholder="Ej. Blanco" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Transmisión</label>
              <div className="relative">
                <select className={selectCls} value={form.transmission} onChange={(e) => set("transmission", e.target.value)}>
                  {TRANSMISSIONS.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-gray-500"><IconChevronDown /></div>
              </div>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Combustible</label>
              <div className="relative">
                <select className={selectCls} value={form.fuel_type} onChange={(e) => set("fuel_type", e.target.value)}>
                  {FUEL_TYPES.map((f) => <option key={f} value={f}>{f}</option>)}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-gray-500"><IconChevronDown /></div>
              </div>
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1.5">Estado</label>
            <div className="relative">
              <select className={selectCls} value={form.status} onChange={(e) => set("status", e.target.value)}>
                <option value="available">Disponible</option>
                <option value="reserved">Reservado</option>
                <option value="sold">Vendido</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-gray-500"><IconChevronDown /></div>
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1.5">Características (separadas por coma)</label>
            <input className={inputCls} value={form.features} onChange={(e) => set("features", e.target.value)} placeholder="Ej. Aire acondicionado, Bluetooth, Cámara trasera" />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1.5">Descripción</label>
            <textarea rows={3} className={`${inputCls} resize-none`} value={form.description} onChange={(e) => set("description", e.target.value)} placeholder="Descripción del vehículo…" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 rounded-lg border border-white/10 text-gray-400 text-sm hover:text-white hover:border-white/20 transition-colors">
              Cancelar
            </button>
            <button type="submit" disabled={saving} className="flex-1 inline-flex items-center justify-center gap-2 bg-[#e94560] hover:bg-[#c73652] disabled:opacity-60 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors">
              {saving ? <><IconSpinner /> Guardando…</> : "Guardar cambios"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────

export default function VehiculoVentaDetalleClient({
  vehicle: initial,
  photos,
}: {
  vehicle: Vehicle;
  photos: Photo[];
}) {
  const router = useRouter();
  const [vehicle, setVehicle] = useState(initial);
  const [showEdit, setShowEdit] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [statusError, setStatusError] = useState<string | null>(null);

  function handleStatusChange(status: SaleStatus) {
    if (status === vehicle.status) return;
    setStatusError(null);
    const prev = vehicle.status;
    setVehicle((v) => ({ ...v, status }));
    startTransition(async () => {
      try {
        await updateVehicleSaleStatusAction(vehicle.id, status);
      } catch {
        setVehicle((v) => ({ ...v, status: prev }));
        setStatusError("No se pudo actualizar el estado.");
      }
    });
  }

  const title = `${vehicle.brand} ${vehicle.model} ${vehicle.year}`;

  const specs = [
    { label: "Marca", value: vehicle.brand },
    { label: "Modelo", value: vehicle.model },
    { label: "Año", value: String(vehicle.year) },
    { label: "Precio", value: `$${vehicle.price.toLocaleString("es-MX")}` },
    vehicle.mileage != null ? { label: "Kilometraje", value: `${vehicle.mileage.toLocaleString("es-MX")} km` } : null,
    vehicle.color ? { label: "Color", value: vehicle.color } : null,
    vehicle.transmission ? { label: "Transmisión", value: vehicle.transmission } : null,
    vehicle.fuel_type ? { label: "Combustible", value: vehicle.fuel_type } : null,
  ].filter(Boolean) as { label: string; value: string }[];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link href="/dashboard/vehiculos-venta" className="inline-flex items-center gap-1.5 text-gray-500 hover:text-white text-sm transition-colors mb-4">
          <IconArrowLeft /> Vehículos en venta
        </Link>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold text-white">{title}</h1>
            <StatusBadge status={vehicle.status} />
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Link
              href={`/vehiculos/${vehicle.id}`}
              target="_blank"
              className="inline-flex items-center gap-2 border border-white/10 hover:border-white/20 text-gray-400 hover:text-white text-sm font-medium px-3 py-2 rounded-lg transition-colors"
            >
              <IconEye /> Ver en storefront
            </Link>
            <button
              onClick={() => setShowEdit(true)}
              className="inline-flex items-center gap-2 bg-[#e94560] hover:bg-[#c73652] text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
            >
              <IconEdit /> Editar
            </button>
          </div>
        </div>
      </div>

      {statusError && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 text-red-400 text-sm">{statusError}</div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left — gallery */}
        <PhotoGallery photos={photos} vehicleName={title} />

        {/* Right — info */}
        <div className="space-y-5">
          {/* Price */}
          <div className="bg-[#16213e] border border-white/10 rounded-xl p-5">
            <p className="text-gray-500 text-xs uppercase tracking-wide mb-1">Precio de venta</p>
            <p className="text-4xl font-bold text-[#e94560]">${vehicle.price.toLocaleString("es-MX")}</p>
          </div>

          {/* Status controls */}
          <div className="bg-[#16213e] border border-white/10 rounded-xl p-5">
            <p className="text-gray-500 text-xs uppercase tracking-wide mb-3">Estado del vehículo</p>
            <div className="flex gap-2 flex-wrap">
              {(["available", "reserved", "sold"] as SaleStatus[]).map((s) => {
                const { label, badge } = STATUS_MAP[s];
                const isActive = vehicle.status === s;
                return (
                  <button
                    key={s}
                    onClick={() => handleStatusChange(s)}
                    disabled={isPending}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 ${
                      isActive ? `${badge} ring-1 ring-white/20` : "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Specs */}
          <div className="bg-[#16213e] border border-white/10 rounded-xl p-5">
            <h2 className="text-white font-semibold text-sm uppercase tracking-wide mb-4">Especificaciones</h2>
            <div className="space-y-3">
              {specs.map((s) => (
                <div key={s.label} className="flex justify-between text-sm">
                  <span className="text-gray-500">{s.label}</span>
                  <span className="text-gray-200 capitalize">{s.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Features */}
          {vehicle.features.length > 0 && (
            <div className="bg-[#16213e] border border-white/10 rounded-xl p-5">
              <h2 className="text-white font-semibold text-sm uppercase tracking-wide mb-3">Características</h2>
              <div className="flex flex-wrap gap-2">
                {vehicle.features.map((f) => (
                  <span key={f} className="bg-white/5 border border-white/10 text-gray-300 text-xs px-2.5 py-1 rounded-full">{f}</span>
                ))}
              </div>
            </div>
          )}

          {/* Description */}
          {vehicle.description && (
            <div className="bg-[#16213e] border border-white/10 rounded-xl p-5">
              <h2 className="text-white font-semibold text-sm uppercase tracking-wide mb-3">Descripción</h2>
              <p className="text-gray-400 text-sm leading-relaxed whitespace-pre-line">{vehicle.description}</p>
            </div>
          )}
        </div>
      </div>

      {showEdit && (
        <EditModal
          vehicle={vehicle}
          onClose={() => setShowEdit(false)}
          onSaved={(updated) => {
            setVehicle(updated);
            setShowEdit(false);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}
