'use client';
import { useState, useRef, useEffect } from 'react';

const C = {
  cream:     '#F5F0E8',
  cream2:    '#EDE8DC',
  white:     '#FFFFFF',
  dark:      '#1C1A17',
  dark2:     '#2E2B27',
  green:     '#2A5A24',
  greenSoft: 'rgba(42,90,36,0.08)',
  ember:     '#C43C0A',
  emberSoft: 'rgba(196,60,10,0.07)',
  sand:      '#7A7268',
  sand2:     '#A89F96',
  border:    'rgba(28,26,23,0.10)',
  borderMid: 'rgba(28,26,23,0.16)',
};

const BEEF = [
  {
    name: 'The Classic',
    desc: 'Grass-fed patty · Aged cheddar · Crisp leaf lettuce · Vine tomato · Pure sauce · Brioche bun',
    price: '$8.99',
    note: 'Our original.',
  },
  {
    name: 'The Double',
    desc: 'Two grass-fed patties · Double aged cheddar · Caramelized onion · Dill pickle · Brioche bun',
    price: '$11.99',
    note: 'More of a good thing.',
  },
  {
    name: 'The Smash',
    desc: 'Smash-style grass-fed patty · American cheese · Dill pickle · Whole grain mustard · Sesame bun',
    price: '$9.49',
    note: 'Crispy edges, juicy center.',
  },
];

const CHICKEN = [
  {
    name: 'The Crispy',
    desc: 'Free-range chicken thigh · House slaw · Dill pickle · Hot honey aioli · Brioche bun',
    price: '$10.49',
    note: 'Crunchy. Always.',
  },
  {
    name: 'The Grilled',
    desc: 'Free-range grilled breast · Avocado · Baby arugula · Lemon herb aioli · Vine tomato · Brioche bun',
    price: '$10.99',
    note: 'Light and clean.',
  },
];

const SIDES = [
  { name: 'Pure Fries', desc: 'Russet potatoes · Sunflower oil · Sea salt', price: '$3.49' },
  { name: 'House Slaw', desc: 'Green cabbage · Lemon · Apple cider vinegar · No mayo', price: '$2.99' },
  { name: 'Lemonade', desc: 'Fresh-squeezed · Filtered water · Cane sugar', price: '$2.49' },
];

const PROMISES = [
  { label: 'Grass-fed beef', sub: 'Pasture-raised, no hormones' },
  { label: 'Free-range chicken', sub: 'Antibiotic-free' },
  { label: 'No artificial anything', sub: 'Flavors, colors, preservatives' },
  { label: 'Baked fresh daily', sub: 'Brioche delivered every morning' },
  { label: '< 12 ingredients', sub: 'Per item, on average' },
];

function MenuCard({ item, accent }: { item: typeof BEEF[0]; accent: string }) {
  const [hov, setHov] = useState(false);
  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        padding: '32px 0',
        borderBottom: `1px solid ${C.border}`,
        transition: 'background 0.18s ease',
        cursor: 'default',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 24 }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 8 }}>
            <span style={{
              fontFamily: 'var(--serif)', fontSize: 22, fontWeight: 400,
              letterSpacing: '-0.01em', color: C.dark,
              transition: 'color 0.18s',
              ...(hov ? { color: accent } : {}),
            }}>{item.name}</span>
            <span style={{
              fontSize: 11, fontFamily: 'var(--sans)', fontWeight: 400,
              color: C.sand2, fontStyle: 'italic', letterSpacing: '0.01em',
            }}>{item.note}</span>
          </div>
          <p style={{
            margin: 0, fontSize: 13, lineHeight: 1.7, color: C.sand,
            maxWidth: 440, fontWeight: 400,
          }}>{item.desc}</p>
        </div>
        <span style={{
          fontFamily: 'var(--mono)', fontSize: 15, fontWeight: 500,
          color: C.dark, letterSpacing: '0.02em', flexShrink: 0, paddingTop: 2,
        }}>{item.price}</span>
      </div>
    </div>
  );
}

