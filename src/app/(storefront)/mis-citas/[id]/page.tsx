import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import CancelButton from "./CancelButton";

export const metadata = { title: "Detalle de cita — TallerPro" };

// ── Types ──────────────────────────────────────────────────────────────────

type AppointmentStatus = "pending" | "confirmed" | "completed" | "cancelled";

// ── Constants ──────────────────────────────────────────────────────────────

const STATUS_LABELS: Record<AppointmentStatus, string> = {
  pending: "Pendiente",
  confirmed: "Confirmada",
  completed: "Completada",
  cancelled: "Cancelada",
};

const STATUS_COLORS: Record<AppointmentStatus, string> = {
  pending: "bg-yellow-500/15 text-yellow-300 border-yellow-500/30",
  confirmed: "bg-green-500/15 text-green-300 border-green-500/30",
  completed: "bg-blue-500/15 text-blue-300 border-blue-500/30",
  cancelled: "bg-gray-600/20 text-gray-500 border-gray-600/30",
};

// ── Icons ──────────────────────────────────────────────────────────────────

function IconCalendar() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  );
}

function IconClock() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function IconCar() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
    </svg>
  );
}

function IconWrench() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437l1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008z" />
    </svg>
  );
}

function IconPhone() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
    </svg>
  );
}

function IconMapPin() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
    </svg>
  );
}

// ── Helpers ────────────────────────────────────────────────────────────────

