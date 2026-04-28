export type Lifecycle = 'Active' | 'NRND' | 'EOL' | 'Obsolete';
export type Category =
  | 'Sensor' | 'Processor' | 'Power' | 'Interface' | 'Logic' | 'Memory'
  | 'Capacitor' | 'Resistor' | 'Inductor' | 'Connector' | 'LED' | 'Diode'
  | 'Switch' | 'Crystal' | 'Test Point' | 'MOSFET';

export interface Part {
  pn: string;
  rev: string;
  description: string;
  category: Category;
  mpn: string;
  manufacturer: string;
  lifecycle: Lifecycle;
  unitCost: number | null;
  priceSource: 'csv' | 'researched' | null;
  stock: number | null;
  supplier?: string;
  supplierPn?: string;
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
  // ── ICs ──────────────────────────────────────────────────────────────────
  {
    pn: 'AMB-IC-001', rev: 'A',
    description: '60 GHz mmWave Radar Sensor SoC, BGA-180',
    category: 'Sensor', mpn: 'XI6843ARQGALP', manufacturer: 'Texas Instruments',
    lifecycle: 'Active', unitCost: 39.73, priceSource: 'researched', stock: null,
    supplier: 'DigiKey', supplierPn: '296-IWR6843ARQGALPR-ND',
  },
  {
    pn: 'AMB-IC-002', rev: 'A',
    description: '4-A + 2.5-A + Two 1.5-A Buck Converters, VQFN-HR-26',
    category: 'Power', mpn: 'LP87524JRNFRQ1', manufacturer: 'Texas Instruments',
    lifecycle: 'Active', unitCost: 5.44, priceSource: 'researched', stock: null,
    supplier: 'DigiKey', supplierPn: '296-51418-1-ND',
  },
  {
    pn: 'AMB-IC-003', rev: 'A',
    description: 'USB to Dual UART Bridge, I/O Controller',
    category: 'Interface', mpn: 'CP2105-F01-GMR', manufacturer: 'Silicon Labs',
    lifecycle: 'Active', unitCost: 5.12, priceSource: 'researched', stock: null,
    supplier: 'DigiKey', supplierPn: 'CP2105-F01-GMRCT-ND',
  },
  {
    pn: 'AMB-IC-004', rev: 'A',
    description: 'Dual 10-Ω SPDT Analog Switch, UQFN-10',
    category: 'Interface', mpn: 'TS5A23157RSER', manufacturer: 'Texas Instruments',
    lifecycle: 'Active', unitCost: 0.50, priceSource: 'researched', stock: null,
    supplier: 'DigiKey', supplierPn: '296-21919-1-ND',
  },
  {
    pn: 'AMB-IC-005', rev: 'A',
    description: 'Ultra Low Power 16Mbit SPI NOR Flash, SON-8',
    category: 'Memory', mpn: 'MX25R1635FZUIH0', manufacturer: 'Macronix',
    lifecycle: 'Active', unitCost: 1.25, priceSource: 'researched', stock: null,
    supplier: 'Mouser', supplierPn: '95-25R1635FZUIH0TR',
  },
  {
    pn: 'AMB-IC-006', rev: 'A',
    description: 'Low-Voltage 8-Bit I2C / SMBus I/O Expander, UQFN-16',
    category: 'Interface', mpn: 'TCA6408ARSVR', manufacturer: 'Texas Instruments',
    lifecycle: 'Active', unitCost: 0.80, priceSource: 'researched', stock: null,
    supplier: 'DigiKey', supplierPn: '296-24328-1-ND',
  },
  {
    pn: 'AMB-IC-007', rev: 'A',
    description: '9-DOF IMU — Accelerometer / Gyroscope / Magnetometer, I2C, 32-bit',
    category: 'Sensor', mpn: 'BNO085', manufacturer: 'Bosch Sensortec',
    lifecycle: 'Active', unitCost: 13.57, priceSource: 'researched', stock: null,
    supplier: 'DigiKey', supplierPn: '1888-1006-1-ND',
  },
  {
    pn: 'AMB-IC-008', rev: 'A',
    description: 'AND Gate, Single Channel, 6-SON (1×1)',
    category: 'Logic', mpn: 'SN74LVC1G11DSFR', manufacturer: 'Texas Instruments',
    lifecycle: 'Active', unitCost: 0.43, priceSource: 'researched', stock: null,
    supplier: 'DigiKey', supplierPn: '595-SN74LVC1G11DSFR',
  },
  {
    pn: 'AMB-IC-009', rev: 'A',
    description: '8KB I2C Serial EEPROM, TSOT-23',
    category: 'Memory', mpn: 'CAT24C08TDI-GT3', manufacturer: 'onsemi',
    lifecycle: 'Active', unitCost: 0.36, priceSource: 'researched', stock: null,
    supplier: 'DigiKey', supplierPn: '863-CAT24C08TDI-GT3',
  },
  {
    pn: 'AMB-IC-010', rev: 'A',
    description: 'Automotive ±0.5°C Temperature Sensor, I2C/SMBus, SOT-23-6',
    category: 'Sensor', mpn: 'TMP112AQDRLRQ1', manufacturer: 'Texas Instruments',
    lifecycle: 'Active', unitCost: 1.51, priceSource: 'researched', stock: null,
    supplier: 'DigiKey', supplierPn: '296-47223-1-ND',
  },
  {
    pn: 'AMB-IC-011', rev: 'A',
    description: 'Octavo ST Processor SiP — STM32MP1 + DDR3L 512 MB',
    category: 'Processor', mpn: 'OSD32MP157C-512M-BAA', manufacturer: 'Octavo Systems',
    lifecycle: 'Active', unitCost: 51.15, priceSource: 'researched', stock: null,
    supplier: 'DigiKey', supplierPn: '1676-OSD32MP157C-512M-BAA-ND',
  },
  // ── Capacitors ───────────────────────────────────────────────────────────
  {
    pn: 'AMB-CAP-001', rev: 'A',
    description: 'CAP CERM 10 µF 10 V ±20% X5R 0402',
    category: 'Capacitor', mpn: 'CL05A106MP5NUNC', manufacturer: 'Samsung',
    lifecycle: 'Active', unitCost: 0.15, priceSource: 'researched', stock: null,
    supplier: 'DigiKey', supplierPn: '1276-1450-1-ND',
  },
  {
    pn: 'AMB-CAP-002', rev: 'A',
    description: 'CAP CERM 0.22 µF 10 V ±20% X5R 0201',
    category: 'Capacitor', mpn: 'LMK063BJ224MP-F', manufacturer: 'Taiyo Yuden',
    lifecycle: 'Active', unitCost: 0.044, priceSource: 'csv', stock: null,
    supplier: 'Mouser', supplierPn: '963-LMK063BJ224MP-F',
  },
  {
    pn: 'AMB-CAP-003', rev: 'A',
    description: 'CAP CERM 2.2 µF 6.3 V ±20% X5R 0201',
    category: 'Capacitor', mpn: 'CL03A225MQ3CRNC', manufacturer: 'Samsung',
    lifecycle: 'Active', unitCost: 0.22, priceSource: 'researched', stock: null,
    supplier: 'DigiKey', supplierPn: '1276-6870-1-ND',
  },
  {
    pn: 'AMB-CAP-004', rev: 'A',
    description: 'CAP CERM 0.047 µF 16 V ±10% X5R 0201',
    category: 'Capacitor', mpn: 'GRM033R61C473KE84D', manufacturer: 'Murata',
    lifecycle: 'Active', unitCost: 0.10, priceSource: 'csv', stock: null,
    supplier: 'DigiKey', supplierPn: '490-7227-1-ND',
  },
  {
    pn: 'AMB-CAP-005', rev: 'A',
    description: 'CAP CERM 1 µF 6.3 V ±10% X6S 0402',
    category: 'Capacitor', mpn: 'CGB2A1X6S0J105K033BC', manufacturer: 'TDK',
    lifecycle: 'EOL', unitCost: 0.14, priceSource: 'csv', stock: null,
    supplier: 'DigiKey', supplierPn: '445-13189-1-ND',
  },
  {
    pn: 'AMB-CAP-006', rev: 'A',
    description: 'CAP CERM 0.1 µF 35 V X5R 10% 0201',
    category: 'Capacitor', mpn: 'GRM033R6YA104KE14D', manufacturer: 'Murata',
    lifecycle: 'Active', unitCost: 0.10, priceSource: 'researched', stock: null,
    supplier: 'DigiKey', supplierPn: '490-10430-1-ND',
  },
  {
    pn: 'AMB-CAP-007', rev: 'A',
    description: 'CAP CERM 4.7 pF 50 V ±3% C0G/NP0 0201',
    category: 'Capacitor', mpn: 'GRM0335C1H4R7BA01D', manufacturer: 'Murata',
    lifecycle: 'Active', unitCost: 0.019, priceSource: 'csv', stock: null,
    supplier: 'DigiKey', supplierPn: '490-11332-1-ND',
  },
  {
    pn: 'AMB-CAP-008', rev: 'A',
    description: 'CAP CERM 1 µF 16 V ±20% X5R 0201',
    category: 'Capacitor', mpn: 'CL03A105MO3NRNH', manufacturer: 'Samsung',
    lifecycle: 'Active', unitCost: 0.22, priceSource: 'researched', stock: null,
    supplier: 'DigiKey', supplierPn: '1276-6798-1-ND',
  },
  {
    pn: 'AMB-CAP-009', rev: 'A',
    description: 'CAP CER 12 pF 25 V C0G/NP0 0201',
    category: 'Capacitor', mpn: '250R05L120JV4T', manufacturer: 'Vishay',
    lifecycle: 'Active', unitCost: 0.42, priceSource: 'researched', stock: null,
    supplier: 'DigiKey', supplierPn: '712-QLCD250Q120J1GV001TCT-ND',
  },
  {
    pn: 'AMB-CAP-010', rev: 'A',
    description: 'CAP CER 10000 pF 25 V X5R 0201',
    category: 'Capacitor', mpn: 'CL03A103KA3NNNC', manufacturer: 'Samsung',
    lifecycle: 'Active', unitCost: 0.17, priceSource: 'researched', stock: null,
    supplier: 'DigiKey', supplierPn: '1276-1314-1-ND',
  },
  {
    pn: 'AMB-CAP-011', rev: 'A',
    description: 'CAP CERM 22 µF 6.3 V ±20% X7T 0805',
    category: 'Capacitor', mpn: 'CGA4J1X7T0J226M125AC', manufacturer: 'TDK',
    lifecycle: 'Active', unitCost: 0.272, priceSource: 'csv', stock: null,
    supplier: 'Mouser', supplierPn: '810-CGA4J1X7T0J226M1',
  },
  {
    pn: 'AMB-CAP-012', rev: 'A',
    description: 'CAP CER 390 pF 25 V C0G/NP0 0201',
    category: 'Capacitor', mpn: 'TMK063CG391JT-F', manufacturer: 'Taiyo Yuden',
    lifecycle: 'Active', unitCost: 0.10, priceSource: 'researched', stock: null,
    supplier: 'DigiKey', supplierPn: '587-5287-1-ND',
  },
  {
    pn: 'AMB-CAP-013', rev: 'A',
    description: 'CAP CERM 10 µF 10 V ±10% X7R 0805',
    category: 'Capacitor', mpn: 'GCM21BR71A106KE22L', manufacturer: 'Murata',
    lifecycle: 'Active', unitCost: 0.35, priceSource: 'csv', stock: null,
    supplier: 'Mouser', supplierPn: '81-GCM21BR71A106KE2L',
  },
  // ── Resistors ─────────────────────────────────────────────────────────────
  {
    pn: 'AMB-RES-001', rev: 'A',
    description: 'RES 0 Ω Jumper 1/20 W 0201',
    category: 'Resistor', mpn: 'RC0201JR-070RL', manufacturer: 'Yageo',
    lifecycle: 'Active', unitCost: 0.10, priceSource: 'researched', stock: null,
    supplier: 'DigiKey', supplierPn: '311-0.0NCT-ND',
  },
  {
    pn: 'AMB-RES-002', rev: 'A',
    description: 'RES 10 kΩ ±0.5% 0.05 W Thin Film 0201',
    category: 'Resistor', mpn: 'RR0306P-103-D', manufacturer: 'Susumu',
    lifecycle: 'Active', unitCost: 0.15, priceSource: 'researched', stock: null,
    supplier: 'DigiKey', supplierPn: 'RR0306P-103-D-ND',
  },
  {
    pn: 'AMB-RES-003', rev: 'A',
    description: 'RES 7.87 kΩ 1% 0.05 W 0201',
    category: 'Resistor', mpn: 'RC0201FR-077K87L', manufacturer: 'Yageo',
    lifecycle: 'Active', unitCost: 0.008, priceSource: 'csv', stock: null,
    supplier: 'Mouser', supplierPn: '603-RC0201FR-077K87L',
  },
  {
    pn: 'AMB-RES-004', rev: 'A',
    description: 'RES 82.5 kΩ 1% 0.05 W 0201',
    category: 'Resistor', mpn: 'RC0201FR-0782K5L', manufacturer: 'Yageo',
    lifecycle: 'Active', unitCost: 0.008, priceSource: 'csv', stock: null,
    supplier: 'Mouser', supplierPn: '603-RC0201FR-0782K5L',
  },
  {
    pn: 'AMB-RES-005', rev: 'A',
    description: 'RES 750 Ω 5% 0.05 W 0201',
    category: 'Resistor', mpn: 'RC0201JR-07750RL', manufacturer: 'Yageo',
    lifecycle: 'Active', unitCost: 0.10, priceSource: 'csv', stock: null,
    supplier: 'Mouser', supplierPn: '603-RC0201JR-07750RL',
  },
  {
    pn: 'AMB-RES-006', rev: 'A',
    description: 'RES 100 kΩ 1% 0.05 W 0201',
    category: 'Resistor', mpn: 'CRCW0201100KFKED', manufacturer: 'Vishay',
    lifecycle: 'Active', unitCost: 0.22, priceSource: 'csv', stock: null,
    supplier: 'DigiKey', supplierPn: '541-100KAABCT-ND',
  },
  {
    pn: 'AMB-RES-007', rev: 'A',
    description: 'RES 1.0 kΩ 5% 0.05 W 0201',
    category: 'Resistor', mpn: 'RC0201JR-071KL', manufacturer: 'Yageo',
    lifecycle: 'Active', unitCost: 0.007, priceSource: 'csv', stock: null,
    supplier: 'Mouser', supplierPn: '603-RC0201JR-071KL',
  },
  {
    pn: 'AMB-RES-008', rev: 'A',
    description: 'RES 510 Ω 5% 0.05 W 0201',
    category: 'Resistor', mpn: 'RC0201JR-07510RL', manufacturer: 'Yageo',
    lifecycle: 'Active', unitCost: 0.006, priceSource: 'csv', stock: null,
    supplier: 'Mouser', supplierPn: '603-RC0201JR-07510RL',
  },
  {
    pn: 'AMB-RES-009', rev: 'A',
    description: 'RES 4.99 kΩ 1% 0.05 W 0201',
    category: 'Resistor', mpn: 'RC0201FR-074K99L', manufacturer: 'Yageo',
    lifecycle: 'Active', unitCost: 0.10, priceSource: 'researched', stock: null,
    supplier: 'DigiKey', supplierPn: 'YAG2712CT-ND',
  },
  {
    pn: 'AMB-RES-010', rev: 'A',
    description: 'RES 220 Ω 5% 0.05 W 0201',
    category: 'Resistor', mpn: 'RC0201JR-07220RL', manufacturer: 'Yageo',
    lifecycle: 'Active', unitCost: 0.007, priceSource: 'csv', stock: null,
    supplier: 'Mouser', supplierPn: '603-RC0201JR-07220RL',
  },
  {
    pn: 'AMB-RES-011', rev: 'A',
    description: 'RES 33.2 Ω 1% 0.05 W 0201',
    category: 'Resistor', mpn: 'CRCW020133R2FNED', manufacturer: 'Vishay',
    lifecycle: 'Active', unitCost: 0.024, priceSource: 'csv', stock: null,
    supplier: 'Mouser', supplierPn: '71-CRCW020133R2FNED',
  },
  {
    pn: 'AMB-RES-012', rev: 'A',
    description: 'RES 3.83 Ω 1% 1/16 W 0402',
    category: 'Resistor', mpn: 'RC0402FR-073R83L', manufacturer: 'Yageo',
    lifecycle: 'Active', unitCost: 0.10, priceSource: 'researched', stock: null,
    supplier: 'DigiKey', supplierPn: '13-RC0402FR-073R83LCT-ND',
  },
  {
    pn: 'AMB-RES-013', rev: 'A',
    description: 'RES 1.96 kΩ 1% 0.05 W 0201',
    category: 'Resistor', mpn: 'RC0201FR-071K96L', manufacturer: 'Yageo',
    lifecycle: 'Active', unitCost: 0.10, priceSource: 'csv', stock: null,
    supplier: 'Mouser', supplierPn: '603-RC0201FR-071K96L',
  },
  // ── Inductors & Ferrite Beads ─────────────────────────────────────────────
  {
    pn: 'AMB-IND-001', rev: 'A',
    description: 'Ferrite Bead 30 Ω @ 100 MHz, 2.2 A, AEC-Q200, 0402',
    category: 'Inductor', mpn: 'BLM15PD300SZ1D', manufacturer: 'Murata',
    lifecycle: 'Active', unitCost: 0.10, priceSource: 'csv', stock: null,
    supplier: 'DigiKey', supplierPn: '490-16506-1-ND',
  },
  {
    pn: 'AMB-IND-002', rev: 'A',
    description: 'Fixed Inductor 470 nH 4.5 A 39 mΩ SMD 0805',
    category: 'Inductor', mpn: 'MCKK2012TR47M', manufacturer: 'Murata',
    lifecycle: 'Active', unitCost: 0.25, priceSource: 'researched', stock: null,
    supplier: 'DigiKey', supplierPn: '587-5632-1-ND',
  },
  {
    pn: 'AMB-IND-003', rev: 'A',
    description: 'Ferrite Bead 120 Ω @ 100 MHz, 1.9 A, 0603',
    category: 'Inductor', mpn: 'BLM18KG121TH1D', manufacturer: 'Murata',
    lifecycle: 'Active', unitCost: 0.10, priceSource: 'csv', stock: null,
    supplier: 'Mouser', supplierPn: '81-BLM18KG121TH1D',
  },
  {
    pn: 'AMB-IND-004', rev: 'A',
    description: 'Ferrite Bead 220 Ω @ 100 MHz, 2 A, 0805',
    category: 'Inductor', mpn: 'BLM21PG221SN1D', manufacturer: 'Murata',
    lifecycle: 'Active', unitCost: 0.11, priceSource: 'csv', stock: null,
    supplier: 'DigiKey', supplierPn: '490-1054-1-ND',
  },
  {
    pn: 'AMB-IND-005', rev: 'A',
    description: 'Ferrite Bead SMD 0603',
    category: 'Inductor', mpn: 'MPZ1608S102ATA00', manufacturer: 'TDK',
    lifecycle: 'Active', unitCost: 0.10, priceSource: 'researched', stock: null,
    supplier: 'DigiKey', supplierPn: '445-MPZ1608S102ATA00CT-ND',
  },
  // ── Connectors ───────────────────────────────────────────────────────────
  {
    pn: 'AMB-CN-001', rev: 'A',
    description: 'Receptacle U.FL Ultra Miniature Coaxial, 50 Ω, SMT',
    category: 'Connector', mpn: 'U.FL-R-SMT-1(01)', manufacturer: 'Hirose',
    lifecycle: 'Active', unitCost: 1.80, priceSource: 'csv', stock: null,
    supplier: 'Mouser', supplierPn: '798-U.FL-R-SMT01',
  },
  {
    pn: 'AMB-CN-002', rev: 'A',
    description: 'Micro-USB Type B Receptacle, R/A Bottom Mount SMT',
    category: 'Connector', mpn: '105017-0001', manufacturer: 'Molex',
    lifecycle: 'Active', unitCost: 0.92, priceSource: 'csv', stock: null,
    supplier: 'DigiKey', supplierPn: 'WM1399CT-ND',
  },
  {
    pn: 'AMB-CN-003', rev: 'A',
    description: 'Header 1.27 mm R/A Gold 4-pos',
    category: 'Connector', mpn: 'M50-3930442', manufacturer: 'Harwin',
    lifecycle: 'Active', unitCost: 0.29, priceSource: 'researched', stock: null,
    supplier: 'DigiKey', supplierPn: '952-3616-ND',
  },
  {
    pn: 'AMB-CN-004', rev: 'A',
    description: 'USB Micro-B Receptacle SMT',
    category: 'Connector', mpn: 'UJ2-MIBH2-4-SMT', manufacturer: 'CUI Devices',
    lifecycle: 'Active', unitCost: 0.93, priceSource: 'researched', stock: null,
    supplier: 'DigiKey', supplierPn: '102-4007-1-ND',
  },
  {
    pn: 'AMB-CN-005', rev: 'A',
    description: 'Micro SD Connector with Card Detect Switch',
    category: 'Connector', mpn: '104031-0811', manufacturer: 'Molex',
    lifecycle: 'Active', unitCost: 2.04, priceSource: 'researched', stock: null,
    supplier: 'DigiKey', supplierPn: 'WM6357CT-ND',
  },
  {
    pn: 'AMB-CN-006', rev: 'A',
    description: 'Tag-Connect TC2050 10-pin Programming Header, No-Leg',
    category: 'Connector', mpn: 'TC2050-IDC-NL', manufacturer: 'Tag-Connect',
    lifecycle: 'Active', unitCost: 39.00, priceSource: 'researched', stock: null,
    supplier: 'DigiKey', supplierPn: 'TC2050-IDC-NL-ND',
  },
  // ── Discretes ─────────────────────────────────────────────────────────────
  {
    pn: 'AMB-DISC-001', rev: 'A',
    description: 'Schottky Diode 30 V 2 A 2-XFDFN',
    category: 'Diode', mpn: 'NSR20F30NXT5G', manufacturer: 'onsemi',
    lifecycle: 'Active', unitCost: 0.66, priceSource: 'researched', stock: null,
    supplier: 'DigiKey', supplierPn: 'NSR20F30NXT5GOSCT-ND',
  },
  {
    pn: 'AMB-DISC-002', rev: 'A',
    description: 'USB Filter + ESD Protection, SOT-666',
    category: 'Diode', mpn: 'ECMF02-2AMX6', manufacturer: 'STMicroelectronics',
    lifecycle: 'Active', unitCost: 0.42, priceSource: 'researched', stock: null,
    supplier: 'DigiKey', supplierPn: '497-10773-1-ND',
  },
  {
    pn: 'AMB-DISC-003', rev: 'A',
    description: 'N-Channel MOSFET 100 V 170 mA SOT-23-3',
    category: 'MOSFET', mpn: 'BSS123-7-F', manufacturer: 'Diodes Inc.',
    lifecycle: 'Active', unitCost: 0.24, priceSource: 'researched', stock: null,
    supplier: 'DigiKey', supplierPn: 'BSS123-FDICT-ND',
  },
  // ── LEDs ─────────────────────────────────────────────────────────────────
  {
    pn: 'AMB-LED-001', rev: 'A',
    description: 'LED Green SMD 0402',
    category: 'LED', mpn: 'APHHS1005CGCK', manufacturer: 'Kingbright',
    lifecycle: 'Active', unitCost: 0.26, priceSource: 'researched', stock: null,
    supplier: 'DigiKey', supplierPn: '754-1101-1-ND',
  },
  {
    pn: 'AMB-LED-002', rev: 'A',
    description: 'LED Dual 4-Wire SMT',
    category: 'LED', mpn: '150066SV74000', manufacturer: 'Würth Elektronik',
    lifecycle: 'Active', unitCost: 0.44, priceSource: 'researched', stock: null,
    supplier: 'DigiKey', supplierPn: '732-11430-1-ND',
  },
  // ── Switches ──────────────────────────────────────────────────────────────
  {
    pn: 'AMB-SW-001', rev: 'A',
    description: 'Switch Slide DIP SPST 100 mA 6 V',
    category: 'Switch', mpn: 'CHS-01TA', manufacturer: 'CUI Devices',
    lifecycle: 'Active', unitCost: 1.10, priceSource: 'researched', stock: null,
    supplier: 'DigiKey', supplierPn: '563-1003-1-ND',
  },
  {
    pn: 'AMB-SW-002', rev: 'A',
    description: 'Tactile Switch SPST-NO 0.05 A 12 V SMT',
    category: 'Switch', mpn: 'B3U-1000P', manufacturer: 'Omron',
    lifecycle: 'Active', unitCost: 1.08, priceSource: 'csv', stock: null,
    supplier: 'Mouser', supplierPn: '653-B3U-1000P',
  },
  {
    pn: 'AMB-SW-003', rev: 'A',
    description: 'Four-Position DIP Switch',
    category: 'Switch', mpn: 'TDA04H0SB1R', manufacturer: 'TE Connectivity',
    lifecycle: 'Active', unitCost: 3.41, priceSource: 'researched', stock: null,
    supplier: 'DigiKey', supplierPn: 'CKN9502CT-ND',
  },
  {
    pn: 'AMB-SW-004', rev: 'A',
    description: 'SPST Tactile Switch 2 Active Pins SMT',
    category: 'Switch', mpn: 'PTS810', manufacturer: 'C&K',
    lifecycle: 'Active', unitCost: 0.53, priceSource: 'researched', stock: null,
    supplier: 'DigiKey', supplierPn: 'CKN10502CT-ND',
  },
  // ── Crystals ──────────────────────────────────────────────────────────────
  {
    pn: 'AMB-XTL-001', rev: 'A',
    description: 'Crystal 40.000 MHz 8 pF SMD',
    category: 'Crystal', mpn: 'CX2016DB40000D0FLJCC', manufacturer: 'Kyocera',
    lifecycle: 'Active', unitCost: 0.88, priceSource: 'researched', stock: null,
    supplier: 'DigiKey', supplierPn: '478-CX2016DB40000D0FLJCCCT-ND',
  },
  {
    pn: 'AMB-XTL-002', rev: 'A',
    description: 'Crystal 32.768 kHz 4 pF SMD',
    category: 'Crystal', mpn: 'ABS05W-32.768KHZ-D-2-T', manufacturer: 'Abracon',
    lifecycle: 'Active', unitCost: 2.36, priceSource: 'researched', stock: null,
    supplier: 'DigiKey', supplierPn: '535-14310-1-ND',
  },
  // ── Test Points ───────────────────────────────────────────────────────────
  {
    pn: 'AMB-TP-001', rev: 'A',
    description: 'PC Test Point Loop Brass Tin 1.19 mm Hole',
    category: 'Test Point', mpn: '4953', manufacturer: 'Keystone',
    lifecycle: 'Active', unitCost: 0.26, priceSource: 'researched', stock: null,
    supplier: 'DigiKey', supplierPn: '36-4953-ND',
  },
];

