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

export type PaymentMethod = "cash" | "card" | "transfer" | "check" | "other";

export interface PaymentDetails {
  method: PaymentMethod;
  amount_paid: number;
  reference: string;
  notes: string;
  paid_at: string;
}

export async function recordPayment(invoiceId: string, payment: PaymentDetails) {
  const supabase = await createClient();

  const { data: invoice, error: fetchError } = await supabase
    .from("invoices")
    .select("total, items")
    .eq("id", invoiceId)
    .single();

  if (fetchError || !invoice) throw new Error("No se pudo obtener la factura.");

  const existingItems = Array.isArray(invoice.items) ? invoice.items : [];

  const paymentRecord = {
    type: "payment" as const,
    description: `[Pago] ${PAYMENT_METHOD_LABELS[payment.method]} — Ref: ${payment.reference || "N/A"}${payment.notes ? ` — ${payment.notes}` : ""}`,
    quantity: 1,
    unit_price: payment.amount_paid,
    total: payment.amount_paid,
    payment_method: payment.method,
    payment_reference: payment.reference,
    payment_notes: payment.notes,
    payment_date: payment.paid_at,
  };

  const updatedItems = [...existingItems, paymentRecord];

  const totalPaid = updatedItems
    .filter((i: Record<string, unknown>) => i.type === "payment")
    .reduce((sum: number, i: Record<string, unknown>) => sum + (Number(i.total) || 0), 0);

  const isPaid = totalPaid >= (invoice.total ?? 0);

  const updates: Record<string, unknown> = {
    items: updatedItems,
  };

  if (isPaid) {
    updates.status = "paid";
    updates.paid_at = payment.paid_at;
  }

  const { error } = await supabase
    .from("invoices")
    .update(updates)
    .eq("id", invoiceId);

  if (error) throw new Error(error.message);

  revalidatePath("/dashboard/facturas");
  revalidatePath(`/dashboard/facturas/${invoiceId}`);

  return { fully_paid: isPaid, total_paid: totalPaid, remaining: (invoice.total ?? 0) - totalPaid };
}

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  cash: "Efectivo",
  card: "Tarjeta",
  transfer: "Transferencia",
  check: "Cheque",
  other: "Otro",
};

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
