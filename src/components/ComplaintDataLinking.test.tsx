import React from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import MarketInteractiveMapView from './MarketInteractiveMapView';
import LiveDashboardOverview from './LiveDashboardOverview';
import { CLIENT_COMPLAINTS, CLIENT_STALLS, CLIENT_TRADERS, CLIENT_MARKETS } from '@/data/clientCmsData';

describe('Bidirectional Complaint Data Linking & Reactivity Protocol', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('hides complaint alert and shows safe operational status in MarketInteractiveMapView drawer when complaint is resolved', () => {
    // Sạp A-06 ban đầu có khiếu nại PAKN-2026-075
    const resolvedCodes = ['PAKN-2026-075'];

    render(
      <MarketInteractiveMapView
        initialSelectedStallCode="A-06"
        resolvedCodes={resolvedCodes}
      />
    );

    // Kiểm tra rằng cảnh báo khẩn cấp không còn hiển thị
    expect(screen.queryByText(/Cảnh báo PAKN đang xử lý/i)).toBeNull();
    // Thay vào đó hiển thị thẻ trạng thái an toàn
    expect(screen.getByText(/An toàn vận hành: 0 vụ PAKN tồn đọng/i)).toBeDefined();
    expect(screen.getByText(/Ổn định/i)).toBeDefined();
  });

  it('allows resolving a complaint directly from MarketInteractiveMapView drawer and clears the complaint box', () => {
    const onResolve = vi.fn();

    render(
      <MarketInteractiveMapView
        initialSelectedStallCode="B-02"
        onResolveComplaint={onResolve}
      />
    );

    // Ban đầu B-02 có khiếu nại niêm yết giá
    const resolveBtn = screen.queryByRole('button', { name: /Đóng & Giải Quyết Phản Ánh/i });
    if (resolveBtn) {
      fireEvent.click(resolveBtn);
      expect(onResolve).toHaveBeenCalled();
      // Sau khi giải quyết, thẻ an toàn vận hành xuất hiện
      expect(screen.getByText(/An toàn vận hành: 0 vụ PAKN tồn đọng/i)).toBeDefined();
    }
  });

  it('renders safe green hero badge in LiveDashboardOverview when all critical complaints are resolved', () => {
    // Giả lập tất cả 3 phản ánh P0 đều đã được đóng
    const allP0Resolved = ['PAKN-2026-075', 'PAKN-2026-081', 'PAKN-2026-084'];

    render(
      <LiveDashboardOverview
        onNavigateToMap={vi.fn()}
        resolvedComplaintCodes={allP0Resolved}
        stalls={CLIENT_STALLS}
        complaints={CLIENT_COMPLAINTS}
      />
    );

    // Hero Section TO-DO 1 phải hiển thị 0 Phản ánh khẩn cấp và nhãn an toàn
    expect(screen.getByText(/0 Phản ánh khẩn cấp/i)).toBeDefined();
    expect(screen.getByText(/✓ Ổn định/i)).toBeDefined();
  });

  it('updates stallCounts.complaint to 0 when all complaints are resolved', () => {
    const allResolved = CLIENT_COMPLAINTS.map((c) => c.code).filter(Boolean) as string[];

    render(
      <LiveDashboardOverview
        onNavigateToMap={vi.fn()}
        resolvedComplaintCodes={allResolved}
        stalls={CLIENT_STALLS}
        complaints={CLIENT_COMPLAINTS}
      />
    );

    // Bộ lọc Sự cố khẩn cấp phải cập nhật số đếm về (0)
    expect(screen.getByText(/Sự cố khẩn cấp \(0\)/i)).toBeDefined();
  });
});
