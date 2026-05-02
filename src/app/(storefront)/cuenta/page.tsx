"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

// ── Icons ──────────────────────────────────────────────────────────────────

function IconUser() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
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

function IconClipboard() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
    </svg>
  );
}

function IconCalendar() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  );
}

function IconCheck() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
    </svg>
  );
}

function IconLock() {
  return (
    <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
    </svg>
  );
}

function IconSpinner() {
  return (
    <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
    </svg>
  );
}

function IconLogout() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
    </svg>
  );
}

function LogoutButton() {
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleLogout() {
    setLoggingOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  return (
    <div className="bg-[#16213e] border border-white/10 rounded-xl p-4">
      <button
        onClick={handleLogout}
        disabled={loggingOut}
        className="flex items-center gap-2 text-red-400 hover:text-red-300 disabled:opacity-60 text-sm font-medium transition-colors"
      >
        {loggingOut ? <IconSpinner /> : <IconLogout />}
        {loggingOut ? "Cerrando sesión…" : "Cerrar sesión"}
      </button>
    </div>
  );
}

// ── Types ──────────────────────────────────────────────────────────────────

interface Stats {
  vehicles: number;
  activeOrders: number;
  totalOrders: number;
  upcomingAppointments: number;
}

const inputClass =
  "w-full bg-[#1a1a2e] border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-[#e94560]/60 focus:ring-1 focus:ring-[#e94560]/30 transition-colors";

// ── Main Page ──────────────────────────────────────────────────────────────

export default function CuentaPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stats | null>(null);

  // Profile edit state
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const loadStats = useCallback(async (userId: string) => {
    const supabase = createClient();

    const [
      { data: vehicles },
      { data: orders },
      { data: appointments },
    ] = await Promise.all([
      supabase.from("vehicles").select("id").eq("owner_id", userId),
      supabase
        .from("work_orders")
        .select("id, status")
        .eq("client_id", userId),
      supabase
        .from("appointments")
        .select("id, status, date")
        .eq("client_id", userId)
        .gte("date", new Date().toISOString().slice(0, 10))
        .in("status", ["pending", "confirmed"]),
    ]);

    setStats({
      vehicles: vehicles?.length ?? 0,
      activeOrders: (orders ?? []).filter((o) => o.status !== "delivered").length,
      totalOrders: orders?.length ?? 0,
      upcomingAppointments: appointments?.length ?? 0,
    });
  }, []);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      setUser(user);
      setLoading(false);
      if (!user) return;

      // Load profile from profiles table
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, phone")
        .eq("id", user.id)
        .maybeSingle();

      setFullName(profile?.full_name ?? user.user_metadata?.full_name ?? "");
      setPhone(profile?.phone ?? "");
      loadStats(user.id);
    });
  }, [loadStats]);

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    setSaveError(null);
    setSaved(false);

    const supabase = createClient();
    const { error } = await supabase
      .from("profiles")
      .upsert({
        id: user.id,
        full_name: fullName.trim() || null,
        phone: phone.trim() || null,
        email: user.email,
      });

    if (error) {
      setSaveError("Error al guardar. Intenta de nuevo.");
    } else {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
    setSaving(false);
  }

  // ── Loading ──────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#1a1a2e" }}>
        <div className="flex items-center gap-3 text-gray-400">
          <IconSpinner />
          <span className="text-sm">Cargando…</span>
        </div>
      </div>
    );
  }

  // ── Not logged in ────────────────────────────────────────────────────────

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: "#1a1a2e" }}>
        <div className="text-center max-w-sm">
          <div className="w-20 h-20 rounded-2xl bg-[#16213e] border border-white/10 flex items-center justify-center mx-auto mb-6 text-gray-500">
            <IconLock />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Acceso requerido</h1>
          <p className="text-gray-400 text-sm mb-8">
            Iniciá sesión para ver y editar tu cuenta.
          </p>
          <div className="flex flex-col gap-3">
            <Link
              href="/login"
              className="block w-full text-center py-3 px-6 rounded-xl font-semibold text-white transition-colors"
              style={{ backgroundColor: "#e94560" }}
            >
              Iniciar sesión
            </Link>
            <Link
              href="/registro"
              className="block w-full text-center py-3 px-6 rounded-xl font-semibold text-gray-300 border border-white/10 hover:border-white/20 hover:text-white transition-colors"
            >
              Crear cuenta
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const initials = (fullName || user.email || "?").slice(0, 2).toUpperCase();

  // ── Main view ────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#1a1a2e" }}>
      {/* Hero */}
      <div style={{ backgroundColor: "#16213e" }} className="border-b border-white/5 py-10">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-[#e94560]/10 border border-[#e94560]/20 flex items-center justify-center text-[#e94560] text-2xl font-bold shrink-0">
              {initials}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">{fullName || "Mi cuenta"}</h1>
              <p className="text-gray-400 text-sm mt-0.5">{user.email}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

        {/* Stats row */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { icon: <IconCar />, label: "Vehículos", value: stats.vehicles, href: "/mis-vehiculos" },
              { icon: <IconClipboard />, label: "Órdenes activas", value: stats.activeOrders, href: "/mis-ordenes" },
              { icon: <IconClipboard />, label: "Total servicios", value: stats.totalOrders, href: "/historial" },
              { icon: <IconCalendar />, label: "Citas próximas", value: stats.upcomingAppointments, href: "/mis-citas" },
            ].map((stat) => (
              <Link
                key={stat.label}
                href={stat.href}
                className="bg-[#16213e] border border-white/10 rounded-xl p-4 hover:border-[#e94560]/30 transition-colors group"
              >
                <div className="text-gray-500 group-hover:text-[#e94560] transition-colors mb-2">
                  {stat.icon}
                </div>
                <p className="text-2xl font-bold text-white">{stat.value}</p>
                <p className="text-gray-500 text-xs mt-0.5">{stat.label}</p>
              </Link>
            ))}
          </div>
        )}

        {/* Profile form */}
        <div className="bg-[#16213e] border border-white/10 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-5">
            <span className="text-gray-400"><IconUser /></span>
            <h2 className="text-white font-semibold text-sm uppercase tracking-wide">Datos personales</h2>
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-4">
            {saveError && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 text-red-400 text-sm">
                {saveError}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label htmlFor="full_name" className="block text-gray-400 text-xs font-medium">
                  Nombre completo
                </label>
                <input
                  id="full_name"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Tu nombre"
                  className={inputClass}
                />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="phone" className="block text-gray-400 text-xs font-medium">
                  Teléfono
                </label>
                <input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Ej. +52 55 1234 5678"
                  className={inputClass}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-gray-400 text-xs font-medium">Correo electrónico</label>
              <input
                type="email"
                value={user.email ?? ""}
                disabled
                className={`${inputClass} opacity-50 cursor-not-allowed`}
              />
              <p className="text-gray-600 text-xs">El correo no se puede cambiar desde aquí.</p>
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 bg-[#e94560] hover:bg-[#c73652] disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors"
              >
                {saving ? (
                  <>
                    <IconSpinner />
                    Guardando…
                  </>
                ) : saved ? (
                  <>
                    <IconCheck />
                    Guardado
                  </>
                ) : (
                  "Guardar cambios"
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Quick links */}
        <div className="bg-[#16213e] border border-white/10 rounded-xl divide-y divide-white/5">
          {[
            { href: "/mis-vehiculos", icon: <IconCar />, label: "Mis vehículos", desc: "Consultá los vehículos que tenés registrados en el taller" },
            { href: "/mis-ordenes", icon: <IconClipboard />, label: "Mis órdenes de trabajo", desc: "Revisá el estado y detalle de todas tus órdenes" },
            { href: "/mi-vehiculo", icon: <IconCar />, label: "Seguimiento en vivo", desc: "Seguí el progreso de las órdenes activas en tiempo real" },
            { href: "/historial", icon: <IconClipboard />, label: "Historial de servicios", desc: "Todos los trabajos realizados en tus vehículos" },
            { href: "/mis-citas", icon: <IconCalendar />, label: "Mis citas", desc: "Revisá y gestioná tus turnos agendados" },
            { href: "/mis-cotizaciones", icon: <IconClipboard />, label: "Mis cotizaciones", desc: "Consultá el estado de tus cotizaciones solicitadas" },
            { href: "/mis-facturas", icon: <IconClipboard />, label: "Mis facturas", desc: "Revisá las facturas emitidas por tus servicios" },
            { href: "/citas", icon: <IconCalendar />, label: "Agendar una cita", desc: "Reservá un turno para tu próximo servicio" },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-4 px-5 py-4 hover:bg-white/[0.03] transition-colors group"
            >
              <span className="text-gray-500 group-hover:text-[#e94560] transition-colors shrink-0">
                {item.icon}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-medium">{item.label}</p>
                <p className="text-gray-500 text-xs mt-0.5">{item.desc}</p>
              </div>
              <svg className="w-4 h-4 text-gray-600 group-hover:text-gray-400 transition-colors shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          ))}
        </div>

        {/* Logout */}
        <LogoutButton />

      </div>
    </div>
  );
}
