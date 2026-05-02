"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

type SaleStatus = "available" | "reserved" | "sold";

export async function updateVehicleSaleStatusAction(id: string, status: SaleStatus) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("vehicles_for_sale")
    .update({ status })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath(`/dashboard/vehiculos-venta/${id}`);
  revalidatePath("/dashboard/vehiculos-venta");
}

export async function updateVehicleSaleAction(
  id: string,
  data: {
    brand: string;
    model: string;
    year: number;
    price: number;
    mileage: number | null;
    color: string | null;
    transmission: string | null;
    fuel_type: string | null;
    description: string | null;
    features: string[] | null;
    status: SaleStatus;
  }
) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("vehicles_for_sale")
    .update(data)
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath(`/dashboard/vehiculos-venta/${id}`);
  revalidatePath("/dashboard/vehiculos-venta");
}
