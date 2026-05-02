import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import VehiculoVentaDetalleClient from "./VehiculoVentaDetalleClient";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("vehicles_for_sale")
    .select("brand, model, year")
    .eq("id", id)
    .maybeSingle();
  if (!data) return { title: "Vehículo — TallerPro" };
  return { title: `${data.brand} ${data.model} ${data.year} — TallerPro` };
}

export default async function VehiculoVentaDetallePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: vehicle } = await supabase
    .from("vehicles_for_sale")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!vehicle) notFound();

  const { data: photosRaw } = await supabase
    .from("vehicle_photos")
    .select("id, url, order")
    .eq("vehicle_sale_id", id)
    .order("order");

  const photos = (photosRaw ?? []).map((p) => ({
    id: p.id as string,
    url: p.url as string,
    order: p.order as number,
  }));

  const features: string[] = Array.isArray(vehicle.features)
    ? vehicle.features
    : typeof vehicle.features === "string" && vehicle.features
    ? (vehicle.features as string).split(",").map((s: string) => s.trim())
    : [];

  return (
    <VehiculoVentaDetalleClient
      vehicle={{
        id: vehicle.id,
        brand: vehicle.brand,
        model: vehicle.model,
        year: vehicle.year,
        price: vehicle.price,
        mileage: vehicle.mileage ?? null,
        color: vehicle.color ?? null,
        transmission: vehicle.transmission ?? null,
        fuel_type: vehicle.fuel_type ?? null,
        description: vehicle.description ?? null,
        features,
        status: vehicle.status,
        created_at: vehicle.created_at,
      }}
      photos={photos}
    />
  );
}
