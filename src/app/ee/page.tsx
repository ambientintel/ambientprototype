'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { ENG_DOMAIN_BY_ID } from '@/lib/eng-domains';


// ── Copy button ────────────────────────────────────────────────────────────────

function CopyBtn({ code }: { code: string }) {
  const [state, setState] = useState<'idle' | 'ok' | 'err'>('idle');
  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      setState('ok');
      setTimeout(() => setState('idle'), 1600);
    } catch { setState('err'); setTimeout(() => setState('idle'), 1600); }
  }
  return (
    <button onClick={copy} title="Copy to clipboard" style={{ position: 'absolute', top: 10, right: 10, display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 5, border: state === 'ok' ? '1px solid #34D399' : '1px solid rgba(255,255,255,0.14)', background: state === 'ok' ? 'rgba(52,211,153,0.15)' : 'rgba(255,255,255,0.06)', color: state === 'ok' ? '#34D399' : '#94A3B8', fontSize: 11, fontFamily: 'var(--mono)', cursor: 'pointer', transition: 'all 0.15s', letterSpacing: '0.04em' }}>
      {state === 'ok'
        ? <><svg width="11" height="11" viewBox="0 0 12 12" fill="none"><path d="M2 6.5L4.5 9L10 3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>Copied</>
        : <><svg width="11" height="11" viewBox="0 0 12 12" fill="none"><rect x="4" y="1" width="7" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.2"/><path d="M1 4v6.5A1.5 1.5 0 002.5 12H8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>Copy</>}
    </button>
  );
}

// ── Types ──────────────────────────────────────────────────────────────────────

type StepStatus = 'done' | 'pending' | 'blocked' | 'warning';
interface Step { id: string; phase: string; title: string; status: StepStatus; tag: string; time?: string; summary: string; sections: Section[]; }
interface Section { heading?: string; body?: string; commands?: Cmd[]; artifacts?: Artifact[]; warnings?: string[]; table?: { cols: string[]; rows: string[][] }; checklist?: string[]; }
interface Cmd { label?: string; code: string; }
interface Artifact { file: string; role: string; size?: string; }

const SC: Record<StepStatus, { label: string; bg: string; border: string; color: string; dot: string }> = {
  done:    { label: 'Complete',  bg: '#ECFDF5', border: '#A7F3D0', color: '#059669', dot: '#059669' },
  pending: { label: 'Pending',   bg: '#FFFBEB', border: '#FDE68A', color: '#D97706', dot: '#D97706' },
  blocked: { label: 'Blocked',   bg: '#FEF2F2', border: '#FECACA', color: '#DC2626', dot: '#DC2626' },
  warning: { label: 'Attention', bg: '#FFF7ED', border: '#FED7AA', color: '#EA580C', dot: '#EA580C' },
};

const TAG_STYLE: Record<string, { bg: string; color: string }> = {
  'Design':   { bg: '#EFF6FF', color: '#1D4ED8' },
  'Output':   { bg: '#F0FDF4', color: '#15803D' },
  'Build':    { bg: '#FFF7ED', color: '#C2410C' },
  'Validate': { bg: '#FAF5FF', color: '#7E22CE' },
};

const PIPELINE_PHASES = [
  { label: 'Design',   ids: ['schematic', 'bom', 'layout', 'drc'] },
  { label: 'Output',   ids: ['gerbers', 'assy-docs'] },
  { label: 'Build',    ids: ['fab', 'assembly', 'inspection'] },
  { label: 'Validate', ids: ['power-on', 'functional', 'evt-signoff'] },
];

// ── Step data ──────────────────────────────────────────────────────────────────

