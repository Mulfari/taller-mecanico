"use client";

import { useState, useMemo, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { QuoteListItem, ClientOption, VehicleOption, InventoryOption, QuoteItemRow } from "@/lib/supabase/queries/quotes";
import type { QuoteStatus } from "@/types/database";

// ── Constants ──────────────────────────────────────────────────────────────

const STATUS_LABELS: Record<QuoteStatus, string> = {
  draft:    "Borrador",
  sent:     "Enviada",
  accepted: "Aceptada",
  rejected: "Rechazada",
};

const STATUS_BADGE: Record<QuoteStatus, string> = {
  draft:    "bg-gray-500/20 text-gray-300",
  sent:     "bg-blue-500/20 text-blue-300",
  accepted: "bg-green-500/20 text-green-300",
  rejected: "bg-red-500/20 text-red-300",
};

const inputClass =
  "w-full bg-[#1a1a2e] border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-[#e94560]/60 focus:ring-1 focus:ring-[#e94560]/30 transition-colors";

const selectClass =
  "w-full bg-[#1a1a2e] border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#e94560]/60 focus:ring-1 focus:ring-[#e94560]/30 transition-colors appearance-none";

// ── Icons ──────────────────────────────────────────────────────────────────

function IconSearch() {
  return <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" /></svg>;
}
function IconPlus() {
  return <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>;
}
function IconX() {
  return <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>;
}
function IconTrash() {
  return <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>;
}
function IconSend() {
  return <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>;
}
function IconSpinner() {
  return <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" /></svg>;
}
function IconChevronRight() {
  return <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>;
}
function IconFileText() {
  return <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>;
}

// ── New Quote Modal ────────────────────────────────────────────────────────

interface NewQuoteItem {
  id: string;
  type: "labor" | "part";
  description: string;
  quantity: number;
  unit_price: number;
}

interface NewQuoteForm {
  client_id: string;
  vehicle_id: string;
  valid_until: string;
}

const EMPTY_FORM: NewQuoteForm = { client_id: "", vehicle_id: "", valid_until: "" };

function newItem(): NewQuoteItem {
  return { id: String(Date.now() + Math.random()), type: "labor", description: "", quantity: 1, unit_price: 0 };
}

function NewQuoteModal({
  clients,
  vehicles,
  inventory,
  onClose,
  onSaved,
}: {
  clients: ClientOption[];
  vehicles: VehicleOption[];
  inventory: InventoryOption[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<NewQuoteForm>(EMPTY_FORM);
  const [items, setItems] = useState<NewQuoteItem[]>([newItem()]);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const clientVehicles = useMemo(
    () => vehicles.filter((v) => v.owner_id === form.client_id),
    [vehicles, form.client_id]
  );

  const total = useMemo(
    () => items.reduce((s, i) => s + i.quantity * i.unit_price, 0),
    [items]
  );

  function setField(field: keyof NewQuoteForm, value: string) {
    setForm((f) => ({ ...f, [field]: value, ...(field === "client_id" ? { vehicle_id: "" } : {}) }));
    setErrors((e) => ({ ...e, [field]: "" }));
  }

  function setItemField(id: string, field: keyof NewQuoteItem, value: string | number) {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, [field]: value } : i)));
  }

  function fillFromInventory(itemId: string, invId: string) {
    const inv = inventory.find((i) => i.id === invId);
    if (!inv) return;
    setItems((prev) =>
      prev.map((i) =>
        i.id === itemId ? { ...i, description: inv.name, unit_price: inv.sell_price, type: "part" } : i
      )
    );
  }

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!form.client_id) e.client_id = "Selecciona un cliente";
    if (!form.vehicle_id) e.vehicle_id = "Selecciona un vehículo";
    if (items.length === 0) e.items = "Agrega al menos un ítem";
    items.forEach((item, idx) => {
      if (!item.description.trim()) e[`desc_${idx}`] = "Requerido";
      if (item.unit_price <= 0) e[`price_${idx}`] = "Precio inválido";
    });
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      const quoteItems: QuoteItemRow[] = items.map((i) => ({
        id: i.id,
        type: i.type,
        description: i.description,
        quantity: i.quantity,
        unit_price: i.unit_price,
        total: i.quantity * i.unit_price,
      }));

      const res = await fetch("/api/quotes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_id: form.client_id,
          vehicle_id: form.vehicle_id,
          items: quoteItems,
          total,
          valid_until: form.valid_until || null,
        }),
      });

      if (!res.ok) throw new Error("Error al guardar");
      onSaved();
    } catch {
      setErrors({ submit: "Error al guardar la cotización. Intenta de nuevo." });
      setSaving(false);
    }
  }

  const fmt = (n: number) => `$${n.toLocaleString("es-MX", { minimumFractionDigits: 2 })}`;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 overflow-y-auto">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[#16213e] border border-white/10 rounded-2xl w-full max-w-2xl shadow-2xl my-8">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <h2 className="text-white font-semibold text-lg">Nueva cotización</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors" aria-label="Cerrar">
            <IconX />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-6">
          {errors.submit && (
            <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2">{errors.submit}</p>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                Cliente <span className="text-[#e94560]">*</span>
              </label>
              <select className={selectClass} value={form.client_id} onChange={(e) => setField("client_id", e.target.value)}>
                <option value="">Seleccionar cliente…</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>{c.full_name ?? c.email}</option>
                ))}
              </select>
              {errors.client_id && <p className="text-red-400 text-xs mt-1">{errors.client_id}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                Vehículo <span className="text-[#e94560]">*</span>
              </label>
              <select className={selectClass} value={form.vehicle_id} onChange={(e) => setField("vehicle_id", e.target.value)} disabled={!form.client_id}>
                <option value="">Seleccionar vehículo…</option>
                {clientVehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.brand} {v.model} {v.year}{v.plate ? ` · ${v.plate}` : ""}
                  </option>
                ))}
              </select>
              {errors.vehicle_id && <p className="text-red-400 text-xs mt-1">{errors.vehicle_id}</p>}
            </div>
          </div>

          <div className="max-w-xs">
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Válida hasta</label>
            <input type="date" className={inputClass} value={form.valid_until} onChange={(e) => setField("valid_until", e.target.value)} />
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-gray-300">Ítems de la cotización</h3>
              <button type="button" onClick={() => setItems((p) => [...p, newItem()])} className="inline-flex items-center gap-1.5 text-xs text-[#e94560] hover:text-[#c73652] transition-colors">
                <IconPlus /> Agregar ítem
              </button>
            </div>
            {errors.items && <p className="text-red-400 text-xs mb-2">{errors.items}</p>}

            <div className="space-y-3">
              {items.map((item, idx) => (
                <div key={item.id} className="bg-[#1a1a2e] border border-white/10 rounded-xl p-4 space-y-3">
                  <div className="flex items-center gap-3 flex-wrap">
                    <div className="flex rounded-lg overflow-hidden border border-white/10 text-xs">
                      {(["labor", "part"] as const).map((t) => (
                        <button key={t} type="button" onClick={() => setItemField(item.id, "type", t)}
                          className={`px-3 py-1.5 transition-colors ${item.type === t ? "bg-[#e94560] text-white" : "text-gray-400 hover:text-white"}`}>
                          {t === "labor" ? "Mano de obra" : "Repuesto"}
                        </button>
                      ))}
                    </div>
                    {item.type === "part" && (
                      <div className="relative flex-1 min-w-[160px]">
                        <select
                          className="w-full bg-[#16213e] border border-white/10 rounded-lg px-3 py-1.5 text-gray-400 text-xs focus:outline-none focus:border-[#e94560]/60 transition-colors appearance-none"
                          defaultValue=""
                          onChange={(e) => fillFromInventory(item.id, e.target.value)}
                        >
                          <option value="">Cargar del inventario…</option>
                          {inventory.map((inv) => (
                            <option key={inv.id} value={inv.id}>{inv.name} — {fmt(inv.sell_price)}</option>
                          ))}
                        </select>
                      </div>
                    )}
                    <button type="button" onClick={() => setItems((p) => p.filter((i) => i.id !== item.id))}
                      className="ml-auto text-gray-600 hover:text-red-400 transition-colors" aria-label="Eliminar ítem">
                      <IconTrash />
                    </button>
                  </div>

                  <div className="grid grid-cols-12 gap-2">
                    <div className="col-span-12 sm:col-span-6">
                      <input className={inputClass} placeholder="Descripción" value={item.description}
                        onChange={(e) => setItemField(item.id, "description", e.target.value)} />
                      {errors[`desc_${idx}`] && <p className="text-red-400 text-xs mt-1">{errors[`desc_${idx}`]}</p>}
                    </div>
                    <div className="col-span-4 sm:col-span-2">
                      <input type="number" min={1} className={inputClass} placeholder="Cant." value={item.quantity}
                        onChange={(e) => setItemField(item.id, "quantity", Math.max(1, Number(e.target.value)))} />
                    </div>
                    <div className="col-span-8 sm:col-span-4">
                      <input type="number" min={0} step={0.01} className={inputClass} placeholder="Precio unitario"
                        value={item.unit_price || ""}
                        onChange={(e) => setItemField(item.id, "unit_price", Number(e.target.value))} />
                      {errors[`price_${idx}`] && <p className="text-red-400 text-xs mt-1">{errors[`price_${idx}`]}</p>}
                    </div>
                  </div>

                  <div className="text-right text-xs text-gray-500">
                    Subtotal: <span className="text-gray-300 font-medium">{fmt(item.quantity * item.unit_price)}</span>
                  </div>
                </div>
              ))}
            </div>

            {items.length > 0 && (
              <div className="mt-4 flex justify-end">
                <div className="bg-[#1a1a2e] border border-white/10 rounded-xl px-5 py-3 flex items-center gap-6">
                  <span className="text-gray-400 text-sm">Total cotización</span>
                  <span className="text-[#e94560] text-xl font-bold">{fmt(total)}</span>
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-2 border-t border-white/10">
            <button type="button" onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-lg border border-white/10 text-gray-400 text-sm hover:text-white hover:border-white/20 transition-colors">
              Cancelar
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 inline-flex items-center justify-center gap-2 bg-[#e94560] hover:bg-[#c73652] disabled:opacity-60 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors">
              {saving ? <><IconSpinner /> Guardando…</> : "Guardar cotización"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────

export default function CotizacionesClient({
  quotes: initialQuotes,
  clients,
  vehicles,
  inventory,
}: {
  quotes: QuoteListItem[];
  clients: ClientOption[];
  vehicles: VehicleOption[];
  inventory: InventoryOption[];
}) {
  const router = useRouter();
  const [quotes, setQuotes] = useState(initialQuotes);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<QuoteStatus | "all">("all");
  const [showModal, setShowModal] = useState(false);
  const [sending, setSending] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return quotes.filter((quote) => {
      const matchesSearch =
        !q ||
        (quote.client_name ?? "").toLowerCase().includes(q) ||
        quote.vehicle_label.toLowerCase().includes(q) ||
        quote.id.toLowerCase().includes(q);
      const matchesStatus = filterStatus === "all" || quote.status === filterStatus;
      return matchesSearch && matchesStatus;
    });
  }, [quotes, search, filterStatus]);

  async function handleSend(id: string) {
    setSending(id);
    try {
      await fetch(`/api/quotes/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "sent" }),
      });
      setQuotes((prev) => prev.map((q) => (q.id === id ? { ...q, status: "sent" } : q)));
    } finally {
      setSending(null);
    }
  }

  function handleSaved() {
    setShowModal(false);
    startTransition(() => router.refresh());
  }

  function formatDate(d: string) {
    return new Date(d + "T00:00:00").toLocaleDateString("es-MX", {
      day: "2-digit", month: "short", year: "numeric",
    });
  }

  const fmt = (n: number) => `$${n.toLocaleString("es-MX", { minimumFractionDigits: 2 })}`;

  const counts = useMemo(() => ({
    all: quotes.length,
    draft: quotes.filter((q) => q.status === "draft").length,
    sent: quotes.filter((q) => q.status === "sent").length,
    accepted: quotes.filter((q) => q.status === "accepted").length,
    rejected: quotes.filter((q) => q.status === "rejected").length,
  }), [quotes]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Cotizaciones</h1>
          <p className="text-gray-500 text-sm mt-1">{quotes.length} cotizaciones en total</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 bg-[#e94560] hover:bg-[#c73652] text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          <IconPlus />
          Nueva cotización
        </button>
      </div>

      <div className="bg-[#16213e] border border-white/10 rounded-xl p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-gray-500">
            <IconSearch />
          </div>
          <input
            type="text"
            placeholder="Buscar por cliente, vehículo o ID…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#1a1a2e] border border-white/10 rounded-lg pl-9 pr-3 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-[#e94560]/60 focus:ring-1 focus:ring-[#e94560]/30 transition-colors"
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {(["all", "draft", "sent", "accepted", "rejected"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                filterStatus === s
                  ? "bg-[#e94560] text-white"
                  : "bg-white/5 text-gray-400 hover:text-white hover:bg-white/10"
              }`}
            >
              {s === "all" ? "Todas" : STATUS_LABELS[s]}
              <span className="ml-1.5 opacity-60">{counts[s]}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="bg-[#16213e] border border-white/10 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[700px]">
            <thead>
              <tr className="text-gray-500 text-xs uppercase tracking-wide border-b border-white/5">
                <th className="text-left py-3 px-4 font-medium">ID</th>
                <th className="text-left py-3 px-4 font-medium">Cliente</th>
                <th className="text-left py-3 px-4 font-medium">Vehículo</th>
                <th className="text-right py-3 px-4 font-medium">Total</th>
                <th className="text-center py-3 px-4 font-medium">Estado</th>
                <th className="text-left py-3 px-4 font-medium">Válida hasta</th>
                <th className="text-left py-3 px-4 font-medium">Creada</th>
                <th className="py-3 px-4" />
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center">
                    <div className="flex flex-col items-center gap-3 text-gray-600">
                      <IconFileText />
                      <span className="text-sm">No se encontraron cotizaciones.</span>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((quote) => (
                  <tr key={quote.id} className="hover:bg-white/[0.03] transition-colors">
                    <td className="py-3.5 px-4">
                      <span className="text-gray-400 font-mono text-xs">#{quote.id.slice(0, 8).toUpperCase()}</span>
                    </td>
                    <td className="py-3.5 px-4 text-white font-medium">{quote.client_name ?? "—"}</td>
                    <td className="py-3.5 px-4 text-gray-400 text-xs">{quote.vehicle_label}</td>
                    <td className="py-3.5 px-4 text-right text-white font-semibold">{fmt(quote.total)}</td>
                    <td className="py-3.5 px-4 text-center">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_BADGE[quote.status]}`}>
                        {STATUS_LABELS[quote.status]}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-gray-400 text-xs whitespace-nowrap">
                      {quote.valid_until ? formatDate(quote.valid_until) : <span className="text-gray-600">—</span>}
                    </td>
                    <td className="py-3.5 px-4 text-gray-400 text-xs whitespace-nowrap">
                      {formatDate(quote.created_at)}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center justify-end gap-2">
                        {quote.status === "draft" && (
                          <button
                            onClick={() => handleSend(quote.id)}
                            disabled={sending === quote.id}
                            className="inline-flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 disabled:opacity-50 transition-colors"
                            title="Enviar al cliente"
                          >
                            {sending === quote.id ? <IconSpinner /> : <IconSend />}
                            Enviar
                          </button>
                        )}
                        <Link
                          href={`/cotizacion/${quote.id}`}
                          target="_blank"
                          className="inline-flex items-center gap-1 text-gray-500 hover:text-[#e94560] text-xs transition-colors"
                          title="Ver vista del cliente"
                        >
                          Ver <IconChevronRight />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {filtered.length > 0 && (
          <div className="px-4 py-3 border-t border-white/5 text-gray-500 text-xs">
            Mostrando {filtered.length} de {quotes.length} cotizaciones
          </div>
        )}
      </div>

      {showModal && (
        <NewQuoteModal
          clients={clients}
          vehicles={vehicles}
          inventory={inventory}
          onClose={() => setShowModal(false)}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}
