'use client';
import { useEffect, useRef } from 'react';

interface Node { x: number; y: number }
interface Spark { edgeIdx: number; t: number; speed: number; warm: boolean }

function lcg(seed: number) {
  let s = seed;
  return () => { s = (Math.imul(1664525, s) + 1013904223) | 0; return (s >>> 0) / 4294967295; };
}

export function NetworkCanvas({ style }: { style?: React.CSSProperties }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvasEl = ref.current;
    if (!canvasEl) return;
    const rawCtx = canvasEl.getContext('2d');
    if (!rawCtx) return;
    // Alias as non-nullable for use inside closures
    const el = canvasEl as HTMLCanvasElement;
    const ctx = rawCtx as CanvasRenderingContext2D;

    let raf = 0;
    let nodes: Node[] = [];
    let edges: [number, number][] = [];
    let sparks: Spark[] = [];

    function init(w: number, h: number) {
      const rng = lcg(7);
      const N = 34;
      nodes = Array.from({ length: N }, () => ({ x: rng() * w, y: rng() * h }));
      edges = [];
      const threshold = Math.hypot(w, h) * 0.30;
      for (let i = 0; i < N; i++) {
        for (let j = i + 1; j < N; j++) {
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          if (dx * dx + dy * dy < threshold * threshold) edges.push([i, j]);
        }
      }
      sparks = Array.from({ length: 28 }, (_, k) => ({
        edgeIdx: Math.floor(rng() * edges.length),
        t: rng(),
        speed: 0.0005 + rng() * 0.0009,
        warm: k % 4 === 0,
      }));
    }

    function resize() {
      const w = el.offsetWidth;
      const h = el.offsetHeight;
      if (!w || !h) return;
      const dpr = window.devicePixelRatio || 1;
      el.width = w * dpr;
      el.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      init(w, h);
    }

    function draw() {
      const w = el.offsetWidth;
      const h = el.offsetHeight;
      ctx.clearRect(0, 0, w, h);

      // Backbone edges
      ctx.lineWidth = 0.6;
      ctx.strokeStyle = 'rgba(82,192,232,0.05)';
      for (const [a, b] of edges) {
        ctx.beginPath();
        ctx.moveTo(nodes[a].x, nodes[a].y);
        ctx.lineTo(nodes[b].x, nodes[b].y);
        ctx.stroke();
      }

      // Nodes
      for (const n of nodes) {
        ctx.beginPath();
        ctx.arc(n.x, n.y, 1.0, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(82,192,232,0.09)';
        ctx.fill();
      }

      // Sparks
      for (const sp of sparks) {
        const [ai, bi] = edges[sp.edgeIdx] ?? edges[0];
        const a = nodes[ai], b = nodes[bi];
        if (!a || !b) continue;

        const t0 = Math.max(0, sp.t - 0.07);
        const x0 = a.x + (b.x - a.x) * t0;
        const y0 = a.y + (b.y - a.y) * t0;
        const x1 = a.x + (b.x - a.x) * sp.t;
        const y1 = a.y + (b.y - a.y) * sp.t;

        const [r, g, bv] = sp.warm ? [232, 168, 82] : [82, 192, 232];

        // Trail gradient
        const grad = ctx.createLinearGradient(x0, y0, x1, y1);
        grad.addColorStop(0, `rgba(${r},${g},${bv},0)`);
        grad.addColorStop(1, `rgba(${r},${g},${bv},0.4)`);
        ctx.beginPath();
        ctx.moveTo(x0, y0);
        ctx.lineTo(x1, y1);
        ctx.strokeStyle = grad;
        ctx.lineWidth = 1.4;
        ctx.stroke();

        // Spark dot
        ctx.beginPath();
        ctx.arc(x1, y1, 1.8, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${r},${g},${bv},0.72)`;
        ctx.fill();

        // Advance
        sp.t += sp.speed;
        if (sp.t > 1.05) {
          sp.t = 0;
          sp.edgeIdx = Math.floor(Math.random() * edges.length);
          sp.speed = 0.0005 + Math.random() * 0.0009;
          sp.warm = Math.random() > 0.78;
        }
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
        position: 'absolute', inset: 0,
        width: '100%', height: '100%',
        pointerEvents: 'none', display: 'block',
        ...style,
      }}
    />
  );
}
