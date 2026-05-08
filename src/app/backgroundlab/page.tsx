'use client';
import React from 'react';

// ─── types ───────────────────────────────────────────────────────────────────

type Cfg = Record<string, number>;
type SliderSpec = { key: string; label: string; min: number; max: number; step: number };
type BgDef = {
  id: string;
  label: string;
  description: string;
  defaults: Cfg;
  sliders: SliderSpec[];
  create: (canvas: HTMLCanvasElement, getCfg: () => Cfg) => () => void;
};

// ─── 1. Particle Field ───────────────────────────────────────────────────────

const particlesBg: BgDef = {
  id: 'particles',
  label: 'Particle Field',
  description: 'Neural constellation — connected orbs drifting through space',
  defaults: { count: 72, speed: 0.18, glowRadius: 5, connectDist: 110, connectOpacity: 0.07, brightness: 0.45, pulseSpeed: 0.008, vignetteStr: 0.72 },
  sliders: [
    { key: 'count',          label: 'Particles',        min: 10,   max: 300,  step: 1     },
    { key: 'speed',          label: 'Speed',            min: 0.01, max: 2.0,  step: 0.01  },
    { key: 'glowRadius',     label: 'Glow radius',      min: 1,    max: 14,   step: 0.5   },
    { key: 'connectDist',    label: 'Connect distance', min: 0,    max: 300,  step: 5     },
    { key: 'connectOpacity', label: 'Connect opacity',  min: 0,    max: 0.5,  step: 0.01  },
    { key: 'brightness',     label: 'Brightness',       min: 0.05, max: 1.0,  step: 0.01  },
    { key: 'pulseSpeed',     label: 'Pulse speed',      min: 0,    max: 0.06, step: 0.001 },
    { key: 'vignetteStr',    label: 'Center glow',      min: 0,    max: 1.0,  step: 0.01  },
  ],
  create(canvas, getCfg) {
    const ctx = canvas.getContext('2d')!;
    let animId: number;
    type P = { x: number; y: number; vx: number; vy: number; r: number; ba: number; layer: number; pulse: number; ps: number };
    let particles: P[] = [];
    let lastCount = -1;

    const resize = () => { const r = canvas.getBoundingClientRect(); canvas.width = r.width; canvas.height = r.height; };
    const init = (n: number) => {
      particles = Array.from({ length: n }, () => {
        const layer = Math.random(), angle = Math.random() * Math.PI * 2;
        return { x: Math.random() * canvas.width, y: Math.random() * canvas.height, vx: Math.cos(angle), vy: Math.sin(angle), r: 0.6 + layer * 1.8, ba: 0.15 + layer * 0.45, layer, pulse: Math.random() * Math.PI * 2, ps: 0.004 + Math.random() * 0.012 };
      });
      lastCount = n;
    };

    const draw = () => {
      const c = getCfg(); const cw = canvas.width, ch = canvas.height;
      if (c.count !== lastCount) init(c.count);
      ctx.clearRect(0, 0, cw, ch);

      const N = particles.length;
      for (let i = 0; i < N; i++) for (let j = i + 1; j < N; j++) {
        const dx = particles[i].x - particles[j].x, dy = particles[i].y - particles[j].y;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d < c.connectDist) {
          const al = (1 - d / c.connectDist) * c.connectOpacity * (particles[i].layer + particles[j].layer) / 2;
          ctx.beginPath(); ctx.moveTo(particles[i].x, particles[i].y); ctx.lineTo(particles[j].x, particles[j].y);
          ctx.strokeStyle = `rgba(100,150,255,${al})`; ctx.lineWidth = 0.4; ctx.stroke();
        }
      }

      particles.forEach(p => {
        p.pulse += c.pulseSpeed;
        const pf = 0.85 + 0.15 * Math.sin(p.pulse), r = p.r * pf, al = p.ba * pf * (c.brightness / 0.45), gs = r * c.glowRadius;
        const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, gs);
        g.addColorStop(0, `rgba(110,165,255,${al * 0.55})`); g.addColorStop(0.45, `rgba(80,130,220,${al * 0.15})`); g.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.beginPath(); ctx.arc(p.x, p.y, gs, 0, Math.PI * 2); ctx.fillStyle = g; ctx.fill();
        ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, Math.PI * 2); ctx.fillStyle = `rgba(190,215,255,${al})`; ctx.fill();
        p.x += p.vx * c.speed; p.y += p.vy * c.speed;
        if (p.x < -10) p.x = cw + 10; if (p.x > cw + 10) p.x = -10;
        if (p.y < -10) p.y = ch + 10; if (p.y > ch + 10) p.y = -10;
      });

      const vign = ctx.createRadialGradient(cw / 2, ch * 0.44, ch * 0.04, cw / 2, ch * 0.44, ch * 0.52);
      vign.addColorStop(0, `rgba(12,13,15,${c.vignetteStr})`); vign.addColorStop(0.5, `rgba(12,13,15,${c.vignetteStr * 0.25})`); vign.addColorStop(1, 'rgba(12,13,15,0)');
      ctx.fillStyle = vign; ctx.fillRect(0, 0, cw, ch);
      animId = requestAnimationFrame(draw);
    };

    resize(); init(getCfg().count); draw();
    const ro = new ResizeObserver(() => resize()); ro.observe(canvas);
    return () => { cancelAnimationFrame(animId); ro.disconnect(); };
  },
};

// ─── 2. Aurora Waves ─────────────────────────────────────────────────────────

const auroraBg: BgDef = {
  id: 'aurora',
  label: 'Aurora',
  description: 'Sinusoidal light curtains with additive screen blending',
  defaults: { waveCount: 5, speed: 0.4, amplitude: 0.5, hueShift: 150, opacity: 0.7, brightness: 0.6 },
  sliders: [
    { key: 'waveCount',  label: 'Wave count', min: 1,  max: 10,  step: 1    },
    { key: 'speed',      label: 'Speed',       min: 0,  max: 2.0, step: 0.01 },
    { key: 'amplitude',  label: 'Amplitude',   min: 0,  max: 1.0, step: 0.01 },
    { key: 'hueShift',   label: 'Hue',         min: 0,  max: 360, step: 1    },
    { key: 'opacity',    label: 'Opacity',      min: 0,  max: 1.0, step: 0.01 },
    { key: 'brightness', label: 'Brightness',  min: 0,  max: 1.0, step: 0.01 },
  ],
  create(canvas, getCfg) {
    const ctx = canvas.getContext('2d')!;
    let animId: number, t = 0;
    const resize = () => { const r = canvas.getBoundingClientRect(); canvas.width = r.width; canvas.height = r.height; };

    const draw = () => {
      const c = getCfg(); const w = canvas.width, h = canvas.height;
      t += c.speed * 0.004;
      ctx.clearRect(0, 0, w, h);
      ctx.save(); ctx.globalCompositeOperation = 'screen';

      const n = Math.max(1, Math.floor(c.waveCount));
      for (let i = 0; i < n; i++) {
        const fi = i / n, hue = (c.hueShift + fi * 80) % 360;
        const yc = h * (0.15 + fi * 0.7), amp = c.amplitude * h * 0.18;
        const freq = 0.0025 + fi * 0.0015, phase = t * (0.8 + fi * 0.6);
        const pts: [number, number][] = [];
        for (let x = 0; x <= w; x += 8) pts.push([x, yc + Math.sin(x * freq + phase) * amp + Math.sin(x * freq * 1.7 + phase * 0.8) * amp * 0.35 + Math.sin(x * freq * 0.5 + phase * 1.3) * amp * 0.2]);

        for (let layer = 0; layer < 4; layer++) {
          const thick = (80 + layer * 60) * c.opacity;
          const alpha = (0.06 - layer * 0.012) * c.opacity * (c.brightness / 0.6);
          ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1] - thick);
          pts.forEach(([x, y]) => ctx.lineTo(x, y - thick));
          for (let j = pts.length - 1; j >= 0; j--) ctx.lineTo(pts[j][0], pts[j][1] + thick);
          ctx.closePath();
          const gy = ctx.createLinearGradient(0, yc - thick * 1.5, 0, yc + thick * 1.5);
          gy.addColorStop(0, `hsla(${hue},90%,65%,0)`); gy.addColorStop(0.4, `hsla(${hue},90%,65%,${alpha})`);
          gy.addColorStop(0.6, `hsla(${hue},90%,65%,${alpha})`); gy.addColorStop(1, `hsla(${hue},90%,65%,0)`);
          ctx.fillStyle = gy; ctx.fill();
        }
      }
      ctx.restore();
      animId = requestAnimationFrame(draw);
    };

    resize(); draw();
    const ro = new ResizeObserver(() => resize()); ro.observe(canvas);
    return () => { cancelAnimationFrame(animId); ro.disconnect(); };
  },
};

// ─── 3. Topographic Rings ────────────────────────────────────────────────────

const topographicBg: BgDef = {
  id: 'topographic',
  label: 'Topographic',
  description: 'Nested tilted ellipses with orbiting sparks — mathematical motion',
  defaults: { ringCount: 12, tilt: 70, rotationSpeed: 0.3, sparkCount: 40, sparkSpeed: 0.8, lineOpacity: 0.35, hue: 190 },
  sliders: [
    { key: 'ringCount',     label: 'Rings',        min: 3,  max: 24,  step: 1    },
    { key: 'tilt',          label: 'Tilt',         min: 10, max: 89,  step: 1    },
    { key: 'rotationSpeed', label: 'Rotation',     min: 0,  max: 2.0, step: 0.01 },
    { key: 'sparkCount',    label: 'Sparks',       min: 0,  max: 80,  step: 1    },
    { key: 'sparkSpeed',    label: 'Spark speed',  min: 0,  max: 3.0, step: 0.01 },
    { key: 'lineOpacity',   label: 'Line opacity', min: 0,  max: 1.0, step: 0.01 },
    { key: 'hue',           label: 'Color hue',    min: 0,  max: 360, step: 1    },
  ],
  create(canvas, getCfg) {
    const ctx = canvas.getContext('2d')!;
    let animId: number, rotation = 0;
    type Spark = { ring: number; angle: number; speed: number };
    let sparks: Spark[] = [];
    let lastSparkCount = -1;

    const initSparks = (n: number, rings: number) => {
      sparks = Array.from({ length: n }, () => ({ ring: Math.floor(Math.random() * Math.max(1, rings)), angle: Math.random() * Math.PI * 2, speed: 0.5 + Math.random() }));
      lastSparkCount = n;
    };

    const resize = () => { const r = canvas.getBoundingClientRect(); canvas.width = r.width; canvas.height = r.height; };

    const draw = () => {
      const c = getCfg(); const w = canvas.width, h = canvas.height;
      rotation += c.rotationSpeed * 0.003;
      const rings = Math.max(1, Math.floor(c.ringCount)), sc = Math.floor(c.sparkCount);
      if (sc !== lastSparkCount) initSparks(sc, rings);
      ctx.clearRect(0, 0, w, h);
      const cx = w / 2, cy = h / 2, maxR = Math.min(w, h) * 0.46, yScale = Math.cos((c.tilt * Math.PI) / 180);

      for (let i = 1; i <= rings; i++) {
        const t = i / rings, rx = maxR * t, ry = rx * yScale;
        const hue = c.hue + (1 - t) * 40, alpha = c.lineOpacity * (0.4 + t * 0.6);
        ctx.save(); ctx.translate(cx, cy); ctx.rotate(rotation);
        ctx.beginPath(); ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
        ctx.strokeStyle = `hsla(${hue},70%,65%,${alpha})`; ctx.lineWidth = 0.5 + t * 0.5; ctx.stroke();
        ctx.restore();
      }

      sparks.forEach(s => {
        s.angle += c.sparkSpeed * s.speed * 0.008;
        const ri = Math.min(s.ring, rings - 1), t = (ri + 1) / rings;
        const rx = maxR * t, ry = rx * yScale, la = s.angle + rotation;
        const rawX = rx * Math.cos(la - rotation), rawY = ry * Math.sin(la - rotation);
        const px = cx + rawX * Math.cos(rotation) - rawY * Math.sin(rotation);
        const py = cy + rawX * Math.sin(rotation) + rawY * Math.cos(rotation);
        const hue = c.hue + (1 - t) * 40;
        const g = ctx.createRadialGradient(px, py, 0, px, py, 6);
        g.addColorStop(0, `hsla(${hue + 30},90%,90%,0.9)`); g.addColorStop(1, `hsla(${hue},80%,65%,0)`);
        ctx.beginPath(); ctx.arc(px, py, 6, 0, Math.PI * 2); ctx.fillStyle = g; ctx.fill();
      });

      animId = requestAnimationFrame(draw);
    };

    resize(); initSparks(Math.floor(getCfg().sparkCount), Math.floor(getCfg().ringCount)); draw();
    const ro = new ResizeObserver(() => resize()); ro.observe(canvas);
    return () => { cancelAnimationFrame(animId); ro.disconnect(); };
  },
};

// ─── 4. Spark Network ────────────────────────────────────────────────────────

