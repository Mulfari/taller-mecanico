"use client";

import { useState, useMemo, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ClientWithStats } from "@/lib/supabase/queries/clients";

function IconSearch() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
    </svg>
  );
}

function IconPlus() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
  );
}

function IconX() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

function IconChevronRight() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  );
}

function IconSpinner() {
  return (
    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
    </svg>
  );
}

const inputClass =
  "w-full bg-[#1a1a2e] border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-[#e94560]/60 focus:ring-1 focus:ring-[#e94560]/30 transition-colors";

interface NewClientForm { full_name: string; email: string; phone: string }
const EMPTY_FORM: NewClientForm = { full_name: "", email: "", phone: "" };

function AddClientModal({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [form, setForm] = useState<NewClientForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Partial<NewClientForm>>({});
  const [serverError, setServerError] = useState<string | null>(null);

  function set(field: keyof NewClientForm, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
    setErrors((e) => ({ ...e, [field]: undefined }));
    setServerError(null);
  }

  function validate(): boolean {
    const e: Partial<NewClientForm> = {};
    if (!form.full_name.trim()) e.full_name = "Requerido";
    if (!form.email.trim()) e.email = "Requerido";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Email inválido";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    setServerError(null);
    try {
      const res = await fetch("/api/clientes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: form.full_name.trim(),
          email: form.email.trim().toLowerCase(),
          phone: form.phone.trim() || null,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Error al guardar el cliente");
      }
      router.refresh();
      onClose();
    } catch (err) {
      setServerError(err instanceof Error ? err.message : "Error inesperado");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[#16213e] border border-white/10 rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <h2 className="text-white font-semibold text-lg">Nuevo cliente</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors" aria-label="Cerrar">
            <IconX />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {serverError && (
            <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
              {serverError}
            </p>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              Nombre completo <span className="text-[#e94560]">*</span>
            </label>
            <input className={inputClass} placeholder="Ej. Juan Pérez" value={form.full_name} onChange={(e) => set("full_name", e.target.value)} />
            {errors.full_name && <p className="text-red-400 text-xs mt-1">{errors.full_name}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              Correo electrónico <span className="text-[#e94560]">*</span>
            </label>
            <input type="email" className={inputClass} placeholder="juan@email.com" value={form.email} onChange={(e) => set("email", e.target.value)} />
            {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Teléfono</label>
            <input className={inputClass} placeholder="555-0000" value={form.phone} onChange={(e) => set("phone", e.target.value)} />
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-lg border border-white/10 text-gray-400 text-sm hover:text-white hover:border-white/20 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 inline-flex items-center justify-center gap-2 bg-[#e94560] hover:bg-[#c73652] disabled:opacity-60 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors"
            >
              {saving ? <><IconSpinner /> Guardando…</> : "Guardar cliente"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function formatDate(d: string) {
  return new Date(d + (d.includes("T") ? "" : "T00:00:00")).toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function ClientesClient({ clients }: { clients: ClientWithStats[] }) {
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [, startTransition] = useTransition();

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return clients;
    return clients.filter(
      (c) =>
        (c.full_name ?? "").toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        (c.phone ?? "").includes(q),
    );
  }, [clients, search]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Clientes</h1>
          <p className="text-gray-500 text-sm mt-1">{clients.length} clientes registrados</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="shrink-0 inline-flex items-center gap-2 bg-[#e94560] hover:bg-[#c73652] text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          <IconPlus />
          Nuevo cliente
        </button>
      </div>

      <div className="bg-[#16213e] border border-white/10 rounded-xl p-4">
        <div className="relative max-w-sm">
          <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-gray-500">
            <IconSearch />
          </div>
          <input
            type="text"
            placeholder="Buscar por nombre, email o teléfono…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#1a1a2e] border border-white/10 rounded-lg pl-9 pr-3 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-[#e94560]/60 focus:ring-1 focus:ring-[#e94560]/30 transition-colors"
          />
        </div>
      </div>

      <div className="bg-[#16213e] border border-white/10 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[640px]">
            <thead>
              <tr className="text-gray-500 text-xs uppercase tracking-wide border-b border-white/5">
                <th className="text-left py-3 px-4 font-medium">Cliente</th>
                <th className="text-left py-3 px-4 font-medium">Teléfono</th>
                <th className="text-center py-3 px-4 font-medium">Vehículos</th>
                <th className="text-left py-3 px-4 font-medium">Última visita</th>
                <th className="text-left py-3 px-4 font-medium">Cliente desde</th>
                <th className="py-3 px-4" />
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-500">
                    {search ? "No se encontraron clientes con esa búsqueda." : "No hay clientes registrados aún."}
                  </td>
                </tr>
              ) : (
                filtered.map((client) => (
                  <tr key={client.id} className="hover:bg-white/[0.03] transition-colors">
                    <td className="py-3.5 px-4">
                      <p className="text-white font-medium">{client.full_name ?? "—"}</p>
                      <p className="text-gray-500 text-xs mt-0.5">{client.email}</p>
                    </td>
                    <td className="py-3.5 px-4 text-gray-300">
                      {client.phone || <span className="text-gray-600">—</span>}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-white/10 text-gray-300 text-xs font-medium">
                        {client.vehicle_count}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-gray-400 text-xs whitespace-nowrap">
                      {client.last_visit ? formatDate(client.last_visit) : <span className="text-gray-600">Sin visitas</span>}
                    </td>
                    <td className="py-3.5 px-4 text-gray-400 text-xs whitespace-nowrap">
                      {formatDate(client.created_at)}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Link
                        href={`/dashboard/clientes/${client.id}`}
                        className="inline-flex items-center gap-1 text-gray-500 hover:text-[#e94560] text-xs transition-colors"
                      >
                        Ver <IconChevronRight />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {filtered.length > 0 && (
          <div className="px-4 py-3 border-t border-white/5 text-gray-500 text-xs">
            Mostrando {filtered.length} de {clients.length} clientes
          </div>
        )}
      </div>

      {showModal && <AddClientModal onClose={() => setShowModal(false)} />}
    </div>
  );
}
