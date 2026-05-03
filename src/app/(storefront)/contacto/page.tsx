import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contacto — TallerPro",
  description:
    "Encontrá nuestros datos de contacto, horarios de atención y cómo llegar al taller.",
};

interface DaySchedule {
  open: string;
  close: string;
  closed: boolean;
}

const DAY_LABELS: Record<string, string> = {
  lunes: "Lunes",
  martes: "Martes",
  miercoles: "Miércoles",
  jueves: "Jueves",
  viernes: "Viernes",
  sabado: "Sábado",
  domingo: "Domingo",
};

const DAY_ORDER = ["lunes", "martes", "miercoles", "jueves", "viernes", "sabado", "domingo"];

function IconPhone() {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
    </svg>
  );
}

function IconMapPin() {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
    </svg>
  );
}

function IconClock() {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function IconWhatsApp() {
  return (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

function IconMail() {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
    </svg>
  );
}

function isOpenNow(schedule: Record<string, DaySchedule> | null): {
  open: boolean;
  label: string;
} {
  if (!schedule) return { open: false, label: "Horario no disponible" };

  const now = new Date();
  const dayIdx = now.getDay();
  const dayMap = [
    "domingo",
    "lunes",
    "martes",
    "miercoles",
    "jueves",
    "viernes",
    "sabado",
  ];
  const todayKey = dayMap[dayIdx];
  const today = schedule[todayKey];

  if (!today || today.closed) return { open: false, label: "Cerrado hoy" };

  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const [openH, openM] = today.open.split(":").map(Number);
  const [closeH, closeM] = today.close.split(":").map(Number);
  const openMin = openH * 60 + openM;
  const closeMin = closeH * 60 + closeM;

  if (nowMinutes >= openMin && nowMinutes < closeMin) {
    return { open: true, label: `Abierto hasta las ${today.close}` };
  }

  if (nowMinutes < openMin) {
    return { open: false, label: `Abre hoy a las ${today.open}` };
  }

  return { open: false, label: "Cerrado — abrimos mañana" };
}

export default async function ContactoPage() {
  const supabase = await createClient();

  const { data: config } = await supabase
    .from("shop_config")
    .select("name, phone, address, schedule")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  const shopName = config?.name ?? "TallerPro";
  const phone = config?.phone ?? null;
  const address = config?.address ?? null;
  const schedule = (config?.schedule as Record<string, DaySchedule> | null) ?? null;

  const whatsappNumber = phone?.replace(/\D/g, "") ?? "";
  const whatsappUrl = whatsappNumber
    ? `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
        `Hola ${shopName}, quisiera consultar sobre un servicio.`
      )}`
    : null;

  const { open, label: statusLabel } = isOpenNow(schedule);

  return (
    <div className="min-h-screen bg-surface">
      {/* Hero */}
      <div className="bg-secondary border-b border-white/5 py-14">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
            <Link href="/" className="hover:text-white transition-colors">
              Inicio
            </Link>
            <span>/</span>
            <span className="text-white">Contacto</span>
          </nav>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">
            Contactá con <span className="text-primary">{shopName}</span>
          </h1>
          <p className="text-gray-400 max-w-2xl text-lg">
            Estamos para ayudarte. Escribinos, llamanos o visitanos en el
            taller. Te respondemos lo antes posible.
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Contact cards */}
          <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Phone */}
            <div className="bg-secondary border border-white/5 rounded-xl p-6 flex flex-col gap-3 hover:border-primary/30 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                <IconPhone />
              </div>
              <h2 className="text-white font-semibold text-lg">Teléfono</h2>
              {phone ? (
                <a
                  href={`tel:${phone}`}
                  className="text-gray-300 hover:text-primary text-lg font-medium transition-colors"
                >
                  {phone}
                </a>
              ) : (
                <p className="text-gray-500 text-sm">No configurado</p>
              )}
              <p className="text-gray-500 text-sm">
                Llamanos para consultas rápidas o emergencias.
              </p>
            </div>

            {/* WhatsApp */}
            <div className="bg-secondary border border-white/5 rounded-xl p-6 flex flex-col gap-3 hover:border-green-500/30 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center justify-center text-green-400">
                <IconWhatsApp />
              </div>
              <h2 className="text-white font-semibold text-lg">WhatsApp</h2>
              {whatsappUrl ? (
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-green-400 hover:text-green-300 text-sm font-medium transition-colors"
                >
                  Enviar mensaje →
                </a>
              ) : (
                <p className="text-gray-500 text-sm">No disponible</p>
              )}
              <p className="text-gray-500 text-sm">
                Escribinos por WhatsApp para cotizaciones o turnos.
              </p>
            </div>

            {/* Address */}
            <div className="bg-secondary border border-white/5 rounded-xl p-6 flex flex-col gap-3 hover:border-primary/30 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                <IconMapPin />
              </div>
              <h2 className="text-white font-semibold text-lg">Dirección</h2>
              {address ? (
                <p className="text-gray-300 text-sm leading-relaxed">
                  {address}
                </p>
              ) : (
                <p className="text-gray-500 text-sm">No configurada</p>
              )}
              <p className="text-gray-500 text-sm">
                Visitanos en el taller. Estacionamiento disponible.
              </p>
            </div>

            {/* Email / Quote */}
            <div className="bg-secondary border border-white/5 rounded-xl p-6 flex flex-col gap-3 hover:border-primary/30 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                <IconMail />
              </div>
              <h2 className="text-white font-semibold text-lg">Cotización</h2>
              <Link
                href="/cotizacion"
                className="text-primary hover:text-white text-sm font-medium transition-colors"
              >
                Solicitar cotización online →
              </Link>
              <p className="text-gray-500 text-sm">
                Completá el formulario y te respondemos en menos de 24 hs.
              </p>
            </div>
          </div>

          {/* Schedule sidebar */}
          <div className="space-y-5">
            {/* Open/closed status */}
            <div className="bg-secondary border border-white/5 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                  <IconClock />
                </div>
                <div>
                  <h2 className="text-white font-semibold text-lg">Horarios</h2>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        open ? "bg-green-400 animate-pulse" : "bg-red-400"
                      }`}
                    />
                    <span
                      className={`text-sm font-medium ${
                        open ? "text-green-400" : "text-red-400"
                      }`}
                    >
                      {statusLabel}
                    </span>
                  </div>
                </div>
              </div>

              {schedule ? (
                <ul className="space-y-2">
                  {DAY_ORDER.map((key) => {
                    const day = schedule[key];
                    if (!day) return null;
                    const now = new Date();
                    const dayMap = [
                      "domingo",
                      "lunes",
                      "martes",
                      "miercoles",
                      "jueves",
                      "viernes",
                      "sabado",
                    ];
                    const isToday = dayMap[now.getDay()] === key;
                    return (
                      <li
                        key={key}
                        className={`flex items-center justify-between text-sm py-1.5 px-2 rounded-lg ${
                          isToday
                            ? "bg-primary/5 border border-primary/10"
                            : ""
                        }`}
                      >
                        <span
                          className={`${
                            isToday
                              ? "text-white font-medium"
                              : "text-gray-400"
                          }`}
                        >
                          {DAY_LABELS[key] ?? key}
                          {isToday && (
                            <span className="text-primary text-xs ml-1.5">
                              Hoy
                            </span>
                          )}
                        </span>
                        {day.closed ? (
                          <span className="text-red-400/70 text-xs font-medium">
                            Cerrado
                          </span>
                        ) : (
                          <span
                            className={`font-mono text-xs ${
                              isToday ? "text-white" : "text-gray-300"
                            }`}
                          >
                            {day.open} – {day.close}
                          </span>
                        )}
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="text-gray-500 text-sm">
                  Horarios no configurados. Contactanos para consultar
                  disponibilidad.
                </p>
              )}
            </div>

            {/* Quick actions */}
            <div className="space-y-3">
              <Link
                href="/citas"
                className="flex items-center justify-center gap-2 w-full bg-primary hover:bg-primary-hover text-white font-semibold py-3.5 rounded-xl transition-colors text-sm"
              >
                Agendar Cita
              </Link>
              <Link
                href="/seguimiento"
                className="flex items-center justify-center gap-2 w-full border border-white/10 hover:border-white/20 text-gray-300 hover:text-white font-semibold py-3.5 rounded-xl transition-colors text-sm"
              >
                Consultar Estado de mi Vehículo
              </Link>
            </div>
          </div>
        </div>

        {/* FAQ section */}
        <div className="mt-16">
          <h2 className="text-2xl font-bold text-white mb-6">
            Preguntas frecuentes
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {[
              {
                q: "¿Necesito turno previo?",
                a: "Para servicios programados como mantenimiento o diagnóstico, recomendamos agendar una cita. Para emergencias, podés acercarte directamente al taller.",
              },
              {
                q: "¿Cuánto tarda un servicio de mantenimiento?",
                a: "Un mantenimiento básico (cambio de aceite y filtros) tarda entre 30 minutos y 1 hora. Servicios más complejos pueden requerir más tiempo — te informamos al recibir el vehículo.",
              },
              {
                q: "¿Puedo consultar el estado de mi vehículo online?",
                a: "Sí. Desde la sección de Seguimiento podés ver en tiempo real el estado de tu orden de trabajo: recibido, en diagnóstico, en reparación, listo o entregado.",
              },
              {
                q: "¿Trabajan con todas las marcas?",
                a: "Sí, trabajamos con todas las marcas y modelos. Contamos con equipos de diagnóstico multimarca y técnicos capacitados para cada tipo de vehículo.",
              },
              {
                q: "¿Ofrecen garantía en los trabajos?",
                a: "Todos nuestros trabajos tienen garantía. El plazo depende del tipo de servicio — consultanos para más detalles sobre la cobertura específica.",
              },
              {
                q: "¿Aceptan tarjetas de crédito?",
                a: "Sí, aceptamos efectivo, tarjetas de débito y crédito, y transferencias bancarias. Consultá por opciones de financiación en trabajos mayores.",
              },
            ].map((faq) => (
              <div
                key={faq.q}
                className="bg-secondary border border-white/5 rounded-xl p-5"
              >
                <h3 className="text-white font-semibold text-sm mb-2">
                  {faq.q}
                </h3>
                <p className="text-gray-400 text-sm leading-relaxed">
                  {faq.a}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
