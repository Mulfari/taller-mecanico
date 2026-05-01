import { getClientsWithStats } from "@/lib/supabase/queries/clients";
import ClientesClient from "./ClientesClient";

export const metadata = { title: "Clientes — TallerPro" };

export default async function ClientesPage() {
  const clients = await getClientsWithStats();
  return <ClientesClient clients={clients} />;
}
