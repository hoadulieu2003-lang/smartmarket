import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import GisMapView from './GisMapView';

describe('GisMapView Satellite & Real Coordinates Integration', () => {
  it('renders GIS banner, WGS-84 coordinate badge and quick landmark indicators', () => {
    render(<GisMapView onNavigateToMarketMap={vi.fn()} />);

    expect(screen.getByText(/Bản Đồ GIS Địa Lý/i)).toBeDefined();
    expect(screen.getByText(/Hệ tọa độ VN-2000 \/ WGS-84/i)).toBeDefined();
    expect(screen.getByText(/Ảnh Vệ Tinh ArcGIS Esri/i)).toBeDefined();
    expect(screen.getByText(/Hồ Gươm/i)).toBeDefined();
    expect(screen.getByText(/Hồ Tây/i)).toBeDefined();
    expect(screen.getByText(/Sông Hồng/i)).toBeDefined();
  });

  it('renders all 3 Hanoi operational markets with coordinates and radius', () => {
    render(<GisMapView onNavigateToMarketMap={vi.fn()} />);

    expect(screen.getAllByText(/Chợ Đồng Xuân/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/Chợ Hôm - Đức Viên/i)).toBeDefined();
    expect(screen.getByText(/Chợ Hàng Bè/i)).toBeDefined();
    expect(screen.getAllByText(/Bán kính: 130m/i).length).toBeGreaterThan(0);
  });

  it('switches active market when user clicks on another market card', () => {
    render(<GisMapView onNavigateToMarketMap={vi.fn()} />);

    const choHomCard = screen.getByRole('button', { name: /Chợ Hôm - Đức Viên/i });
    fireEvent.click(choHomCard);

    // Active selection should update
    expect(screen.getByText(/21.0187, 105.8522/i)).toBeDefined();
  });

  it('provides layer toggle between Satellite, Streets and OSM', () => {
    render(<GisMapView onNavigateToMarketMap={vi.fn()} />);

    const satelliteBtn = screen.getByRole('button', { name: /Vệ Tinh/i });
    const streetsBtn = screen.getByRole('button', { name: /Đường Phố/i });
    const osmBtn = screen.getByRole('button', { name: /OSM/i });

    expect(satelliteBtn).toBeDefined();
    expect(streetsBtn).toBeDefined();
    expect(osmBtn).toBeDefined();

    fireEvent.click(streetsBtn);
    expect(streetsBtn.className).toContain('bg-[#0B7A3A]');

    fireEvent.click(osmBtn);
    expect(osmBtn.className).toContain('bg-[#0B7A3A]');
  });

  it('triggers onNavigateToMarketMap when clicking the 3D map navigation button', () => {
    const onNavigateToMarketMap = vi.fn();
    render(<GisMapView onNavigateToMarketMap={onNavigateToMarketMap} />);

    const navigateBtn = screen.getByRole('button', { name: /Mở sơ đồ 3D sạp của chợ này/i });
    fireEvent.click(navigateBtn);

    expect(onNavigateToMarketMap).toHaveBeenCalledWith('m-dongxuan');
  });

  it('renders category filter and legend items on the GIS stage', () => {
    render(<GisMapView onNavigateToMarketMap={vi.fn()} />);

    expect(screen.getByText(/Chú giải ngành hàng trên Bản đồ GIS/i)).toBeDefined();
    expect(screen.getAllByText(/Thực phẩm tươi sống/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/Nông sản khô/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/Ẩm thực & Đồ uống/i).length).toBeGreaterThanOrEqual(1);
  });
});
