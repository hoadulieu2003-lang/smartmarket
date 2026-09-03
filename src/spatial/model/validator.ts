import type { 
  FloorEntity, 
  MarketEntity, 
  SpatialGeometry, 
  PolygonGeometry, 
  RectangleGeometry, 
  PathGeometry, 
  PointGeometry 
} from './types';

export interface ValidationError {
  entityType: string;
  entityId: string;
  code: string;
  message: string;
  field?: string;
}

export interface ValidationWarning {
  entityType: string;
  entityId: string;
  code: string;
  message: string;
  field?: string;
}

export interface ValidationReport {
  isValid: boolean;
  hasWarnings: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  stats: {
    totalEntities: number;
    zonesCount: number;
    stallsCount: number;
    aislesCount: number;
    gatesCount: number;
    facilitiesCount: number;
    infrastructuresCount: number;
    incidentsCount: number;
    totalOperationalIssues: number;
  };
}

/**
 * Kiểm tra tính hợp lệ của hình học không gian (Geometry Validation)
 */
export function validateGeometry(
  geom: SpatialGeometry,
  entityType: string,
  entityId: string,
  maxWidth: number,
  maxHeight: number
): { errors: ValidationError[]; warnings: ValidationWarning[] } {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  if (!geom || !geom.type) {
    errors.push({
      entityType,
      entityId,
      code: 'GEOM_MISSING_TYPE',
      message: 'Hình học thiếu thuộc tính `type`.'
    });
    return { errors, warnings };
  }

  const checkOutOfBounds = (x: number, y: number, name: string) => {
    if (x < 0 || x > maxWidth || y < 0 || y > maxHeight) {
      warnings.push({
        entityType,
        entityId,
        code: 'COORDINATE_OUT_OF_BOUNDS',
        message: `${name} [${x}, ${y}] nằm ngoài phạm vi giới hạn sàn [${maxWidth} x ${maxHeight}].`
      });
    }
  };

  switch (geom.type) {
    case 'point': {
      const pt = geom as PointGeometry;
      if (!Array.isArray(pt.coordinates) || pt.coordinates.length < 2 || typeof pt.coordinates[0] !== 'number' || typeof pt.coordinates[1] !== 'number') {
        errors.push({ entityType, entityId, code: 'POINT_INVALID_COORDS', message: 'Tọa độ Point phải là mảng [x, y] số hợp lệ.' });
      } else {
        checkOutOfBounds(pt.coordinates[0], pt.coordinates[1], 'Điểm');
      }
      break;
    }
    case 'rectangle': {
      const rect = geom as RectangleGeometry;
      if (typeof rect.x !== 'number' || typeof rect.y !== 'number' || typeof rect.width !== 'number' || typeof rect.height !== 'number') {
        errors.push({ entityType, entityId, code: 'RECT_INVALID_NUMBERS', message: 'Rectangle phải có x, y, width, height là số.' });
      } else if (rect.width <= 0 || rect.height <= 0) {
        errors.push({ entityType, entityId, code: 'RECT_INVALID_DIMENSIONS', message: `Rectangle có kích thước không hợp lệ (width: ${rect.width}, height: ${rect.height}).` });
      } else {
        checkOutOfBounds(rect.x, rect.y, 'Góc trên-trái');
        checkOutOfBounds(rect.x + rect.width, rect.y + rect.height, 'Góc dưới-phải');
      }
      break;
    }
    case 'polygon': {
      const poly = geom as PolygonGeometry;
      if (!Array.isArray(poly.vertices) || poly.vertices.length < 3) {
        errors.push({ entityType, entityId, code: 'POLY_INSUFFICIENT_VERTICES', message: `Polygon phải có tối thiểu 3 đỉnh (hiện có: ${poly.vertices?.length || 0}).` });
      } else {
        poly.vertices.forEach((v, idx) => {
          if (!Array.isArray(v) || v.length < 2 || typeof v[0] !== 'number' || typeof v[1] !== 'number') {
            errors.push({ entityType, entityId, code: 'POLY_INVALID_VERTEX', message: `Đỉnh polygon tại vị trí index ${idx} không phải là [x, y] hợp lệ.` });
          } else {
            checkOutOfBounds(v[0], v[1], `Đỉnh ${idx}`);
          }
        });
      }
      break;
    }
    case 'path': {
      const path = geom as PathGeometry;
      if (!Array.isArray(path.points) || path.points.length < 2) {
        errors.push({ entityType, entityId, code: 'PATH_INSUFFICIENT_POINTS', message: `Path phải có tối thiểu 2 điểm tọa độ (hiện có: ${path.points?.length || 0}).` });
      }
      if (typeof path.width !== 'number' || path.width <= 0) {
        errors.push({ entityType, entityId, code: 'PATH_INVALID_WIDTH', message: `Path phải có độ rộng width > 0 (hiện có: ${path.width}).` });
      }
      break;
    }
    default:
      errors.push({ entityType, entityId, code: 'UNKNOWN_GEOMETRY_TYPE', message: `Kiểu hình học không được hỗ trợ: ${(geom as any).type}` });
  }

  return { errors, warnings };
}

