import type { CadDocument } from './types';
import { boundingBox, rectCorners, arcPoint } from './geometry';

export function exportSvg(doc: CadDocument): string {
  const visible = doc.entities.filter((e) => doc.layers.find((l) => l.id === e.layerId)?.visible !== false);
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const e of visible) {
    const bb = boundingBox(e);
    minX = Math.min(minX, bb.min.x);
    minY = Math.min(minY, bb.min.y);
    maxX = Math.max(maxX, bb.max.x);
    maxY = Math.max(maxY, bb.max.y);
  }
  if (!Number.isFinite(minX)) {
    minX = 0; minY = 0; maxX = 100; maxY = 100;
  }
  const pad = Math.max(2, (maxX - minX) * 0.05);
  minX -= pad; minY -= pad; maxX += pad; maxY += pad;
  const w = maxX - minX;
  const h = maxY - minY;

  const colorOf = (e: (typeof visible)[number]) => {
    if (e.colorOverride) return e.colorOverride;
    return doc.layers.find((l) => l.id === e.layerId)?.color ?? '#000000';
  };

  // Flip Y for SVG (screen-down) coordinate space.
  const fy = (y: number) => -y;

  let body = '';
  for (const e of visible) {
    const stroke = colorOf(e);
    switch (e.type) {
      case 'line':
        body += `<line x1="${e.p1.x}" y1="${fy(e.p1.y)}" x2="${e.p2.x}" y2="${fy(e.p2.y)}" stroke="${stroke}" stroke-width="0.3" />\n`;
        break;
      case 'rect': {
        const c = rectCorners(e.p1, e.p2);
        body += `<polygon points="${c.map((p) => `${p.x},${fy(p.y)}`).join(' ')}" fill="none" stroke="${stroke}" stroke-width="0.3" />\n`;
        break;
      }
      case 'circle':
        body += `<circle cx="${e.center.x}" cy="${fy(e.center.y)}" r="${e.radius}" fill="none" stroke="${stroke}" stroke-width="0.3" />\n`;
        break;
      case 'arc': {
        const s = arcPoint(e, e.startAngle);
        const en = arcPoint(e, e.endAngle);
        let sweep = e.endAngle - e.startAngle;
        while (sweep < 0) sweep += Math.PI * 2;
        const large = sweep > Math.PI ? 1 : 0;
        body += `<path d="M ${s.x} ${fy(s.y)} A ${e.radius} ${e.radius} 0 ${large} 0 ${en.x} ${fy(en.y)}" fill="none" stroke="${stroke}" stroke-width="0.3" />\n`;
        break;
      }
      case 'ellipse':
        body += `<ellipse cx="${e.center.x}" cy="${fy(e.center.y)}" rx="${e.rx}" ry="${e.ry}" transform="rotate(${(-e.rotation * 180) / Math.PI} ${e.center.x} ${fy(e.center.y)})" fill="none" stroke="${stroke}" stroke-width="0.3" />\n`;
        break;
      case 'polyline': {
        const tag = e.closed ? 'polygon' : 'polyline';
        body += `<${tag} points="${e.points.map((p) => `${p.x},${fy(p.y)}`).join(' ')}" fill="none" stroke="${stroke}" stroke-width="0.3" />\n`;
        break;
      }
      case 'text':
        body += `<text x="${e.position.x}" y="${fy(e.position.y)}" font-size="${e.height}" fill="${stroke}" transform="rotate(${(-e.rotation * 180) / Math.PI} ${e.position.x} ${fy(e.position.y)})">${escapeXml(e.content)}</text>\n`;
        break;
      case 'dimension':
        body += `<line x1="${e.p1.x}" y1="${fy(e.p1.y)}" x2="${e.p2.x}" y2="${fy(e.p2.y)}" stroke="${stroke}" stroke-width="0.2" stroke-dasharray="1,1" />\n`;
        break;
    }
  }

  return `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" viewBox="${minX} ${fy(maxY)} ${w} ${h}" width="${w}mm" height="${h}mm">\n${body}</svg>`;
}

function escapeXml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