type Node = {
  baseX: number; baseY: number; x: number; y: number;
  label: string; speedX: number; speedY: number;
  offX: number; offY: number; amp: number;
  opacity: number; pulseOff: number;
};
type Spore = {
  x: number; y: number; size: number;
  speed: number; sway: number; swayOff: number;
  isGold: boolean; opacity: number;
};
type Ripple = { x: number; y: number; r: number; maxR: number; alpha: number };

export default function PureBurger() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let W = 0, H = 0;
    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      W = canvas.width; H = canvas.height;
    };
    resize();
    window.addEventListener('resize', resize);

    const LABELS = [
      'grass-fed', 'free-range', 'pasture-raised', 'cold-pressed',
      'aged cheddar', 'whole grain', 'arugula', 'avocado',
      'sea salt', 'vine tomato', 'lemon', 'dill pickle',
      'sunflower oil', 'brioche',
    ];

    // Large breathing radial blobs — soft sage green
    const blobs = Array.from({ length: 5 }, () => ({
      baseX: Math.random() * W, baseY: Math.random() * H,
      radius: 130 + Math.random() * 200,
      breathSpeed: 0.18 + Math.random() * 0.12,
      phase: Math.random() * Math.PI * 2,
      driftSpeed: 0.035 + Math.random() * 0.025,
      opacity: 0.038 + Math.random() * 0.045,
    }));

    // Tiny spores floating upward — pollen/seed feel
    const spores: Spore[] = Array.from({ length: 40 }, () => ({
      x: Math.random() * W, y: Math.random() * H,
      size: 1.2 + Math.random() * 2.2,
      speed: 0.22 + Math.random() * 0.42,
      sway: 0.25 + Math.random() * 0.45,
      swayOff: Math.random() * Math.PI * 2,
      isGold: Math.random() < 0.22,
      opacity: 0.18 + Math.random() * 0.32,
    }));

    // Ingredient label nodes
    const nodes: Node[] = LABELS.map(() => ({
      baseX: Math.random() * W, baseY: Math.random() * H,
      x: 0, y: 0,
      label: LABELS[Math.floor(Math.random() * LABELS.length)],
      speedX: 0.055 + Math.random() * 0.075,
      speedY: 0.045 + Math.random() * 0.06,
      offX: Math.random() * Math.PI * 2,
      offY: Math.random() * Math.PI * 2,
      amp: 50 + Math.random() * 55,
      opacity: 0.4 + Math.random() * 0.3,
      pulseOff: Math.random() * Math.PI * 2,
    }));
    // Assign unique labels
    LABELS.forEach((l, i) => { if (nodes[i]) nodes[i].label = l; });

    // Expanding ripple rings spawned from nodes
    const ripples: Ripple[] = [];
    let frame = 0;

    const spawnRipple = () => {
      const n = nodes[Math.floor(Math.random() * nodes.length)];
      if (n.x && ripples.length < 5) {
        ripples.push({ x: n.x, y: n.y, r: 4, maxR: 55 + Math.random() * 45, alpha: 0.14 });
      }
    };

    let t = 0, animId: number;

    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      t += 0.005;
      frame++;
      if (frame % 110 === 0) spawnRipple();

      // ── 1. Breathing blobs ──
      blobs.forEach(b => {
        const scale = 1 + 0.2 * Math.sin(t * b.breathSpeed + b.phase);
        const r = b.radius * scale;
        const x = b.baseX + Math.sin(t * b.driftSpeed + b.phase) * 65;
        const y = b.baseY + Math.cos(t * b.driftSpeed * 0.75 + b.phase) * 45;
        const g = ctx.createRadialGradient(x, y, 0, x, y, r);
        g.addColorStop(0, `rgba(50,110,40,${b.opacity * 2.2})`);
        g.addColorStop(0.45, `rgba(42,90,36,${b.opacity})`);
        g.addColorStop(1, `rgba(42,90,36,0)`);
        ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fillStyle = g; ctx.fill();
      });

      // ── 2. Floating spores ──
      spores.forEach(s => {
        s.y -= s.speed;
        s.x += Math.sin(t * s.sway + s.swayOff) * 0.45;
        if (s.y < -8) { s.y = H + 8; s.x = Math.random() * W; }
        if (s.x < -8) s.x = W + 8;
        if (s.x > W + 8) s.x = -8;

        // soft glow halo
        if (s.size > 1.8) {
          const halo = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.size * 3.5);
          const col = s.isGold ? `150,110,35` : `55,120,45`;
          halo.addColorStop(0, `rgba(${col},${s.opacity * 0.28})`);
          halo.addColorStop(1, `rgba(${col},0)`);
          ctx.beginPath(); ctx.arc(s.x, s.y, s.size * 3.5, 0, Math.PI * 2);
          ctx.fillStyle = halo; ctx.fill();
        }
        ctx.beginPath(); ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
        ctx.fillStyle = s.isGold ? `rgba(155,115,35,${s.opacity})` : `rgba(58,118,44,${s.opacity})`;
        ctx.fill();
      });

      // ── 3. Ripple rings ──
      for (let i = ripples.length - 1; i >= 0; i--) {
        const rp = ripples[i];
        rp.r += 0.55; rp.alpha *= 0.982;
        ctx.beginPath(); ctx.arc(rp.x, rp.y, rp.r, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(42,90,36,${rp.alpha})`;
        ctx.lineWidth = 1; ctx.stroke();
        if (rp.r >= rp.maxR || rp.alpha < 0.006) ripples.splice(i, 1);
      }

      // ── 4. Node positions ──
      nodes.forEach(n => {
        n.x = n.baseX + Math.sin(t * n.speedX + n.offX) * n.amp;
        n.y = n.baseY + Math.sin(t * n.speedY + n.offY) * n.amp * 0.6;
      });

      // ── 5. Node connections (green only) ──
      const DIST = 170;
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x, dy = nodes[i].y - nodes[j].y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < DIST) {
            ctx.beginPath();
            ctx.strokeStyle = `rgba(42,90,36,${(1 - d / DIST) * 0.09})`;
            ctx.lineWidth = 0.8;
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
            ctx.stroke();
          }
        }
      }

      // ── 6. Ingredient nodes ──
      nodes.forEach(n => {
        const pulse = 1 + 0.12 * Math.sin(t * 1.1 + n.pulseOff);

        // radial glow
        const grd = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, 20 * pulse);
        grd.addColorStop(0, `rgba(42,90,36,${n.opacity * 0.35})`);
        grd.addColorStop(1, `rgba(42,90,36,0)`);
        ctx.beginPath(); ctx.arc(n.x, n.y, 20 * pulse, 0, Math.PI * 2);
        ctx.fillStyle = grd; ctx.fill();

        // outer ring
        ctx.beginPath(); ctx.arc(n.x, n.y, 7 * pulse, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(42,90,36,${n.opacity * 0.28})`;
        ctx.lineWidth = 1; ctx.stroke();

        // filled core
        ctx.beginPath(); ctx.arc(n.x, n.y, 3.2 * pulse, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(42,90,36,${n.opacity})`; ctx.fill();

        // italic label
        ctx.font = `italic 10px Georgia, 'Times New Roman', serif`;
        ctx.fillStyle = `rgba(42,90,36,${n.opacity * 0.72})`;
        ctx.fillText(n.label, n.x + 11, n.y + 3.5);
      });

      animId = requestAnimationFrame(draw);
    };
    draw();

    return () => { cancelAnimationFrame(animId); window.removeEventListener('resize', resize); };
  }, []);

  return (
    <>
      <style>{`
        @keyframes pb-fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .pb-fadeup { animation: pb-fadeUp 0.6s cubic-bezier(0.22,1,0.36,1) both; }
        @keyframes pb-fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        .pb-fadein { animation: pb-fadeIn 0.5s ease both; }

        .pb-nav-link {
          text-decoration: none;
          font-family: var(--sans);
          font-size: 12px;
          font-weight: 500;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: ${C.sand};
          transition: color 0.18s;
        }
        .pb-nav-link:hover { color: ${C.dark}; }

        .pb-cta {
          display: inline-flex; align-items: center; gap: 8px;
          background: ${C.dark}; color: ${C.cream};
          border: none; border-radius: 2px;
          padding: 14px 32px; font-size: 12px; font-weight: 600;
          letter-spacing: 0.1em; text-transform: uppercase;
          cursor: pointer; transition: background 0.2s, color 0.2s;
          font-family: var(--sans); text-decoration: none;
        }
        .pb-cta:hover { background: ${C.green}; }

        .pb-cta-ghost {
          display: inline-flex; align-items: center;
          background: transparent; color: ${C.dark};
          border: 1.5px solid ${C.borderMid}; border-radius: 2px;
          padding: 13px 28px; font-size: 12px; font-weight: 500;
          letter-spacing: 0.08em; text-transform: uppercase;
          cursor: pointer; transition: border-color 0.2s, color 0.2s;
          font-family: var(--sans); text-decoration: none;
        }
        .pb-cta-ghost:hover { border-color: ${C.green}; color: ${C.green}; }

        .pb-section-label {
          font-family: var(--mono);
          font-size: 10px;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: ${C.sand2};
          margin-bottom: 6px;
        }

        .pb-promise-item:not(:last-child) {
          border-right: 1px solid ${C.border};
        }

        .pb-tab {
          font-family: var(--sans);
          font-size: 12px;
          font-weight: 500;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          padding: 10px 0;
          border: none;
          background: transparent;
          cursor: pointer;
          border-bottom: 2px solid transparent;
          transition: color 0.18s, border-color 0.18s;
          color: ${C.sand2};
        }
        .pb-tab.active {
          color: ${C.dark};
          border-bottom-color: ${C.dark};
        }
        .pb-tab:hover { color: ${C.dark}; }

        @media (max-width: 768px) {
          .pb-hero-h1 { font-size: 52px !important; }
          .pb-promises { grid-template-columns: 1fr 1fr !important; }
          .pb-promise-item { border-right: none !important; border-bottom: 1px solid ${C.border}; }
          .pb-columns { flex-direction: column !important; }
          .pb-ingredients-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      <div style={{ background: C.cream, minHeight: '100vh', color: C.dark, fontFamily: 'var(--sans)' }}>

        {/* ── Nav ── */}
        <nav style={{
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 48px', height: 64,
          borderBottom: `1px solid ${C.border}`,
          background: 'rgba(245,240,232,0.92)',
          backdropFilter: 'blur(16px)',
        }}>
          {/* Wordmark */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 28, height: 28, borderRadius: 4,
              background: C.dark, display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <div style={{
                width: 12, height: 12, borderRadius: '50%',
                border: `2px solid ${C.cream}`,
              }} />
            </div>
            <span style={{
              fontFamily: 'var(--serif)', fontWeight: 400, fontSize: 18,
              letterSpacing: '-0.01em', color: C.dark,
            }}>Pure Burger</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 36 }}>
            {[['Menu', '#menu'], ['Ingredients', '#ingredients'], ['Find Us', '#find']].map(([label, href]) => (
              <a key={href} href={href} className="pb-nav-link">{label}</a>
            ))}
          </div>

          <a href="#menu" className="pb-cta" style={{ padding: '10px 22px', fontSize: 11 }}>
            Order Now
          </a>
        </nav>

        {/* ── Hero ── */}
        <section style={{
          minHeight: '100vh',
          display: 'flex', flexDirection: 'column', justifyContent: 'center',
          padding: '120px 48px 80px',
          position: 'relative', overflow: 'hidden',
        }}>
          {/* Animated ingredient network */}
          <canvas
            ref={canvasRef}
            style={{
              position: 'absolute', inset: 0,
              width: '100%', height: '100%',
              pointerEvents: 'none',
            }}
          />

          {/* Hero content */}
          <div style={{ maxWidth: 800, position: 'relative', zIndex: 1 }}>
            <div className="pb-fadeup pb-section-label" style={{ animationDelay: '0.05s', marginBottom: 28, color: C.green }}>
              ●&ensp;Now open · 8 locations
            </div>

            <h1
              className="pb-fadeup pb-hero-h1"
              style={{
                animationDelay: '0.15s',
                fontFamily: 'var(--serif)', fontWeight: 300,
                fontSize: 'clamp(56px, 8vw, 96px)', lineHeight: 1.02,
                letterSpacing: '-0.04em', margin: '0 0 32px',
                color: C.dark,
              }}
            >
              Just the<br />
              <em style={{ color: C.green, fontStyle: 'italic' }}>good stuff.</em>
            </h1>

            <p className="pb-fadeup" style={{
              animationDelay: '0.25s',
              fontSize: 17, lineHeight: 1.7, color: C.sand,
              maxWidth: 480, margin: '0 0 48px', fontWeight: 400,
            }}>
              Beef and chicken burgers made from clean ingredients you can name.
              No shortcuts. No mystery. Just real food, done right.
            </p>

            <div className="pb-fadeup" style={{ animationDelay: '0.35s', display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <a href="#menu" className="pb-cta">See the Menu</a>
              <a href="#ingredients" className="pb-cta-ghost">Our Ingredients</a>
            </div>
          </div>

          {/* Large decorative number */}
          <div style={{
            position: 'absolute', right: 48, bottom: 48,
            fontFamily: 'var(--serif)', fontSize: '22vw', fontWeight: 300,
            color: 'rgba(28,26,23,0.04)', lineHeight: 1,
            letterSpacing: '-0.06em', userSelect: 'none', pointerEvents: 'none',
          }}>
            pure
          </div>

          {/* Scroll indicator */}
          <div style={{
            position: 'absolute', bottom: 40, left: 48,
            fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.18em',
            textTransform: 'uppercase', color: C.sand2,
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <div style={{
              width: 24, height: 1, background: C.sand2,
            }} />
            Scroll to explore
          </div>
        </section>

        {/* ── Promises strip ── */}
        <section style={{
          borderTop: `1px solid ${C.border}`,
          borderBottom: `1px solid ${C.border}`,
          background: C.white,
        }}>
          <div
            className="pb-promises"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(5, 1fr)',
            }}
          >
            {PROMISES.map((p, i) => (
              <div
                key={i}
                className="pb-promise-item"
                style={{ padding: '28px 24px' }}
              >
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: 7,
                  marginBottom: 6,
                }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: C.green, flexShrink: 0 }} />
                  <span style={{
                    fontFamily: 'var(--sans)', fontSize: 12, fontWeight: 600,
                    color: C.dark, letterSpacing: '-0.01em',
                  }}>{p.label}</span>
                </div>
                <p style={{ margin: 0, fontSize: 11.5, color: C.sand2, lineHeight: 1.5, paddingLeft: 13 }}>
                  {p.sub}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Menu ── */}
        <section id="menu" style={{ padding: '96px 48px' }}>
          <div style={{ marginBottom: 56 }}>
            <div className="pb-section-label">The Menu</div>
            <h2 style={{
              fontFamily: 'var(--serif)', fontWeight: 300,
              fontSize: 'clamp(32px, 4vw, 52px)', letterSpacing: '-0.03em',
              margin: '8px 0 0', color: C.dark, lineHeight: 1.1,
            }}>
              Beef. Chicken. That's it.
            </h2>
          </div>

          {/* Two columns */}
          <div
            className="pb-columns"
            style={{ display: 'flex', gap: 80, alignItems: 'flex-start' }}
          >
            {/* Beef */}
            <div style={{ flex: 1 }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8,
                paddingBottom: 20, borderBottom: `2px solid ${C.dark}`,
              }}>
                <span style={{
                  fontFamily: 'var(--sans)', fontSize: 11, fontWeight: 700,
                  letterSpacing: '0.14em', textTransform: 'uppercase', color: C.dark,
                }}>Beef Burgers</span>
                <span style={{
                  fontSize: 10, fontFamily: 'var(--mono)', color: C.sand2,
                  background: C.greenSoft, padding: '2px 8px',
                  border: `1px solid rgba(42,90,36,0.15)`, borderRadius: 2,
                }}>Grass-fed</span>
              </div>
              {BEEF.map((item) => (
                <MenuCard key={item.name} item={item} accent={C.green} />
              ))}
            </div>

            {/* Chicken */}
            <div style={{ flex: 1 }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8,
                paddingBottom: 20, borderBottom: `2px solid ${C.ember}`,
              }}>
                <span style={{
                  fontFamily: 'var(--sans)', fontSize: 11, fontWeight: 700,
                  letterSpacing: '0.14em', textTransform: 'uppercase', color: C.dark,
                }}>Chicken Burgers</span>
                <span style={{
                  fontSize: 10, fontFamily: 'var(--mono)', color: C.sand2,
                  background: C.emberSoft, padding: '2px 8px',
                  border: `1px solid rgba(196,60,10,0.15)`, borderRadius: 2,
                }}>Free-range</span>
              </div>
              {CHICKEN.map((item) => (
                <MenuCard key={item.name} item={item} accent={C.ember} />
              ))}
            </div>
          </div>

          {/* Sides */}
          <div style={{ marginTop: 80 }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 20, marginBottom: 32,
            }}>
              <span style={{
                fontFamily: 'var(--sans)', fontSize: 11, fontWeight: 700,
                letterSpacing: '0.14em', textTransform: 'uppercase', color: C.dark,
              }}>Sides & Drinks</span>
              <div style={{ flex: 1, height: 1, background: C.border }} />
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 1,
              border: `1px solid ${C.border}`,
              borderRadius: 4,
              overflow: 'hidden',
            }}>
              {SIDES.map((s, i) => (
                <div key={i} style={{
                  padding: '28px 24px',
                  background: C.white,
                  borderRight: i < 2 ? `1px solid ${C.border}` : 'none',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                    <span style={{ fontFamily: 'var(--serif)', fontSize: 17, fontWeight: 400, color: C.dark }}>
                      {s.name}
                    </span>
                    <span style={{ fontFamily: 'var(--mono)', fontSize: 13, color: C.dark, fontWeight: 500 }}>
                      {s.price}
                    </span>
                  </div>
                  <p style={{ margin: 0, fontSize: 12, color: C.sand2, lineHeight: 1.6 }}>{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Ingredients ── */}
        <section id="ingredients" style={{
          padding: '96px 48px',
          background: C.dark,
          color: C.cream,
        }}>
          <div style={{ maxWidth: 960, margin: '0 auto' }}>
            <div style={{
              fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.22em',
              textTransform: 'uppercase', color: 'rgba(245,240,232,0.45)', marginBottom: 28,
            }}>
              Our ingredients
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 60, flexWrap: 'wrap', marginBottom: 64 }}>
              <h2 style={{
                fontFamily: 'var(--serif)', fontWeight: 300,
                fontSize: 'clamp(32px, 4vw, 52px)', letterSpacing: '-0.03em',
                margin: 0, color: C.cream, lineHeight: 1.1, flex: '1 1 320px',
              }}>
                We know every<br />
                <em style={{ color: C.green, fontStyle: 'italic' }}>ingredient.</em>
              </h2>
              <p style={{
                flex: '1 1 280px', fontSize: 15, lineHeight: 1.8,
                color: 'rgba(245,240,232,0.55)', margin: 0, fontWeight: 300, maxWidth: 400,
              }}>
                We audit every supplier. Every item on our menu has a full ingredient chain —
                from the farm to the bun. If we can&apos;t trace it, we don&apos;t use it.
              </p>
            </div>

            <div className="pb-ingredients-grid" style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: 1,
              border: '1px solid rgba(245,240,232,0.08)',
            }}>
              {[
                {
                  heading: 'What we use',
                  items: [
                    '100% grass-fed ground beef',
                    'Free-range chicken, antibiotic-free',
                    'Aged cheddar from small dairies',
                    'Brioche baked fresh each morning',
                    'Cold-pressed sunflower oil',
                    'Whole leaf lettuces',
                    'Vine-ripened tomatoes',
                    'Heirloom dill pickles',
                    'Cane sugar (where needed)',
                    'Sea salt, black pepper',
                  ],
                  accent: C.green,
                },
                {
                  heading: "What we don't",
                  items: [
                    'No artificial flavors',
                    'No artificial colors',
                    'No preservatives',
                    'No growth hormones',
                    'No antibiotics (ever)',
                    'No high-fructose corn syrup',
                    'No hydrogenated oils',
                    'No MSG',
                    'No fillers or extenders',
                    'No ingredient you can\'t pronounce',
                  ],
                  accent: C.ember,
                },
              ].map((col, i) => (
                <div key={i} style={{
                  padding: '40px 36px',
                  borderRight: i === 0 ? '1px solid rgba(245,240,232,0.08)' : 'none',
                }}>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 10, marginBottom: 28,
                    paddingBottom: 20, borderBottom: '1px solid rgba(245,240,232,0.08)',
                  }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: col.accent }} />
                    <span style={{
                      fontFamily: 'var(--sans)', fontSize: 11, fontWeight: 700,
                      letterSpacing: '0.12em', textTransform: 'uppercase',
                      color: 'rgba(245,240,232,0.5)',
                    }}>{col.heading}</span>
                  </div>
                  <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 14 }}>
                    {col.items.map((item, j) => (
                      <li key={j} style={{
                        display: 'flex', alignItems: 'center', gap: 12,
                        fontSize: 14, color: 'rgba(245,240,232,0.75)', lineHeight: 1.4,
                      }}>
                        <span style={{
                          flexShrink: 0, width: 5, height: 5, borderRadius: '50%',
                          background: col.accent, opacity: 0.7,
                        }} />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Find Us ── */}
        <section id="find" style={{
          padding: '96px 48px',
          background: C.cream2,
          borderTop: `1px solid ${C.border}`,
        }}>
          <div style={{ maxWidth: 960, margin: '0 auto' }}>
            <div className="pb-section-label" style={{ marginBottom: 8 }}>Find Us</div>
            <h2 style={{
              fontFamily: 'var(--serif)', fontWeight: 300,
              fontSize: 'clamp(32px, 4vw, 52px)', letterSpacing: '-0.03em',
              margin: '0 0 64px', color: C.dark, lineHeight: 1.1,
            }}>
              8 locations. More coming.
            </h2>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: 1,
              border: `1px solid ${C.border}`,
              borderRadius: 4,
              overflow: 'hidden',
              background: C.border,
              marginBottom: 56,
            }}>
              {[
                ['Los Angeles', 'Silver Lake\nOpen daily 11am – 10pm'],
                ['Los Angeles', 'Venice\nOpen daily 11am – 10pm'],
                ['San Francisco', 'Hayes Valley\nOpen daily 11am – 10pm'],
                ['San Francisco', 'Mission\nOpen daily 11am – 10pm'],
                ['New York', 'Williamsburg\nOpen daily 11am – 11pm'],
                ['New York', 'West Village\nOpen daily 11am – 11pm'],
                ['Austin', 'East 6th\nOpen daily 11am – 10pm'],
                ['Chicago', 'Wicker Park\nOpen daily 11am – 10pm'],
              ].map(([city, detail], i) => (
                <div key={i} style={{
                  padding: '24px 20px',
                  background: C.white,
                }}>
                  <div style={{ fontSize: 10, fontFamily: 'var(--mono)', letterSpacing: '0.14em', textTransform: 'uppercase', color: C.sand2, marginBottom: 8 }}>
                    {city}
                  </div>
                  <div style={{ fontSize: 13, color: C.dark, lineHeight: 1.6, whiteSpace: 'pre-line' }}>
                    {detail}
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
              <a href="#menu" className="pb-cta">Order Now</a>
              <p style={{ margin: 0, fontSize: 13, color: C.sand, lineHeight: 1.6 }}>
                Online ordering available at all locations.<br />
                Catering available for groups of 10+.
              </p>
            </div>
          </div>
        </section>

        {/* ── CTA Banner ── */}
        <section style={{
          padding: '80px 48px',
          background: C.green,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          gap: 40, flexWrap: 'wrap',
        }}>
          <div>
            <div style={{
              fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.22em',
              textTransform: 'uppercase', color: 'rgba(245,240,232,0.55)', marginBottom: 16,
            }}>Opening near you</div>
            <h3 style={{
              fontFamily: 'var(--serif)', fontWeight: 300,
              fontSize: 'clamp(24px, 3vw, 40px)', letterSpacing: '-0.02em',
              margin: 0, color: C.cream, lineHeight: 1.15,
            }}>
              Bringing Pure Burger<br />to your city.
            </h3>
          </div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <a href="#" style={{
              display: 'inline-flex', alignItems: 'center',
              background: C.cream, color: C.dark,
              padding: '14px 28px', fontSize: 12, fontWeight: 600,
              letterSpacing: '0.08em', textTransform: 'uppercase',
              borderRadius: 2, textDecoration: 'none',
              transition: 'opacity 0.18s',
              fontFamily: 'var(--sans)',
            }}>
              Get Notified
            </a>
            <a href="#" style={{
              display: 'inline-flex', alignItems: 'center',
              background: 'transparent', color: C.cream,
              border: `1.5px solid rgba(245,240,232,0.35)`,
              padding: '13px 28px', fontSize: 12, fontWeight: 500,
              letterSpacing: '0.08em', textTransform: 'uppercase',
              borderRadius: 2, textDecoration: 'none',
              transition: 'border-color 0.18s',
              fontFamily: 'var(--sans)',
            }}>
              Franchise Info
            </a>
          </div>
        </section>

        {/* ── Footer ── */}
        <footer style={{
          padding: '32px 48px',
          borderTop: `1px solid ${C.border}`,
          background: C.dark,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexWrap: 'wrap', gap: 16,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 22, height: 22, borderRadius: 3,
              background: C.cream, display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <div style={{ width: 9, height: 9, borderRadius: '50%', border: `2px solid ${C.dark}` }} />
            </div>
            <span style={{
              fontFamily: 'var(--serif)', fontWeight: 400, fontSize: 15,
              letterSpacing: '-0.01em', color: C.cream,
            }}>Pure Burger</span>
          </div>
          <div style={{ display: 'flex', gap: 28 }}>
            {['Menu', 'Ingredients', 'Locations', 'Catering', 'Franchise'].map((label) => (
              <a key={label} href="#" style={{
                fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.12em',
                textTransform: 'uppercase', color: 'rgba(245,240,232,0.35)',
                textDecoration: 'none', transition: 'color 0.18s',
              }}>{label}</a>
            ))}
          </div>
          <span style={{
            fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.1em',
            color: 'rgba(245,240,232,0.25)',
          }}>
            © 2026 Pure Burger · Real ingredients only
          </span>
        </footer>

      </div>
    </>
  );
}
