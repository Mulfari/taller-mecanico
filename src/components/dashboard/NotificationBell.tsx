"use client";

import { useState, useEffect, useRef, useTransition } from "react";
import Link from "next/link";
import { getNotificationsAction } from "@/app/(dashboard)/dashboard/actions";

export type Notification = {
  id: string;
  type: "ready_order" | "pending_appointment" | "low_stock";
  title: string;
  description: string;
  href: string;
};

function IconBell() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
    </svg>
  );
}

function IconCheck() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  );
}

const TYPE_STYLES: Record<Notification["type"], { dot: string; icon: string }> = {
  ready_order:         { dot: "bg-green-400",  icon: "text-green-400" },
  pending_appointment: { dot: "bg-blue-400",   icon: "text-blue-400" },
  low_stock:           { dot: "bg-orange-400", icon: "text-orange-400" },
};

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [isPending, startTransition] = useTransition();
  const ref = useRef<HTMLDivElement>(null);

  // Load notifications on mount
  useEffect(() => {
    startTransition(async () => {
      const data = await getNotificationsAction();
      setNotifications(data);
    });
  }, []);

  // Close on outside click
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

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative text-gray-400 hover:text-white p-2 rounded-lg hover:bg-white/5 transition-colors"
        aria-label={`Notificaciones${count > 0 ? ` (${count})` : ""}`}
        aria-expanded={open}
        aria-haspopup="true"
      >
        <IconBell />
        {count > 0 && (
          <span
            className="absolute top-1 right-1 min-w-[18px] h-[18px] bg-[#e94560] rounded-full text-white text-[10px] font-bold flex items-center justify-center px-1 leading-none"
            aria-hidden="true"
          >
            {count > 9 ? "9+" : count}
          </span>
        )}
      </button>

      {open && (
        <div
          className="absolute right-0 top-full mt-2 w-80 bg-[#16213e] border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden"
          role="dialog"
          aria-label="Panel de notificaciones"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
            <h2 className="text-white font-semibold text-sm">Notificaciones</h2>
            {count > 0 && (
              <button
                onClick={dismissAll}
                className="text-xs text-gray-400 hover:text-white transition-colors flex items-center gap-1"
              >
                <IconCheck />
                Marcar todas
              </button>
            )}
          </div>

          {/* List */}
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
                return (
                  <li key={n.id} className="flex items-start gap-3 px-4 py-3 hover:bg-white/[0.03] transition-colors group">
                    <span className={`mt-1.5 shrink-0 w-2 h-2 rounded-full ${styles.dot}`} aria-hidden="true" />
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

          {/* Footer */}
          {visible.length > 0 && (
            <div className="px-4 py-2.5 border-t border-white/10 bg-white/[0.02]">
              <p className="text-gray-600 text-xs text-center">
                {count} alerta{count !== 1 ? "s" : ""} activa{count !== 1 ? "s" : ""}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
