'use client';

import { Printer } from 'lucide-react';

export function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-medium text-white shadow-soft transition hover:bg-teal-700 active:scale-[0.98]"
    >
      <Printer size={16} /> Print / Save as PDF
    </button>
  );
}
