import { getInventory } from "@/lib/supabase/queries/inventory";
import InventarioClient from "./InventarioClient";

export default async function InventarioPage() {
  const items = await getInventory();
  return <InventarioClient initialItems={items} />;
}
