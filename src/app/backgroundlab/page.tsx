'use client';
import React from 'react';

interface Config {
  count:          number;
  speed:          number;
  glowRadius:     number;
  connectDist:    number;
  connectOpacity: number;
  brightness:     number;
  pulseSpeed:     number;
  vignetteStr:    number;
}

const DEFAULT: Config = {
  count:          72,
  speed:          0.18,
  glowRadius:     5,
  connectDist:    110,
  connectOpacity: 0.07,
  brightness:     0.45,
  pulseSpeed:     0.008,
  vignetteStr:    0.72,
};

const SLIDERS: { key: keyof Config; label: string; min: number; max: number; step: number }[] = [
  { key: 'count',          label: 'Particles',        min: 10,  max: 300,  step: 1     },
  { key: 'speed',          label: 'Speed',            min: 0.01,max: 2.0,  step: 0.01  },
  { key: 'glowRadius',     label: 'Glow radius',      min: 1,   max: 14,   step: 0.5   },
  { key: 'connectDist',    label: 'Connect distance', min: 0,   max: 300,  step: 5     },
  { key: 'connectOpacity', label: 'Connect opacity',  min: 0,   max: 0.5,  step: 0.01  },
  { key: 'brightness',     label: 'Brightness',       min: 0.05,max: 1.0,  step: 0.01  },
  { key: 'pulseSpeed',     label: 'Pulse speed',      min: 0,   max: 0.06, step: 0.001 },
  { key: 'vignetteStr',    label: 'Text darkening',   min: 0,   max: 1.0,  step: 0.01  },
];

