import type { Entity, Point, SnapResult, LineEntity, CircleEntity, ArcEntity } from './types';

export const TWO_PI = Math.PI * 2;

export function pt(x: number, y: number): Point {
  return { x, y };
}

export function add(a: Point, b: Point): Point {
  return { x: a.x + b.x, y: a.y + b.y };
}

export function sub(a: Point, b: Point): Point {
  return { x: a.x - b.x, y: a.y - b.y };
}

export function scalePt(a: Point, s: number): Point {
  return { x: a.x * s, y: a.y * s };
}

export function dist(a: Point, b: Point): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

export function midpoint(a: Point, b: Point): Point {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}

export function angleOf(a: Point, b: Point): number {
  return Math.atan2(b.y - a.y, b.x - a.x);
}

export function rotatePoint(p: Point, center: Point, angle: number): Point {
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  const dx = p.x - center.x;
  const dy = p.y - center.y;
  return { x: center.x + dx * c - dy * s, y: center.y + dx * s + dy * c };
}

export function scaleAround(p: Point, center: Point, factor: number): Point {
  return { x: center.x + (p.x - center.x) * factor, y: center.y + (p.y - center.y) * factor };
}

export function mirrorPoint(p: Point, a: Point, b: Point): Point {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) return p;
  const t = ((p.x - a.x) * dx + (p.y - a.y) * dy) / lenSq;
  const proj = { x: a.x + t * dx, y: a.y + t * dy };
  return { x: 2 * proj.x - p.x, y: 2 * proj.y - p.y };
}

export function normalizeAngle(a: number): number {
  let r = a % TWO_PI;
  if (r < 0) r += TWO_PI;
  return r;
}

/** Snaps an angle to the nearest 45deg increment when ortho/polar-ish snapping is on (used for ortho=90deg only). */
export function orthoSnap(from: Point, to: Point): Point {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  if (Math.abs(dx) >= Math.abs(dy)) return { x: to.x, y: from.y };
  return { x: from.x, y: to.y };
}

export function closestPointOnSegment(p: Point, a: Point, b: Point): { point: Point; t: number } {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) return { point: a, t: 0 };
  let t = ((p.x - a.x) * dx + (p.y - a.y) * dy) / lenSq;
  t = Math.max(0, Math.min(1, t));
  return { point: { x: a.x + t * dx, y: a.y + t * dy }, t };
}

export function distanceToSegment(p: Point, a: Point, b: Point): number {
  return dist(p, closestPointOnSegment(p, a, b).point);
}

/** Intersection of two lines. If segmentA/segmentB true, requires the intersection to fall within that segment's [0,1] range. */
export function lineLineIntersect(
  p1: Point,
  p2: Point,
  p3: Point,
  p4: Point,
  segmentA = true,
  segmentB = true
): Point | null {
  const d1x = p2.x - p1.x;
  const d1y = p2.y - p1.y;
  const d2x = p4.x - p3.x;
  const d2y = p4.y - p3.y;
  const denom = d1x * d2y - d1y * d2x;
  if (Math.abs(denom) < 1e-9) return null;
  const t = ((p3.x - p1.x) * d2y - (p3.y - p1.y) * d2x) / denom;
  const u = ((p3.x - p1.x) * d1y - (p3.y - p1.y) * d1x) / denom;
  if (segmentA && (t < -1e-9 || t > 1 + 1e-9)) return null;
  if (segmentB && (u < -1e-9 || u > 1 + 1e-9)) return null;
  return { x: p1.x + t * d1x, y: p1.y + t * d1y };
}

export function lineCircleIntersect(a: Point, b: Point, center: Point, radius: number, segment = true): Point[] {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const fx = a.x - center.x;
  const fy = a.y - center.y;
  const A = dx * dx + dy * dy;
  const B = 2 * (fx * dx + fy * dy);
  const C = fx * fx + fy * fy - radius * radius;
  const disc = B * B - 4 * A * C;
  if (disc < 0 || A === 0) return [];
  const sq = Math.sqrt(disc);
  const t1 = (-B - sq) / (2 * A);
  const t2 = (-B + sq) / (2 * A);
  const pts: Point[] = [];
  for (const t of [t1, t2]) {
    if (!segment || (t >= -1e-9 && t <= 1 + 1e-9)) {
      pts.push({ x: a.x + t * dx, y: a.y + t * dy });
    }
  }
  return pts;
}

