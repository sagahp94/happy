/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

interface RoseVineBorderProps {
  progress: number; // 0 to 1
  layer: 'front' | 'back';
}

export const RoseVineBorder: React.FC<RoseVineBorderProps> = ({ progress, layer }) => {
  // Chu vi chuẩn của hình chữ nhật bo góc viewBox 400x520 với rx=26
  // Chu vi xấp xỉ: 2*(348 + 468) + 2*PI*26 = 1632 + 163.3 = ~1795
  const perimeter = 1795;
  const dashOffset = perimeter * (1 - Math.min(1, Math.max(0, progress)));

  // Danh sách các bông hồng nở rộ rải đều xung quanh 4 cạnh thẻ (top, right, bottom, left)
  const rosesAround = [
    { p: 0.05, x: 100, y: 12, rot: 15, scale: 0.9 },
    { p: 0.15, x: 260, y: 12, rot: -10, scale: 1.0 },
    { p: 0.25, x: 388, y: 65, rot: 45, scale: 1.05 },
    { p: 0.35, x: 388, y: 200, rot: 90, scale: 1.1 },
    { p: 0.45, x: 388, y: 380, rot: 105, scale: 1.0 },
    { p: 0.55, x: 320, y: 508, rot: 150, scale: 1.15 },
    { p: 0.65, x: 180, y: 508, rot: 180, scale: 1.0 },
    { p: 0.75, x: 50, y: 508, rot: 210, scale: 1.05 },
    { p: 0.83, x: 12, y: 410, rot: 250, scale: 1.1 },
    { p: 0.91, x: 12, y: 240, rot: 275, scale: 1.0 },
    { p: 0.97, x: 12, y: 90, rot: -30, scale: 1.15 },
  ];

  // Danh sách các chiếc lá xanh đan xen xung quanh
  const leavesAround = [
    { p: 0.02, x: 50, y: 12, rot: -20 },
    { p: 0.10, x: 180, y: 12, rot: 15 },
    { p: 0.20, x: 340, y: 18, rot: 35 },
    { p: 0.30, x: 388, y: 120, rot: 75 },
    { p: 0.40, x: 388, y: 290, rot: 95 },
    { p: 0.50, x: 370, y: 470, rot: 130 },
    { p: 0.60, x: 250, y: 508, rot: 170 },
    { p: 0.70, x: 110, y: 508, rot: 195 },
    { p: 0.80, x: 12, y: 470, rot: 230 },
    { p: 0.87, x: 12, y: 320, rot: 260 },
    { p: 0.95, x: 12, y: 150, rot: 285 },
  ];

  return (
    <div
      className={`absolute inset-0 pointer-events-none overflow-visible ${
        layer === 'front' ? 'z-20' : 'z-0'
      }`}
    >
      <svg
        viewBox="0 0 400 520"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full overflow-visible"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="vineGradFront" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#7EAA76" />
            <stop offset="50%" stopColor="#95C08D" />
            <stop offset="100%" stopColor="#6C9E64" />
          </linearGradient>

          <linearGradient id="vineGradBack" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#8FBA87" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#729E6A" stopOpacity="0.6" />
          </linearGradient>

          <radialGradient id="roseGradient" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FFF0F3" />
            <stop offset="35%" stopColor="#FFB7C5" />
            <stop offset="80%" stopColor="#FF8DA1" />
            <stop offset="100%" stopColor="#C8B6FF" />
          </radialGradient>

          <radialGradient id="goldCenter" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FFF9E6" />
            <stop offset="100%" stopColor="#FFE6A7" />
          </radialGradient>
        </defs>

        {/* ======================= MẶT SAU (LAYER: BACK) ======================= */}
        {layer === 'back' && (
          <g opacity="0.8" style={{ filter: 'blur(0.5px)' }}>
            <rect
              x="14"
              y="14"
              width="372"
              height="492"
              rx="24"
              stroke="url(#vineGradBack)"
              strokeWidth="3.2"
              strokeDasharray={perimeter}
              strokeDashoffset={perimeter * (1 - progress)}
              strokeLinecap="round"
            />
          </g>
        )}

        {/* ======================= MẶT TRƯỚC (LAYER: FRONT) ======================= */}
        {layer === 'front' && (
          <g style={{ filter: 'drop-shadow(0 2px 5px rgba(110, 150, 105, 0.35))' }}>
            {/* Dây leo chính chạy xung quanh khung thẻ theo tiến trình gõ chữ */}
            <rect
              x="12"
              y="12"
              width="376"
              height="496"
              rx="26"
              stroke="url(#vineGradFront)"
              strokeWidth="3.5"
              strokeDasharray={perimeter}
              strokeDashoffset={dashOffset}
              strokeLinecap="round"
              style={{ transition: 'stroke-dashoffset 0.12s linear' }}
            />

            {/* Dây leo thứ cấp uốn lượn mỏng */}
            <rect
              x="15"
              y="15"
              width="370"
              height="490"
              rx="23"
              stroke="rgba(149, 192, 141, 0.5)"
              strokeWidth="1.2"
              strokeDasharray={perimeter}
              strokeDashoffset={dashOffset + 35}
              strokeLinecap="round"
              style={{ transition: 'stroke-dashoffset 0.12s linear' }}
            />

            {/* Các chiếc lá xanh nở dọc theo dây leo */}
            {leavesAround.map((leaf, i) => {
              if (progress < leaf.p) return null;
              return (
                <g
                  key={`leaf-${i}`}
                  transform={`translate(${leaf.x}, ${leaf.y}) rotate(${leaf.rot})`}
                  style={{ animation: 'leafPop 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)' }}
                >
                  <path
                    d="M0 0 C6 -8, 16 -6, 20 0 C16 6, 6 8, 0 0 Z"
                    fill="#88B880"
                    stroke="#5F8C58"
                    strokeWidth="0.8"
                  />
                  <path d="M0 0 L14 0" stroke="#BCE8B4" strokeWidth="0.6" />
                </g>
              );
            })}

            {/* Rất nhiều bông hồng nở rộ dọc theo dây leo xung quanh thẻ */}
            {rosesAround.map((rose, i) => {
              if (progress < rose.p) return null;
              return (
                <g
                  key={`rose-${i}`}
                  transform={`translate(${rose.x}, ${rose.y}) scale(${rose.scale}) rotate(${rose.rot})`}
                  style={{ animation: 'roseBloom 0.45s cubic-bezier(0.34, 1.56, 0.64, 1)' }}
                >
                  <circle cx="0" cy="0" r="9.5" fill="url(#roseGradient)" />
                  <path
                    d="M-6 -4 C-3 -9, 3 -9, 6 -4 C8 1, 4 7, 0 7 C-4 7, -8 1, -6 -4 Z"
                    fill="#FFB7C5"
                    opacity="0.95"
                  />
                  <path
                    d="M-3 -2 C-1 -5, 2 -5, 4 -2 C5 1, 2 4, -1 3 C-3 2, -4 0, -3 -2"
                    stroke="#FFFFFF"
                    strokeWidth="1.2"
                    strokeLinecap="round"
                    fill="none"
                  />
                  <circle cx="0" cy="0" r="2.2" fill="url(#goldCenter)" />
                </g>
              );
            })}
          </g>
        )}
      </svg>
    </div>
  );
};
