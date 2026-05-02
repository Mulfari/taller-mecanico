"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function updateVehicle(
  vehicleId: string,
  data: {
    brand: string;
    model: string;
    year: number;
    plate: string;
    color: string;
    vin: string;
    mileage: number;
    notes: string;
  }
) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("vehicles")
    .update({
      brand: data.brand,
      model: data.model,
      year: data.year,
      plate: data.plate || null,
      color: data.color || null,
      vin: data.vin || null,
      mileage: data.mileage || 0,
      notes: data.notes || null,
    })
    .eq("id", vehicleId);

  if (error) throw new Error(error.message);
  revalidatePath(`/dashboard/vehiculos/${vehicleId}`);
  revalidatePath("/dashboard/vehiculos");
}
