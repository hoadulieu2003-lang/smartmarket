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

  it('renders 4 operational duty modes in toolbar and allows switching', () => {
    render(<MarketInteractiveMapView />);

    expect(screen.getByText(/Quy hoạch & Thuê sạp/i)).toBeDefined();
    expect(screen.getByText(/Hiện trường & PAKN/i)).toBeDefined();
    expect(screen.getByText(/Ngành hàng & Hàng QR/i)).toBeDefined();
    expect(screen.getByText(/PCCC & Cân đối chứng/i)).toBeDefined();

    const incidentModeBtn = screen.getByRole('button', { name: /Hiện trường & PAKN/i });
    fireEvent.click(incidentModeBtn);

    expect(screen.getByText(/Đang theo dõi các sạp phát sinh phản ánh người tiêu dùng/i)).toBeDefined();
  });

  it('allows opening vacant stall and assigning pending Zalo merchant application', async () => {
    const mockApprove = vi.fn();
    const mockVacantStalls = [
      {
        id: 'stall-vacant-01',
        code: 'A-05',
        name: 'Sạp Trống Dãy A',
        status: 'vacant',
        acreage: 15,
        zones: { code: 'KHU-A', name: 'Khu A · Tươi sống' },
        currentContract: null
      }
    ];
    const mockApplications = [
      {
        id: 'app-test-01',
        applicationCode: 'DKKD-9988',
        applicantName: 'Lê Văn Khải',
        phone: '0988 777 666',
        productCategory: 'Thịt bò organic',
        status: 'pending',
        experienceYears: 6
      }
    ];

    render(
      <MarketInteractiveMapView
        initialSelectedStallCode="A-05"
        stalls={mockVacantStalls}
        applications={mockApplications}
        onApproveApplication={mockApprove}
      />
    );

    // Kiểm tra Drawer hiển thị nút gán sạp
    const assignBtn = screen.getByRole('button', { name: /Gán hồ sơ tiểu thương Zalo/i });
    expect(assignBtn).toBeDefined();

    // Mở modal gán sạp
    fireEvent.click(assignBtn);

    // Kiểm tra tiêu đề modal và thông tin ứng viên
    expect(screen.getByText(/GÁN HỒ SƠ TIỂU THƯƠNG VÀO SẠP A-05/i)).toBeDefined();
    expect(screen.getByText('Lê Văn Khải')).toBeDefined();
    expect(screen.getByText('0988 777 666')).toBeDefined();

    // Bấm duyệt và gán sạp
    const confirmBtn = screen.getByRole('button', { name: /Duyệt & Gán sạp A-05/i });
    fireEvent.click(confirmBtn);

    expect(mockApprove).toHaveBeenCalledWith('app-test-01', 'stall-vacant-01');
  });
});
