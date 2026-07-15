'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Undo2,
  Redo2,
  FilePlus2,
  Save,
  FolderOpen,
  Download,
  HelpCircle,
  PanelRightClose,
  PanelRightOpen,
  TerminalSquare,
} from 'lucide-react';
import type { CadDocument, Entity, Layer, Point, ToolName, ViewState } from '@/lib/cad/types';
import { boundingBox } from '@/lib/cad/geometry';
import { resolveCommand, TOOL_PROMPTS } from '@/lib/cad/commands';
import { exportDxf, importDxf } from '@/lib/cad/exportDxf';
import { exportSvg } from '@/lib/cad/exportSvg';
import { CadCanvas, type CadCanvasHandle, type EntityPatch } from './CadCanvas';
import { Toolbar } from './Toolbar';
import { LayersPanel } from './LayersPanel';
import { PropertiesPanel } from './PropertiesPanel';
import { CommandBar } from './CommandBar';
import { StatusBar } from './StatusBar';
import { useToast } from '@/context/ToastContext';
import { cn } from '@/lib/utils';

const STORAGE_KEY = 'easycad:document';
const PALETTE = ['#1f2937', '#dc2626', '#ea580c', '#ca8a04', '#16a34a', '#0891b2', '#2563eb', '#7c3aed', '#db2777'];

function defaultLayer(): Layer {
  return { id: 'layer-0', name: '0', color: '#1f2937', visible: true, locked: false };
}

function defaultDoc(): CadDocument {
  const l = defaultLayer();
  return { entities: [], layers: [l], currentLayerId: l.id };
}

