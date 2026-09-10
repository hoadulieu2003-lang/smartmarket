'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { CLIENT_AUDITS } from '@/data/clientCmsData';
import {
  Bell, Settings, ScrollText, Plus, Search, Filter, CheckCircle2,
  Clock, AlertTriangle, ShieldAlert, Send, Radio, Megaphone, Trash2,
  Pin, PinOff, Eye, EyeOff, Save, RotateCcw, Building, Users,
  Calendar, ShieldCheck, KeyRound, ExternalLink, X, Smartphone,
  Volume2, Check, Sparkles, Phone, Mail, UserCheck
} from 'lucide-react';

export interface NotificationItem {
  id: string;
  title: string;
  content: string;
  category: 'urgent' | 'order' | 'fee' | 'sanitation' | 'general';
  categoryLabel: string;
  categoryColor: string;
  channel: 'loudspeaker' | 'sms_zalo' | 'bulletin' | 'all';
  channelLabel: string;
  channelIcon: 'loudspeaker' | 'sms_zalo' | 'bulletin';
  scope: string;
  sender: string;
  createdAt: string;
  isRead: boolean;
  isPinned: boolean;
}

export interface SystemSettingConfig {
  marketOpenHours: string;
  freshFoodPowerHours: string;
  overdueDebtWarningDays: number;
  expiringContractWarningDays: number;
  slaP0Minutes: number;
  slaP1Minutes: number;
  slaP2Hours: number;
  bankName: string;
  bankAccount: string;
  bankOwner: string;
  autoSendDebtSms: boolean;
  autoAiCameraPatrol: boolean;
  mandatoryCashlessQr: boolean;
}

export interface StaffMember {
  id: string;
  name: string;
  role: string;
  phone: string;
  email: string;
  permission: string;
  status: 'active' | 'leave';
}

const DEFAULT_SETTINGS: SystemSettingConfig = {
  marketOpenHours: '05:30 - 21:30',
  freshFoodPowerHours: '04:30 - 22:00',
  overdueDebtWarningDays: 5,
  expiringContractWarningDays: 30,
  slaP0Minutes: 15,
  slaP1Minutes: 60,
  slaP2Hours: 24,
  bankName: 'Vietcombank - CN Hoàn Kiếm (Hà Nội)',
  bankAccount: '0011004568888',
  bankOwner: 'BAN QUAN LY CHO DONG XUAN',
  autoSendDebtSms: true,
  autoAiCameraPatrol: true,
  mandatoryCashlessQr: true
};

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'notif-1',
    title: 'Diễn tập định kỳ phương án PCCC & Cứu nạn cứu hộ Quý III/2026',
    content: 'Ban Quản lý Chợ phối hợp cùng Đội Cảnh sát PCCC & CNCH Quận Hoàn Kiếm tổ chức diễn tập lúc 08h00 ngày 12/09/2026. Yêu cầu 100% tiểu thương Khu A, B, C kiểm tra bình bọt chữa cháy tại sạp và nghiêm chỉnh tuân thủ tín hiệu kẻng báo động hiện trường.',
    category: 'urgent',
    categoryLabel: 'Khẩn cấp',
    categoryColor: 'bg-rose-50 text-rose-700 border-rose-200',
    channel: 'all',
    channelLabel: 'Loa + SMS + Bảng tin',
    channelIcon: 'loudspeaker',
    scope: 'Toàn chợ (50 sạp)',
    sender: 'Đội trưởng Trật tự & PCCC - Trần Quốc Tuấn',
    createdAt: '09/09/2026 08:00',
    isRead: false,
    isPinned: true
  },
  {
    id: 'notif-2',
    title: 'Đôn đốc quyết toán nợ phí dịch vụ & tiền thuê sạp tháng 08/2026',
    content: 'Thông báo tới 4 sạp kinh doanh (A-02, B-02, A-06, A-04) còn nợ quá hạn tổng số 16.800.000đ. Đề nghị các hộ liên hệ Kế toán BQL Chợ hoặc quét mã VietQR trên ứng dụng để hoàn thành nghĩa vụ tài chính trước 17h00 ngày 10/09/2026.',
    category: 'fee',
    categoryLabel: 'Thu phí & Công nợ',
    categoryColor: 'bg-amber-50 text-amber-700 border-amber-200',
    channel: 'sms_zalo',
    channelLabel: 'Tin nhắn Zalo/SMS',
    channelIcon: 'sms_zalo',
    scope: '4 sạp nợ quá hạn',
    sender: 'Tổ Kế toán BQL - Lê Thị Mai Hoa',
    createdAt: '09/09/2026 07:30',
    isRead: false,
    isPinned: true
  },
  {
    id: 'notif-3',
    title: 'Phát động tuần lễ Chợ Văn Minh: 100% Niêm yết giá & Thanh toán số VietQR',
    content: 'BQL Chợ phát động phong trào chuyển đổi số thương mại truyền thống, cấp miễn phí bảng mica mã QR động cho toàn bộ 50 sạp. Tổ kiểm tra văn minh thương mại sẽ đánh giá thi đua và khen thưởng sạp tiêu biểu.',
    category: 'general',
    categoryLabel: 'Vận hành số',
    categoryColor: 'bg-blue-50 text-blue-700 border-blue-200',
    channel: 'bulletin',
    channelLabel: 'Bảng tin điện tử',
    channelIcon: 'bulletin',
    scope: 'Toàn chợ (50 sạp)',
    sender: 'Trưởng ban QL - Nguyễn Đức Toàn',
    createdAt: '08/09/2026 14:15',
    isRead: true,
    isPinned: false
  },
  {
    id: 'notif-4',
    title: 'Tăng cường kiểm soát nguồn gốc thực phẩm tươi sống & rã đông gia cầm',
    content: 'Sau đợt kiểm tra hiện trường ngày 08/09, BQL yêu cầu các hộ tươi sống Khu A tuyệt đối không rã đông gia cầm trên sàn xi măng, phải có khay inox cách mặt sàn tối thiểu 20cm và xuất trình hóa đơn kiểm dịch thú y hợp lệ.',
    category: 'sanitation',
    categoryLabel: 'ATTP & Kiểm dịch',
    categoryColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    channel: 'loudspeaker',
    channelLabel: 'Loa phát thanh chợ',
    channelIcon: 'loudspeaker',
    scope: 'Khu A · Tươi sống',
    sender: 'Tổ Thú y & Vệ sinh ATTP - Vũ Văn Cường',
    createdAt: '08/09/2026 10:00',
    isRead: true,
    isPinned: false
  },
  {
    id: 'notif-5',
    title: 'Lịch bảo trì máy phát điện dự phòng & hệ thống bơm tăng áp cấp nước',
    content: 'Hệ thống điện dự phòng sẽ được nổ máy kiểm tra tải trong khung giờ từ 21h45 đến 22h30 đêm nay sau giờ đóng cửa chợ. Các sạp kinh doanh đồ khô vui lòng ngắt cầu dao tổng trước khi ra về.',
    category: 'order',
    categoryLabel: 'Hạ tầng kỹ thuật',
    categoryColor: 'bg-purple-50 text-purple-700 border-purple-200',
    channel: 'sms_zalo',
    channelLabel: 'Tin nhắn Zalo',
    channelIcon: 'sms_zalo',
    scope: 'Toàn bộ 5 phân khu',
    sender: 'Tổ Kỹ thuật Hạ tầng - Phạm Thanh Tùng',
    createdAt: '07/09/2026 16:20',
    isRead: true,
    isPinned: false
  }
];

