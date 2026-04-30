import Link from "next/link";

export default function StorefrontFooter() {
  return (
    <footer className="bg-[#16213e] border-t border-[#e94560]/20 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-1 sm:col-span-2 lg:col-span-1">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-[#e94560] text-2xl">⚙</span>
              <span className="text-white font-bold text-xl tracking-tight">
                Taller<span className="text-[#e94560]">Pro</span>
              </span>
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
                  <Link href="/servicios" className="text-gray-400 hover:text-[#e94560] text-sm transition-colors">
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
                { href: "/seguimiento", label: "Estado de mi Vehículo" },
                { href: "/cotizacion", label: "Solicitar Cotización" },
                { href: "/login", label: "Mi Cuenta" },
              ].map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-gray-400 hover:text-[#e94560] text-sm transition-colors">
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
                <span className="text-[#e94560] mt-0.5">📍</span>
                <span>Av. Principal 123, Ciudad</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-[#e94560]">📞</span>
                <span>+1 (555) 000-0000</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-[#e94560]">🕐</span>
                <span>Lun–Vie 8:00–18:00</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-[#e94560]/20 mt-8 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-gray-500 text-xs">
            © {new Date().getFullYear()} TallerPro. Todos los derechos reservados.
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
