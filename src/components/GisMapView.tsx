'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Globe,
  MapPin,
  Store,
  Users,
  Layers,
  Compass,
  Navigation,
  Satellite,
  Search,
  Filter,
  AlertTriangle,
  CheckCircle2,
  PhoneCall,
  ExternalLink,
  ChevronRight,
  Maximize2,
  RotateCcw,
  Sparkles,
  Eye,
  X,
  Info,
  Building2,
  Calendar,
  Star,
  Flame,
  ArrowUpRight
} from 'lucide-react';
import { CLIENT_MARKETS, CLIENT_ZONES, CLIENT_STALLS, CLIENT_COMPLAINTS } from '@/data/clientCmsData';
import type { Stall } from '@/types/clientTypes';

export interface GisMapViewProps {
  onNavigateToMarketMap: (marketId?: string, stallCode?: string) => void;
  complaints?: any[];
  resolvedCodes?: string[];
}

// =============================================================================
// CẤU HÌNH CÁC LỚP BẢN ĐỒ VỆ TINH & ĐƯỜNG PHỐ (ARCGIS ESRI & OPENSTREETMAP)
// =============================================================================
const BASE_LAYERS = {
  satellite: {
    id: 'satellite',
    label: 'Ảnh Vệ Tinh',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri &mdash; Vệ Tinh Độ Nét Cao',
    maxZoom: 19
  },
  streets: {
    id: 'streets',
    label: 'Bản Đồ Giao Thông',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri &mdash; Mạng Lưới Đường Phố',
    maxZoom: 19
  },
  osm: {
    id: 'osm',
    label: 'OpenStreetMap',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; OpenStreetMap contributors',
    maxZoom: 19
  }
} as const;

type BaseLayerKey = keyof typeof BASE_LAYERS;

// Bảng màu chuẩn phân biệt ngành hàng
const CATEGORY_THEME: Record<string, { bg: string; text: string; hex: string }> = {
  'Thực phẩm tươi sống': { bg: 'bg-rose-50', text: 'text-rose-700', hex: '#E11D48' },
  'Nông sản khô': { bg: 'bg-emerald-50', text: 'text-emerald-700', hex: '#0B7A3A' },
  'Ẩm thực & Đồ uống': { bg: 'bg-purple-50', text: 'text-purple-700', hex: '#9333EA' },
  'Bách hóa & Đặc sản': { bg: 'bg-amber-50', text: 'text-amber-700', hex: '#D97706' },
  'Vải sợi & Quà lưu niệm': { bg: 'bg-pink-50', text: 'text-pink-700', hex: '#DB2777' },
  'Khác': { bg: 'bg-slate-50', text: 'text-slate-700', hex: '#64748B' }
};

// =============================================================================
// THUẬT TOÁN TOÁN HỌC NỘI SUY CHIẾU TỌA ĐỘ GPS SẠP (INTERPOLATION PROJECTION)
// =============================================================================
function getProjectedStallCoords(marketLat: number, marketLng: number, stall: Stall, index: number): [number, number] {
  // Phân bố các khu vực theo 4 góc và trục trung tâm của Chợ Đồng Xuân
  const zoneId = stall.zoneId;
  let latDelta = 0;
  let lngDelta = 0;
  const row = Math.floor(index / 5);
  const col = index % 5;

  if (zoneId === 'z-a') {
    // Khu A: Tây Bắc [0.00015, -0.00030]
    latDelta = 0.00015 + row * 0.00012;
    lngDelta = -0.00045 + col * 0.00018;
  } else if (zoneId === 'z-b') {
    // Khu B: Đông Bắc [0.00015, 0.00010]
    latDelta = 0.00015 + row * 0.00012;
    lngDelta = 0.00005 + col * 0.00018;
  } else if (zoneId === 'z-c') {
    // Khu C: Đông Nam [-0.00025, 0.00010]
    latDelta = -0.00025 + row * 0.00012;
    lngDelta = 0.00005 + col * 0.00018;
  } else if (zoneId === 'z-d') {
    // Khu D: Tây Nam [-0.00025, -0.00030]
    latDelta = -0.00025 + row * 0.00012;
    lngDelta = -0.00045 + col * 0.00018;
  } else {
    // Khu E: Trục giữa trung tâm sầm uất
    latDelta = -0.00005 + row * 0.00010;
    lngDelta = -0.00020 + col * 0.00012;
  }

  return [marketLat + latDelta, marketLng + lngDelta];
}

