import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { fireEvent, render } from '@testing-library/react';
import { SvgSpatialRenderer } from './SvgSpatialRenderer';
import { 
  FIXTURE_A_DONG_XUAN, 
  FIXTURE_B_L_SHAPED_MARKET, 
  FIXTURE_C_TWO_BLOCK_BRIDGE_MARKET 
} from '../fixtures';
import { getMapPresentationLayout } from '../presentation/mapLayout';

describe('GENERIC 2D SVG SPATIAL RENDERER INTEGRATION', () => {
  it('renders Fixture A (Đồng Xuân) with all stalls dispatched as StallGlyphs', () => {
    const { container } = render(
      <SvgSpatialRenderer floor={FIXTURE_A_DONG_XUAN} />
    );

    // Stalls in Fixture A must exist
    expect(container.querySelector('#stall-stall_A01')).not.toBeNull();
    expect(container.querySelector('#stall-stall_A12')).not.toBeNull();
    // Stall A12 is complaint -> check data-state="complaint"
    const stallA12 = container.querySelector('#stall-stall_A12');
    expect(stallA12?.getAttribute('data-state')).toBe('complaint');
  });

  it('renders Fixture B (L-Shaped Market) without breaking', () => {
    const { container } = render(
      <SvgSpatialRenderer floor={FIXTURE_B_L_SHAPED_MARKET} />
    );

    expect(container.querySelector('svg')).not.toBeNull();
    expect(container.querySelectorAll('[data-testid^="stall-glyph-"]').length).toBeGreaterThan(0);
  });

  it('renders Fixture C (Two-Block Bridge Market) without breaking', () => {
    const { container } = render(
      <SvgSpatialRenderer floor={FIXTURE_C_TWO_BLOCK_BRIDGE_MARKET} />
    );

    expect(container.querySelector('svg')).not.toBeNull();
    expect(container.querySelectorAll('[data-testid^="stall-glyph-"]').length).toBeGreaterThan(0);
  });

  it('renders curated visual geometry while selecting the canonical stall entity', () => {
    const onSelectEntity = vi.fn();
    const layout = getMapPresentationLayout(FIXTURE_A_DONG_XUAN);
    const expected = layout.stalls.stall_A12;
    const { container } = render(
      <SvgSpatialRenderer floor={FIXTURE_A_DONG_XUAN} onSelectEntity={onSelectEntity} />
    );

    const stallA12 = container.querySelector('#stall-stall_A12')!;
    const stallRect = stallA12.querySelector('rect');
    expect(expected.type).toBe('rectangle');
    if (expected.type === 'rectangle') {
      expect(stallRect?.getAttribute('x')).toBe(String(expected.x));
      expect(stallRect?.getAttribute('y')).toBe(String(expected.y));
      expect(stallRect?.getAttribute('width')).toBe(String(expected.width));
      expect(stallRect?.getAttribute('height')).toBe(String(expected.height));
    }

    fireEvent.click(stallA12);
    expect(onSelectEntity).toHaveBeenCalledWith(FIXTURE_A_DONG_XUAN.stalls.find((stall) => stall.id === 'stall_A12'));
  });

  it('uses the curated central spine geometry for Fixture A', () => {
    const layout = getMapPresentationLayout(FIXTURE_A_DONG_XUAN);
    const { container } = render(<SvgSpatialRenderer floor={FIXTURE_A_DONG_XUAN} />);
    const spine = layout.aisles.aisle_main_ns;
    const renderedSpine = container.querySelector('#aisle-aisle_main_ns polygon');

    expect(spine.type).toBe('polygon');
    expect(renderedSpine?.getAttribute('points')).toBe(
      spine.type === 'polygon' ? spine.vertices.map(([x, y]) => `${x},${y}`).join(' ') : undefined
    );
  });
});