export function pointAngleOnCircle(center: Point, p: Point): number {
  return normalizeAngle(Math.atan2(p.y - center.y, p.x - center.x));
}

export function isAngleBetween(angle: number, start: number, end: number): boolean {
  const a = normalizeAngle(angle);
  const s = normalizeAngle(start);
  const e = normalizeAngle(end);
  if (s <= e) return a >= s - 1e-9 && a <= e + 1e-9;
  return a >= s - 1e-9 || a <= e + 1e-9;
}

export function rectCorners(p1: Point, p2: Point): Point[] {
  return [
    { x: p1.x, y: p1.y },
    { x: p2.x, y: p1.y },
    { x: p2.x, y: p2.y },
    { x: p1.x, y: p2.y },
  ];
}

export function boundingBox(entity: Entity): { min: Point; max: Point } {
  const pts = entityKeyPoints(entity);
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const p of pts) {
    minX = Math.min(minX, p.x);
    minY = Math.min(minY, p.y);
    maxX = Math.max(maxX, p.x);
    maxY = Math.max(maxY, p.y);
  }
  return { min: { x: minX, y: minY }, max: { x: maxX, y: maxY } };
}

/** Sample of points that fully bound the entity (used for bbox + selection tests). */
export function entityKeyPoints(entity: Entity): Point[] {
  switch (entity.type) {
    case 'line':
      return [entity.p1, entity.p2];
    case 'rect':
      return rectCorners(entity.p1, entity.p2);
    case 'circle':
      return [
        { x: entity.center.x - entity.radius, y: entity.center.y - entity.radius },
        { x: entity.center.x + entity.radius, y: entity.center.y + entity.radius },
      ];
    case 'ellipse':
      return [
        { x: entity.center.x - entity.rx, y: entity.center.y - entity.ry },
        { x: entity.center.x + entity.rx, y: entity.center.y + entity.ry },
      ];
    case 'arc': {
      const pts = [arcPoint(entity, entity.startAngle), arcPoint(entity, entity.endAngle)];
      for (const a of [0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2]) {
        if (isAngleBetween(a, entity.startAngle, entity.endAngle)) pts.push(arcPoint(entity, a));
      }
      return pts;
    }
    case 'polyline':
      return entity.points;
    case 'text':
      return [entity.position, { x: entity.position.x + entity.height * entity.content.length * 0.6, y: entity.position.y + entity.height }];
    case 'dimension':
      return [entity.p1, entity.p2];
  }
}

export function arcPoint(arc: ArcEntity, angle: number): Point {
  return { x: arc.center.x + arc.radius * Math.cos(angle), y: arc.center.y + arc.radius * Math.sin(angle) };
}

export function arcFrom3Points(a: Point, b: Point, c: Point): { center: Point; radius: number; startAngle: number; endAngle: number } | null {
  // Circumcircle of a,b,c; arc goes a -> c passing through b.
  const ax = a.x, ay = a.y, bx = b.x, by = b.y, cx = c.x, cy = c.y;
  const d = 2 * (ax * (by - cy) + bx * (cy - ay) + cx * (ay - by));
  if (Math.abs(d) < 1e-9) return null;
  const ux = ((ax * ax + ay * ay) * (by - cy) + (bx * bx + by * by) * (cy - ay) + (cx * cx + cy * cy) * (ay - by)) / d;
  const uy = ((ax * ax + ay * ay) * (cx - bx) + (bx * bx + by * by) * (ax - cx) + (cx * cx + cy * cy) * (bx - ax)) / d;
  const center = { x: ux, y: uy };
  const radius = dist(center, a);
  const angleA = pointAngleOnCircle(center, a);
  const angleB = pointAngleOnCircle(center, b);
  const angleC = pointAngleOnCircle(center, c);
  // Arcs are always rendered sweeping CCW (increasing angle) from startAngle to endAngle.
  // Pick the (start, end) = (a, c) or (c, a) ordering whose CCW sweep passes through b.
  if (isAngleBetween(angleB, angleA, angleC)) {
    return { center, radius, startAngle: angleA, endAngle: angleC };
  }
  return { center, radius, startAngle: angleC, endAngle: angleA };
}

// --- Snap point extraction -------------------------------------------------

