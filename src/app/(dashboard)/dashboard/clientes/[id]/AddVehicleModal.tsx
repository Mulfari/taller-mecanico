"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { addVehicle } from "./actions";

function IconX() {
  return <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>;
}
function IconChevronDown() {
  return <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>;
}
function IconSpinner() {
  return <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" /></svg>;
}
function IconPlus() {
  return <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>;
}

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 30 }, (_, i) => CURRENT_YEAR - i);

const inputClass =
  "w-full bg-[#1a1a2e] border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-[#e94560]/60 focus:ring-1 focus:ring-[#e94560]/30 transition-colors";
const selectClass =
  "w-full bg-[#1a1a2e] border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#e94560]/60 focus:ring-1 focus:ring-[#e94560]/30 transition-colors appearance-none";

interface VehicleForm { brand: string; model: string; year: string; plate: string; color: string; vin: string; mileage: string }
const EMPTY: VehicleForm = { brand: "", model: "", year: String(CURRENT_YEAR), plate: "", color: "", vin: "", mileage: "" };

function Modal({ clientId, onClose }: { clientId: string; onClose: () => void }) {
  const router = useRouter();
  const [form, setForm] = useState<VehicleForm>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Partial<VehicleForm>>({});
  const [serverError, setServerError] = useState<string | null>(null);

  function set(field: keyof VehicleForm, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
    setErrors((e) => ({ ...e, [field]: undefined }));
  }

  function validate(): boolean {
    const e: Partial<VehicleForm> = {};
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
      await addVehicle(clientId, {
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
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[#16213e] border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <h2 className="text-white font-semibold text-lg">Agregar vehículo</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors" aria-label="Cerrar"><IconX /></button>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {serverError && <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{serverError}</p>}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Marca <span className="text-[#e94560]">*</span></label>
              <input className={inputClass} placeholder="Ej. Toyota" value={form.brand} onChange={(e) => set("brand", e.target.value)} />
              {errors.brand && <p className="text-red-400 text-xs mt-1">{errors.brand}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Modelo <span className="text-[#e94560]">*</span></label>
              <input className={inputClass} placeholder="Ej. Corolla" value={form.model} onChange={(e) => set("model", e.target.value)} />
              {errors.model && <p className="text-red-400 text-xs mt-1">{errors.model}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Año</label>
              <div className="relative">
                <select className={selectClass} value={form.year} onChange={(e) => set("year", e.target.value)}>
                  {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-gray-500"><IconChevronDown /></div>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Placa <span className="text-[#e94560]">*</span></label>
              <input className={inputClass} placeholder="ABC-123" value={form.plate} onChange={(e) => set("plate", e.target.value)} />
              {errors.plate && <p className="text-red-400 text-xs mt-1">{errors.plate}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Color</label>
              <input className={inputClass} placeholder="Ej. Blanco" value={form.color} onChange={(e) => set("color", e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Kilometraje</label>
              <input type="number" min="0" className={inputClass} placeholder="0" value={form.mileage} onChange={(e) => set("mileage", e.target.value)} />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-300 mb-1.5">VIN</label>
              <input className={inputClass} placeholder="17 caracteres" maxLength={17} value={form.vin} onChange={(e) => set("vin", e.target.value)} />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 rounded-lg border border-white/10 text-gray-400 text-sm hover:text-white hover:border-white/20 transition-colors">Cancelar</button>
            <button type="submit" disabled={saving} className="flex-1 inline-flex items-center justify-center gap-2 bg-[#e94560] hover:bg-[#c73652] disabled:opacity-60 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors">
              {saving ? <><IconSpinner /> Guardando…</> : "Guardar vehículo"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AddVehicleModal({ clientId }: { clientId: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 bg-[#e94560] hover:bg-[#c73652] text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
      >
        <IconPlus /> Agregar vehículo
      </button>
      {open && <Modal clientId={clientId} onClose={() => setOpen(false)} />}
    </>
  );
}