/**
 * Kiểm tra toàn diện bộ dữ liệu mặt bằng tầng (Floor Validation Strategy)
 */
export function validateFloorDataset(floor: FloorEntity): ValidationReport {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];
  const entityIdMap = new Map<string, string>(); // ID -> EntityType (phát hiện duplicate ID)

  // 1. Kiểm tra Schema Version & Coordinate System
  if (!floor.schemaVersion) {
    errors.push({ entityType: 'Floor', entityId: floor.id || 'unknown', code: 'MISSING_SCHEMA_VERSION', message: 'Mặt bằng thiếu thuộc tính `schemaVersion`.' });
  }

  if (!floor.coordinateSystem || !floor.coordinateSystem.width || !floor.coordinateSystem.height) {
    errors.push({ entityType: 'Floor', entityId: floor.id, code: 'INVALID_COORD_SYSTEM', message: 'Hệ tọa độ `coordinateSystem` không hợp lệ hoặc thiếu width/height.' });
  }

  const maxWidth = floor.coordinateSystem?.width || 1000;
  const maxHeight = floor.coordinateSystem?.height || 700;

  // Helper register ID
  const registerId = (id: string, type: string) => {
    if (!id) {
      errors.push({ entityType: type, entityId: 'empty', code: 'EMPTY_ENTITY_ID', message: `Thực thể kiểu ${type} thiếu thuộc tính \`id\`.` });
      return;
    }
    if (entityIdMap.has(id)) {
      errors.push({
        entityType: type,
        entityId: id,
        code: 'DUPLICATE_ENTITY_ID',
        message: `ID trùng lặp '${id}' đã được sử dụng bởi thực thể kiểu '${entityIdMap.get(id)}'.`
      });
    } else {
      entityIdMap.set(id, type);
    }
  };

  // 2. Đăng ký toàn bộ thực thể & kiểm tra hình học
  floor.zones?.forEach(z => {
    registerId(z.id, 'Zone');
    const g = validateGeometry(z.geometry, 'Zone', z.id, maxWidth, maxHeight);
    errors.push(...g.errors);
    warnings.push(...g.warnings);
  });

  floor.stalls?.forEach(s => {
    registerId(s.id, 'Stall');
    const g = validateGeometry(s.geometry, 'Stall', s.id, maxWidth, maxHeight);
    errors.push(...g.errors);
    warnings.push(...g.warnings);
  });

  floor.aisles?.forEach(a => {
    registerId(a.id, 'Aisle');
    const g = validateGeometry(a.geometry, 'Aisle', a.id, maxWidth, maxHeight);
    errors.push(...g.errors);
    warnings.push(...g.warnings);
  });

  floor.gates?.forEach(g => {
    registerId(g.id, 'Gate');
    const res = validateGeometry(g.geometry, 'Gate', g.id, maxWidth, maxHeight);
    errors.push(...res.errors);
    warnings.push(...res.warnings);
  });

  floor.facilities?.forEach(f => {
    registerId(f.id, 'Facility');
    const g = validateGeometry(f.geometry, 'Facility', f.id, maxWidth, maxHeight);
    errors.push(...g.errors);
    warnings.push(...g.warnings);
  });

  floor.infrastructures?.forEach(inf => {
    registerId(inf.id, 'Infrastructure');
    const g = validateGeometry(inf.geometry, 'Infrastructure', inf.id, maxWidth, maxHeight);
    errors.push(...g.errors);
    warnings.push(...g.warnings);
  });

  floor.incidents?.forEach(inc => {
    registerId(inc.id, 'Incident');
    const g = validateGeometry(inc.geometry, 'Incident', inc.id, maxWidth, maxHeight);
    errors.push(...g.errors);
    warnings.push(...g.warnings);
  });

  // 3. Kiểm tra tính toàn vẹn tham chiếu (Reference Integrity)
  const zoneIdSet = new Set(floor.zones?.map(z => z.id));
  const stallIdSet = new Set(floor.stalls?.map(s => s.id));

  // 3.1. Stall -> Zone
  floor.stalls?.forEach(s => {
    if (!zoneIdSet.has(s.zoneId)) {
      errors.push({
        entityType: 'Stall',
        entityId: s.id,
        code: 'DANGLING_ZONE_REFERENCE',
        message: `Sạp '${s.id}' tham chiếu tới zoneId không tồn tại: '${s.zoneId}'.`
      });
    }

    // Kiểm tra issues trong stall
    s.state?.issues?.forEach(iss => {
      if (iss.entityRef?.entityId && iss.entityRef.entityId !== s.id) {
        warnings.push({
          entityType: 'OperationalIssue',
          entityId: iss.id,
          code: 'ISSUE_ENTITY_REF_MISMATCH',
          message: `Issue '${iss.id}' nằm trong sạp '${s.id}' nhưng entityRef.entityId lại là '${iss.entityRef.entityId}'.`
        });
      }
    });
  });

  // 3.2. Infrastructure -> Connected Stalls
  floor.infrastructures?.forEach(inf => {
    inf.connectedStallIds?.forEach(stallId => {
      if (!stallIdSet.has(stallId)) {
        errors.push({
          entityType: 'Infrastructure',
          entityId: inf.id,
          code: 'DANGLING_STALL_REFERENCE',
          message: `Hạ tầng '${inf.id}' tham chiếu tới connectedStallId không tồn tại: '${stallId}'.`
        });
      }
    });
  });

  // 3.3. Incident -> Target Entity
  floor.incidents?.forEach(inc => {
    if (inc.targetEntityRef?.entityId) {
      const targetType = inc.targetEntityRef.entityType;
      const targetId = inc.targetEntityRef.entityId;
      if (!entityIdMap.has(targetId)) {
        errors.push({
          entityType: 'Incident',
          entityId: inc.id,
          code: 'DANGLING_INCIDENT_TARGET_REFERENCE',
          message: `Sự cố '${inc.id}' tham chiếu tới ${targetType} không tồn tại: '${targetId}'.`
        });
      }
    }
  });

  // 4. Thống kê tổng hợp (Stats)
  let totalIssues = 0;
  floor.stalls?.forEach(s => {
    totalIssues += s.state?.issues?.length || 0;
  });

  return {
    isValid: errors.length === 0,
    hasWarnings: warnings.length > 0,
    errors,
    warnings,
    stats: {
      totalEntities: entityIdMap.size,
      zonesCount: floor.zones?.length || 0,
      stallsCount: floor.stalls?.length || 0,
      aislesCount: floor.aisles?.length || 0,
      gatesCount: floor.gates?.length || 0,
      facilitiesCount: floor.facilities?.length || 0,
      infrastructuresCount: floor.infrastructures?.length || 0,
      incidentsCount: floor.incidents?.length || 0,
      totalOperationalIssues: totalIssues
    }
  };
}