export function entitySnapPoints(entity: Entity): SnapResult[] {
  switch (entity.type) {
    case 'line':
      return [
        { point: entity.p1, kind: 'endpoint' },
        { point: entity.p2, kind: 'endpoint' },
        { point: midpoint(entity.p1, entity.p2), kind: 'midpoint' },
      ];
    case 'rect': {
      const corners = rectCorners(entity.p1, entity.p2);
      const pts: SnapResult[] = corners.map((p) => ({ point: p, kind: 'endpoint' as const }));
      for (let i = 0; i < 4; i++) {
        pts.push({ point: midpoint(corners[i], corners[(i + 1) % 4]), kind: 'midpoint' });
      }
      return pts;
    }
    case 'circle':
      return [
        { point: entity.center, kind: 'center' },
        { point: { x: entity.center.x + entity.radius, y: entity.center.y }, kind: 'quadrant' },
        { point: { x: entity.center.x - entity.radius, y: entity.center.y }, kind: 'quadrant' },
        { point: { x: entity.center.x, y: entity.center.y + entity.radius }, kind: 'quadrant' },
        { point: { x: entity.center.x, y: entity.center.y - entity.radius }, kind: 'quadrant' },
      ];
    case 'arc':
      return [
        { point: arcPoint(entity, entity.startAngle), kind: 'endpoint' },
        { point: arcPoint(entity, entity.endAngle), kind: 'endpoint' },
        { point: entity.center, kind: 'center' },
      ];
    case 'ellipse':
      return [{ point: entity.center, kind: 'center' }];
    case 'polyline': {
      const pts: SnapResult[] = entity.points.map((p) => ({ point: p, kind: 'endpoint' as const }));
      for (let i = 0; i < entity.points.length - 1; i++) {
        pts.push({ point: midpoint(entity.points[i], entity.points[i + 1]), kind: 'midpoint' });
      }
      if (entity.closed && entity.points.length > 1) {
        pts.push({ point: midpoint(entity.points[entity.points.length - 1], entity.points[0]), kind: 'midpoint' });
      }
      return pts;
    }
    case 'text':
      return [{ point: entity.position, kind: 'endpoint' }];
    case 'dimension':
      return [
        { point: entity.p1, kind: 'endpoint' },
        { point: entity.p2, kind: 'endpoint' },
      ];
  }
}

export function nearestPointOnEntity(entity: Entity, p: Point): { point: Point; distance: number } {
  switch (entity.type) {
    case 'line': {
      const r = closestPointOnSegment(p, entity.p1, entity.p2);
      return { point: r.point, distance: dist(p, r.point) };
    }
    case 'rect': {
      const corners = rectCorners(entity.p1, entity.p2);
      let best = { point: corners[0], distance: Infinity };
      for (let i = 0; i < 4; i++) {
        const r = closestPointOnSegment(p, corners[i], corners[(i + 1) % 4]);
        const d = dist(p, r.point);
        if (d < best.distance) best = { point: r.point, distance: d };
      }
      return best;
    }
    case 'circle': {
      const a = Math.atan2(p.y - entity.center.y, p.x - entity.center.x);
      const cp = { x: entity.center.x + entity.radius * Math.cos(a), y: entity.center.y + entity.radius * Math.sin(a) };
      return { point: cp, distance: Math.abs(dist(p, entity.center) - entity.radius) };
    }
    case 'arc': {
      const a = pointAngleOnCircle(entity.center, p);
      if (isAngleBetween(a, entity.startAngle, entity.endAngle)) {
        const cp = arcPoint(entity, a);
        return { point: cp, distance: Math.abs(dist(p, entity.center) - entity.radius) };
      }
      const s = arcPoint(entity, entity.startAngle);
      const e = arcPoint(entity, entity.endAngle);
      return dist(p, s) < dist(p, e) ? { point: s, distance: dist(p, s) } : { point: e, distance: dist(p, e) };
    }
    case 'ellipse': {
      // Approximate by sampling.
      let best = { point: entity.center, distance: Infinity };
      const N = 64;
      for (let i = 0; i < N; i++) {
        const t = (i / N) * TWO_PI;
        const local = { x: entity.rx * Math.cos(t), y: entity.ry * Math.sin(t) };
        const world = rotatePoint(add(entity.center, local), entity.center, entity.rotation);
        const d = dist(p, world);
        if (d < best.distance) best = { point: world, distance: d };
      }
      return best;
    }
    case 'polyline': {
      let best = { point: entity.points[0], distance: Infinity };
      const n = entity.points.length;
      const segCount = entity.closed ? n : n - 1;
      for (let i = 0; i < segCount; i++) {
        const a = entity.points[i];
        const b = entity.points[(i + 1) % n];
        const r = closestPointOnSegment(p, a, b);
        const d = dist(p, r.point);
        if (d < best.distance) best = { point: r.point, distance: d };
      }
      return best;
    }
    case 'text':
      return { point: entity.position, distance: dist(p, entity.position) };
    case 'dimension': {
      const r = closestPointOnSegment(p, entity.p1, entity.p2);
      return { point: r.point, distance: dist(p, r.point) };
    }
  }
}

