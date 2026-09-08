'use client';

import React from 'react';
import type { DonutSegment } from '@/types/dashboard';

interface DonutChartSvgProps {
  data: DonutSegment[];
  centerValue: React.ReactNode;
  centerLabel: string;
  size?: number;
  strokeWidth?: number;
  className?: string;
}

/**
 * Pure SVG Donut Chart Component
 * Thiết kế gọn nhẹ, zero-dependency, chống hydration mismatch và tương thích 100% Next.js SSR
 */
export default function DonutChartSvg({
  data,
  centerValue,
  centerLabel,
  size = 160,
  strokeWidth = 22,
  className = '',
}: DonutChartSvgProps) {
  const filteredData = data.filter((d) => d.value > 0);
  const total = filteredData.reduce((sum, d) => sum + d.value, 0);

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;

  let accumulatedPercent = 0;

  return (
    <div
      className={`relative flex items-center justify-center shrink-0 ${className}`}
      style={{ width: size, height: size }}
      aria-label={`Biểu đồ phân bổ ${centerLabel}`}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="rotate-[-90deg] transition-all duration-500 ease-out"
      >
        {/* Vòng nền mờ nếu không có dữ liệu hoặc làm rãnh */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="#E2E8F0"
          strokeWidth={strokeWidth}
          className="opacity-40"
        />

        {total > 0 &&
          filteredData.map((item, index) => {
            const percent = item.value / total;
            const strokeDash = percent * circumference;
            const strokeOffset = -accumulatedPercent * circumference;
            accumulatedPercent += percent;

            // Gap nhỏ 2px giữa các lát cắt nếu có nhiều hơn 1 lát
            const hasGap = filteredData.length > 1;
            const dashArray = hasGap
              ? `${Math.max(0, strokeDash - 2)} ${circumference - Math.max(0, strokeDash - 2)}`
              : `${strokeDash} ${circumference - strokeDash}`;

            return (
              <circle
                key={item.name || index}
                cx={center}
                cy={center}
                r={radius}
                fill="none"
                stroke={item.color}
                strokeWidth={strokeWidth}
                strokeDasharray={dashArray}
                strokeDashoffset={strokeOffset}
                strokeLinecap="round"
                className="transition-all duration-700 ease-out hover:opacity-85"
              >
                <title>{`${item.name}: ${item.value} (${Math.round(percent * 100)}%)`}</title>
              </circle>
            );
          })}
      </svg>

      {/* Thông số ở giữa tâm biểu đồ */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none select-none px-2">
        <span className="text-xl sm:text-2xl font-black text-[#172F55] font-mono leading-none tracking-tight">
          {centerValue}
        </span>
        <span className="text-[10px] sm:text-[11px] font-extrabold text-[#6D84A3] mt-1 uppercase tracking-wider">
          {centerLabel}
        </span>
      </div>
    </div>
  );
}