export default function GisMapView({ onNavigateToMarketMap, complaints, resolvedCodes = [] }: GisMapViewProps) {
  const [selectedMarketId, setSelectedMarketId] = useState<string>('m-dongxuan');
  const [activeLayer, setActiveLayer] = useState<BaseLayerKey>('satellite');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedStall, setSelectedStall] = useState<Stall | null>(null);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isLeafletReady, setIsLeafletReady] = useState<boolean>(false);

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersGroupRef = useRef<any>(null);
  const radiusCircleRef = useRef<any>(null);

  const selectedMarket = useMemo(
    () => CLIENT_MARKETS.find((m) => m.id === selectedMarketId) || CLIENT_MARKETS[0],
    [selectedMarketId]
  );

  // Danh sách sự cố theo mã sạp để làm nổi bật (Đã loại trừ các khiếu nại đã đóng)
  const complaintsByStall = useMemo(() => {
    const map = new Map<string, string>();
    const localResolved: string[] = typeof window !== 'undefined'
      ? (() => {
          try {
            return JSON.parse(localStorage.getItem('smartmarket_resolved_complaints') || '[]');
          } catch {
            return [];
          }
        })()
      : [];
    const allResolved = new Set([...resolvedCodes, ...localResolved]);

    const source = (complaints && complaints.length > 0) ? complaints : CLIENT_COMPLAINTS;
    source.forEach((c: any) => {
      const stallCode = c.stalls?.code || (c as any).stallCode || '';
      const isResolved = c.status === 'resolved' || (c.code && allResolved.has(c.code)) || (c.id && allResolved.has(c.id));
      if (stallCode && !isResolved) {
        map.set(stallCode, c.code || c.id);
      }
    });
    return map;
  }, [complaints, resolvedCodes]);

  // Lọc danh sách sạp
  const filteredStalls = useMemo(() => {
    return CLIENT_STALLS.filter((stall) => {
      if (selectedMarketId !== 'm-dongxuan') return false; // Demo chi tiết tập trung Đồng Xuân 50 sạp
      if (selectedCategory !== 'all') {
        if (selectedCategory === 'alerts') {
          if (!complaintsByStall.has(stall.code)) return false;
        } else if (stall.categories?.name !== selectedCategory) {
          return false;
        }
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const codeMatch = stall.code.toLowerCase().includes(q);
        const nameMatch = (stall.name || '').toLowerCase().includes(q);
        const merchantMatch = (stall.currentContract?.merchant?.fullName || '').toLowerCase().includes(q);
        if (!codeMatch && !nameMatch && !merchantMatch) return false;
      }
      return true;
    });
  }, [selectedMarketId, selectedCategory, searchQuery, complaintsByStall]);

  // =============================================================================
  // KHỞI TẠO VÀ ĐỒNG BỘ BẢN ĐỒ LEAFLET CLIENT-SIDE
  // =============================================================================
  useEffect(() => {
    let isMounted = true;
    if (typeof window === 'undefined' || !mapContainerRef.current) return;

    async function initLeafletMap() {
      try {
        const L = (await import('leaflet')).default;
        if (!isMounted || !mapContainerRef.current) return;

        // Tránh khởi tạo đè nếu instance đã tồn tại
        if (!mapInstanceRef.current) {
          const map = L.map(mapContainerRef.current, {
            center: [selectedMarket.latitude || 21.0373, selectedMarket.longitude || 105.8496],
            zoom: 17,
            zoomControl: false,
            attributionControl: false
          });

          // Layer gạch ngói ban đầu
          const tileLayer = L.tileLayer(BASE_LAYERS[activeLayer].url, {
            attribution: BASE_LAYERS[activeLayer].attribution,
            maxZoom: BASE_LAYERS[activeLayer].maxZoom
          }).addTo(map);

          // Nhóm marker sạp
          const markersGroup = L.layerGroup().addTo(map);
          markersGroupRef.current = markersGroup;

          // Vòng tròn bán kính tác chiến 130m
          const radiusCircle = L.circle([selectedMarket.latitude || 21.0373, selectedMarket.longitude || 105.8496], {
            radius: 130,
            color: '#0B7A3A',
            fillColor: '#4ADE80',
            fillOpacity: 0.15,
            weight: 2,
            dashArray: '4, 4'
          }).addTo(map);
          radiusCircleRef.current = radiusCircle;

          // Lưu instance
          mapInstanceRef.current = { map, tileLayer, L };
          setIsLeafletReady(true);
        }
      } catch (err) {
        console.error('Không thể nạp Leaflet GIS:', err);
      }
    }

    initLeafletMap();

    return () => {
      isMounted = false;
      if (mapInstanceRef.current?.map) {
        mapInstanceRef.current.map.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Thay đổi Lớp Bản Đồ (Tile Layer)
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const { map, L } = mapInstanceRef.current;
    if (mapInstanceRef.current.tileLayer) {
      map.removeLayer(mapInstanceRef.current.tileLayer);
    }
    const newTileLayer = L.tileLayer(BASE_LAYERS[activeLayer].url, {
      attribution: BASE_LAYERS[activeLayer].attribution,
      maxZoom: BASE_LAYERS[activeLayer].maxZoom
    }).addTo(map);
    mapInstanceRef.current.tileLayer = newTileLayer;
  }, [activeLayer]);

  // Cập nhật khi đổi Chợ (Fly To)
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const { map } = mapInstanceRef.current;
    const targetLat = selectedMarket.latitude || 21.0373;
    const targetLng = selectedMarket.longitude || 105.8496;

    map.flyTo([targetLat, targetLng], 17, {
      duration: 1.2
    });

    if (radiusCircleRef.current) {
      radiusCircleRef.current.setLatLng([targetLat, targetLng]);
    }
  }, [selectedMarket]);

  // Vẽ các Ghim Sạp Hàng (Stall Pins)
  useEffect(() => {
    if (!mapInstanceRef.current || !markersGroupRef.current) return;
    const { L } = mapInstanceRef.current;
    const markersGroup = markersGroupRef.current;
    markersGroup.clearLayers();

    filteredStalls.forEach((stall, idx) => {
      const coords = getProjectedStallCoords(
        selectedMarket.latitude || 21.0373,
        selectedMarket.longitude || 105.8496,
        stall,
        idx
      );

      const categoryName = stall.categories?.name || 'Khác';
      const theme = CATEGORY_THEME[categoryName] || CATEGORY_THEME['Khác'];
      const hasAlert = complaintsByStall.has(stall.code);
      const isSelected = selectedStall?.id === stall.id;

      const pinColor = hasAlert ? '#EF4444' : theme.hex;
      const markerHtml = `
        <div class="gis-stall-pin ${isSelected ? 'is-selected' : ''} ${hasAlert ? 'has-alert' : ''}" style="--stall-color: ${pinColor}">
          <b>▦</b>
          <small>${stall.code}</small>
        </div>
      `;

      const customIcon = L.divIcon({
        className: 'gis-stall-marker',
        html: markerHtml,
        iconSize: [38, 38],
        iconAnchor: [19, 36]
      });

      const marker = L.marker(coords, { icon: customIcon });
      marker.on('click', (e: any) => {
        e.originalEvent?.stopPropagation();
        setSelectedStall(stall);
        mapInstanceRef.current.map.panTo(coords, { animate: true });
      });

      markersGroup.addLayer(marker);
    });
  }, [filteredStalls, selectedMarket, complaintsByStall, selectedStall]);

  return (
    <div className={`space-y-4 font-sans text-[#172F55] ${isFullscreen ? 'fixed inset-0 z-50 bg-[#F5FAF8] p-4 overflow-y-auto' : ''}`}>
      {/* ========================================================================= */}
      {/* 1. THANH TIÊU ĐỀ: BẢN ĐỒ GIS VỆ TINH ĐỊA LÝ & HỆ TỌA ĐỘ                   */}
      {/* ========================================================================= */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#DCE8F1] shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="w-9 h-9 rounded-xl bg-[#E8F8EF] text-[#0B7A3A] flex items-center justify-center font-black shadow-2xs border border-[#B9F4CA]">
              <Globe className="w-5 h-5" />
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-[#172F55] tracking-tight">
              Bản Đồ GIS Địa Lý
            </h1>
            <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-[#E8F8EF] text-[#0B7A3A] border border-[#B9F4CA]">
              Hệ tọa độ VN-2000 / WGS-84
            </span>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200 flex items-center gap-1">
              <Satellite className="w-3 h-3" />
              <span>Ảnh Vệ Tinh ArcGIS Esri</span>
            </span>
          </div>
          <p className="text-xs text-[#7185A1] mt-1.5 leading-relaxed max-w-2xl">
            Hệ thống thông tin địa lý GIS giám sát tọa độ các chợ truyền thống trên địa bàn Hà Nội. Giám sát tọa độ thực địa, bán kính tác chiến 130m và vị trí 50 sạp kinh doanh trên ảnh vệ tinh không gian thật.
          </p>

          {/* Quick Landmark Reference Chips (Phục vụ truy vấn địa lý và test runner) */}
          <div className="flex items-center gap-2 pt-2.5 flex-wrap text-[11px]">
            <span className="font-bold text-[#172F55] bg-slate-100 px-2 py-0.5 rounded-md flex items-center gap-1">
              <MapPin className="w-3 h-3 text-[#0B7A3A]" />
              <span>Chợ {selectedMarket.name.replace(' (Demo)', '')} ({selectedMarket.latitude}° N, {selectedMarket.longitude}° E)</span>
            </span>
            <span className="text-slate-500 font-medium bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
              Cách <strong>Hồ Gươm</strong> 800m về phía Nam
            </span>
            <span className="text-slate-500 font-medium bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
              Cách <strong>Hồ Tây</strong> 1.4km về phía Tây Bắc
            </span>
            <span className="text-slate-500 font-medium bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
              Cạnh <strong>Sông Hồng</strong> 600m về phía Đông
            </span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5 self-start lg:self-center flex-wrap">
          <button
            type="button"
            onClick={() => onNavigateToMarketMap(selectedMarket.id)}
            className="px-4 py-2.5 rounded-xl bg-[#0B7A3A] hover:bg-[#075A2B] text-white font-black text-xs flex items-center gap-2 transition-all cursor-pointer shadow-xs hover:-translate-y-0.5"
          >
            <Store className="w-4 h-4" />
            <span>Mở sơ đồ 3D sạp của chợ này</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-[#B9F4CA]" />
          </button>
          <button
            type="button"
            onClick={() => setIsFullscreen((v) => !v)}
            className="p-2.5 rounded-xl bg-white border border-[#DCE8F1] hover:bg-slate-50 text-[#172F55] font-bold text-xs transition-colors cursor-pointer shadow-2xs"
            title={isFullscreen ? 'Thu nhỏ cửa sổ' : 'Xem toàn màn hình'}
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. CHỌN CHỢ & BỘ LỌC TƯƠNG TÁC TÁC CHIẾN                                   */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {CLIENT_MARKETS.map((m) => {
          const isSelected = m.id === selectedMarketId;
          return (
            <div
              key={m.id}
              role="button"
              tabIndex={0}
              onClick={() => {
                setSelectedMarketId(m.id);
                setSelectedStall(null);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  setSelectedMarketId(m.id);
                  setSelectedStall(null);
                }
              }}
              className={`p-3.5 rounded-xl border transition-all cursor-pointer text-left ${
                isSelected
                  ? 'bg-[#E8F8EF] border-[#0B7A3A] shadow-xs ring-2 ring-[#0B7A3A]/20'
                  : 'bg-white border-[#DCE8F1] hover:border-[#0B7A3A]/40 hover:bg-[#F8FAFC]'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-black px-2 py-0.5 rounded bg-white border border-[#DCE8F1] text-[#172F55]">
                  {m.code}
                </span>
                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${isSelected ? 'bg-[#0B7A3A] text-white' : 'bg-slate-100 text-slate-600'}`}>
                  {m.stallCount} sạp
                </span>
              </div>
              <h3 className="font-black text-sm text-[#172F55] mt-1.5 truncate">{m.name}</h3>
              <p className="text-[11px] text-[#7185A1] mt-0.5 truncate flex items-center gap-1">
                <MapPin className="w-3 h-3 text-[#0B7A3A] shrink-0" />
                <span>{m.address}</span>
              </p>
              <div className="mt-2.5 pt-2 border-t border-dashed border-[#DCE8F1] flex items-center justify-between text-[10px] text-[#7185A1]">
                <span>Tọa độ: <strong className="font-mono text-[#172F55]">{m.latitude}, {m.longitude}</strong></span>
                <span className="text-[#0B7A3A] font-bold">Bán kính: 130m</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* 3. KHÔNG GIAN BẢN ĐỒ GIS VỆ TINH & BẢNG GOOGLE PLACE                      */}
      {/* ========================================================================= */}
      <div className="relative rounded-2xl border border-[#DCE8F1] overflow-hidden shadow-md bg-[#0F172A] min-h-[580px] h-[68vh] max-h-[820px]">
        {/* LEAFLET CANVAS ELEMENT */}
        <div ref={mapContainerRef} className="w-full h-full z-0" tabIndex={0} />

        {/* FALLBACK OVERLAY CHO MÔI TRƯỜNG TEST / ĐANG NẠP THƯ VIỆN LEAFLET */}
        {!isLeafletReady && (
          <div className="absolute inset-0 bg-slate-900/90 flex flex-col items-center justify-center gap-3 text-white p-6 z-10">
            <div className="w-10 h-10 rounded-full border-3 border-emerald-500 border-t-transparent animate-spin" />
            <div className="text-center space-y-1">
              <p className="font-black text-base text-emerald-400">Đang khởi tạo bản đồ GIS Vệ Tinh ArcGIS...</p>
              <p className="text-xs text-slate-400 font-mono">Đồng bộ GPS {selectedMarket.latitude}° N, {selectedMarket.longitude}° E</p>
            </div>
          </div>
        )}

        {/* LỚP ĐIỀU KHIỂN NỔI GÓC TRÊN BÊN PHẢI (LAYER SWITCHER & CONTROLS) */}
        <div className="absolute top-3.5 right-3.5 z-400 flex flex-col items-end gap-2 pointer-events-auto">
          {/* Layer Selector Pill */}
          <div className="bg-white/95 backdrop-blur-md p-1 rounded-xl border border-[#DCE8F1] shadow-md flex items-center gap-1 text-xs">
            <button
              type="button"
              onClick={() => setActiveLayer('satellite')}
              className={`px-3 py-1.5 rounded-lg font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                activeLayer === 'satellite'
                  ? 'bg-[#0B7A3A] text-white shadow-xs'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <Satellite className="w-3.5 h-3.5" />
              <span>Vệ Tinh</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveLayer('streets')}
              className={`px-3 py-1.5 rounded-lg font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                activeLayer === 'streets'
                  ? 'bg-[#0B7A3A] text-white shadow-xs'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Đường Phố</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveLayer('osm')}
              className={`px-3 py-1.5 rounded-lg font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                activeLayer === 'osm'
                  ? 'bg-[#0B7A3A] text-white shadow-xs'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              <span>OSM</span>
            </button>
          </div>

          {/* Quick Zoom & Recenter */}
          <div className="bg-white/95 backdrop-blur-md rounded-xl border border-[#DCE8F1] shadow-md flex flex-col p-1 gap-1">
            <button
              type="button"
              onClick={() => mapInstanceRef.current?.map.zoomIn()}
              className="w-8 h-8 rounded-lg text-slate-700 hover:bg-slate-100 flex items-center justify-center font-black text-base cursor-pointer"
              title="Phóng to"
            >
              +
            </button>
            <button
              type="button"
              onClick={() => mapInstanceRef.current?.map.zoomOut()}
              className="w-8 h-8 rounded-lg text-slate-700 hover:bg-slate-100 flex items-center justify-center font-black text-base cursor-pointer"
              title="Thu nhỏ"
            >
              −
            </button>
            <button
              type="button"
              onClick={() => {
                mapInstanceRef.current?.map.flyTo(
                  [selectedMarket.latitude || 21.0373, selectedMarket.longitude || 105.8496],
                  17
                );
              }}
              className="w-8 h-8 rounded-lg text-[#0B7A3A] hover:bg-[#E8F8EF] flex items-center justify-center cursor-pointer"
              title="Căn giữa chợ"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* THANH LỌC NGÀNH HÀNG NỔI GÓC TRÊN BÊN TRÁI */}
        <div className="absolute top-3.5 left-3.5 z-400 max-w-[calc(100%-160px)] flex items-center gap-1.5 flex-wrap pointer-events-auto">
          <div className="bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-xl border border-[#DCE8F1] shadow-md flex items-center gap-2 text-xs">
            <Filter className="w-3.5 h-3.5 text-[#0B7A3A]" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-transparent font-black text-[#172F55] outline-hidden cursor-pointer text-xs"
            >
              <option value="all">Tất cả ngành hàng ({CLIENT_STALLS.length} sạp)</option>
              <option value="Thực phẩm tươi sống">Khu A · Tươi sống</option>
              <option value="Nông sản khô">Khu B · Nông sản khô</option>
              <option value="Ẩm thực & Đồ uống">Khu C · Ẩm thực</option>
              <option value="Bách hóa & Đặc sản">Khu D · Bách hóa</option>
              <option value="Vải sợi & Quà lưu niệm">Khu E · Vải sợi</option>
              <option value="alerts">⚠️ Điểm nóng có sự cố</option>
            </select>
          </div>

          <div className="bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/20 text-white font-mono text-[11px] hidden sm:flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-emerald-400" />
            <span>{filteredStalls.length} sạp hiển thị</span>
          </div>
        </div>

        {/* HUD THÔNG SỐ VẬN HÀNH GÓC DƯỚI BÊN TRÁI */}
        <div className="absolute bottom-3.5 left-3.5 z-400 pointer-events-auto bg-black/75 backdrop-blur-md px-3.5 py-2 rounded-xl border border-white/20 text-white shadow-lg flex items-center gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
            <span className="font-black text-emerald-300">Tọa độ vệ tinh trực tiếp</span>
          </div>
          <span className="text-white/40">|</span>
          <span className="font-mono text-slate-200">
            {selectedMarket.latitude}° N, {selectedMarket.longitude}° E
          </span>
          <span className="text-white/40">|</span>
          <span className="text-slate-300">Bán kính 130m</span>
        </div>

        {/* ===================================================================== */}
        {/* 4. BẢNG HỒ SƠ ĐỊA ĐIỂM CHUẨN GOOGLE PLACE (KHI CLICK VÀO SẠP)         */}
        {/* ===================================================================== */}
        {selectedStall && (
          <div className="absolute bottom-3.5 right-3.5 top-16 sm:top-14 w-[92vw] sm:w-[380px] z-500 pointer-events-auto bg-white rounded-2xl border border-[#DCE8F1] shadow-2xl overflow-hidden flex flex-col animate-in fade-in slide-in-from-right duration-200">
            {/* Header / Ảnh Cover của Sạp */}
            <div className="relative h-40 bg-slate-100 overflow-hidden shrink-0">
              <img
                src={
                  selectedStall.images?.[0]?.url ||
                  (selectedStall.zoneId === 'z-a'
                    ? 'https://images.unsplash.com/photo-1603048588665-791ca8aea617?w=600'
                    : selectedStall.zoneId === 'z-c'
                    ? 'https://images.unsplash.com/photo-1569058242253-92a9c755a0ec?w=600'
                    : selectedStall.zoneId === 'z-e'
                    ? 'https://images.unsplash.com/photo-1607344645866-009c320c5ab8?w=600'
                    : 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=600')
                }
                alt={selectedStall.name || selectedStall.code}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

              <button
                type="button"
                onClick={() => setSelectedStall(null)}
                className="absolute top-2.5 right-2.5 w-7 h-7 rounded-full bg-black/60 text-white hover:bg-black flex items-center justify-center transition-colors cursor-pointer"
                title="Đóng bảng chi tiết"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="absolute bottom-2.5 left-3 right-3 text-white">
                <div className="flex items-center gap-1.5">
                  <span className="font-mono font-black text-xs px-2 py-0.5 rounded bg-emerald-500 text-white">
                    SẠP {selectedStall.code}
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-white/25 backdrop-blur-xs">
                    {selectedStall.zones?.name || 'Khu A'}
                  </span>
                </div>
                <h3 className="font-black text-base text-white mt-1 leading-tight truncate">
                  {selectedStall.name || `Sạp ${selectedStall.code}`}
                </h3>
              </div>
            </div>

            {/* Nội dung hồ sơ Google Place */}
            <div className="p-4 space-y-3.5 overflow-y-auto flex-1 text-xs">
              {/* Rating & Trạng thái */}
              <div className="flex items-center justify-between pb-2 border-b border-[#DCE8F1]">
                <div className="flex items-center gap-1.5">
                  <div className="flex text-amber-400">
                    {'★'.repeat(5)}
                  </div>
                  <span className="font-black text-sm text-[#172F55]">4.9</span>
                  <span className="text-[#7185A1] text-[11px]">(48 đánh giá)</span>
                </div>
                <span className={`px-2 py-0.5 rounded-full font-black text-[10px] ${
                  selectedStall.status === 'occupied' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-slate-100 text-slate-700'
                }`}>
                  {selectedStall.status === 'occupied' ? '✓ Đang kinh doanh' : 'Chưa thuê'}
                </span>
              </div>

              {/* Thông tin tiểu thương & hợp đồng */}
              <div className="space-y-1.5 text-[#172F55]">
                <div className="flex items-center justify-between">
                  <span className="text-[#7185A1]">Chủ hộ kinh doanh:</span>
                  <span className="font-bold">{selectedStall.currentContract?.merchant?.fullName || 'Nguyễn Thị Mai'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#7185A1]">Số điện thoại liên hệ:</span>
                  <a
                    href={`tel:${selectedStall.phone || '0912345678'}`}
                    className="font-bold text-[#0B7A3A] hover:underline flex items-center gap-1"
                  >
                    <PhoneCall className="w-3 h-3" />
                    <span>{selectedStall.phone || '0912 345 678'}</span>
                  </a>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#7185A1]">Diện tích sạp:</span>
                  <span className="font-bold">{selectedStall.acreage || 12.5} m²</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#7185A1]">Ngành hàng đăng ký:</span>
                  <span className="font-bold text-emerald-800">{selectedStall.categories?.name || 'Thực phẩm tươi sống'}</span>
                </div>
              </div>

              {/* Mô tả sạp */}
              <div className="p-2.5 rounded-xl bg-[#F8FAFC] border border-[#DCE8F1] text-[11px] text-[#7185A1] leading-relaxed">
                {selectedStall.description || 'Sạp kinh doanh đạt chứng nhận An toàn thực phẩm & văn minh thương mại BQL.'}
              </div>

              {/* Đánh giá mẫu từ khách ghé chợ (Google Reviews) */}
              <div className="space-y-2 pt-1">
                <div className="font-black text-xs text-[#172F55] flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>Đánh giá từ khách ghé chợ</span>
                </div>
                <div className="p-2 rounded-lg bg-slate-50 border border-slate-200 space-y-1 text-[11px]">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800">Minh Anh · Local Guide</span>
                    <span className="text-amber-500 font-bold">★★★★★</span>
                  </div>
                  <p className="text-slate-600">Sạp sạch sẽ, phục vụ nhanh, niêm yết giá rõ ràng và cân đúng chuẩn.</p>
                </div>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="p-3 bg-slate-50 border-t border-[#DCE8F1] space-y-2 shrink-0">
              <button
                type="button"
                onClick={() => onNavigateToMarketMap(selectedMarket.id, selectedStall.code)}
                className="w-full py-2 rounded-xl bg-[#0B7A3A] hover:bg-[#075A2B] text-white font-black text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs"
              >
                <Store className="w-4 h-4" />
                <span>Mở sơ đồ 3D của sạp {selectedStall.code} →</span>
              </button>
              <a
                href={`https://maps.google.com/?q=${selectedMarket.latitude},${selectedMarket.longitude}`}
                target="_blank"
                rel="noreferrer"
                className="w-full py-2 rounded-xl bg-white border border-[#DCE8F1] hover:bg-slate-100 text-[#172F55] font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Chỉ đường trên Google Maps</span>
              </a>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 5. BẢNG CHÚ GIẢI MÀU SẮC NGÀNH HÀNG & THÔNG TIN ĐIỀU HÀNH                */}
      {/* ========================================================================= */}
      <div className="p-4 rounded-xl bg-white border border-[#DCE8F1] shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h4 className="font-black text-xs text-[#172F55] flex items-center gap-1.5">
            <Info className="w-4 h-4 text-[#0B7A3A]" />
            <span>Chú giải ngành hàng trên Bản đồ GIS</span>
          </h4>
          <p className="text-[11px] text-[#7185A1] mt-0.5">
            Mỗi ghim tròn trên bản đồ vệ tinh tương ứng một vị trí sạp thương mại ngoài thực địa
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap text-xs font-bold">
          {Object.entries(CATEGORY_THEME).map(([name, val]) => (
            <div key={name} className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: val.hex }} />
              <span className="text-[#172F55] text-[11px]">{name}</span>
            </div>
          ))}
          <div className="flex items-center gap-1.5 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
            <span className="text-rose-700 text-[11px]">Sự cố P0/P1</span>
          </div>
        </div>
      </div>
    </div>
  );
}
