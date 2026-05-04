"use client";

export default function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 text-sm font-medium px-4 py-2 rounded-lg transition-colors"
    >
      Imprimir
    </button>
  );
}