export function translateEntity<T extends Entity>(entity: T, delta: Point): T {
  switch (entity.type) {
    case 'line':
      return { ...entity, p1: add(entity.p1, delta), p2: add(entity.p2, delta) };
    case 'rect':
      return { ...entity, p1: add(entity.p1, delta), p2: add(entity.p2, delta) };
    case 'circle':
      return { ...entity, center: add(entity.center, delta) };
    case 'arc':
      return { ...entity, center: add(entity.center, delta) };
    case 'ellipse':
      return { ...entity, center: add(entity.center, delta) };
    case 'polyline':
      return { ...entity, points: entity.points.map((p) => add(p, delta)) };
    case 'text':
      return { ...entity, position: add(entity.position, delta) };
    case 'dimension':
      return { ...entity, p1: add(entity.p1, delta), p2: add(entity.p2, delta) };
    default:
      return entity;
  }
}

export function rotateEntity<T extends Entity>(entity: T, center: Point, angle: number): T {
  switch (entity.type) {
    case 'line':
      return { ...entity, p1: rotatePoint(entity.p1, center, angle), p2: rotatePoint(entity.p2, center, angle) };
    case 'rect': {
      // Rotating a rect can turn it into a non-axis-aligned quad; convert to polyline.
      const corners = rectCorners(entity.p1, entity.p2).map((p) => rotatePoint(p, center, angle));
      return { ...entity, type: 'polyline', points: corners, closed: true } as unknown as T;
    }
    case 'circle':
      return { ...entity, center: rotatePoint(entity.center, center, angle) };
    case 'arc':
      return {
        ...entity,
        center: rotatePoint(entity.center, center, angle),
        startAngle: entity.startAngle + angle,
        endAngle: entity.endAngle + angle,
      };
    case 'ellipse':
      return { ...entity, center: rotatePoint(entity.center, center, angle), rotation: entity.rotation + angle };
    case 'polyline':
      return { ...entity, points: entity.points.map((p) => rotatePoint(p, center, angle)) };
    case 'text':
      return { ...entity, position: rotatePoint(entity.position, center, angle), rotation: entity.rotation + angle };
    case 'dimension':
      return { ...entity, p1: rotatePoint(entity.p1, center, angle), p2: rotatePoint(entity.p2, center, angle) };
    default:
      return entity;
  }
}

export function scaleEntity<T extends Entity>(entity: T, center: Point, factor: number): T {
  switch (entity.type) {
    case 'line':
      return { ...entity, p1: scaleAround(entity.p1, center, factor), p2: scaleAround(entity.p2, center, factor) };
    case 'rect':
      return { ...entity, p1: scaleAround(entity.p1, center, factor), p2: scaleAround(entity.p2, center, factor) };
    case 'circle':
      return { ...entity, center: scaleAround(entity.center, center, factor), radius: entity.radius * factor };
    case 'arc':
      return { ...entity, center: scaleAround(entity.center, center, factor), radius: entity.radius * factor };
    case 'ellipse':
      return {
        ...entity,
        center: scaleAround(entity.center, center, factor),
        rx: entity.rx * factor,
        ry: entity.ry * factor,
      };
    case 'polyline':
      return { ...entity, points: entity.points.map((p) => scaleAround(p, center, factor)) };
    case 'text':
      return { ...entity, position: scaleAround(entity.position, center, factor), height: entity.height * factor };
    case 'dimension':
      return { ...entity, p1: scaleAround(entity.p1, center, factor), p2: scaleAround(entity.p2, center, factor) };
    default:
      return entity;
  }
}

