"use client";

import { useState, useEffect, useRef, useTransition, useCallback } from "react";
import Link from "next/link";
import { globalSearchAction, type SearchResult } from "@/app/(dashboard)/dashboard/actions";

const CATEGORY_LABELS: Record<SearchResult["category"], string> = {
  cliente:    "Cliente",
  vehiculo:   "Vehículo",
  orden:      "Orden",
  inventario: "Inventario",
};

const CATEGORY_COLORS: Record<SearchResult["category"], string> = {
  cliente:    "bg-blue-500/20 text-blue-300",
  vehiculo:   "bg-purple-500/20 text-purple-300",
  orden:      "bg-yellow-500/20 text-yellow-300",
  inventario: "bg-green-500/20 text-green-300",
};

function IconSearch() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
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

export default function GlobalSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const search = useCallback((q: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (q.trim().length < 2) {
      setResults([]);
      return;
    }
    debounceRef.current = setTimeout(() => {
      startTransition(async () => {
        const data = await globalSearchAction(q);
        setResults(data);
      });
    }, 250);
  }, []);

  useEffect(() => {
    search(query);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query, search]);

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Keyboard shortcut: Ctrl+K / Cmd+K
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        inputRef.current?.focus();
        setOpen(true);
      }
      if (e.key === "Escape") {
        setOpen(false);
        inputRef.current?.blur();
      }
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, []);

  const showDropdown = open && query.trim().length >= 2;

  return (
    <div ref={containerRef} className="relative flex-1 max-w-sm hidden sm:block">
      {/* Input */}
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none">
          {isPending ? <IconSpinner /> : <IconSearch />}
        </span>
        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          placeholder="Buscar clientes, vehículos, órdenes…"
          className="w-full bg-[#1a1a2e] border border-white/10 rounded-lg pl-9 pr-16 py-2 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-[#e94560]/50 focus:ring-1 focus:ring-[#e94560]/20 transition-colors"
          aria-label="Búsqueda global"
          aria-expanded={showDropdown}
          aria-haspopup="listbox"
          autoComplete="off"
        />
        <kbd className="absolute right-3 top-1/2 -translate-y-1/2 hidden lg:flex items-center gap-0.5 text-gray-600 text-xs pointer-events-none">
          <span className="font-sans">⌘</span>K
        </kbd>
      </div>

      {/* Dropdown */}
      {showDropdown && (
        <div
          className="absolute top-full left-0 right-0 mt-1.5 bg-[#16213e] border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden"
          role="listbox"
          aria-label="Resultados de búsqueda"
        >
          {results.length === 0 && !isPending ? (
            <p className="px-4 py-6 text-center text-gray-500 text-sm">
              Sin resultados para &ldquo;{query}&rdquo;
            </p>
          ) : (
            <ul className="max-h-80 overflow-y-auto divide-y divide-white/5 py-1">
              {results.map((r) => (
                <li key={`${r.category}-${r.id}`} role="option" aria-selected="false">
                  <Link
                    href={r.href}
                    onClick={() => { setOpen(false); setQuery(""); }}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-white/[0.04] transition-colors group"
                  >
                    <span
                      className={`shrink-0 text-xs font-medium px-2 py-0.5 rounded-full ${CATEGORY_COLORS[r.category]}`}
                    >
                      {CATEGORY_LABELS[r.category]}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-gray-200 text-sm font-medium truncate group-hover:text-white transition-colors">
                        {r.title}
                      </p>
                      <p className="text-gray-500 text-xs truncate mt-0.5">{r.subtitle}</p>
                    </div>
                    <svg className="w-3.5 h-3.5 text-gray-600 group-hover:text-gray-400 shrink-0 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                </li>
              ))}
            </ul>
          )}

          {results.length > 0 && (
            <div className="px-4 py-2 border-t border-white/5 bg-white/[0.02]">
              <p className="text-gray-600 text-xs">
                {results.length} resultado{results.length !== 1 ? "s" : ""}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
