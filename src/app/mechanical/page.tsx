'use client';
import { useState, useEffect, useRef, Fragment } from 'react';
import Link from 'next/link';

// ── Constellation / neural-net background ─────────────────────────────────────
function ConstellationCanvas() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const el = ref.current!;
    if (!el) return;
    const ctx = el.getContext('2d')!;
    let raf: number;

    type P = { x:number; y:number; vx:number; vy:number; r:number; pulse:number; pulseSpd:number };
    let pts: P[] = [];

    function init() {
      const n = Math.max(55, Math.min(85, Math.floor(el.width * el.height / 16000)));
      pts = Array.from({ length: n }, () => ({
        x: Math.random() * el.width,
        y: Math.random() * el.height,
        vx: (Math.random() - 0.5) * 0.30,
        vy: (Math.random() - 0.5) * 0.30,
        r: Math.random() < 0.14 ? 2.6 : Math.random() * 1.1 + 0.7,
        pulse: Math.random() * Math.PI * 2,
        pulseSpd: 0.012 + Math.random() * 0.018,
      }));
    }

    function resize() { el.width = el.offsetWidth; el.height = el.offsetHeight; init(); }
    resize();
    window.addEventListener('resize', resize);

    function frame() {
      const W = el.width, H = el.height;
      ctx.clearRect(0, 0, W, H);
      const maxD = Math.min(W, H) * 0.19;

      ctx.lineWidth = 1;
      ctx.strokeStyle = 'rgba(8,12,26,0.022)';
      const gx = W / 11, gy = H / 8;
      for (let i = 1; i < 11; i++) { ctx.beginPath(); ctx.moveTo(i*gx,0); ctx.lineTo(i*gx,H); ctx.stroke(); }
      for (let j = 1; j < 8;  j++) { ctx.beginPath(); ctx.moveTo(0,j*gy); ctx.lineTo(W,j*gy); ctx.stroke(); }

      pts.forEach(p => {
        p.x = ((p.x + p.vx) + W) % W;
        p.y = ((p.y + p.vy) + H) % H;
        p.pulse += p.pulseSpd;
      });

      for (let i = 0; i < pts.length; i++) {
        for (let j = i + 1; j < pts.length; j++) {
          const dx = pts[i].x - pts[j].x, dy = pts[i].y - pts[j].y;
          const d = Math.sqrt(dx*dx + dy*dy);
          if (d < maxD) {
            const t = 1 - d / maxD;
            const act = 0.5 + 0.5 * Math.sin(pts[i].pulse) * Math.sin(pts[j].pulse);
            const alpha = t * (0.09 + act * 0.06);
            ctx.beginPath(); ctx.moveTo(pts[i].x, pts[i].y); ctx.lineTo(pts[j].x, pts[j].y);
            ctx.strokeStyle = `rgba(8,12,26,${alpha.toFixed(3)})`; ctx.lineWidth = t * 1.1; ctx.stroke();
          }
        }
      }

      pts.forEach(p => {
        const glow = 0.5 + 0.5 * Math.sin(p.pulse);
        const glowR = p.r * (3.5 + glow * 2.5);
        const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, glowR);
        grad.addColorStop(0, `rgba(8,12,26,${(0.08 + glow * 0.06).toFixed(3)})`);
        grad.addColorStop(1, 'rgba(8,12,26,0)');
        ctx.beginPath(); ctx.arc(p.x, p.y, glowR, 0, Math.PI * 2);
        ctx.fillStyle = grad; ctx.fill();
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r * (1 + glow * 0.18), 0, Math.PI * 2);
        ctx.fillStyle = `rgba(8,12,26,${(0.28 + glow * 0.14).toFixed(3)})`; ctx.fill();
      });

      raf = requestAnimationFrame(frame);
    }
    frame();
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize); };
  }, []);
  return <canvas ref={ref} style={{ position: 'fixed', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 0 }} />;
}

// ── Types ──────────────────────────────────────────────────────────────────────
type StepStatus = 'done' | 'active' | 'pending' | 'blocked' | 'warning';
interface Step { id: string; phase: string; title: string; status: StepStatus; tag: string; summary: string; sections: Section[]; }
interface Section { heading?: string; body?: string; commands?: Cmd[]; artifacts?: Artifact[]; warnings?: string[]; table?: { cols: string[]; rows: string[][] }; checklist?: string[]; }
interface Cmd { label?: string; code: string; }
interface Artifact { file: string; role: string; size?: string; }

// ── Status config ─────────────────────────────────────────────────────────────
const SC: Record<StepStatus, { label: string; bg: string; border: string; color: string; dot: string }> = {
  done:    { label: 'Complete',    bg: '#ECFDF5', border: '#A7F3D0', color: '#059669', dot: '#059669' },
  active:  { label: 'In Progress', bg: '#EFF6FF', border: '#BFDBFE', color: '#2563EB', dot: '#2563EB' },
  pending: { label: 'Pending',     bg: '#FFFBEB', border: '#FDE68A', color: '#D97706', dot: '#D97706' },
  blocked: { label: 'Blocked',     bg: '#FEF2F2', border: '#FECACA', color: '#DC2626', dot: '#DC2626' },
  warning: { label: 'Attention',   bg: '#FFF7ED', border: '#FED7AA', color: '#EA580C', dot: '#EA580C' },
};

// ── Phase config ───────────────────────────────────────────────────────────────
const PHASES = ['Setup', 'PCB', 'Enclosure', 'Assembly', 'Validation'] as const;
const PHASE_COLORS: Record<string, { text: string; bg: string; border: string }> = {
  Setup:      { text: '#15803D', bg: '#F0FDF4', border: '#A7F3D0' },
  PCB:        { text: '#1D4ED8', bg: '#EFF6FF', border: '#BFDBFE' },
  Enclosure:  { text: '#7E22CE', bg: '#FAF5FF', border: '#E9D5FF' },
  Assembly:   { text: '#C2410C', bg: '#FFF7ED', border: '#FED7AA' },
  Validation: { text: '#9D174D', bg: '#FDF2F8', border: '#FBCFE8' },
};

