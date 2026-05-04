"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { receiveBulkStock } from "../actions";

// ── Types ──────────────────────────────────────────────────────────────────

interface InventoryItem {
  id: string;
  name: string;
  sku: string;
  category: string | null;
  brand: string | null;
  quantity: number;
  min_stock: number;
  supplier: string | null;
  location: string | null;
}

interface ReceiveLineItem {
  inventoryId: string;
  quantity: number;
}

// ── Icons ──────────────────────────────────────────────────────────────────

function IconSearch() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
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

function IconTrash() {
  return (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  );
}

function IconCheck() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
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

function IconBox() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
    </svg>
  );
}

function IconArrowLeft() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
    </svg>
  );
}

function IconAlertTriangle() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
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
  "w-full bg-[#1a1a2e] border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-[#e94560]/60 focus:ring-1 focus:ring-[#e94560]/30 transition-colors";
const selectClass =
  "w-full bg-[#1a1a2e] border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#e94560]/60 focus:ring-1 focus:ring-[#e94560]/30 transition-colors appearance-none";

function getUniqueSuppliers(items: InventoryItem[]): string[] {
  const set = new Set<string>();
  for (const item of items) {
    if (item.supplier) set.add(item.supplier);
  }
  return Array.from(set).sort();
}

// ── Main Component ────────────────────────────────────────────────────────

