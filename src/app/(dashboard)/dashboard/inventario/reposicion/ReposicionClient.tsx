"use client";

import { useState, useMemo } from "react";
import Link from "next/link";

// ── Types ──────────────────────────────────────────────────────────────────

interface LowStockItem {
  id: string;
  name: string;
  sku: string;
  category: string | null;
  brand: string | null;
  quantity: number;
  min_stock: number;
  cost_price: number | null;
  sell_price: number;
  location: string | null;
  supplier: string | null;
}

interface SupplierGroup {
  supplier: string;
  items: LowStockItem[];
  totalCost: number;
  totalItems: number;
}

// ── Icons ──────────────────────────────────────────────────────────────────

function IconClipboard() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
    </svg>
  );
}

function IconWhatsApp() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
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

function IconAlertTriangle() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
    </svg>
  );
}

function IconPackage() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
    </svg>
  );
}

function IconPrinter() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
    </svg>
  );
}

// ── Helpers ────────────────────────────────────────────────────────────────

function suggestedQty(item: LowStockItem): number {
  const deficit = item.min_stock - item.quantity;
  const buffer = Math.ceil(item.min_stock * 0.5);
  return Math.max(deficit, 0) + buffer;
}

const fmt = (n: number) =>
  `$${n.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

function buildOrderText(group: SupplierGroup, shopName: string): string {
  const date = new Date().toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  let text = `📋 PEDIDO DE REPOSICIÓN\n`;
  text += `De: ${shopName}\n`;
  text += `Para: ${group.supplier}\n`;
  text += `Fecha: ${date}\n`;
  text += `─────────────────────\n\n`;

  group.items.forEach((item, i) => {
    const qty = suggestedQty(item);
    text += `${i + 1}. ${item.name}\n`;
    text += `   SKU: ${item.sku}\n`;
    text += `   Cantidad: ${qty} unidades\n`;
    if (item.cost_price) {
      text += `   Último costo: ${fmt(item.cost_price)}\n`;
    }
    text += `   Stock actual: ${item.quantity} / mín. ${item.min_stock}\n`;
    text += `\n`;
  });

  text += `─────────────────────\n`;
  text += `Total artículos: ${group.items.length}\n`;
  if (group.totalCost > 0) {
    text += `Costo estimado: ${fmt(group.totalCost)}\n`;
  }
  text += `\nPor favor confirmar disponibilidad y tiempo de entrega. Gracias.`;

  return text;
}

// ── SupplierCard ──────────────────────────────────────────────────────────

function SupplierCard({
  group,
  shopName,
}: {
  group: SupplierGroup;
  shopName: string;
}) {
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(true);

  const orderText = useMemo(() => buildOrderText(group, shopName), [group, shopName]);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(orderText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  }

  function handleWhatsApp() {
    const encoded = encodeURIComponent(orderText);
    window.open(`https://wa.me/?text=${encoded}`, "_blank", "noopener");
  }

  function handlePrint() {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    printWindow.document.write(`
      <html>
        <head>
          <title>Pedido - ${group.supplier}</title>
          <style>
            body { font-family: monospace; font-size: 13px; padding: 24px; white-space: pre-wrap; line-height: 1.6; }
          </style>
        </head>
        <body>${orderText.replace(/\n/g, "<br>")}</body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  }

  const outOfStock = group.items.filter((i) => i.quantity === 0).length;

  return (
    <div className="bg-[#16213e] border border-white/10 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-white/5">
        <div className="flex items-start justify-between gap-3">
          <button
            onClick={() => setExpanded((v) => !v)}
            className="flex items-center gap-3 text-left min-w-0"
          >
            <div className="w-10 h-10 rounded-lg bg-[#e94560]/10 border border-[#e94560]/20 flex items-center justify-center text-[#e94560] shrink-0">
              <IconPackage />
            </div>
            <div className="min-w-0">
              <h3 className="text-white font-semibold text-base truncate">
                {group.supplier}
              </h3>
              <p className="text-gray-500 text-xs mt-0.5">
                {group.totalItems} artículo{group.totalItems !== 1 ? "s" : ""}
                {outOfStock > 0 && (
                  <span className="text-red-400 ml-2">
                    · {outOfStock} agotado{outOfStock !== 1 ? "s" : ""}
                  </span>
                )}
                {group.totalCost > 0 && (
                  <span className="text-gray-400 ml-2">
                    · Costo est. {fmt(group.totalCost)}
                  </span>
                )}
              </p>
            </div>
          </button>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={handleCopy}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                copied
                  ? "bg-green-500/20 text-green-300 border border-green-500/30"
                  : "bg-white/5 border border-white/10 text-gray-300 hover:text-white hover:border-white/20"
              }`}
              title="Copiar pedido al portapapeles"
            >
              {copied ? <IconCheck /> : <IconClipboard />}
              {copied ? "Copiado" : "Copiar"}
            </button>
            <button
              onClick={handleWhatsApp}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[#25D366]/10 border border-[#25D366]/20 text-[#25D366] hover:bg-[#25D366]/20 hover:border-[#25D366]/40 transition-colors"
              title="Enviar pedido por WhatsApp"
            >
              <IconWhatsApp />
              WhatsApp
            </button>
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-white/5 border border-white/10 text-gray-300 hover:text-white hover:border-white/20 transition-colors"
              title="Imprimir pedido"
            >
              <IconPrinter />
            </button>
          </div>
        </div>
      </div>

      {/* Items table */}
      {expanded && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[600px]">
            <thead>
              <tr className="text-gray-500 text-xs uppercase tracking-wide border-b border-white/5">
                <th className="text-left py-3 px-5 font-medium">Artículo / SKU</th>
                <th className="text-left py-3 px-4 font-medium">Categoría</th>
                <th className="text-right py-3 px-4 font-medium">Stock actual</th>
                <th className="text-right py-3 px-4 font-medium">Mínimo</th>
                <th className="text-right py-3 px-4 font-medium">Pedir</th>
                <th className="text-right py-3 px-5 font-medium">Costo unit.</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {group.items.map((item) => {
                const isOut = item.quantity === 0;
                const qty = suggestedQty(item);
                return (
                  <tr
                    key={item.id}
                    className={`hover:bg-white/[0.03] transition-colors ${
                      isOut ? "bg-red-500/[0.03]" : ""
                    }`}
                  >
                    <td className="py-3 px-5">
                      <Link
                        href={`/dashboard/inventario/${item.id}`}
                        className="block hover:text-[#e94560] transition-colors"
                      >
                        <p className="text-white font-medium">{item.name}</p>
                        <p className="text-gray-500 text-xs mt-0.5 font-mono">{item.sku}</p>
                      </Link>
                    </td>
                    <td className="py-3 px-4 text-gray-400 text-xs">
                      {item.category ?? <span className="text-gray-600">—</span>}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span
                        className={`font-bold tabular-nums ${
                          isOut ? "text-red-400" : "text-yellow-400"
                        }`}
                      >
                        {item.quantity}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right text-gray-400 tabular-nums">
                      {item.min_stock}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className="inline-flex items-center gap-1 bg-[#e94560]/10 text-[#e94560] font-bold text-xs px-2 py-0.5 rounded-full tabular-nums">
                        +{qty}
                      </span>
                    </td>
                    <td className="py-3 px-5 text-right text-gray-300">
                      {item.cost_price ? fmt(item.cost_price) : <span className="text-gray-600">—</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────

export default function ReposicionClient({
  items,
  shopName,
}: {
  items: LowStockItem[];
  shopName: string;
}) {
  const groups = useMemo(() => {
    const map = new Map<string, LowStockItem[]>();
    const noSupplier: LowStockItem[] = [];

    for (const item of items) {
      if (item.supplier) {
        const existing = map.get(item.supplier) ?? [];
        existing.push(item);
        map.set(item.supplier, existing);
      } else {
        noSupplier.push(item);
      }
    }

    const result: SupplierGroup[] = [];

    for (const [supplier, supplierItems] of map) {
      const totalCost = supplierItems.reduce((sum, i) => {
        return sum + (i.cost_price ?? 0) * suggestedQty(i);
      }, 0);
      result.push({
        supplier,
        items: supplierItems,
        totalCost,
        totalItems: supplierItems.length,
      });
    }

    result.sort((a, b) => a.supplier.localeCompare(b.supplier));

    if (noSupplier.length > 0) {
      const totalCost = noSupplier.reduce((sum, i) => {
        return sum + (i.cost_price ?? 0) * suggestedQty(i);
      }, 0);
      result.push({
        supplier: "Sin proveedor asignado",
        items: noSupplier,
        totalCost,
        totalItems: noSupplier.length,
      });
    }

    return result;
  }, [items]);

  const totalOutOfStock = items.filter((i) => i.quantity === 0).length;
  const totalLowStock = items.filter((i) => i.quantity > 0).length;
  const totalEstimatedCost = groups.reduce((sum, g) => sum + g.totalCost, 0);

  if (items.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Reposición de Stock</h1>
          <p className="text-gray-500 text-sm mt-1">
            Pedidos de reposición agrupados por proveedor
          </p>
        </div>
        <div className="bg-[#16213e] border border-white/10 rounded-xl py-16 text-center">
          <div className="flex justify-center text-green-400 mb-3">
            <IconCheck />
          </div>
          <p className="text-white font-medium">Todo el inventario está en orden</p>
          <p className="text-gray-500 text-sm mt-1">
            No hay artículos por debajo del stock mínimo.
          </p>
          <Link
            href="/dashboard/inventario"
            className="inline-flex items-center gap-2 mt-4 text-[#e94560] hover:text-white text-sm font-medium transition-colors"
          >
            ← Volver al inventario
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Reposición de Stock</h1>
          <p className="text-gray-500 text-sm mt-1">
            Pedidos de reposición agrupados por proveedor
          </p>
        </div>
        <Link
          href="/dashboard/inventario"
          className="inline-flex items-center gap-2 border border-white/10 hover:border-white/20 text-gray-300 hover:text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          ← Inventario
        </Link>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-[#16213e] border border-white/10 rounded-xl px-4 py-3">
          <p className="text-gray-500 text-xs uppercase tracking-wide font-medium mb-1">
            Total artículos
          </p>
          <p className="text-white text-2xl font-bold">{items.length}</p>
          <p className="text-gray-600 text-xs mt-0.5">bajo stock mínimo</p>
        </div>
        <div className="bg-[#16213e] border border-red-500/20 rounded-xl px-4 py-3">
          <p className="text-gray-500 text-xs uppercase tracking-wide font-medium mb-1">
            Agotados
          </p>
          <p className="text-red-400 text-2xl font-bold">{totalOutOfStock}</p>
          <p className="text-gray-600 text-xs mt-0.5">sin stock</p>
        </div>
        <div className="bg-[#16213e] border border-yellow-500/20 rounded-xl px-4 py-3">
          <p className="text-gray-500 text-xs uppercase tracking-wide font-medium mb-1">
            Stock bajo
          </p>
          <p className="text-yellow-400 text-2xl font-bold">{totalLowStock}</p>
          <p className="text-gray-600 text-xs mt-0.5">bajo mínimo</p>
        </div>
        <div className="bg-[#16213e] border border-white/10 rounded-xl px-4 py-3">
          <p className="text-gray-500 text-xs uppercase tracking-wide font-medium mb-1">
            Costo estimado
          </p>
          <p className="text-[#e94560] text-2xl font-bold">
            {totalEstimatedCost > 0 ? fmt(totalEstimatedCost) : "—"}
          </p>
          <p className="text-gray-600 text-xs mt-0.5">
            {groups.length} proveedor{groups.length !== 1 ? "es" : ""}
          </p>
        </div>
      </div>

      {/* Info banner */}
      <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl px-5 py-3 flex items-start gap-3">
        <IconAlertTriangle />
        <div className="text-sm text-gray-400">
          <p>
            Las cantidades sugeridas incluyen el déficit actual más un{" "}
            <span className="text-white font-medium">50% de margen</span> sobre el stock
            mínimo. Podés ajustar las cantidades antes de enviar el pedido.
          </p>
        </div>
      </div>

      {/* Supplier groups */}
      <div className="space-y-4">
        {groups.map((group) => (
          <SupplierCard key={group.supplier} group={group} shopName={shopName} />
        ))}
      </div>
    </div>
  );
}
