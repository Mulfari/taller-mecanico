"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";

// ── Icons ──────────────────────────────────────────────────────────────────

function IconSpinner() {
  return <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" /></svg>;
}
function IconUpload() {
  return <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>;
}
function IconCheck() {
  return <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>;
}
function IconStore() {
  return <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016c.896 0 1.7-.393 2.25-1.016a3.001 3.001 0 003.75.614m-16.5 0a3.004 3.004 0 01-.621-4.72L4.318 3.44A1.5 1.5 0 015.378 3h13.243a1.5 1.5 0 011.06.44l1.19 1.189a3 3 0 01-.621 4.72m-13.5 8.65h3.75a.75.75 0 00.75-.75V13.5a.75.75 0 00-.75-.75H6.75a.75.75 0 00-.75.75v3.75c0 .415.336.75.75.75z" /></svg>;
}

// ── Types ──────────────────────────────────────────────────────────────────

interface DaySchedule {
  open: string;
  close: string;
  closed: boolean;
}

type WeekSchedule = Record<string, DaySchedule>;

interface ShopConfigForm {
  name: string;
  logo_url: string;
  primary_color: string;
  secondary_color: string;
  phone: string;
  address: string;
  schedule: WeekSchedule;
}

// ── Constants ──────────────────────────────────────────────────────────────

const DAYS = [
  { key: "lunes",     label: "Lunes" },
  { key: "martes",    label: "Martes" },
  { key: "miercoles", label: "Miércoles" },
  { key: "jueves",    label: "Jueves" },
  { key: "viernes",   label: "Viernes" },
  { key: "sabado",    label: "Sábado" },
  { key: "domingo",   label: "Domingo" },
];

const DEFAULT_SCHEDULE: WeekSchedule = Object.fromEntries(
  DAYS.map(({ key }) => [
    key,
    { open: "09:00", close: "18:00", closed: key === "domingo" },
  ])
);

const EMPTY_FORM: ShopConfigForm = {
  name: "",
  logo_url: "",
  primary_color: "#e94560",
  secondary_color: "#16213e",
  phone: "",
  address: "",
  schedule: DEFAULT_SCHEDULE,
};

const inputClass =
  "w-full bg-[#1a1a2e] border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-[#e94560]/60 focus:ring-1 focus:ring-[#e94560]/30 transition-colors";

// ── Section wrapper ────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-[#16213e] border border-white/10 rounded-xl p-6 space-y-5">
      <h2 className="text-white font-semibold text-sm uppercase tracking-wide">{title}</h2>
      {children}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-gray-400 text-xs font-medium">{label}</label>
      {children}
    </div>
  );
}

// ── Color picker field ─────────────────────────────────────────────────────

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <Field label={label}>
      <div className="flex items-center gap-3">
        <div className="relative">
          <input
            type="color"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-10 h-10 rounded-lg border border-white/10 bg-[#1a1a2e] cursor-pointer p-0.5"
            aria-label={label}
          />
        </div>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`${inputClass} font-mono uppercase w-32`}
          maxLength={7}
          placeholder="#000000"
        />
        <div
          className="w-8 h-8 rounded-lg border border-white/10 shrink-0"
          style={{ backgroundColor: value }}
          aria-hidden="true"
        />
      </div>
    </Field>
  );
}

// ── Logo uploader ──────────────────────────────────────────────────────────

