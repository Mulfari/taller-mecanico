import Link from "next/link";

interface DaySchedule {
  open: string;
  close: string;
  closed: boolean;
}

interface Props {
  shopName: string;
  phone: string | null;
  address: string | null;
  schedule: Record<string, DaySchedule> | null;
}

function getScheduleSummary(schedule: Record<string, DaySchedule> | null): string {
  if (!schedule) return "Lun–Vie 9:00–18:00";

  const openDays = Object.entries(schedule).filter(([, d]) => !d.closed);
  if (openDays.length === 0) return "Horario no disponible";

  // Find the most common open/close time
  const first = openDays[0][1];
  const last = openDays[openDays.length - 1];
  const firstLabel = capitalize(openDays[0][0].slice(0, 3));
  const lastLabel = capitalize(last[0].slice(0, 3));

  return `${firstLabel}–${lastLabel} ${first.open}–${first.close}`;
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export default function StorefrontFooter({ shopName, phone, address, schedule }: Props) {
  return (
    <footer className="bg-secondary border-t border-primary/20 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-1 sm:col-span-2 lg:col-span-1">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-primary text-2xl">⚙</span>
              <span className="text-white font-bold text-xl tracking-tight">{shopName}</span>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed">
              Tu taller de confianza. Servicio profesional, diagnóstico preciso y atención personalizada.
            </p>
          </div>

          {/* Servicios */}
          <div>
            <h3 className="text-white font-semibold text-sm mb-3 uppercase tracking-wider">Servicios</h3>
            <ul className="space-y-2">
              {["Mantenimiento", "Diagnóstico", "Reparación", "Alineación y Balanceo", "Cambio de Aceite"].map((s) => (
                <li key={s}>
                  <Link href="/servicios" className="text-gray-400 hover:text-primary text-sm transition-colors">
                    {s}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Clientes */}
          <div>
            <h3 className="text-white font-semibold text-sm mb-3 uppercase tracking-wider">Clientes</h3>
            <ul className="space-y-2">
              {[
                { href: "/citas", label: "Agendar Cita" },
                { href: "/mi-vehiculo", label: "Estado de mi Vehículo" },
                { href: "/cotizacion", label: "Solicitar Cotización" },
                { href: "/contacto", label: "Contacto" },
                { href: "/login", label: "Mi Cuenta" },
              ].map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-gray-400 hover:text-primary text-sm transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contacto */}
          <div>
            <h3 className="text-white font-semibold text-sm mb-3 uppercase tracking-wider">Contacto</h3>
            <ul className="space-y-2 text-gray-400 text-sm">
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">📍</span>
                <span>{address || "Dirección no configurada"}</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-primary">📞</span>
                <span>{phone || "Teléfono no configurado"}</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-primary">🕐</span>
                <span>{getScheduleSummary(schedule)}</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-primary/20 mt-8 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-gray-500 text-xs">
            © {new Date().getFullYear()} {shopName}. Todos los derechos reservados.
          </p>
          <div className="flex gap-4">
            <Link href="/privacidad" className="text-gray-500 hover:text-gray-300 text-xs transition-colors">
              Privacidad
            </Link>
            <Link href="/terminos" className="text-gray-500 hover:text-gray-300 text-xs transition-colors">
              Términos
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
