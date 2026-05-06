'use client';
import { useEffect, useRef } from 'react';

export function SparkCanvas() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current!;
    const ctx    = canvas.getContext('2d')!;
    let raf: number;

    const sources = [
      { x: 0.15, y: 0.3,  color: [245,158,11]  as [number,number,number] },
      { x: 0.85, y: 0.2,  color: [16,185,129]  as [number,number,number] },
      { x: 0.5,  y: 0.75, color: [99,102,241]  as [number,number,number] },
    ];

    const sparks: { x:number; y:number; vx:number; vy:number; life:number; maxLife:number; color:[number,number,number] }[] = [];

    function resize() {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    function emit() {
      const src = sources[Math.floor(Math.random() * sources.length)];
      const angle = Math.random() * Math.PI * 2;
      const speed = 0.2 + Math.random() * 0.5;
      sparks.push({
        x: src.x * canvas.width,
        y: src.y * canvas.height,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0,
        maxLife: 120 + Math.random() * 180,
        color: src.color,
      });
    }

    let t = 0;
    function frame() {
      t++;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Grid
      ctx.strokeStyle = 'rgba(245,158,11,0.04)';
      ctx.lineWidth = 0.5;
      const gs = 80;
      for (let x = 0; x < canvas.width; x += gs) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
      }
      for (let y = 0; y < canvas.height; y += gs) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
      }

      // Sonar rings
      sources.forEach((src, si) => {
        const cx = src.x * canvas.width;
        const cy = src.y * canvas.height;
        const phase = (t * 0.6 + si * 80) % 240;
        const r = phase * 2.2;
        const a = Math.max(0, 0.18 - phase / 240 * 0.18);
        const [r1, g1, b1] = src.color;
        ctx.strokeStyle = `rgba(${r1},${g1},${b1},${a})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.stroke();
      });

      if (t % 4 === 0) emit();

      for (let i = sparks.length - 1; i >= 0; i--) {
        const sp = sparks[i];
        sp.x += sp.vx; sp.y += sp.vy;
        sp.life++;
        if (sp.life > sp.maxLife) { sparks.splice(i, 1); continue; }
        const p = sp.life / sp.maxLife;
        const alpha = p < 0.2 ? p / 0.2 : (1 - p) * 0.9;
        const [r1, g1, b1] = sp.color;
        ctx.fillStyle = `rgba(${r1},${g1},${b1},${alpha * 0.8})`;
        ctx.beginPath();
        ctx.arc(sp.x, sp.y, 1.2, 0, Math.PI * 2);
        ctx.fill();
      }

      raf = requestAnimationFrame(frame);
    }
    frame();
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize); };
  }, []);

  return (
    <canvas ref={ref} style={{
      position: 'fixed', inset: 0, width: '100%', height: '100%',
      pointerEvents: 'none', zIndex: 0, opacity: 0.9,
    }} />
  );
}