function fmtDate(d: string) {
  return new Date(d + "T00:00:00").toLocaleDateString("es-MX", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function fmtCreated(d: string) {
  return new Date(d).toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="text-gray-500 mt-0.5 shrink-0">{icon}</span>
      <div>
        <p className="text-gray-500 text-xs mb-0.5">{label}</p>
        <p className="text-gray-200 text-sm">{value}</p>
      </div>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────

export default async function MisCitasDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/mis-citas/${id}`);

  const [{ data: appt }, { data: shopConfig }] = await Promise.all([
    supabase
      .from("appointments")
      .select(`
        id, date, time_slot, service_type, status, notes, created_at,
        vehicle:vehicles!appointments_vehicle_id_fkey(brand, model, year, plate, color)
      `)
      .eq("id", id)
      .eq("client_id", user.id)
      .maybeSingle(),
    supabase
      .from("shop_config")
      .select("name, phone, address")
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle(),
  ]);

  if (!appt) notFound();

  const vehicle = Array.isArray(appt.vehicle) ? appt.vehicle[0] ?? null : appt.vehicle;
  const status = appt.status as AppointmentStatus;
  const canCancel = status === "pending" || status === "confirmed";
  const shortId = `CIT-${appt.id.slice(0, 6).toUpperCase()}`;
  const shopName = shopConfig?.name ?? "TallerPro";

  // Check if appointment date is in the past
  const apptDate = new Date(appt.date + "T23:59:59");
  const isPast = apptDate < new Date();

  return (
    <div className="min-h-screen bg-surface">
      {/* Header */}
      <div className="bg-secondary border-b border-white/5 py-4">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex items-center gap-2 text-sm text-gray-500">
            <Link href="/" className="hover:text-white transition-colors">Inicio</Link>
            <span>/</span>
            <Link href="/cuenta" className="hover:text-white transition-colors">Mi cuenta</Link>
            <span>/</span>
            <Link href="/mis-citas" className="hover:text-white transition-colors">Mis citas</Link>
            <span>/</span>
            <span className="text-white font-mono">{shortId}</span>
          </nav>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

        {/* Title bar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/mis-citas"
              className="text-gray-500 hover:text-white transition-colors"
              aria-label="Volver a mis citas"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </Link>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-bold text-white font-mono">{shortId}</h1>
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${STATUS_COLORS[status]}`}
                >
                  {STATUS_LABELS[status]}
                </span>
              </div>
              <p className="text-gray-500 text-sm mt-0.5">
                Solicitada el {fmtCreated(appt.created_at)}
              </p>
            </div>
          </div>
        </div>

        {/* Main info card */}
        <div className="bg-secondary border border-white/10 rounded-xl p-6 space-y-5">
          <p className="text-gray-500 text-xs uppercase tracking-wide font-medium">
            Detalles de la cita
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <InfoRow
              icon={<IconCalendar />}
              label="Fecha"
              value={fmtDate(appt.date)}
            />
            <InfoRow
              icon={<IconClock />}
              label="Horario"
              value={appt.time_slot}
            />
            <InfoRow
              icon={<IconWrench />}
              label="Servicio"
              value={appt.service_type}
            />
            {vehicle && (
              <InfoRow
                icon={<IconCar />}
                label="Vehículo"
                value={`${vehicle.brand} ${vehicle.model} ${vehicle.year}${vehicle.plate ? ` — ${vehicle.plate}` : ""}`}
              />
            )}
          </div>

          {appt.notes && (
            <div className="pt-4 border-t border-white/5">
              <p className="text-gray-500 text-xs uppercase tracking-wide font-medium mb-2">
                Notas adicionales
              </p>
              <p className="text-gray-300 text-sm leading-relaxed bg-white/[0.03] rounded-lg px-4 py-3 border border-white/5">
                {appt.notes}
              </p>
            </div>
          )}
        </div>

        {/* Shop info */}
        {(shopConfig?.phone || shopConfig?.address) && (
          <div className="bg-secondary border border-white/10 rounded-xl p-6 space-y-4">
            <p className="text-gray-500 text-xs uppercase tracking-wide font-medium">
              Información del taller
            </p>
            <p className="text-white font-semibold">{shopName}</p>
            <div className="space-y-2">
              {shopConfig.phone && (
                <div className="flex items-center gap-2 text-gray-400 text-sm">
                  <span className="text-gray-600"><IconPhone /></span>
                  <a href={`tel:${shopConfig.phone}`} className="hover:text-white transition-colors">
                    {shopConfig.phone}
                  </a>
                </div>
              )}
              {shopConfig.address && (
                <div className="flex items-center gap-2 text-gray-400 text-sm">
                  <span className="text-gray-600"><IconMapPin /></span>
                  <span>{shopConfig.address}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Status-specific banners */}
        {status === "confirmed" && !isPast && (
          <div className="bg-green-500/10 border border-green-500/20 rounded-xl px-5 py-4">
            <p className="text-green-300 text-sm font-medium">
              Tu cita está confirmada. Te esperamos el {fmtDate(appt.date)} a las {appt.time_slot}.
            </p>
          </div>
        )}
        {status === "pending" && !isPast && (
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl px-5 py-4">
            <p className="text-yellow-300 text-sm">
              Tu cita está pendiente de confirmación. Te avisaremos cuando el taller la confirme.
            </p>
          </div>
        )}
        {status === "completed" && (
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl px-5 py-4">
            <p className="text-blue-300 text-sm">
              Esta cita fue completada. ¿Necesitás otro servicio?{" "}
              <Link href="/citas" className="underline hover:text-white transition-colors">
                Agendá una nueva cita
              </Link>
            </p>
          </div>
        )}
        {status === "cancelled" && (
          <div className="bg-gray-600/10 border border-gray-600/20 rounded-xl px-5 py-4">
            <p className="text-gray-400 text-sm">
              Esta cita fue cancelada.{" "}
              <Link href="/citas" className="underline hover:text-white transition-colors">
                Agendá una nueva cita
              </Link>
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2 border-t border-white/5">
          <Link
            href="/mis-citas"
            className="flex-1 text-center py-3 px-6 rounded-xl font-semibold text-gray-300 border border-white/10 hover:border-white/20 hover:text-white transition-colors text-sm"
          >
            Volver a mis citas
          </Link>
          {canCancel && !isPast && (
            <CancelButton appointmentId={appt.id} />
          )}
          {(status === "completed" || status === "cancelled" || isPast) && (
            <Link
              href="/citas"
              className="flex-1 text-center py-3 px-6 rounded-xl font-semibold text-white transition-colors text-sm bg-primary hover:bg-primary-hover"
            >
              Agendar nueva cita
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
