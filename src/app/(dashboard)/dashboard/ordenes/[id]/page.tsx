import { notFound } from "next/navigation";
import { getWorkOrderById } from "@/lib/supabase/queries/work-orders";
import { createClient } from "@/lib/supabase/server";
import OrdenDetalleClient from "./OrdenDetalleClient";

export const metadata = { title: "Orden de Trabajo — TallerPro" };

export default async function OrdenDetallePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [order, supabase] = await Promise.all([getWorkOrderById(id), createClient()]);
  if (!order) notFound();

  const [{ data: mechanicRows }, { data: inventoryRows }] = await Promise.all([
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
  ]);

  const mechanics = (mechanicRows ?? []) as { id: string; full_name: string | null }[];
  const inventoryItems = (inventoryRows ?? []) as {
    id: string;
    name: string;
    sku: string | null;
    sell_price: number | null;
    quantity: number;
  }[];

  return <OrdenDetalleClient order={order} mechanics={mechanics} inventoryItems={inventoryItems} />;
}
