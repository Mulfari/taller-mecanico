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
  category: "cliente" | "vehiculo" | "orden" | "inventario" | "cotizacion" | "factura" | "cita" | "mecanico";
  title: string;
  subtitle: string;
  href: string;
};

export async function globalSearchAction(query: string): Promise<SearchResult[]> {
  if (!query || query.trim().length < 2) return [];
  const q = query.trim();
  const escaped = q.replace(/[%_]/g, "\\$&");
  const supabase = await createClient();

  // Check if user is searching by OT-ID (e.g. "OT-AB12" or just "AB12")
  const otMatch = q.match(/^(?:OT-?)?([A-Fa-f0-9]{4,8})$/i);

  const [clients, vehicles, orders, inventory, quotes, invoices, appointments, mechanics] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, full_name, email, phone")
      .eq("role", "client")
      .or(`full_name.ilike.%${escaped}%,email.ilike.%${escaped}%`)
      .limit(3),
    supabase
      .from("vehicles")
      .select("id, brand, model, year, plate, owner_id")
      .or(`brand.ilike.%${escaped}%,model.ilike.%${escaped}%,plate.ilike.%${escaped}%`)
      .limit(3),
    supabase
      .from("work_orders")
      .select("id, status, description, vehicle:vehicles!work_orders_vehicle_id_fkey(brand, model, year)")
      .or(`description.ilike.%${escaped}%${otMatch ? `,id.ilike.${otMatch[1]}%` : ""}`)
      .order("created_at", { ascending: false })
      .limit(3),
    supabase
      .from("inventory")
      .select("id, name, sku, category, quantity")
      .or(`name.ilike.%${escaped}%,sku.ilike.%${escaped}%`)
      .limit(3),
    supabase
      .from("quotes")
      .select("id, total, status, valid_until, client:profiles!quotes_client_id_fkey(full_name), vehicle:vehicles!quotes_vehicle_id_fkey(brand, model, year)")
      .or(`status.ilike.%${escaped}%,id.ilike.%${escaped}%`)
      .order("created_at", { ascending: false })
      .limit(3),
    supabase
      .from("invoices")
      .select("id, total, status, client:profiles!invoices_client_id_fkey(full_name), work_order:work_orders!invoices_work_order_id_fkey(id)")
      .or(`status.ilike.%${escaped}%,id.ilike.%${escaped}%`)
      .order("created_at", { ascending: false })
      .limit(3),
    supabase
      .from("appointments")
      .select("id, date, time_slot, service_type, status, client:profiles!appointments_client_id_fkey(full_name), vehicle:vehicles!appointments_vehicle_id_fkey(brand, model)")
      .or(`service_type.ilike.%${escaped}%`)
      .order("date", { ascending: false })
      .limit(3),
    supabase
      .from("profiles")
      .select("id, full_name, email, phone")
      .eq("role", "mechanic")
      .or(`full_name.ilike.%${escaped}%,email.ilike.%${escaped}%`)
      .limit(3),
  ]);

  const STATUS_LABELS: Record<string, string> = {
    received: "Recibido",
    diagnosing: "Diagnóstico",
    repairing: "En reparación",
    ready: "Listo",
    delivered: "Entregado",
  };

  const QUOTE_STATUS: Record<string, string> = {
    draft: "Borrador",
    sent: "Enviada",
    accepted: "Aceptada",
    rejected: "Rechazada",
  };

  const INVOICE_STATUS: Record<string, string> = {
    draft: "Borrador",
    sent: "Enviada",
    paid: "Pagada",
  };

  const APPT_STATUS: Record<string, string> = {
    pending: "Pendiente",
    confirmed: "Confirmada",
    completed: "Completada",
    cancelled: "Cancelada",
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

  for (const qt of quotes.data ?? []) {
    const client = qt.client as unknown as { full_name: string | null } | null;
    const vehicle = qt.vehicle as unknown as { brand: string; model: string; year: number } | null;
    const vehicleLabel = vehicle ? `${vehicle.brand} ${vehicle.model} ${vehicle.year}` : "";
    results.push({
      id: qt.id,
      category: "cotizacion",
      title: `COT-${qt.id.slice(0, 6).toUpperCase()}`,
      subtitle: [QUOTE_STATUS[qt.status] ?? qt.status, client?.full_name, vehicleLabel].filter(Boolean).join(" · "),
      href: `/dashboard/cotizaciones/${qt.id}`,
    });
  }

  for (const inv of invoices.data ?? []) {
    const client = inv.client as unknown as { full_name: string | null } | null;
    const wo = inv.work_order as unknown as { id: string } | null;
    results.push({
      id: inv.id,
      category: "factura",
      title: `FAC-${inv.id.slice(0, 6).toUpperCase()}`,
      subtitle: [INVOICE_STATUS[inv.status] ?? inv.status, client?.full_name, wo ? `OT-${wo.id.slice(0, 6).toUpperCase()}` : null, inv.total ? `$${Number(inv.total).toLocaleString("es-MX")}` : null].filter(Boolean).join(" · "),
      href: `/dashboard/facturas/${inv.id}`,
    });
  }

  for (const ap of appointments.data ?? []) {
    const client = ap.client as unknown as { full_name: string | null } | null;
    const vehicle = ap.vehicle as unknown as { brand: string; model: string } | null;
    const dateLabel = new Date(ap.date + "T00:00:00").toLocaleDateString("es-MX", { day: "numeric", month: "short" });
    results.push({
      id: ap.id,
      category: "cita",
      title: `${ap.service_type} — ${dateLabel} ${ap.time_slot}`,
      subtitle: [APPT_STATUS[ap.status] ?? ap.status, client?.full_name, vehicle ? `${vehicle.brand} ${vehicle.model}` : null].filter(Boolean).join(" · "),
      href: `/dashboard/citas/${ap.id}`,
    });
  }

  for (const m of mechanics.data ?? []) {
    results.push({
      id: m.id,
      category: "mecanico",
      title: m.full_name ?? m.email,
      subtitle: m.phone ? `${m.email} · ${m.phone}` : m.email,
      href: `/dashboard/mecanicos/${m.id}`,
    });
  }

  return results;
}
