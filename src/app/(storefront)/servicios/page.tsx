import Link from "next/link";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Servicios — TallerPro",
  description: "Conocé todos los servicios que ofrecemos: mantenimiento, diagnóstico, reparación, alineación y más.",
};

// ── Icons ──────────────────────────────────────────────────────────────────

function IconWrench() {
  return (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437l1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008z" />
    </svg>
  );
}

function IconOil() {
  return (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
    </svg>
  );
}

function IconDiag() {
  return (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0H3" />
    </svg>
  );
}

function IconAlign() {
  return (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
    </svg>
  );
}

function IconElec() {
  return (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
    </svg>
  );
}

function IconCar() {
  return (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
    </svg>
  );
}

function IconBrakes() {
  return (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
    </svg>
  );
}

function IconAC() {
  return (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
    </svg>
  );
}

function IconTire() {
  return (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.91 11.672a.375.375 0 010 .656l-5.603 3.113a.375.375 0 01-.557-.328V8.887c0-.286.307-.466.557-.327l5.603 3.112z" />
    </svg>
  );
}

// ── Data ───────────────────────────────────────────────────────────────────

const services = [
  {
    icon: <IconOil />,
    title: "Cambio de Aceite",
    desc: "Aceite sintético o convencional con revisión de 21 puntos incluida. Usamos lubricantes certificados para cada marca y modelo.",
    items: [
      "Aceite sintético, semi-sintético o convencional",
      "Cambio de filtro de aceite",
      "Revisión de niveles de fluidos",
      "Inspección visual de 21 puntos",
      "Reseteo del indicador de mantenimiento",
    ],
    cta: "Agendar cambio de aceite",
    serviceType: "Cambio de aceite y filtros",
  },
  {
    icon: <IconDiag />,
    title: "Diagnóstico Computarizado",
    desc: "Escáner OBD2 de última generación para detectar fallas con precisión. Identificamos el problema antes de tocar nada.",
    items: [
      "Lectura de códigos de falla (DTC)",
      "Diagnóstico de motor, transmisión y ABS",
      "Análisis de sensores en tiempo real",
      "Reporte detallado de hallazgos",
      "Presupuesto sin compromiso",
    ],
    cta: "Solicitar diagnóstico",
    serviceType: "Diagnóstico electrónico",
  },
  {
    icon: <IconWrench />,
    title: "Reparación General",
    desc: "Motor, transmisión, frenos, suspensión y más. Mano de obra garantizada con repuestos de primera calidad.",
    items: [
      "Reparación de motor y transmisión",
      "Sistema de frenos completo",
      "Suspensión y dirección",
      "Escape y catalizador",
      "Garantía de 6 meses o 10.000 km",
    ],
    cta: "Solicitar cotización",
    serviceType: "Otro",
  },
  {
    icon: <IconAlign />,
    title: "Alineación y Balanceo",
    desc: "Equipo de última generación para prolongar la vida de tus neumáticos y mejorar la estabilidad del vehículo.",
    items: [
      "Alineación computarizada 3D",
      "Balanceo dinámico de ruedas",
      "Revisión de ángulos de caída y convergencia",
      "Inspección de neumáticos",
      "Rotación de neumáticos opcional",
    ],
    cta: "Agendar alineación",
    serviceType: "Alineación y balanceo",
  },
  {
    icon: <IconElec />,
    title: "Sistema Eléctrico",
    desc: "Diagnóstico y reparación de fallas eléctricas, batería, alternador y sistema de arranque.",
    items: [
      "Diagnóstico eléctrico completo",
      "Prueba y reemplazo de batería",
      "Reparación de alternador y arranque",
      "Instalación de accesorios eléctricos",
      "Revisión de cableado y fusibles",
    ],
    cta: "Consultar por eléctrico",
    serviceType: "Sistema eléctrico",
  },
  {
    icon: <IconCar />,
    title: "Mantenimiento Preventivo",
    desc: "Planes de mantenimiento personalizados según marca, modelo y kilometraje para evitar fallas costosas.",
    items: [
      "Plan de mantenimiento personalizado",
      "Cambio de bujías y filtros",
      "Revisión de correa de distribución",
      "Fluidos de frenos, dirección y refrigeración",
      "Historial digital de servicios",
    ],
    cta: "Ver planes de mantenimiento",
    serviceType: "Revisión general",
  },
  {
    icon: <IconBrakes />,
    title: "Frenos",
    desc: "Revisión completa del sistema de frenos. Pastillas, discos, líquido y ABS para que frenes con confianza.",
    items: [
      "Inspección de pastillas y discos",
      "Cambio de líquido de frenos",
      "Revisión del sistema ABS",
      "Ajuste de freno de mano",
      "Prueba de frenado en ruta",
    ],
    cta: "Revisar mis frenos",
    serviceType: "Frenos (pastillas / discos)",
  },
  {
    icon: <IconAC />,
    title: "Aire Acondicionado",
    desc: "Carga de gas, reparación de fugas y mantenimiento del sistema de climatización para que viajes cómodo.",
    items: [
      "Carga y recarga de gas refrigerante",
      "Detección y reparación de fugas",
      "Limpieza del evaporador",
      "Revisión del compresor",
      "Cambio de filtro de habitáculo",
    ],
    cta: "Revisar mi AC",
    serviceType: "Aire acondicionado",
  },
  {
    icon: <IconTire />,
    title: "Neumáticos",
    desc: "Venta, montaje y reparación de neumáticos de todas las marcas. Asesoramiento para elegir el mejor para tu auto.",
    items: [
      "Venta de neumáticos todas las marcas",
      "Montaje y desmontaje",
      "Reparación de pinchazos",
      "Revisión de presión y desgaste",
      "Almacenamiento de neumáticos de temporada",
    ],
    cta: "Consultar neumáticos",
    serviceType: "Cambio de neumáticos",
  },
];

