'use client';

import type { Entity, Layer } from '@/lib/cad/types';
import { dist } from '@/lib/cad/geometry';

interface PropertiesPanelProps {
  entities: Entity[];
  selectedIds: Set<string>;
  layers: Layer[];
  onUpdateLayer: (ids: string[], layerId: string) => void;
  onUpdateColor: (ids: string[], color: string | null) => void;
}

export function PropertiesPanel({ entities, selectedIds, layers, onUpdateLayer, onUpdateColor }: PropertiesPanelProps) {
  const selected = entities.filter((e) => selectedIds.has(e.id));

  if (selected.length === 0) {
    return (
      <div className="p-3 text-sm text-base-muted">
        Nothing selected. Click an object, or drag a box to select several.
      </div>
    );
  }

  const commonLayer = selected.every((e) => e.layerId === selected[0].layerId) ? selected[0].layerId : '';

  return (
    <div className="flex flex-col gap-3 p-3 text-sm">
      <div className="font-semibold text-base-text">
        {selected.length === 1 ? describeEntity(selected[0]) : `${selected.length} objects selected`}
      </div>

      <label className="flex flex-col gap-1">
        <span className="text-xs text-base-muted">Layer</span>
        <select
          value={commonLayer}
          onChange={(e) => onUpdateLayer(Array.from(selectedIds), e.target.value)}
          className="rounded-md border border-base-border bg-base-bg px-2 py-1"
        >
          {commonLayer === '' && <option value="">— mixed —</option>}
          {layers.map((l) => (
            <option key={l.id} value={l.id}>
              {l.name}
            </option>
          ))}
        </select>
      </label>

      <div className="flex items-center justify-between">
        <span className="text-xs text-base-muted">Color override</span>
        <div className="flex items-center gap-1">
          <input
            type="color"
            defaultValue={selected[0].colorOverride || '#1f2937'}
            onChange={(e) => onUpdateColor(Array.from(selectedIds), e.target.value)}
            className="h-6 w-8 cursor-pointer rounded border border-base-border bg-transparent"
          />
          <button
            type="button"
            onClick={() => onUpdateColor(Array.from(selectedIds), null)}
            className="rounded-md border border-base-border px-2 py-1 text-xs text-base-muted hover:text-base-text"
          >
            Reset
          </button>
        </div>
      </div>

      {selected.length === 1 && <GeometryFields entity={selected[0]} />}
    </div>
  );
}

function describeEntity(e: Entity): string {
  switch (e.type) {
    case 'line':
      return 'Line';
    case 'rect':
      return 'Rectangle';
    case 'circle':
      return 'Circle';
    case 'arc':
      return 'Arc';
    case 'ellipse':
      return 'Ellipse';
    case 'polyline':
      return e.closed ? 'Closed polyline' : 'Polyline';
    case 'text':
      return 'Text';
    case 'dimension':
      return 'Dimension';
  }
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-xs">
      <span className="text-base-muted">{label}</span>
      <span className="font-mono text-base-text">{value}</span>
    </div>
  );
}

function GeometryFields({ entity: e }: { entity: Entity }) {
  switch (e.type) {
    case 'line':
      return (
        <div className="flex flex-col gap-1 border-t border-base-border pt-2">
          <Field label="Length" value={dist(e.p1, e.p2).toFixed(3)} />
          <Field label="Start" value={`${e.p1.x.toFixed(2)}, ${e.p1.y.toFixed(2)}`} />
          <Field label="End" value={`${e.p2.x.toFixed(2)}, ${e.p2.y.toFixed(2)}`} />
        </div>
      );
    case 'circle':
      return (
        <div className="flex flex-col gap-1 border-t border-base-border pt-2">
          <Field label="Radius" value={e.radius.toFixed(3)} />
          <Field label="Diameter" value={(e.radius * 2).toFixed(3)} />
          <Field label="Circumference" value={(2 * Math.PI * e.radius).toFixed(3)} />
        </div>
      );
    case 'arc':
      return (
        <div className="flex flex-col gap-1 border-t border-base-border pt-2">
          <Field label="Radius" value={e.radius.toFixed(3)} />
          <Field label="Center" value={`${e.center.x.toFixed(2)}, ${e.center.y.toFixed(2)}`} />
        </div>
      );
    case 'rect': {
      const w = Math.abs(e.p2.x - e.p1.x);
      const h = Math.abs(e.p2.y - e.p1.y);
      return (
        <div className="flex flex-col gap-1 border-t border-base-border pt-2">
          <Field label="Width" value={w.toFixed(3)} />
          <Field label="Height" value={h.toFixed(3)} />
          <Field label="Area" value={(w * h).toFixed(3)} />
        </div>
      );
    }
    case 'ellipse':
      return (
        <div className="flex flex-col gap-1 border-t border-base-border pt-2">
          <Field label="Radius X" value={e.rx.toFixed(3)} />
          <Field label="Radius Y" value={e.ry.toFixed(3)} />
        </div>
      );
    case 'polyline':
      return (
        <div className="flex flex-col gap-1 border-t border-base-border pt-2">
          <Field label="Vertices" value={String(e.points.length)} />
        </div>
      );
    case 'text':
      return (
        <div className="flex flex-col gap-1 border-t border-base-border pt-2">
          <Field label="Content" value={e.content} />
          <Field label="Height" value={e.height.toFixed(2)} />
        </div>
      );
    case 'dimension':
      return (
        <div className="flex flex-col gap-1 border-t border-base-border pt-2">
          <Field label="Distance" value={dist(e.p1, e.p2).toFixed(3)} />
        </div>
      );
    default:
      return null;
  }
}
