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

export async function deleteVehiclePhotoAction(photoId: string) {
  const supabase = await createClient();

  // Fetch first so we can clean up storage and revalidate the right path
  const { data: photo } = await supabase
    .from("vehicle_photos")
    .select("url, vehicle_sale_id")
    .eq("id", photoId)
    .maybeSingle();

  // Remove the file from Supabase Storage (best-effort — don't block on failure)
  if (photo?.url) {
    const match = photo.url.match(/\/storage\/v1\/object\/public\/shop-assets\/(.+)/);
    if (match) {
      await supabase.storage.from("shop-assets").remove([decodeURIComponent(match[1])]);
    }
  }

  const { error } = await supabase.from("vehicle_photos").delete().eq("id", photoId);
  if (error) throw new Error(error.message);

  if (photo?.vehicle_sale_id) {
    revalidatePath(`/dashboard/vehiculos-venta/${photo.vehicle_sale_id}`);
  }
}
