"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { WorkOrderStatus, WorkOrderItemType } from "@/types/database";

export async function createWorkOrder(formData: FormData) {
  const supabase = await createClient();

  const vehicle_id = formData.get("vehicle_id") as string;
  const client_id = formData.get("client_id") as string;
  const mechanic_id = (formData.get("mechanic_id") as string) || null;
  const status = (formData.get("status") as WorkOrderStatus) ?? "received";
  const description = formData.get("description") as string;
  const estimated_cost = formData.get("estimated_cost")
    ? parseFloat(formData.get("estimated_cost") as string)
    : null;
  const estimated_delivery = (formData.get("estimated_delivery") as string) || null;
  const received_at_raw = (formData.get("received_at") as string) || null;
  const itemsJson = formData.get("items") as string | null;

  const { data, error } = await supabase
    .from("work_orders")
    .insert({
      vehicle_id,
      client_id,
      mechanic_id: mechanic_id || null,
      status,
      description,
      estimated_cost,
      estimated_delivery: estimated_delivery
        ? new Date(estimated_delivery).toISOString()
        : null,
      received_at: received_at_raw
        ? new Date(received_at_raw).toISOString()
        : new Date().toISOString(),
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);

  if (itemsJson) {
    const items: {
      type: WorkOrderItemType;
      description: string;
      quantity: number;
      unit_price: number;
      inventory_id?: string;
    }[] = JSON.parse(itemsJson);

    if (items.length > 0) {
      const rows = items.map((i) => ({
        work_order_id: data.id,
        type: i.type,
        description: i.description,
        quantity: i.quantity,
        unit_price: i.unit_price,
        total: i.quantity * i.unit_price,
        inventory_id: i.type === "part" && i.inventory_id ? i.inventory_id : null,
      }));

      const { error: itemsError } = await supabase
        .from("work_order_items")
        .insert(rows);

      if (itemsError) throw new Error(itemsError.message);

      const partItems = items.filter((i) => i.type === "part" && i.inventory_id);
      for (const part of partItems) {
        const { data: inv } = await supabase
          .from("inventory")
          .select("quantity")
          .eq("id", part.inventory_id!)
          .single();

        if (inv) {
          const newQty = Math.max(0, inv.quantity - part.quantity);
          await supabase
            .from("inventory")
            .update({ quantity: newQty })
            .eq("id", part.inventory_id!);
        }
      }
    }
  }

  revalidatePath("/dashboard/ordenes");
  revalidatePath("/dashboard/inventario");
  redirect(`/dashboard/ordenes/${data.id}`);
}

export async function advanceWorkOrderStatus(
  orderId: string,
  nextStatus: WorkOrderStatus,
  finalCost?: number | null
) {
  const supabase = await createClient();

  const updates: Record<string, unknown> = { status: nextStatus };
  if (nextStatus === "delivered") {
    updates.delivered_at = new Date().toISOString();
    if (finalCost != null && finalCost > 0) {
      updates.final_cost = finalCost;
    }
  }

  const { error } = await supabase
    .from("work_orders")
    .update(updates)
    .eq("id", orderId);

  if (error) throw new Error(error.message);

  revalidatePath(`/dashboard/ordenes/${orderId}`);
  revalidatePath("/dashboard/ordenes");
  revalidatePath("/dashboard");
}

export async function addWorkOrderItem(
  orderId: string,
  item: {
    type: WorkOrderItemType;
    description: string;
    quantity: number;
    unit_price: number;
    inventoryItemId?: string;
  }
) {
  const supabase = await createClient();

  const total = item.quantity * item.unit_price;

  const { error } = await supabase.from("work_order_items").insert({
    work_order_id: orderId,
    type: item.type,
    description: item.description,
    quantity: item.quantity,
    unit_price: item.unit_price,
    total,
    inventory_id: item.type === "part" && item.inventoryItemId ? item.inventoryItemId : null,
  });

  if (error) throw new Error(error.message);

  // Decrement inventory stock when a part from inventory is used
  if (item.type === "part" && item.inventoryItemId) {
    const { data: inv } = await supabase
      .from("inventory")
      .select("quantity")
      .eq("id", item.inventoryItemId)
      .single();

    if (inv) {
      const newQty = Math.max(0, inv.quantity - item.quantity);
      await supabase
        .from("inventory")
        .update({ quantity: newQty })
        .eq("id", item.inventoryItemId);
    }
  }

  revalidatePath(`/dashboard/ordenes/${orderId}`);
  revalidatePath("/dashboard/inventario");
  revalidatePath("/dashboard");
}

export async function removeWorkOrderItem(itemId: string, orderId: string) {
  const supabase = await createClient();

  // Read the item before deleting to restore inventory stock if applicable
  const { data: item } = await supabase
    .from("work_order_items")
    .select("type, quantity, inventory_id")
    .eq("id", itemId)
    .single();

  const { error } = await supabase
    .from("work_order_items")
    .delete()
    .eq("id", itemId);

  if (error) throw new Error(error.message);

  // Restore inventory stock when removing a part linked to inventory
  if (item && item.type === "part" && item.inventory_id) {
    const { data: inv } = await supabase
      .from("inventory")
      .select("quantity")
      .eq("id", item.inventory_id)
      .single();

    if (inv) {
      await supabase
        .from("inventory")
        .update({ quantity: inv.quantity + Number(item.quantity) })
        .eq("id", item.inventory_id);
    }
  }

  revalidatePath(`/dashboard/ordenes/${orderId}`);
  revalidatePath("/dashboard/inventario");
  revalidatePath("/dashboard");
}

export async function updateWorkOrderNotes(
  orderId: string,
  fields: { description?: string; diagnosis?: string; estimated_cost?: number; final_cost?: number; estimated_delivery?: string | null }
) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("work_orders")
    .update(fields)
    .eq("id", orderId);

  if (error) throw new Error(error.message);

  revalidatePath(`/dashboard/ordenes/${orderId}`);
  revalidatePath("/dashboard");
}