const sparkNetworkBg: BgDef = {
  id: 'sparknetwork',
  label: 'Spark Network',
  description: 'Traveling sparks over a faint graph backbone with trails',
  defaults: { nodeCount: 20, edgeOpacity: 0.12, sparkCount: 30, sparkSpeed: 1.2, trailLength: 0.4, brightness: 0.7, hue: 220 },
  sliders: [
    { key: 'nodeCount',   label: 'Nodes',        min: 4,   max: 50,  step: 1    },
    { key: 'edgeOpacity', label: 'Edge opacity', min: 0,   max: 0.5, step: 0.01 },
    { key: 'sparkCount',  label: 'Sparks',       min: 0,   max: 80,  step: 1    },
    { key: 'sparkSpeed',  label: 'Spark speed',  min: 0.1, max: 4.0, step: 0.1  },
    { key: 'trailLength', label: 'Trail length', min: 0,   max: 1.0, step: 0.01 },
    { key: 'brightness',  label: 'Brightness',   min: 0.1, max: 1.0, step: 0.01 },
    { key: 'hue',         label: 'Color hue',    min: 0,   max: 360, step: 1    },
  ],
  create(canvas, getCfg) {
    const ctx = canvas.getContext('2d')!;
    let animId: number;
    type Node = { x: number; y: number };
    type Edge = { a: number; b: number };
    type Spark = { edge: number; t: number; speed: number; dir: number };
    let nodes: Node[] = [], edges: Edge[] = [], sparks: Spark[] = [];
    let lastNodeCount = -1, lastSparkCount = -1;

    const initGraph = (n: number) => {
      const w = canvas.width, h = canvas.height;
      nodes = Array.from({ length: n }, () => ({ x: 0.05 * w + Math.random() * 0.9 * w, y: 0.05 * h + Math.random() * 0.9 * h }));
      edges = [];
      for (let i = 0; i < n; i++) {
        nodes.map((nd, j) => ({ j, d: Math.hypot(nd.x - nodes[i].x, nd.y - nodes[i].y) }))
          .filter(e => e.j !== i).sort((a, b) => a.d - b.d).slice(0, 3)
          .forEach(({ j }) => { if (!edges.some(e => (e.a === i && e.b === j) || (e.a === j && e.b === i))) edges.push({ a: i, b: j }); });
      }
      lastNodeCount = n;
    };

    const initSparks = (n: number) => {
      sparks = Array.from({ length: n }, () => ({ edge: Math.floor(Math.random() * Math.max(1, edges.length)), t: Math.random(), speed: 0.5 + Math.random() * 0.5, dir: Math.random() > 0.5 ? 1 : -1 }));
      lastSparkCount = n;
    };

    const resize = () => {
      const r = canvas.getBoundingClientRect(); canvas.width = r.width; canvas.height = r.height;
      initGraph(Math.floor(getCfg().nodeCount)); initSparks(Math.floor(getCfg().sparkCount));
    };

    const draw = () => {
      const c = getCfg(); const w = canvas.width, h = canvas.height;
      const nc = Math.floor(c.nodeCount), sc = Math.floor(c.sparkCount);
      if (nc !== lastNodeCount) { initGraph(nc); initSparks(sc); }
      else if (sc !== lastSparkCount && edges.length > 0) initSparks(sc);

      ctx.fillStyle = `rgba(8,10,14,${0.15 + (1 - c.trailLength) * 0.72})`;
      ctx.fillRect(0, 0, w, h);

      edges.forEach(e => {
        ctx.beginPath(); ctx.moveTo(nodes[e.a].x, nodes[e.a].y); ctx.lineTo(nodes[e.b].x, nodes[e.b].y);
        ctx.strokeStyle = `hsla(${c.hue},60%,60%,${c.edgeOpacity})`; ctx.lineWidth = 0.5; ctx.stroke();
      });
      nodes.forEach(nd => {
        ctx.beginPath(); ctx.arc(nd.x, nd.y, 1.5, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${c.hue},60%,70%,${c.edgeOpacity * 2})`; ctx.fill();
      });

      sparks.forEach(s => {
        if (s.edge >= edges.length) return;
        s.t += c.sparkSpeed * s.speed * s.dir * 0.006;
        if (s.t > 1) { s.t = 0; s.dir = Math.random() > 0.5 ? 1 : -1; }
        if (s.t < 0) { s.t = 1; s.dir = Math.random() > 0.5 ? 1 : -1; }
        const e = edges[s.edge];
        const px = nodes[e.a].x + (nodes[e.b].x - nodes[e.a].x) * s.t;
        const py = nodes[e.a].y + (nodes[e.b].y - nodes[e.a].y) * s.t;
        const g = ctx.createRadialGradient(px, py, 0, px, py, 8);
        g.addColorStop(0, `hsla(${c.hue + 40},100%,95%,${c.brightness})`);
        g.addColorStop(0.4, `hsla(${c.hue},90%,70%,${c.brightness * 0.4})`);
        g.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.beginPath(); ctx.arc(px, py, 8, 0, Math.PI * 2); ctx.fillStyle = g; ctx.fill();
      });

      animId = requestAnimationFrame(draw);
    };

    resize(); draw();
    const ro = new ResizeObserver(() => resize()); ro.observe(canvas);
    return () => { cancelAnimationFrame(animId); ro.disconnect(); };
  },
};

// ─── 5. Star Field ───────────────────────────────────────────────────────────

const starfieldBg: BgDef = {
  id: 'starfield',
  label: 'Star Field',
  description: 'Parallax depth layers with twinkle and shooting stars',
  defaults: { count: 200, speed: 0.3, twinkle: 0.5, size: 1.0, shootingRate: 0.3 },
  sliders: [
    { key: 'count',        label: 'Stars',          min: 20,  max: 500,  step: 5    },
    { key: 'speed',        label: 'Drift speed',    min: 0,   max: 2.0,  step: 0.01 },
    { key: 'twinkle',      label: 'Twinkle',        min: 0,   max: 1.0,  step: 0.01 },
    { key: 'size',         label: 'Star size',      min: 0.2, max: 3.0,  step: 0.1  },
    { key: 'shootingRate', label: 'Shooting stars', min: 0,   max: 1.0,  step: 0.01 },
  ],
  create(canvas, getCfg) {
    const ctx = canvas.getContext('2d')!;
    let animId: number;
    type Star = { x: number; y: number; layer: number; phase: number; ps: number };
    type Shooter = { x: number; y: number; vx: number; vy: number; life: number; maxLife: number };
    let stars: Star[] = [], shooters: Shooter[] = [], lastCount = -1, shooterTimer = 0;

    const initStars = (n: number) => {
      stars = Array.from({ length: n }, () => ({ x: Math.random() * canvas.width, y: Math.random() * canvas.height, layer: Math.random(), phase: Math.random() * Math.PI * 2, ps: 0.01 + Math.random() * 0.03 }));
      lastCount = n;
    };

    const resize = () => { const r = canvas.getBoundingClientRect(); canvas.width = r.width; canvas.height = r.height; };

    const draw = () => {
      const c = getCfg(); const w = canvas.width, h = canvas.height;
      if (Math.floor(c.count) !== lastCount) initStars(Math.floor(c.count));
      ctx.clearRect(0, 0, w, h);

      stars.forEach(s => {
        s.phase += s.ps;
        const tf = 1 - c.twinkle * 0.5 * (1 - Math.sin(s.phase));
        const alpha = (0.2 + s.layer * 0.8) * tf;
        const r = (0.3 + s.layer * 1.2) * c.size;

        if (s.layer > 0.6) {
          const gs = r * 4;
          const g = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, gs);
          g.addColorStop(0, `rgba(200,215,255,${alpha * 0.4})`); g.addColorStop(1, 'rgba(0,0,0,0)');
          ctx.beginPath(); ctx.arc(s.x, s.y, gs, 0, Math.PI * 2); ctx.fillStyle = g; ctx.fill();
        }
        ctx.beginPath(); ctx.arc(s.x, s.y, r, 0, Math.PI * 2); ctx.fillStyle = `rgba(200,215,255,${alpha})`; ctx.fill();

        s.y += c.speed * (0.1 + s.layer * 0.9) * 0.15;
        if (s.y > h + 5) { s.y = -5; s.x = Math.random() * w; }
      });

      shooterTimer += c.shootingRate * 0.02;
      if (shooterTimer > 1 && c.shootingRate > 0) {
        shooterTimer = 0;
        const a = (Math.random() * 30 + 195) * Math.PI / 180;
        shooters.push({ x: Math.random() * w, y: -20, vx: Math.cos(a) * 8, vy: Math.sin(a) * 8, life: 0, maxLife: 40 + Math.random() * 30 });
      }
      shooters = shooters.filter(s => s.life < s.maxLife);
      shooters.forEach(s => {
        s.life++; s.x += s.vx; s.y += s.vy;
        const alpha = Math.sin((s.life / s.maxLife) * Math.PI);
        const tail = 40 / 8;
        const grad = ctx.createLinearGradient(s.x, s.y, s.x - s.vx * tail, s.y - s.vy * tail);
        grad.addColorStop(0, `rgba(255,255,255,${alpha})`); grad.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.beginPath(); ctx.moveTo(s.x, s.y); ctx.lineTo(s.x - s.vx * tail, s.y - s.vy * tail);
        ctx.strokeStyle = grad; ctx.lineWidth = 1.5; ctx.stroke();
      });

      animId = requestAnimationFrame(draw);
    };

    resize(); initStars(Math.floor(getCfg().count)); draw();
    const ro = new ResizeObserver(() => resize()); ro.observe(canvas);
    return () => { cancelAnimationFrame(animId); ro.disconnect(); };
  },
};

// ─── 6. Orbital Hub ──────────────────────────────────────────────────────────

const orbitalBg: BgDef = {
  id: 'orbital',
  label: 'Orbital Hub',
  description: 'Radial hub with concentric rings and traveling sparks',
  defaults: { ringCount: 5, ringSpacing: 0.6, sparkCount: 24, sparkSpeed: 0.8, spokeCount: 8, brightness: 0.6, hue: 200 },
  sliders: [
    { key: 'ringCount',   label: 'Rings',        min: 1,  max: 10,  step: 1    },
    { key: 'ringSpacing', label: 'Ring spread',  min: 0.2,max: 1.0, step: 0.01 },
    { key: 'sparkCount',  label: 'Sparks',       min: 0,  max: 60,  step: 1    },
    { key: 'sparkSpeed',  label: 'Spark speed',  min: 0,  max: 3.0, step: 0.01 },
    { key: 'spokeCount',  label: 'Spokes',       min: 0,  max: 16,  step: 1    },
    { key: 'brightness',  label: 'Brightness',   min: 0.1,max: 1.0, step: 0.01 },
    { key: 'hue',         label: 'Color hue',    min: 0,  max: 360, step: 1    },
  ],
  create(canvas, getCfg) {
    const ctx = canvas.getContext('2d')!;
    let animId: number, t = 0;
    type Spark = { ring: number; angle: number; speed: number; dir: number };
    let sparks: Spark[] = [], lastSparkCount = -1;

    const initSparks = (n: number, rings: number) => {
      sparks = Array.from({ length: n }, () => ({ ring: Math.floor(Math.random() * rings), angle: Math.random() * Math.PI * 2, speed: 0.6 + Math.random() * 0.8, dir: Math.random() > 0.5 ? 1 : -1 }));
      lastSparkCount = n;
    };

    const resize = () => { const r = canvas.getBoundingClientRect(); canvas.width = r.width; canvas.height = r.height; };

    const draw = () => {
      const c = getCfg(); const w = canvas.width, h = canvas.height;
      t += 0.005;
      const rings = Math.max(1, Math.floor(c.ringCount)), sc = Math.floor(c.sparkCount);
      if (sc !== lastSparkCount) initSparks(sc, rings);
      ctx.clearRect(0, 0, w, h);
      const cx = w / 2, cy = h / 2, baseR = Math.min(w, h) * 0.04, maxR = Math.min(w, h) * 0.43;

      const hubG = ctx.createRadialGradient(cx, cy, 0, cx, cy, baseR * 3);
      hubG.addColorStop(0, `hsla(${c.hue},80%,80%,${c.brightness * 0.7})`); hubG.addColorStop(1, 'hsla(0,0%,0%,0)');
      ctx.beginPath(); ctx.arc(cx, cy, baseR * 3, 0, Math.PI * 2); ctx.fillStyle = hubG; ctx.fill();
      ctx.beginPath(); ctx.arc(cx, cy, 2.5, 0, Math.PI * 2); ctx.fillStyle = `hsla(${c.hue},70%,90%,${c.brightness})`; ctx.fill();

      const spokes = Math.floor(c.spokeCount);
      for (let i = 0; i < spokes; i++) {
        const a = (i / spokes) * Math.PI * 2 + t * 0.1;
        const outerR = baseR + (maxR - baseR) * c.ringSpacing;
        ctx.beginPath(); ctx.moveTo(cx + Math.cos(a) * baseR, cy + Math.sin(a) * baseR);
        ctx.lineTo(cx + Math.cos(a) * outerR, cy + Math.sin(a) * outerR);
        ctx.strokeStyle = `hsla(${c.hue},60%,65%,${c.brightness * 0.08})`; ctx.lineWidth = 0.5; ctx.stroke();
      }

      for (let i = 0; i < rings; i++) {
        const fi = (i + 1) / rings, r = baseR + (maxR - baseR) * fi * c.ringSpacing;
        const hue = c.hue + fi * 30, alpha = c.brightness * (0.15 + fi * 0.15);
        ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.strokeStyle = `hsla(${hue},70%,65%,${alpha})`; ctx.lineWidth = 0.7; ctx.stroke();
      }

      sparks.forEach(s => {
        const ri = Math.min(s.ring, rings - 1), fi = (ri + 1) / rings;
        const r = baseR + (maxR - baseR) * fi * c.ringSpacing;
        s.angle += c.sparkSpeed * s.speed * s.dir * 0.008;
        const px = cx + Math.cos(s.angle) * r, py = cy + Math.sin(s.angle) * r;
        const hue = c.hue + fi * 30;
        const g = ctx.createRadialGradient(px, py, 0, px, py, 7);
        g.addColorStop(0, `hsla(${hue + 20},100%,95%,${c.brightness})`);
        g.addColorStop(0.5, `hsla(${hue},90%,70%,${c.brightness * 0.4})`);
        g.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.beginPath(); ctx.arc(px, py, 7, 0, Math.PI * 2); ctx.fillStyle = g; ctx.fill();
      });

      animId = requestAnimationFrame(draw);
    };

    resize(); initSparks(Math.floor(getCfg().sparkCount), Math.floor(getCfg().ringCount)); draw();
    const ro = new ResizeObserver(() => resize()); ro.observe(canvas);
    return () => { cancelAnimationFrame(animId); ro.disconnect(); };
  },
};

// ─── 7. Flow Field ───────────────────────────────────────────────────────────

const flowFieldBg: BgDef = {
  id: 'flowfield',
  label: 'Flow Field',
  description: 'Particles following a noise-based vector field with trails',
  defaults: { count: 150, speed: 0.8, noiseScale: 3, trailOpacity: 0.04, lineWidth: 1.0, hue: 200, saturation: 0.6 },
  sliders: [
    { key: 'count',        label: 'Particles',    min: 20,  max: 400, step: 5    },
    { key: 'speed',        label: 'Speed',        min: 0.1, max: 4.0, step: 0.1  },
    { key: 'noiseScale',   label: 'Field scale',  min: 1,   max: 10,  step: 0.1  },
    { key: 'trailOpacity', label: 'Trail fade',   min: 0.01,max: 0.2, step: 0.01 },
    { key: 'lineWidth',    label: 'Line width',   min: 0.3, max: 3.0, step: 0.1  },
    { key: 'hue',          label: 'Color hue',    min: 0,   max: 360, step: 1    },
    { key: 'saturation',   label: 'Saturation',   min: 0,   max: 1.0, step: 0.01 },
  ],
  create(canvas, getCfg) {
    const ctx = canvas.getContext('2d')!;
    let animId: number, t = 0;
    type Particle = { x: number; y: number; px: number; py: number; age: number; maxAge: number; ho: number };
    let particles: Particle[] = [], lastCount = -1;

    // Smooth noise via overlaid sin waves
    const noise = (x: number, y: number, z: number) => {
      const a = Math.sin(x * 2.3 + z * 1.1) * 0.5 + 0.5;
      const b = Math.sin(y * 1.7 + z * 0.9 + 2.3) * 0.5 + 0.5;
      const c2 = Math.sin(x * 1.3 + y * 1.9 + z * 0.7 + 4.1) * 0.5 + 0.5;
      return ((a + b + c2) / 3) * 2 - 1;
    };

    const spawn = (): Particle => ({ x: Math.random() * canvas.width, y: Math.random() * canvas.height, px: 0, py: 0, age: 0, maxAge: 80 + Math.random() * 120, ho: Math.random() * 60 - 30 });

    const initParticles = (n: number) => { particles = Array.from({ length: n }, spawn); lastCount = n; };

    const resize = () => { const r = canvas.getBoundingClientRect(); canvas.width = r.width; canvas.height = r.height; };

    const draw = () => {
      const c = getCfg(); const w = canvas.width, h = canvas.height;
      t += 0.004;
      if (Math.floor(c.count) !== lastCount) initParticles(Math.floor(c.count));

      ctx.fillStyle = `rgba(8,10,14,${c.trailOpacity})`; ctx.fillRect(0, 0, w, h);

      const scale = c.noiseScale * 0.001;
      particles.forEach((p, i) => {
        p.px = p.x; p.py = p.y; p.age++;
        const angle = noise(p.x * scale, p.y * scale, t) * Math.PI * 2;
        p.x += Math.cos(angle) * c.speed; p.y += Math.sin(angle) * c.speed;

        if (p.age > p.maxAge || p.x < 0 || p.x > w || p.y < 0 || p.y > h) { particles[i] = spawn(); return; }

        const lf = 1 - p.age / p.maxAge, alpha = Math.min(lf * 2, 1) * 0.6;
        const hue = (c.hue + p.ho + 360) % 360;
        ctx.beginPath(); ctx.moveTo(p.px, p.py); ctx.lineTo(p.x, p.y);
        ctx.strokeStyle = `hsla(${hue},${Math.round(c.saturation * 80)}%,65%,${alpha})`;
        ctx.lineWidth = c.lineWidth; ctx.stroke();
      });

      animId = requestAnimationFrame(draw);
    };

    resize(); initParticles(Math.floor(getCfg().count)); draw();
    const ro = new ResizeObserver(() => resize()); ro.observe(canvas);
    return () => { cancelAnimationFrame(animId); ro.disconnect(); };
  },
};

// ─── 8. Gradient Mesh ────────────────────────────────────────────────────────

const gradientMeshBg: BgDef = {
  id: 'gradientmesh',
  label: 'Gradient Mesh',
  description: 'Orbiting radial color nodes with additive screen blending',
  defaults: { nodeCount: 4, speed: 0.3, hue1: 220, hue2: 280, hue3: 160, saturation: 0.7, brightness: 0.5 },
  sliders: [
    { key: 'nodeCount',   label: 'Color nodes',  min: 2,  max: 8,   step: 1    },
    { key: 'speed',       label: 'Speed',         min: 0,  max: 2.0, step: 0.01 },
    { key: 'hue1',        label: 'Hue 1',         min: 0,  max: 360, step: 1    },
    { key: 'hue2',        label: 'Hue 2',         min: 0,  max: 360, step: 1    },
    { key: 'hue3',        label: 'Hue 3',         min: 0,  max: 360, step: 1    },
    { key: 'saturation',  label: 'Saturation',    min: 0,  max: 1.0, step: 0.01 },
    { key: 'brightness',  label: 'Brightness',    min: 0,  max: 1.0, step: 0.01 },
  ],
  create(canvas, getCfg) {
    const ctx = canvas.getContext('2d')!;
    let animId: number, t = 0;
    const resize = () => { const r = canvas.getBoundingClientRect(); canvas.width = r.width; canvas.height = r.height; };

    const draw = () => {
      const c = getCfg(); const w = canvas.width, h = canvas.height;
      t += c.speed * 0.005;
      ctx.clearRect(0, 0, w, h);
      ctx.save(); ctx.globalCompositeOperation = 'screen';

      const n = Math.max(2, Math.floor(c.nodeCount));
      const hues = [c.hue1, c.hue2, c.hue3];
      const sat = Math.round(c.saturation * 80), light = Math.round(c.brightness * 45 + 15);

      for (let i = 0; i < n; i++) {
        const fi = i / n, angle = fi * Math.PI * 2 + t * (0.5 + fi * 0.3);
        const orbit = Math.min(w, h) * (0.2 + fi * 0.12);
        const nx = w / 2 + Math.cos(angle) * orbit + Math.sin(angle * 1.7 + t * 0.4) * orbit * 0.3;
        const ny = h / 2 + Math.sin(angle) * orbit + Math.cos(angle * 1.3 + t * 0.6) * orbit * 0.3;
        const r = Math.min(w, h) * (0.38 + fi * 0.08);
        const hue = hues[i % hues.length];

        const g = ctx.createRadialGradient(nx, ny, 0, nx, ny, r);
        g.addColorStop(0, `hsla(${hue},${sat}%,${light}%,${c.brightness * 0.55})`);
        g.addColorStop(0.5, `hsla(${(hue + 20) % 360},${sat}%,${light}%,${c.brightness * 0.2})`);
        g.addColorStop(1, `hsla(${hue},${sat}%,${light}%,0)`);
        ctx.beginPath(); ctx.arc(nx, ny, r, 0, Math.PI * 2); ctx.fillStyle = g; ctx.fill();
      }
      ctx.restore();
      animId = requestAnimationFrame(draw);
    };

    resize(); draw();
    const ro = new ResizeObserver(() => resize()); ro.observe(canvas);
    return () => { cancelAnimationFrame(animId); ro.disconnect(); };
  },
};

// ─── 9. Matrix Rain ──────────────────────────────────────────────────────────

const matrixBg: BgDef = {
  id: 'matrix',
  label: 'Matrix Rain',
  description: 'Cascading character streams — katakana and digits fall through the void',
  defaults: { speed: 0.8, density: 0.7, charSize: 14, hue: 120, trailLength: 0.6, glowIntensity: 0.8 },
  sliders: [
    { key: 'speed',         label: 'Fall speed',   min: 0.1, max: 3.0,  step: 0.05 },
    { key: 'density',       label: 'Density',       min: 0.1, max: 1.0,  step: 0.01 },
    { key: 'charSize',      label: 'Char size',     min: 8,   max: 32,   step: 1    },
    { key: 'hue',           label: 'Color hue',     min: 0,   max: 360,  step: 1    },
    { key: 'trailLength',   label: 'Trail length',  min: 0,   max: 1.0,  step: 0.01 },
    { key: 'glowIntensity', label: 'Glow',          min: 0,   max: 1.0,  step: 0.01 },
  ],
  create(canvas, getCfg) {
    const ctx = canvas.getContext('2d')!;
    let animId: number;
    const CHARS = 'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    type Col = { y: number; acc: number; speed: number; char: string; active: boolean };
    let cols: Col[] = [], lastCs = -1;

    const initCols = (cs: number) => {
      const n = Math.floor(canvas.width / cs);
      const density = getCfg().density;
      cols = Array.from({ length: n }, () => ({
        y: -Math.floor(Math.random() * 40),
        acc: Math.random(),
        speed: 0.4 + Math.random() * 1.2,
        char: CHARS[Math.floor(Math.random() * CHARS.length)],
        active: Math.random() < density,
      }));
      lastCs = cs;
    };

    const resize = () => { const r = canvas.getBoundingClientRect(); canvas.width = r.width; canvas.height = r.height; initCols(Math.round(getCfg().charSize)); };

    const draw = () => {
      const c = getCfg(); const cs = Math.round(c.charSize); const w = canvas.width, h = canvas.height;
      if (cs !== lastCs) initCols(cs);

      ctx.fillStyle = `rgba(8,10,14,${0.05 + (1 - c.trailLength) * 0.5})`;
      ctx.fillRect(0, 0, w, h);
      ctx.font = `${cs}px monospace`;

      cols.forEach((col, i) => {
        if (!col.active) return;
        col.acc += c.speed * col.speed * 0.04;
        if (col.acc >= 1) {
          col.acc -= 1;
          col.char = CHARS[Math.floor(Math.random() * CHARS.length)];
          col.y++;
          if (col.y * cs > h + cs * 6) {
            col.y = -Math.floor(Math.random() * 30);
            col.active = Math.random() < c.density;
          }
        }
        const x = i * cs, y = col.y * cs;
        ctx.shadowBlur = c.glowIntensity * 14;
        ctx.shadowColor = `hsla(${c.hue},100%,65%,1)`;
        ctx.fillStyle = `rgba(255,255,255,0.95)`;
        ctx.fillText(col.char, x, y);
        ctx.shadowBlur = 0;
      });

      animId = requestAnimationFrame(draw);
    };

    resize(); draw();
    const ro = new ResizeObserver(() => resize()); ro.observe(canvas);
    return () => { cancelAnimationFrame(animId); ro.disconnect(); };
  },
};

// ─── 10. Bokeh ───────────────────────────────────────────────────────────────

const bokehBg: BgDef = {
  id: 'bokeh',
  label: 'Bokeh',
  description: 'Soft defocused light orbs drifting with depth-of-field glow',
  defaults: { count: 35, speed: 0.3, size: 1.0, opacity: 0.6, saturation: 0.7, hueShift: 200, hueSpread: 120 },
  sliders: [
    { key: 'count',      label: 'Orbs',        min: 5,   max: 80,  step: 1    },
    { key: 'speed',      label: 'Speed',        min: 0,   max: 1.5, step: 0.01 },
    { key: 'size',       label: 'Size',         min: 0.2, max: 3.0, step: 0.05 },
    { key: 'opacity',    label: 'Opacity',      min: 0.1, max: 1.0, step: 0.01 },
    { key: 'saturation', label: 'Saturation',   min: 0,   max: 1.0, step: 0.01 },
    { key: 'hueShift',   label: 'Base hue',     min: 0,   max: 360, step: 1    },
    { key: 'hueSpread',  label: 'Hue spread',   min: 0,   max: 360, step: 1    },
  ],
  create(canvas, getCfg) {
    const ctx = canvas.getContext('2d')!;
    let animId: number;
    type Orb = { x: number; y: number; vx: number; vy: number; r: number; hue: number; phase: number; ps: number };
    let orbs: Orb[] = [], lastCount = -1;

    const initOrbs = (n: number) => {
      const c = getCfg();
      orbs = Array.from({ length: n }, () => {
        const angle = Math.random() * Math.PI * 2;
        return { x: Math.random() * canvas.width, y: Math.random() * canvas.height, vx: Math.cos(angle) * 0.4, vy: Math.sin(angle) * 0.4, r: 30 + Math.random() * 90, hue: (c.hueShift + Math.random() * c.hueSpread) % 360, phase: Math.random() * Math.PI * 2, ps: 0.003 + Math.random() * 0.007 };
      });
      lastCount = n;
    };

    const resize = () => { const r = canvas.getBoundingClientRect(); canvas.width = r.width; canvas.height = r.height; };

    const draw = () => {
      const c = getCfg(); const w = canvas.width, h = canvas.height;
      const n = Math.floor(c.count);
      if (n !== lastCount) initOrbs(n);
      ctx.clearRect(0, 0, w, h);
      ctx.save(); ctx.globalCompositeOperation = 'screen';

      orbs.forEach(o => {
        o.phase += o.ps;
        const r = o.r * (0.88 + 0.12 * Math.sin(o.phase)) * c.size;
        const alpha = c.opacity * (0.25 + 0.15 * Math.sin(o.phase * 0.7));
        const sat = Math.round(c.saturation * 80);

        for (let layer = 0; layer < 3; layer++) {
          const lr = r * (1 + layer * 0.6);
          const la = alpha * (1 - layer * 0.28);
          const g = ctx.createRadialGradient(o.x, o.y, 0, o.x, o.y, lr);
          g.addColorStop(0, `hsla(${o.hue},${sat}%,65%,${la})`);
          g.addColorStop(0.45, `hsla(${o.hue},${sat}%,55%,${la * 0.4})`);
          g.addColorStop(1, `hsla(${o.hue},${sat}%,50%,0)`);
          ctx.beginPath(); ctx.arc(o.x, o.y, lr, 0, Math.PI * 2); ctx.fillStyle = g; ctx.fill();
        }

        o.x += o.vx * c.speed; o.y += o.vy * c.speed;
        if (o.x < -r * 2) o.x = w + r * 2; if (o.x > w + r * 2) o.x = -r * 2;
        if (o.y < -r * 2) o.y = h + r * 2; if (o.y > h + r * 2) o.y = -r * 2;
      });

      ctx.restore();
      animId = requestAnimationFrame(draw);
    };

    resize(); initOrbs(Math.floor(getCfg().count)); draw();
    const ro = new ResizeObserver(() => resize()); ro.observe(canvas);
    return () => { cancelAnimationFrame(animId); ro.disconnect(); };
  },
};

// ─── 11. Plasma ──────────────────────────────────────────────────────────────

const plasmaBg: BgDef = {
  id: 'plasma',
  label: 'Plasma',
  description: 'Demoscene classic — overlapping sine waves create shifting color fields',
  defaults: { speed: 0.5, scale: 4.0, complexity: 4, hueShift: 0, saturation: 0.9, brightness: 0.55 },
  sliders: [
    { key: 'speed',      label: 'Speed',       min: 0,   max: 2.0, step: 0.01 },
    { key: 'scale',      label: 'Scale',        min: 1,   max: 12,  step: 0.1  },
    { key: 'complexity', label: 'Complexity',   min: 1,   max: 6,   step: 1    },
    { key: 'hueShift',   label: 'Hue shift',   min: 0,   max: 360, step: 1    },
    { key: 'saturation', label: 'Saturation',   min: 0,   max: 1.0, step: 0.01 },
    { key: 'brightness', label: 'Brightness',   min: 0.1, max: 0.8, step: 0.01 },
  ],
  create(canvas, getCfg) {
    const ctx = canvas.getContext('2d')!;
    let animId: number, t = 0;
    let off: HTMLCanvasElement | null = null, offCtx: CanvasRenderingContext2D | null = null;

    const hslToRgb = (h: number, s: number, l: number) => {
      const c2 = (1 - Math.abs(2 * l - 1)) * s, hh = h / 60;
      const x = c2 * (1 - Math.abs(hh % 2 - 1)), m = l - c2 / 2;
      let r = 0, g = 0, b = 0;
      if (hh < 1) { r = c2; g = x; } else if (hh < 2) { r = x; g = c2; }
      else if (hh < 3) { g = c2; b = x; } else if (hh < 4) { g = x; b = c2; }
      else if (hh < 5) { r = x; b = c2; } else { r = c2; b = x; }
      return [Math.round((r + m) * 255), Math.round((g + m) * 255), Math.round((b + m) * 255)];
    };

    const resize = () => {
      const r = canvas.getBoundingClientRect(); canvas.width = r.width; canvas.height = r.height;
      off = document.createElement('canvas');
      off.width = Math.ceil(r.width / 5); off.height = Math.ceil(r.height / 5);
      offCtx = off.getContext('2d')!;
    };

    const draw = () => {
      const c = getCfg(); t += c.speed * 0.018;
      if (!off || !offCtx) { animId = requestAnimationFrame(draw); return; }
      const ow = off.width, oh = off.height;
      const img = offCtx.createImageData(ow, oh); const data = img.data;
      const layers = Math.floor(c.complexity), sc = c.scale * 0.018;

      for (let y = 0; y < oh; y++) for (let x = 0; x < ow; x++) {
        let v = 0;
        if (layers >= 1) v += Math.sin(x * sc + t);
        if (layers >= 2) v += Math.sin(y * sc + t * 0.7);
        if (layers >= 3) v += Math.sin((x + y) * sc * 0.7 + t * 1.1);
        if (layers >= 4) v += Math.sin(Math.sqrt((x - ow / 2) ** 2 + (y - oh / 2) ** 2) * sc * 0.8 + t * 0.6);
        if (layers >= 5) v += Math.sin(x * sc * 0.5 - y * sc * 0.3 + t * 1.4);
        if (layers >= 6) v += Math.sin(Math.sqrt(x * x + y * y) * sc * 0.4 - t * 0.9);
        v /= layers;

        const hue = ((v * 180 + c.hueShift + t * 25) % 360 + 360) % 360;
        const [r2, g2, b2] = hslToRgb(hue, c.saturation, c.brightness);
        const i = (y * ow + x) * 4;
        data[i] = r2; data[i + 1] = g2; data[i + 2] = b2; data[i + 3] = 255;
      }
      offCtx.putImageData(img, 0, 0);
      ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(off, 0, 0, canvas.width, canvas.height);
      animId = requestAnimationFrame(draw);
    };

    resize(); draw();
    const ro = new ResizeObserver(() => resize()); ro.observe(canvas);
    return () => { cancelAnimationFrame(animId); ro.disconnect(); };
  },
};

// ─── 12. Ripple ──────────────────────────────────────────────────────────────

const rippleBg: BgDef = {
  id: 'ripple',
  label: 'Ripple',
  description: 'Concentric wave rings expanding from auto-spawned epicenters',
  defaults: { spawnRate: 0.4, speed: 1.2, ringCount: 4, opacity: 0.5, lineWidth: 1.0, hue: 195, hueSpread: 60 },
  sliders: [
    { key: 'spawnRate', label: 'Spawn rate', min: 0.05, max: 1.0,  step: 0.01 },
    { key: 'speed',     label: 'Expand speed', min: 0.2, max: 4.0, step: 0.1  },
    { key: 'ringCount', label: 'Rings',       min: 1,   max: 8,    step: 1    },
    { key: 'opacity',   label: 'Opacity',      min: 0.1, max: 1.0,  step: 0.01 },
    { key: 'lineWidth', label: 'Line width',  min: 0.3, max: 4.0,  step: 0.1  },
    { key: 'hue',       label: 'Base hue',    min: 0,   max: 360,  step: 1    },
    { key: 'hueSpread', label: 'Hue spread',  min: 0,   max: 180,  step: 1    },
  ],
  create(canvas, getCfg) {
    const ctx = canvas.getContext('2d')!;
    let animId: number;
    type Ripple = { x: number; y: number; age: number; maxAge: number; hue: number };
    let ripples: Ripple[] = [], spawnTimer = 0;

    const resize = () => { const r = canvas.getBoundingClientRect(); canvas.width = r.width; canvas.height = r.height; };

    const draw = () => {
      const c = getCfg(); const w = canvas.width, h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      spawnTimer += c.spawnRate * 0.02;
      if (spawnTimer >= 1) {
        spawnTimer -= 1;
        ripples.push({ x: Math.random() * w, y: Math.random() * h, age: 0, maxAge: 180 + Math.random() * 80, hue: (c.hue + Math.random() * c.hueSpread - c.hueSpread / 2 + 360) % 360 });
      }

      const maxR = Math.max(w, h) * 0.55;
      ripples = ripples.filter(rp => rp.age < rp.maxAge);
      ripples.forEach(rp => {
        rp.age += c.speed;
        const prog = rp.age / rp.maxAge;
        const rings = Math.floor(c.ringCount);
        for (let k = 0; k < rings; k++) {
          const ringProg = Math.max(0, prog - k / rings / 1.5);
          if (ringProg <= 0) continue;
          const r = ringProg * maxR;
          const alpha = c.opacity * (1 - ringProg) * (1 - k / rings * 0.6);
          ctx.beginPath(); ctx.arc(rp.x, rp.y, r, 0, Math.PI * 2);
          ctx.strokeStyle = `hsla(${rp.hue},70%,65%,${alpha})`;
          ctx.lineWidth = c.lineWidth * (1 - ringProg * 0.5);
          ctx.stroke();
        }
      });

      animId = requestAnimationFrame(draw);
    };

    resize(); draw();
    const ro = new ResizeObserver(() => resize()); ro.observe(canvas);
    return () => { cancelAnimationFrame(animId); ro.disconnect(); };
  },
};

// ─── 13. Lissajous ───────────────────────────────────────────────────────────

const lissajousBg: BgDef = {
  id: 'lissajous',
  label: 'Lissajous',
  description: 'Parametric curves tracing x=sin(at+δ), y=sin(bt) — phase drift reveals form',
  defaults: { freqA: 3, freqB: 2, speed: 0.3, trailLength: 0.7, lineWidth: 1.5, hue: 260, saturation: 0.8 },
  sliders: [
    { key: 'freqA',      label: 'Frequency A',  min: 1,   max: 10,  step: 0.05 },
    { key: 'freqB',      label: 'Frequency B',  min: 1,   max: 10,  step: 0.05 },
    { key: 'speed',      label: 'Phase speed',  min: 0,   max: 1.5, step: 0.01 },
    { key: 'trailLength',label: 'Trail length', min: 0,   max: 1.0, step: 0.01 },
    { key: 'lineWidth',  label: 'Line width',   min: 0.3, max: 5.0, step: 0.1  },
    { key: 'hue',        label: 'Color hue',    min: 0,   max: 360, step: 1    },
    { key: 'saturation', label: 'Saturation',   min: 0,   max: 1.0, step: 0.01 },
  ],
  create(canvas, getCfg) {
    const ctx = canvas.getContext('2d')!;
    let animId: number, phase = 0;

    const resize = () => { const r = canvas.getBoundingClientRect(); canvas.width = r.width; canvas.height = r.height; };

    const draw = () => {
      const c = getCfg(); const w = canvas.width, h = canvas.height;
      phase += c.speed * 0.012;

      ctx.fillStyle = `rgba(8,10,14,${0.04 + (1 - c.trailLength) * 0.55})`;
      ctx.fillRect(0, 0, w, h);

      const rx = w * 0.44, ry = h * 0.44;
      const cx = w / 2, cy = h / 2;
      const steps = 600;

      ctx.beginPath();
      for (let i = 0; i <= steps; i++) {
        const t = (i / steps) * Math.PI * 2;
        const x = cx + rx * Math.sin(c.freqA * t + phase);
        const y = cy + ry * Math.sin(c.freqB * t);
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      // Color shifts slowly with phase
      const hue = (c.hue + (phase * 30) % 360) % 360;
      const sat = Math.round(c.saturation * 85);
      ctx.strokeStyle = `hsla(${hue},${sat}%,65%,0.55)`;
      ctx.lineWidth = c.lineWidth;
      ctx.shadowBlur = 8; ctx.shadowColor = `hsla(${hue},${sat}%,65%,0.4)`;
      ctx.stroke();
      ctx.shadowBlur = 0;

      animId = requestAnimationFrame(draw);
    };

    resize(); draw();
    const ro = new ResizeObserver(() => resize()); ro.observe(canvas);
    return () => { cancelAnimationFrame(animId); ro.disconnect(); };
  },
};

// ─── 14. Fourier Epicycles ───────────────────────────────────────────────────

const fourierBg: BgDef = {
  id: 'fourier',
  label: 'Fourier',
  description: 'Epicyclic arms trace Fourier series — superimposed harmonics draw emergent curves',
  defaults: { termCount: 8, speed: 0.4, trailLength: 0.8, lineWidth: 1.2, hue: 200, armOpacity: 0.5 },
  sliders: [
    { key: 'termCount',  label: 'Terms',      min: 1,   max: 24,  step: 1    },
    { key: 'speed',      label: 'Speed',       min: 0,   max: 1.5, step: 0.01 },
    { key: 'trailLength',label: 'Trail',       min: 0,   max: 1.0, step: 0.01 },
    { key: 'lineWidth',  label: 'Line width',  min: 0.3, max: 4.0, step: 0.1  },
    { key: 'hue',        label: 'Hue',         min: 0,   max: 360, step: 1    },
    { key: 'armOpacity', label: 'Arm opacity', min: 0,   max: 1.0, step: 0.01 },
  ],
  create(canvas, getCfg) {
    const ctx = canvas.getContext('2d')!;
    let animId: number, t = 0;
    type Arm = { r: number; freq: number };
    let arms: Arm[] = [], trail: [number, number][] = [], lastN = -1;

    const initArms = (n: number) => {
      const scale = Math.min(canvas.width, canvas.height) * 0.42;
      const sum = Array.from({ length: n }, (_, i) => 1 / (2 * i + 1)).reduce((a, b) => a + b, 0);
      arms = Array.from({ length: n }, (_, i) => ({ r: (scale / sum) / (2 * i + 1), freq: 2 * i + 1 }));
      trail = []; lastN = n;
    };

    const resize = () => { const r = canvas.getBoundingClientRect(); canvas.width = r.width; canvas.height = r.height; trail = []; lastN = -1; };

    const draw = () => {
      const c = getCfg(); const w = canvas.width, h = canvas.height;
      const n = Math.floor(c.termCount);
      if (n !== lastN) initArms(n);
      t += c.speed * 0.012;

      ctx.clearRect(0, 0, w, h);
      const cx = w / 2, cy = h / 2;

      // Draw trail
      const maxLen = Math.round(c.trailLength * 3000 + 100);
      if (trail.length > maxLen) trail.splice(0, trail.length - maxLen);
      if (trail.length > 1) {
        ctx.beginPath();
        trail.forEach(([tx, ty], i) => i === 0 ? ctx.moveTo(tx, ty) : ctx.lineTo(tx, ty));
        const hue = c.hue;
        ctx.strokeStyle = `hsla(${hue},85%,68%,0.55)`;
        ctx.lineWidth = c.lineWidth;
        ctx.shadowBlur = 7; ctx.shadowColor = `hsla(${hue},85%,68%,0.3)`;
        ctx.stroke(); ctx.shadowBlur = 0;
      }

      // Arm chain
      let x = cx, y = cy;
      const positions: [number, number][] = [[x, y]];
      arms.forEach(arm => {
        const angle = arm.freq * t;
        x += arm.r * Math.cos(angle); y += arm.r * Math.sin(angle);
        positions.push([x, y]);
      });

      if (c.armOpacity > 0.01) {
        arms.forEach((arm, i) => {
          const [ox, oy] = positions[i];
          ctx.beginPath(); ctx.arc(ox, oy, arm.r, 0, Math.PI * 2);
          ctx.strokeStyle = `hsla(${c.hue},50%,60%,${c.armOpacity * 0.12})`; ctx.lineWidth = 0.5; ctx.stroke();
          ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(positions[i + 1][0], positions[i + 1][1]);
          ctx.strokeStyle = `hsla(${c.hue},60%,65%,${c.armOpacity * 0.35})`; ctx.lineWidth = 0.8; ctx.stroke();
        });
      }

      // Tip
      trail.push([x, y]);
      ctx.beginPath(); ctx.arc(x, y, 2.5, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,255,255,0.9)'; ctx.fill();

      animId = requestAnimationFrame(draw);
    };

    resize(); initArms(Math.floor(getCfg().termCount)); draw();
    const ro = new ResizeObserver(() => resize()); ro.observe(canvas);
    return () => { cancelAnimationFrame(animId); ro.disconnect(); };
  },
};

// ─── 15. Strange Attractor ───────────────────────────────────────────────────

const attractorBg: BgDef = {
  id: 'attractor',
  label: 'Attractor',
  description: 'De Jong strange attractor — chaos theory rendered as emergent density geometry',
  defaults: { a: 1.4, b: -2.3, c: 2.4, d: -2.1, density: 5000, brightness: 0.5, hue: 210 },
  sliders: [
    { key: 'a',         label: 'a',          min: -3,   max: 3,     step: 0.01  },
    { key: 'b',         label: 'b',          min: -3,   max: 3,     step: 0.01  },
    { key: 'c',         label: 'c',          min: -3,   max: 3,     step: 0.01  },
    { key: 'd',         label: 'd',          min: -3,   max: 3,     step: 0.01  },
    { key: 'density',   label: 'Density',    min: 500,  max: 20000, step: 500   },
    { key: 'brightness',label: 'Brightness', min: 0.1,  max: 1.0,   step: 0.01  },
    { key: 'hue',       label: 'Hue',        min: 0,    max: 360,   step: 1     },
  ],
  create(canvas, getCfg) {
    const ctx = canvas.getContext('2d')!;
    let animId: number, x = 0.1, y = 0.1;
    let lastA = NaN, lastB = NaN, lastC = NaN, lastD = NaN;
    const resize = () => { const r = canvas.getBoundingClientRect(); canvas.width = r.width; canvas.height = r.height; };

    const draw = () => {
      const c = getCfg(); const w = canvas.width, h = canvas.height;
      if (c.a !== lastA || c.b !== lastB || c.c !== lastC || c.d !== lastD) {
        ctx.clearRect(0, 0, w, h); x = 0.1; y = 0.1;
        lastA = c.a; lastB = c.b; lastC = c.c; lastD = c.d;
      }
      const iters = Math.floor(c.density), scale = Math.min(w, h) * 0.23, cx = w / 2, cy = h / 2;
      ctx.fillStyle = `hsla(${c.hue},75%,65%,${c.brightness * 0.018})`;
      for (let i = 0; i < iters; i++) {
        const nx = Math.sin(c.a * y) - Math.cos(c.b * x);
        const ny = Math.sin(c.c * x) - Math.cos(c.d * y);
        x = nx; y = ny;
        const px = Math.round(cx + x * scale), py = Math.round(cy + y * scale);
        if (px >= 0 && px < w && py >= 0 && py < h) ctx.fillRect(px, py, 1, 1);
      }
      animId = requestAnimationFrame(draw);
    };

    resize(); draw();
    const ro = new ResizeObserver(() => resize()); ro.observe(canvas);
    return () => { cancelAnimationFrame(animId); ro.disconnect(); };
  },
};

// ─── 16. Spirograph ──────────────────────────────────────────────────────────

const spirographBg: BgDef = {
  id: 'spirograph',
  label: 'Spirograph',
  description: 'Hypotrochoid parametric curves — x=(R−r)cos t + d cos((R−r)t/r)',
  defaults: { R: 1.0, r: 0.38, d: 0.65, speed: 0.3, trailLength: 0.88, hue: 280, lineWidth: 1.0 },
  sliders: [
    { key: 'R',          label: 'Outer R',    min: 0.5, max: 3.0, step: 0.01 },
    { key: 'r',          label: 'Inner r',    min: 0.05,max: 1.5, step: 0.01 },
    { key: 'd',          label: 'Offset d',   min: 0,   max: 2.0, step: 0.01 },
    { key: 'speed',      label: 'Speed',      min: 0,   max: 1.5, step: 0.01 },
    { key: 'trailLength',label: 'Trail',      min: 0,   max: 1.0, step: 0.01 },
    { key: 'hue',        label: 'Hue',        min: 0,   max: 360, step: 1    },
    { key: 'lineWidth',  label: 'Line width', min: 0.3, max: 3.0, step: 0.1  },
  ],
  create(canvas, getCfg) {
    const ctx = canvas.getContext('2d')!;
    let animId: number, t = 0, prevT = 0;
    const resize = () => { const r = canvas.getBoundingClientRect(); canvas.width = r.width; canvas.height = r.height; t = 0; prevT = 0; };

    const draw = () => {
      const c = getCfg(); const w = canvas.width, h = canvas.height;
      prevT = t; t += c.speed * 0.018;

      ctx.fillStyle = `rgba(8,10,14,${0.02 + (1 - c.trailLength) * 0.55})`; ctx.fillRect(0, 0, w, h);

      const scale = Math.min(w, h) * 0.42, cx = w / 2, cy = h / 2;
      const R = c.R, r = c.r, d = c.d;
      const steps = Math.max(8, Math.round(Math.abs(t - prevT) * 300));

      ctx.beginPath();
      for (let i = 0; i <= steps; i++) {
        const a = prevT + (t - prevT) * i / steps;
        const px = cx + scale * ((R - r) * Math.cos(a) + d * Math.cos((R - r) * a / r));
        const py = cy + scale * ((R - r) * Math.sin(a) - d * Math.sin((R - r) * a / r));
        i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
      }
      const hue = (c.hue + t * 8) % 360;
      ctx.strokeStyle = `hsla(${hue},82%,66%,0.65)`; ctx.lineWidth = c.lineWidth;
      ctx.shadowBlur = 5; ctx.shadowColor = `hsla(${hue},82%,66%,0.3)`;
      ctx.stroke(); ctx.shadowBlur = 0;

      animId = requestAnimationFrame(draw);
    };

    resize(); draw();
    const ro = new ResizeObserver(() => resize()); ro.observe(canvas);
    return () => { cancelAnimationFrame(animId); ro.disconnect(); };
  },
};

// ─── 17. Wave Interference ───────────────────────────────────────────────────

const waveInterferenceBg: BgDef = {
  id: 'waveinterference',
  label: 'Wave Interference',
  description: 'Point sources emit circular waves — constructive and destructive interference',
  defaults: { sourceCount: 3, wavelength: 80, speed: 0.8, hueShift: 200, contrast: 1.4, brightness: 0.55 },
  sliders: [
    { key: 'sourceCount', label: 'Sources',    min: 1,   max: 8,   step: 1    },
    { key: 'wavelength',  label: 'Wavelength', min: 20,  max: 200, step: 5    },
    { key: 'speed',       label: 'Speed',      min: 0,   max: 2.0, step: 0.05 },
    { key: 'hueShift',    label: 'Hue',        min: 0,   max: 360, step: 1    },
    { key: 'contrast',    label: 'Contrast',   min: 0.5, max: 3.0, step: 0.1  },
    { key: 'brightness',  label: 'Brightness', min: 0.1, max: 1.0, step: 0.01 },
  ],
  create(canvas, getCfg) {
    const ctx = canvas.getContext('2d')!;
    let animId: number, wt = 0;
    let off: HTMLCanvasElement | null = null, offCtx: CanvasRenderingContext2D | null = null;
    type Src = { x: number; y: number };
    let sources: Src[] = [], lastN = -1;

    const h2rgb = (h: number, s: number, l: number) => {
      const c2=(1-Math.abs(2*l-1))*s,hh=h/60,x2=c2*(1-Math.abs(hh%2-1)),m=l-c2/2;
      let r=0,g=0,b=0;
      if(hh<1){r=c2;g=x2;}else if(hh<2){r=x2;g=c2;}
      else if(hh<3){g=c2;b=x2;}else if(hh<4){g=x2;b=c2;}
      else if(hh<5){r=x2;b=c2;}else{r=c2;b=x2;}
      return[Math.round((r+m)*255),Math.round((g+m)*255),Math.round((b+m)*255)];
    };

    const initSources = (n: number, w: number, h: number) => {
      const orbitR = Math.min(w, h) * 0.28;
      sources = Array.from({ length: n }, (_, i) => {
        const a = (i / n) * Math.PI * 2;
        return { x: w / 2 + Math.cos(a) * orbitR, y: h / 2 + Math.sin(a) * orbitR };
      });
      lastN = n;
    };

    const resize = () => {
      const r = canvas.getBoundingClientRect(); canvas.width = r.width; canvas.height = r.height;
      off = document.createElement('canvas');
      off.width = Math.ceil(r.width / 5); off.height = Math.ceil(r.height / 5);
      offCtx = off.getContext('2d')!; lastN = -1;
    };

    const draw = () => {
      const c = getCfg(); const w = canvas.width, h = canvas.height;
      wt += c.speed * 0.04;
      const n = Math.floor(c.sourceCount);
      if (n !== lastN) initSources(n, w, h);
      if (!off || !offCtx) { animId = requestAnimationFrame(draw); return; }

      const ow = off.width, oh = off.height, scaleX = w / ow, scaleY = h / oh;
      const k = (2 * Math.PI) / c.wavelength;
      const img = offCtx.createImageData(ow, oh); const data = img.data;

      for (let py = 0; py < oh; py++) for (let px = 0; px < ow; px++) {
        const wx = px * scaleX, wy = py * scaleY;
        let sum = 0;
        sources.forEach(s => sum += Math.sin(k * Math.hypot(wx - s.x, wy - s.y) - wt));
        const v = Math.tanh((sum / n) * c.contrast);
        const hue = ((v + 1) * 90 + c.hueShift) % 360;
        const light = Math.min(0.65, c.brightness * 0.3 + (v + 1) * 0.1);
        const [r2, g2, b2] = h2rgb(hue, 0.85, light);
        const i = (py * ow + px) * 4;
        data[i] = r2; data[i+1] = g2; data[i+2] = b2; data[i+3] = 255;
      }

      offCtx.putImageData(img, 0, 0);
      ctx.imageSmoothingEnabled = true; ctx.drawImage(off, 0, 0, w, h);
      animId = requestAnimationFrame(draw);
    };

    resize(); draw();
    const ro = new ResizeObserver(() => resize()); ro.observe(canvas);
    return () => { cancelAnimationFrame(animId); ro.disconnect(); };
  },
};

// ─── 18. Voronoi ─────────────────────────────────────────────────────────────

const voronoiBg: BgDef = {
  id: 'voronoi',
  label: 'Voronoi',
  description: 'Animated Voronoi tessellation — glowing crystalline cells in motion',
  defaults: { seedCount: 18, speed: 0.3, edgeGlow: 0.9, cellFill: 0.25, hue: 200, hueSpread: 130 },
  sliders: [
    { key: 'seedCount', label: 'Cells',      min: 4,  max: 40,  step: 1    },
    { key: 'speed',     label: 'Speed',       min: 0,  max: 1.5, step: 0.01 },
    { key: 'edgeGlow',  label: 'Edge glow',  min: 0,  max: 1.0, step: 0.01 },
    { key: 'cellFill',  label: 'Cell fill',  min: 0,  max: 0.6, step: 0.01 },
    { key: 'hue',       label: 'Base hue',   min: 0,  max: 360, step: 1    },
    { key: 'hueSpread', label: 'Hue spread', min: 0,  max: 360, step: 1    },
  ],
  create(canvas, getCfg) {
    const ctx = canvas.getContext('2d')!;
    let animId: number;
    let off: HTMLCanvasElement | null = null, offCtx: CanvasRenderingContext2D | null = null;
    type Seed = { x: number; y: number; vx: number; vy: number; hue: number };
    let seeds: Seed[] = [], lastN = -1;

    const h2rgb = (h: number, s: number, l: number) => {
      const c2=(1-Math.abs(2*l-1))*s,hh=h/60,x2=c2*(1-Math.abs(hh%2-1)),m=l-c2/2;
      let r=0,g=0,b=0;
      if(hh<1){r=c2;g=x2;}else if(hh<2){r=x2;g=c2;}
      else if(hh<3){g=c2;b=x2;}else if(hh<4){g=x2;b=c2;}
      else if(hh<5){r=x2;b=c2;}else{r=c2;b=x2;}
      return[Math.round((r+m)*255),Math.round((g+m)*255),Math.round((b+m)*255)];
    };

    const initSeeds = (n: number, w: number, h: number) => {
      const c = getCfg();
      seeds = Array.from({ length: n }, () => {
        const a = Math.random() * Math.PI * 2;
        return { x: Math.random() * w, y: Math.random() * h, vx: Math.cos(a) * 0.7, vy: Math.sin(a) * 0.7, hue: (c.hue + Math.random() * c.hueSpread) % 360 };
      });
      lastN = n;
    };

    const resize = () => {
      const r = canvas.getBoundingClientRect(); canvas.width = r.width; canvas.height = r.height;
      off = document.createElement('canvas');
      off.width = Math.ceil(r.width / 5); off.height = Math.ceil(r.height / 5);
      offCtx = off.getContext('2d')!; lastN = -1;
    };

    const draw = () => {
      const c = getCfg(); const w = canvas.width, h = canvas.height;
      const n = Math.floor(c.seedCount);
      if (n !== lastN) initSeeds(n, w, h);

      seeds.forEach(s => {
        s.x += s.vx * c.speed * 0.4; s.y += s.vy * c.speed * 0.4;
        if (s.x <= 0 || s.x >= w) s.vx *= -1;
        if (s.y <= 0 || s.y >= h) s.vy *= -1;
        s.x = Math.max(0, Math.min(w, s.x)); s.y = Math.max(0, Math.min(h, s.y));
      });

      if (!off || !offCtx) { animId = requestAnimationFrame(draw); return; }
      const ow = off.width, oh = off.height, scaleX = w / ow, scaleY = h / oh;
      const img = offCtx.createImageData(ow, oh); const data = img.data;
      const edgeThresh = Math.min(w, h) / ow * 10;

      for (let py = 0; py < oh; py++) for (let px = 0; px < ow; px++) {
        const wx = px * scaleX, wy = py * scaleY;
        let d1 = Infinity, d2 = Infinity, near = 0;
        seeds.forEach((s, i) => {
          const d = Math.hypot(wx - s.x, wy - s.y);
          if (d < d1) { d2 = d1; d1 = d; near = i; } else if (d < d2) d2 = d;
        });
        const edge = Math.max(0, 1 - (d2 - d1) / edgeThresh);
        const fill = Math.max(0, c.cellFill * (1 - d1 / (Math.min(w, h) * 0.5)));
        const brightness = Math.min(0.72, edge * edge * c.edgeGlow * 0.65 + fill);
        const hue = seeds[near].hue;
        const [r2, g2, b2] = h2rgb(hue, 0.75, brightness);
        const i = (py * ow + px) * 4;
        data[i] = r2; data[i+1] = g2; data[i+2] = b2; data[i+3] = 255;
      }

      offCtx.putImageData(img, 0, 0);
      ctx.imageSmoothingEnabled = true; ctx.drawImage(off, 0, 0, w, h);

      seeds.forEach(s => {
        const g = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, 9);
        g.addColorStop(0, `hsla(${s.hue},80%,92%,0.85)`); g.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.beginPath(); ctx.arc(s.x, s.y, 9, 0, Math.PI * 2); ctx.fillStyle = g; ctx.fill();
      });

      animId = requestAnimationFrame(draw);
    };

    resize(); draw();
    const ro = new ResizeObserver(() => resize()); ro.observe(canvas);
    return () => { cancelAnimationFrame(animId); ro.disconnect(); };
  },
};

// ─── 19. Pendulum Wave ───────────────────────────────────────────────────────

const pendulumBg: BgDef = {
  id: 'pendulum',
  label: 'Pendulum Wave',
  description: 'N pendulums with tuned frequencies drift in and out of phase — chaos becomes order',
  defaults: { count: 15, speed: 0.5, amplitude: 0.32, trailLength: 0.7, hue: 180, spread: 1.0 },
  sliders: [
    { key: 'count',       label: 'Pendulums',    min: 3,  max: 30,  step: 1    },
    { key: 'speed',       label: 'Speed',         min: 0,  max: 2.0, step: 0.01 },
    { key: 'amplitude',   label: 'Amplitude',     min: 0.1,max: 0.5, step: 0.01 },
    { key: 'trailLength', label: 'Trail',         min: 0,  max: 1.0, step: 0.01 },
    { key: 'hue',         label: 'Hue',           min: 0,  max: 360, step: 1    },
    { key: 'spread',      label: 'Freq spread',   min: 0.1,max: 3.0, step: 0.05 },
  ],
  create(canvas, getCfg) {
    const ctx = canvas.getContext('2d')!;
    let animId: number, t = 0;
    type Pend = { freq: number; trail: [number, number][] };
    let pends: Pend[] = [], lastN = -1;

    const initPends = (n: number) => {
      pends = Array.from({ length: n }, (_, i) => ({ freq: 2 + i * 0.18, trail: [] }));
      lastN = n;
    };

    const resize = () => { const r = canvas.getBoundingClientRect(); canvas.width = r.width; canvas.height = r.height; pends.forEach(p => p.trail = []); };

    const draw = () => {
      const c = getCfg(); const w = canvas.width, h = canvas.height;
      const n = Math.floor(c.count);
      if (n !== lastN) initPends(n);
      t += c.speed * 0.007;

      ctx.fillStyle = `rgba(8,10,14,${0.04 + (1 - c.trailLength) * 0.6})`; ctx.fillRect(0, 0, w, h);

      const pivotY = h * 0.12, ampPx = h * c.amplitude, spacing = w / (n + 1);
      const maxTrail = Math.round(c.trailLength * 300 + 30);

      // Connect all bobs — shows the wave shape
      ctx.beginPath();
      pends.forEach((p, i) => {
        const freq = p.freq * c.spread;
        const bobX = (i + 1) * spacing, bobY = h * 0.55 + ampPx * Math.sin(freq * t);
        i === 0 ? ctx.moveTo(bobX, bobY) : ctx.lineTo(bobX, bobY);
      });
      ctx.strokeStyle = `hsla(${c.hue},70%,65%,0.18)`; ctx.lineWidth = 1; ctx.stroke();

      pends.forEach((p, i) => {
        const freq = p.freq * c.spread;
        const bobX = (i + 1) * spacing, bobY = h * 0.55 + ampPx * Math.sin(freq * t);
        const hue = (c.hue + i * (120 / n)) % 360;

        p.trail.push([bobX, bobY]);
        if (p.trail.length > maxTrail) p.trail.shift();

        // String
        ctx.beginPath(); ctx.moveTo(bobX, pivotY); ctx.lineTo(bobX, bobY);
        ctx.strokeStyle = `hsla(${hue},50%,55%,0.15)`; ctx.lineWidth = 0.6; ctx.stroke();

        // Trail
        if (p.trail.length > 1) {
          ctx.beginPath();
          p.trail.forEach(([tx, ty], j) => j === 0 ? ctx.moveTo(tx, ty) : ctx.lineTo(tx, ty));
          ctx.strokeStyle = `hsla(${hue},75%,65%,0.4)`; ctx.lineWidth = 1; ctx.stroke();
        }

        // Bob
        const g = ctx.createRadialGradient(bobX, bobY, 0, bobX, bobY, 6);
        g.addColorStop(0, `hsla(${hue},85%,85%,0.95)`); g.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.beginPath(); ctx.arc(bobX, bobY, 6, 0, Math.PI * 2); ctx.fillStyle = g; ctx.fill();

        // Pivot dot
        ctx.beginPath(); ctx.arc(bobX, pivotY, 1.5, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${hue},60%,60%,0.4)`; ctx.fill();
      });

      // Bar
      ctx.beginPath(); ctx.moveTo(spacing * 0.5, pivotY); ctx.lineTo(spacing * (n + 0.5), pivotY);
      ctx.strokeStyle = `rgba(255,255,255,0.06)`; ctx.lineWidth = 1; ctx.stroke();

      animId = requestAnimationFrame(draw);
    };

    resize(); initPends(Math.floor(getCfg().count)); draw();
    const ro = new ResizeObserver(() => resize()); ro.observe(canvas);
    return () => { cancelAnimationFrame(animId); ro.disconnect(); };
  },
};