// ── Step data ─────────────────────────────────────────────────────────────────
const STEPS: Step[] = [
  {
    id: 'sysdef', phase: '01', title: 'System Definition', status: 'done', tag: 'Setup',
    summary: 'Physical requirements, power budget, interface definitions, and form-factor constraints for the Ambient radar node.',
    sections: [
      {
        heading: 'Platform overview',
        body: 'The Ambient node co-locates an IWR6843AOP 60 GHz radar SoC with an Octavo OSD62x-PM (AM62x-based) compute module on a single custom PCB. The board powers from 12 V DC and mounts flush to a ceiling tile via a 4-point bracket. All electromechanical interfaces are locked here before PCB layout begins.',
      },
      {
        heading: 'Power budget',
        table: {
          cols: ['Rail', 'Consumer', 'Typ (mA)', 'Max (mA)', 'Source'],
          rows: [
            ['12 V in',  'Barrel jack / PoE+',  '—',   '—',    'External PSU'],
            ['5 V',      'OSD62x-PM VIN',        '800', '1200', 'Buck TPS563201'],
            ['3.3 V',    'IWR6843AOP VDDS',      '250', '400',  'LDO TPS7A26'],
            ['1.8 V',    'IWR6843AOP VDDA_RF',   '180', '280',  'LDO TPS7A20'],
            ['3.3 V',    'eMMC, LEDs, misc',      '120', '200',  'Shared 3.3 V rail'],
          ],
        },
      },
      {
        heading: 'Interface matrix',
        table: {
          cols: ['Interface', 'From', 'To', 'Protocol', 'Notes'],
          rows: [
            ['UART debug', 'AM62x UART0',    'IWR6843AOP COM', 'UART 115200',  'Boot config + CLI'],
            ['SPI data',   'IWR6843AOP SPI', 'AM62x SPI1',     'SPI 10 MHz',   'Frame streaming'],
            ['GPIO nRST',  'AM62x GPIO',     'IWR6843AOP nRST','Active-low',   'Hard reset'],
            ['USB-C DFU',  'AM62x USB0',     'J2 USB-C',       'USB 2.0 HS',   'Firmware update'],
            ['Ethernet',   'AM62x CPSW',     'J3 RJ-45',       'GbE',          'Primary network'],
            ['uSD slot',   'AM62x SD0',      'J4 MicroSD',     'SD 3.0',       'OS media'],
          ],
        },
      },
      {
        heading: 'Mechanical constraints',
        body: 'Max PCB footprint: 100 × 80 mm. Board thickness: 1.6 mm FR-4. Ceiling clearance after enclosure: ≤ 35 mm. IP42 minimum (dust + dripping water). Operating temperature 0–55 °C, storage −20–70 °C.',
        checklist: [
          'Decision: ceiling-mount selected (not wall-mount) — IWR6843AOP elevation FOV is ±15°; ceiling position maximizes coverage angle.',
        ],
      },
    ],
  },
  {
    id: 'pcb', phase: '02', title: 'PCB Design (Altium)', status: 'active', tag: 'PCB',
    summary: 'Schematic capture, component selection, layout, DRC, and Gerber generation in Altium Designer 24. Source in ambientintel/ambientmechanical.',
    sections: [
      {
        heading: 'Repository structure',
        body: 'All Altium project files are tracked in github.com/ambientintel/ambientmechanical. The project root contains the .PrjPcb file. Symbols and footprints live in /libraries. Outputs (Gerbers, BOM, pick-and-place) are generated to /fabrication on each release.',
        commands: [
          { label: 'clone', code: 'git clone git@github.com:ambientintel/ambientmechanical.git\ncd ambientmechanical' },
          { label: 'open project', code: '# Open AmbientNode_RevA.PrjPcb in Altium Designer 24.x' },
        ],
        artifacts: [
          { file: 'AmbientNode_RevA.PrjPcb',          role: 'Altium project root' },
          { file: 'AmbientNode_RevA.SchDoc',           role: 'Top-level schematic' },
          { file: 'AmbientNode_RevA.PcbDoc',           role: 'PCB layout' },
          { file: 'libraries/AmbientSymbols.SchLib',   role: 'Custom schematic symbols' },
          { file: 'libraries/AmbientFootprints.PcbLib', role: 'Custom PCB footprints' },
        ],
      },
      {
        heading: 'Schematic sheets',
        table: {
          cols: ['Sheet', 'Content', 'Status'],
          rows: [
            ['01 — Power',    '12 V input, TPS563201 buck, TPS7A26/20 LDOs, bulk caps', 'Done'],
            ['02 — Compute',  'OSD62x-PM module, eMMC, uSD, USB-C, Ethernet PHY',       'Done'],
            ['03 — Radar',    'IWR6843AOP, UART/SPI/GPIO interface, decoupling network', 'In Progress'],
            ['04 — IO',       'RJ-45 magnetics, USB-C CC/PD controller, status LEDs',   'In Progress'],
            ['05 — Mechanical','Mounting holes, PCB keepouts, shield can outlines',      'Pending'],
          ],
        },
      },
      {
        heading: 'Layout rules',
        body: 'Stackup: 4-layer (sig / GND / PWR / sig). Controlled-impedance on SPI lines (50 Ω ±10%). IWR6843AOP RF keep-out: 5 mm from antenna array edge to any copper. 0.1 µF ceramic decoupling within 0.5 mm of every VDD pin.',
        warnings: [
          'IWR6843AOP AOP variant integrates the antenna array on-chip. Do NOT add external antenna pours — they detune the built-in array.',
          'SPI trace length match tolerance: ±0.5 mm. Use meanders on shorter traces before the IWR connector.',
        ],
      },
      {
        heading: 'DRC / ERC status',
        table: {
          cols: ['Check', 'Tool', 'Result', 'Last Run'],
          rows: [
            ['Electrical Rules Check (ERC)', 'Altium ERC',       'Pass — 0 errors',       '2026-05-05'],
            ['Design Rules Check (DRC)',      'Altium DRC',       '3 warnings (review)',    '2026-05-06'],
            ['Controlled impedance',          'Polar SI9000',     'Pending',               '—'],
            ['Thermal simulation',            'Altium PDN Analyzer', 'Pending',            '—'],
            ['3D clearance check',            'Altium 3D Bodies', 'Pending',               '—'],
          ],
        },
        warnings: [
          'DRC warnings: (1) via-in-pad on BGA — intentional, fill per IPC-7527. (2) Silkscreen over pad — cosmetic only. (3) Courtyard overlap — two connectors share keepout edge, review before fab.',
        ],
      },
    ],
  },
  {
    id: 'bom', phase: '03', title: 'Bill of Materials', status: 'active', tag: 'PCB',
    summary: 'Component sourcing, lifecycle review, and approved vendor list. BOM exported from Altium and tracked in /fabrication/BOM_RevA.xlsx.',
    sections: [
      {
        heading: 'Critical components',
        table: {
          cols: ['Component', 'MPN', 'Vendor', 'Qty', 'Lead time', 'Status'],
          rows: [
            ['IWR6843AOP',      'IWR6843AOPEVM',       'TI / Mouser',       '1', '8 wks',  'Ordered'],
            ['Octavo OSD62x-PM','OSD62x-PM-RA-CH',     'Octavo / Mouser',   '1', '6 wks',  'Ordered'],
            ['TPS563201',       'TPS563201DRLR',        'TI / DigiKey',      '2', 'Stock',  'Received'],
            ['TPS7A26',         'TPS7A2633PDBVR',       'TI / DigiKey',      '1', 'Stock',  'Received'],
            ['TPS7A20',         'TPS7A2018PDQNR',       'TI / DigiKey',      '1', '2 wks',  'Pending'],
            ['USB-C PD ctrl',   'FUSB302BMPX',          'onsemi / DigiKey',  '1', 'Stock',  'Received'],
            ['Ethernet PHY',    'KSZ8041NLI-TR',        'Microchip / Mouser','1', '4 wks',  'Sourcing'],
            ['eMMC 8 GB',       'MTFC8GAKAJCN-4M IT',  'Micron / Mouser',   '1', '6 wks',  'Sourcing'],
          ],
        },
      },
      {
        heading: 'NRND / EOL scan',
        body: 'All components verified against manufacturer lifecycle status on 2026-05-01. No end-of-life flags. TPS7A20 PDQ package is NRND in 2027 — alternative TPS7A2018QDGNRQ1 is footprint-compatible; update BOM before Rev B.',
        warnings: [
          'IWR6843AOP EVM is an evaluation module. Rev B will use the bare IWR6843AOPMR die-level package for production — verify footprint change against Altium footprint library before Rev B layout.',
        ],
      },
      {
        heading: 'BOM outputs',
        artifacts: [
          { file: 'fabrication/BOM_RevA.xlsx',        role: 'Altium-generated BOM with MPN + vendor columns' },
          { file: 'fabrication/BOM_RevA_Mouser.csv',  role: 'Mouser cart upload format' },
          { file: 'fabrication/BOM_RevA_DigiKey.csv', role: 'DigiKey cart upload format' },
        ],
      },
    ],
  },
  {
    id: 'enclosure', phase: '04', title: 'Enclosure Design', status: 'pending', tag: 'Enclosure',
    summary: 'Injection-molded ABS enclosure with ceiling-mount bracket, polycarbonate RF window, and IP42 gasket. CAD in /mechanical/enclosure.',
    sections: [
      {
        heading: 'Design intent',
        body: 'Two-part ABS enclosure: base tray (PCB + power connector) + snap-fit lid. Lid includes a flush polycarbonate window over the IWR6843AOP antenna quadrant — PC is RF-transparent at 60 GHz. Ceiling bracket is 6061-T6 aluminum, 4-point M4 screw pattern, ±15° tilt-adjustable.',
        checklist: [
          'Decision: PC window thickness 2 mm — insertion loss at 60 GHz measured at 0.3 dB, acceptable. Acrylic rejected (birefringence artifacts in 60 GHz near-field).',
          'Decision: ceiling-mount bracket uses ±15° tilt range to align radar boresight with room center after installation.',
        ],
      },
      {
        heading: 'Tolerance stack-up',
        table: {
          cols: ['Feature', 'Nominal (mm)', 'Tolerance', 'Effect if out'],
          rows: [
            ['PCB → tray wall clearance', '1.5',  '±0.3',    'PCB rattle / interference'],
            ["Lid snap-fit engagement",   '2.0',  '±0.15',   "Lid pops off / won't close"],
            ['PC window recess',          '0.5',  '±0.1',    'Window flutter at temp delta'],
            ['Bracket M4 bolt circle',    '60.0', '+0/−0.1', 'Ceiling mount misalign'],
            ['Antenna keepout to lid',    '3.0',  '±0.2',    'Pattern blockage'],
          ],
        },
        warnings: [
          'Enclosure CAD is blocked on final PCB outline — DRC must pass and board outline must be locked before SolidWorks mate constraints are finalized.',
        ],
      },
      {
        heading: 'CAD files',
        artifacts: [
          { file: 'mechanical/enclosure/AmbientNode_Enclosure.SLDASM', role: 'SolidWorks top-level assembly' },
          { file: 'mechanical/enclosure/BaseTray.SLDPRT',               role: 'Base tray body' },
          { file: 'mechanical/enclosure/Lid.SLDPRT',                    role: 'Lid with PC window cutout' },
          { file: 'mechanical/enclosure/CeilingBracket.SLDPRT',         role: '6061-T6 aluminum bracket' },
          { file: 'mechanical/enclosure/Gasket.SLDPRT',                 role: 'IP42 silicone gasket profile' },
          { file: 'mechanical/enclosure/STEP/AmbientNode_RevA.step',    role: 'STEP export for DFM review' },
        ],
      },
      {
        heading: 'Manufacturing process',
        body: 'Prototype: FDM 3D print (PETG, 0.2 mm layer) from /mechanical/enclosure/STL/. Production: ABS injection mold, 1.5 mm wall, 1.5° draft on all vertical faces. Surface finish: texture MT-11020 on exterior. Bracket: waterjet + CNC drill, anodize Class II clear.',
      },
    ],
  },
  {
    id: 'harness', phase: '05', title: 'Cable & Harness', status: 'pending', tag: 'Assembly',
    summary: 'Internal cable harness for power input, field-service USB port, and ground lug. IPC/WHMA-A-620 compliance.',
    sections: [
      {
        heading: 'Harness list',
        table: {
          cols: ['ID', 'From', 'To', 'Wire gauge', 'Length (mm)', 'Status'],
          rows: [
            ['H-001', 'J1 barrel jack',   'PCB PWR header', '22 AWG (×2)', '80', 'Pending'],
            ['H-002', 'J2 USB-C (panel)', 'PCB USB-C',      '28 AWG (×4)', '65', 'Pending'],
            ['H-003', 'Earth stud M3',    'Bracket GND lug','18 AWG (×1)', '50', 'Pending'],
          ],
        },
      },
      {
        heading: 'Connector selection',
        table: {
          cols: ['Connector', 'MPN', 'Mating', 'Notes'],
          rows: [
            ['PCB PWR 2-pin', 'Molex 22-03-2021',        'KK 254 series',   'Polarized, 3A rated'],
            ['Panel USB-C',   'CUI Devices UJ20-C-H-TH', 'Standard USB-C',  'IP67 panel mount'],
            ['Earth stud M3', 'Keystone 4699',            'M3 ring terminal','Tin-plated brass'],
          ],
        },
        checklist: [
          'All crimps performed with Molex 2002185700 hand crimp tool per Molex application spec ML-0X-00150.',
          'H-002 USB-C harness: verify CC resistor pull-down (5.1 kΩ) is present on panel connector — required for USB-C cable detection.',
        ],
      },
    ],
  },
  {
    id: 'fab', phase: '06', title: 'Fabrication & Assembly', status: 'pending', tag: 'Assembly',
    summary: 'Gerber package to PCB fab, stencil order, SMT assembly, and first-article inspection per IPC-A-610 Class 2.',
    sections: [
      {
        heading: 'Gerber output checklist',
        table: {
          cols: ['Layer', 'File', 'Status'],
          rows: [
            ['Top copper',     'AmbientNode_RevA.GTL', 'Pending'],
            ['Bottom copper',  'AmbientNode_RevA.GBL', 'Pending'],
            ['Inner 1 (GND)',  'AmbientNode_RevA.G1',  'Pending'],
            ['Inner 2 (PWR)',  'AmbientNode_RevA.G2',  'Pending'],
            ['Top silkscreen', 'AmbientNode_RevA.GTO', 'Pending'],
            ['Top soldermask', 'AmbientNode_RevA.GTS', 'Pending'],
            ['Bot soldermask', 'AmbientNode_RevA.GBS', 'Pending'],
            ['Board outline',  'AmbientNode_RevA.GKO', 'Pending'],
            ['Drill file',     'AmbientNode_RevA.XLN', 'Pending'],
          ],
        },
        commands: [{ label: 'generate in Altium', code: '# File → Fabrication Outputs → Gerber Files\n# File → Fabrication Outputs → NC Drill Files\n# Output path: /fabrication/gerbers/RevA/' }],
      },
      {
        heading: 'PCB fab vendor',
        body: 'Prototype: Advanced Circuits (4PCBPROTO), 5 panels × 3 boards. IPC Class 2. 4-layer, 1 oz outer copper, 0.5 oz inner. Green LPI soldermask, ENIG finish. Controlled-impedance lot test coupon required.',
        checklist: [
          'ENIG selected over HASL for fine-pitch BGA and RF pad flatness on IWR6843AOP.',
          'Include controlled-impedance test coupon on panel frame — required to verify 50 Ω SPI traces.',
        ],
      },
      {
        heading: 'SMT assembly',
        body: 'Stencil: stainless steel 0.12 mm, laser-cut. Paste: Kester R&D profile, SAC305. Reflow: 250 °C peak, IPC-7711/7721 profile. BGA X-ray inspection required. First-article inspection per IPC-A-610 Class 2.',
        artifacts: [
          { file: 'fabrication/gerbers/RevA/',              role: 'Gerber package for fab' },
          { file: 'fabrication/AssemblyDrawing_RevA.pdf',   role: 'SMT assembly reference drawing' },
          { file: 'fabrication/PickAndPlace_RevA.csv',       role: 'Centroid / pick-and-place file' },
        ],
      },
    ],
  },
  {
    id: 'validation', phase: '07', title: 'Validation & Testing', status: 'pending', tag: 'Validation',
    summary: 'Bring-up sequence, electrical validation, mechanical fit-check, environmental soak, and EMC pre-scan before FCC Part 15 submission.',
    sections: [
      {
        heading: 'Bring-up sequence',
        commands: [
          { label: '1 — power check (no ICs populated)', code: '# Apply 12 V. Verify:\n# - 5.0 V ± 2% on TP1\n# - 3.3 V ± 2% on TP2\n# - 1.8 V ± 2% on TP3\n# - No thermal anomaly (IR camera, 30 s soak)' },
          { label: '2 — compute bring-up', code: '# Install OSD62x-PM. Boot from uSD (pre-built image).\n# Confirm UART console at 115200:\n#   $ screen /dev/ttyUSB0 115200\n# Expect: U-Boot SPL → U-Boot → Linux login' },
          { label: '3 — radar bring-up', code: '# Install IWR6843AOP. Issue nRST via AM62x GPIO.\n# Flash mmWave SDK via DFU USB:\n#   $ uniflash --port /dev/ttyUSB1 --firmware mmwave_sdk.bin\n# Confirm SPI frames arriving on AM62x SPI1.' },
        ],
        warnings: [
          'Never apply 12 V before verifying correct polarity at J1. The reverse-polarity TVS (P6KE15CA) provides transient but NOT sustained reverse protection — a sustained reversal will destroy the board.',
        ],
      },
      {
        heading: 'Electrical validation',
        table: {
          cols: ['Test', 'Spec', 'Method', 'Status'],
          rows: [
            ['Supply ripple — 3.3 V',   '< 50 mVpp',  'Oscilloscope 20 MHz BW', 'Pending'],
            ['Supply ripple — 1.8 V',   '< 30 mVpp',  'Oscilloscope 20 MHz BW', 'Pending'],
            ['IWR SPI signal integrity', '< 200 ps jitter', 'Scope + eye diagram','Pending'],
            ['USB-C enumeration',        'HS (480 Mbps)', 'USB analyzer',         'Pending'],
            ['Ethernet link',            '1000BASE-T',  'iperf3 loopback',        'Pending'],
            ['Thermal soak 55 °C 4h',   'No shutdown', 'Thermal chamber',        'Pending'],
          ],
        },
      },
      {
        heading: 'Mechanical fit-check',
        body: 'Mount PCB into prototype enclosure (FDM PETG print). Verify: (1) all connectors align with panel cutouts within ±0.5 mm, (2) lid closes and snaps without force, (3) mounting bracket engages M4 inserts without cross-thread, (4) gasket compresses evenly under 50 N clamp force.',
      },
      {
        heading: 'EMC pre-scan',
        body: 'Pre-compliance radiated emissions scan at ETS-Lindgren (contract) before formal FCC Part 15 Class B submission. Focus bands: 60 GHz ±2 GHz (fundamental), switching regulator spurs (TPS563201 f_sw = 500 kHz). Target: 6 dB margin to FCC limits.',
        checklist: [
          'IWR6843AOP is FCC pre-certified as a module. Custom board still requires system-level Part 15 scan — the host PCB and enclosure affect radiated emissions.',
          'Schedule ETS-Lindgren scan at least 6 weeks before FCC submission deadline.',
        ],
      },
    ],
  },
];

