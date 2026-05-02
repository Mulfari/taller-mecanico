"use client";

import { useState, useMemo, useRef, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { VehicleForSale, VehiclePhoto } from "@/lib/supabase/queries/vehicles-for-sale";

// ── Icons ──────────────────────────────────────────────────────────────────

function IconSearch() {
  return <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" /></svg>;
}
function IconPlus() {
  return <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>;
}
function IconX() {
  return <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>;
}
function IconChevronDown() {
  return <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>;
}
function IconSpinner() {
  return <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" /></svg>;
}
function IconCar() {
  return <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
}
function IconEdit() {
  return <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>;
}
function IconEye() {
  return <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>;
}
function IconTrash() {
  return <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>;
}
function IconUpload() {
  return <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>;
}

// ── Types ──────────────────────────────────────────────────────────────────

type SaleStatus = "available" | "reserved" | "sold";

interface PhotoPreview {
  id: string;
  url: string;
  file?: File;
  uploading?: boolean;
  error?: string;
}

interface VehicleForm {
  brand: string;
  model: string;
  year: string;
  price: string;
  mileage: string;
  color: string;
  transmission: string;
  fuel_type: string;
  description: string;
  features: string;
  status: SaleStatus;
}

// ── Constants ──────────────────────────────────────────────────────────────

const BRANDS = ["Chevrolet", "Chrysler", "Dodge", "Ford", "Honda", "Hyundai", "Kia", "Mazda", "Nissan", "Peugeot", "Renault", "Seat", "Suzuki", "Toyota", "Volkswagen", "Otro"];
const TRANSMISSIONS = ["manual", "automático", "CVT"];
const FUEL_TYPES = ["gasolina", "diesel", "híbrido", "eléctrico", "gas"];
const CURRENT_YEAR = new Date().getFullYear();

const STATUS_MAP: Record<SaleStatus, { label: string; className: string; dotClass: string }> = {
  available: { label: "Disponible", className: "bg-green-500/20 text-green-300", dotClass: "bg-green-400" },
  reserved:  { label: "Reservado",  className: "bg-yellow-500/20 text-yellow-300", dotClass: "bg-yellow-400" },
  sold:      { label: "Vendido",    className: "bg-gray-500/20 text-gray-400", dotClass: "bg-gray-500" },
};

const EMPTY_FORM: VehicleForm = {
  brand: "", model: "", year: String(CURRENT_YEAR), price: "", mileage: "",
  color: "", transmission: "manual", fuel_type: "gasolina",
  description: "", features: "", status: "available",
};

const inputClass = "w-full bg-[#1a1a2e] border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-[#e94560]/60 focus:ring-1 focus:ring-[#e94560]/30 transition-colors";
const selectClass = "w-full bg-[#1a1a2e] border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#e94560]/60 focus:ring-1 focus:ring-[#e94560]/30 transition-colors appearance-none";

// ── StatusBadge ────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: SaleStatus }) {
  const { label, className, dotClass } = STATUS_MAP[status];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${className}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dotClass}`} />
      {label}
    </span>
  );
}

// ── PhotoUploader ──────────────────────────────────────────────────────────

function PhotoUploader({
  vehicleId,
  photos,
  onChange,
}: {
  vehicleId: string | null;
  photos: PhotoPreview[];
  onChange: (photos: PhotoPreview[]) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  const uploadFile = useCallback(
    async (file: File, previewId: string, currentPhotos: PhotoPreview[]) => {
      const ext = file.name.split(".").pop();
      const path = `vehicles-for-sale/${vehicleId ?? "new"}/${previewId}.${ext}`;
      const { data, error } = await supabase.storage
        .from("vehicle-photos")
        .upload(path, file, { upsert: true });

      if (error || !data) {
        onChange(
          currentPhotos.map((p) =>
            p.id === previewId ? { ...p, uploading: false, error: "Error al subir" } : p
          )
        );
        return;
      }

      const { data: urlData } = supabase.storage
        .from("vehicle-photos")
        .getPublicUrl(data.path);

      onChange(
        currentPhotos.map((p) =>
          p.id === previewId
            ? { ...p, url: urlData.publicUrl, uploading: false, file: undefined }
            : p
        )
      );
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [vehicleId]
  );

  function handleFiles(files: FileList | null) {
    if (!files) return;
    const newPreviews: PhotoPreview[] = Array.from(files).map((file) => ({
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      url: URL.createObjectURL(file),
      file,
      uploading: true,
    }));
    const updated = [...photos, ...newPreviews];
    onChange(updated);
    newPreviews.forEach((p) => uploadFile(p.file!, p.id, updated));
  }

  function removePhoto(id: string) {
    onChange(photos.filter((p) => p.id !== id));
  }

  return (
    <div className="space-y-3">
      <div
        className="border-2 border-dashed border-white/10 rounded-xl p-6 text-center cursor-pointer hover:border-[#e94560]/40 transition-colors"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => { e.preventDefault(); handleFiles(e.dataTransfer.files); }}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
        aria-label="Subir fotos del vehículo"
      >
        <div className="flex flex-col items-center gap-2 text-gray-500">
          <IconUpload />
          <p className="text-sm">Arrastrá fotos o <span className="text-[#e94560]">hacé clic para seleccionar</span></p>
          <p className="text-xs">JPG, PNG, WEBP — máx. 5 MB por foto</p>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>

      {photos.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {photos.map((photo, idx) => (
            <div key={photo.id} className="relative aspect-video rounded-lg overflow-hidden bg-[#1a1a2e] border border-white/10">
              <Image src={photo.url} alt={`Foto ${idx + 1}`} fill className="object-cover" sizes="150px" />
              {photo.uploading && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                  <IconSpinner />
                </div>
              )}
              {photo.error && (
                <div className="absolute inset-0 bg-red-900/60 flex items-center justify-center">
                  <span className="text-red-300 text-xs text-center px-1">{photo.error}</span>
                </div>
              )}
              {idx === 0 && !photo.uploading && (
                <span className="absolute top-1 left-1 bg-[#e94560] text-white text-[10px] px-1.5 py-0.5 rounded font-medium">Principal</span>
              )}
              <button
                type="button"
                onClick={() => removePhoto(photo.id)}
                className="absolute top-1 right-1 w-5 h-5 bg-black/70 rounded-full flex items-center justify-center text-white hover:bg-red-600 transition-colors"
                aria-label="Eliminar foto"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── VehicleFormModal ───────────────────────────────────────────────────────

function VehicleFormModal({
  vehicle,
  onClose,
  onSave,
}: {
  vehicle: VehicleForSale | null;
  onClose: () => void;
  onSave: (v: VehicleForSale) => void;
}) {
  const isEdit = vehicle !== null;
  const supabase = createClient();
  const [form, setForm] = useState<VehicleForm>(
    vehicle
      ? {
          brand: vehicle.brand,
          model: vehicle.model,
          year: String(vehicle.year),
          price: String(vehicle.price),
          mileage: vehicle.mileage != null ? String(vehicle.mileage) : "",
          color: vehicle.color ?? "",
          transmission: vehicle.transmission ?? "manual",
          fuel_type: vehicle.fuel_type ?? "gasolina",
          description: vehicle.description ?? "",
          features: (vehicle.features ?? []).join(", "),
          status: vehicle.status,
        }
      : EMPTY_FORM
  );
  const [photos, setPhotos] = useState<PhotoPreview[]>(
    vehicle?.photos.map((p) => ({ id: p.id, url: p.url })) ?? []
  );
  const [saving, setSaving] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Partial<Record<keyof VehicleForm, string>>>({});

  function set(field: keyof VehicleForm, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
    setErrors((e) => ({ ...e, [field]: undefined }));
  }

  function validate() {
    const e: Partial<Record<keyof VehicleForm, string>> = {};
    if (!form.brand) e.brand = "Requerido";
    if (!form.model.trim()) e.model = "Requerido";
    const yr = Number(form.year);
    if (!form.year || isNaN(yr) || yr < 1900 || yr > CURRENT_YEAR + 1) e.year = "Año inválido";
    if (!form.price || isNaN(Number(form.price)) || Number(form.price) <= 0) e.price = "Precio inválido";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    setServerError(null);

    const payload = {
      brand: form.brand,
      model: form.model.trim(),
      year: Number(form.year),
      price: Number(form.price),
      mileage: form.mileage ? Number(form.mileage) : null,
      color: form.color.trim() || null,
      transmission: form.transmission || null,
      fuel_type: form.fuel_type || null,
      description: form.description.trim() || null,
      features: form.features ? form.features.split(",").map((f) => f.trim()).filter(Boolean) : null,
      status: form.status,
    };

    try {
      let vehicleId: string;

      if (isEdit) {
        const { error } = await supabase
          .from("vehicles_for_sale")
          .update(payload)
          .eq("id", vehicle.id);
        if (error) throw error;
        vehicleId = vehicle.id;
      } else {
        const { data, error } = await supabase
          .from("vehicles_for_sale")
          .insert(payload)
          .select("id")
          .single();
        if (error) throw error;
        vehicleId = data.id;
      }

      // Sync photos: delete removed ones, insert new ones
      const readyPhotos = photos.filter((p) => !p.uploading && !p.error);
      if (isEdit) {
        const existingIds = vehicle.photos.map((p) => p.id);
        const keptIds = readyPhotos.map((p) => p.id).filter((id) => existingIds.includes(id));
        const removedIds = existingIds.filter((id) => !keptIds.includes(id));
        if (removedIds.length > 0) {
          await supabase.from("vehicle_photos").delete().in("id", removedIds);
        }
      }

      const newPhotos = readyPhotos.filter((p) => !vehicle?.photos.some((vp) => vp.id === p.id));
      if (newPhotos.length > 0) {
        const existingCount = isEdit ? vehicle.photos.filter((vp) => readyPhotos.some((rp) => rp.id === vp.id)).length : 0;
        await supabase.from("vehicle_photos").insert(
          newPhotos.map((p, i) => ({
            vehicle_sale_id: vehicleId,
            url: p.url,
            order: existingCount + i,
          }))
        );
      }

      // Fetch the saved vehicle with photos to return
      const { data: saved, error: fetchError } = await supabase
        .from("vehicles_for_sale")
        .select("*, photos:vehicle_photos(id, url, order)")
        .eq("id", vehicleId)
        .single();
      if (fetchError) throw fetchError;

      onSave({
        ...saved,
        photos: (saved.photos ?? []).sort((a: VehiclePhoto, b: VehiclePhoto) => a.order - b.order),
      });
    } catch (err) {
      setServerError(err instanceof Error ? err.message : "Error al guardar");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 overflow-y-auto">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[#16213e] border border-white/10 rounded-2xl w-full max-w-2xl shadow-2xl my-8">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <h2 className="text-white font-semibold text-lg">
            {isEdit ? "Editar vehículo" : "Nuevo vehículo en venta"}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors" aria-label="Cerrar">
            <IconX />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">
          {serverError && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 text-red-400 text-sm">
              {serverError}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Marca <span className="text-[#e94560]">*</span></label>
              <div className="relative">
                <select className={selectClass} value={form.brand} onChange={(e) => set("brand", e.target.value)}>
                  <option value="">Seleccionar</option>
                  {BRANDS.map((b) => <option key={b} value={b}>{b}</option>)}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-gray-500"><IconChevronDown /></div>
              </div>
              {errors.brand && <p className="text-red-400 text-xs mt-1">{errors.brand}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Modelo <span className="text-[#e94560]">*</span></label>
              <input className={inputClass} placeholder="Ej. Corolla" value={form.model} onChange={(e) => set("model", e.target.value)} />
              {errors.model && <p className="text-red-400 text-xs mt-1">{errors.model}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Año <span className="text-[#e94560]">*</span></label>
              <input type="number" min="1900" max={CURRENT_YEAR + 1} className={inputClass} value={form.year} onChange={(e) => set("year", e.target.value)} />
              {errors.year && <p className="text-red-400 text-xs mt-1">{errors.year}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Precio <span className="text-[#e94560]">*</span></label>
              <input type="number" min="0" className={inputClass} placeholder="0" value={form.price} onChange={(e) => set("price", e.target.value)} />
              {errors.price && <p className="text-red-400 text-xs mt-1">{errors.price}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Kilometraje</label>
              <input type="number" min="0" className={inputClass} placeholder="0" value={form.mileage} onChange={(e) => set("mileage", e.target.value)} />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Color</label>
              <input className={inputClass} placeholder="Ej. Blanco" value={form.color} onChange={(e) => set("color", e.target.value)} />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Transmisión</label>
              <div className="relative">
                <select className={selectClass} value={form.transmission} onChange={(e) => set("transmission", e.target.value)}>
                  {TRANSMISSIONS.map((t) => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-gray-500"><IconChevronDown /></div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Combustible</label>
              <div className="relative">
                <select className={selectClass} value={form.fuel_type} onChange={(e) => set("fuel_type", e.target.value)}>
                  {FUEL_TYPES.map((f) => <option key={f} value={f}>{f.charAt(0).toUpperCase() + f.slice(1)}</option>)}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-gray-500"><IconChevronDown /></div>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Estado</label>
            <div className="flex gap-3">
              {(["available", "reserved", "sold"] as SaleStatus[]).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => set("status", s)}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${
                    form.status === s
                      ? "border-[#e94560] bg-[#e94560]/15 text-[#e94560]"
                      : "border-white/10 text-gray-400 hover:border-white/20 hover:text-white"
                  }`}
                >
                  {STATUS_MAP[s].label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Descripción</label>
            <textarea rows={3} className={inputClass} placeholder="Descripción del vehículo, estado, historial…" value={form.description} onChange={(e) => set("description", e.target.value)} />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Características <span className="text-gray-600 font-normal">(separadas por coma)</span></label>
            <input className={inputClass} placeholder="Aire acondicionado, Bluetooth, Cámara trasera" value={form.features} onChange={(e) => set("features", e.target.value)} />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Fotos</label>
            <PhotoUploader vehicleId={vehicle?.id ?? null} photos={photos} onChange={setPhotos} />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 rounded-lg border border-white/10 text-gray-400 text-sm hover:text-white hover:border-white/20 transition-colors">
              Cancelar
            </button>
            <button type="submit" disabled={saving} className="flex-1 inline-flex items-center justify-center gap-2 bg-[#e94560] hover:bg-[#c73652] disabled:opacity-60 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors">
              {saving ? <><IconSpinner /> Guardando…</> : isEdit ? "Guardar cambios" : "Agregar vehículo"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── StorefrontPreviewModal ─────────────────────────────────────────────────

function StorefrontPreviewModal({ vehicle, onClose }: { vehicle: VehicleForSale; onClose: () => void }) {
  const [activePhoto, setActivePhoto] = useState(0);
  const photos = vehicle.photos;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="bg-[#2a2a3e] rounded-t-xl border border-white/10 px-4 py-2.5 flex items-center gap-3">
          <div className="flex gap-1.5">
            <span className="w-3 h-3 rounded-full bg-red-500/70" />
            <span className="w-3 h-3 rounded-full bg-yellow-500/70" />
            <span className="w-3 h-3 rounded-full bg-green-500/70" />
          </div>
          <div className="flex-1 bg-[#1a1a2e] rounded px-3 py-1 text-gray-500 text-xs font-mono">
            tallerpro.com/vehiculos/{vehicle.id}
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors ml-2" aria-label="Cerrar preview">
            <IconX />
          </button>
        </div>

        <div className="bg-[#1a1a2e] border border-t-0 border-white/10 rounded-b-xl overflow-hidden">
          <div className="relative h-64 bg-[#0f172a]">
            {photos.length > 0 ? (
              <>
                <Image src={photos[activePhoto].url} alt={`${vehicle.brand} ${vehicle.model}`} fill className="object-cover" sizes="672px" />
                {photos.length > 1 && (
                  <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5">
                    {photos.map((_, i) => (
                      <button key={i} onClick={() => setActivePhoto(i)} className={`w-2 h-2 rounded-full transition-colors ${i === activePhoto ? "bg-white" : "bg-white/40"}`} aria-label={`Foto ${i + 1}`} />
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <IconCar />
                <span className="text-gray-600 text-sm ml-2">Sin fotos</span>
              </div>
            )}
            <div className="absolute top-3 right-3"><StatusBadge status={vehicle.status} /></div>
          </div>

          <div className="p-6 space-y-4" style={{ backgroundColor: "#16213e" }}>
            <div>
              <h2 className="text-white text-2xl font-bold">{vehicle.brand} {vehicle.model}</h2>
              <p className="text-gray-400 mt-0.5">{vehicle.year}</p>
            </div>
            <div className="flex items-center gap-4 text-sm text-gray-400 flex-wrap">
              {vehicle.mileage != null && (
                <span className="flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                  {vehicle.mileage.toLocaleString("es-MX")} km
                </span>
              )}
              {vehicle.transmission && <span className="capitalize">{vehicle.transmission}</span>}
              {vehicle.fuel_type && <span className="capitalize">{vehicle.fuel_type}</span>}
              {vehicle.color && <span>{vehicle.color}</span>}
            </div>
            <div className="pt-2 border-t border-white/5">
              <span className="text-[#e94560] font-bold text-3xl">${vehicle.price.toLocaleString("es-MX")}</span>
            </div>
            {vehicle.description && <p className="text-gray-300 text-sm leading-relaxed">{vehicle.description}</p>}
            {vehicle.features && vehicle.features.length > 0 && (
              <div>
                <p className="text-gray-500 text-xs uppercase tracking-wide mb-2">Características</p>
                <div className="flex flex-wrap gap-2">
                  {vehicle.features.map((f) => (
                    <span key={f} className="bg-white/5 border border-white/10 text-gray-300 text-xs px-2.5 py-1 rounded-full">{f}</span>
                  ))}
                </div>
              </div>
            )}
            <button className="w-full bg-[#e94560] hover:bg-[#c73652] text-white font-medium py-3 rounded-xl transition-colors text-sm">
              Consultar por este vehículo
            </button>
          </div>
        </div>
        <p className="text-center text-gray-600 text-xs mt-3">Vista previa del storefront — así lo verán los clientes</p>
      </div>
    </div>
  );
}

// ── DeleteConfirmModal ─────────────────────────────────────────────────────

function DeleteConfirmModal({ vehicle, onClose, onConfirm }: { vehicle: VehicleForSale; onClose: () => void; onConfirm: () => Promise<void> }) {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    setDeleting(true);
    setError(null);
    try {
      await onConfirm();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al eliminar");
      setDeleting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[#16213e] border border-white/10 rounded-2xl w-full max-w-sm shadow-2xl p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center text-red-400 shrink-0">
            <IconTrash />
          </div>
          <div>
            <h3 className="text-white font-semibold">Eliminar vehículo</h3>
            <p className="text-gray-400 text-sm">{vehicle.brand} {vehicle.model} {vehicle.year}</p>
          </div>
        </div>
        <p className="text-gray-400 text-sm">Esta acción no se puede deshacer. El vehículo y sus fotos serán eliminados permanentemente.</p>
        {error && <p className="text-red-400 text-sm">{error}</p>}
        <div className="flex gap-3">
          <button onClick={onClose} disabled={deleting} className="flex-1 px-4 py-2.5 rounded-lg border border-white/10 text-gray-400 text-sm hover:text-white hover:border-white/20 transition-colors disabled:opacity-50">
            Cancelar
          </button>
          <button onClick={handleDelete} disabled={deleting} className="flex-1 inline-flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors">
            {deleting ? <><IconSpinner /> Eliminando…</> : "Eliminar"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────

export default function VehiculosVentaClient({ initialVehicles }: { initialVehicles: VehicleForSale[] }) {
  const supabase = createClient();
  const [vehicles, setVehicles] = useState<VehicleForSale[]>(initialVehicles);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<SaleStatus | "">("");
  const [filterBrand, setFilterBrand] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<VehicleForSale | null>(null);
  const [previewVehicle, setPreviewVehicle] = useState<VehicleForSale | null>(null);
  const [deletingVehicle, setDeletingVehicle] = useState<VehicleForSale | null>(null);

  const allBrands = useMemo(() => [...new Set(vehicles.map((v) => v.brand))].sort(), [vehicles]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return vehicles.filter((v) => {
      const matchSearch = !q || `${v.brand} ${v.model} ${v.year}`.toLowerCase().includes(q);
      const matchStatus = !filterStatus || v.status === filterStatus;
      const matchBrand = !filterBrand || v.brand === filterBrand;
      return matchSearch && matchStatus && matchBrand;
    });
  }, [vehicles, search, filterStatus, filterBrand]);

  const counts = useMemo(() => ({
    available: vehicles.filter((v) => v.status === "available").length,
    reserved: vehicles.filter((v) => v.status === "reserved").length,
    sold: vehicles.filter((v) => v.status === "sold").length,
  }), [vehicles]);

  function handleSave(v: VehicleForSale) {
    setVehicles((prev) => {
      const idx = prev.findIndex((x) => x.id === v.id);
      return idx >= 0 ? prev.map((x) => (x.id === v.id ? v : x)) : [v, ...prev];
    });
    setShowForm(false);
    setEditingVehicle(null);
  }

  async function handleDelete(vehicle: VehicleForSale) {
    const { error } = await supabase.from("vehicles_for_sale").delete().eq("id", vehicle.id);
    if (error) throw error;
    setVehicles((prev) => prev.filter((v) => v.id !== vehicle.id));
    setDeletingVehicle(null);
  }

  async function handleStatusChange(id: string, status: SaleStatus) {
    const { error } = await supabase.from("vehicles_for_sale").update({ status }).eq("id", id);
    if (error) return;
    setVehicles((prev) => prev.map((v) => (v.id === id ? { ...v, status } : v)));
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Vehículos en Venta</h1>
          <p className="text-gray-500 text-sm mt-1">{vehicles.length} vehículos registrados</p>
        </div>
        <button
          onClick={() => { setEditingVehicle(null); setShowForm(true); }}
          className="inline-flex items-center gap-2 bg-[#e94560] hover:bg-[#c73652] text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          <IconPlus />
          Nuevo vehículo
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {(["available", "reserved", "sold"] as SaleStatus[]).map((s) => (
          <button
            key={s}
            onClick={() => setFilterStatus(filterStatus === s ? "" : s)}
            className={`bg-[#16213e] border rounded-xl p-4 text-left transition-colors ${filterStatus === s ? "border-[#e94560]/50" : "border-white/10 hover:border-white/20"}`}
          >
            <p className="text-2xl font-bold text-white">{counts[s]}</p>
            <p className="text-sm mt-0.5"><StatusBadge status={s} /></p>
          </button>
        ))}
      </div>

      <div className="bg-[#16213e] border border-white/10 rounded-xl p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-gray-500"><IconSearch /></div>
            <input
              type="text"
              placeholder="Buscar por marca, modelo o año…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[#1a1a2e] border border-white/10 rounded-lg pl-9 pr-3 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-[#e94560]/60 focus:ring-1 focus:ring-[#e94560]/30 transition-colors"
            />
          </div>
          <div className="relative sm:w-44">
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as SaleStatus | "")} className={selectClass}>
              <option value="">Todos los estados</option>
              <option value="available">Disponible</option>
              <option value="reserved">Reservado</option>
              <option value="sold">Vendido</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-gray-500"><IconChevronDown /></div>
          </div>
          <div className="relative sm:w-40">
            <select value={filterBrand} onChange={(e) => setFilterBrand(e.target.value)} className={selectClass}>
              <option value="">Todas las marcas</option>
              {allBrands.map((b) => <option key={b} value={b}>{b}</option>)}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-gray-500"><IconChevronDown /></div>
          </div>
          {(search || filterStatus || filterBrand) && (
            <button onClick={() => { setSearch(""); setFilterStatus(""); setFilterBrand(""); }} className="px-3 py-2 rounded-lg border border-white/10 text-gray-400 text-sm hover:text-white hover:border-white/20 transition-colors whitespace-nowrap">
              Limpiar
            </button>
          )}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-[#16213e] border border-white/10 rounded-xl py-16 text-center">
          <div className="text-gray-600 mb-3 flex justify-center"><IconCar /></div>
          <p className="text-gray-400">No se encontraron vehículos con los filtros aplicados.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
          {filtered.map((v) => {
            const mainPhoto = v.photos[0]?.url;
            return (
              <div key={v.id} className="bg-[#16213e] border border-white/10 rounded-xl overflow-hidden hover:border-white/20 transition-colors">
                <div className="relative h-44 bg-[#0f172a]">
                  {mainPhoto ? (
                    <Image src={mainPhoto} alt={`${v.brand} ${v.model}`} fill className="object-cover" sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw" />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-gray-600">
                      <IconCar />
                      <span className="text-xs">Sin fotos</span>
                    </div>
                  )}
                  <div className="absolute top-2 left-2"><StatusBadge status={v.status} /></div>
                  {v.photos.length > 1 && (
                    <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-0.5 rounded-full">
                      {v.photos.length} fotos
                    </div>
                  )}
                </div>

                <div className="p-4">
                  <Link href={`/dashboard/vehiculos-venta/${v.id}`} className="block hover:text-[#e94560] transition-colors">
                    <h3 className="text-white font-semibold">{v.brand} {v.model}</h3>
                  </Link>
                  <p className="text-gray-500 text-sm">{v.year}{v.color ? ` · ${v.color}` : ""}</p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                    {v.mileage != null && <span>{v.mileage.toLocaleString("es-MX")} km</span>}
                    {v.transmission && <span className="capitalize">{v.transmission}</span>}
                    {v.fuel_type && <span className="capitalize">{v.fuel_type}</span>}
                  </div>
                  <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between">
                    <span className="text-[#e94560] font-bold text-lg">${v.price.toLocaleString("es-MX")}</span>
                    <div className="flex items-center gap-1">
                      <div className="relative group">
                        <button className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-white/5 transition-colors" aria-label="Cambiar estado">
                          <IconChevronDown />
                        </button>
                        <div className="absolute right-0 bottom-full mb-1 hidden group-focus-within:block group-hover:block bg-[#1a1a2e] border border-white/10 rounded-lg shadow-xl overflow-hidden z-10 min-w-[130px]">
                          {(["available", "reserved", "sold"] as SaleStatus[]).map((s) => (
                            <button
                              key={s}
                              onClick={() => handleStatusChange(v.id, s)}
                              className={`w-full text-left px-3 py-2 text-xs hover:bg-white/5 transition-colors flex items-center gap-2 ${v.status === s ? "text-[#e94560]" : "text-gray-300"}`}
                            >
                              <span className={`w-1.5 h-1.5 rounded-full ${STATUS_MAP[s].dotClass}`} />
                              {STATUS_MAP[s].label}
                            </button>
                          ))}
                        </div>
                      </div>
                      <button onClick={() => setPreviewVehicle(v)} className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-white/5 transition-colors" aria-label="Vista previa storefront">
                        <IconEye />
                      </button>
                      <button onClick={() => { setEditingVehicle(v); setShowForm(true); }} className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-white/5 transition-colors" aria-label="Editar">
                        <IconEdit />
                      </button>
                      <button onClick={() => setDeletingVehicle(v)} className="p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors" aria-label="Eliminar">
                        <IconTrash />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {filtered.length > 0 && (
        <p className="text-gray-600 text-xs text-right">Mostrando {filtered.length} de {vehicles.length} vehículos</p>
      )}

      {showForm && (
        <VehicleFormModal
          vehicle={editingVehicle}
          onClose={() => { setShowForm(false); setEditingVehicle(null); }}
          onSave={handleSave}
        />
      )}
      {previewVehicle && <StorefrontPreviewModal vehicle={previewVehicle} onClose={() => setPreviewVehicle(null)} />}
      {deletingVehicle && (
        <DeleteConfirmModal
          vehicle={deletingVehicle}
          onClose={() => setDeletingVehicle(null)}
          onConfirm={() => handleDelete(deletingVehicle)}
        />
      )}
    </div>
  );
}