// ─── 20. 3D Wireframe ────────────────────────────────────────────────────────

const wireframeBg: BgDef = {
  id: 'wireframe',
  label: 'Wireframe',
  description: 'Rotating 3D solids in perspective — cube, icosahedron, torus',
  defaults: { shape: 2, rotSpeed: 0.3, tiltX: 0.5, fov: 7, glow: 0.7, hue: 200, edgeOpacity: 0.65 },
  sliders: [
    { key: 'shape',       label: 'Shape',        min: 0,   max: 2,   step: 1    },
    { key: 'rotSpeed',    label: 'Rotation',     min: 0,   max: 2.0, step: 0.01 },
    { key: 'tiltX',      label: 'X tilt',        min: 0,   max: 1.5, step: 0.01 },
    { key: 'fov',        label: 'Field of view', min: 2,   max: 15,  step: 0.1  },
    { key: 'glow',       label: 'Glow',          min: 0,   max: 1.0, step: 0.01 },
    { key: 'hue',        label: 'Hue',           min: 0,   max: 360, step: 1    },
    { key: 'edgeOpacity',label: 'Edge opacity',  min: 0.05,max: 1.0, step: 0.01 },
  ],
  create(canvas, getCfg) {
    const ctx = canvas.getContext('2d')!;
    let animId: number, ry = 0;

    // Cube
    const cubeV: [number,number,number][] = [[-1,-1,-1],[1,-1,-1],[1,1,-1],[-1,1,-1],[-1,-1,1],[1,-1,1],[1,1,1],[-1,1,1]];
    const cubeE: [number,number][] = [[0,1],[1,2],[2,3],[3,0],[4,5],[5,6],[6,7],[7,4],[0,4],[1,5],[2,6],[3,7]];

    // Icosahedron
    const phi = (1 + Math.sqrt(5)) / 2;
    const icoV: [number,number,number][] = [[0,1,phi],[0,-1,phi],[0,1,-phi],[0,-1,-phi],[1,phi,0],[-1,phi,0],[1,-phi,0],[-1,-phi,0],[phi,0,1],[-phi,0,1],[phi,0,-1],[-phi,0,-1]]
      .map(([x,y,z]) => { const l=Math.sqrt(x*x+y*y+z*z); return [x/l,y/l,z/l] as [number,number,number]; });
    const icoE = icoV.flatMap((a,i) => icoV.map((b,j) => ({i,j,d:Math.hypot(a[0]-b[0],a[1]-b[1],a[2]-b[2])})).filter(e=>e.j>e.i&&e.d<1.1).map(e=>[e.i,e.j] as [number,number]));

    // Torus
    const nu=24,nv=12,TR=0.62,tr=0.38;
    const torV: [number,number,number][] = [];
    for(let i=0;i<nu;i++){const u=(i/nu)*Math.PI*2;for(let j=0;j<nv;j++){const v=(j/nv)*Math.PI*2;torV.push([(TR+tr*Math.cos(v))*Math.cos(u),(TR+tr*Math.cos(v))*Math.sin(u),tr*Math.sin(v)]);}}
    const torE: [number,number][] = [];
    for(let i=0;i<nu;i++)for(let j=0;j<nv;j++){torE.push([i*nv+j,((i+1)%nu)*nv+j]);torE.push([i*nv+j,i*nv+(j+1)%nv]);}

    const SHAPES = [{V:cubeV,E:cubeE},{V:icoV,E:icoE},{V:torV,E:torE}];

    const proj = (v: [number,number,number], rx: number, ry2: number, fov: number, cx: number, cy: number, sc: number) => {
      let [x,y,z] = v;
      const y1=y*Math.cos(rx)-z*Math.sin(rx), z1=y*Math.sin(rx)+z*Math.cos(rx);
      const x2=x*Math.cos(ry2)+z1*Math.sin(ry2), z2=-x*Math.sin(ry2)+z1*Math.cos(ry2);
      const d=fov/(fov+z2+fov*0.9);
      return {sx:cx+x2*d*sc, sy:cy+y1*d*sc, depth:z2};
    };

    const resize = () => { const r = canvas.getBoundingClientRect(); canvas.width = r.width; canvas.height = r.height; };

    const draw = () => {
      const c = getCfg(); const w = canvas.width, h = canvas.height;
      ry += c.rotSpeed * 0.008;
      ctx.clearRect(0, 0, w, h);

      const shapeIdx = Math.min(2, Math.max(0, Math.round(c.shape)));
      const { V, E } = SHAPES[shapeIdx];
      const cx = w / 2, cy = h / 2, sc = Math.min(w, h) * 0.33;
      const projected = V.map(v => proj(v, c.tiltX, ry, c.fov, cx, cy, sc));

      // Sort edges back-to-front
      const sorted = [...E].sort((a, b) => {
        const da = (projected[a[0]].depth + projected[a[1]].depth) / 2;
        const db = (projected[b[0]].depth + projected[b[1]].depth) / 2;
        return da - db;
      });

      sorted.forEach(([i, j]) => {
        const pa = projected[i], pb = projected[j];
        const depth = (pa.depth + pb.depth) / 2;
        const depthFactor = Math.max(0.2, (depth + 1.5) / 3);
        const alpha = c.edgeOpacity * depthFactor;
        const hue = (c.hue + depth * 20) % 360;

        ctx.beginPath(); ctx.moveTo(pa.sx, pa.sy); ctx.lineTo(pb.sx, pb.sy);
        ctx.strokeStyle = `hsla(${hue},75%,65%,${alpha})`;
        ctx.lineWidth = 0.8 + depthFactor * 0.4;
        if (c.glow > 0.1) { ctx.shadowBlur = c.glow * 10; ctx.shadowColor = `hsla(${hue},80%,65%,0.4)`; }
        ctx.stroke(); ctx.shadowBlur = 0;
      });

      animId = requestAnimationFrame(draw);
    };

    resize(); draw();
    const ro = new ResizeObserver(() => resize()); ro.observe(canvas);
    return () => { cancelAnimationFrame(animId); ro.disconnect(); };
  },
};

// ─── 21. Harmonograph ────────────────────────────────────────────────────────

const harmonographBg: BgDef = {
  id: 'harmonograph',
  label: 'Harmonograph',
  description: 'Dual-pendulum drawing machine — two oscillators in slow phase drift',
  defaults: { f1: 2.0, f2: 3.0, phase: 1.57, phaseSpeed: 0.04, trailLength: 0.92, hue: 150, lineWidth: 0.9 },
  sliders: [
    { key: 'f1',         label: 'Frequency X',  min: 1.0, max: 6.0, step: 0.05 },
    { key: 'f2',         label: 'Frequency Y',  min: 1.0, max: 6.0, step: 0.05 },
    { key: 'phase',      label: 'Phase offset', min: 0,   max: 6.28,step: 0.01  },
    { key: 'phaseSpeed', label: 'Phase drift',  min: 0,   max: 0.2, step: 0.001 },
    { key: 'trailLength',label: 'Trail',        min: 0,   max: 1.0, step: 0.01  },
    { key: 'hue',        label: 'Hue',          min: 0,   max: 360, step: 1     },
    { key: 'lineWidth',  label: 'Line width',   min: 0.3, max: 3.0, step: 0.1   },
  ],
  create(canvas, getCfg) {
    const ctx = canvas.getContext('2d')!;
    let animId: number, t = 0, phase = getCfg().phase, prevX = 0, prevY = 0;
    const resize = () => { const r = canvas.getBoundingClientRect(); canvas.width = r.width; canvas.height = r.height; t = 0; };

    const draw = () => {
      const c = getCfg(); const w = canvas.width, h = canvas.height;
      phase += c.phaseSpeed * 0.002;
      t += 0.025;

      ctx.fillStyle = `rgba(8,10,14,${0.015 + (1 - c.trailLength) * 0.55})`; ctx.fillRect(0, 0, w, h);

      const rx = w * 0.45, ry = h * 0.45, cx = w / 2, cy = h / 2;
      const x = cx + rx * Math.sin(c.f1 * t + phase);
      const y = cy + ry * Math.sin(c.f2 * t);

      ctx.beginPath(); ctx.moveTo(prevX || x, prevY || y); ctx.lineTo(x, y);
      const hue = (c.hue + t * 2) % 360;
      ctx.strokeStyle = `hsla(${hue},80%,65%,0.55)`;
      ctx.lineWidth = c.lineWidth;
      ctx.shadowBlur = 4; ctx.shadowColor = `hsla(${hue},80%,65%,0.25)`;
      ctx.stroke(); ctx.shadowBlur = 0;

      prevX = x; prevY = y;
      animId = requestAnimationFrame(draw);
    };

    resize(); draw();
    const ro = new ResizeObserver(() => resize()); ro.observe(canvas);
    return () => { cancelAnimationFrame(animId); ro.disconnect(); };
  },
};

// ─── 22. Neon Grid ───────────────────────────────────────────────────────────

const neonGridBg: BgDef = {
  id: 'neongrid',
  label: 'Neon Grid',
  description: 'Synthwave perspective grid — vanishing lines and scanning horizon',
  defaults: { speed: 0.5, hue: 285, hue2: 195, gridLines: 16, brightness: 0.7, glow: 1.0, horizon: 0.42 },
  sliders: [
    { key: 'speed',     label: 'Speed',        min: 0,   max: 2.0, step: 0.01 },
    { key: 'hue',       label: 'Hue 1',        min: 0,   max: 360, step: 1    },
    { key: 'hue2',      label: 'Hue 2',        min: 0,   max: 360, step: 1    },
    { key: 'gridLines', label: 'Grid density', min: 4,   max: 40,  step: 1    },
    { key: 'brightness',label: 'Brightness',   min: 0.1, max: 1.0, step: 0.01 },
    { key: 'glow',      label: 'Glow',         min: 0,   max: 1.5, step: 0.01 },
    { key: 'horizon',   label: 'Horizon',      min: 0.2, max: 0.7, step: 0.01 },
  ],
  create(canvas, getCfg) {
    const ctx = canvas.getContext('2d')!;
    let animId: number, offset = 0;
    const resize = () => { const r = canvas.getBoundingClientRect(); canvas.width = r.width; canvas.height = r.height; };

    const draw = () => {
      const c = getCfg(); const w = canvas.width, h = canvas.height;
      offset = (offset + c.speed * 0.006) % 1;
      ctx.clearRect(0, 0, w, h);

      const vx = w / 2, vy = h * c.horizon;
      const ground = h - vy;

      // Sky glow
      const skyG = ctx.createLinearGradient(0, 0, 0, vy);
      skyG.addColorStop(0, 'rgba(8,10,14,1)');
      skyG.addColorStop(1, `hsla(${c.hue},60%,15%,${c.brightness * 0.4})`);
      ctx.fillStyle = skyG; ctx.fillRect(0, 0, w, vy);

      // Horizon glow
      const horizG = ctx.createRadialGradient(vx, vy, 0, vx, vy, w * 0.55);
      horizG.addColorStop(0, `hsla(${c.hue2},90%,70%,${c.brightness * 0.45})`);
      horizG.addColorStop(0.35, `hsla(${c.hue},80%,55%,${c.brightness * 0.12})`);
      horizG.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = horizG; ctx.fillRect(0, vy - h * 0.2, w, h * 0.4);

      // Ground fill
      const groundG = ctx.createLinearGradient(0, vy, 0, h);
      groundG.addColorStop(0, `hsla(${c.hue},40%,8%,1)`);
      groundG.addColorStop(1, 'rgba(8,10,14,1)');
      ctx.fillStyle = groundG; ctx.fillRect(0, vy, w, ground);

      const nl = Math.floor(c.gridLines);

      // Vertical converging lines
      ctx.save();
      for (let i = -nl; i <= nl; i++) {
        const xNear = vx + (i / nl) * w * 1.6;
        const xFar = vx + (i / nl) * w * 0.04;
        const fadeAlpha = c.brightness * Math.max(0, 1 - (Math.abs(i) / nl) * 0.85);
        const hue = i % 2 === 0 ? c.hue : c.hue2;
        const grad = ctx.createLinearGradient(0, vy, 0, h);
        grad.addColorStop(0, `hsla(${hue},80%,60%,0)`);
        grad.addColorStop(0.2, `hsla(${hue},80%,60%,${fadeAlpha * 0.6})`);
        grad.addColorStop(1, `hsla(${hue},80%,60%,${fadeAlpha * 0.25})`);
        ctx.beginPath(); ctx.moveTo(xFar, vy); ctx.lineTo(xNear, h);
        ctx.strokeStyle = grad; ctx.lineWidth = c.glow * 0.8 + 0.3;
        if (c.glow > 0.2) { ctx.shadowBlur = c.glow * 8; ctx.shadowColor = `hsla(${hue},90%,65%,0.5)`; }
        ctx.stroke(); ctx.shadowBlur = 0;
      }
      ctx.restore();

      // Horizontal scan lines (moving)
      const scanCount = 14;
      for (let i = 0; i < scanCount; i++) {
        const raw = ((i / scanCount) + offset) % 1;
        const t2 = raw * raw; // perspective foreshortening
        const y = vy + t2 * ground;
        const frac = (y - vy) / ground;
        const xSpan = frac * w * 1.6;
        const alpha = c.brightness * Math.pow(frac, 0.4) * 0.55;
        const hue = i % 2 === 0 ? c.hue : c.hue2;
        ctx.beginPath(); ctx.moveTo(Math.max(-50, vx - xSpan), y); ctx.lineTo(Math.min(w + 50, vx + xSpan), y);
        ctx.strokeStyle = `hsla(${hue},80%,65%,${alpha})`;
        ctx.lineWidth = (0.4 + frac * 1.2) * c.glow;
        if (c.glow > 0.4 && frac > 0.5) { ctx.shadowBlur = c.glow * 6 * frac; ctx.shadowColor = `hsla(${hue},90%,65%,0.4)`; }
        ctx.stroke(); ctx.shadowBlur = 0;
      }

      animId = requestAnimationFrame(draw);
    };

    resize(); draw();
    const ro = new ResizeObserver(() => resize()); ro.observe(canvas);
    return () => { cancelAnimationFrame(animId); ro.disconnect(); };
  },
};

// ─── 23. Reaction Diffusion ───────────────────────────────────────────────────

const reactionDiffBg: BgDef = {
  id: 'reactiondiff',
  label: 'Reaction Diffusion',
  description: 'Gray-Scott Turing patterns — chemistry spontaneously forms spots, stripes, and coral',
  defaults: { feed: 0.035, kill: 0.065, speed: 5, da: 1.0, db: 0.5, colorMode: 0 },
  sliders: [
    { key: 'feed',       label: 'Feed rate',    min: 0.010, max: 0.080, step: 0.001 },
    { key: 'kill',       label: 'Kill rate',    min: 0.040, max: 0.075, step: 0.001 },
    { key: 'speed',      label: 'Steps/frame',  min: 1,     max: 12,    step: 1     },
    { key: 'da',         label: 'Diffuse A',    min: 0.5,   max: 1.5,   step: 0.05  },
    { key: 'db',         label: 'Diffuse B',    min: 0.1,   max: 0.9,   step: 0.05  },
    { key: 'colorMode',  label: 'Palette',      min: 0,     max: 2,     step: 1     },
  ],
  create(canvas, getCfg) {
    const ctx = canvas.getContext('2d')!;
    let animId: number;
    let gw = 1, gh = 1;
    let A = new Float32Array(1), B = new Float32Array(1);
    let nA = new Float32Array(1), nB = new Float32Array(1);
    let imgData = new ImageData(1, 1);
    let offCanvas: HTMLCanvasElement | null = null;
    let offCtx: CanvasRenderingContext2D | null = null;
    let lastF = -1, lastK = -1;

    const seed = () => {
      A.fill(1); B.fill(0);
      for (let s = 0; s < 8; s++) {
        const cx = Math.floor(Math.random() * gw), cy = Math.floor(Math.random() * gh);
        const rad = 2 + Math.floor(Math.random() * 4);
        for (let dy = -rad; dy <= rad; dy++) for (let dx = -rad; dx <= rad; dx++) {
          const ix = cx + dx, iy = cy + dy;
          if (ix >= 0 && ix < gw && iy >= 0 && iy < gh) {
            const i = iy * gw + ix; A[i] = 0.5 + Math.random() * 0.1; B[i] = 0.25 + Math.random() * 0.1;
          }
        }
      }
    };

    const resize = () => {
      const r = canvas.getBoundingClientRect(); canvas.width = r.width; canvas.height = r.height;
      gw = Math.ceil(r.width / 3); gh = Math.ceil(r.height / 3);
      A = new Float32Array(gw * gh); B = new Float32Array(gw * gh);
      nA = new Float32Array(gw * gh); nB = new Float32Array(gw * gh);
      imgData = new ImageData(gw, gh);
      offCanvas = document.createElement('canvas'); offCanvas.width = gw; offCanvas.height = gh;
      offCtx = offCanvas.getContext('2d')!;
      lastF = -1; lastK = -1; seed();
    };

    const step = (f: number, k: number, da: number, db: number) => {
      for (let y = 1; y < gh - 1; y++) for (let x = 1; x < gw - 1; x++) {
        const i = y * gw + x, a = A[i], b = B[i];
        const lapA = A[i-1] + A[i+1] + A[i-gw] + A[i+gw] - 4 * a;
        const lapB = B[i-1] + B[i+1] + B[i-gw] + B[i+gw] - 4 * b;
        const abb = a * b * b;
        nA[i] = Math.max(0, Math.min(1, a + da * lapA - abb + f * (1 - a)));
        nB[i] = Math.max(0, Math.min(1, b + db * lapB + abb - (f + k) * b));
      }
      const tA = A; A = nA; nA = tA; const tB = B; B = nB; nB = tB;
    };

    const draw = () => {
      const c = getCfg();
      const f = c.feed, k = c.kill, da = c.da * 0.2, db = c.db * 0.1, sps = Math.round(c.speed), cm = Math.round(c.colorMode);
      if (f !== lastF || k !== lastK) { seed(); lastF = f; lastK = k; }
      for (let s = 0; s < sps; s++) step(f, k, da, db);
      const d = imgData.data;
      for (let i = 0; i < gw * gh; i++) {
        const bv = Math.max(0, Math.min(1, B[i]));
        let r = 0, g = 0, bl = 0;
        if (cm === 0) { r = Math.floor(bv * 8); g = Math.floor(bv * 100); bl = Math.floor(bv * 255 + 10); }
        else if (cm === 1) { r = Math.floor(bv * 255); g = Math.floor(bv * 140 * (1 - bv) * 2); bl = Math.floor((1-bv)*20); }
        else { r = Math.floor(bv * 180 + 20); g = Math.floor(A[i] * 30); bl = Math.floor(bv * 160 + A[i] * 60); }
        d[i*4] = r; d[i*4+1] = g; d[i*4+2] = bl; d[i*4+3] = 255;
      }
      offCtx!.putImageData(imgData, 0, 0);
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(offCanvas!, 0, 0, gw, gh, 0, 0, canvas.width, canvas.height);
      animId = requestAnimationFrame(draw);
    };

    resize(); draw();
    const ro = new ResizeObserver(() => resize()); ro.observe(canvas);
    return () => { cancelAnimationFrame(animId); ro.disconnect(); };
  },
};

// ─── 24. Physarum ─────────────────────────────────────────────────────────────

const physarumBg: BgDef = {
  id: 'physarum',
  label: 'Physarum',
  description: 'Slime mold agent simulation — thousands of agents weave living vascular networks',
  defaults: { agents: 6000, sensorAngle: 45, sensorDist: 9, turnSpeed: 35, evaporation: 0.97, speed: 1.0 },
  sliders: [
    { key: 'agents',      label: 'Agents',       min: 500,  max: 15000, step: 500  },
    { key: 'sensorAngle', label: 'Sensor angle', min: 10,   max: 90,    step: 1    },
    { key: 'sensorDist',  label: 'Sensor dist',  min: 2,    max: 30,    step: 1    },
    { key: 'turnSpeed',   label: 'Turn speed',   min: 5,    max: 90,    step: 1    },
    { key: 'evaporation', label: 'Persistence',  min: 0.85, max: 0.995, step: 0.005 },
    { key: 'speed',       label: 'Move speed',   min: 0.3,  max: 3.0,   step: 0.1  },
  ],
  create(canvas, getCfg) {
    const ctx = canvas.getContext('2d')!;
    let animId: number;
    let gw = 1, gh = 1;
    let trail = new Float32Array(1), blurred = new Float32Array(1);
    let agX = new Float32Array(1), agY = new Float32Array(1), agA = new Float32Array(1);
    let imgData = new ImageData(1, 1);
    let offCanvas: HTMLCanvasElement | null = null;
    let offCtx: CanvasRenderingContext2D | null = null;
    let lastN = -1;

    const resize = () => {
      const r = canvas.getBoundingClientRect(); canvas.width = r.width; canvas.height = r.height;
      gw = Math.ceil(r.width / 2); gh = Math.ceil(r.height / 2);
      trail = new Float32Array(gw * gh); blurred = new Float32Array(gw * gh);
      imgData = new ImageData(gw, gh);
      offCanvas = document.createElement('canvas'); offCanvas.width = gw; offCanvas.height = gh;
      offCtx = offCanvas.getContext('2d')!;
      lastN = -1;
    };

    const initAgents = (n: number) => {
      agX = new Float32Array(n); agY = new Float32Array(n); agA = new Float32Array(n);
      const cx = gw / 2, cy = gh / 2;
      for (let i = 0; i < n; i++) {
        const a = Math.random() * Math.PI * 2, r = Math.random() * Math.min(gw, gh) * 0.28;
        agX[i] = cx + Math.cos(a) * r; agY[i] = cy + Math.sin(a) * r; agA[i] = a + Math.PI;
      }
      lastN = n;
    };

    const sense = (x: number, y: number, ang: number, sd: number) => {
      const sx = Math.floor(x + Math.cos(ang) * sd), sy = Math.floor(y + Math.sin(ang) * sd);
      if (sx < 0 || sx >= gw || sy < 0 || sy >= gh) return 0;
      return trail[sy * gw + sx];
    };

    const draw = () => {
      const c = getCfg();
      const n = Math.round(c.agents);
      if (n !== lastN) initAgents(n);
      const sa = c.sensorAngle * Math.PI / 180, sd = c.sensorDist;
      const ts = c.turnSpeed * Math.PI / 180, ev = c.evaporation, spd = c.speed;

      for (let i = 0; i < n; i++) {
        const fwd = sense(agX[i], agY[i], agA[i], sd);
        const lft = sense(agX[i], agY[i], agA[i] - sa, sd);
        const rgt = sense(agX[i], agY[i], agA[i] + sa, sd);
        if (fwd < lft && fwd < rgt) agA[i] += (Math.random() < 0.5 ? ts : -ts);
        else if (lft > rgt) agA[i] -= ts;
        else if (rgt > lft) agA[i] += ts;
        const nx = agX[i] + Math.cos(agA[i]) * spd, ny = agY[i] + Math.sin(agA[i]) * spd;
        if (nx < 0 || nx >= gw || ny < 0 || ny >= gh) { agA[i] = Math.random() * Math.PI * 2; agX[i] = Math.max(0, Math.min(gw-1, nx)); agY[i] = Math.max(0, Math.min(gh-1, ny)); }
        else { agX[i] = nx; agY[i] = ny; }
        const gi = Math.floor(agY[i]) * gw + Math.floor(agX[i]);
        if (gi >= 0 && gi < trail.length) trail[gi] = Math.min(1, trail[gi] + 0.12);
      }

      for (let y = 1; y < gh-1; y++) for (let x = 1; x < gw-1; x++) {
        const i = y * gw + x;
        blurred[i] = ((trail[i]*2 + trail[i-1] + trail[i+1] + trail[i-gw] + trail[i+gw]) / 6) * ev;
      }
      const tmp = trail; trail = blurred; blurred = tmp;

      const d = imgData.data;
      for (let i = 0; i < gw * gh; i++) {
        const v = Math.min(1, trail[i]), v2 = v * v;
        d[i*4] = Math.floor(v * 30 + v2 * 100); d[i*4+1] = Math.floor(v * 200 + v2 * 55);
        d[i*4+2] = Math.floor(v * 50); d[i*4+3] = 255;
      }
      offCtx!.putImageData(imgData, 0, 0);
      ctx.imageSmoothingEnabled = true;
      ctx.drawImage(offCanvas!, 0, 0, gw, gh, 0, 0, canvas.width, canvas.height);
      animId = requestAnimationFrame(draw);
    };

    resize(); draw();
    const ro = new ResizeObserver(() => resize()); ro.observe(canvas);
    return () => { cancelAnimationFrame(animId); ro.disconnect(); };
  },
};

