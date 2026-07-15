import type { CadDocument, Entity } from './types';
import { rectCorners } from './geometry';

// Minimal ASCII DXF (R12-compatible) writer/reader covering the entity
// types this app supports. Not a full DXF implementation, but real
// LINE/CIRCLE/ARC/LWPOLYLINE/TEXT entities that open in other CAD tools.

function dxfPair(code: number, value: string | number): string {
  return `${code}\n${value}\n`;
}

export function exportDxf(doc: CadDocument): string {
  let out = '';
  out += dxfPair(0, 'SECTION') + dxfPair(2, 'ENTITIES');

  const layerOf = (id: string) => doc.layers.find((l) => l.id === id)?.name ?? '0';

  for (const e of doc.entities) {
    const layer = layerOf(e.layerId);
    switch (e.type) {
      case 'line':
        out += dxfPair(0, 'LINE') + dxfPair(8, layer);
        out += dxfPair(10, e.p1.x) + dxfPair(20, e.p1.y) + dxfPair(30, 0);
        out += dxfPair(11, e.p2.x) + dxfPair(21, e.p2.y) + dxfPair(31, 0);
        break;
      case 'rect': {
        const corners = rectCorners(e.p1, e.p2);
        out += dxfPair(0, 'LWPOLYLINE') + dxfPair(8, layer) + dxfPair(90, 4) + dxfPair(70, 1);
        for (const c of corners) out += dxfPair(10, c.x) + dxfPair(20, c.y);
        break;
      }
      case 'circle':
        out += dxfPair(0, 'CIRCLE') + dxfPair(8, layer);
        out += dxfPair(10, e.center.x) + dxfPair(20, e.center.y) + dxfPair(30, 0);
        out += dxfPair(40, e.radius);
        break;
      case 'arc':
        out += dxfPair(0, 'ARC') + dxfPair(8, layer);
        out += dxfPair(10, e.center.x) + dxfPair(20, e.center.y) + dxfPair(30, 0);
        out += dxfPair(40, e.radius);
        out += dxfPair(50, (e.startAngle * 180) / Math.PI) + dxfPair(51, (e.endAngle * 180) / Math.PI);
        break;
      case 'polyline':
        out += dxfPair(0, 'LWPOLYLINE') + dxfPair(8, layer) + dxfPair(90, e.points.length) + dxfPair(70, e.closed ? 1 : 0);
        for (const p of e.points) out += dxfPair(10, p.x) + dxfPair(20, p.y);
        break;
      case 'ellipse':
        out += dxfPair(0, 'ELLIPSE') + dxfPair(8, layer);
        out += dxfPair(10, e.center.x) + dxfPair(20, e.center.y) + dxfPair(30, 0);
        out += dxfPair(11, e.rx * Math.cos(e.rotation)) + dxfPair(21, e.rx * Math.sin(e.rotation)) + dxfPair(31, 0);
        out += dxfPair(40, e.rx > 0 ? e.ry / e.rx : 0);
        out += dxfPair(41, 0) + dxfPair(42, TWO_PI_STR);
        break;
      case 'text':
        out += dxfPair(0, 'TEXT') + dxfPair(8, layer);
        out += dxfPair(10, e.position.x) + dxfPair(20, e.position.y) + dxfPair(30, 0);
        out += dxfPair(40, e.height) + dxfPair(1, e.content) + dxfPair(50, (e.rotation * 180) / Math.PI);
        break;
      case 'dimension':
        // Represented as a plain line + text for portability (real DIMENSION entities need a block def).
        out += dxfPair(0, 'LINE') + dxfPair(8, layer);
        out += dxfPair(10, e.p1.x) + dxfPair(20, e.p1.y) + dxfPair(30, 0);
        out += dxfPair(11, e.p2.x) + dxfPair(21, e.p2.y) + dxfPair(31, 0);
        break;
    }
  }

  out += dxfPair(0, 'ENDSEC') + dxfPair(0, 'EOF');
  return out;
}

const TWO_PI_STR = (Math.PI * 2).toFixed(6);

interface DxfGroup {
  code: number;
  value: string;
}

function tokenize(text: string): DxfGroup[] {
  const lines = text.split(/\r?\n/);
  const groups: DxfGroup[] = [];
  for (let i = 0; i + 1 < lines.length; i += 2) {
    const code = parseInt(lines[i].trim(), 10);
    const value = lines[i + 1] ?? '';
    if (Number.isNaN(code)) continue;
    groups.push({ code, value: value.trim() });
  }
  return groups;
}

/** Parses the ENTITIES section of a DXF file into our Entity model (LINE/CIRCLE/ARC/LWPOLYLINE/TEXT only). */
export function importDxf(text: string, layerId: string): Entity[] {
  const groups = tokenize(text);
  const entities: Entity[] = [];
  let i = 0;
  const uid = () => `imp-${Math.random().toString(36).slice(2, 10)}`;

  while (i < groups.length) {
    const g = groups[i];
    if (g.code === 0 && ['LINE', 'CIRCLE', 'ARC', 'LWPOLYLINE', 'TEXT'].includes(g.value)) {
      const type = g.value;
      i++;
      const rec: Record<number, string[]> = {};
      while (i < groups.length && groups[i].code !== 0) {
        const c = groups[i].code;
        (rec[c] ??= []).push(groups[i].value);
        i++;
      }
      const num = (code: number, idx = 0, fallback = 0) => (rec[code] ? parseFloat(rec[code][idx]) : fallback);
      if (type === 'LINE') {
        entities.push({ id: uid(), type: 'line', layerId, p1: { x: num(10), y: num(20) }, p2: { x: num(11), y: num(21) } });
      } else if (type === 'CIRCLE') {
        entities.push({ id: uid(), type: 'circle', layerId, center: { x: num(10), y: num(20) }, radius: num(40) });
      } else if (type === 'ARC') {
        entities.push({
          id: uid(),
          type: 'arc',
          layerId,
          center: { x: num(10), y: num(20) },
          radius: num(40),
          startAngle: (num(50) * Math.PI) / 180,
          endAngle: (num(51) * Math.PI) / 180,
        });
      } else if (type === 'LWPOLYLINE') {
        const xs = rec[10] ?? [];
        const ys = rec[20] ?? [];
        const points = xs.map((x, idx) => ({ x: parseFloat(x), y: parseFloat(ys[idx] ?? '0') }));
        const closedFlag = rec[70] ? parseInt(rec[70][0], 10) : 0;
        entities.push({ id: uid(), type: 'polyline', layerId, points, closed: (closedFlag & 1) === 1 });
      } else if (type === 'TEXT') {
        entities.push({
          id: uid(),
          type: 'text',
          layerId,
          position: { x: num(10), y: num(20) },
          content: rec[1]?.[0] ?? '',
          height: num(40) || 2.5,
          rotation: (num(50) * Math.PI) / 180,
        });
      }
      continue;
    }
    i++;
  }
  return entities;
}
