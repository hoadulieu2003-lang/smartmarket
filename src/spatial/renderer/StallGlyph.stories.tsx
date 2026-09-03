import React from 'react';
import { StallGlyph } from './StallGlyph';
import type { StallEntity } from '../model/types';

export default {
  title: 'Spatial/StallGlyph',
  component: StallGlyph,
  parameters: {
    layout: 'centered',
  },
};

const makeStoryStall = (override: Partial<StallEntity>): StallEntity => ({
  id: override.id || 'stall_demo',
  code: override.code || 'A01',
  floorId: 'floor_1',
  zoneId: 'zone_A',
  geometry: override.geometry || { type: 'rectangle', x: 20, y: 20, width: 80, height: 60 },
  boundingBox: { minX: 20, minY: 20, maxX: 100, maxY: 80, width: 80, height: 60 },
  metadata: {
    name: 'Thực Phẩm Sạch Mai Anh',
    merchantName: 'Nguyễn Thị Mai',
    phone: '0901234567',
    category: 'Thực phẩm tươi sống',
    areaM2: 6.0,
    monthlyEstimatedRevenue: '45.000.000đ',
    rating: 4.8,
    ratingCount: 120,
    qrPaymentActive: true,
    ...override.metadata,
  },
  state: {
    occupancyStatus: 'active',
    isOccupied: true,
    isUnderMaintenance: false,
    hasActiveIssues: false,
    complaintsCount: 0,
    hasCriticalComplaint: false,
    contractDaysLeft: 365,
    isExpiringSoon: false,
    isCriticalExpiry: false,
    feeStatus: 'paid',
    overdueAmount: '',
    issues: [],
    tags: [],
    ...override.state,
  },
});

export const Normal = () => (
  <svg width="200" height="150" viewBox="0 0 120 100">
    <StallGlyph stall={makeStoryStall({ code: 'A01' })} />
  </svg>
);

export const Complaint = () => (
  <svg width="200" height="150" viewBox="0 0 120 100">
    <StallGlyph
      stall={makeStoryStall({
        code: 'A08',
        state: {
          occupancyStatus: 'active',
          isOccupied: true,
          isUnderMaintenance: false,
          hasActiveIssues: true,
          complaintsCount: 3,
          hasCriticalComplaint: true,
          contractDaysLeft: 365,
          isExpiringSoon: false,
          isCriticalExpiry: false,
          feeStatus: 'paid',
          overdueAmount: '',
          tags: [],
          issues: [
            {
              id: 'iss_1',
              type: 'complaint',
              title: 'Mùi hôi cống',
              severity: 'critical',
              status: 'open',
              createdAt: '2026-09-03T08:00:00Z',
              updatedAt: '2026-09-03T08:00:00Z',
              entityRef: { entityType: 'stall', entityId: 'stall_demo' },
            },
          ],
        },
      })}
    />
  </svg>
);

export const Expiring = () => (
  <svg width="200" height="150" viewBox="0 0 120 100">
    <StallGlyph
      stall={makeStoryStall({
        code: 'B03',
        state: {
          occupancyStatus: 'active',
          isOccupied: true,
          isUnderMaintenance: false,
          hasActiveIssues: true,
          complaintsCount: 0,
          hasCriticalComplaint: false,
          contractDaysLeft: 12,
          isExpiringSoon: true,
          isCriticalExpiry: false,
          feeStatus: 'paid',
          overdueAmount: '',
          tags: [],
          issues: [
            {
              id: 'iss_2',
              type: 'contract_expiry',
              title: 'Hạn hợp đồng còn 12 ngày',
              severity: 'medium',
              status: 'open',
              createdAt: '2026-09-03T08:00:00Z',
              updatedAt: '2026-09-03T08:00:00Z',
              entityRef: { entityType: 'stall', entityId: 'stall_demo' },
            },
          ],
        },
      })}
    />
  </svg>
);

export const MultiStatus = () => (
  <svg width="200" height="150" viewBox="0 0 120 100">
    <StallGlyph
      stall={makeStoryStall({
        code: 'A12',
        state: {
          occupancyStatus: 'active',
          isOccupied: true,
          isUnderMaintenance: false,
          hasActiveIssues: true,
          complaintsCount: 3,
          hasCriticalComplaint: true,
          contractDaysLeft: 12,
          isExpiringSoon: true,
          isCriticalExpiry: false,
          feeStatus: 'paid',
          overdueAmount: '',
          tags: [],
          issues: [
            {
              id: 'iss_1',
              type: 'complaint',
              title: 'Mùi cống rãnh',
              severity: 'critical',
              status: 'open',
              createdAt: '2026-09-03T08:00:00Z',
              updatedAt: '2026-09-03T08:00:00Z',
              entityRef: { entityType: 'stall', entityId: 'stall_demo' },
            },
            {
              id: 'iss_2',
              type: 'contract_expiry',
              title: 'Hết hạn HĐ',
              severity: 'medium',
              status: 'open',
              createdAt: '2026-09-03T08:00:00Z',
              updatedAt: '2026-09-03T08:00:00Z',
              entityRef: { entityType: 'stall', entityId: 'stall_demo' },
            },
          ],
        },
      })}
    />
  </svg>
);

export const Maintenance = () => (
  <svg width="200" height="150" viewBox="0 0 120 100">
    <defs>
      <pattern id="maintenance-hatch" width="8" height="8" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
        <line x1="0" y1="0" x2="0" y2="8" stroke="#cbd5e1" strokeWidth="2" />
      </pattern>
    </defs>
    <StallGlyph
      stall={makeStoryStall({
        code: 'C05',
        state: {
          occupancyStatus: 'active',
          isOccupied: true,
          isUnderMaintenance: true,
          hasActiveIssues: false,
          complaintsCount: 0,
          hasCriticalComplaint: false,
          contractDaysLeft: 365,
          isExpiringSoon: false,
          isCriticalExpiry: false,
          feeStatus: 'paid',
          overdueAmount: '',
          tags: [],
          issues: [],
        },
      })}
    />
  </svg>
);

export const Empty = () => (
  <svg width="200" height="150" viewBox="0 0 120 100">
    <StallGlyph
      stall={makeStoryStall({
        code: 'D02',
        state: {
          occupancyStatus: 'empty',
          isOccupied: false,
          isUnderMaintenance: false,
          hasActiveIssues: false,
          complaintsCount: 0,
          hasCriticalComplaint: false,
          contractDaysLeft: 0,
          isExpiringSoon: false,
          isCriticalExpiry: false,
          feeStatus: 'paid',
          overdueAmount: '',
          tags: [],
          issues: [],
        },
      })}
    />
  </svg>
);

export const Selected = () => (
  <svg width="200" height="150" viewBox="0 0 120 100">
    <StallGlyph
      stall={makeStoryStall({ code: 'B07' })}
      isSelected={true}
    />
  </svg>
);
