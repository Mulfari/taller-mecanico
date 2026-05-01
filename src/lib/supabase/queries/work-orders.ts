import { createClient } from "@/lib/supabase/server";
import type { WorkOrderListItem, WorkOrderWithRelations, WorkOrderStatus } from "@/types/database";

export async function getWorkOrders(status?: WorkOrderStatus): Promise<WorkOrderListItem[]> {
  const supabase = await createClient();

  let query = supabase
    .from("work_orders")
    .select(`
      *,
      client:profiles!work_orders_client_id_fkey(id, full_name),
      vehicle:vehicles!work_orders_vehicle_id_fkey(id, brand, model, year, plate),
      mechanic:profiles!work_orders_mechanic_id_fkey(id, full_name)
    `)
    .order("created_at", { ascending: false });

  if (status) {
    query = query.eq("status", status);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as WorkOrderListItem[];
}

export async function getWorkOrderById(id: string): Promise<WorkOrderWithRelations | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("work_orders")
    .select(`
      *,
      client:profiles!work_orders_client_id_fkey(id, full_name, email, phone),
      vehicle:vehicles!work_orders_vehicle_id_fkey(id, brand, model, year, plate, color, vin, mileage),
      mechanic:profiles!work_orders_mechanic_id_fkey(id, full_name),
      items:work_order_items(*)
    `)
    .eq("id", id)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null;
    throw error;
  }
  return data as WorkOrderWithRelations;
}

export async function getClients() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, phone, email")
    .eq("role", "client")
    .order("full_name");
  if (error) throw error;
  return data ?? [];
}

export async function getMechanics() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name")
    .eq("role", "mechanic")
    .order("full_name");
  if (error) throw error;
  return data ?? [];
}

export async function getVehiclesByClient(clientId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("vehicles")
    .select("id, brand, model, year, plate")
    .eq("owner_id", clientId)
    .order("brand");
  if (error) throw error;
  return data ?? [];
}

export async function getDashboardMetrics() {
  const supabase = await createClient();

  const [activeOrders, pendingAppointments, vehiclesForSale, lowStockItems] = await Promise.all([
    supabase
      .from("work_orders")
      .select("id", { count: "exact", head: true })
      .in("status", ["received", "diagnosing", "repairing", "ready"]),
    supabase
      .from("appointments")
      .select("id", { count: "exact", head: true })
      .in("status", ["pending", "confirmed"]),
    supabase
      .from("vehicles_for_sale")
      .select("id", { count: "exact", head: true })
      .eq("status", "available"),
    // column-to-column comparison requires fetching rows; count client-side
    supabase
      .from("inventory")
      .select("id, quantity, min_stock"),
  ]);

  const lowStockCount = (lowStockItems.data ?? []).filter(
    (item) => item.quantity <= item.min_stock
  ).length;

  return {
    activeOrders: activeOrders.count ?? 0,
    pendingAppointments: pendingAppointments.count ?? 0,
    vehiclesForSale: vehiclesForSale.count ?? 0,
    lowStockItems: lowStockCount,
  };
}

export async function getRecentOrders(limit = 5): Promise<WorkOrderListItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("work_orders")
    .select(`
      *,
      client:profiles!work_orders_client_id_fkey(id, full_name),
      vehicle:vehicles!work_orders_vehicle_id_fkey(id, brand, model, year, plate),
      mechanic:profiles!work_orders_mechanic_id_fkey(id, full_name)
    `)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as WorkOrderListItem[];
}

export async function getUpcomingAppointments(limit = 5) {
  const supabase = await createClient();
  const today = new Date().toISOString().split("T")[0];
  const { data, error } = await supabase
    .from("appointments")
    .select(`
      *,
      client:profiles!appointments_client_id_fkey(id, full_name),
      vehicle:vehicles!appointments_vehicle_id_fkey(id, brand, model, year)
    `)
    .gte("date", today)
    .in("status", ["pending", "confirmed"])
    .order("date")
    .order("time_slot")
    .limit(limit);
  if (error) throw error;
  return data ?? [];
}
