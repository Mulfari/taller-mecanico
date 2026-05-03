import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import InventarioDetalleClient from "./InventarioDetalleClient";

export const metadata = { title: "Detalle de repuesto — TallerPro" };

export default async function InventarioDetallePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: item }, { data: movementRows }] = await Promise.all([
    supabase
      .from("inventory")
      .select("*")
      .eq("id", id)
      .maybeSingle(),
    supabase
      .from("work_order_items")
      .select(`
        id, quantity, unit_price, total, created_at,
        work_order:work_orders!work_order_items_work_order_id_fkey(
          id, description, status, received_at,
          client:profiles!work_orders_client_id_fkey(full_name),
          vehicle:vehicles!work_orders_vehicle_id_fkey(brand, model, year, plate)
        )
      `)
      .eq("inventory_id", id)
      .order("created_at", { ascending: false })
      .limit(30),
  ]);

  if (!item) notFound();

  const stockMovements = (movementRows ?? []).map((row) => {
    const wo = Array.isArray(row.work_order) ? row.work_order[0] : row.work_order;
    return {
      id: row.id as string,
      quantity: row.quantity as number,
      unit_price: row.unit_price as number,
      total: row.total as number,
      created_at: row.created_at as string,
      work_order_id: wo?.id as string | null,
      work_order_description: wo?.description as string | null,
      work_order_status: wo?.status as string | null,
      work_order_received_at: wo?.received_at as string | null,
      client_name: (Array.isArray(wo?.client) ? wo?.client[0] : wo?.client)?.full_name as string | null,
      vehicle_label: wo?.vehicle
        ? (() => {
            const v = Array.isArray(wo.vehicle) ? wo.vehicle[0] : wo.vehicle;
            return v ? `${v.brand} ${v.model} ${v.year}${v.plate ? ` · ${v.plate}` : ""}` : null;
          })()
        : null,
    };
  });

  return (
    <div className="space-y-4">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-500">
        <Link href="/dashboard/inventario" className="hover:text-white transition-colors">
          Inventario
        </Link>
        <span>/</span>
        <span className="text-white truncate max-w-xs">{item.name}</span>
      </nav>

      <InventarioDetalleClient item={item} stockMovements={stockMovements} />
    </div>
  );
}
