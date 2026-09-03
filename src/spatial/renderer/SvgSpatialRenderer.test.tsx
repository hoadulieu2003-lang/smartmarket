import React from 'react';
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { SvgSpatialRenderer } from './SvgSpatialRenderer';
import { 
  FIXTURE_A_DONG_XUAN, 
  FIXTURE_B_L_SHAPED_MARKET, 
  FIXTURE_C_TWO_BLOCK_BRIDGE_MARKET 
} from '../fixtures';

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
});
