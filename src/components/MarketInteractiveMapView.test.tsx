import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import MarketInteractiveMapView from './MarketInteractiveMapView';

describe('MarketInteractiveMapView Architectural Floor Blueprint', () => {
  it('renders live KPI metrics HUD and floor blueprint header', () => {
    render(<MarketInteractiveMapView />);

    // Header & Live KPIs
    expect(screen.getByText(/SƠ ĐỒ ĐIỀU HÀNH & QUY HOẠCH MẶT BẰNG/i)).toBeDefined();
    expect(screen.getByText(/50 sạp hàng/i)).toBeDefined();
    expect(screen.getByText(/Lấp đầy/i)).toBeDefined();
    expect(screen.getByText(/Doanh thu thuê/i)).toBeDefined();
    expect(screen.getByText(/Phản ánh PAKN/i)).toBeDefined();
    expect(screen.getByText(/Chuẩn PCCC/i)).toBeDefined();
  });

  it('renders zone filter buttons and tool palette', () => {
    render(<MarketInteractiveMapView />);

    // Zone filters
    expect(screen.getByText('Tất cả (50)')).toBeDefined();
    expect(screen.getByText(/Khu A · Tươi sống/i)).toBeDefined();
    expect(screen.getByText(/Khu B · Nông sản khô/i)).toBeDefined();
    expect(screen.getByText(/Khu C · Ẩm thực/i)).toBeDefined();
    expect(screen.getByText(/Khu D · Bách hóa/i)).toBeDefined();
    expect(screen.getByText(/Khu E · Vải sợi/i)).toBeDefined();

    // Tools
    expect(screen.getByText(/Tra Cứu & Tác Chiến/i)).toBeDefined();
    expect(screen.getByText(/Hành Lang Đi Bộ/i)).toBeDefined();
  });

  it('toggles traffic simulation mode', () => {
    render(<MarketInteractiveMapView />);

    const simBtn = screen.getByRole('button', { name: /MÔ PHỎNG LUỒNG KHÁCH/i });
    expect(simBtn).toBeDefined();

    fireEvent.click(simBtn);
    expect(screen.getByText(/DỪNG MÔ PHỎNG/i)).toBeDefined();

    fireEvent.click(screen.getByRole('button', { name: /DỪNG MÔ PHỎNG/i }));
    expect(screen.getByText(/MÔ PHỎNG LUỒNG KHÁCH/i)).toBeDefined();
  });

  it('opens tactical stall profile drawer when initialSelectedStallCode is passed', () => {
    render(<MarketInteractiveMapView initialSelectedStallCode="A-01" />);

    expect(screen.getAllByText('A-01').length).toBeGreaterThan(0);
    expect(screen.getByText(/Sạp Thịt Bò Tươi Cô Mai/i)).toBeDefined();
    expect(screen.getByText(/Nguyễn Thị Mai/i)).toBeDefined();
    expect(screen.getByText(/Thịt bò thăn hoa tươi/i)).toBeDefined();
  });
});
