import Link from "next/link";
import { getWorkOrders } from "@/lib/supabase/queries/work-orders";
import OrdenesClient from "./OrdenesClient";

export const metadata = { title: "Órdenes de Trabajo — TallerPro" };

function IconPlus() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
  );
}

export default async function OrdenesPage() {
  const orders = await getWorkOrders();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Órdenes de Trabajo</h1>
          <p className="text-gray-500 text-sm mt-1">{orders.length} órdenes en total</p>
        </div>
        <Link
          href="/dashboard/ordenes/nueva"
          className="inline-flex items-center gap-2 bg-[#e94560] hover:bg-[#c73652] text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          <IconPlus />
          Nueva Orden
        </Link>
      </div>

      <OrdenesClient orders={orders} />
    </div>
  );
}
