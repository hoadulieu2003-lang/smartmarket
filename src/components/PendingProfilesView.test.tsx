import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import PendingProfilesView from './PendingProfilesView';

describe('PendingProfilesView with Live Applications', () => {
  const mockApplications = [
    {
      id: 'app-001',
      userId: 'user-001',
      marketId: '30000000-0000-4000-8000-000000000001',
      categoryId: 'cat-001',
      fullName: 'Nguyện Ken',
      phone: '0825871266',
      idNumber: '010101112345',
      businessDescription: 'Kinh doanh thịt gia cầm tươi',
      desiredStallNote: 'A-01',
      documents: [
        { url: 'https://minio1.webtui.vn:9000/bucket-edu/uploads/test.jpg' }
      ],
      status: 'pending',
      adminNote: null,
      createdAt: new Date().toISOString(),
      markets: {
        id: '30000000-0000-4000-8000-000000000001',
        name: 'Chợ Trung Tâm (Demo)'
      },
      categories: {
        id: 'cat-001',
        name: 'Thực phẩm tươi sống'
      },
      applicant: {
        id: 'user-001',
        fullName: 'Nguyện Ken',
        avatar: 'https://s240-26-ava-talk.zadn.vn/test.jpg'
      }
    },
    {
      id: 'app-002',
      userId: 'user-002',
      marketId: '30000000-0000-4000-8000-000000000001',
      categoryId: 'cat-002',
      fullName: 'Trần Thị Bích',
      phone: '0912345678',
      idNumber: '020202223456',
      businessDescription: 'Trái cây nhập khẩu',
      desiredStallNote: null,
      documents: [],
      status: 'approved',
      adminNote: 'Đã phê duyệt cấp sạp B-02',
      createdAt: '2026-08-01T10:00:00.000Z',
      markets: {
        id: '30000000-0000-4000-8000-000000000001',
        name: 'Chợ Trung Tâm (Demo)'
      },
      categories: {
        id: 'cat-002',
        name: 'Trái cây'
      }
    }
  ];

  it('renders live applications from Zalo Mini App properly', () => {
    render(
      <PendingProfilesView
        onBackToMap={vi.fn()}
        applications={mockApplications}
      />
    );

    expect(screen.getByText('Tất cả (2)')).toBeDefined();
    expect(screen.getByText('Nguyện Ken')).toBeDefined();
    expect(screen.getByText('Trần Thị Bích')).toBeDefined();
    expect(screen.getByText('0825871266')).toBeDefined();
    expect(screen.getByText('Thực phẩm tươi sống')).toBeDefined();
  });

  it('triggers onApproveApplication when clicking Phê duyệt', async () => {
    const onApproveApplication = vi.fn().mockResolvedValue(undefined);
    render(
      <PendingProfilesView
        onBackToMap={vi.fn()}
        applications={mockApplications}
        onApproveApplication={onApproveApplication}
      />
    );

    const approveBtn = screen.getByRole('button', { name: /^Phê duyệt$/i });
    fireEvent.click(approveBtn);

    expect(onApproveApplication).toHaveBeenCalledWith('app-001');
  });

  it('triggers onRequestSupplement when clicking Yêu cầu bổ sung', async () => {
    const onRequestSupplement = vi.fn().mockResolvedValue(undefined);
    render(
      <PendingProfilesView
        onBackToMap={vi.fn()}
        applications={mockApplications}
        onRequestSupplement={onRequestSupplement}
      />
    );

    const supplementBtn = screen.getByRole('button', { name: /^Yêu cầu bổ sung$/i });
    fireEvent.click(supplementBtn);

    expect(onRequestSupplement).toHaveBeenCalledWith('app-001', expect.any(String));
  });

  it('opens application dossier modal with Zalo avatar and documents', () => {
    render(
      <PendingProfilesView
        onBackToMap={vi.fn()}
        applications={mockApplications}
      />
    );

    const card = screen.getByText('Nguyện Ken');
    fireEvent.click(card);

    expect(screen.getByRole('dialog')).toBeDefined();
    expect(screen.getByText('010101112345')).toBeDefined();
    expect(screen.getAllByText(/Kinh doanh thịt gia cầm tươi/i).length).toBeGreaterThan(0);
  });
});
