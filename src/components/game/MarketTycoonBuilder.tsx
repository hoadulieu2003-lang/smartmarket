'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Gamepad2, Play, Pause, RotateCcw, Trash2, Save, Sparkles,
  Flame, Scale, DoorOpen, Footprints, Grid, Eraser, Plus,
  Check, HelpCircle, ShieldAlert, Users, DollarSign, Award,
  Info, Maximize2, Minimize2, ArrowRight, Download, Upload,
  AlertTriangle, CheckCircle2, ChevronRight, Store
} from 'lucide-react';

export type ToolType =
  | 'select'
  | 'walkway'
  | 'emergency_exit'
  | 'stall_fresh'
  | 'stall_produce'
  | 'stall_food'
  | 'stall_fashion'
  | 'stall_dry'
  | 'gate'
  | 'fire_extinguisher'
  | 'scale'
  | 'eraser';

export interface StallInfo {
  id: string;
  code: string;
  name: string;
  category: 'fresh' | 'produce' | 'food' | 'fashion' | 'dry';
  categoryName: string;
  rentMonthly: number;
  merchantName: string;
  color: string;
}

export interface CellData {
  x: number;
  y: number;
  type: 'empty' | 'walkway' | 'emergency_exit' | 'stall' | 'gate' | 'fire_extinguisher' | 'scale';
  stall?: StallInfo;
  facilityLabel?: string;
}

export interface SimNpc {
  id: string;
  x: number;
  y: number;
  color: string;
  targetX?: number;
  targetY?: number;
  speechBubble?: string;
  bubbleTimer?: number;
  stepsRemaining: number;
}

const GRID_COLS = 22;
const GRID_ROWS = 14;
const CELL_SIZE = 42; // px

const STALL_TEMPLATES: Record<string, { category: StallInfo['category']; categoryName: string; color: string; rent: number; prefix: string }> = {
  stall_fresh: {
    category: 'fresh',
    categoryName: 'Thịt & Thủy Hải Sản',
    color: '#10B981', // Emerald
    rent: 2200000,
    prefix: 'A'
  },
  stall_produce: {
    category: 'produce',
    categoryName: 'Rau Củ & Hoa Quả',
    color: '#F59E0B', // Amber
    rent: 1800000,
    prefix: 'B'
  },
  stall_food: {
    category: 'food',
    categoryName: 'Ẩm Thực & Đồ Uống',
    color: '#EF4444', // Rose/Red
    rent: 2500000,
    prefix: 'C'
  },
  stall_fashion: {
    category: 'fashion',
    categoryName: 'Thời Trang & May Mặc',
    color: '#8B5CF6', // Purple
    rent: 3000000,
    prefix: 'D'
  },
  stall_dry: {
    category: 'dry',
    categoryName: 'Bách Hóa & Đồ Khô',
    color: '#0284C7', // Sky Blue
    rent: 1900000,
    prefix: 'E'
  }
};