const STEPS: Step[] = [
  {
    id: 'schematic', phase: '01', title: 'Schematic Capture', status: 'done', tag: 'Design', time: '~2 weeks',
    summary: 'Hierarchical Altium Designer project with 5 schematic sheets covering the AM62x SoC module, IWR6843AOP radar front-end, power tree, MCU peripherals, and comms.',
    sections: [
      {
        heading: 'Project hierarchy',
        body: 'ambientelectrical.PrjPcb uses Altium sheet symbols to compose five source schematics into a single hierarchical design. All cross-sheet nets are resolved by net labels — no port-to-port wiring across sheets.',
        artifacts: [
          { file: 'hardware/altium/Source Documents/System.SchDoc',    role: 'Top-level sheet. AM62x module connections, IWR6843AOP host interface, power domains, connector map.' },
          { file: 'hardware/altium/Source Documents/PowerTree.SchDoc', role: 'All power rails: 5V input, 3.3V LDO, 1.8V, 1.1V core. Sequencing FETs and enable logic.' },
          { file: 'hardware/altium/Source Documents/RadarFE.SchDoc',   role: 'IWR6843AOP SPI/UART/NRESET/GPIO interface to AM62x. RF decoupling and antenna keep-out annotation.' },
          { file: 'hardware/altium/Source Documents/MCU.SchDoc',       role: 'OSD62x-PM AM6254 SoC: DDR4, eMMC, USB-C, UART, JTAG, boot config resistors.' },
          { file: 'hardware/altium/Source Documents/Comms.SchDoc',     role: 'Wi-Fi/BT module, Ethernet PHY, I2C sensors, expansion headers.' },
        ],
      },
      {
        heading: 'Open the project',
        commands: [
          { label: 'clone repo and open in Altium', code: 'git clone https://github.com/ambientintel/ambientelectrical\nopen hardware/altium/ambientelectrical.PrjPcb\n# File → Open Project → ambientelectrical.PrjPcb' },
          { label: 'verify all sheets compile', code: '# In Altium: Project → Compile PCB Project\n# Projects panel should show zero errors under Compile Messages' },
        ],
      },
      {
        heading: 'Schematic review checklist',
        checklist: [
          'All power rails decoupled within 1 mm of IC pins — 100 nF + 10 µF per supply pin',
          'IWR6843AOP NRESET driven by AM62x GPIO with 10 kΩ pull-up to 1.8V',
          'Boot config pins (AM62x SD/eMMC/UART boot) pinned to correct resistor dividers',
          'USB-C CC resistors (5.1 kΩ to GND) present — device-mode only, no PD controller',
          'JTAG TCK/TMS/TDI/TDO/TRST connected to XDS110 debug header per TI layout guide',
          'Crystal load capacitors calculated for specified oscillator ESR',
          'All net labels consistent across sheets — no dangling wires or unconnected pins',
        ],
      },
      {
        warnings: [
          'IWR6843AOP 1.8V GPIO levels: verify AM62x GPIO bank voltage is configured for 1.8V I/O. Default AM62x GPIO bank can be 3.3V — check VDDSHV settings in PowerTree.',
          'OSD62x-PM DDR4 termination resistors are on-module. Do not add external ODT resistors on the carrier board.',
        ],
      },
    ],
  },
  {
    id: 'bom', phase: '02', title: 'BOM Generation', status: 'done', tag: 'Design', time: '~1 day',
    summary: 'BOM exported from Altium Active BOM to hardware/bom/EVT-0.1-BOM.csv. All critical components confirmed in stock at Digi-Key/Mouser.',
    sections: [
      {
        heading: 'Export from Altium',
        body: 'Use Reports → Bill of Materials to export from the compiled project. The EVT-0.1.OutJob output job also includes a BOM CSV configured with the correct column mapping.',
        commands: [
          { label: 'run via OutJob (recommended)', code: '# In Altium: Open Output Jobs/EVT-0.1.OutJob\n# Under Report Outputs → "BOM CSV" → Run\n# Output: hardware/bom/EVT-0.1-BOM.csv' },
          { label: 'commit the BOM to git', code: 'git add hardware/bom/EVT-0.1-BOM.csv\ngit commit -m "bom: export EVT-0.1-BOM.csv from Altium"\ngit push' },
        ],
        artifacts: [
          { file: 'hardware/bom/EVT-0.1-BOM.csv', role: 'Full component list with reference designators, MPN, supplier, qty, and lifecycle status.' },
        ],
      },
      {
        heading: 'Required BOM columns (21 CFR §820.181)',
        table: {
          cols: ['Column', 'Purpose', 'Required for DHF'],
          rows: [
            ['Reference',       'Altium reference designators (R1, C4, U2…)',    'Yes'],
            ['Description',     'Component type and key parameter',               'Yes'],
            ['Value',           'Resistance/capacitance/voltage rating',          'Yes'],
            ['Footprint',       'PCB land pattern name',                          'No'],
            ['MPN',             'Manufacturer part number — exactly as ordered',  'Yes'],
            ['Manufacturer',    'Component manufacturer name',                    'Yes'],
            ['Supplier',        'Preferred supplier (Digi-Key, Mouser…)',         'No'],
            ['Supplier PN',     'Supplier-specific order code',                   'No'],
            ['Qty',             'Per-board quantity',                             'Yes'],
            ['Lifecycle',       'Active / NRND / EOL — spot-checked quarterly',  'Yes'],
          ],
        },
      },
      {
        heading: 'Lifecycle and availability check',
        commands: [
          { label: 'spot-check critical parts on Octopart', code: '# Key parts to verify every EVT build:\n# OSD62x-PM:   https://octopart.com/search?q=OSD62x-PM\n# IWR6843AOP:  https://octopart.com/search?q=IWR6843AOPRJKR\n# Wi-Fi module: check Murata 1YN or CYW43xx stock depth' },
        ],
        warnings: [
          'IWR6843AOP is TI NRND (Not Recommended for New Designs) in some package variants. Confirm AOPRJKR (AOP, 6843) is the correct variant and has sufficient stock for DVT/PVT runs before design freeze.',
          'OSD62x-PM has a 12–14 week lead time at volume. Place a buffer order before DVT to avoid schedule risk.',
        ],
      },
    ],
  },
  {
    id: 'layout', phase: '03', title: 'PCB Layout', status: 'done', tag: 'Design', time: '~3 weeks',
    summary: '8-layer controlled impedance board. OSD62x-PM 500-ball BGA escaped with via-in-pad. IWR6843AOP placed on RF side with 10 mm keep-out from metallic features.',
    sections: [
      {
        heading: 'Layer stackup',
        table: {
          cols: ['Layer', 'Type', 'Usage', 'Thickness'],
          rows: [
            ['L1', 'Signal',  'Top copper — SMT, BGA fanout, RF keep-out zone',              '1 oz'],
            ['L2', 'Ground',  'Unbroken GND plane — reference for L1/L3 signals',           '0.5 oz'],
            ['L3', 'Signal',  'High-speed: DDR4, USB-C differential pairs',                 '0.5 oz'],
            ['L4', 'Power',   '3.3V / 1.8V pours, local power routing',                    '1 oz'],
            ['L5', 'Power',   '5V / VDD_CORE pours',                                       '1 oz'],
            ['L6', 'Signal',  'Low-speed signals, I2C, SPI, UART',                         '0.5 oz'],
            ['L7', 'Ground',  'GND plane — reference for L6/L8 signals',                   '0.5 oz'],
            ['L8', 'Signal',  'Bottom copper — connectors, test points, through-hole',     '1 oz'],
          ],
        },
      },
      {
        heading: 'Critical placement rules',
        checklist: [
          'IWR6843AOP RF keep-out: no copper on any layer within 10 mm of antenna zone (four sides)',
          'OSD62x-PM BGA via-in-pad: VIPPO (via-in-pad plated over) required — specify to fab',
          'DDR4 fly-by topology: match stub lengths within ±5 mil; total length < 2 inches',
          'Decoupling caps placed on same side as IC, within 1 mm — no vias between cap and pin',
          'USB-C differential pairs: 90Ω impedance, length-matched within ±5 mil per pair',
          'JTAG header placed near board edge, accessible with probe without removing shields',
          'Test points on all critical power rails and digital bus lines (100 mil grid)',
          'Mounting holes at four corners, non-plated, with GND copper ring 0.5 mm from hole edge',
        ],
      },
      {
        heading: 'Impedance-controlled nets',
        table: {
          cols: ['Net class', 'Target impedance', 'Layer', 'Trace width'],
          rows: [
            ['DDR4 single-ended', '50 Ω ±10%', 'L3', '4.5 mil'],
            ['DDR4 differential', '100 Ω ±10%', 'L3', '4 mil / 4 mil / 4 mil space'],
            ['USB-C differential', '90 Ω ±10%', 'L3', '3.8 mil / 3.8 mil / 4.5 mil space'],
            ['IWR6843 SPI', '50 Ω ±15%', 'L1', '5 mil'],
            ['General signal', 'Unconstrained', 'L1/L6/L8', '5 mil default'],
          ],
        },
      },
      {
        warnings: [
          'Do not break the L2 GND plane under DDR4 routing. A split in the return path creates a resonance that shows up as EMI at DDR4 clock harmonics (typically 800 MHz, 1.6 GHz). If a board outline or keepout cuts L2, re-route to avoid it.',
          'IWR6843AOP datasheet RF layout guide specifies pad geometry for the antenna ports — use the Altium footprint from TI\'s reference design, not a generic QFN footprint.',
        ],
      },
    ],
  },
  {
    id: 'drc', phase: '04', title: 'DRC / ERC', status: 'done', tag: 'Design', time: '< 1 day',
    summary: 'Altium DRC and ERC both passing with zero real violations. Results archived in docs/design-history/EVT-0.1/.',
    sections: [
      {
        heading: 'Run Electrical Rules Check (ERC)',
        commands: [
          { label: 'compile and run ERC', code: '# Project → Compile PCB Project (Ctrl+F9)\n# Tools → ERC → Run\n# Export: Reports → ERC Report → Save to docs/design-history/EVT-0.1/ERC-Report.html' },
        ],
        body: 'Common false positives: unconnected pins on passive ICs (pull-resistor networks), NRESET pins annotated as outputs on both sides. Suppress false positives explicitly — do not mask real issues.',
      },
      {
        heading: 'Run Design Rule Check (DRC)',
        commands: [
          { label: 'run DRC and export report', code: '# Tools → Design Rule Check → Run Design Rule Check\n# All rule classes enabled: Electrical, Routing, SMT, Mask, Plane, Testpoint, Manufacturing, Signal Integrity\n# Export: File → Export → Design Rule Check Report\n# Save to docs/design-history/EVT-0.1/DRC-Report.html' },
        ],
        warnings: [
          'Clearance violations on IWR6843AOP BGA escape vias are expected in the default Altium DRC config if VIPPO is used — the fab will verify these. Add a waiver note to the DRC report rather than ignoring the violation class globally.',
          'Min annular ring violations may appear on 0.3 mm microvias in the BGA fanout. Verify your fab\'s minimum annular ring spec before waiving.',
        ],
      },
      {
        heading: 'Archive to design history',
        commands: [
          { label: 'commit DRC/ERC artifacts', code: 'mkdir -p docs/design-history/EVT-0.1\ncp DRC-Report.html docs/design-history/EVT-0.1/\ncp ERC-Report.html docs/design-history/EVT-0.1/\ngit add docs/design-history/EVT-0.1/\ngit commit -m "dhf: archive EVT-0.1 DRC and ERC reports"\ngit push' },
        ],
        artifacts: [
          { file: 'docs/design-history/EVT-0.1/DRC-Report.html', role: 'Altium DRC output — all violations resolved or formally waived.' },
          { file: 'docs/design-history/EVT-0.1/ERC-Report.html', role: 'Altium ERC output — zero unresolved electrical errors.' },
        ],
      },
    ],
  },
  {
    id: 'gerbers', phase: '05', title: 'Gerber Output', status: 'done', tag: 'Output', time: '< 1 hr',
    summary: 'EVT-0.1.OutJob generates Gerbers + drill, Pick & Place CSV, BOM, and schematic PDF in a single run.',
    sections: [
      {
        heading: 'Run the output job',
        commands: [
          { label: 'run all outputs', code: '# In Altium: File → Open → hardware/altium/Output Jobs/EVT-0.1.OutJob\n# Click "Run All" or run individually:\n#   Fabrication Outputs → Gerber Files → Run\n#   Fabrication Outputs → NC Drill Files → Run\n#   Assembly Outputs → Generates Pick and Place Files → Run\n#   Report Outputs → Bill of Materials → Run\n#   Documentation Outputs → Schematic Prints → Run' },
          { label: 'verify output directory', code: 'ls hardware/altium/Project\\ Outputs\\ for\\ ambientelectrical/\n# Should contain:\n# Gerber/         ← copper layers + board outline\n# NC Drill/       ← drill files\n# Pick Place/     ← CPL for PCBA house\n# BOM/            ← EVT-0.1-BOM.csv\n# Schematic/      ← schematic PDF' },
        ],
        artifacts: [
          { file: 'hardware/altium/Project Outputs/Gerber/', role: 'L1–L8 copper, soldermask top/bottom, silkscreen, board outline. One file per layer.' },
          { file: 'hardware/altium/Project Outputs/NC Drill/', role: 'Excellon drill files: plated through-hole + non-plated. Separate file for microvias if used.' },
          { file: 'hardware/altium/Project Outputs/Pick Place/Pick Place for ambientelectrical.csv', role: 'Component X/Y centroid, rotation, and side. Upload directly to PCBA house.' },
        ],
      },
      {
        heading: 'Fab package verification',
        commands: [
          { label: 'open Gerbers in a viewer before sending to fab', code: '# Use gerber viewer to verify:\n#   All 8 copper layers present\n#   Drill symbols align to pads\n#   Board outline is closed (no gaps)\n#   Soldermask openings match pad sizes\n# Recommended: gerbv (free), Altium Gerber viewer, or PCBWay online viewer' },
          { label: 'zip for fab upload', code: 'cd hardware/altium/Project\\ Outputs\\ for\\ ambientelectrical\nzip -r EVT-0.1-Gerbers.zip Gerber/ "NC Drill/"\nsha256sum EVT-0.1-Gerbers.zip > EVT-0.1-Gerbers.zip.sha256' },
        ],
        warnings: [
          'Always open Gerbers in a viewer before uploading to fab — Altium layer mapping bugs have caused wrong-layer assignments that only appear in the viewer, not in the PCB editor.',
        ],
      },
    ],
  },
  {
    id: 'assy-docs', phase: '06', title: 'Assembly Docs', status: 'done', tag: 'Output', time: '< 1 hr',
    summary: 'Assembly drawing, component placement reference, and device label artwork per 21 CFR §820.120.',
    sections: [
      {
        heading: 'Assembly drawing',
        body: 'The assembly drawing PDF is generated from the PCB document via Altium Draftsman or File → Smart PDF. It includes component references overlaid on a 3D board view, BOM table, and reference designator call-outs.',
        commands: [
          { label: 'export assembly drawing via OutJob', code: '# EVT-0.1.OutJob → Documentation Outputs → Assembly Drawings → Run\n# Output: Project Outputs/Assembly/ambientelectrical-Assembly.PDF' },
        ],
        artifacts: [
          { file: 'hardware/altium/Project Outputs/Assembly/ambientelectrical-Assembly.PDF', role: 'Assembly drawing with component placement, reference designators, and board revision.' },
          { file: 'manufacturing/assembly/EVT-0.1-Assembly-Instructions.md', role: 'Supplemental hand-assembly notes for connectors, through-hole parts, and RF section.' },
        ],
      },
      {
        heading: 'Device label requirements (§820.120)',
        table: {
          cols: ['Field', 'Content', 'Location'],
          rows: [
            ['Device name',     'Ambient Fall Sensor',               'Label top-right'],
            ['Revision',        'EVT-0.1',                           'Label'],
            ['Serial number',   'AMB-EVT-XXXX (sequential)',         'Label'],
            ['Manufacturer',    'Ambient Intelligence, Inc.',        'Label'],
            ['Part number',     'AMB-HW-001-EVT',                   'Label'],
            ['Regulatory',      'Prototype — Not for clinical use',  'Label — required for EVT'],
          ],
        },
        warnings: [
          'EVT boards must be labeled "Prototype — Not for clinical use" per 21 CFR §820.120(e). Do not distribute EVT hardware without this label.',
        ],
      },
    ],
  },
  {
    id: 'fab', phase: '07', title: 'Fab Order', status: 'pending', tag: 'Build', time: '10–14 day lead',
    summary: 'Bare PCBs ordered from PCB fab. 8-layer, 0.062" FR4, HASL-LF, IPC Class 2 standard. Hardware on order.',
    sections: [
      {
        heading: 'Fab specification',
        table: {
          cols: ['Parameter', 'Specification', 'Notes'],
          rows: [
            ['Layer count',     '8',                             'L1 top – L8 bottom'],
            ['Material',        'FR4 Tg 150°C',                  'Standard for lead-free process'],
            ['Board thickness', '0.062" (1.57 mm) ±10%',        'Nominal. Verify for connector mating height.'],
            ['Copper weight',   'L1/L4/L5/L8: 1 oz; L2/L3/L6/L7: 0.5 oz', 'As per stackup'],
            ['Min trace/space', '3.5/3.5 mil',                  'Governs BGA escape. Confirm with fab.'],
            ['Min drill',       '0.2 mm (8 mil)',               'For VIPPO microvias in BGA zone'],
            ['Surface finish',  'HASL-LF',                      'Lead-free. Upgrade to ENIG for fine-pitch BGA if needed.'],
            ['Solder mask',     'LPI green, both sides',        'Standard. Specify black if enclosure requires.'],
            ['Controlled imp.', 'Yes — provide impedance notes', 'L3: 50Ω SE / 100Ω diff, L1: 50Ω'],
            ['IPC class',       'Class 2',                      'Standard commercial. Class 3 for DVT/PVT.'],
          ],
        },
      },
      {
        heading: 'Order checklist',
        checklist: [
          'Gerber zip verified in viewer — all 8 copper layers present and correct',
          'Drill file format confirmed with fab (Excellon 2)',
          'VIPPO (via-in-pad) capability confirmed for BGA zone — specify explicitly in order notes',
          'Impedance coupon included on panel — request test report from fab',
          'Board outline is a single closed polyline on the Mechanical layer',
          'Panelization requirements confirmed (V-score or tab-rout) for assembly house',
          'Order quantity: minimum 5 for EVT (3 build + 2 spare)',
        ],
      },
      {
        warnings: [
          'VIPPO microvias require specialized fab capability. Confirm before ordering — not all low-cost fabs support it. PCBWay, Advanced Circuits, and Prototech support VIPPO.',
          'Impedance test report is essential for DDR4 bring-up debugging. Always request it, even for EVT.',
        ],
      },
    ],
  },
  {
    id: 'assembly', phase: '08', title: 'PCB Assembly', status: 'pending', tag: 'Build', time: '~1 day',
    summary: 'SMT assembly using solder paste stencil. IWR6843AOP RF section hand-assembled. OSD62x-PM BGA reflow profile per TI datasheet.',
    sections: [
      {
        heading: 'Solder paste and stencil',
        body: 'Stencil apertures are generated from the Altium paste layer exports. Use SAC305 (Sn96.5/Ag3/Cu0.5) lead-free paste, Type 4 for fine-pitch. Stencil thickness: 0.12 mm (5 mil) for 0402 components; reduce to 0.10 mm if BGA paste bridging is observed.',
        commands: [
          { label: 'export paste layers from Altium', code: '# File → Fabrication Outputs → Gerber Files\n# Select: Top Paste (GTL), Bottom Paste (GBL)\n# Send paste layer Gerbers to stencil house' },
        ],
      },
      {
        heading: 'Reflow profile (SAC305, OSD62x-PM BGA)',
        table: {
          cols: ['Zone', 'Target temp', 'Duration', 'Ramp rate'],
          rows: [
            ['Preheat',      '150°C',    '60–90 sec',  '1–3°C/sec'],
            ['Soak',         '175°C',    '60–120 sec', '< 1°C/sec'],
            ['Reflow peak',  '245–250°C','20–40 sec above 217°C liquidus', '< 3°C/sec'],
            ['Cooling',      'Room temp','Natural or forced air', '< 6°C/sec max'],
          ],
        },
        warnings: [
          'Do not exceed 260°C peak. IWR6843AOP max reflow is 260°C per datasheet. OSD62x-PM Octavo guide recommends 245°C peak for best BGA joint reliability.',
          'IWR6843AOP AOP package: antenna is on the top of the package. Ensure no soldermask or silk covers the clearance zone — the antenna must have clear air above it.',
        ],
      },
      {
        heading: 'Hand assembly',
        checklist: [
          'USB-C connector: hand-solder after reflow — thermal mass requires iron at 360°C',
          'JTAG header (2×10, 1.27 mm pitch): hand-solder or use low-temp solder paste',
          'Through-hole mounting hardware: add after SMT reflow, before conformal coat',
          'RF SMA connectors (if present): hand-solder with proper grounding technique',
        ],
      },
    ],
  },
  {
    id: 'inspection', phase: '09', title: 'Post-Assembly Inspection', status: 'pending', tag: 'Build', time: '~2 hrs',
    summary: 'Visual inspection, AOI, and X-ray BGA verification before power-on. IPC-A-610 Class 2 acceptance criteria.',
    sections: [
      {
        heading: 'Visual inspection criteria (IPC-A-610 Class 2)',
        checklist: [
          '0402 components: no tombstoning, solder fillets on both ends, no solder balls in vicinity',
          'Fine-pitch ICs: no bridges between adjacent pins, fillets on all leads visible',
          'QFN components: solder visible at exposed pad via windows in solder mask',
          'No solder balls or flux residue on board surface',
          'Polarity marks (LEDs, tantalum caps, diodes) match assembly drawing',
          'Connector pins fully seated, housing flush with PCB',
          'No bent, missing, or damaged components',
        ],
      },
      {
        heading: 'X-ray BGA verification',
        body: 'OSD62x-PM is a 500-ball BGA. X-ray inspection is required before power-on to confirm solder joint formation. Submit boards to X-ray service or use a desktop X-ray if available.',
        table: {
          cols: ['Defect', 'X-ray appearance', 'Action'],
          rows: [
            ['Cold joint',    'Irregular, granular ball',           'Rework — reflow with flux pen under nitrogen'],
            ['Bridge',        'Two adjacent balls merged',          'Rework — wick with desoldering braid, re-paste'],
            ['Head-in-pillow', 'Pad and ball visible but not merged', 'Rework — requires full BGA removal and re-ball'],
            ['Missing ball',  'Empty pad, no ball',                  'Replace module'],
            ['Void > 25%',   'Dark center in ball X-ray',           'Acceptable up to 25% per IPC-7095; flag if larger'],
          ],
        },
        warnings: [
          'Head-in-pillow defects on the OSD62x-PM BGA have been a documented failure mode with incorrect reflow profiles. Ensure soak zone is long enough (60+ sec) to fully activate flux before reflow.',
        ],
      },
    ],
  },
  {
    id: 'power-on', phase: '10', title: 'Power-On Test', status: 'pending', tag: 'Validate', time: '~1 day',
    summary: 'Sequential power-on with current-limited bench supply. Verify all voltage rails before applying power to SoC. Serial console 115200 8N1.',
    sections: [
      {
        heading: 'Pre-power-on safety checks',
        checklist: [
          'Measure resistance from 5V input to GND with no power applied — should be > 1 kΩ (not a short)',
          'Measure resistance from 3.3V rail to GND — should be > 500 Ω',
          'Verify no metallic debris, solder balls, or stray wire on board surface',
          'Set bench supply current limit to 200 mA before first power-on',
          'Connect UART-to-USB adapter to debug header before applying power',
        ],
      },
      {
        heading: 'Rail voltage verification sequence',
        table: {
          cols: ['Rail', 'Test point', 'Expected voltage', 'Max current at idle', 'Action if wrong'],
          rows: [
            ['VIN (5V)',   'TP1 / J1 pin 1', '4.9–5.1V',   '< 50 mA',  'Check USB-C input or barrel jack'],
            ['3.3V',       'TP2',            '3.25–3.35V', '< 80 mA',  'Check LDO regulator, enable pin'],
            ['1.8V',       'TP3',            '1.78–1.82V', '< 30 mA',  'Check secondary LDO output'],
            ['1.1V (DDR)', 'TP4',            '1.08–1.12V', '< 50 mA',  'Check VDD_DDR LDO'],
            ['VDD_CORE',   'TP5 (module)',    '0.9–1.0V',   'OSD62x-PM internal', 'Module not responding — check 3.3V'],
          ],
        },
      },
      {
        heading: 'Serial console first contact',
        commands: [
          { label: 'open UART console (macOS)', code: 'ls /dev/tty.usb*\ntio /dev/tty.usbmodemXXXXXX -b 115200\n# 115200 8N1, no flow control\n# Connect BEFORE applying power to capture ROM messages' },
          { label: 'expected first output', code: '# ROM bootloader messages:\n# U-Boot SPL 2024.01-gXXXXXXX (May 2026 - 12:00:00 +0000)\n# Trying to boot from MMC2\n# ...\n# Hit any key to stop autoboot: 0' },
        ],
        warnings: [
          'AM62x UART debug is ttyS2 (WKUP UART0 in TI naming). If console is silent after power-on, verify boot mode switches — wrong boot mode silences the ROM completely.',
          'mmcblk1 vs mmcblk0: if SD card is inserted, eMMC and SD may enumerate in either order depending on boot phase. Check with "mmc list" in U-Boot if rootfs fails to mount.',
        ],
      },
    ],
  },
  {
    id: 'functional', phase: '11', title: 'Functional Validation', status: 'pending', tag: 'Validate', time: '~1 week',
    summary: 'AM62x full boot chain, IWR6843AOP radar bring-up, fall detection algorithm validation, and cross-repo integration tests.',
    sections: [
      {
        heading: 'AM62x boot validation',
        body: 'Boot chain: ROM → tiboot3.bin → tispl.bin → u-boot.img → kernel → rootfs. Refer to the ambientfirm /firmware runbook for full boot sequence debugging. All firmware steps 01–06 must be complete before EE functional validation.',
        commands: [
          { label: 'cross-repo: verify firmware build exists', code: 'ls ~/ti-am62x/workspace/deploy/\n# Must have: tiboot3.bin, tispl.bin, u-boot.img\n# Must have: Image, k3-am62-lp-sk-ambient.dtb' },
          { label: 'verify kernel on running board', code: 'uname -a\n# → Linux am62xx-evm 6.12.57+git-ti #1 SMP ...\ncat /proc/device-tree/model\n# → Texas Instruments AM62 LP SK\ndmesg | grep -i error | grep -v firmware\n# → should be clean' },
        ],
      },
      {
        heading: 'IWR6843AOP radar bring-up',
        commands: [
          { label: 'verify SPI link from AM62x to IWR6843AOP', code: '# From Linux on AM62x:\nls /dev/spidev*\n# → /dev/spidev0.0\n\n# Test radar self-test response:\n# Send mmWave SDK self-test frame over SPI\n# Expected: CPUID response 0x6843' },
          { label: 'check NRESET and boot GPIO state', code: '# Radar NRESET: driven HIGH = running, LOW = held in reset\ngpioget $(gpiodetect | grep -i ambient | head -1) 5\n# Expected: 1 (running)\n\n# IWR6843 HOST_IRQ: should be LOW when idle\ngpioget $(gpiodetect | grep -i ambient | head -1) 6\n# Expected: 0 (idle)' },
        ],
        warnings: [
          'IWR6843AOP requires 1.8V I/O from the host. If AM62x GPIO bank is at 3.3V, the radar SPI interface will be damaged. Verify PowerTree.SchDoc GPIO voltage domain configuration and measure with meter before applying.',
          'Radar firmware (mmWave SDK .bin) must be loaded over SPI before the radar can process frames. Refer to ambientfirm step 10 (Radar) for the bring-up sequence.',
        ],
      },
      {
        heading: 'Fall detection validation',
        checklist: [
          'Range-Doppler heatmap output verified at known fall distances (0.5m, 1.0m, 2.0m)',
          'False positive rate < 5% in a 10-min idle room test',
          'Fall detection latency < 500 ms from event to cloud notification',
          'Power consumption measured: active radar scan mode < 3W total system',
          'Wi-Fi connectivity: mTLS to AWS IoT Core verified with device certificate',
          'OTA update cycle tested end-to-end using Mender hosted',
        ],
      },
    ],
  },
  {
    id: 'evt-signoff', phase: '12', title: 'EVT Sign-Off', status: 'pending', tag: 'Validate', time: 'reference',
    summary: 'Design freeze criteria for EVT-0.1. DHF entries per 21 CFR §820.30. Risk management update per ISO 14971.',
    sections: [
      {
        heading: 'EVT exit criteria',
        checklist: [
          'All voltage rails nominal on all 3 EVT builds',
          'AM62x boots to Linux login on all 3 builds with custom kernel',
          'IWR6843AOP radar self-test passes on all 3 builds',
          'Fall detection algorithm running and logging events correctly',
          'Wi-Fi / cloud connectivity verified on at least 2 builds',
          'No DRC/ERC violations in Altium — zero unresolved',
          'BOM lifecycle confirmed — no EOL components',
          'EVT test report generated and signed by EE lead',
        ],
      },
      {
        heading: 'DHF entries required (§820.30)',
        table: {
          cols: ['DHF document', 'Path', 'Regulatory ref'],
          rows: [
            ['Design input requirements', 'docs/design-history/EVT-0.1/Design-Inputs.md',    '§820.30(c)'],
            ['Design outputs',           'docs/design-history/EVT-0.1/Design-Outputs.md',   '§820.30(d)'],
            ['DRC/ERC reports',          'docs/design-history/EVT-0.1/DRC-Report.html',     '§820.30(e) review'],
            ['EVT test report',          'docs/design-history/EVT-0.1/EVT-Test-Report.md',  '§820.30(e) verification'],
            ['Change log entry',         'docs/change-log.md → EVT-0.1 block',              '§820.181'],
            ['BOM snapshot',             'hardware/bom/EVT-0.1-BOM.csv',                    '§820.181'],
            ['Risk management update',   'docs/risk-management/EVT-0.1-FMEA.md',            'ISO 14971 §7'],
          ],
        },
      },
      {
        heading: 'Commit EVT-0.1 change log entry',
        commands: [
          { label: 'append to change log', code: '# docs/change-log.md — append EVT-0.1 block:\n\n## EVT-0.1 — 2026-Q2\n### Changes\n- Initial schematic and layout for AM62x + IWR6843AOP platform\n- OSD62x-PM selected as production SoC module (ADR-0002)\n- 8-layer stackup, HASL-LF surface finish\n\n### Verification\n- DRC/ERC: zero violations\n- Functional: [pending]\n\n### Regulatory\n- DHF entries committed per §820.30\n- FMEA updated per ISO 14971 §7' },
          { label: 'commit the full EVT record', code: 'git add docs/change-log.md docs/design-history/EVT-0.1/\ngit commit -m "dhf: EVT-0.1 sign-off — design freeze"\ngit push\ngit tag -a EVT-0.1 -m "EVT-0.1 design freeze"\ngit push origin EVT-0.1' },
        ],
        warnings: [
          'The git tag EVT-0.1 marks the exact Altium source state used to produce the fab Gerbers. Never force-push or modify commits after this tag is pushed — it is part of the DHF audit trail.',
          'DVT planning should begin at EVT sign-off, not after. Key DVT decisions: layer count change (8→10 for DDR density), surface finish upgrade (ENIG for fine-pitch pads), ICT fixture NRE approval.',
        ],
      },
    ],
  },
];

