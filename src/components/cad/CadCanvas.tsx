'use client';

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { Entity, Layer, LineEntity, Point, SnapResult, ToolName, ViewState } from '@/lib/cad/types';
import {
  add,
  arcFrom3Points,
  boundingBox,
  dist,
  entityKeyPoints,
  extendLine,
  filletLines,
  findSnapPoint,
  midpoint,
  mirrorEntity,
  nearestPointOnEntity,
  offsetCircleLike,
  offsetLineEntity,
  orthoSnap,
  parseCoordInput,
  rectCorners,
  rotateEntity,
  scaleEntity,
  sub,
  translateEntity,
  trimLine,
} from '@/lib/cad/geometry';
import { niceGridSpacing, screenToWorld, worldToScreen } from '@/lib/cad/view';

export interface EntityPatch {
  add?: Entity[];
  update?: Entity[];
  remove?: string[];
}

export interface CadCanvasHandle {
  submitText(raw: string): boolean;
  cancelDraft(): void;
  finishDraft(): void;
  exportPng(): string | null;
}

interface Draft {
  tool: ToolName;
  points: Point[];
  meta?: Record<string, unknown>;
}

interface CadCanvasProps {
  entities: Entity[];
  layers: Layer[];
  currentLayerId: string;
  selectedIds: Set<string>;
  onSelectedIdsChange: (ids: Set<string>) => void;
  activeTool: ToolName;
  onToolChange: (tool: ToolName) => void;
  view: ViewState;
  onViewChange: (view: ViewState) => void;
  snapEnabled: boolean;
  orthoEnabled: boolean;
  gridEnabled: boolean;
  offsetDistance: number;
  filletRadius: number;
  onCommit: (patch: EntityPatch) => void;
  onStatus: (text: string) => void;
  onCursor: (world: Point | null) => void;
  onSizeChange?: (size: { width: number; height: number }) => void;
}

const PICK_PX = 8;
const SNAP_PX = 12;

let uidCounter = 0;
function uid(prefix: string): string {
  uidCounter += 1;
  return `${prefix}-${Date.now().toString(36)}-${uidCounter}`;
}

function isDrawTool(tool: ToolName): boolean {
  return ['line', 'polyline', 'rect', 'circle', 'arc', 'ellipse', 'text', 'dimension'].includes(tool);
}

function needsSelectionFirst(tool: ToolName): boolean {
  return ['move', 'copy', 'rotate', 'scale', 'mirror', 'erase'].includes(tool);
}