// Khởi tạo sơ đồ mẫu mặc định chuẩn Chợ Đồng Xuân
function createInitialGrid(): CellData[][] {
  const grid: CellData[][] = [];
  for (let r = 0; r < GRID_ROWS; r++) {
    const row: CellData[] = [];
    for (let c = 0; c < GRID_COLS; c++) {
      row.push({ x: c, y: r, type: 'empty' });
    }
    grid.push(row);
  }

  // 1. Cổng vào (Gates)
  grid[0][10] = { x: 10, y: 0, type: 'gate', facilityLabel: 'Cổng 1 (Phố Hàng Khoai)' };
  grid[GRID_ROWS - 1][10] = { x: 10, y: GRID_ROWS - 1, type: 'gate', facilityLabel: 'Cổng 2 (Phố Cầu Đông)' };
  grid[6][0] = { x: 0, y: 6, type: 'emergency_exit', facilityLabel: 'Thoát hiểm Tây' };
  grid[6][GRID_COLS - 1] = { x: GRID_COLS - 1, y: 6, type: 'emergency_exit', facilityLabel: 'Thoát hiểm Đông' };

  // 2. Trục đường chính (Corridors / Walkways)
  // Trục dọc trung tâm
  for (let r = 1; r < GRID_ROWS - 1; r++) {
    grid[r][10] = { x: 10, y: r, type: 'walkway' };
    grid[r][11] = { x: 11, y: r, type: 'walkway' };
  }
  // Trục ngang chính
  for (let c = 1; c < GRID_COLS - 1; c++) {
    grid[6][c] = { x: c, y: 6, type: 'walkway' };
    grid[7][c] = { x: c, y: 7, type: 'walkway' };
  }
  // Vòng xuyến phụ
  for (let r = 2; r < 6; r++) {
    grid[r][4] = { x: 4, y: r, type: 'walkway' };
    grid[r][17] = { x: 17, y: r, type: 'walkway' };
  }
  for (let r = 8; r < 12; r++) {
    grid[r][4] = { x: 4, y: r, type: 'walkway' };
    grid[r][17] = { x: 17, y: r, type: 'walkway' };
  }

  // 3. Sạp hàng mẫu (Sample Stalls)
  const sampleStallsConfig = [
    // Khu A: Tươi sống (Góc Tây Bắc)
    { r: 2, c: 2, code: 'A-01', name: 'Thịt Heo Sạch Sinh Học', cat: 'stall_fresh', merchant: 'Chị Lan' },
    { r: 3, c: 2, code: 'A-02', name: 'Thịt Bò Tơ Củ Chi', cat: 'stall_fresh', merchant: 'Anh Tuấn' },
    { r: 4, c: 2, code: 'A-03', name: 'Hải Sản Tươi Sống Cát Bà', cat: 'stall_fresh', merchant: 'Bác Bình' },
    { r: 2, c: 6, code: 'A-04', name: 'Cá Sông Đà & Tôm Đồng', cat: 'stall_fresh', merchant: 'Cô Mai' },
    { r: 3, c: 6, code: 'A-05', name: 'Gà Đồi Tiên Yên', cat: 'stall_fresh', merchant: 'Chị Nga' },

    // Khu B: Rau củ & Nông sản (Góc Đông Bắc)
    { r: 2, c: 13, code: 'B-01', name: 'Rau Hữu Cơ Đà Lạt', cat: 'stall_produce', merchant: 'Bác Thắng' },
    { r: 3, c: 13, code: 'B-02', name: 'Hoa Quả Nhập Khẩu & Sạch', cat: 'stall_produce', merchant: 'Chị Huệ' },
    { r: 4, c: 13, code: 'B-03', name: 'Nông Sản Đặc Sản Tây Bắc', cat: 'stall_produce', merchant: 'Anh Hải' },
    { r: 2, c: 15, code: 'B-04', name: 'Khoai Rau Củ Quả Sạch', cat: 'stall_produce', merchant: 'Bà Tâm' },

    // Khu C: Ẩm thực (Góc Tây Nam)
    { r: 9, c: 2, code: 'C-01', name: 'Phở Bò Gia Truyền', cat: 'stall_food', merchant: 'Ông Hùng' },
    { r: 10, c: 2, code: 'C-02', name: 'Bún Chả Cầu Đông', cat: 'stall_food', merchant: 'Cô Thu' },
    { r: 11, c: 2, code: 'C-03', name: 'Cà Phê Trứng & Giải Khát', cat: 'stall_food', merchant: 'Bạn An' },
    { r: 9, c: 6, code: 'C-04', name: 'Bánh Mì Pate Phố Cổ', cat: 'stall_food', merchant: 'Chị Thoa' },

    // Khu D: Thời trang & Vải (Góc Đông Nam)
    { r: 9, c: 13, code: 'D-01', name: 'Lụa Tơ Tằm Vạn Phúc', cat: 'stall_fashion', merchant: 'Cô Dung' },
    { r: 10, c: 13, code: 'D-02', name: 'Quần Áo Trẻ Em Xuất Khẩu', cat: 'stall_fashion', merchant: 'Anh Long' },
    { r: 9, c: 15, code: 'D-03', name: 'Vải Kiện Hàn Quốc', cat: 'stall_fashion', merchant: 'Bà Tuyết' },
    { r: 10, c: 15, code: 'D-04', name: 'Giày Dép Thời Trang', cat: 'stall_fashion', merchant: 'Chị Thủy' },

    // Khu E: Bách hóa
    { r: 4, c: 8, code: 'E-01', name: 'Gia Vị & Đồ Khô Bắc Bộ', cat: 'stall_dry', merchant: 'Anh Khoa' },
    { r: 9, c: 8, code: 'E-02', name: 'Đồ Nhựa Gia Dụng Song Long', cat: 'stall_dry', merchant: 'Chị Oanh' }
  ];

  for (const s of sampleStallsConfig) {
    const tmpl = STALL_TEMPLATES[s.cat];
    grid[s.r][s.c] = {
      x: s.c,
      y: s.r,
      type: 'stall',
      stall: {
        id: `stall-${s.code}`,
        code: s.code,
        name: s.name,
        category: tmpl.category,
        categoryName: tmpl.categoryName,
        rentMonthly: tmpl.rent,
        merchantName: s.merchant,
        color: tmpl.color
      }
    };
  }

  // 4. Tiện ích an toàn: Bình PCCC & Cân đối chứng
  grid[1][9] = { x: 9, y: 1, type: 'fire_extinguisher', facilityLabel: 'Trụ PCCC 01' };
  grid[8][9] = { x: 9, y: 8, type: 'fire_extinguisher', facilityLabel: 'Trụ PCCC 02' };
  grid[5][10] = { x: 10, y: 5, type: 'scale', facilityLabel: 'Cân Đối Chứng Minh Bạch' };

  return grid;
}