// ─── 25. Double Pendulum ──────────────────────────────────────────────────────

const doublePendulumBg: BgDef = {
  id: 'doublependulum',
  label: 'Double Pendulum',
  description: 'Coupled chaotic oscillators — near-identical initial conditions diverge into fractal orbits',
  defaults: { count: 14, trailLen: 500, speed: 1.5, gravity: 9.8, arm1: 1.0, arm2: 1.0 },
  sliders: [
    { key: 'count',   label: 'Pendulums', min: 1,   max: 30,   step: 1    },
    { key: 'trailLen',label: 'Trail',     min: 50,  max: 1200, step: 25   },
    { key: 'speed',   label: 'Speed',     min: 0.1, max: 4.0,  step: 0.1  },
    { key: 'gravity', label: 'Gravity',   min: 1,   max: 20,   step: 0.5  },
    { key: 'arm1',    label: 'Arm 1',     min: 0.3, max: 2.0,  step: 0.05 },
    { key: 'arm2',    label: 'Arm 2',     min: 0.3, max: 2.0,  step: 0.05 },
  ],
  create(canvas, getCfg) {
    const ctx = canvas.getContext('2d')!;
    let animId: number;
    type P = { t1: number; t2: number; w1: number; w2: number; trail: Array<[number,number]> };
    let pends: P[] = [];
    let lastCount = -1, lastG = -1, lastL1 = -1, lastL2 = -1;
    const palette = ['#4af','#f4a','#4fa','#fa4','#a4f','#af4','#f84','#84f','#4f8','#8f4','#f48','#48f','#fa8','#8af','#af8'];

    const init = (n: number) => {
      pends = Array.from({ length: n }, (_, i) => ({
        t1: Math.PI * 0.72 + i * 0.0015, t2: Math.PI * 0.52 + i * 0.0015, w1: 0, w2: 0, trail: []
      }));
      lastCount = n;
    };

    const stepPend = (p: P, dt: number, g: number, l1: number, l2: number) => {
      const d = p.t1 - p.t2, den = 3 - Math.cos(2 * d);
      const a1 = (-g*3*Math.sin(p.t1) - g*Math.sin(p.t1-2*p.t2) - 2*Math.sin(d)*(p.w2*p.w2*l2+p.w1*p.w1*l1*Math.cos(d))) / (l1*den);
      const a2 = (2*Math.sin(d)*(p.w1*p.w1*l1*2+g*2*Math.cos(p.t1)+p.w2*p.w2*l2*Math.cos(d))) / (l2*den);
      p.w1 += a1*dt; p.w2 += a2*dt; p.t1 += p.w1*dt; p.t2 += p.w2*dt;
    };

    const resize = () => {
      const r = canvas.getBoundingClientRect(); canvas.width = r.width; canvas.height = r.height;
      ctx.clearRect(0, 0, canvas.width, canvas.height); lastCount = -1;
    };

    const draw = () => {
      const c = getCfg();
      const n = Math.round(c.count), g = c.gravity, l1 = c.arm1, l2 = c.arm2, spd = c.speed, trLen = Math.round(c.trailLen);
      if (n !== lastCount || g !== lastG || l1 !== lastL1 || l2 !== lastL2) { init(n); lastG = g; lastL1 = l1; lastL2 = l2; }
      const cw = canvas.width, ch = canvas.height;
      ctx.fillStyle = 'rgba(8,10,14,0.18)'; ctx.fillRect(0, 0, cw, ch);
      const ox = cw / 2, oy = ch * 0.36, sc = Math.min(cw, ch) * 0.21, dt = 0.016 * spd;
      for (let s = 0; s < Math.max(1, Math.round(spd)); s++) pends.forEach(p => stepPend(p, dt / Math.max(1,Math.round(spd)), g, l1, l2));
      pends.forEach((p, idx) => {
        const x1 = ox + Math.sin(p.t1)*l1*sc, y1 = oy + Math.cos(p.t1)*l1*sc;
        const x2 = x1 + Math.sin(p.t2)*l2*sc, y2 = y1 + Math.cos(p.t2)*l2*sc;
        p.trail.push([x2, y2]); if (p.trail.length > trLen) p.trail.shift();
        if (p.trail.length > 1) {
          ctx.beginPath();
          p.trail.forEach(([tx,ty], i) => i === 0 ? ctx.moveTo(tx,ty) : ctx.lineTo(tx,ty));
          ctx.strokeStyle = palette[idx % palette.length]; ctx.lineWidth = 0.7; ctx.globalAlpha = 0.5; ctx.stroke(); ctx.globalAlpha = 1;
        }
      });
      animId = requestAnimationFrame(draw);
    };

    resize(); draw();
    const ro = new ResizeObserver(() => resize()); ro.observe(canvas);
    return () => { cancelAnimationFrame(animId); ro.disconnect(); };
  },
};

// ─── 26. Lorenz Attractor ─────────────────────────────────────────────────────

const lorenzBg: BgDef = {
  id: 'lorenz',
  label: 'Lorenz Attractor',
  description: 'Strange attractor — chaos butterfly from three coupled differential equations',
  defaults: { sigma: 10, rho: 28, beta: 2.67, density: 300, zoom: 0.85, hue: 200 },
  sliders: [
    { key: 'sigma',   label: 'Sigma σ',   min: 2,   max: 20,  step: 0.1  },
    { key: 'rho',     label: 'Rho ρ',     min: 10,  max: 45,  step: 0.1  },
    { key: 'beta',    label: 'Beta β',    min: 0.5, max: 5.0, step: 0.05 },
    { key: 'density', label: 'Density',   min: 50,  max: 800, step: 10   },
    { key: 'zoom',    label: 'Zoom',      min: 0.3, max: 2.5, step: 0.05 },
    { key: 'hue',     label: 'Hue',       min: 0,   max: 360, step: 1    },
  ],
  create(canvas, getCfg) {
    const ctx = canvas.getContext('2d')!;
    let animId: number, x = 0.1, y = 0, z = 0;
    let lastSigma = NaN, lastRho = NaN, lastBeta = NaN;
    const dt = 0.005;

    const resize = () => { const r = canvas.getBoundingClientRect(); canvas.width = r.width; canvas.height = r.height; lastSigma = NaN; };

    const draw = () => {
      const c = getCfg();
      const { sigma, rho, beta, zoom, hue } = c, steps = Math.round(c.density);
      const cw = canvas.width, ch = canvas.height;
      if (sigma !== lastSigma || rho !== lastRho || beta !== lastBeta) {
        ctx.clearRect(0, 0, cw, ch); x = 0.1 + Math.random()*0.01; y = 0; z = 0;
        lastSigma = sigma; lastRho = rho; lastBeta = beta;
      }
      const sc = Math.min(cw, ch) * 0.018 * zoom, ox = cw / 2, oy = ch * 0.5;
      ctx.globalAlpha = 0.012;
      for (let i = 0; i < steps; i++) {
        const dx = sigma*(y-x), dy = x*(rho-z)-y, dz = x*y-beta*z;
        x += dx*dt; y += dy*dt; z += dz*dt;
        const px = ox + x*sc, py = oy + (z - rho*0.62)*(-sc);
        const h = (((z/rho)*280 + hue) % 360 + 360) % 360;
        ctx.fillStyle = `hsl(${h},80%,68%)`;
        ctx.fillRect(Math.round(px), Math.round(py), 1, 1);
      }
      ctx.globalAlpha = 1;
      animId = requestAnimationFrame(draw);
    };

    resize(); draw();
    const ro = new ResizeObserver(() => resize()); ro.observe(canvas);
    return () => { cancelAnimationFrame(animId); ro.disconnect(); };
  },
};

// ─── 27. Domain Warp ─────────────────────────────────────────────────────────

const domainWarpBg: BgDef = {
  id: 'domainwarp',
  label: 'Domain Warp',
  description: 'Layered fBm domain warping — f(p+f(p)) creates infinite fluid complexity',
  defaults: { octaves: 4, warpStr: 1.2, speed: 0.18, scale: 2.0, hueBase: 240, hueRange: 120 },
  sliders: [
    { key: 'octaves',  label: 'Octaves',    min: 1,   max: 6,   step: 1    },
    { key: 'warpStr',  label: 'Warp strength', min: 0, max: 3.0, step: 0.05 },
    { key: 'speed',    label: 'Speed',      min: 0,   max: 1.0, step: 0.01 },
    { key: 'scale',    label: 'Scale',      min: 0.5, max: 5.0, step: 0.1  },
    { key: 'hueBase',  label: 'Hue base',   min: 0,   max: 360, step: 1    },
    { key: 'hueRange', label: 'Hue range',  min: 0,   max: 360, step: 1    },
  ],
  create(canvas, getCfg) {
    const ctx = canvas.getContext('2d')!;
    let animId: number, t = 0;
    let gw = 1, gh = 1, imgData = new ImageData(1, 1);
    let offCanvas: HTMLCanvasElement | null = null;
    let offCtx: CanvasRenderingContext2D | null = null;

    const hash = (n: number) => { let x = Math.sin(n) * 43758.5453123; return x - Math.floor(x); };
    const noise2 = (x: number, y: number) => {
      const ix = Math.floor(x), iy = Math.floor(y), fx = x-ix, fy = y-iy;
      const ux = fx*fx*(3-2*fx), uy = fy*fy*(3-2*fy);
      const a = hash(ix+iy*57), b = hash(ix+1+iy*57), c2 = hash(ix+(iy+1)*57), d = hash(ix+1+(iy+1)*57);
      return a*(1-ux)*(1-uy)+b*ux*(1-uy)+c2*(1-ux)*uy+d*ux*uy;
    };
    const fbm = (x: number, y: number, oct: number) => {
      let v = 0, amp = 0.5, freq = 1;
      for (let i = 0; i < oct; i++) { v += noise2(x*freq+i*3.7, y*freq+i*1.3)*amp; freq*=2; amp*=0.5; }
      return v;
    };

    const resize = () => {
      const r = canvas.getBoundingClientRect(); canvas.width = r.width; canvas.height = r.height;
      gw = Math.ceil(r.width / 5); gh = Math.ceil(r.height / 5);
      imgData = new ImageData(gw, gh);
      offCanvas = document.createElement('canvas'); offCanvas.width = gw; offCanvas.height = gh;
      offCtx = offCanvas.getContext('2d')!;
    };

    const draw = () => {
      const c = getCfg(); t += c.speed * 0.004;
      const oct = Math.round(c.octaves), ws = c.warpStr, sc = c.scale;
      const hb = c.hueBase, hr = c.hueRange, d = imgData.data;
      for (let py = 0; py < gh; py++) for (let px = 0; px < gw; px++) {
        const x = (px / gw) * sc, y = (py / gh) * sc;
        const q1 = fbm(x + t, y, oct), q2 = fbm(x + t + 5.2, y + 1.3, oct);
        const r1 = fbm(x + ws*q1 + 1.7, y + ws*q2 + 9.2 + t*0.5, oct);
        const r2 = fbm(x + ws*q1 + 8.3, y + ws*q2 + 2.8 + t*0.5, oct);
        const v = fbm(x + ws*r1, y + ws*r2, oct);
        const hue = (hb + v * hr) % 360;
        const sat = 65 + v * 25, lit = 25 + v * 45;
        const [rv, gv, bv] = hslToRgb(hue/360, sat/100, lit/100);
        const i = py * gw + px;
        d[i*4] = rv; d[i*4+1] = gv; d[i*4+2] = bv; d[i*4+3] = 255;
      }
      offCtx!.putImageData(imgData, 0, 0);
      ctx.imageSmoothingEnabled = true;
      ctx.drawImage(offCanvas!, 0, 0, gw, gh, 0, 0, canvas.width, canvas.height);
      animId = requestAnimationFrame(draw);
    };

    resize(); draw();
    const ro = new ResizeObserver(() => resize()); ro.observe(canvas);
    return () => { cancelAnimationFrame(animId); ro.disconnect(); };
  },
};

function hslToRgb(h: number, s: number, l: number): [number,number,number] {
  const q = l < 0.5 ? l*(1+s) : l+s-l*s, p = 2*l-q;
  const hue2rgb = (t: number) => { if(t<0)t+=1;if(t>1)t-=1;if(t<1/6)return p+(q-p)*6*t;if(t<1/2)return q;if(t<2/3)return p+(q-p)*(2/3-t)*6;return p; };
  return [Math.round(hue2rgb(h+1/3)*255), Math.round(hue2rgb(h)*255), Math.round(hue2rgb(h-1/3)*255)];
}

// ─── 28. Galaxy ───────────────────────────────────────────────────────────────

const galaxyBg: BgDef = {
  id: 'galaxy',
  label: 'Galaxy',
  description: 'Logarithmic spiral arms with differential orbital rotation and stellar color gradients',
  defaults: { stars: 8000, arms: 3, spread: 0.28, speed: 0.06, armTwist: 3.5, brightness: 0.6 },
  sliders: [
    { key: 'stars',      label: 'Stars',       min: 1000,  max: 20000, step: 500  },
    { key: 'arms',       label: 'Arms',        min: 1,     max: 6,     step: 1    },
    { key: 'spread',     label: 'Arm spread',  min: 0.05,  max: 0.8,   step: 0.01 },
    { key: 'speed',      label: 'Rotation',    min: 0,     max: 0.3,   step: 0.005 },
    { key: 'armTwist',   label: 'Arm twist',   min: 0.5,   max: 8.0,   step: 0.1  },
    { key: 'brightness', label: 'Brightness',  min: 0.2,   max: 1.0,   step: 0.05 },
  ],
  create(canvas, getCfg) {
    const ctx = canvas.getContext('2d')!;
    let animId: number, t = 0;
    type Star = { r: number; baseAngle: number; arm: number; size: number; speed: number; colorT: number };
    let stars: Star[] = [];
    let lastStars = -1, lastArms = -1;

    const initStars = (n: number, arms: number) => {
      stars = Array.from({ length: n }, () => {
        const r = Math.pow(Math.random(), 0.6), arm = Math.floor(Math.random() * arms);
        const baseAngle = (arm / arms) * Math.PI * 2;
        return { r, baseAngle, arm, size: 0.4 + Math.random() * 1.2, speed: 1 / (0.2 + r * 0.8), colorT: Math.random() };
      });
      lastStars = n; lastArms = arms;
    };

    const resize = () => { const r = canvas.getBoundingClientRect(); canvas.width = r.width; canvas.height = r.height; };

    const draw = () => {
      const c = getCfg();
      const n = Math.round(c.stars), arms = Math.round(c.arms);
      if (n !== lastStars || arms !== lastArms) initStars(n, arms);
      t += c.speed * 0.001;
      const cw = canvas.width, ch = canvas.height;
      ctx.clearRect(0, 0, cw, ch);
      const sc = Math.min(cw, ch) * 0.44, ox = cw/2, oy = ch/2;

      // Bulge
      const bg = ctx.createRadialGradient(ox, oy, 0, ox, oy, sc*0.15);
      bg.addColorStop(0, `rgba(255,230,180,${c.brightness*0.9})`);
      bg.addColorStop(0.5, `rgba(200,170,100,${c.brightness*0.3})`);
      bg.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = bg; ctx.fillRect(0, 0, cw, ch);

      stars.forEach(s => {
        const spiralAngle = s.baseAngle + s.r * c.armTwist;
        const noise = (Math.random() - 0.5) * c.spread * 2;
        const ang = spiralAngle + t * s.speed * 0.4 + noise;
        const px = ox + Math.cos(ang) * s.r * sc, py = oy + Math.sin(ang) * s.r * sc;
        const dist = s.r;
        const alpha = (1 - dist * 0.6) * c.brightness * (0.5 + Math.random() * 0.5);
        const temp = s.colorT;
        let r = 255, g = 255, bl = 255;
        if (temp < 0.3) { r=180; g=210; bl=255; }
        else if (temp < 0.6) { r=255; g=255; bl=220; }
        else { r=255; g=200; bl=150; }
        ctx.beginPath(); ctx.arc(px, py, s.size, 0, Math.PI*2);
        ctx.fillStyle = `rgba(${r},${g},${bl},${alpha.toFixed(2)})`; ctx.fill();
      });

      animId = requestAnimationFrame(draw);
    };

    resize(); initStars(Math.round(getCfg().stars), Math.round(getCfg().arms)); draw();
    const ro = new ResizeObserver(() => resize()); ro.observe(canvas);
    return () => { cancelAnimationFrame(animId); ro.disconnect(); };
  },
};

// ─── 29. DLA Crystal ─────────────────────────────────────────────────────────

const dlaBg: BgDef = {
  id: 'dla',
  label: 'DLA Crystal',
  description: 'Diffusion-limited aggregation — random walkers crystallize into lightning and coral',
  defaults: { walkersPerFrame: 6, glowStr: 0.7, resetSpeed: 0, hue: 190, saturate: 0.8, maxFill: 0.35 },
  sliders: [
    { key: 'walkersPerFrame', label: 'Growth rate',  min: 1,   max: 20,  step: 1    },
    { key: 'glowStr',         label: 'Glow',         min: 0.1, max: 1.0, step: 0.05 },
    { key: 'hue',             label: 'Hue',          min: 0,   max: 360, step: 1    },
    { key: 'saturate',        label: 'Saturation',   min: 0.2, max: 1.0, step: 0.05 },
    { key: 'maxFill',         label: 'Max density',  min: 0.1, max: 0.7, step: 0.05 },
  ],
  create(canvas, getCfg) {
    const ctx = canvas.getContext('2d')!;
    let animId: number;
    let gw = 1, gh = 1;
    let grid: Uint8Array;
    let stuckCount = 0;
    let imgData = new ImageData(1, 1);
    let offCanvas: HTMLCanvasElement | null = null;
    let offCtx: CanvasRenderingContext2D | null = null;
    let dirty = true;

    const reset = () => {
      grid = new Uint8Array(gw * gh);
      const cx = Math.floor(gw/2), cy = Math.floor(gh/2);
      grid[cy*gw+cx] = 1; stuckCount = 1; dirty = true;
    };

    const resize = () => {
      const r = canvas.getBoundingClientRect(); canvas.width = r.width; canvas.height = r.height;
      gw = Math.ceil(r.width / 3); gh = Math.ceil(r.height / 3);
      imgData = new ImageData(gw, gh);
      offCanvas = document.createElement('canvas'); offCanvas.width = gw; offCanvas.height = gh;
      offCtx = offCanvas.getContext('2d')!;
      reset();
    };

    const isAdjacentToStuck = (x: number, y: number) =>
      (x>0 && grid[y*gw+(x-1)]) || (x<gw-1 && grid[y*gw+(x+1)]) ||
      (y>0 && grid[(y-1)*gw+x]) || (y<gh-1 && grid[(y+1)*gw+x]);

    const draw = () => {
      const c = getCfg();
      if (stuckCount > gw * gh * c.maxFill) reset();
      const wpf = Math.round(c.walkersPerFrame);
      for (let w = 0; w < wpf; w++) {
        let wx = Math.floor(Math.random() * gw), wy = Math.floor(Math.random() * gh);
        for (let step = 0; step < 5000; step++) {
          const dir = Math.floor(Math.random() * 4);
          if (dir === 0 && wx > 0) wx--; else if (dir === 1 && wx < gw-1) wx++;
          else if (dir === 2 && wy > 0) wy--; else if (dir === 3 && wy < gh-1) wy++;
          if (isAdjacentToStuck(wx, wy)) { grid[wy*gw+wx] = 1; stuckCount++; dirty = true; break; }
        }
      }
      if (dirty) {
        const d = imgData.data;
        const h = c.hue, sat = c.saturate * 80, glw = c.glowStr;
        for (let i = 0; i < gw * gh; i++) {
          if (grid[i]) {
            const x = i % gw, y = Math.floor(i / gw);
            const distC = Math.sqrt((x-gw/2)**2+(y-gh/2)**2) / Math.max(gw,gh) * 2;
            const lit = Math.floor(40 + distC * 60 + Math.random() * 20);
            const [rv, gv, bv] = hslToRgb(h/360, sat/100, lit/100);
            d[i*4] = rv; d[i*4+1] = gv; d[i*4+2] = bv; d[i*4+3] = 255;
          } else { d[i*4] = 8; d[i*4+1] = 10; d[i*4+2] = 14; d[i*4+3] = 255; }
        }
        offCtx!.putImageData(imgData, 0, 0);
        ctx.imageSmoothingEnabled = true;
        ctx.drawImage(offCanvas!, 0, 0, gw, gh, 0, 0, canvas.width, canvas.height);
        if (glw > 0) {
          ctx.filter = `blur(${Math.round(glw * 8)}px)`;
          ctx.globalCompositeOperation = 'screen'; ctx.globalAlpha = glw * 0.5;
          ctx.drawImage(offCanvas!, 0, 0, gw, gh, 0, 0, canvas.width, canvas.height);
          ctx.filter = 'none'; ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
        }
        dirty = false;
      }
      animId = requestAnimationFrame(draw);
    };

    resize(); draw();
    const ro = new ResizeObserver(() => resize()); ro.observe(canvas);
    return () => { cancelAnimationFrame(animId); ro.disconnect(); };
  },
};

// ─── 30. Fractal Tree ────────────────────────────────────────────────────────

const fractalTreeBg: BgDef = {
  id: 'fractaltree',
  label: 'Fractal Tree',
  description: 'Recursive branching with wind sway — L-system grown into living architecture',
  defaults: { depth: 10, angle: 26, lengthRatio: 0.68, wind: 0.4, speed: 0.5, leafDensity: 0.7 },
  sliders: [
    { key: 'depth',       label: 'Depth',        min: 4,   max: 14,  step: 1    },
    { key: 'angle',       label: 'Branch angle', min: 5,   max: 60,  step: 1    },
    { key: 'lengthRatio', label: 'Length ratio', min: 0.4, max: 0.85,step: 0.01 },
    { key: 'wind',        label: 'Wind',         min: 0,   max: 1.5, step: 0.05 },
    { key: 'speed',       label: 'Sway speed',   min: 0.1, max: 2.0, step: 0.1  },
    { key: 'leafDensity', label: 'Leaf density', min: 0,   max: 1.0, step: 0.05 },
  ],
  create(canvas, getCfg) {
    const ctx = canvas.getContext('2d')!;
    let animId: number, t = 0;
    const resize = () => { const r = canvas.getBoundingClientRect(); canvas.width = r.width; canvas.height = r.height; };

    const branch = (x: number, y: number, len: number, ang: number, depth: number, maxDepth: number, ratio: number, branchAng: number) => {
      if (depth === 0 || len < 1) return;
      const x2 = x + Math.cos(ang) * len, y2 = y + Math.sin(ang) * len;
      const thickness = Math.max(0.3, (depth / maxDepth) * 3.5);
      const g = depth / maxDepth;
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x2, y2);
      ctx.strokeStyle = depth <= 2
        ? `rgba(80,160,60,0.75)`
        : `rgba(${Math.floor(80+g*60)},${Math.floor(50+g*40)},${Math.floor(20+g*20)},0.8)`;
      ctx.lineWidth = thickness; ctx.stroke();
      if (depth <= 2 && Math.random() < getCfg().leafDensity) {
        ctx.beginPath(); ctx.arc(x2, y2, 2.5 + Math.random()*2, 0, Math.PI*2);
        ctx.fillStyle = `rgba(${60+Math.floor(Math.random()*80)},${150+Math.floor(Math.random()*80)},40,0.55)`; ctx.fill();
      }
      branch(x2, y2, len*ratio, ang - branchAng, depth-1, maxDepth, ratio, branchAng);
      branch(x2, y2, len*ratio, ang + branchAng, depth-1, maxDepth, ratio, branchAng);
    };

    const draw = () => {
      const c = getCfg(); t += c.speed * 0.012;
      const cw = canvas.width, ch = canvas.height;
      ctx.clearRect(0, 0, cw, ch);
      const trunkLen = ch * 0.22, depth = Math.round(c.depth);
      const windAngle = Math.sin(t) * c.wind * 0.08 + Math.cos(t * 0.37) * c.wind * 0.04;
      ctx.lineCap = 'round';
      branch(cw/2, ch*0.92, trunkLen, -Math.PI/2 + windAngle, depth, depth, c.lengthRatio, c.angle * Math.PI/180);
      animId = requestAnimationFrame(draw);
    };

    resize(); draw();
    const ro = new ResizeObserver(() => resize()); ro.observe(canvas);
    return () => { cancelAnimationFrame(animId); ro.disconnect(); };
  },
};

// ─── 31. Magnetic Field ──────────────────────────────────────────────────────

const magneticFieldBg: BgDef = {
  id: 'magneticfield',
  label: 'Magnetic Field',
  description: 'Magnetic dipole field lines — charge particles drift along invisible force geometry',
  defaults: { poleStrength: 1.0, poleSpacing: 0.35, lineCount: 28, particleCount: 80, speed: 0.8, hue: 200 },
  sliders: [
    { key: 'poleStrength',  label: 'Pole strength', min: 0.2, max: 3.0,  step: 0.1  },
    { key: 'poleSpacing',   label: 'Pole spacing',  min: 0.1, max: 0.8,  step: 0.05 },
    { key: 'lineCount',     label: 'Field lines',   min: 4,   max: 60,   step: 2    },
    { key: 'particleCount', label: 'Particles',     min: 0,   max: 200,  step: 5    },
    { key: 'speed',         label: 'Particle speed',min: 0,   max: 3.0,  step: 0.1  },
    { key: 'hue',           label: 'Hue',           min: 0,   max: 360,  step: 1    },
  ],
  create(canvas, getCfg) {
    const ctx = canvas.getContext('2d')!;
    let animId: number;
    type Particle = { t: number; lineIdx: number; speed: number };
    let particles: Particle[] = [];
    let fieldLines: Array<[number,number][]> = [];
    let lastLineCount = -1, lastSpacing = -1, lastStrength = -1, lastParticleCount = -1;

    const computeB = (x: number, y: number, ps: number, py1: number, py2: number) => {
      const dx1 = x, dy1 = y - py1, r1sq = dx1*dx1+dy1*dy1+0.0001, r1 = Math.sqrt(r1sq);
      const dx2 = x, dy2 = y - py2, r2sq = dx2*dx2+dy2*dy2+0.0001, r2 = Math.sqrt(r2sq);
      const bx = ps*(dx1/(r1sq*r1) - dx2/(r2sq*r2));
      const by = ps*(dy1/(r1sq*r1) - dy2/(r2sq*r2));
      return [bx, by];
    };

    const buildLines = (count: number, spacing: number, strength: number, cw: number, ch: number) => {
      const cx = cw/2, cy = ch/2;
      const sep = Math.min(cw,ch)*spacing*0.5;
      fieldLines = [];
      for (let i = 0; i < count; i++) {
        const startAng = (i/count)*Math.PI*2;
        const r0 = Math.min(cw,ch)*0.06;
        let px = cx + Math.cos(startAng)*r0, py = cy - sep + Math.sin(startAng)*r0*0.3;
        const line: [number,number][] = [[px, py]];
        const stepSize = Math.min(cw,ch)*0.008;
        for (let s = 0; s < 300; s++) {
          const [bx, by] = computeB(px-cx, py-cy, strength, -sep, sep);
          const len = Math.sqrt(bx*bx+by*by)+0.0001;
          px += (bx/len)*stepSize; py += (by/len)*stepSize;
          if (px < 0||px > cw||py < 0||py > ch) break;
          line.push([px, py]);
        }
        fieldLines.push(line);
      }
      lastLineCount = count; lastSpacing = spacing; lastStrength = strength;
    };

    const resize = () => { const r = canvas.getBoundingClientRect(); canvas.width = r.width; canvas.height = r.height; lastLineCount = -1; };

    const draw = () => {
      const c = getCfg();
      const lc = Math.round(c.lineCount), pc = Math.round(c.particleCount);
      const cw = canvas.width, ch = canvas.height;
      if (lc !== lastLineCount || c.poleSpacing !== lastSpacing || c.poleStrength !== lastStrength)
        buildLines(lc, c.poleSpacing, c.poleStrength, cw, ch);
      if (pc !== lastParticleCount) {
        particles = Array.from({ length: pc }, () => ({
          t: Math.random(), lineIdx: Math.floor(Math.random()*fieldLines.length), speed: 0.003+Math.random()*0.004
        }));
        lastParticleCount = pc;
      }
      ctx.fillStyle = 'rgba(8,10,14,0.25)'; ctx.fillRect(0, 0, cw, ch);
      const cx = cw/2, cy = ch/2, sep = Math.min(cw,ch)*c.poleSpacing*0.5;

      fieldLines.forEach(line => {
        if (line.length < 2) return;
        ctx.beginPath(); ctx.moveTo(line[0][0], line[0][1]);
        line.forEach(([x,y]) => ctx.lineTo(x,y));
        ctx.strokeStyle = `hsla(${c.hue},65%,55%,0.12)`; ctx.lineWidth = 0.8; ctx.stroke();
      });

      [cy-sep, cy+sep].forEach((py, i) => {
        const grad = ctx.createRadialGradient(cx,py,0,cx,py,Math.min(cw,ch)*0.07);
        grad.addColorStop(0, i===0 ? 'rgba(255,80,80,0.9)' : 'rgba(80,120,255,0.9)');
        grad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.beginPath(); ctx.arc(cx,py,Math.min(cw,ch)*0.07,0,Math.PI*2);
        ctx.fillStyle = grad; ctx.fill();
      });

      particles.forEach(p => {
        p.t = (p.t + p.speed * c.speed) % 1;
        const line = fieldLines[p.lineIdx];
        if (!line || line.length < 2) return;
        const idx = Math.floor(p.t * (line.length-1));
        const [px, py] = line[idx];
        const grd = ctx.createRadialGradient(px,py,0,px,py,4);
        grd.addColorStop(0, `hsla(${c.hue+40},90%,80%,0.9)`); grd.addColorStop(1,'rgba(0,0,0,0)');
        ctx.beginPath(); ctx.arc(px,py,3,0,Math.PI*2); ctx.fillStyle=grd; ctx.fill();
      });

      animId = requestAnimationFrame(draw);
    };

    resize(); draw();
    const ro = new ResizeObserver(() => resize()); ro.observe(canvas);
    return () => { cancelAnimationFrame(animId); ro.disconnect(); };
  },
};

// ─── 32. IFS Fractal ─────────────────────────────────────────────────────────

