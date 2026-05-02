"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

interface QuoteItem {
  type: "labor" | "part";
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
}

export async function createWorkOrderFromQuoteAction(quoteId: string): Promise<void> {
  const supabase = await createClient();

  const { data: quote, error: quoteError } = await supabase
    .from("quotes")
    .select("id, client_id, vehicle_id, items, total")
    .eq("id", quoteId)
    .single();

  if (quoteError || !quote) throw new Error("Cotización no encontrada");

  const items: QuoteItem[] = Array.isArray(quote.items) ? (quote.items as QuoteItem[]) : [];

  const description =
    items.length > 0
      ? items.map((i) => `${i.description} (x${i.quantity})`).join(", ")
      : "Orden generada desde cotización";

  const { data: order, error: orderError } = await supabase
    .from("work_orders")
    .insert({
      client_id: quote.client_id,
      vehicle_id: quote.vehicle_id,
      status: "received",
      description,
      estimated_cost: quote.total,
    })
    .select("id")
    .single();

  if (orderError || !order) throw new Error(orderError?.message ?? "Error al crear la orden");

  if (items.length > 0) {
    const orderItems = items.map((i) => ({
      work_order_id: order.id,
      type: i.type,
      description: i.description,
      quantity: i.quantity,
      unit_price: i.unit_price,
      total: i.total,
    }));

    const { error: itemsError } = await supabase.from("work_order_items").insert(orderItems);
    if (itemsError) throw new Error(itemsError.message);
  }

  revalidatePath("/dashboard/cotizaciones");
  revalidatePath("/dashboard/ordenes");
  revalidatePath("/dashboard");

  redirect(`/dashboard/ordenes/${order.id}`);
}
