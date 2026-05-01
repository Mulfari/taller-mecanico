import { notFound } from "next/navigation";
import { getWorkOrderById } from "@/lib/supabase/queries/work-orders";
import OrdenDetalleClient from "./OrdenDetalleClient";

export const metadata = { title: "Orden de Trabajo — TallerPro" };

export default async function OrdenDetallePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const order = await getWorkOrderById(id);
  if (!order) notFound();
  return <OrdenDetalleClient order={order} />;
}