const INITIAL_STAFF: StaffMember[] = [
  {
    id: 'staff-1',
    name: 'Nguyễn Đức Toàn',
    role: 'Trưởng ban Quản lý Chợ',
    phone: '0903 456 789',
    email: 'toannd@dongxuan.gov.vn',
    permission: 'Toàn quyền Quản trị (Super Admin)',
    status: 'active'
  },
  {
    id: 'staff-2',
    name: 'Trần Quốc Tuấn',
    role: 'Đội trưởng Trật tự & PCCC',
    phone: '0912 345 678',
    email: 'tuantq@dongxuan.gov.vn',
    permission: 'Điều phối trật tự, xử phạt vi phạm',
    status: 'active'
  },
  {
    id: 'staff-3',
    name: 'Lê Thị Mai Hoa',
    role: 'Kế toán trưởng BQL',
    phone: '0936 123 456',
    email: 'hoaltm@dongxuan.gov.vn',
    permission: 'Thu phí, đối soát công nợ, xuất biên lai',
    status: 'active'
  },
  {
    id: 'staff-4',
    name: 'Phạm Thanh Tùng',
    role: 'Cán bộ Kỹ thuật & Thẩm định sạp',
    phone: '0988 567 890',
    email: 'tungpt@dongxuan.gov.vn',
    permission: 'Thẩm định hồ sơ, cấp phép mặt bằng',
    status: 'active'
  },
  {
    id: 'staff-5',
    name: 'Vũ Văn Cường',
    role: 'Cán bộ Kiểm dịch & Vệ sinh ATTP',
    phone: '0977 890 123',
    email: 'cuongvv@dongxuan.gov.vn',
    permission: 'Kiểm tra ATTP, lập biên bản xử lý',
    status: 'active'
  }
];

interface SystemOperationsViewProps {
  initialTab?: 'notifications' | 'settings' | 'audits' | 'operations' | 'reports';
  onUnreadCountChange?: (count: number) => void;
  mode?: 'notifications' | 'settings' | 'all';
}