/**
 * Kiểm tra toàn bộ thị trường chợ (Market Dataset)
 */
export function validateMarketDataset(market: MarketEntity): ValidationReport {
  if (!market.floors || market.floors.length === 0) {
    return {
      isValid: false,
      hasWarnings: false,
      errors: [{ entityType: 'Market', entityId: market.id || 'unknown', code: 'NO_FLOORS', message: 'Chợ không có bất kỳ tầng nào.' }],
      warnings: [],
      stats: { totalEntities: 0, zonesCount: 0, stallsCount: 0, aislesCount: 0, gatesCount: 0, facilitiesCount: 0, infrastructuresCount: 0, incidentsCount: 0, totalOperationalIssues: 0 }
    };
  }

  const allErrors: ValidationError[] = [];
  const allWarnings: ValidationWarning[] = [];
  const aggregatedStats = {
    totalEntities: 0,
    zonesCount: 0,
    stallsCount: 0,
    aislesCount: 0,
    gatesCount: 0,
    facilitiesCount: 0,
    infrastructuresCount: 0,
    incidentsCount: 0,
    totalOperationalIssues: 0
  };

  market.floors.forEach(floor => {
    const report = validateFloorDataset(floor);
    allErrors.push(...report.errors);
    allWarnings.push(...report.warnings);
    aggregatedStats.totalEntities += report.stats.totalEntities;
    aggregatedStats.zonesCount += report.stats.zonesCount;
    aggregatedStats.stallsCount += report.stats.stallsCount;
    aggregatedStats.aislesCount += report.stats.aislesCount;
    aggregatedStats.gatesCount += report.stats.gatesCount;
    aggregatedStats.facilitiesCount += report.stats.facilitiesCount;
    aggregatedStats.infrastructuresCount += report.stats.infrastructuresCount;
    aggregatedStats.incidentsCount += report.stats.incidentsCount;
    aggregatedStats.totalOperationalIssues += report.stats.totalOperationalIssues;
  });

  return {
    isValid: allErrors.length === 0,
    hasWarnings: allWarnings.length > 0,
    errors: allErrors,
    warnings: allWarnings,
    stats: aggregatedStats
  };
}