function downloadText(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function CadApp() {
  const { toast } = useToast();
  const canvasRef = useRef<CadCanvasHandle>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dxfInputRef = useRef<HTMLInputElement>(null);

  const [doc, setDoc] = useState<CadDocument>(defaultDoc);
  const undoStack = useRef<CadDocument[]>([]);
  const redoStack = useRef<CadDocument[]>([]);
  const [, forceHistoryRerender] = useState(0);

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [activeTool, setActiveToolState] = useState<ToolName>('select');
  const [view, setView] = useState<ViewState>({ cx: 0, cy: 0, scale: 20 });
  const [canvasSize, setCanvasSize] = useState({ width: 1000, height: 700 });
  const [status, setStatus] = useState('');
  const [cursor, setCursor] = useState<Point | null>(null);
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [snapEnabled, setSnapEnabled] = useState(true);
  const [orthoEnabled, setOrthoEnabled] = useState(false);
  const [gridEnabled, setGridEnabled] = useState(true);
  const [offsetDistance, setOffsetDistance] = useState(5);
  const [filletRadius, setFilletRadius] = useState(5);
  const [panelOpen, setPanelOpen] = useState(true);
  const [commandBarOpen, setCommandBarOpen] = useState(true);
  const [helpOpen, setHelpOpen] = useState(false);

  // --- Load / autosave ---------------------------------------------------
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as CadDocument;
        if (parsed?.entities && parsed?.layers) setDoc(parsed);
      }
    } catch {
      // ignore corrupt storage
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(doc));
      } catch {
        // storage full or unavailable — ignore, explicit Save still works via download
      }
    }, 600);
    return () => clearTimeout(t);
  }, [doc]);

  // --- History -------------------------------------------------------------
  const pushUndo = useCallback((current: CadDocument) => {
    undoStack.current.push(current);
    if (undoStack.current.length > 100) undoStack.current.shift();
    redoStack.current = [];
    forceHistoryRerender((n) => n + 1);
  }, []);

  const commitPatch = useCallback(
    (patch: EntityPatch) => {
      setDoc((d) => {
        pushUndo(d);
        let next = d.entities;
        if (patch.remove?.length) next = next.filter((e) => !patch.remove!.includes(e.id));
        if (patch.update?.length) {
          const updates = new Map(patch.update.map((u) => [u.id, u]));
          next = next.map((e) => updates.get(e.id) ?? e);
        }
        if (patch.add?.length) next = [...next, ...patch.add];
        return { ...d, entities: next };
      });
    },
    [pushUndo]
  );

  const undo = useCallback(() => {
    const prev = undoStack.current.pop();
    if (!prev) return;
    setDoc((d) => {
      redoStack.current.push(d);
      return prev;
    });
    setSelectedIds(new Set());
    forceHistoryRerender((n) => n + 1);
  }, []);

  const redo = useCallback(() => {
    const next = redoStack.current.pop();
    if (!next) return;
    setDoc((d) => {
      undoStack.current.push(d);
      return next;
    });
    setSelectedIds(new Set());
    forceHistoryRerender((n) => n + 1);
  }, []);

  // --- Layers ----------------------------------------------------------
  function addLayer() {
    setDoc((d) => {
      pushUndo(d);
      const color = PALETTE[d.layers.length % PALETTE.length];
      const layer: Layer = { id: `layer-${Date.now().toString(36)}`, name: `Layer ${d.layers.length + 1}`, color, visible: true, locked: false };
      return { ...d, layers: [...d.layers, layer], currentLayerId: layer.id };
    });
  }

  function updateLayer(id: string, patch: Partial<Layer>) {
    setDoc((d) => ({ ...d, layers: d.layers.map((l) => (l.id === id ? { ...l, ...patch } : l)) }));
  }

  function deleteLayer(id: string) {
    setDoc((d) => {
      if (d.layers.length <= 1) return d;
      pushUndo(d);
      const remaining = d.layers.filter((l) => l.id !== id);
      const fallback = remaining[0].id;
      return {
        ...d,
        layers: remaining,
        currentLayerId: d.currentLayerId === id ? fallback : d.currentLayerId,
        entities: d.entities.map((e) => (e.layerId === id ? { ...e, layerId: fallback } : e)),
      };
    });
  }

  function updateEntitiesLayer(ids: string[], layerId: string) {
    if (!layerId) return;
    commitPatch({ update: ids.map((id) => ({ ...doc.entities.find((e) => e.id === id)!, layerId })) });
  }

  function updateEntitiesColor(ids: string[], color: string | null) {
    commitPatch({ update: ids.map((id) => ({ ...doc.entities.find((e) => e.id === id)!, colorOverride: color })) });
  }

  // --- View ---------------------------------------------------------------
  function zoomExtents() {
    if (doc.entities.length === 0) {
      setView({ cx: 0, cy: 0, scale: 20 });
      return;
    }
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const e of doc.entities) {
      const bb = boundingBox(e);
      minX = Math.min(minX, bb.min.x);
      minY = Math.min(minY, bb.min.y);
      maxX = Math.max(maxX, bb.max.x);
      maxY = Math.max(maxY, bb.max.y);
    }
    const w = Math.max(1, maxX - minX);
    const h = Math.max(1, maxY - minY);
    const pad = 1.15;
    const scale = Math.min(canvasSize.width / (w * pad), canvasSize.height / (h * pad));
    setView({ cx: (minX + maxX) / 2, cy: (minY + maxY) / 2, scale: Math.min(4000, Math.max(0.02, scale)) });
  }

  function zoomBy(factor: number) {
    setView((v) => ({ ...v, scale: Math.min(4000, Math.max(0.02, v.scale * factor)) }));
  }

  // --- Tool / command handling ---------------------------------------------
  function setActiveTool(tool: ToolName) {
    setActiveToolState(tool);
  }

  function newDrawing() {
    if (doc.entities.length > 0 && !window.confirm('Start a new drawing? Unsaved changes will be lost.')) return;
    setDoc(defaultDoc());
    setSelectedIds(new Set());
    undoStack.current = [];
    redoStack.current = [];
    setView({ cx: 0, cy: 0, scale: 20 });
  }

  function saveFile() {
    downloadText(`drawing-${Date.now()}.json`, JSON.stringify(doc, null, 2), 'application/json');
    toast('Drawing saved.', 'success');
  }

  function openFile(file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result)) as CadDocument;
        if (!parsed?.entities || !parsed?.layers) throw new Error('invalid');
        setDoc(parsed);
        setSelectedIds(new Set());
        undoStack.current = [];
        redoStack.current = [];
        toast('Drawing opened.', 'success');
      } catch {
        toast('That file is not a valid Easy CAD drawing.', 'error');
      }
    };
    reader.readAsText(file);
  }

  function importDxfFile(file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      const imported = importDxf(String(reader.result), doc.currentLayerId);
      if (imported.length === 0) {
        toast('No supported entities found in that DXF file.', 'error');
        return;
      }
      commitPatch({ add: imported });
      toast(`Imported ${imported.length} entities.`, 'success');
      setTimeout(zoomExtents, 0);
    };
    reader.readAsText(file);
  }

  function exportDxfFile() {
    downloadText(`drawing-${Date.now()}.dxf`, exportDxf(doc), 'application/dxf');
  }

  function exportSvgFile() {
    downloadText(`drawing-${Date.now()}.svg`, exportSvg(doc), 'image/svg+xml');
  }

  function exportPngFile() {
    const dataUrl = canvasRef.current?.exportPng();
    if (!dataUrl) return;
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `drawing-${Date.now()}.png`;
    a.click();
  }

  function handleCommandSubmit(raw: string) {
    setCommandHistory((h) => [...h.slice(-19), raw]);
    if (canvasRef.current?.submitText(raw)) return;
    const cmd = resolveCommand(raw);
    if (!cmd) {
      setStatus(`Unknown command: "${raw}". Try L, C, REC, TRIM, or a coordinate like 10,5.`);
      return;
    }
    switch (cmd) {
      case 'undo':
        undo();
        break;
      case 'redo':
        redo();
        break;
      case 'zoomextents':
        zoomExtents();
        break;
      case 'save':
        saveFile();
        break;
      case 'new':
        newDrawing();
        break;
      case 'delete':
        commitPatch({ remove: Array.from(selectedIds) });
        setSelectedIds(new Set());
        break;
      default:
        setActiveTool(cmd);
    }
  }

  // Global shortcuts (undo/redo) — skip while typing in an input.
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const tag = (document.activeElement?.tagName ?? '').toLowerCase();
      if (tag === 'input' || tag === 'textarea') return;
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        redo();
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [undo, redo]);

  const currentLayer = useMemo(() => doc.layers.find((l) => l.id === doc.currentLayerId), [doc]);

  return (
    <div className="flex h-dvh w-full flex-col bg-base-bg text-base-text">
      {/* Top bar */}
      <header className="flex items-center gap-1 border-b border-base-border bg-base-surface px-2 py-1.5">
        <Link href="/dashboard" className="mr-1 flex items-center gap-1 rounded-md px-2 py-1 text-xs text-base-muted hover:bg-base-surface2 hover:text-base-text">
          <ArrowLeft size={14} />
          Easy
        </Link>
        <span className="mr-2 hidden text-sm font-semibold sm:inline">Easy CAD</span>
        <div className="mx-1 h-5 w-px bg-base-border" />
        <HeaderBtn label="New" icon={FilePlus2} onClick={newDrawing} />
        <HeaderBtn label="Open" icon={FolderOpen} onClick={() => fileInputRef.current?.click()} />
        <HeaderBtn label="Save" icon={Save} onClick={saveFile} />
        <ExportMenu onDxf={exportDxfFile} onSvg={exportSvgFile} onPng={exportPngFile} onImportDxf={() => dxfInputRef.current?.click()} />
        <div className="mx-1 h-5 w-px bg-base-border" />
        <HeaderBtn label="Undo" icon={Undo2} disabled={undoStack.current.length === 0} onClick={undo} />
        <HeaderBtn label="Redo" icon={Redo2} disabled={redoStack.current.length === 0} onClick={redo} />
        <div className="ml-auto flex items-center gap-1">
          {(activeTool === 'offset' || activeTool === 'fillet') && (
            <label className="mr-2 flex items-center gap-1 text-xs text-base-muted">
              {activeTool === 'offset' ? 'Distance' : 'Radius'}
              <input
                type="number"
                value={activeTool === 'offset' ? offsetDistance : filletRadius}
                onChange={(e) => {
                  const v = parseFloat(e.target.value) || 0;
                  if (activeTool === 'offset') setOffsetDistance(v);
                  else setFilletRadius(v);
                }}
                className="w-16 rounded-md border border-base-border bg-base-bg px-1.5 py-0.5 text-xs"
              />
            </label>
          )}
          <HeaderBtn label="Commands" icon={HelpCircle} onClick={() => setHelpOpen((v) => !v)} />
          <HeaderBtn label="Command line" icon={TerminalSquare} active={commandBarOpen} onClick={() => setCommandBarOpen((v) => !v)} />
          <HeaderBtn label={panelOpen ? 'Hide panel' : 'Show panel'} icon={panelOpen ? PanelRightClose : PanelRightOpen} onClick={() => setPanelOpen((v) => !v)} />
        </div>
      </header>

      {helpOpen && <CommandHelp onClose={() => setHelpOpen(false)} />}

      {/* Body */}
      <div className="flex min-h-0 flex-1">
        <Toolbar activeTool={activeTool} onSelect={setActiveTool} />

        <div className="relative flex min-w-0 flex-1 flex-col">
          <div className="min-h-0 flex-1">
            <CadCanvas
              ref={canvasRef}
              entities={doc.entities}
              layers={doc.layers}
              currentLayerId={doc.currentLayerId}
              selectedIds={selectedIds}
              onSelectedIdsChange={setSelectedIds}
              activeTool={activeTool}
              onToolChange={setActiveTool}
              view={view}
              onViewChange={setView}
              snapEnabled={snapEnabled}
              orthoEnabled={orthoEnabled}
              gridEnabled={gridEnabled}
              offsetDistance={offsetDistance}
              filletRadius={filletRadius}
              onCommit={commitPatch}
              onStatus={setStatus}
              onCursor={setCursor}
              onSizeChange={setCanvasSize}
            />
          </div>
          {commandBarOpen && <CommandBar status={status || TOOL_PROMPTS[activeTool] || ''} history={commandHistory} onSubmit={handleCommandSubmit} />}
          <StatusBar
            cursor={cursor}
            view={view}
            snapEnabled={snapEnabled}
            orthoEnabled={orthoEnabled}
            gridEnabled={gridEnabled}
            onToggleSnap={() => setSnapEnabled((v) => !v)}
            onToggleOrtho={() => setOrthoEnabled((v) => !v)}
            onToggleGrid={() => setGridEnabled((v) => !v)}
            onZoomIn={() => zoomBy(1.25)}
            onZoomOut={() => zoomBy(0.8)}
            onZoomExtents={zoomExtents}
          />
        </div>

        {panelOpen && (
          <div className="flex w-64 shrink-0 flex-col border-l border-base-border bg-base-surface">
            <div className="h-1/2 min-h-0 border-b border-base-border">
              <LayersPanel
                layers={doc.layers}
                currentLayerId={doc.currentLayerId}
                onSetCurrent={(id) => setDoc((d) => ({ ...d, currentLayerId: id }))}
                onAdd={addLayer}
                onUpdate={updateLayer}
                onDelete={deleteLayer}
              />
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto">
              <PropertiesPanel
                entities={doc.entities}
                selectedIds={selectedIds}
                layers={doc.layers}
                onUpdateLayer={updateEntitiesLayer}
                onUpdateColor={updateEntitiesColor}
              />
            </div>
          </div>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="application/json"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) openFile(f);
          e.target.value = '';
        }}
      />
      <input
        ref={dxfInputRef}
        type="file"
        accept=".dxf"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) importDxfFile(f);
          e.target.value = '';
        }}
      />

      <span className="sr-only">Current layer: {currentLayer?.name}</span>
    </div>
  );
}