// ── Supporting data ────────────────────────────────────────────────────────────
const HW_SPECS = [
  { label: 'PCB Footprint', value: '100 × 80 mm', sub: '4-layer FR-4, 1.6 mm, ENIG' },
  { label: 'Compute Module', value: 'OSD62x-PM', sub: 'AM62x · 1 GB DDR4 · 500-ball BGA' },
  { label: 'Radar SoC', value: 'IWR6843AOP', sub: '60 GHz · AOP antenna · ±60° FOV' },
  { label: 'Enclosure', value: 'IP42', sub: 'ABS + 6061-T6 Al bracket · ≤ 35 mm' },
  { label: 'Revision', value: 'Rev A → B', sub: 'EVT prototype · production via Rev B' },
];

const CHECKLIST_ITEMS = [
  'System definition complete',
  'Power budget approved',
  'Interface matrix signed off',
  'Schematic sheets 01–02 done',
  'ERC: 0 errors',
  'Schematic sheets 03–05 complete',
  'DRC: 0 errors, 0 warnings',
  'Controlled-impedance verified (SI9000)',
  'BOM: all critical parts received',
  'PCB outline locked for enclosure CAD',
  'Enclosure SolidWorks assembly complete',
  'FDM prototype printed + fit-checked',
  'Harness crimped + continuity checked',
  'Gerber package generated + DFM reviewed',
  'First-article boards received from fab',
  'Power-on: all rails nominal',
  'Compute bring-up: Linux boot confirmed',
  'Radar bring-up: SPI frames arriving',
  'Electrical validation pass (all 6 tests)',
  'Mechanical fit-check pass',
  'EMC pre-scan: 6 dB margin to FCC limits',
  'EVT sign-off — ready for DVT',
];
const CHECKLIST_DONE = new Set([0, 1, 2, 3, 4]);
const LS_KEY        = 'ambient-mechanical-checklist-v1';
const LS_FREEZE_KEY = 'ambient-mechanical-frozen-v1';