// ── Assembly BOM ─────────────────────────────────────────────────────────────

export const ASSEMBLIES: Assembly[] = [
  {
    pn: 'AMB-PCBA-001',
    rev: 'EVT-0.1',
    description: 'Ambient Sensor Unit — Main PCB Assembly',
    bom: [
      // ICs
      { pn: 'AMB-IC-001', qty: 1,   designator: 'U1',                     notes: '60 GHz radar SoC' },
      { pn: 'AMB-IC-002', qty: 1,   designator: 'U2',                     notes: 'Power converters' },
      { pn: 'AMB-IC-003', qty: 1,   designator: 'U3' },
      { pn: 'AMB-IC-004', qty: 1,   designator: 'U4' },
      { pn: 'AMB-IC-005', qty: 1,   designator: 'U5' },
      { pn: 'AMB-IC-006', qty: 1,   designator: 'U7' },
      { pn: 'AMB-IC-007', qty: 1,   designator: 'U8',                     notes: 'IMU' },
      { pn: 'AMB-IC-008', qty: 1,   designator: 'U9' },
      { pn: 'AMB-IC-009', qty: 1,   designator: 'U10' },
      { pn: 'AMB-IC-010', qty: 1,   designator: 'U11' },
      { pn: 'AMB-IC-011', qty: 1,   designator: 'U12',                    notes: 'Application processor' },
      // Capacitors
      { pn: 'AMB-CAP-001', qty: 14, designator: 'C1, C5, C8, C11, C15, C19, C27, C28, C54–C57, C76, C77' },
      { pn: 'AMB-CAP-002', qty: 24, designator: 'C2–C4, C6–C14, C17–C18, C21–C22, C24–C25, C30–C31, C37–C41, C53' },
      { pn: 'AMB-CAP-003', qty: 5,  designator: 'C16, C20, C23, C29, C36' },
      { pn: 'AMB-CAP-004', qty: 1,  designator: 'C26' },
      { pn: 'AMB-CAP-005', qty: 2,  designator: 'C32, C33',               notes: '⚠ EOL — find replacement' },
      { pn: 'AMB-CAP-006', qty: 15, designator: 'C34–C35, C44, C74–C75, C78, C80, C102, C104–C106, C109–C111, C113' },
      { pn: 'AMB-CAP-007', qty: 2,  designator: 'C42, C43' },
      { pn: 'AMB-CAP-008', qty: 2,  designator: 'C79, C103' },
      { pn: 'AMB-CAP-009', qty: 2,  designator: 'C107, C108' },
      { pn: 'AMB-CAP-010', qty: 1,  designator: 'C112' },
      { pn: 'AMB-CAP-011', qty: 16, designator: 'C45–C52, C61–C64, C70–C73' },
      { pn: 'AMB-CAP-012', qty: 4,  designator: 'C58, C65–C67' },
      { pn: 'AMB-CAP-013', qty: 4,  designator: 'C59, C60, C68, C69' },
      // Resistors
      { pn: 'AMB-RES-001', qty: 26, designator: 'R1–R2, R6–R7, R15, R30–R31, R40, R45–R46, R69–R74, R80–R81, R84, R87, R90–R91, R98–R100, R102' },
      { pn: 'AMB-RES-002', qty: 32, designator: 'R3, R9, R12–R13, R16–R17, R19, R21–R22, R26, R34–R35, R48, R50–R53, R59–R60, R75, R77–R79, R82–R83, R85–R86, R88–R89, R94–R95, R101' },
      { pn: 'AMB-RES-003', qty: 2,  designator: 'R4, R14' },
      { pn: 'AMB-RES-004', qty: 3,  designator: 'R5, R10, R18' },
      { pn: 'AMB-RES-005', qty: 1,  designator: 'R8' },
      { pn: 'AMB-RES-006', qty: 4,  designator: 'R20, R23, R24, R42' },
      { pn: 'AMB-RES-007', qty: 2,  designator: 'R25, R41' },
      { pn: 'AMB-RES-008', qty: 3,  designator: 'R27, R96, R104' },
      { pn: 'AMB-RES-009', qty: 8,  designator: 'R28–R29, R32–R33, R44, R47, R97, R103' },
      { pn: 'AMB-RES-010', qty: 4,  designator: 'R49, R76, R92, R93' },
      { pn: 'AMB-RES-011', qty: 5,  designator: 'R54–R58' },
      { pn: 'AMB-RES-012', qty: 4,  designator: 'R36–R39' },
      { pn: 'AMB-RES-013', qty: 1,  designator: 'R43' },
      // Inductors
      { pn: 'AMB-IND-001', qty: 1,  designator: 'FL1' },
      { pn: 'AMB-IND-002', qty: 4,  designator: 'L1–L4' },
      { pn: 'AMB-IND-003', qty: 4,  designator: 'L5–L8' },
      { pn: 'AMB-IND-004', qty: 1,  designator: 'L9' },
      { pn: 'AMB-IND-005', qty: 1,  designator: 'L10' },
      // Connectors
      { pn: 'AMB-CN-001', qty: 1,   designator: 'J1',                     notes: 'RF / antenna' },
      { pn: 'AMB-CN-002', qty: 1,   designator: 'J2' },
      { pn: 'AMB-CN-003', qty: 1,   designator: 'J4' },
      { pn: 'AMB-CN-004', qty: 1,   designator: 'J3' },
      { pn: 'AMB-CN-005', qty: 1,   designator: 'J5' },
      { pn: 'AMB-CN-006', qty: 1,   designator: 'TP1',                    notes: 'Programming / debug' },
      // Discretes
      { pn: 'AMB-DISC-001', qty: 1, designator: 'D1' },
      { pn: 'AMB-DISC-002', qty: 1, designator: 'D3' },
      { pn: 'AMB-DISC-003', qty: 1, designator: 'Q1' },
      // LEDs
      { pn: 'AMB-LED-001', qty: 5,  designator: 'LD1, LD2, LD4, LD5, LD6' },
      { pn: 'AMB-LED-002', qty: 2,  designator: 'D2, D4' },
      // Switches
      { pn: 'AMB-SW-001', qty: 1,   designator: 'S1' },
      { pn: 'AMB-SW-002', qty: 2,   designator: 'SW1, SW2' },
      { pn: 'AMB-SW-003', qty: 1,   designator: 'S2' },
      { pn: 'AMB-SW-004', qty: 1,   designator: 'S3' },
      // Crystals
      { pn: 'AMB-XTL-001', qty: 1,  designator: 'Y1' },
      { pn: 'AMB-XTL-002', qty: 2,  designator: 'Y2, Y4' },
      // Test points
      { pn: 'AMB-TP-001',  qty: 1,  designator: 'TP19' },
    ],
  },
];

export const BUILD_ORDERS: BuildOrder[] = [
  { id: 'BO-0001', assembly: 'AMB-PCBA-001', assemblyRev: 'EVT-0.1', qty: 10,  targetDate: '2026-05-15', status: 'In Progress', shortage: false },
  { id: 'BO-0002', assembly: 'AMB-PCBA-001', assemblyRev: 'EVT-0.1', qty: 25,  targetDate: '2026-06-30', status: 'Draft',       shortage: true  },
  { id: 'BO-0003', assembly: 'AMB-PCBA-001', assemblyRev: 'EVT-0.1', qty: 50,  targetDate: '2026-07-15', status: 'Released',    shortage: false },
];

export function getAllRequirements() { return PARTS; }