function HeaderBtn({
  label,
  icon: Icon,
  onClick,
  disabled,
  active,
}: {
  label: string;
  icon: typeof Undo2;
  onClick: () => void;
  disabled?: boolean;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      title={label}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'flex items-center gap-1 rounded-md px-2 py-1 text-xs transition-colors disabled:cursor-not-allowed disabled:opacity-40',
        active ? 'bg-accent/15 text-accent' : 'text-base-muted hover:bg-base-surface2 hover:text-base-text'
      )}
    >
      <Icon size={14} />
      <span className="hidden md:inline">{label}</span>
    </button>
  );
}

function ExportMenu({
  onDxf,
  onSvg,
  onPng,
  onImportDxf,
}: {
  onDxf: () => void;
  onSvg: () => void;
  onPng: () => void;
  onImportDxf: () => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <HeaderBtn label="Export" icon={Download} onClick={() => setOpen((v) => !v)} />
      {open && (
        <div
          className="absolute left-0 top-full z-30 mt-1 w-44 rounded-lg border border-base-border bg-base-surface p-1 text-xs shadow-soft"
          onMouseLeave={() => setOpen(false)}
        >
          <MenuItem
            label="Export DXF"
            onClick={() => {
              onDxf();
              setOpen(false);
            }}
          />
          <MenuItem
            label="Export SVG"
            onClick={() => {
              onSvg();
              setOpen(false);
            }}
          />
          <MenuItem
            label="Export PNG"
            onClick={() => {
              onPng();
              setOpen(false);
            }}
          />
          <div className="my-1 h-px bg-base-border" />
          <MenuItem
            label="Import DXF…"
            onClick={() => {
              onImportDxf();
              setOpen(false);
            }}
          />
        </div>
      )}
    </div>
  );
}

