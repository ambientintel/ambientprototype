'use client';
import { useState } from 'react';
import Link from 'next/link';

// ── Types ──────────────────────────────────────────────────────────────────────
type PhaseStatus = 'done' | 'active' | 'pending' | 'blocked' | 'review';
interface CheckItem { label: string; done: boolean; }
interface Artifact { file: string; role: string; repo?: boolean; }
interface Command { label?: string; code: string; }
interface Note { kind: 'warning' | 'info' | 'decision'; text: string; }
interface Section { heading?: string; body?: string; commands?: Command[]; artifacts?: Artifact[]; notes?: Note[]; table?: { cols: string[]; rows: string[][] }; }
interface Phase { id: string; phase: string; title: string; status: PhaseStatus; summary: string; sections: Section[]; }

// ── Status config ──────────────────────────────────────────────────────────────
const STATUS: Record<PhaseStatus, { label: string; bg: string; border: string; color: string }> = {
  done:    { label: 'Complete',    bg: 'rgba(61,204,145,0.10)',  border: 'rgba(61,204,145,0.28)',  color: '#3DCC91' },
  active:  { label: 'In Progress', bg: 'rgba(79,156,249,0.10)',  border: 'rgba(79,156,249,0.28)',  color: '#4F9CF9' },
  pending: { label: 'Pending',     bg: 'rgba(255,201,64,0.10)',  border: 'rgba(255,201,64,0.28)',  color: '#FFC940' },
  blocked: { label: 'Blocked',     bg: 'rgba(248,81,73,0.10)',   border: 'rgba(248,81,73,0.28)',   color: '#F85149' },
  review:  { label: 'In Review',   bg: 'rgba(188,140,255,0.10)', border: 'rgba(188,140,255,0.28)', color: '#BC8CFF' },
};