export default function SystemOperationsView({
  initialTab = 'notifications',
  onUnreadCountChange,
  mode = 'all'
}: SystemOperationsViewProps) {
  // Xác định tab mặc định dựa theo mode và initialTab
  const resolvedDefault = useMemo<'notifications' | 'settings' | 'audits'>(() => {
    if (mode === 'notifications') return 'notifications';
    if (mode === 'settings') {
      return initialTab === 'audits' ? 'audits' : 'settings';
    }
    const resolved = (initialTab === 'operations' || initialTab === 'reports') ? 'notifications' : initialTab;
    return (resolved === 'notifications' || resolved === 'settings' || resolved === 'audits') ? resolved : 'notifications';
  }, [mode, initialTab]);

  const [activeMainTab, setActiveMainTab] = useState<'notifications' | 'settings' | 'audits'>(resolvedDefault);

  // Tự động chuyển tab khi prop initialTab hoặc mode thay đổi
  useEffect(() => {
    if (mode === 'notifications') {
      setActiveMainTab('notifications');
    } else if (mode === 'settings') {
      setActiveMainTab(initialTab === 'audits' ? 'audits' : 'settings');
    } else {
      const resolved = (initialTab === 'operations' || initialTab === 'reports') ? 'notifications' : initialTab;
      if (resolved) {
        setActiveMainTab(resolved as any);
      }
    }
  }, [mode, initialTab]);

  // =========================================================================
  // 1. STATE CHO LUỒNG THÔNG BÁO (NOTIFICATIONS LOGIC)
  // =========================================================================
  const [notifications, setNotifications] = useState<NotificationItem[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('smartmarket_notifications');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {
          // fallback
        }
      }
    }
    return INITIAL_NOTIFICATIONS;
  });
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedNotif, setSelectedNotif] = useState<NotificationItem | null>(null);
  const [isBroadcastModalOpen, setIsBroadcastModalOpen] = useState<boolean>(false);

  // Form tạo thông báo mới
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newCategory, setNewCategory] = useState<'urgent' | 'order' | 'fee' | 'sanitation' | 'general'>('urgent');
  const [newChannel, setNewChannel] = useState<'loudspeaker' | 'sms_zalo' | 'bulletin' | 'all'>('all');
  const [newScope, setNewScope] = useState('Toàn chợ (50 sạp)');
  const [isBroadcasting, setIsBroadcasting] = useState(false);

  // Số lượng thông báo chưa đọc
  const unreadCount = useMemo(() => notifications.filter((n) => !n.isRead).length, [notifications]);

  // Đồng bộ số thông báo chưa đọc ra ngoài Header và Sidebar
  useEffect(() => {
    onUnreadCountChange?.(unreadCount);
    if (typeof window !== 'undefined') {
      localStorage.setItem('smartmarket_notifications', JSON.stringify(notifications));
    }
  }, [unreadCount, notifications, onUnreadCountChange]);

  // Lọc thông báo
  const filteredNotifications = useMemo(() => {
    return notifications
      .filter((n) => {
        if (filterCategory === 'unread') return !n.isRead;
        if (filterCategory === 'urgent') return n.category === 'urgent';
        if (filterCategory === 'fee') return n.category === 'fee';
        if (filterCategory === 'sanitation') return n.category === 'sanitation';
        return true;
      })
      .filter((n) => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q) || n.sender.toLowerCase().includes(q);
      })
      .sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        return 0;
      });
  }, [notifications, filterCategory, searchQuery]);

  // Hành động: Đánh dấu tất cả đã đọc
  const handleMarkAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    showToast('Đã đánh dấu tất cả thông báo là đã đọc');
  };

  // Hành động: Ghim/Bỏ ghim
  const handleTogglePin = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isPinned: !n.isPinned } : n))
    );
  };

  // Hành động: Xóa thông báo
  const handleDeleteNotification = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    if (selectedNotif?.id === id) setSelectedNotif(null);
    showToast('Đã xóa thông báo khỏi danh sách');
  };

  // Hành động: Đọc thông báo
  const handleOpenNotification = (notif: NotificationItem) => {
    setSelectedNotif(notif);
    if (!notif.isRead) {
      setNotifications((prev) =>
        prev.map((n) => (n.id === notif.id ? { ...n, isRead: true } : n))
      );
    }
  };

  // Hành động: Phát thông báo mới
  const handleSendBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return;

    setIsBroadcasting(true);
    setTimeout(() => {
      const categoryMap = {
        urgent: { label: 'Khẩn cấp', color: 'bg-rose-50 text-rose-700 border-rose-200' },
        fee: { label: 'Thu phí & Công nợ', color: 'bg-amber-50 text-amber-700 border-amber-200' },
        sanitation: { label: 'ATTP & Kiểm dịch', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
        order: { label: 'Trật tự mặt bằng', color: 'bg-purple-50 text-purple-700 border-purple-200' },
        general: { label: 'Thông báo chung', color: 'bg-blue-50 text-blue-700 border-blue-200' }
      };

      const channelLabelMap = {
        loudspeaker: 'Loa phát thanh',
        sms_zalo: 'Tin nhắn SMS/Zalo',
        bulletin: 'Bảng tin điện tử',
        all: 'Loa + SMS + Bảng tin'
      };

      const newNotifItem: NotificationItem = {
        id: `notif-${Date.now()}`,
        title: newTitle.trim(),
        content: newContent.trim(),
        category: newCategory,
        categoryLabel: categoryMap[newCategory].label,
        categoryColor: categoryMap[newCategory].color,
        channel: newChannel,
        channelLabel: channelLabelMap[newChannel],
        channelIcon: newChannel === 'loudspeaker' ? 'loudspeaker' : newChannel === 'sms_zalo' ? 'sms_zalo' : 'bulletin',
        scope: newScope,
        sender: 'Ban Quản Lý Chợ Đồng Xuân',
        createdAt: 'Vừa xong',
        isRead: true,
        isPinned: newCategory === 'urgent'
      };

      setNotifications((prev) => [newNotifItem, ...prev]);
      setIsBroadcasting(false);
      setIsBroadcastModalOpen(false);
      setNewTitle('');
      setNewContent('');
      showToast(`Đã phát thông báo thành công tới ${newScope}!`);
    }, 400);
  };

  // =========================================================================
  // 2. STATE CHO LUỒNG CÀI ĐẶT HỆ THỐNG (SETTINGS LOGIC)
  // =========================================================================
  const [settingsTab, setSettingsTab] = useState<'general' | 'staff' | 'audits'>('general');
  const [settings, setSettings] = useState<SystemSettingConfig>(DEFAULT_SETTINGS);
  const [staffList, setStaffList] = useState<StaffMember[]>(INITIAL_STAFF);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Load settings từ localStorage khi khởi chạy
  useEffect(() => {
    try {
      const saved = localStorage.getItem('smartmarket_system_settings');
      if (saved) {
        setSettings(JSON.parse(saved));
      }
    } catch {
      // Bỏ qua lỗi parse
    }
  }, []);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => {
      setToastMsg((current) => (current === msg ? null : current));
    }, 4000);
  };

  // Lưu cấu hình
  const handleSaveSettings = () => {
    try {
      localStorage.setItem('smartmarket_system_settings', JSON.stringify(settings));
      showToast('Đã lưu thành công tham số cấu hình hệ thống BQL Chợ!');
    } catch {
      showToast('Lỗi lưu cấu hình vào bộ nhớ trình duyệt');
    }
  };

  // Khôi phục mặc định
  const handleResetSettings = () => {
    setSettings(DEFAULT_SETTINGS);
    localStorage.removeItem('smartmarket_system_settings');
    showToast('Đã khôi phục tham số hệ thống về mặc định của BQL');
  };

  // =========================================================================
  // 3. STATE CHO NHẬT KÝ KIỂM TOÁN (AUDIT TRAIL LOGIC)
  // =========================================================================
  const [auditSearch, setAuditSearch] = useState('');
  const filteredAudits = useMemo(() => {
    if (!auditSearch.trim()) return CLIENT_AUDITS;
    const q = auditSearch.toLowerCase();
    return CLIENT_AUDITS.filter(
      (a) =>
        (a.action ? a.action.toLowerCase().includes(q) : false) ||
        (a.description ? a.description.toLowerCase().includes(q) : false) ||
        (a.actor?.fullName ? a.actor.fullName.toLowerCase().includes(q) : false)
    );
  }, [auditSearch]);

  return (
    <div className="space-y-4 font-sans text-slate-800 pb-10">
      {/* Toast thông báo toàn cục */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 bg-[#0B7A3A] text-white rounded-xl shadow-xl font-bold text-xs animate-in slide-in-from-bottom-5">
          <CheckCircle2 className="w-4 h-4 text-emerald-200 shrink-0" />
          <span>{toastMsg}</span>
          <button
            type="button"
            onClick={() => setToastMsg(null)}
            className="ml-2 hover:bg-white/20 p-1 rounded-md cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* THANH ĐIỀU HƯỚNG / HEADER THEO PHÂN HỆ (SEPARATED MODE VIEWS) */}
      {/* ========================================================================= */}
      {mode === 'notifications' ? (
        /* HEADER DÀNH RIÊNG CHO PHÂN HỆ THÔNG BÁO (CHỈ HIỆN THÔNG BÁO) */
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div>
            <h1 className="text-base font-black text-slate-900 flex items-center gap-2">
              <Bell className="w-5 h-5 text-[#0B7A3A]" />
              <span>Trung Tâm Thông Báo & Phát Tin Điều Hành</span>
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Theo dõi phát thanh khẩn cấp, đôn đốc công nợ, diễn tập PCCC và thông báo điều hành chợ
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsBroadcastModalOpen(true)}
            className="min-h-11 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs flex items-center gap-2 transition-colors cursor-pointer shadow-xs shrink-0 self-start sm:self-auto"
          >
            <Megaphone className="w-4 h-4" />
            <span>Phát thông báo mới</span>
          </button>
        </div>
      ) : mode === 'settings' ? (
        /* THANH ĐIỀU HƯỚNG DÀNH RIÊNG CHO CÀI ĐẶT HỆ THỐNG (CHỈ 2 MỤC HỆ THỐNG) */
        <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-2 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              type="button"
              onClick={() => setActiveMainTab('settings')}
              className={`min-h-11 px-4 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 ${
                activeMainTab === 'settings'
                  ? 'bg-[#0B7A3A] text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Settings className="w-4 h-4" />
              <span>Cài Đặt Hệ Thống</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveMainTab('audits')}
              className={`min-h-11 px-4 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 ${
                activeMainTab === 'audits'
                  ? 'bg-[#0B7A3A] text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <ScrollText className="w-4 h-4" />
              <span>Nhật Ký Hệ Thống</span>
            </button>
          </div>
        </div>
      ) : (
        /* THANH ĐIỀU HƯỚNG CHUNG (CHO TEST & CHẾ ĐỘ TOÀN BỘ) */
        <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-2 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              type="button"
              onClick={() => setActiveMainTab('notifications')}
              className={`min-h-11 px-4 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 ${
                activeMainTab === 'notifications'
                  ? 'bg-[#0B7A3A] text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Bell className="w-4 h-4" />
              <span>Thông Báo Điều Hành</span>
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-black bg-rose-500 text-white ml-0.5">
                  {unreadCount}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveMainTab('settings')}
              className={`min-h-11 px-4 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 ${
                activeMainTab === 'settings'
                  ? 'bg-[#0B7A3A] text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Settings className="w-4 h-4" />
              <span>Cài Đặt Hệ Thống</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveMainTab('audits')}
              className={`min-h-11 px-4 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 ${
                activeMainTab === 'audits'
                  ? 'bg-[#0B7A3A] text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <ScrollText className="w-4 h-4" />
              <span>Nhật Ký Hệ Thống</span>
            </button>
          </div>

          {activeMainTab === 'notifications' && (
            <button
              type="button"
              onClick={() => setIsBroadcastModalOpen(true)}
              className="min-h-11 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs flex items-center gap-2 transition-colors cursor-pointer shadow-xs"
            >
              <Megaphone className="w-4 h-4" />
              <span>Phát thông báo mới</span>
            </button>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. VIEW: THÔNG BÁO ĐIỀU HÀNH (NOTIFICATIONS VIEW) */}
      {/* ========================================================================= */}
      {(mode === 'notifications' || (mode === 'all' && activeMainTab === 'notifications')) && (
        <div className="space-y-4">
          {/* Thanh công cụ lọc & tìm kiếm */}
          <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            {/* Tab lọc trạng thái */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              <button
                type="button"
                onClick={() => setFilterCategory('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap cursor-pointer transition-colors ${
                  filterCategory === 'all'
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Tất cả ({notifications.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterCategory('unread')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap cursor-pointer transition-colors flex items-center gap-1.5 ${
                  filterCategory === 'unread'
                    ? 'bg-rose-600 text-white'
                    : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                }`}
              >
                <span>Chưa đọc</span>
                <span className="px-1 py-0.2 rounded bg-white/20 text-[10px]">{unreadCount}</span>
              </button>
              <button
                type="button"
                onClick={() => setFilterCategory('urgent')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap cursor-pointer transition-colors ${
                  filterCategory === 'urgent'
                    ? 'bg-amber-600 text-white'
                    : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                }`}
              >
                Khẩn cấp
              </button>
              <button
                type="button"
                onClick={() => setFilterCategory('fee')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap cursor-pointer transition-colors ${
                  filterCategory === 'fee'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                }`}
              >
                Thu phí
              </button>
            </div>

            {/* Tìm kiếm & Đánh dấu đã đọc */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1 sm:w-64">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Tìm tiêu đề, nội dung..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:border-[#0B7A3A] bg-slate-50"
                />
              </div>

              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAllAsRead}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold whitespace-nowrap cursor-pointer flex items-center gap-1"
                  title="Đánh dấu tất cả đã đọc"
                >
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="hidden sm:inline">Đã đọc hết</span>
                </button>
              )}
            </div>
          </div>

          {/* Danh sách thông báo */}
          <div className="space-y-3">
            {filteredNotifications.length === 0 ? (
              <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-400 text-xs font-medium">
                Không tìm thấy thông báo nào phù hợp với bộ lọc hiện tại.
              </div>
            ) : (
              filteredNotifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => handleOpenNotification(n)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer bg-white shadow-2xs hover:shadow-md hover:border-[#0B7A3A]/40 flex flex-col md:flex-row items-start md:items-center justify-between gap-3.5 ${
                    !n.isRead ? 'border-l-4 border-l-rose-500 bg-rose-50/20' : 'border-slate-200'
                  }`}
                >
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      {n.isPinned && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-black text-amber-700 bg-amber-100 px-2 py-0.5 rounded-md">
                          <Pin className="w-3 h-3 fill-amber-700" />
                          Ghim đầu
                        </span>
                      )}
                      <span className={`inline-block text-[10px] font-black px-2 py-0.5 rounded-md border ${n.categoryColor}`}>
                        {n.categoryLabel}
                      </span>
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                        <Volume2 className="w-3 h-3 text-slate-500" />
                        {n.channelLabel}
                      </span>
                      <span className="text-[10px] font-bold text-slate-400">
                        {n.scope}
                      </span>
                    </div>

                    <h3 className={`text-sm font-black text-slate-900 leading-snug ${!n.isRead ? 'text-[#0F172A]' : 'text-slate-700'}`}>
                      {n.title}
                    </h3>

                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                      {n.content}
                    </p>

                    <div className="flex items-center gap-3 text-[11px] text-slate-400 font-medium pt-1">
                      <span>Người phát: <strong className="text-slate-700 font-bold">{n.sender}</strong></span>
                      <span>•</span>
                      <span className="font-mono">{n.createdAt}</span>
                    </div>
                  </div>

                  {/* Hành động nhanh trên thẻ */}
                  <div className="flex items-center gap-1.5 self-end md:self-center shrink-0">
                    <button
                      type="button"
                      onClick={(e) => handleTogglePin(n.id, e)}
                      className={`p-2 rounded-lg border text-xs font-bold cursor-pointer transition-colors ${
                        n.isPinned
                          ? 'border-amber-300 bg-amber-50 text-amber-700'
                          : 'border-slate-200 text-slate-400 hover:text-slate-700 hover:bg-slate-50'
                      }`}
                      title={n.isPinned ? 'Bỏ ghim' : 'Ghim thông báo'}
                    >
                      <Pin className={`w-3.5 h-3.5 ${n.isPinned ? 'fill-amber-700' : ''}`} />
                    </button>

                    <button
                      type="button"
                      onClick={(e) => handleDeleteNotification(n.id, e)}
                      className="p-2 rounded-lg border border-slate-200 text-slate-400 hover:text-rose-600 hover:border-rose-200 hover:bg-rose-50 text-xs font-bold cursor-pointer transition-colors"
                      title="Xóa thông báo"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-colors cursor-pointer"
                    >
                      Chi tiết →
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. VIEW: CÀI ĐẶT HỆ THỐNG (SETTINGS VIEW) */}
      {/* ========================================================================= */}
      {mode !== 'notifications' && activeMainTab === 'settings' && (
        <div className="space-y-4">
          {/* Sub-tab Cài đặt: Tham số vận hành | Cán bộ BQL */}
          <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
            <button
              type="button"
              onClick={() => setSettingsTab('general')}
              className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 ${
                settingsTab === 'general'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Building className="w-4 h-4" />
              <span>Tham Số Vận Hành Chợ</span>
            </button>

            <button
              type="button"
              onClick={() => setSettingsTab('staff')}
              className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 ${
                settingsTab === 'staff'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Cán Bộ BQL & Phân Quyền ({staffList.length})</span>
            </button>
          </div>

          {/* Tab con 1: Cấu hình tham số */}
          {settingsTab === 'general' && (
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div>
                  <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                    <Sparkles className="w-4.5 h-4.5 text-[#0B7A3A]" />
                    <span>Cấu hình Hệ thống & Tham số Vận hành BQL</span>
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Điều chỉnh tham số thời gian, cảnh báo nợ tự động, tài khoản ngân hàng và chính sách an toàn
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleResetSettings}
                    className="min-h-11 px-3.5 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Mặc định</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleSaveSettings}
                    className="min-h-11 px-4 py-2 rounded-xl bg-[#0B7A3A] hover:bg-[#08632F] text-white font-black text-xs flex items-center gap-1.5 cursor-pointer transition-colors shadow-sm"
                  >
                    <Save className="w-4 h-4" />
                    <span>Lưu cấu hình</span>
                  </button>
                </div>
              </div>

              {/* Nhóm 1: Giờ hoạt động & Cấp điện */}
              <div className="space-y-3">
                <h3 className="text-xs font-black text-slate-700 uppercase tracking-wider">
                  1. Khung giờ vận hành & Cấp điện
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-1.5">
                    <label className="text-xs font-black text-slate-800 block">
                      Giờ mở / đóng cửa chính chợ:
                    </label>
                    <input
                      type="text"
                      value={settings.marketOpenHours}
                      onChange={(e) => setSettings({ ...settings, marketOpenHours: e.target.value })}
                      className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900 focus:outline-none focus:border-[#0B7A3A]"
                    />
                    <span className="text-[11px] text-slate-400 block">Khung giờ mở cửa các cổng Phố Hàng Khoai & Cầu Đông</span>
                  </div>

                  <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-1.5">
                    <label className="text-xs font-black text-slate-800 block">
                      Giờ cấp điện phân khu thực phẩm tươi sống:
                    </label>
                    <input
                      type="text"
                      value={settings.freshFoodPowerHours}
                      onChange={(e) => setSettings({ ...settings, freshFoodPowerHours: e.target.value })}
                      className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900 focus:outline-none focus:border-[#0B7A3A]"
                    />
                    <span className="text-[11px] text-slate-400 block">Cung cấp điện liên tục cho hệ thống tủ đông và sục khí hải sản</span>
                  </div>
                </div>
              </div>

              {/* Nhóm 2: Ngưỡng cảnh báo nghiệp vụ */}
              <div className="space-y-3">
                <h3 className="text-xs font-black text-slate-700 uppercase tracking-wider">
                  2. Ngưỡng cảnh báo nợ & Thời hạn SLA
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-1.5">
                    <label className="text-xs font-black text-slate-800 block">
                      Cảnh báo nợ quá hạn (ngày):
                    </label>
                    <input
                      type="number"
                      value={settings.overdueDebtWarningDays}
                      onChange={(e) => setSettings({ ...settings, overdueDebtWarningDays: Number(e.target.value) })}
                      className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900 focus:outline-none focus:border-[#0B7A3A]"
                    />
                    <span className="text-[11px] text-slate-400 block">Số ngày sau hạn nộp phí để kích hoạt nhắc nợ</span>
                  </div>

                  <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-1.5">
                    <label className="text-xs font-black text-slate-800 block">
                      Cảnh báo hết hạn hợp đồng (ngày):
                    </label>
                    <input
                      type="number"
                      value={settings.expiringContractWarningDays}
                      onChange={(e) => setSettings({ ...settings, expiringContractWarningDays: Number(e.target.value) })}
                      className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900 focus:outline-none focus:border-[#0B7A3A]"
                    />
                    <span className="text-[11px] text-slate-400 block">Gửi thông báo đôn đốc tiểu thương gia hạn hợp đồng sạp</span>
                  </div>

                  <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-1.5">
                    <label className="text-xs font-black text-slate-800 block">
                      Thời hạn xử lý phản ánh khẩn cấp (phút):
                    </label>
                    <input
                      type="number"
                      value={settings.slaP0Minutes}
                      onChange={(e) => setSettings({ ...settings, slaP0Minutes: Number(e.target.value) })}
                      className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900 focus:outline-none focus:border-[#0B7A3A]"
                    />
                    <span className="text-[11px] text-slate-400 block">Thời gian tối đa đội hiện trường phải có mặt xử lý</span>
                  </div>
                </div>
              </div>

              {/* Nhóm 3: Tài khoản thu phí BQL & VietQR */}
              <div className="space-y-3">
                <h3 className="text-xs font-black text-slate-700 uppercase tracking-wider">
                  3. Tài khoản nhận phí Ban Quản Lý (VietQR)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-1.5">
                    <label className="text-xs font-black text-slate-800 block">
                      Ngân hàng thụ hưởng:
                    </label>
                    <input
                      type="text"
                      value={settings.bankName}
                      onChange={(e) => setSettings({ ...settings, bankName: e.target.value })}
                      className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900 focus:outline-none focus:border-[#0B7A3A]"
                    />
                  </div>

                  <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-1.5">
                    <label className="text-xs font-black text-slate-800 block">
                      Số tài khoản BQL:
                    </label>
                    <input
                      type="text"
                      value={settings.bankAccount}
                      onChange={(e) => setSettings({ ...settings, bankAccount: e.target.value })}
                      className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-[#0B7A3A]"
                    />
                  </div>

                  <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-1.5">
                    <label className="text-xs font-black text-slate-800 block">
                      Tên chủ tài khoản:
                    </label>
                    <input
                      type="text"
                      value={settings.bankOwner}
                      onChange={(e) => setSettings({ ...settings, bankOwner: e.target.value })}
                      className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900 focus:outline-none focus:border-[#0B7A3A]"
                    />
                  </div>
                </div>
              </div>

              {/* Nhóm 4: Công tắc tự động hóa */}
              <div className="space-y-3 pt-2">
                <h3 className="text-xs font-black text-slate-700 uppercase tracking-wider">
                  4. Chế độ Tự động hóa & Giám sát thông minh
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                  <div className="p-3.5 rounded-xl border border-slate-200 bg-white flex items-center justify-between gap-3 shadow-2xs">
                    <div>
                      <div className="text-xs font-black text-slate-900">Tự động gửi SMS nhắc nợ</div>
                      <div className="text-[11px] text-slate-400">Gửi tin nhắn khi quá hạn 5 ngày</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.autoSendDebtSms}
                      onChange={(e) => setSettings({ ...settings, autoSendDebtSms: e.target.checked })}
                      className="w-5 h-5 accent-[#0B7A3A] cursor-pointer"
                    />
                  </div>

                  <div className="p-3.5 rounded-xl border border-slate-200 bg-white flex items-center justify-between gap-3 shadow-2xs">
                    <div>
                      <div className="text-xs font-black text-slate-900">Tuần tra Camera AI</div>
                      <div className="text-[11px] text-slate-400">Phát hiện lấn chiếm lối thoát hiểm</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.autoAiCameraPatrol}
                      onChange={(e) => setSettings({ ...settings, autoAiCameraPatrol: e.target.checked })}
                      className="w-5 h-5 accent-[#0B7A3A] cursor-pointer"
                    />
                  </div>

                  <div className="p-3.5 rounded-xl border border-slate-200 bg-white flex items-center justify-between gap-3 shadow-2xs">
                    <div>
                      <div className="text-xs font-black text-slate-900">Bắt buộc VietQR 100%</div>
                      <div className="text-[11px] text-slate-400">Không dùng tiền mặt tại chợ</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.mandatoryCashlessQr}
                      onChange={(e) => setSettings({ ...settings, mandatoryCashlessQr: e.target.checked })}
                      className="w-5 h-5 accent-[#0B7A3A] cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab con 2: Cán bộ BQL */}
          {settingsTab === 'staff' && (
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-black text-slate-900">Danh Sách Cán Bộ BQL & Phân Quyền Nghiệp Vụ</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Quản lý tài khoản cán bộ trực ban, kiểm dịch, trật tự và thủ quỹ</p>
                </div>
                <button
                  type="button"
                  onClick={() => showToast('Tính năng thêm cán bộ BQL đang kết nối với cổng dịch vụ công Hoàn Kiếm')}
                  className="min-h-11 px-3.5 py-2 rounded-xl bg-[#0B7A3A] text-white font-black text-xs flex items-center gap-1.5 cursor-pointer hover:bg-[#08632F] transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>Thêm cán bộ BQL</span>
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#F8FAFC] border-b border-slate-200 text-slate-600 font-bold">
                    <tr>
                      <th className="py-3 px-4">Họ và tên</th>
                      <th className="py-3 px-4">Chức danh / Vai trò</th>
                      <th className="py-3 px-4">Số điện thoại</th>
                      <th className="py-3 px-4">Phân quyền chức năng</th>
                      <th className="py-3 px-4 text-right">Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {staffList.map((s) => (
                      <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-4 font-bold text-slate-900 flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-[#0B7A3A]/10 text-[#0B7A3A] font-black text-xs flex items-center justify-center">
                            {s.name.charAt(0)}
                          </div>
                          <span>{s.name}</span>
                        </td>
                        <td className="py-3 px-4 text-slate-700 font-medium">{s.role}</td>
                        <td className="py-3 px-4 font-mono text-slate-600">{s.phone}</td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 font-bold text-[11px] border border-blue-200">
                            {s.permission}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-bold text-[11px]">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Đang trực ca
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. VIEW: NHẬT KÝ HỆ THỐNG (AUDIT TRAIL VIEW) */}
      {/* ========================================================================= */}
      {mode !== 'notifications' && activeMainTab === 'audits' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs space-y-4 p-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-base font-black text-[#153154] flex items-center gap-2">
                <ScrollText className="w-4.5 h-4.5 text-[#0B7A3A]" />
                <span>Nhật ký Hệ thống (Audit Trail)</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Lưu vết 100% thao tác thay đổi trạng thái sạp, duyệt cấp phép, đôn đốc nộp phí và lệnh điều phối trật tự
              </p>
            </div>

            <div className="relative w-full sm:w-72">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Tìm hành động, người thực hiện..."
                value={auditSearch}
                onChange={(e) => setAuditSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-slate-50 focus:outline-none focus:border-[#0B7A3A]"
              />
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-100">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F8FAFC] border-b border-slate-200 text-[#475569] font-bold">
                <tr>
                  <th className="py-3 px-3.5">HÀNH ĐỘNG</th>
                  <th className="py-3 px-3.5">MÔ TẢ CHI TIẾT</th>
                  <th className="py-3 px-3.5">NGƯỜI THỰC HIỆN</th>
                  <th className="py-3 px-3.5">ĐỊA CHỈ IP</th>
                  <th className="py-3 px-3.5 font-mono">THỜI GIAN</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredAudits.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-3.5 font-mono font-bold text-[#0B7A3A] whitespace-nowrap">
                      {a.action}
                    </td>
                    <td className="py-3 px-3.5 text-slate-700">
                      {a.description}
                    </td>
                    <td className="py-3 px-3.5 whitespace-nowrap font-bold text-[#153154]">
                      {a.actor?.fullName}
                    </td>
                    <td className="py-3 px-3.5 font-mono text-slate-400 whitespace-nowrap">
                      {a.ipAddress}
                    </td>
                    <td className="py-3 px-3.5 font-mono text-slate-400 whitespace-nowrap">
                      {a.createdAt.replace('T', ' ').slice(0, 16)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL CHI TIẾT THÔNG BÁO (NOTIFICATION DETAIL MODAL) */}
      {/* ========================================================================= */}
      {selectedNotif && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-xl bg-white rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className={`text-[11px] font-black px-2.5 py-0.5 rounded-md border ${selectedNotif.categoryColor}`}>
                  {selectedNotif.categoryLabel}
                </span>
                <span className="text-xs text-slate-400 font-mono">{selectedNotif.createdAt}</span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedNotif(null)}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2">
              <h2 className="text-base sm:text-lg font-black text-slate-900 leading-snug">
                {selectedNotif.title}
              </h2>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-700 leading-relaxed whitespace-pre-line">
                {selectedNotif.content}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs pt-1">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <div className="text-[10px] text-slate-400 font-bold uppercase">Kênh truyền thông</div>
                <div className="font-bold text-slate-800 mt-0.5">{selectedNotif.channelLabel}</div>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <div className="text-[10px] text-slate-400 font-bold uppercase">Phạm vi áp dụng</div>
                <div className="font-bold text-slate-800 mt-0.5">{selectedNotif.scope}</div>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between border-t border-slate-100 text-xs text-slate-500">
              <span>Người phát: <strong className="text-slate-800 font-bold">{selectedNotif.sender}</strong></span>
              <button
                type="button"
                onClick={() => setSelectedNotif(null)}
                className="min-h-11 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL PHÁT THÔNG BÁO MỚI (BROADCAST NEW NOTIFICATION MODAL) */}
      {/* ========================================================================= */}
      {isBroadcastModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleSendBroadcast}
            className="w-full max-w-xl bg-white rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4 animate-in zoom-in-95"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Megaphone className="w-5 h-5 text-amber-500" />
                <h3 className="text-base font-black text-slate-900">Phát Thông Báo Toàn Chợ</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsBroadcastModalOpen(false)}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-black text-slate-800 block mb-1">
                  Tiêu đề thông báo: *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Kiểm tra an toàn điện & PCCC cuối ngày..."
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-900 focus:outline-none focus:border-[#0B7A3A]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-black text-slate-800 block mb-1">
                    Phân loại nghiệp vụ:
                  </label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as any)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-800 bg-white"
                  >
                    <option value="urgent">Khẩn cấp (PCCC / Sự cố)</option>
                    <option value="fee">Thu phí & Đôn đốc nộp tiền</option>
                    <option value="sanitation">Vệ sinh & An toàn thực phẩm</option>
                    <option value="order">Trật tự & Mặt bằng kinh doanh</option>
                    <option value="general">Thông báo chung / Chợ văn minh</option>
                  </select>
                </div>

                <div>
                  <label className="font-black text-slate-800 block mb-1">
                    Kênh truyền thông:
                  </label>
                  <select
                    value={newChannel}
                    onChange={(e) => setNewChannel(e.target.value as any)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-800 bg-white"
                  >
                    <option value="all">Loa phát thanh + SMS + Bảng tin</option>
                    <option value="loudspeaker">Chỉ hệ thống Loa phát thanh</option>
                    <option value="sms_zalo">Chỉ gửi tin nhắn SMS / Zalo</option>
                    <option value="bulletin">Bảng tin điện tử thông minh</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-black text-slate-800 block mb-1">
                  Phạm vi phát tin:
                </label>
                <select
                  value={newScope}
                  onChange={(e) => setNewScope(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-800 bg-white"
                >
                  <option value="Toàn chợ (50 sạp)">Toàn bộ chợ (50 sạp)</option>
                  <option value="Khu A · Thực phẩm tươi sống">Khu A · Thực phẩm tươi sống</option>
                  <option value="Khu B · Nông sản khô & Gia vị">Khu B · Nông sản khô & Gia vị</option>
                  <option value="Khu C · Ẩm thực & Đồ uống">Khu C · Ẩm thực & Đồ uống</option>
                  <option value="Khu D · Bách hóa & Đặc sản">Khu D · Bách hóa & Đặc sản</option>
                  <option value="Khu E · Vải sợi & Quà lưu niệm">Khu E · Vải sợi & Quà lưu niệm</option>
                </select>
              </div>

              <div>
                <label className="font-black text-slate-800 block mb-1">
                  Nội dung chi tiết: *
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="Nhập nội dung thông báo gửi tới các hộ tiểu thương..."
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-[#0B7A3A] resize-none"
                />
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsBroadcastModalOpen(false)}
                className="min-h-11 px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold cursor-pointer"
              >
                Hủy
              </button>

              <button
                type="submit"
                disabled={isBroadcasting}
                className="min-h-11 px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs flex items-center gap-2 cursor-pointer transition-colors shadow-xs disabled:opacity-50"
              >
                {isBroadcasting ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                    <span>Đang phát tin...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Phát thông báo ngay</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
