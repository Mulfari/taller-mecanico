"use client"

import { useState } from "react"
import Image from "next/image"

interface Photo {
  id: string
  url: string
  order: number
}

interface Props {
  photos: Photo[]
  vehicleName: string
}

export default function VehiculoGallery({ photos, vehicleName }: Props) {
  const [active, setActive] = useState(0)

  if (photos.length === 0) {
    return (
      <div
        className="rounded-2xl flex items-center justify-center aspect-video"
        style={{ backgroundColor: "var(--color-secondary)" }}
      >
        <svg className="w-24 h-24 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={0.8}
            d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={0.8} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="relative rounded-2xl overflow-hidden aspect-video bg-black">
        <Image
          src={photos[active].url}
          alt={`${vehicleName} - foto ${active + 1}`}
          fill
          className="object-cover"
          sizes="(max-width: 1024px) 100vw, 50vw"
          priority={active === 0}
        />
        {photos.length > 1 && (
          <>
            <button
              onClick={() => setActive((p) => (p - 1 + photos.length) % photos.length)}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full flex items-center justify-center bg-black/50 hover:bg-black/70 text-white transition-colors"
              aria-label="Foto anterior"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={() => setActive((p) => (p + 1) % photos.length)}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full flex items-center justify-center bg-black/50 hover:bg-black/70 text-white transition-colors"
              aria-label="Foto siguiente"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
            <span className="absolute bottom-3 right-3 text-xs text-white bg-black/50 px-2 py-1 rounded-full">
              {active + 1} / {photos.length}
            </span>
          </>
        )}
      </div>

      {photos.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {photos.map((photo, i) => (
            <button
              key={photo.id}
              onClick={() => setActive(i)}
              className={`relative flex-shrink-0 w-20 h-14 rounded-lg overflow-hidden border-2 transition-colors ${i === active ? "border-primary" : "border-transparent hover:border-white/30"}`}
            >
              <Image
                src={photo.url}
                alt={`${vehicleName} miniatura ${i + 1}`}
                fill
                className="object-cover"
                sizes="80px"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
