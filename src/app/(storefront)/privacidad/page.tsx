import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Política de Privacidad — TallerPro",
  description:
    "Conocé cómo recopilamos, usamos y protegemos tu información personal.",
};

export default function PrivacidadPage() {
  return (
    <div className="min-h-screen bg-surface">
      {/* Header */}
      <div className="bg-secondary border-b border-white/5 py-14">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
            <Link href="/" className="hover:text-white transition-colors">
              Inicio
            </Link>
            <span>/</span>
            <span className="text-white">Política de Privacidad</span>
          </nav>
          <h1 className="text-3xl md:text-4xl font-bold text-white">
            Política de <span className="text-primary">Privacidad</span>
          </h1>
          <p className="text-gray-400 mt-3">
            Última actualización: mayo 2026
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="space-y-10 text-gray-300 text-sm leading-relaxed">
          <Section title="1. Información que recopilamos">
            <p>
              Recopilamos información que nos proporcionás directamente al usar
              nuestros servicios:
            </p>
            <ul className="list-disc list-inside space-y-1.5 mt-3 text-gray-400">
              <li>
                Datos de registro: nombre completo, correo electrónico y
                teléfono.
              </li>
              <li>
                Datos de vehículos: marca, modelo, año, patente, color,
                kilometraje y VIN.
              </li>
              <li>
                Datos de servicio: órdenes de trabajo, diagnósticos, historial
                de reparaciones y cotizaciones.
              </li>
              <li>
                Datos de facturación: información necesaria para generar
                facturas y registrar pagos.
              </li>
              <li>
                Datos de uso: información técnica sobre cómo interactuás con
                nuestra plataforma (páginas visitadas, dispositivo, navegador).
              </li>
            </ul>
          </Section>

          <Section title="2. Cómo usamos tu información">
            <ul className="list-disc list-inside space-y-1.5 text-gray-400">
              <li>Gestionar tus citas, órdenes de trabajo y cotizaciones.</li>
              <li>
                Enviarte notificaciones sobre el estado de tu vehículo en el
                taller.
              </li>
              <li>
                Generar facturas y mantener un historial de servicios para tu
                vehículo.
              </li>
              <li>
                Mejorar nuestros servicios y la experiencia de usuario en la
                plataforma.
              </li>
              <li>
                Comunicarnos con vos sobre promociones, novedades o cambios en
                el servicio (solo con tu consentimiento).
              </li>
            </ul>
          </Section>

          <Section title="3. Compartición de datos">
            <p>
              No vendemos ni alquilamos tu información personal a terceros.
              Podemos compartir datos únicamente en los siguientes casos:
            </p>
            <ul className="list-disc list-inside space-y-1.5 mt-3 text-gray-400">
              <li>
                Con proveedores de servicios que nos ayudan a operar la
                plataforma (hosting, almacenamiento, procesamiento de pagos).
              </li>
              <li>
                Cuando sea requerido por ley, orden judicial o autoridad
                competente.
              </li>
              <li>
                Para proteger nuestros derechos, seguridad o propiedad, o los de
                nuestros usuarios.
              </li>
            </ul>
          </Section>

          <Section title="4. Seguridad de los datos">
            <p>
              Implementamos medidas de seguridad técnicas y organizativas para
              proteger tu información, incluyendo cifrado en tránsito (HTTPS),
              autenticación segura y control de acceso basado en roles. Sin
              embargo, ningún sistema es 100% seguro y no podemos garantizar la
              seguridad absoluta de tus datos.
            </p>
          </Section>

          <Section title="5. Retención de datos">
            <p>
              Conservamos tu información mientras mantengas una cuenta activa o
              mientras sea necesario para prestarte nuestros servicios. Podés
              solicitar la eliminación de tu cuenta y datos personales en
              cualquier momento contactándonos directamente.
            </p>
          </Section>

          <Section title="6. Tus derechos">
            <p>Tenés derecho a:</p>
            <ul className="list-disc list-inside space-y-1.5 mt-3 text-gray-400">
              <li>Acceder a los datos personales que tenemos sobre vos.</li>
              <li>
                Solicitar la corrección de datos inexactos o incompletos.
              </li>
              <li>
                Solicitar la eliminación de tus datos personales.
              </li>
              <li>
                Retirar tu consentimiento para comunicaciones de marketing.
              </li>
              <li>
                Solicitar una copia de tus datos en un formato portable.
              </li>
            </ul>
          </Section>

          <Section title="7. Cookies y tecnologías similares">
            <p>
              Utilizamos cookies esenciales para el funcionamiento de la
              plataforma (autenticación, preferencias de sesión). No utilizamos
              cookies de seguimiento publicitario de terceros.
            </p>
          </Section>

          <Section title="8. Cambios a esta política">
            <p>
              Podemos actualizar esta política periódicamente. Te notificaremos
              sobre cambios significativos a través de la plataforma o por
              correo electrónico. El uso continuado del servicio después de los
              cambios constituye tu aceptación de la política actualizada.
            </p>
          </Section>

          <Section title="9. Contacto">
            <p>
              Si tenés preguntas sobre esta política de privacidad o querés
              ejercer tus derechos, podés contactarnos a través de los datos de
              contacto disponibles en nuestra página principal o enviando un
              mensaje desde la sección de contacto.
            </p>
          </Section>
        </div>

        {/* Back link */}
        <div className="mt-12 pt-8 border-t border-white/5">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Volver al inicio
          </Link>
        </div>
      </div>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="text-white font-semibold text-lg mb-3">{title}</h2>
      {children}
    </section>
  );
}
