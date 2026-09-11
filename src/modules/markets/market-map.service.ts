import { Prisma } from '@prisma/client';
import { v4 as uuidv4, v5 as uuidv5 } from 'uuid';
import { AppError, badRequest, conflict, notFound } from '../../shared/errors';
import { prisma, type Tx } from '../../shared/prisma';
import { effectiveContractWhere } from '../../shared/contract';

const DEFAULT_COLUMNS = 24;
const DEFAULT_ROWS = 16;
const MAX_GRID = 200;
const MAX_FLOORS = 20;
const MAX_REVISIONS = 5;
const VIRTUAL_FLOOR_NAMESPACE = '9aef5d0a-11a8-5c9c-b2d4-5a5e1f3dc0b6';
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const BLOCKING_OBJECT_TYPES = new Set([
  'aisle', 'courtyard', 'void', 'no_placement', 'wall', 'obstacle', 'stair', 'elevator', 'wc', 'technical', 'column',
]);

export type EntranceSide = 'top' | 'right' | 'bottom' | 'left';

/**
 * Simple per-floor access cue. It is intentionally outside the layout: unlike
 * the old rectangular stair object it has no geometry, collision or linking.
 */
export interface FloorAccessMarker {
  side: EntranceSide;
}

export interface MapEntrance {
  floorId: string;
  side: EntranceSide;
  edgePosition: number;
  /** Width on the external edge, snapped to half a cell. */
  widthCells: number;
  /** Reserved depth inside the footprint; aisles may overlap this rectangle. */
  clearanceDepthCells: number;
}

export interface MapPlacement {
  stallId: string;
  column: number;
  row: number;
  columnSpan: number;
  rowSpan: number;
  rotation: 0 | 90;
  textRotation: 0 | 90 | 'follow_stall';
  spatialBlockId: string | null;
  rowGroupId: string | null;
  /** Auto-generated draft position. Moving it in the editor makes it manual. */
  isTemporary: boolean;
  stall?: PublicStallSnapshot;
}

export interface MapFloor {
  id: string;
  name: string;
  displayOrder: number;
  columns: number;
  rows: number;
  metersPerCell: number | null;
  isActive: boolean;
  footprint: Record<string, unknown>;
  blocks: Record<string, unknown>[];
  rowGroups: Record<string, unknown>[];
  objects: Record<string, unknown>[];
  accessMarker: FloorAccessMarker | null;
  referenceLayer: Record<string, unknown> | null;
  placements: MapPlacement[];
}

export interface MapDocument {
  schemaVersion: 1 | 2 | 3;
  mainEntrance: MapEntrance;
  categoryColorOverrides: Record<string, string>;
  floors: MapFloor[];
  updatedBy?: string;
  updatedAt?: string;
  revisionId?: string;
  revisionNumber?: number;
  publishedBy?: string;
  publishedAt?: string;
  legend?: LegendEntry[];
}

interface MarketMapRow {
  id: string;
  status: string;
  map_link: string | null;
  map_layout_draft: unknown;
  map_layout_draft_version: number;
  map_layout_published: unknown;
  map_layout_revisions: unknown;
}

interface StallRecord {
  id: string;
  code: string;
  name: string | null;
  status: string;
  category_id: string | null;
  zone_id: string;
  display_order: number;
  categories: { id: string; name: string } | null;
  zones: { id: string; name: string; display_order: number; categories: { id: string; name: string } | null };
}

export interface PublicStallSnapshot {
  id: string;
  code: string;
  name: string | null;
  status: string;
  zone: { id: string; name: string };
  category: { id: string; name: string } | null;
  canOpenDetail: boolean;
  /** Live business state; geometry remains in the published revision. */
  availability?: 'operating' | 'vacant' | 'occupied' | 'reserved' | 'maintenance';
}

export interface LegendEntry {
  categoryId: string | null;
  name: string;
  color: string;
  placedCount: number;
  unplacedCount: number;
  inactiveFloorPlacementCount: number;
}

const PALETTE = ['#F59E0B', '#84CC16', '#06B6D4', '#6366F1', '#EC4899', '#0EA5E9', '#EAB308', '#64748B'];

function mapError(code: string, message: string, details?: unknown, status = 400): AppError {
  return new AppError(status, code, message, details);
}

function isObject(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function asObject(value: unknown, code = 'LAYOUT_INVALID'): Record<string, unknown> {
  if (!isObject(value)) throw mapError(code, 'Dữ liệu sơ đồ phải là object');
  return value;
}

function asString(value: unknown, label: string, max = 255): string {
  if (typeof value !== 'string' || !value.trim() || value.trim().length > max)
    throw mapError('LAYOUT_INVALID', `${label} không hợp lệ`);
  return value.trim();
}

function asUuid(value: unknown, label: string): string {
  const id = asString(value, label, 64);
  if (!UUID_RE.test(id)) throw mapError('LAYOUT_INVALID', `${label} phải là UUID`);
  return id;
}

function asInt(value: unknown, label: string, min: number, max: number): number {
  if (!Number.isInteger(value) || (value as number) < min || (value as number) > max)
    throw mapError('LAYOUT_INVALID', `${label} không hợp lệ`);
  return value as number;
}

function asFinite(value: unknown, label: string, min: number, max: number): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < min || value > max)
    throw mapError('LAYOUT_INVALID', `${label} không hợp lệ`);
  return value;
}

function objectOrNull(value: unknown, label: string): Record<string, unknown> | null {
  if (value === undefined || value === null) return null;
  if (!isObject(value)) throw mapError('LAYOUT_INVALID', `${label} không hợp lệ`);
  return value;
}

function arrayOfObjects(value: unknown, label: string): Record<string, unknown>[] {
  if (!Array.isArray(value) || value.some((item) => !isObject(item)))
    throw mapError('LAYOUT_INVALID', `${label} phải là mảng object`);
  return value as Record<string, unknown>[];
}

