/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef } from 'react';

export type AppState =
  | 'idle'
  | 'submitting'
  | 'shrinking'
  | 'flying'
  | 'networkActivating'
  | 'flowerMorphing'
  | 'flowerBlooming'
  | 'cardMorphing'
  | 'wishRevealing'
  | 'completed'
  | 'resetting';

interface Particle {
  id: number;
  x: number;
  y: number;
  origX: number;
  origY: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  targetX: number;
  targetY: number;
  alpha: number;
  targetAlpha: number;
  swayPhase: number;
}

interface MagicalBloomCanvasProps {
  appState: AppState;
  onAnimationPhaseComplete?: (phase: AppState) => void;
}

export const MagicalBloomCanvas: React.FC<MagicalBloomCanvasProps> = ({
  appState,
  onAnimationPhaseComplete,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animFrameRef = useRef<number | null>(null);
  const phaseTimerRef = useRef<number | null>(null);

  // Hạt sáng bay từ thẻ vào mạng lưới
  const flyingParticleRef = useRef<{
    active: boolean;
    startX: number;
    startY: number;
    ctrlX: number;
    ctrlY: number;
    endX: number;
    endY: number;
    progress: number;
    trail: { x: number; y: number; alpha: number; r: number }[];
  }>({
    active: false,
    startX: 0,
    startY: 0,
    ctrlX: 0,
    ctrlY: 0,
    endX: 0,
    endY: 0,
    progress: 0,
    trail: [],
  });

  // Hiệu ứng sóng kích hoạt (gợn sóng tròn mềm mại)
  const rippleRef = useRef<{
    radius: number;
    maxRadius: number;
    alpha: number;
    active: boolean;
  }>({
    radius: 0,
    maxRadius: 250,
    alpha: 0,
    active: false,
  });

  const bloomRotationRef = useRef<number>(0);

  // Bảng màu pastel nhẹ nhàng
  const colors = [
    'rgba(255, 183, 197, ', // Hồng pastel #FFB7C5
    'rgba(200, 182, 255, ', // Tím lavender #C8B6FF
    'rgba(255, 230, 167, ', // Vàng champagne #FFE6A7
    'rgba(184, 231, 255, ', // Xanh baby blue #B8E7FF
  ];

  // Khởi tạo các đốm sáng mềm mại (bokeh và hạt lấp lánh)
  const initParticles = (width: number, height: number) => {
    const count = 46;
    const pts: Particle[] = [];
    for (let i = 0; i < count; i++) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      const colorPrefix = colors[i % colors.length];
      pts.push({
        id: i,
        x,
        y,
        origX: x,
        origY: y,
        vx: (Math.random() - 0.5) * 0.35,
        vy: (Math.random() - 0.5) * 0.35,
        radius: 2.2 + Math.random() * 2.5,
        color: colorPrefix,
        targetX: x,
        targetY: y,
        alpha: 0.5 + Math.random() * 0.4,
        targetAlpha: 0.65,
        swayPhase: Math.random() * Math.PI * 2,
      });
    }
    particlesRef.current = pts;
  };

  // Tính toán tọa độ 5 cánh hoa mềm mại, uốn lượn tự nhiên
  const computeFlowerTargets = (width: number, height: number, flowerRadius: number) => {
    const centerX = width / 2;
    const centerY = height / 2;
    const pts = particlesRef.current;
    if (pts.length === 0) return;

    // Nhụy hoa trung tâm (hình tròn mềm mại)
    const centerCount = 10;
    for (let i = 0; i < centerCount; i++) {
      const angle = (i / centerCount) * Math.PI * 2;
      const r = flowerRadius * 0.15 * (0.5 + 0.5 * (i % 2));
      pts[i].targetX = centerX + Math.cos(angle) * r;
      pts[i].targetY = centerY + Math.sin(angle) * r;
      pts[i].targetAlpha = 0.95;
    }

    // Các cánh hoa 5 cánh uốn cong mượt mà
    const petalParticles = pts.length - centerCount;
    for (let i = centerCount; i < pts.length; i++) {
      const idx = i - centerCount;
      const theta = (idx / petalParticles) * Math.PI * 2 - Math.PI / 2;
      const petalShape = Math.abs(Math.cos((5 * theta) / 2));
      // Bán kính cánh hoa theo đường cong cánh hoa tròn mịn
      const r = flowerRadius * (0.35 + 0.65 * Math.pow(petalShape, 1.4));
      pts[i].targetX = centerX + Math.cos(theta) * r;
      pts[i].targetY = centerY + Math.sin(theta) * r;
      pts[i].targetAlpha = 0.85;
    }
  };

  // Tính toán tọa độ viền thẻ Glassmorphism hình chữ nhật bo góc
  const computeCardTargets = (width: number, height: number) => {
    const centerX = width / 2;
    const centerY = height / 2;
    const cardWidth = Math.min(width - 48, 380);
    const cardHeight = Math.min(height - 180, 520);
    const halfW = cardWidth / 2;
    const halfH = cardHeight / 2;

    const pts = particlesRef.current;
    if (pts.length === 0) return;

    const perimeter = 2 * (cardWidth + cardHeight);
    for (let i = 0; i < pts.length; i++) {
      const dist = (i / pts.length) * perimeter;
      let tx = centerX;
      let ty = centerY;

      if (dist < cardWidth) {
        tx = centerX - halfW + dist;
        ty = centerY - halfH;
      } else if (dist < cardWidth + cardHeight) {
        tx = centerX + halfW;
        ty = centerY - halfH + (dist - cardWidth);
      } else if (dist < 2 * cardWidth + cardHeight) {
        tx = centerX + halfW - (dist - (cardWidth + cardHeight));
        ty = centerY + halfH;
      } else {
        tx = centerX - halfW;
        ty = centerY + halfH - (dist - (2 * cardWidth + cardHeight));
      }

      pts[i].targetX = tx;
      pts[i].targetY = ty;
      pts[i].targetAlpha = 0.55;
    }
  };

  useEffect(() => {
    if (!canvasRef.current) return;
    const { width, height } = canvasRef.current;

    if (phaseTimerRef.current) {
      clearTimeout(phaseTimerRef.current);
      phaseTimerRef.current = null;
    }

    if (appState === 'idle') {
      particlesRef.current.forEach((p) => {
        p.targetX = p.origX;
        p.targetY = p.origY;
        p.targetAlpha = 0.6;
      });
    }

    if (appState === 'shrinking') {
      phaseTimerRef.current = window.setTimeout(() => {
        onAnimationPhaseComplete?.('flying');
      }, 700);
    }

    if (appState === 'flying') {
      flyingParticleRef.current = {
        active: true,
        startX: width / 2,
        startY: height * 0.58,
        ctrlX: width * 0.35,
        ctrlY: height * 0.44,
        endX: width / 2,
        endY: height / 2,
        progress: 0,
        trail: [],
      };

      phaseTimerRef.current = window.setTimeout(() => {
        flyingParticleRef.current.active = false;
        onAnimationPhaseComplete?.('networkActivating');
      }, 850);
    }

    if (appState === 'networkActivating') {
      rippleRef.current = {
        active: true,
        radius: 0,
        maxRadius: Math.max(width, height) * 0.42,
        alpha: 0.85,
      };

      phaseTimerRef.current = window.setTimeout(() => {
        rippleRef.current.active = false;
        onAnimationPhaseComplete?.('flowerMorphing');
      }, 650);
    }

    if (appState === 'flowerMorphing') {
      const flowerR = Math.min(width, height) * 0.24;
      computeFlowerTargets(width, height, flowerR);

      phaseTimerRef.current = window.setTimeout(() => {
        onAnimationPhaseComplete?.('flowerBlooming');
      }, 1200);
    }

    if (appState === 'flowerBlooming') {
      const flowerR = Math.min(width, height) * 0.35;
      computeFlowerTargets(width, height, flowerR);

      phaseTimerRef.current = window.setTimeout(() => {
        onAnimationPhaseComplete?.('cardMorphing');
      }, 950);
    }

    if (appState === 'cardMorphing') {
      computeCardTargets(width, height);

      phaseTimerRef.current = window.setTimeout(() => {
        onAnimationPhaseComplete?.('wishRevealing');
      }, 850);
    }

    if (appState === 'wishRevealing') {
      phaseTimerRef.current = window.setTimeout(() => {
        onAnimationPhaseComplete?.('completed');
      }, 400);
    }

    if (appState === 'resetting') {
      particlesRef.current.forEach((p) => {
        p.targetX = p.origX;
        p.targetY = p.origY;
        p.targetAlpha = 0.55;
      });
      flyingParticleRef.current.active = false;
      rippleRef.current.active = false;

      phaseTimerRef.current = window.setTimeout(() => {
        onAnimationPhaseComplete?.('idle');
      }, 600);
    }

    return () => {
      if (phaseTimerRef.current) {
        clearTimeout(phaseTimerRef.current);
      }
    };
  }, [appState, onAnimationPhaseComplete]);

  // Main Canvas Render Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    initParticles(width, height);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      if (appState === 'flowerMorphing' || appState === 'flowerBlooming') {
        const flowerR = Math.min(width, height) * (appState === 'flowerBlooming' ? 0.35 : 0.24);
        computeFlowerTargets(width, height, flowerR);
      } else if (appState === 'cardMorphing' || appState === 'completed' || appState === 'wishRevealing') {
        computeCardTargets(width, height);
      }
    };

    window.addEventListener('resize', handleResize);

    let frameCount = 0;

    const render = () => {
      ctx.clearRect(0, 0, width, height);
      frameCount++;

      const pts = particlesRef.current;
      const isMorphingActive =
        appState === 'flowerMorphing' ||
        appState === 'flowerBlooming' ||
        appState === 'cardMorphing' ||
        appState === 'wishRevealing' ||
        appState === 'completed';

      // 1. Cập nhật vị trí hạt
      for (let i = 0; i < pts.length; i++) {
        const p = pts[i];

        if (isMorphingActive) {
          const lerpFactor = appState === 'flowerBlooming' ? 0.08 : 0.06;
          p.x += (p.targetX - p.x) * lerpFactor;
          p.y += (p.targetY - p.y) * lerpFactor;
          p.alpha += (p.targetAlpha - p.alpha) * 0.05;
        } else {
          p.x += p.vx;
          p.y += p.vy;

          if (p.x < 15) { p.x = 15; p.vx *= -1; }
          if (p.x > width - 15) { p.x = width - 15; p.vx *= -1; }
          if (p.y < 15) { p.y = 15; p.vy *= -1; }
          if (p.y > height - 15) { p.y = height - 15; p.vy *= -1; }

          p.vx += (p.origX - p.x) * 0.0002;
          p.vy += (p.origY - p.y) * 0.0002;
        }
      }

      // 2. VẼ ĐƯỜNG LIÊN KẾT MỀM MẠI (LOẠI BỎ HOÀN TOÀN HÌNH TAM GIÁC CỨNG)
      // Thay vì vẽ các đoạn thẳng nối tam giác đa giác, ta vẽ các sợi tơ ánh sáng uốn lượn cong mềm (Bezier)
      if (appState !== 'cardMorphing' && appState !== 'wishRevealing' && appState !== 'completed') {
        const maxDist = isMorphingActive ? 65 : 85;

        // Chỉ kết nối theo chuỗi tơ ánh sáng mềm, không tạo mạng lưới tam giác khép kín
        for (let i = 0; i < pts.length; i++) {
          // Chỉ chọn tối đa 1 hoặc 2 điểm gần nhất để tạo nhánh tự nhiên (cây/hoa) thay vì tam giác
          let connected = 0;
          for (let j = i + 1; j < pts.length; j++) {
            if (connected >= 2) break;

            const dx = pts[i].x - pts[j].x;
            const dy = pts[i].y - pts[j].y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < maxDist) {
              connected++;
              const lineAlpha = (1 - dist / maxDist) * 0.3 * Math.min(pts[i].alpha, pts[j].alpha);
              ctx.strokeStyle = `rgba(200, 182, 255, ${lineAlpha})`;
              ctx.lineWidth = 1.2;

              // Uốn cong nhẹ nhàng tại trung điểm bằng quadraticCurveTo (không dùng đường thẳng gấp khúc)
              const midX = (pts[i].x + pts[j].x) / 2;
              const midY = (pts[i].y + pts[j].y) / 2;
              // Độ võng tự nhiên theo hàm sin
              const curveOffset = Math.sin(frameCount * 0.02 + i) * 6;
              const ctrlX = midX + (dy / dist) * curveOffset;
              const ctrlY = midY - (dx / dist) * curveOffset;

              ctx.beginPath();
              ctx.moveTo(pts[i].x, pts[i].y);
              ctx.quadraticCurveTo(ctrlX, ctrlY, pts[j].x, pts[j].y);
              ctx.stroke();
            }
          }
        }
      }

      // 3. VẼ BÔNG HOA NỞ BẰNG ĐƯỜNG CONG CÁNH HOA MỀM MẠI (KHÔNG CẮT ĐA GIÁC)
      if (appState === 'flowerMorphing' || appState === 'flowerBlooming') {
        bloomRotationRef.current += 0.0018;
        ctx.save();
        ctx.translate(width / 2, height / 2);
        ctx.rotate(bloomRotationRef.current);
        ctx.translate(-width / 2, -height / 2);

        // Nối các hạt bằng đường cong Bezier mềm mại (Spline mượt mà)
        if (pts.length > 15) {
          ctx.strokeStyle = 'rgba(255, 183, 197, 0.5)';
          ctx.lineWidth = 2.2;
          ctx.fillStyle = 'rgba(255, 230, 167, 0.14)';
          ctx.beginPath();

          const flowerPts = pts.slice(10);
          for (let k = 0; k < flowerPts.length; k++) {
            const p1 = flowerPts[k];
            const p2 = flowerPts[(k + 1) % flowerPts.length];
            const midX = (p1.x + p2.x) / 2;
            const midY = (p1.y + p2.y) / 2;

            if (k === 0) {
              ctx.moveTo(midX, midY);
            } else {
              ctx.quadraticCurveTo(p1.x, p1.y, midX, midY);
            }
          }
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
        }

        // Nhụy hoa tròn phát sáng ấm áp
        const nhuyGrad = ctx.createRadialGradient(
          width / 2,
          height / 2,
          2,
          width / 2,
          height / 2,
          45
        );
        nhuyGrad.addColorStop(0, 'rgba(255, 230, 167, 0.85)');
        nhuyGrad.addColorStop(0.5, 'rgba(255, 183, 197, 0.45)');
        nhuyGrad.addColorStop(1, 'rgba(255, 183, 197, 0)');
        ctx.fillStyle = nhuyGrad;
        ctx.beginPath();
        ctx.arc(width / 2, height / 2, 45, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
      }

      // 4. Vẽ các đốm sáng tròn bokeh mềm mại
      for (let i = 0; i < pts.length; i++) {
        const p = pts[i];
        // Điểm sáng chính
        ctx.fillStyle = `${p.color}${p.alpha})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();

        // Hào quang mờ xung quanh (Bokeh tròn dịu mát)
        ctx.fillStyle = `${p.color}${p.alpha * 0.25})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius * 2.5, 0, Math.PI * 2);
        ctx.fill();
      }

      // 5. Vẽ hạt sáng bay (flying)
      if (flyingParticleRef.current.active) {
        const fp = flyingParticleRef.current;
        fp.progress += 0.022;
        if (fp.progress > 1) fp.progress = 1;

        const t = fp.progress;
        const curX =
          (1 - t) * (1 - t) * fp.startX +
          2 * (1 - t) * t * fp.ctrlX +
          t * t * fp.endX;
        const curY =
          (1 - t) * (1 - t) * fp.startY +
          2 * (1 - t) * t * fp.ctrlY +
          t * t * fp.endY;

        fp.trail.push({ x: curX, y: curY, alpha: 0.9, r: 4 });
        if (fp.trail.length > 20) fp.trail.shift();

        // Đuôi sáng hạt tròn mềm
        for (let k = 0; k < fp.trail.length; k++) {
          const pt = fp.trail[k];
          pt.alpha *= 0.92;
          ctx.fillStyle = `rgba(255, 230, 167, ${pt.alpha})`;
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, 2.5 * (k / fp.trail.length), 0, Math.PI * 2);
          ctx.fill();
        }

        const flyGrad = ctx.createRadialGradient(curX, curY, 0, curX, curY, 15);
        flyGrad.addColorStop(0, '#FFFFFF');
        flyGrad.addColorStop(0.35, '#FFE6A7');
        flyGrad.addColorStop(0.75, '#FFB7C5');
        flyGrad.addColorStop(1, 'rgba(255, 183, 197, 0)');
        ctx.fillStyle = flyGrad;
        ctx.beginPath();
        ctx.arc(curX, curY, 15, 0, Math.PI * 2);
        ctx.fill();
      }

      // 6. Sóng ánh sáng kích hoạt hình tròn mở rộng
      if (rippleRef.current.active) {
        const rip = rippleRef.current;
        rip.radius += 5.5;
        rip.alpha *= 0.95;

        ctx.strokeStyle = `rgba(200, 182, 255, ${rip.alpha * 0.7})`;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(width / 2, height / 2, rip.radius, 0, Math.PI * 2);
        ctx.stroke();
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
  }, [appState]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-10 w-full h-full"
      style={{ touchAction: 'none' }}
    />
  );
};
