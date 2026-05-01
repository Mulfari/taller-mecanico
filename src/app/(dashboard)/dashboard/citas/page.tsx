import { getAppointments } from "@/lib/supabase/queries/appointments";
import CitasClient from "./CitasClient";

export const metadata = { title: "Citas — TallerPro" };

export default async function CitasPage() {
  const appointments = await getAppointments();
  return <CitasClient appointments={appointments} />;
}
