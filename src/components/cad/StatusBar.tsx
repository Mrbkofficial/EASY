'use client';

import { Magnet, Grid3x3, MoveHorizontal, ZoomIn, ZoomOut, Maximize } from 'lucide-react';
import type { Point, ViewState } from '@/lib/cad/types';
import { cn } from '@/lib/utils';

interface StatusBarProps {
  cursor: Point | null;
  view: ViewState;
  snapEnabled: boolean;
  orthoEnabled: boolean;
  gridEnabled: boolean;
  onToggleSnap: () => void;
  onToggleOrtho: () => void;
  onToggleGrid: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoomExtents: () => void;
}

export function StatusBar({
  cursor,
  view,
  snapEnabled,
  orthoEnabled,
  gridEnabled,
  onToggleSnap,
  onToggleOrtho,
  onToggleGrid,
  onZoomIn,
  onZoomOut,
  onZoomExtents,
}: StatusBarProps) {
  return (
    <div className="flex items-center gap-3 border-t border-base-border bg-base-surface px-3 py-1 text-xs text-base-muted">
      <span className="font-mono tabular-nums">{cursor ? `${cursor.x.toFixed(2)}, ${cursor.y.toFixed(2)}` : '—, —'}</span>
      <span className="font-mono tabular-nums">{Math.round(view.scale * 100)}%</span>
      <div className="ml-auto flex items-center gap-1">
        <ToggleBtn active={gridEnabled} label="Grid" icon={Grid3x3} onClick={onToggleGrid} />
        <ToggleBtn active={snapEnabled} label="Snap" icon={Magnet} onClick={onToggleSnap} />
        <ToggleBtn active={orthoEnabled} label="Ortho" icon={MoveHorizontal} onClick={onToggleOrtho} />
        <div className="mx-1 h-4 w-px bg-base-border" />
        <IconBtn label="Zoom in" icon={ZoomIn} onClick={onZoomIn} />
        <IconBtn label="Zoom out" icon={ZoomOut} onClick={onZoomOut} />
        <IconBtn label="Zoom extents" icon={Maximize} onClick={onZoomExtents} />
      </div>
    </div>
  );
}

function ToggleBtn({ active, label, icon: Icon, onClick }: { active: boolean; label: string; icon: typeof Magnet; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      className={cn(
        'flex items-center gap-1 rounded-md px-1.5 py-0.5',
        active ? 'bg-accent/15 text-accent' : 'hover:bg-base-surface2 hover:text-base-text'
      )}
    >
      <Icon size={13} />
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}

function IconBtn({ label, icon: Icon, onClick }: { label: string; icon: typeof Magnet; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} title={label} className="rounded-md p-1 hover:bg-base-surface2 hover:text-base-text">
      <Icon size={13} />
    </button>
  );
}
