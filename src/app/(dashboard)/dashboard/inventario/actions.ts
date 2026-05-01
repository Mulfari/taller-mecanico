"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function createInventoryItem(formData: {
  name: string;
  sku: string;
  category: string;
  brand: string;
  quantity: number;
  min_stock: number;
  cost_price: number | null;
  sell_price: number;
  location: string;
  supplier: string;
}) {
  const supabase = await createClient();
  const { error } = await supabase.from("inventory").insert({
    name: formData.name,
    sku: formData.sku.toUpperCase(),
    category: formData.category || null,
    brand: formData.brand || null,
    quantity: formData.quantity,
    min_stock: formData.min_stock,
    cost_price: formData.cost_price,
    sell_price: formData.sell_price,
    location: formData.location || null,
    supplier: formData.supplier || null,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/inventario");
}

export async function deleteInventoryItem(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("inventory").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/inventario");
}
