import { getAppointments } from "@/lib/supabase/queries/appointments";
import { createClient } from "@/lib/supabase/server";
import CitasClient from "./CitasClient";

export const metadata = { title: "Citas — TallerPro" };

export default async function CitasPage() {
  const supabase = await createClient();

  const [appointments, { data: clientRows }, { data: vehicleRows }] = await Promise.all([
    getAppointments(),
    supabase
      .from("profiles")
      .select("id, full_name, email, phone")
      .eq("role", "client")
      .order("full_name"),
    supabase
      .from("vehicles")
      .select("id, owner_id, brand, model, year, plate")
      .order("brand"),
  ]);

  const clients = (clientRows ?? []) as {
    id: string;
    full_name: string | null;
    email: string;
    phone: string | null;
  }[];

  const vehicles = (vehicleRows ?? []) as {
    id: string;
    owner_id: string;
    brand: string;
    model: string;
    year: number;
    plate: string | null;
  }[];

  return <CitasClient appointments={appointments} clients={clients} vehicles={vehicles} />;
}
