/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef } from 'react';

interface Petal {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  // Xoay 3D tạo cảm giác cánh hoa lật trong gió
  rotX: number;
  rotY: number;
  rotZ: number;
  rotSpeedX: number;
  rotSpeedY: number;
  rotSpeedZ: number;
  swayFreq: number;
  swayAmp: number;
  swayPhase: number;
  wind: number;
  color: string;
  type: 'petal' | 'rose' | 'sparkle';
  alpha: number;
  layer: number; // 0: nền xa, 1: trung cảnh, 2: cận cảnh
}

interface FallingFlowersCanvasProps {
  active: boolean;
}

export const FallingFlowersCanvas: React.FC<FallingFlowersCanvasProps> = ({ active }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const petalsRef = useRef<Petal[]>([]);
  const animFrameRef = useRef<number | null>(null);
  const hasInitializedRef = useRef<boolean>(false);

  useEffect(() => {
    if (!active) {
      hasInitializedRef.current = false;
      petalsRef.current = [];
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    const petalColors = [
      '#FFB7C5', // Hồng pastel
      '#FF8DA1', // Hồng thắm
      '#FFAAA6', // Hồng đào
      '#FFC2D1', // Hồng phấn
      '#FFE6A7', // Vàng champagne
      '#FFF0F5', // Trắng hồng
      '#C8B6FF', // Tím lavender
    ];

    // Khởi tạo một cánh hoa mới phân bổ đều trên chiều rộng màn hình
    const createPetal = (
      initialX?: number,
      initialY?: number,
      isBurst: boolean = false
    ): Petal => {
      const layer = Math.random() < 0.25 ? 0 : Math.random() < 0.75 ? 1 : 2;
      const baseSize = layer === 0 ? 9 : layer === 1 ? 14 : 19;
      const size = baseSize + (Math.random() - 0.5) * 5;

      const x = initialX !== undefined ? initialX : Math.random() * width;
      const y = initialY !== undefined ? initialY : -20 - Math.random() * 40;

      let vx = (Math.random() - 0.5) * 1.2;
      let vy = 1.2 + Math.random() * 1.8;

      if (isBurst) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 2.5 + Math.random() * 6.0;
        vx = Math.cos(angle) * speed;
        vy = Math.sin(angle) * speed - 2.5;
      }

      const isRose = Math.random() < 0.22;
      const isSparkle = Math.random() < 0.18;

      return {
        x,
        y,
        vx,
        vy,
        size,
        rotX: Math.random() * Math.PI * 2,
        rotY: Math.random() * Math.PI * 2,
        rotZ: Math.random() * Math.PI * 2,
        rotSpeedX: 0.015 + Math.random() * 0.025,
        rotSpeedY: 0.02 + Math.random() * 0.03,
        rotSpeedZ: 0.01 + Math.random() * 0.02,
        swayFreq: 0.018 + Math.random() * 0.024,
        swayAmp: 1.2 + Math.random() * 2.2,
        swayPhase: Math.random() * Math.PI * 2,
        wind: (Math.random() - 0.45) * 0.35,
        color: petalColors[Math.floor(Math.random() * petalColors.length)],
        type: isRose ? 'rose' : isSparkle ? 'sparkle' : 'petal',
        alpha: layer === 0 ? 0.65 : layer === 1 ? 0.88 : 0.95,
        layer,
      };
    };

    // Khởi tạo phân bổ đều khắp màn hình
    if (!hasInitializedRef.current) {
      hasInitializedRef.current = true;
      const initialPetals: Petal[] = [];

      // 1. Nhóm bùng nổ hoa từ vùng thẻ (tỏa ra đều)
      const burstCount = 45;
      for (let i = 0; i < burstCount; i++) {
        const startX = width * 0.2 + Math.random() * width * 0.6;
        const startY = height * 0.35 + Math.random() * height * 0.3;
        initialPetals.push(createPetal(startX, startY, true));
      }

      // 2. Nhóm phân bổ đều toàn màn hình ngay từ đầu để không bị trống
      const screenCount = 45;
      for (let i = 0; i < screenCount; i++) {
        const x = Math.random() * width;
        const y = Math.random() * height;
        initialPetals.push(createPetal(x, y, false));
      }

      petalsRef.current = initialPetals;
    }

    let time = 0;

    // Vẽ hình dáng một cánh hoa hồng uốn lượn mềm mại
    const drawPetalShape = (c: CanvasRenderingContext2D, size: number, color: string) => {
      c.fillStyle = color;
      c.beginPath();
      c.moveTo(0, -size);
      c.bezierCurveTo(size * 0.75, -size * 0.75, size * 0.85, size * 0.4, 0, size);
      c.bezierCurveTo(-size * 0.85, size * 0.4, -size * 0.75, -size * 0.75, 0, -size);
      c.closePath();
      c.fill();

      // Gân cánh hoa mờ dịu
      c.strokeStyle = 'rgba(255, 255, 255, 0.45)';
      c.lineWidth = 1;
      c.beginPath();
      c.moveTo(0, -size * 0.65);
      c.lineTo(0, size * 0.65);
      c.stroke();
    };

    // Vẽ đóa hoa hồng nhỏ xinh xắn
    const drawRoseShape = (c: CanvasRenderingContext2D, size: number, color: string) => {
      c.fillStyle = color;
      c.beginPath();
      c.arc(0, 0, size * 0.55, 0, Math.PI * 2);
      c.fill();

      c.strokeStyle = '#FFFFFF';
      c.lineWidth = 1.4;
      c.beginPath();
      c.arc(0, 0, size * 0.38, 0.2, Math.PI * 1.6);
      c.stroke();

      c.beginPath();
      c.arc(0, 0, size * 0.22, Math.PI * 0.8, Math.PI * 2.4);
      c.stroke();

      c.fillStyle = '#FFE6A7';
      c.beginPath();
      c.arc(0, 0, size * 0.1, 0, Math.PI * 2);
      c.fill();
    };

    const render = () => {
      ctx.clearRect(0, 0, width, height);
      time += 0.035;

      const pts = petalsRef.current;

      // Sinh đều đặn cánh hoa mới từ trên mép màn hình, phân bổ đều theo 10 phân vùng X
      if (pts.length < 80 && Math.random() < 0.4) {
        const zone = Math.floor(Math.random() * 10);
        const spawnX = (zone / 10) * width + Math.random() * (width / 10);
        pts.push(createPetal(spawnX, -25, false));
      }

      for (let i = 0; i < pts.length; i++) {
        const p = pts[i];

        // Lực hấp dẫn tự nhiên và cản gió
        p.vy += 0.025;
        p.vx *= 0.98;
        p.vy *= 0.985;

        // Giới hạn tốc độ rơi tùy theo lớp độ sâu
        const maxVy = p.layer === 0 ? 1.4 : p.layer === 1 ? 2.1 : 2.7;
        if (p.vy > maxVy) p.vy = maxVy;

        // Chao liệng hình sin tự nhiên
        const sway = Math.sin(time * 0.8 + p.swayPhase) * p.swayAmp;
        p.x += p.vx + sway + p.wind;
        p.y += p.vy;

        // Cập nhật góc quay 3D
        p.rotX += p.rotSpeedX;
        p.rotY += p.rotSpeedY;
        p.rotZ += p.rotSpeedZ;

        // Hiệu ứng lật cánh hoa trong không gian 3D (Scale theo cos của góc xoay)
        const scaleX = Math.cos(p.rotX);
        const scaleY = Math.sin(p.rotY) * 0.8 + 0.2;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotZ);
        ctx.scale(Math.abs(scaleX) > 0.15 ? scaleX : 0.15, scaleY);
        ctx.globalAlpha = p.alpha;

        if (p.type === 'rose') {
          drawRoseShape(ctx, p.size, p.color);
        } else if (p.type === 'sparkle') {
          // Bụi phấn vàng champagne
          ctx.fillStyle = '#FFE6A7';
          ctx.beginPath();
          ctx.arc(0, 0, p.size * 0.45, 0, Math.PI * 2);
          ctx.fill();
        } else {
          drawPetalShape(ctx, p.size, p.color);
        }

        ctx.restore();

        // Tái sinh đều khi rơi qua đáy màn hình
        if (p.y > height + 35) {
          p.y = -25;
          p.x = Math.random() * width;
          p.vy = 1.1 + Math.random() * 1.6;
          p.vx = (Math.random() - 0.5) * 1.2;
        }
      }

      animFrameRef.current = requestAnimationFrame(render);
    };

    animFrameRef.current = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [active]);

  if (!active) return null;

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-30 w-full h-full"
      style={{ touchAction: 'none' }}
    />
  );
};
