'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  MapPin, Store, Footprints, Flame, Scale, DoorOpen,
  Play, Pause, RotateCcw, Save, Sparkles, Trash2,
  ShieldAlert, AlertTriangle, CheckCircle2, Clock,
  DollarSign, Users, Search, Filter, Info, Phone,
  QrCode, ExternalLink, ChevronRight, X, Layers,
  Compass, Eye, Wrench, ArrowRight, Building2,
  Radio, ShoppingBag, ShieldCheck, Check, Loader2
} from 'lucide-react';
import {
  CLIENT_STALLS, CLIENT_ZONES, CLIENT_MARKETS,
  CLIENT_PRODUCTS, CLIENT_COMPLAINTS, CLIENT_TRADERS
} from '@/data/clientCmsData';
import type { Stall, Zone, Product, Complaint } from '@/types/clientTypes';

export type OperationalDutyMode = 'leasing' | 'incidents' | 'commerce' | 'safety';

export type ToolType =
  | 'inspect'
  | 'walkway'
  | 'emergency_exit'
  | 'stall_fresh'
  | 'stall_produce'
  | 'stall_food'
  | 'stall_dry'
  | 'stall_fashion'
  | 'gate'
  | 'fire_extinguisher'
  | 'scale'
  | 'eraser';

export interface GridCell {
  x: number;
  y: number;
  type: 'empty' | 'walkway' | 'emergency_exit' | 'stall' | 'gate' | 'fire_extinguisher' | 'scale';
  stallCode?: string;
  facilityLabel?: string;
}

export interface SimNpc {
  id: string;
  x: number;
  y: number;
  color: string;
  speechBubble?: string;
  stepsRemaining: number;
}

const GRID_COLS = 24;
const GRID_ROWS = 15;
const CELL_SIZE = 44; // px

const ZONE_COLORS: Record<string, { bg: string; border: string; text: string; name: string }> = {
  'KHU-A': { bg: '#ECFDF5', border: '#10B981', text: '#065F46', name: 'Khu A · Tươi sống' },
  'KHU-B': { bg: '#FFFBEB', border: '#F59E0B', text: '#92400E', name: 'Khu B · Nông sản khô' },
  'KHU-C': { bg: '#FFF1F2', border: '#F43F5E', text: '#9F1239', name: 'Khu C · Ẩm thực' },
  'KHU-D': { bg: '#F0F9FF', border: '#0EA5E9', text: '#075985', name: 'Khu D · Bách hóa' },
  'KHU-E': { bg: '#F5F3FF', border: '#8B5CF6', text: '#5B21B6', name: 'Khu E · Vải sợi' }
};

// Khởi tạo mặt bằng quy hoạch chuẩn xác với 50 sạp thực tế
function createDefaultSpatialGrid(): GridCell[][] {
  const grid: GridCell[][] = [];
  for (let r = 0; r < GRID_ROWS; r++) {
    const row: GridCell[] = [];
    for (let c = 0; c < GRID_COLS; c++) {
      row.push({ x: c, y: r, type: 'empty' });
    }
    grid.push(row);
  }

  // 1. Cổng vào & Thoát hiểm
  grid[0][12] = { x: 12, y: 0, type: 'gate', facilityLabel: 'Cổng 1 (Phố Hàng Khoai)' };
  grid[0][13] = { x: 13, y: 0, type: 'gate', facilityLabel: 'Cổng 1 (Phố Hàng Khoai)' };
  grid[GRID_ROWS - 1][12] = { x: 12, y: GRID_ROWS - 1, type: 'gate', facilityLabel: 'Cổng 2 (Phố Cầu Đông)' };
  grid[GRID_ROWS - 1][13] = { x: 13, y: GRID_ROWS - 1, type: 'gate', facilityLabel: 'Cổng 2 (Phố Cầu Đông)' };
  grid[7][0] = { x: 0, y: 7, type: 'emergency_exit', facilityLabel: 'Cửa Thoát Hiểm Phía Tây' };
  grid[7][GRID_COLS - 1] = { x: GRID_COLS - 1, y: 7, type: 'emergency_exit', facilityLabel: 'Cửa Thoát Hiểm Phía Đông' };

  // 2. Đại lộ hành lang chính
  for (let r = 1; r < GRID_ROWS - 1; r++) {
    grid[r][12] = { x: 12, y: r, type: 'walkway' };
    grid[r][13] = { x: 13, y: r, type: 'walkway' };
  }
  for (let c = 1; c < GRID_COLS - 1; c++) {
    grid[4][c] = { x: c, y: 4, type: 'walkway' };
    grid[10][c] = { x: c, y: 10, type: 'walkway' };
  }
  // Hành lang nhánh
  for (let r = 1; r < 4; r++) {
    grid[r][6] = { x: 6, y: r, type: 'walkway' };
    grid[r][17] = { x: 17, y: r, type: 'walkway' };
  }
  for (let r = 11; r < 14; r++) {
    grid[r][6] = { x: 6, y: r, type: 'walkway' };
    grid[r][17] = { x: 17, y: r, type: 'walkway' };
  }

  // 3. Phân bổ 50 sạp thực tế từ CLIENT_STALLS
  // KHU A (Tây Bắc): A-01 -> A-10
  const zoneACoords = [
    { r: 2, c: 1 }, { r: 2, c: 2 }, { r: 2, c: 3 }, { r: 2, c: 4 }, { r: 2, c: 5 },
    { r: 3, c: 1 }, { r: 3, c: 2 }, { r: 3, c: 3 }, { r: 3, c: 4 }, { r: 3, c: 5 }
  ];
  zoneACoords.forEach((pos, idx) => {
    const code = `A-${(idx + 1).toString().padStart(2, '0')}`;
    grid[pos.r][pos.c] = { x: pos.c, y: pos.r, type: 'stall', stallCode: code };
  });

  // KHU B (Đông Bắc): B-01 -> B-10
  const zoneBCoords = [
    { r: 2, c: 18 }, { r: 2, c: 19 }, { r: 2, c: 20 }, { r: 2, c: 21 }, { r: 2, c: 22 },
    { r: 3, c: 18 }, { r: 3, c: 19 }, { r: 3, c: 20 }, { r: 3, c: 21 }, { r: 3, c: 22 }
  ];
  zoneBCoords.forEach((pos, idx) => {
    const code = `B-${(idx + 1).toString().padStart(2, '0')}`;
    grid[pos.r][pos.c] = { x: pos.c, y: pos.r, type: 'stall', stallCode: code };
  });

  // KHU C (Tây Nam): C-01 -> C-10
  const zoneCCoords = [
    { r: 12, c: 1 }, { r: 12, c: 2 }, { r: 12, c: 3 }, { r: 12, c: 4 }, { r: 12, c: 5 },
    { r: 13, c: 1 }, { r: 13, c: 2 }, { r: 13, c: 3 }, { r: 13, c: 4 }, { r: 13, c: 5 }
  ];
  zoneCCoords.forEach((pos, idx) => {
    const code = `C-${(idx + 1).toString().padStart(2, '0')}`;
    grid[pos.r][pos.c] = { x: pos.c, y: pos.r, type: 'stall', stallCode: code };
  });

  // KHU D (Trung tâm): D-01 -> D-10
  const zoneDCoords = [
    { r: 6, c: 3 }, { r: 6, c: 4 }, { r: 6, c: 5 }, { r: 6, c: 8 }, { r: 6, c: 9 },
    { r: 8, c: 3 }, { r: 8, c: 4 }, { r: 8, c: 5 }, { r: 8, c: 8 }, { r: 8, c: 9 }
  ];
  zoneDCoords.forEach((pos, idx) => {
    const code = `D-${(idx + 1).toString().padStart(2, '0')}`;
    grid[pos.r][pos.c] = { x: pos.c, y: pos.r, type: 'stall', stallCode: code };
  });

  // KHU E (Đông Nam): E-01 -> E-10
  const zoneECoords = [
    { r: 12, c: 18 }, { r: 12, c: 19 }, { r: 12, c: 20 }, { r: 12, c: 21 }, { r: 12, c: 22 },
    { r: 13, c: 18 }, { r: 13, c: 19 }, { r: 13, c: 20 }, { r: 13, c: 21 }, { r: 13, c: 22 }
  ];
  zoneECoords.forEach((pos, idx) => {
    const code = `E-${(idx + 1).toString().padStart(2, '0')}`;
    grid[pos.r][pos.c] = { x: pos.c, y: pos.r, type: 'stall', stallCode: code };
  });

  // 4. Bố trí hạ tầng PCCC & Cân đối chứng
  grid[1][7] = { x: 7, y: 1, type: 'fire_extinguisher', facilityLabel: 'Trụ PCCC Cụm Tây Bắc' };
  grid[1][16] = { x: 16, y: 1, type: 'fire_extinguisher', facilityLabel: 'Trụ PCCC Cụm Đông Bắc' };
  grid[11][7] = { x: 7, y: 11, type: 'fire_extinguisher', facilityLabel: 'Trụ PCCC Cụm Tây Nam' };
  grid[11][16] = { x: 16, y: 11, type: 'fire_extinguisher', facilityLabel: 'Trụ PCCC Cụm Đông Nam' };

  grid[7][11] = { x: 11, y: 7, type: 'scale', facilityLabel: 'Cân Đối Chứng Sảnh Trung Tâm' };
  grid[7][14] = { x: 14, y: 7, type: 'scale', facilityLabel: 'Cân Đối Chứng Sảnh Phía Đông' };

  return grid;
}

