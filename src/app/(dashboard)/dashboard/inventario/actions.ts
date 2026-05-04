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

export async function receiveBulkStock(
  items: Array<{ id: string; quantity: number }>
): Promise<number> {
  const supabase = await createClient();
  let updated = 0;

  for (const item of items) {
    if (item.quantity <= 0) continue;
    const { data, error: fetchError } = await supabase
      .from("inventory")
      .select("quantity")
      .eq("id", item.id)
      .single();
    if (fetchError || !data) continue;

    const newQty = (data.quantity ?? 0) + item.quantity;
    const { error } = await supabase
      .from("inventory")
      .update({ quantity: newQty })
      .eq("id", item.id);
    if (!error) updated++;
  }

  revalidatePath("/dashboard/inventario");
  revalidatePath("/dashboard/inventario/recibir");
  return updated;
}

export async function bulkUpsertInventoryItems(
  rows: Array<{
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
  }>
): Promise<{ inserted: number; updated: number }> {
  const supabase = await createClient();

  const skus = rows.map((r) => r.sku.toUpperCase());
  const { data: existing } = await supabase
    .from("inventory")
    .select("id, sku")
    .in("sku", skus);

  const existingSkuMap = new Map((existing ?? []).map((e) => [e.sku, e.id]));

  const toInsert = rows.filter((r) => !existingSkuMap.has(r.sku.toUpperCase()));
  const toUpdate = rows.filter((r) => existingSkuMap.has(r.sku.toUpperCase()));

  if (toInsert.length > 0) {
    const { error } = await supabase.from("inventory").insert(
      toInsert.map((r) => ({
        name: r.name,
        sku: r.sku.toUpperCase(),
        category: r.category || null,
        brand: r.brand || null,
        quantity: r.quantity,
        min_stock: r.min_stock,
        cost_price: r.cost_price,
        sell_price: r.sell_price,
        location: r.location || null,
        supplier: r.supplier || null,
        compatible_brands: r.compatible_brands.length > 0 ? r.compatible_brands : null,
      }))
    );
    if (error) throw new Error(error.message);
  }

  for (const r of toUpdate) {
    const id = existingSkuMap.get(r.sku.toUpperCase())!;
    const { error } = await supabase
      .from("inventory")
      .update({
        name: r.name,
        category: r.category || null,
        brand: r.brand || null,
        quantity: r.quantity,
        min_stock: r.min_stock,
        cost_price: r.cost_price,
        sell_price: r.sell_price,
        location: r.location || null,
        supplier: r.supplier || null,
        compatible_brands: r.compatible_brands.length > 0 ? r.compatible_brands : null,
      })
      .eq("id", id);
    if (error) throw new Error(error.message);
  }

  revalidatePath("/dashboard/inventario");
  return { inserted: toInsert.length, updated: toUpdate.length };
}
