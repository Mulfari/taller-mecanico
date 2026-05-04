import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import ReposicionClient from "./ReposicionClient";

export const metadata = { title: "Reposición de stock — TallerPro" };

export default async function ReposicionPage() {
  const supabase = await createClient();

  const { data: items } = await supabase
    .from("inventory")
    .select("id, name, sku, category, brand, quantity, min_stock, cost_price, sell_price, location, supplier")
    .or("quantity.lt.min_stock,quantity.eq.0")
    .order("supplier", { ascending: true, nullsFirst: false })
    .order("quantity", { ascending: true });

  const { data: shopConfig } = await supabase
    .from("shop_config")
    .select("name")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  return (
    <div className="space-y-4">
      <nav className="flex items-center gap-2 text-sm text-gray-500">
        <Link href="/dashboard/inventario" className="hover:text-white transition-colors">
          Inventario
        </Link>
        <span>/</span>
        <span className="text-white">Reposición de stock</span>
      </nav>

      <ReposicionClient
        items={(items ?? []) as Array<{
          id: string;
          name: string;
          sku: string;
          category: string | null;
          brand: string | null;
          quantity: number;
          min_stock: number;
          cost_price: number | null;
          sell_price: number;
          location: string | null;
          supplier: string | null;
        }>}
        shopName={shopConfig?.name ?? "TallerPro"}
      />
    </div>
  );
}