const ifsFractalBg: BgDef = {
  id: 'ifsfractal',
  label: 'IFS Fractal',
  description: 'Iterated function system chaos game — affine transforms weave Barnsley ferns and crystals',
  defaults: { density: 8000, hue: 120, brightness: 0.6, morphSpeed: 0.0, zoom: 0.85, variant: 0 },
  sliders: [
    { key: 'density',    label: 'Density',    min: 1000,  max: 30000, step: 500  },
    { key: 'hue',        label: 'Hue',        min: 0,     max: 360,   step: 1    },
    { key: 'brightness', label: 'Brightness', min: 0.1,   max: 1.0,   step: 0.05 },
    { key: 'morphSpeed', label: 'Morph speed',min: 0,     max: 0.5,   step: 0.01 },
    { key: 'zoom',       label: 'Zoom',       min: 0.3,   max: 2.0,   step: 0.05 },
    { key: 'variant',    label: 'Variant',    min: 0,     max: 3,     step: 1    },
  ],
  create(canvas, getCfg) {
    const ctx = canvas.getContext('2d')!;
    let animId: number, t = 0;
    let lastVariant = -1;
    type IFSTransform = { a:number; b:number; c:number; d:number; e:number; f:number; p:number };
    let transforms: IFSTransform[] = [];

    const variants: IFSTransform[][] = [
      // Barnsley Fern
      [{a:0,b:0,c:0,d:0.16,e:0,f:0,p:0.01},{a:0.85,b:0.04,c:-0.04,d:0.85,e:0,f:1.6,p:0.85},{a:0.2,b:-0.26,c:0.23,d:0.22,e:0,f:1.6,p:0.07},{a:-0.15,b:0.28,c:0.26,d:0.24,e:0,f:0.44,p:0.07}],
      // Sierpinski-like
      [{a:0.5,b:0,c:0,d:0.5,e:0,f:0,p:0.33},{a:0.5,b:0,c:0,d:0.5,e:0.5,f:0,p:0.33},{a:0.5,b:0,c:0,d:0.5,e:0.25,f:0.43,p:0.34}],
      // Coral / tree
      [{a:0.787,b:-0.234,c:0.234,d:0.787,e:0.1,f:0.16,p:0.9},{a:0.149,b:0.0,c:0.0,d:-0.149,e:0.5,f:0.31,p:0.05},{a:0.149,b:0.0,c:0.0,d:0.149,e:-0.5,f:0.31,p:0.05}],
      // Dragon
      [{a:0.824,b:0.281,c:-0.212,d:0.864,e:-1.882,f:-0.110,p:0.87},{a:0.088,b:0.520,c:-0.463,d:-0.378,e:0.785,f:8.095,p:0.13}],
    ];

    const resize = () => { const r = canvas.getBoundingClientRect(); canvas.width = r.width; canvas.height = r.height; lastVariant = -1; };

    const draw = () => {
      const c = getCfg();
      t += c.morphSpeed * 0.005;
      const vIdx = Math.round(c.variant) % variants.length;
      if (vIdx !== lastVariant) {
        transforms = variants[vIdx].map(tf => ({...tf})); ctx.clearRect(0,0,canvas.width,canvas.height); lastVariant = vIdx;
      }
      const iters = Math.round(c.density), cw = canvas.width, ch = canvas.height;
      const sc = Math.min(cw, ch) * 0.09 * c.zoom;
      const ox = cw*0.5, oy = ch*0.85;
      let px = 0, py = 0;
      const tfs = transforms;
      const cumProbs: number[] = []; let cum = 0;
      tfs.forEach(tf => { cum += tf.p; cumProbs.push(cum); });
      ctx.globalAlpha = c.brightness * 0.02;
      for (let i = 0; i < iters; i++) {
        const r2 = Math.random(); let idx = 0;
        while (idx < cumProbs.length-1 && r2 > cumProbs[idx]) idx++;
        const tf = tfs[idx];
        const nx = tf.a*px + tf.b*py + tf.e, ny = tf.c*px + tf.d*py + tf.f;
        px = nx; py = ny;
        const sx = ox + px*sc, sy = oy - py*sc;
        const hue = ((c.hue + py*20) % 360 + 360) % 360;
        ctx.fillStyle = `hsl(${hue},75%,65%)`;
        ctx.fillRect(Math.round(sx), Math.round(sy), 1, 1);
      }
      ctx.globalAlpha = 1;
      animId = requestAnimationFrame(draw);
    };

    resize(); draw();
    const ro = new ResizeObserver(() => resize()); ro.observe(canvas);
    return () => { cancelAnimationFrame(animId); ro.disconnect(); };
  },
};

// ─── 33. Fluid Simulation ────────────────────────────────────────────────────

const fluidBg: BgDef = {
  id: 'fluid',
  label: 'Fluid Sim',
  description: 'Semi-Lagrangian advection — ink injected into self-stirring turbulent flow',
  defaults: { turbulence: 0.7, inkRate: 1.0, viscosity: 0.985, persistence: 0.998, palette: 0 },
  sliders: [
    { key: 'turbulence',   label: 'Turbulence',   min: 0,    max: 2.0,  step: 0.05  },
    { key: 'inkRate',      label: 'Ink rate',     min: 0,    max: 3.0,  step: 0.1   },
    { key: 'viscosity',    label: 'Viscosity',    min: 0.9,  max: 1.0,  step: 0.001 },
    { key: 'persistence',  label: 'Persistence',  min: 0.99, max: 1.0,  step: 0.0005 },
    { key: 'palette',      label: 'Palette',      min: 0,    max: 2,    step: 1     },
  ],
  create(canvas, getCfg) {
    const ctx = canvas.getContext('2d')!;
    let animId: number, t = 0;
    let gw = 1, gh = 1;
    let u: Float32Array, v: Float32Array, dens: Float32Array;
    let imgData = new ImageData(1, 1);
    let off: HTMLCanvasElement | null = null, offCtx: CanvasRenderingContext2D | null = null;

    const sample = (f: Float32Array, x: number, y: number) => {
      x = Math.max(0, Math.min(gw - 1.001, x)); y = Math.max(0, Math.min(gh - 1.001, y));
      const ix = Math.floor(x), iy = Math.floor(y), fx = x-ix, fy = y-iy;
      return f[ix+iy*gw]*(1-fx)*(1-fy) + f[(ix+1)+iy*gw]*fx*(1-fy) + f[ix+(iy+1)*gw]*(1-fx)*fy + f[(ix+1)+(iy+1)*gw]*fx*fy;
    };

    const advect = (dst: Float32Array, src: Float32Array) => {
      for (let y2 = 0; y2 < gh; y2++) for (let x2 = 0; x2 < gw; x2++) {
        const i = x2 + y2*gw; dst[i] = sample(src, x2 - u[i], y2 - v[i]);
      }
    };

    const resize = () => {
      const r = canvas.getBoundingClientRect(); canvas.width = r.width; canvas.height = r.height;
      gw = Math.ceil(r.width / 3); gh = Math.ceil(r.height / 3);
      u = new Float32Array(gw*gh); v = new Float32Array(gw*gh); dens = new Float32Array(gw*gh);
      imgData = new ImageData(gw, gh);
      off = document.createElement('canvas'); off.width = gw; off.height = gh; offCtx = off.getContext('2d')!;
    };

    const draw = () => {
      t += 0.008; const c = getCfg(), turb = c.turbulence * 0.018;
      for (let y2 = 0; y2 < gh; y2++) for (let x2 = 0; x2 < gw; x2++) {
        const i = x2+y2*gw, fx = x2/gw, fy = y2/gh;
        u[i] = (u[i] + turb*(Math.sin(fx*4.7+t*1.3+fy*2.1)+Math.cos(fy*3.1+t*0.8))) * c.viscosity;
        v[i] = (v[i] + turb*(Math.cos(fy*3.9+t*1.1+fx*1.6)+Math.sin(fx*2.8+t*0.6))) * c.viscosity;
      }
      const nu = new Float32Array(gw*gh), nv = new Float32Array(gw*gh);
      advect(nu, u); advect(nv, v); u.set(nu); v.set(nv);
      const ia = t*1.7, ix2 = Math.floor(gw/2 + Math.cos(ia)*gw*0.2), iy2 = Math.floor(gh/2 + Math.sin(ia*0.61)*gh*0.18);
      for (let dy2 = -2; dy2 <= 2; dy2++) for (let dx2 = -2; dx2 <= 2; dx2++) {
        const ni = (ix2+dx2)+(iy2+dy2)*gw;
        if (ni >= 0 && ni < dens.length) dens[ni] = Math.min(3, dens[ni] + c.inkRate*0.35);
      }
      const nd = new Float32Array(gw*gh); advect(nd, dens);
      for (let i = 0; i < nd.length; i++) nd[i] *= c.persistence; dens.set(nd);
      const d = imgData.data, cm = Math.round(c.palette);
      for (let i = 0; i < gw*gh; i++) {
        const val = Math.min(1, dens[i]*0.55);
        let r2=0, g2=0, b2=0;
        if (cm===0){r2=Math.floor(val*18);g2=Math.floor(val*130);b2=Math.floor(val*255);}
        else if (cm===1){r2=Math.floor(val*255);g2=Math.floor(val*val*160+val*40);b2=Math.floor(val*30);}
        else{r2=Math.floor(val*210+val*val*45);g2=Math.floor(val*50);b2=Math.floor(val*230);}
        d[i*4]=r2;d[i*4+1]=g2;d[i*4+2]=b2;d[i*4+3]=255;
      }
      offCtx!.putImageData(imgData, 0, 0); ctx.imageSmoothingEnabled=true;
      ctx.drawImage(off!, 0, 0, gw, gh, 0, 0, canvas.width, canvas.height);
      animId = requestAnimationFrame(draw);
    };

    resize(); draw();
    const ro = new ResizeObserver(() => resize()); ro.observe(canvas);
    return () => { cancelAnimationFrame(animId); ro.disconnect(); };
  },
};

// ─── 34. Boids ───────────────────────────────────────────────────────────────

const boidsBg: BgDef = {
  id: 'boids',
  label: 'Boids',
  description: 'Reynolds flocking — alignment, cohesion, and separation create emergent murmuration',
  defaults: { count: 280, maxSpeed: 3.5, separation: 22, alignment: 65, cohesion: 90, trailLen: 12 },
  sliders: [
    { key: 'count',      label: 'Flock size',  min: 30,  max: 600, step: 10  },
    { key: 'maxSpeed',   label: 'Max speed',   min: 0.5, max: 8.0, step: 0.1 },
    { key: 'separation', label: 'Separation',  min: 5,   max: 60,  step: 1   },
    { key: 'alignment',  label: 'Alignment',   min: 10,  max: 150, step: 5   },
    { key: 'cohesion',   label: 'Cohesion',    min: 10,  max: 200, step: 5   },
    { key: 'trailLen',   label: 'Trail',       min: 0,   max: 50,  step: 1   },
  ],
  create(canvas, getCfg) {
    const ctx = canvas.getContext('2d')!;
    let animId: number;
    type Boid = { x: number; y: number; vx: number; vy: number; trail: Array<[number,number]>; hue: number };
    let boids: Boid[] = []; let lastCount = -1;

    const initBoids = (n: number) => {
      const cw = canvas.width, ch = canvas.height;
      boids = Array.from({ length: n }, (_, i) => {
        const a = Math.random()*Math.PI*2;
        return { x: Math.random()*cw, y: Math.random()*ch, vx: Math.cos(a)*2, vy: Math.sin(a)*2, trail: [], hue: (i/n)*360 };
      });
      lastCount = n;
    };

    const resize = () => { const r = canvas.getBoundingClientRect(); canvas.width = r.width; canvas.height = r.height; lastCount = -1; };

    const draw = () => {
      const c = getCfg(), n = Math.round(c.count);
      if (n !== lastCount) initBoids(n);
      const cw = canvas.width, ch = canvas.height;
      ctx.fillStyle = 'rgba(8,10,14,0.28)'; ctx.fillRect(0, 0, cw, ch);
      const sep = c.separation, ali = c.alignment, coh = c.cohesion, ms = c.maxSpeed, tl = Math.round(c.trailLen);
      boids.forEach((b, bi) => {
        let sx=0,sy=0,sc2=0, avx=0,avy=0,ac=0, cx2=0,cy2=0,cc=0;
        for (let j=0;j<n;j++) {
          if (j===bi) continue;
          const dx=boids[j].x-b.x, dy=boids[j].y-b.y, d2=dx*dx+dy*dy;
          if (d2<sep*sep){sx-=dx;sy-=dy;sc2++;}
          if (d2<ali*ali){avx+=boids[j].vx;avy+=boids[j].vy;ac++;}
          if (d2<coh*coh){cx2+=boids[j].x;cy2+=boids[j].y;cc++;}
        }
        const ss=0.05;
        if(sc2>0){b.vx+=(sx/sc2)*ss*1.8;b.vy+=(sy/sc2)*ss*1.8;}
        if(ac>0){b.vx+=(avx/ac-b.vx)*ss;b.vy+=(avy/ac-b.vy)*ss;}
        if(cc>0){b.vx+=(cx2/cc-b.x)*ss*0.35;b.vy+=(cy2/cc-b.y)*ss*0.35;}
        const sp=Math.sqrt(b.vx*b.vx+b.vy*b.vy);
        if(sp>ms){b.vx=b.vx/sp*ms;b.vy=b.vy/sp*ms;}
        if(sp<0.8){b.vx+=(Math.random()-0.5)*0.6;b.vy+=(Math.random()-0.5)*0.6;}
        b.trail.push([b.x,b.y]); if(b.trail.length>tl) b.trail.shift();
        b.x+=b.vx; b.y+=b.vy;
        if(b.x<0)b.x=cw;if(b.x>cw)b.x=0;if(b.y<0)b.y=ch;if(b.y>ch)b.y=0;
      });
      boids.forEach(b => {
        if(b.trail.length>1){ctx.beginPath();b.trail.forEach(([tx,ty],i)=>i===0?ctx.moveTo(tx,ty):ctx.lineTo(tx,ty));ctx.strokeStyle=`hsla(${b.hue},70%,65%,0.45)`;ctx.lineWidth=0.8;ctx.stroke();}
        const ang=Math.atan2(b.vy,b.vx);ctx.save();ctx.translate(b.x,b.y);ctx.rotate(ang);
        ctx.beginPath();ctx.moveTo(5,0);ctx.lineTo(-3,2.5);ctx.lineTo(-3,-2.5);ctx.closePath();
        ctx.fillStyle=`hsl(${b.hue},70%,72%)`;ctx.fill();ctx.restore();
      });
      animId = requestAnimationFrame(draw);
    };

    resize(); draw();
    const ro = new ResizeObserver(() => resize()); ro.observe(canvas);
    return () => { cancelAnimationFrame(animId); ro.disconnect(); };
  },
};

// ─── 35. Julia Set ───────────────────────────────────────────────────────────

const juliaBg: BgDef = {
  id: 'julia',
  label: 'Julia Set',
  description: 'Animated Julia set — c orbits the Mandelbrot boundary revealing infinite fractal depth',
  defaults: { maxIter: 96, zoom: 1.0, orbitRadius: 0.75, orbitSpeed: 0.25, palette: 0 },
  sliders: [
    { key: 'maxIter',     label: 'Max iterations', min: 16,  max: 256, step: 8    },
    { key: 'zoom',        label: 'Zoom',           min: 0.3, max: 4.0, step: 0.05 },
    { key: 'orbitRadius', label: 'c orbit radius', min: 0.1, max: 1.5, step: 0.01 },
    { key: 'orbitSpeed',  label: 'c orbit speed',  min: 0,   max: 1.0, step: 0.01 },
    { key: 'palette',     label: 'Palette',        min: 0,   max: 3,   step: 1    },
  ],
  create(canvas, getCfg) {
    const ctx = canvas.getContext('2d')!;
    let animId: number, t = 0;
    let gw = 1, gh = 1, imgData = new ImageData(1,1);
    let off: HTMLCanvasElement|null=null, offCtx: CanvasRenderingContext2D|null=null;

    const resize = () => {
      const r = canvas.getBoundingClientRect(); canvas.width=r.width; canvas.height=r.height;
      gw=Math.ceil(r.width/4); gh=Math.ceil(r.height/4);
      imgData=new ImageData(gw,gh); off=document.createElement('canvas'); off.width=gw; off.height=gh; offCtx=off.getContext('2d')!;
    };

    const draw = () => {
      const c = getCfg(); t += c.orbitSpeed*0.008;
      const pulsR = c.orbitRadius*(0.72+0.22*Math.cos(t*0.29));
      const cReal = pulsR*Math.cos(t), cImag = pulsR*Math.sin(t);
      const maxIter = Math.round(c.maxIter), sc = 2.5/c.zoom, d = imgData.data, pal = Math.round(c.palette);
      for (let py=0; py<gh; py++) for (let px=0; px<gw; px++) {
        let zr=(px/gw-0.5)*sc*(gw/gh), zi=(py/gh-0.5)*sc, it=0;
        while(it<maxIter){const zr2=zr*zr,zi2=zi*zi;if(zr2+zi2>4)break;zi=2*zr*zi+cImag;zr=zr2-zi2+cReal;it++;}
        let val=0;
        if(it<maxIter){const zr2=zr*zr,zi2=zi*zi;val=(it+1-Math.log(Math.log(Math.sqrt(zr2+zi2))*Math.LOG2E)*Math.LOG2E)/maxIter;val=Math.max(0,val);}
        const idx=px+py*gw; let r2=0,g2=0,b2=0;
        if(val>0){
          if(pal===0){[r2,g2,b2]=hslToRgb(((val*300+240)%360)/360,0.85,0.45+val*0.35);}
          else if(pal===1){r2=Math.floor(val*255);g2=Math.floor(val*val*200);b2=Math.floor(val<0.4?val*2.5*80:0);}
          else if(pal===2){[r2,g2,b2]=hslToRgb((200+val*80)/360,0.75,0.2+val*0.6);}
          else{[r2,g2,b2]=hslToRgb((40+val*40)/360,0.9,0.1+val*0.75);}
        }
        d[idx*4]=r2;d[idx*4+1]=g2;d[idx*4+2]=b2;d[idx*4+3]=255;
      }
      offCtx!.putImageData(imgData,0,0); ctx.imageSmoothingEnabled=true;
      ctx.drawImage(off!,0,0,gw,gh,0,0,canvas.width,canvas.height);
      animId = requestAnimationFrame(draw);
    };

    resize(); draw();
    const ro = new ResizeObserver(() => resize()); ro.observe(canvas);
    return () => { cancelAnimationFrame(animId); ro.disconnect(); };
  },
};

// ─── 36. Curl Noise ──────────────────────────────────────────────────────────

const curlNoiseBg: BgDef = {
  id: 'curlnoise',
  label: 'Curl Noise',
  description: 'Particles follow the curl of fBm noise — divergence-free flow with infinite turbulent detail',
  defaults: { count: 2500, noiseScale: 2.2, speed: 1.4, fadeAlpha: 0.96, hue: 195, octaves: 3 },
  sliders: [
    { key: 'count',      label: 'Particles',  min: 200,  max: 6000, step: 100  },
    { key: 'noiseScale', label: 'Scale',      min: 0.5,  max: 5.0,  step: 0.1  },
    { key: 'speed',      label: 'Speed',      min: 0.1,  max: 5.0,  step: 0.1  },
    { key: 'fadeAlpha',  label: 'Trail fade', min: 0.8,  max: 1.0,  step: 0.005 },
    { key: 'hue',        label: 'Hue',        min: 0,    max: 360,  step: 1    },
    { key: 'octaves',    label: 'Octaves',    min: 1,    max: 5,    step: 1    },
  ],
  create(canvas, getCfg) {
    const ctx = canvas.getContext('2d')!;
    let animId: number, t = 0;
    let px2: Float32Array, py2: Float32Array;
    let lastN = -1;

    const h2 = (n: number) => { const x = Math.sin(n)*43758.5453; return x-Math.floor(x); };
    const noise2 = (x: number, y: number) => {
      const ix=Math.floor(x),iy=Math.floor(y),fx=x-ix,fy=y-iy,ux=fx*fx*(3-2*fx),uy=fy*fy*(3-2*fy);
      return h2(ix+iy*57)*(1-ux)*(1-uy)+h2(ix+1+iy*57)*ux*(1-uy)+h2(ix+(iy+1)*57)*(1-ux)*uy+h2(ix+1+(iy+1)*57)*ux*uy;
    };
    const fbm2 = (x: number, y: number, oct: number) => { let v=0,a=0.5,f=1; for(let i=0;i<oct;i++){v+=noise2(x*f+i*3.7,y*f+i*1.3)*a;f*=2;a*=0.5;} return v; };

    const resize = () => { const r = canvas.getBoundingClientRect(); canvas.width=r.width; canvas.height=r.height; ctx.clearRect(0,0,r.width,r.height); lastN=-1; };
    const initP = (n: number) => { px2=new Float32Array(n); py2=new Float32Array(n); for(let i=0;i<n;i++){px2[i]=Math.random()*canvas.width;py2[i]=Math.random()*canvas.height;} lastN=n; };

    const draw = () => {
      t += 0.003; const c = getCfg(), n = Math.round(c.count);
      if(n!==lastN) initP(n);
      const cw=canvas.width, ch=canvas.height, spd=c.speed*3, sc=c.noiseScale, oct=Math.round(c.octaves);
      ctx.fillStyle=`rgba(8,10,14,${(1-c.fadeAlpha).toFixed(3)})`; ctx.fillRect(0,0,cw,ch);
      const eps=0.002;
      for(let i=0;i<n;i++){
        const nx=px2[i]/cw*sc, ny=py2[i]/ch*sc;
        const vx=(fbm2(nx,ny+t+eps,oct)-fbm2(nx,ny+t-eps,oct))/(2*eps)*spd;
        const vy=-(fbm2(nx+eps,ny+t,oct)-fbm2(nx-eps,ny+t,oct))/(2*eps)*spd;
        const ox=px2[i], oy=py2[i];
        px2[i]+=vx; py2[i]+=vy;
        if(px2[i]<0||px2[i]>cw||py2[i]<0||py2[i]>ch){px2[i]=Math.random()*cw;py2[i]=Math.random()*ch;continue;}
        const spd2=Math.sqrt(vx*vx+vy*vy), hue=(c.hue+spd2*60)%360;
        ctx.beginPath();ctx.moveTo(ox,oy);ctx.lineTo(px2[i],py2[i]);
        ctx.strokeStyle=`hsla(${hue},75%,65%,0.55)`;ctx.lineWidth=0.7;ctx.stroke();
      }
      animId = requestAnimationFrame(draw);
    };

    resize(); draw();
    const ro = new ResizeObserver(() => resize()); ro.observe(canvas);
    return () => { cancelAnimationFrame(animId); ro.disconnect(); };
  },
};

// ─── 37. Clifford Attractor ──────────────────────────────────────────────────

const cliffordBg: BgDef = {
  id: 'clifford',
  label: 'Clifford',
  description: 'Clifford strange attractor — x\'=sin(ay)+c·cos(ax), y\'=sin(bx)+d·cos(by)',
  defaults: { a: -1.4, b: 1.6, c: 1.0, d: 0.7, density: 6000, brightness: 0.5, hue: 280 },
  sliders: [
    { key: 'a',          label: 'a',          min: -3,   max: 3,     step: 0.01 },
    { key: 'b',          label: 'b',          min: -3,   max: 3,     step: 0.01 },
    { key: 'c',          label: 'c',          min: -3,   max: 3,     step: 0.01 },
    { key: 'd',          label: 'd',          min: -3,   max: 3,     step: 0.01 },
    { key: 'density',    label: 'Density',    min: 500,  max: 20000, step: 500  },
    { key: 'brightness', label: 'Brightness', min: 0.1,  max: 1.0,   step: 0.01 },
    { key: 'hue',        label: 'Hue',        min: 0,    max: 360,   step: 1    },
  ],
  create(canvas, getCfg) {
    const ctx = canvas.getContext('2d')!;
    let animId: number, cx2 = 0.1, cy2 = 0.1;
    let lastA = NaN, lastB = NaN, lastC = NaN, lastD = NaN;
    const resize = () => { const r = canvas.getBoundingClientRect(); canvas.width=r.width; canvas.height=r.height; lastA=NaN; };
    const draw = () => {
      const c = getCfg(); const cw=canvas.width, ch=canvas.height;
      if(c.a!==lastA||c.b!==lastB||c.c!==lastC||c.d!==lastD){ctx.clearRect(0,0,cw,ch);cx2=0.1;cy2=0.1;lastA=c.a;lastB=c.b;lastC=c.c;lastD=c.d;}
      const iters=Math.floor(c.density), sc=Math.min(cw,ch)*0.19, ox=cw/2, oy=ch/2;
      ctx.fillStyle=`hsla(${c.hue},80%,65%,${c.brightness*0.018})`;
      for(let i=0;i<iters;i++){
        const nx=Math.sin(c.a*cy2)+c.c*Math.cos(c.a*cx2), ny=Math.sin(c.b*cx2)+c.d*Math.cos(c.b*cy2);
        cx2=nx; cy2=ny;
        const px=Math.round(ox+cx2*sc), py=Math.round(oy+cy2*sc);
        if(px>=0&&px<cw&&py>=0&&py<ch) ctx.fillRect(px,py,1,1);
      }
      animId = requestAnimationFrame(draw);
    };
    resize(); draw();
    const ro = new ResizeObserver(() => resize()); ro.observe(canvas);
    return () => { cancelAnimationFrame(animId); ro.disconnect(); };
  },
};

// ─── 38. Game of Life ────────────────────────────────────────────────────────

const gameOfLifeBg: BgDef = {
  id: 'gameoflife',
  label: 'Game of Life',
  description: 'Conway\'s B3/S23 cellular automaton — age-based luminosity reveals generational history',
  defaults: { cellSize: 7, speed: 6, glowBirth: 0.7, palette: 0, initDensity: 0.32 },
  sliders: [
    { key: 'cellSize',   label: 'Cell size',    min: 3,   max: 18,  step: 1    },
    { key: 'speed',      label: 'Frames/step',  min: 1,   max: 30,  step: 1    },
    { key: 'glowBirth',  label: 'Birth glow',   min: 0,   max: 1.0, step: 0.05 },
    { key: 'palette',    label: 'Palette',      min: 0,   max: 2,   step: 1    },
    { key: 'initDensity',label: 'Density',      min: 0.1, max: 0.6, step: 0.05 },
  ],
  create(canvas, getCfg) {
    const ctx = canvas.getContext('2d')!;
    let animId: number, frame = 0;
    let gw = 1, gh = 1;
    let cells: Uint8Array, ages: Uint16Array;
    let lastCS = -1, lastDens = -1;

    const initGrid = (cs: number, density: number) => {
      gw=Math.floor(canvas.width/cs); gh=Math.floor(canvas.height/cs);
      cells=new Uint8Array(gw*gh); ages=new Uint16Array(gw*gh);
      for(let i=0;i<gw*gh;i++) cells[i]=Math.random()<density?1:0;
      lastCS=cs; lastDens=density;
    };

    const step = () => {
      const next=new Uint8Array(gw*gh);
      for(let y=0;y<gh;y++) for(let x=0;x<gw;x++){
        let n=0;
        for(let dy=-1;dy<=1;dy++) for(let dx=-1;dx<=1;dx++){if(!dx&&!dy)continue;n+=cells[((x+dx+gw)%gw)+((y+dy+gh)%gh)*gw];}
        const i=x+y*gw, alive=cells[i];
        next[i]=(alive&&(n===2||n===3))||(!alive&&n===3)?1:0;
        ages[i]=next[i]?(alive?Math.min(1000,ages[i]+1):0):0;
      }
      cells.set(next);
    };

    const resize = () => { const r=canvas.getBoundingClientRect(); canvas.width=r.width; canvas.height=r.height; lastCS=-1; };

    const draw = () => {
      frame++; const c=getCfg(), cs=Math.round(c.cellSize);
      if(cs!==lastCS||c.initDensity!==lastDens) initGrid(cs,c.initDensity);
      if(frame%Math.max(1,Math.round(c.speed))===0) step();
      ctx.fillStyle='rgba(8,10,14,0.85)'; ctx.fillRect(0,0,canvas.width,canvas.height);
      const pal=Math.round(c.palette);
      for(let y=0;y<gh;y++) for(let x=0;x<gw;x++){
        const i=x+y*gw; if(!cells[i]) continue;
        const age=ages[i], ageT=Math.min(1,age/30);
        let col='';
        if(pal===0) col=`hsl(${200+ageT*50},85%,${60-ageT*15}%)`;
        else if(pal===1) col=ageT<0.4?`hsl(${130-ageT*80},80%,65%)`:`hsl(45,90%,${70-ageT*15}%)`;
        else col=`hsl(${270+ageT*70},80%,${58+ageT*12}%)`;
        ctx.fillStyle=col; ctx.fillRect(x*cs,y*cs,cs-1,cs-1);
        if(c.glowBirth>0&&age<4){ctx.fillStyle=`rgba(255,255,255,${c.glowBirth*(1-age/4)*0.35})`;ctx.fillRect(x*cs-1,y*cs-1,cs+1,cs+1);}
      }
      animId = requestAnimationFrame(draw);
    };

    resize(); draw();
    const ro = new ResizeObserver(() => resize()); ro.observe(canvas);
    return () => { cancelAnimationFrame(animId); ro.disconnect(); };
  },
};

// ─── 39. Newton Fractal ───────────────────────────────────────────────────────

const newtonFractalBg: BgDef = {
  id: 'newtonfractal',
  label: 'Newton Fractal',
  description: 'Newton\'s method basins of attraction — z³=1 exposes infinite territory boundaries',
  defaults: { maxIter: 40, zoom: 1.0, drift: 0.08, palette: 0, shading: 0.65 },
  sliders: [
    { key: 'maxIter', label: 'Max iter',     min: 8,   max: 100, step: 2    },
    { key: 'zoom',    label: 'Zoom',         min: 0.3, max: 5.0, step: 0.1  },
    { key: 'drift',   label: 'Drift speed',  min: 0,   max: 0.4, step: 0.01 },
    { key: 'palette', label: 'Palette',      min: 0,   max: 2,   step: 1    },
    { key: 'shading', label: 'Depth shade',  min: 0,   max: 1.0, step: 0.05 },
  ],
  create(canvas, getCfg) {
    const ctx = canvas.getContext('2d')!;
    let animId: number, t = 0;
    let gw=1,gh=1,imgData=new ImageData(1,1);
    let off: HTMLCanvasElement|null=null, offCtx: CanvasRenderingContext2D|null=null;

    const roots=[[1,0],[Math.cos(2*Math.PI/3),Math.sin(2*Math.PI/3)],[Math.cos(4*Math.PI/3),Math.sin(4*Math.PI/3)]];

    const resize = () => {
      const r=canvas.getBoundingClientRect(); canvas.width=r.width; canvas.height=r.height;
      gw=Math.ceil(r.width/4); gh=Math.ceil(r.height/4);
      imgData=new ImageData(gw,gh); off=document.createElement('canvas'); off.width=gw; off.height=gh; offCtx=off.getContext('2d')!;
    };

    const draw = () => {
      const c=getCfg(); t+=c.drift*0.005;
      const maxIter=Math.round(c.maxIter), sc=2.0/c.zoom, d=imgData.data, pal=Math.round(c.palette);
      const panX=Math.cos(t*0.31)*0.08, panY=Math.sin(t*0.19)*0.08;
      const pals=[[[ 0.2,0.55,1.0],[0.15,0.9,0.3],[1.0,0.15,0.35]],[[ 1.0,0.7,0.0],[0.75,0.1,0.9],[0.0,0.85,0.8]],[[ 0.95,0.45,0.1],[0.1,0.6,0.95],[0.65,0.9,0.1]]];
      for(let py=0;py<gh;py++) for(let px=0;px<gw;px++){
        let zr=(px/gw-0.5)*sc*(gw/gh)+panX, zi=(py/gh-0.5)*sc+panY, it=0;
        for(;it<maxIter;it++){
          const zr2=zr*zr-zi*zi, zi2=2*zr*zi;
          const zr3=zr*zr2-zi*zi2, zi3=zr*zi2+zi*zr2;
          const nr=2*zr3+1, ni=2*zi3;
          const dr=3*zr2, di=3*zi2;
          const den=dr*dr+di*di; if(den<1e-10) break;
          const dz_r=(nr*dr+ni*di)/den-zr, dz_i=(ni*dr-nr*di)/den-zi;
          zr+=dz_r; zi+=dz_i;
          if(dz_r*dz_r+dz_i*dz_i<1e-12) break;
        }
        let closest=0, minD=Infinity;
        for(let ri=0;ri<3;ri++){const dr2=zr-roots[ri][0],di2=zi-roots[ri][1];const d2=dr2*dr2+di2*di2;if(d2<minD){minD=d2;closest=ri;}}
        const shade=1-(it/maxIter)*c.shading;
        const pc=pals[pal][closest];
        const idx=px+py*gw;
        d[idx*4]=Math.floor(pc[0]*shade*255); d[idx*4+1]=Math.floor(pc[1]*shade*255); d[idx*4+2]=Math.floor(pc[2]*shade*255); d[idx*4+3]=255;
      }
      offCtx!.putImageData(imgData,0,0); ctx.imageSmoothingEnabled=true;
      ctx.drawImage(off!,0,0,gw,gh,0,0,canvas.width,canvas.height);
      animId = requestAnimationFrame(draw);
    };

    resize(); draw();
    const ro = new ResizeObserver(() => resize()); ro.observe(canvas);
    return () => { cancelAnimationFrame(animId); ro.disconnect(); };
  },
};

// ─── 40. Torus Knot ──────────────────────────────────────────────────────────

