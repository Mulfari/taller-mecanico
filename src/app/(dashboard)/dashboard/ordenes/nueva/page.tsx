import Link from "next/link";
import { getClients, getMechanics, getVehiclesByClient } from "@/lib/supabase/queries/work-orders";
import NuevaOrdenForm from "./NuevaOrdenForm";

export const metadata = { title: "Nueva Orden — TallerPro" };

function IconArrowLeft() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
    </svg>
  );
}

export default async function NuevaOrdenPage() {
  const [clients, mechanics] = await Promise.all([getClients(), getMechanics()]);

  // Pre-fetch vehicles for all clients so the client component can filter without extra requests
  const vehiclesByClient: Record<string, Awaited<ReturnType<typeof getVehiclesByClient>>> = {};
  await Promise.all(
    clients.map(async (c) => {
      vehiclesByClient[c.id] = await getVehiclesByClient(c.id);
    })
  );

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard/ordenes"
          className="text-gray-500 hover:text-white transition-colors"
          aria-label="Volver a órdenes"
        >
          <IconArrowLeft />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white">Nueva Orden de Trabajo</h1>
          <p className="text-gray-500 text-sm mt-0.5">Registra la recepción de un vehículo</p>
        </div>
      </div>

      <NuevaOrdenForm
        clients={clients}
        mechanics={mechanics}
        vehiclesByClient={vehiclesByClient}
      />
    </div>
  );
}
