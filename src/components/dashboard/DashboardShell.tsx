"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

const navItems = [
  { href: "/dashboard", label: "Panel", icon: "▦" },
  { href: "/dashboard/ordenes", label: "Órdenes de Trabajo", icon: "🔧" },
  { href: "/dashboard/inventario", label: "Inventario", icon: "📦" },
  { href: "/dashboard/vehiculos-venta", label: "Vehículos en Venta", icon: "🚗" },
  { href: "/dashboard/clientes", label: "Clientes", icon: "👥" },
  { href: "/dashboard/citas", label: "Agenda", icon: "📅" },
  { href: "/dashboard/cotizaciones", label: "Cotizaciones", icon: "📋" },
  { href: "/dashboard/reportes", label: "Reportes", icon: "📊" },
  { href: "/dashboard/configuracion", label: "Configuración", icon: "⚙" },
];

export default function DashboardShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-[#1a1a2e] flex">
      {/* Sidebar overlay (mobile) */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-20 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 h-full w-64 bg-[#16213e] border-r border-[#e94560]/20 z-30
          flex flex-col transition-transform duration-300
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
          md:translate-x-0 md:static md:z-auto
        `}
      >
        {/* Logo */}
        <div className="flex items-center gap-2 px-5 h-16 border-b border-[#e94560]/20 shrink-0">
          <span className="text-[#e94560] text-2xl">⚙</span>
          <span className="text-white font-bold text-xl tracking-tight">
            Taller<span className="text-[#e94560]">Pro</span>
          </span>
          <button
            className="ml-auto text-gray-400 hover:text-white md:hidden"
            onClick={() => setSidebarOpen(false)}
            aria-label="Cerrar menú"
          >
            ✕
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-4 px-3">
          <ul className="space-y-1">
            {navItems.map((item) => {
              const active =
                item.href === "/dashboard"
                  ? pathname === "/dashboard"
                  : pathname.startsWith(item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={`
                      flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                      ${active
                        ? "bg-[#e94560]/15 text-[#e94560] border border-[#e94560]/30"
                        : "text-gray-400 hover:text-white hover:bg-white/5"
                      }
                    `}
                  >
                    <span className="text-base w-5 text-center">{item.icon}</span>
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Bottom: storefront link */}
        <div className="px-3 py-4 border-t border-[#e94560]/20 shrink-0">
          <Link
            href="/"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-500 hover:text-gray-300 hover:bg-white/5 transition-colors"
          >
            <span className="text-base w-5 text-center">↗</span>
            Ver Storefront
          </Link>
        </div>
      </aside>

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="h-16 bg-[#16213e] border-b border-[#e94560]/20 flex items-center px-4 sm:px-6 gap-4 shrink-0">
          {/* Hamburger (mobile) */}
          <button
            className="md:hidden text-gray-400 hover:text-white p-1"
            onClick={() => setSidebarOpen(true)}
            aria-label="Abrir menú"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          {/* Page title slot — filled via CSS or portal if needed */}
          <div className="flex-1" />

          {/* Notifications */}
          <button
            className="relative text-gray-400 hover:text-white p-2 rounded-lg hover:bg-white/5 transition-colors"
            aria-label="Notificaciones"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            {/* Badge */}
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#e94560] rounded-full" />
          </button>

          {/* User menu */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:block text-right">
              <p className="text-white text-sm font-medium leading-none">Admin</p>
              <p className="text-gray-500 text-xs mt-0.5">Administrador</p>
            </div>
            <div className="w-9 h-9 rounded-full bg-[#e94560]/20 border border-[#e94560]/40 flex items-center justify-center text-[#e94560] font-bold text-sm">
              A
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto p-4 sm:p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={pathname}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
