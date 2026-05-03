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

// ── Global search ──────────────────────────────────────────────────────────

export type SearchResult = {
  id: string;
  category: "cliente" | "vehiculo" | "orden" | "inventario";
  title: string;
  subtitle: string;
  href: string;
};

export async function globalSearchAction(query: string): Promise<SearchResult[]> {
  if (!query || query.trim().length < 2) return [];
  const q = query.trim();
  const supabase = await createClient();

  const [clients, vehicles, orders, inventory] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, full_name, email, phone")
      .eq("role", "client")
      .or(`full_name.ilike.%${q}%,email.ilike.%${q}%`)
      .limit(4),
    supabase
      .from("vehicles")
      .select("id, brand, model, year, plate, owner_id")
      .or(`brand.ilike.%${q}%,model.ilike.%${q}%,plate.ilike.%${q}%`)
      .limit(4),
    supabase
      .from("work_orders")
      .select("id, status, description, vehicle:vehicles!work_orders_vehicle_id_fkey(brand, model, year)")
      .or(`description.ilike.%${q}%`)
      .order("created_at", { ascending: false })
      .limit(4),
    supabase
      .from("inventory")
      .select("id, name, sku, category, quantity")
      .or(`name.ilike.%${q}%,sku.ilike.%${q}%`)
      .limit(4),
  ]);

  const STATUS_LABELS: Record<string, string> = {
    received: "Recibido",
    diagnosing: "Diagnóstico",
    repairing: "En reparación",
    ready: "Listo",
    delivered: "Entregado",
  };

  const results: SearchResult[] = [];

  for (const c of clients.data ?? []) {
    results.push({
      id: c.id,
      category: "cliente",
      title: c.full_name ?? c.email,
      subtitle: c.phone ? `${c.email} · ${c.phone}` : c.email,
      href: `/dashboard/clientes/${c.id}`,
    });
  }

  for (const v of vehicles.data ?? []) {
    const veh = v as typeof v & { brand: string; model: string; year: number; plate: string | null };
    results.push({
      id: veh.id,
      category: "vehiculo",
      title: `${veh.brand} ${veh.model} ${veh.year}`,
      subtitle: veh.plate ?? "Sin patente",
      href: `/dashboard/vehiculos/${veh.id}`,
    });
  }

  for (const o of orders.data ?? []) {
    const vehicle = o.vehicle as unknown as { brand: string; model: string; year: number } | null;
    const vehicleLabel = vehicle ? `${vehicle.brand} ${vehicle.model} ${vehicle.year}` : "—";
    results.push({
      id: o.id,
      category: "orden",
      title: `OT-${o.id.slice(0, 6).toUpperCase()}`,
      subtitle: `${STATUS_LABELS[o.status] ?? o.status} · ${vehicleLabel}`,
      href: `/dashboard/ordenes/${o.id}`,
    });
  }

  for (const i of inventory.data ?? []) {
    results.push({
      id: i.id,
      category: "inventario",
      title: i.name,
      subtitle: [i.sku && `SKU: ${i.sku}`, i.category, `${i.quantity} uds.`].filter(Boolean).join(" · "),
      href: `/dashboard/inventario/${i.id}`,
    });
  }

  return results;
}