const torusKnotBg: BgDef = {
  id: 'torusknot',
  label: 'Torus Knot',
  description: '3D torus knot rotating in space — parametric geometry wrapped into living sculpture',
  defaults: { p: 2, q: 3, tubeR: 0.4, speed: 0.3, thickness: 3.0, glow: 0.65 },
  sliders: [
    { key: 'p',         label: 'p (wraps)',    min: 1,   max: 7,   step: 1    },
    { key: 'q',         label: 'q (loops)',    min: 2,   max: 8,   step: 1    },
    { key: 'tubeR',     label: 'Tube radius',  min: 0.1, max: 1.0, step: 0.05 },
    { key: 'speed',     label: 'Rotation',     min: 0,   max: 1.5, step: 0.05 },
    { key: 'thickness', label: 'Line width',   min: 0.5, max: 6.0, step: 0.25 },
    { key: 'glow',      label: 'Glow',         min: 0,   max: 1.0, step: 0.05 },
  ],
  create(canvas, getCfg) {
    const ctx = canvas.getContext('2d')!;
    let animId: number, rx = 0.2, ry = 0;

    const resize = () => { const r=canvas.getBoundingClientRect(); canvas.width=r.width; canvas.height=r.height; };

    const project = (x: number, y: number, z: number, cw: number, ch: number): [number,number,number] => {
      const fov = Math.min(cw,ch)*1.8, d = fov/(fov+z*0.6);
      return [cw/2+x*d, ch/2+y*d, z];
    };

    const draw = () => {
      const c = getCfg(); rx += c.speed*0.006; ry += c.speed*0.004;
      const cw=canvas.width, ch=canvas.height;
      ctx.fillStyle='rgba(8,10,14,0.22)'; ctx.fillRect(0,0,cw,ch);
      const p=Math.round(c.p), q=Math.round(c.q), R=2, r=c.tubeR;
      const steps=600, sc=Math.min(cw,ch)*0.15;
      const pts: Array<[number,number,number]> = [];
      for(let i=0;i<=steps;i++){
        const t2=(i/steps)*Math.PI*2*p;
        let x=( R+r*Math.cos(q*t2/p))*Math.cos(t2);
        let y=( R+r*Math.cos(q*t2/p))*Math.sin(t2);
        let z=r*Math.sin(q*t2/p);
        // Rotate y-axis
        const cosy=Math.cos(ry), siny=Math.sin(ry);
        const x2=x*cosy+z*siny; z=-x*siny+z*cosy; x=x2;
        // Rotate x-axis
        const cosx=Math.cos(rx), sinx=Math.sin(rx);
        const y2=y*cosx-z*sinx; z=y*sinx+z*cosx; y=y2;
        pts.push([x*sc, y*sc, z*sc]);
      }
      // Sort segments by avg z
      const segs: Array<{z:number,i:number}> = [];
      for(let i=0;i<steps;i++) segs.push({z:(pts[i][2]+pts[i+1][2])/2,i});
      segs.sort((a,b)=>a.z-b.z);
      segs.forEach(({i,z:sz}) => {
        const [px1,py1] = project(pts[i][0],pts[i][1],pts[i][2],cw,ch);
        const [px2,py2] = project(pts[i+1][0],pts[i+1][1],pts[i+1][2],cw,ch);
        const depth=(sz+sc*2)/(sc*4), hue=((i/steps)*360+120)%360;
        const alpha=0.4+depth*0.55;
        if(c.glow>0){ctx.beginPath();ctx.moveTo(px1,py1);ctx.lineTo(px2,py2);ctx.strokeStyle=`hsla(${hue},85%,70%,${c.glow*alpha*0.35})`;ctx.lineWidth=c.thickness*3;ctx.stroke();}
        ctx.beginPath();ctx.moveTo(px1,py1);ctx.lineTo(px2,py2);
        ctx.strokeStyle=`hsla(${hue},90%,72%,${alpha})`; ctx.lineWidth=c.thickness; ctx.stroke();
      });
      animId = requestAnimationFrame(draw);
    };

    resize(); draw();
    const ro = new ResizeObserver(() => resize()); ro.observe(canvas);
    return () => { cancelAnimationFrame(animId); ro.disconnect(); };
  },
};

// ─── 41. N-Body Gravity ───────────────────────────────────────────────────────

const nBodyBg: BgDef = {
  id: 'nbody',
  label: 'N-Body',
  description: 'Newtonian gravitational simulation — bodies spiral, orbit, and slingshot through space',
  defaults: { bodies: 7, trailLen: 280, softening: 12, timeStep: 0.15, massRange: 0.7, glow: 0.6 },
  sliders: [
    { key: 'bodies',    label: 'Bodies',     min: 2,   max: 14,   step: 1   },
    { key: 'trailLen',  label: 'Trail',      min: 20,  max: 600,  step: 10  },
    { key: 'softening', label: 'Softening',  min: 2,   max: 40,   step: 1   },
    { key: 'timeStep',  label: 'Time step',  min: 0.02,max: 0.5,  step: 0.01 },
    { key: 'massRange', label: 'Mass range', min: 0,   max: 1.0,  step: 0.05 },
    { key: 'glow',      label: 'Glow',       min: 0,   max: 1.0,  step: 0.05 },
  ],
  create(canvas, getCfg) {
    const ctx = canvas.getContext('2d')!;
    let animId: number;
    type Body = { x:number; y:number; vx:number; vy:number; m:number; hue:number; trail:Array<[number,number]> };
    let bodies: Body[] = []; let lastN = -1;

    const initBodies = (n: number, mr: number) => {
      const cw=canvas.width, ch=canvas.height, cx=cw/2, cy=ch/2, sc=Math.min(cw,ch)*0.22;
      bodies=Array.from({length:n},(_,i)=>{
        const a=(i/n)*Math.PI*2, r=sc*(0.3+Math.random()*0.7);
        const m=0.3+Math.random()*mr*1.5+(!mr?0:0);
        const spd=Math.sqrt(n*m/r)*0.4;
        return {x:cx+Math.cos(a)*r,y:cy+Math.sin(a)*r,vx:-Math.sin(a)*spd,vy:Math.cos(a)*spd,m,hue:(i/n)*360,trail:[]};
      });
      lastN=n;
    };

    const resize = () => { const r=canvas.getBoundingClientRect(); canvas.width=r.width; canvas.height=r.height; lastN=-1; };

    const draw = () => {
      const c=getCfg(), n=Math.round(c.bodies);
      if(n!==lastN) initBodies(n,c.massRange);
      const cw=canvas.width, ch=canvas.height, trLen=Math.round(c.trailLen), soft2=c.softening*c.softening;
      ctx.fillStyle='rgba(8,10,14,0.18)'; ctx.fillRect(0,0,cw,ch);

      // Compute accelerations
      const ax=new Float32Array(n), ay=new Float32Array(n);
      for(let i=0;i<n;i++) for(let j=i+1;j<n;j++){
        const dx=bodies[j].x-bodies[i].x, dy=bodies[j].y-bodies[i].y;
        const dist2=dx*dx+dy*dy+soft2, dist=Math.sqrt(dist2);
        const f=1/(dist2*dist);
        ax[i]+=bodies[j].m*dx*f*600; ay[i]+=bodies[j].m*dy*f*600;
        ax[j]-=bodies[i].m*dx*f*600; ay[j]-=bodies[i].m*dy*f*600;
      }
      bodies.forEach((b,i)=>{
        b.vx+=ax[i]*c.timeStep; b.vy+=ay[i]*c.timeStep;
        b.trail.push([b.x,b.y]); if(b.trail.length>trLen) b.trail.shift();
        b.x+=b.vx*c.timeStep; b.y+=b.vy*c.timeStep;
        // Soft boundary — reflect if far off screen
        if(b.x<-cw||b.x>2*cw||b.y<-ch||b.y>2*ch){b.vx*=-0.5;b.vy*=-0.5;b.x=Math.max(-cw/2,Math.min(cw*1.5,b.x));b.y=Math.max(-ch/2,Math.min(ch*1.5,b.y));}
      });

      bodies.forEach(b=>{
        if(b.trail.length>1){
          ctx.beginPath(); b.trail.forEach(([tx,ty],i)=>i===0?ctx.moveTo(tx,ty):ctx.lineTo(tx,ty));
          ctx.strokeStyle=`hsla(${b.hue},75%,65%,0.5)`; ctx.lineWidth=0.8; ctx.stroke();
        }
        const r2=3+b.m*3, grd=ctx.createRadialGradient(b.x,b.y,0,b.x,b.y,r2*(1+c.glow*4));
        grd.addColorStop(0,`hsl(${b.hue},90%,90%)`); grd.addColorStop(0.3,`hsla(${b.hue},80%,65%,0.6)`); grd.addColorStop(1,'rgba(0,0,0,0)');
        ctx.beginPath(); ctx.arc(b.x,b.y,r2*(1+c.glow*4),0,Math.PI*2); ctx.fillStyle=grd; ctx.fill();
        ctx.beginPath(); ctx.arc(b.x,b.y,r2,0,Math.PI*2); ctx.fillStyle=`hsl(${b.hue},90%,85%)`; ctx.fill();
      });
      animId = requestAnimationFrame(draw);
    };

    resize(); draw();
    const ro = new ResizeObserver(() => resize()); ro.observe(canvas);
    return () => { cancelAnimationFrame(animId); ro.disconnect(); };
  },
};

// ─── 42. Cymatics ────────────────────────────────────────────────────────────

const cymaticsBg: BgDef = {
  id: 'cymatics',
  label: 'Cymatics',
  description: 'Chladni figures — standing wave nodal patterns morph between resonance modes',
  defaults: { modeM: 3, modeN: 4, morphSpeed: 0.4, colorMode: 0, nodeWidth: 0.08, zoom: 1.0 },
  sliders: [
    { key: 'modeM',     label: 'Mode m',      min: 1,   max: 10,  step: 1    },
    { key: 'modeN',     label: 'Mode n',      min: 1,   max: 10,  step: 1    },
    { key: 'morphSpeed',label: 'Morph speed', min: 0,   max: 2.0, step: 0.05 },
    { key: 'colorMode', label: 'Palette',     min: 0,   max: 2,   step: 1    },
    { key: 'nodeWidth', label: 'Node width',  min: 0.01,max: 0.3, step: 0.01 },
    { key: 'zoom',      label: 'Zoom',        min: 0.5, max: 2.5, step: 0.1  },
  ],
  create(canvas, getCfg) {
    const ctx = canvas.getContext('2d')!;
    let animId: number, t = 0;
    let gw=1,gh=1,imgData=new ImageData(1,1);
    let off: HTMLCanvasElement|null=null, offCtx: CanvasRenderingContext2D|null=null;

    const resize = () => {
      const r=canvas.getBoundingClientRect(); canvas.width=r.width; canvas.height=r.height;
      gw=Math.ceil(r.width/5); gh=Math.ceil(r.height/5);
      imgData=new ImageData(gw,gh); off=document.createElement('canvas'); off.width=gw; off.height=gh; offCtx=off.getContext('2d')!;
    };

    const draw = () => {
      const c=getCfg(); t+=c.morphSpeed*0.006;
      // Smoothly interpolate mode parameters
      const m1=Math.round(c.modeM), n1=Math.round(c.modeN);
      const m2=(m1%10)+1, n2=(n1%10)+1;
      const blend=(Math.sin(t)*0.5+0.5);
      const ma=m1+(m2-m1)*blend, na=n1+(n2-n1)*blend;
      const d=imgData.data, nw=c.nodeWidth, sc=c.zoom, cm=Math.round(c.colorMode);
      for(let py=0;py<gh;py++) for(let px=0;px<gw;px++){
        const x=((px/gw)-0.5)*sc*2*Math.PI, y=((py/gh)-0.5)*sc*2*Math.PI;
        const f=Math.cos(ma*x)*Math.cos(na*y)-Math.cos(na*x)*Math.cos(ma*y);
        const af=Math.abs(f);
        const onNode=af<nw;
        const intensity=onNode?0:Math.min(1,(af-nw)*3);
        const idx=px+py*gw;
        let r2=0,g2=0,b2=0;
        if(cm===0){r2=Math.floor(intensity*8);g2=Math.floor(intensity*100);b2=Math.floor(intensity*220+30);}
        else if(cm===1){const h=(af*180+t*30)%360;[r2,g2,b2]=hslToRgb(h/360,0.8,intensity*0.65);}
        else{r2=Math.floor(intensity*210);g2=Math.floor(intensity*180);b2=Math.floor(intensity*60);}
        d[idx*4]=r2;d[idx*4+1]=g2;d[idx*4+2]=b2;d[idx*4+3]=255;
      }
      offCtx!.putImageData(imgData,0,0); ctx.imageSmoothingEnabled=true;
      ctx.drawImage(off!,0,0,gw,gh,0,0,canvas.width,canvas.height);
      animId = requestAnimationFrame(draw);
    };

    resize(); draw();
    const ro = new ResizeObserver(() => resize()); ro.observe(canvas);
    return () => { cancelAnimationFrame(animId); ro.disconnect(); };
  },
};

// ─── 43. Mandelbrot ──────────────────────────────────────────────────────────

const mandelbrotBg: BgDef = {
  id: 'mandelbrot',
  label: 'Mandelbrot',
  description: 'The iconic fractal — escape time at every pixel maps the boundary of convergence',
  defaults: { maxIter: 128, zoom: 1.0, panX: -0.5, panY: 0, drift: 0.04, palette: 0 },
  sliders: [
    { key: 'maxIter', label: 'Max iter',   min: 16,   max: 512,  step: 8    },
    { key: 'zoom',    label: 'Zoom',       min: 0.1,  max: 15.0, step: 0.1  },
    { key: 'panX',    label: 'Pan X',      min: -2.5, max: 1.0,  step: 0.01 },
    { key: 'panY',    label: 'Pan Y',      min: -1.2, max: 1.2,  step: 0.01 },
    { key: 'drift',   label: 'Auto drift', min: 0,    max: 0.5,  step: 0.01 },
    { key: 'palette', label: 'Palette',    min: 0,    max: 3,    step: 1    },
  ],
  create(canvas, getCfg) {
    const ctx = canvas.getContext('2d')!;
    let animId: number, t = 0;
    let gw=1,gh=1,imgData=new ImageData(1,1);
    let off: HTMLCanvasElement|null=null, offCtx: CanvasRenderingContext2D|null=null;
    const resize = () => {
      const r=canvas.getBoundingClientRect(); canvas.width=r.width; canvas.height=r.height;
      gw=Math.ceil(r.width/4); gh=Math.ceil(r.height/4);
      imgData=new ImageData(gw,gh); off=document.createElement('canvas'); off.width=gw; off.height=gh; offCtx=off.getContext('2d')!;
    };
    const draw = () => {
      const c=getCfg(); t+=c.drift*0.003;
      const maxIter=Math.round(c.maxIter), sc=3.0/c.zoom, d=imgData.data, pal=Math.round(c.palette);
      const cx2=c.panX+Math.sin(t*0.41)*0.015*c.drift, cy2=c.panY+Math.cos(t*0.31)*0.01*c.drift;
      for(let py=0;py<gh;py++) for(let px=0;px<gw;px++){
        const cr=(px/gw-0.5)*sc*(gw/gh)+cx2, ci=(py/gh-0.5)*sc+cy2;
        let zr=0,zi=0,it=0;
        while(it<maxIter){const zr2=zr*zr,zi2=zi*zi;if(zr2+zi2>4)break;zi=2*zr*zi+ci;zr=zr2-zi2+cr;it++;}
        let val=0;
        if(it<maxIter){const zr2=zr*zr,zi2=zi*zi;val=Math.max(0,(it+1-Math.log(Math.log(Math.sqrt(zr2+zi2))*Math.LOG2E)*Math.LOG2E)/maxIter);}
        const idx=px+py*gw; let r2=0,g2=0,b2=0;
        if(val>0){
          if(pal===0){[r2,g2,b2]=hslToRgb(((val*300+240)%360)/360,0.85,0.45+val*0.35);}
          else if(pal===1){r2=Math.floor(val*255);g2=Math.floor(val*val*200);b2=Math.floor(val<0.4?val*200:0);}
          else if(pal===2){[r2,g2,b2]=hslToRgb((200+val*100)/360,0.75,0.15+val*0.65);}
          else{[r2,g2,b2]=hslToRgb((val*6)%1,0.9,0.5);}
        }
        d[idx*4]=r2;d[idx*4+1]=g2;d[idx*4+2]=b2;d[idx*4+3]=255;
      }
      offCtx!.putImageData(imgData,0,0); ctx.imageSmoothingEnabled=true;
      ctx.drawImage(off!,0,0,gw,gh,0,0,canvas.width,canvas.height);
      animId=requestAnimationFrame(draw);
    };
    resize(); draw();
    const ro=new ResizeObserver(()=>resize()); ro.observe(canvas);
    return ()=>{cancelAnimationFrame(animId);ro.disconnect();};
  },
};

// ─── 44. Rössler Attractor ────────────────────────────────────────────────────

const rosslerBg: BgDef = {
  id: 'rossler',
  label: 'Rössler',
  description: 'Rössler strange attractor — a single folded spiral band topologically distinct from Lorenz',
  defaults: { a: 0.2, b: 0.2, c: 5.7, density: 300, zoom: 0.85, hue: 30 },
  sliders: [
    { key: 'a',       label: 'a',        min: 0.1,  max: 0.5,  step: 0.01 },
    { key: 'b',       label: 'b',        min: 0.05, max: 1.0,  step: 0.01 },
    { key: 'c',       label: 'c',        min: 2.0,  max: 12.0, step: 0.1  },
    { key: 'density', label: 'Density',  min: 50,   max: 800,  step: 10   },
    { key: 'zoom',    label: 'Zoom',     min: 0.3,  max: 3.0,  step: 0.05 },
    { key: 'hue',     label: 'Hue',      min: 0,    max: 360,  step: 1    },
  ],
  create(canvas, getCfg) {
    const ctx = canvas.getContext('2d')!;
    let animId: number, rx=0.1, ry=0, rz=0;
    let lastA=NaN,lastB=NaN,lastC=NaN;
    const dt=0.006;
    const resize=()=>{const r=canvas.getBoundingClientRect();canvas.width=r.width;canvas.height=r.height;lastA=NaN;};
    const draw=()=>{
      const c=getCfg(),cw=canvas.width,ch=canvas.height,steps=Math.round(c.density),sc=Math.min(cw,ch)*0.04*c.zoom;
      if(c.a!==lastA||c.b!==lastB||c.c!==lastC){ctx.clearRect(0,0,cw,ch);rx=0.1;ry=0;rz=0;lastA=c.a;lastB=c.b;lastC=c.c;}
      ctx.globalAlpha=0.012;
      for(let i=0;i<steps;i++){
        const dx=-(ry+rz),dy=rx+c.a*ry,dz=c.b+rz*(rx-c.c);
        rx+=dx*dt;ry+=dy*dt;rz+=dz*dt;
        const px=cw/2+rx*sc,py=ch*0.55-ry*sc;
        const h=((rz/20*200+c.hue)%360+360)%360;
        ctx.fillStyle=`hsl(${h},80%,65%)`;ctx.fillRect(Math.round(px),Math.round(py),1,1);
      }
      ctx.globalAlpha=1; animId=requestAnimationFrame(draw);
    };
    resize();draw();
    const ro=new ResizeObserver(()=>resize());ro.observe(canvas);
    return()=>{cancelAnimationFrame(animId);ro.disconnect();};
  },
};

// ─── 45. Thomas Attractor ─────────────────────────────────────────────────────

const thomasBg: BgDef = {
  id: 'thomas',
  label: 'Thomas Attractor',
  description: 'Thomas\' cyclically symmetric attractor — three-axis chaos filling a cube with sinusoidal coupling',
  defaults: { b: 0.19, density: 350, zoom: 0.85, hue: 160, rotSpeed: 0.3 },
  sliders: [
    { key: 'b',        label: 'Damping b', min: 0.1,  max: 0.35, step: 0.005 },
    { key: 'density',  label: 'Density',   min: 50,   max: 800,  step: 10    },
    { key: 'zoom',     label: 'Zoom',      min: 0.3,  max: 3.0,  step: 0.05  },
    { key: 'hue',      label: 'Hue',       min: 0,    max: 360,  step: 1     },
    { key: 'rotSpeed', label: 'Rotation',  min: 0,    max: 1.0,  step: 0.05  },
  ],
  create(canvas, getCfg) {
    const ctx = canvas.getContext('2d')!;
    let animId: number, tx=0.1,ty=0,tz=0,rot=0;
    let lastB=NaN;
    const dt=0.04;
    const resize=()=>{const r=canvas.getBoundingClientRect();canvas.width=r.width;canvas.height=r.height;lastB=NaN;};
    const draw=()=>{
      const c=getCfg(),steps=Math.round(c.density),cw=canvas.width,ch=canvas.height,sc=Math.min(cw,ch)*0.07*c.zoom;
      rot+=c.rotSpeed*0.005;
      if(c.b!==lastB){ctx.clearRect(0,0,cw,ch);tx=0.1;ty=0;tz=0;lastB=c.b;}
      ctx.globalAlpha=0.015;
      for(let i=0;i<steps;i++){
        const dx=Math.sin(ty)-c.b*tx,dy=Math.sin(tz)-c.b*ty,dz=Math.sin(tx)-c.b*tz;
        tx+=dx*dt;ty+=dy*dt;tz+=dz*dt;
        const cosR=Math.cos(rot),sinR=Math.sin(rot);
        const rx2=tx*cosR+tz*sinR,rz2=-tx*sinR+tz*cosR;
        const px=cw/2+rx2*sc,py=ch/2-ty*sc;
        const h=((rz2/5*100+c.hue)%360+360)%360;
        ctx.fillStyle=`hsl(${h},80%,65%)`;ctx.fillRect(Math.round(px),Math.round(py),1,1);
      }
      ctx.globalAlpha=1; animId=requestAnimationFrame(draw);
    };
    resize();draw();
    const ro=new ResizeObserver(()=>resize());ro.observe(canvas);
    return()=>{cancelAnimationFrame(animId);ro.disconnect();};
  },
};

// ─── 46. Bifurcation Diagram ──────────────────────────────────────────────────

const bifurcationBg: BgDef = {
  id: 'bifurcation',
  label: 'Bifurcation',
  description: 'Logistic map x→rx(1-x) — period-doubling road to chaos rendered as living density',
  defaults: { rMin: 2.6, rMax: 4.0, iterations: 200, transient: 150, hue: 200, brightness: 0.6 },
  sliders: [
    { key: 'rMin',       label: 'r min',      min: 2.0, max: 3.9,  step: 0.01 },
    { key: 'rMax',       label: 'r max',      min: 3.0, max: 4.0,  step: 0.01 },
    { key: 'iterations', label: 'Iterations', min: 50,  max: 500,  step: 10   },
    { key: 'transient',  label: 'Transient',  min: 10,  max: 300,  step: 10   },
    { key: 'hue',        label: 'Hue',        min: 0,   max: 360,  step: 1    },
    { key: 'brightness', label: 'Brightness', min: 0.1, max: 1.0,  step: 0.05 },
  ],
  create(canvas, getCfg) {
    const ctx = canvas.getContext('2d')!;
    let animId: number, frameN = 0;
    const resize=()=>{const r=canvas.getBoundingClientRect();canvas.width=r.width;canvas.height=r.height;ctx.clearRect(0,0,r.width,r.height);frameN=0;};
    const draw=()=>{
      const c=getCfg(),cw=canvas.width,ch=canvas.height;
      ctx.fillStyle='rgba(8,10,14,0.004)';ctx.fillRect(0,0,cw,ch);
      const colsPerFrame=Math.ceil(cw/40);
      const startCol=(frameN%40)*colsPerFrame;
      const rRange=c.rMax-c.rMin,iters=Math.round(c.iterations),trans=Math.round(c.transient);
      ctx.fillStyle=`hsla(${c.hue},75%,65%,${c.brightness*0.28})`;
      for(let px=startCol;px<Math.min(startCol+colsPerFrame,cw);px++){
        const r2=c.rMin+(px/cw)*rRange;
        let x2=Math.random()*0.4+0.3;
        for(let i=0;i<trans;i++) x2=r2*x2*(1-x2);
        for(let i=0;i<iters;i++){x2=r2*x2*(1-x2);const py=Math.round((1-x2)*ch);if(py>=0&&py<ch)ctx.fillRect(px,py,1,1);}
      }
      frameN++; animId=requestAnimationFrame(draw);
    };
    resize();draw();
    const ro=new ResizeObserver(()=>resize());ro.observe(canvas);
    return()=>{cancelAnimationFrame(animId);ro.disconnect();};
  },
};

// ─── 47. Sand Simulation ──────────────────────────────────────────────────────

const sandBg: BgDef = {
  id: 'sand',
  label: 'Sand Sim',
  description: 'Falling sand cellular automaton — gravity, slides, and angle of repose from local rules',
  defaults: { dropRate: 4, palette: 0, maxFill: 0.55 },
  sliders: [
    { key: 'dropRate', label: 'Drop rate', min: 1,   max: 12,  step: 1    },
    { key: 'palette',  label: 'Palette',   min: 0,   max: 2,   step: 1    },
    { key: 'maxFill',  label: 'Max fill',  min: 0.2, max: 0.9, step: 0.05 },
  ],
  create(canvas, getCfg) {
    const ctx = canvas.getContext('2d')!;
    let animId: number;
    let gw=1,gh=1,grid: Uint8Array,hues: Float32Array,totalSand=0;
    let imgData=new ImageData(1,1);
    let off: HTMLCanvasElement|null=null,offCtx: CanvasRenderingContext2D|null=null;
    const resize=()=>{
      const r=canvas.getBoundingClientRect();canvas.width=r.width;canvas.height=r.height;
      gw=Math.ceil(r.width/3);gh=Math.ceil(r.height/3);
      grid=new Uint8Array(gw*gh);hues=new Float32Array(gw*gh);totalSand=0;
      imgData=new ImageData(gw,gh);off=document.createElement('canvas');off.width=gw;off.height=gh;offCtx=off.getContext('2d')!;
    };
    const draw=()=>{
      const c=getCfg();
      if(totalSand>gw*gh*c.maxFill){grid.fill(0);hues.fill(0);totalSand=0;}
      for(let d2=0;d2<Math.round(c.dropRate);d2++){
        const x=Math.floor(gw*0.15+Math.random()*gw*0.7),i=x;
        if(!grid[i]){grid[i]=1;hues[i]=Math.random()*60+20;totalSand++;}
      }
      // Scan bottom-up to prevent double-move
      for(let y=gh-2;y>=0;y--){
        const dir=Math.random()<0.5?-1:1;
        for(let x=0;x<gw;x++){
          if(!grid[x+y*gw]) continue;
          const below=x+(y+1)*gw;
          if(!grid[below]){grid[below]=1;hues[below]=hues[x+y*gw];grid[x+y*gw]=0;hues[x+y*gw]=0;continue;}
          // Try diagonal
          let moved=false;
          for(const sx of [dir,-dir]){
            const nx=x+sx;if(nx<0||nx>=gw) continue;
            const diag=nx+(y+1)*gw;
            if(!grid[diag]){grid[diag]=1;hues[diag]=hues[x+y*gw];grid[x+y*gw]=0;hues[x+y*gw]=0;moved=true;break;}
          }
          if(!moved){/* stays */}
        }
      }
      const d2=imgData.data,pal=Math.round(c.palette);
      for(let i=0;i<gw*gh;i++){
        if(!grid[i]){d2[i*4]=8;d2[i*4+1]=10;d2[i*4+2]=14;d2[i*4+3]=255;continue;}
        const yFrac=Math.floor(i/gw)/gh;
        let r2=0,g2=0,b2=0;
        if(pal===0){[r2,g2,b2]=hslToRgb(hues[i]/360,0.75,0.4+yFrac*0.2);}
        else if(pal===1){[r2,g2,b2]=hslToRgb((200+hues[i]*0.5)/360,0.7,0.5);}
        else{[r2,g2,b2]=hslToRgb((100+hues[i])/360,0.65,0.5);}
        d2[i*4]=r2;d2[i*4+1]=g2;d2[i*4+2]=b2;d2[i*4+3]=255;
      }
      offCtx!.putImageData(imgData,0,0);ctx.imageSmoothingEnabled=false;
      ctx.drawImage(off!,0,0,gw,gh,0,0,canvas.width,canvas.height);
      animId=requestAnimationFrame(draw);
    };
    resize();draw();
    const ro=new ResizeObserver(()=>resize());ro.observe(canvas);
    return()=>{cancelAnimationFrame(animId);ro.disconnect();};
  },
};

// ─── 48. Langton's Ant ────────────────────────────────────────────────────────

const langtonBg: BgDef = {
  id: 'langton',
  label: "Langton's Ant",
  description: "Multi-color Langton's ant — deterministic Turing machine builds unexpected highways",
  defaults: { ants: 4, stepsPerFrame: 800, colorStates: 5, palette: 0 },
  sliders: [
    { key: 'ants',          label: 'Ants',        min: 1,   max: 20,   step: 1   },
    { key: 'stepsPerFrame', label: 'Steps/frame', min: 100, max: 4000, step: 100 },
    { key: 'colorStates',   label: 'States',      min: 2,   max: 8,    step: 1   },
    { key: 'palette',       label: 'Palette',     min: 0,   max: 2,    step: 1   },
  ],
  create(canvas, getCfg) {
    const ctx = canvas.getContext('2d')!;
    let animId: number;
    let gw=1,gh=1,grid: Uint8Array;
    let imgData=new ImageData(1,1),off: HTMLCanvasElement|null=null,offCtx: CanvasRenderingContext2D|null=null;
    let antX: Int32Array,antY: Int32Array,antDir: Int8Array,lastAnts=-1,lastStates=-1;
    const resize=()=>{
      const r=canvas.getBoundingClientRect();canvas.width=r.width;canvas.height=r.height;
      gw=Math.ceil(r.width/3);gh=Math.ceil(r.height/3);
      grid=new Uint8Array(gw*gh);imgData=new ImageData(gw,gh);
      off=document.createElement('canvas');off.width=gw;off.height=gh;offCtx=off.getContext('2d')!;lastAnts=-1;
    };
    const init=(n: number)=>{
      antX=new Int32Array(n);antY=new Int32Array(n);antDir=new Int8Array(n);
      for(let i=0;i<n;i++){antX[i]=Math.floor(gw/2+(Math.random()-0.5)*gw*0.4);antY[i]=Math.floor(gh/2+(Math.random()-0.5)*gh*0.4);antDir[i]=Math.floor(Math.random()*4);}
      grid.fill(0);lastAnts=n;
    };
    const dirs=[[0,-1],[1,0],[0,1],[-1,0]];
    const draw=()=>{
      const c=getCfg(),n=Math.round(c.ants),ns=Math.round(c.colorStates);
      if(n!==lastAnts||ns!==lastStates){init(n);lastStates=ns;}
      const spf=Math.round(c.stepsPerFrame);
      for(let s=0;s<spf;s++){
        for(let ai=0;ai<n;ai++){
          const i=antX[ai]+antY[ai]*gw,st=grid[i];
          grid[i]=(st+1)%ns;
          antDir[ai]=st%2===0?(antDir[ai]+1)%4:(antDir[ai]+3)%4;
          antX[ai]=((antX[ai]+dirs[antDir[ai]][0])%gw+gw)%gw;
          antY[ai]=((antY[ai]+dirs[antDir[ai]][1])%gh+gh)%gh;
        }
      }
      const d2=imgData.data,pal=Math.round(c.palette);
      for(let i=0;i<gw*gh;i++){
        if(!grid[i]){d2[i*4]=8;d2[i*4+1]=10;d2[i*4+2]=14;d2[i*4+3]=255;continue;}
        const frac=grid[i]/ns;
        const h=pal===0?frac*360:pal===1?frac*120+180:frac*240+60;
        const [r2,g2,b2]=hslToRgb(h/360,0.8,0.6);
        d2[i*4]=r2;d2[i*4+1]=g2;d2[i*4+2]=b2;d2[i*4+3]=255;
      }
      offCtx!.putImageData(imgData,0,0);ctx.imageSmoothingEnabled=false;
      ctx.drawImage(off!,0,0,gw,gh,0,0,canvas.width,canvas.height);
      animId=requestAnimationFrame(draw);
    };
    resize();draw();
    const ro=new ResizeObserver(()=>resize());ro.observe(canvas);
    return()=>{cancelAnimationFrame(animId);ro.disconnect();};
  },
};

// ─── 49. Ising Model ─────────────────────────────────────────────────────────

