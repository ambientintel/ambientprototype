'use client';
import { useEffect, useRef } from 'react';

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

interface Star {
  x: number; y: number;
  vx: number; vy: number;
  size: number;
  bright: boolean;
  pulse: number;
  pulseSpeed: number;
}

function makeStars(W: number, H: number): Star[] {
  return Array.from({ length: 190 }, () => {
    const bright = Math.random() < 0.13;
    return {
      x: Math.random() * W,
      y: Math.random() * H,
      vx: (Math.random() - 0.5) * 0.44,
      vy: (Math.random() - 0.5) * 0.44,
      size: bright ? 1.9 + Math.random() * 0.9 : 0.9 + Math.random() * 0.7,
      bright,
      pulse: Math.random() * Math.PI * 2,
      pulseSpeed: 0.018 + Math.random() * 0.014,
    };
  });
}

export function FlowCanvas({ accent = '#52C0E8', style }: { accent?: string; style?: React.CSSProperties }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const accentRef = useRef(accent);
  accentRef.current = accent;

  useEffect(() => {
    const canvasEl = ref.current;
    if (!canvasEl) return;
    const rawCtx = canvasEl.getContext('2d');
    if (!rawCtx) return;
    const el = canvasEl as HTMLCanvasElement;
    const ctx = rawCtx as CanvasRenderingContext2D;

    let raf = 0;
    let W = 0, H = 0;
    let stars: Star[] = [];

    function resize() {
      W = el.offsetWidth;
      H = el.offsetHeight;
      if (!W || !H) return;
      const dpr = window.devicePixelRatio || 1;
      el.width = W * dpr;
      el.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      stars = makeStars(W, H);
    }

    function draw() {
      ctx.clearRect(0, 0, W, H);
      const [r, g, b] = hexToRgb(accentRef.current);
      const LINK = 130;

      // Move
      for (const s of stars) {
        s.x += s.vx;
        s.y += s.vy;
        if (s.x < -12) s.x = W + 12;
        if (s.x > W + 12) s.x = -12;
        if (s.y < -12) s.y = H + 12;
        if (s.y > H + 12) s.y = -12;
        s.pulse += s.pulseSpeed;
      }

      // Edges
      for (let i = 0; i < stars.length; i++) {
        for (let j = i + 1; j < stars.length; j++) {
          const dx = stars[i].x - stars[j].x;
          const dy = stars[i].y - stars[j].y;
          const d2 = dx * dx + dy * dy;
          if (d2 > LINK * LINK) continue;
          const dist = Math.sqrt(d2);
          const t = 1 - dist / LINK;
          const alpha = t * t * 0.13;
          ctx.beginPath();
          ctx.moveTo(stars[i].x, stars[i].y);
          ctx.lineTo(stars[j].x, stars[j].y);
          ctx.strokeStyle = `rgba(${r},${g},${b},${alpha})`;
          ctx.lineWidth = 0.6 + t * 0.5;
          ctx.stroke();
        }
      }

      // Stars
      for (const s of stars) {
        const pAlpha = s.bright
          ? 0.60 + Math.sin(s.pulse) * 0.22
          : 0.20 + Math.sin(s.pulse) * 0.06;

        if (s.bright) {
          const grd = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.size * 5);
          grd.addColorStop(0, `rgba(${r},${g},${b},${pAlpha * 0.5})`);
          grd.addColorStop(1, `rgba(${r},${g},${b},0)`);
          ctx.beginPath();
          ctx.arc(s.x, s.y, s.size * 5, 0, Math.PI * 2);
          ctx.fillStyle = grd;
          ctx.fill();
        }

        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${r},${g},${b},${pAlpha})`;
        ctx.fill();
      }

      raf = requestAnimationFrame(draw);
    }

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(el);
    draw();

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, []);

  return (
    <canvas
      ref={ref}
      style={{
        position: 'absolute', inset: 0, width: '100%', height: '100%',
        pointerEvents: 'none', display: 'block', ...style,
      }}
    />
  );
}