export async function reassignMechanic(orderId: string, mechanicId: string | null) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("work_orders")
    .update({ mechanic_id: mechanicId })
    .eq("id", orderId);

  if (error) throw new Error(error.message);

  revalidatePath(`/dashboard/ordenes/${orderId}`);
  revalidatePath("/dashboard/ordenes");
}

export async function createVehicleForClient(
  clientId: string,
  data: { brand: string; model: string; year: number; plate: string }
): Promise<{ id: string; brand: string; model: string; year: number; plate: string | null }> {
  const supabase = await createClient();
  const { data: vehicle, error } = await supabase
    .from("vehicles")
    .insert({
      owner_id: clientId,
      brand: data.brand.trim(),
      model: data.model.trim(),
      year: data.year,
      plate: data.plate.trim() || null,
    })
    .select("id, brand, model, year, plate")
    .single();
  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/clientes");
  revalidatePath("/dashboard/ordenes/nueva");
  return vehicle;
}

export async function deleteWorkOrderPhoto(orderId: string, fileName: string) {
  const supabase = await createClient();
  const path = `work-orders/${orderId}/${fileName}`;
  const { error } = await supabase.storage.from("shop-assets").remove([path]);
  if (error) throw new Error(error.message);
  revalidatePath(`/dashboard/ordenes/${orderId}`);
}

export async function duplicateWorkOrder(orderId: string): Promise<string> {
  const supabase = await createClient();

  const { data: original, error: orderError } = await supabase
    .from("work_orders")
    .select("client_id, vehicle_id, mechanic_id, description, estimated_cost, work_order_items(*)")
    .eq("id", orderId)
    .single();

  if (orderError || !original) throw new Error("Orden no encontrada");

  const { data: newOrder, error: insertError } = await supabase
    .from("work_orders")
    .insert({
      client_id: original.client_id,
      vehicle_id: original.vehicle_id,
      mechanic_id: original.mechanic_id,
      status: "received" as WorkOrderStatus,
      description: original.description,
      estimated_cost: original.estimated_cost,
      received_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (insertError || !newOrder) throw new Error(insertError?.message ?? "Error al duplicar la orden");

  const items = (original.work_order_items ?? []) as {
    type: WorkOrderItemType;
    description: string;
    quantity: number;
    unit_price: number;
    total: number;
    inventory_id: string | null;
  }[];

  if (items.length > 0) {
    const rows = items.map((i) => ({
      work_order_id: newOrder.id,
      type: i.type,
      description: i.description,
      quantity: i.quantity,
      unit_price: i.unit_price,
      total: i.total,
      inventory_id: i.inventory_id,
    }));

    const { error: itemsError } = await supabase
      .from("work_order_items")
      .insert(rows);

    if (itemsError) throw new Error(itemsError.message);
  }

  revalidatePath("/dashboard/ordenes");
  revalidatePath("/dashboard");

  return newOrder.id;
}

export async function generateInvoiceFromWorkOrder(orderId: string): Promise<string> {
  const supabase = await createClient();

  // Return existing invoice if already generated
  const { data: existing } = await supabase
    .from("invoices")
    .select("id")
    .eq("work_order_id", orderId)
    .maybeSingle();

  if (existing) return existing.id;

  const { data: order, error: orderError } = await supabase
    .from("work_orders")
    .select("id, client_id, work_order_items(*)")
    .eq("id", orderId)
    .single();

  if (orderError || !order) throw new Error("Orden no encontrada");

  const items = (order.work_order_items ?? []) as {
    type: string;
    description: string;
    quantity: number;
    unit_price: number;
    total: number;
  }[];

  const subtotal = items.reduce((sum, i) => sum + i.total, 0);
  const tax = Math.round(subtotal * 0.16 * 100) / 100;
  const total = Math.round((subtotal + tax) * 100) / 100;

  const { data: invoice, error } = await supabase
    .from("invoices")
    .insert({
      work_order_id: orderId,
      client_id: order.client_id,
      items: items.map((i) => ({
        type: i.type,
        description: i.description,
        quantity: i.quantity,
        unit_price: i.unit_price,
        total: i.total,
      })),
      subtotal,
      tax,
      total,
      status: "draft",
    })
    .select("id")
    .single();

  if (error || !invoice) throw new Error(error?.message ?? "Error al crear la factura");

  revalidatePath("/dashboard/facturas");
  revalidatePath(`/dashboard/ordenes/${orderId}`);

  return invoice.id;
}
