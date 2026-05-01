import { getVehiclesForSale } from "@/lib/supabase/queries/vehicles-for-sale";
import VehiculosVentaClient from "./VehiculosVentaClient";

export const metadata = { title: "Vehículos en Venta — TallerPro" };

export default async function VehiculosVentaPage() {
  const vehicles = await getVehiclesForSale();
  return <VehiculosVentaClient initialVehicles={vehicles} />;
}
