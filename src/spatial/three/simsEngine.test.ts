import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { createSimsGroundAndYard, createCutawayWalls } from './simsSceneBuilder';
import {
  createThemedStallMesh,
  createPlumbobMesh,
  getStripedAwningTexture,
  extractStallAlertInfo,
  createFloatingAlertBillboard,
  createDutyBeaconMesh,
} from './simsPropsBuilder';
import type { StallEntity } from '../model/types';

describe('The Sims 3D Smart Market Engine (WP-01, WP-02, WP-03)', () => {
  const dummyDims = {
    width: 800,
    depth: 600,
    centerX: 400,
    centerZ: 300,
  };

  const dummyStall = {
    id: 'stall_B03',
    code: 'B03',
    zoneId: 'zone_B',
    floorId: 'floor_1',
    status: 'active',
    geometry: {
      type: 'rectangle',
      x: 100,
      y: 150,
      width: 60,
      height: 40,
    },
    state: {
      isOccupied: true,
      contractDaysLeft: 120,
      feeStatus: 'paid',
      isUnderMaintenance: false,
      complaintsCount: 0,
      warningStatus: 'warning',
    },
    metadata: {
      name: 'Rau Sạch Đà Lạt B03',
      category: 'Rau củ',
      merchantName: 'Nguyễn Thị Mai',
    },
  } as unknown as StallEntity;

  it('WP-01: builds Sims ground, lush lawn and white picket fence', () => {
    const scene = new THREE.Scene();
    const yard = createSimsGroundAndYard(scene, dummyDims);

    expect(yard).toBeDefined();
    expect(yard.name).toBe('SimsYardGroup');
    expect(scene.children).toContain(yard);
    // Contains lawn, polished floor, road, fences, and trees
    expect(yard.children.length).toBeGreaterThanOrEqual(4);
  });

  it('WP-01: builds Sims cutaway low-walls with 4 arched gate signboards', () => {
    const scene = new THREE.Scene();
    const walls = createCutawayWalls(scene, dummyDims);

    expect(walls).toBeDefined();
    expect(walls.name).toBe('SimsCutawayWalls');
    expect(scene.children).toContain(walls);
    // Verify 8 wall segments and 4 gate arches
    expect(walls.children.length).toBeGreaterThanOrEqual(8);
  });

  it('WP-02: creates volumetric themed stall with wooden counter and striped awning', () => {
    const { stallGroup, hitMesh } = createThemedStallMesh(dummyStall, false, 'normal');

    expect(stallGroup).toBeDefined();
    expect(stallGroup.name).toBe('StallGroup_B03');
    expect(hitMesh).toBeDefined();
    expect((hitMesh.material as THREE.MeshBasicMaterial).transparent).toBe(true);
    expect((hitMesh.material as THREE.MeshBasicMaterial).opacity).toBe(0);

    // Must contain counter, countertop, front signboard, pillars, canopy awning, and props
    expect(stallGroup.children.length).toBeGreaterThanOrEqual(6);
  });

  it('WP-02: generates striped awning canvas texture', () => {
    const tex = getStripedAwningTexture('#16a34a');
    expect(tex).toBeDefined();
    expect(tex.image).toBeDefined();
  });

  it('WP-03: creates The Sims Plumbob diamond with glowing rotation mesh', () => {
    const plumbob = createPlumbobMesh('#10b981', false);
    expect(plumbob).toBeDefined();
    expect(plumbob.name).toBe('SimsPlumbobIndicator');

    const diamond = plumbob.getObjectByName('PlumbobDiamond');
    expect(diamond).toBeDefined();
    expect(diamond instanceof THREE.Mesh).toBe(true);

    // Normal Plumbob should not have danger ring
    const dangerRing = plumbob.getObjectByName('PlumbobDangerRing');
    expect(dangerRing).toBeUndefined();
  });

  it('WP-03: creates P0 Emergency Red Plumbob with flashing danger flare ring', () => {
    const p0Plumbob = createPlumbobMesh('#ef4444', true);
    expect(p0Plumbob).toBeDefined();

    const diamond = p0Plumbob.getObjectByName('PlumbobDiamond');
    expect(diamond).toBeDefined();

    const dangerRing = p0Plumbob.getObjectByName('PlumbobDangerRing');
    expect(dangerRing).toBeDefined();
    expect(dangerRing instanceof THREE.Mesh).toBe(true);
  });

  describe('3D Floating Incident Billboards & Spatial Alerts', () => {
    it('extracts P0 urgent alert for critical stalls or complaints', () => {
      const p0Stall = {
        code: 'A12',
        state: { complaintsCount: 2, feeStatus: 'paid' },
      } as unknown as StallEntity;

      const alert = extractStallAlertInfo(p0Stall);
      expect(alert).not.toBeNull();
      expect(alert?.priority).toBe('urgent');
      expect(alert?.badgeTitle).toBe('P0 • KHẨN CẤP');
      expect(alert?.themeColor).toBe('#ef4444');
      expect(alert?.issueDetail).toContain('Nước xả cá');
    });

    it('extracts P1 attention alert for fraud or warning stalls', () => {
      const p1Stall = {
        code: 'A02',
        state: { complaintsCount: 0, feeStatus: 'paid', specificType: 'weight_fraud' },
      } as unknown as StallEntity;

      const alert = extractStallAlertInfo(p1Stall);
      expect(alert).not.toBeNull();
      expect(alert?.priority).toBe('attention');
      expect(alert?.badgeTitle).toBe('P1 • CHÚ Ý');
      expect(alert?.themeColor).toBe('#f97316');
    });

    it('extracts finance alert for overdue fee or expiring contract', () => {
      const finStall = {
        code: 'B03',
        state: { complaintsCount: 0, feeStatus: 'overdue' },
      } as unknown as StallEntity;

      const alert = extractStallAlertInfo(finStall);
      expect(alert).not.toBeNull();
      expect(alert?.priority).toBe('finance');
      expect(alert?.badgeTitle).toBe('TÀI CHÍNH • NỢ PHÍ');
      expect(alert?.themeColor).toBe('#f59e0b');
    });

    it('extracts maintenance alert for stalls under repair', () => {
      const maintStall = {
        code: 'X99',
        state: { complaintsCount: 0, feeStatus: 'paid', isUnderMaintenance: true },
      } as unknown as StallEntity;

      const alert = extractStallAlertInfo(maintStall);
      expect(alert).not.toBeNull();
      expect(alert?.priority).toBe('maintenance');
      expect(alert?.badgeTitle).toBe('BẢO TRÌ • SỬA CHỮA');
    });

    it('returns null for normal stalls without incidents', () => {
      const normalStall = {
        code: 'Z88',
        state: { complaintsCount: 0, feeStatus: 'paid', isUnderMaintenance: false },
      } as unknown as StallEntity;

      const alert = extractStallAlertInfo(normalStall);
      expect(alert).toBeNull();
    });

    it('creates 3D floating alert billboard with CanvasTexture plane and anchor light', () => {
      const alertInfo = {
        stallCode: 'A12',
        priority: 'urgent' as const,
        badgeTitle: 'P0 • KHẨN CẤP',
        issueDetail: 'Nước xả cá tràn đại lộ',
        themeColor: '#ef4444',
      };

      const billboard = createFloatingAlertBillboard(alertInfo);
      expect(billboard).toBeDefined();
      expect(billboard.name).toBe('FloatingAlert_A12');

      const plane = billboard.getObjectByName('AlertBillboardPlane');
      expect(plane).toBeDefined();
      expect(plane instanceof THREE.Mesh).toBe(true);

      const light = billboard.children.find((c) => c instanceof THREE.PointLight);
      expect(light).toBeDefined();
    });

    it('creates duty operational beacons for sanitation, security_fire, and finance', () => {
      const waterBeacon = createDutyBeaconMesh('sanitation');
      expect(waterBeacon.name).toBe('DutyBeacon_sanitation');
      expect(waterBeacon.getObjectByName('WaterDropMesh')).toBeDefined();

      const sirenBeacon = createDutyBeaconMesh('security_fire');
      expect(sirenBeacon.name).toBe('DutyBeacon_security_fire');
      expect(sirenBeacon.getObjectByName('DangerPulseRing')).toBeDefined();

      const financeBeacon = createDutyBeaconMesh('finance');
      expect(financeBeacon.name).toBe('DutyBeacon_finance');
      expect(financeBeacon.getObjectByName('FinanceTokenMesh')).toBeDefined();
    });
  });
});