const OPEN_DECISIONS = [
  'PoE+ vs. barrel jack power input — PoE+ eliminates dedicated power cabling but adds PD controller cost. Decision needed before Rev B.',
  'Production radar package: IWR6843AOP EVM vs. bare IWR6843AOPMR die — affects footprint in Rev B layout.',
  'Enclosure IP rating: IP42 vs. IP54 — customer SNF sites have HVAC above ceilings; IP54 preferred but adds gasket cost.',
  'FCC certification: self-test lab vs. TCB — TCB is faster for first product; self-test feasible at volume. Timeline TBD.',
];

const TAGS = ['All', 'Setup', 'PCB', 'Enclosure', 'Assembly', 'Validation'];

// ── Pipeline strip ─────────────────────────────────────────────────────────────
function PipelineStrip({ steps, active, onSelect, designFrozen, frozenDate, ready, pct, onToggleFreeze }: { steps: Step[]; active: string; onSelect: (id: string) => void; designFrozen: boolean; frozenDate: string | null; ready: boolean; pct: number; onToggleFreeze: () => void }) {
  return (
    <div style={{ background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 12, padding: '16px 28px 18px', marginBottom: 24, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', overflowX: 'auto' }}>
      <div style={{ fontFamily: 'var(--mono)', fontSize: 9.5, textTransform: 'uppercase', letterSpacing: '0.16em', color: '#9CA3AF', marginBottom: 12 }}>Build Pipeline · EVT Rev A</div>
      <div style={{ display: 'flex', alignItems: 'center', minWidth: 560 }}>
        {PHASES.map((phase, pi) => {
          const phaseSteps = steps.filter(s => s.tag === phase);
          const pc = PHASE_COLORS[phase];
          const allDone = phaseSteps.every(s => s.status === 'done');
          const anyActive = phaseSteps.some(s => s.status === 'active');
          const lineColor = allDone ? '#059669' : anyActive ? '#2563EB' : '#E5E7EB';
          const isLast = pi === PHASES.length - 1;

          return (
            <div key={phase} style={{ display: 'flex', alignItems: 'center', flex: isLast ? 0 : 1 }}>
              {/* Phase block */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 9.5, textTransform: 'uppercase', letterSpacing: '0.12em', color: pc.text, fontWeight: 600 }}>{phase}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  {phaseSteps.map(s => {
                    const sc = SC[s.status];
                    const isActive = active === s.id;
                    return (
                      <button key={s.id} onClick={() => onSelect(s.id)} title={s.title}
                        style={{ width: 32, height: 32, borderRadius: '50%', border: isActive ? `2px solid ${sc.dot}` : `1.5px solid ${isActive ? sc.border : 'rgba(0,0,0,0.1)'}`, background: isActive ? sc.bg : '#F8FAFC', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative', transition: 'all 0.14s', boxShadow: isActive ? `0 0 0 3px ${sc.bg}` : 'none' }}>
                        <span style={{ fontFamily: 'var(--mono)', fontSize: 8.5, color: isActive ? sc.color : '#6B7280', fontWeight: 600, lineHeight: 1 }}>{s.phase}</span>
                        <span style={{ position: 'absolute', bottom: -1, right: -1, width: 8, height: 8, borderRadius: '50%', background: sc.dot, border: '1.5px solid #FFFFFF' }} />
                      </button>
                    );
                  })}
                </div>
              </div>
              {/* Connector line */}
              {!isLast && (
                <div style={{ flex: 1, height: 2, minWidth: 24, background: `linear-gradient(90deg, ${lineColor}, #E5E7EB)`, margin: '16px 8px 0', borderRadius: 2, opacity: 0.7 }} />
              )}
            </div>
          );
        })}

        {/* DVT Sign-off milestone */}
        <div style={{ display: 'flex', alignItems: 'center', marginLeft: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', marginTop: 16 }}>
            <div style={{ width: 28, height: 2, background: designFrozen || ready ? 'linear-gradient(90deg,#E5E7EB,#2563EB)' : '#E5E7EB', borderRadius: 2, opacity: 0.7 }} />
            <svg width="6" height="10" viewBox="0 0 6 10" fill="none" style={{ flexShrink: 0 }}>
              <path d="M1 1l4 4-4 4" stroke={designFrozen || ready ? '#2563EB' : '#D1D5DB'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginLeft: 12 }}>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 9.5, textTransform: 'uppercase', letterSpacing: '0.12em', color: designFrozen ? '#2563EB' : ready ? '#2563EB' : '#9CA3AF', fontWeight: 600 }}>
              {designFrozen ? 'Saved ✓' : 'Goal'}
            </div>
            <button
              onClick={onToggleFreeze}
              className={designFrozen ? 'df-frozen' : ready ? 'df-ready' : ''}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '7px 13px', borderRadius: 9,
                cursor: ready || designFrozen ? 'pointer' : 'default',
                ...(!(designFrozen || ready) && { background: '#F9FAFB', border: '1.5px dashed #D1D5DB' }),
                transition: 'all 0.25s',
              }}
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                {designFrozen || ready ? (
                  <>
                    <path d="M8 1v14M1 8h14M3.05 3.05l9.9 9.9M12.95 3.05l-9.9 9.9" stroke="#2563EB" strokeWidth="1.6" strokeLinecap="round"/>
                    <circle cx="8" cy="8" r="2.2" fill="#2563EB" fillOpacity="0.25"/>
                  </>
                ) : (
                  <>
                    <rect x="4" y="7" width="8" height="7" rx="1.5" stroke="#9CA3AF" strokeWidth="1.4"/>
                    <path d="M5.5 7V5a2.5 2.5 0 015 0v2" stroke="#9CA3AF" strokeWidth="1.4" strokeLinecap="round"/>
                  </>
                )}
              </svg>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 1, textAlign: 'left' }}>
                <span className="df-title" style={{ fontFamily: 'var(--sans)', fontSize: 11.5, fontWeight: 600, color: designFrozen ? '#2563EB' : ready ? '#1D4ED8' : '#9CA3AF', letterSpacing: '-0.01em', lineHeight: 1.2 }}>
                  {designFrozen ? 'DVT Ready ✓' : 'DVT Sign-off'}
                </span>
                <span className="df-sub" style={{ fontFamily: 'var(--mono)', fontSize: 9, color: designFrozen ? '#2563EB' : ready ? '#2563EB' : '#9CA3AF' }}>
                  {designFrozen ? (frozenDate ? `Locked ${frozenDate}` : 'EVT locked') : ready ? 'Ready — click to lock' : `${pct}% complete`}
                </span>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function MechanicalPage() {
  const [active, setActive]           = useState('sysdef');
  const [filterTag, setFilterTag]     = useState('All');
  const [collapsed, setCollapsed]     = useState<Record<string, boolean>>({});
  const [checked, setChecked]         = useState<Set<number>>(new Set(CHECKLIST_DONE));
  const [designFrozen, setDesignFrozen] = useState(false);
  const [frozenDate, setFrozenDate]     = useState<string | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(LS_KEY);
      if (stored) setChecked(new Set(JSON.parse(stored)));
      const fz = localStorage.getItem(LS_FREEZE_KEY);
      if (fz) { const p = JSON.parse(fz); setDesignFrozen(true); setFrozenDate(p.date); }
    } catch { /* ignore */ }
  }, []);

  const step = STEPS.find(s => s.id === active)!;
  const filteredSteps = filterTag === 'All' ? STEPS : STEPS.filter(s => s.tag === filterTag);
  const doneCount = checked.size;
  const ready = doneCount === CHECKLIST_ITEMS.length;
  const pct = Math.round((doneCount / CHECKLIST_ITEMS.length) * 100);

  function toggle(key: string) { setCollapsed(p => ({ ...p, [key]: !p[key] })); }

  function toggleChecked(i: number) {
    setChecked(prev => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      try { localStorage.setItem(LS_KEY, JSON.stringify([...next])); } catch { /* ignore */ }
      return next;
    });
  }

  function toggleFreeze() {
    if (!ready && !designFrozen) return;
    setDesignFrozen(f => {
      const next = !f;
      if (next) {
        const date = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        setFrozenDate(date);
        try { localStorage.setItem(LS_FREEZE_KEY, JSON.stringify({ frozen: true, date })); } catch { /* ignore */ }
      } else {
        setFrozenDate(null);
        try { localStorage.removeItem(LS_FREEZE_KEY); } catch { /* ignore */ }
      }
      return next;
    });
  }

  const S = {
    page: { background: '#F1F3F6', minHeight: '100vh', position: 'relative' as const },
    sidebar: { background: '#FFFFFF', borderRight: '1px solid rgba(0,0,0,0.08)', padding: '24px 16px 32px', position: 'sticky' as const, top: 0, height: '100vh', overflowY: 'auto' as const, display: 'flex', flexDirection: 'column' as const, gap: 0, zIndex: 10 },
    main: { padding: '28px 40px 60px', maxWidth: 1200, width: '100%', boxSizing: 'border-box' as const, position: 'relative' as const, zIndex: 1 },
  };

  return (
    <>
    <style dangerouslySetInnerHTML={{__html: `
      @keyframes dfFlow {
        0%   { background-position: 0% 50%; }
        50%  { background-position: 100% 50%; }
        100% { background-position: 0% 50%; }
      }
      @keyframes dfGlow {
        0%, 100% { box-shadow: 0 0 0 2px rgba(37,99,235,0.18), 0 2px 8px rgba(37,99,235,0.10); }
        50%       { box-shadow: 0 0 0 5px rgba(37,99,235,0.28), 0 4px 24px rgba(37,99,235,0.20); }
      }
      .df-ready {
        background: linear-gradient(-45deg, #2563EB, #1D4ED8, #1E40AF, #2563EB);
        background-size: 300% 300%;
        animation: dfFlow 3s ease infinite;
        border: 1.5px solid transparent;
      }
      .df-ready .df-title { color: #ffffff; text-shadow: 0 1px 3px rgba(0,0,0,0.18); }
      .df-ready .df-sub   { color: rgba(255,255,255,0.82); }
      .df-frozen {
        background: linear-gradient(-45deg, #1D4ED8, #2563EB, #3B82F6, #60A5FA, #2563EB, #1D4ED8);
        background-size: 300% 300%;
        animation: dfFlow 4s ease infinite, dfGlow 2.5s ease-in-out infinite;
        border: 1.5px solid transparent;
      }
      .df-frozen .df-title { color: #ffffff; text-shadow: 0 1px 3px rgba(0,0,0,0.18); }
      .df-frozen .df-sub   { color: rgba(255,255,255,0.82); }
    `}} />
    <div className="app" style={S.page}>
      <ConstellationCanvas />

      {/* ── Sidebar ── */}
      <aside style={S.sidebar}>
        <div style={{ marginBottom: 20 }}>
          <Link href="/" style={{ textDecoration: 'none' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '4px 6px', marginBottom: 12 }}>
              <div style={{ width: 28, height: 28, borderRadius: 6, background: '#EFF6FF', border: '1px solid #BFDBFE', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <rect x="1" y="1" width="12" height="12" rx="2" stroke="#2563EB" strokeWidth="1.2" fill="none"/>
                  <rect x="3" y="4" width="3" height="3" rx="0.5" fill="#2563EB" opacity="0.7"/>
                  <rect x="8" y="4" width="3" height="3" rx="0.5" fill="#2563EB" opacity="0.4"/>
                  <rect x="3" y="8.5" width="8" height="1" rx="0.5" fill="#2563EB" opacity="0.3"/>
                </svg>
              </div>
              <span style={{ fontFamily: 'var(--serif)', fontWeight: 300, fontSize: 14.5, color: '#111827', letterSpacing: '-0.01em' }}>Ambient <em style={{ fontStyle: 'italic', color: '#6B7280' }}>Mechanical</em></span>
            </div>
          </Link>

          {/* Progress */}
          <div style={{ padding: '10px 12px', background: '#F8FAFC', border: '1px solid rgba(0,0,0,0.07)', borderRadius: 10, marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 7 }}>
              <span style={{ fontFamily: 'var(--mono)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#9CA3AF' }}>EVT Progress</span>
              <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: '#059669', fontWeight: 600 }}>{doneCount}/{CHECKLIST_ITEMS.length}</span>
            </div>
            <div style={{ height: 4, borderRadius: 2, background: '#E5E7EB' }}>
              <div style={{ height: '100%', borderRadius: 2, background: 'linear-gradient(90deg, #059669, #2563EB)', width: `${pct}%`, transition: 'width 0.4s ease' }} />
            </div>
          </div>

          {/* Tag filter */}
          <div style={{ marginBottom: 10 }}>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 9.5, textTransform: 'uppercase', letterSpacing: '0.14em', color: '#9CA3AF', padding: '0 6px', marginBottom: 7 }}>Filter</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, padding: '0 2px' }}>
              {TAGS.map(tag => (
                <button key={tag} onClick={() => setFilterTag(tag)} style={{ padding: '3px 9px', borderRadius: 999, fontSize: 11, fontFamily: 'var(--mono)', cursor: 'pointer', border: filterTag === tag ? '1.5px solid #2563EB' : '1px solid #E5E7EB', background: filterTag === tag ? '#EFF6FF' : '#FFFFFF', color: filterTag === tag ? '#2563EB' : '#6B7280', transition: 'all 0.12s' }}>
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Phase-grouped nav */}
        <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 0 }}>
          {PHASES.map(phase => {
            const phaseSteps = filteredSteps.filter(s => s.tag === phase);
            if (phaseSteps.length === 0) return null;
            const pc = PHASE_COLORS[phase];
            return (
              <div key={phase} style={{ marginBottom: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px 5px', marginBottom: 3 }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: pc.text, opacity: 0.5, flexShrink: 0 }} />
                  <span style={{ fontFamily: 'var(--mono)', fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.16em', color: pc.text, fontWeight: 600 }}>{phase}</span>
                </div>
                {phaseSteps.map(s => {
                  const sc = SC[s.status];
                  const isActive = active === s.id;
                  return (
                    <button key={s.id} onClick={() => setActive(s.id)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 9, padding: '7px 10px', borderRadius: 7, background: isActive ? '#F0F7FF' : 'transparent', border: isActive ? '1px solid #BFDBFE' : '1px solid transparent', cursor: 'pointer', textAlign: 'left', transition: 'all 0.12s', marginBottom: 1 }}>
                      <span style={{ fontFamily: 'var(--mono)', fontSize: 9.5, color: isActive ? '#2563EB' : '#9CA3AF', minWidth: 16, letterSpacing: '0.04em' }}>{s.phase}</span>
                      <span style={{ flex: 1, fontSize: 12.5, color: isActive ? '#111827' : '#374151', fontWeight: isActive ? 500 : 400 }}>{s.title}</span>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: sc.dot, flexShrink: 0 }} />
                    </button>
                  );
                })}
              </div>
            );
          })}
        </nav>

        {/* Footer */}
        <div style={{ marginTop: 16, paddingTop: 14, borderTop: '1px solid rgba(0,0,0,0.07)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#2563EB' }} />
          <a href="https://github.com/ambientintel/ambientmechanical" target="_blank" rel="noopener noreferrer" style={{ fontFamily: 'var(--mono)', fontSize: 10, color: '#6B7280', textDecoration: 'none', letterSpacing: '0.04em' }}>ambientintel/ambientmechanical</a>
        </div>
      </aside>

      {/* ── Main ── */}
      <main style={S.main}>

        {/* Topbar */}
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', paddingBottom: 24, borderBottom: '1px solid rgba(0,0,0,0.08)', marginBottom: 28 }}>
          <div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.16em', color: '#9CA3AF', marginBottom: 8 }}>Ambient Intelligence · Hardware Platform</div>
            <h1 style={{ fontFamily: 'var(--serif)', fontWeight: 300, fontSize: 42, lineHeight: 1.05, letterSpacing: '-0.02em', margin: 0, color: '#111827' }}>
              IWR6843AOP <em style={{ fontStyle: 'italic', color: '#6B7280' }}>Mechanical</em>
            </h1>
            <p style={{ margin: '10px 0 0', color: '#6B7280', fontSize: 14, maxWidth: 520, lineHeight: 1.6 }}>
              PCB design, enclosure, cable harness, fabrication, and validation for the Ambient ceiling-mount radar compute node.
            </p>
          </div>
          <a href="https://github.com/ambientintel/ambientmechanical" target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '9px 16px', borderRadius: 8, border: '1px solid #E5E7EB', background: '#FFFFFF', fontSize: 12.5, fontFamily: 'var(--mono)', color: '#374151', textDecoration: 'none', flexShrink: 0, boxShadow: '0 1px 2px rgba(0,0,0,0.06)' }}>
            <svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor" style={{ opacity: 0.6 }}><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/></svg>
            ambientintel/ambientmechanical
          </a>
        </div>

        {/* Hardware spec row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, marginBottom: 24 }}>
          {HW_SPECS.map(spec => (
            <div key={spec.label} style={{ padding: '14px 16px', background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 10, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 9.5, textTransform: 'uppercase', letterSpacing: '0.14em', color: '#9CA3AF', marginBottom: 5 }}>{spec.label}</div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 12.5, color: '#111827', fontWeight: 600, marginBottom: 3 }}>{spec.value}</div>
              <div style={{ fontSize: 11.5, color: '#6B7280', lineHeight: 1.4 }}>{spec.sub}</div>
            </div>
          ))}
        </div>

        {/* Pipeline strip */}
        <PipelineStrip steps={STEPS} active={active} onSelect={setActive} designFrozen={designFrozen} frozenDate={frozenDate} ready={ready} pct={pct} onToggleFreeze={toggleFreeze} />

        {/* Two-column layout */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 272px', gap: 24, alignItems: 'start' }}>

          {/* Step detail */}
          <div>
            {/* Step header */}
            {(() => {
              const sc = SC[step.status];
              const pc = PHASE_COLORS[step.tag] || { text: '#374151', bg: '#F3F4F6', border: '#E5E7EB' };
              return (
                <div style={{ padding: '22px 26px', background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 14, marginBottom: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ fontFamily: 'var(--mono)', fontSize: 10.5, color: '#2563EB', letterSpacing: '0.1em', background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 4, padding: '3px 9px' }}>
                        STEP {step.phase}
                      </div>
                      <span style={{ padding: '3px 9px', borderRadius: 999, fontSize: 10.5, fontFamily: 'var(--mono)', background: pc.bg, color: pc.text, border: `1px solid ${pc.border}` }}>{step.tag}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 11px', borderRadius: 999, background: sc.bg, border: `1px solid ${sc.border}` }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: sc.dot }} />
                      <span style={{ fontFamily: 'var(--mono)', fontSize: 10.5, color: sc.color, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{sc.label}</span>
                    </div>
                  </div>
                  <h2 style={{ fontFamily: 'var(--serif)', fontWeight: 300, fontSize: 26, margin: '0 0 10px', color: '#111827', letterSpacing: '-0.01em' }}>{step.title}</h2>
                  <p style={{ margin: 0, color: '#4B5563', fontSize: 13.5, lineHeight: 1.6 }}>{step.summary}</p>
                </div>
              );
            })()}

            {/* Sections */}
            {step.sections.map((sec, si) => {
              const key = `${step.id}-${si}`;
              const isOpen = collapsed[key] !== true;
              return (
                <div key={key} style={{ marginBottom: 12, background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}>
                  {sec.heading && (
                    <button onClick={() => toggle(key)} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '13px 20px', background: isOpen ? '#FAFAFA' : '#FFFFFF', cursor: 'pointer', border: 0, borderBottom: isOpen ? '1px solid rgba(0,0,0,0.07)' : 'none' }}>
                      <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: '#374151', letterSpacing: '0.06em', textTransform: 'uppercase', fontWeight: 500 }}>{sec.heading}</span>
                      <span style={{ color: '#9CA3AF', fontSize: 14, transform: isOpen ? 'rotate(0deg)' : 'rotate(-90deg)', transition: 'transform 0.18s' }}>▾</span>
                    </button>
                  )}
                  {isOpen && (
                    <div style={{ padding: sec.heading ? '16px 20px 18px' : '18px 20px' }}>
                      {sec.body && <p style={{ margin: '0 0 14px', color: '#4B5563', fontSize: 13.5, lineHeight: 1.65 }}>{sec.body}</p>}

                      {sec.commands?.map((cmd, ci) => (
                        <div key={ci} style={{ marginBottom: 12 }}>
                          {cmd.label && <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: '#9CA3AF', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 5 }}>$ {cmd.label}</div>}
                          <div style={{ background: '#1E2433', border: '1px solid rgba(0,0,0,0.12)', borderRadius: 8, padding: '14px 18px' }}>
                            <pre style={{ margin: 0, fontFamily: 'var(--mono)', fontSize: 12.5, color: '#CBD5E1', lineHeight: 1.75, overflowX: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-all' as const }}>{cmd.code}</pre>
                          </div>
                        </div>
                      ))}

                      {sec.artifacts && sec.artifacts.length > 0 && (
                        <div style={{ marginTop: 14 }}>
                          <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: '#9CA3AF', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 8 }}>Artifacts</div>
                          {sec.artifacts.map((a, ai) => (
                            <div key={ai} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '10px 14px', background: '#F0F7FF', border: '1px solid #BFDBFE', borderRadius: 8, marginBottom: 7 }}>
                              <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: '#2563EB', flexShrink: 0, marginTop: 2 }}>▸</span>
                              <div style={{ flex: 1 }}>
                                <div style={{ fontFamily: 'var(--mono)', fontSize: 11.5, color: '#1D4ED8', marginBottom: 3 }}>{a.file}</div>
                                <div style={{ fontSize: 12.5, color: '#4B5563', lineHeight: 1.5 }}>{a.role}</div>
                              </div>
                              {a.size && <span style={{ fontFamily: 'var(--mono)', fontSize: 10.5, color: '#9CA3AF', flexShrink: 0 }}>{a.size}</span>}
                            </div>
                          ))}
                        </div>
                      )}

                      {sec.table && (
                        <div style={{ marginTop: 14, overflowX: 'auto', borderRadius: 8, border: '1px solid rgba(0,0,0,0.08)' }}>
                          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                            <thead>
                              <tr style={{ background: '#F8FAFC' }}>
                                {sec.table.cols.map((col, ci) => (
                                  <th key={ci} style={{ fontFamily: 'var(--mono)', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#6B7280', padding: '10px 14px', textAlign: 'left', borderBottom: '1px solid rgba(0,0,0,0.08)' }}>{col}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {sec.table.rows.map((row, ri) => (
                                <tr key={ri} style={{ borderBottom: ri < sec.table!.rows.length - 1 ? '1px solid rgba(0,0,0,0.05)' : 'none' }}>
                                  {row.map((cell, ci) => (
                                    <td key={ci} style={{ padding: '10px 14px', color: ci === 0 ? '#1E293B' : '#4B5563', fontFamily: ci === 0 ? 'var(--mono)' : 'inherit', fontSize: ci === 0 ? 12 : 13, lineHeight: 1.5, verticalAlign: 'top' }}>{cell}</td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}

                      {sec.checklist && (
                        <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
                          {sec.checklist.map((item, ii) => (
                            <div key={ii} style={{ display: 'flex', gap: 10, padding: '9px 13px', background: '#F8FAFC', border: '1px solid rgba(0,0,0,0.07)', borderRadius: 7 }}>
                              <span style={{ color: '#2563EB', fontSize: 13, flexShrink: 0, marginTop: 1 }}>◆</span>
                              <span style={{ fontSize: 13, color: '#374151', lineHeight: 1.55 }}>{item}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {sec.warnings?.map((w, wi) => (
                        <div key={wi} style={{ display: 'flex', gap: 11, padding: '10px 14px', background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 8, marginTop: 10 }}>
                          <span style={{ color: '#D97706', fontSize: 13, flexShrink: 0, marginTop: 1 }}>⚠</span>
                          <p style={{ margin: 0, fontSize: 13, color: '#78350F', lineHeight: 1.6 }}>{w}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Prev / Next */}
            {(() => {
              const idx = STEPS.findIndex(s => s.id === active);
              const prev = idx > 0 ? STEPS[idx - 1] : null;
              const next = idx < STEPS.length - 1 ? STEPS[idx + 1] : null;
              return (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 24, paddingTop: 18, borderTop: '1px solid rgba(0,0,0,0.08)' }}>
                  {prev
                    ? <button onClick={() => setActive(prev.id)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', border: '1px solid #E5E7EB', borderRadius: 8, background: '#FFFFFF', color: '#374151', fontSize: 13, cursor: 'pointer', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                        ← <span style={{ fontFamily: 'var(--mono)', fontSize: 9.5, color: '#9CA3AF' }}>{prev.phase}</span> {prev.title}
                      </button>
                    : <div />}
                  {next
                    ? <button onClick={() => setActive(next.id)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', border: '1px solid #E5E7EB', borderRadius: 8, background: '#FFFFFF', color: '#374151', fontSize: 13, cursor: 'pointer', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                        {next.title} <span style={{ fontFamily: 'var(--mono)', fontSize: 9.5, color: '#9CA3AF' }}>{next.phase}</span> →
                      </button>
                    : <div />}
                </div>
              );
            })()}
          </div>

          {/* Right panel */}
          <div style={{ position: 'sticky', top: 24 }}>
            {/* EVT checklist */}
            <div style={{ padding: '18px 18px 16px', background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 14, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.14em', color: '#9CA3AF' }}>EVT Checklist</div>
                <button onClick={() => { setChecked(new Set(CHECKLIST_DONE)); try { localStorage.setItem(LS_KEY, JSON.stringify([...CHECKLIST_DONE])); } catch { /* ignore */ } }} style={{ fontFamily: 'var(--mono)', fontSize: 9.5, color: '#9CA3AF', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>reset</button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {CHECKLIST_ITEMS.map((text, i) => {
                  const done = checked.has(i);
                  return (
                    <button key={i} onClick={() => toggleChecked(i)} style={{ display: 'flex', alignItems: 'flex-start', gap: 9, background: 'none', border: 'none', cursor: 'pointer', padding: 0, textAlign: 'left' }}>
                      <div style={{ width: 15, height: 15, borderRadius: 3, border: done ? 'none' : '1.5px solid #D1D5DB', background: done ? '#059669' : 'transparent', flexShrink: 0, marginTop: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' }}>
                        {done && <svg width="9" height="7" viewBox="0 0 9 7" fill="none"><path d="M1 3.5L3 5.5L8 1" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                      </div>
                      <span style={{ fontSize: 11.5, color: done ? '#374151' : '#9CA3AF', lineHeight: 1.45, textDecoration: done ? 'line-through' : 'none', textDecorationColor: '#D1D5DB' }}>{text}</span>
                    </button>
                  );
                })}
              </div>
              <div style={{ marginTop: 16, paddingTop: 12, borderTop: '1px solid rgba(0,0,0,0.07)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.12em' }}>Complete</span>
                  <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: '#059669', fontWeight: 600 }}>{pct}%</span>
                </div>
                <div style={{ height: 4, borderRadius: 2, background: '#E5E7EB' }}>
                  <div style={{ height: '100%', borderRadius: 2, background: 'linear-gradient(90deg, #059669, #2563EB)', width: `${pct}%`, transition: 'width 0.3s ease' }} />
                </div>
              </div>
            </div>

            {/* Open decisions */}
            <div style={{ padding: '16px 18px', background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 14 }}>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.14em', color: '#D97706', marginBottom: 12 }}>Open Decisions</div>
              {OPEN_DECISIONS.map((d, i) => (
                <div key={i} style={{ display: 'flex', gap: 9, marginBottom: 9 }}>
                  <span style={{ fontFamily: 'var(--mono)', fontSize: 9.5, color: '#D97706', opacity: 0.7, flexShrink: 0, marginTop: 2 }}>{i + 1}</span>
                  <span style={{ fontSize: 12, color: '#78350F', lineHeight: 1.5 }}>{d}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
    </>
  );
}
