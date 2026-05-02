"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { createInvoiceAction, type InvoiceItemInput } from "./actions";

interface ClientOption {
  id: string;
  full_name: string | null;
  email: string;
}

interface WorkOrderOption {
  id: string;
  description: string | null;
  client_id: string | null;
}

interface Props {
  clients: ClientOption[];
  workOrders: WorkOrderOption[];
  onClose: () => void;
}

const inputClass =
  "w-full bg-[#1a1a2e] border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-[#e94560]/60 focus:ring-1 focus:ring-[#e94560]/30 transition-colors";
const selectClass =
  "w-full bg-[#1a1a2e] border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#e94560]/60 focus:ring-1 focus:ring-[#e94560]/30 transition-colors appearance-none";

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

function IconTrash() {
  return (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
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

const fmt = (n: number) =>
  `$${n.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const EMPTY_ITEM = (): InvoiceItemInput => ({
  type: "labor",
  description: "",
  quantity: 1,
  unit_price: 0,
  total: 0,
});

export default function NuevaFacturaModal({ clients, workOrders, onClose }: Props) {
  const router = useRouter();
  const [clientId, setClientId] = useState("");
  const [workOrderId, setWorkOrderId] = useState("");
  const [taxRate, setTaxRate] = useState(0);
  const [items, setItems] = useState<InvoiceItemInput[]>([EMPTY_ITEM()]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clientWorkOrders = useMemo(
    () => workOrders.filter((o) => !clientId || o.client_id === clientId),
    [workOrders, clientId]
  );

  function handleClientChange(id: string) {
    setClientId(id);
    setWorkOrderId("");
  }

  function updateItem(index: number, patch: Partial<InvoiceItemInput>) {
    setItems((prev) =>
      prev.map((item, i) => {
        if (i !== index) return item;
        const updated = { ...item, ...patch };
        updated.total = Math.round(updated.quantity * updated.unit_price * 100) / 100;
        return updated;
      })
    );
  }

  function removeItem(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  function addItem() {
    setItems((prev) => [...prev, EMPTY_ITEM()]);
  }

  const subtotal = items.reduce((s, i) => s + i.total, 0);
  const tax = Math.round(subtotal * (taxRate / 100) * 100) / 100;
  const total = subtotal + tax;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!clientId) { setError("Seleccioná un cliente."); return; }
    if (items.length === 0) { setError("Agregá al menos un ítem."); return; }
    const hasEmpty = items.some((i) => !i.description.trim());
    if (hasEmpty) { setError("Completá la descripción de todos los ítems."); return; }

    setSaving(true);
    setError(null);
    try {
      const id = await createInvoiceAction({
        client_id: clientId,
        work_order_id: workOrderId || null,
        items,
        tax_rate: taxRate,
      });
      router.push(`/dashboard/facturas/${id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al crear la factura.");
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 overflow-y-auto">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[#16213e] border border-white/10 rounded-2xl w-full max-w-2xl shadow-2xl my-8">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <h2 className="text-white font-semibold text-lg">Nueva factura</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors" aria-label="Cerrar">
            <IconX />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Cliente */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                Cliente <span className="text-[#e94560]">*</span>
              </label>
              <div className="relative">
                <select
                  className={selectClass}
                  value={clientId}
                  onChange={(e) => handleClientChange(e.target.value)}
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
            </div>

            {/* Orden de trabajo */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Orden de trabajo</label>
              <div className="relative">
                <select
                  className={`${selectClass} disabled:opacity-40 disabled:cursor-not-allowed`}
                  value={workOrderId}
                  onChange={(e) => setWorkOrderId(e.target.value)}
                  disabled={!clientId}
                >
                  <option value="">{clientId ? "Sin orden vinculada" : "Primero seleccioná un cliente"}</option>
                  {clientWorkOrders.map((o) => (
                    <option key={o.id} value={o.id}>
                      #{o.id.slice(0, 8).toUpperCase()}{o.description ? ` — ${o.description.slice(0, 40)}` : ""}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-gray-500">
                  <IconChevronDown />
                </div>
              </div>
            </div>
          </div>

          {/* Items */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-300">
                Ítems <span className="text-[#e94560]">*</span>
              </label>
              <button
                type="button"
                onClick={addItem}
                className="inline-flex items-center gap-1 text-xs text-[#e94560] hover:text-[#c73652] transition-colors"
              >
                <IconPlus /> Agregar ítem
              </button>
            </div>

            <div className="space-y-2">
              {/* Column headers */}
              <div className="grid grid-cols-[80px_1fr_60px_100px_32px] gap-2 text-xs text-gray-600 font-medium px-1">
                <span>Tipo</span>
                <span>Descripción</span>
                <span className="text-right">Cant.</span>
                <span className="text-right">P. Unit.</span>
                <span />
              </div>

              {items.map((item, i) => (
                <div key={i} className="grid grid-cols-[80px_1fr_60px_100px_32px] gap-2 items-center">
                  {/* Type */}
                  <div className="relative">
                    <select
                      className={`${selectClass} text-xs py-2`}
                      value={item.type}
                      onChange={(e) => updateItem(i, { type: e.target.value as "labor" | "part" })}
                    >
                      <option value="labor">Mano obra</option>
                      <option value="part">Repuesto</option>
                    </select>
                  </div>

                  {/* Description */}
                  <input
                    type="text"
                    className={`${inputClass} py-2 text-xs`}
                    placeholder="Descripción…"
                    value={item.description}
                    onChange={(e) => updateItem(i, { description: e.target.value })}
                    required
                  />

                  {/* Quantity */}
                  <input
                    type="number"
                    min="1"
                    step="1"
                    className={`${inputClass} py-2 text-xs text-right`}
                    value={item.quantity}
                    onChange={(e) => updateItem(i, { quantity: Math.max(1, parseInt(e.target.value) || 1) })}
                  />

                  {/* Unit price */}
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className={`${inputClass} py-2 text-xs text-right`}
                    placeholder="0.00"
                    value={item.unit_price || ""}
                    onChange={(e) => updateItem(i, { unit_price: parseFloat(e.target.value) || 0 })}
                  />

                  {/* Remove */}
                  <button
                    type="button"
                    onClick={() => removeItem(i)}
                    disabled={items.length === 1}
                    className="flex items-center justify-center text-gray-600 hover:text-red-400 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    aria-label="Eliminar ítem"
                  >
                    <IconTrash />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Tax + totals */}
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 pt-2 border-t border-white/5">
            <div className="w-40">
              <label className="block text-sm font-medium text-gray-300 mb-1.5">IVA (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                step="1"
                className={`${inputClass} py-2`}
                value={taxRate}
                onChange={(e) => setTaxRate(Math.min(100, Math.max(0, parseFloat(e.target.value) || 0)))}
              />
            </div>

            <div className="space-y-1 text-sm text-right">
              <div className="flex justify-between gap-8">
                <span className="text-gray-500">Subtotal</span>
                <span className="text-gray-300">{fmt(subtotal)}</span>
              </div>
              {taxRate > 0 && (
                <div className="flex justify-between gap-8">
                  <span className="text-gray-500">IVA ({taxRate}%)</span>
                  <span className="text-gray-300">{fmt(tax)}</span>
                </div>
              )}
              <div className="flex justify-between gap-8 font-bold border-t border-white/10 pt-1">
                <span className="text-white">Total</span>
                <span className="text-[#e94560]">{fmt(total)}</span>
              </div>
            </div>
          </div>

          {/* Actions */}
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
              {saving ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                  </svg>
                  Creando…
                </>
              ) : "Crear factura"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
