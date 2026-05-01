"use client";

import { useEffect, useCallback } from "react";
import { create } from "zustand";

// ─── Toast store ────────────────────────────────────────────────────────────

type ToastType = "success" | "error" | "info";

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastStore {
  toasts: Toast[];
  add: (message: string, type?: ToastType) => void;
  remove: (id: string) => void;
}

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  add: (message, type = "info") => {
    const id = Math.random().toString(36).slice(2);
    set((s) => ({ toasts: [...s.toasts, { id, message, type }] }));
    setTimeout(() => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })), 4000);
  },
  remove: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));

export function toast(message: string, type: ToastType = "info") {
  useToastStore.getState().add(message, type);
}

// ─── ToastContainer ──────────────────────────────────────────────────────────

const TOAST_STYLES: Record<ToastType, string> = {
  success: "bg-green-500/15 border-green-500/30 text-green-300",
  error:   "bg-red-500/15 border-red-500/30 text-red-300",
  info:    "bg-blue-500/15 border-blue-500/30 text-blue-300",
};

const TOAST_ICONS: Record<ToastType, string> = {
  success: "✓",
  error:   "✕",
  info:    "ℹ",
};

export function ToastContainer() {
  const { toasts, remove } = useToastStore();

  return (
    <div className="fixed bottom-5 right-5 z-[100] flex flex-col gap-2 pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl border shadow-xl text-sm font-medium backdrop-blur-sm animate-in slide-in-from-right-4 fade-in duration-200 ${TOAST_STYLES[t.type]}`}
        >
          <span className="shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold border border-current">
            {TOAST_ICONS[t.type]}
          </span>
          <span className="flex-1 max-w-xs">{t.message}</span>
          <button
            onClick={() => remove(t.id)}
            className="shrink-0 opacity-60 hover:opacity-100 transition-opacity ml-1"
            aria-label="Cerrar"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}

// ─── Skeleton ────────────────────────────────────────────────────────────────

export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={`bg-white/5 rounded-lg animate-pulse ${className}`}
      aria-hidden="true"
    />
  );
}

export function SkeletonRow({ cols = 5 }: { cols?: number }) {
  return (
    <tr aria-hidden="true">
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="py-3.5 px-4">
          <Skeleton className="h-4 w-full" />
        </td>
      ))}
    </tr>
  );
}

export function SkeletonCard() {
  return (
    <div className="bg-[#16213e] border border-white/10 rounded-xl p-5 space-y-3" aria-hidden="true">
      <Skeleton className="h-5 w-1/3" />
      <Skeleton className="h-8 w-1/2" />
      <Skeleton className="h-3 w-2/3" />
    </div>
  );
}

// ─── EmptyState ──────────────────────────────────────────────────────────────

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-3xl mb-4">
        {icon}
      </div>
      <h3 className="text-white font-semibold text-base mb-1">{title}</h3>
      {description && <p className="text-gray-500 text-sm max-w-xs">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

// ─── ConfirmDialog ───────────────────────────────────────────────────────────

interface ConfirmDialogProps {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  title,
  message,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  danger = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const handleKey = useCallback(
    (e: KeyboardEvent) => { if (e.key === "Escape") onCancel(); },
    [onCancel]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [handleKey]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative bg-[#16213e] border border-white/10 rounded-2xl w-full max-w-sm shadow-2xl p-6">
        <h2 className="text-white font-semibold text-base mb-2">{title}</h2>
        <p className="text-gray-400 text-sm mb-6">{message}</p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2.5 rounded-lg border border-white/10 text-gray-400 text-sm hover:text-white hover:border-white/20 transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 px-4 py-2.5 rounded-lg text-white text-sm font-medium transition-colors ${
              danger
                ? "bg-red-600 hover:bg-red-700"
                : "bg-[#e94560] hover:bg-[#c73652]"
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
