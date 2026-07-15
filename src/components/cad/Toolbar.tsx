'use client';

import {
  MousePointer2,
  Minus,
  Spline,
  Waypoints,
  RectangleHorizontal,
  Circle,
  Egg,
  Type,
  Ruler,
  Move,
  Copy,
  RotateCw,
  Maximize2,
  FlipHorizontal2,
  GitCommitHorizontal,
  Scissors,
  ArrowRightToLine,
  CornerDownRight,
  Eraser,
  Hand,
  type LucideIcon,
} from 'lucide-react';
import type { ToolName } from '@/lib/cad/types';
import { cn } from '@/lib/utils';

interface ToolDef {
  tool: ToolName;
  label: string;
  shortcut: string;
  icon: LucideIcon;
}

const DRAW_TOOLS: ToolDef[] = [
  { tool: 'line', label: 'Line', shortcut: 'L', icon: Minus },
  { tool: 'polyline', label: 'Polyline', shortcut: 'PL', icon: Waypoints },
  { tool: 'rect', label: 'Rectangle', shortcut: 'REC', icon: RectangleHorizontal },
  { tool: 'circle', label: 'Circle', shortcut: 'C', icon: Circle },
  { tool: 'arc', label: 'Arc', shortcut: 'A', icon: Spline },
  { tool: 'ellipse', label: 'Ellipse', shortcut: 'EL', icon: Egg },
  { tool: 'text', label: 'Text', shortcut: 'T', icon: Type },
  { tool: 'dimension', label: 'Dimension', shortcut: 'DLI', icon: Ruler },
];

const MODIFY_TOOLS: ToolDef[] = [
  { tool: 'move', label: 'Move', shortcut: 'M', icon: Move },
  { tool: 'copy', label: 'Copy', shortcut: 'CO', icon: Copy },
  { tool: 'rotate', label: 'Rotate', shortcut: 'RO', icon: RotateCw },
  { tool: 'scale', label: 'Scale', shortcut: 'SC', icon: Maximize2 },
  { tool: 'mirror', label: 'Mirror', shortcut: 'MI', icon: FlipHorizontal2 },
  { tool: 'offset', label: 'Offset', shortcut: 'O', icon: GitCommitHorizontal },
  { tool: 'trim', label: 'Trim', shortcut: 'TR', icon: Scissors },
  { tool: 'extend', label: 'Extend', shortcut: 'EX', icon: ArrowRightToLine },
  { tool: 'fillet', label: 'Fillet', shortcut: 'F', icon: CornerDownRight },
  { tool: 'erase', label: 'Erase', shortcut: 'E', icon: Eraser },
];

interface ToolbarProps {
  activeTool: ToolName;
  onSelect: (tool: ToolName) => void;
}

export function Toolbar({ activeTool, onSelect }: ToolbarProps) {
  return (
    <div className="flex w-16 shrink-0 flex-col items-center gap-1 overflow-y-auto border-r border-base-border bg-base-surface py-2 sm:w-[72px]">
      <ToolButton
        active={activeTool === 'select'}
        label="Select"
        shortcut="Esc"
        icon={MousePointer2}
        onClick={() => onSelect('select')}
      />
      <ToolButton active={activeTool === 'pan'} label="Pan" shortcut="Space" icon={Hand} onClick={() => onSelect('pan')} />
      <Divider label="Draw" />
      {DRAW_TOOLS.map((t) => (
        <ToolButton key={t.tool} active={activeTool === t.tool} label={t.label} shortcut={t.shortcut} icon={t.icon} onClick={() => onSelect(t.tool)} />
      ))}
      <Divider label="Modify" />
      {MODIFY_TOOLS.map((t) => (
        <ToolButton key={t.tool} active={activeTool === t.tool} label={t.label} shortcut={t.shortcut} icon={t.icon} onClick={() => onSelect(t.tool)} />
      ))}
    </div>
  );
}

function Divider({ label }: { label: string }) {
  return (
    <div className="mt-2 flex w-full flex-col items-center gap-1 px-1 pb-1 pt-2 text-center">
      <span className="text-[9px] font-semibold uppercase tracking-wide text-base-muted">{label}</span>
      <div className="h-px w-8 bg-base-border" />
    </div>
  );
}

function ToolButton({
  active,
  label,
  shortcut,
  icon: Icon,
  onClick,
}: {
  active: boolean;
  label: string;
  shortcut: string;
  icon: LucideIcon;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      title={`${label} (${shortcut})`}
      onClick={onClick}
      className={cn(
        'group relative flex h-11 w-11 flex-col items-center justify-center rounded-xl transition-colors',
        active ? 'bg-accent text-accent-fg' : 'text-base-muted hover:bg-base-surface2 hover:text-base-text'
      )}
    >
      <Icon size={19} />
      <span className="mt-0.5 text-[8px] font-medium leading-none">{shortcut}</span>
    </button>
  );
}
