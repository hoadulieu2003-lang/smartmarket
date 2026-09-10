import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import LoginPage from './LoginPage';

describe('LoginPage Component', () => {
  it('renders split screen brand panel and quick demo login buttons', () => {
    const onLogin = vi.fn();
    render(<LoginPage onLogin={onLogin} />);

    expect(screen.getByText(/Vận hành chợ nhẹ nhàng hơn mỗi ngày/i)).toBeDefined();
    expect(screen.getByText(/Đăng Nhập Điều Hành/i)).toBeDefined();
    expect(screen.getByText(/Quản lý Chợ Đồng Xuân/i)).toBeDefined();
    expect(screen.getByText(/Super Admin/i)).toBeDefined();
    expect(screen.getByText(/Sở Công Thương/i)).toBeDefined();
  });

  it('triggers quick login when demo button is clicked', () => {
    const onLogin = vi.fn();
    render(<LoginPage onLogin={onLogin} />);

    const superAdminBtn = screen.getByText(/Super Admin/i).closest('button');
    expect(superAdminBtn).not.toBeNull();
    if (superAdminBtn) fireEvent.click(superAdminBtn);

    expect(onLogin).toHaveBeenCalledWith(expect.objectContaining({
      role: 'super_admin',
      fullName: 'Lê Hoàng Minh'
    }));
  });

  it('submits credentials form and calls onLogin', () => {
    const onLogin = vi.fn();
    render(<LoginPage onLogin={onLogin} />);

    const submitBtn = screen.getByRole('button', { name: /Đăng nhập vào Hệ thống/i });
    fireEvent.click(submitBtn);

    expect(onLogin).toHaveBeenCalledWith(expect.objectContaining({
      role: 'market_manager'
    }));
  });
});
