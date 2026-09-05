import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PureArchitectural25dRenderer } from '../PureArchitectural25dRenderer';
import { REALISTIC_FLOOR_DATA } from '@/data/realisticMarketData';

describe('PURE ARCHITECTURAL 2.5D CUTAWAY SVG ENGINE (2048 x 1364 ULTRA-HD)', () => {
  it('phải render thành công canvas SVG với toàn bộ 86 sạp 2.5D kiến trúc', () => {
    render(
      <PureArchitectural25dRenderer
        floor={REALISTIC_FLOOR_DATA}
        selectedEntityId={undefined}
        selectedZone={null}
      />
    );

    const svgElement = screen.getByTestId('pure-architectural-svg');
    expect(svgElement).toBeDefined();

    // Kiểm tra render đủ các sạp trọng điểm 5 khu vực
    const stallA12 = screen.getByTestId('stall-arch-A12');
    expect(stallA12).toBeDefined();

    const stallB03 = screen.getByTestId('stall-arch-B03');
    expect(stallB03).toBeDefined();

    const stallC11 = screen.getByTestId('stall-arch-C11');
    expect(stallC11).toBeDefined();

    const stallD01 = screen.getByTestId('stall-arch-D01');
    expect(stallD01).toBeDefined();

    const stallE08 = screen.getByTestId('stall-arch-E08');
    expect(stallE08).toBeDefined();
  });

  it('phải render P0 radar beacon nhấp nháy tại sạp A12 và E08', () => {
    render(
      <PureArchitectural25dRenderer
        floor={REALISTIC_FLOOR_DATA}
        selectedEntityId={undefined}
        selectedZone={null}
      />
    );

    const beaconA12 = screen.getByTestId('p0-beacon-A12');
    expect(beaconA12).toBeDefined();

    const beaconE08 = screen.getByTestId('p0-beacon-E08');
    expect(beaconE08).toBeDefined();
  });

  it('phải render warning beacon màu vàng tại sạp B03', () => {
    render(
      <PureArchitectural25dRenderer
        floor={REALISTIC_FLOOR_DATA}
        selectedEntityId={undefined}
        selectedZone={null}
      />
    );

    const warningB03 = screen.getByTestId('warning-beacon-B03');
    expect(warningB03).toBeDefined();
  });

  it('phải kích hoạt onSelectEntity khi click vào một sạp', () => {
    const handleSelectEntity = vi.fn();

    render(
      <PureArchitectural25dRenderer
        floor={REALISTIC_FLOOR_DATA}
        selectedEntityId={undefined}
        selectedZone={null}
        onSelectEntity={handleSelectEntity}
      />
    );

    const stallA12 = screen.getByTestId('stall-arch-A12');
    fireEvent.click(stallA12);

    expect(handleSelectEntity).toHaveBeenCalledTimes(1);
    expect(handleSelectEntity).toHaveBeenCalledWith(
      expect.objectContaining({
        code: 'A12',
      })
    );
  });

  it('phải render selection halo ring xanh khi sạp A12 được chọn', () => {
    render(
      <PureArchitectural25dRenderer
        floor={REALISTIC_FLOOR_DATA}
        selectedEntityId="stall_A12"
        selectedZone={null}
      />
    );

    const haloRing = screen.getByTestId('halo-ring-A12');
    expect(haloRing).toBeDefined();
  });

  it('phải hỗ trợ các nút zoom in (+), zoom out (-) và căn giữa toàn chợ', () => {
    render(
      <PureArchitectural25dRenderer
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