export const CadCanvas = forwardRef<CadCanvasHandle, CadCanvasProps>(function CadCanvas(
  {
    entities,
    layers,
    currentLayerId,
    selectedIds,
    onSelectedIdsChange,
    activeTool,
    onToolChange,
    view,
    onViewChange,
    snapEnabled,
    orthoEnabled,
    gridEnabled,
    offsetDistance,
    filletRadius,
    onCommit,
    onStatus,
    onCursor,
    onSizeChange,
  },
  ref
) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 800, height: 600 });
  const [draft, setDraft] = useState<Draft | null>(null);
  const [mouseWorld, setMouseWorld] = useState<Point | null>(null);
  const [snapPoint, setSnapPoint] = useState<SnapResult | null>(null);
  const [hoverId, setHoverId] = useState<string | null>(null);
  const [selBox, setSelBox] = useState<{ start: Point; current: Point } | null>(null);
  const [dragMove, setDragMove] = useState<{ ids: string[]; delta: Point; startWorld: Point } | null>(null);
  const [panDrag, setPanDrag] = useState<{ startScreen: Point; startView: ViewState } | null>(null);
  const [textDraft, setTextDraft] = useState<{ world: Point; value: string } | null>(null);
  const spaceHeld = useRef(false);

  const layerMap = useMemo(() => new Map(layers.map((l) => [l.id, l])), [layers]);
  const pickable = useMemo(
    () => entities.filter((e) => (layerMap.get(e.layerId)?.visible ?? true) && !layerMap.get(e.layerId)?.locked),
    [entities, layerMap]
  );

  // --- Sizing -----------------------------------------------------------
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const r = entries[0].contentRect;
      const next = { width: Math.max(1, r.width), height: Math.max(1, r.height) };
      setSize(next);
      onSizeChange?.(next);
    });
    ro.observe(el);
    return () => ro.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toScreen = useCallback((p: Point) => worldToScreen(p, view, size.width, size.height), [view, size]);
  const toWorld = useCallback((p: Point) => screenToWorld(p, view, size.width, size.height), [view, size]);

  const entityColor = useCallback(
    (e: Entity) => e.colorOverride || layerMap.get(e.layerId)?.color || '#1f2937',
    [layerMap]
  );

  function cancel() {
    setDraft(null);
    setTextDraft(null);
    setSelBox(null);
    setDragMove(null);
    onStatus('');
  }

  useImperativeHandle(ref, () => ({
    submitText(raw: string) {
      return handleTypedInput(raw);
    },
    cancelDraft() {
      cancel();
    },
    finishDraft() {
      finalizeMultiPoint();
    },
    exportPng() {
      return canvasRef.current?.toDataURL('image/png') ?? null;
    },
  }));

  // Reset in-progress interaction whenever the tool changes externally.
  useEffect(() => {
    setDraft(null);
    setTextDraft(null);
    setSelBox(null);
    setDragMove(null);
    if (needsSelectionFirst(activeTool)) {
      if (selectedIds.size === 0) {
        onStatus('Select objects first, then choose this command.');
      } else if (activeTool === 'erase') {
        onCommit({ remove: Array.from(selectedIds) });
        onSelectedIdsChange(new Set());
        onToolChange('select');
      } else {
        onStatus(`${selectedIds.size} selected — click a base point.`);
      }
    } else if (activeTool === 'fillet') {
      onStatus('Click the first line to fillet.');
    } else if (activeTool === 'offset') {
      onStatus(`Offset distance ${offsetDistance} — click an object, then a side.`);
    } else if (activeTool === 'trim') {
      onStatus('Click a line segment to trim it.');
    } else if (activeTool === 'extend') {
      onStatus('Click near the end of a line to extend it.');
    } else if (isDrawTool(activeTool)) {
      onStatus(drawToolPrompt(activeTool, 0));
    } else {
      onStatus('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTool]);

  function drawToolPrompt(tool: ToolName, step: number): string {
    switch (tool) {
      case 'line':
        return step === 0 ? 'Specify first point (or type coordinates).' : 'Specify next point. Enter/Esc to finish.';
      case 'polyline':
        return step === 0 ? 'Specify first point.' : 'Specify next point. Enter to finish, click near start to close.';
      case 'rect':
        return step === 0 ? 'Specify first corner.' : 'Specify opposite corner.';
      case 'circle':
        return step === 0 ? 'Specify center point.' : 'Specify radius.';
      case 'arc':
        return ['Specify start point.', 'Specify a point on the arc.', 'Specify end point.'][step] ?? '';
      case 'ellipse':
        return ['Specify center point.', 'Specify end of first axis.', 'Specify other axis distance.'][step] ?? '';
      case 'text':
        return 'Specify insertion point.';
      case 'dimension':
        return ['Specify first extension line origin.', 'Specify second extension line origin.', 'Specify dimension line location.'][step] ?? '';
      default:
        return '';
    }
  }

  // --- Snapping / cursor --------------------------------------------------

  function computeSnap(worldRaw: Point): { world: Point; snap: SnapResult | null } {
    if (!snapEnabled) return { world: worldRaw, snap: null };
    const tol = SNAP_PX / view.scale;
    const grid = gridEnabled ? niceGridSpacing(view.scale) : null;
    const s = findSnapPoint(pickable, worldRaw, tol, grid);
    return { world: s ? s.point : worldRaw, snap: s };
  }

  function applyOrtho(from: Point | undefined, to: Point): Point {
    if (!orthoEnabled || !from) return to;
    return orthoSnap(from, to);
  }

  // --- Selection helpers ---------------------------------------------------

  function hitTest(world: Point): string | null {
    const tol = PICK_PX / view.scale;
    let best: { id: string; d: number } | null = null;
    for (let i = pickable.length - 1; i >= 0; i--) {
      const e = pickable[i];
      const { distance } = nearestPointOnEntity(e, world);
      if (distance <= tol && (!best || distance < best.d)) best = { id: e.id, d: distance };
    }
    return best ? best.id : null;
  }

  function entitiesInBox(worldMin: Point, worldMax: Point, window: boolean): string[] {
    const ids: string[] = [];
    for (const e of pickable) {
      const bb = boundingBox(e);
      if (window) {
        if (bb.min.x >= worldMin.x && bb.max.x <= worldMax.x && bb.min.y >= worldMin.y && bb.max.y <= worldMax.y) {
          ids.push(e.id);
        }
      } else {
        const overlap = bb.min.x <= worldMax.x && bb.max.x >= worldMin.x && bb.min.y <= worldMax.y && bb.max.y >= worldMin.y;
        if (overlap) ids.push(e.id);
      }
    }
    return ids;
  }

  // --- Pointer handling ------------------------------------------------

  function screenPointFromEvent(e: { clientX: number; clientY: number }): Point {
    const rect = canvasRef.current!.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      const screenP = screenPointFromEvent(e);
      const rawWorld = toWorld(screenP);

      if (panDrag) {
        const dx = (screenP.x - panDrag.startScreen.x) / panDrag.startView.scale;
        const dy = (screenP.y - panDrag.startScreen.y) / panDrag.startView.scale;
        onViewChange({ ...panDrag.startView, cx: panDrag.startView.cx - dx, cy: panDrag.startView.cy + dy });
        return;
      }

      const { world, snap } = computeSnap(rawWorld);
      setSnapPoint(snap);
      setMouseWorld(world);
      onCursor(world);

      if (dragMove) {
        setDragMove({ ...dragMove, delta: sub(world, dragMove.startWorld) });
        return;
      }

      if (selBox) {
        setSelBox({ ...selBox, current: screenP });
        return;
      }

      if (!draft) {
        if (activeTool === 'select' || activeTool === 'trim' || activeTool === 'extend') {
          setHoverId(hitTest(world));
        } else {
          setHoverId(null);
        }
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [panDrag, dragMove, selBox, draft, activeTool, view, size, pickable, snapEnabled, gridEnabled]
  );

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      containerRef.current?.focus();
      const screenP = screenPointFromEvent(e);
      const rawWorld = toWorld(screenP);
      const { world } = computeSnap(rawWorld);

      // Middle-mouse or space-drag pan works regardless of active tool.
      if (e.button === 1 || spaceHeld.current) {
        setPanDrag({ startScreen: screenP, startView: view });
        return;
      }
      if (e.button !== 0) return;

      if (activeTool === 'pan') {
        setPanDrag({ startScreen: screenP, startView: view });
        return;
      }

      if (isDrawTool(activeTool)) {
        handleDrawClick(world);
        return;
      }

      if (needsSelectionFirst(activeTool) && activeTool !== 'erase') {
        handleTransformClick(world);
        return;
      }

      if (activeTool === 'offset') {
        handleOffsetClick(world);
        return;
      }

      if (activeTool === 'trim') {
        const id = hitTest(world);
        if (id) {
          const line = entities.find((en) => en.id === id);
          if (line && line.type === 'line') {
            const cutters = pickable.filter((en) => en.id !== id);
            const result = trimLine(line, cutters, world);
            if (result) onCommit({ update: [result] });
            else onCommit({ remove: [id] });
            onStatus('Click another segment to trim, or Esc to finish.');
          } else {
            onStatus('Trim currently supports straight lines only.');
          }
        }
        return;
      }

      if (activeTool === 'extend') {
        const id = hitTest(world);
        if (id) {
          const line = entities.find((en) => en.id === id);
          if (line && line.type === 'line') {
            const boundaries = pickable.filter((en) => en.id !== id);
            const result = extendLine(line, boundaries, world);
            if (result) {
              onCommit({ update: [result] });
              onStatus('Click another line to extend, or Esc to finish.');
            } else {
              onStatus('No boundary found in that direction.');
            }
          } else {
            onStatus('Extend currently supports straight lines only.');
          }
        }
        return;
      }

      if (activeTool === 'fillet') {
        const id = hitTest(world);
        const picked = (draft?.meta?.picked as string[] | undefined) ?? [];
        if (id) {
          const line = entities.find((en) => en.id === id);
          if (!line || line.type !== 'line') {
            onStatus('Fillet currently supports straight lines only.');
            return;
          }
          if (picked.length === 0) {
            setDraft({ tool: 'fillet', points: [], meta: { picked: [id] } });
            onStatus('Click the second line to fillet.');
          } else if (picked[0] !== id) {
            const a = entities.find((en) => en.id === picked[0]) as LineEntity;
            const b = line;
            const result = filletLines(a, b, filletRadius);
            if (result) {
              onCommit({ update: [{ ...a, ...result.a }, { ...b, ...result.b }], add: [result.arc] });
              onStatus('Filleted. Click a line to fillet another pair.');
            } else {
              onStatus('Those lines are parallel or do not form a corner — cannot fillet.');
            }
            setDraft(null);
          }
        }
        return;
      }

      // select tool
      handleSelectClick(world, screenP, e.shiftKey);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [activeTool, view, size, pickable, entities, draft, selectedIds, offsetDistance, filletRadius]
  );

  const onPointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (panDrag) {
        setPanDrag(null);
        return;
      }
      if (dragMove) {
        if (dist(dragMove.delta, { x: 0, y: 0 }) > 1e-6) {
          onCommit({ update: dragMove.ids.map((id) => translateEntity(entities.find((en) => en.id === id)!, dragMove.delta)) });
        }
        setDragMove(null);
        return;
      }
      if (selBox) {
        const a = toWorld(selBox.start);
        const b = toWorld(selBox.current);
        const minX = Math.min(a.x, b.x);
        const maxX = Math.max(a.x, b.x);
        const minY = Math.min(a.y, b.y);
        const maxY = Math.max(a.y, b.y);
        const window = selBox.start.x <= selBox.current.x;
        const ids = entitiesInBox({ x: minX, y: minY }, { x: maxX, y: maxY }, window);
        if (ids.length > 0) {
          const next = new Set(e.shiftKey ? selectedIds : []);
          for (const id of ids) {
            if (e.shiftKey && selectedIds.has(id)) next.delete(id);
            else next.add(id);
          }
          onSelectedIdsChange(next);
        } else if (!e.shiftKey) {
          onSelectedIdsChange(new Set());
        }
        setSelBox(null);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [panDrag, dragMove, selBox, selectedIds, entities]
  );

  function handleSelectClick(world: Point, screenP: Point, shift: boolean) {
    const id = hitTest(world);
    if (id) {
      if (selectedIds.has(id)) {
        if (shift) {
          const next = new Set(selectedIds);
          next.delete(id);
          onSelectedIdsChange(next);
          return;
        }
        // Begin drag-move of the current selection.
        setDragMove({ ids: Array.from(selectedIds), delta: { x: 0, y: 0 }, startWorld: world });
        return;
      }
      const next = shift ? new Set(selectedIds) : new Set<string>();
      next.add(id);
      onSelectedIdsChange(next);
      setDragMove({ ids: Array.from(next), delta: { x: 0, y: 0 }, startWorld: world });
      return;
    }
    setSelBox({ start: screenP, current: screenP });
  }

  function handleOffsetClick(world: Point) {
    const picked = draft?.meta?.pickedId as string | undefined;
    if (!picked) {
      const id = hitTest(world);
      if (!id) return;
      const e = entities.find((en) => en.id === id);
      if (!e || !['line', 'circle', 'arc', 'rect'].includes(e.type)) {
        onStatus('Offset supports lines, rectangles, circles and arcs.');
        return;
      }
      setDraft({ tool: 'offset', points: [world], meta: { pickedId: id } });
      onStatus('Click a side to offset toward.');
      return;
    }
    const e = entities.find((en) => en.id === picked);
    if (!e) {
      setDraft(null);
      return;
    }
    let result: Entity | null = null;
    if (e.type === 'line') result = offsetLineEntity(e, offsetDistance, world);
    else if (e.type === 'circle' || e.type === 'arc') result = offsetCircleLike(e, offsetDistance, world);
    else if (e.type === 'rect') {
      const cx = (e.p1.x + e.p2.x) / 2;
      const cy = (e.p1.y + e.p2.y) / 2;
      const grow = Math.abs(world.x - cx) > Math.abs(e.p2.x - e.p1.x) / 2 || Math.abs(world.y - cy) > Math.abs(e.p2.y - e.p1.y) / 2;
      const sign = grow ? 1 : -1;
      const d = offsetDistance * sign;
      result = {
        ...e,
        p1: { x: e.p1.x < e.p2.x ? e.p1.x - d : e.p1.x + d, y: e.p1.y < e.p2.y ? e.p1.y - d : e.p1.y + d },
        p2: { x: e.p2.x < e.p1.x ? e.p2.x - d : e.p2.x + d, y: e.p2.y < e.p1.y ? e.p2.y - d : e.p2.y + d },
      };
    }
    if (result) {
      onCommit({ add: [{ ...result, id: uid(e.type) }] });
      onStatus('Offset. Click another object, or Esc to finish.');
    }
    setDraft(null);
  }

  function handleTransformClick(world: Point) {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    const step = draft?.points.length ?? 0;

    if (activeTool === 'move' || activeTool === 'copy') {
      if (step === 0) {
        setDraft({ tool: activeTool, points: [world] });
        onStatus('Specify destination point.');
      } else {
        const base = draft!.points[0];
        const delta = sub(world, base);
        if (activeTool === 'move') {
          onCommit({ update: ids.map((id) => translateEntity(entities.find((e) => e.id === id)!, delta)) });
        } else {
          const clones = ids.map((id) => ({ ...translateEntity(entities.find((e) => e.id === id)!, delta), id: uid('copy') }));
          onCommit({ add: clones });
          onSelectedIdsChange(new Set(clones.map((c) => c.id)));
        }
        setDraft(null);
        onToolChange('select');
      }
      return;
    }

    if (activeTool === 'rotate') {
      if (step === 0) {
        setDraft({ tool: 'rotate', points: [world] });
        onStatus('Specify rotation angle — move the mouse, click, or type degrees.');
      } else {
        const base = draft!.points[0];
        const angle = Math.atan2(world.y - base.y, world.x - base.x);
        onCommit({ update: ids.map((id) => rotateEntity(entities.find((e) => e.id === id)!, base, angle)) });
        setDraft(null);
        onToolChange('select');
      }
      return;
    }

    if (activeTool === 'scale') {
      if (step === 0) {
        setDraft({ tool: 'scale', points: [world] });
        onStatus('Specify scale factor — drag out to the desired size, click, or type a number.');
      } else {
        const base = draft!.points[0];
        const factor = Math.max(0.001, dist(base, world));
        onCommit({ update: ids.map((id) => scaleEntity(entities.find((e) => e.id === id)!, base, factor)) });
        setDraft(null);
        onToolChange('select');
      }
      return;
    }

    if (activeTool === 'mirror') {
      if (step === 0) {
        setDraft({ tool: 'mirror', points: [world] });
        onStatus('Specify second point of mirror line.');
      } else {
        const [a] = draft!.points;
        onCommit({ update: ids.map((id) => mirrorEntity(entities.find((e) => e.id === id)!, a, world)) });
        setDraft(null);
        onToolChange('select');
      }
      return;
    }
  }

  function handleDrawClick(world: Point) {
    const step = draft?.points.length ?? 0;
    const constrained = step > 0 ? applyOrtho(draft!.points[step - 1], world) : world;

    switch (activeTool) {
      case 'line': {
        if (step === 0) {
          setDraft({ tool: 'line', points: [constrained] });
        } else {
          onCommit({ add: [{ id: uid('line'), type: 'line', layerId: currentLayerId, p1: draft!.points[0], p2: constrained }] });
          setDraft({ tool: 'line', points: [constrained] }); // chain next segment
        }
        onStatus(drawToolPrompt('line', 1));
        return;
      }
      case 'polyline': {
        if (step > 1 && dist(constrained, draft!.points[0]) <= PICK_PX / view.scale) {
          onCommit({ add: [{ id: uid('pl'), type: 'polyline', layerId: currentLayerId, points: draft!.points, closed: true }] });
          setDraft(null);
          onStatus(drawToolPrompt('polyline', 0));
          return;
        }
        setDraft({ tool: 'polyline', points: [...(draft?.points ?? []), constrained] });
        onStatus(drawToolPrompt('polyline', 1));
        return;
      }
      case 'rect': {
        if (step === 0) {
          setDraft({ tool: 'rect', points: [constrained] });
          onStatus(drawToolPrompt('rect', 1));
        } else {
          onCommit({ add: [{ id: uid('rect'), type: 'rect', layerId: currentLayerId, p1: draft!.points[0], p2: constrained }] });
          setDraft(null);
          onStatus(drawToolPrompt('rect', 0));
        }
        return;
      }
      case 'circle': {
        if (step === 0) {
          setDraft({ tool: 'circle', points: [constrained] });
          onStatus(drawToolPrompt('circle', 1));
        } else {
          const radius = dist(draft!.points[0], constrained);
          onCommit({ add: [{ id: uid('circ'), type: 'circle', layerId: currentLayerId, center: draft!.points[0], radius }] });
          setDraft(null);
          onStatus(drawToolPrompt('circle', 0));
        }
        return;
      }
      case 'arc': {
        if (step < 2) {
          setDraft({ tool: 'arc', points: [...(draft?.points ?? []), constrained] });
          onStatus(drawToolPrompt('arc', step + 1));
        } else {
          const [a, b] = draft!.points;
          const res = arcFrom3Points(a, b, constrained);
          if (res) {
            onCommit({ add: [{ id: uid('arc'), type: 'arc', layerId: currentLayerId, ...res }] });
          }
          setDraft(null);
          onStatus(drawToolPrompt('arc', 0));
        }
        return;
      }
      case 'ellipse': {
        if (step === 0) {
          setDraft({ tool: 'ellipse', points: [constrained] });
          onStatus(drawToolPrompt('ellipse', 1));
        } else if (step === 1) {
          setDraft({ tool: 'ellipse', points: [...draft!.points, constrained] });
          onStatus(drawToolPrompt('ellipse', 2));
        } else {
          const [center, axisEnd] = draft!.points;
          const rx = dist(center, axisEnd);
          const rotation = Math.atan2(axisEnd.y - center.y, axisEnd.x - center.x);
          const ux = Math.cos(rotation);
          const uy = Math.sin(rotation);
          const rel = sub(constrained, center);
          const ry = Math.abs(-uy * rel.x + ux * rel.y);
          onCommit({ add: [{ id: uid('ell'), type: 'ellipse', layerId: currentLayerId, center, rx, ry: Math.max(0.01, ry), rotation }] });
          setDraft(null);
          onStatus(drawToolPrompt('ellipse', 0));
        }
        return;
      }
      case 'text': {
        setTextDraft({ world: constrained, value: '' });
        onStatus('Type the text, then press Enter.');
        return;
      }
      case 'dimension': {
        if (step < 2) {
          setDraft({ tool: 'dimension', points: [...(draft?.points ?? []), constrained] });
          onStatus(drawToolPrompt('dimension', step + 1));
        } else {
          const [p1, p2] = draft!.points;
          const dir = sub(p2, p1);
          const len = Math.hypot(dir.x, dir.y) || 1;
          const nx = -dir.y / len;
          const ny = dir.x / len;
          const rel = sub(constrained, p1);
          const offset = nx * rel.x + ny * rel.y;
          onCommit({ add: [{ id: uid('dim'), type: 'dimension', layerId: currentLayerId, p1, p2, offset }] });
          setDraft(null);
          onStatus(drawToolPrompt('dimension', 0));
        }
        return;
      }
    }
  }

  function finalizeMultiPoint() {
    if (draft?.tool === 'polyline' && draft.points.length >= 2) {
      onCommit({ add: [{ id: uid('pl'), type: 'polyline', layerId: currentLayerId, points: draft.points, closed: false }] });
      setDraft(null);
      onStatus(drawToolPrompt('polyline', 0));
    } else if (draft?.tool === 'line') {
      setDraft(null);
      onStatus(drawToolPrompt('line', 0));
    }
  }

  function commitTextDraft() {
    if (textDraft && textDraft.value.trim()) {
      onCommit({
        add: [
          {
            id: uid('text'),
            type: 'text',
            layerId: currentLayerId,
            position: textDraft.world,
            content: textDraft.value,
            height: 2.5,
            rotation: 0,
          },
        ],
      });
    }
    setTextDraft(null);
    onStatus(drawToolPrompt('text', 0));
  }

  function handleTypedInput(raw: string): boolean {
    const text = raw.trim();
    if (!text) return false;

    if (isDrawTool(activeTool) && draft) {
      const lastPoint = draft.points[draft.points.length - 1] ?? null;
      const p = parseCoordInput(text, lastPoint);
      if (p) {
        handleDrawClick(p);
        return true;
      }
    }
    if (isDrawTool(activeTool) && !draft) {
      const p = parseCoordInput(text, null);
      if (p) {
        handleDrawClick(p);
        return true;
      }
    }
    if ((activeTool === 'rotate' || activeTool === 'scale') && draft && draft.points.length === 1) {
      const num = parseFloat(text);
      if (!Number.isNaN(num)) {
        const ids = Array.from(selectedIds);
        const base = draft.points[0];
        if (activeTool === 'rotate') {
          const angle = (num * Math.PI) / 180;
          onCommit({ update: ids.map((id) => rotateEntity(entities.find((e) => e.id === id)!, base, angle)) });
        } else {
          onCommit({ update: ids.map((id) => scaleEntity(entities.find((e) => e.id === id)!, base, num)) });
        }
        setDraft(null);
        onToolChange('select');
        return true;
      }
    }
    if ((activeTool === 'move' || activeTool === 'copy') && draft && draft.points.length === 1) {
      const p = parseCoordInput(text, draft.points[0]);
      if (p) {
        handleTransformClick(p);
        return true;
      }
    }
    return false;
  }

  // --- Keyboard ----------------------------------------------------------

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const tag = (document.activeElement?.tagName ?? '').toLowerCase();
      if (tag === 'input' || tag === 'textarea') return;
      if (e.code === 'Space') spaceHeld.current = true;
      if (e.key === 'Escape') {
        cancel();
        onToolChange('select');
      } else if (e.key === 'Enter') {
        finalizeMultiPoint();
      } else if ((e.key === 'Delete' || e.key === 'Backspace') && selectedIds.size > 0 && activeTool === 'select') {
        e.preventDefault();
        onCommit({ remove: Array.from(selectedIds) });
        onSelectedIdsChange(new Set());
      }
    }
    function onKeyUp(e: KeyboardEvent) {
      if (e.code === 'Space') spaceHeld.current = false;
    }
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedIds, activeTool, draft]);

  // Wheel zoom needs a non-passive native listener so preventDefault() actually stops page scroll.
  const viewRef = useRef(view);
  viewRef.current = view;
  const sizeRef = useRef(size);
  sizeRef.current = size;
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const handler = (e: WheelEvent) => {
      e.preventDefault();
      const curView = viewRef.current;
      const curSize = sizeRef.current;
      const screenP = screenPointFromEvent(e);
      const before = screenToWorld(screenP, curView, curSize.width, curSize.height);
      const factor = Math.pow(1.0015, -e.deltaY);
      const newScale = Math.min(4000, Math.max(0.02, curView.scale * factor));
      const cx = before.x - (screenP.x - curSize.width / 2) / newScale;
      const cy = before.y + (screenP.y - curSize.height / 2) / newScale;
      onViewChange({ cx, cy, scale: newScale });
    };
    canvas.addEventListener('wheel', handler, { passive: false });
    return () => canvas.removeEventListener('wheel', handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- Rendering -----------------------------------------------------------

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
    canvas.width = size.width * dpr;
    canvas.height = size.height * dpr;
    canvas.style.width = `${size.width}px`;
    canvas.style.height = `${size.height}px`;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, size.width, size.height);

    // The drafting surface is always a light "paper" background, independent of the
    // app's own light/dark theme — layer colors are drawing data, not UI chrome, and
    // need a fixed, predictable background to stay legible (matches how most CAD
    // tools separate model-space color from the app's UI theme).
    const bg = '#ffffff';
    const gridMinor = '#eef0f4';
    const gridMajor = '#dfe3ea';
    const axisColor = '#c7cdd8';

    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, size.width, size.height);

    if (gridEnabled) {
      const spacing = niceGridSpacing(view.scale);
      const startWorld = toWorld({ x: 0, y: size.height });
      const endWorld = toWorld({ x: size.width, y: 0 });
      const x0 = Math.floor(startWorld.x / spacing) * spacing;
      const y0 = Math.floor(startWorld.y / spacing) * spacing;
      ctx.lineWidth = 1;
      for (let x = x0; x <= endWorld.x; x += spacing) {
        const sx = toScreen({ x, y: 0 }).x;
        ctx.strokeStyle = Math.abs(x) < spacing / 2 ? axisColor : gridMinor;
        ctx.beginPath();
        ctx.moveTo(sx + 0.5, 0);
        ctx.lineTo(sx + 0.5, size.height);
        ctx.stroke();
      }
      for (let y = y0; y <= endWorld.y; y += spacing) {
        const sy = toScreen({ x: 0, y }).y;
        ctx.strokeStyle = Math.abs(y) < spacing / 2 ? axisColor : gridMinor;
        ctx.beginPath();
        ctx.moveTo(0, sy + 0.5);
        ctx.lineTo(size.width, sy + 0.5);
        ctx.stroke();
      }
      void gridMajor;
    }

    // Entities
    for (const e of entities) {
      const layer = layerMap.get(e.layerId);
      if (layer && !layer.visible) continue;
      const isSelected = selectedIds.has(e.id);
      const isHover = hoverId === e.id;
      let renderEntity = e;
      if (isSelected && dragMove && dragMove.ids.includes(e.id)) {
        renderEntity = translateEntity(e, dragMove.delta);
      }
      drawEntity(ctx, renderEntity, entityColor(e), isSelected, isHover, toScreen);
    }

    // Draft preview
    if (draft && mouseWorld) {
      drawDraftPreview(ctx, draft, mouseWorld, toScreen, currentLayerId, layerMap);
    }

    // Transform previews (rotate/scale/mirror) drawn as ghost outlines.
    if (draft && (draft.tool === 'rotate' || draft.tool === 'scale' || draft.tool === 'mirror') && mouseWorld && draft.points.length >= 1) {
      ctx.setLineDash([4, 3]);
      const ids = Array.from(selectedIds);
      const base = draft.points[0];
      for (const id of ids) {
        const src = entities.find((en) => en.id === id);
        if (!src) continue;
        let ghost: Entity = src;
        if (draft.tool === 'rotate') {
          const angle = Math.atan2(mouseWorld.y - base.y, mouseWorld.x - base.x);
          ghost = rotateEntity(src, base, angle);
        } else if (draft.tool === 'scale') {
          const factor = Math.max(0.001, dist(base, mouseWorld));
          ghost = scaleEntity(src, base, factor);
        } else if (draft.tool === 'mirror') {
          ghost = mirrorEntity(src, base, mouseWorld);
        }
        drawEntity(ctx, ghost, '#22c55e', false, false, toScreen);
      }
      ctx.setLineDash([]);
    }

    // Selection box
    if (selBox) {
      const window = selBox.start.x <= selBox.current.x;
      ctx.strokeStyle = window ? '#3b82f6' : '#22c55e';
      ctx.fillStyle = window ? 'rgba(59,130,246,0.08)' : 'rgba(34,197,94,0.08)';
      ctx.setLineDash(window ? [] : [4, 3]);
      const x = Math.min(selBox.start.x, selBox.current.x);
      const y = Math.min(selBox.start.y, selBox.current.y);
      const w = Math.abs(selBox.current.x - selBox.start.x);
      const h = Math.abs(selBox.current.y - selBox.start.y);
      ctx.fillRect(x, y, w, h);
      ctx.strokeRect(x + 0.5, y + 0.5, w, h);
      ctx.setLineDash([]);
    }

    // Snap marker
    if (snapPoint) {
      const s = toScreen(snapPoint.point);
      ctx.strokeStyle = '#facc15';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      if (snapPoint.kind === 'endpoint') {
        ctx.strokeRect(s.x - 5, s.y - 5, 10, 10);
      } else if (snapPoint.kind === 'midpoint') {
        ctx.moveTo(s.x, s.y - 6);
        ctx.lineTo(s.x - 5, s.y + 4);
        ctx.lineTo(s.x + 5, s.y + 4);
        ctx.closePath();
        ctx.stroke();
      } else if (snapPoint.kind === 'center') {
        ctx.arc(s.x, s.y, 5, 0, Math.PI * 2);
        ctx.stroke();
      } else if (snapPoint.kind === 'grid') {
        ctx.fillStyle = '#9ca3af';
        ctx.beginPath();
        ctx.arc(s.x, s.y, 2, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.moveTo(s.x - 5, s.y - 5);
        ctx.lineTo(s.x + 5, s.y + 5);
        ctx.moveTo(s.x + 5, s.y - 5);
        ctx.lineTo(s.x - 5, s.y + 5);
        ctx.stroke();
      }
      if (snapPoint.kind !== 'grid') ctx.stroke();
    }
  });

  return (
    <div ref={containerRef} className="relative h-full w-full overflow-hidden touch-none" tabIndex={0}>
      <canvas
        ref={canvasRef}
        className="block cursor-crosshair"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onContextMenu={(e) => {
          e.preventDefault();
          finalizeMultiPoint();
        }}
      />
      {textDraft && (
        <input
          autoFocus
          value={textDraft.value}
          onChange={(ev) => setTextDraft({ ...textDraft, value: ev.target.value })}
          onKeyDown={(ev) => {
            if (ev.key === 'Enter') commitTextDraft();
            if (ev.key === 'Escape') setTextDraft(null);
            ev.stopPropagation();
          }}
          onBlur={commitTextDraft}
          placeholder="Text…"
          className="absolute z-10 rounded border border-accent bg-base-surface px-2 py-1 text-sm text-base-text shadow-lg outline-none"
          style={{ left: toScreen(textDraft.world).x, top: toScreen(textDraft.world).y - 14 }}
        />
      )}
    </div>
  );
});