export default function RecibirMercaderiaClient({
  inventory,
}: {
  inventory: InventoryItem[];
}) {
  const [search, setSearch] = useState("");
  const [supplierFilter, setSupplierFilter] = useState("");
  const [onlyLowStock, setOnlyLowStock] = useState(false);
  const [lineItems, setLineItems] = useState<ReceiveLineItem[]>([]);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<{ updated: number } | null>(null);

  const suppliers = useMemo(() => getUniqueSuppliers(inventory), [inventory]);

  const addedIds = useMemo(
    () => new Set(lineItems.map((li) => li.inventoryId)),
    [lineItems]
  );

  const filteredInventory = useMemo(() => {
    const q = search.trim().toLowerCase();
    return inventory.filter((item) => {
      if (addedIds.has(item.id)) return false;
      if (supplierFilter && item.supplier !== supplierFilter) return false;
      if (onlyLowStock && item.quantity >= item.min_stock) return false;
      if (!q) return true;
      return (
        item.name.toLowerCase().includes(q) ||
        item.sku.toLowerCase().includes(q) ||
        (item.brand?.toLowerCase().includes(q) ?? false) ||
        (item.category?.toLowerCase().includes(q) ?? false)
      );
    });
  }, [inventory, search, supplierFilter, onlyLowStock, addedIds]);

  function addItem(id: string) {
    setLineItems((prev) => [...prev, { inventoryId: id, quantity: 1 }]);
    setResult(null);
  }

  function removeItem(id: string) {
    setLineItems((prev) => prev.filter((li) => li.inventoryId !== id));
  }

  function updateQuantity(id: string, qty: number) {
    setLineItems((prev) =>
      prev.map((li) =>
        li.inventoryId === id ? { ...li, quantity: Math.max(1, qty) } : li
      )
    );
  }

  function addAllLowStock() {
    const lowStockItems = inventory.filter(
      (item) => item.quantity < item.min_stock && !addedIds.has(item.id)
    );
    const newItems: ReceiveLineItem[] = lowStockItems.map((item) => ({
      inventoryId: item.id,
      quantity: item.min_stock - item.quantity,
    }));
    setLineItems((prev) => [...prev, ...newItems]);
    setResult(null);
  }

  function clearAll() {
    setLineItems([]);
    setResult(null);
  }

  async function handleSubmit() {
    if (lineItems.length === 0) return;
    setSaving(true);
    setResult(null);
    try {
      const updated = await receiveBulkStock(
        lineItems.map((li) => ({ id: li.inventoryId, quantity: li.quantity }))
      );
      setResult({ updated });
      setLineItems([]);
    } catch {
      setResult({ updated: -1 });
    } finally {
      setSaving(false);
    }
  }

  const totalUnits = lineItems.reduce((sum, li) => sum + li.quantity, 0);
  const lowStockCount = inventory.filter(
    (item) => item.quantity < item.min_stock
  ).length;

  function getItem(id: string): InventoryItem | undefined {
    return inventory.find((i) => i.id === id);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link
          href="/dashboard/inventario"
          className="inline-flex items-center gap-1.5 text-gray-500 hover:text-white text-sm transition-colors mb-4"
        >
          <IconArrowLeft /> Inventario
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#e94560]/10 border border-[#e94560]/20 flex items-center justify-center text-[#e94560]">
                <IconBox />
              </div>
              Recibir Mercadería
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              Registrá la entrada de repuestos al inventario cuando llega un
              pedido del proveedor.
            </p>
          </div>
          {lowStockCount > 0 && (
            <button
              onClick={addAllLowStock}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-orange-500/30 text-orange-400 text-sm font-medium hover:bg-orange-500/10 transition-colors whitespace-nowrap"
            >
              <IconAlertTriangle />
              Agregar {lowStockCount} con stock bajo
            </button>
          )}
        </div>
      </div>

      {/* Success / error banner */}
      {result && (
        <div
          className={`rounded-xl px-5 py-4 flex items-center gap-3 ${
            result.updated >= 0
              ? "bg-green-500/10 border border-green-500/30"
              : "bg-red-500/10 border border-red-500/30"
          }`}
        >
          {result.updated >= 0 ? (
            <>
              <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center text-green-400 shrink-0">
                <IconCheck />
              </div>
              <div>
                <p className="text-green-300 font-medium text-sm">
                  Stock actualizado correctamente
                </p>
                <p className="text-green-400/70 text-xs mt-0.5">
                  Se actualizaron {result.updated} artículo
                  {result.updated !== 1 ? "s" : ""} en el inventario.
                </p>
              </div>
            </>
          ) : (
            <>
              <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center text-red-400 shrink-0">
                <IconX />
              </div>
              <p className="text-red-300 font-medium text-sm">
                Error al actualizar el stock. Intentá de nuevo.
              </p>
            </>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_420px] gap-6">
        {/* Left: search & add items */}
        <div className="space-y-4">
          <div className="bg-[#16213e] border border-white/10 rounded-xl p-5 space-y-4">
            <h2 className="text-white font-semibold text-sm">
              Buscar repuestos para agregar
            </h2>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <span className="absolute inset-y-0 left-3 flex items-center text-gray-500 pointer-events-none">
                  <IconSearch />
                </span>
                <input
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar por nombre, SKU, marca…"
                  className="w-full bg-[#1a1a2e] border border-white/10 rounded-lg pl-9 pr-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#e94560]/60 focus:ring-1 focus:ring-[#e94560]/30 transition-colors"
                />
              </div>
              <div className="relative w-full sm:w-48">
                <select
                  className={selectClass}
                  value={supplierFilter}
                  onChange={(e) => setSupplierFilter(e.target.value)}
                >
                  <option value="">Todos los proveedores</option>
                  {suppliers.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-gray-500">
                  <IconChevronDown />
                </div>
              </div>
              <label className="inline-flex items-center gap-2 text-sm text-gray-400 whitespace-nowrap cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={onlyLowStock}
                  onChange={(e) => setOnlyLowStock(e.target.checked)}
                  className="w-4 h-4 rounded border-white/20 bg-[#1a1a2e] text-[#e94560] focus:ring-[#e94560]/30"
                />
                Solo stock bajo
              </label>
            </div>

            {/* Results table */}
            {filteredInventory.length === 0 ? (
              <p className="text-gray-600 text-sm py-6 text-center">
                {search || supplierFilter || onlyLowStock
                  ? "Sin resultados con los filtros actuales."
                  : "Todos los artículos ya fueron agregados."}
              </p>
            ) : (
              <div className="overflow-x-auto -mx-1 max-h-[420px] overflow-y-auto">
                <table className="w-full text-sm min-w-[500px]">
                  <thead className="sticky top-0 bg-[#16213e] z-10">
                    <tr className="text-gray-500 text-xs uppercase tracking-wide border-b border-white/5">
                      <th className="text-left pb-3 px-1 font-medium">
                        Repuesto
                      </th>
                      <th className="text-left pb-3 px-1 font-medium">
                        Proveedor
                      </th>
                      <th className="text-right pb-3 px-1 font-medium">
                        Stock
                      </th>
                      <th className="text-right pb-3 px-1 font-medium w-20">
                        Acción
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {filteredInventory.map((item) => {
                      const isLow = item.quantity < item.min_stock;
                      return (
                        <tr
                          key={item.id}
                          className="hover:bg-white/[0.03] transition-colors group"
                        >
                          <td className="py-2.5 px-1">
                            <p className="text-white text-sm font-medium truncate max-w-[220px]">
                              {item.name}
                            </p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-gray-500 text-xs font-mono">
                                {item.sku}
                              </span>
                              {item.category && (
                                <span className="text-gray-600 text-xs">
                                  · {item.category}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-2.5 px-1">
                            <span className="text-gray-400 text-xs">
                              {item.supplier ?? (
                                <span className="text-gray-600">—</span>
                              )}
                            </span>
                          </td>
                          <td className="py-2.5 px-1 text-right">
                            <span
                              className={`text-sm font-medium tabular-nums ${
                                item.quantity === 0
                                  ? "text-red-400"
                                  : isLow
                                  ? "text-orange-400"
                                  : "text-gray-300"
                              }`}
                            >
                              {item.quantity}
                            </span>
                            <span className="text-gray-600 text-xs ml-1">
                              / {item.min_stock}
                            </span>
                          </td>
                          <td className="py-2.5 px-1 text-right">
                            <button
                              onClick={() => addItem(item.id)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#e94560]/10 text-[#e94560] text-xs font-medium hover:bg-[#e94560]/20 transition-colors"
                            >
                              <IconPlus /> Agregar
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            <p className="text-gray-600 text-xs text-right">
              {filteredInventory.length} artículo
              {filteredInventory.length !== 1 ? "s" : ""} disponible
              {filteredInventory.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>

        {/* Right: receive list */}
        <div className="space-y-4">
          <div className="bg-[#16213e] border border-white/10 rounded-xl p-5 space-y-4 sticky top-6">
            <div className="flex items-center justify-between">
              <h2 className="text-white font-semibold text-sm">
                Recepción
                {lineItems.length > 0 && (
                  <span className="ml-2 text-xs bg-[#e94560]/20 text-[#e94560] px-2 py-0.5 rounded-full font-medium">
                    {lineItems.length} artículo
                    {lineItems.length !== 1 ? "s" : ""}
                  </span>
                )}
              </h2>
              {lineItems.length > 0 && (
                <button
                  onClick={clearAll}
                  className="text-xs text-gray-500 hover:text-red-400 transition-colors"
                >
                  Limpiar todo
                </button>
              )}
            </div>

            {lineItems.length === 0 ? (
              <div className="py-10 text-center">
                <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-3 text-gray-600">
                  <IconBox />
                </div>
                <p className="text-gray-500 text-sm">
                  Agregá repuestos desde la lista para registrar la entrada.
                </p>
              </div>
            ) : (
              <>
                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                  {lineItems.map((li) => {
                    const item = getItem(li.inventoryId);
                    if (!item) return null;
                    const isLow = item.quantity < item.min_stock;
                    const deficit = item.min_stock - item.quantity;
                    return (
                      <div
                        key={li.inventoryId}
                        className="flex items-center gap-3 bg-[#1a1a2e] rounded-lg px-3 py-2.5 border border-white/5"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-sm font-medium truncate">
                            {item.name}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-gray-500 text-xs font-mono">
                              {item.sku}
                            </span>
                            {isLow && (
                              <span className="text-orange-400 text-xs">
                                Faltan {deficit}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <label className="sr-only" htmlFor={`qty-${li.inventoryId}`}>
                            Cantidad a recibir
                          </label>
                          <input
                            id={`qty-${li.inventoryId}`}
                            type="number"
                            min="1"
                            value={li.quantity}
                            onChange={(e) =>
                              updateQuantity(
                                li.inventoryId,
                                parseInt(e.target.value) || 1
                              )
                            }
                            className="w-20 bg-[#16213e] border border-white/10 rounded-lg px-2.5 py-1.5 text-white text-sm text-center font-medium tabular-nums focus:outline-none focus:border-[#e94560]/60 focus:ring-1 focus:ring-[#e94560]/30 transition-colors"
                          />
                          <button
                            onClick={() => removeItem(li.inventoryId)}
                            className="p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                            aria-label={`Quitar ${item.name}`}
                          >
                            <IconTrash />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Summary */}
                <div className="border-t border-white/10 pt-3 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Total artículos</span>
                    <span className="text-white font-medium">
                      {lineItems.length}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Total unidades</span>
                    <span className="text-white font-bold tabular-nums">
                      {totalUnits}
                    </span>
                  </div>
                </div>

                {/* Submit */}
                <button
                  onClick={handleSubmit}
                  disabled={saving || lineItems.length === 0}
                  className="w-full inline-flex items-center justify-center gap-2 bg-[#e94560] hover:bg-[#c73652] disabled:opacity-60 text-white text-sm font-semibold px-4 py-3 rounded-xl transition-colors"
                >
                  {saving ? (
                    <>
                      <IconSpinner /> Actualizando stock…
                    </>
                  ) : (
                    <>
                      <IconCheck /> Confirmar recepción ({totalUnits} uds.)
                    </>
                  )}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
