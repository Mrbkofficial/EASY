'use client';

import { useState } from 'react';
import { Eye, EyeOff, Lock, Unlock, Plus, Trash2 } from 'lucide-react';
import type { Layer } from '@/lib/cad/types';
import { cn } from '@/lib/utils';

const PALETTE = ['#1f2937', '#dc2626', '#ea580c', '#ca8a04', '#16a34a', '#0891b2', '#2563eb', '#7c3aed', '#db2777'];

interface LayersPanelProps {
  layers: Layer[];
  currentLayerId: string;
  onSetCurrent: (id: string) => void;
  onAdd: () => void;
  onUpdate: (id: string, patch: Partial<Layer>) => void;
  onDelete: (id: string) => void;
}

export function LayersPanel({ layers, currentLayerId, onSetCurrent, onAdd, onUpdate, onDelete }: LayersPanelProps) {
  const [pickerFor, setPickerFor] = useState<string | null>(null);

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-base-border px-3 py-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-base-muted">Layers</span>
        <button
          type="button"
          onClick={onAdd}
          className="flex h-6 w-6 items-center justify-center rounded-md text-base-muted hover:bg-base-surface2 hover:text-base-text"
          title="New layer"
        >
          <Plus size={14} />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto">
        {layers.map((l) => (
          <div
            key={l.id}
            className={cn(
              'flex items-center gap-2 border-b border-base-border/60 px-3 py-1.5 text-sm',
              l.id === currentLayerId && 'bg-accent/10'
            )}
            onClick={() => onSetCurrent(l.id)}
          >
            <button
              type="button"
              className="h-3.5 w-3.5 shrink-0 rounded-full border border-black/10"
              style={{ backgroundColor: l.color }}
              title="Change color"
              onClick={(e) => {
                e.stopPropagation();
                setPickerFor(pickerFor === l.id ? null : l.id);
              }}
            />
            <input
              value={l.name}
              onChange={(e) => onUpdate(l.id, { name: e.target.value })}
              onClick={(e) => e.stopPropagation()}
              className="min-w-0 flex-1 truncate bg-transparent text-sm outline-none"
            />
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onUpdate(l.id, { visible: !l.visible });
              }}
              className="text-base-muted hover:text-base-text"
              title={l.visible ? 'Hide layer' : 'Show layer'}
            >
              {l.visible ? <Eye size={14} /> : <EyeOff size={14} />}
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onUpdate(l.id, { locked: !l.locked });
              }}
              className="text-base-muted hover:text-base-text"
              title={l.locked ? 'Unlock layer' : 'Lock layer'}
            >
              {l.locked ? <Lock size={14} /> : <Unlock size={14} />}
            </button>
            {layers.length > 1 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(l.id);
                }}
                className="text-base-muted hover:text-danger"
                title="Delete layer"
              >
                <Trash2 size={14} />
              </button>
            )}
            {pickerFor === l.id && (
              <div className="absolute z-20 mt-8 grid grid-cols-5 gap-1 rounded-lg border border-base-border bg-base-surface p-2 shadow-soft">
                {PALETTE.map((c) => (
                  <button
                    key={c}
                    type="button"
                    className="h-5 w-5 rounded-full border border-black/10"
                    style={{ backgroundColor: c }}
                    onClick={(e) => {
                      e.stopPropagation();
                      onUpdate(l.id, { color: c });
                      setPickerFor(null);
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