// ── Topographic rings (computed at module level — no useEffect needed) ─────────
const CX = 700, CY = 430;
const RINGS = Array.from({ length: 11 }, (_, i) => {
  const rx = 110 + i * 74;
  const ry =  52 + i * 37;
  const angleDeg = (i % 2 === 0 ? 1 : -1) * (6 + i * 4.5);
  const angle = (angleDeg * Math.PI) / 180;
  const opacity = Math.max(0.025, 0.13 - i * 0.011);
  const dur = 8 + i * 4.2;
  const trailDur = dur * 0.88;
  const N = 72;
  const pts = Array.from({ length: N }, (_, j) => {
    const t = (j / N) * 2 * Math.PI;
    const x = CX + rx * Math.cos(t) * Math.cos(angle) - ry * Math.sin(t) * Math.sin(angle);
    const y = CY + rx * Math.cos(t) * Math.sin(angle) + ry * Math.sin(t) * Math.cos(angle);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  const d = `M ${pts[0]} L ${pts.slice(1).join(' L ')} Z`;
  const colors = ['#4F9CF9','#4FCFDF','#4F9CF9','#7BA3F9','#4FCFDF','#4F9CF9','#6BA8F9','#4FCFDF','#4F9CF9','#4FCFDF','#7BA3F9'];
  return { id: `r${i}`, d, opacity, dur, trailDur, color: colors[i], sparkR: Math.max(1.8, 3.6 - i * 0.18) };
});

// ── Phase data ─────────────────────────────────────────────────────────────────
const PHASES: Phase[] = [
  {
    id: 'sysdef', phase: '01', title: 'System Definition', status: 'done',
    summary: 'Physical requirements, power budget, interface definitions, and form-factor constraints for the Ambient radar node.',
    sections: [
      { heading: 'Platform overview', body: 'The Ambient node co-locates an IWR6843AOP 60 GHz radar SoC with an Octavo OSD62x-PM (AM62x-based) compute module on a single custom PCB. The board powers from 12 V DC and mounts flush to a ceiling tile via a 4-point bracket. All electromechanical interfaces are defined here before PCB layout begins.' },
      { heading: 'Power budget', table: { cols: ['Rail','Consumer','Typ (mA)','Max (mA)','Source'], rows: [['12 V in','Barrel jack / PoE+','—','—','External PSU'],['5 V','OSD62x-PM VIN','800','1200','Buck TPS563201'],['3.3 V','IWR6843AOP VDDS','250','400','LDO TPS7A26'],['1.8 V','IWR6843AOP VDDA_RF','180','280','LDO TPS7A20'],['3.3 V','eMMC, LEDs, misc','120','200','Shared 3.3 V rail']] } },
      { heading: 'Interface matrix', table: { cols: ['Interface','From','To','Protocol','Notes'], rows: [['UART debug','AM62x UART0','IWR6843AOP COM','UART 115200','Boot config + CLI'],['SPI data','IWR6843AOP SPI','AM62x SPI1','SPI 10 MHz','Frame streaming'],['GPIO nRST','AM62x GPIO','IWR6843AOP nRST','Active-low','Hard reset'],['USB-C DFU','AM62x USB0','J2 USB-C','USB 2.0 HS','Firmware update'],['Ethernet','AM62x CPSW','J3 RJ-45','GbE','Primary network'],['uSD slot','AM62x SD0','J4 MicroSD','SD 3.0','OS media']] } },
      { heading: 'Mechanical constraints', body: 'Max PCB footprint: 100 × 80 mm. Board thickness: 1.6 mm FR-4. Ceiling clearance after enclosure: ≤ 35 mm. IP42 minimum. Operating temperature 0–55 °C, storage −20–70 °C.', notes: [{ kind: 'decision', text: 'Selected ceiling-mount to maximize radar coverage angle — IWR6843AOP elevation FOV is ±15°.' }] },
    ],
  },
  {
    id: 'pcb', phase: '02', title: 'PCB Design (Altium)', status: 'active',
    summary: 'Schematic capture, component selection, layout, DRC, and Gerber generation in Altium Designer. Source in ambientintel/ambientmechanical.',
    sections: [
      { heading: 'Repository structure', body: 'All Altium project files are tracked in github.com/ambientintel/ambientmechanical. The project root contains the .PrjPcb file. Symbols and footprints live in /libraries. Outputs are generated to /fabrication on each release.', commands: [{ label: 'clone', code: 'git clone git@github.com:ambientintel/ambientmechanical.git\ncd ambientmechanical' }], artifacts: [{ file: 'AmbientNode_RevA.PrjPcb', role: 'Altium project root', repo: true },{ file: 'AmbientNode_RevA.SchDoc', role: 'Top-level schematic', repo: true },{ file: 'AmbientNode_RevA.PcbDoc', role: 'PCB layout', repo: true },{ file: 'libraries/AmbientSymbols.SchLib', role: 'Custom schematic symbols', repo: true },{ file: 'libraries/AmbientFootprints.PcbLib', role: 'Custom PCB footprints', repo: true }] },
      { heading: 'Schematic sheets', table: { cols: ['Sheet','Content','Status'], rows: [['01 — Power','12 V input, TPS563201 buck, TPS7A26/20 LDOs, bulk caps','Done'],['02 — Compute','OSD62x-PM module, eMMC, uSD, USB-C, Ethernet PHY','Done'],['03 — Radar','IWR6843AOP, UART/SPI/GPIO interface, decoupling network','In Progress'],['04 — IO & Comms','RJ-45 magnetics, USB-C CC/PD controller, status LEDs','In Progress'],['05 — Mechanical','Mounting holes, PCB keepouts, shield can outlines','Pending']] } },
      { heading: 'Layout rules', body: 'Stackup: 4-layer (sig / GND / PWR / sig). Controlled-impedance on SPI lines (50 Ω ±10%). IWR6843AOP RF keep-out: 5 mm from antenna array edge to any copper. 0.1 µF ceramic decoupling within 0.5 mm of every VDD pin.', notes: [{ kind: 'warning', text: 'IWR6843AOP AOP variant integrates the antenna array on-chip — do NOT add external antenna pours.' },{ kind: 'info', text: 'SPI trace length match tolerance: ±0.5 mm. Use meanders on shorter traces before the IWR connector.' }] },
      { heading: 'DRC / ERC status', table: { cols: ['Check','Tool','Status','Last Run'], rows: [['Electrical Rules Check (ERC)','Altium ERC','Pass — 0 errors','2026-05-05'],['Design Rules Check (DRC)','Altium DRC','3 warnings (review)','2026-05-06'],['Controlled impedance','Polar SI9000','Pending','—'],['Thermal simulation','Altium PDN Analyzer','Pending','—'],['3D clearance check','Altium 3D Bodies','Pending','—']] }, notes: [{ kind: 'warning', text: 'DRC warnings: (1) via-in-pad on BGA — intentional per IPC-7527. (2) Silkscreen over pad — cosmetic. (3) Courtyard overlap — review before fab.' }] },
    ],
  },
  {
    id: 'bom', phase: '03', title: 'Bill of Materials', status: 'active',
    summary: 'Component sourcing, lifecycle review, and approved vendor list. BOM exported from Altium and tracked in /fabrication/BOM_RevA.xlsx.',
    sections: [
      { heading: 'Critical components', table: { cols: ['Component','MPN','Vendor','Qty','Lead time','Status'], rows: [['IWR6843AOP','IWR6843AOPEVM','TI / Mouser','1','8 wks','Ordered'],['Octavo OSD62x-PM','OSD62x-PM-RA-CH','Octavo / Mouser','1','6 wks','Ordered'],['TPS563201','TPS563201DRLR','TI / DigiKey','2','Stock','Received'],['TPS7A26','TPS7A2633PDBVR','TI / DigiKey','1','Stock','Received'],['TPS7A20','TPS7A2018PDQNR','TI / DigiKey','1','2 wks','Pending'],['USB-C PD ctrl','FUSB302BMPX','onsemi / DigiKey','1','Stock','Received'],['Ethernet PHY','KSZ8041NLI-TR','Microchip / Mouser','1','4 wks','Sourcing'],['eMMC 8 GB','MTFC8GAKAJCN-4M IT','Micron / Mouser','1','6 wks','Sourcing']] } },
      { heading: 'NRND / EOL scan', body: 'All components verified against manufacturer lifecycle status on 2026-05-01. No end-of-life flags. TPS7A20 PDQ package is NRND in 2027 — alternative TPS7A2018QDGNRQ1 is footprint-compatible; update BOM before Rev B.', notes: [{ kind: 'warning', text: 'IWR6843AOP EVM is an evaluation module. Rev B will use the bare IWR6843AOPMR die-level package for production — verify footprint change.' }] },
      { heading: 'BOM outputs', artifacts: [{ file: 'fabrication/BOM_RevA.xlsx', role: 'Altium-generated BOM with MPN + vendor columns', repo: true },{ file: 'fabrication/BOM_RevA_Mouser.csv', role: 'Mouser cart upload format', repo: true },{ file: 'fabrication/BOM_RevA_DigiKey.csv', role: 'DigiKey cart upload format', repo: true }] },
    ],
  },
  {
    id: 'enclosure', phase: '04', title: 'Enclosure Design', status: 'pending',
    summary: 'Injection-molded ABS enclosure with ceiling-mount bracket, antenna window, and IP42 gasket. CAD in /mechanical/enclosure.',
    sections: [
      { heading: 'Design intent', body: 'Two-part ABS enclosure: base tray + snap-fit lid. Lid includes a flush polycarbonate window over the IWR6843AOP antenna quadrant — PC is RF-transparent at 60 GHz. Ceiling bracket is 6061-T6 aluminum, 4-point M4 screw pattern, ±15° tilt-adjustable.', notes: [{ kind: 'decision', text: 'PC window thickness: 2 mm. RF insertion loss at 60 GHz measured at 0.3 dB — acceptable. Acrylic rejected (birefringence at 60 GHz near-field).' }] },
      { heading: 'Tolerance stack-up', table: { cols: ['Feature','Nominal (mm)','Tolerance','Effect if out'], rows: [['PCB → tray wall clearance','1.5','±0.3','PCB rattle / interference'],['Lid snap-fit engagement','2.0','±0.15',"Lid pops off / won't close"],['PC window recess','0.5','±0.1','Window flutter at temp delta'],['Bracket M4 bolt circle','60.0','+0/−0.1','Ceiling mount misalign'],['Antenna keepout to lid','3.0','±0.2','Pattern blockage']] } },
      { heading: 'CAD files', artifacts: [{ file: 'mechanical/enclosure/AmbientNode_Enclosure.SLDASM', role: 'SolidWorks top-level assembly', repo: true },{ file: 'mechanical/enclosure/BaseTray.SLDPRT', role: 'Base tray body', repo: true },{ file: 'mechanical/enclosure/Lid.SLDPRT', role: 'Lid with PC window cutout', repo: true },{ file: 'mechanical/enclosure/CeilingBracket.SLDPRT', role: 'Aluminum bracket', repo: true },{ file: 'mechanical/enclosure/STEP/AmbientNode_RevA.step', role: 'STEP export for DFM review', repo: true }] },
      { heading: 'Manufacturing process', body: 'Prototype: FDM 3D print (PETG, 0.2 mm layer) from /mechanical/enclosure/STL/. Production: ABS injection mold, 1.5 mm wall, 1.5° draft. Surface finish: texture MT-11020 on exterior. Bracket: waterjet + CNC drill, anodize Class II clear.', notes: [{ kind: 'warning', text: 'Enclosure CAD is blocked on final PCB outline — DRC must complete before SolidWorks mate constraints are finalized.' }] },
    ],
  },
  {
    id: 'harness', phase: '05', title: 'Cable & Harness', status: 'pending',
    summary: 'Internal cable harness for power input, field-service USB port, and ground lug. IPC/WHMA-A-620 compliance.',
    sections: [
      { heading: 'Harness list', table: { cols: ['ID','From','To','Wire gauge','Length (mm)','Status'], rows: [['H-001','J1 barrel jack','PCB PWR header','22 AWG (×2)','80','Pending'],['H-002','J2 USB-C (panel)','PCB USB-C','28 AWG (×4)','65','Pending'],['H-003','Earth stud M3','Bracket GND lug','18 AWG (×1)','50','Pending']] } },
      { heading: 'Connector selection', table: { cols: ['Connector','MPN','Mating','Notes'], rows: [['PCB PWR 2-pin','Molex 22-03-2021','KK 254 series','Polarized, 3A rated'],['Panel USB-C','CUI Devices UJ20-C-H-TH','Standard USB-C','IP67 panel mount'],['Earth stud M3','Keystone 4699','M3 ring terminal','Tin-plated brass']] }, notes: [{ kind: 'info', text: 'All crimps performed with Molex 2002185700 hand crimp tool per Molex application spec ML-0X-00150.' }] },
    ],
  },
  {
    id: 'fab', phase: '06', title: 'Fabrication & Assembly', status: 'pending',
    summary: 'Gerber package to PCB fab, stencil order, SMT assembly, and first-article inspection.',
    sections: [
      { heading: 'Gerber output checklist', table: { cols: ['Layer','File','Status'], rows: [['Top copper','AmbientNode_RevA.GTL','Pending'],['Bottom copper','AmbientNode_RevA.GBL','Pending'],['Inner 1 (GND)','AmbientNode_RevA.G1','Pending'],['Inner 2 (PWR)','AmbientNode_RevA.G2','Pending'],['Top silkscreen','AmbientNode_RevA.GTO','Pending'],['Top soldermask','AmbientNode_RevA.GTS','Pending'],['Bot soldermask','AmbientNode_RevA.GBS','Pending'],['Board outline','AmbientNode_RevA.GKO','Pending'],['Drill file','AmbientNode_RevA.XLN','Pending']] }, commands: [{ label: 'generate in Altium', code: '# File → Fabrication Outputs → Gerber Files\n# File → Fabrication Outputs → NC Drill Files\n# Output path: /fabrication/gerbers/RevA/' }] },
      { heading: 'SMT assembly', body: 'Stencil: stainless steel 0.12 mm, laser-cut. Paste: Kester R&D profile, SAC305. Reflow: 250 °C peak, IPC-7711/7721 profile. BGA X-ray inspection required. First-article inspection per IPC-A-610 Class 2.', notes: [{ kind: 'info', text: 'ENIG finish selected over HASL for fine-pitch BGA and RF pad flatness on IWR6843AOP.' }] },
      { heading: 'Fab outputs', artifacts: [{ file: 'fabrication/gerbers/RevA/', role: 'Gerber package for fab', repo: true },{ file: 'fabrication/AssemblyDrawing_RevA.pdf', role: 'SMT assembly reference', repo: true },{ file: 'fabrication/PickAndPlace_RevA.csv', role: 'Centroid / PnP file', repo: true }] },
    ],
  },
  {
    id: 'validation', phase: '07', title: 'Validation & Testing', status: 'pending',
    summary: 'Bring-up sequence, electrical validation, mechanical fit-check, environmental test, and EMC pre-scan.',
    sections: [
      { heading: 'Bring-up sequence', commands: [{ label: '1 — power check (no ICs)', code: '# Apply 12 V. Verify:\n# - 5.0 V ± 2% on TP1\n# - 3.3 V ± 2% on TP2\n# - 1.8 V ± 2% on TP3\n# - No thermal anomaly (IR camera, 30 s soak)' },{ label: '2 — compute bring-up', code: '# Install OSD62x-PM. Boot from uSD.\n# Confirm UART console at 115200:\n#   $ screen /dev/ttyUSB0 115200\n# Expect: U-Boot SPL → U-Boot → Linux login' },{ label: '3 — radar bring-up', code: '# Install IWR6843AOP. Issue nRST via GPIO.\n# Flash mmWave SDK via DFU USB:\n#   $ uniflash --port /dev/ttyUSB1 --firmware mmwave_sdk.bin\n# Confirm SPI frames arriving on AM62x SPI1.' }], notes: [{ kind: 'warning', text: 'Never apply 12 V before verifying correct polarity at J1. The reverse-polarity TVS (P6KE15CA) provides transient but NOT sustained reverse protection.' }] },
      { heading: 'Electrical validation', table: { cols: ['Test','Spec','Method','Status'], rows: [['Supply ripple — 3.3 V','< 50 mVpp','Oscilloscope 20 MHz BW','Pending'],['Supply ripple — 1.8 V','< 30 mVpp','Oscilloscope 20 MHz BW','Pending'],['IWR6843AOP SPI integrity','< 200 ps jitter','Scope + eye diagram','Pending'],['USB-C enumeration','HS (480 Mbps)','USB analyzer','Pending'],['Ethernet link','1000BASE-T','iperf3 loopback','Pending'],['Thermal soak 55 °C 4h','No shutdown','Thermal chamber','Pending']] } },
      { heading: 'Mechanical fit-check', body: 'Mount PCB into prototype enclosure (FDM print). Verify: (1) all connectors align with panel cutouts within ±0.5 mm, (2) lid closes and snaps without force, (3) mounting bracket engages M4 inserts without cross-thread, (4) gasket compresses evenly under 50 N clamp force.' },
      { heading: 'EMC pre-scan', body: 'Pre-compliance radiated emissions scan at ETS-Lindgren (contract) before formal FCC Part 15 Class B submission. Focus bands: 60 GHz ±2 GHz (fundamental), harmonics, switching regulator spurs (TPS563201 f_sw = 500 kHz). Target: 6 dB margin to FCC limits.', notes: [{ kind: 'info', text: 'IWR6843AOP is FCC pre-certified as a module. Custom board still requires system-level Part 15 scan.' }] },
    ],
  },
];

// ── Sidebar data ───────────────────────────────────────────────────────────────
const CHECKLIST: CheckItem[] = [
  { label: 'System definition complete',         done: true  },
  { label: 'Power budget approved',               done: true  },
  { label: 'Interface matrix signed off',        done: true  },
  { label: 'Schematic sheets 01–02 done',        done: true  },
  { label: 'Schematic sheets 03–04 in progress', done: false },
  { label: 'ERC: 0 errors',                      done: true  },
  { label: 'DRC: 0 errors, 0 warnings',          done: false },
  { label: 'Controlled-impedance verified',      done: false },
  { label: 'BOM critical parts ordered',         done: false },
  { label: 'Enclosure CAD: PCB outline locked',  done: false },
  { label: 'Gerber package generated',           done: false },
  { label: 'First-article boards received',      done: false },
  { label: 'Electrical validation pass',         done: false },
  { label: 'EMC pre-scan pass',                  done: false },
];

const OPEN_DECISIONS = [
  { label: 'PoE+ vs. barrel jack',          note: 'PoE+ eliminates dedicated power cabling but adds PD controller cost. Decision needed before Rev B.' },
  { label: 'Production radar: EVM vs. die', note: 'EVM simplifies Rev A; bare IWR6843AOPMR required for production volume. Affects footprint in Rev B.' },
  { label: 'Enclosure IP: IP42 vs. IP54',   note: 'IP54 requires full gasket seal. Customer sites (SNFs) have HVAC above ceilings — IP54 preferred.' },
  { label: 'FCC: self-test vs. TCB',        note: 'TCB faster for first product; self-test lab feasible at scale. Timeline TBD.' },
];

const completedCount = CHECKLIST.filter(c => c.done).length;
const totalCount = CHECKLIST.length;

// ── Hardware block diagram (inline SVG infographic) ────────────────────────────
function HardwareDiagram() {
  return (
    <svg viewBox="0 0 960 200" style={{ width: '100%', maxWidth: 860, display: 'block', margin: '0 auto' }}>
      <defs>
        <marker id="arr" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
          <path d="M0,0 L6,3 L0,6 Z" fill="#30363D"/>
        </marker>
        <marker id="arrb" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
          <path d="M0,0 L6,3 L0,6 Z" fill="#4F9CF9" opacity="0.5"/>
        </marker>
      </defs>

      {/* POWER INPUT */}
      <rect x="20" y="74" width="110" height="52" rx="6" fill="#0D1117" stroke="#30363D" strokeWidth="1"/>
      <text x="75" y="96" textAnchor="middle" fill="#8B949E" fontSize="9" fontFamily="monospace" letterSpacing="0.06em">POWER INPUT</text>
      <text x="75" y="112" textAnchor="middle" fill="#FFC940" fontSize="13" fontFamily="system-ui" fontWeight="300">12 V DC</text>

      {/* arrow → PWR MGMT */}
      <line x1="130" y1="100" x2="188" y2="100" stroke="#30363D" strokeWidth="1" markerEnd="url(#arr)"/>

      {/* POWER MGMT */}
      <rect x="190" y="56" width="130" height="88" rx="6" fill="#0D1117" stroke="#30363D" strokeWidth="1"/>
      <text x="255" y="75" textAnchor="middle" fill="#8B949E" fontSize="9" fontFamily="monospace" letterSpacing="0.06em">PWR MANAGEMENT</text>
      <text x="255" y="92" textAnchor="middle" fill="#FFC940" fontSize="10" fontFamily="monospace">TPS563201</text>
      <text x="255" y="107" textAnchor="middle" fill="#FFC940" fontSize="10" fontFamily="monospace">TPS7A26 · TPS7A20</text>
      <text x="255" y="122" textAnchor="middle" fill="#8B949E" fontSize="9" fontFamily="monospace">5V · 3.3V · 1.8V</text>
      <text x="255" y="135" textAnchor="middle" fill="#8B949E" fontSize="8" fontFamily="monospace">2W total</text>

      {/* arrows: PWR MGMT → COMPUTE */}
      <line x1="320" y1="90" x2="368" y2="90" stroke="#FFC940" strokeWidth="1" strokeOpacity="0.4" markerEnd="url(#arr)"/>
      <line x1="320" y1="100" x2="368" y2="100" stroke="#FFC940" strokeWidth="1" strokeOpacity="0.25" markerEnd="url(#arr)"/>
      <line x1="320" y1="110" x2="368" y2="110" stroke="#FFC940" strokeWidth="1" strokeOpacity="0.15" markerEnd="url(#arr)"/>

      {/* COMPUTE */}
      <rect x="370" y="44" width="160" height="112" rx="6" fill="#0D1117" stroke="#4F9CF9" strokeWidth="1" strokeOpacity="0.5"/>
      <text x="450" y="63" textAnchor="middle" fill="#4F9CF9" fontSize="9" fontFamily="monospace" letterSpacing="0.06em" opacity="0.7">COMPUTE MODULE</text>
      <text x="450" y="80" textAnchor="middle" fill="#E6EDF3" fontSize="12" fontFamily="system-ui" fontWeight="300">OSD62x-PM</text>
      <text x="450" y="96" textAnchor="middle" fill="#8B949E" fontSize="10" fontFamily="monospace">AM62x · Cortex-A53</text>
      <text x="450" y="111" textAnchor="middle" fill="#8B949E" fontSize="10" fontFamily="monospace">eMMC 8 GB · uSD</text>
      <text x="450" y="126" textAnchor="middle" fill="#8B949E" fontSize="10" fontFamily="monospace">GbE · USB 2.0 HS</text>
      <text x="450" y="141" textAnchor="middle" fill="#4F9CF9" fontSize="8" fontFamily="monospace" opacity="0.6">100 × 80 mm PCB</text>

      {/* COMPUTE → RADAR (bidirectional SPI/UART/GPIO) */}
      <line x1="530" y1="94" x2="618" y2="94" stroke="#4FCFDF" strokeWidth="1" strokeOpacity="0.5" markerEnd="url(#arrb)"/>
      <text x="574" y="89" textAnchor="middle" fill="#4FCFDF" fontSize="8" fontFamily="monospace" opacity="0.7">SPI · UART</text>
      <text x="574" y="103" textAnchor="middle" fill="#4FCFDF" fontSize="7" fontFamily="monospace" opacity="0.5">GPIO nRST</text>

      {/* RADAR */}
      <rect x="620" y="52" width="160" height="96" rx="6" fill="#0D1117" stroke="#4FCFDF" strokeWidth="1" strokeOpacity="0.5"/>
      <text x="700" y="71" textAnchor="middle" fill="#4FCFDF" fontSize="9" fontFamily="monospace" letterSpacing="0.06em" opacity="0.7">RADAR SOC</text>
      <text x="700" y="88" textAnchor="middle" fill="#E6EDF3" fontSize="12" fontFamily="system-ui" fontWeight="300">IWR6843AOP</text>
      <text x="700" y="104" textAnchor="middle" fill="#8B949E" fontSize="10" fontFamily="monospace">60 GHz mmWave</text>
      <text x="700" y="119" textAnchor="middle" fill="#8B949E" fontSize="10" fontFamily="monospace">AOP Antenna · ±60°</text>
      <text x="700" y="134" textAnchor="middle" fill="#8B949E" fontSize="8" fontFamily="monospace">DSP + ARM R4F</text>

      {/* RADAR → CEILING (sensing up arrow) */}
      <line x1="700" y1="52" x2="700" y2="22" stroke="#4FCFDF" strokeWidth="1" strokeOpacity="0.3" strokeDasharray="3 2"/>
      <text x="700" y="17" textAnchor="middle" fill="#4FCFDF" fontSize="8" fontFamily="monospace" opacity="0.5">CEILING MOUNT</text>

      {/* COMPUTE → RJ-45 */}
      <line x1="415" y1="156" x2="415" y2="173" stroke="#30363D" strokeWidth="1" markerEnd="url(#arr)"/>

      {/* COMPUTE → USB-C */}
      <line x1="485" y1="156" x2="485" y2="173" stroke="#30363D" strokeWidth="1" markerEnd="url(#arr)"/>

      {/* RJ-45 */}
      <rect x="358" y="174" width="100" height="22" rx="4" fill="#0D1117" stroke="#30363D" strokeWidth="1"/>
      <text x="408" y="184" textAnchor="middle" fill="#8B949E" fontSize="8" fontFamily="monospace">RJ-45 · GbE</text>
      <text x="408" y="193" textAnchor="middle" fill="#8B949E" fontSize="7" fontFamily="monospace">1000BASE-T</text>

      {/* USB-C */}
      <rect x="435" y="174" width="100" height="22" rx="4" fill="#0D1117" stroke="#30363D" strokeWidth="1"/>
      <text x="485" y="184" textAnchor="middle" fill="#8B949E" fontSize="8" fontFamily="monospace">USB-C · DFU</text>
      <text x="485" y="193" textAnchor="middle" fill="#8B949E" fontSize="7" fontFamily="monospace">USB 2.0 HS</text>

      {/* ENCLOSURE outline hint */}
      <rect x="358" y="38" width="436" height="130" rx="10" fill="none" stroke="#21262D" strokeWidth="1" strokeDasharray="4 3"/>
      <text x="576" y="33" textAnchor="middle" fill="#30363D" fontSize="8" fontFamily="monospace" letterSpacing="0.06em">PCB BOUNDARY — 100 × 80 mm</text>
    </svg>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────
export default function MechanicalPage() {
  const [activePhase, setActivePhase] = useState<string>('sysdef');
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const current = PHASES.find(p => p.id === activePhase) ?? PHASES[0];
  function toggle(key: string) { setExpanded(prev => ({ ...prev, [key]: !prev[key] })); }

  return (
    <div style={{ background: '#0A0B0D', minHeight: '100vh', color: '#C9D1D9', fontFamily: 'system-ui,-apple-system,sans-serif' }}>

      {/* ── HERO ────────────────────────────────────────────────────────────── */}
      <section style={{ position: 'relative', minHeight: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* Topographic rings SVG */}
        <svg
          viewBox="0 0 1400 860"
          preserveAspectRatio="xMidYMid slice"
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
          aria-hidden
        >
          <defs>
            <filter id="bloom" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="5" result="b1"/>
              <feGaussianBlur stdDeviation="10" result="b2" in="b1"/>
              <feMerge>
                <feMergeNode in="b2"/>
                <feMergeNode in="b1"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
            <filter id="softbloom" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="3" result="b"/>
              <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
            </filter>
            <radialGradient id="vig" cx="50%" cy="50%" r="65%">
              <stop offset="0%" stopColor="transparent"/>
              <stop offset="100%" stopColor="#0A0B0D" stopOpacity="0.78"/>
            </radialGradient>
            <linearGradient id="fade-b" x1="0" y1="0" x2="0" y2="1">
              <stop offset="60%" stopColor="transparent"/>
              <stop offset="100%" stopColor="#0A0B0D"/>
            </linearGradient>
          </defs>

          {/* Faint mathematical grid lines (iso-curves) */}
          {Array.from({ length: 6 }, (_, i) => (
            <line key={`h${i}`} x1="0" y1={120 + i * 110} x2="1400" y2={120 + i * 110}
              stroke="#4F9CF9" strokeWidth="0.4" strokeOpacity="0.025"/>
          ))}
          {Array.from({ length: 8 }, (_, i) => (
            <line key={`v${i}`} x1={80 + i * 180} y1="0" x2={80 + i * 180} y2="860"
              stroke="#4F9CF9" strokeWidth="0.4" strokeOpacity="0.025"/>
          ))}

          {/* Topographic rings */}
          {RINGS.map(ring => (
            <g key={ring.id}>
              <path id={ring.id} d={ring.d} fill="none"
                stroke={ring.color} strokeWidth="0.65" strokeOpacity={ring.opacity}/>
              {/* Primary spark */}
              <circle r={ring.sparkR} fill={ring.color} filter="url(#bloom)">
                <animateMotion dur={`${ring.dur}s`} repeatCount="indefinite">
                  <mpath href={`#${ring.id}`}/>
                </animateMotion>
              </circle>
              {/* Trailing spark */}
              <circle r={ring.sparkR * 0.45} fill={ring.color} filter="url(#softbloom)" opacity="0.55">
                <animateMotion dur={`${ring.trailDur}s`} repeatCount="indefinite">
                  <mpath href={`#${ring.id}`}/>
                </animateMotion>
              </circle>
            </g>
          ))}

          {/* Center sonar pulse */}
          <circle cx={CX} cy={CY} r="5" fill="#4F9CF9" filter="url(#bloom)">
            <animate attributeName="opacity" values="1;0.25;1" dur="2.8s" repeatCount="indefinite"/>
          </circle>
          <circle cx={CX} cy={CY} r="12" fill="none" stroke="#4F9CF9" strokeWidth="0.8" strokeOpacity="0.35">
            <animate attributeName="r" values="8;38;8" dur="3.2s" repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.6 1;0.4 0 0.6 1"/>
            <animate attributeName="opacity" values="0.6;0;0.6" dur="3.2s" repeatCount="indefinite"/>
          </circle>
          <circle cx={CX} cy={CY} r="20" fill="none" stroke="#4F9CF9" strokeWidth="0.5" strokeOpacity="0.15">
            <animate attributeName="r" values="20;65;20" dur="4.8s" repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.6 1;0.4 0 0.6 1"/>
            <animate attributeName="opacity" values="0.4;0;0.4" dur="4.8s" repeatCount="indefinite"/>
          </circle>

          {/* Vignette + bottom fade */}
          <rect width="1400" height="860" fill="url(#vig)"/>
          <rect width="1400" height="860" fill="url(#fade-b)"/>
        </svg>

        {/* Header bar */}
        <header style={{ position: 'relative', zIndex: 10, borderBottom: '1px solid rgba(33,38,45,0.5)', padding: '14px 32px', display: 'flex', alignItems: 'center', gap: 16, background: 'rgba(13,17,23,0.6)', backdropFilter: 'blur(12px)' }}>
          <Link href="/" style={{ color: '#4F9CF9', textDecoration: 'none', fontFamily: 'monospace', fontSize: 11 }}>← HOME</Link>
          <span style={{ color: '#21262D' }}>|</span>
          <span style={{ fontFamily: 'monospace', fontSize: 10, color: '#484F58', letterSpacing: '0.10em' }}>AMBIENTINTEL / MECHANICAL</span>
          <span style={{ marginLeft: 'auto', fontFamily: 'monospace', fontSize: 10, color: '#4F9CF9', letterSpacing: '0.06em' }}>REV A — PROTOTYPE</span>
        </header>

        {/* Hero content */}
        <div style={{ position: 'relative', zIndex: 10, flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 32px 120px', textAlign: 'center' }}>
          <div style={{ fontFamily: 'monospace', fontSize: 10, letterSpacing: '0.18em', color: '#4F9CF9', marginBottom: 20, opacity: 0.85 }}>
            MECHANICAL &amp; ELECTROMECHANICAL ENGINEERING
          </div>
          <h1 style={{ margin: '0 0 16px', fontSize: 'clamp(40px, 7vw, 72px)', fontWeight: 200, color: '#E6EDF3', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
            Ambient Node
          </h1>
          <p style={{ margin: '0 0 48px', fontSize: 'clamp(14px, 2vw, 18px)', color: '#8B949E', maxWidth: 560, lineHeight: 1.65, fontWeight: 300 }}>
            Hardware development pipeline for the IWR6843AOP 60 GHz radar compute platform — from schematic to ceiling-mounted enclosure.
          </p>

          {/* Stats */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 0, justifyContent: 'center', marginBottom: 52, borderTop: '1px solid rgba(33,38,45,0.6)', borderBottom: '1px solid rgba(33,38,45,0.6)' }}>
            {[
              { num: '7',         label: 'Engineering Phases' },
              { num: '14',        label: 'Build Checkpoints' },
              { num: '60 GHz',    label: 'Radar Frequency' },
              { num: '100×80',    label: 'PCB Footprint (mm)' },
              { num: 'IP42',      label: 'Enclosure Rating' },
            ].map((s, i) => (
              <div key={i} style={{ padding: '24px 32px', borderRight: i < 4 ? '1px solid rgba(33,38,45,0.6)' : 'none', minWidth: 120, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 'clamp(22px, 3.5vw, 34px)', fontWeight: 200, color: '#E6EDF3', letterSpacing: '-0.01em', fontFamily: 'system-ui' }}>{s.num}</span>
                <span style={{ fontFamily: 'monospace', fontSize: 9, color: '#484F58', letterSpacing: '0.10em', textTransform: 'uppercase' }}>{s.label}</span>
              </div>
            ))}
          </div>

          {/* CTA */}
          <a href="#dashboard" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '13px 28px', border: '1px solid rgba(79,156,249,0.35)', borderRadius: 40, color: '#4F9CF9', textDecoration: 'none', fontSize: 13, fontFamily: 'monospace', letterSpacing: '0.06em', background: 'rgba(79,156,249,0.06)', backdropFilter: 'blur(8px)', transition: 'all 0.2s' }}>
            VIEW ENGINEERING DASHBOARD
            <span style={{ fontSize: 16, lineHeight: 1 }}>↓</span>
          </a>
        </div>

        {/* Bottom scroll hint */}
        <div style={{ position: 'absolute', bottom: 28, left: '50%', transform: 'translateX(-50%)', zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 1, height: 32, background: 'linear-gradient(to bottom, transparent, rgba(79,156,249,0.4))' }}/>
          <span style={{ fontFamily: 'monospace', fontSize: 9, color: '#484F58', letterSpacing: '0.12em' }}>SCROLL</span>
        </div>
      </section>

      {/* ── SYSTEM OVERVIEW ─────────────────────────────────────────────────── */}
      <section style={{ padding: '80px 40px', background: '#0D1117', borderBottom: '1px solid #21262D' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ marginBottom: 48, display: 'flex', alignItems: 'baseline', gap: 20 }}>
            <span style={{ fontFamily: 'monospace', fontSize: 10, color: '#4F9CF9', letterSpacing: '0.14em' }}>SYSTEM ARCHITECTURE</span>
            <div style={{ flex: 1, height: 1, background: '#21262D' }}/>
          </div>

          {/* Hardware block diagram */}
          <div style={{ marginBottom: 56 }}>
            <HardwareDiagram />
          </div>

          {/* System cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
            {[
              {
                tag: 'PCB DESIGN', title: 'Altium Designer 24', status: 'active' as PhaseStatus,
                specs: ['4-layer FR-4, 100 × 80 mm','ENIG surface finish','5 schematic sheets','DRC: 3 warnings to resolve'],
                metric: '2 / 5', metricLabel: 'Sheets complete',
              },
              {
                tag: 'ENCLOSURE', title: 'ABS + Aluminum', status: 'pending' as PhaseStatus,
                specs: ['Snap-fit ABS lid + base tray','PC RF window at 60 GHz','6061-T6 ceiling bracket','IP42 silicone gasket'],
                metric: 'IP42', metricLabel: 'Target rating',
              },
              {
                tag: 'VALIDATION', title: '7 Test Categories', status: 'pending' as PhaseStatus,
                specs: ['Power supply ripple ← < 50 mVpp','SPI signal integrity','Thermal soak 55 °C / 4h','EMC pre-scan at ETS-Lindgren'],
                metric: '6 dB', metricLabel: 'FCC margin target',
              },
            ].map((card, i) => {
              const cfg = STATUS[card.status];
              return (
                <div key={i} style={{ padding: '28px 28px', background: '#0A0B0D', border: '1px solid #21262D', borderRadius: 10, display: 'flex', flexDirection: 'column', gap: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <span style={{ fontFamily: 'monospace', fontSize: 9, color: '#484F58', letterSpacing: '0.12em' }}>{card.tag}</span>
                    <span style={{ padding: '3px 8px', borderRadius: 3, background: cfg.bg, border: `1px solid ${cfg.border}`, fontFamily: 'monospace', fontSize: 9, color: cfg.color }}>{cfg.label}</span>
                  </div>
                  <div style={{ fontSize: 20, fontWeight: 300, color: '#E6EDF3', marginBottom: 8 }}>{card.title}</div>
                  <div style={{ flex: 1, marginBottom: 20 }}>
                    {card.specs.map((s, si) => (
                      <div key={si} style={{ fontSize: 12, color: '#8B949E', lineHeight: 1.8, paddingLeft: 12, borderLeft: si === 0 ? '1px solid #21262D' : 'none', marginLeft: si === 0 ? 0 : 12 }}>
                        {s}
                      </div>
                    ))}
                  </div>
                  <div style={{ borderTop: '1px solid #21262D', paddingTop: 16, display: 'flex', alignItems: 'baseline', gap: 8 }}>
                    <span style={{ fontSize: 22, fontWeight: 200, color: '#4F9CF9' }}>{card.metric}</span>
                    <span style={{ fontFamily: 'monospace', fontSize: 9, color: '#484F58', letterSpacing: '0.08em' }}>{card.metricLabel}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── PHASE DASHBOARD ─────────────────────────────────────────────────── */}
      <div id="dashboard" style={{ display: 'flex', minHeight: 0 }}>
        {/* Sidebar */}
        <aside style={{ width: 220, borderRight: '1px solid #21262D', padding: '20px 0', flexShrink: 0, background: '#0D1117', position: 'sticky', top: 0, alignSelf: 'flex-start', height: '100vh', overflowY: 'auto' }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid #21262D', marginBottom: 8 }}>
            <div style={{ fontFamily: 'monospace', fontSize: 9, color: '#4F9CF9', letterSpacing: '0.10em', marginBottom: 6 }}>BUILD READINESS</div>
            <div style={{ height: 3, background: '#21262D', borderRadius: 2 }}>
              <div style={{ height: '100%', width: `${(completedCount / totalCount) * 100}%`, background: 'linear-gradient(90deg,#4F9CF9,#3DCC91)', borderRadius: 2 }}/>
            </div>
            <div style={{ marginTop: 4, fontFamily: 'monospace', fontSize: 9, color: '#484F58' }}>{completedCount}/{totalCount} checkpoints</div>
          </div>
          <div style={{ padding: '8px 16px 6px', fontFamily: 'monospace', fontSize: 9, color: '#484F58', letterSpacing: '0.10em' }}>PHASES</div>
          {PHASES.map(p => {
            const cfg = STATUS[p.status];
            const isActive = p.id === activePhase;
            return (
              <button key={p.id} onClick={() => setActivePhase(p.id)}
                style={{ width: '100%', textAlign: 'left', padding: '9px 16px', background: isActive ? 'rgba(79,156,249,0.07)' : 'transparent', border: 'none', borderLeft: isActive ? '2px solid #4F9CF9' : '2px solid transparent', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 3 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontFamily: 'monospace', fontSize: 9, color: isActive ? '#4F9CF9' : '#484F58', letterSpacing: '0.08em' }}>{p.phase}</span>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: cfg.color, flexShrink: 0 }}/>
                </div>
                <span style={{ fontSize: 12, color: isActive ? '#E6EDF3' : '#8B949E', lineHeight: 1.3, fontWeight: isActive ? 500 : 400 }}>{p.title}</span>
              </button>
            );
          })}
        </aside>

        {/* Main content */}
        <main style={{ flex: 1, padding: 28, overflowY: 'auto', minWidth: 0 }}>
          {(() => {
            const cfg = STATUS[current.status];
            return (
              <>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 22 }}>
                  <div>
                    <div style={{ fontFamily: 'monospace', fontSize: 9, color: '#484F58', letterSpacing: '0.10em', marginBottom: 4 }}>PHASE {current.phase}</div>
                    <h2 style={{ margin: 0, fontSize: 20, fontWeight: 400, color: '#E6EDF3' }}>{current.title}</h2>
                    <p style={{ margin: '6px 0 0', color: '#8B949E', fontSize: 13, lineHeight: 1.65 }}>{current.summary}</p>
                  </div>
                  <div style={{ marginLeft: 'auto', flexShrink: 0, padding: '4px 10px', borderRadius: 4, background: cfg.bg, border: `1px solid ${cfg.border}`, fontFamily: 'monospace', fontSize: 10, color: cfg.color, letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>{cfg.label}</div>
                </div>

                {current.sections.map((sec, si) => {
                  const key = `${current.id}-${si}`;
                  const open = expanded[key] !== false;
                  return (
                    <div key={key} style={{ marginBottom: 10, border: '1px solid #21262D', borderRadius: 6, overflow: 'hidden' }}>
                      {sec.heading && (
                        <button onClick={() => toggle(key)} style={{ width: '100%', textAlign: 'left', padding: '10px 16px', background: '#161B22', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span style={{ fontSize: 13, color: '#C9D1D9', fontWeight: 500 }}>{sec.heading}</span>
                          <span style={{ color: '#484F58', fontSize: 11 }}>{open ? '▲' : '▼'}</span>
                        </button>
                      )}
                      {open && (
                        <div style={{ padding: 16, background: '#0D1117' }}>
                          {sec.body && <p style={{ margin: '0 0 12px', color: '#8B949E', fontSize: 13, lineHeight: 1.7 }}>{sec.body}</p>}
                          {sec.commands && sec.commands.map((cmd, ci) => (
                            <div key={ci} style={{ marginBottom: 10 }}>
                              {cmd.label && <div style={{ fontFamily: 'monospace', fontSize: 10, color: '#4F9CF9', letterSpacing: '0.06em', marginBottom: 4 }}>$ {cmd.label}</div>}
                              <pre style={{ margin: 0, padding: '12px 14px', background: '#0A0B0D', border: '1px solid #21262D', borderRadius: 4, fontFamily: 'monospace', fontSize: 12, color: '#8DDB8C', lineHeight: 1.6, overflowX: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>{cmd.code}</pre>
                            </div>
                          ))}
                          {sec.table && (
                            <div style={{ overflowX: 'auto', marginBottom: 12 }}>
                              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                                <thead>
                                  <tr>{sec.table.cols.map(c => <th key={c} style={{ textAlign: 'left', padding: '6px 10px', borderBottom: '1px solid #21262D', fontFamily: 'monospace', fontSize: 10, color: '#4F9CF9', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>{c}</th>)}</tr>
                                </thead>
                                <tbody>
                                  {sec.table.rows.map((row, ri) => (
                                    <tr key={ri} style={{ borderBottom: '1px solid #21262D' }}>
                                      {row.map((cell, ci) => <td key={ci} style={{ padding: '7px 10px', color: ci === 0 ? '#C9D1D9' : '#8B949E', fontFamily: ci === 0 ? 'monospace' : 'inherit', fontSize: ci === 0 ? 11 : 12 }}>{cell}</td>)}
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                          {sec.artifacts && sec.artifacts.length > 0 && (
                            <div>
                              {sec.artifacts.map((a, ai) => (
                                <div key={ai} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '7px 10px', background: '#161B22', border: '1px solid #21262D', borderRadius: 4, marginBottom: 6 }}>
                                  <span style={{ fontFamily: 'monospace', fontSize: 11, color: '#4F9CF9', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {a.repo ? <a href={`https://github.com/ambientintel/ambientmechanical/blob/main/${a.file}`} target="_blank" rel="noreferrer" style={{ color: '#4F9CF9', textDecoration: 'none' }}>{a.file} ↗</a> : a.file}
                                  </span>
                                  <span style={{ fontSize: 11, color: '#8B949E', flexShrink: 0 }}>{a.role}</span>
                                </div>
                              ))}
                            </div>
                          )}
                          {sec.notes && sec.notes.map((n, ni) => {
                            const noteStyle = { warning: { bg:'rgba(210,153,34,0.08)',border:'rgba(210,153,34,0.25)',label:'⚠ WARNING',color:'#D29922' }, info: { bg:'rgba(79,156,249,0.08)',border:'rgba(79,156,249,0.25)',label:'◆ NOTE',color:'#4F9CF9' }, decision: { bg:'rgba(188,140,255,0.08)',border:'rgba(188,140,255,0.25)',label:'✦ DECISION',color:'#BC8CFF' } };
                            const s = noteStyle[n.kind];
                            return (
                              <div key={ni} style={{ padding: '10px 14px', background: s.bg, border: `1px solid ${s.border}`, borderRadius: 4, marginBottom: 8, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                                <span style={{ fontFamily: 'monospace', fontSize: 9, color: s.color, letterSpacing: '0.08em', flexShrink: 0, paddingTop: 2 }}>{s.label}</span>
                                <span style={{ fontSize: 12, color: '#8B949E', lineHeight: 1.6 }}>{n.text}</span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </>
            );
          })()}
        </main>

        {/* Right panel */}
        <aside style={{ width: 250, borderLeft: '1px solid #21262D', padding: 16, flexShrink: 0, background: '#0D1117', position: 'sticky', top: 0, alignSelf: 'flex-start', height: '100vh', overflowY: 'auto' }}>
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontFamily: 'monospace', fontSize: 9, color: '#4F9CF9', letterSpacing: '0.10em', marginBottom: 12 }}>BUILD CHECKLIST</div>
            {CHECKLIST.map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 7 }}>
                <span style={{ flexShrink: 0, marginTop: 1, fontFamily: 'monospace', fontSize: 11, color: item.done ? '#3DCC91' : '#484F58' }}>{item.done ? '✓' : '○'}</span>
                <span style={{ fontSize: 11, color: item.done ? '#8B949E' : '#C9D1D9', lineHeight: 1.4, textDecoration: item.done ? 'line-through' : 'none', textDecorationColor: '#484F58' }}>{item.label}</span>
              </div>
            ))}
          </div>
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontFamily: 'monospace', fontSize: 9, color: '#BC8CFF', letterSpacing: '0.10em', marginBottom: 12 }}>OPEN DECISIONS</div>
            {OPEN_DECISIONS.map((d, i) => (
              <div key={i} style={{ marginBottom: 9, padding: '8px 10px', background: 'rgba(188,140,255,0.05)', border: '1px solid rgba(188,140,255,0.16)', borderRadius: 4 }}>
                <div style={{ fontSize: 11, color: '#C9D1D9', marginBottom: 4, lineHeight: 1.4 }}>{d.label}</div>
                <div style={{ fontSize: 10, color: '#8B949E', lineHeight: 1.5 }}>{d.note}</div>
              </div>
            ))}
          </div>
          <div>
            <div style={{ fontFamily: 'monospace', fontSize: 9, color: '#484F58', letterSpacing: '0.10em', marginBottom: 10 }}>REPO LINKS</div>
            {[
              { label: 'ambientmechanical', href: 'https://github.com/ambientintel/ambientmechanical', note: 'Altium + CAD + fab' },
              { label: 'ambientfirm',        href: 'https://github.com/ambientintel/ambientfirm',       note: 'Firmware source' },
              { label: '/firmware',           href: '/firmware',                                          note: 'Firmware runbook' },
              { label: '/cloud',              href: '/cloud',                                             note: 'Cloud ops console' },
            ].map(l => (
              <a key={l.label} href={l.href} target={l.href.startsWith('http') ? '_blank' : '_self'} rel="noreferrer"
                style={{ display: 'flex', flexDirection: 'column', gap: 2, padding: '7px 10px', marginBottom: 6, background: '#161B22', border: '1px solid #21262D', borderRadius: 4, textDecoration: 'none' }}>
                <span style={{ fontFamily: 'monospace', fontSize: 11, color: '#4F9CF9' }}>{l.label} ↗</span>
                <span style={{ fontSize: 10, color: '#8B949E' }}>{l.note}</span>
              </a>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}