export function mirrorEntity<T extends Entity>(entity: T, a: Point, b: Point): T {
  switch (entity.type) {
    case 'line':
      return { ...entity, p1: mirrorPoint(entity.p1, a, b), p2: mirrorPoint(entity.p2, a, b) };
    case 'rect': {
      const corners = rectCorners(entity.p1, entity.p2).map((p) => mirrorPoint(p, a, b));
      return { ...entity, type: 'polyline', points: corners, closed: true } as unknown as T;
    }
    case 'circle':
      return { ...entity, center: mirrorPoint(entity.center, a, b) };
    case 'arc': {
      const newCenter = mirrorPoint(entity.center, a, b);
      const p1 = mirrorPoint(arcPoint(entity, entity.startAngle), a, b);
      const p2 = mirrorPoint(arcPoint(entity, entity.endAngle), a, b);
      // Mirroring reverses sweep direction.
      return {
        ...entity,
        center: newCenter,
        startAngle: pointAngleOnCircle(newCenter, p2),
        endAngle: pointAngleOnCircle(newCenter, p1),
      };
    }
    case 'ellipse':
      return { ...entity, center: mirrorPoint(entity.center, a, b), rotation: -entity.rotation };
    case 'polyline':
      return { ...entity, points: entity.points.map((p) => mirrorPoint(p, a, b)) };
    case 'text':
      return { ...entity, position: mirrorPoint(entity.position, a, b) };
    case 'dimension':
      return { ...entity, p1: mirrorPoint(entity.p1, a, b), p2: mirrorPoint(entity.p2, a, b) };
    default:
      return entity;
  }
}

export function offsetLineEntity(line: LineEntity, distance: number, sidePoint: Point): LineEntity {
  const dx = line.p2.x - line.p1.x;
  const dy = line.p2.y - line.p1.y;
  const len = Math.hypot(dx, dy) || 1;
  let nx = -dy / len;
  let ny = dx / len;
  const toSide = sub(sidePoint, line.p1);
  if (nx * toSide.x + ny * toSide.y < 0) {
    nx = -nx;
    ny = -ny;
  }
  const d = { x: nx * distance, y: ny * distance };
  return { ...line, id: line.id, p1: add(line.p1, d), p2: add(line.p2, d) };
}

export function offsetCircleLike<T extends CircleEntity | ArcEntity>(entity: T, distance: number, sidePoint: Point): T {
  const grow = dist(sidePoint, entity.center) >= entity.radius;
  const newRadius = Math.max(0.001, entity.radius + (grow ? distance : -distance));
  return { ...entity, radius: newRadius };
}

// --- Trim / extend for straight LineEntity segments -------------------------

export function findLineIntersectionsWithEntity(line: LineEntity, other: Entity, treatAsInfinite = false): Point[] {
  switch (other.type) {
    case 'line':
      return pushIf(lineLineIntersect(line.p1, line.p2, other.p1, other.p2, !treatAsInfinite, true));
    case 'rect': {
      const corners = rectCorners(other.p1, other.p2);
      const pts: Point[] = [];
      for (let i = 0; i < 4; i++) {
        const r = lineLineIntersect(line.p1, line.p2, corners[i], corners[(i + 1) % 4], !treatAsInfinite, true);
        if (r) pts.push(r);
      }
      return pts;
    }
    case 'circle':
      return lineCircleIntersect(line.p1, line.p2, other.center, other.radius, !treatAsInfinite);
    case 'arc': {
      const pts = lineCircleIntersect(line.p1, line.p2, other.center, other.radius, !treatAsInfinite);
      return pts.filter((p) => isAngleBetween(pointAngleOnCircle(other.center, p), other.startAngle, other.endAngle));
    }
    case 'polyline': {
      const pts: Point[] = [];
      const n = other.points.length;
      const segCount = other.closed ? n : n - 1;
      for (let i = 0; i < segCount; i++) {
        const r = lineLineIntersect(line.p1, line.p2, other.points[i], other.points[(i + 1) % n], !treatAsInfinite, true);
        if (r) pts.push(r);
      }
      return pts;
    }
    default:
      return [];
  }
}

function pushIf(p: Point | null): Point[] {
  return p ? [p] : [];
}

