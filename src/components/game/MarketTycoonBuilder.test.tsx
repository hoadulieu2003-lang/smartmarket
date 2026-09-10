import React from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import MarketTycoonBuilder from './MarketTycoonBuilder';

describe('MarketTycoonBuilder Component', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('renders Game HUD with title, metrics and controls', () => {
    render(<MarketTycoonBuilder />);

    expect(screen.getByText(/MARKET TYCOON BUILDER/i)).toBeDefined();
    expect(screen.getByText(/SIMULATOR/i)).toBeDefined();
    expect(screen.getByText(/Tổng Sạp/i)).toBeDefined();
    expect(screen.getByText(/Doanh thu thuê/i)).toBeDefined();
    expect(screen.getByText(/Điểm PCCC/i)).toBeDefined();
    expect(screen.getByText(/MỞ PHIÊN CHỢ \(SIM\)/i)).toBeDefined();
  });

  it('toggles simulation mode when play/pause button is clicked', () => {
    render(<MarketTycoonBuilder />);

    const playBtn = screen.getByRole('button', { name: /MỞ PHIÊN CHỢ \(SIM\)/i });
    expect(playBtn).toBeDefined();

    fireEvent.click(playBtn);
    expect(screen.getByText(/DỪNG PHIÊN CHỢ/i)).toBeDefined();

    const pauseBtn = screen.getByRole('button', { name: /DỪNG PHIÊN CHỢ/i });
    fireEvent.click(pauseBtn);
    expect(screen.getByText(/MỞ PHIÊN CHỢ \(SIM\)/i)).toBeDefined();
  });

  it('allows switching planning tools in toolbar', () => {
    render(<MarketTycoonBuilder />);

    const walkwayBtn = screen.getByRole('button', { name: /Hành Lang Đi Bộ/i });
    fireEvent.click(walkwayBtn);

    const freshStallBtn = screen.getByRole('button', { name: /Thịt & Thủy Hải Sản/i });
    fireEvent.click(freshStallBtn);

    const eraserBtn = screen.getByRole('button', { name: /Tẩy \/ Xoá/i });
    fireEvent.click(eraserBtn);
  });

  it('saves layout to localStorage when save button is clicked', () => {
    render(<MarketTycoonBuilder />);

    const saveBtn = screen.getByTitle('Lưu bản thiết kế');
    fireEvent.click(saveBtn);

    const saved = localStorage.getItem('smartmarket_tycoon_layout');
    expect(saved).not.toBeNull();
  });

  it('applies layout to real system', () => {
    render(<MarketTycoonBuilder />);

    const applyBtn = screen.getByRole('button', { name: /ÁP DỤNG THỰC TẾ/i });
    fireEvent.click(applyBtn);

    const appliedTimestamp = localStorage.getItem('smartmarket_tycoon_applied_timestamp');
    expect(appliedTimestamp).not.toBeNull();
  });
});