function LogoUploader({
  logoUrl,
  onUpload,
}: {
  logoUrl: string;
  onUpload: (url: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = useCallback(
    async (file: File) => {
      setUploading(true);
      setError(null);
      const supabase = createClient();
      const ext = file.name.split(".").pop();
      const path = `shop-config/logo.${ext}`;
      const { data, error: uploadError } = await supabase.storage
        .from("shop-assets")
        .upload(path, file, { upsert: true });

      if (uploadError || !data) {
        setError("Error al subir el logo");
        setUploading(false);
        return;
      }

      const { data: urlData } = supabase.storage
        .from("shop-assets")
        .getPublicUrl(data.path);

      onUpload(urlData.publicUrl);
      setUploading(false);
    },
    [onUpload]
  );

  return (
    <div className="flex items-center gap-4">
      {/* Preview */}
      <div className="shrink-0 w-20 h-20 rounded-xl bg-[#1a1a2e] border border-white/10 flex items-center justify-center overflow-hidden">
        {logoUrl ? (
          <Image src={logoUrl} alt="Logo del taller" width={80} height={80} className="object-contain" />
        ) : (
          <IconStore />
        )}
      </div>

      {/* Upload area */}
      <div className="flex-1">
        <div
          className="border-2 border-dashed border-white/10 rounded-xl p-4 text-center cursor-pointer hover:border-[#e94560]/40 transition-colors"
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
          aria-label="Subir logo"
        >
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
          />
          {uploading ? (
            <div className="flex items-center justify-center gap-2 text-gray-400 text-sm">
              <IconSpinner /> Subiendo...
            </div>
          ) : (
            <>
              <div className="flex justify-center text-gray-500 mb-1"><IconUpload /></div>
              <p className="text-gray-500 text-xs">PNG, JPG, SVG · máx 2 MB</p>
            </>
          )}
        </div>
        {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
      </div>
    </div>
  );
}

// ── Schedule editor ────────────────────────────────────────────────────────

function ScheduleEditor({
  schedule,
  onChange,
}: {
  schedule: WeekSchedule;
  onChange: (s: WeekSchedule) => void;
}) {
  function update(day: string, patch: Partial<DaySchedule>) {
    onChange({ ...schedule, [day]: { ...schedule[day], ...patch } });
  }

  return (
    <div className="space-y-2">
      {DAYS.map(({ key, label }) => {
        const day = schedule[key] ?? { open: "09:00", close: "18:00", closed: false };
        return (
          <div key={key} className="flex items-center gap-3">
            {/* Toggle */}
            <button
              type="button"
              onClick={() => update(key, { closed: !day.closed })}
              className={`relative inline-flex h-5 w-9 shrink-0 rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-[#e94560]/50 ${
                day.closed ? "bg-white/10" : "bg-[#e94560]"
              }`}
              role="switch"
              aria-checked={!day.closed}
              aria-label={`${label} abierto`}
            >
              <span
                className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${
                  day.closed ? "translate-x-0" : "translate-x-4"
                }`}
              />
            </button>

            {/* Day label */}
            <span className={`w-24 text-sm ${day.closed ? "text-gray-600" : "text-gray-300"}`}>
              {label}
            </span>

            {/* Hours */}
            {day.closed ? (
              <span className="text-gray-600 text-sm">Cerrado</span>
            ) : (
              <div className="flex items-center gap-2">
                <input
                  type="time"
                  value={day.open}
                  onChange={(e) => update(key, { open: e.target.value })}
                  className="bg-[#1a1a2e] border border-white/10 rounded-lg px-2 py-1.5 text-white text-sm focus:outline-none focus:border-[#e94560]/60 focus:ring-1 focus:ring-[#e94560]/30"
                  aria-label={`${label} apertura`}
                />
                <span className="text-gray-600 text-xs">—</span>
                <input
                  type="time"
                  value={day.close}
                  onChange={(e) => update(key, { close: e.target.value })}
                  className="bg-[#1a1a2e] border border-white/10 rounded-lg px-2 py-1.5 text-white text-sm focus:outline-none focus:border-[#e94560]/60 focus:ring-1 focus:ring-[#e94560]/30"
                  aria-label={`${label} cierre`}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────

export default function ConfiguracionPage() {
  const [form, setForm] = useState<ShopConfigForm>(EMPTY_FORM);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load existing config on mount
  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data } = await supabase
        .from("shop_config")
        .select("*")
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle();

      if (data) {
        setForm({
          name: data.name ?? "",
          logo_url: data.logo_url ?? "",
          primary_color: data.primary_color ?? "#e94560",
          secondary_color: data.secondary_color ?? "#16213e",
          phone: data.phone ?? "",
          address: data.address ?? "",
          schedule: data.schedule ?? DEFAULT_SCHEDULE,
        });
      }
      setLoading(false);
    }
    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function set<K extends keyof ShopConfigForm>(key: K, value: ShopConfigForm[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSaved(false);

    const supabase = createClient();
    const { data: existing } = await supabase
      .from("shop_config")
      .select("id")
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    const payload = {
      name: form.name,
      logo_url: form.logo_url || null,
      primary_color: form.primary_color,
      secondary_color: form.secondary_color,
      phone: form.phone,
      address: form.address,
      schedule: form.schedule,
    };

    const { error: saveError } = existing
      ? await supabase.from("shop_config").update(payload).eq("id", existing.id)
      : await supabase.from("shop_config").insert(payload);

    if (saveError) {
      setError("Error al guardar la configuración. Intenta de nuevo.");
    } else {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
    setSaving(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-2 text-gray-400">
          <IconSpinner />
          <span className="text-sm">Cargando configuración...</span>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Configuración del Taller</h1>
          <p className="text-gray-500 text-sm mt-1">
            Personaliza la apariencia y datos de contacto del storefront.
          </p>
        </div>
        <button
          type="submit"
          disabled={saving}
          className="shrink-0 flex items-center gap-2 bg-[#e94560] hover:bg-[#e94560]/90 disabled:opacity-60 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors"
        >
          {saving ? (
            <><IconSpinner /> Guardando...</>
          ) : saved ? (
            <><IconCheck /> Guardado</>
          ) : (
            "Guardar cambios"
          )}
        </button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Identidad */}
      <Section title="Identidad">
        <Field label="Nombre del taller">
          <input
            type="text"
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            className={inputClass}
            placeholder="Ej. Taller Mecánico García"
            required
          />
        </Field>
        <Field label="Logo">
          <LogoUploader
            logoUrl={form.logo_url}
            onUpload={(url) => set("logo_url", url)}
          />
        </Field>
      </Section>

      {/* Colores */}
      <Section title="Colores de marca">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <ColorField
            label="Color primario"
            value={form.primary_color}
            onChange={(v) => set("primary_color", v)}
          />
          <ColorField
            label="Color secundario"
            value={form.secondary_color}
            onChange={(v) => set("secondary_color", v)}
          />
        </div>
        {/* Preview strip */}
        <div className="flex gap-2 mt-1">
          <div
            className="h-8 flex-1 rounded-lg border border-white/10"
            style={{ backgroundColor: form.primary_color }}
            aria-label="Vista previa color primario"
          />
          <div
            className="h-8 flex-1 rounded-lg border border-white/10"
            style={{ backgroundColor: form.secondary_color }}
            aria-label="Vista previa color secundario"
          />
        </div>
      </Section>

      {/* Contacto */}
      <Section title="Contacto">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <Field label="Teléfono">
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => set("phone", e.target.value)}
              className={inputClass}
              placeholder="Ej. +52 55 1234 5678"
            />
          </Field>
          <Field label="Dirección">
            <input
              type="text"
              value={form.address}
              onChange={(e) => set("address", e.target.value)}
              className={inputClass}
              placeholder="Ej. Av. Insurgentes 123, CDMX"
            />
          </Field>
        </div>
      </Section>

      {/* Horario */}
      <Section title="Horario de atención">
        <ScheduleEditor
          schedule={form.schedule}
          onChange={(s) => set("schedule", s)}
        />
      </Section>
    </form>
  );
}
