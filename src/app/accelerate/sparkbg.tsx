'use client';
import { useEffect, useRef } from 'react';

// Three pulse origins: center, lower-left, upper-right
const SOURCES = [
  { cx: 0.50, cy: 0.46, color: [79,  156, 249] as [number, number, number] },
  { cx: 0.18, cy: 0.72, color: [63,  204, 145] as [number, number, number] },
  { cx: 0.82, cy: 0.24, color: [130, 100, 240] as [number, number, number] },
];

const RINGS     = 5;    // staggered rings per source
const MAX_ALPHA = 0.14; // very subtle — clinical restraint
const GRID_STEP = 64;   // px between grid lines

export function SparkCanvas({ style }: { style?: React.CSSProperties }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const rawCtx = canvas.getContext('2d');
    if (!rawCtx) return;
    const ctx = rawCtx as CanvasRenderingContext2D;

    let raf = 0;
    let W = 0, H = 0;
    let t = 0;

    function resize() {
      W = canvas!.offsetWidth;
      H = canvas!.offsetHeight;
      if (!W || !H) return;
      const dpr = window.devicePixelRatio || 1;
      canvas!.width  = W * dpr;
      canvas!.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function draw() {
      ctx.clearRect(0, 0, W, H);

      // ── Fine grid ─────────────────────────────────────────────────────────
      ctx.lineWidth = 0.5;
      for (let x = 0; x <= W; x += GRID_STEP) {
        ctx.strokeStyle = 'rgba(79,156,249,0.045)';
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
      }
      for (let y = 0; y <= H; y += GRID_STEP) {
        ctx.strokeStyle = 'rgba(79,156,249,0.045)';
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
      }

      // ── Slow sonar rings ──────────────────────────────────────────────────
      t += 0.003; // very slow tick

      for (const src of SOURCES) {
        const sx = src.cx * W;
        const sy = src.cy * H;
        const maxR = Math.hypot(W, H) * 0.55;
        const [r, g, b] = src.color;

        for (let i = 0; i < RINGS; i++) {
          const phase    = (i / RINGS);
          const progress = ((t * 0.12 + phase) % 1); // full cycle ~83 s at this tick
          const radius   = progress * maxR;

          // Bell-shaped alpha: rises quickly, falls slowly toward edges
          const fadeIn  = Math.min(progress * 6, 1);
          const fadeOut = Math.pow(1 - progress, 1.4);
          const alpha   = fadeIn * fadeOut * MAX_ALPHA;
          if (alpha < 0.003) continue;

          ctx.beginPath();
          ctx.arc(sx, sy, radius, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(${r},${g},${b},${alpha.toFixed(3)})`;
          ctx.lineWidth   = 0.8 + (1 - progress) * 0.8;
          ctx.stroke();
        }

        // Dot at origin — faint cross-hair target
        const dotAlpha = 0.22 + Math.sin(t * 2 + src.cx * 10) * 0.06;
        ctx.beginPath();
        ctx.arc(sx, sy, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${r},${g},${b},${dotAlpha.toFixed(2)})`;
        ctx.fill();

        ctx.strokeStyle = `rgba(${r},${g},${b},0.10)`;
        ctx.lineWidth = 0.5;
        const arm = 12;
        ctx.beginPath(); ctx.moveTo(sx - arm, sy); ctx.lineTo(sx + arm, sy); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(sx, sy - arm); ctx.lineTo(sx, sy + arm); ctx.stroke();
      }

      raf = requestAnimationFrame(draw);
    }

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    draw();

    return () => { cancelAnimationFrame(raf); ro.disconnect(); };
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
