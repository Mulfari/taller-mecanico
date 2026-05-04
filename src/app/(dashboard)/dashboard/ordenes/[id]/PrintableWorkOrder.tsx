"use client";

import type { WorkOrderStatus, WorkOrderItemType } from "@/types/database";

interface PrintableItem {
  id: string;
  type: WorkOrderItemType;
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
}

interface PrintableWorkOrderProps {
  order: {
    id: string;
    status: WorkOrderStatus;
    description: string | null;
    diagnosis: string | null;
    estimated_cost: number | null;
    final_cost: number | null;
    received_at: string;
    estimated_delivery: string | null;
    delivered_at: string | null;
    items: PrintableItem[];
    client: { full_name: string | null; email: string; phone: string | null };
    vehicle: { brand: string; model: string; year: number; plate: string | null; color: string | null; vin: string | null; mileage: number | null };
    mechanic: { full_name: string | null } | null;
  };
  shopConfig: {
    name: string;
    phone: string | null;
    address: string | null;
  } | null;
}

const STATUS_LABELS: Record<WorkOrderStatus, string> = {
  received: "Recibido",
  diagnosing: "En diagnóstico",
  repairing: "En reparación",
  ready: "Listo para retirar",
  delivered: "Entregado",
};

const fmt = (n: number) =>
  `$${n.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const fmtDate = (d: string) =>
  new Date(d.includes("T") ? d : d + "T00:00:00").toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

export default function PrintableWorkOrder({ order, shopConfig }: PrintableWorkOrderProps) {
  const laborItems = order.items.filter((i) => i.type === "labor");
  const partItems = order.items.filter((i) => i.type === "part");
  const subtotalLabor = laborItems.reduce((s, i) => s + i.total, 0);
  const subtotalParts = partItems.reduce((s, i) => s + i.total, 0);
  const subtotal = subtotalLabor + subtotalParts;
  const finalCost = order.final_cost ?? order.estimated_cost;
  const orderNumber = `OT-${order.id.slice(0, 8).toUpperCase()}`;
  const shopName = shopConfig?.name ?? "TallerPro";

  return (
    <div className="hidden print:block print:break-before-avoid" id="printable-work-order">
      {/* Print-only styles */}
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #printable-work-order, #printable-work-order * { visibility: visible !important; }
          #printable-work-order {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 0;
            margin: 0;
            font-family: system-ui, -apple-system, sans-serif;
            color: #111;
            font-size: 11pt;
            line-height: 1.4;
          }
          @page { margin: 1.5cm; }
        }
      `}</style>

      {/* Header */}
      <div className="flex items-start justify-between border-b-2 border-gray-900 pb-4 mb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{shopName}</h1>
          {shopConfig?.address && (
            <p className="text-gray-600 text-sm mt-0.5">{shopConfig.address}</p>
          )}
          {shopConfig?.phone && (
            <p className="text-gray-600 text-sm">Tel: {shopConfig.phone}</p>
          )}
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-gray-900 tracking-tight">ORDEN DE TRABAJO</p>
          <p className="text-gray-700 font-mono text-lg mt-0.5">{orderNumber}</p>
          <p className="text-gray-500 text-xs mt-1">
            Estado: <span className="font-semibold text-gray-700">{STATUS_LABELS[order.status]}</span>
          </p>
        </div>
      </div>

      {/* Dates row */}
      <div className="grid grid-cols-3 gap-4 mb-5 text-sm">
        <div>
          <p className="text-gray-500 text-xs uppercase font-medium">Fecha de recepción</p>
          <p className="text-gray-900 font-medium">{fmtDate(order.received_at)}</p>
        </div>
        {order.estimated_delivery && (
          <div>
            <p className="text-gray-500 text-xs uppercase font-medium">Entrega estimada</p>
            <p className="text-gray-900 font-medium">{fmtDate(order.estimated_delivery)}</p>
          </div>
        )}
        {order.delivered_at && (
          <div>
            <p className="text-gray-500 text-xs uppercase font-medium">Fecha de entrega</p>
            <p className="text-gray-900 font-medium">{fmtDate(order.delivered_at)}</p>
          </div>
        )}
      </div>

      {/* Client + Vehicle info */}
      <div className="grid grid-cols-2 gap-6 mb-5 border border-gray-300 rounded-lg p-4">
        <div>
          <p className="text-gray-500 text-xs uppercase font-medium tracking-wide mb-2">Cliente</p>
          <p className="text-gray-900 font-semibold">{order.client.full_name ?? "—"}</p>
          {order.client.phone && <p className="text-gray-600 text-sm">Tel: {order.client.phone}</p>}
          {order.client.email && <p className="text-gray-600 text-sm">{order.client.email}</p>}
        </div>
        <div>
          <p className="text-gray-500 text-xs uppercase font-medium tracking-wide mb-2">Vehículo</p>
          <p className="text-gray-900 font-semibold">
            {order.vehicle.brand} {order.vehicle.model} {order.vehicle.year}
          </p>
          {order.vehicle.plate && (
            <p className="text-gray-600 text-sm font-mono">Placa: {order.vehicle.plate}</p>
          )}
          {order.vehicle.color && (
            <p className="text-gray-600 text-sm">Color: {order.vehicle.color}</p>
          )}
          {order.vehicle.mileage != null && (
            <p className="text-gray-600 text-sm">Km: {order.vehicle.mileage.toLocaleString("es-MX")}</p>
          )}
          {order.vehicle.vin && (
            <p className="text-gray-500 text-xs font-mono">VIN: {order.vehicle.vin}</p>
          )}
        </div>
      </div>

      {/* Mechanic */}
      {order.mechanic?.full_name && (
        <div className="mb-4 text-sm">
          <span className="text-gray-500">Técnico asignado: </span>
          <span className="text-gray-900 font-medium">{order.mechanic.full_name}</span>
        </div>
      )}

      {/* Description & Diagnosis */}
      {(order.description || order.diagnosis) && (
        <div className="mb-5 border border-gray-200 rounded-lg p-4 space-y-3">
          {order.description && (
            <div>
              <p className="text-gray-500 text-xs uppercase font-medium mb-1">Descripción del trabajo</p>
              <p className="text-gray-800 text-sm">{order.description}</p>
            </div>
          )}
          {order.diagnosis && (
            <div>
              <p className="text-gray-500 text-xs uppercase font-medium mb-1">Diagnóstico</p>
              <p className="text-gray-800 text-sm">{order.diagnosis}</p>
            </div>
          )}
        </div>
      )}

      {/* Line items */}
      {order.items.length > 0 && (
        <div className="mb-5">
          {laborItems.length > 0 && (
            <div className="mb-4">
              <p className="text-gray-500 text-xs uppercase font-medium tracking-wide mb-2">
                Mano de obra
              </p>
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b border-gray-300">
                    <th className="text-left py-1.5 font-medium text-gray-600">Descripción</th>
                    <th className="text-right py-1.5 font-medium text-gray-600 w-16">Cant.</th>
                    <th className="text-right py-1.5 font-medium text-gray-600 w-24">P. Unit.</th>
                    <th className="text-right py-1.5 font-medium text-gray-600 w-24">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {laborItems.map((item) => (
                    <tr key={item.id} className="border-b border-gray-100">
                      <td className="py-1.5 text-gray-800">{item.description}</td>
                      <td className="py-1.5 text-right text-gray-600">{item.quantity}</td>
                      <td className="py-1.5 text-right text-gray-600">{fmt(item.unit_price)}</td>
                      <td className="py-1.5 text-right text-gray-900 font-medium">{fmt(item.total)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t border-gray-300">
                    <td colSpan={3} className="py-1.5 text-right text-gray-600 text-xs uppercase">Subtotal mano de obra</td>
                    <td className="py-1.5 text-right text-gray-900 font-medium">{fmt(subtotalLabor)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}

          {partItems.length > 0 && (
            <div className="mb-4">
              <p className="text-gray-500 text-xs uppercase font-medium tracking-wide mb-2">
                Repuestos y materiales
              </p>
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b border-gray-300">
                    <th className="text-left py-1.5 font-medium text-gray-600">Descripción</th>
                    <th className="text-right py-1.5 font-medium text-gray-600 w-16">Cant.</th>
                    <th className="text-right py-1.5 font-medium text-gray-600 w-24">P. Unit.</th>
                    <th className="text-right py-1.5 font-medium text-gray-600 w-24">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {partItems.map((item) => (
                    <tr key={item.id} className="border-b border-gray-100">
                      <td className="py-1.5 text-gray-800">{item.description}</td>
                      <td className="py-1.5 text-right text-gray-600">{item.quantity}</td>
                      <td className="py-1.5 text-right text-gray-600">{fmt(item.unit_price)}</td>
                      <td className="py-1.5 text-right text-gray-900 font-medium">{fmt(item.total)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t border-gray-300">
                    <td colSpan={3} className="py-1.5 text-right text-gray-600 text-xs uppercase">Subtotal repuestos</td>
                    <td className="py-1.5 text-right text-gray-900 font-medium">{fmt(subtotalParts)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}

          {/* Grand total */}
          <div className="flex justify-end border-t-2 border-gray-900 pt-3">
            <div className="w-72 space-y-1">
              {laborItems.length > 0 && partItems.length > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="text-gray-800">{fmt(subtotal)}</span>
                </div>
              )}
              {finalCost != null && finalCost !== subtotal && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">
                    {order.final_cost != null ? "Costo final" : "Costo estimado"}
                  </span>
                  <span className="text-gray-800">{fmt(finalCost)}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-bold border-t border-gray-300 pt-1">
                <span className="text-gray-900">TOTAL</span>
                <span className="text-gray-900">{fmt(finalCost ?? subtotal)}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* No items — show cost if available */}
      {order.items.length === 0 && finalCost != null && finalCost > 0 && (
        <div className="mb-5 border border-gray-200 rounded-lg p-4">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">
              {order.final_cost != null ? "Costo final" : "Costo estimado"}
            </span>
            <span className="text-gray-900 font-bold text-lg">{fmt(finalCost)}</span>
          </div>
        </div>
      )}

      {/* Signature lines */}
      <div className="mt-12 grid grid-cols-2 gap-12">
        <div>
          <div className="border-b border-gray-400 mb-2 h-10" />
          <p className="text-gray-600 text-xs text-center">Firma del cliente</p>
          <p className="text-gray-400 text-xs text-center mt-0.5">
            {order.client.full_name ?? ""}
          </p>
        </div>
        <div>
          <div className="border-b border-gray-400 mb-2 h-10" />
          <p className="text-gray-600 text-xs text-center">Firma del taller</p>
          <p className="text-gray-400 text-xs text-center mt-0.5">
            {order.mechanic?.full_name ?? shopName}
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-8 pt-3 border-t border-gray-200 text-center">
        <p className="text-gray-400 text-xs">
          Documento generado el {new Date().toLocaleDateString("es-MX", { day: "2-digit", month: "long", year: "numeric" })} — {shopName}
        </p>
      </div>
    </div>
  );
}
