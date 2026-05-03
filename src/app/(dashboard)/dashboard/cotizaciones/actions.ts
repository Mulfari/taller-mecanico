"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { QuoteItemRow } from "@/lib/supabase/queries/quotes";
import type { QuoteStatus } from "@/types/database";

export async function updateQuoteStatus(quoteId: string, status: QuoteStatus) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("quotes")
    .update({ status })
    .eq("id", quoteId);
  if (error) throw new Error(error.message);
  revalidatePath(`/dashboard/cotizaciones/${quoteId}`);
  revalidatePath("/dashboard/cotizaciones");
}

type QuoteItemInput = Omit<QuoteItemRow, "id">;

export async function updateQuoteItems(
  quoteId: string,
  items: QuoteItemInput[],
  total: number
) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("quotes")
    .update({ items, total })
    .eq("id", quoteId);
  if (error) throw new Error(error.message);
  revalidatePath(`/dashboard/cotizaciones/${quoteId}`);
  revalidatePath("/dashboard/cotizaciones");
}

export async function createWorkOrderFromQuoteAction(quoteId: string) {
  return createWorkOrderFromQuote(quoteId);
}

export async function createInvoiceFromQuoteAction(quoteId: string) {
  const supabase = await createClient();

  const { data: quote, error: quoteError } = await supabase
    .from("quotes")
    .select("id, client_id, vehicle_id, items, total, status")
    .eq("id", quoteId)
    .single();

  if (quoteError || !quote) throw new Error("Cotización no encontrada");
  if (quote.status === "rejected") throw new Error("No se puede facturar una cotización rechazada");

  // Check if invoice already exists for this quote
  const { data: existing } = await supabase
    .from("invoices")
    .select("id")
    .eq("quote_id", quoteId)
    .maybeSingle();

  if (existing) redirect(`/dashboard/facturas/${existing.id}`);

  const subtotal = Number(quote.total ?? 0);

  const { data: invoice, error: invoiceError } = await supabase
    .from("invoices")
    .insert({
      quote_id: quoteId,
      work_order_id: null,
      client_id: quote.client_id,
      items: quote.items ?? [],
      subtotal,
      tax: 0,
      total: subtotal,
      status: "draft",
    })
    .select("id")
    .single();

  if (invoiceError || !invoice) throw new Error(invoiceError?.message ?? "Error al crear la factura");

  revalidatePath("/dashboard/facturas");
  revalidatePath(`/dashboard/cotizaciones/${quoteId}`);
  redirect(`/dashboard/facturas/${invoice.id}`);
}

export async function createWorkOrderFromQuote(quoteId: string) {
  const supabase = await createClient();

  const { data: quote, error: quoteError } = await supabase
    .from("quotes")
    .select("id, client_id, vehicle_id, items, total")
    .eq("id", quoteId)
    .single();

  if (quoteError || !quote) throw new Error("Cotización no encontrada");
  if (!quote.vehicle_id) throw new Error("La cotización no tiene vehículo asociado");

  const { data: order, error: orderError } = await supabase
    .from("work_orders")
    .insert({
      client_id: quote.client_id,
      vehicle_id: quote.vehicle_id,
      status: "received",
      description: `Orden generada desde cotización #${quoteId.slice(0, 8).toUpperCase()}`,
      estimated_cost: Number(quote.total),
    })
    .select("id")
    .single();

  if (orderError || !order) throw new Error(orderError?.message ?? "Error al crear la orden");

  const items = (quote.items as QuoteItemRow[]) ?? [];
  if (items.length > 0) {
    const { error: itemsError } = await supabase.from("work_order_items").insert(
      items.map((i) => ({
        work_order_id: order.id,
        type: i.type,
        description: i.description,
        quantity: i.quantity,
        unit_price: i.unit_price,
        total: i.total,
      }))
    );
    if (itemsError) throw new Error(itemsError.message);
  }

  revalidatePath("/dashboard/ordenes");
  revalidatePath("/dashboard/cotizaciones");
  redirect(`/dashboard/ordenes/${order.id}`);
}
