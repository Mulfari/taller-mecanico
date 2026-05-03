import { notFound } from "next/navigation";
import { getWorkOrderById } from "@/lib/supabase/queries/work-orders";
import { createClient } from "@/lib/supabase/server";
import OrdenDetalleClient from "./OrdenDetalleClient";

export const metadata = { title: "Orden de Trabajo — TallerPro" };

export default async function OrdenDetallePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [order, supabase] = await Promise.all([getWorkOrderById(id), createClient()]);
  if (!order) notFound();

  const [{ data: mechanicRows }, { data: inventoryRows }, { data: historyRows }, { data: invoiceRow }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, full_name")
      .eq("role", "mechanic")
      .order("full_name"),
    supabase
      .from("inventory")
      .select("id, name, sku, sell_price, quantity")
      .gt("quantity", 0)
      .order("name"),
    supabase
      .from("work_orders")
      .select("id, status, description, diagnosis, estimated_cost, final_cost, received_at, delivered_at")
      .eq("vehicle_id", order.vehicle_id)
      .neq("id", id)
      .order("received_at", { ascending: false })
      .limit(10),
    supabase
      .from("invoices")
      .select("id, status, total, created_at, paid_at")
      .eq("work_order_id", id)
      .maybeSingle(),
  ]);

  const mechanics = (mechanicRows ?? []) as { id: string; full_name: string | null }[];
  const inventoryItems = (inventoryRows ?? []) as {
    id: string;
    name: string;
    sku: string | null;
    sell_price: number | null;
    quantity: number;
  }[];
  const vehicleHistory = (historyRows ?? []) as {
    id: string;
    status: string;
    description: string | null;
    diagnosis: string | null;
    estimated_cost: number | null;
    final_cost: number | null;
    received_at: string;
    delivered_at: string | null;
  }[];

  const linkedInvoice = invoiceRow
    ? (invoiceRow as { id: string; status: string; total: number | null; created_at: string; paid_at: string | null })
    : null;

  return <OrdenDetalleClient order={order} mechanics={mechanics} inventoryItems={inventoryItems} vehicleHistory={vehicleHistory} linkedInvoice={linkedInvoice} />;
}