// ── Page ───────────────────────────────────────────────────────────────────

export default function ServiciosPage() {
  return (
    <div className="min-h-screen bg-surface">
      {/* Hero */}
      <div className="bg-secondary border-b border-white/5 py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
            <Link href="/" className="hover:text-white transition-colors">Inicio</Link>
            <span>/</span>
            <span className="text-white">Servicios</span>
          </nav>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">
            Nuestros <span className="text-primary">Servicios</span>
          </h1>
          <p className="text-gray-400 max-w-2xl text-lg">
            Equipos de diagnóstico de última generación y técnicos certificados para cualquier marca y modelo. Todos los trabajos con garantía.
          </p>
        </div>
      </div>

      {/* Services grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {services.map((service) => (
            <div
              key={service.title}
              className="bg-secondary border border-white/5 rounded-xl p-6 flex flex-col hover:border-primary/30 transition-colors group"
            >
              <div className="text-primary mb-4 group-hover:scale-110 transition-transform inline-block">
                {service.icon}
              </div>
              <h2 className="text-white font-bold text-xl mb-2">{service.title}</h2>
              <p className="text-gray-400 text-sm leading-relaxed mb-5">{service.desc}</p>

              <ul className="space-y-2 mb-6 flex-1">
                {service.items.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm text-gray-400">
                    <svg className="w-4 h-4 text-primary shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {item}
                  </li>
                ))}
              </ul>

              <Link
                href={`/citas?servicio=${encodeURIComponent(service.serviceType)}`}
                className="block text-center border border-primary/40 hover:border-primary hover:bg-primary/10 text-gray-300 hover:text-white text-sm font-medium py-2.5 rounded-lg transition-colors"
              >
                {service.cta}
              </Link>
            </div>
          ))}
        </div>
      </div>

      {/* CTA banner */}
      <div className="bg-primary py-14">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
            ¿No encontrás lo que buscás?
          </h2>
          <p className="text-white/80 mb-8 max-w-xl mx-auto">
            Contanos qué necesita tu vehículo y te preparamos una cotización personalizada sin costo.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/cotizacion"
              className="bg-white text-primary hover:bg-gray-100 font-semibold px-8 py-3.5 rounded-lg transition-colors"
            >
              Solicitar Cotización
            </Link>
            <Link
              href="/citas"
              className="border-2 border-white/60 hover:border-white text-white font-semibold px-8 py-3.5 rounded-lg transition-colors"
            >
              Agendar Cita
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
