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
