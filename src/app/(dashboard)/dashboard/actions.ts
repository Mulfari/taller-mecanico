"use server";

import { createClient } from "@/lib/supabase/server";
import type { Notification } from "@/components/dashboard/NotificationBell";

export async function getNotificationsAction(): Promise<Notification[]> {
  const supabase = await createClient();

  const [readyOrders, pendingAppointments, lowStock] = await Promise.all([
    supabase
      .from("work_orders")
      .select("id, vehicle:vehicles!work_orders_vehicle_id_fkey(brand, model, year), client:profiles!work_orders_client_id_fkey(full_name)")
      .eq("status", "ready")
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("appointments")
      .select("id, service_type, date, time_slot, client:profiles!appointments_client_id_fkey(full_name)")
      .eq("status", "pending")
      .gte("date", new Date().toISOString().slice(0, 10))
      .order("date")
      .order("time_slot")
      .limit(5),
    supabase
      .from("inventory")
      .select("id, name, quantity, min_stock")
      .order("name")
      .limit(20),
  ]);

  const notifications: Notification[] = [];

  // Ready orders
  for (const order of readyOrders.data ?? []) {
    const vehicle = order.vehicle as unknown as { brand: string; model: string; year: number } | null;
    const client = order.client as unknown as { full_name: string | null } | null;
    notifications.push({
      id: `ready-${order.id}`,
      type: "ready_order",
      title: "Vehículo listo para recoger",
      description: `${client?.full_name ?? "Cliente"} — ${vehicle ? `${vehicle.brand} ${vehicle.model} ${vehicle.year}` : "—"}`,
      href: `/dashboard/ordenes/${order.id}`,
    });
  }

  // Pending appointments (today or future)
  for (const appt of pendingAppointments.data ?? []) {
    const client = appt.client as unknown as { full_name: string | null } | null;
    const dateLabel = new Date(appt.date + "T00:00:00").toLocaleDateString("es-MX", {
      weekday: "short", day: "numeric", month: "short",
    });
    notifications.push({
      id: `appt-${appt.id}`,
      type: "pending_appointment",
      title: "Cita pendiente de confirmar",
      description: `${client?.full_name ?? "Cliente"} — ${appt.service_type} · ${dateLabel} ${appt.time_slot}`,
      href: `/dashboard/citas`,
    });
  }

  // Low stock items
  for (const item of lowStock.data ?? []) {
    if (item.quantity <= item.min_stock) {
      notifications.push({
        id: `stock-${item.id}`,
        type: "low_stock",
        title: "Stock bajo",
        description: `${item.name} — ${item.quantity === 0 ? "Sin stock" : `${item.quantity} uds. (mín. ${item.min_stock})`}`,
        href: `/dashboard/inventario`,
      });
    }
  }

  return notifications;
}