const isingBg: BgDef = {
  id: 'ising',
  label: 'Ising Model',
  description: 'Ferromagnetic spin lattice — Metropolis algorithm reveals the phase transition at T≈2.27',
  defaults: { temperature: 2.4, stepsPerFrame: 8000, cellSize: 4, palette: 0 },
  sliders: [
    { key: 'temperature',   label: 'Temperature T', min: 0.5,  max: 5.0,   step: 0.05  },
    { key: 'stepsPerFrame', label: 'Steps/frame',   min: 500,  max: 30000, step: 500   },
    { key: 'cellSize',      label: 'Cell size',     min: 2,    max: 10,    step: 1     },
    { key: 'palette',       label: 'Palette',       min: 0,    max: 2,     step: 1     },
  ],
  create(canvas, getCfg) {
    const ctx = canvas.getContext('2d')!;
    let animId: number;
    let gw=1,gh=1,spins: Int8Array;
    let imgData=new ImageData(1,1),off: HTMLCanvasElement|null=null,offCtx: CanvasRenderingContext2D|null=null;
    let lastCS=-1;
    const initGrid=(cs: number)=>{
      gw=Math.floor(canvas.width/cs);gh=Math.floor(canvas.height/cs);
      spins=new Int8Array(gw*gh);for(let i=0;i<gw*gh;i++)spins[i]=Math.random()<0.5?1:-1;
      imgData=new ImageData(gw,gh);off=document.createElement('canvas');off.width=gw;off.height=gh;offCtx=off.getContext('2d')!;lastCS=cs;
    };
    const resize=()=>{const r=canvas.getBoundingClientRect();canvas.width=r.width;canvas.height=r.height;lastCS=-1;};
    const draw=()=>{
      const c=getCfg(),cs=Math.round(c.cellSize);
      if(cs!==lastCS) initGrid(cs);
      const steps=Math.round(c.stepsPerFrame),T=c.temperature;
      for(let s=0;s<steps;s++){
        const x=Math.floor(Math.random()*gw),y=Math.floor(Math.random()*gh),i=x+y*gw;
        const nb=spins[(x>0?x-1:gw-1)+y*gw]+spins[(x<gw-1?x+1:0)+y*gw]+spins[x+(y>0?y-1:gh-1)*gw]+spins[x+(y<gh-1?y+1:0)*gw];
        const dE=2*spins[i]*nb;
        if(dE<0||Math.random()<Math.exp(-dE/T)) spins[i]*=-1;
      }
      const d2=imgData.data,pal=Math.round(c.palette);
      for(let i=0;i<gw*gh;i++){
        const s=spins[i]; let r2=0,g2=0,b2=0;
        if(pal===0){r2=s>0?25:200;g2=s>0?90:45;b2=s>0?215:25;}
        else if(pal===1){r2=s>0?215:25;g2=s>0?45:175;b2=s>0?25:210;}
        else{const [hr,hg,hb]=hslToRgb(s>0?0.58:0.05,0.8,0.6);r2=hr;g2=hg;b2=hb;}
        d2[i*4]=r2;d2[i*4+1]=g2;d2[i*4+2]=b2;d2[i*4+3]=255;
      }
      offCtx!.putImageData(imgData,0,0);ctx.imageSmoothingEnabled=false;
      ctx.drawImage(off!,0,0,gw,gh,0,0,canvas.width,canvas.height);
      animId=requestAnimationFrame(draw);
    };
    resize();draw();
    const ro=new ResizeObserver(()=>resize());ro.observe(canvas);
    return()=>{cancelAnimationFrame(animId);ro.disconnect();};
  },
};

// ─── 50. Lightning ────────────────────────────────────────────────────────────

const lightningBg: BgDef = {
  id: 'lightning',
  label: 'Lightning',
  description: 'Midpoint displacement fractal — stochastic branching bolt with recursive subdivision',
  defaults: { depth: 8, spread: 0.28, branchProb: 0.35, glow: 0.7, rate: 3.0, hue: 210 },
  sliders: [
    { key: 'depth',      label: 'Depth',       min: 4,    max: 12,  step: 1    },
    { key: 'spread',     label: 'Spread',      min: 0.05, max: 0.8, step: 0.05 },
    { key: 'branchProb', label: 'Branch prob', min: 0,    max: 0.8, step: 0.05 },
    { key: 'glow',       label: 'Glow',        min: 0,    max: 1.0, step: 0.05 },
    { key: 'rate',       label: 'Rate',        min: 0.5,  max: 8.0, step: 0.5  },
    { key: 'hue',        label: 'Hue',         min: 0,    max: 360, step: 1    },
  ],
  create(canvas, getCfg) {
    const ctx = canvas.getContext('2d')!;
    let animId: number, t=0, lastBolt=0;
    const resize=()=>{const r=canvas.getBoundingClientRect();canvas.width=r.width;canvas.height=r.height;};
    const bolt=(x1:number,y1:number,x2:number,y2:number,depth:number,spread:number,bp:number,hue:number,glw:number)=>{
      if(depth===0){
        if(glw>0){ctx.strokeStyle=`hsla(${hue},90%,90%,${glw*0.35})`;ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke();}
        ctx.strokeStyle=`hsl(${hue},90%,92%)`;ctx.lineWidth=0.7;ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke();return;
      }
      const dx=x2-x1,dy=y2-y1,len=Math.sqrt(dx*dx+dy*dy);
      const px=-dy/len,py=dx/len;
      const mx=(x1+x2)/2+px*spread*len*(Math.random()-0.5)*2;
      const my=(y1+y2)/2+py*spread*len*(Math.random()-0.5)*2;
      bolt(x1,y1,mx,my,depth-1,spread,bp,hue,glw);
      bolt(mx,my,x2,y2,depth-1,spread,bp,hue,glw);
      if(Math.random()<bp&&depth>2){
        const bx=mx+(x2-x1)*0.4*(Math.random()-0.5)*2,by=my+(y2-y1)*0.4*(Math.random()-0.5)*2;
        bolt(mx,my,bx,by,depth-2,spread*1.1,bp*0.6,hue,glw*0.5);
      }
    };
    const draw=()=>{
      t+=1/60;const c=getCfg(),cw=canvas.width,ch=canvas.height;
      ctx.fillStyle='rgba(8,10,14,0.14)';ctx.fillRect(0,0,cw,ch);
      if(t-lastBolt>1/c.rate){
        lastBolt=t;ctx.lineCap='round';
        bolt(cw*(0.2+Math.random()*0.6),0,cw*(0.1+Math.random()*0.8),ch,Math.round(c.depth),c.spread,c.branchProb,c.hue,c.glow);
      }
      animId=requestAnimationFrame(draw);
    };
    resize();draw();
    const ro=new ResizeObserver(()=>resize());ro.observe(canvas);
    return()=>{cancelAnimationFrame(animId);ro.disconnect();};
  },
};

// ─── 51. Burning Ship ─────────────────────────────────────────────────────────

const burningShipBg: BgDef = {
  id: 'burningship',
  label: 'Burning Ship',
  description: 'z→(|Re|+i|Im|)²+c — absolute value twists the Mandelbrot into a flaming armada',
  defaults: { maxIter: 128, zoom: 1.0, panX: -0.5, panY: -0.5, drift: 0.04, palette: 0 },
  sliders: [
    { key: 'maxIter', label: 'Max iter',   min: 16,   max: 512,  step: 8    },
    { key: 'zoom',    label: 'Zoom',       min: 0.1,  max: 15.0, step: 0.1  },
    { key: 'panX',    label: 'Pan X',      min: -2.5, max: 1.5,  step: 0.01 },
    { key: 'panY',    label: 'Pan Y',      min: -2.0, max: 1.0,  step: 0.01 },
    { key: 'drift',   label: 'Auto drift', min: 0,    max: 0.5,  step: 0.01 },
    { key: 'palette', label: 'Palette',    min: 0,    max: 3,    step: 1    },
  ],
  create(canvas, getCfg) {
    const ctx = canvas.getContext('2d')!;
    let animId: number,t=0;
    let gw=1,gh=1,imgData=new ImageData(1,1),off: HTMLCanvasElement|null=null,offCtx: CanvasRenderingContext2D|null=null;
    const resize=()=>{
      const r=canvas.getBoundingClientRect();canvas.width=r.width;canvas.height=r.height;
      gw=Math.ceil(r.width/5);gh=Math.ceil(r.height/5);
      imgData=new ImageData(gw,gh);off=document.createElement('canvas');off.width=gw;off.height=gh;offCtx=off.getContext('2d')!;
    };
    const draw=()=>{
      const c=getCfg();t+=c.drift*0.003;
      const maxIter=Math.round(c.maxIter),sc=3.0/c.zoom,d=imgData.data,pal=Math.round(c.palette);
      const cx2=c.panX+Math.sin(t*0.37)*0.01*c.drift,cy2=c.panY+Math.cos(t*0.29)*0.01*c.drift;
      for(let py=0;py<gh;py++) for(let px=0;px<gw;px++){
        const cr=(px/gw-0.5)*sc*(gw/gh)+cx2,ci=(py/gh-0.5)*sc+cy2;
        let zr=0,zi=0,it=0;
        while(it<maxIter){const ar=Math.abs(zr),ai=Math.abs(zi);if(ar*ar+ai*ai>4)break;zr=ar*ar-ai*ai+cr;zi=2*ar*ai+ci;it++;}
        let val=0;
        if(it<maxIter){const ar=Math.abs(zr),ai=Math.abs(zi);val=Math.max(0,(it+1-Math.log(Math.log(Math.sqrt(ar*ar+ai*ai))*Math.LOG2E)*Math.LOG2E)/maxIter);}
        const idx=px+py*gw;let r2=0,g2=0,b2=0;
        if(val>0){
          if(pal===0){[r2,g2,b2]=hslToRgb(((val*300+10)%360)/360,0.9,0.45+val*0.35);}
          else if(pal===1){r2=Math.floor(val*255);g2=Math.floor(val*val*180);b2=0;}
          else if(pal===2){[r2,g2,b2]=hslToRgb((180+val*120)/360,0.8,0.2+val*0.6);}
          else{[r2,g2,b2]=hslToRgb((val*5)%1,0.85,0.5);}
        }
        d[idx*4]=r2;d[idx*4+1]=g2;d[idx*4+2]=b2;d[idx*4+3]=255;
      }
      offCtx!.putImageData(imgData,0,0);ctx.imageSmoothingEnabled=true;
      ctx.drawImage(off!,0,0,gw,gh,0,0,canvas.width,canvas.height);
      animId=requestAnimationFrame(draw);
    };
    resize();draw();
    const ro=new ResizeObserver(()=>resize());ro.observe(canvas);
    return()=>{cancelAnimationFrame(animId);ro.disconnect();};
  },
};

// ─── 52. BZ Reaction ─────────────────────────────────────────────────────────

const bzReactionBg: BgDef = {
  id: 'bzreaction',
  label: 'BZ Reaction',
  description: 'Belousov-Zhabotinsky excitable medium — chemical waves spiral outward from spontaneous ignition',
  defaults: { states: 12, threshold: 2, stepsPerFrame: 1, palette: 0, cellSize: 3 },
  sliders: [
    { key: 'states',        label: 'States',      min: 4,  max: 24,  step: 1 },
    { key: 'threshold',     label: 'Threshold',   min: 1,  max: 6,   step: 1 },
    { key: 'stepsPerFrame', label: 'Steps/frame', min: 1,  max: 4,   step: 1 },
    { key: 'palette',       label: 'Palette',     min: 0,  max: 2,   step: 1 },
    { key: 'cellSize',      label: 'Cell size',   min: 2,  max: 8,   step: 1 },
  ],
  create(canvas, getCfg) {
    const ctx = canvas.getContext('2d')!;
    let animId: number;
    let gw=1,gh=1,grid: Uint8Array,next: Uint8Array;
    let imgData=new ImageData(1,1),off: HTMLCanvasElement|null=null,offCtx: CanvasRenderingContext2D|null=null;
    let lastCS=-1,lastSt=-1;
    const initGrid=(cs: number,ns: number)=>{
      gw=Math.floor(canvas.width/cs);gh=Math.floor(canvas.height/cs);
      grid=new Uint8Array(gw*gh);next=new Uint8Array(gw*gh);
      for(let i=0;i<gw*gh;i++) grid[i]=Math.floor(Math.random()*ns);
      imgData=new ImageData(gw,gh);off=document.createElement('canvas');off.width=gw;off.height=gh;offCtx=off.getContext('2d')!;
      lastCS=cs;lastSt=ns;
    };
    const resize=()=>{const r=canvas.getBoundingClientRect();canvas.width=r.width;canvas.height=r.height;lastCS=-1;};
    const step=(ns: number,thr: number)=>{
      for(let y=0;y<gh;y++) for(let x=0;x<gw;x++){
        const i=x+y*gw,s=grid[i];
        if(s===0){
          // Count excited (state=1) neighbors
          let cnt=0;
          if(x>0&&grid[i-1]===1)cnt++;if(x<gw-1&&grid[i+1]===1)cnt++;
          if(y>0&&grid[i-gw]===1)cnt++;if(y<gh-1&&grid[i+gw]===1)cnt++;
          next[i]=cnt>=thr?1:0;
        } else {
          next[i]=(s+1)%ns;
        }
      }
      const tmp=grid;grid=next;next=tmp;
    };
    const draw=()=>{
      const c=getCfg(),cs=Math.round(c.cellSize),ns=Math.round(c.states),thr=Math.round(c.threshold);
      if(cs!==lastCS||ns!==lastSt) initGrid(cs,ns);
      const spf=Math.round(c.stepsPerFrame);
      for(let s=0;s<spf;s++) step(ns,thr);
      const d2=imgData.data,pal=Math.round(c.palette);
      for(let i=0;i<gw*gh;i++){
        const frac=grid[i]/ns;let r2=0,g2=0,b2=0;
        if(pal===0){[r2,g2,b2]=hslToRgb((200+frac*160)/360,0.85,0.15+frac*0.6);}
        else if(pal===1){[r2,g2,b2]=hslToRgb((0+frac*120)/360,0.9,0.15+frac*0.65);}
        else{[r2,g2,b2]=hslToRgb((260+frac*180)/360,0.8,0.15+frac*0.6);}
        d2[i*4]=r2;d2[i*4+1]=g2;d2[i*4+2]=b2;d2[i*4+3]=255;
      }
      offCtx!.putImageData(imgData,0,0);ctx.imageSmoothingEnabled=false;
      ctx.drawImage(off!,0,0,gw,gh,0,0,canvas.width,canvas.height);
      animId=requestAnimationFrame(draw);
    };
    resize();draw();
    const ro=new ResizeObserver(()=>resize());ro.observe(canvas);
    return()=>{cancelAnimationFrame(animId);ro.disconnect();};
  },
};

// ─── 53. Perlin Marble ────────────────────────────────────────────────────────

const marbleBg: BgDef = {
  id: 'marble',
  label: 'Marble',
  description: 'Perlin turbulence marble — sinusoidal veins distorted by layered noise',
  defaults: { scale: 2.5, octaves: 5, turbStr: 1.0, speed: 0.15, veinFreq: 3.0, palette: 0 },
  sliders: [
    { key: 'scale',    label: 'Scale',       min: 0.5, max: 6.0, step: 0.1  },
    { key: 'octaves',  label: 'Octaves',     min: 1,   max: 7,   step: 1    },
    { key: 'turbStr',  label: 'Turbulence',  min: 0,   max: 3.0, step: 0.1  },
    { key: 'speed',    label: 'Speed',       min: 0,   max: 1.0, step: 0.01 },
    { key: 'veinFreq', label: 'Vein freq',   min: 0.5, max: 8.0, step: 0.1  },
    { key: 'palette',  label: 'Palette',     min: 0,   max: 2,   step: 1    },
  ],
  create(canvas, getCfg) {
    const ctx = canvas.getContext('2d')!;
    let animId: number,t=0;
    let gw=1,gh=1,imgData=new ImageData(1,1),off: HTMLCanvasElement|null=null,offCtx: CanvasRenderingContext2D|null=null;
    const mh3=(n:number)=>{const x=Math.sin(n+13.7)*43758.5453;return x-Math.floor(x);};
    const mn3=(x:number,y:number)=>{const ix=Math.floor(x),iy=Math.floor(y),fx=x-ix,fy=y-iy,ux=fx*fx*(3-2*fx),uy=fy*fy*(3-2*fy);return mh3(ix+iy*57)*(1-ux)*(1-uy)+mh3(ix+1+iy*57)*ux*(1-uy)+mh3(ix+(iy+1)*57)*(1-ux)*uy+mh3(ix+1+(iy+1)*57)*ux*uy;};
    const turb=(x:number,y:number,oct:number)=>{let v=0,a=1,f=1;for(let i=0;i<oct;i++){v+=Math.abs(mn3(x*f+i*2.1,y*f+i*3.7)-0.5)*2*a;f*=2;a*=0.5;}return v;};
    const resize=()=>{
      const r=canvas.getBoundingClientRect();canvas.width=r.width;canvas.height=r.height;
      gw=Math.ceil(r.width/4);gh=Math.ceil(r.height/4);
      imgData=new ImageData(gw,gh);off=document.createElement('canvas');off.width=gw;off.height=gh;offCtx=off.getContext('2d')!;
    };
    const draw=()=>{
      const c=getCfg();t+=c.speed*0.005;
      const d=imgData.data,pal=Math.round(c.palette),oct=Math.round(c.octaves);
      for(let py=0;py<gh;py++) for(let px=0;px<gw;px++){
        const x=px/gw*c.scale+t,y=py/gh*c.scale;
        const tb=turb(x,y,oct)*c.turbStr;
        const v=(Math.sin((x+tb)*c.veinFreq*Math.PI)*0.5+0.5);
        let r2=0,g2=0,b2=0;
        if(pal===0){[r2,g2,b2]=hslToRgb(0,0,0.12+v*0.65);}
        else if(pal===1){[r2,g2,b2]=hslToRgb((200+v*30)/360,0.6,0.1+v*0.7);}
        else{[r2,g2,b2]=hslToRgb((30+v*20)/360,0.7*v+0.1,0.08+v*0.65);}
        const idx=px+py*gw;d[idx*4]=r2;d[idx*4+1]=g2;d[idx*4+2]=b2;d[idx*4+3]=255;
      }
      offCtx!.putImageData(imgData,0,0);ctx.imageSmoothingEnabled=true;
      ctx.drawImage(off!,0,0,gw,gh,0,0,canvas.width,canvas.height);
      animId=requestAnimationFrame(draw);
    };
    resize();draw();
    const ro=new ResizeObserver(()=>resize());ro.observe(canvas);
    return()=>{cancelAnimationFrame(animId);ro.disconnect();};
  },
};

// ─── 54. Water Simulation ─────────────────────────────────────────────────────

const waterSimBg: BgDef = {
  id: 'watersim',
  label: 'Water Sim',
  description: 'Height-field shallow water — drop impacts ripple outward and interfere',
  defaults: { dropRate: 0.5, damping: 0.985, dropSize: 3, palette: 0, dropAmp: 0.8 },
  sliders: [
    { key: 'dropRate', label: 'Drop rate',  min: 0.1, max: 3.0, step: 0.1  },
    { key: 'damping',  label: 'Damping',    min: 0.96, max: 1.0, step: 0.001 },
    { key: 'dropSize', label: 'Drop size',  min: 1,   max: 8,   step: 1    },
    { key: 'palette',  label: 'Palette',    min: 0,   max: 2,   step: 1    },
    { key: 'dropAmp',  label: 'Drop force', min: 0.1, max: 2.0, step: 0.1  },
  ],
  create(canvas, getCfg) {
    const ctx = canvas.getContext('2d')!;
    let animId: number,t2=0;
    let gw=1,gh=1;
    let h1: Float32Array,h2: Float32Array;
    let imgData=new ImageData(1,1),off: HTMLCanvasElement|null=null,offCtx: CanvasRenderingContext2D|null=null;
    const resize=()=>{
      const r=canvas.getBoundingClientRect();canvas.width=r.width;canvas.height=r.height;
      gw=Math.ceil(r.width/3);gh=Math.ceil(r.height/3);
      h1=new Float32Array(gw*gh);h2=new Float32Array(gw*gh);
      imgData=new ImageData(gw,gh);off=document.createElement('canvas');off.width=gw;off.height=gh;offCtx=off.getContext('2d')!;
    };
    const draw=()=>{
      const c=getCfg();t2+=1/60;
      // Random drops
      while(Math.random()<c.dropRate/60){
        const dx=Math.floor(Math.random()*gw),dy=Math.floor(Math.random()*gh),ds=Math.round(c.dropSize);
        for(let dy2=-ds;dy2<=ds;dy2++) for(let dx2=-ds;dx2<=ds;dx2++){
          const nx=dx+dx2,ny=dy+dy2;if(nx<0||nx>=gw||ny<0||ny>=gh) continue;
          if(dx2*dx2+dy2*dy2<=ds*ds) h1[nx+ny*gw]=c.dropAmp*(1-Math.sqrt(dx2*dx2+dy2*dy2)/ds);
        }
      }
      // Update wave equation
      const damp=c.damping;
      for(let y=1;y<gh-1;y++) for(let x=1;x<gw-1;x++){
        const i=x+y*gw;
        h2[i]=((h1[i-1]+h1[i+1]+h1[i-gw]+h1[i+gw])/2-h2[i])*damp;
      }
      const tmp=h1;h1=h2;h2=tmp;
      const d2=imgData.data,pal=Math.round(c.palette);
      for(let i=0;i<gw*gh;i++){
        const v=Math.max(-1,Math.min(1,h1[i])),norm=(v+1)/2;let r2=0,g2=0,b2=0;
        if(pal===0){[r2,g2,b2]=hslToRgb((210+v*20)/360,0.7,0.2+norm*0.55);}
        else if(pal===1){[r2,g2,b2]=hslToRgb((10+norm*30)/360,0.6,0.15+norm*0.6);}
        else{[r2,g2,b2]=hslToRgb((100+v*40)/360,0.65,0.2+norm*0.5);}
        d2[i*4]=r2;d2[i*4+1]=g2;d2[i*4+2]=b2;d2[i*4+3]=255;
      }
      offCtx!.putImageData(imgData,0,0);ctx.imageSmoothingEnabled=true;
      ctx.drawImage(off!,0,0,gw,gh,0,0,canvas.width,canvas.height);
      animId=requestAnimationFrame(draw);
    };
    resize();draw();
    const ro=new ResizeObserver(()=>resize());ro.observe(canvas);
    return()=>{cancelAnimationFrame(animId);ro.disconnect();};
  },
};

// ─── 55. Cycloid Family ────────────────────────────────────────────────────────

const cycloidBg: BgDef = {
  id: 'cycloid',
  label: 'Cycloid',
  description: 'Animated epicycloid / hypotrochoid family — rolling circle geometry unrolled in time',
  defaults: { R: 5, r: 3, d: 2.2, speed: 0.18, trails: 0.94, lineWidth: 1.2 },
  sliders: [
    { key: 'R',         label: 'Outer R',    min: 1,   max: 12,  step: 0.5  },
    { key: 'r',         label: 'Inner r',    min: 0.5, max: 6,   step: 0.5  },
    { key: 'd',         label: 'Pen dist',   min: 0,   max: 6,   step: 0.1  },
    { key: 'speed',     label: 'Speed',      min: 0,   max: 1.0, step: 0.01 },
    { key: 'trails',    label: 'Trail',      min: 0.8, max: 1.0, step: 0.005 },
    { key: 'lineWidth', label: 'Line width', min: 0.3, max: 4.0, step: 0.1  },
  ],
  create(canvas, getCfg) {
    const ctx = canvas.getContext('2d')!;
    let animId: number, tc=0;
    const resize=()=>{const r=canvas.getBoundingClientRect();canvas.width=r.width;canvas.height=r.height;};
    let prevX=NaN,prevY=NaN;
    const draw=()=>{
      const c=getCfg(); tc+=c.speed*0.02;
      const cw=canvas.width,ch=canvas.height;
      ctx.fillStyle=`rgba(8,10,14,${1-c.trails})`; ctx.fillRect(0,0,cw,ch);
      const sc=Math.min(cw,ch)*0.42/(c.R+c.d),ox=cw/2,oy=ch/2;
      const R=c.R,r=c.r,d=c.d;
      // Hypotrochoid: x=(R-r)cos(t)+d*cos((R-r)/r*t), y=(R-r)sin(t)-d*sin((R-r)/r*t)
      const steps=Math.ceil(c.speed*30+2);
      for(let s=0;s<steps;s++){
        const tt=tc-c.speed*0.02*(steps-1-s)/steps;
        const x=(R-r)*Math.cos(tt)+d*Math.cos((R-r)/r*tt);
        const y=(R-r)*Math.sin(tt)-d*Math.sin((R-r)/r*tt);
        const px=ox+x*sc,py=oy+y*sc;
        if(!isNaN(prevX)){
          const hue=((tc*30)%360+360)%360;
          ctx.beginPath();ctx.moveTo(prevX,prevY);ctx.lineTo(px,py);
          ctx.strokeStyle=`hsl(${hue},80%,68%)`;ctx.lineWidth=c.lineWidth;ctx.stroke();
        }
        prevX=px;prevY=py;
      }
      animId=requestAnimationFrame(draw);
    };
    resize();draw();
    const ro=new ResizeObserver(()=>resize());ro.observe(canvas);
    return()=>{cancelAnimationFrame(animId);ro.disconnect();};
  },
};

// ─── 56. Supernova ────────────────────────────────────────────────────────────

const supernovaBg: BgDef = {
  id: 'supernova',
  label: 'Supernova',
  description: 'Stellar explosion simulation — shockwave, ejecta rings, and debris cloud with periodic rebirth',
  defaults: { particles: 600, period: 4.0, speed: 1.0, glow: 0.7, hue: 30 },
  sliders: [
    { key: 'particles', label: 'Particles',  min: 100,  max: 1500, step: 50   },
    { key: 'period',    label: 'Period (s)',  min: 1.0,  max: 10.0, step: 0.5  },
    { key: 'speed',     label: 'Speed',      min: 0.2,  max: 3.0,  step: 0.1  },
    { key: 'glow',      label: 'Glow',       min: 0,    max: 1.0,  step: 0.05 },
    { key: 'hue',       label: 'Hue base',   min: 0,    max: 360,  step: 1    },
  ],
  create(canvas, getCfg) {
    const ctx = canvas.getContext('2d')!;
    let animId: number, t3=0;
    type Spark = {vx:number;vy:number;hue:number;size:number;layer:number};
    let sparks: Spark[] = [];
    let lastN=-1;
    const resize=()=>{const r=canvas.getBoundingClientRect();canvas.width=r.width;canvas.height=r.height;};
    const explode=(n:number,hue:number)=>{
      sparks=Array.from({length:n},(_,i)=>{
        const ang=Math.random()*Math.PI*2,spd=0.5+Math.random()*3,layer=Math.random();
        return {vx:Math.cos(ang)*spd,vy:Math.sin(ang)*spd,hue:(hue+layer*80)%360,size:0.5+Math.random()*2,layer};
      });
      lastN=n;
    };
    const draw=()=>{
      const c=getCfg(); t3+=1/60;
      const n=Math.round(c.particles);
      if(n!==lastN||t3>c.period){if(t3>c.period)t3=0;explode(n,c.hue);}
      const cw=canvas.width,ch=canvas.height,ox=cw/2,oy=ch/2;
      ctx.fillStyle='rgba(8,10,14,0.18)';ctx.fillRect(0,0,cw,ch);
      const age=t3/c.period,maxR=Math.min(cw,ch)*0.45;
      // Shockwave ring
      const swr=age*maxR;
      if(swr>0){
        ctx.beginPath();ctx.arc(ox,oy,swr,0,Math.PI*2);
        ctx.strokeStyle=`hsla(${c.hue},90%,75%,${Math.max(0,(1-age)*0.5)})`;ctx.lineWidth=3+age*4;ctx.stroke();
        if(c.glow>0){ctx.strokeStyle=`hsla(${c.hue},80%,70%,${Math.max(0,(1-age)*c.glow*0.3)})`;ctx.lineWidth=12+age*15;ctx.stroke();}
      }
      // Flash
      if(age<0.05){const flash=ctx.createRadialGradient(ox,oy,0,ox,oy,maxR*0.4);flash.addColorStop(0,`rgba(255,255,200,${(1-age/0.05)*0.8})`);flash.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=flash;ctx.fillRect(0,0,cw,ch);}
      // Debris
      sparks.forEach(sp=>{
        const px=ox+sp.vx*swr,py=oy+sp.vy*swr,alpha=Math.max(0,(1-age)*0.8);
        if(c.glow>0){const g2=ctx.createRadialGradient(px,py,0,px,py,sp.size*4*c.glow);g2.addColorStop(0,`hsla(${sp.hue},90%,80%,${alpha*0.5})`);g2.addColorStop(1,'rgba(0,0,0,0)');ctx.beginPath();ctx.arc(px,py,sp.size*4*c.glow,0,Math.PI*2);ctx.fillStyle=g2;ctx.fill();}
        ctx.beginPath();ctx.arc(px,py,sp.size,0,Math.PI*2);ctx.fillStyle=`hsla(${sp.hue},85%,78%,${alpha})`;ctx.fill();
      });
      animId=requestAnimationFrame(draw);
    };
    resize();draw();
    const ro=new ResizeObserver(()=>resize());ro.observe(canvas);
    return()=>{cancelAnimationFrame(animId);ro.disconnect();};
  },
};

// ─── 57. Moiré Rings ─────────────────────────────────────────────────────────

const moireBg: BgDef = {
  id: 'moire',
  label: 'Moiré',
  description: 'Interference between two rotating concentric ring families — optical illusions from pure math',
  defaults: { freq: 0.04, speed: 0.12, offset: 0.2, hue: 180, contrast: 0.8 },
  sliders: [
    { key: 'freq',     label: 'Frequency', min: 0.01, max: 0.12, step: 0.002 },
    { key: 'speed',    label: 'Speed',     min: 0,    max: 0.5,  step: 0.01  },
    { key: 'offset',   label: 'Offset',    min: 0,    max: 1.0,  step: 0.02  },
    { key: 'hue',      label: 'Hue',       min: 0,    max: 360,  step: 1     },
    { key: 'contrast', label: 'Contrast',  min: 0.2,  max: 1.0,  step: 0.05  },
  ],
  create(canvas, getCfg) {
    const ctx = canvas.getContext('2d')!;
    let animId: number,tm=0;
    let gw=1,gh=1,imgData=new ImageData(1,1),off: HTMLCanvasElement|null=null,offCtx: CanvasRenderingContext2D|null=null;
    const resize=()=>{
      const r=canvas.getBoundingClientRect();canvas.width=r.width;canvas.height=r.height;
      gw=Math.ceil(r.width/4);gh=Math.ceil(r.height/4);
      imgData=new ImageData(gw,gh);off=document.createElement('canvas');off.width=gw;off.height=gh;offCtx=off.getContext('2d')!;
    };
    const draw=()=>{
      const c=getCfg();tm+=c.speed*0.02;
      const d=imgData.data,f=c.freq,h=c.hue,cont=c.contrast;
      const cx2=gw/2,cy2=gh/2,dx2=Math.cos(tm)*gw*c.offset,dy2=Math.sin(tm*0.7)*gh*c.offset;
      const c1x=cx2+dx2,c1y=cy2+dy2,c2x=cx2-dx2,c2y=cy2-dy2;
      for(let py=0;py<gh;py++) for(let px=0;px<gw;px++){
        const r1=Math.sqrt((px-c1x)**2+(py-c1y)**2),r2=Math.sqrt((px-c2x)**2+(py-c2y)**2);
        const v1=Math.sin(r1*f*Math.PI*2)*0.5+0.5,v2=Math.sin(r2*f*Math.PI*2+tm*3)*0.5+0.5;
        const v=v1*v2,bright=0.1+v*cont;
        const [r2v,gv,bv]=hslToRgb(h/360,0.75,bright);
        const idx=px+py*gw;d[idx*4]=r2v;d[idx*4+1]=gv;d[idx*4+2]=bv;d[idx*4+3]=255;
      }
      offCtx!.putImageData(imgData,0,0);ctx.imageSmoothingEnabled=true;
      ctx.drawImage(off!,0,0,gw,gh,0,0,canvas.width,canvas.height);
      animId=requestAnimationFrame(draw);
    };
    resize();draw();
    const ro=new ResizeObserver(()=>resize());ro.observe(canvas);
    return()=>{cancelAnimationFrame(animId);ro.disconnect();};
  },
};

// ─── 58. Gravity Lens ─────────────────────────────────────────────────────────