function drawEntity(
  ctx: CanvasRenderingContext2D,
  e: Entity,
  color: string,
  selected: boolean,
  hover: boolean,
  toScreen: (p: Point) => Point
) {
  ctx.strokeStyle = selected ? '#3b82f6' : hover ? '#f59e0b' : color;
  ctx.lineWidth = selected || hover ? 2 : 1.4;
  ctx.fillStyle = ctx.strokeStyle;

  switch (e.type) {
    case 'line': {
      const a = toScreen(e.p1);
      const b = toScreen(e.p2);
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
      break;
    }
    case 'rect': {
      const corners = rectCorners(e.p1, e.p2).map(toScreen);
      ctx.beginPath();
      ctx.moveTo(corners[0].x, corners[0].y);
      for (let i = 1; i < corners.length; i++) ctx.lineTo(corners[i].x, corners[i].y);
      ctx.closePath();
      ctx.stroke();
      break;
    }
    case 'circle': {
      const c = toScreen(e.center);
      const edge = toScreen({ x: e.center.x + e.radius, y: e.center.y });
      const r = Math.hypot(edge.x - c.x, edge.y - c.y);
      ctx.beginPath();
      ctx.arc(c.x, c.y, r, 0, Math.PI * 2);
      ctx.stroke();
      break;
    }
    case 'arc': {
      const c = toScreen(e.center);
      const edge = toScreen({ x: e.center.x + e.radius, y: e.center.y });
      const r = Math.hypot(edge.x - c.x, edge.y - c.y);
      ctx.beginPath();
      // Screen Y is flipped relative to world Y, so CCW in world = CW on screen.
      ctx.arc(c.x, c.y, r, -e.startAngle, -e.endAngle, true);
      ctx.stroke();
      break;
    }
    case 'ellipse': {
      const c = toScreen(e.center);
      const edgeX = toScreen({ x: e.center.x + e.rx, y: e.center.y });
      const edgeY = toScreen({ x: e.center.x, y: e.center.y + e.ry });
      const rx = Math.hypot(edgeX.x - c.x, edgeX.y - c.y);
      const ry = Math.hypot(edgeY.x - c.x, edgeY.y - c.y);
      ctx.beginPath();
      ctx.ellipse(c.x, c.y, rx, ry, -e.rotation, 0, Math.PI * 2);
      ctx.stroke();
      break;
    }
    case 'polyline': {
      const pts = e.points.map(toScreen);
      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
      if (e.closed) ctx.closePath();
      ctx.stroke();
      break;
    }
    case 'text': {
      const p = toScreen(e.position);
      const px = Math.max(8, e.height * 10);
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(-e.rotation);
      ctx.font = `${px}px sans-serif`;
      ctx.textBaseline = 'bottom';
      ctx.fillText(e.content, 0, 0);
      ctx.restore();
      break;
    }
    case 'dimension': {
      const dir = sub(e.p2, e.p1);
      const len = Math.hypot(dir.x, dir.y) || 1;
      const nx = -dir.y / len;
      const ny = dir.x / len;
      const d1 = add(e.p1, { x: nx * e.offset, y: ny * e.offset });
      const d2 = add(e.p2, { x: nx * e.offset, y: ny * e.offset });
      const s1 = toScreen(e.p1);
      const s2 = toScreen(e.p2);
      const sd1 = toScreen(d1);
      const sd2 = toScreen(d2);
      ctx.beginPath();
      ctx.moveTo(s1.x, s1.y);
      ctx.lineTo(sd1.x, sd1.y);
      ctx.moveTo(s2.x, s2.y);
      ctx.lineTo(sd2.x, sd2.y);
      ctx.moveTo(sd1.x, sd1.y);
      ctx.lineTo(sd2.x, sd2.y);
      ctx.stroke();
      const mid = midpoint(sd1, sd2);
      const label = len.toFixed(2);
      ctx.font = '11px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.fillText(label, mid.x, mid.y - 3);
      ctx.textAlign = 'left';
      break;
    }
  }

  if (selected) {
    ctx.fillStyle = '#3b82f6';
    for (const p of entityKeyPoints(e).slice(0, 8)) {
      const s = toScreen(p);
      ctx.fillRect(s.x - 3, s.y - 3, 6, 6);
    }
  }
}

