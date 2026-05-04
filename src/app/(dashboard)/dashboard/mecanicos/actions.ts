"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function createMechanic(data: {
  email: string;
  full_name: string;
  phone: string;
}) {
  const supabase = await createClient();

  // Check if a profile with this email already exists
  const { data: existing } = await supabase
    .from("profiles")
    .select("id, role")
    .eq("email", data.email.trim().toLowerCase())
    .maybeSingle();

  if (existing) {
    if (existing.role === "mechanic") {
      throw new Error("Ya existe un mecánico con este correo electrónico.");
    }
    // Upgrade existing profile to mechanic
    const { error } = await supabase
      .from("profiles")
      .update({ role: "mechanic" as const })
      .eq("id", existing.id);
    if (error) throw new Error(error.message);
  } else {
    // Create new profile with mechanic role
    const { error } = await supabase.from("profiles").insert({
      email: data.email.trim().toLowerCase(),
      full_name: data.full_name.trim() || null,
      phone: data.phone.trim() || null,
      role: "mechanic" as const,
    });
    if (error) throw new Error(error.message);
  }

  revalidatePath("/dashboard/mecanicos");
}

export async function updateMechanic(
  mechanicId: string,
  data: { full_name: string; phone: string }
) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: data.full_name.trim() || null,
      phone: data.phone.trim() || null,
    })
    .eq("id", mechanicId);

  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/mecanicos");
  revalidatePath(`/dashboard/mecanicos/${mechanicId}`);
}

export async function deactivateMechanic(mechanicId: string) {
  const supabase = await createClient();

  // Check for active orders before deactivating
  const { count } = await supabase
    .from("work_orders")
    .select("id", { count: "exact", head: true })
    .eq("mechanic_id", mechanicId)
    .neq("status", "delivered");

  if (count && count > 0) {
    throw new Error(
      `Este mecánico tiene ${count} orden(es) activa(s). Reasígnalas antes de desactivarlo.`
    );
  }

  // Change role to client (effectively deactivating mechanic access)
  const { error } = await supabase
    .from("profiles")
    .update({ role: "client" as const })
    .eq("id", mechanicId);

  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/mecanicos");
}
