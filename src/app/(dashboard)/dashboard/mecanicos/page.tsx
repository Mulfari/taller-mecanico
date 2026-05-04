import { createClient } from "@/lib/supabase/server";
import type { Metadata } from "next";
import MecanicosClient from "./MecanicosClient";

export const metadata: Metadata = { title: "Mecánicos — TallerPro" };

type WorkOrderStatus = "received" | "diagnosing" | "repairing" | "ready" | "delivered";

interface RawOrder {
  id: string;
  mechanic_id: string | null;
  status: WorkOrderStatus;
  description: string | null;
  received_at: string | null;
  final_cost: number | null;
  estimated_cost: number | null;
  vehicle: { brand: string; model: string; year: number; plate: string | null } | null;
  client: { full_name: string | null; email: string } | null;
}

async function getMechanicsData() {
  const supabase = await createClient();

  const [{ data: profiles }, { data: rawOrders }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, full_name, email, phone")
      .eq("role", "mechanic")
      .order("full_name"),
    supabase
      .from("work_orders")
      .select(
        "id, mechanic_id, status, description, received_at, final_cost, estimated_cost, " +
        "vehicle:vehicles(brand, model, year, plate), " +
        "client:profiles!work_orders_client_id_fkey(full_name, email)"
      )
      .not("mechanic_id", "is", null),
  ]);

  const orders = (rawOrders ?? []) as unknown as RawOrder[];

  return (profiles ?? []).map((p) => {
    const myOrders = orders.filter((o) => o.mechanic_id === p.id);
    const activeOrders = myOrders
      .filter((o) => o.status !== "delivered")
      .map((o) => ({
        id: o.id,
        status: o.status,
        description: o.description,
        received_at: o.received_at,
        vehicle: o.vehicle,
        client: o.client,
      }));
    const delivered = myOrders.filter((o) => o.status === "delivered");
    const revenue = delivered.reduce(
      (sum, o) => sum + ((o.final_cost ?? o.estimated_cost ?? 0) as number),
      0
    );
    return {
      id: p.id,
      full_name: p.full_name,
      email: p.email,
      phone: p.phone,
      activeOrders,
      deliveredCount: delivered.length,
      revenue,
    };
  });
}

export default async function MecanicosPage() {
  const mechanics = await getMechanicsData();
  return <MecanicosClient mechanics={mechanics} />;
}