function drawDraftPreview(
  ctx: CanvasRenderingContext2D,
  draft: Draft,
  mouse: Point,
  toScreen: (p: Point) => Point,
  currentLayerId: string,
  layerMap: Map<string, Layer>
) {
  ctx.strokeStyle = '#3b82f6';
  ctx.setLineDash([5, 4]);
  ctx.lineWidth = 1.2;

  const pts = draft.points;
  switch (draft.tool) {
    case 'line':
    case 'polyline': {
      if (pts.length === 0) break;
      ctx.beginPath();
      const first = toScreen(pts[0]);
      ctx.moveTo(first.x, first.y);
      for (let i = 1; i < pts.length; i++) {
        const s = toScreen(pts[i]);
        ctx.lineTo(s.x, s.y);
      }
      const m = toScreen(mouse);
      ctx.lineTo(m.x, m.y);
      ctx.stroke();
      break;
    }
    case 'rect': {
      if (pts.length === 0) break;
      const corners = rectCorners(pts[0], mouse).map(toScreen);
      ctx.beginPath();
      ctx.moveTo(corners[0].x, corners[0].y);
      for (let i = 1; i < corners.length; i++) ctx.lineTo(corners[i].x, corners[i].y);
      ctx.closePath();
      ctx.stroke();
      break;
    }
    case 'circle': {
      if (pts.length === 0) break;
      const c = toScreen(pts[0]);
      const m = toScreen(mouse);
      const r = Math.hypot(m.x - c.x, m.y - c.y);
      ctx.beginPath();
      ctx.arc(c.x, c.y, r, 0, Math.PI * 2);
      ctx.stroke();
      break;
    }
    case 'arc': {
      if (pts.length === 0) break;
      ctx.beginPath();
      const allPts = [...pts, mouse].map(toScreen);
      ctx.moveTo(allPts[0].x, allPts[0].y);
      for (let i = 1; i < allPts.length; i++) ctx.lineTo(allPts[i].x, allPts[i].y);
      ctx.stroke();
      if (pts.length === 2) {
        const res = arcFrom3Points(pts[0], pts[1], mouse);
        if (res) {
          const c = toScreen(res.center);
          const edge = toScreen({ x: res.center.x + res.radius, y: res.center.y });
          const r = Math.hypot(edge.x - c.x, edge.y - c.y);
          ctx.beginPath();
          ctx.arc(c.x, c.y, r, -res.startAngle, -res.endAngle, true);
          ctx.stroke();
        }
      }
      break;
    }
    case 'ellipse': {
      if (pts.length === 0) break;
      const c = toScreen(pts[0]);
      if (pts.length === 1) {
        const m = toScreen(mouse);
        ctx.beginPath();
        ctx.moveTo(c.x, c.y);
        ctx.lineTo(m.x, m.y);
        ctx.stroke();
      } else {
        const edgeX = toScreen({ x: pts[0].x + dist(pts[0], pts[1]), y: pts[0].y });
        const rx = Math.hypot(edgeX.x - c.x, edgeX.y - c.y);
        const rotation = Math.atan2(pts[1].y - pts[0].y, pts[1].x - pts[0].x);
        const ry = Math.max(0.01, Math.hypot(mouse.x - pts[0].x, mouse.y - pts[0].y));
        ctx.beginPath();
        ctx.ellipse(c.x, c.y, rx, ry, -rotation, 0, Math.PI * 2);
        ctx.stroke();
      }
      break;
    }
    case 'dimension': {
      if (pts.length === 0) break;
      const allPts = [...pts, mouse].map(toScreen);
      ctx.beginPath();
      ctx.moveTo(allPts[0].x, allPts[0].y);
      for (let i = 1; i < allPts.length; i++) ctx.lineTo(allPts[i].x, allPts[i].y);
      ctx.stroke();
      break;
    }
  }
  ctx.setLineDash([]);
  void currentLayerId;
  void layerMap;
}
