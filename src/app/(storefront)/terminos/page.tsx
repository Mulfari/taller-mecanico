import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Términos y Condiciones — TallerPro",
  description:
    "Términos y condiciones de uso de nuestra plataforma y servicios de taller mecánico.",
};

export default function TerminosPage() {
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
            <span className="text-white">Términos y Condiciones</span>
          </nav>
          <h1 className="text-3xl md:text-4xl font-bold text-white">
            Términos y <span className="text-primary">Condiciones</span>
          </h1>
          <p className="text-gray-400 mt-3">
            Última actualización: mayo 2026
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="space-y-10 text-gray-300 text-sm leading-relaxed">
          <Section title="1. Aceptación de los términos">
            <p>
              Al acceder y utilizar esta plataforma, aceptás estos términos y
              condiciones en su totalidad. Si no estás de acuerdo con alguna
              parte de estos términos, no debés utilizar nuestros servicios. El
              uso continuado de la plataforma constituye la aceptación de
              cualquier modificación a estos términos.
            </p>
          </Section>

          <Section title="2. Descripción del servicio">
            <p>
              Nuestra plataforma ofrece servicios de gestión para talleres
              mecánicos automotrices, incluyendo:
            </p>
            <ul className="list-disc list-inside space-y-1.5 mt-3 text-gray-400">
              <li>Agendamiento de citas para servicio y reparación.</li>
              <li>Seguimiento en tiempo real del estado de tu vehículo.</li>
              <li>Consulta de historial de servicios.</li>
              <li>Solicitud de cotizaciones en línea.</li>
              <li>Catálogo de repuestos y vehículos en venta.</li>
              <li>Gestión de facturas y pagos.</li>
            </ul>
          </Section>

          <Section title="3. Registro y cuenta de usuario">
            <p>
              Para acceder a ciertas funcionalidades, debés crear una cuenta
              proporcionando información veraz y actualizada. Sos responsable
              de:
            </p>
            <ul className="list-disc list-inside space-y-1.5 mt-3 text-gray-400">
              <li>
                Mantener la confidencialidad de tus credenciales de acceso.
              </li>
              <li>
                Todas las actividades que ocurran bajo tu cuenta.
              </li>
              <li>
                Notificarnos inmediatamente sobre cualquier uso no autorizado de
                tu cuenta.
              </li>
              <li>
                Mantener tu información de perfil actualizada.
              </li>
            </ul>
            <p className="mt-3">
              Nos reservamos el derecho de suspender o cancelar cuentas que
              violen estos términos o que permanezcan inactivas por un período
              prolongado.
            </p>
          </Section>

          <Section title="4. Servicios del taller">
            <p>
              Los servicios mecánicos están sujetos a las siguientes
              condiciones:
            </p>
            <ul className="list-disc list-inside space-y-1.5 mt-3 text-gray-400">
              <li>
                Las cotizaciones son estimaciones y pueden variar según el
                diagnóstico final del vehículo.
              </li>
              <li>
                Los plazos de entrega son aproximados y pueden modificarse según
                la disponibilidad de repuestos o la complejidad de la
                reparación.
              </li>
              <li>
                Las garantías sobre trabajos realizados se especifican en cada
                orden de trabajo y cotización.
              </li>
              <li>
                El cliente debe retirar su vehículo dentro de los 5 días
                hábiles posteriores a la notificación de que está listo. Pasado
                ese plazo, podrán aplicarse cargos por estadía.
              </li>
            </ul>
          </Section>

          <Section title="5. Citas y cancelaciones">
            <ul className="list-disc list-inside space-y-1.5 text-gray-400">
              <li>
                Las citas pueden agendarse a través de la plataforma sujetas a
                disponibilidad.
              </li>
              <li>
                Podés cancelar o reprogramar una cita con al menos 24 horas de
                anticipación sin cargo.
              </li>
              <li>
                Las cancelaciones tardías o inasistencias reiteradas pueden
                resultar en restricciones para agendar futuras citas.
              </li>
              <li>
                Nos reservamos el derecho de reprogramar citas por razones
                operativas, notificándote con la mayor anticipación posible.
              </li>
            </ul>
          </Section>

          <Section title="6. Precios y pagos">
            <ul className="list-disc list-inside space-y-1.5 text-gray-400">
              <li>
                Los precios publicados en el catálogo de repuestos incluyen
                impuestos salvo que se indique lo contrario.
              </li>
              <li>
                Los costos de mano de obra se detallan en cada cotización y
                orden de trabajo.
              </li>
              <li>
                Las facturas deben pagarse dentro del plazo indicado en las
                mismas.
              </li>
              <li>
                Nos reservamos el derecho de retener el vehículo hasta que se
                complete el pago total de los servicios realizados.
              </li>
            </ul>
          </Section>

          <Section title="7. Venta de vehículos">
            <p>
              Los vehículos publicados en nuestra sección de venta están sujetos
              a:
            </p>
            <ul className="list-disc list-inside space-y-1.5 mt-3 text-gray-400">
              <li>
                Disponibilidad al momento de la consulta. La publicación no
                constituye una oferta vinculante.
              </li>
              <li>
                Las fotos y descripciones son orientativas. Recomendamos una
                inspección presencial antes de la compra.
              </li>
              <li>
                Las condiciones de venta, financiamiento y garantía se acuerdan
                de forma individual.
              </li>
            </ul>
          </Section>

          <Section title="8. Propiedad intelectual">
            <p>
              Todo el contenido de la plataforma (diseño, textos, logotipos,
              imágenes, código) es propiedad del taller o de sus licenciantes y
              está protegido por las leyes de propiedad intelectual. No podés
              reproducir, distribuir o modificar ningún contenido sin
              autorización previa por escrito.
            </p>
          </Section>

          <Section title="9. Limitación de responsabilidad">
            <ul className="list-disc list-inside space-y-1.5 text-gray-400">
              <li>
                La plataforma se proporciona &quot;tal cual&quot; sin garantías
                de disponibilidad ininterrumpida.
              </li>
              <li>
                No somos responsables por daños indirectos, incidentales o
                consecuentes derivados del uso de la plataforma.
              </li>
              <li>
                Nuestra responsabilidad máxima se limita al monto pagado por los
                servicios en cuestión.
              </li>
              <li>
                No garantizamos la exactitud de la información proporcionada por
                terceros a través de la plataforma.
              </li>
            </ul>
          </Section>

          <Section title="10. Modificaciones">
            <p>
              Nos reservamos el derecho de modificar estos términos en cualquier
              momento. Los cambios entrarán en vigencia al ser publicados en la
              plataforma. Te notificaremos sobre cambios significativos a través
              de la plataforma o por correo electrónico. El uso continuado del
              servicio después de las modificaciones constituye tu aceptación de
              los nuevos términos.
            </p>
          </Section>

          <Section title="11. Ley aplicable">
            <p>
              Estos términos se rigen por las leyes vigentes en la jurisdicción
              donde opera el taller. Cualquier disputa será resuelta ante los
              tribunales competentes de dicha jurisdicción.
            </p>
          </Section>

          <Section title="12. Contacto">
            <p>
              Para consultas sobre estos términos y condiciones, podés
              contactarnos a través de los datos disponibles en nuestra página
              principal o desde la sección de contacto de la plataforma.
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
