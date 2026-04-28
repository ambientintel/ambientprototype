export type Lifecycle = 'Active' | 'NRND' | 'EOL' | 'Obsolete';
export type Category = 'Sensor' | 'MCU' | 'Power' | 'Wireless' | 'Passive' | 'Connector' | 'Mechanical' | 'LED' | 'Memory' | 'Antenna';

export interface Part {
  pn: string;           // internal part number
  rev: string;
  description: string;
  category: Category;
  mpn: string;          // manufacturer part number
  manufacturer: string;
  lifecycle: Lifecycle;
  unitCost: number;
  stock: number;
  reorderPoint: number;
  altMpn?: string;
}

export interface BomLine {
  pn: string;
  qty: number;
  designator: string;
  notes?: string;
  children?: BomLine[];
}

export interface Assembly {
  pn: string;
  rev: string;
  description: string;
  bom: BomLine[];
}

export interface BuildOrder {
  id: string;
  assembly: string;
  assemblyRev: string;
  qty: number;
  targetDate: string;
  status: 'Draft' | 'Released' | 'In Progress' | 'Complete';
  shortage: boolean;
}

export const PARTS: Part[] = [
  {
    pn: 'AMB-IC-001',
    rev: 'A',
    description: '60 GHz mmWave Radar Sensor SoC',
    category: 'Sensor',
    mpn: 'IWR6843ISK',
    manufacturer: 'Texas Instruments',
    lifecycle: 'Active',
    unitCost: 18.50,
    stock: 42,
    reorderPoint: 20,
  },
  {
    pn: 'AMB-IC-002',
    rev: 'A',
    description: 'ARM Cortex-M33 Microcontroller, 512KB Flash',
    category: 'MCU',
    mpn: 'STM32U585CIT6',
    manufacturer: 'STMicroelectronics',
    lifecycle: 'Active',
    unitCost: 4.12,
    stock: 120,
    reorderPoint: 50,
  },
  {
    pn: 'AMB-IC-003',
    rev: 'A',
    description: 'Wi-Fi 6 + BLE 5.2 Combo Module',
    category: 'Wireless',
    mpn: 'NORA-W10-00B',
    manufacturer: 'u-blox',
    lifecycle: 'Active',
    unitCost: 6.75,
    stock: 85,
    reorderPoint: 30,
  },
  {
    pn: 'AMB-IC-004',
    rev: 'B',
    description: 'Multi-Rail PMIC, 4x Buck, 2x LDO',
    category: 'Power',
    mpn: 'TPS65219RGPRHBR',
    manufacturer: 'Texas Instruments',
    lifecycle: 'Active',
    unitCost: 2.88,
    stock: 200,
    reorderPoint: 75,
  },
  {
    pn: 'AMB-IC-005',
    rev: 'A',
    description: '3.3V 300mA Ultra-Low Noise LDO',
    category: 'Power',
    mpn: 'LP5912-3.3DRVR',
    manufacturer: 'Texas Instruments',
    lifecycle: 'Active',
    unitCost: 0.72,
    stock: 500,
    reorderPoint: 100,
  },
  {
    pn: 'AMB-IC-006',
    rev: 'A',
    description: '32Mb NOR Flash, SPI, 3.3V',
    category: 'Memory',
    mpn: 'W25Q32JVSSIQ',
    manufacturer: 'Winbond',
    lifecycle: 'Active',
    unitCost: 0.58,
    stock: 300,
    reorderPoint: 100,
  },
  {
    pn: 'AMB-IC-007',
    rev: 'A',
    description: 'USB-C PD Controller, 15W',
    category: 'Power',
    mpn: 'FUSB307BMPX',
    manufacturer: 'onsemi',
    lifecycle: 'NRND',
    unitCost: 1.95,
    stock: 60,
    reorderPoint: 50,
    altMpn: 'HUSB311A',
  },
  {
    pn: 'AMB-IC-008',
    rev: 'A',
    description: 'Ambient Light + Proximity Sensor, I2C',
    category: 'Sensor',
    mpn: 'VCNL4040M3OE',
    manufacturer: 'Vishay',
    lifecycle: 'Active',
    unitCost: 0.95,
    stock: 150,
    reorderPoint: 50,
  },
  {
    pn: 'AMB-PA-001',
    rev: 'A',
    description: '100Ω 0402 1% Resistor',
    category: 'Passive',
    mpn: 'RC0402FR-07100RL',
    manufacturer: 'Yageo',
    lifecycle: 'Active',
    unitCost: 0.004,
    stock: 10000,
    reorderPoint: 2000,
  },
  {
    pn: 'AMB-PA-002',
    rev: 'A',
    description: '10kΩ 0402 1% Resistor',
    category: 'Passive',
    mpn: 'RC0402FR-0710KL',
    manufacturer: 'Yageo',
    lifecycle: 'Active',
    unitCost: 0.004,
    stock: 10000,
    reorderPoint: 2000,
  },
  {
    pn: 'AMB-PA-003',
    rev: 'A',
    description: '100nF 0402 X5R 10V Capacitor',
    category: 'Passive',
    mpn: 'GRM155R61A104KA01D',
    manufacturer: 'Murata',
    lifecycle: 'Active',
    unitCost: 0.006,
    stock: 20000,
    reorderPoint: 5000,
  },
  {
    pn: 'AMB-PA-004',
    rev: 'A',
    description: '10µF 0805 X5R 10V Capacitor',
    category: 'Passive',
    mpn: 'GRM219R61A106KE44D',
    manufacturer: 'Murata',
    lifecycle: 'Active',
    unitCost: 0.045,
    stock: 5000,
    reorderPoint: 1000,
  },
  {
    pn: 'AMB-PA-005',
    rev: 'A',
    description: '10µH 20% 1.8A Inductor, 4020',
    category: 'Passive',
    mpn: 'IHLP4040DZERR10M11',
    manufacturer: 'Vishay Dale',
    lifecycle: 'Active',
    unitCost: 0.38,
    stock: 500,
    reorderPoint: 100,
  },
  {
    pn: 'AMB-CN-001',
    rev: 'A',
    description: 'USB-C Receptacle, 24-pin, SMT',
    category: 'Connector',
    mpn: 'UJ20-C-H-G-SMT-TR',
    manufacturer: 'CUI Devices',
    lifecycle: 'Active',
    unitCost: 0.82,
    stock: 200,
    reorderPoint: 75,
  },
  {
    pn: 'AMB-CN-002',
    rev: 'A',
    description: '10-pin 1.0mm FPC Connector, Bottom Contact',
    category: 'Connector',
    mpn: 'FH12-10S-0.5SH(55)',
    manufacturer: 'Hirose',
    lifecycle: 'Active',
    unitCost: 0.44,
    stock: 300,
    reorderPoint: 75,
  },
  {
    pn: 'AMB-AN-001',
    rev: 'A',
    description: '60 GHz Patch Antenna Array, PCB-integrated',
    category: 'Antenna',
    mpn: 'INTERNAL',
    manufacturer: 'Ambient Intelligence',
    lifecycle: 'Active',
    unitCost: 0,
    stock: 999,
    reorderPoint: 0,
  },
  {
    pn: 'AMB-LED-001',
    rev: 'A',
    description: 'RGB LED, 0606, Common Anode',
    category: 'LED',
    mpn: 'CLMVC-FKA-CFHEHLAAM893G253',
    manufacturer: 'Cree',
    lifecycle: 'NRND',
    unitCost: 0.18,
    stock: 800,
    reorderPoint: 200,
    altMpn: 'LTST-C19HE2WT',
  },
  {
    pn: 'AMB-MEC-001',
    rev: 'A',
    description: 'Enclosure, ABS, Wall-Mount, White',
    category: 'Mechanical',
    mpn: 'AMB-ENC-WM-001',
    manufacturer: 'Ambient Intelligence',
    lifecycle: 'Active',
    unitCost: 4.20,
    stock: 50,
    reorderPoint: 20,
  },
  {
    pn: 'AMB-MEC-002',
    rev: 'A',
    description: 'Mounting Bracket, Powder-Coated Steel',
    category: 'Mechanical',
    mpn: 'AMB-BKT-WM-001',
    manufacturer: 'Ambient Intelligence',
    lifecycle: 'Active',
    unitCost: 1.85,
    stock: 50,
    reorderPoint: 20,
  },
];

