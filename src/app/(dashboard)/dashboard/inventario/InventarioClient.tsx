"use client";

import { useState, useMemo, useTransition } from "react";
import type { Inventory } from "@/types/database";
import { toast, ConfirmDialog, EmptyState } from "@/components/ui";
import { createInventoryItem, updateInventoryItem, deleteInventoryItem, adjustStock } from "./actions";

function IconSearch() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
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

function IconX() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

function IconAlertTriangle() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
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

function IconPencil() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
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

function IconDownload() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
    </svg>
  );
}

type StockStatus = "ok" | "bajo" | "agotado";

function getStockStatus(item: Inventory): StockStatus {
  if (item.quantity === 0) return "agotado";
  if (item.quantity < item.min_stock) return "bajo";
  return "ok";
}

function IconMinus() {
  return (
    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M20 12H4" />
    </svg>
  );
}

function StockBadge({ item }: { item: Inventory }) {
  const status = getStockStatus(item);
  const map: Record<StockStatus, { label: string; className: string }> = {
    ok:      { label: "OK",      className: "bg-green-500/20 text-green-300" },
    bajo:    { label: "Bajo",    className: "bg-yellow-500/20 text-yellow-300" },
    agotado: { label: "Agotado", className: "bg-red-500/20 text-red-300" },
  };
  const { label, className } = map[status];
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${className}`}>
      {status !== "ok" && <IconAlertTriangle />}
      {label}
    </span>
  );
}

const inputClass =
  "w-full bg-[#1a1a2e] border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-[#e94560]/60 focus:ring-1 focus:ring-[#e94560]/30 transition-colors";
const selectClass =
  "w-full bg-[#1a1a2e] border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#e94560]/60 focus:ring-1 focus:ring-[#e94560]/30 transition-colors appearance-none";

interface NewItemForm {
  name: string; sku: string; category: string; brand: string;
  quantity: string; min_stock: string; cost_price: string;
  sell_price: string; location: string; supplier: string;
  compatible_brands_input: string;
}

const EMPTY_FORM: NewItemForm = {
  name: "", sku: "", category: "", brand: "", quantity: "",
  min_stock: "", cost_price: "", sell_price: "", location: "", supplier: "",
  compatible_brands_input: "",
};

const CAR_BRANDS = [
  "Toyota", "Honda", "Ford", "Chevrolet", "Volkswagen", "Nissan", "Hyundai",
  "Kia", "BMW", "Mercedes-Benz", "Audi", "Mazda", "Subaru", "Mitsubishi",
  "Peugeot", "Renault", "Fiat", "Jeep", "Ram", "Dodge",
];

function BrandsTagInput({
  tags,
  onAdd,
  onRemove,
  inputValue,
  onInputChange,
}: {
  tags: string[];
  onAdd: (brand: string) => void;
  onRemove: (brand: string) => void;
  inputValue: string;
  onInputChange: (v: string) => void;
}) {
  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if ((e.key === "Enter" || e.key === ",") && inputValue.trim()) {
      e.preventDefault();
      const val = inputValue.trim().replace(/,$/, "");
      if (val && !tags.includes(val)) onAdd(val);
      onInputChange("");
    } else if (e.key === "Backspace" && !inputValue && tags.length > 0) {
      onRemove(tags[tags.length - 1]);
    }
  }

  const suggestions = CAR_BRANDS.filter(
    (b) => b.toLowerCase().includes(inputValue.toLowerCase()) && !tags.includes(b)
  ).slice(0, 5);

  return (
    <div className="space-y-2">
      <div className="min-h-[42px] flex flex-wrap gap-1.5 bg-[#1a1a2e] border border-white/10 rounded-lg px-3 py-2 focus-within:border-[#e94560]/60 focus-within:ring-1 focus-within:ring-[#e94560]/30 transition-colors">
        {tags.map((tag) => (
          <span key={tag} className="inline-flex items-center gap-1 bg-[#e94560]/15 text-[#e94560] text-xs font-medium px-2 py-0.5 rounded-full">
            {tag}
            <button type="button" onClick={() => onRemove(tag)} className="hover:text-white transition-colors" aria-label={`Quitar ${tag}`}>
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </span>
        ))}
        <input
          type="text"
          value={inputValue}
          onChange={(e) => onInputChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={tags.length === 0 ? "Ej. Toyota, Honda…" : ""}
          className="flex-1 min-w-[120px] bg-transparent text-white text-sm placeholder-gray-600 focus:outline-none"
        />
      </div>
      {inputValue && suggestions.length > 0 && (
        <div className="bg-[#1a1a2e] border border-white/10 rounded-lg overflow-hidden">
          {suggestions.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => { onAdd(s); onInputChange(""); }}
              className="w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-white/5 hover:text-white transition-colors"
            >
              {s}
            </button>
          ))}
        </div>
      )}
      <p className="text-gray-600 text-xs">Presioná Enter o coma para agregar. Backspace para eliminar el último.</p>
    </div>
  );
}

const CATEGORIES = ["Filtros", "Frenos", "Encendido", "Lubricantes", "Suspension", "Motor", "Electrico", "Carroceria", "Otro"];

function AddItemModal({ onClose, onAdd }: { onClose: () => void; onAdd: () => void }) {
  const [form, setForm] = useState<NewItemForm>(EMPTY_FORM);
  const [compatibleBrands, setCompatibleBrands] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Partial<NewItemForm>>({});

  function set(field: keyof NewItemForm, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
    setErrors((e) => ({ ...e, [field]: undefined }));
  }

  function validate(): boolean {
    const e: Partial<NewItemForm> = {};
    if (!form.name.trim()) e.name = "Requerido";
    if (!form.sku.trim()) e.sku = "Requerido";
    if (!form.category) e.category = "Requerido";
    if (!form.quantity || isNaN(Number(form.quantity))) e.quantity = "Número válido";
    if (!form.min_stock || isNaN(Number(form.min_stock))) e.min_stock = "Número válido";
    if (!form.sell_price || isNaN(Number(form.sell_price))) e.sell_price = "Número válido";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      await createInventoryItem({
        name: form.name.trim(),
        sku: form.sku.trim(),
        category: form.category,
        brand: form.brand.trim(),
        quantity: Number(form.quantity),
        min_stock: Number(form.min_stock),
        cost_price: form.cost_price ? Number(form.cost_price) : null,
        sell_price: Number(form.sell_price),
        location: form.location.trim(),
        supplier: form.supplier.trim(),
        compatible_brands: compatibleBrands,
      });
      toast("Repuesto agregado correctamente", "success");
      onAdd();
    } catch {
      toast("Error al guardar el repuesto", "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[#16213e] border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <h2 className="text-white font-semibold text-lg">Nuevo repuesto</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors" aria-label="Cerrar">
            <IconX />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4 max-h-[80vh] overflow-y-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Nombre <span className="text-[#e94560]">*</span></label>
              <input className={inputClass} placeholder="Ej. Filtro de aceite" value={form.name} onChange={(e) => set("name", e.target.value)} />
              {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">SKU <span className="text-[#e94560]">*</span></label>
              <input className={inputClass} placeholder="FIL-ACE-001" value={form.sku} onChange={(e) => set("sku", e.target.value)} />
              {errors.sku && <p className="text-red-400 text-xs mt-1">{errors.sku}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Categoría <span className="text-[#e94560]">*</span></label>
              <div className="relative">
                <select className={selectClass} value={form.category} onChange={(e) => set("category", e.target.value)}>
                  <option value="">Seleccionar</option>
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-gray-500"><IconChevronDown /></div>
              </div>
              {errors.category && <p className="text-red-400 text-xs mt-1">{errors.category}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Marca</label>
              <input className={inputClass} placeholder="Ej. Bosch" value={form.brand} onChange={(e) => set("brand", e.target.value)} />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Cantidad <span className="text-[#e94560]">*</span></label>
              <input type="number" min="0" className={inputClass} placeholder="0" value={form.quantity} onChange={(e) => set("quantity", e.target.value)} />
              {errors.quantity && <p className="text-red-400 text-xs mt-1">{errors.quantity}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Stock mínimo <span className="text-[#e94560]">*</span></label>
              <input type="number" min="0" className={inputClass} placeholder="0" value={form.min_stock} onChange={(e) => set("min_stock", e.target.value)} />
              {errors.min_stock && <p className="text-red-400 text-xs mt-1">{errors.min_stock}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Precio costo</label>
              <input type="number" min="0" step="0.01" className={inputClass} placeholder="0.00" value={form.cost_price} onChange={(e) => set("cost_price", e.target.value)} />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Precio venta <span className="text-[#e94560]">*</span></label>
              <input type="number" min="0" step="0.01" className={inputClass} placeholder="0.00" value={form.sell_price} onChange={(e) => set("sell_price", e.target.value)} />
              {errors.sell_price && <p className="text-red-400 text-xs mt-1">{errors.sell_price}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Ubicación</label>
              <input className={inputClass} placeholder="Ej. A1" value={form.location} onChange={(e) => set("location", e.target.value)} />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Proveedor</label>
              <input className={inputClass} placeholder="Ej. AutoPartes MX" value={form.supplier} onChange={(e) => set("supplier", e.target.value)} />
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Compatible con (marcas de autos)</label>
              <BrandsTagInput
                tags={compatibleBrands}
                onAdd={(b) => setCompatibleBrands((prev) => [...prev, b])}
                onRemove={(b) => setCompatibleBrands((prev) => prev.filter((x) => x !== b))}
                inputValue={form.compatible_brands_input}
                onInputChange={(v) => set("compatible_brands_input", v)}
              />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 rounded-lg border border-white/10 text-gray-400 text-sm hover:text-white hover:border-white/20 transition-colors">
              Cancelar
            </button>
            <button type="submit" disabled={saving} className="flex-1 inline-flex items-center justify-center gap-2 bg-[#e94560] hover:bg-[#c73652] disabled:opacity-60 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors">
              {saving ? <><IconSpinner /> Guardando…</> : "Guardar repuesto"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function EditItemModal({ item, onClose, onSaved }: { item: Inventory; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState<NewItemForm>({
    name: item.name,
    sku: item.sku,
    category: item.category ?? "",
    brand: item.brand ?? "",
    quantity: String(item.quantity),
    min_stock: String(item.min_stock),
    cost_price: item.cost_price != null ? String(item.cost_price) : "",
    sell_price: String(item.sell_price),
    location: item.location ?? "",
    supplier: item.supplier ?? "",
    compatible_brands_input: "",
  });
  const [compatibleBrands, setCompatibleBrands] = useState<string[]>(() => {
    const raw = (item as unknown as { compatible_brands?: unknown }).compatible_brands;
    if (Array.isArray(raw)) return raw as string[];
    if (typeof raw === "string" && raw) return raw.split(",").map((s: string) => s.trim());
    return [];
  });
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Partial<NewItemForm>>({});

  function set(field: keyof NewItemForm, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
    setErrors((e) => ({ ...e, [field]: undefined }));
  }

  function validate(): boolean {
    const e: Partial<NewItemForm> = {};
    if (!form.name.trim()) e.name = "Requerido";
    if (!form.sku.trim()) e.sku = "Requerido";
    if (!form.category) e.category = "Requerido";
    if (!form.quantity || isNaN(Number(form.quantity))) e.quantity = "Número válido";
    if (!form.min_stock || isNaN(Number(form.min_stock))) e.min_stock = "Número válido";
    if (!form.sell_price || isNaN(Number(form.sell_price))) e.sell_price = "Número válido";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      await updateInventoryItem(item.id, {
        name: form.name.trim(),
        sku: form.sku.trim(),
        category: form.category,
        brand: form.brand.trim(),
        quantity: Number(form.quantity),
        min_stock: Number(form.min_stock),
        cost_price: form.cost_price ? Number(form.cost_price) : null,
        sell_price: Number(form.sell_price),
        location: form.location.trim(),
        supplier: form.supplier.trim(),
        compatible_brands: compatibleBrands,
      });
      toast("Repuesto actualizado correctamente", "success");
      onSaved();
    } catch {
      toast("Error al actualizar el repuesto", "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[#16213e] border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <h2 className="text-white font-semibold text-lg">Editar repuesto</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors" aria-label="Cerrar">
            <IconX />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4 max-h-[80vh] overflow-y-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Nombre <span className="text-[#e94560]">*</span></label>
              <input className={inputClass} placeholder="Ej. Filtro de aceite" value={form.name} onChange={(e) => set("name", e.target.value)} />
              {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">SKU <span className="text-[#e94560]">*</span></label>
              <input className={inputClass} placeholder="FIL-ACE-001" value={form.sku} onChange={(e) => set("sku", e.target.value)} />
              {errors.sku && <p className="text-red-400 text-xs mt-1">{errors.sku}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Categoría <span className="text-[#e94560]">*</span></label>
              <div className="relative">
                <select className={selectClass} value={form.category} onChange={(e) => set("category", e.target.value)}>
                  <option value="">Seleccionar</option>
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-gray-500"><IconChevronDown /></div>
              </div>
              {errors.category && <p className="text-red-400 text-xs mt-1">{errors.category}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Marca</label>
              <input className={inputClass} placeholder="Ej. Bosch" value={form.brand} onChange={(e) => set("brand", e.target.value)} />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Cantidad <span className="text-[#e94560]">*</span></label>
              <input type="number" min="0" className={inputClass} placeholder="0" value={form.quantity} onChange={(e) => set("quantity", e.target.value)} />
              {errors.quantity && <p className="text-red-400 text-xs mt-1">{errors.quantity}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Stock mínimo <span className="text-[#e94560]">*</span></label>
              <input type="number" min="0" className={inputClass} placeholder="0" value={form.min_stock} onChange={(e) => set("min_stock", e.target.value)} />
              {errors.min_stock && <p className="text-red-400 text-xs mt-1">{errors.min_stock}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Precio costo</label>
              <input type="number" min="0" step="0.01" className={inputClass} placeholder="0.00" value={form.cost_price} onChange={(e) => set("cost_price", e.target.value)} />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Precio venta <span className="text-[#e94560]">*</span></label>
              <input type="number" min="0" step="0.01" className={inputClass} placeholder="0.00" value={form.sell_price} onChange={(e) => set("sell_price", e.target.value)} />
              {errors.sell_price && <p className="text-red-400 text-xs mt-1">{errors.sell_price}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Ubicación</label>
              <input className={inputClass} placeholder="Ej. A1" value={form.location} onChange={(e) => set("location", e.target.value)} />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Proveedor</label>
              <input className={inputClass} placeholder="Ej. AutoPartes MX" value={form.supplier} onChange={(e) => set("supplier", e.target.value)} />
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Compatible con (marcas de autos)</label>
              <BrandsTagInput
                tags={compatibleBrands}
                onAdd={(b) => setCompatibleBrands((prev) => [...prev, b])}
                onRemove={(b) => setCompatibleBrands((prev) => prev.filter((x) => x !== b))}
                inputValue={form.compatible_brands_input}
                onInputChange={(v) => set("compatible_brands_input", v)}
              />
            </div>
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

// ── Inline stock adjuster ──────────────────────────────────────────────────

function StockAdjuster({ item, onAdjusted }: { item: Inventory; onAdjusted: (id: string, newQty: number) => void }) {
  const [busy, setBusy] = useState(false);

  async function handleAdjust(delta: number) {
    if (busy) return;
    setBusy(true);
    try {
      const newQty = await adjustStock(item.id, delta);
      onAdjusted(item.id, newQty);
    } catch {
      toast("Error al ajustar el stock", "error");
    } finally {
      setBusy(false);
    }
  }

  const status = getStockStatus(item);
  const qtyColor = status === "agotado" ? "text-red-400" : status === "bajo" ? "text-yellow-400" : "text-white";

  return (
    <div className="flex items-center justify-end gap-1.5">
      <button
        onClick={() => handleAdjust(-1)}
        disabled={busy || item.quantity === 0}
        className="w-6 h-6 rounded flex items-center justify-center text-gray-500 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        aria-label={`Reducir stock de ${item.name}`}
      >
        <IconMinus />
      </button>
      <span className={`font-medium tabular-nums w-8 text-center ${qtyColor}`}>
        {item.quantity}
      </span>
      <button
        onClick={() => handleAdjust(1)}
        disabled={busy}
        className="w-6 h-6 rounded flex items-center justify-center text-gray-500 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        aria-label={`Aumentar stock de ${item.name}`}
      >
        <IconPlus />
      </button>
      <span className="text-gray-600 text-xs ml-0.5">/ {item.min_stock} mín</span>
    </div>
  );
}

function exportInventoryCSV(items: Inventory[]) {
  const headers = ["Nombre", "SKU", "Categoría", "Marca", "Cantidad", "Stock mínimo", "Precio costo", "Precio venta", "Ubicación", "Proveedor", "Compatible con"];
  const rows = items.map((i) => [
    i.name,
    i.sku,
    i.category ?? "",
    i.brand ?? "",
    i.quantity,
    i.min_stock,
    i.cost_price ?? "",
    i.sell_price,
    i.location ?? "",
    i.supplier ?? "",
    Array.isArray(i.compatible_brands) ? i.compatible_brands.join("; ") : (i.compatible_brands ?? ""),
  ]);

  const escape = (v: string | number) => {
    const s = String(v);
    return s.includes(",") || s.includes('"') || s.includes("\n") ? `"${s.replace(/"/g, '""')}"` : s;
  };

  const csv = [headers, ...rows].map((row) => row.map(escape).join(",")).join("\n");
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `inventario-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function InventarioClient({ initialItems }: { initialItems: Inventory[] }) {
  const [items, setItems] = useState<Inventory[]>(initialItems);
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterBrand, setFilterBrand] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Inventory | null>(null);
  const [editTarget, setEditTarget] = useState<Inventory | null>(null);
  const [isPending, startTransition] = useTransition();

  const categories = useMemo(() => [...new Set(items.map((i) => i.category).filter(Boolean))].sort() as string[], [items]);
  const brands = useMemo(() => [...new Set(items.map((i) => i.brand).filter(Boolean))].sort() as string[], [items]);

  function handleStockAdjusted(id: string, newQty: number) {
    setItems((prev) => prev.map((i) => i.id === id ? { ...i, quantity: newQty } : i));
  }

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return items.filter((item) => {
      const matchSearch = !q || item.name.toLowerCase().includes(q) || item.sku.toLowerCase().includes(q);
      const matchCategory = !filterCategory || item.category === filterCategory;
      const matchBrand = !filterBrand || item.brand === filterBrand;
      return matchSearch && matchCategory && matchBrand;
    });
  }, [items, search, filterCategory, filterBrand]);

  const alertCount = useMemo(() => items.filter((i) => getStockStatus(i) !== "ok").length, [items]);

  function handleAdded() {
    setShowModal(false);
    startTransition(() => {
      window.location.reload();
    });
  }

  function handleEditSaved() {
    setEditTarget(null);
    startTransition(() => {
      window.location.reload();
    });
  }

  function handleDeleteConfirm() {
    if (!deleteTarget) return;
    const target = deleteTarget;
    setDeleteTarget(null);
    setItems((prev) => prev.filter((i) => i.id !== target.id));
    startTransition(async () => {
      try {
        await deleteInventoryItem(target.id);
        toast(`"${target.name}" eliminado`, "success");
      } catch {
        setItems((prev) => [target, ...prev]);
        toast("Error al eliminar el repuesto", "error");
      }
    });
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Inventario</h1>
          <p className="text-gray-500 text-sm mt-1">
            {items.length} repuestos registrados
            {alertCount > 0 && (
              <span className="ml-2 inline-flex items-center gap-1 text-yellow-400">
                <IconAlertTriangle />
                {alertCount} con stock bajo o agotado
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => exportInventoryCSV(filtered)}
            disabled={filtered.length === 0}
            className="shrink-0 inline-flex items-center gap-2 bg-[#16213e] border border-white/10 hover:border-white/20 text-gray-300 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed text-sm font-medium px-4 py-2 rounded-lg transition-colors"
            title="Exportar inventario filtrado a CSV"
          >
            <IconDownload />
            Exportar CSV
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="shrink-0 inline-flex items-center gap-2 bg-[#e94560] hover:bg-[#c73652] text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            <IconPlus />
            Nuevo repuesto
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-[#16213e] border border-white/10 rounded-xl p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-gray-500">
              <IconSearch />
            </div>
            <input
              type="text"
              placeholder="Buscar por nombre o SKU…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[#1a1a2e] border border-white/10 rounded-lg pl-9 pr-3 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-[#e94560]/60 focus:ring-1 focus:ring-[#e94560]/30 transition-colors"
            />
          </div>

          <div className="relative sm:w-44">
            <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className={selectClass}>
              <option value="">Todas las categorías</option>
              {categories.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-gray-500"><IconChevronDown /></div>
          </div>

          <div className="relative sm:w-40">
            <select value={filterBrand} onChange={(e) => setFilterBrand(e.target.value)} className={selectClass}>
              <option value="">Todas las marcas</option>
              {brands.map((b) => <option key={b} value={b}>{b}</option>)}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-gray-500"><IconChevronDown /></div>
          </div>

          {(search || filterCategory || filterBrand) && (
            <button
              onClick={() => { setSearch(""); setFilterCategory(""); setFilterBrand(""); }}
              className="px-3 py-2 rounded-lg border border-white/10 text-gray-400 text-sm hover:text-white hover:border-white/20 transition-colors whitespace-nowrap"
            >
              Limpiar
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className={`bg-[#16213e] border border-white/10 rounded-xl overflow-hidden transition-opacity ${isPending ? "opacity-60" : ""}`}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[800px]">
            <thead>
              <tr className="text-gray-500 text-xs uppercase tracking-wide border-b border-white/5">
                <th className="text-left py-3 px-4 font-medium">Nombre / SKU</th>
                <th className="text-left py-3 px-4 font-medium">Categoría</th>
                <th className="text-left py-3 px-4 font-medium">Marca</th>
                <th className="text-right py-3 px-4 font-medium">Cantidad</th>
                <th className="text-right py-3 px-4 font-medium">Precio venta</th>
                <th className="text-center py-3 px-4 font-medium">Estado</th>
                <th className="py-3 px-4" />
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7}>
                    <EmptyState
                      icon="📦"
                      title={search || filterCategory || filterBrand ? "Sin resultados" : "Sin repuestos en inventario"}
                      description={search || filterCategory || filterBrand ? "Prueba con otros filtros de búsqueda." : "Agrega el primer repuesto para comenzar."}
                      action={
                        !search && !filterCategory && !filterBrand ? (
                          <button
                            onClick={() => setShowModal(true)}
                            className="inline-flex items-center gap-2 bg-[#e94560] hover:bg-[#c73652] text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
                          >
                            <IconPlus /> Nuevo repuesto
                          </button>
                        ) : undefined
                      }
                    />
                  </td>
                </tr>
              ) : (
                filtered.map((item) => {
                  const status = getStockStatus(item);
                  return (
                    <tr
                      key={item.id}
                      className={`hover:bg-white/[0.03] transition-colors ${status !== "ok" ? "bg-yellow-500/[0.03]" : ""}`}
                    >
                      <td className="py-3 px-4">
                        <p className="text-white font-medium">{item.name}</p>
                        <p className="text-gray-500 text-xs mt-0.5">{item.sku}</p>
                      </td>
                      <td className="py-3 px-4 text-gray-300">{item.category ?? <span className="text-gray-600">—</span>}</td>
                      <td className="py-3 px-4 text-gray-300">{item.brand ?? <span className="text-gray-600">—</span>}</td>
                      <td className="py-3 px-4 text-right">
                        <StockAdjuster item={item} onAdjusted={handleStockAdjusted} />
                      </td>
                      <td className="py-3 px-4 text-right text-white">
                        ${item.sell_price.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <StockBadge item={item} />
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setEditTarget(item)}
                            className="text-gray-600 hover:text-blue-400 transition-colors"
                            aria-label={`Editar ${item.name}`}
                          >
                            <IconPencil />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(item)}
                            className="text-gray-600 hover:text-red-400 transition-colors"
                            aria-label={`Eliminar ${item.name}`}
                          >
                            <IconX />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {filtered.length > 0 && (
          <div className="px-4 py-3 border-t border-white/5 text-gray-500 text-xs">
            Mostrando {filtered.length} de {items.length} repuestos
          </div>
        )}
      </div>

      {showModal && <AddItemModal onClose={() => setShowModal(false)} onAdd={handleAdded} />}

      {editTarget && (
        <EditItemModal
          item={editTarget}
          onClose={() => setEditTarget(null)}
          onSaved={handleEditSaved}
        />
      )}

      {deleteTarget && (
        <ConfirmDialog
          title="Eliminar repuesto"
          message={`¿Seguro que deseas eliminar "${deleteTarget.name}"? Esta acción no se puede deshacer.`}
          confirmLabel="Eliminar"
          danger
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
