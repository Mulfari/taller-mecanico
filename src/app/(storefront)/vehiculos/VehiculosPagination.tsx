"use client"

import { useRouter, usePathname } from "next/navigation"

interface Props {
  currentPage: number
  totalPages: number
  currentParams: Record<string, string | undefined>
}

export default function VehiculosPagination({ currentPage, totalPages, currentParams }: Props) {
  const router = useRouter()
  const pathname = usePathname()

  const goTo = (page: number) => {
    const params = new URLSearchParams()
    for (const [k, v] of Object.entries(currentParams)) {
      if (v && k !== "pagina") params.set(k, v)
    }
    if (page > 1) params.set("pagina", String(page))
    router.push(`${pathname}?${params.toString()}`)
  }

  const pages: (number | "...")[] = []
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i)
  } else {
    pages.push(1)
    if (currentPage > 3) pages.push("...")
    for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
      pages.push(i)
    }
    if (currentPage < totalPages - 2) pages.push("...")
    pages.push(totalPages)
  }

  return (
    <div className="flex items-center justify-center gap-1">
      <button
        onClick={() => goTo(currentPage - 1)}
        disabled={currentPage === 1}
        className="px-3 py-2 rounded-lg text-sm text-gray-400 border border-white/10 hover:border-primary/30 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        ← Anterior
      </button>

      {pages.map((p, i) =>
        p === "..." ? (
          <span key={`ellipsis-${i}`} className="px-2 text-gray-500">
            …
          </span>
        ) : (
          <button
            key={p}
            onClick={() => goTo(p as number)}
            className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${
              p === currentPage
                ? "bg-primary text-white"
                : "text-gray-400 border border-white/10 hover:border-primary/30 hover:text-white"
            }`}
          >
            {p}
          </button>
        )
      )}

      <button
        onClick={() => goTo(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="px-3 py-2 rounded-lg text-sm text-gray-400 border border-white/10 hover:border-primary/30 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        Siguiente →
      </button>
    </div>
  )
}