// ── Static data ────────────────────────────────────────────────────────────────

const HW_SPECS = [
  { label: 'SoC Module',  value: 'OSD62x-PM',    sub: 'AM6254 + 1 GB DDR4 · 500-ball BGA' },
  { label: 'Radar',       value: 'IWR6843AOP',   sub: '60 GHz · antenna-on-package' },
  { label: 'Revision',    value: 'EVT-0.1',      sub: 'Engineering Validation Test' },
  { label: 'Stackup',     value: '8-Layer',      sub: 'FR4 · 0.062" · HASL-LF' },
  { label: 'Standard',    value: '21 CFR 820',   sub: 'Design History File · §820.30' },
];

const CHECKLIST_ITEMS = [
  'Schematic completed and peer-reviewed',
  'Cross-repo nets verified (MCU ↔ Firmware ↔ Cloud)',
  'BOM exported: hardware/bom/EVT-0.1-BOM.csv',
  'Critical component lifecycle verified (IWR6843AOP, OSD62x-PM)',
  'PCB layout complete: 8-layer, BGA escape routed',
  'IWR6843AOP RF keep-out enforced (10 mm clear zone)',
  'DDR4 controlled impedance: 50Ω SE / 100Ω diff on L3',
  'DRC pass — zero violations in Altium',
  'ERC pass — zero unresolved electrical errors',
  'Gerbers exported: EVT-0.1.OutJob run',
  'Pick & Place (CPL) file generated',
  'Assembly drawing PDF exported',
  'Change log entry committed (docs/change-log.md)',
  'Fab order placed — impedance coupon requested',
  'Bare boards received — visual inspection pass',
  'SMT assembly complete',
  'X-ray BGA verification (OSD62x-PM)',
  'Power-on: all voltage rails nominal',
  'AM62x boots to Linux login',
  'IWR6843AOP radar self-test pass',
  'Fall detection algorithm validated',
  'EVT-0.1 DHF entries committed (§820.30)',
];

