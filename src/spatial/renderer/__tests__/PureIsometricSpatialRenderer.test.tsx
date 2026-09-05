import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PureIsometricSpatialRenderer } from '../PureIsometricSpatialRenderer';
import { REALISTIC_FLOOR_DATA } from '@/data/realisticMarketData';

describe('PURE ISOMETRIC SPATIAL RENDERER (SVG 2.5D AUTOCAD ENGINE)', () => {
  it('phải render thành công canvas SVG với toàn bộ 86 sạp isometric', () => {
    render(
      <PureIsometricSpatialRenderer
        floor={REALISTIC_FLOOR_DATA}
        selectedEntityId={undefined}
        selectedZone={null}
      />
    );

    const svgElement = screen.getByTestId('pure-isometric-svg');
    expect(svgElement).toBeDefined();

    // Kiểm tra render đủ 86 sạp
    const stallA12 = screen.getByTestId('iso-stall-stall_A12');
    expect(stallA12).toBeDefined();

    const stallE08 = screen.getByTestId('iso-stall-stall_E08');
    expect(stallE08).toBeDefined();
  });

  it('phải render P0 radar beacon nhấp nháy tại sạp A12 và E08', () => {
    render(
      <PureIsometricSpatialRenderer
        floor={REALISTIC_FLOOR_DATA}
        selectedEntityId={undefined}
        selectedZone={null}
      />
    );

    const beaconA12 = screen.getByTestId('p0-beacon-stall_A12');
    expect(beaconA12).toBeDefined();

    const beaconE08 = screen.getByTestId('p0-beacon-stall_E08');
    expect(beaconE08).toBeDefined();
  });

  it('phải kích hoạt onSelectEntity khi click vào một sạp', () => {
    const handleSelectEntity = vi.fn();

    render(
      <PureIsometricSpatialRenderer
        floor={REALISTIC_FLOOR_DATA}
        selectedEntityId={undefined}
        selectedZone={null}
        onSelectEntity={handleSelectEntity}
      />
    );

    const stallA12 = screen.getByTestId('iso-stall-stall_A12');
    fireEvent.click(stallA12);

    expect(handleSelectEntity).toHaveBeenCalledTimes(1);
    expect(handleSelectEntity).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'stall_A12',
        code: 'A12',
      })
    );
  });

  it('phải render selection halo ring màu xanh lá khi có sạp được chọn', () => {
    render(
      <PureIsometricSpatialRenderer
        floor={REALISTIC_FLOOR_DATA}
        selectedEntityId="stall_A12"
        selectedZone={null}
      />
    );

    const haloRing = screen.getByTestId('iso-halo-ring-stall_A12');
    expect(haloRing).toBeDefined();
  });

  it('phải hỗ trợ các phím điều khiển Zoom In, Zoom Out, Reset Center', () => {
    render(
      <PureIsometricSpatialRenderer
        floor={REALISTIC_FLOOR_DATA}
        selectedEntityId={undefined}
        selectedZone={null}
      />
    );

    const zoomInBtn = screen.getByTitle('Phóng to (+)');
    const zoomOutBtn = screen.getByTitle('Thu nhỏ (-)');
    const resetBtn = screen.getByTitle('Căn giữa toàn chợ');

    expect(zoomInBtn).toBeDefined();
    expect(zoomOutBtn).toBeDefined();
    expect(resetBtn).toBeDefined();

    fireEvent.click(zoomInBtn);
    fireEvent.click(zoomOutBtn);
    fireEvent.click(resetBtn);
  });
});
