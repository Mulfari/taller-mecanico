"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";

const navLinks = [
  { href: "/servicios", label: "Servicios" },
  { href: "/repuestos", label: "Repuestos" },
  { href: "/vehiculos", label: "Vehículos en Venta" },
  { href: "/citas", label: "Agendar Cita" },
  { href: "/mi-vehiculo", label: "Mi Vehículo" },
];

interface Props {
  shopName: string;
  logoUrl: string | null;
}

export default function StorefrontNav({ shopName, logoUrl }: Props) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="bg-[#16213e] border-b border-[#e94560]/20 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 shrink-0">
            {logoUrl ? (
              <Image src={logoUrl} alt={shopName} width={32} height={32} className="object-contain rounded" />
            ) : (
              <span className="text-[#e94560] text-2xl">⚙</span>
            )}
            <span className="text-white font-bold text-xl tracking-tight">{shopName}</span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-gray-300 hover:text-[#e94560] text-sm font-medium transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-3">
            <Link
              href="/login"
              className="text-gray-300 hover:text-white text-sm font-medium transition-colors"
            >
              Iniciar sesión
            </Link>
            <Link
              href="/registro"
              className="bg-[#e94560] hover:bg-[#c73652] text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
            >
              Registrarse
            </Link>
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden text-gray-300 hover:text-white p-2"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Abrir menú"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {menuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden bg-[#16213e] border-t border-[#e94560]/20 px-4 pb-4">
          <nav className="flex flex-col gap-1 pt-2">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-gray-300 hover:text-[#e94560] text-sm font-medium py-2 transition-colors"
                onClick={() => setMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <div className="border-t border-[#e94560]/20 mt-2 pt-3 flex flex-col gap-2">
              <Link
                href="/login"
                className="text-gray-300 hover:text-white text-sm font-medium py-2 transition-colors"
                onClick={() => setMenuOpen(false)}
              >
                Iniciar sesión
              </Link>
              <Link
                href="/registro"
                className="bg-[#e94560] hover:bg-[#c73652] text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors text-center"
                onClick={() => setMenuOpen(false)}
              >
                Registrarse
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
