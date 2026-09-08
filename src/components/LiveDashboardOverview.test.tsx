import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import LiveDashboardOverview from './LiveDashboardOverview';

describe('LiveDashboardOverview Command Center Integration', () => {
  it('renders all 4 core KPI blocks and operations hero action chips', () => {
    render(
      <LiveDashboardOverview
        onNavigateToMap={vi.fn()}
        onNavigateToProfiles={vi.fn()}
      />
    );

    // 4 KPI Cards
    expect(screen.getByRole('button', { name: /Thẻ chỉ số sạp hàng/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /Thẻ chỉ số tiểu thương/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /Thẻ chỉ số phản ánh/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /Thẻ chỉ số thu phí/i })).toBeDefined();
    expect(screen.getByText(/24 \/ 50/i)).toBeDefined();

    // Operations Hero Action Chips
    expect(screen.getByText(/3 Phản ánh khẩn cấp/i)).toBeDefined();
    expect(screen.getByText(/8 Vấn đề hạ tầng & 4 Trật tự/i)).toBeDefined();
    expect(screen.getByText(/4 Sạp đến hạn nộp phí/i)).toBeDefined();
  });

  it('renders pure SVG Donut chart and DetailStatCards in Stalls tab by default', () => {
    render(
      <LiveDashboardOverview
        onNavigateToMap={vi.fn()}
        onNavigateToProfiles={vi.fn()}
      />
    );

    // Default tab is stalls
    expect(screen.getByText(/Quy Mô Sạp Hàng — 50 Sạp Chợ Đồng Xuân/i)).toBeDefined();
    expect(screen.getAllByText(/Tổng sạp/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Đã thuê/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Còn trống/i)).toBeDefined();
  });

  it('switches to Traders tab and displays trader Donut chart and stats', () => {
    render(
      <LiveDashboardOverview
        onNavigateToMap={vi.fn()}
        onNavigateToProfiles={vi.fn()}
      />
    );

    const tradersCard = screen.getByRole('button', { name: /Thẻ chỉ số tiểu thương/i });
    fireEvent.click(tradersCard);

    expect(screen.getByText(/Danh Bạ 19 Hộ Tiểu Thương Đang Kinh Doanh/i)).toBeDefined();
    expect(screen.getByText(/Hàng đợi phê duyệt: 7 hồ sơ/i)).toBeDefined();
    expect(screen.getAllByText(/Cố định \(có sạp\)/i).length).toBeGreaterThan(0);
  });

  it('switches to Complaints tab and displays SLA metrics with 3 operational tiers', () => {
    render(
      <LiveDashboardOverview
        onNavigateToMap={vi.fn()}
        onNavigateToProfiles={vi.fn()}
      />
    );

    const complaintsCard = screen.getByRole('button', { name: /Thẻ chỉ số phản ánh/i });
    fireEvent.click(complaintsCard);

    expect(screen.getByText(/Hệ Thống 15 Sự Cố Phản Ánh PAKN/i)).toBeDefined();
    expect(screen.getAllByText(/Sắp đến hạn SLA/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Quá hạn SLA/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Gian Lận & An Toàn Thực Phẩm/i)).toBeDefined();
    expect(screen.getByText(/Trật Tự & Quy Chế Mặt Bằng/i)).toBeDefined();
    expect(screen.getByText(/Hạ Tầng & Vệ Sinh Môi Trường/i)).toBeDefined();
  });

  it('switches to Billing tab and displays POS vs Cashless anomalies and shop financials', () => {
    render(
      <LiveDashboardOverview
        onNavigateToMap={vi.fn()}
        onNavigateToProfiles={vi.fn()}
      />
    );

    const billingCard = screen.getByRole('button', { name: /Thẻ chỉ số thu phí/i });
    fireEvent.click(billingCard);

    // Revenue anomalies from staff sandbox
    expect(screen.getByText(/Cảnh Báo Đối Chiếu Doanh Thu Bất Thường \(POS vs Cashless\)/i)).toBeDefined();
    expect(screen.getByText(/Thịt bò sạch & Thực phẩm tươi Minh Quân/i)).toBeDefined();
    expect(screen.getByText(/Lệch 27.1%/i)).toBeDefined();

    // Shop financials from staff sandbox
    expect(screen.getByText(/Doanh Thu & Hiệu Quả Kinh Doanh Theo Shop/i)).toBeDefined();
    expect(screen.getByText(/Giá vốn \(COGS\)/i)).toBeDefined();
    expect(screen.getAllByText(/Lợi nhuận gộp/i).length).toBeGreaterThan(0);
  });

  it('triggers onNavigateToMap when user clicks on map navigation CTA', () => {
    const onNavigateToMap = vi.fn();
    render(
      <LiveDashboardOverview
        onNavigateToMap={onNavigateToMap}
        onNavigateToProfiles={vi.fn()}
      />
    );

    const openMapBtn = screen.getByRole('button', { name: /Mở Sơ Đồ Không Gian Đầy Đủ/i });
    fireEvent.click(openMapBtn);

    expect(onNavigateToMap).toHaveBeenCalledTimes(1);
  });

  it('displays green dispatched badge when stall has been dispatched in complaints tab', () => {
    render(
      <LiveDashboardOverview
        onNavigateToMap={vi.fn()}
        onNavigateToProfiles={vi.fn()}
        dispatchedStalls={{
          'D900-06': { teamName: 'Tổ An Ninh', status: 'in_progress' }
        }}
      />
    );

    const complaintsCard = screen.getByRole('button', { name: /Thẻ chỉ số phản ánh/i });
    fireEvent.click(complaintsCard);

    expect(screen.getByText(/Đã điều phối \(Tổ An Ninh\)/i)).toBeDefined();
  });

  it('passes stall code to onNavigateToMap when opening full map from Quick Map modal', () => {
    const onNavigateToMap = vi.fn();
    render(
      <LiveDashboardOverview
        onNavigateToMap={onNavigateToMap}
        onNavigateToProfiles={vi.fn()}
      />
    );

    // Switch to Complaints tab
    const complaintsCard = screen.getByRole('button', { name: /Thẻ chỉ số phản ánh/i });
    fireEvent.click(complaintsCard);

    // Click "Sơ đồ" button on first complaint
    const mapButtons = screen.getAllByRole('button', { name: /^Sơ đồ$/i });
    expect(mapButtons.length).toBeGreaterThan(0);
    fireEvent.click(mapButtons[0]);

    // Quick map modal should open
    expect(screen.getByText(/Vị Trí Sạp/i)).toBeDefined();

    // Click "Mở Sơ Đồ Tác Chiến Toàn Diện"
    const openFullMapBtn = screen.getByRole('button', { name: /Mở Sơ Đồ Tác Chiến Toàn Diện/i });
    fireEvent.click(openFullMapBtn);

    expect(onNavigateToMap).toHaveBeenCalledWith(expect.any(String));
  });
});
