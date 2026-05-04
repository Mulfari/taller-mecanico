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

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  const [activeOrders, pendingAppointments, vehiclesForSale, lowStockItems, monthlyDelivered] = await Promise.all([
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
    supabase
      .from("work_orders")
      .select("final_cost, estimated_cost")
      .eq("status", "delivered")
      .gte("delivered_at", monthStart),
  ]);

  const lowStockCount = (lowStockItems.data ?? []).filter(
    (item) => item.quantity <= item.min_stock
  ).length;

  const monthlyRevenue = (monthlyDelivered.data ?? []).reduce(
    (sum, o) => sum + (o.final_cost ?? o.estimated_cost ?? 0),
    0
  );

  return {
    activeOrders: activeOrders.count ?? 0,
    pendingAppointments: pendingAppointments.count ?? 0,
    vehiclesForSale: vehiclesForSale.count ?? 0,
    lowStockItems: lowStockCount,
    monthlyRevenue,
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

export async function getLowStockItems(limit = 8) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("inventory")
    .select("id, name, sku, quantity, min_stock, category")
    .order("name");
  if (error) throw error;
  const low = (data ?? []).filter((item) => item.quantity <= item.min_stock);
  return low.slice(0, limit) as {
    id: string;
    name: string;
    sku: string | null;
    quantity: number;
    min_stock: number;
    category: string | null;
  }[];
}

export async function getReadyOrders(limit = 5): Promise<WorkOrderListItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("work_orders")
    .select(`
      *,
      client:profiles!work_orders_client_id_fkey(id, full_name),
      vehicle:vehicles!work_orders_vehicle_id_fkey(id, brand, model, year, plate),
      mechanic:profiles!work_orders_mechanic_id_fkey(id, full_name)
    `)
    .eq("status", "ready")
    .order("created_at", { ascending: true })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as WorkOrderListItem[];
}

export interface UpcomingDelivery {
  id: string;
  estimated_delivery: string;
  status: string;
  description: string | null;
  client: { id: string; full_name: string | null } | null;
  vehicle: { brand: string; model: string; year: number; plate: string | null } | null;
}

export async function getUpcomingDeliveries(days = 5, limit = 8): Promise<UpcomingDelivery[]> {
  const supabase = await createClient();
  const today = new Date().toISOString().split("T")[0];
  const future = new Date(Date.now() + days * 86400000).toISOString().split("T")[0];

  const { data, error } = await supabase
    .from("work_orders")
    .select(`
      id, estimated_delivery, status, description,
      client:profiles!work_orders_client_id_fkey(id, full_name),
      vehicle:vehicles!work_orders_vehicle_id_fkey(brand, model, year, plate)
    `)
    .not("estimated_delivery", "is", null)
    .gte("estimated_delivery", today)
    .lte("estimated_delivery", future)
    .in("status", ["received", "diagnosing", "repairing", "ready"])
    .order("estimated_delivery", { ascending: true })
    .limit(limit);

  if (error) throw error;
  return (data ?? []) as unknown as UpcomingDelivery[];
}

export interface PendingQuote {
  id: string;
  total: number | null;
  valid_until: string | null;
  created_at: string;
  client: { id: string; full_name: string | null } | null;
  vehicle: { brand: string; model: string; year: number; plate: string | null } | null;
}

export interface OverdueOrder {
  id: string;
  estimated_delivery: string;
  status: string;
  description: string | null;
  days_overdue: number;
  client: { id: string; full_name: string | null } | null;
  vehicle: { brand: string; model: string; year: number; plate: string | null } | null;
  mechanic: { id: string; full_name: string | null } | null;
}

export async function getOverdueOrders(limit = 10): Promise<OverdueOrder[]> {
  const supabase = await createClient();
  const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];

  const { data, error } = await supabase
    .from("work_orders")
    .select(`
      id, estimated_delivery, status, description,
      client:profiles!work_orders_client_id_fkey(id, full_name),
      vehicle:vehicles!work_orders_vehicle_id_fkey(brand, model, year, plate),
      mechanic:profiles!work_orders_mechanic_id_fkey(id, full_name)
    `)
    .not("estimated_delivery", "is", null)
    .lt("estimated_delivery", yesterday)
    .in("status", ["received", "diagnosing", "repairing", "ready"])
    .order("estimated_delivery", { ascending: true })
    .limit(limit);

  if (error) throw error;

  const now = Date.now();
  return ((data ?? []) as unknown as OverdueOrder[]).map((o) => ({
    ...o,
    days_overdue: Math.ceil(
      (now - new Date(o.estimated_delivery + "T00:00:00").getTime()) / 86400000
    ),
  }));
}

export async function getPendingQuotes(limit = 6): Promise<PendingQuote[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("quotes")
    .select(`
      id, total, valid_until, created_at,
      client:profiles!quotes_client_id_fkey(id, full_name),
      vehicle:vehicles!quotes_vehicle_id_fkey(brand, model, year, plate)
    `)
    .eq("status", "sent")
    .order("valid_until", { ascending: true, nullsFirst: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as unknown as PendingQuote[];
}
