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
  compatible_brands: string[];
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
    compatible_brands: formData.compatible_brands.length > 0 ? formData.compatible_brands : null,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/inventario");
}

export async function updateInventoryItem(
  id: string,
  formData: {
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
    compatible_brands: string[];
  }
) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("inventory")
    .update({
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
      compatible_brands: formData.compatible_brands.length > 0 ? formData.compatible_brands : null,
    })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/inventario");
}

export async function deleteInventoryItem(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("inventory").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/inventario");
}

export async function adjustStock(id: string, delta: number) {
  const supabase = await createClient();
  const { data, error: fetchError } = await supabase
    .from("inventory")
    .select("quantity")
    .eq("id", id)
    .single();
  if (fetchError) throw new Error(fetchError.message);
  const newQty = Math.max(0, (data.quantity ?? 0) + delta);
  const { error } = await supabase
    .from("inventory")
    .update({ quantity: newQty })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/inventario");
  return newQty;
}