export default function MarketTycoonBuilder() {
  const [grid, setGrid] = useState<CellData[][]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('smartmarket_tycoon_layout');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          console.error(e);
        }
      }
    }
    return createInitialGrid();
  });

  const [currentTool, setCurrentTool] = useState<ToolType>('stall_fresh');
  const [isMouseDown, setIsMouseDown] = useState(false);
  const [selectedCell, setSelectedCell] = useState<CellData | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [npcs, setNpcs] = useState<SimNpc[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [counterStall, setCounterStall] = useState(25);
  const canvasRef = useRef<HTMLDivElement>(null);

  // Hiển thị toast thông báo
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3000);
  };

  // Tính toán chỉ số HUD
  const metrics = useMemo(() => {
    let totalStalls = 0;
    let totalRent = 0;
    let walkwayCount = 0;
    let fireCount = 0;
    let exitCount = 0;
    let scaleCount = 0;
    const catBreakdown: Record<string, number> = {
      fresh: 0,
      produce: 0,
      food: 0,
      fashion: 0,
      dry: 0
    };

    grid.forEach((row) => {
      row.forEach((cell) => {
        if (cell.type === 'stall' && cell.stall) {
          totalStalls++;
          totalRent += cell.stall.rentMonthly;
          catBreakdown[cell.stall.category] = (catBreakdown[cell.stall.category] || 0) + 1;
        } else if (cell.type === 'walkway') {
          walkwayCount++;
        } else if (cell.type === 'fire_extinguisher') {
          fireCount++;
        } else if (cell.type === 'emergency_exit') {
          exitCount++;
        } else if (cell.type === 'scale') {
          scaleCount++;
        }
      });
    });

    // Điểm an toàn PCCC (Fire Safety Score: 0 - 100)
    let safetyScore = 40;
    safetyScore += Math.min(fireCount * 20, 40); // 2 bình PCCC = +40
    safetyScore += Math.min(exitCount * 10, 20); // 2 lối thoát hiểm = +20
    if (walkwayCount < 30) {
      safetyScore -= 20; // Trừ điểm nếu hành lang quá chật hẹp
    }
    safetyScore = Math.max(0, Math.min(100, safetyScore));

    return {
      totalStalls,
      totalRent,
      totalAreaM2: totalStalls * 9 + walkwayCount * 4,
      walkwayCount,
      fireCount,
      exitCount,
      scaleCount,
      safetyScore,
      catBreakdown,
      simulatedVisitors: isSimulating ? Math.round(totalStalls * 14.5 + npcs.length * 12 + 45) : 0
    };
  }, [grid, isSimulating, npcs.length]);

  // Áp dụng công cụ lên ô lưới (Cell Click & Paint)
  const applyToolToCell = (r: number, c: number) => {
    const nextGrid = grid.map((row) => [...row]);
    const target = nextGrid[r][c];

    if (currentTool === 'select') {
      setSelectedCell(target);
      return;
    }

    if (currentTool === 'eraser') {
      nextGrid[r][c] = { x: c, y: r, type: 'empty' };
      if (selectedCell?.x === c && selectedCell?.y === r) {
        setSelectedCell(null);
      }
      setGrid(nextGrid);
      return;
    }

    if (currentTool === 'walkway') {
      nextGrid[r][c] = { x: c, y: r, type: 'walkway' };
      setGrid(nextGrid);
      return;
    }

    if (currentTool === 'emergency_exit') {
      nextGrid[r][c] = { x: c, y: r, type: 'emergency_exit', facilityLabel: 'Lối thoát hiểm' };
      setGrid(nextGrid);
      return;
    }

    if (currentTool === 'gate') {
      nextGrid[r][c] = { x: c, y: r, type: 'gate', facilityLabel: 'Cổng vào chợ' };
      setGrid(nextGrid);
      return;
    }

    if (currentTool === 'fire_extinguisher') {
      nextGrid[r][c] = { x: c, y: r, type: 'fire_extinguisher', facilityLabel: 'Bình cứu hỏa PCCC' };
      setGrid(nextGrid);
      return;
    }

    if (currentTool === 'scale') {
      nextGrid[r][c] = { x: c, y: r, type: 'scale', facilityLabel: 'Cân đối chứng' };
      setGrid(nextGrid);
      return;
    }

    // Đặt sạp hàng
    if (currentTool.startsWith('stall_')) {
      const tmpl = STALL_TEMPLATES[currentTool];
      if (tmpl) {
        const nextNum = counterStall;
        setCounterStall(prev => prev + 1);
        const code = `${tmpl.prefix}-${nextNum.toString().padStart(2, '0')}`;
        nextGrid[r][c] = {
          x: c,
          y: r,
          type: 'stall',
          stall: {
            id: `stall-${code}`,
            code,
            name: `Sạp ${tmpl.categoryName} ${code}`,
            category: tmpl.category,
            categoryName: tmpl.categoryName,
            rentMonthly: tmpl.rent,
            merchantName: `Tiểu thương ${code}`,
            color: tmpl.color
          }
        };
        setGrid(nextGrid);
      }
    }
  };

  // Cập nhật thông tin sạp đã chọn
  const updateSelectedStall = (field: keyof StallInfo, value: any) => {
    if (!selectedCell || selectedCell.type !== 'stall' || !selectedCell.stall) return;
    const nextGrid = grid.map((row) => [...row]);
    const cell = nextGrid[selectedCell.y][selectedCell.x];
    if (cell.stall) {
      cell.stall = { ...cell.stall, [field]: value };
      setGrid(nextGrid);
      setSelectedCell(cell);
    }
  };

  // Lưu sơ đồ vào localStorage
  const handleSaveLayout = () => {
    localStorage.setItem('smartmarket_tycoon_layout', JSON.stringify(grid));
    showToast('💾 Đã lưu sơ đồ quy hoạch vào bộ nhớ thiết bị!');
  };

  // Áp dụng vào hệ thống thực tế
  const handleApplyToRealSystem = () => {
    localStorage.setItem('smartmarket_tycoon_layout', JSON.stringify(grid));
    localStorage.setItem('smartmarket_tycoon_applied_timestamp', new Date().toISOString());
    showToast('🚀 Đã đồng bộ sơ đồ chợ vào hệ thống điều hành thực tế!');
  };

  // Khôi phục mặc định
  const handleResetDefault = () => {
    if (window.confirm('Bạn có chắc muốn khôi phục về sơ đồ mẫu ban đầu không?')) {
      const initial = createInitialGrid();
      setGrid(initial);
      setSelectedCell(null);
      localStorage.removeItem('smartmarket_tycoon_layout');
      showToast('🔄 Đã tải lại sơ đồ mẫu chuẩn!');
    }
  };

  // Xoá trắng
  const handleClearAll = () => {
    if (window.confirm('Bạn có chắc muốn xoá trắng toàn bộ sơ đồ để vẽ lại từ đầu?')) {
      const emptyGrid: CellData[][] = [];
      for (let r = 0; r < GRID_ROWS; r++) {
        const row: CellData[] = [];
        for (let c = 0; c < GRID_COLS; c++) {
          row.push({ x: c, y: r, type: 'empty' });
        }
        emptyGrid.push(row);
      }
      setGrid(emptyGrid);
      setSelectedCell(null);
      showToast('🧹 Đã dọn sạch lưới thiết kế!');
    }
  };

  // Vòng lặp mô phỏng khách hàng (Simulation Loop)
  useEffect(() => {
    if (!isSimulating) {
      setNpcs([]);
      return;
    }

    // Tìm các cổng vào (Gates)
    const gateCells: Array<{ x: number; y: number }> = [];
    const stallCells: Array<{ x: number; y: number; name: string }> = [];
    const walkwayCells: Array<{ x: number; y: number }> = [];

    grid.forEach((row, r) => {
      row.forEach((cell, c) => {
        if (cell.type === 'gate') gateCells.push({ x: c, y: r });
        if (cell.type === 'stall') stallCells.push({ x: c, y: r, name: cell.stall?.name || 'Sạp' });
        if (cell.type === 'walkway') walkwayCells.push({ x: c, y: r });
      });
    });

    if (walkwayCells.length === 0) {
      showToast('⚠️ Cần vẽ thêm lối đi bộ (Walkway) để khách hàng có thể di chuyển!');
      setIsSimulating(false);
      return;
    }

    const shopperColors = ['#F43F5E', '#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#06B6D4'];
    const shopperSayings = [
      '🛒 Mua 1kg thịt heo',
      '🥬 Rau tươi quá!',
      '💳 Đã thanh toán QR',
      '⭐ Cân đủ chuẩn!',
      '👗 Mẫu vải đẹp',
      '🍜 Cho bát bún chả!',
      '☕ Uống ly cafe'
    ];

    const interval = setInterval(() => {
      setNpcs((prevNpcs) => {
        let updated = prevNpcs.map((npc) => {
          // Di chuyển sang ô lối đi liền kề ngẫu nhiên
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

          // Kiểm tra xem bên cạnh có sạp hàng nào không
          const adjacentStalls = [
            { x: nextPos.x + 1, y: nextPos.y },
            { x: nextPos.x - 1, y: nextPos.y },
            { x: nextPos.x, y: nextPos.y + 1 },
            { x: nextPos.x, y: nextPos.y - 1 }
          ].filter(
            (pos) =>
              pos.x >= 0 &&
              pos.x < GRID_COLS &&
              pos.y >= 0 &&
              pos.y < GRID_ROWS &&
              grid[pos.y][pos.x].type === 'stall'
          );

          let bubble = npc.speechBubble;
          if (adjacentStalls.length > 0 && Math.random() > 0.6) {
            bubble = shopperSayings[Math.floor(Math.random() * shopperSayings.length)];
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

        // Loại bỏ khách hết lượt đi
        updated = updated.filter((npc) => npc.stepsRemaining > 0);

        // Sinh thêm khách mới tại cổng vào (tối đa 16 khách)
        if (updated.length < 14 && gateCells.length > 0 && Math.random() > 0.3) {
          const spawnGate = gateCells[Math.floor(Math.random() * gateCells.length)];
          updated.push({
            id: `npc-${Date.now()}-${Math.random()}`,
            x: spawnGate.x,
            y: spawnGate.y,
            color: shopperColors[Math.floor(Math.random() * shopperColors.length)],
            stepsRemaining: 20 + Math.floor(Math.random() * 25),
            speechBubble: '👋 Vào chợ'
          });
        }

        return updated;
      });
    }, 700);

    return () => clearInterval(interval);
  }, [isSimulating, grid]);

  return (
    <div className="w-full flex-1 flex flex-col bg-[#0F172A] text-slate-100 font-sans overflow-hidden select-none min-h-[680px]">
      
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-[#1E293B] border-2 border-[#10B981] text-white px-4 py-2.5 rounded-2xl shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-top-4 duration-200">
          <CheckCircle2 className="w-5 h-5 text-[#10B981] shrink-0" />
          <span className="text-xs font-bold">{toastMessage}</span>
        </div>
      )}

      {/* 1. TOP GAME HUD (Bảng chỉ số & Điều khiển) */}
      <div className="bg-[#1E293B]/90 backdrop-blur-md border-b border-slate-700/70 px-4 py-3 flex flex-wrap items-center justify-between gap-3 shrink-0">
        
        {/* Title & Badge */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#0B7A3A] to-[#10B981] flex items-center justify-center text-white shadow-lg shadow-emerald-900/30">
            <Gamepad2 className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-black text-white tracking-wide flex items-center gap-1.5">
                <span>MARKET TYCOON BUILDER</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-400 text-slate-900 uppercase">
                  SIMULATOR
                </span>
              </h2>
            </div>
            <p className="text-[11px] text-slate-400">
              Quy hoạch sạp, thiết kế hành lang & mô phỏng luồng khách ghé chợ
            </p>
          </div>
        </div>

        {/* Live Metrics HUD */}
        <div className="flex items-center gap-2 sm:gap-4 overflow-x-auto py-1">
          
          {/* Stalls Count */}
          <div className="bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-1.5 flex items-center gap-2">
            <Store className="w-4 h-4 text-emerald-400" />
            <div>
              <div className="text-[10px] text-slate-400 font-bold uppercase">Tổng Sạp</div>
              <div className="text-xs sm:text-sm font-extrabold text-white">{metrics.totalStalls} sạp</div>
            </div>
          </div>

          {/* Revenue */}
          <div className="bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-1.5 flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-amber-400" />
            <div>
              <div className="text-[10px] text-slate-400 font-bold uppercase">Doanh thu thuê</div>
              <div className="text-xs sm:text-sm font-extrabold text-amber-300">
                {(metrics.totalRent / 1000000).toFixed(1)} tr/tháng
              </div>
            </div>
          </div>

          {/* Fire Safety Score */}
          <div className={`border rounded-xl px-3 py-1.5 flex items-center gap-2 ${
            metrics.safetyScore >= 80 ? 'bg-emerald-950/40 border-emerald-500/50' : 'bg-red-950/40 border-red-500/50'
          }`}>
            <Flame className={`w-4 h-4 ${metrics.safetyScore >= 80 ? 'text-emerald-400' : 'text-red-400'}`} />
            <div>
              <div className="text-[10px] text-slate-400 font-bold uppercase">Điểm PCCC</div>
              <div className={`text-xs sm:text-sm font-extrabold ${
                metrics.safetyScore >= 80 ? 'text-emerald-300' : 'text-red-300'
              }`}>
                {metrics.safetyScore}/100
              </div>
            </div>
          </div>

          {/* Shoppers Simulation */}
          <div className="bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-1.5 flex items-center gap-2">
            <Users className="w-4 h-4 text-sky-400" />
            <div>
              <div className="text-[10px] text-slate-400 font-bold uppercase">Khách ghé thăm</div>
              <div className="text-xs sm:text-sm font-extrabold text-sky-300">
                {isSimulating ? `${npcs.length} đang dạo` : 'Tạm dừng'}
              </div>
            </div>
          </div>
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center gap-2">
          {/* Start/Stop Simulation Button */}
          <button
            type="button"
            onClick={() => setIsSimulating(!isSimulating)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-black shadow-lg transition-all cursor-pointer ${
              isSimulating
                ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-900/30'
                : 'bg-[#10B981] hover:bg-emerald-400 text-slate-950 shadow-emerald-900/40'
            }`}
          >
            {isSimulating ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
            <span>{isSimulating ? 'DỪNG PHIÊN CHỢ' : 'MỞ PHIÊN CHỢ (SIM)'}</span>
          </button>

          {/* Sync to Real System */}
          <button
            type="button"
            onClick={handleApplyToRealSystem}
            className="flex items-center gap-1 px-3 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-black shadow-md transition-all cursor-pointer"
            title="Áp dụng quy hoạch vào sơ đồ thực tế"
          >
            <Sparkles className="w-4 h-4" />
            <span className="hidden sm:inline">ÁP DỤNG THỰC TẾ</span>
          </button>

          {/* Save Layout */}
          <button
            type="button"
            onClick={handleSaveLayout}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
            title="Lưu bản thiết kế"
          >
            <Save className="w-4 h-4" />
          </button>

          {/* Reset Template */}
          <button
            type="button"
            onClick={handleResetDefault}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
            title="Khôi phục sơ đồ mẫu"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* Clear All */}
          <button
            type="button"
            onClick={handleClearAll}
            className="p-2 rounded-xl bg-slate-800 hover:bg-red-900/40 border border-slate-700 text-slate-300 hover:text-red-300 transition-colors cursor-pointer"
            title="Xoá trắng lưới"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. BODY WORKSPACE: TOOLBAR + CANVAS + INSPECTOR */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
        
        {/* Left Toolbar (Công cụ quy hoạch) */}
        <aside className="w-full md:w-60 bg-[#1E293B] border-r border-slate-800 p-3 flex flex-col gap-3 overflow-y-auto shrink-0">
          <div className="text-[11px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Footprints className="w-3.5 h-3.5 text-amber-400" />
            <span>Bộ Công Cụ Quy Hoạch</span>
          </div>

          {/* Selection & Eraser */}
          <div className="grid grid-cols-2 gap-1.5">
            <button
              type="button"
              onClick={() => setCurrentTool('select')}
              className={`flex items-center gap-2 p-2 rounded-xl text-xs font-bold transition-all border text-left cursor-pointer ${
                currentTool === 'select'
                  ? 'bg-amber-500/20 border-amber-400 text-amber-300 shadow-sm'
                  : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-800'
              }`}
            >
              <Info className="w-4 h-4 text-amber-400" />
              <span>Xem Sạp</span>
            </button>

            <button
              type="button"
              onClick={() => setCurrentTool('eraser')}
              className={`flex items-center gap-2 p-2 rounded-xl text-xs font-bold transition-all border text-left cursor-pointer ${
                currentTool === 'eraser'
                  ? 'bg-rose-500/20 border-rose-400 text-rose-300 shadow-sm'
                  : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-800'
              }`}
            >
              <Eraser className="w-4 h-4 text-rose-400" />
              <span>Tẩy / Xoá</span>
            </button>
          </div>

          {/* Nhóm 1: Sạp Hàng */}
          <div className="space-y-1 pt-1">
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
              🏪 Đặt Sạp Hàng (Stall)
            </div>
            {Object.entries(STALL_TEMPLATES).map(([key, tmpl]) => {
              const isActive = currentTool === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setCurrentTool(key as ToolType)}
                  className={`w-full flex items-center justify-between p-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                    isActive
                      ? 'border-white shadow-md'
                      : 'border-slate-700/60 hover:bg-slate-800/80 text-slate-300'
                  }`}
                  style={{
                    backgroundColor: isActive ? `${tmpl.color}25` : undefined,
                    borderColor: isActive ? tmpl.color : undefined
                  }}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="w-3.5 h-3.5 rounded-md shrink-0 shadow-xs"
                      style={{ backgroundColor: tmpl.color }}
                    />
                    <span className="truncate">{tmpl.categoryName}</span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400">
                    {(tmpl.rent / 1000000).toFixed(1)} tr
                  </span>
                </button>
              );
            })}
          </div>

          {/* Nhóm 2: Lối đi & Giao thông */}
          <div className="space-y-1 pt-1">
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
              🚶 Lối Đi & Giao Thông
            </div>
            <button
              type="button"
              onClick={() => setCurrentTool('walkway')}
              className={`w-full flex items-center gap-2 p-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                currentTool === 'walkway'
                  ? 'bg-slate-300 text-slate-950 border-white shadow-md'
                  : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-800'
              }`}
            >
              <Grid className="w-4 h-4 text-slate-400" />
              <span>Hành Lang Đi Bộ</span>
            </button>

            <button
              type="button"
              onClick={() => setCurrentTool('emergency_exit')}
              className={`w-full flex items-center gap-2 p-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                currentTool === 'emergency_exit'
                  ? 'bg-emerald-500 text-slate-950 border-white shadow-md'
                  : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-800'
              }`}
            >
              <DoorOpen className="w-4 h-4 text-emerald-400" />
              <span>Lối Thoát Hiểm Khẩn Cấp</span>
            </button>

            <button
              type="button"
              onClick={() => setCurrentTool('gate')}
              className={`w-full flex items-center gap-2 p-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                currentTool === 'gate'
                  ? 'bg-amber-500 text-slate-950 border-white shadow-md'
                  : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-800'
              }`}
            >
              <DoorOpen className="w-4 h-4 text-amber-400" />
              <span>Cổng Vào Chợ</span>
            </button>
          </div>

          {/* Nhóm 3: An Toàn & Tiện Ích */}
          <div className="space-y-1 pt-1">
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
              🛡️ An Toàn & Tiện Ích
            </div>
            <button
              type="button"
              onClick={() => setCurrentTool('fire_extinguisher')}
              className={`w-full flex items-center gap-2 p-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                currentTool === 'fire_extinguisher'
                  ? 'bg-red-500 text-white border-white shadow-md'
                  : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-800'
              }`}
            >
              <Flame className="w-4 h-4 text-red-400" />
              <span>Trụ Cứu Hỏa PCCC (+20đ)</span>
            </button>

            <button
              type="button"
              onClick={() => setCurrentTool('scale')}
              className={`w-full flex items-center gap-2 p-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                currentTool === 'scale'
                  ? 'bg-teal-500 text-slate-950 border-white shadow-md'
                  : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-800'
              }`}
            >
              <Scale className="w-4 h-4 text-teal-400" />
              <span>Cân Đối Chứng Minh Bạch</span>
            </button>
          </div>

          {/* Game Tips */}
          <div className="mt-auto pt-2 border-t border-slate-800 text-[10px] text-slate-400 leading-relaxed">
            💡 <b className="text-slate-300">Mẹo:</b> Click công cụ bên trái rồi chạm hoặc rê chuột trên lưới để vẽ liên tục. Chạm vào sạp để chỉnh sửa thông tin.
          </div>
        </aside>

        {/* Center: Canvas Grid Area */}
        <main
          className="flex-1 overflow-auto p-4 sm:p-6 flex items-center justify-center bg-[#0B1120] relative"
          ref={canvasRef}
          onMouseUp={() => setIsMouseDown(false)}
          onMouseLeave={() => setIsMouseDown(false)}
        >
          {/* Sân quy hoạch Canvas */}
          <div
            className="relative border-4 border-slate-700/80 rounded-3xl bg-[#162032] shadow-2xl p-2 select-none"
            style={{
              width: GRID_COLS * CELL_SIZE + 16,
              height: GRID_ROWS * CELL_SIZE + 16
            }}
          >
            {/* Lưới các ô (Grid Matrix) */}
            <div
              className="grid gap-[2px] bg-slate-900/60 p-1 rounded-2xl relative"
              style={{
                gridTemplateColumns: `repeat(${GRID_COLS}, ${CELL_SIZE}px)`,
                gridTemplateRows: `repeat(${GRID_ROWS}, ${CELL_SIZE}px)`
              }}
            >
              {grid.map((row, r) =>
                row.map((cell, c) => {
                  const isSelected = selectedCell?.x === c && selectedCell?.y === r;

                  return (
                    <div
                      key={`${r}-${c}`}
                      onMouseDown={() => {
                        setIsMouseDown(true);
                        applyToolToCell(r, c);
                      }}
                      onMouseEnter={() => {
                        if (isMouseDown && currentTool !== 'select') {
                          applyToolToCell(r, c);
                        }
                      }}
                      className={`relative flex flex-col items-center justify-center rounded-lg cursor-pointer transition-all duration-100 ${
                        isSelected ? 'ring-2 ring-amber-400 ring-offset-2 ring-offset-slate-900 z-10' : ''
                      }`}
                      style={{
                        width: CELL_SIZE,
                        height: CELL_SIZE,
                        backgroundColor:
                          cell.type === 'stall' && cell.stall
                            ? cell.stall.color
                            : cell.type === 'walkway'
                            ? '#334155'
                            : cell.type === 'gate'
                            ? '#D97706'
                            : cell.type === 'emergency_exit'
                            ? '#059669'
                            : cell.type === 'fire_extinguisher'
                            ? '#DC2626'
                            : cell.type === 'scale'
                            ? '#0D9488'
                            : '#1E293B55',
                        border:
                          cell.type === 'empty'
                            ? '1px dashed #33415555'
                            : '1px solid rgba(255,255,255,0.15)'
                      }}
                      title={
                        cell.type === 'stall'
                          ? `${cell.stall?.code} - ${cell.stall?.name} (${cell.stall?.merchantName})`
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
                      {/* Stall Glyph */}
                      {cell.type === 'stall' && cell.stall && (
                        <div className="text-center w-full px-0.5 pointer-events-none">
                          <div className="text-[10px] font-black text-white leading-tight drop-shadow-md truncate">
                            {cell.stall.code}
                          </div>
                          <div className="text-[8px] font-bold text-white/90 leading-tight truncate">
                            {cell.stall.merchantName.split(' ').pop()}
                          </div>
                        </div>
                      )}

                      {/* Walkway Texture */}
                      {cell.type === 'walkway' && (
                        <div className="w-1.5 h-1.5 rounded-full bg-slate-400/40 pointer-events-none" />
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

              {/* NPC Shoppers Overlay (Khách hàng mô phỏng chuyển động) */}
              {npcs.map((npc) => (
                <div
                  key={npc.id}
                  className="absolute z-20 transition-all duration-500 ease-out pointer-events-none flex flex-col items-center justify-center"
                  style={{
                    left: npc.x * (CELL_SIZE + 2) + 5,
                    top: npc.y * (CELL_SIZE + 2) + 5,
                    width: CELL_SIZE,
                    height: CELL_SIZE
                  }}
                >
                  {/* Speech Bubble */}
                  {npc.speechBubble && (
                    <div className="absolute -top-7 whitespace-nowrap bg-white text-slate-900 px-2 py-0.5 rounded-full text-[9px] font-black shadow-lg border border-slate-200 animate-in fade-in zoom-in-75 duration-200">
                      {npc.speechBubble}
                    </div>
                  )}

                  {/* NPC Avatar Dot */}
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

        {/* Right Panel: Stall Inspector & Editor (Bảng chỉnh sửa sạp) */}
        {selectedCell && selectedCell.type === 'stall' && selectedCell.stall && (
          <aside className="w-full md:w-72 bg-[#1E293B] border-l border-slate-800 p-4 flex flex-col gap-3 overflow-y-auto shrink-0 animate-in slide-in-from-right-4 duration-200">
            <div className="flex items-center justify-between pb-2 border-b border-slate-700">
              <div className="flex items-center gap-2">
                <span
                  className="w-4 h-4 rounded-md shrink-0 shadow-xs"
                  style={{ backgroundColor: selectedCell.stall.color }}
                />
                <h3 className="text-sm font-black text-white">
                  Chi Tiết Sạp {selectedCell.stall.code}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedCell(null)}
                className="text-slate-400 hover:text-white text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Mã Sạp & Ngành Hàng */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Mã số sạp</label>
              <input
                type="text"
                value={selectedCell.stall.code}
                onChange={(e) => updateSelectedStall('code', e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs font-bold text-white focus:outline-none focus:border-amber-400"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Tên sạp hàng</label>
              <input
                type="text"
                value={selectedCell.stall.name}
                onChange={(e) => updateSelectedStall('name', e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs font-bold text-white focus:outline-none focus:border-amber-400"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Tiểu thương phụ trách</label>
              <input
                type="text"
                value={selectedCell.stall.merchantName}
                onChange={(e) => updateSelectedStall('merchantName', e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs font-bold text-white focus:outline-none focus:border-amber-400"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Giá thuê (VNĐ / Tháng)</label>
              <input
                type="number"
                step="100000"
                value={selectedCell.stall.rentMonthly}
                onChange={(e) => updateSelectedStall('rentMonthly', Number(e.target.value))}
                className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs font-bold text-amber-300 focus:outline-none focus:border-amber-400"
              />
            </div>

            {/* Toạ độ ô */}
            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs space-y-1">
              <div className="flex justify-between text-slate-400">
                <span>Toạ độ ô lưới:</span>
                <span className="font-mono text-white">X={selectedCell.x}, Y={selectedCell.y}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Diện tích ước tính:</span>
                <span className="font-mono text-white">9 m² (3m x 3m)</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Hợp đồng hiện tại:</span>
                <span className="text-emerald-400 font-bold">Còn hạn 11 tháng</span>
              </div>
            </div>

            {/* Nút Xoá sạp */}
            <button
              type="button"
              onClick={() => {
                applyToolToCell(selectedCell.y, selectedCell.x);
                const nextGrid = grid.map(r => [...r]);
                nextGrid[selectedCell.y][selectedCell.x] = { x: selectedCell.x, y: selectedCell.y, type: 'empty' };
                setGrid(nextGrid);
                setSelectedCell(null);
                showToast('🗑️ Đã xoá sạp hàng khỏi sơ đồ!');
              }}
              className="mt-2 w-full flex items-center justify-center gap-1.5 py-2 rounded-xl bg-rose-600/20 hover:bg-rose-600 border border-rose-500/50 text-rose-300 hover:text-white text-xs font-bold transition-colors cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              <span>Gỡ sạp khỏi vị trí</span>
            </button>
          </aside>
        )}
      </div>

      {/* 3. FOOTER STATUS BAR (Thanh trạng thái dưới chân) */}
      <footer className="bg-[#0B1120] border-t border-slate-800 px-4 py-2 text-[11px] text-slate-400 flex flex-wrap items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
            <span>Chợ Đồng Xuân - Sơ Đồ Quy Hoạch Tycoon</span>
          </span>
          <span>·</span>
          <span>Lưới 22x14 ô (Snapshot 20px Grid)</span>
          <span>·</span>
          <span>Hành lang: {metrics.walkwayCount} ô</span>
          <span>·</span>
          <span>Trụ PCCC: {metrics.fireCount} điểm</span>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-slate-300 font-medium">
            Mẹo: Click công cụ bên trái rồi chạm hoặc rê chuột trên lưới để xây dựng
          </span>
        </div>
      </footer>
    </div>
  );
}
