import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();

    const [
      { count: activeOrders },
      { count: pendingAppointments },
      { data: inventoryRows },
      { count: pendingQuotes },
      { count: unpaidInvoices },
    ] = await Promise.all([
      supabase
        .from("work_orders")
        .select("*", { count: "exact", head: true })
        .in("status", ["received", "diagnosing", "repairing", "ready"]),
      supabase
        .from("appointments")
        .select("*", { count: "exact", head: true })
        .in("status", ["pending", "confirmed"]),
      supabase
        .from("inventory")
        .select("quantity, min_stock"),
      supabase
        .from("quotes")
        .select("*", { count: "exact", head: true })
        .eq("status", "sent"),
      supabase
        .from("invoices")
        .select("*", { count: "exact", head: true })
        .in("status", ["draft", "sent"]),
    ]);

    const lowStock = (inventoryRows ?? []).filter(
      (item) => item.quantity <= item.min_stock
    ).length;

    return NextResponse.json({
      "/dashboard/ordenes": activeOrders ?? 0,
      "/dashboard/inventario": lowStock,
      "/dashboard/citas": pendingAppointments ?? 0,
      "/dashboard/cotizaciones": pendingQuotes ?? 0,
      "/dashboard/facturas": unpaidInvoices ?? 0,
    });
  } catch (err) {
    console.error("GET /api/sidebar-badges:", err);
    return NextResponse.json({});
  }
}