function MenuItem({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="block w-full rounded-md px-2 py-1.5 text-left hover:bg-base-surface2">
      {label}
    </button>
  );
}

const HELP_GROUPS: { title: string; items: [string, string][] }[] = [
  {
    title: 'Draw',
    items: [
      ['L', 'Line'],
      ['PL', 'Polyline'],
      ['REC', 'Rectangle'],
      ['C', 'Circle'],
      ['A', 'Arc (3-point)'],
      ['EL', 'Ellipse'],
      ['T', 'Text'],
      ['DLI', 'Linear dimension'],
    ],
  },
  {
    title: 'Modify',
    items: [
      ['M', 'Move'],
      ['CO', 'Copy'],
      ['RO', 'Rotate'],
      ['SC', 'Scale'],
      ['MI', 'Mirror'],
      ['O', 'Offset'],
      ['TR', 'Trim'],
      ['EX', 'Extend'],
      ['F', 'Fillet'],
      ['E', 'Erase'],
    ],
  },
  {
    title: 'View / doc',
    items: [
      ['U', 'Undo'],
      ['REDO', 'Redo'],
      ['ZE', 'Zoom extents'],
      ['12,8', 'Absolute point'],
      ['@3,-2', 'Relative point'],
      ['5<45', 'Polar point (relative)'],
    ],
  },
];

function CommandHelp({ onClose }: { onClose: () => void }) {
  return (
    <div className="absolute right-2 top-11 z-30 w-[min(90vw,560px)] rounded-xl border border-base-border bg-base-surface p-4 shadow-soft">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm font-semibold">Command reference</span>
        <button type="button" onClick={onClose} className="text-xs text-base-muted hover:text-base-text">
          Close
        </button>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {HELP_GROUPS.map((g) => (
          <div key={g.title}>
            <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-base-muted">{g.title}</div>
            <div className="flex flex-col gap-0.5">
              {g.items.map(([k, v]) => (
                <div key={k} className="flex items-center justify-between text-xs">
                  <span className="rounded bg-base-surface2 px-1.5 py-0.5 font-mono">{k}</span>
                  <span className="text-base-muted">{v}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <p className="mt-3 text-[11px] text-base-muted">
        Type a command into the bar at the bottom and press Enter — just like AutoCAD. Or use the toolbar on the left.
        Click an object to select it, drag to move it, and press Delete to erase.
      </p>
    </div>
  );
}