const CHECKLIST_DONE = new Set([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);

const OPEN_DECISIONS = [
  'Radar island QSPI flash: present or absent on radar island BOM — blocked on firmware radar boot mode decision (ambientfirm Step 17). Host-fed SPI = no QSPI; autonomous QSPI = flash present. Do not finalize radar island schematic or place fab order until boot mode is locked.',
  'Physical connectivity: wired Ethernet / Wi-Fi / BLE / cellular mix — drives antenna count, schematic additions, and regulatory/certification scope. Decide before BOM finalization.',
  'Layer count: 8-layer vs 10-layer HDI for OSD62x-PM BGA escape — decide before DVT layout',
  'Surface finish: upgrade HASL-LF → ENIG for DVT fine-pitch pads and BGA reliability',
  'IWR6843AOP enclosure keep-out: antenna clear zone vs metallic housing — enclosure design pending',
  'Test fixture strategy: ICT vs flying probe for EVT-0.1 (sample size too small for ICT NRE)',
  'USB-C ESD protection: individual TVS per CC/D+/D− vs integrated protection array (IEC 61000-4-2 L4)',
];

// ── Page component ─────────────────────────────────────────────────────────────

const { lsKey: LS_KEY, freezeKey: LS_FREEZE_KEY } = ENG_DOMAIN_BY_ID.ee;

export default function EEPage() {
  const [active, setActive]       = useState('schematic');
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [focusMode, setFocusMode] = useState(false);
  const [checked, setChecked]     = useState<Set<number>>(new Set(CHECKLIST_DONE));
  const [filterTag, setFilterTag] = useState('All');
  const [designFrozen, setDesignFrozen] = useState(false);
  const [frozenDate, setFrozenDate]     = useState<string | null>(null);
  const isMounted = useRef(false);
  const syncTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(LS_KEY);
      if (stored) setChecked(new Set(JSON.parse(stored)));
      const fz = localStorage.getItem(LS_FREEZE_KEY);
      if (fz) { const p = JSON.parse(fz); setDesignFrozen(true); setFrozenDate(p.date); }
    } catch { /* ignore */ }
    fetch('/api/eng/state').then(r => r.json()).then((all) => {
      const d = all['ee'];
      if (!d) return;
      if (Array.isArray(d.checked)) { setChecked(new Set(d.checked)); try { localStorage.setItem(LS_KEY, JSON.stringify(d.checked)); } catch { /* ignore */ } }
      if (typeof d.frozen === 'string') { setDesignFrozen(true); setFrozenDate(d.frozen); try { localStorage.setItem(LS_FREEZE_KEY, JSON.stringify({ frozen: true, date: d.frozen })); } catch { /* ignore */ } }
      else if (d.frozen === null) { setDesignFrozen(false); setFrozenDate(null); try { localStorage.removeItem(LS_FREEZE_KEY); } catch { /* ignore */ } }
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!isMounted.current) { isMounted.current = true; return; }
    if (syncTimer.current) clearTimeout(syncTimer.current);
    syncTimer.current = setTimeout(() => {
      fetch('/api/eng/state', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain: 'ee', checked: [...checked], frozen: designFrozen ? frozenDate : null }),
      }).catch(() => {});
    }, 800);
  }, [checked, designFrozen, frozenDate]);

  function toggleChecked(i: number) {
    setChecked(prev => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      try { localStorage.setItem(LS_KEY, JSON.stringify([...next])); } catch { /* ignore */ }
      return next;
    });
  }

  const navigate = useCallback((dir: 1 | -1) => {
    setActive(prev => {
      const idx = STEPS.findIndex(s => s.id === prev);
      const next = idx + dir;
      return next >= 0 && next < STEPS.length ? STEPS[next].id : prev;
    });
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) return;
      if (e.key === 'j') navigate(1);
      if (e.key === 'k') navigate(-1);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [navigate]);

  function toggleSection(key: string) {
    setCollapsed(p => ({ ...p, [key]: !p[key] }));
  }
  function expandAll()  { setCollapsed({}); }
  function collapseAll() {
    const all: Record<string, boolean> = {};
    step.sections.forEach((_, i) => { all[`${active}-${i}`] = true; });
    setCollapsed(prev => ({ ...prev, ...all }));
  }

  const TAGS = ['All', 'Design', 'Output', 'Build', 'Validate'];
  const visibleSteps = filterTag === 'All' ? STEPS : STEPS.filter(s => s.tag === filterTag);
  void visibleSteps;
  const step = STEPS.find(s => s.id === active)!;
  const stepIdx = STEPS.findIndex(s => s.id === active);
  const doneCount = checked.size;
  const ready = doneCount === CHECKLIST_ITEMS.length;
  const warnCounts: Record<string, number> = {};
  STEPS.forEach(s => {
    warnCounts[s.id] = s.sections.reduce((n, sec) => n + (sec.warnings?.length ?? 0), 0);
  });

  function isSectionOpen(key: string) {
    return focusMode ? true : collapsed[key] !== true;
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


  return (
    <>
    <style dangerouslySetInnerHTML={{__html: `
      @keyframes dfFlow {
        0%   { background-position: 0% 50%; }
        50%  { background-position: 100% 50%; }
        100% { background-position: 0% 50%; }
      }
      @keyframes dfGlow {
        0%, 100% { box-shadow: 0 0 0 2px rgba(5,150,105,0.18), 0 2px 8px rgba(5,150,105,0.10); }
        50%       { box-shadow: 0 0 0 5px rgba(5,150,105,0.28), 0 4px 24px rgba(5,150,105,0.20); }
      }
      .df-ready {
        background: linear-gradient(-45deg, #1D4ED8, #2563EB, #059669, #10B981, #1D4ED8);
        background-size: 300% 300%;
        animation: dfFlow 3s ease infinite;
        border: 1.5px solid transparent;
      }
      .df-ready .df-title { color: #ffffff; text-shadow: 0 1px 3px rgba(0,0,0,0.18); }
      .df-ready .df-sub   { color: rgba(255,255,255,0.82); }
      .df-frozen {
        background: linear-gradient(-45deg, #047857, #059669, #10B981, #34D399, #059669, #047857);
        background-size: 300% 300%;
        animation: dfFlow 4s ease infinite, dfGlow 2.5s ease-in-out infinite;
        border: 1.5px solid transparent;
      }
      .df-frozen .df-title { color: #ffffff; text-shadow: 0 1px 3px rgba(0,0,0,0.18); }
      .df-frozen .df-sub   { color: rgba(255,255,255,0.82); }
    `}} />
    <div className="app" style={{ background: '#f5f5f7', minHeight: '100vh', position: 'relative' }}>

      {/* ── Sidebar ── */}
      <aside style={{ background: '#FFFFFF', borderRight: '1px solid rgba(0,0,0,0.08)', padding: '22px 14px 28px', position: 'sticky', top: 0, height: '100vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 0, zIndex: 10, boxShadow: '2px 0 8px rgba(0,0,0,0.04)' }}>

        {/* Brand */}
        <div style={{ marginBottom: 18 }}>
          <Link href="/engineering" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 5, marginBottom: 10, padding: '3px 6px' }}>
            <svg width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M7.5 2L3.5 6L7.5 10" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            <span style={{ fontFamily: 'var(--mono)', fontSize: 9.5, letterSpacing: '0.12em', textTransform: 'uppercase' as const, color: '#9CA3AF' }}>Engineering</span>
          </Link>
          <Link href="/" style={{ textDecoration: 'none' }}>
            <div style={{ padding: '4px 6px', marginBottom: 14 }}>
              <span style={{ fontFamily: 'var(--serif)', fontWeight: 300, fontSize: 14, color: '#111827', letterSpacing: '-0.01em', lineHeight: 1.3 }}>
                Ambient <em style={{ color: '#6B7280' }}>Electrical</em>
              </span>
            </div>
          </Link>

          {/* Progress bar */}
          <div style={{ padding: '10px 12px', background: '#F8FAFC', border: '1px solid #E5E7EB', borderRadius: 10, marginBottom: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontFamily: 'var(--mono)', fontSize: 9.5, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#9CA3AF' }}>Progress</span>
              <span style={{ fontFamily: 'var(--mono)', fontSize: 9.5, color: '#059669', fontWeight: 600 }}>{doneCount}/{CHECKLIST_ITEMS.length}</span>
            </div>
            <div style={{ height: 5, borderRadius: 3, background: '#E5E7EB' }}>
              <div style={{ height: '100%', borderRadius: 3, background: 'linear-gradient(90deg, #059669, #2563EB)', width: `${(doneCount / CHECKLIST_ITEMS.length) * 100}%`, transition: 'width 0.4s ease' }} />
            </div>
          </div>

          {/* Tag filter */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, padding: '0 2px', marginBottom: 6 }}>
            {TAGS.map(tag => (
              <button key={tag} onClick={() => setFilterTag(tag)} style={{ padding: '3px 8px', borderRadius: 999, fontSize: 10.5, fontFamily: 'var(--mono)', cursor: 'pointer', border: filterTag === tag ? '1.5px solid #2563EB' : '1px solid #E5E7EB', background: filterTag === tag ? '#EFF6FF' : '#FFFFFF', color: filterTag === tag ? '#2563EB' : '#6B7280', transition: 'all 0.12s' }}>
                {tag}
              </button>
            ))}
          </div>
        </div>

        {/* Grouped nav */}
        <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {PIPELINE_PHASES.map(phase => {
            const phaseSteps = phase.ids
              .map(id => STEPS.find(s => s.id === id)!)
              .filter(s => filterTag === 'All' || s.tag === filterTag);
            if (phaseSteps.length === 0) return null;
            return (
              <div key={phase.label}>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 9.5, textTransform: 'uppercase', letterSpacing: '0.14em', color: '#9CA3AF', padding: '0 8px', marginBottom: 5 }}>{phase.label}</div>
                {phaseSteps.map(s => {
                  const sc = SC[s.status];
                  const isActive = active === s.id;
                  const warns = warnCounts[s.id] ?? 0;
                  return (
                    <button key={s.id} onClick={() => setActive(s.id)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px', borderRadius: 7, background: isActive ? '#EFF6FF' : 'transparent', border: isActive ? '1px solid #BFDBFE' : '1px solid transparent', cursor: 'pointer', textAlign: 'left', width: '100%', transition: 'all 0.12s', marginBottom: 1 }}>
                      <span style={{ fontFamily: 'var(--mono)', fontSize: 9.5, color: isActive ? '#2563EB' : '#9CA3AF', minWidth: 16, flexShrink: 0 }}>{s.phase}</span>
                      <span style={{ flex: 1, fontSize: 12, color: isActive ? '#111827' : '#374151', fontWeight: isActive ? 500 : 400, lineHeight: 1.3 }}>{s.title}</span>
                      {warns > 0 && (
                        <span title={`${warns} warning${warns > 1 ? 's' : ''}`} style={{ fontSize: 9, background: '#FEF9C3', color: '#A16207', borderRadius: 3, padding: '1px 5px', fontFamily: 'var(--mono)', flexShrink: 0 }}>⚠{warns}</span>
                      )}
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: sc.dot, flexShrink: 0 }} />
                    </button>
                  );
                })}
              </div>
            );
          })}
        </nav>

        {/* Footer */}
        <div style={{ marginTop: 16, paddingTop: 12, borderTop: '1px solid #F3F4F6' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 8 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#059669', flexShrink: 0 }} />
            <a href="https://github.com/ambientintel/ambientelectrical" target="_blank" rel="noopener noreferrer" style={{ fontFamily: 'var(--mono)', fontSize: 9.5, color: '#6B7280', textDecoration: 'none', letterSpacing: '0.04em' }}>ambientintel/ambientelectrical</a>
          </div>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            {(['j','k'] as const).map(k => (
              <kbd key={k} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 20, height: 20, borderRadius: 4, background: '#F9FAFB', border: '1px solid #E5E7EB', fontFamily: 'var(--mono)', fontSize: 11, color: '#6B7280', boxShadow: '0 1px 0 #D1D5DB' }}>{k}</kbd>
            ))}
            <span style={{ fontSize: 11, color: '#9CA3AF' }}>navigate steps</span>
          </div>
        </div>
      </aside>

      {/* ── Main ── */}
      <main style={{ padding: '24px 36px 60px', maxWidth: 1200, width: '100%', boxSizing: 'border-box', position: 'relative', zIndex: 1 }}>

        {/* Topbar */}
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', paddingBottom: 22, borderBottom: '1px solid rgba(0,0,0,0.08)', marginBottom: 22 }}>
          <div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '0.16em', color: '#9CA3AF', marginBottom: 7 }}>Ambient Intelligence · Hardware Design</div>
            <h1 style={{ fontFamily: 'var(--serif)', fontWeight: 300, fontSize: 40, lineHeight: 1.05, letterSpacing: '-0.02em', margin: 0, color: '#111827' }}>
              AM62x <em style={{ fontStyle: 'italic', color: '#6B7280' }}>Electrical</em>
            </h1>
            <p style={{ margin: '8px 0 0', color: '#6B7280', fontSize: 13.5, maxWidth: 500, lineHeight: 1.6 }}>
              Step-by-step EE validation for the IWR6843AOP + OSD62x-PM fall detection platform. EVT → DVT → PVT → MP.
            </p>
          </div>
          <a href="https://github.com/ambientintel/ambientelectrical" target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '8px 15px', borderRadius: 8, border: '1px solid #E5E7EB', background: '#FFFFFF', fontSize: 12, fontFamily: 'var(--mono)', color: '#374151', textDecoration: 'none', boxShadow: '0 1px 2px rgba(0,0,0,0.05)', flexShrink: 0 }}>
            <svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor" opacity={0.6}><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/></svg>
            ambientintel/ambientelectrical
          </a>
        </div>

        {/* Pipeline strip */}
        <div style={{ background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 12, padding: '14px 20px', marginBottom: 20, overflowX: 'auto', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <div style={{ display: 'flex', alignItems: 'stretch', gap: 0, minWidth: 'max-content' }}>
            {PIPELINE_PHASES.map((phase, pi) => (
              <div key={phase.label} style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: pi === 0 ? '0 24px 0 0' : '0 24px', borderRight: '1px solid #E5E7EB' }}>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 9.5, textTransform: 'uppercase', letterSpacing: '0.14em', color: '#9CA3AF' }}>{phase.label}</div>
                <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
                  {phase.ids.map((id, si) => {
                    const s = STEPS.find(x => x.id === id)!;
                    const sc = SC[s.status];
                    const isActive = active === id;
                    return (
                      <span key={id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0 }}>
                        {si > 0 && <span style={{ display: 'inline-block', width: 12, height: 1, background: '#E5E7EB', margin: '0 -2px', alignSelf: 'center' }} />}
                        <button onClick={() => setActive(id)} title={s.title} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, padding: '6px 8px', borderRadius: 7, border: isActive ? '1.5px solid #2563EB' : `1px solid ${sc.border}`, background: isActive ? '#EFF6FF' : sc.bg, cursor: 'pointer', transition: 'all 0.12s', minWidth: 44 }}>
                          <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: isActive ? '#2563EB' : '#6B7280', fontWeight: isActive ? 600 : 400 }}>{s.phase}</span>
                          <span style={{ width: 6, height: 6, borderRadius: '50%', background: sc.dot }} />
                        </button>
                      </span>
                    );
                  })}
                </div>
              </div>
            ))}

            {/* Design Freeze milestone */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, paddingLeft: 24 }}>
              {/* Arrow connector */}
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <div style={{ width: 24, height: 1, background: designFrozen ? 'linear-gradient(90deg,#E5E7EB,#059669)' : ready ? 'linear-gradient(90deg,#E5E7EB,#2563EB)' : '#E5E7EB' }} />
                <svg width="6" height="10" viewBox="0 0 6 10" fill="none" style={{ flexShrink: 0 }}>
                  <path d="M1 1l4 4-4 4" stroke={designFrozen ? '#059669' : ready ? '#2563EB' : '#D1D5DB'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 9.5, textTransform: 'uppercase', letterSpacing: '0.14em', color: designFrozen ? '#059669' : ready ? '#2563EB' : '#9CA3AF' }}>
                  {designFrozen ? 'Saved ✓' : 'Goal'}
                </div>
                <button
                  onClick={toggleFreeze}
                  className={designFrozen ? 'df-frozen' : ready ? 'df-ready' : ''}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 9,
                    padding: '8px 16px', borderRadius: 9,
                    cursor: ready || designFrozen ? 'pointer' : 'default',
                    // Only set static styles when no animated class is active
                    ...(!(designFrozen || ready) && { background: '#F9FAFB', border: '1.5px dashed #D1D5DB' }),
                    transition: 'all 0.25s',
                  }}
                >
                  {/* Snowflake icon */}
                  <svg className="df-icon" width="15" height="15" viewBox="0 0 16 16" fill="none">
                    {designFrozen || ready ? (
                      <>
                        <path d="M8 1v14M1 8h14M3.05 3.05l9.9 9.9M12.95 3.05l-9.9 9.9" stroke={designFrozen ? '#059669' : '#2563EB'} strokeWidth="1.6" strokeLinecap="round"/>
                        <circle cx="8" cy="8" r="2.2" fill={designFrozen ? '#059669' : '#2563EB'} fillOpacity="0.25"/>
                      </>
                    ) : (
                      <>
                        <rect x="4" y="7" width="8" height="7" rx="1.5" stroke="#9CA3AF" strokeWidth="1.4"/>
                        <path d="M5.5 7V5a2.5 2.5 0 015 0v2" stroke="#9CA3AF" strokeWidth="1.4" strokeLinecap="round"/>
                      </>
                    )}
                  </svg>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 1, textAlign: 'left' }}>
                    <span className="df-title" style={{ fontFamily: 'var(--sans)', fontSize: 12, fontWeight: 600, color: designFrozen ? '#059669' : ready ? '#1D4ED8' : '#9CA3AF', letterSpacing: '-0.01em', lineHeight: 1.2 }}>
                      {designFrozen ? 'Frozen ✓' : 'Design Freeze'}
                    </span>
                    <span className="df-sub" style={{ fontFamily: 'var(--mono)', fontSize: 9.5, color: designFrozen ? '#059669' : ready ? '#2563EB' : '#9CA3AF' }}>
                      {designFrozen ? (frozenDate ? `Saved ${frozenDate}` : 'EVT-0.1 locked') : ready ? 'Ready — click to freeze' : `${Math.round((doneCount / CHECKLIST_ITEMS.length) * 100)}% complete`}
                    </span>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Hardware spec row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10, marginBottom: 22 }}>
          {HW_SPECS.map(spec => (
            <div key={spec.label} style={{ padding: '13px 15px', background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 10, boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 9.5, textTransform: 'uppercase', letterSpacing: '0.14em', color: '#9CA3AF', marginBottom: 4 }}>{spec.label}</div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 12.5, color: '#111827', fontWeight: 600, marginBottom: 3 }}>{spec.value}</div>
              <div style={{ fontSize: 11, color: '#6B7280', lineHeight: 1.4 }}>{spec.sub}</div>
            </div>
          ))}
        </div>

        {/* Main two-column */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 268px', gap: 22, alignItems: 'start' }}>

          {/* Step detail */}
          <div>
            {/* Step header */}
            {(() => {
              const sc = SC[step.status];
              const tagStyle = TAG_STYLE[step.tag] || { bg: '#F3F4F6', color: '#374151' };
              return (
                <div style={{ padding: '20px 24px', background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 14, marginBottom: 14, boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: '#2563EB', background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 4, padding: '2px 8px' }}>STEP {step.phase}</div>
                      <span style={{ padding: '2px 8px', borderRadius: 999, fontSize: 10.5, fontFamily: 'var(--mono)', background: tagStyle.bg, color: tagStyle.color }}>{step.tag}</span>
                      {step.time && <span style={{ padding: '2px 8px', borderRadius: 999, fontSize: 10.5, fontFamily: 'var(--mono)', background: '#F8FAFC', color: '#6B7280', border: '1px solid #E5E7EB' }}>⏱ {step.time}</span>}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <button onClick={() => setFocusMode(f => !f)} title="Focus mode — show commands only" style={{ padding: '4px 10px', borderRadius: 6, border: focusMode ? '1.5px solid #2563EB' : '1px solid #E5E7EB', background: focusMode ? '#EFF6FF' : '#FFFFFF', color: focusMode ? '#2563EB' : '#6B7280', fontSize: 11, fontFamily: 'var(--mono)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, transition: 'all 0.12s' }}>
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M1 6h2M9 6h2M6 1v2M6 9v2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/><circle cx="6" cy="6" r="2" stroke="currentColor" strokeWidth="1.4"/></svg>
                        {focusMode ? 'Focus ON' : 'Focus'}
                      </button>
                      <button onClick={expandAll} style={{ padding: '4px 9px', borderRadius: 6, border: '1px solid #E5E7EB', background: '#FFFFFF', color: '#6B7280', fontSize: 11, fontFamily: 'var(--mono)', cursor: 'pointer' }}>Expand all</button>
                      <button onClick={collapseAll} style={{ padding: '4px 9px', borderRadius: 6, border: '1px solid #E5E7EB', background: '#FFFFFF', color: '#6B7280', fontSize: 11, fontFamily: 'var(--mono)', cursor: 'pointer' }}>Collapse all</button>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 999, background: sc.bg, border: `1px solid ${sc.border}` }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: sc.dot }} />
                        <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: sc.color, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{sc.label}</span>
                      </div>
                    </div>
                  </div>
                  <h2 style={{ fontFamily: 'var(--serif)', fontWeight: 300, fontSize: 26, margin: '0 0 8px', color: '#111827', letterSpacing: '-0.01em' }}>{step.title}</h2>
                  <p style={{ margin: 0, color: '#4B5563', fontSize: 13.5, lineHeight: 1.65 }}>{step.summary}</p>
                </div>
              );
            })()}

            {/* Sections */}
            {step.sections.map((sec, si) => {
              const key = `${step.id}-${si}`;
              const isOpen = isSectionOpen(key);
              const hasContent = !!(sec.commands?.length || sec.artifacts?.length || sec.warnings?.length || sec.table || sec.checklist);
              const hasOnlyBody = !hasContent && !!sec.body;
              if (focusMode && hasOnlyBody) return null;

              return (
                <div key={key} style={{ marginBottom: 10, background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}>
                  {sec.heading && (
                    <button onClick={() => toggleSection(key)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '11px 18px', background: isOpen ? '#FAFBFC' : '#FFFFFF', cursor: 'pointer', border: 0, borderBottom: isOpen ? '1px solid rgba(0,0,0,0.07)' : 'none', textAlign: 'left' }}>
                      <span style={{ display: 'inline-block', width: 3, height: 16, borderRadius: 2, background: isOpen ? '#2563EB' : '#D1D5DB', flexShrink: 0, transition: 'background 0.15s' }} />
                      <span style={{ flex: 1, fontFamily: 'var(--mono)', fontSize: 11, color: '#374151', letterSpacing: '0.05em', textTransform: 'uppercase', fontWeight: 500 }}>{sec.heading}</span>
                      <span style={{ color: '#9CA3AF', fontSize: 13, transform: isOpen ? 'rotate(0deg)' : 'rotate(-90deg)', transition: 'transform 0.18s' }}>▾</span>
                    </button>
                  )}
                  {isOpen && (
                    <div style={{ padding: '16px 18px 18px' }}>
                      {!focusMode && sec.body && <p style={{ margin: '0 0 14px', color: '#4B5563', fontSize: 13.5, lineHeight: 1.7 }}>{sec.body}</p>}

                      {sec.commands?.map((cmd, ci) => (
                        <div key={ci} style={{ marginBottom: 12 }}>
                          {cmd.label && <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: '#9CA3AF', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 5 }}>$ {cmd.label}</div>}
                          <div style={{ position: 'relative', background: '#1E2433', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 9, padding: '14px 48px 14px 18px' }}>
                            <pre style={{ margin: 0, fontFamily: 'var(--mono)', fontSize: 12.5, color: '#CBD5E1', lineHeight: 1.75, overflowX: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>{cmd.code}</pre>
                            <CopyBtn code={cmd.code} />
                          </div>
                        </div>
                      ))}

                      {sec.artifacts && sec.artifacts.length > 0 && (
                        <div style={{ marginTop: 14 }}>
                          <div style={{ fontFamily: 'var(--mono)', fontSize: 9.5, color: '#9CA3AF', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 7 }}>Artifacts</div>
                          {sec.artifacts.map((a, ai) => (
                            <div key={ai} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '9px 13px', background: '#F0F7FF', border: '1px solid #BFDBFE', borderRadius: 8, marginBottom: 6 }}>
                              <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: '#2563EB', flexShrink: 0, marginTop: 2 }}>▸</span>
                              <div style={{ flex: 1 }}>
                                <div style={{ fontFamily: 'var(--mono)', fontSize: 11.5, color: '#1D4ED8', marginBottom: 2 }}>{a.file}</div>
                                <div style={{ fontSize: 13, color: '#4B5563', lineHeight: 1.5 }}>{a.role}</div>
                              </div>
                              {a.size && <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: '#9CA3AF', flexShrink: 0 }}>{a.size}</span>}
                            </div>
                          ))}
                        </div>
                      )}

                      {sec.table && (
                        <div style={{ marginTop: 14, borderRadius: 9, border: '1px solid rgba(0,0,0,0.08)', overflow: 'hidden' }}>
                          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                            <thead>
                              <tr style={{ background: '#F8FAFC' }}>
                                {sec.table.cols.map((col, ci) => (
                                  <th key={ci} style={{ fontFamily: 'var(--mono)', fontSize: 9.5, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#6B7280', padding: '9px 13px', textAlign: 'left', borderBottom: '1px solid rgba(0,0,0,0.08)' }}>{col}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {sec.table.rows.map((row, ri) => (
                                <tr key={ri} style={{ borderBottom: ri < sec.table!.rows.length - 1 ? '1px solid rgba(0,0,0,0.05)' : 'none' }}>
                                  {row.map((cell, ci) => (
                                    <td key={ci} style={{ padding: '9px 13px', color: ci === 0 ? '#1E293B' : '#4B5563', fontFamily: ci === 0 ? 'var(--mono)' : 'inherit', fontSize: ci === 0 ? 12 : 13, lineHeight: 1.55, verticalAlign: 'top' }}>{cell}</td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}

                      {!focusMode && sec.checklist && (
                        <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 7 }}>
                          {sec.checklist.map((item, ii) => (
                            <div key={ii} style={{ display: 'flex', gap: 10, padding: '8px 12px', background: '#F8FAFC', border: '1px solid rgba(0,0,0,0.07)', borderRadius: 7 }}>
                              <span style={{ color: '#2563EB', fontSize: 12, flexShrink: 0, marginTop: 1 }}>◆</span>
                              <span style={{ fontSize: 13, color: '#374151', lineHeight: 1.55 }}>{item}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {sec.warnings?.map((w, wi) => (
                        <div key={wi} style={{ display: 'flex', gap: 10, padding: '10px 13px', background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 8, marginTop: 9 }}>
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
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 22, paddingTop: 16, borderTop: '1px solid rgba(0,0,0,0.08)' }}>
              {stepIdx > 0
                ? <button onClick={() => setActive(STEPS[stepIdx - 1].id)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', border: '1px solid #E5E7EB', borderRadius: 8, background: '#FFFFFF', color: '#374151', fontSize: 13, cursor: 'pointer', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                    ← <kbd style={{ fontFamily: 'var(--mono)', fontSize: 10, color: '#9CA3AF', background: 'none', border: 0, padding: 0 }}>k</kbd> {STEPS[stepIdx - 1].title}
                  </button>
                : <div />}
              {stepIdx < STEPS.length - 1
                ? <button onClick={() => setActive(STEPS[stepIdx + 1].id)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', border: '1px solid #E5E7EB', borderRadius: 8, background: '#FFFFFF', color: '#374151', fontSize: 13, cursor: 'pointer', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                    {STEPS[stepIdx + 1].title} <kbd style={{ fontFamily: 'var(--mono)', fontSize: 10, color: '#9CA3AF', background: 'none', border: 0, padding: 0 }}>j</kbd> →
                  </button>
                : <div />}
            </div>
          </div>

          {/* Right panel */}
          <div style={{ position: 'sticky', top: 24 }}>

            {/* Interactive checklist */}
            <div style={{ padding: '16px 16px 14px', background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 14, boxShadow: '0 1px 4px rgba(0,0,0,0.05)', marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 9.5, textTransform: 'uppercase', letterSpacing: '0.14em', color: '#9CA3AF' }}>EVT Checklist</div>
                <button onClick={() => { setChecked(new Set(CHECKLIST_DONE)); try { localStorage.setItem(LS_KEY, JSON.stringify([...CHECKLIST_DONE])); } catch { /* ignore */ } }} style={{ fontFamily: 'var(--mono)', fontSize: 9.5, color: '#9CA3AF', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>reset</button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                {CHECKLIST_ITEMS.map((item, i) => {
                  const done = checked.has(i);
                  return (
                    <button key={i} onClick={() => toggleChecked(i)} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, background: 'none', border: 'none', cursor: 'pointer', padding: 0, textAlign: 'left' }}>
                      <div style={{ width: 15, height: 15, borderRadius: 3, border: done ? 'none' : '1.5px solid #D1D5DB', background: done ? '#059669' : 'transparent', flexShrink: 0, marginTop: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' }}>
                        {done && <svg width="9" height="7" viewBox="0 0 9 7" fill="none"><path d="M1 3.5L3 5.5L8 1" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                      </div>
                      <span style={{ fontSize: 11.5, color: done ? '#374151' : '#9CA3AF', lineHeight: 1.45, textDecoration: done ? 'line-through' : 'none', textDecorationColor: '#D1D5DB' }}>{item}</span>
                    </button>
                  );
                })}
              </div>
              <div style={{ marginTop: 14, paddingTop: 11, borderTop: '1px solid rgba(0,0,0,0.07)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                  <span style={{ fontFamily: 'var(--mono)', fontSize: 9.5, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.12em' }}>Complete</span>
                  <span style={{ fontFamily: 'var(--mono)', fontSize: 9.5, color: '#059669', fontWeight: 600 }}>{Math.round((doneCount / CHECKLIST_ITEMS.length) * 100)}%</span>
                </div>
                <div style={{ height: 4, borderRadius: 2, background: '#E5E7EB' }}>
                  <div style={{ height: '100%', borderRadius: 2, background: 'linear-gradient(90deg, #059669, #2563EB)', width: `${(doneCount / CHECKLIST_ITEMS.length) * 100}%`, transition: 'width 0.3s ease' }} />
                </div>
              </div>
            </div>

            {/* Open decisions */}
            <div style={{ padding: '14px 16px', background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 14 }}>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 9.5, textTransform: 'uppercase', letterSpacing: '0.14em', color: '#D97706', marginBottom: 11 }}>Open Decisions</div>
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
