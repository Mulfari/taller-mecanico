import { notFound } from "next/navigation";
import { getWorkOrderById } from "@/lib/supabase/queries/work-orders";
import { createClient } from "@/lib/supabase/server";
import OrdenDetalleClient from "./OrdenDetalleClient";

export const metadata = { title: "Orden de Trabajo — TallerPro" };

export default async function OrdenDetallePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [order, supabase] = await Promise.all([getWorkOrderById(id), createClient()]);
  if (!order) notFound();

  const { data: mechanicRows } = await supabase
    .from("profiles")
    .select("id, full_name")
    .eq("role", "mechanic")
    .order("full_name");

  const mechanics = (mechanicRows ?? []) as { id: string; full_name: string | null }[];

  return <OrdenDetalleClient order={order} mechanics={mechanics} />;
}