const gravityLensBg: BgDef = {
  id: 'gravitylens',
  label: 'Gravity Lens',
  description: 'Gravitational lensing of star field — Einstein ring and radial distortion from a massive object',
  defaults: { einsteinR: 0.18, starCount: 300, lensSpeed: 0.08, lensSize: 0.06, hue: 220 },
  sliders: [
    { key: 'einsteinR',  label: 'Einstein radius', min: 0.02, max: 0.4,  step: 0.01 },
    { key: 'starCount',  label: 'Stars',           min: 50,   max: 800,  step: 25   },
    { key: 'lensSpeed',  label: 'Drift speed',     min: 0,    max: 0.3,  step: 0.01 },
    { key: 'lensSize',   label: 'Lens glow',       min: 0,    max: 0.15, step: 0.01 },
    { key: 'hue',        label: 'Star hue',        min: 0,    max: 360,  step: 1    },
  ],
  create(canvas, getCfg) {
    const ctx = canvas.getContext('2d')!;
    let animId: number,tg=0;
    let gw=1,gh=1,imgData=new ImageData(1,1),off: HTMLCanvasElement|null=null,offCtx: CanvasRenderingContext2D|null=null;
    type Star={sx:number;sy:number;brightness:number;size:number};
    let stars: Star[]=[];let lastSC=-1;
    const resize=()=>{
      const r=canvas.getBoundingClientRect();canvas.width=r.width;canvas.height=r.height;
      gw=Math.ceil(r.width/4);gh=Math.ceil(r.height/4);
      imgData=new ImageData(gw,gh);off=document.createElement('canvas');off.width=gw;off.height=gh;offCtx=off.getContext('2d')!;lastSC=-1;
    };
    const initStars=(n:number)=>{stars=Array.from({length:n},()=>({sx:Math.random(),sy:Math.random(),brightness:0.3+Math.random()*0.7,size:0.3+Math.random()*1.2}));lastSC=n;};
    const draw=()=>{
      const c=getCfg();tg+=c.lensSpeed*0.008;
      const n=Math.round(c.starCount);if(n!==lastSC) initStars(n);
      const ER=c.einsteinR,lx=0.5+Math.cos(tg)*0.2,ly=0.5+Math.sin(tg*0.7)*0.15;
      const d=imgData.data;
      d.fill(0);for(let i=3;i<d.length;i+=4) d[i]=255;
      // Render lensed stars
      stars.forEach(s=>{
        const dx2=s.sx-lx,dy2=s.sy-ly;
        const r2=Math.sqrt(dx2*dx2+dy2*dy2)+1e-6;
        const bend=ER*ER/r2;
        const ax=s.sx-bend*(dx2/r2),ay=s.sy-bend*(dy2/r2);
        const px=Math.round(ax*gw),py=Math.round(ay*gh);
        if(px<0||px>=gw||py<0||py>=gh) return;
        const idx=px+py*gw;
        const [rv,gv,bv]=hslToRgb((c.hue+s.brightness*60)/360,0.7,s.brightness*0.75);
        const a=Math.min(255,Math.round(s.brightness*200));
        if(d[idx*4+3]<a){d[idx*4]=rv;d[idx*4+1]=gv;d[idx*4+2]=bv;d[idx*4+3]=a;}
      });
      offCtx!.putImageData(imgData,0,0);
      ctx.imageSmoothingEnabled=true;ctx.drawImage(off!,0,0,gw,gh,0,0,canvas.width,canvas.height);
      if(c.lensSize>0){
        const lensGrad=ctx.createRadialGradient(lx*canvas.width,ly*canvas.height,0,lx*canvas.width,ly*canvas.height,c.lensSize*Math.min(canvas.width,canvas.height));
        lensGrad.addColorStop(0,`hsla(${c.hue+40},90%,90%,0.85)`);lensGrad.addColorStop(0.4,`hsla(${c.hue},70%,60%,0.3)`);lensGrad.addColorStop(1,'rgba(0,0,0,0)');
        ctx.fillStyle=lensGrad;ctx.fillRect(0,0,canvas.width,canvas.height);
      }
      animId=requestAnimationFrame(draw);
    };
    resize();draw();
    const ro=new ResizeObserver(()=>resize());ro.observe(canvas);
    return()=>{cancelAnimationFrame(animId);ro.disconnect();};
  },
};

// ─── 59. Euler Spiral ─────────────────────────────────────────────────────────

const eulerSpiralBg: BgDef = {
  id: 'eulerspiral',
  label: 'Euler Spiral',
  description: 'Cornu spiral — Fresnel integrals trace curvature proportional to arc length',
  defaults: { tMax: 8.0, speed: 0.4, zoom: 0.9, lineWidth: 1.2, hue: 200, copies: 4 },
  sliders: [
    { key: 'tMax',      label: 'Extent',    min: 2,   max: 20,  step: 0.5  },
    { key: 'speed',     label: 'Speed',     min: 0,   max: 2.0, step: 0.05 },
    { key: 'zoom',      label: 'Zoom',      min: 0.3, max: 2.5, step: 0.05 },
    { key: 'lineWidth', label: 'Width',     min: 0.3, max: 4.0, step: 0.1  },
    { key: 'hue',       label: 'Hue',       min: 0,   max: 360, step: 1    },
    { key: 'copies',    label: 'Copies',    min: 1,   max: 8,   step: 1    },
  ],
  create(canvas, getCfg) {
    const ctx = canvas.getContext('2d')!;
    let animId: number,te=0;
    const resize=()=>{const r=canvas.getBoundingClientRect();canvas.width=r.width;canvas.height=r.height;};
    const draw=()=>{
      const c=getCfg();te+=c.speed*0.012;
      const cw=canvas.width,ch=canvas.height;
      ctx.fillStyle='rgba(8,10,14,0.18)';ctx.fillRect(0,0,cw,ch);
      const sc=Math.min(cw,ch)*c.zoom*0.28,tMax=c.tMax,dt=0.02,n2=Math.round(c.copies);
      // Precompute Fresnel integral points
      const pts: [number,number][]=[];
      let cx3=0,cy3=0;
      for(let s=0;s<=tMax*50;s++){
        const t4=s*0.02;cx3+=Math.cos(Math.PI*t4*t4/2)*dt;cy3+=Math.sin(Math.PI*t4*t4/2)*dt;
        pts.push([cx3,cy3]);
      }
      for(let ci=0;ci<n2;ci++){
        const rot=(ci/n2)*Math.PI*2+te;
        const hue=(c.hue+ci*(360/n2))%360;
        ctx.beginPath();
        pts.forEach(([px2,py2],i)=>{
          const rx=Math.cos(rot)*px2-Math.sin(rot)*py2,ry=Math.sin(rot)*px2+Math.cos(rot)*py2;
          const sx=cw/2+rx*sc,sy=ch/2-ry*sc;
          i===0?ctx.moveTo(sx,sy):ctx.lineTo(sx,sy);
        });
        const t5=te*0.3,fade=0.4+0.5*Math.sin(t5+ci);
        ctx.strokeStyle=`hsla(${hue},80%,68%,${fade})`;ctx.lineWidth=c.lineWidth;ctx.stroke();
        // Mirror (other half)
        ctx.beginPath();
        pts.forEach(([px2,py2],i)=>{
          const rx=Math.cos(rot)*(-px2)-Math.sin(rot)*(-py2),ry=Math.sin(rot)*(-px2)+Math.cos(rot)*(-py2);
          const sx=cw/2+rx*sc,sy=ch/2-ry*sc;
          i===0?ctx.moveTo(sx,sy):ctx.lineTo(sx,sy);
        });
        ctx.strokeStyle=`hsla(${(hue+30)%360},80%,68%,${fade*0.7})`;ctx.stroke();
      }
      animId=requestAnimationFrame(draw);
    };
    resize();draw();
    const ro=new ResizeObserver(()=>resize());ro.observe(canvas);
    return()=>{cancelAnimationFrame(animId);ro.disconnect();};
  },
};

// ─── 60. Kaleidoscope ─────────────────────────────────────────────────────────

const kaleidoscopeBg: BgDef = {
  id: 'kaleidoscope',
  label: 'Kaleidoscope',
  description: 'n-fold mirror symmetry applied to animated noise — infinite reflection chambers',
  defaults: { symmetry: 8, noiseScale: 2.5, speed: 0.15, zoom: 1.0, saturation: 0.8 },
  sliders: [
    { key: 'symmetry',   label: 'Symmetry',   min: 3,   max: 16,  step: 1    },
    { key: 'noiseScale', label: 'Scale',      min: 0.5, max: 6.0, step: 0.1  },
    { key: 'speed',      label: 'Speed',      min: 0,   max: 0.5, step: 0.01 },
    { key: 'zoom',       label: 'Zoom',       min: 0.3, max: 3.0, step: 0.1  },
    { key: 'saturation', label: 'Saturation', min: 0,   max: 1.0, step: 0.05 },
  ],
  create(canvas, getCfg) {
    const ctx = canvas.getContext('2d')!;
    let animId: number,tk=0;
    let gw=1,gh=1,imgData=new ImageData(1,1),off: HTMLCanvasElement|null=null,offCtx: CanvasRenderingContext2D|null=null;
    const kh=(n:number)=>{const x=Math.sin(n+5.3)*43758.5453;return x-Math.floor(x);};
    const kn=(x:number,y:number)=>{const ix=Math.floor(x),iy=Math.floor(y),fx=x-ix,fy=y-iy,ux=fx*fx*(3-2*fx),uy=fy*fy*(3-2*fy);return kh(ix+iy*57)*(1-ux)*(1-uy)+kh(ix+1+iy*57)*ux*(1-uy)+kh(ix+(iy+1)*57)*(1-ux)*uy+kh(ix+1+(iy+1)*57)*ux*uy;};
    const resize=()=>{
      const r=canvas.getBoundingClientRect();canvas.width=r.width;canvas.height=r.height;
      gw=Math.ceil(r.width/4);gh=Math.ceil(r.height/4);
      imgData=new ImageData(gw,gh);off=document.createElement('canvas');off.width=gw;off.height=gh;offCtx=off.getContext('2d')!;
    };
    const draw=()=>{
      const c=getCfg();tk+=c.speed*0.008;
      const d=imgData.data,sym=Math.round(c.symmetry),sc=c.noiseScale/c.zoom;
      const sectorAng=Math.PI*2/sym;
      for(let py=0;py<gh;py++) for(let px=0;px<gw;px++){
        const dx2=px/gw-0.5,dy2=py/gh-0.5;
        let ang=Math.atan2(dy2,dx2),r2=Math.sqrt(dx2*dx2+dy2*dy2);
        ang=((ang%sectorAng)+sectorAng)%sectorAng;
        if(ang>sectorAng/2) ang=sectorAng-ang;
        const sx=Math.cos(ang)*r2*sc+tk,sy=Math.sin(ang)*r2*sc+tk*0.7;
        const n1=kn(sx,sy),n2=kn(sx+100,sy+50);
        const hue=(n1*360+tk*30)%360,lit=0.2+n1*0.55;
        const [rv,gv,bv]=hslToRgb(hue/360,c.saturation,lit);
        const idx=px+py*gw;d[idx*4]=rv;d[idx*4+1]=gv;d[idx*4+2]=bv;d[idx*4+3]=255;
      }
      offCtx!.putImageData(imgData,0,0);ctx.imageSmoothingEnabled=true;
      ctx.drawImage(off!,0,0,gw,gh,0,0,canvas.width,canvas.height);
      animId=requestAnimationFrame(draw);
    };
    resize();draw();
    const ro=new ResizeObserver(()=>resize());ro.observe(canvas);
    return()=>{cancelAnimationFrame(animId);ro.disconnect();};
  },
};

// ─── 61. Terrain ──────────────────────────────────────────────────────────────

const terrainBg: BgDef = {
  id: 'terrain',
  label: 'Terrain',
  description: 'Procedural aerial terrain — fBm elevation noise mapped to biome colors, infinite scroll',
  defaults: { octaves: 6, scale: 2.5, speed: 0.1, seaLevel: 0.42, detail: 0.55 },
  sliders: [
    { key: 'octaves',  label: 'Octaves',   min: 1,    max: 8,   step: 1    },
    { key: 'scale',    label: 'Scale',     min: 0.5,  max: 6.0, step: 0.1  },
    { key: 'speed',    label: 'Fly speed', min: 0,    max: 0.5, step: 0.01 },
    { key: 'seaLevel', label: 'Sea level', min: 0.2,  max: 0.7, step: 0.02 },
    { key: 'detail',   label: 'Roughness', min: 0.3,  max: 0.7, step: 0.02 },
  ],
  create(canvas, getCfg) {
    const ctx = canvas.getContext('2d')!;
    let animId: number,tt=0;
    let gw=1,gh=1,imgData=new ImageData(1,1),off: HTMLCanvasElement|null=null,offCtx: CanvasRenderingContext2D|null=null;
    const th=(n:number)=>{const x=Math.sin(n+7.1)*43758.5453;return x-Math.floor(x);};
    const tn=(x:number,y:number)=>{const ix=Math.floor(x),iy=Math.floor(y),fx=x-ix,fy=y-iy,ux=fx*fx*(3-2*fx),uy=fy*fy*(3-2*fy);return th(ix+iy*57)*(1-ux)*(1-uy)+th(ix+1+iy*57)*ux*(1-uy)+th(ix+(iy+1)*57)*(1-ux)*uy+th(ix+1+(iy+1)*57)*ux*uy;};
    const tfbm=(x:number,y:number,oct:number,persist:number)=>{let v=0,a=0.5,f=1;for(let i=0;i<oct;i++){v+=tn(x*f,y*f)*a;f*=2;a*=persist;}return v;};
    const resize=()=>{
      const r=canvas.getBoundingClientRect();canvas.width=r.width;canvas.height=r.height;
      gw=Math.ceil(r.width/4);gh=Math.ceil(r.height/4);
      imgData=new ImageData(gw,gh);off=document.createElement('canvas');off.width=gw;off.height=gh;offCtx=off.getContext('2d')!;
    };
    const draw=()=>{
      const c=getCfg();tt+=c.speed*0.005;
      const d=imgData.data,oct=Math.round(c.octaves),sl=c.seaLevel,pers=c.detail;
      for(let py=0;py<gh;py++) for(let px=0;px<gw;px++){
        const x=px/gw*c.scale+tt,y=py/gh*c.scale;
        const h2=tfbm(x,y,oct,pers);
        let r2=0,g2=0,b2=0;
        if(h2<sl-0.1){[r2,g2,b2]=[15,40,100];}
        else if(h2<sl){const t2=(h2-sl+0.1)/0.1;[r2,g2,b2]=[Math.floor(195+t2*40),Math.floor(175+t2*20),Math.floor(120+t2*30)];}
        else if(h2<sl+0.1){[r2,g2,b2]=[60,120,40];}
        else if(h2<sl+0.2){[r2,g2,b2]=[45,95,30];}
        else if(h2<sl+0.32){[r2,g2,b2]=[80,70,55];}
        else{const t2=Math.min(1,(h2-sl-0.32)/0.1);[r2,g2,b2]=[Math.floor(200+t2*55),Math.floor(200+t2*55),Math.floor(200+t2*55)];}
        const idx=px+py*gw;d[idx*4]=r2;d[idx*4+1]=g2;d[idx*4+2]=b2;d[idx*4+3]=255;
      }
      offCtx!.putImageData(imgData,0,0);ctx.imageSmoothingEnabled=true;
      ctx.drawImage(off!,0,0,gw,gh,0,0,canvas.width,canvas.height);
      animId=requestAnimationFrame(draw);
    };
    resize();draw();
    const ro=new ResizeObserver(()=>resize());ro.observe(canvas);
    return()=>{cancelAnimationFrame(animId);ro.disconnect();};
  },
};

// ─── 62. Ribbons ──────────────────────────────────────────────────────────────

const ribbonsBg: BgDef = {
  id: 'ribbons',
  label: 'Ribbons',
  description: '3D twisted ribbons — sinusoidal space curves rendered with depth glow and rotation',
  defaults: { count: 6, twist: 4.0, speed: 0.3, thickness: 2.5, glow: 0.65, spread: 0.5 },
  sliders: [
    { key: 'count',     label: 'Ribbons',   min: 1,   max: 12,  step: 1    },
    { key: 'twist',     label: 'Twist',     min: 0.5, max: 12,  step: 0.5  },
    { key: 'speed',     label: 'Speed',     min: 0,   max: 1.5, step: 0.05 },
    { key: 'thickness', label: 'Thickness', min: 0.5, max: 6.0, step: 0.25 },
    { key: 'glow',      label: 'Glow',      min: 0,   max: 1.0, step: 0.05 },
    { key: 'spread',    label: 'Spread',    min: 0.1, max: 1.5, step: 0.05 },
  ],
  create(canvas, getCfg) {
    const ctx = canvas.getContext('2d')!;
    let animId: number,tr=0;
    const resize=()=>{const r=canvas.getBoundingClientRect();canvas.width=r.width;canvas.height=r.height;};
    const draw=()=>{
      const c=getCfg();tr+=c.speed*0.008;
      const cw=canvas.width,ch=canvas.height;
      ctx.fillStyle='rgba(8,10,14,0.22)';ctx.fillRect(0,0,cw,ch);
      const n=Math.round(c.count),sc=Math.min(cw,ch)*0.35,steps=120;
      for(let ri=0;ri<n;ri++){
        const phase=(ri/n)*Math.PI*2;
        const pts: [number,number,number][]=[];
        for(let s=0;s<=steps;s++){
          const t4=s/steps*Math.PI*2;
          const x2=Math.cos(t4+phase+tr)*c.spread+Math.cos(c.twist*t4+phase)*0.3;
          const y2=Math.sin(t4+phase+tr*0.7)*c.spread;
          const z2=Math.cos(c.twist*t4+phase+tr*0.5)*0.5;
          // Rotate
          const cosr=Math.cos(tr*0.4),sinr=Math.sin(tr*0.4);
          const rx2=x2*cosr+z2*sinr,rz2=-x2*sinr+z2*cosr;
          const fov=2.5,persp=fov/(fov+rz2*0.5);
          pts.push([rx2*persp*sc,y2*persp*sc,rz2]);
        }
        // Sort isn't needed for full loops - just draw with depth alpha
        const hue=(phase*180/Math.PI+tr*30)%360;
        for(let s=0;s<steps;s++){
          const [px2,py2,pz]=pts[s],[qx,qy,qz]=pts[s+1];
          const depth=(pz+qz)/2,alpha=0.35+(depth+0.5)*0.5;
          if(c.glow>0){ctx.beginPath();ctx.moveTo(cw/2+px2,ch/2+py2);ctx.lineTo(cw/2+qx,ch/2+qy);ctx.strokeStyle=`hsla(${hue},85%,70%,${c.glow*alpha*0.4})`;ctx.lineWidth=c.thickness*3;ctx.stroke();}
          ctx.beginPath();ctx.moveTo(cw/2+px2,ch/2+py2);ctx.lineTo(cw/2+qx,ch/2+qy);
          ctx.strokeStyle=`hsla(${hue},80%,72%,${Math.max(0.1,alpha)})`;ctx.lineWidth=c.thickness;ctx.stroke();
        }
      }
      animId=requestAnimationFrame(draw);
    };
    resize();draw();
    const ro=new ResizeObserver(()=>resize());ro.observe(canvas);
    return()=>{cancelAnimationFrame(animId);ro.disconnect();};
  },
};

// ─── registry ─────────────────────────────────────────────────────────────────

const BACKGROUNDS: BgDef[] = [
  particlesBg, auroraBg, topographicBg, sparkNetworkBg,
  starfieldBg, orbitalBg, flowFieldBg, gradientMeshBg,
  matrixBg, bokehBg, plasmaBg, rippleBg, lissajousBg,
  fourierBg, attractorBg, spirographBg, waveInterferenceBg, voronoiBg,
  pendulumBg, wireframeBg, harmonographBg, neonGridBg,
  reactionDiffBg, physarumBg, doublePendulumBg, lorenzBg, domainWarpBg,
  galaxyBg, dlaBg, fractalTreeBg, magneticFieldBg, ifsFractalBg,
  fluidBg, boidsBg, juliaBg, curlNoiseBg, cliffordBg,
  gameOfLifeBg, newtonFractalBg, torusKnotBg, nBodyBg, cymaticsBg,
  mandelbrotBg, rosslerBg, thomasBg, bifurcationBg, sandBg,
  langtonBg, isingBg, lightningBg, burningShipBg, bzReactionBg,
  marbleBg, waterSimBg, cycloidBg, supernovaBg, moireBg,
  gravityLensBg, eulerSpiralBg, kaleidoscopeBg, terrainBg, ribbonsBg,
];

const CATEGORIES: { id: string; label: string; color: string; ids: string[] }[] = [
  { id: 'visual',   label: 'Visual',   color: '#a78bfa', ids: ['aurora','starfield','gradientmesh','matrix','bokeh','plasma','neongrid','galaxy','lightning','marble','supernova','kaleidoscope','terrain','ribbons'] },
  { id: 'physics',  label: 'Physics',  color: '#34d399', ids: ['particles','ripple','pendulum','doublependulum','fluid','boids','nbody','sand','watersim','gravitylens'] },
  { id: 'math',     label: 'Math',     color: '#60a5fa', ids: ['topographic','lissajous','fourier','spirograph','waveinterference','wireframe','harmonograph','torusknot','cymatics','cycloid','moire','eulerspiral'] },
  { id: 'networks', label: 'Networks', color: '#fb923c', ids: ['sparknetwork','orbital','flowfield','voronoi','magneticfield','curlnoise','domainwarp'] },
  { id: 'fractals', label: 'Fractals', color: '#f472b6', ids: ['fractaltree','ifsfractal','julia','newtonfractal','mandelbrot','burningship'] },
  { id: 'chaos',    label: 'Chaos',    color: '#fbbf24', ids: ['attractor','lorenz','clifford','rossler','thomas','bifurcation'] },
  { id: 'cellular', label: 'Cellular', color: '#2dd4bf', ids: ['reactiondiffusion','physarum','dlacrystal','gameoflife','langton','ising','bzreaction'] },
];

// ─── persistence ──────────────────────────────────────────────────────────────

const lsKey = (id: string) => `bglab_cfg_${id}`;

function loadCfg(bg: BgDef): Cfg {
  if (typeof window === 'undefined') return { ...bg.defaults };
  try {
    const raw = localStorage.getItem(lsKey(bg.id));
    if (!raw) return { ...bg.defaults };
    return { ...bg.defaults, ...JSON.parse(raw) };
  } catch { return { ...bg.defaults }; }
}

// ─── component ────────────────────────────────────────────────────────────────

export default function BackgroundLab() {
  const [activeId, setActiveId] = React.useState(BACKGROUNDS[0].id);
  const [configs, setConfigs] = React.useState<Record<string, Cfg>>(() =>
    Object.fromEntries(BACKGROUNDS.map(bg => [bg.id, bg.defaults]))
  );
  const [saved, setSaved] = React.useState(false);
  const [copied, setCopied] = React.useState(false);
  const [slideshow, setSlideshow] = React.useState(false);
  const [shuffled, setShuffled] = React.useState(false);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const cfgRef = React.useRef<Cfg>(configs[activeId]);
  const saveTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const activeIdRef = React.useRef(activeId);
  const configsRef = React.useRef(configs);
  activeIdRef.current = activeId;
  configsRef.current = configs;

  React.useEffect(() => {
    setConfigs(Object.fromEntries(BACKGROUNDS.map(bg => [bg.id, loadCfg(bg)])));
  }, []);

  cfgRef.current = configs[activeId] ?? BACKGROUNDS.find(b => b.id === activeId)!.defaults;

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const bg = BACKGROUNDS.find(b => b.id === activeId);
    if (!bg) return;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const r = canvas.getBoundingClientRect();
      canvas.width = r.width || window.innerWidth;
      canvas.height = r.height || window.innerHeight;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    return bg.create(canvas, () => cfgRef.current);
  }, [activeId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Slideshow auto-advance
  React.useEffect(() => {
    if (!slideshow) return;
    const id = setInterval(() => {
      setActiveId(prev => {
        const idx = BACKGROUNDS.findIndex(b => b.id === prev);
        return BACKGROUNDS[(idx + 1) % BACKGROUNDS.length].id;
      });
    }, 9000);
    return () => clearInterval(id);
  }, [slideshow]);

  // Keyboard shortcuts
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      if (e.key === 'ArrowRight') {
        setActiveId(prev => { const i = BACKGROUNDS.findIndex(b => b.id === prev); return BACKGROUNDS[(i + 1) % BACKGROUNDS.length].id; });
      } else if (e.key === 'ArrowLeft') {
        setActiveId(prev => { const i = BACKGROUNDS.findIndex(b => b.id === prev); return BACKGROUNDS[(i - 1 + BACKGROUNDS.length) % BACKGROUNDS.length].id; });
      } else if (e.key === 'r' || e.key === 'R') {
        const bg = BACKGROUNDS.find(b => b.id === activeIdRef.current)!;
        setConfigs(prev => ({ ...prev, [activeIdRef.current]: { ...bg.defaults } }));
        localStorage.removeItem(lsKey(activeIdRef.current));
      } else if (e.key === ' ') {
        e.preventDefault();
        shuffle();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const activeBg = BACKGROUNDS.find(b => b.id === activeId)!;
  const cfg = configs[activeId] ?? activeBg.defaults;

  const setCfgKey = (key: string, value: number) => {
    const next = { ...cfg, [key]: value };
    setConfigs(prev => ({ ...prev, [activeId]: next }));
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      localStorage.setItem(lsKey(activeId), JSON.stringify(next));
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
    }, 700);
  };

  const handleReset = () => {
    setConfigs(prev => ({ ...prev, [activeId]: { ...activeBg.defaults } }));
    localStorage.removeItem(lsKey(activeId));
  };

  const shuffle = () => {
    const bg = BACKGROUNDS.find(b => b.id === activeIdRef.current)!;
    const rand: Cfg = {};
    bg.sliders.forEach(s => {
      const steps = Math.floor(Math.random() * Math.round((s.max - s.min) / s.step + 1));
      rand[s.key] = parseFloat((s.min + steps * s.step).toFixed(6));
    });
    setConfigs(prev => ({ ...prev, [activeIdRef.current]: rand }));
    setShuffled(true);
    setTimeout(() => setShuffled(false), 900);
  };

  const handleCopy = () => {
    const lines = Object.entries(cfg).map(([k, v]) => `  ${k}: ${v},`).join('\n');
    navigator.clipboard.writeText(`// ${activeBg.label}\nconst config = {\n${lines}\n};`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const btnBase: React.CSSProperties = { padding: '7px 0', borderRadius: 7, fontSize: 11, cursor: 'pointer', border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.45)' };

  return (
    <div style={{ background: '#0c0d0f', minHeight: '100vh', fontFamily: 'system-ui, sans-serif', color: '#fff' }}>

      {/* Full-viewport canvas */}
      <div style={{ position: 'fixed', inset: 0 }}>
        <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />
      </div>

      {/* Side drawer */}
      <div style={{
        position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 200,
        width: 224,
        background: 'rgba(10,11,14,0.97)',
        backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
        borderRight: '1px solid rgba(255,255,255,0.06)',
        display: 'flex', flexDirection: 'column',
        boxShadow: '6px 0 40px rgba(0,0,0,0.7)',
      }}>
        {/* Drawer header */}
        <div style={{
          padding: '16px 14px 12px',
          borderBottom: '1px solid rgba(255,255,255,0.05)',
          flexShrink: 0,
        }}>
          <div style={{ fontSize: 9, letterSpacing: 3, textTransform: 'uppercase', color: 'rgba(255,255,255,0.22)', marginBottom: 3 }}>
            Background Lab
          </div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.32)' }}>
            {BACKGROUNDS.findIndex(b => b.id === activeId) + 1} / {BACKGROUNDS.length}
          </div>
        </div>

        {/* Scrollable category list */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0 16px', scrollbarWidth: 'none' }}>
          {CATEGORIES.map(cat => {
            const catBgs = cat.ids
              .map(id => BACKGROUNDS.find(b => b.id === id))
              .filter((b): b is BgDef => b !== undefined);
            if (catBgs.length === 0) return null;
            return (
              <div key={cat.id}>
                <div style={{
                  padding: '10px 14px 5px',
                  fontSize: 9, letterSpacing: 2.5, textTransform: 'uppercase',
                  color: cat.color, opacity: 0.75,
                }}>
                  {cat.label}
                </div>
                {catBgs.map(bg => (
                  <button key={bg.id} onClick={() => setActiveId(bg.id)} style={{
                    display: 'block', width: '100%', padding: '6px 14px 6px 16px',
                    background: activeId === bg.id ? 'rgba(45,114,210,0.12)' : 'transparent',
                    border: 'none',
                    borderLeft: activeId === bg.id ? '2px solid #3b82f6' : '2px solid transparent',
                    cursor: 'pointer', textAlign: 'left',
                    fontSize: 12,
                    color: activeId === bg.id ? '#7ab4f8' : 'rgba(255,255,255,0.4)',
                    fontWeight: activeId === bg.id ? 500 : 400,
                    transition: 'all 0.1s',
                  }}>
                    {bg.label}
                  </button>
                ))}
              </div>
            );
          })}
        </div>
      </div>

      {/* ← → arrows */}
      {['left','right'].map(dir => (
        <button key={dir} onClick={() => setActiveId(prev => {
          const i = BACKGROUNDS.findIndex(b => b.id === prev);
          return BACKGROUNDS[dir === 'right' ? (i+1)%BACKGROUNDS.length : (i-1+BACKGROUNDS.length)%BACKGROUNDS.length].id;
        })} style={{
          position: 'fixed', top: '50%', [dir]: 16, transform: 'translateY(-50%)',
          zIndex: 150, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 8, width: 32, height: 48, cursor: 'pointer', color: 'rgba(255,255,255,0.4)',
          fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {dir === 'left' ? '‹' : '›'}
        </button>
      ))}

      {/* Center title */}
      <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', textAlign: 'center', zIndex: 10, pointerEvents: 'none', width: '80%', maxWidth: 480 }}>
        <div style={{ fontSize: 10, letterSpacing: 3, textTransform: 'uppercase', color: 'rgba(255,255,255,0.18)', marginBottom: 12 }}>
          Background Lab
        </div>
        <h1 style={{ fontSize: 'clamp(20px,3.5vw,48px)', fontWeight: 600, lineHeight: 1.1, margin: '0 0 10px', color: 'rgba(255,255,255,0.82)' }}>
          {activeBg.label}
        </h1>
        <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.24)', margin: 0, lineHeight: 1.65 }}>
          {activeBg.description}
        </p>
        <div style={{ marginTop: 14, fontSize: 9, color: 'rgba(255,255,255,0.13)', letterSpacing: 1.5 }}>
          ← → navigate &nbsp;·&nbsp; R reset &nbsp;·&nbsp; Space shuffle
        </div>
      </div>

      {/* Control panel */}
      <div style={{
        position: 'fixed', bottom: 24, right: 24, zIndex: 200,
        background: 'rgba(12,14,18,0.96)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14,
        padding: '15px 19px 13px', width: 256,
        boxShadow: '0 16px 52px rgba(0,0,0,0.8)',
        maxHeight: 'calc(100vh - 80px)', overflowY: 'auto',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <span style={{ fontSize: 9, letterSpacing: 2.5, textTransform: 'uppercase', color: 'rgba(255,255,255,0.22)' }}>
            {activeBg.label}
          </span>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span style={{ fontSize: 9, letterSpacing: 1.5, textTransform: 'uppercase', color: saved ? 'rgba(80,190,100,0.8)' : 'transparent', transition: 'color 0.3s' }}>
              Saved
            </span>
            <button onClick={() => setSlideshow(s => !s)} title="Slideshow" style={{
              padding: '3px 8px', borderRadius: 5, fontSize: 10, cursor: 'pointer',
              background: slideshow ? 'rgba(45,114,210,0.25)' : 'rgba(255,255,255,0.05)',
              border: slideshow ? '1px solid rgba(45,114,210,0.5)' : '1px solid rgba(255,255,255,0.08)',
              color: slideshow ? '#7ab4f8' : 'rgba(255,255,255,0.35)',
            }}>
              {slideshow ? '⏸' : '▶'} Auto
            </button>
          </div>
        </div>

        {/* Sliders */}
        {activeBg.sliders.map(s => (
          <div key={s.key} style={{ marginBottom: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.43)' }}>{s.label}</span>
              <span style={{ fontSize: 11, color: '#5b9cf6', fontVariantNumeric: 'tabular-nums', minWidth: 38, textAlign: 'right' }}>
                {cfg[s.key] ?? s.min}
              </span>
            </div>
            <input type="range" min={s.min} max={s.max} step={s.step} value={cfg[s.key] ?? s.min}
              onChange={e => setCfgKey(s.key, parseFloat(e.target.value))}
              style={{ width: '100%', accentColor: '#2D72D2', cursor: 'pointer', height: 3 }} />
          </div>
        ))}

        {/* Buttons */}
        <div style={{ display: 'flex', gap: 6, marginTop: 12 }}>
          <button onClick={handleReset} style={{ ...btnBase, flex: 1 }}>Reset</button>
          <button onClick={shuffle} style={{
            ...btnBase, flex: 1,
            background: shuffled ? 'rgba(150,80,210,0.25)' : 'rgba(255,255,255,0.05)',
            border: shuffled ? '1px solid rgba(150,80,210,0.5)' : '1px solid rgba(255,255,255,0.08)',
            color: shuffled ? '#c084fc' : 'rgba(255,255,255,0.45)',
            transition: 'all 0.2s',
          }}>Shuffle</button>
          <button onClick={handleCopy} style={{
            ...btnBase, flex: 1,
            background: copied ? 'rgba(45,114,210,0.3)' : 'rgba(45,114,210,0.12)',
            border: '1px solid rgba(45,114,210,0.35)', color: '#5b9cf6', transition: 'background 0.2s',
          }}>
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
      </div>
    </div>
  );
}
