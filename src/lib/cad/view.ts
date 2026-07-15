import type { Point, ViewState } from './types';

export function worldToScreen(p: Point, view: ViewState, width: number, height: number): Point {
  return {
    x: width / 2 + (p.x - view.cx) * view.scale,
    y: height / 2 - (p.y - view.cy) * view.scale,
  };
}

export function screenToWorld(p: Point, view: ViewState, width: number, height: number): Point {
  return {
    x: view.cx + (p.x - width / 2) / view.scale,
    y: view.cy - (p.y - height / 2) / view.scale,
  };
}

export function niceGridSpacing(scale: number): number {
  // Pick a "nice" world spacing (1/2/5 * 10^n) so that spacing*scale lands roughly in [35, 90] px.
  const targetPx = 60;
  let spacing = targetPx / scale;
  const pow = Math.pow(10, Math.floor(Math.log10(spacing)));
  const norm = spacing / pow;
  let niceNorm: number;
  if (norm < 1.5) niceNorm = 1;
  else if (norm < 3.5) niceNorm = 2;
  else if (norm < 7.5) niceNorm = 5;
  else niceNorm = 10;
  spacing = niceNorm * pow;
  return spacing;
}
