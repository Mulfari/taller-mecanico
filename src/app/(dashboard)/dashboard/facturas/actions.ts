"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { InvoiceStatus } from "@/types/database";

export async function updateInvoiceStatus(invoiceId: string, status: InvoiceStatus) {
  const supabase = await createClient();

  const updates: Record<string, unknown> = { status };
  if (status === "paid") {
    updates.paid_at = new Date().toISOString();
  }

  const { error } = await supabase
    .from("invoices")
    .update(updates)
    .eq("id", invoiceId);

  if (error) throw new Error(error.message);

  revalidatePath("/dashboard/facturas");
}

export interface InvoiceItemInput {
  type: "labor" | "part";
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
}

export async function createInvoiceAction(payload: {
  client_id: string;
  work_order_id: string | null;
  items: InvoiceItemInput[];
  tax_rate: number; // 0–100
}) {
  const supabase = await createClient();

  const subtotal = payload.items.reduce((s, i) => s + i.total, 0);
  const tax = Math.round(subtotal * (payload.tax_rate / 100) * 100) / 100;
  const total = subtotal + tax;

  const { data, error } = await supabase
    .from("invoices")
    .insert({
      client_id: payload.client_id,
      work_order_id: payload.work_order_id ?? null,
      items: payload.items,
      subtotal,
      tax: tax > 0 ? tax : null,
      total,
      status: "draft",
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);

  revalidatePath("/dashboard/facturas");
  return data.id as string;
}
