import { createClient } from "@/lib/supabase/server";
import type { AppointmentStatus } from "@/types/database";

export interface AppointmentWithRelations {
  id: string;
  client_id: string;
  vehicle_id: string | null;
  date: string;
  time_slot: string;
  service_type: string;
  status: AppointmentStatus;
  notes: string | null;
  created_at: string;
  client: { id: string; full_name: string | null; phone: string | null } | null;
  vehicle: { id: string; brand: string; model: string; year: number; plate: string | null } | null;
}

export async function getAppointments(): Promise<AppointmentWithRelations[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("appointments")
    .select(`
      *,
      client:profiles!appointments_client_id_fkey(id, full_name, phone),
      vehicle:vehicles!appointments_vehicle_id_fkey(id, brand, model, year, plate)
    `)
    .order("date", { ascending: true })
    .order("time_slot", { ascending: true });
  if (error) throw error;
  return (data ?? []) as AppointmentWithRelations[];
}

export async function updateAppointmentStatus(
  id: string,
  status: AppointmentStatus
): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("appointments")
    .update({ status })
    .eq("id", id);
  if (error) throw error;
}
