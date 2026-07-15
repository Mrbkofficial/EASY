import type { ToolName } from './types';

// AutoCAD-style command aliases -> tool/action name. Typed into the command line.
export const COMMAND_ALIASES: Record<string, ToolName | 'undo' | 'redo' | 'zoomextents' | 'save' | 'new' | 'delete'> = {
  // Draw
  line: 'line',
  l: 'line',
  pline: 'polyline',
  polyline: 'polyline',
  pl: 'polyline',
  rectang: 'rect',
  rectangle: 'rect',
  rec: 'rect',
  circle: 'circle',
  c: 'circle',
  arc: 'arc',
  a: 'arc',
  ellipse: 'ellipse',
  el: 'ellipse',
  text: 'text',
  dtext: 'text',
  t: 'text',
  dim: 'dimension',
  dli: 'dimension',
  dimlinear: 'dimension',
  // Modify
  move: 'move',
  m: 'move',
  copy: 'copy',
  co: 'copy',
  cp: 'copy',
  rotate: 'rotate',
  ro: 'rotate',
  scale: 'scale',
  sc: 'scale',
  mirror: 'mirror',
  mi: 'mirror',
  offset: 'offset',
  o: 'offset',
  trim: 'trim',
  tr: 'trim',
  extend: 'extend',
  ex: 'extend',
  fillet: 'fillet',
  f: 'fillet',
  erase: 'erase',
  e: 'erase',
  del: 'delete',
  // Select
  select: 'select',
  s: 'select',
  esc: 'select',
  // View / doc
  u: 'undo',
  undo: 'undo',
  redo: 'redo',
  ze: 'zoomextents',
  zoomextents: 'zoomextents',
  save: 'save',
  new: 'new',
};

export function resolveCommand(input: string) {
  const key = input.trim().toLowerCase();
  return COMMAND_ALIASES[key];
}

export const TOOL_PROMPTS: Partial<Record<ToolName, string>> = {
  select: 'Select objects, or drag a window/crossing box.',
  line: 'Specify first point.',
  polyline: 'Specify first point.',
  rect: 'Specify first corner.',
  circle: 'Specify center point.',
  arc: 'Specify start point.',
  ellipse: 'Specify center point.',
  text: 'Specify insertion point.',
  dimension: 'Specify first extension line origin.',
  move: 'Select objects to move, then Enter — or select first, then choose Move.',
  copy: 'Select objects to copy, then Enter — or select first, then choose Copy.',
  rotate: 'Select objects, then choose a base point.',
  scale: 'Select objects, then choose a base point.',
  mirror: 'Select objects, then pick the mirror line.',
  offset: 'Enter offset distance, then click an object and a side.',
  trim: 'Click the portion of an object to trim.',
  extend: 'Click near the end of an object to extend it.',
  fillet: 'Select two lines to fillet.',
  erase: 'Select objects to erase, then Enter.',
  pan: 'Drag to pan the view.',
};
