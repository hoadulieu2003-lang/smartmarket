import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import MapToolbar from './MapToolbar';

const renderToolbar = () => {
  const handlers = {
    onSelectFloor: vi.fn(),
    onToggleViewEngine: vi.fn(),
    onToggleLayer: vi.fn(),
    onZoomIn: vi.fn(),
    onZoomOut: vi.fn(),
    onResetZoom: vi.fn(),
    onToggleFullscreen: vi.fn(),
    onSelectDutyView: vi.fn(),
    onSelectZone: vi.fn(),
    onSearchChange: vi.fn(),
    onToggleDensityMode: vi.fn(),
  };

  render(
    <MapToolbar
      selectedFloor="1"
      onSelectFloor={handlers.onSelectFloor}
      viewEngine="2d_svg"
      onToggleViewEngine={handlers.onToggleViewEngine}
      layers={{ cctv: true, sensors: true, fireExit: false }}
      onToggleLayer={handlers.onToggleLayer}
      zoomLevel={1}
      onZoomIn={handlers.onZoomIn}
      onZoomOut={handlers.onZoomOut}
      onResetZoom={handlers.onResetZoom}
      onToggleFullscreen={handlers.onToggleFullscreen}
      dutyView="all"
      onSelectDutyView={handlers.onSelectDutyView}
      selectedZone={null}
      onSelectZone={handlers.onSelectZone}
      lodState="OVERVIEW"
      searchQuery=""
      onSearchChange={handlers.onSearchChange}
      densityMode="optimized"
      onToggleDensityMode={handlers.onToggleDensityMode}
    />,
  );

  return handlers;
};

describe('MapToolbar responsive controls', () => {
  it('keeps floor, zone, and duty controls discoverable', () => {
    renderToolbar();

    expect(screen.getByText(/Tầng/i)).toBeDefined();
    expect(screen.getByRole('button', { name: 'T1' })).toBeDefined();
    expect(screen.getByRole('button', { name: /Khu A/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /Ca Vệ Sinh/i })).toBeDefined();
  });

  it('does not expose structural emoji in toolbar text', () => {
    renderToolbar();

    expect(screen.getByTestId('map-toolbar').textContent).not.toMatch(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u);
  });

  it('gives icon-style map actions accessible names and keeps callbacks wired', () => {
    const handlers = renderToolbar();

    fireEvent.click(screen.getByRole('button', { name: /Thu nhỏ sơ đồ/i }));
    fireEvent.click(screen.getByRole('button', { name: /Phóng to sơ đồ/i }));
    fireEvent.click(screen.getByRole('button', { name: /Căn giữa/i }));

    expect(handlers.onZoomOut).toHaveBeenCalledTimes(1);
    expect(handlers.onZoomIn).toHaveBeenCalledTimes(1);
    expect(handlers.onResetZoom).toHaveBeenCalledTimes(1);
  });

  it('keeps layer popover bound to real layer state only', () => {
    const handlers = renderToolbar();
    const layerButton = screen.getByRole('button', { name: /Lớp bản đồ/i });

    expect(layerButton.getAttribute('aria-haspopup')).toBeNull();
    expect(layerButton.textContent).toContain('2/3');

    fireEvent.click(layerButton);

    expect(screen.queryByText(/Hạ tầng kỹ thuật/i)).toBeNull();
    fireEvent.click(screen.getByLabelText(/Camera CCTV/i));
    expect(handlers.onToggleLayer).toHaveBeenCalledWith('cctv');
  });

  it('names duty icon controls even when visible labels collapse on mobile', () => {
    renderToolbar();

    expect(screen.getByLabelText('Chọn chế độ ca trực: Toàn cảnh')).toBeDefined();
    expect(screen.getByLabelText('Chọn chế độ ca trực: Ca Vệ Sinh')).toBeDefined();
    expect(screen.getByLabelText('Chọn chế độ ca trực: Ca An Ninh/PCCC')).toBeDefined();
    expect(screen.getByLabelText('Chọn chế độ ca trực: Ca Thu Phí')).toBeDefined();
  });
});