/** Trims a line at the click point using intersections with the given cutting entities. Returns the remaining segment, or null if the whole line should vanish. */
export function trimLine(line: LineEntity, cutters: Entity[], clickPoint: Point): LineEntity | null {
  const dx = line.p2.x - line.p1.x;
  const dy = line.p2.y - line.p1.y;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) return line;
  const tOf = (p: Point) => ((p.x - line.p1.x) * dx + (p.y - line.p1.y) * dy) / lenSq;
  const ts = new Set<number>();
  for (const c of cutters) {
    for (const p of findLineIntersectionsWithEntity(line, c)) {
      const t = tOf(p);
      if (t > 1e-6 && t < 1 - 1e-6) ts.add(t);
    }
  }
  if (ts.size === 0) return line;
  const sorted = Array.from(ts).sort((a, b) => a - b);
  const clickT = tOf(closestPointOnSegment(clickPoint, line.p1, line.p2).point);
  // Find the interval [lo, hi] (in t-space, within [0,1]) containing clickT, remove it.
  let lo = 0;
  let hi = 1;
  for (const t of sorted) {
    if (t <= clickT) lo = t;
  }
  for (const t of sorted) {
    if (t >= clickT) {
      hi = t;
      break;
    }
  }
  if (lo === 0 && hi === 1 && sorted.length > 0) {
    // clickT was outside all intersections on one side already handled by lo/hi defaults
  }
  // Build remaining segment(s): keep [0,lo] portion if lo>0, else keep [hi,1] if hi<1.
  if (lo > 1e-6) {
    return { ...line, p2: { x: line.p1.x + dx * lo, y: line.p1.y + dy * lo } };
  }
  if (hi < 1 - 1e-6) {
    return { ...line, p1: { x: line.p1.x + dx * hi, y: line.p1.y + dy * hi } };
  }
  return null;
}

/** Extends a line's nearest endpoint to the closest boundary intersection along its infinite direction. */
export function extendLine(line: LineEntity, boundaries: Entity[], clickPoint: Point): LineEntity | null {
  const nearP1 = dist(clickPoint, line.p1) < dist(clickPoint, line.p2);
  const fixed = nearP1 ? line.p2 : line.p1;
  const moving = nearP1 ? line.p1 : line.p2;
  const dx = moving.x - fixed.x;
  const dy = moving.y - fixed.y;
  const len = Math.hypot(dx, dy) || 1;
  const dirx = dx / len;
  const diry = dy / len;
  // Cast a long ray from `fixed` through `moving` and beyond, find intersections beyond the current endpoint.
  const far = { x: fixed.x + dirx * 1e7, y: fixed.y + diry * 1e7 };
  let best: { point: Point; t: number } | null = null;
  const curLen = len;
  for (const b of boundaries) {
    for (const p of findLineIntersectionsWithEntity({ ...line, p1: fixed, p2: far }, b, false)) {
      const t = dist(fixed, p);
      const dot = (p.x - fixed.x) * dirx + (p.y - fixed.y) * diry;
      if (dot > curLen + 1e-6) {
        if (!best || t < best.t) best = { point: p, t };
      }
    }
  }
  if (!best) return null;
  return nearP1 ? { ...line, p1: best.point } : { ...line, p2: best.point };
}

