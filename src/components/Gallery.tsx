'use client';

import { useState } from 'react';
import Image from 'next/image';

export function Gallery({ images, alt }: { images: string[]; alt: string }) {
  const [active, setActive] = useState(0);
  return (
    <div>
      <div className="relative aspect-square overflow-hidden rounded-2xl border border-neutral-200 bg-neutral-100">
        <Image
          src={images[active]}
          alt={alt}
          fill
          priority
          sizes="(max-width: 1024px) 100vw, 50vw"
          className="object-cover"
        />
      </div>
      {images.length > 1 && (
        <div className="mt-3 flex gap-3">
          {images.map((src, i) => (
            <button
              key={src}
              onClick={() => setActive(i)}
              className={`relative h-20 w-20 overflow-hidden rounded-lg border-2 ${
                i === active ? 'border-brand-600' : 'border-transparent'
              }`}
            >
              <Image src={src} alt={`${alt} ${i + 1}`} fill sizes="80px" className="object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
