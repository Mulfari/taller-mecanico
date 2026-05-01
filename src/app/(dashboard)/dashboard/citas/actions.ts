"use server";

import { revalidatePath } from "next/cache";
import { updateAppointmentStatus } from "@/lib/supabase/queries/appointments";
import { createClient } from "@/lib/supabase/server";
import type { AppointmentStatus } from "@/types/database";

export async function updateAppointmentStatusAction(
  id: string,
  status: AppointmentStatus
): Promise<void> {
  await updateAppointmentStatus(id, status);
  revalidatePath("/dashboard/citas");
}

export async function createAppointmentAction(data: {
  client_id: string;
  vehicle_id: string | null;
  date: string;
  time_slot: string;
  service_type: string;
  notes: string | null;
}): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("appointments").insert({
    client_id: data.client_id,
    vehicle_id: data.vehicle_id || null,
    date: data.date,
    time_slot: data.time_slot,
    service_type: data.service_type,
    status: "confirmed" as AppointmentStatus,
    notes: data.notes || null,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/citas");
}
