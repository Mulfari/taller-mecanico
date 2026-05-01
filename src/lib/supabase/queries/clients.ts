import { createClient } from "@/lib/supabase/server";

export interface ClientWithStats {
  id: string;
  full_name: string | null;
  email: string;
  phone: string | null;
  created_at: string;
  vehicle_count: number;
  last_visit: string | null;
}

export async function getClientsWithStats(): Promise<ClientWithStats[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("profiles")
    .select(`
      id, full_name, email, phone, created_at,
      vehicles:vehicles!vehicles_owner_id_fkey(id),
      work_orders:work_orders!work_orders_client_id_fkey(received_at)
    `)
    .eq("role", "client")
    .order("full_name");

  if (error) throw error;

  return (data ?? []).map((p) => {
    const orders = (p.work_orders as { received_at: string }[]);
    const lastVisit = orders.length
      ? orders.map((o) => o.received_at).sort().at(-1) ?? null
      : null;
    return {
      id: p.id,
      full_name: p.full_name,
      email: p.email,
      phone: p.phone,
      created_at: p.created_at,
      vehicle_count: (p.vehicles as { id: string }[]).length,
      last_visit: lastVisit,
    };
  });
}
