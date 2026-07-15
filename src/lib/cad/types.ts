// Core data model for the CAD engine. Kept as plain serializable data
// (no classes) so the whole document can be JSON-cloned for undo/redo
// and saved/loaded from localStorage or a .ecad file.

export interface Point {
  x: number;
  y: number;
}

export interface Layer {
  id: string;
  name: string;
  color: string;
  visible: boolean;
  locked: boolean;
}

interface EntityBase {
  id: string;
  layerId: string;
  colorOverride?: string | null;
}

export interface LineEntity extends EntityBase {
  type: 'line';
  p1: Point;
  p2: Point;
}

export interface RectEntity extends EntityBase {
  type: 'rect';
  p1: Point;
  p2: Point;
}

export interface CircleEntity extends EntityBase {
  type: 'circle';
  center: Point;
  radius: number;
}

export interface ArcEntity extends EntityBase {
  type: 'arc';
  center: Point;
  radius: number;
  startAngle: number; // radians, CCW from +X
  endAngle: number;
}

export interface PolylineEntity extends EntityBase {
  type: 'polyline';
  points: Point[];
  closed: boolean;
}

export interface EllipseEntity extends EntityBase {
  type: 'ellipse';
  center: Point;
  rx: number;
  ry: number;
  rotation: number;
}

export interface TextEntity extends EntityBase {
  type: 'text';
  position: Point;
  content: string;
  height: number;
  rotation: number;
}

export interface DimensionEntity extends EntityBase {
  type: 'dimension';
  p1: Point;
  p2: Point;
  offset: number; // perpendicular distance of the dimension line from p1-p2
}

export type Entity =
  | LineEntity
  | RectEntity
  | CircleEntity
  | ArcEntity
  | PolylineEntity
  | EllipseEntity
  | TextEntity
  | DimensionEntity;

export type EntityType = Entity['type'];

export type ToolName =
  | 'select'
  | 'line'
  | 'polyline'
  | 'rect'
  | 'circle'
  | 'arc'
  | 'ellipse'
  | 'text'
  | 'dimension'
  | 'move'
  | 'copy'
  | 'rotate'
  | 'scale'
  | 'mirror'
  | 'offset'
  | 'trim'
  | 'extend'
  | 'fillet'
  | 'erase'
  | 'pan';

export interface ViewState {
  cx: number; // world x at screen center
  cy: number; // world y at screen center
  scale: number; // pixels per world unit
}

export interface CadDocument {
  entities: Entity[];
  layers: Layer[];
  currentLayerId: string;
}

export type SnapKind = 'endpoint' | 'midpoint' | 'center' | 'intersection' | 'grid' | 'quadrant';

export interface SnapResult {
  point: Point;
  kind: SnapKind;
}