export const ASSEMBLIES: Assembly[] = [
  {
    pn: 'AMB-ASM-001',
    rev: 'EVT-0.1',
    description: 'Ambient Sensor Unit — Main PCB Assembly',
    bom: [
      { pn: 'AMB-IC-001', qty: 1, designator: 'U1', notes: 'Core radar SoC' },
      { pn: 'AMB-IC-002', qty: 1, designator: 'U2' },
      { pn: 'AMB-IC-003', qty: 1, designator: 'U3' },
      { pn: 'AMB-IC-004', qty: 1, designator: 'U4' },
      { pn: 'AMB-IC-005', qty: 2, designator: 'U5, U6' },
      { pn: 'AMB-IC-006', qty: 1, designator: 'U7' },
      { pn: 'AMB-IC-007', qty: 1, designator: 'U8', notes: 'NRND — eval alternate' },
      { pn: 'AMB-IC-008', qty: 1, designator: 'U9' },
      { pn: 'AMB-PA-001', qty: 24, designator: 'R1–R24' },
      { pn: 'AMB-PA-002', qty: 18, designator: 'R25–R42' },
      { pn: 'AMB-PA-003', qty: 86, designator: 'C1–C86' },
      { pn: 'AMB-PA-004', qty: 22, designator: 'C87–C108' },
      { pn: 'AMB-PA-005', qty: 6,  designator: 'L1–L6' },
      { pn: 'AMB-CN-001', qty: 1, designator: 'J1' },
      { pn: 'AMB-CN-002', qty: 1, designator: 'J2' },
      { pn: 'AMB-AN-001', qty: 1, designator: 'ANT1' },
      { pn: 'AMB-LED-001', qty: 1, designator: 'LED1', notes: 'NRND — confirm alternate' },
    ],
  },
  {
    pn: 'AMB-ASM-002',
    rev: 'EVT-0.1',
    description: 'Ambient Sensor Unit — Finished Device (Top-Level)',
    bom: [
      {
        pn: 'AMB-ASM-001',
        qty: 1,
        designator: 'PCBA',
        notes: 'Main PCB sub-assembly',
        children: [
          { pn: 'AMB-IC-001', qty: 1, designator: 'U1' },
          { pn: 'AMB-IC-002', qty: 1, designator: 'U2' },
          { pn: 'AMB-IC-003', qty: 1, designator: 'U3' },
          { pn: 'AMB-IC-007', qty: 1, designator: 'U8', notes: 'NRND' },
          { pn: 'AMB-LED-001', qty: 1, designator: 'LED1', notes: 'NRND' },
        ],
      },
      { pn: 'AMB-MEC-001', qty: 1, designator: 'ENC1' },
      { pn: 'AMB-MEC-002', qty: 1, designator: 'BKT1' },
    ],
  },
];

export const BUILD_ORDERS: BuildOrder[] = [
  { id: 'BO-0001', assembly: 'AMB-ASM-002', assemblyRev: 'EVT-0.1', qty: 10, targetDate: '2026-05-15', status: 'In Progress', shortage: false },
  { id: 'BO-0002', assembly: 'AMB-ASM-002', assemblyRev: 'EVT-0.1', qty: 25, targetDate: '2026-06-30', status: 'Draft',       shortage: true },
  { id: 'BO-0003', assembly: 'AMB-ASM-001', assemblyRev: 'EVT-0.1', qty: 50, targetDate: '2026-07-15', status: 'Released',    shortage: false },
];
