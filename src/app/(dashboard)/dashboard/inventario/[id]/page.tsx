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

  const { data: item } = await supabase
    .from("inventory")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!item) notFound();

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

      <InventarioDetalleClient item={item} />
    </div>
  );
}
