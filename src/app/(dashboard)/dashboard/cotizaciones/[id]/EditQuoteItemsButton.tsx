"use client";

import { useState, useTransition } from "react";
import { updateQuoteItems } from "../actions";

// ── Types ──────────────────────────────────────────────────────────────────

interface QuoteItem {
  type: "labor" | "part";
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
}

// ── Icons ──────────────────────────────────────────────────────────────────

function IconPencil() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
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
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
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

function IconSpinner() {
  return (
    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
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

// ── Helpers ────────────────────────────────────────────────────────────────

const inputClass =
  "w-full bg-[#1a1a2e] border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-[#e94560]/60 focus:ring-1 focus:ring-[#e94560]/30 transition-colors";

const selectClass =
  "w-full bg-[#1a1a2e] border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#e94560]/60 focus:ring-1 focus:ring-[#e94560]/30 transition-colors appearance-none";

const fmt = (n: number) =>
  `$${n.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

function emptyItem(): QuoteItem {
  return { type: "labor", description: "", quantity: 1, unit_price: 0, total: 0 };
}

// ── Item row ───────────────────────────────────────────────────────────────

function ItemRow({
  item,
  index,
  onChange,
  onRemove,
}: {
  item: QuoteItem;
  index: number;
  onChange: (i: number, patch: Partial<QuoteItem>) => void;
  onRemove: (i: number) => void;
}) {
  function update(patch: Partial<QuoteItem>) {
    const next = { ...item, ...patch };
    next.total = parseFloat((next.quantity * next.unit_price).toFixed(2));
    onChange(index, next);
  }

  return (
    <div className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-2 items-center">
      {/* Type */}
      <div className="relative col-span-1 min-w-0">
        <select
          className={selectClass}
          value={item.type}
          onChange={(e) => update({ type: e.target.value as "labor" | "part" })}
          aria-label="Tipo"
        >
          <option value="labor">Mano de obra</option>
          <option value="part">Repuesto</option>
        </select>
        <span className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-gray-500">
          <IconChevronDown />
        </span>
      </div>

      {/* Description — spans full row below on mobile, inline on md+ */}
      <div className="col-span-5 md:col-span-1 md:col-start-auto">
        <input
          type="text"
          className={inputClass}
          placeholder="Descripción…"
          value={item.description}
          onChange={(e) => update({ description: e.target.value })}
          aria-label="Descripción"
        />
      </div>

      {/* Quantity */}
      <input
        type="number"
        min={1}
        step={1}
        className={`${inputClass} w-20 text-center`}
        value={item.quantity}
        onChange={(e) => update({ quantity: Math.max(1, parseInt(e.target.value) || 1) })}
        aria-label="Cantidad"
      />

      {/* Unit price */}
      <input
        type="number"
        min={0}
        step={0.01}
        className={`${inputClass} w-28 text-right`}
        value={item.unit_price}
        onChange={(e) => update({ unit_price: parseFloat(e.target.value) || 0 })}
        aria-label="Precio unitario"
      />

      {/* Total (read-only) */}
      <span className="text-gray-300 text-sm font-medium w-24 text-right tabular-nums">
        {fmt(item.total)}
      </span>

      {/* Remove */}
      <button
        type="button"
        onClick={() => onRemove(index)}
        className="text-gray-600 hover:text-red-400 transition-colors p-1 rounded"
        aria-label="Eliminar ítem"
      >
        <IconTrash />
      </button>
    </div>
  );
}

// ── Modal ──────────────────────────────────────────────────────────────────

function EditModal({
  quoteId,
  initialItems,
  onClose,
}: {
  quoteId: string;
  initialItems: QuoteItem[];
  onClose: () => void;
}) {
  const [items, setItems] = useState<QuoteItem[]>(
    initialItems.length > 0 ? initialItems : [emptyItem()]
  );
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const total = items.reduce((sum, i) => sum + i.total, 0);

  function handleChange(index: number, patch: Partial<QuoteItem>) {
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  }

  function handleRemove(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  function handleAdd(type: "labor" | "part") {
    setItems((prev) => [...prev, { ...emptyItem(), type }]);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (items.some((i) => !i.description.trim())) {
      setError("Todos los ítems deben tener una descripción.");
      return;
    }
    setError(null);
    startTransition(async () => {
      try {
        await updateQuoteItems(quoteId, items, parseFloat(total.toFixed(2)));
        onClose();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error al guardar los cambios.");
      }
    });
  }

  const laborItems = items.filter((i) => i.type === "labor");
  const partItems = items.filter((i) => i.type === "part");

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 overflow-y-auto">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[#16213e] border border-white/10 rounded-2xl w-full max-w-3xl shadow-2xl my-8">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <h2 className="text-white font-semibold text-lg">Editar ítems de cotización</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-white transition-colors"
            aria-label="Cerrar"
          >
            <IconX />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-6">
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Column headers */}
          <div className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-2 text-xs text-gray-500 uppercase tracking-wide font-medium px-0">
            <span>Tipo</span>
            <span className="hidden md:block">Descripción</span>
            <span className="w-20 text-center">Cant.</span>
            <span className="w-28 text-right">P. Unit.</span>
            <span className="w-24 text-right">Total</span>
            <span className="w-8" />
          </div>

          {/* Labor items */}
          {laborItems.length > 0 && (
            <div className="space-y-3">
              <p className="text-gray-500 text-xs font-medium uppercase tracking-wide">Mano de obra</p>
              {items.map((item, i) =>
                item.type === "labor" ? (
                  <ItemRow key={i} item={item} index={i} onChange={handleChange} onRemove={handleRemove} />
                ) : null
              )}
            </div>
          )}

          {/* Part items */}
          {partItems.length > 0 && (
            <div className="space-y-3">
              <p className="text-gray-500 text-xs font-medium uppercase tracking-wide">Repuestos y materiales</p>
              {items.map((item, i) =>
                item.type === "part" ? (
                  <ItemRow key={i} item={item} index={i} onChange={handleChange} onRemove={handleRemove} />
                ) : null
              )}
            </div>
          )}

          {items.length === 0 && (
            <p className="text-gray-600 text-sm text-center py-4">
              Sin ítems. Agrega mano de obra o repuestos.
            </p>
          )}

          {/* Add buttons */}
          <div className="flex flex-wrap gap-2 pt-1">
            <button
              type="button"
              onClick={() => handleAdd("labor")}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:border-white/20 text-sm transition-colors"
            >
              <IconPlus /> Agregar mano de obra
            </button>
            <button
              type="button"
              onClick={() => handleAdd("part")}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:border-white/20 text-sm transition-colors"
            >
              <IconPlus /> Agregar repuesto
            </button>
          </div>

          {/* Total */}
          <div className="flex justify-end border-t border-white/10 pt-4">
            <div className="flex items-center gap-4">
              <span className="text-gray-400 text-sm font-medium">Total cotización</span>
              <span className="text-[#e94560] text-2xl font-bold tabular-nums">{fmt(total)}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-lg border border-white/10 text-gray-400 text-sm hover:text-white hover:border-white/20 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="flex-1 inline-flex items-center justify-center gap-2 bg-[#e94560] hover:bg-[#c73652] disabled:opacity-60 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors"
            >
              {isPending ? (
                <><IconSpinner /> Guardando…</>
              ) : (
                "Guardar cambios"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Export ─────────────────────────────────────────────────────────────────

export default function EditQuoteItemsButton({
  quoteId,
  items,
  disabled = false,
}: {
  quoteId: string;
  items: { type: "labor" | "part"; description: string; quantity: number; unit_price: number; total: number }[];
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        disabled={disabled}
        className="inline-flex items-center gap-2 bg-white/5 border border-white/10 hover:border-white/20 hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed text-gray-300 hover:text-white text-sm font-medium px-3 py-2 rounded-lg transition-colors"
        title={disabled ? "No se pueden editar ítems en este estado" : "Editar ítems"}
      >
        <IconPencil />
        Editar ítems
      </button>

      {open && (
        <EditModal
          quoteId={quoteId}
          initialItems={items as QuoteItem[]}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}
