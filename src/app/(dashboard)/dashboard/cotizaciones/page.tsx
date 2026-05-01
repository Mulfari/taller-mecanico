import { getQuotes, getQuoteFormData } from "@/lib/supabase/queries/quotes";
import CotizacionesClient from "./CotizacionesClient";

export const metadata = { title: "Cotizaciones — TallerPro" };

export default async function CotizacionesPage() {
  const [quotes, formData] = await Promise.all([
    getQuotes(),
    getQuoteFormData(),
  ]);

  return (
    <CotizacionesClient
      quotes={quotes}
      clients={formData.clients}
      vehicles={formData.vehicles}
      inventory={formData.inventory}
    />
  );
}
