import { createClient } from "@/lib/supabase/server";
import type { Inventory } from "@/types/database";

export async function getInventory(): Promise<Inventory[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("inventory")
    .select("*")
    .order("name");
  if (error) throw error;
  return (data ?? []) as Inventory[];
}
