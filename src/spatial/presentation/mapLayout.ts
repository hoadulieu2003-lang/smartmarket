import type {
  AisleEntity,
  FacilityEntity,
  FloorEntity,
  GateEntity,
  IncidentEntity,
  InfrastructureEntity,
  LocalCoordinateSystem,
  PolygonGeometry,
  RectangleGeometry,
  SpatialGeometry,
  StallEntity,
  ZoneEntity,
} from '../model/types';

export type GeometryMap = Record<string, SpatialGeometry>;

export interface MapPresentationLayout {
  coordinateSystem: LocalCoordinateSystem;
  boundary: PolygonGeometry;
  zones: Record<string, ZoneEntity['geometry']>;
  stalls: Record<string, StallEntity['geometry']>;
  aisles: Record<string, AisleEntity['geometry']>;
  gates: Record<string, GateEntity['geometry']>;
  facilities: Record<string, FacilityEntity['geometry']>;
  infrastructures: Record<string, InfrastructureEntity['geometry']>;
  incidents: Record<string, IncidentEntity['geometry']>;
}

interface RectFrame {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface ReflowOptions {
  columns?: number;
  headerHeight?: number;
  marginX?: number;
  marginBottom?: number;
  gapX?: number;
  gapY?: number;
}

const FIXTURE_A_FRAMES: Record<string, RectFrame> = {
  zone_B: { x: 28, y: 34, width: 770, height: 318 },
  zone_A: { x: 882, y: 34, width: 770, height: 318 },
  zone_C: { x: 28, y: 458, width: 500, height: 360 },
  zone_D: { x: 590, y: 458, width: 500, height: 360 },
  zone_E: { x: 1152, y: 458, width: 500, height: 360 },
};

const FIXTURE_B_FRAMES: Record<string, RectFrame> = {
  zone_L_north: { x: 82, y: 72, width: 636, height: 274 },
  zone_L_west: { x: 82, y: 382, width: 272, height: 326 },
};

const FIXTURE_C_FRAMES: Record<string, RectFrame> = {
  zone_block_west: { x: 76, y: 72, width: 366, height: 456 },
  zone_bridge_corridor: { x: 468, y: 244, width: 264, height: 112 },
  zone_block_east: { x: 758, y: 72, width: 366, height: 456 },
};

function cloneSpatialGeometry(geometry: SpatialGeometry): SpatialGeometry {
  switch (geometry.type) {
    case 'point':
      return { ...geometry, coordinates: [...geometry.coordinates] };
    case 'rectangle':
      return { ...geometry };
    case 'polygon':
      return {
        ...geometry,
        vertices: geometry.vertices.map(([x, y]) => [x, y]),
        holes: geometry.holes?.map((hole) => hole.map(([x, y]) => [x, y])),
      };
    case 'path':
      return { ...geometry, points: geometry.points.map(([x, y]) => [x, y]) };
  }
}

function createBaseLayout(floor: FloorEntity): MapPresentationLayout {
  return {
    coordinateSystem: {
      ...floor.coordinateSystem,
      rotationConvention: { ...floor.coordinateSystem.rotationConvention },
    },
    boundary: cloneSpatialGeometry(floor.boundary) as PolygonGeometry,
    zones: Object.fromEntries(floor.zones.map((zone) => [zone.id, cloneSpatialGeometry(zone.geometry)])) as MapPresentationLayout['zones'],
    stalls: Object.fromEntries(floor.stalls.map((stall) => [stall.id, cloneSpatialGeometry(stall.geometry)])) as MapPresentationLayout['stalls'],
    aisles: Object.fromEntries(floor.aisles.map((aisle) => [aisle.id, cloneSpatialGeometry(aisle.geometry)])) as MapPresentationLayout['aisles'],
    gates: Object.fromEntries(floor.gates.map((gate) => [gate.id, cloneSpatialGeometry(gate.geometry)])) as MapPresentationLayout['gates'],
    facilities: Object.fromEntries(floor.facilities.map((facility) => [facility.id, cloneSpatialGeometry(facility.geometry)])) as MapPresentationLayout['facilities'],
    infrastructures: Object.fromEntries(floor.infrastructures.map((infra) => [infra.id, cloneSpatialGeometry(infra.geometry)])) as MapPresentationLayout['infrastructures'],
    incidents: Object.fromEntries(floor.incidents.map((incident) => [incident.id, cloneSpatialGeometry(incident.geometry)])) as MapPresentationLayout['incidents'],
  };
}

function zoneStalls(floor: FloorEntity, zoneId: string, zoneCode: string) {
  return floor.stalls
    .filter((stall) => stall.zoneId === zoneId || stall.code.startsWith(zoneCode))
    .sort((a, b) => a.code.localeCompare(b.code, undefined, { numeric: true }));
}

function reflowZone(
  floor: FloorEntity,
  layout: MapPresentationLayout,
  zoneId: string,
  frame: RectFrame,
  options: ReflowOptions = {},
) {
  const zone = floor.zones.find((item) => item.id === zoneId);
  if (!zone) return;

  layout.zones[zoneId] = { type: 'rectangle', ...frame };

  const stalls = zoneStalls(floor, zoneId, zone.code);
  if (stalls.length === 0) return;

  const columns = Math.max(1, Math.min(options.columns ?? (stalls.length >= 16 ? 8 : stalls.length >= 6 ? 3 : stalls.length >= 2 ? 2 : 1), stalls.length));
  const rows = Math.ceil(stalls.length / columns);
  const marginX = options.marginX ?? 16;
  const headerHeight = options.headerHeight ?? 42;
  const marginBottom = options.marginBottom ?? 14;
  const gapX = options.gapX ?? 10;
  const gapY = options.gapY ?? 10;
  const usableWidth = frame.width - marginX * 2 - gapX * (columns - 1);
  const usableHeight = frame.height - headerHeight - marginBottom - gapY * (rows - 1);
  const stallWidth = Math.max(32, usableWidth / columns);
  const stallHeight = Math.max(32, usableHeight / rows);

  stalls.forEach((stall, index) => {
    const column = index % columns;
    const row = Math.floor(index / columns);
    const rotation = stall.rotation ?? (stall.geometry.type === 'rectangle' ? stall.geometry.rotation : undefined);
    const nextGeometry: RectangleGeometry = {
      type: 'rectangle',
      x: Math.round((frame.x + marginX + column * (stallWidth + gapX)) * 10) / 10,
      y: Math.round((frame.y + headerHeight + row * (stallHeight + gapY)) * 10) / 10,
      width: Math.round(stallWidth * 10) / 10,
      height: Math.round(stallHeight * 10) / 10,
      ...(rotation ? { rotation } : {}),
    };
    layout.stalls[stall.id] = nextGeometry;
  });
}

function applyFixtureALayout(floor: FloorEntity, layout: MapPresentationLayout) {
  Object.entries(FIXTURE_A_FRAMES).forEach(([zoneId, frame]) => reflowZone(floor, layout, zoneId, frame));

  layout.aisles.aisle_main_ns = {
    type: 'polygon',
    vertices: [
      [818, 20],
      [862, 20],
      [862, 860],
      [818, 860],
    ],
  };
  layout.aisles.aisle_sub_we_1 = {
    type: 'polygon',
    vertices: [
      [20, 382],
      [1660, 382],
      [1660, 428],
      [20, 428],
    ],
  };
}

function applyFixtureBLayout(floor: FloorEntity, layout: MapPresentationLayout) {
  reflowZone(floor, layout, 'zone_L_north', FIXTURE_B_FRAMES.zone_L_north, { columns: 3, headerHeight: 46, gapX: 16, gapY: 14 });
  reflowZone(floor, layout, 'zone_L_west', FIXTURE_B_FRAMES.zone_L_west, { columns: 2, headerHeight: 42, gapX: 14, gapY: 14 });
  layout.aisles.aisle_L_corridor = {
    type: 'path',
    points: [
      [720, 250],
      [382, 250],
      [382, 710],
    ],
    width: 42,
    widthMeters: 4.2,
    cap: 'round',
    join: 'round',
  };
}

function applyFixtureCLayout(floor: FloorEntity, layout: MapPresentationLayout) {
  reflowZone(floor, layout, 'zone_block_west', FIXTURE_C_FRAMES.zone_block_west, { columns: 2, headerHeight: 52, gapX: 18, gapY: 18 });
  reflowZone(floor, layout, 'zone_bridge_corridor', FIXTURE_C_FRAMES.zone_bridge_corridor, { columns: 1, headerHeight: 34, marginX: 14, marginBottom: 12 });
  reflowZone(floor, layout, 'zone_block_east', FIXTURE_C_FRAMES.zone_block_east, { columns: 1, headerHeight: 52, marginX: 76, marginBottom: 18 });
  layout.aisles.aisle_bridge_skywalk = {
    type: 'path',
    points: [
      [208, 300],
      [992, 300],
    ],
    width: 56,
    widthMeters: 5.6,
    cap: 'round',
    join: 'round',
  };
}

export function getMapPresentationLayout(floor: FloorEntity): MapPresentationLayout {
  const layout = createBaseLayout(floor);

  switch (floor.id) {
    case 'floor_1':
      applyFixtureALayout(floor, layout);
      break;
    case 'floor_ben_thanh_L':
      applyFixtureBLayout(floor, layout);
      break;
    case 'floor_cho_dam_bridge':
      applyFixtureCLayout(floor, layout);
      break;
    default:
      break;
  }

  return layout;
}

export function getPresentationGeometry(
  layout: MapPresentationLayout,
  entityId: string,
  fallback: SpatialGeometry,
): SpatialGeometry {
  return layout.stalls[entityId]
    ?? layout.zones[entityId]
    ?? layout.aisles[entityId]
    ?? layout.gates[entityId]
    ?? layout.facilities[entityId]
    ?? layout.infrastructures[entityId]
    ?? layout.incidents[entityId]
    ?? cloneSpatialGeometry(fallback);
}
