'use client';

import dynamic from 'next/dynamic';

// The canvas engine touches window/localStorage/ResizeObserver — client-only.
const CadApp = dynamic(() => import('@/components/cad/CadApp').then((m) => m.CadApp), {
  ssr: false,
  loading: () => (
    <div className="flex h-dvh w-full items-center justify-center bg-base-bg text-sm text-base-muted">
      Loading Easy CAD…
    </div>
  ),
});

export function CadClient() {
  return <CadApp />;
}
