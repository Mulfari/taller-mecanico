import { createClient } from "@/lib/supabase/server";
import VehiculosClient from "./VehiculosClient";

export const metadata = { title: "Vehículos — TallerPro" };

export default async function VehiculosPage() {
  const supabase = await createClient();

  const { data } = await supabase
    .from("vehicles")
    .select(`
      id, brand, model, year, plate, color, vin, mileage, created_at,
      owner:profiles!vehicles_owner_id_fkey(id, full_name, email, phone)
    `)
    .order("created_at", { ascending: false });

  type VehicleRow = {
    id: string;
    brand: string;
    model: string;
    year: number;
    plate: string | null;
    color: string | null;
    vin: string | null;
    mileage: number | null;
    created_at: string;
    owner: { id: string; full_name: string | null; email: string; phone: string | null } | null;
  };

  const vehicles: VehicleRow[] = (data ?? []).map((v: unknown) => {
    const row = v as {
      id: string; brand: string; model: string; year: number;
      plate: string | null; color: string | null; vin: string | null;
      mileage: number | null; created_at: string;
      owner: { id: string; full_name: string | null; email: string; phone: string | null }[] | null;
    };
    return { ...row, owner: Array.isArray(row.owner) ? (row.owner[0] ?? null) : row.owner };
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Vehículos</h1>
        <p className="text-gray-500 text-sm mt-1">{vehicles.length} vehículos registrados</p>
      </div>
      <VehiculosClient vehicles={vehicles} />
    </div>
  );
}