export function filletLines(a: LineEntity, b: LineEntity, radius: number): { a: LineEntity; b: LineEntity; arc: ArcEntity } | null {
  const inter = lineLineIntersect(a.p1, a.p2, b.p1, b.p2, false, false);
  if (!inter) return null;
  // Direction vectors pointing away from the intersection, toward whichever endpoint is farther (keeps the "kept" side of each line).
  const aFar = dist(inter, a.p1) > dist(inter, a.p2) ? a.p1 : a.p2;
  const bFar = dist(inter, b.p1) > dist(inter, b.p2) ? b.p1 : b.p2;
  const da = { x: aFar.x - inter.x, y: aFar.y - inter.y };
  const db = { x: bFar.x - inter.x, y: bFar.y - inter.y };
  const la = Math.hypot(da.x, da.y) || 1;
  const lb = Math.hypot(db.x, db.y) || 1;
  const ua = { x: da.x / la, y: da.y / la };
  const ub = { x: db.x / lb, y: db.y / lb };
  const theta = Math.acos(Math.max(-1, Math.min(1, ua.x * ub.x + ua.y * ub.y)));
  if (theta < 1e-6 || Math.abs(theta - Math.PI) < 1e-6) return null;
  const dToTangent = radius / Math.tan(theta / 2);
  const tangentA = { x: inter.x + ua.x * dToTangent, y: inter.y + ua.y * dToTangent };
  const tangentB = { x: inter.x + ub.x * dToTangent, y: inter.y + ub.y * dToTangent };
  const bisector = { x: ua.x + ub.x, y: ua.y + ub.y };
  const bisLen = Math.hypot(bisector.x, bisector.y) || 1;
  const distToCenter = radius / Math.sin(theta / 2);
  const center = {
    x: inter.x + (bisector.x / bisLen) * distToCenter,
    y: inter.y + (bisector.y / bisLen) * distToCenter,
  };
  let startAngle = pointAngleOnCircle(center, tangentA);
  let endAngle = pointAngleOnCircle(center, tangentB);
  // The fillet is always the minor arc between the two tangent points — if the CCW
  // sweep from start to end is the reflex (>180°) side, swap so it's the short way.
  if (normalizeAngle(endAngle - startAngle) > Math.PI) {
    [startAngle, endAngle] = [endAngle, startAngle];
  }
  const newA: LineEntity = aFar === a.p1 ? { ...a, p2: tangentA } : { ...a, p1: tangentA };
  const newB: LineEntity = bFar === b.p1 ? { ...b, p2: tangentB } : { ...b, p1: tangentB };
  const arc: ArcEntity = {
    id: `arc-${Math.random().toString(36).slice(2, 9)}`,
    type: 'arc',
    layerId: a.layerId,
    center,
    radius,
    startAngle,
    endAngle,
  };
  return { a: newA, b: newB, arc };
}

// --- Snapping ---------------------------------------------------------------

const SNAP_PRIORITY: Record<SnapResult['kind'], number> = {
  endpoint: 0,
  center: 1,
  quadrant: 2,
  intersection: 2,
  midpoint: 3,
  grid: 4,
};

export function findSnapPoint(
  entities: Entity[],
  worldPos: Point,
  toleranceWorld: number,
  gridSize: number | null,
  excludeIds: Set<string> = new Set()
): SnapResult | null {
  let best: SnapResult | null = null;
  let bestScore = Infinity;
  for (const e of entities) {
    if (excludeIds.has(e.id)) continue;
    for (const s of entitySnapPoints(e)) {
      const d = dist(worldPos, s.point);
      if (d > toleranceWorld) continue;
      const score = d + SNAP_PRIORITY[s.kind] * 1e-6;
      if (score < bestScore) {
        bestScore = score;
        best = s;
      }
    }
  }
  if (best) return best;
  if (gridSize && gridSize > 0) {
    const gx = Math.round(worldPos.x / gridSize) * gridSize;
    const gy = Math.round(worldPos.y / gridSize) * gridSize;
    const gp = { x: gx, y: gy };
    if (dist(worldPos, gp) <= toleranceWorld) return { point: gp, kind: 'grid' };
  }
  return null;
}

/** Parses AutoCAD-style coordinate entry typed into the command line: "12,8" (absolute) or "@3,-2" (relative to last point). */
export function parseCoordInput(text: string, lastPoint: Point | null): Point | null {
  const t = text.trim();
  if (!t) return null;
  const relative = t.startsWith('@');
  const body = relative ? t.slice(1) : t;
  // Polar form: @dist<angle
  const polarMatch = body.match(/^(-?[\d.]+)\s*<\s*(-?[\d.]+)$/);
  if (polarMatch) {
    const d = parseFloat(polarMatch[1]);
    const ang = (parseFloat(polarMatch[2]) * Math.PI) / 180;
    const base = relative ? lastPoint ?? { x: 0, y: 0 } : { x: 0, y: 0 };
    return { x: base.x + d * Math.cos(ang), y: base.y + d * Math.sin(ang) };
  }
  const parts = body.split(',').map((s) => s.trim());
  if (parts.length !== 2) return null;
  const x = parseFloat(parts[0]);
  const y = parseFloat(parts[1]);
  if (Number.isNaN(x) || Number.isNaN(y)) return null;
  if (relative) {
    const base = lastPoint ?? { x: 0, y: 0 };
    return { x: base.x + x, y: base.y + y };
  }
  return { x, y };
}
