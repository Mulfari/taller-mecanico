import { createClient } from "@/lib/supabase/server";
import type { QuoteStatus } from "@/types/database";

export interface QuoteListItem {
  id: string;
  client_id: string;
  client_name: string | null;
  vehicle_id: string | null;
  vehicle_label: string;
  items: QuoteItemRow[];
  total: number;
  status: QuoteStatus;
  valid_until: string | null;
  created_at: string;
}

export interface QuoteItemRow {
  id: string;
  type: "labor" | "part";
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
}

export interface ClientOption {
  id: string;
  full_name: string | null;
  email: string;
}

export interface VehicleOption {
  id: string;
  owner_id: string;
  brand: string;
  model: string;
  year: number;
  plate: string | null;
}

export interface InventoryOption {
  id: string;
  name: string;
  sku: string;
  sell_price: number;
}

export async function getQuotes(): Promise<QuoteListItem[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("quotes")
    .select(`
      id, client_id, vehicle_id, items, total, status, valid_until, created_at,
      client:profiles!quotes_client_id_fkey(full_name),
      vehicle:vehicles!quotes_vehicle_id_fkey(brand, model, year, plate)
    `)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return (data ?? []).map((q) => {
    const client = q.client as unknown as { full_name: string | null } | null;
    const vehicle = q.vehicle as unknown as { brand: string; model: string; year: number; plate: string | null } | null;
    const vehicleLabel = vehicle
      ? `${vehicle.brand} ${vehicle.model} ${vehicle.year}${vehicle.plate ? ` · ${vehicle.plate}` : ""}`
      : "—";

    return {
      id: q.id,
      client_id: q.client_id,
      client_name: client?.full_name ?? null,
      vehicle_id: q.vehicle_id,
      vehicle_label: vehicleLabel,
      items: (q.items as QuoteItemRow[]) ?? [],
      total: Number(q.total),
      status: q.status as QuoteStatus,
      valid_until: q.valid_until,
      created_at: q.created_at,
    };
  });
}

export async function getQuoteFormData(): Promise<{
  clients: ClientOption[];
  vehicles: VehicleOption[];
  inventory: InventoryOption[];
}> {
  const supabase = await createClient();

  const [clientsRes, vehiclesRes, inventoryRes] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, full_name, email")
      .eq("role", "client")
      .order("full_name"),
    supabase
      .from("vehicles")
      .select("id, owner_id, brand, model, year, plate")
      .order("brand"),
    supabase
      .from("inventory")
      .select("id, name, sku, sell_price")
      .gt("quantity", 0)
      .order("name"),
  ]);

  if (clientsRes.error) throw clientsRes.error;
  if (vehiclesRes.error) throw vehiclesRes.error;
  if (inventoryRes.error) throw inventoryRes.error;

  return {
    clients: (clientsRes.data ?? []) as ClientOption[],
    vehicles: (vehiclesRes.data ?? []) as VehicleOption[],
    inventory: (inventoryRes.data ?? []) as InventoryOption[],
  };
}

export async function createQuote(payload: {
  client_id: string;
  vehicle_id: string;
  items: QuoteItemRow[];
  total: number;
  valid_until: string | null;
}): Promise<string> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("quotes")
    .insert({
      client_id: payload.client_id,
      vehicle_id: payload.vehicle_id,
      items: payload.items,
      total: payload.total,
      status: "draft",
      valid_until: payload.valid_until || null,
    })
    .select("id")
    .single();

  if (error) throw error;
  return data.id;
}

export async function updateQuoteStatus(id: string, status: QuoteStatus): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("quotes").update({ status }).eq("id", id);
  if (error) throw error;
}
