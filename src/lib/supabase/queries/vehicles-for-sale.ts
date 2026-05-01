import { createClient } from "@/lib/supabase/server";
import type { VehicleSaleStatus } from "@/types/database";

export interface VehiclePhoto {
  id: string;
  url: string;
  order: number;
}

export interface VehicleForSale {
  id: string;
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
  status: VehicleSaleStatus;
  created_at: string;
  photos: VehiclePhoto[];
}

export async function getVehiclesForSale(): Promise<VehicleForSale[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("vehicles_for_sale")
    .select(`*, photos:vehicle_photos(id, url, order)`)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((v) => ({
    ...v,
    photos: (v.photos ?? []).sort((a: VehiclePhoto, b: VehiclePhoto) => a.order - b.order),
  }));
}
