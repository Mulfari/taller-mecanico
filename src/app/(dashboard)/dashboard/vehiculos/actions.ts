"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function addVehicleAction(
  clientId: string,
  data: { brand: string; model: string; year: number; plate: string; color: string; vin: string; mileage: number }
) {
  const supabase = await createClient();
  const { error } = await supabase.from("vehicles").insert({
    owner_id: clientId,
    brand: data.brand,
    model: data.model,
    year: data.year,
    plate: data.plate || null,
    color: data.color || null,
    vin: data.vin || null,
    mileage: data.mileage || 0,
  });

  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/vehiculos");
  revalidatePath(`/dashboard/clientes/${clientId}`);
}
