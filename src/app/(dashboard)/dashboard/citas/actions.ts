"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
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

export async function updateAppointmentAction(
  id: string,
  data: {
    date: string;
    time_slot: string;
    service_type: string;
    notes: string | null;
  }
): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("appointments")
    .update({
      date: data.date,
      time_slot: data.time_slot,
      service_type: data.service_type,
      notes: data.notes || null,
    })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/citas");
}

export async function createWorkOrderFromAppointmentAction(appointmentId: string): Promise<string> {
  const supabase = await createClient();

  // Load appointment with client and vehicle
  const { data: appt, error: apptError } = await supabase
    .from("appointments")
    .select("id, client_id, vehicle_id, service_type, notes")
    .eq("id", appointmentId)
    .single();

  if (apptError || !appt) throw new Error("Cita no encontrada");

  // Create the work order
  const { data: order, error: orderError } = await supabase
    .from("work_orders")
    .insert({
      client_id: appt.client_id,
      vehicle_id: appt.vehicle_id,
      status: "received",
      description: appt.service_type + (appt.notes ? `\n\nNotas: ${appt.notes}` : ""),
    })
    .select("id")
    .single();

  if (orderError || !order) throw new Error(orderError?.message ?? "Error al crear la orden");

  // Mark appointment as completed
  await supabase
    .from("appointments")
    .update({ status: "completed" as AppointmentStatus })
    .eq("id", appointmentId);

  revalidatePath("/dashboard/citas");
  revalidatePath("/dashboard/ordenes");
  revalidatePath("/dashboard");

  redirect(`/dashboard/ordenes/${order.id}`);
}