export default function Landing2() {
  const [cfg, setCfg] = React.useState<Config>(DEFAULT);
  const cfgRef = React.useRef(cfg);
  cfgRef.current = cfg;

  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const [copied, setCopied] = React.useState(false);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    interface Particle {
      x: number; y: number; vx: number; vy: number;
      r: number; baseAlpha: number; layer: number;
      pulse: number; pulseSpeed: number;
    }

    let particles: Particle[] = [];
    let lastCount = -1;

    const resize = () => {
      canvas.width  = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };

    const init = (n: number) => {
      particles = Array.from({ length: n }, () => {
        const layer = Math.random();
        const angle = Math.random() * Math.PI * 2;
        return {
          x:          Math.random() * canvas.width,
          y:          Math.random() * canvas.height,
          vx:         Math.cos(angle),
          vy:         Math.sin(angle),
          r:          0.6 + layer * 1.8,
          baseAlpha:  0.15 + layer * 0.45,
          layer,
          pulse:      Math.random() * Math.PI * 2,
          pulseSpeed: 0.004 + Math.random() * 0.012,
        };
      });
      lastCount = n;
    };

    const draw = () => {
      const c  = cfgRef.current;
      const cw = canvas.width, ch = canvas.height;

      if (c.count !== lastCount) init(c.count);

      ctx.clearRect(0, 0, cw, ch);

      // Connections
      const N = particles.length;
      for (let i = 0; i < N; i++) {
        for (let j = i + 1; j < N; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const d  = Math.sqrt(dx * dx + dy * dy);
          if (d < c.connectDist) {
            const depth = (particles[i].layer + particles[j].layer) / 2;
            const al    = (1 - d / c.connectDist) * c.connectOpacity * depth;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(100,150,255,${al})`;
            ctx.lineWidth   = 0.4;
            ctx.stroke();
          }
        }
      }

      // Orbs
      particles.forEach(p => {
        p.pulse     += c.pulseSpeed;
        const pf     = 0.85 + 0.15 * Math.sin(p.pulse);
        const r      = p.r * pf;
        const al     = p.baseAlpha * pf * (c.brightness / 0.45);
        const gs     = r * c.glowRadius;

        const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, gs);
        g.addColorStop(0,    `rgba(110,165,255,${al * 0.55})`);
        g.addColorStop(0.45, `rgba(80,130,220,${al * 0.15})`);
        g.addColorStop(1,    'rgba(0,0,0,0)');
        ctx.beginPath();
        ctx.arc(p.x, p.y, gs, 0, Math.PI * 2);
        ctx.fillStyle = g;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(190,215,255,${al})`;
        ctx.fill();

        p.x += p.vx * c.speed;
        p.y += p.vy * c.speed;
        if (p.x < -10)      p.x = cw + 10;
        if (p.x > cw + 10)  p.x = -10;
        if (p.y < -10)      p.y = ch + 10;
        if (p.y > ch + 10)  p.y = -10;
      });

      // Vignette
      const vign = ctx.createRadialGradient(cw/2, ch*0.44, ch*0.04, cw/2, ch*0.44, ch*0.52);
      vign.addColorStop(0,   `rgba(12,13,15,${c.vignetteStr})`);
      vign.addColorStop(0.5, `rgba(12,13,15,${c.vignetteStr * 0.25})`);
      vign.addColorStop(1,   'rgba(12,13,15,0)');
      ctx.fillStyle = vign;
      ctx.fillRect(0, 0, cw, ch);

      animId = requestAnimationFrame(draw);
    };

    resize();
    init(DEFAULT.count);
    draw();

    const ro = new ResizeObserver(() => { resize(); });
    ro.observe(canvas);
    return () => { cancelAnimationFrame(animId); ro.disconnect(); };
  }, []);

  const handleCopy = () => {
    const lines = Object.entries(cfg)
      .map(([k, v]) => `  ${k}: ${v},`)
      .join('\n');
    navigator.clipboard.writeText(`const config = {\n${lines}\n};`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ background: '#0c0d0f', minHeight: '100vh', fontFamily: 'system-ui, sans-serif', color: '#fff' }}>

      {/* Canvas hero */}
      <div style={{ position: 'relative', height: '100vh', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }} />
        <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', maxWidth: 580, padding: '0 24px' }}>
          <div style={{ fontSize: 11, letterSpacing: 3, textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)', marginBottom: 20 }}>
            Ambient Intelligence
          </div>
          <h1 style={{ fontSize: 'clamp(28px,5vw,58px)', fontWeight: 600, lineHeight: 1.1, margin: '0 0 16px', color: '#fff' }}>
            Background Lab
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 15, lineHeight: 1.65, margin: 0 }}>
            Use the sliders to tune the particle field in real-time.<br />
            Copy your settings when happy.
          </p>
        </div>
      </div>

      {/* Fixed control panel */}
      <div style={{
        position:       'fixed',
        bottom:         24,
        right:          24,
        zIndex:         200,
        background:     'rgba(14,16,20,0.94)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        border:         '1px solid rgba(255,255,255,0.07)',
        borderRadius:   14,
        padding:        '18px 22px 16px',
        width:          268,
        boxShadow:      '0 12px 40px rgba(0,0,0,0.7)',
      }}>
        <div style={{ fontSize: 10, letterSpacing: 2.5, textTransform: 'uppercase', color: 'rgba(255,255,255,0.28)', marginBottom: 14 }}>
          Particle Controls
        </div>

        {SLIDERS.map(s => (
          <div key={s.key} style={{ marginBottom: 11 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>{s.label}</span>
              <span style={{ fontSize: 11, color: '#5b9cf6', fontVariantNumeric: 'tabular-nums', minWidth: 36, textAlign: 'right' }}>
                {cfg[s.key]}
              </span>
            </div>
            <input
              type="range"
              min={s.min} max={s.max} step={s.step}
              value={cfg[s.key]}
              onChange={e => setCfg(prev => ({ ...prev, [s.key]: parseFloat(e.target.value) }))}
              style={{ width: '100%', accentColor: '#2D72D2', cursor: 'pointer', height: 3 }}
            />
          </div>
        ))}

        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
          <button
            onClick={() => setCfg(DEFAULT)}
            style={{
              flex: 1, padding: '7px 0', borderRadius: 7,
              background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
              color: 'rgba(255,255,255,0.5)', fontSize: 11, cursor: 'pointer',
            }}
          >
            Reset
          </button>
          <button
            onClick={handleCopy}
            style={{
              flex: 2, padding: '7px 0', borderRadius: 7,
              background: copied ? 'rgba(45,114,210,0.3)' : 'rgba(45,114,210,0.15)',
              border: '1px solid rgba(45,114,210,0.35)',
              color: '#5b9cf6', fontSize: 11, cursor: 'pointer', transition: 'background 0.2s',
            }}
          >
            {copied ? 'Copied!' : 'Copy settings'}
          </button>
        </div>
      </div>
    </div>
  );
}
