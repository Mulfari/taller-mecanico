import { createClient } from "@/lib/supabase/server";
import RecibirMercaderiaClient from "./RecibirMercaderiaClient";

export const metadata = { title: "Recibir Mercadería — TallerPro" };

export default async function RecibirMercaderiaPage() {
  const supabase = await createClient();

  const { data: inventoryRows } = await supabase
    .from("inventory")
    .select("id, name, sku, category, brand, quantity, min_stock, supplier, location")
    .order("name");

  const inventory = (inventoryRows ?? []) as {
    id: string;
    name: string;
    sku: string;
    category: string | null;
    brand: string | null;
    quantity: number;
    min_stock: number;
    supplier: string | null;
    location: string | null;
  }[];

  return <RecibirMercaderiaClient inventory={inventory} />;
}
