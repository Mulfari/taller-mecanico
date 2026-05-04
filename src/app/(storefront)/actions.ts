"use server";

import { createClient } from "@/lib/supabase/server";

export type ClientNotification = {
  id: string;
  type: "order_ready" | "order_update" | "appointment_confirmed" | "quote_response" | "invoice_ready";
  title: string;
  description: string;
  href: string;
};

const STATUS_LABELS: Record<string, string> = {
  received: "Recibido",
  diagnosing: "En diagnóstico",
  repairing: "En reparación",
  ready: "Listo para recoger",
  delivered: "Entregado",
};

export async function getClientNotificationsAction(): Promise<ClientNotification[]> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const [readyOrders, activeOrders, confirmedAppts, respondedQuotes, readyInvoices] = await Promise.all([
    supabase
      .from("work_orders")
      .select("id, vehicle:vehicles!work_orders_vehicle_id_fkey(brand, model, year)")
      .eq("client_id", user.id)
      .eq("status", "ready")
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("work_orders")
      .select("id, status, vehicle:vehicles!work_orders_vehicle_id_fkey(brand, model, year)")
      .eq("client_id", user.id)
      .in("status", ["diagnosing", "repairing"])
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("appointments")
      .select("id, service_type, date, time_slot")
      .eq("client_id", user.id)
      .eq("status", "confirmed")
      .gte("date", new Date().toISOString().slice(0, 10))
      .order("date")
      .limit(5),
    supabase
      .from("quotes")
      .select("id, total, status")
      .eq("client_id", user.id)
      .in("status", ["sent", "accepted", "rejected"])
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("invoices")
      .select("id, total, status")
      .eq("client_id", user.id)
      .in("status", ["sent"])
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  const notifications: ClientNotification[] = [];

  for (const order of readyOrders.data ?? []) {
    const v = order.vehicle as unknown as { brand: string; model: string; year: number } | null;
    notifications.push({
      id: `ready-${order.id}`,
      type: "order_ready",
      title: "¡Tu vehículo está listo!",
      description: v ? `${v.brand} ${v.model} ${v.year} — ya puedes pasar a recogerlo` : "Ya puedes pasar a recogerlo",
      href: `/mis-ordenes/${order.id}`,
    });
  }

  for (const order of activeOrders.data ?? []) {
    const v = order.vehicle as unknown as { brand: string; model: string; year: number } | null;
    const label = STATUS_LABELS[order.status] ?? order.status;
    notifications.push({
      id: `active-${order.id}`,
      type: "order_update",
      title: `Orden en progreso: ${label}`,
      description: v ? `${v.brand} ${v.model} ${v.year}` : "Tu vehículo está siendo atendido",
      href: `/mis-ordenes/${order.id}`,
    });
  }

  for (const appt of confirmedAppts.data ?? []) {
    const dateLabel = new Date(appt.date + "T00:00:00").toLocaleDateString("es-MX", {
      weekday: "short", day: "numeric", month: "short",
    });
    notifications.push({
      id: `appt-${appt.id}`,
      type: "appointment_confirmed",
      title: "Cita confirmada",
      description: `${appt.service_type} — ${dateLabel} a las ${appt.time_slot}`,
      href: "/mis-citas",
    });
  }

  for (const quote of respondedQuotes.data ?? []) {
    const statusLabel = quote.status === "sent" ? "Nueva cotización disponible"
      : quote.status === "accepted" ? "Cotización aceptada"
      : "Cotización rechazada";
    notifications.push({
      id: `quote-${quote.id}`,
      type: "quote_response",
      title: statusLabel,
      description: `Total: $${Number(quote.total ?? 0).toLocaleString("es-MX", { minimumFractionDigits: 2 })}`,
      href: `/mis-cotizaciones/${quote.id}`,
    });
  }

  for (const inv of readyInvoices.data ?? []) {
    notifications.push({
      id: `inv-${inv.id}`,
      type: "invoice_ready",
      title: "Factura pendiente de pago",
      description: `Total: $${Number(inv.total ?? 0).toLocaleString("es-MX", { minimumFractionDigits: 2 })}`,
      href: `/mis-facturas/${inv.id}`,
    });
  }

  return notifications;
}
