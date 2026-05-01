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
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);

  revalidatePath("/dashboard/ordenes");
  redirect(`/dashboard/ordenes/${data.id}`);
}

export async function advanceWorkOrderStatus(orderId: string, nextStatus: WorkOrderStatus) {
  const supabase = await createClient();

  const updates: Record<string, unknown> = { status: nextStatus };
  if (nextStatus === "delivered") {
    updates.delivered_at = new Date().toISOString();
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
  });

  if (error) throw new Error(error.message);

  revalidatePath(`/dashboard/ordenes/${orderId}`);
}

export async function removeWorkOrderItem(itemId: string, orderId: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("work_order_items")
    .delete()
    .eq("id", itemId);

  if (error) throw new Error(error.message);

  revalidatePath(`/dashboard/ordenes/${orderId}`);
}

export async function updateWorkOrderNotes(
  orderId: string,
  fields: { diagnosis?: string; final_cost?: number }
) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("work_orders")
    .update(fields)
    .eq("id", orderId);

  if (error) throw new Error(error.message);

  revalidatePath(`/dashboard/ordenes/${orderId}`);
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
  const tax = 0;
  const total = subtotal + tax;

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
