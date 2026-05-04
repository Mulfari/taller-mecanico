"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface ClientRatingProps {
  workOrderId: string;
  clientId: string;
  existingRating?: {
    id: string;
    rating: number;
    comment: string | null;
    created_at: string;
  } | null;
}

function StarIcon({ filled, hovered }: { filled: boolean; hovered: boolean }) {
  return (
    <svg
      className={`w-8 h-8 transition-colors ${
        filled
          ? "text-yellow-400"
          : hovered
          ? "text-yellow-300/60"
          : "text-gray-600"
      }`}
      fill={filled || hovered ? "currentColor" : "none"}
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.562.562 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.562.562 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
      />
    </svg>
  );
}

const RATING_LABELS: Record<number, string> = {
  1: "Malo",
  2: "Regular",
  3: "Bueno",
  4: "Muy bueno",
  5: "Excelente",
};

export default function ClientRating({
  workOrderId,
  clientId,
  existingRating,
}: ClientRatingProps) {
  const [rating, setRating] = useState(existingRating?.rating ?? 0);
  const [hoveredStar, setHoveredStar] = useState(0);
  const [comment, setComment] = useState(existingRating?.comment ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(!!existingRating);
  const [error, setError] = useState<string | null>(null);

  const isEditing = !saved;

  async function handleSubmit() {
    if (rating === 0) return;
    setSaving(true);
    setError(null);

    const supabase = createClient();

    try {
      if (existingRating) {
        const { error: updateError } = await supabase
          .from("work_order_ratings")
          .update({
            rating,
            comment: comment.trim() || null,
          })
          .eq("id", existingRating.id);

        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from("work_order_ratings")
          .insert({
            work_order_id: workOrderId,
            client_id: clientId,
            rating,
            comment: comment.trim() || null,
          });

        if (insertError) throw insertError;
      }

      setSaved(true);
    } catch (err) {
      setError("No se pudo guardar la calificación. Intenta de nuevo.");
      console.error(err);
    } finally {
      setSaving(false);
    }
  }

  if (saved && !isEditing) {
    return (
      <div className="bg-secondary border border-white/10 rounded-xl p-5 print:bg-white print:border print:border-gray-200 print:rounded-lg">
        <div className="flex items-center justify-between mb-3">
          <p className="text-gray-500 text-xs uppercase tracking-wide font-medium print:text-gray-400">
            Tu calificación
          </p>
          <button
            onClick={() => setSaved(false)}
            className="text-xs text-primary hover:text-primary-hover transition-colors print:hidden"
          >
            Editar
          </button>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-0.5" aria-label={`Calificación: ${rating} de 5 estrellas`}>
            {[1, 2, 3, 4, 5].map((star) => (
              <svg
                key={star}
                className={`w-6 h-6 ${star <= rating ? "text-yellow-400" : "text-gray-600"}`}
                fill={star <= rating ? "currentColor" : "none"}
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.562.562 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.562.562 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
                />
              </svg>
            ))}
          </div>
          <span className="text-sm text-yellow-400 font-medium">
            {RATING_LABELS[rating]}
          </span>
        </div>
        {comment && (
          <p className="text-gray-300 text-sm mt-3 bg-white/[0.03] rounded-lg px-4 py-3 border border-white/5 print:text-gray-800 print:bg-gray-50 print:border-gray-200">
            &ldquo;{comment}&rdquo;
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="bg-secondary border border-white/10 rounded-xl p-5 print:hidden">
      <p className="text-gray-500 text-xs uppercase tracking-wide font-medium mb-3">
        {existingRating ? "Editar calificación" : "¿Cómo fue tu experiencia?"}
      </p>

      <div className="flex items-center gap-1 mb-1" role="radiogroup" aria-label="Calificación">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => setRating(star)}
            onMouseEnter={() => setHoveredStar(star)}
            onMouseLeave={() => setHoveredStar(0)}
            className="p-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded transition-transform hover:scale-110"
            role="radio"
            aria-checked={rating === star}
            aria-label={`${star} estrella${star > 1 ? "s" : ""} — ${RATING_LABELS[star]}`}
          >
            <StarIcon
              filled={star <= rating}
              hovered={hoveredStar > 0 && star <= hoveredStar && star > rating}
            />
          </button>
        ))}
        {(rating > 0 || hoveredStar > 0) && (
          <span className="text-sm text-yellow-400 font-medium ml-2">
            {RATING_LABELS[hoveredStar || rating]}
          </span>
        )}
      </div>

      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Cuéntanos más sobre tu experiencia (opcional)"
        rows={3}
        maxLength={500}
        className="w-full mt-3 bg-[#1a1a2e] border border-white/10 rounded-lg px-4 py-3 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-[#e94560]/60 focus:ring-1 focus:ring-[#e94560]/30 transition-colors resize-none"
      />
      <div className="flex items-center justify-between mt-1">
        <span className="text-gray-600 text-xs">{comment.length}/500</span>
      </div>

      {error && (
        <p className="text-red-400 text-sm mt-2">{error}</p>
      )}

      <div className="flex items-center gap-3 mt-4">
        <button
          onClick={handleSubmit}
          disabled={rating === 0 || saving}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ backgroundColor: rating > 0 ? "var(--color-primary)" : undefined }}
        >
          {saving ? (
            <>
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Guardando…
            </>
          ) : existingRating ? (
            "Actualizar calificación"
          ) : (
            "Enviar calificación"
          )}
        </button>
        {existingRating && (
          <button
            onClick={() => {
              setRating(existingRating.rating);
              setComment(existingRating.comment ?? "");
              setSaved(true);
            }}
            className="text-sm text-gray-500 hover:text-white transition-colors"
          >
            Cancelar
          </button>
        )}
      </div>
    </div>
  );
}
