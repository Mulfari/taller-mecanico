"use server";

import { revalidatePath } from "next/cache";
import { updateAppointmentStatus } from "@/lib/supabase/queries/appointments";
import type { AppointmentStatus } from "@/types/database";

export async function updateAppointmentStatusAction(
  id: string,
  status: AppointmentStatus
): Promise<void> {
  await updateAppointmentStatus(id, status);
  revalidatePath("/dashboard/citas");
}
