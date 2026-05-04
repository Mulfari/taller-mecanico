"use client";

import { useState, useEffect, useRef, useTransition } from "react";
import Link from "next/link";
import { getClientNotificationsAction, type ClientNotification } from "@/app/(storefront)/actions";

const TYPE_STYLES: Record<ClientNotification["type"], { dot: string }> = {
  order_ready:            { dot: "bg-green-400" },
  order_update:           { dot: "bg-blue-400" },
  appointment_confirmed:  { dot: "bg-purple-400" },
  quote_response:         { dot: "bg-yellow-400" },
  invoice_ready:          { dot: "bg-orange-400" },
};

const TYPE_ICONS: Record<ClientNotification["type"], string> = {
  order_ready:           "🔧",
  order_update:          "⚙️",
  appointment_confirmed: "📅",
  quote_response:        "📋",
  invoice_ready:         "💰",
};

export default function ClientNotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<ClientNotification[]>([]);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [isPending, startTransition] = useTransition();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    startTransition(async () => {
      const data = await getClientNotificationsAction();
      setNotifications(data);
    });
  }, []);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const visible = notifications.filter((n) => !dismissed.has(n.id));
  const count = visible.length;

  function dismiss(id: string) {
    setDismissed((prev) => new Set(prev).add(id));
  }

  function dismissAll() {
    setDismissed(new Set(notifications.map((n) => n.id)));
    setOpen(false);
  }

  if (count === 0 && !isPending) return null;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative text-gray-300 hover:text-white p-2 rounded-lg hover:bg-white/5 transition-colors"
        aria-label={`Notificaciones${count > 0 ? ` (${count})` : ""}`}
        aria-expanded={open}
        aria-haspopup="true"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {count > 0 && (
          <span
            className="absolute top-0.5 right-0.5 min-w-[18px] h-[18px] bg-[#e94560] rounded-full text-white text-[10px] font-bold flex items-center justify-center px-1 leading-none animate-pulse"
            aria-hidden="true"
          >
            {count > 9 ? "9+" : count}
          </span>
        )}
      </button>

      {open && (
        <div
          className="absolute right-0 top-full mt-2 w-80 bg-secondary border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden"
          role="dialog"
          aria-label="Panel de notificaciones"
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
            <h2 className="text-white font-semibold text-sm">Mis notificaciones</h2>
            {count > 0 && (
              <button
                onClick={dismissAll}
                className="text-xs text-gray-400 hover:text-white transition-colors flex items-center gap-1"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Marcar todas
              </button>
            )}
          </div>

          <ul className="max-h-80 overflow-y-auto divide-y divide-white/5">
            {isPending ? (
              <li className="px-4 py-8 text-center text-gray-500 text-sm">Cargando...</li>
            ) : visible.length === 0 ? (
              <li className="px-4 py-8 text-center text-gray-500 text-sm">
                Sin notificaciones pendientes
              </li>
            ) : (
              visible.map((n) => {
                const styles = TYPE_STYLES[n.type];
                const icon = TYPE_ICONS[n.type];
                return (
                  <li key={n.id} className="flex items-start gap-3 px-4 py-3 hover:bg-white/[0.03] transition-colors group">
                    <span className="mt-0.5 shrink-0 text-base" aria-hidden="true">{icon}</span>
                    <Link
                      href={n.href}
                      onClick={() => setOpen(false)}
                      className="flex-1 min-w-0"
                    >
                      <p className="text-white text-sm font-medium leading-snug">{n.title}</p>
                      <p className="text-gray-400 text-xs mt-0.5 leading-snug">{n.description}</p>
                    </Link>
                    <button
                      onClick={() => dismiss(n.id)}
                      className="shrink-0 text-gray-600 hover:text-gray-300 transition-colors opacity-0 group-hover:opacity-100 p-0.5"
                      aria-label={`Descartar: ${n.title}`}
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </li>
                );
              })
            )}
          </ul>

          {visible.length > 0 && (
            <div className="px-4 py-2.5 border-t border-white/10 bg-white/[0.02]">
              <p className="text-gray-500 text-xs text-center">
                {count} notificación{count !== 1 ? "es" : ""} pendiente{count !== 1 ? "s" : ""}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
