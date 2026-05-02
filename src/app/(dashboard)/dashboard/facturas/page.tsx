import { createClient } from "@/lib/supabase/server";
import FacturasClient from "./FacturasClient";

export const metadata = { title: "Facturas — TallerPro" };

export default async function FacturasPage({
  searchParams,
}: {
  searchParams: Promise<{ client?: string }>;
}) {
  const { client: clientParam } = await searchParams;
  const supabase = await createClient();

  const { data: facturas } = await supabase
    .from("invoices")
    .select(
      `id, client_id, subtotal, tax, total, status, paid_at, created_at,
       work_order_id, quote_id,
       client:profiles!invoices_client_id_fkey(full_name, email),
       work_order:work_orders!invoices_work_order_id_fkey(id, description)`
    )
    .order("created_at", { ascending: false });

  // Supabase returns joined relations as arrays; normalize to single objects
  const normalized = (facturas ?? []).map((f) => ({
    ...f,
    client: Array.isArray(f.client) ? (f.client[0] ?? null) : f.client,
    work_order: Array.isArray(f.work_order) ? (f.work_order[0] ?? null) : f.work_order,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Facturas</h1>
          <p className="text-gray-500 text-sm mt-1">
            {normalized.length} factura{normalized.length !== 1 ? "s" : ""} en total
          </p>
        </div>
      </div>

      <FacturasClient facturas={normalized} initialClientId={clientParam} />
    </div>
  );
}
