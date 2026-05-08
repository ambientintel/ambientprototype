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

// ─── registry ─────────────────────────────────────────────────────────────────

const BACKGROUNDS: BgDef[] = [
  particlesBg, auroraBg, topographicBg, sparkNetworkBg,
  starfieldBg, orbitalBg, flowFieldBg, gradientMeshBg,
  matrixBg, bokehBg, plasmaBg, rippleBg, lissajousBg,
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
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const cfgRef = React.useRef<Cfg>(configs[activeId]);
  const saveTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load from localStorage once mounted
  React.useEffect(() => {
    setConfigs(Object.fromEntries(BACKGROUNDS.map(bg => [bg.id, loadCfg(bg)])));
  }, []);

  // Keep ref current for live reads inside animation loop
  cfgRef.current = configs[activeId] ?? BACKGROUNDS.find(b => b.id === activeId)!.defaults;

  // Restart renderer when active background changes
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

  const handleCopy = () => {
    const lines = Object.entries(cfg).map(([k, v]) => `  ${k}: ${v},`).join('\n');
    navigator.clipboard.writeText(`// ${activeBg.label}\nconst config = {\n${lines}\n};`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ background: '#0c0d0f', minHeight: '100vh', fontFamily: 'system-ui, sans-serif', color: '#fff' }}>

      {/* Full-viewport canvas */}
      <div style={{ position: 'fixed', inset: 0 }}>
        <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />
      </div>

      {/* Top navigation */}
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 6,
        background: 'linear-gradient(to bottom, rgba(12,13,15,0.9) 0%, rgba(12,13,15,0) 100%)',
        overflowX: 'auto', scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch',
      }}>
        <span style={{ fontSize: 9, letterSpacing: 3, textTransform: 'uppercase', color: 'rgba(255,255,255,0.25)', whiteSpace: 'nowrap', marginRight: 6, flexShrink: 0 }}>
          Bg Lab
        </span>
        {BACKGROUNDS.map(bg => (
          <button
            key={bg.id}
            onClick={() => setActiveId(bg.id)}
            style={{
              padding: '5px 13px', borderRadius: 20, cursor: 'pointer',
              background: activeId === bg.id ? 'rgba(45,114,210,0.3)' : 'rgba(255,255,255,0.05)',
              border: activeId === bg.id ? '1px solid rgba(45,114,210,0.55)' : '1px solid rgba(255,255,255,0.08)',
              color: activeId === bg.id ? '#7ab4f8' : 'rgba(255,255,255,0.4)',
              fontSize: 11, whiteSpace: 'nowrap', flexShrink: 0,
              transition: 'all 0.15s',
            }}
          >
            {bg.label}
          </button>
        ))}
      </div>

      {/* Center title */}
      <div style={{
        position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
        textAlign: 'center', zIndex: 10, pointerEvents: 'none', width: '90%', maxWidth: 520,
      }}>
        <div style={{ fontSize: 10, letterSpacing: 3, textTransform: 'uppercase', color: 'rgba(255,255,255,0.22)', marginBottom: 14 }}>
          Background Lab
        </div>
        <h1 style={{ fontSize: 'clamp(22px,4vw,52px)', fontWeight: 600, lineHeight: 1.1, margin: '0 0 12px', color: 'rgba(255,255,255,0.85)' }}>
          {activeBg.label}
        </h1>
        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.28)', margin: 0, lineHeight: 1.6 }}>
          {activeBg.description}
        </p>
      </div>

      {/* Control panel */}
      <div style={{
        position: 'fixed', bottom: 24, right: 24, zIndex: 200,
        background: 'rgba(13,15,19,0.95)',
        backdropFilter: 'blur(18px)', WebkitBackdropFilter: 'blur(18px)',
        border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: 14, padding: '16px 20px 14px', width: 260,
        boxShadow: '0 14px 48px rgba(0,0,0,0.75)',
        maxHeight: 'calc(100vh - 80px)', overflowY: 'auto',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 13 }}>
          <span style={{ fontSize: 9, letterSpacing: 2.5, textTransform: 'uppercase', color: 'rgba(255,255,255,0.25)' }}>
            Controls
          </span>
          <span style={{ fontSize: 9, letterSpacing: 1.5, textTransform: 'uppercase', color: saved ? 'rgba(80,190,100,0.8)' : 'transparent', transition: 'color 0.3s' }}>
            Saved
          </span>
        </div>

        {activeBg.sliders.map(s => (
          <div key={s.key} style={{ marginBottom: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)' }}>{s.label}</span>
              <span style={{ fontSize: 11, color: '#5b9cf6', fontVariantNumeric: 'tabular-nums', minWidth: 38, textAlign: 'right' }}>
                {cfg[s.key] ?? s.min}
              </span>
            </div>
            <input
              type="range" min={s.min} max={s.max} step={s.step}
              value={cfg[s.key] ?? s.min}
              onChange={e => setCfgKey(s.key, parseFloat(e.target.value))}
              style={{ width: '100%', accentColor: '#2D72D2', cursor: 'pointer', height: 3 }}
            />
          </div>
        ))}

        <div style={{ display: 'flex', gap: 7, marginTop: 12 }}>
          <button
            onClick={handleReset}
            style={{ flex: 1, padding: '7px 0', borderRadius: 7, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.45)', fontSize: 11, cursor: 'pointer' }}
          >
            Reset
          </button>
          <button
            onClick={handleCopy}
            style={{ flex: 2, padding: '7px 0', borderRadius: 7, background: copied ? 'rgba(45,114,210,0.3)' : 'rgba(45,114,210,0.15)', border: '1px solid rgba(45,114,210,0.35)', color: '#5b9cf6', fontSize: 11, cursor: 'pointer', transition: 'background 0.2s' }}
          >
            {copied ? 'Copied!' : 'Copy config'}
          </button>
        </div>
      </div>
    </div>
  );
}
