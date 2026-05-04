"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

// ── Icons ──────────────────────────────────────────────────────────────────

function IconSpinner() {
  return (
    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
    </svg>
  );
}

function IconCheck() {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
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

function IconTrash() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  );
}

function IconFileText() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  );
}

// ── Types ──────────────────────────────────────────────────────────────────

interface QuoteItem {
  description: string;
  quantity: number;
  unit_price: number;
}

// ── Helpers ────────────────────────────────────────────────────────────────

const inputClass =
  "w-full bg-surface border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/30 transition-colors";

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-gray-400 text-xs font-medium">
        {label}
        {required && <span className="text-primary ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────

function CotizacionForm() {
  const searchParams = useSearchParams();
  const repuestoId = searchParams.get("repuesto");
  const repuestoNombre = searchParams.get("nombre");

  // Contact
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");

  // Vehicle
  const [vehicleBrand, setVehicleBrand] = useState("");
  const [vehicleModel, setVehicleModel] = useState("");
  const [vehicleYear, setVehicleYear] = useState("");
  const [vehiclePlate, setVehiclePlate] = useState("");

  // Items
  const [items, setItems] = useState<QuoteItem[]>([]);

  // Notes
  const [notes, setNotes] = useState("");

  // State
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pre-fill item from query params
  useEffect(() => {
    if (repuestoNombre) {
      setItems([{ description: repuestoNombre, quantity: 1, unit_price: 0 }]);
    } else {
      setItems([{ description: "", quantity: 1, unit_price: 0 }]);
    }
  }, [repuestoNombre]);

  const addItem = useCallback(() => {
    setItems((prev) => [...prev, { description: "", quantity: 1, unit_price: 0 }]);
  }, []);

  const removeItem = useCallback((idx: number) => {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  }, []);

  const updateItem = useCallback((idx: number, patch: Partial<QuoteItem>) => {
    setItems((prev) => prev.map((item, i) => (i === idx ? { ...item, ...patch } : item)));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const validItems = items.filter((i) => i.description.trim());
    if (validItems.length === 0) {
      setError("Agrega al menos un ítem o servicio a cotizar.");
      return;
    }

    setSubmitting(true);
    try {
      const supabase = createClient();

      // Try to get logged-in user
      const { data: { user } } = await supabase.auth.getUser();

      const itemsPayload = validItems.map((i) => ({
        description: i.description.trim(),
        quantity: i.quantity,
        unit_price: i.unit_price,
        total: i.quantity * i.unit_price,
        type: "part",
      }));

      // For guest requests, prepend a contact-info item so the data isn't lost
      // (quotes table has no separate notes/contact columns)
      if (!user) {
        const vehiclePart = vehicleBrand || vehicleModel
          ? ` | Vehículo: ${[vehicleBrand, vehicleModel, vehicleYear, vehiclePlate].filter(Boolean).join(" ")}`
          : "";
        const notesPart = notes.trim() ? ` | Notas: ${notes.trim()}` : "";
        itemsPayload.unshift({
          description: `[Contacto] ${name} | Tel: ${phone}${email ? ` | Email: ${email}` : ""}${vehiclePart}${notesPart}`,
          quantity: 1,
          unit_price: 0,
          total: 0,
          type: "labor",
        });
      } else if (notes.trim()) {
        itemsPayload.push({
          description: `[Notas] ${notes.trim()}`,
          quantity: 1,
          unit_price: 0,
          total: 0,
          type: "labor",
        });
      }

      const total = itemsPayload.filter((i) => i.type === "part").reduce((s, i) => s + i.total, 0);

      const { error: insertError } = await supabase.from("quotes").insert({
        client_id: user?.id ?? null,
        vehicle_id: null,
        items: itemsPayload,
        total,
        status: "draft",
        valid_until: null,
      });

      if (insertError) throw insertError;
      setSubmitted(true);
    } catch (err) {
      console.error(err);
      setError("Ocurrió un error al enviar tu solicitud. Intenta de nuevo.");
    } finally {
      setSubmitting(false);
    }
  }

  // ── Success state ──────────────────────────────────────────────────────

  if (submitted) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 rounded-full bg-green-500/15 border border-green-500/30 flex items-center justify-center mx-auto mb-5 text-green-400">
            <IconCheck />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">¡Solicitud enviada!</h1>
          <p className="text-gray-400 text-sm mb-6">
            Recibimos tu solicitud de cotización. Nos pondremos en contacto contigo a la brevedad.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary-hover text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors"
            >
              Volver al inicio
            </Link>
            <Link
              href="/repuestos"
              className="inline-flex items-center justify-center gap-2 border border-white/10 hover:border-white/20 text-gray-300 hover:text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors"
            >
              Ver catálogo
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ── Form ───────────────────────────────────────────────────────────────

  return (
    <div className="max-w-2xl mx-auto px-4 py-10 sm:py-16">
      {/* Header */}
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 text-primary text-sm font-medium mb-3">
          <IconFileText />
          Cotización
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold text-white">Solicitar cotización</h1>
        <p className="text-gray-400 mt-2 text-sm">
          Completá el formulario y te enviamos el presupuesto a la brevedad.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Contact */}
        <div className="bg-secondary border border-white/10 rounded-xl p-6 space-y-4">
          <h2 className="text-white font-semibold text-sm uppercase tracking-wide">Datos de contacto</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Nombre completo" required>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={inputClass}
                placeholder="Juan García"
                required
              />
            </Field>
            <Field label="Teléfono" required>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className={inputClass}
                placeholder="+52 55 1234 5678"
                required
              />
            </Field>
          </div>
          <Field label="Correo electrónico">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputClass}
              placeholder="juan@ejemplo.com"
            />
          </Field>
        </div>

        {/* Vehicle */}
        <div className="bg-secondary border border-white/10 rounded-xl p-6 space-y-4">
          <h2 className="text-white font-semibold text-sm uppercase tracking-wide">Vehículo (opcional)</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Field label="Marca">
              <input
                type="text"
                value={vehicleBrand}
                onChange={(e) => setVehicleBrand(e.target.value)}
                className={inputClass}
                placeholder="Toyota"
              />
            </Field>
            <Field label="Modelo">
              <input
                type="text"
                value={vehicleModel}
                onChange={(e) => setVehicleModel(e.target.value)}
                className={inputClass}
                placeholder="Corolla"
              />
            </Field>
            <Field label="Año">
              <input
                type="number"
                value={vehicleYear}
                onChange={(e) => setVehicleYear(e.target.value)}
                className={inputClass}
                placeholder="2020"
                min={1900}
                max={new Date().getFullYear() + 1}
              />
            </Field>
            <Field label="Patente">
              <input
                type="text"
                value={vehiclePlate}
                onChange={(e) => setVehiclePlate(e.target.value.toUpperCase())}
                className={`${inputClass} font-mono`}
                placeholder="ABC123"
              />
            </Field>
          </div>
        </div>

        {/* Items */}
        <div className="bg-secondary border border-white/10 rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-white font-semibold text-sm uppercase tracking-wide">
              Ítems a cotizar
            </h2>
            <button
              type="button"
              onClick={addItem}
              className="inline-flex items-center gap-1.5 text-xs text-primary hover:text-primary-hover transition-colors"
            >
              <IconPlus />
              Agregar ítem
            </button>
          </div>

          {items.length === 0 && (
            <p className="text-gray-600 text-sm text-center py-4">
              Agrega al menos un repuesto o servicio a cotizar.
            </p>
          )}

          <div className="space-y-3">
            {items.map((item, idx) => (
              <div key={idx} className="flex gap-2 items-start">
                <div className="flex-1 grid grid-cols-1 sm:grid-cols-[1fr_80px_100px] gap-2">
                  <input
                    type="text"
                    value={item.description}
                    onChange={(e) => updateItem(idx, { description: e.target.value })}
                    className={inputClass}
                    placeholder="Descripción del repuesto o servicio"
                  />
                  <input
                    type="number"
                    value={item.quantity}
                    onChange={(e) => updateItem(idx, { quantity: Math.max(1, parseInt(e.target.value) || 1) })}
                    className={inputClass}
                    min={1}
                    aria-label="Cantidad"
                    title="Cantidad"
                  />
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600 text-sm">$</span>
                    <input
                      type="number"
                      value={item.unit_price || ""}
                      onChange={(e) => updateItem(idx, { unit_price: parseFloat(e.target.value) || 0 })}
                      className={`${inputClass} pl-6`}
                      placeholder="0.00"
                      min={0}
                      step="0.01"
                      aria-label="Precio unitario"
                      title="Precio unitario (opcional)"
                    />
                  </div>
                </div>
                {items.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeItem(idx)}
                    className="mt-2.5 text-gray-600 hover:text-red-400 transition-colors shrink-0"
                    aria-label="Eliminar ítem"
                  >
                    <IconTrash />
                  </button>
                )}
              </div>
            ))}
          </div>

          {items.length > 0 && (
            <p className="text-gray-600 text-xs">
              El precio es opcional — si no lo conocés, lo calculamos nosotros.
            </p>
          )}
        </div>

        {/* Notes */}
        <div className="bg-secondary border border-white/10 rounded-xl p-6 space-y-4">
          <h2 className="text-white font-semibold text-sm uppercase tracking-wide">Notas adicionales</h2>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className={`${inputClass} resize-none`}
            rows={3}
            placeholder="Describe el problema, síntomas del vehículo, o cualquier detalle relevante..."
          />
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 text-red-400 text-sm">
            {error}
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            type="submit"
            disabled={submitting}
            className="flex-1 flex items-center justify-center gap-2 bg-primary hover:bg-primary-hover disabled:opacity-60 text-white font-semibold py-3 px-6 rounded-xl transition-colors"
          >
            {submitting ? (
              <><IconSpinner /> Enviando...</>
            ) : (
              "Enviar solicitud"
            )}
          </button>
          <Link
            href="/repuestos"
            className="flex-1 flex items-center justify-center gap-2 border border-white/10 hover:border-white/20 text-gray-300 hover:text-white font-medium py-3 px-6 rounded-xl transition-colors text-sm"
          >
            Volver al catálogo
          </Link>
        </div>
      </form>
    </div>
  );
}

export default function CotizacionPage() {
  return (
    <Suspense fallback={
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex items-center gap-3 text-gray-500">
          <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
          </svg>
          <span className="text-sm">Cargando...</span>
        </div>
      </div>
    }>
      <CotizacionForm />
    </Suspense>
  );
}
