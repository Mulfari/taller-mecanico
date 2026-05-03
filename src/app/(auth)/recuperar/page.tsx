"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function RecuperarPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/nueva-contrasena`,
    });

    if (resetError) {
      setError("Error al enviar el correo. Verifica tu email e intenta de nuevo.");
      setLoading(false);
      return;
    }

    setSent(true);
    setLoading(false);
  }

  return (
    <div className="w-full max-w-md">
      <div className="bg-[#16213e] border border-white/10 rounded-2xl p-8 shadow-2xl">
        {sent ? (
          <div className="text-center">
            <div className="w-16 h-16 bg-green-500/10 border border-green-500/30 rounded-full flex items-center justify-center mx-auto mb-5">
              <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Revisa tu correo</h1>
            <p className="text-gray-400 text-sm mb-6">
              Si existe una cuenta con <span className="text-white font-medium">{email}</span>, recibirás un enlace para restablecer tu contraseña.
            </p>
            <p className="text-gray-500 text-xs mb-6">
              No olvides revisar tu carpeta de spam si no lo encuentras.
            </p>
            <div className="space-y-3">
              <button
                onClick={() => { setSent(false); setEmail(""); }}
                className="w-full bg-white/5 hover:bg-white/10 border border-white/10 text-white font-medium py-3 rounded-lg transition-colors text-sm"
              >
                Enviar de nuevo
              </button>
              <Link
                href="/login"
                className="block w-full text-center text-[#e94560] hover:text-white font-medium py-2 transition-colors text-sm"
              >
                Volver al inicio de sesión
              </Link>
            </div>
          </div>
        ) : (
          <>
            <div className="mb-6">
              <Link
                href="/login"
                className="inline-flex items-center gap-1.5 text-gray-400 hover:text-white text-sm transition-colors mb-4"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Volver
              </Link>
              <h1 className="text-2xl font-bold text-white mb-1">Recuperar contraseña</h1>
              <p className="text-gray-400 text-sm">
                Ingresa tu email y te enviaremos un enlace para restablecer tu contraseña.
              </p>
            </div>

            {error && (
              <div className="mb-5 flex items-start gap-3 bg-[#e94560]/10 border border-[#e94560]/30 rounded-lg px-4 py-3">
                <svg className="w-5 h-5 text-[#e94560] shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                </svg>
                <p className="text-[#e94560] text-sm">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1.5">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@email.com"
                  className="w-full bg-[#1a1a2e] border border-white/10 focus:border-[#e94560]/60 focus:ring-1 focus:ring-[#e94560]/30 text-white placeholder-gray-600 rounded-lg px-4 py-3 text-sm outline-none transition-colors"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#e94560] hover:bg-[#c73652] disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    Enviando...
                  </>
                ) : (
                  "Enviar enlace de recuperación"
                )}
              </button>
            </form>

            <p className="text-center text-gray-500 text-sm mt-6">
              ¿Recordaste tu contraseña?{" "}
              <Link href="/login" className="text-[#e94560] hover:text-white font-medium transition-colors">
                Ingresar
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