export interface MarketInteractiveMapViewProps {
  initialSelectedStallCode?: string;
  onOpenTraderProfile?: (traderId: string) => void;
  stalls?: any[];
  markets?: any[];
  selectedMarketId?: string;
  complaints?: any[];
  zones?: any[];
  products?: any[];
  applications?: any[];
  onApproveApplication?: (applicationId: string, stallId?: string) => Promise<any> | void;
  onResolveComplaint?: (codeOrId: string) => void;
  onQuickDispatch?: (stallId: string, teamName: string) => void;
}

export default function MarketInteractiveMapView({
  initialSelectedStallCode,
  onOpenTraderProfile,
  stalls,
  markets,
  selectedMarketId,
  complaints,
  zones,
  products,
  applications,
  onApproveApplication,
  onResolveComplaint,
  onQuickDispatch,
}: MarketInteractiveMapViewProps) {
  const activeMarket = useMemo(() => {
    if (selectedMarketId && selectedMarketId !== 'all') {
      const found = markets?.find((m) => m.id === selectedMarketId);
      if (found) return found;
    }
    return markets?.[0] || CLIENT_MARKETS[0];
  }, [markets, selectedMarketId]);

  const effectiveStalls = useMemo(() => {
    if (stalls && stalls.length > 0) {
      if (selectedMarketId && selectedMarketId !== 'all') {
        const filtered = stalls.filter((s) => s.marketId === selectedMarketId);
        if (filtered.length > 0) return filtered;
      }
      return stalls;
    }
    return CLIENT_STALLS;
  }, [stalls, selectedMarketId]);

  const effectiveComplaints = useMemo(() => {
    if (complaints && complaints.length > 0) {
      if (selectedMarketId && selectedMarketId !== 'all') {
        const filtered = complaints.filter((c) => c.marketId === selectedMarketId);
        if (filtered.length > 0) return filtered;
      }
      return complaints;
    }
    return CLIENT_COMPLAINTS;
  }, [complaints, selectedMarketId]);

  // Stalls Map Lookup Map: Code -> Stall Entity
  const stallsByCode = useMemo(() => {
    const map = new Map<string, any>();
    effectiveStalls.forEach((s) => map.set(s.code, s));
    return map;
  }, [effectiveStalls]);

  const [grid, setGrid] = useState<GridCell[][]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('smartmarket_master_floor_grid');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          console.error(e);
        }
      }
    }
    return createDefaultSpatialGrid();
  });

  const [dutyMode, setDutyMode] = useState<OperationalDutyMode>('leasing');
  const [currentTool, setCurrentTool] = useState<ToolType>('inspect');
  const [selectedZoneFilter, setSelectedZoneFilter] = useState<string>('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [assigningAppId, setAssigningAppId] = useState<string | null>(null);

  const [selectedStall, setSelectedStall] = useState<Stall | null>(() => {
    if (initialSelectedStallCode && stallsByCode.has(initialSelectedStallCode)) {
      return stallsByCode.get(initialSelectedStallCode) || null;
    }
    return null;
  });

  // Tự động đồng bộ và làm mới sạp đang chọn khi dữ liệu sạp toàn cục thay đổi
  useEffect(() => {
    if (initialSelectedStallCode && stallsByCode.has(initialSelectedStallCode)) {
      setSelectedStall(stallsByCode.get(initialSelectedStallCode) || null);
    } else if (selectedStall && stallsByCode.has(selectedStall.code)) {
      const freshStall = stallsByCode.get(selectedStall.code);
      if (freshStall && (freshStall.status !== selectedStall.status || freshStall.currentContract !== selectedStall.currentContract)) {
        setSelectedStall(freshStall);
      }
    }
  }, [initialSelectedStallCode, stallsByCode, selectedStall]);

  // Danh sách hồ sơ Zalo đang chờ phê duyệt
  const pendingApplications = useMemo(() => {
    if (!applications || applications.length === 0) return [];
    return applications.filter((app: any) => app.status === 'pending');
  }, [applications]);

  const [isSimulating, setIsSimulating] = useState(false);
  const [npcs, setNpcs] = useState<SimNpc[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isMouseDown, setIsMouseDown] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);

  // Hiển thị toast thông báo
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3500);
  };

  // Đồng bộ mã sạp thực tế lên lưới không gian khi danh sách sạp thay đổi
  useEffect(() => {
    if (stalls && stalls.length > 0) {
      setGrid((prevGrid) => {
        const next = prevGrid.map((row) => [...row]);
        let stallIdx = 0;
        for (let r = 0; r < next.length; r++) {
          for (let c = 0; c < next[r].length; c++) {
            if (next[r][c].type === 'stall') {
              if (stallIdx < effectiveStalls.length) {
                next[r][c] = {
                  ...next[r][c],
                  stallCode: effectiveStalls[stallIdx].code,
                };
                stallIdx++;
              }
            }
          }
        }
        return next;
      });
    }
  }, [effectiveStalls, stalls]);

  // Tính toán KPI thực tế từ effectiveStalls & grid
  const metrics = useMemo(() => {
    let occupied = 0;
    let vacant = 0;
    let maintenance = 0;
    let expiring = 0;
    let complaint = 0;
    let totalRentMonthly = 0;

    effectiveStalls.forEach((s: any) => {
      if (s.status === 'occupied') occupied++;
      if (s.status === 'vacant') vacant++;
      if (s.status === 'maintenance') maintenance++;
      if (s.displayStatus === 'expiring_soon') expiring++;
      if ((s.openComplaintCount ?? 0) > 0 || s.displayStatus === 'has_complaint') complaint++;
      if (s.currentContract?.fee) totalRentMonthly += s.currentContract.fee;
      else if (s.revenue30d) totalRentMonthly += s.revenue30d;
    });

    let fireCount = 0;
    let exitCount = 0;
    let walkwayCount = 0;

    grid.forEach((row) => {
      row.forEach((cell) => {
        if (cell.type === 'fire_extinguisher') fireCount++;
        if (cell.type === 'emergency_exit') exitCount++;
        if (cell.type === 'walkway') walkwayCount++;
      });
    });

    let safetyScore = 50 + fireCount * 10 + exitCount * 10;
    if (walkwayCount < 35) safetyScore -= 15;
    safetyScore = Math.max(0, Math.min(100, safetyScore));

    const totalStallsCount = effectiveStalls.length;
    const occupancyRate = totalStallsCount > 0 ? Math.round((occupied / totalStallsCount) * 100) : 0;

    return {
      totalStalls: totalStallsCount,
      occupied,
      vacant,
      maintenance,
      expiring,
      complaint,
      occupancyRate,
      totalRentMonthly,
      safetyScore,
      fireCount,
      exitCount,
      walkwayCount,
      simTraffic: isSimulating ? 120 + npcs.length * 15 : 0
    };
  }, [grid, isSimulating, npcs.length, effectiveStalls]);

  // Áp dụng công cụ lên ô lưới
  const handleCellClick = (r: number, c: number) => {
    const target = grid[r][c];

    if (currentTool === 'inspect') {
      if (target.type === 'stall' && target.stallCode) {
        const found = stallsByCode.get(target.stallCode);
        if (found) setSelectedStall(found);
      }
      return;
    }

    const nextGrid = grid.map((row) => [...row]);

    if (currentTool === 'eraser') {
      nextGrid[r][c] = { x: c, y: r, type: 'empty' };
      setGrid(nextGrid);
      return;
    }

    if (currentTool === 'walkway') {
      nextGrid[r][c] = { x: c, y: r, type: 'walkway' };
      setGrid(nextGrid);
      return;
    }

    if (currentTool === 'emergency_exit') {
      nextGrid[r][c] = { x: c, y: r, type: 'emergency_exit', facilityLabel: 'Lối Thoát Hiểm Khẩn Cấp' };
      setGrid(nextGrid);
      return;
    }

    if (currentTool === 'gate') {
      nextGrid[r][c] = { x: c, y: r, type: 'gate', facilityLabel: 'Cổng Đón Khách' };
      setGrid(nextGrid);
      return;
    }

    if (currentTool === 'fire_extinguisher') {
      nextGrid[r][c] = { x: c, y: r, type: 'fire_extinguisher', facilityLabel: 'Trụ Chữa Cháy PCCC' };
      setGrid(nextGrid);
      return;
    }

    if (currentTool === 'scale') {
      nextGrid[r][c] = { x: c, y: r, type: 'scale', facilityLabel: 'Cân Đối Chứng Minh Bạch' };
      setGrid(nextGrid);
      return;
    }
  };

  // Lưu sơ đồ mặt bằng
  const handleSaveGrid = () => {
    localStorage.setItem('smartmarket_master_floor_grid', JSON.stringify(grid));
    showToast('💾 Đã lưu sơ đồ mặt bằng vào bộ nhớ hệ thống!');
  };

  // Khôi phục mặt bằng chuẩn ban đầu
  const handleResetGrid = () => {
    if (window.confirm('Bạn có chắc muốn tải lại sơ đồ mặt bằng tiêu chuẩn Chợ Đồng Xuân?')) {
      const standard = createDefaultSpatialGrid();
      setGrid(standard);
      localStorage.removeItem('smartmarket_master_floor_grid');
      showToast('🔄 Đã khôi phục sơ đồ quy hoạch chuẩn!');
    }
  };

  // Phê duyệt và gán hồ sơ tiểu thương Zalo vào sạp đang chọn
  const handleApproveAndAssign = async (applicationId: string) => {
    if (!selectedStall) return;
    setAssigningAppId(applicationId);
    try {
      if (onApproveApplication) {
        await onApproveApplication(applicationId, selectedStall.id);
      }
      const app = applications?.find((a: any) => a.id === applicationId);
      const merchantName = app?.applicantName || 'Tiểu thương';
      showToast(`🎉 Đã duyệt hồ sơ của ${merchantName} và bố trí vào sạp ${selectedStall.code} thành công!`);
      setIsAssignModalOpen(false);
    } catch (err) {
      console.error(err);
      showToast('⚠️ Gặp sự cố khi phê duyệt và gán hồ sơ vào sạp');
    } finally {
      setAssigningAppId(null);
    }
  };

  // Xử lý phản ánh trực tiếp từ sơ đồ
  const handleResolveComplaintLocal = (complaintCodeOrId: string) => {
    if (onResolveComplaint) {
      onResolveComplaint(complaintCodeOrId);
      showToast(`✅ Đã giải quyết & đóng hồ sơ phản ánh [${complaintCodeOrId}]`);
    } else {
      showToast(`✅ Đã giải quyết phản ánh [${complaintCodeOrId}]`);
    }
  };

  // Điều động tổ trật tự hỗ trợ hiện trường
  const handleDispatchLocal = (stallId: string, teamName: string) => {
    if (onQuickDispatch) {
      onQuickDispatch(stallId, teamName);
    }
    showToast(`🚨 Đã điều động khẩn cấp ${teamName} tới xử lý hiện trường sạp!`);
  };

  // Vòng lặp mô phỏng luồng khách hàng ghé chợ thực tế
  useEffect(() => {
    if (!isSimulating) {
      setNpcs([]);
      return;
    }

    const gateCells: Array<{ x: number; y: number }> = [];
    const stallCells: Array<{ x: number; y: number; code: string }> = [];

    grid.forEach((row, r) => {
      row.forEach((cell, c) => {
        if (cell.type === 'gate') gateCells.push({ x: c, y: r });
        if (cell.type === 'stall' && cell.stallCode) stallCells.push({ x: c, y: r, code: cell.stallCode });
      });
    });

    const shopperColors = ['#10B981', '#3B82F6', '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4'];
    const sampleProductSayings = [
      '🛒 Mua Thịt bò Ba Vì (A-01)',
      '🦐 Hải sản tươi Cát Bà (A-02)',
      '🥬 Rau hữu cơ Đà Lạt (B-01)',
      '🍄 Nấm hương Sa Pa (B-03)',
      '🍜 Bún chả than hoa (C-01)',
      '🍲 Phở bò gia truyền (C-02)',
      '👗 Lụa tơ tằm Vạn Phúc (E-01)',
      '💳 Đã thanh toán quét QR',
      '⚖️ Cân đối chứng đúng 1.0kg!'
    ];

    const interval = setInterval(() => {
      setNpcs((prevNpcs) => {
        let updated = prevNpcs.map((npc) => {
          const neighbors = [
            { x: npc.x + 1, y: npc.y },
            { x: npc.x - 1, y: npc.y },
            { x: npc.x, y: npc.y + 1 },
            { x: npc.x, y: npc.y - 1 }
          ].filter(
            (pos) =>
              pos.x >= 0 &&
              pos.x < GRID_COLS &&
              pos.y >= 0 &&
              pos.y < GRID_ROWS &&
              (grid[pos.y][pos.x].type === 'walkway' ||
                grid[pos.y][pos.x].type === 'gate' ||
                grid[pos.y][pos.x].type === 'emergency_exit')
          );

          if (neighbors.length === 0) return npc;
          const nextPos = neighbors[Math.floor(Math.random() * neighbors.length)];

          let bubble = npc.speechBubble;
          if (Math.random() > 0.65) {
            bubble = sampleProductSayings[Math.floor(Math.random() * sampleProductSayings.length)];
          } else if (Math.random() > 0.85) {
            bubble = undefined;
          }

          return {
            ...npc,
            x: nextPos.x,
            y: nextPos.y,
            speechBubble: bubble,
            stepsRemaining: npc.stepsRemaining - 1
          };
        });

        updated = updated.filter((npc) => npc.stepsRemaining > 0);

        if (updated.length < 15 && gateCells.length > 0 && Math.random() > 0.3) {
          const spawn = gateCells[Math.floor(Math.random() * gateCells.length)];
          updated.push({
            id: `npc-${Date.now()}-${Math.random()}`,
            x: spawn.x,
            y: spawn.y,
            color: shopperColors[Math.floor(Math.random() * shopperColors.length)],
            stepsRemaining: 22 + Math.floor(Math.random() * 20),
            speechBubble: '👋 Vào mua sắm'
          });
        }

        return updated;
      });
    }, 650);

    return () => clearInterval(interval);
  }, [isSimulating, grid]);

  // Các sản phẩm của sạp đang chọn
  const selectedStallProducts = useMemo(() => {
    if (!selectedStall) return [];
    const sourceProducts = products && products.length > 0 ? products : CLIENT_PRODUCTS;
    return sourceProducts.filter((p: any) => p.stallId === selectedStall.id || p.stalls?.code === selectedStall.code);
  }, [selectedStall, products]);

  // Phản ánh của sạp đang chọn
  const selectedStallComplaints = useMemo(() => {
    if (!selectedStall) return [];
    return effectiveComplaints.filter((c: any) => c.stallId === selectedStall.id || c.stalls?.code === selectedStall.code);
  }, [selectedStall, effectiveComplaints]);

  return (
    <div className="w-full flex-1 flex flex-col bg-slate-50 text-slate-800 font-sans select-none overflow-hidden h-full min-h-0 rounded-2xl border border-slate-200 shadow-xl">
      
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-slate-900 border-2 border-emerald-500 text-white px-4 py-2.5 rounded-2xl shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-top-4 duration-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs font-bold">{toastMessage}</span>
        </div>
      )}

      {/* 1. TOP HEADER & HUD VẬN HÀNH THỰC TẾ */}
      <div className="bg-white border-b border-slate-200 px-4 py-3 flex flex-wrap items-center justify-between gap-3 shrink-0 shadow-xs">
        
        {/* Title & Market Info */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#0B7A3A] to-[#10B981] flex items-center justify-center text-white shadow-md shadow-emerald-700/20">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-black text-slate-900 tracking-wide">
                SƠ ĐỒ ĐIỀU HÀNH & QUY HOẠCH MẶT BẰNG
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-50 border border-emerald-300 text-[#0B7A3A] uppercase font-mono">
                {activeMarket?.name ? activeMarket.name.toUpperCase() : 'CHỢ ĐỒNG XUÂN'}
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              Mặt bằng số hoá thời gian thực · {effectiveStalls.length} sạp hàng · {activeMarket?.name || 'Phân khu thương mại'}
            </p>
          </div>
        </div>

        {/* Real-time KPI Pills from Overview */}
        <div className="flex items-center gap-2 sm:gap-3 overflow-x-auto py-1">
          
          {/* Occupancy Rate */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 flex items-center gap-2 shadow-xs">
            <Store className="w-4 h-4 text-[#0B7A3A]" />
            <div>
              <div className="text-[10px] text-slate-500 font-bold uppercase">Lấp đầy</div>
              <div className="text-xs sm:text-sm font-extrabold text-slate-900">
                {metrics.occupied}/{metrics.totalStalls} ({metrics.occupancyRate}%)
              </div>
            </div>
          </div>

          {/* Monthly Rent Revenue */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 flex items-center gap-2 shadow-xs">
            <DollarSign className="w-4 h-4 text-amber-500" />
            <div>
              <div className="text-[10px] text-slate-500 font-bold uppercase">Doanh thu thuê</div>
              <div className="text-xs sm:text-sm font-extrabold text-amber-700 font-mono">
                {(metrics.totalRentMonthly / 1000000).toFixed(1)} tr/tháng
              </div>
            </div>
          </div>

          {/* Complaints Hotspots */}
          <div className={`border rounded-xl px-3 py-1.5 flex items-center gap-2 shadow-xs ${
            metrics.complaint > 0 ? 'bg-red-50 border-red-200' : 'bg-slate-50 border-slate-200'
          }`}>
            <AlertTriangle className={`w-4 h-4 ${metrics.complaint > 0 ? 'text-red-500 animate-pulse' : 'text-slate-400'}`} />
            <div>
              <div className="text-[10px] text-slate-500 font-bold uppercase">Phản ánh PAKN</div>
              <div className={`text-xs sm:text-sm font-extrabold ${metrics.complaint > 0 ? 'text-red-600' : 'text-slate-900'}`}>
                {metrics.complaint} điểm nóng
              </div>
            </div>
          </div>

          {/* Fire Safety Standard */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 flex items-center gap-2 shadow-xs">
            <Flame className="w-4 h-4 text-teal-600" />
            <div>
              <div className="text-[10px] text-slate-500 font-bold uppercase">Chuẩn PCCC</div>
              <div className="text-xs sm:text-sm font-extrabold text-teal-700 font-mono">
                {metrics.safetyScore}/100
              </div>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Simulate Traffic Toggle */}
          <button
            type="button"
            onClick={() => setIsSimulating(!isSimulating)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-black shadow-md transition-all cursor-pointer ${
              isSimulating
                ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/30'
                : 'bg-[#0B7A3A] hover:bg-emerald-600 text-white shadow-emerald-700/30'
            }`}
          >
            {isSimulating ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
            <span className="hidden sm:inline">{isSimulating ? 'DỪNG MÔ PHỎNG' : 'MÔ PHỎNG LUỒNG KHÁCH'}</span>
          </button>

          {/* Save Layout */}
          <button
            type="button"
            onClick={handleSaveGrid}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-600 hover:text-slate-900 transition-colors cursor-pointer shadow-xs"
            title="Lưu cấu hình sơ đồ"
          >
            <Save className="w-4 h-4" />
          </button>

          {/* Reset Template */}
          <button
            type="button"
            onClick={handleResetGrid}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-600 hover:text-slate-900 transition-colors cursor-pointer shadow-xs"
            title="Khôi phục mặt bằng gốc"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. OPERATIONAL MULTI-WORKFLOW DUTY SELECTOR */}
      <div className="bg-slate-900 text-white px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
            <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span className="hidden sm:inline">Chế độ tác chiến:</span>
          </span>
          <div className="inline-flex rounded-xl p-1 bg-slate-800/90 border border-slate-700/80 gap-1 overflow-x-auto max-w-full">
            <button
              type="button"
              onClick={() => setDutyMode('leasing')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                dutyMode === 'leasing'
                  ? 'bg-[#0B7A3A] text-white shadow-sm font-black ring-1 ring-emerald-400'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Quy hoạch & Thuê sạp</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono font-bold ${
                dutyMode === 'leasing' ? 'bg-emerald-950 text-emerald-300' : 'bg-slate-700 text-slate-300'
              }`}>
                {metrics.vacant} trống
              </span>
            </button>

            <button
              type="button"
              onClick={() => setDutyMode('incidents')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                dutyMode === 'incidents'
                  ? 'bg-rose-600 text-white shadow-sm font-black ring-1 ring-rose-400'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Hiện trường & PAKN</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono font-bold ${
                metrics.complaint > 0
                  ? 'bg-red-950 text-red-300 animate-pulse'
                  : 'bg-slate-700 text-slate-300'
              }`}>
                {metrics.complaint} điểm
              </span>
            </button>

            <button
              type="button"
              onClick={() => setDutyMode('commerce')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                dutyMode === 'commerce'
                  ? 'bg-amber-600 text-white shadow-sm font-black ring-1 ring-amber-400'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
              }`}
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Ngành hàng & Hàng QR</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono font-bold ${
                dutyMode === 'commerce' ? 'bg-amber-950 text-amber-200' : 'bg-slate-700 text-slate-300'
              }`}>
                {products?.length || CLIENT_PRODUCTS.length} SP
              </span>
            </button>

            <button
              type="button"
              onClick={() => setDutyMode('safety')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                dutyMode === 'safety'
                  ? 'bg-teal-600 text-white shadow-sm font-black ring-1 ring-teal-400'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>PCCC & Cân đối chứng</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono font-bold ${
                dutyMode === 'safety' ? 'bg-teal-950 text-teal-200' : 'bg-slate-700 text-slate-300'
              }`}>
                {metrics.safetyScore}/100
              </span>
            </button>
          </div>
        </div>

        {/* Duty Mode Context Helper */}
        <div className="text-[11px] text-slate-400 hidden xl:flex items-center gap-1.5 font-medium">
          {dutyMode === 'leasing' && (
            <span>🏢 Sạp trống viền nét đứt màu ngọc. Click vào sạp trống để mở hồ sơ Zalo và gán tiểu thương.</span>
          )}
          {dutyMode === 'incidents' && (
            <span className="text-rose-300">🚨 Đang theo dõi các sạp phát sinh phản ánh người tiêu dùng để điều động trật tự.</span>
          )}
          {dutyMode === 'commerce' && (
            <span className="text-amber-300">🛒 Hiển thị phân loại mặt hàng, tem QR truy xuất và phân khu nông sản OCOP.</span>
          )}
          {dutyMode === 'safety' && (
            <span className="text-teal-300">🧯 Làm nổi bật trụ cứu hỏa PCCC, lối thoát hiểm và cụm cân đối chứng minh bạch.</span>
          )}
        </div>
      </div>

      {/* 3. SECONDARY FILTER & TOOL STRIP */}
      <div className="bg-slate-100/90 border-b border-slate-200 px-4 py-2 flex flex-wrap items-center justify-between gap-2 shrink-0">
        
        {/* Zone Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
          <span className="text-[11px] font-bold text-slate-600 mr-1 flex items-center gap-1">
            <Filter className="w-3 h-3 text-slate-500" />
            <span>Phân khu:</span>
          </span>
          <button
            type="button"
            onClick={() => setSelectedZoneFilter('all')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              selectedZoneFilter === 'all'
                ? 'bg-white text-slate-900 border border-slate-300 shadow-xs'
                : 'bg-slate-200/80 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Tất cả (50)
          </button>
          {CLIENT_ZONES.map((z) => (
            <button
              key={z.code}
              type="button"
              onClick={() => setSelectedZoneFilter(z.code)}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                selectedZoneFilter === z.code
                  ? 'bg-[#0B7A3A] text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              {z.code}
            </button>
          ))}
        </div>

        {/* Quick Search */}
        <div className="relative min-w-[200px]">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm mã sạp (A-01), tiểu thương..."
            className="w-full bg-white border border-slate-200 rounded-lg pl-8 pr-3 py-1 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#0B7A3A] focus:ring-1 focus:ring-[#0B7A3A] shadow-xs"
          />
        </div>
      </div>

      {/* 3. MAIN WORKSPACE: TOOLBAR + BLUEPRINT CANVAS + DETAIL DRAWER */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
        
        {/* Left Side: Spatial Layout Toolbox */}
        <aside className="w-full md:w-56 bg-white border-r border-slate-200 p-3 flex flex-col gap-3 overflow-y-auto shrink-0 shadow-xs">
          <div className="text-[10px] font-black text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
            <Wrench className="w-3.5 h-3.5 text-amber-500" />
            <span>Công Cụ Mặt Bằng</span>
          </div>

          {/* Inspection Mode */}
          <button
            type="button"
            onClick={() => setCurrentTool('inspect')}
            className={`flex items-center gap-2 p-2 rounded-xl text-xs font-bold transition-all border text-left cursor-pointer ${
              currentTool === 'inspect'
                ? 'bg-emerald-50 border-emerald-400 text-[#065F46] shadow-xs'
                : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
            }`}
          >
            <Eye className="w-4 h-4 text-[#0B7A3A]" />
            <span>Tra Cứu & Tác Chiến</span>
          </button>

          {/* Infrastructure Tools */}
          <div className="space-y-1 pt-1">
            <div className="text-[10px] font-black text-slate-500 uppercase tracking-wider">
              🚶 Giao Thông & An Toàn
            </div>

            <button
              type="button"
              onClick={() => setCurrentTool('walkway')}
              className={`w-full flex items-center gap-2 p-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                currentTool === 'walkway'
                  ? 'bg-slate-800 text-white border-slate-800 shadow-md'
                  : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <Footprints className="w-4 h-4 text-slate-500" />
              <span>Hành Lang Đi Bộ</span>
            </button>

            <button
              type="button"
              onClick={() => setCurrentTool('emergency_exit')}
              className={`w-full flex items-center gap-2 p-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                currentTool === 'emergency_exit'
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-md'
                  : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <DoorOpen className="w-4 h-4 text-emerald-600" />
              <span>Lối Thoát Hiểm</span>
            </button>

            <button
              type="button"
              onClick={() => setCurrentTool('fire_extinguisher')}
              className={`w-full flex items-center gap-2 p-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                currentTool === 'fire_extinguisher'
                  ? 'bg-red-600 text-white border-red-600 shadow-md'
                  : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <Flame className="w-4 h-4 text-red-500" />
              <span>Trụ Cứu Hỏa PCCC</span>
            </button>

            <button
              type="button"
              onClick={() => setCurrentTool('scale')}
              className={`w-full flex items-center gap-2 p-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                currentTool === 'scale'
                  ? 'bg-teal-600 text-white border-teal-600 shadow-md'
                  : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <Scale className="w-4 h-4 text-teal-600" />
              <span>Cân Đối Chứng</span>
            </button>

            <button
              type="button"
              onClick={() => setCurrentTool('eraser')}
              className={`w-full flex items-center gap-2 p-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                currentTool === 'eraser'
                  ? 'bg-rose-50 border-rose-400 text-rose-700 shadow-xs'
                  : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <Trash2 className="w-4 h-4 text-rose-500" />
              <span>Thu Hồi / Xóa Ô</span>
            </button>
          </div>

          {/* Zones Color Guide */}
          <div className="mt-auto pt-3 border-t border-slate-200 space-y-1.5 text-[10px]">
            <div className="font-bold text-slate-500 uppercase">Chú Giải Màu Phân Khu</div>
            {Object.entries(ZONE_COLORS).map(([code, z]) => (
              <div key={code} className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-md shrink-0 border" style={{ backgroundColor: z.bg, borderColor: z.border }} />
                <span className="text-slate-700 font-semibold truncate">{z.name}</span>
              </div>
            ))}
          </div>
        </aside>

        {/* Center: Interactive Blueprint Canvas */}
        <main
          className="flex-1 overflow-auto p-4 sm:p-6 flex items-center justify-center bg-slate-100/80 relative"
          ref={canvasRef}
          onMouseUp={() => setIsMouseDown(false)}
          onMouseLeave={() => setIsMouseDown(false)}
        >
          {/* Sơ đồ mặt bằng Grid Canvas */}
          <div
            className="relative select-none"
            style={{
              width: GRID_COLS * CELL_SIZE + (GRID_COLS - 1) * 3,
              height: GRID_ROWS * CELL_SIZE + (GRID_ROWS - 1) * 3
            }}
          >
            {/* Grid Cells */}
            <div
              className="grid gap-[3px] relative"
              style={{
                gridTemplateColumns: `repeat(${GRID_COLS}, ${CELL_SIZE}px)`,
                gridTemplateRows: `repeat(${GRID_ROWS}, ${CELL_SIZE}px)`
              }}
            >
              {grid.map((row, r) =>
                row.map((cell, c) => {
                  const stall = cell.stallCode ? stallsByCode.get(cell.stallCode) : null;
                  const isSelected = Boolean(selectedStall && cell.stallCode && selectedStall.code === cell.stallCode);

                  // Kiểm tra bộ lọc phân khu
                  const zoneMatch = selectedZoneFilter === 'all' || (stall?.zones?.code === selectedZoneFilter);

                  // Kiểm tra tìm kiếm
                  const searchMatch = !searchQuery || (
                    (stall?.code || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                    (stall?.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                    (stall?.currentContract?.merchant.fullName || '').toLowerCase().includes(searchQuery.toLowerCase())
                  );

                  // Kiểm tra độ mờ theo chế độ tác chiến nghiệp vụ
                  let isDutyDimmed = false;
                  if (dutyMode === 'incidents' && cell.type === 'stall') {
                    isDutyDimmed = (stall?.openComplaintCount ?? 0) === 0 && !isSelected;
                  } else if (dutyMode === 'safety' && cell.type === 'stall') {
                    isDutyDimmed = !isSelected;
                  }

                  const isDimmed = !zoneMatch || !searchMatch || isDutyDimmed;

                  // Màu phân khu
                  const zoneColor = stall?.zones?.code ? ZONE_COLORS[stall.zones.code] : null;

                  // Số sản phẩm của sạp
                  const stallProductCount = cell.stallCode && products
                    ? products.filter((p: any) => p.stallId === stall?.id || p.stalls?.code === cell.stallCode).length
                    : 0;

                  return (
                    <div
                      key={`${r}-${c}`}
                      onMouseDown={() => {
                        setIsMouseDown(true);
                        handleCellClick(r, c);
                      }}
                      onMouseEnter={() => {
                        if (isMouseDown && currentTool !== 'inspect') {
                          handleCellClick(r, c);
                        }
                      }}
                      className={`relative flex flex-col items-center justify-center rounded-xl cursor-pointer transition-all duration-200 ${
                        isSelected
                          ? 'ring-4 ring-[#0B7A3A] ring-offset-2 ring-offset-white z-30 scale-110 shadow-2xl'
                          : ''
                      } ${
                        dutyMode === 'safety' && (cell.type === 'fire_extinguisher' || cell.type === 'emergency_exit' || cell.type === 'scale')
                          ? 'ring-2 ring-teal-400 scale-105 z-10 shadow-md'
                          : ''
                      } ${isDimmed ? 'opacity-30 grayscale-[40%]' : 'opacity-100 hover:scale-105 shadow-xs'}`}
                      style={{
                        width: CELL_SIZE,
                        height: CELL_SIZE,
                        backgroundColor:
                          cell.type === 'stall' && stall
                            ? stall.status === 'vacant'
                              ? dutyMode === 'leasing' ? '#ECFDF5' : '#FFFFFF'
                              : stall.status === 'maintenance'
                              ? '#F1F5F9'
                              : (stall.openComplaintCount ?? 0) > 0
                              ? '#FEE2E2'
                              : zoneColor?.bg || '#FFFFFF'
                            : cell.type === 'walkway'
                            ? '#F8FAFC'
                            : cell.type === 'gate'
                            ? '#D97706'
                            : cell.type === 'emergency_exit'
                            ? '#059669'
                            : cell.type === 'fire_extinguisher'
                            ? '#DC2626'
                            : cell.type === 'scale'
                            ? '#0D9488'
                            : '#F8FAFC40',
                        border:
                          cell.type === 'stall' && stall
                            ? stall.status === 'vacant'
                              ? dutyMode === 'leasing'
                                ? '2px dashed #059669'
                                : '1.5px dashed #CBD5E1'
                              : (stall.openComplaintCount ?? 0) > 0
                              ? '2.5px solid #EF4444'
                              : stall.displayStatus === 'expiring_soon'
                              ? '2px solid #F59E0B'
                              : `1.5px solid ${zoneColor?.border || '#10B981'}`
                            : cell.type === 'walkway'
                            ? '1px solid #E2E8F0'
                            : cell.type === 'empty'
                            ? '1px dashed #E2E8F0'
                            : '1px solid rgba(0,0,0,0.08)'
                      }}
                      title={
                        cell.type === 'stall' && stall
                          ? `[${stall.code}] ${stall.name} - ${stall.currentContract?.merchant.fullName || 'Sạp trống'}`
                          : cell.type === 'walkway'
                          ? 'Hành lang đi bộ'
                          : cell.type === 'gate'
                          ? cell.facilityLabel
                          : cell.type === 'fire_extinguisher'
                          ? 'Trụ cứu hỏa PCCC'
                          : cell.type === 'scale'
                          ? 'Cân đối chứng'
                          : undefined
                      }
                    >
                      {/* Stall Node Graphic */}
                      {cell.type === 'stall' && stall && (
                        <div className="text-center w-full px-0.5 pointer-events-none">
                          <div
                            className="text-[10px] font-black font-mono leading-tight truncate"
                            style={{
                              color:
                                (stall.openComplaintCount ?? 0) > 0
                                  ? '#DC2626'
                                  : stall.status === 'vacant' && dutyMode === 'leasing'
                                  ? '#065F46'
                                  : zoneColor?.text || '#0F172A'
                            }}
                          >
                            {stall.code}
                          </div>
                          
                          {/* Label / Subtitle */}
                          <div className="text-[7.5px] font-bold text-slate-600 leading-tight truncate">
                            {stall.status === 'vacant' ? (
                              <span className={dutyMode === 'leasing' ? 'text-[#059669] font-black' : 'text-slate-500'}>
                                TRỐNG
                              </span>
                            ) : stall.status === 'maintenance' ? (
                              'BẢO TRÌ'
                            ) : dutyMode === 'commerce' && stallProductCount > 0 ? (
                              <span className="text-amber-700 font-bold">{stallProductCount} SP QR</span>
                            ) : (
                              stall.currentContract?.merchant.fullName.split(' ').pop()
                            )}
                          </div>

                          {/* Radar Ping for Complaint */}
                          {(stall.openComplaintCount ?? 0) > 0 && (
                            <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-85"></span>
                              <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-red-600 border-2 border-white shadow-xs"></span>
                            </span>
                          )}

                          {/* Expiring Soon Indicator */}
                          {stall.displayStatus === 'expiring_soon' && (
                            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5 rounded-full bg-amber-400 border-2 border-white shadow-xs" />
                          )}

                          {/* Vacant Badge in Leasing Mode */}
                          {dutyMode === 'leasing' && stall.status === 'vacant' && (
                            <span className="absolute -bottom-1 -right-1 flex h-2.5 w-2.5 rounded-full bg-emerald-500 border border-white shadow-xs" />
                          )}
                        </div>
                      )}

                      {/* Walkway Pavement Texture */}
                      {cell.type === 'walkway' && (
                        <div className="w-1.5 h-1.5 rounded-full bg-slate-300 pointer-events-none" />
                      )}

                      {/* Gate */}
                      {cell.type === 'gate' && (
                        <div className="text-center pointer-events-none">
                          <DoorOpen className="w-4 h-4 text-white mx-auto" />
                          <span className="text-[7px] font-black text-white uppercase tracking-tighter">CỔNG</span>
                        </div>
                      )}

                      {/* Emergency Exit */}
                      {cell.type === 'emergency_exit' && (
                        <div className="text-center pointer-events-none">
                          <DoorOpen className="w-4 h-4 text-white mx-auto" />
                          <span className="text-[7px] font-black text-white uppercase tracking-tighter">THOÁT</span>
                        </div>
                      )}

                      {/* Fire Extinguisher */}
                      {cell.type === 'fire_extinguisher' && (
                        <Flame className="w-5 h-5 text-white pointer-events-none animate-pulse" />
                      )}

                      {/* Scale */}
                      {cell.type === 'scale' && (
                        <Scale className="w-5 h-5 text-white pointer-events-none" />
                      )}
                    </div>
                  );
                })
              )}

              {/* NPC Shoppers Walking on Corridors */}
              {npcs.map((npc) => (
                <div
                  key={npc.id}
                  className="absolute z-30 transition-all duration-500 ease-out pointer-events-none flex flex-col items-center justify-center"
                  style={{
                    left: npc.x * (CELL_SIZE + 3),
                    top: npc.y * (CELL_SIZE + 3),
                    width: CELL_SIZE,
                    height: CELL_SIZE
                  }}
                >
                  {/* Real Product Speech Bubble */}
                  {npc.speechBubble && (
                    <div className="absolute -top-7 whitespace-nowrap bg-white text-slate-900 px-2 py-0.5 rounded-full text-[9px] font-black shadow-2xl border border-slate-200 animate-in fade-in zoom-in-75 duration-200">
                      {npc.speechBubble}
                    </div>
                  )}

                  {/* Customer Dot */}
                  <div
                    className="w-5 h-5 rounded-full shadow-lg border-2 border-white flex items-center justify-center text-[10px] text-white font-bold"
                    style={{ backgroundColor: npc.color }}
                  >
                    🚶
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>

        {/* Right Side: Stall Tactical Drawer */}
        {selectedStall && (
          <aside className="w-full md:w-80 bg-white border-l border-slate-200 p-4 flex flex-col gap-4 overflow-y-auto shrink-0 animate-in slide-in-from-right-4 duration-200 shadow-xl">
            {/* Drawer Header */}
            <div className="flex items-start justify-between pb-3 border-b border-slate-200">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-lg text-xs font-mono font-black bg-emerald-100 text-[#065F46] border border-emerald-300">
                    {selectedStall.code}
                  </span>
                  <span className="text-xs font-bold text-slate-500">
                    {selectedStall.zones?.name}
                  </span>
                </div>
                <h3 className="text-sm font-black text-slate-900 mt-1 leading-tight">
                  {selectedStall.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedStall(null)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Merchant Card */}
            {selectedStall.currentContract?.merchant ? (
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Tiểu thương phụ trách</span>
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-emerald-50 text-[#0B7A3A] border border-emerald-300">
                    ĐANG KINH DOANH
                  </span>
                </div>
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-[#0B7A3A] text-white font-black text-sm flex items-center justify-center border-2 border-emerald-300 shadow-xs">
                    {selectedStall.currentContract.merchant.fullName.charAt(0)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-slate-900 truncate">
                      {selectedStall.currentContract.merchant.fullName}
                    </p>
                    <p className="text-[11px] text-slate-600 flex items-center gap-1">
                      <Phone className="w-3 h-3 text-[#0B7A3A]" />
                      <span>{selectedStall.currentContract.merchant.phone}</span>
                    </p>
                  </div>
                </div>

                {/* Trader Profile Link */}
                {onOpenTraderProfile && (
                  <button
                    type="button"
                    onClick={() => {
                      if (selectedStall.currentContract?.merchant?.id) {
                        onOpenTraderProfile(selectedStall.currentContract.merchant.id);
                      } else {
                        onOpenTraderProfile('trader-001');
                      }
                    }}
                    className="w-full mt-1 py-1.5 px-2.5 rounded-lg bg-white hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 text-xs font-bold text-slate-700 hover:text-[#0B7A3A] transition-all flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <span>Xem Hồ Sơ Số Hóa Tiểu Thương</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                )}
              </div>
            ) : (
              <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200 space-y-2.5 text-center">
                <div>
                  <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-[#065F46] uppercase tracking-wider mb-1">
                    SẠP ĐANG TRỐNG
                  </span>
                  <p className="text-xs text-slate-600 font-medium">
                    Sẵn sàng tiếp nhận & mở phê duyệt hồ sơ từ Zalo Mini App
                  </p>
                </div>

                {/* Action CTA: Assign Merchant */}
                <button
                  type="button"
                  onClick={() => setIsAssignModalOpen(true)}
                  className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-[#0B7A3A] to-emerald-600 hover:from-emerald-700 hover:to-emerald-800 text-white text-xs font-black transition-all shadow-md shadow-emerald-700/20 flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                >
                  <Users className="w-4 h-4" />
                  <span>Gán hồ sơ tiểu thương Zalo ({pendingApplications.length})</span>
                </button>
              </div>
            )}

            {/* Contract & Lease Specs */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                <div className="text-[10px] text-slate-500 uppercase font-bold">Diện tích sạp</div>
                <div className="text-sm font-extrabold text-slate-900 mt-0.5 font-mono">
                  {selectedStall.acreage} m²
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                <div className="text-[10px] text-slate-500 uppercase font-bold">Giá thuê tháng</div>
                <div className="text-sm font-extrabold text-amber-700 mt-0.5 font-mono">
                  {selectedStall.currentContract
                    ? `${(selectedStall.currentContract.fee / 1000000).toFixed(1)} tr`
                    : 'Chưa niêm yết'}
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                <div className="text-[10px] text-slate-500 uppercase font-bold">Doanh thu 30 ngày</div>
                <div className="text-sm font-extrabold text-[#0B7A3A] mt-0.5 font-mono">
                  {selectedStall.revenue30d
                    ? `${(selectedStall.revenue30d / 1000000).toFixed(0)} tr`
                    : '0 tr'}
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                <div className="text-[10px] text-slate-500 uppercase font-bold">Thời hạn hợp đồng</div>
                <div className="text-sm font-extrabold text-slate-700 mt-0.5 font-mono">
                  {selectedStall.currentContract
                    ? `Còn ${selectedStall.currentContract.daysLeft} ngày`
                    : 'Chưa ký'}
                </div>
              </div>
            </div>

            {/* Complaint Warning Box (nếu có) */}
            {selectedStallComplaints.length > 0 && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 space-y-2.5">
                <div className="flex items-center justify-between text-red-700 font-bold text-xs">
                  <div className="flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 shrink-0 animate-bounce" />
                    <span>Cảnh báo PAKN đang xử lý ({selectedStallComplaints.length})</span>
                  </div>
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-red-100 text-red-800">
                    KHẨN CẤP
                  </span>
                </div>

                {selectedStallComplaints.map((c) => (
                  <div key={c.id} className="text-[11px] text-red-900 leading-relaxed bg-white p-2.5 rounded-lg border border-red-200 space-y-1.5 shadow-xs">
                    <p className="font-bold text-red-950">{c.content}</p>
                    <div className="flex items-center justify-between text-[10px] text-red-600">
                      <span>Người báo cáo: {c.reporter?.fullName || 'Khách hàng'}</span>
                      <span className="font-mono">{c.code || c.id}</span>
                    </div>

                    {/* Quick Resolve Button */}
                    <button
                      type="button"
                      onClick={() => handleResolveComplaintLocal(c.code || c.id)}
                      className="w-full mt-1 py-1 px-2 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-black transition-colors flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Đóng & Giải Quyết Phản Ánh</span>
                    </button>
                  </div>
                ))}

                {/* Dispatch Security Patrol Team */}
                <button
                  type="button"
                  onClick={() => handleDispatchLocal(selectedStall.id, 'Tổ Trật tự Hiện trường')}
                  className="w-full py-1.5 px-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-black transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>Điều Động Tổ Trật Tự Hiện Trường</span>
                </button>
              </div>
            )}

            {/* Products List with QR */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-600">
                <span>SẢN PHẨM QR ĐANG BÁN ({selectedStallProducts.length})</span>
              </div>
              {selectedStallProducts.length > 0 ? (
                <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                  {selectedStallProducts.map((prod) => (
                    <div
                      key={prod.id}
                      className="p-2 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs"
                    >
                      <div className="min-w-0 flex-1 pr-2">
                        <p className="font-bold text-slate-900 truncate">{prod.name}</p>
                        <p className="text-[10px] text-slate-500 font-mono">
                          {prod.price.toLocaleString('vi-VN')} đ/{prod.unit}
                        </p>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[9px] font-mono bg-emerald-50 text-[#0B7A3A] border border-emerald-300 flex items-center gap-1">
                        <QrCode className="w-3 h-3" />
                        <span>QR</span>
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-[11px] text-slate-400 italic p-2 bg-slate-50 rounded-lg text-center border border-slate-100">
                  Chưa có sản phẩm liên kết mã QR
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="mt-auto space-y-1.5 pt-2">
              <button
                type="button"
                onClick={() => {
                  showToast(`📢 Đã gửi thông báo nhắc hạn hợp đồng tới chủ sạp ${selectedStall.code}`);
                }}
                className="w-full py-2 rounded-xl bg-[#0B7A3A] hover:bg-emerald-700 text-white text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
              >
                <span>Gửi Thông Báo Gia Hạn</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  showToast(`💰 Đã ghi nhận thu phí dịch vụ sạp ${selectedStall.code} thành công`);
                }}
                className="w-full py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
              >
                <span>Thu Phí Dịch Vụ Tháng</span>
              </button>
            </div>
          </aside>
        )}
      </div>

      {/* MODAL: GÁN HỒ SƠ TIỂU THƯƠNG ZALO VÀO SẠP */}
      {isAssignModalOpen && selectedStall && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-xl w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-emerald-800 to-[#0B7A3A] text-white p-4 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-white border border-white/20">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-black tracking-wide">
                    GÁN HỒ SƠ TIỂU THƯƠNG VÀO SẠP {selectedStall.code}
                  </h3>
                  <p className="text-[11px] text-emerald-100 font-medium">
                    {selectedStall.zones?.name || 'Phân khu chợ'} · Diện tích: {selectedStall.acreage} m² · Hồ sơ Zalo chờ duyệt ({pendingApplications.length})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAssignModalOpen(false)}
                className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 overflow-y-auto space-y-3 flex-1">
              <div className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-200 flex items-center justify-between">
                <span>Chọn một hồ sơ đăng ký kinh doanh dưới đây để phê duyệt và bàn giao sạp:</span>
                <span className="font-bold text-[#0B7A3A]">{pendingApplications.length} hồ sơ</span>
              </div>

              {pendingApplications.length > 0 ? (
                <div className="space-y-2.5">
                  {pendingApplications.map((app: any) => (
                    <div
                      key={app.id}
                      className="p-3.5 rounded-xl border border-slate-200 hover:border-emerald-400 bg-white hover:bg-emerald-50/30 transition-all shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-emerald-100 text-[#065F46] font-black text-sm flex items-center justify-center shrink-0 border border-emerald-200">
                          {app.applicantName ? app.applicantName.charAt(0) : 'T'}
                        </div>
                        <div className="min-w-0 space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-black text-slate-900 truncate">
                              {app.applicantName}
                            </span>
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 font-mono">
                              {app.applicationCode || app.id}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-600 flex items-center gap-1">
                            <Phone className="w-3 h-3 text-[#0B7A3A]" />
                            <span>{app.phone}</span>
                            <span className="mx-1 text-slate-300">·</span>
                            <span>{app.productCategory || 'Nông sản thực phẩm'}</span>
                          </p>
                          <p className="text-[10px] text-slate-500 truncate">
                            Kinh nghiệm: {app.experienceYears ?? 5} năm · Nguyện vọng sạp: {app.preferredStallCode || 'Bất kỳ'}
                          </p>
                        </div>
                      </div>

                      {/* Action Button */}
                      <button
                        type="button"
                        disabled={assigningAppId === app.id}
                        onClick={() => handleApproveAndAssign(app.id)}
                        className="sm:self-center py-2 px-3.5 rounded-xl bg-[#0B7A3A] hover:bg-emerald-700 text-white text-xs font-black transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 shrink-0"
                      >
                        {assigningAppId === app.id ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>Đang kích hoạt...</span>
                          </>
                        ) : (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>Duyệt & Gán sạp {selectedStall.code}</span>
                          </>
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-slate-500 space-y-2">
                  <Store className="w-10 h-10 text-slate-300 mx-auto" />
                  <p className="text-xs font-bold text-slate-700">
                    Không có hồ sơ nào đang chờ xét duyệt
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Toàn bộ hồ sơ gửi từ Zalo Mini App đã được xử lý hoặc sạp đã được bố trí đầy đủ.
                  </p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-end shrink-0">
              <button
                type="button"
                onClick={() => setIsAssignModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. FOOTER STATUS BAR */}
      <footer className="bg-white border-t border-slate-200 px-4 py-2 text-[11px] text-slate-600 flex flex-wrap items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
            <span className="font-bold text-slate-800">Chợ Đồng Xuân</span>
          </span>
          <span>·</span>
          <span>50 Sạp Số Hoá</span>
          <span>·</span>
          <span>Hành lang: {metrics.walkwayCount} ô</span>
          <span>·</span>
          <span>Trụ PCCC: {metrics.fireCount} điểm</span>
        </div>

        <div className="flex items-center gap-3 text-slate-500">
          <span>Click vào sạp để mở hồ sơ tác chiến · Rê chuột để vẽ hành lang</span>
        </div>
      </footer>
    </div>
  );
}