function copy<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function jsonValue(value: unknown): unknown {
  if (typeof value !== 'string') return value;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function defaultFootprint(columns: number, rows: number) {
  return {
    mode: 'workspace',
    isLocked: false,
    regions: [{ shape: 'rect', column: 0, row: 0, columnSpan: columns, rowSpan: rows }],
  };
}

export function defaultMapDocument(marketId: string): MapDocument {
  const floorId = uuidv5(marketId, VIRTUAL_FLOOR_NAMESPACE);
  return {
    schemaVersion: 3,
    mainEntrance: {
      floorId,
      side: 'bottom',
      edgePosition: DEFAULT_COLUMNS / 2,
      widthCells: 2,
      clearanceDepthCells: 1,
    },
    categoryColorOverrides: {},
    floors: [
      {
        id: floorId,
        name: 'Tầng 1',
        displayOrder: 0,
        columns: DEFAULT_COLUMNS,
        rows: DEFAULT_ROWS,
        metersPerCell: null,
        isActive: true,
        footprint: defaultFootprint(DEFAULT_COLUMNS, DEFAULT_ROWS),
        blocks: [],
        rowGroups: [],
        objects: [],
        accessMarker: null,
        referenceLayer: null,
        placements: [],
      },
    ],
  };
}

function normalizeAccessMarker(raw: unknown): FloorAccessMarker | null {
  if (raw === undefined || raw === null) return null;
  const value = asObject(raw);
  const side = value.side;
  if (side !== 'top' && side !== 'right' && side !== 'bottom' && side !== 'left')
    throw mapError('LAYOUT_INVALID', 'Cạnh lối vào tầng không hợp lệ');
  return { side };
}

function normalizeObjects(raw: unknown): Record<string, unknown>[] {
  return arrayOfObjects(raw ?? [], 'objects').map((object) => {
    if (object.type !== 'aisle') return object;
    const geometry = isObject(object.geometry) ? object.geometry : object;
    const axis = object.axis;
    if (axis === 'horizontal' || axis === 'vertical') return object;
    const columnSpan = geometry.columnSpan;
    const rowSpan = geometry.rowSpan;
    return {
      ...object,
      axis: typeof columnSpan === 'number' && typeof rowSpan === 'number' && rowSpan > columnSpan
        ? 'vertical'
        : 'horizontal',
    };
  });
}

function normalizePlacement(raw: Record<string, unknown>): MapPlacement {
  const rotation = raw.rotation ?? 0;
  const textRotation = raw.textRotation ?? 0;
  if (rotation !== 0 && rotation !== 90) throw mapError('LAYOUT_INVALID', 'Góc xoay sạp không hợp lệ');
  if (textRotation !== 0 && textRotation !== 90 && textRotation !== 'follow_stall')
    throw mapError('LAYOUT_INVALID', 'Góc chữ sạp không hợp lệ');
  return {
    stallId: asUuid(raw.stallId, 'stallId'),
    column: asInt(raw.column, 'column', 0, MAX_GRID - 1),
    row: asInt(raw.row, 'row', 0, MAX_GRID - 1),
    columnSpan: asInt(raw.columnSpan ?? 1, 'columnSpan', 1, MAX_GRID),
    rowSpan: asInt(raw.rowSpan ?? 1, 'rowSpan', 1, MAX_GRID),
    rotation,
    textRotation,
    spatialBlockId: raw.spatialBlockId == null ? null : asUuid(raw.spatialBlockId, 'spatialBlockId'),
    rowGroupId: raw.rowGroupId == null ? null : asUuid(raw.rowGroupId, 'rowGroupId'),
    isTemporary: raw.isTemporary === true,
  };
}

function normalizeFloor(raw: Record<string, unknown>, fallbackOrder: number): MapFloor {
  const columns = asInt(raw.columns, 'columns', 4, MAX_GRID);
  const rows = asInt(raw.rows, 'rows', 4, MAX_GRID);
  const footprintRaw = asObject(raw.footprint ?? defaultFootprint(columns, rows));
  const footprintMode = footprintRaw.mode === 'custom' ? 'custom' : footprintRaw.mode === 'workspace' ? 'workspace' : null;
  if (!footprintMode) throw mapError('LAYOUT_INVALID', 'footprint.mode không hợp lệ');
  const regions = footprintMode === 'workspace'
    ? defaultFootprint(columns, rows).regions
    : arrayOfObjects(footprintRaw.regions, 'footprint.regions');
  if (footprintMode === 'custom' && regions.length === 0)
    throw mapError('OUTSIDE_FOOTPRINT', 'Footprint custom phải có ít nhất một vùng', undefined, 409);
  const placements = arrayOfObjects(raw.placements ?? [], 'placements').map(normalizePlacement);
  return {
    id: asUuid(raw.id, 'floorId'),
    name: asString(raw.name, 'Tên tầng', 100),
    displayOrder: asInt(raw.displayOrder ?? fallbackOrder, 'displayOrder', 0, MAX_FLOORS - 1),
    columns,
    rows,
    metersPerCell: raw.metersPerCell == null ? null : asFinite(raw.metersPerCell, 'metersPerCell', 0.0001, 100000),
    isActive: raw.isActive !== false,
    footprint: { mode: footprintMode, isLocked: footprintRaw.isLocked === true, regions },
    blocks: arrayOfObjects(raw.blocks ?? [], 'blocks'),
    rowGroups: arrayOfObjects(raw.rowGroups ?? [], 'rowGroups'),
    objects: normalizeObjects(raw.objects),
    accessMarker: normalizeAccessMarker(raw.accessMarker),
    referenceLayer: objectOrNull(raw.referenceLayer, 'referenceLayer'),
    placements,
  };
}

function normalizeEntrance(raw: unknown, floors: MapFloor[]): MapEntrance {
  const value = asObject(raw);
  const floorId = asUuid(value.floorId, 'mainEntrance.floorId');
  const side = value.side;
  if (side !== 'top' && side !== 'right' && side !== 'bottom' && side !== 'left')
    throw mapError('LAYOUT_INVALID', 'Cạnh cửa chính không hợp lệ');
  const floor = floors.find((item) => item.id === floorId);
  if (!floor || !floor.isActive)
    throw mapError('MAIN_ENTRANCE_REQUIRED', 'Cửa chính phải thuộc một tầng đang hoạt động', undefined, 409);
  const edgePosition = asFinite(value.edgePosition, 'mainEntrance.edgePosition', 0.5, MAX_GRID);
  if (Math.round(edgePosition * 2) !== edgePosition * 2)
    throw mapError('LAYOUT_INVALID', 'Vị trí cửa chính phải theo bước 0.5 ô');
  const edgeLength = side === 'top' || side === 'bottom' ? floor.columns : floor.rows;
  // Documents before schema v2 stored a point marker. Normalize them in-memory
  // to a minimal visible entrance with one-cell clearance on first read/write.
  const widthCells = asFinite(value.widthCells ?? 2, 'mainEntrance.widthCells', 1, edgeLength);
  const clearanceLimit = side === 'top' || side === 'bottom' ? floor.rows : floor.columns;
  const clearanceDepthCells = asFinite(
    value.clearanceDepthCells ?? 1,
    'mainEntrance.clearanceDepthCells',
    1,
    clearanceLimit,
  );
  if (Math.round(widthCells * 2) !== widthCells * 2 || Math.round(clearanceDepthCells * 2) !== clearanceDepthCells * 2)
    throw mapError('LAYOUT_INVALID', 'Kích thước cửa chính phải theo bước 0.5 ô');
  if (edgePosition - widthCells / 2 <= 0 || edgePosition + widthCells / 2 >= edgeLength)
    throw mapError('MAIN_ENTRANCE_REQUIRED', 'Cửa chính không được nằm ở góc hoặc ngoài cạnh', undefined, 409);
  return { floorId, side, edgePosition, widthCells, clearanceDepthCells };
}

function normalizeDocument(raw: unknown, userId?: string): MapDocument {
  const value = asObject(raw);
  const floorValues = arrayOfObjects(value.floors, 'floors');
  if (floorValues.length === 0 || floorValues.length > MAX_FLOORS)
    throw mapError('LAYOUT_INVALID', `Sơ đồ phải có từ 1 đến ${MAX_FLOORS} tầng`);
  const floors = floorValues.map((floor, index) => normalizeFloor(floor, index));
  const ids = new Set<string>();
  const orders = new Set<number>();
  for (const floor of floors) {
    if (ids.has(floor.id) || orders.has(floor.displayOrder))
      throw mapError('LAYOUT_INVALID', 'Floor ID hoặc thứ tự tầng bị trùng');
    ids.add(floor.id);
    orders.add(floor.displayOrder);
  }
  if (!floors.some((floor) => floor.isActive))
    throw mapError('MAIN_ENTRANCE_REQUIRED', 'Sơ đồ cần tối thiểu một tầng hoạt động', undefined, 409);
  const colorOverrides = isObject(value.categoryColorOverrides) ? value.categoryColorOverrides : {};
  for (const [categoryId, color] of Object.entries(colorOverrides)) {
    if (!UUID_RE.test(categoryId) || typeof color !== 'string' || !/^#[0-9a-f]{6}$/i.test(color))
      throw mapError('LAYOUT_INVALID', 'Màu legend không hợp lệ');
  }
  return {
    schemaVersion: 3,
    mainEntrance: normalizeEntrance(value.mainEntrance, floors),
    categoryColorOverrides: colorOverrides as Record<string, string>,
    floors: floors.sort((a, b) => a.displayOrder - b.displayOrder),
    updatedBy: userId,
    updatedAt: new Date().toISOString(),
  };
}

function rectFrom(value: Record<string, unknown>): { column: number; row: number; columnSpan: number; rowSpan: number } | null {
  const source = isObject(value.geometry) ? value.geometry : value;
  if (source.shape && source.shape !== 'rect') return null;
  const { column, row, columnSpan, rowSpan } = source;
  if (![column, row, columnSpan, rowSpan].every(Number.isFinite)) return null;
  if (![column, row, columnSpan, rowSpan].every(Number.isInteger) || (columnSpan as number) <= 0 || (rowSpan as number) <= 0)
    throw mapError('OBJECT_GEOMETRY_INVALID', 'Hình chữ nhật của object không hợp lệ', undefined, 409);
  return { column: column as number, row: row as number, columnSpan: columnSpan as number, rowSpan: rowSpan as number };
}

function intersects(a: { column: number; row: number; columnSpan: number; rowSpan: number }, b: { column: number; row: number; columnSpan: number; rowSpan: number }) {
  return a.column < b.column + b.columnSpan && a.column + a.columnSpan > b.column && a.row < b.row + b.rowSpan && a.row + a.rowSpan > b.row;
}

function insideWorkspace(rect: { column: number; row: number; columnSpan: number; rowSpan: number }, floor: MapFloor) {
  return rect.column >= 0 && rect.row >= 0 && rect.column + rect.columnSpan <= floor.columns && rect.row + rect.rowSpan <= floor.rows;
}

function pointInRing(point: [number, number], ring: unknown): boolean {
  if (!Array.isArray(ring) || ring.length < 4) return false;
  const points = ring.filter((p): p is [number, number] => Array.isArray(p) && p.length === 2 && p.every(Number.isFinite));
  if (points.length < 4) return false;
  let inside = false;
  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    const [xi, yi] = points[i];
    const [xj, yj] = points[j];
    if ((yi > point[1]) !== (yj > point[1]) && point[0] < ((xj - xi) * (point[1] - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

function insideFootprint(rect: { column: number; row: number; columnSpan: number; rowSpan: number }, floor: MapFloor) {
  const footprint = floor.footprint;
  if (footprint.mode === 'workspace') return true;
  const regions = Array.isArray(footprint.regions) ? footprint.regions : [];
  const corners: [number, number][] = [
    [rect.column + 0.0001, rect.row + 0.0001],
    [rect.column + rect.columnSpan - 0.0001, rect.row + 0.0001],
    [rect.column + 0.0001, rect.row + rect.rowSpan - 0.0001],
    [rect.column + rect.columnSpan - 0.0001, rect.row + rect.rowSpan - 0.0001],
  ];
  return corners.every((corner) => regions.some((region) => {
    if (!isObject(region)) return false;
    const r = rectFrom(region);
    if (r) return corner[0] >= r.column && corner[0] <= r.column + r.columnSpan && corner[1] >= r.row && corner[1] <= r.row + r.rowSpan;
    return pointInRing(corner, region.outer);
  }));
}

type Rect = { column: number; row: number; columnSpan: number; rowSpan: number };

function entranceClearance(entrance: MapEntrance, floor: MapFloor): Rect | null {
  if (entrance.floorId !== floor.id) return null;
  const halfWidth = entrance.widthCells / 2;
  if (entrance.side === 'top' || entrance.side === 'bottom') {
    return {
      column: entrance.edgePosition - halfWidth,
      row: entrance.side === 'top' ? 0 : floor.rows - entrance.clearanceDepthCells,
      columnSpan: entrance.widthCells,
      rowSpan: entrance.clearanceDepthCells,
    };
  }
  return {
    column: entrance.side === 'left' ? 0 : floor.columns - entrance.clearanceDepthCells,
    row: entrance.edgePosition - halfWidth,
    columnSpan: entrance.clearanceDepthCells,
    rowSpan: entrance.widthCells,
  };
}

function validateFloorGeometry(floor: MapFloor, entrance?: MapEntrance) {
  const seen = new Set<string>();
  const placementRects: { id: string; rect: { column: number; row: number; columnSpan: number; rowSpan: number } }[] = [];
  for (const placement of floor.placements) {
    if (seen.has(placement.stallId)) throw mapError('STALL_ALREADY_PLACED', 'Một sạp chỉ được đặt một lần', { stallId: placement.stallId }, 409);
    seen.add(placement.stallId);
    const rect = placement;
    if (!insideWorkspace(rect, floor)) throw mapError('LAYOUT_INVALID', 'Sạp nằm ngoài workspace', { stallId: placement.stallId });
    if (!insideFootprint(rect, floor)) throw mapError('OUTSIDE_FOOTPRINT', 'Sạp nằm ngoài footprint', { stallId: placement.stallId }, 409);
    for (const existing of placementRects) {
      if (intersects(existing.rect, rect))
        throw mapError('PLACEMENT_OVERLAP', 'Các sạp không được chồng lên nhau', { stallIds: [existing.id, placement.stallId] }, 409);
    }
    placementRects.push({ id: placement.stallId, rect });
  }
  const blockingObjects: { type: string; rect: Rect; id: unknown }[] = [];
  for (const object of floor.objects) {
    const type = object.type;
    if (typeof type !== 'string') throw mapError('OBJECT_GEOMETRY_INVALID', 'Object thiếu type', undefined, 409);
    const blocks = BLOCKING_OBJECT_TYPES.has(type) || (type === 'generic' && object.blocksPlacement === true);
    if (!blocks) continue;
    const rect = rectFrom(object);
    if (!rect) throw mapError('OBJECT_GEOMETRY_INVALID', 'Object chặn sạp phải có hình chữ nhật hợp lệ', undefined, 409);
    if (!insideWorkspace(rect, floor) || !insideFootprint(rect, floor))
      throw mapError('OUTSIDE_FOOTPRINT', 'Object chặn sạp nằm ngoài footprint', { type }, 409);
    for (const placement of placementRects) {
      if (intersects(rect, placement.rect))
        throw mapError('PLACEMENT_BLOCKED', 'Sạp giao với lối đi hoặc hạ tầng', { stallId: placement.id, type }, 409);
    }
    for (const existing of blockingObjects) {
      // Several aisle segments may intersect to form L/T/cross passages. Every
      // other blocking object must stay distinct and visible.
      if (type !== 'aisle' && existing.type !== 'aisle' && intersects(rect, existing.rect))
        throw mapError('OBJECT_GEOMETRY_INVALID', 'Các hạ tầng/vùng chặn không được chồng lên nhau', {
          type,
          objectId: object.id,
          conflictingObjectId: existing.id,
        }, 409);
      if ((type === 'stair' || existing.type === 'stair') && intersects(rect, existing.rect))
        throw mapError('STAIR_GEOMETRY_INVALID', 'Cầu thang không được chồng lối đi hoặc hạ tầng khác', {
          type,
          objectId: object.id,
          conflictingObjectId: existing.id,
        }, 409);
    }
    blockingObjects.push({ type, rect, id: object.id });
  }
  const clearance = entrance ? entranceClearance(entrance, floor) : null;
  if (clearance) {
    if (!insideWorkspace(clearance, floor) || !insideFootprint(clearance, floor))
      throw mapError('ENTRANCE_GEOMETRY_INVALID', 'Vùng trống của cửa chính nằm ngoài footprint', undefined, 422);
    for (const placement of placementRects) {
      if (intersects(clearance, placement.rect))
        throw mapError('ENTRANCE_GEOMETRY_INVALID', 'Vùng trống cửa chính giao với sạp', { stallId: placement.id }, 422);
    }
    for (const object of blockingObjects) {
      if (object.type !== 'aisle' && intersects(clearance, object.rect))
        throw mapError('ENTRANCE_GEOMETRY_INVALID', 'Vùng trống cửa chính giao với hạ tầng hoặc vùng cấm', {
          objectId: object.id,
          type: object.type,
        }, 422);
    }
  }
}

async function getStalls(marketId: string, tx?: Tx): Promise<StallRecord[]> {
  const client = tx ?? prisma;
  return client.stalls.findMany({
    where: { market_id: marketId },
    orderBy: [{ zones: { display_order: 'asc' } }, { display_order: 'asc' }, { code: 'asc' }],
    select: {
      id: true, code: true, name: true, status: true, category_id: true, zone_id: true, display_order: true,
      categories: { select: { id: true, name: true } },
      zones: { select: { id: true, name: true, display_order: true, categories: { select: { id: true, name: true } } } },
    },
  }) as Promise<StallRecord[]>;
}

function categoryOf(stall: StallRecord) {
  return stall.categories ?? stall.zones.categories ?? null;
}

function snapshotStall(stall: StallRecord): PublicStallSnapshot {
  return {
    id: stall.id,
    code: stall.code,
    name: stall.name,
    status: stall.status,
    zone: { id: stall.zones.id, name: stall.zones.name },
    category: categoryOf(stall),
    // Publication never authorizes a seller page by itself. This snapshot is
    // replaced with a live contract overlay when a public floor is read.
    canOpenDetail: false,
    availability: stall.status === 'occupied' ? 'operating' : stall.status as 'vacant' | 'reserved' | 'maintenance',
  };
}

async function liveStallSnapshots(marketId: string, stallIds: string[]) {
  if (stallIds.length === 0) return new Map<string, PublicStallSnapshot>();
  const [stalls, contracts] = await Promise.all([
    prisma.stalls.findMany({
      where: { market_id: marketId, id: { in: stallIds } },
      select: {
        id: true, code: true, name: true, status: true, category_id: true, zone_id: true,
        categories: { select: { id: true, name: true } },
        zones: { select: { id: true, name: true, categories: { select: { id: true, name: true } } } },
      },
    }),
    prisma.contracts.findMany({
      where: { stall_id: { in: stallIds }, ...effectiveContractWhere() },
      select: { stall_id: true },
    }),
  ]);
  const effective = new Set(contracts.map((contract) => contract.stall_id));
  return new Map(stalls.map((stall) => {
    const operating = stall.status === 'occupied' && effective.has(stall.id);
    return [stall.id, {
      ...snapshotStall(stall as StallRecord),
      canOpenDetail: operating,
      availability: operating ? 'operating' : stall.status as 'vacant' | 'occupied' | 'reserved' | 'maintenance',
    }];
  }));
}

function legendFor(document: MapDocument, stalls: StallRecord[]): LegendEntry[] {
  const placed = new Map<string, { active: number; inactive: number }>();
  for (const floor of document.floors) for (const placement of floor.placements) {
    const bucket = placed.get(placement.stallId) ?? { active: 0, inactive: 0 };
    if (floor.isActive) bucket.active += 1;
    else bucket.inactive += 1;
    placed.set(placement.stallId, bucket);
  }
  const entries = new Map<string, LegendEntry>();
  for (const stall of stalls) {
    const category = categoryOf(stall);
    const key = category?.id ?? 'uncategorized';
    const current = entries.get(key) ?? {
      categoryId: category?.id ?? null,
      name: category?.name ?? 'Chưa phân ngành',
      color: category?.id && document.categoryColorOverrides[category.id]
        ? document.categoryColorOverrides[category.id]
        : PALETTE[entries.size % PALETTE.length],
      placedCount: 0,
      unplacedCount: 0,
      inactiveFloorPlacementCount: 0,
    };
    const state = placed.get(stall.id);
    if (state?.active) current.placedCount += 1;
    else current.unplacedCount += 1;
    current.inactiveFloorPlacementCount += state?.inactive ?? 0;
    entries.set(key, current);
  }
  return [...entries.values()].sort((a, b) => a.name.localeCompare(b.name, 'vi'));
}

async function assertStallsBelongToMarket(document: MapDocument, marketId: string, tx?: Tx) {
  const stalls = await getStalls(marketId, tx);
  const known = new Map(stalls.map((stall) => [stall.id, stall]));
  const placed = new Set<string>();
  for (const floor of document.floors) {
    validateFloorGeometry(floor, document.mainEntrance);
    for (const placement of floor.placements) {
      if (placed.has(placement.stallId))
        throw mapError('STALL_ALREADY_PLACED', 'Một sạp không được đặt trên nhiều tầng', { stallId: placement.stallId }, 409);
      if (!known.has(placement.stallId))
        throw mapError('LAYOUT_INVALID', 'Sạp không tồn tại hoặc không thuộc chợ này', { stallId: placement.stallId });
      placed.add(placement.stallId);
    }
  }
  return stalls;
}

async function readMarket(marketId: string, tx?: Tx, lock = false): Promise<MarketMapRow> {
  const client = tx ?? prisma;
  const rows = await client.$queryRaw<MarketMapRow[]>(Prisma.sql`
    SELECT "id", "status", "map_link", "map_layout_draft", "map_layout_draft_version", "map_layout_published", "map_layout_revisions"
    FROM "markets" WHERE "id" = ${marketId}::uuid${lock ? Prisma.sql` FOR UPDATE` : Prisma.empty}`);
  if (!rows[0]) throw notFound('Không tìm thấy chợ');
  return rows[0];
}

function draftFromRow(row: MarketMapRow): { document: MapDocument; isVirtual: boolean } {
  const draft = jsonValue(row.map_layout_draft);
  // Old v1 documents are normalized to v2 in memory. They are persisted as v2
  // only on the next draft mutation, so simply reading a map is non-mutating.
  return isObject(draft)
    ? { document: normalizeDocument(draft), isVirtual: false }
    : { document: defaultMapDocument(row.id), isVirtual: true };
}

function placementBlockers(floor: MapFloor, entrance: MapEntrance): Rect[] {
  const blockers: Rect[] = floor.placements.map((placement) => ({
    column: placement.column,
    row: placement.row,
    columnSpan: placement.columnSpan,
    rowSpan: placement.rowSpan,
  }));
  for (const object of floor.objects) {
    const type = typeof object.type === 'string' ? object.type : '';
    if (!BLOCKING_OBJECT_TYPES.has(type) && !(type === 'generic' && object.blocksPlacement === true)) continue;
    const rect = rectFrom(object);
    if (rect) blockers.push(rect);
  }
  const clearance = entranceClearance(entrance, floor);
  if (clearance) blockers.push(clearance);
  return blockers;
}

function firstFreeCell(floor: MapFloor, entrance: MapEntrance): { column: number; row: number } | null {
  const blockers = placementBlockers(floor, entrance);
  for (let row = 0; row < floor.rows; row += 1) {
    for (let column = 0; column < floor.columns; column += 1) {
      const candidate = { column, row, columnSpan: 1, rowSpan: 1 };
      if (!insideFootprint(candidate, floor)) continue;
      if (!blockers.some((rect) => intersects(rect, candidate))) return { column, row };
    }
  }
  return null;
}

function expandFloorForTemporaryPlacement(floor: MapFloor) {
  const oldColumns = floor.columns;
  const oldRows = floor.rows;
  if (floor.columns < MAX_GRID) floor.columns += 1;
  else if (floor.rows < MAX_GRID) floor.rows += 1;
  else throw mapError('LAYOUT_LIMIT_REACHED', 'Sơ đồ đã đạt kích thước tối đa, không thể tạo thêm vị trí tạm', undefined, 409);

  if (floor.footprint.mode === 'workspace') {
    floor.footprint = { ...defaultFootprint(floor.columns, floor.rows), isLocked: floor.footprint.isLocked === true };
    return;
  }
  const regions = Array.isArray(floor.footprint.regions) ? [...floor.footprint.regions] : [];
  regions.push(floor.columns > oldColumns
    ? { shape: 'rect', column: oldColumns, row: 0, columnSpan: 1, rowSpan: oldRows }
    : { shape: 'rect', column: 0, row: oldRows, columnSpan: floor.columns, rowSpan: 1 });
  floor.footprint = { ...floor.footprint, regions };
}

/**
 * Fill missing stalls into deterministic one-cell draft positions. Existing
 * placements are never moved. Generated positions stay distinguishable until
 * an editor explicitly moves them.
 */
function addTemporaryPlacements(document: MapDocument, stalls: StallRecord[]): number {
  const placed = new Set(document.floors.flatMap((floor) => floor.placements.map((placement) => placement.stallId)));
  const activeFloors = document.floors.filter((floor) => floor.isActive);
  const entranceFloor = activeFloors.find((floor) => floor.id === document.mainEntrance.floorId);
  const targetFloors = entranceFloor
    ? [entranceFloor, ...activeFloors.filter((floor) => floor.id !== entranceFloor.id)]
    : activeFloors;
  if (!targetFloors.length) throw mapError('MAIN_ENTRANCE_REQUIRED', 'Không có tầng hoạt động để đặt sạp', undefined, 409);

  let added = 0;
  for (const stall of stalls) {
    if (placed.has(stall.id)) continue;
    let target: MapFloor | null = null;
    let cell: { column: number; row: number } | null = null;
    for (const floor of targetFloors) {
      const candidate = firstFreeCell(floor, document.mainEntrance);
      if (candidate) {
        target = floor;
        cell = candidate;
        break;
      }
    }
    target ??= targetFloors[0];
    while (!cell) {
      expandFloorForTemporaryPlacement(target);
      cell = firstFreeCell(target, document.mainEntrance);
    }
    target.placements.push({
      stallId: stall.id,
      column: cell.column,
      row: cell.row,
      columnSpan: 1,
      rowSpan: 1,
      rotation: 0,
      textRotation: 0,
      spatialBlockId: null,
      rowGroupId: null,
      isTemporary: true,
    });
    placed.add(stall.id);
    added += 1;
  }
  return added;
}

export async function getAssignmentMapPreview(marketId: string) {
  const [row, stalls] = await Promise.all([readMarket(marketId), getStalls(marketId)]);
  const { document, isVirtual } = draftFromRow(row);
  const preview = copy(document);
  addTemporaryPlacements(preview, stalls);
  await assertStallsBelongToMarket(preview, marketId);
  return { ...overview(preview, isVirtual, row, stalls), document: preview };
}

export async function autoPlaceDraftStalls(
  marketId: string,
  expectedDraftVersionValue: unknown,
  userId: string,
) {
  return prisma.$transaction(async (tx) => {
    const row = await readMarket(marketId, tx, true);
    const expected = expectedVersion(expectedDraftVersionValue);
    versionGuard(row, expected);
    const { document, isVirtual } = draftFromRow(row);
    const stalls = await getStalls(marketId, tx);
    const addedCount = addTemporaryPlacements(document, stalls);
    if (!addedCount && !isVirtual)
      return { ...overview(document, false, row, stalls), document, addedCount: 0 };
    document.updatedBy = userId;
    document.updatedAt = new Date().toISOString();
    await assertStallsBelongToMarket(document, marketId, tx);
    await writeDraft(tx, marketId, document, expected + 1);
    return {
      ...overview(document, false, { ...row, map_layout_draft_version: expected + 1 }, stalls),
      document,
      addedCount,
    };
  });
}

export async function ensureTemporaryDraftPlacementsTx(tx: Tx, marketId: string, userId: string) {
  const row = await readMarket(marketId, tx, true);
  const { document, isVirtual } = draftFromRow(row);
  const stalls = await getStalls(marketId, tx);
  const addedCount = addTemporaryPlacements(document, stalls);
  if (!addedCount && !isVirtual) return { document, draftVersion: row.map_layout_draft_version, addedCount: 0 };
  document.updatedBy = userId;
  document.updatedAt = new Date().toISOString();
  await assertStallsBelongToMarket(document, marketId, tx);
  await writeDraft(tx, marketId, document, row.map_layout_draft_version + 1);
  return { document, draftVersion: row.map_layout_draft_version + 1, addedCount };
}

async function writeDraft(tx: Tx, marketId: string, document: MapDocument, nextVersion: number) {
  await tx.$executeRaw(Prisma.sql`
    UPDATE "markets"
    SET "map_layout_draft" = ${JSON.stringify(document)}::jsonb,
        "map_layout_draft_version" = ${nextVersion},
        "updated_at" = now()
    WHERE "id" = ${marketId}::uuid`);
}

function expectedVersion(value: unknown) {
  return asInt(value, 'expectedDraftVersion', 0, Number.MAX_SAFE_INTEGER);
}

function versionGuard(row: MarketMapRow, expected: number) {
  if (row.map_layout_draft_version !== expected)
    throw conflict('LAYOUT_VERSION_CONFLICT', 'Bản nháp đã được chỉnh sửa bởi người khác', { draftVersion: row.map_layout_draft_version });
}

function overview(document: MapDocument, isVirtual: boolean, row: MarketMapRow, stalls: StallRecord[]) {
  const legend = legendFor(document, stalls);
  const activePlacementIds = new Set(document.floors.filter((floor) => floor.isActive).flatMap((floor) => floor.placements.map((p) => p.stallId)));
  const inactiveFloorPlacementCount = document.floors.filter((floor) => !floor.isActive).reduce((total, floor) => total + floor.placements.length, 0);
  const published = jsonValue(row.map_layout_published) as MapDocument | null;
  return {
    marketId: row.id,
    isVirtual,
    draftVersion: row.map_layout_draft_version,
    publishedRevisionId: published?.revisionId ?? null,
    publishedRevisionNumber: published?.revisionNumber ?? null,
    mainEntrance: document.mainEntrance,
    legend,
    floors: document.floors.map((floor) => ({
      id: floor.id, name: floor.name, displayOrder: floor.displayOrder, columns: floor.columns, rows: floor.rows,
      isActive: floor.isActive, placementCount: floor.placements.length,
    })),
    unplacedCount: Math.max(0, stalls.length - activePlacementIds.size),
    temporaryPlacementCount: document.floors.reduce(
      (total, floor) => total + floor.placements.filter((placement) => placement.isTemporary).length,
      0,
    ),
    inactiveFloorPlacementCount,
  };
}

export async function getAdminMapOverview(marketId: string) {
  const [row, stalls] = await Promise.all([readMarket(marketId), getStalls(marketId)]);
  const { document, isVirtual } = draftFromRow(row);
  const preview = copy(document);
  addTemporaryPlacements(preview, stalls);
  // CMS needs every floor in memory to safely switch tabs without dropping
  // unsaved work. Missing legacy stalls receive preview-only temporary cells;
  // they are persisted on the next draft save or approval, never published here.
  return { ...overview(preview, isVirtual, row, stalls), document: preview };
}

export async function listMapStalls(marketId: string, query: { search?: string; categoryId?: string; zoneId?: string }) {
  const [row, stalls] = await Promise.all([readMarket(marketId), getStalls(marketId)]);
  const { document } = draftFromRow(row);
  addTemporaryPlacements(document, stalls);
  const placements = new Map<string, { floorId: string; floorName: string }>();
  for (const floor of document.floors) for (const placement of floor.placements) placements.set(placement.stallId, { floorId: floor.id, floorName: floor.name });
  const term = query.search?.trim().toLocaleLowerCase('vi');
  return stalls.filter((stall) => {
    const category = categoryOf(stall);
    return (!query.categoryId || category?.id === query.categoryId)
      && (!query.zoneId || stall.zone_id === query.zoneId)
      && (!term || [stall.code, stall.name ?? '', category?.name ?? ''].some((v) => v.toLocaleLowerCase('vi').includes(term)));
  }).map((stall) => ({
    id: stall.id, code: stall.code, name: stall.name, status: stall.status,
    zone: { id: stall.zones.id, name: stall.zones.name }, category: categoryOf(stall),
    placementStatus: placements.has(stall.id) ? 'placed' : 'unplaced', placement: placements.get(stall.id) ?? null,
  }));
}

export async function saveMapDraft(marketId: string, body: Record<string, unknown>, userId: string) {
  return prisma.$transaction(async (tx) => {
    const row = await readMarket(marketId, tx, true);
    const expected = expectedVersion(body.expectedDraftVersion);
    versionGuard(row, expected);
    const rawDocument = body.document ?? body;
    const document = normalizeDocument(rawDocument, userId);
    const stalls = await assertStallsBelongToMarket(document, marketId);
    await writeDraft(tx, marketId, document, expected + 1);
    return { ...overview(document, false, { ...row, map_layout_draft_version: expected + 1 }, stalls), document };
  });
}

function materializedDocument(row: MarketMapRow): MapDocument {
  if (!isObject(jsonValue(row.map_layout_draft)))
    throw conflict('DRAFT_NOT_MATERIALIZED', 'Hãy lưu toàn bộ bản nháp trước khi chỉnh sửa từng tầng');
  return copy(jsonValue(row.map_layout_draft) as MapDocument);
}

export async function getMapFloor(marketId: string, floorId: string) {
  const row = await readMarket(marketId);
  const { document, isVirtual } = draftFromRow(row);
  const floor = document.floors.find((item) => item.id === floorId);
  if (!floor) throw new AppError(404, 'FLOOR_NOT_FOUND', 'Không tìm thấy tầng');
  return { marketId, isVirtual, draftVersion: row.map_layout_draft_version, mainEntrance: document.mainEntrance, floor };
}

export async function updateMapFloor(marketId: string, floorId: string, body: Record<string, unknown>, userId: string) {
  return prisma.$transaction(async (tx) => {
    const row = await readMarket(marketId, tx, true);
    const expected = expectedVersion(body.expectedDraftVersion);
    versionGuard(row, expected);
    const document = materializedDocument(row);
    const index = document.floors.findIndex((item) => item.id === floorId);
    if (index < 0) throw new AppError(404, 'FLOOR_NOT_FOUND', 'Không tìm thấy tầng');
    const current = document.floors[index];
    const incoming = asObject(body.floor ?? body);
    const floor = normalizeFloor({ ...incoming, id: floorId, name: incoming.name ?? current.name, displayOrder: current.displayOrder, isActive: current.isActive }, current.displayOrder);
    document.floors[index] = floor;
    const normalized = normalizeDocument({ ...document, updatedBy: userId }, userId);
    const stalls = await assertStallsBelongToMarket(normalized, marketId);
    await writeDraft(tx, marketId, normalized, expected + 1);
    return { draftVersion: expected + 1, floor: normalized.floors.find((item) => item.id === floorId), legend: legendFor(normalized, stalls) };
  });
}

export async function validateMapFloor(marketId: string, floorId: string, body: Record<string, unknown>) {
  const row = await readMarket(marketId);
  const { document } = draftFromRow(row);
  const index = document.floors.findIndex((item) => item.id === floorId);
  if (index < 0) throw new AppError(404, 'FLOOR_NOT_FOUND', 'Không tìm thấy tầng');
  const current = document.floors[index];
  const candidate = normalizeFloor({ ...asObject(body.floor ?? body), id: floorId, name: current.name, displayOrder: current.displayOrder, isActive: current.isActive }, current.displayOrder);
  document.floors[index] = candidate;
  const normalized = normalizeDocument(document);
  const stalls = await assertStallsBelongToMarket(normalized, marketId);
  return { valid: true, floor: candidate, legend: legendFor(normalized, stalls) };
}

export async function createMapFloor(marketId: string, body: Record<string, unknown>, userId: string) {
  return prisma.$transaction(async (tx) => {
    const row = await readMarket(marketId, tx, true);
    const expected = expectedVersion(body.expectedDraftVersion);
    versionGuard(row, expected);
    const document = materializedDocument(row);
    if (document.floors.length >= MAX_FLOORS) throw mapError('LAYOUT_INVALID', `Chợ chỉ hỗ trợ tối đa ${MAX_FLOORS} tầng`);
    const columns = asInt(body.columns ?? DEFAULT_COLUMNS, 'columns', 4, MAX_GRID);
    const rows = asInt(body.rows ?? DEFAULT_ROWS, 'rows', 4, MAX_GRID);
    const floor: MapFloor = {
      id: uuidv4(), name: asString(body.name ?? `Tầng ${document.floors.length + 1}`, 'Tên tầng', 100),
      displayOrder: document.floors.length, columns, rows, metersPerCell: null, isActive: true,
      footprint: defaultFootprint(columns, rows), blocks: [], rowGroups: [], objects: [], accessMarker: null, referenceLayer: null, placements: [],
    };
    document.floors.push(floor);
    const normalized = normalizeDocument({ ...document, updatedBy: userId }, userId);
    const stalls = await assertStallsBelongToMarket(normalized, marketId);
    await writeDraft(tx, marketId, normalized, expected + 1);
    return { draftVersion: expected + 1, floor, legend: legendFor(normalized, stalls) };
  });
}

export async function renameMapFloor(marketId: string, floorId: string, body: Record<string, unknown>, userId: string) {
  return prisma.$transaction(async (tx) => {
    const row = await readMarket(marketId, tx, true);
    const expected = expectedVersion(body.expectedDraftVersion);
    versionGuard(row, expected);
    const document = materializedDocument(row);
    const floor = document.floors.find((item) => item.id === floorId);
    if (!floor) throw new AppError(404, 'FLOOR_NOT_FOUND', 'Không tìm thấy tầng');
    floor.name = asString(body.name, 'Tên tầng', 100);
    const normalized = normalizeDocument({ ...document, updatedBy: userId }, userId);
    await assertStallsBelongToMarket(normalized, marketId);
    await writeDraft(tx, marketId, normalized, expected + 1);
    return { draftVersion: expected + 1, floor: normalized.floors.find((item) => item.id === floorId) };
  });
}

export async function deleteMapFloor(marketId: string, floorId: string, body: Record<string, unknown>, userId: string) {
  return prisma.$transaction(async (tx) => {
    const row = await readMarket(marketId, tx, true);
    const expected = expectedVersion(body.expectedDraftVersion);
    versionGuard(row, expected);
    const document = materializedDocument(row);
    const floor = document.floors.find((item) => item.id === floorId);
    if (!floor) throw new AppError(404, 'FLOOR_NOT_FOUND', 'Không tìm thấy tầng');
    if (floor.placements.length && body.confirmRemovePlacements !== true)
      throw conflict('FLOOR_DELETE_REQUIRES_BATCH', 'Tầng còn sạp; hãy xác nhận đưa sạp về khay trước khi xóa', {
        placementCount: floor.placements.length,
      });
    if (document.mainEntrance.floorId === floorId) {
      if (!body.nextMainEntrance)
        throw conflict('MAIN_ENTRANCE_REQUIRED', 'Hãy chọn cửa chính mới trước khi xóa tầng này');
      document.mainEntrance = normalizeEntrance(body.nextMainEntrance, document.floors.filter((item) => item.id !== floorId));
    }
    if (floor.isActive && document.floors.filter((item) => item.isActive).length === 1)
      throw conflict('LAST_ACTIVE_FLOOR', 'Sơ đồ phải còn ít nhất một tầng hoạt động');
    const linkedCores = new Set(
      floor.objects
        .filter((object) => object.type === 'stair' && typeof object.coreGroupId === 'string')
        .map((object) => String(object.coreGroupId)),
    );
    if (linkedCores.size && body.unlinkStairs !== true)
      throw conflict('FLOOR_DELETE_REQUIRES_BATCH', 'Tầng có cầu thang liên kết; hãy xác nhận bỏ liên kết ở tầng còn lại', {
        coreGroupIds: [...linkedCores],
      });
    document.floors = document.floors.filter((item) => item.id !== floorId).map((item, index) => ({ ...item, displayOrder: index }));
    if (linkedCores.size) {
      for (const remaining of document.floors) {
        remaining.objects = remaining.objects.map((object) => (
          object.type === 'stair' && linkedCores.has(String(object.coreGroupId))
            ? { ...object, coreGroupId: null }
            : object
        ));
      }
    }
    const normalized = normalizeDocument({ ...document, updatedBy: userId }, userId);
    await assertStallsBelongToMarket(normalized, marketId);
    await writeDraft(tx, marketId, normalized, expected + 1);
    return { draftVersion: expected + 1, document: normalized };
  });
}

export async function setMapEntrance(marketId: string, body: Record<string, unknown>, userId: string) {
  return prisma.$transaction(async (tx) => {
    const row = await readMarket(marketId, tx, true);
    const expected = expectedVersion(body.expectedDraftVersion);
    versionGuard(row, expected);
    const document = materializedDocument(row);
    const candidate = normalizeEntrance(body.mainEntrance, document.floors);
    if (candidate.floorId !== document.mainEntrance.floorId)
      throw mapError('LAYOUT_INVALID', 'Đổi cửa chính sang tầng khác phải dùng lưu batch');
    document.mainEntrance = candidate;
    const normalized = normalizeDocument({ ...document, updatedBy: userId }, userId);
    await assertStallsBelongToMarket(normalized, marketId);
    await writeDraft(tx, marketId, normalized, expected + 1);
    return { draftVersion: expected + 1, mainEntrance: candidate };
  });
}

function buildPublished(document: MapDocument, stalls: StallRecord[], userId: string, revisionNumber: number): MapDocument {
  const published = copy(document);
  const byId = new Map(stalls.map((stall) => [stall.id, stall]));
  for (const floor of published.floors) {
    floor.placements = floor.placements.map((placement) => ({ ...placement, stall: snapshotStall(byId.get(placement.stallId)!) }));
  }
  published.revisionId = uuidv4();
  published.revisionNumber = revisionNumber;
  published.publishedBy = userId;
  published.publishedAt = new Date().toISOString();
  published.legend = legendFor(published, stalls);
  return published;
}

export async function publishMap(marketId: string, body: Record<string, unknown>, userId: string) {
  return prisma.$transaction(async (tx) => {
    const row = await readMarket(marketId, tx, true);
    const expected = expectedVersion(body.expectedDraftVersion);
    versionGuard(row, expected);
    const document = materializedDocument(row);
    const stalls = await assertStallsBelongToMarket(document, marketId);
    const activeIds = new Set(document.floors.filter((floor) => floor.isActive).flatMap((floor) => floor.placements.map((p) => p.stallId)));
    const unplacedCount = Math.max(0, stalls.length - activeIds.size);
    const inactiveFloorPlacementCount = document.floors.filter((floor) => !floor.isActive).reduce((sum, floor) => sum + floor.placements.length, 0);
    if ((unplacedCount && body.confirmUnplaced !== true) || (inactiveFloorPlacementCount && body.confirmInactiveFloorPlacements !== true))
      throw conflict('PUBLISH_CONFIRMATION_REQUIRED', 'Cần xác nhận sạp chưa đặt hoặc nằm ở tầng inactive', { unplacedCount, inactiveFloorPlacementCount });
    const existing = jsonValue(row.map_layout_revisions);
    const revisions = Array.isArray(existing) ? existing.filter(isObject) as unknown as MapDocument[] : [];
    const nextRevision = Math.max(0, ...revisions.map((item) => item.revisionNumber ?? 0), (jsonValue(row.map_layout_published) as MapDocument | null)?.revisionNumber ?? 0) + 1;
    const published = buildPublished(document, stalls, userId, nextRevision);
    const nextRevisions = [published, ...revisions].slice(0, MAX_REVISIONS);
    await tx.$executeRaw(Prisma.sql`
      UPDATE "markets" SET "map_layout_published" = ${JSON.stringify(published)}::jsonb,
        "map_layout_revisions" = ${JSON.stringify(nextRevisions)}::jsonb, "updated_at" = now()
      WHERE "id" = ${marketId}::uuid`);
    return { revisionId: published.revisionId, revisionNumber: published.revisionNumber, publishedAt: published.publishedAt };
  });
}

export async function listMapRevisions(marketId: string) {
  const row = await readMarket(marketId);
  const current = jsonValue(row.map_layout_published) as MapDocument | null;
  const revisions = jsonValue(row.map_layout_revisions);
  const items = (Array.isArray(revisions) ? revisions : []).filter(isObject) as unknown as MapDocument[];
  return items.map((revision) => ({
    id: revision.revisionId, revisionNumber: revision.revisionNumber, publishedAt: revision.publishedAt,
    publishedBy: revision.publishedBy, isCurrent: revision.revisionId === current?.revisionId,
    floorCount: revision.floors?.filter((floor) => floor.isActive).length ?? 0,
  }));
}

export async function restoreMapRevision(marketId: string, revisionId: string, body: Record<string, unknown>) {
  return prisma.$transaction(async (tx) => {
    const row = await readMarket(marketId, tx, true);
    const current = jsonValue(row.map_layout_published) as MapDocument | null;
    if (body.expectedPublishedRevisionId !== current?.revisionId)
      throw conflict('LAYOUT_VERSION_CONFLICT', 'Publication đã thay đổi, hãy tải lại trước khi khôi phục', { publishedRevisionId: current?.revisionId ?? null });
    const revisions = jsonValue(row.map_layout_revisions);
    const revision = (Array.isArray(revisions) ? revisions : []).find((item) => isObject(item) && item.revisionId === revisionId) as MapDocument | undefined;
    if (!revision) throw new AppError(410, 'REVISION_EXPIRED', 'Revision này không còn trong lịch sử');
    await tx.$executeRaw(Prisma.sql`
      UPDATE "markets" SET "map_layout_published" = ${JSON.stringify(revision)}::jsonb, "updated_at" = now()
      WHERE "id" = ${marketId}::uuid`);
    return { revisionId: revision.revisionId, revisionNumber: revision.revisionNumber };
  });
}

function publishedForRevision(row: MarketMapRow, revisionId: string): MapDocument {
  const current = jsonValue(row.map_layout_published) as MapDocument | null;
  if (current?.revisionId === revisionId) return current;
  const revisions = jsonValue(row.map_layout_revisions);
  const found = Array.isArray(revisions) ? revisions.find((item) => isObject(item) && item.revisionId === revisionId) : null;
  if (!found) throw new AppError(410, 'REVISION_EXPIRED', 'Revision này không còn trong lịch sử');
  return found as MapDocument;
}

async function publicFloor(marketId: string, floor: MapFloor, entrance: MapEntrance) {
  const live = await liveStallSnapshots(marketId, floor.placements.map((placement) => placement.stallId));
  return {
    id: floor.id, name: floor.name, displayOrder: floor.displayOrder, columns: floor.columns, rows: floor.rows,
    metersPerCell: floor.metersPerCell, hasMainEntrance: entrance.floorId === floor.id,
    accessMarker: floor.accessMarker ?? null,
    footprint: floor.footprint,
    blocks: floor.blocks.map(({ isLocked, ...block }) => block),
    rowGroups: floor.rowGroups.map(({ isLocked, ...group }) => group),
    objects: floor.objects.filter((object) => object.publishToApp !== false || BLOCKING_OBJECT_TYPES.has(String(object.type))).map(({ isLocked, ...object }) => object),
    referenceLayer: floor.referenceLayer && floor.referenceLayer.publishToApp === true
      ? { url: floor.referenceLayer.url, transform: floor.referenceLayer.transform, opacity: floor.referenceLayer.opacity }
      : null,
    placements: floor.placements.map(({ stall, ...placement }) => ({
      ...placement,
      // A missing live row is treated as non-openable rather than exposing a
      // stale snapshot after a stall was removed or made inactive.
      stall: live.get(placement.stallId) ?? (stall ? { ...stall, canOpenDetail: false, availability: 'vacant' as const } : undefined),
    })),
  };
}

export async function getPublicMapMetadata(marketId: string) {
  const row = await readMarket(marketId);
  if (row.status !== 'active') throw notFound('Chợ không tồn tại hoặc đã ngừng hoạt động');
  const published = jsonValue(row.map_layout_published) as MapDocument | null;
  if (!published?.revisionId) {
    if (row.map_link) return { mode: 'image', marketId, mapImageUrl: row.map_link };
    return { mode: 'empty', marketId };
  }
  return {
    mode: 'interactive', marketId, revisionId: published.revisionId, revisionNumber: published.revisionNumber,
    mainEntrance: published.mainEntrance, legend: published.legend ?? [],
    floors: published.floors.filter((floor) => floor.isActive).map((floor) => ({
      id: floor.id, name: floor.name, displayOrder: floor.displayOrder, columns: floor.columns, rows: floor.rows,
      metersPerCell: floor.metersPerCell, hasMainEntrance: published.mainEntrance.floorId === floor.id,
    })),
  };
}

export async function getPublicMapFloor(marketId: string, revisionId: string, floorId: string) {
  const row = await readMarket(marketId);
  if (row.status !== 'active') throw notFound('Chợ không tồn tại hoặc đã ngừng hoạt động');
  const published = publishedForRevision(row, revisionId);
  const floor = published.floors.find((item) => item.id === floorId && item.isActive);
  if (!floor) throw new AppError(404, 'FLOOR_NOT_FOUND', 'Không tìm thấy tầng công bố');
  return {
    marketId,
    revisionId,
    mainEntrance: published.mainEntrance,
    floor: await publicFloor(marketId, floor, published.mainEntrance),
  };
}

function searchText(value: string) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLocaleLowerCase('vi');
}

export async function searchPublicMap(marketId: string, revisionId: string, query: string) {
  const row = await readMarket(marketId);
  if (row.status !== 'active') throw notFound('Chợ không tồn tại hoặc đã ngừng hoạt động');
  const published = publishedForRevision(row, revisionId);
  const term = searchText(asString(query, 'q', 100));
  const matches = published.floors.filter((floor) => floor.isActive).flatMap((floor) => floor.placements.map((placement) => ({ floor, placement })))
    .filter(({ placement }) => placement.stall && [placement.stall.code, placement.stall.name ?? '', placement.stall.category?.name ?? ''].some((text) => searchText(text).includes(term)))
    .sort((a, b) => {
      const aCode = searchText(a.placement.stall!.code); const bCode = searchText(b.placement.stall!.code);
      const aRank = aCode === term ? 0 : aCode.startsWith(term) ? 1 : 2;
      const bRank = bCode === term ? 0 : bCode.startsWith(term) ? 1 : 2;
      return aRank - bRank || a.floor.displayOrder - b.floor.displayOrder || aCode.localeCompare(bCode, 'vi');
    }).slice(0, 20);
  const live = await liveStallSnapshots(marketId, matches.map(({ placement }) => placement.stallId));
  const results = matches.map(({ floor, placement }) => ({
      stallId: placement.stallId, floorId: floor.id, floorName: floor.name,
      code: placement.stall!.code, name: placement.stall!.name, zone: placement.stall!.zone, category: placement.stall!.category,
      canOpenDetail: live.get(placement.stallId)?.canOpenDetail ?? false,
      availability: live.get(placement.stallId)?.availability ?? 'vacant',
    }));
  return { revisionId, results };
}

export function requireMapBody(value: unknown): Record<string, unknown> {
  if (!isObject(value)) throw badRequest('Payload sơ đồ không hợp lệ');
  return value;
}
