// Monoline SVG icons for compliance categories and certification badges
import type { StandardCategory } from './data';

type IconProps = { size?: number; color?: string };

// ── Category Icons (20×20 viewBox, strokeWidth 1.4) ─────────────────────────

export function IconQMS({ size = 20, color = 'currentColor' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" stroke={color} strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round">
      {/* clipboard body */}
      <rect x="4" y="3" width="12" height="15" rx="1" />
      {/* clipboard top clip */}
      <path d="M7 3v-0.5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1V3" />
      {/* lines */}
      <line x1="7" y1="8" x2="13" y2="8" />
      <line x1="7" y1="11" x2="13" y2="11" />
      <line x1="7" y1="14" x2="11" y2="14" />
    </svg>
  );
}

export function IconRisk({ size = 20, color = 'currentColor' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" stroke={color} strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round">
      {/* triangle */}
      <path d="M10 3 L18 17 H2 Z" />
      {/* exclamation body */}
      <line x1="10" y1="8" x2="10" y2="12.5" />
      {/* exclamation dot */}
      <circle cx="10" cy="14.5" r="0.6" fill={color} stroke="none" />
    </svg>
  );
}

export function IconSoftware({ size = 20, color = 'currentColor' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" stroke={color} strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round">
      {/* < brackets */}
      <path d="M7 6 L3 10 L7 14" />
      {/* > brackets */}
      <path d="M13 6 L17 10 L13 14" />
      {/* / slash */}
      <line x1="11.5" y1="6" x2="8.5" y2="14" />
    </svg>
  );
}

export function IconElectrical({ size = 20, color = 'currentColor' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" stroke={color} strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round">
      {/* lightning bolt */}
      <path d="M12 2 L6 11 H10 L8 18 L14 9 H10 Z" />
    </svg>
  );
}

export function IconBattery({ size = 20, color = 'currentColor' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" stroke={color} strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round">
      {/* battery body */}
      <rect x="2" y="7" width="14" height="6" rx="1" />
      {/* positive terminal */}
      <line x1="17" y1="9" x2="17" y2="11" strokeWidth={2} />
      {/* charge indicator */}
      <rect x="4" y="9" width="4" height="2" rx="0.5" fill={color} stroke="none" />
    </svg>
  );
}

export function IconBiocompat({ size = 20, color = 'currentColor' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" stroke={color} strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round">
      {/* hexagon */}
      <path d="M10 2 L17 6 L17 14 L10 18 L3 14 L3 6 Z" />
      {/* inner circle */}
      <circle cx="10" cy="10" r="3" />
    </svg>
  );
}

export function IconSterilization({ size = 20, color = 'currentColor' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" stroke={color} strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round">
      {/* shield */}
      <path d="M10 2 L17 5 V10 C17 14.5 10 18 10 18 C10 18 3 14.5 3 10 V5 Z" />
      {/* checkmark */}
      <path d="M7 10 L9.5 12.5 L13.5 8" />
    </svg>
  );
}

export function IconUsability({ size = 20, color = 'currentColor' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" stroke={color} strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round">
      {/* head */}
      <circle cx="10" cy="5.5" r="2.5" />
      {/* body */}
      <path d="M5.5 18 V13 C5.5 11 7 10 10 10 C13 10 14.5 11 14.5 13 V18" />
      {/* shoulders */}
      <line x1="6.5" y1="11" x2="4" y2="15" />
      <line x1="13.5" y1="11" x2="16" y2="15" />
    </svg>
  );
}

export function IconClinical({ size = 20, color = 'currentColor' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" stroke={color} strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round">
      {/* medical cross: vertical rect */}
      <rect x="8.5" y="3" width="3" height="14" rx="0.5" />
      {/* medical cross: horizontal rect */}
      <rect x="3" y="8.5" width="14" height="3" rx="0.5" />
    </svg>
  );
}

export function IconLabeling({ size = 20, color = 'currentColor' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" stroke={color} strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round">
      {/* price tag body */}
      <path d="M3 3 H11 L17 10 L11 17 H3 V3 Z" />
      {/* hole */}
      <circle cx="6.5" cy="6.5" r="1.2" />
    </svg>
  );
}

export function IconMarketReg({ size = 20, color = 'currentColor' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" stroke={color} strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round">
      {/* globe outline */}
      <circle cx="10" cy="10" r="7.5" />
      {/* latitude line */}
      <path d="M2.5 10 Q6 7 10 10 Q14 13 17.5 10" />
      {/* equator */}
      <line x1="2.5" y1="10" x2="17.5" y2="10" opacity="0" />
      {/* vertical meridian */}
      <path d="M10 2.5 Q13 6 13 10 Q13 14 10 17.5" />
      <path d="M10 2.5 Q7 6 7 10 Q7 14 10 17.5" />
    </svg>
  );
}

export function IconCyber({ size = 20, color = 'currentColor' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" stroke={color} strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round">
      {/* shield */}
      <path d="M10 2 L17 5 V10 C17 14.5 10 18 10 18 C10 18 3 14.5 3 10 V5 Z" />
      {/* padlock body */}
      <rect x="7" y="10" width="6" height="4.5" rx="0.8" />
      {/* padlock shackle */}
      <path d="M8 10 V8 A2 2 0 0 1 12 8 V10" />
    </svg>
  );
}

export function IconPrivacy({ size = 20, color = 'currentColor' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" stroke={color} strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round">
      {/* padlock body */}
      <rect x="4.5" y="10" width="11" height="8" rx="1" />
      {/* padlock shackle */}
      <path d="M7 10 V7 A3 3 0 0 1 13 7 V10" />
      {/* keyhole dot */}
      <circle cx="10" cy="14" r="1" fill={color} stroke="none" />
    </svg>
  );
}

export function IconSafetyCert({ size = 20, color = 'currentColor' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" stroke={color} strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round">
      {/* outer circle */}
      <circle cx="10" cy="10" r="8" />
      {/* inner circle */}
      <circle cx="10" cy="10" r="5" />
      {/* checkmark */}
      <path d="M7.5 10 L9.5 12 L12.5 8" />
    </svg>
  );
}

// ── Cert Badge Icons (28×28 viewBox, strokeWidth 1.5) ────────────────────────

export function IconBadgeHIPAA({ size = 28, color = 'currentColor' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      {/* shield */}
      <path d="M14 2 L24 6 V13 C24 20 14 26 14 26 C14 26 4 20 4 13 V6 Z" />
      {/* H: left vertical */}
      <line x1="10" y1="10" x2="10" y2="18" />
      {/* H: right vertical */}
      <line x1="18" y1="10" x2="18" y2="18" />
      {/* H: crossbar */}
      <line x1="10" y1="14" x2="18" y2="14" />
    </svg>
  );
}

export function IconBadgeUL({ size = 28, color = 'currentColor' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      {/* outer circle */}
      <circle cx="14" cy="14" r="11" />
      {/* U: left leg */}
      <line x1="9" y1="9" x2="9" y2="16" />
      {/* U: arc bottom */}
      <path d="M9 16 Q9 20 14 20 Q19 20 19 16" />
      {/* U: right leg */}
      <line x1="19" y1="9" x2="19" y2="16" />
    </svg>
  );
}

export function IconBadgeCE({ size = 28, color = 'currentColor' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      {/* outer C (big arc ~270°) */}
      <path d="M20 8 A9 9 0 1 0 20 20" />
      {/* inner C (slightly smaller, offset right) */}
      <path d="M23 10 A6 6 0 1 0 23 18" />
    </svg>
  );
}

export function IconBadgeANSI({ size = 28, color = 'currentColor' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      {/* hexagon */}
      <path d="M14 3 L23 8 L23 20 L14 25 L5 20 L5 8 Z" />
      {/* checkmark */}
      <path d="M9 14 L13 18 L19 10" />
    </svg>
  );
}

export function IconBadgeFDA({ size = 28, color = 'currentColor' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      {/* 5-point star */}
      <path d="M14 3 L16.2 10.2 L23.8 10.2 L17.8 14.6 L20 21.8 L14 17.4 L8 21.8 L10.2 14.6 L4.2 10.2 L11.8 10.2 Z" />
    </svg>
  );
}

export function IconBadgeISO({ size = 28, color = 'currentColor' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      {/* globe outer */}
      <circle cx="14" cy="14" r="10" />
      {/* equator */}
      <line x1="4" y1="14" x2="24" y2="14" />
      {/* latitude arc top */}
      <path d="M5 9 Q14 12 23 9" />
      {/* latitude arc bottom */}
      <path d="M5 19 Q14 16 23 19" />
      {/* meridian */}
      <path d="M14 4 Q18 9 18 14 Q18 19 14 24" />
    </svg>
  );
}

export function IconBadgeFCC({ size = 28, color = 'currentColor' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      {/* center dot */}
      <circle cx="14" cy="20" r="1.2" fill={color} stroke="none" />
      {/* inner wave arc */}
      <path d="M9.5 17 Q11.5 13.5 14 13 Q16.5 13.5 18.5 17" />
      {/* middle wave arc */}
      <path d="M6 14.5 Q9 9 14 8 Q19 9 22 14.5" />
      {/* outer wave arc */}
      <path d="M2.5 12 Q6.5 4.5 14 3 Q21.5 4.5 25.5 12" />
    </svg>
  );
}

export function IconBadgeTGA({ size = 28, color = 'currentColor' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      {/* shield */}
      <path d="M14 2 L24 6 V13 C24 20 14 26 14 26 C14 26 4 20 4 13 V6 Z" />
      {/* medical cross: vertical */}
      <rect x="12" y="10" width="4" height="10" rx="0.5" />
      {/* medical cross: horizontal */}
      <rect x="9" y="13" width="10" height="4" rx="0.5" />
    </svg>
  );
}

export function IconBadgePMDA({ size = 28, color = 'currentColor' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      {/* outer circle */}
      <circle cx="14" cy="14" r="10" />
      {/* 8 radial spokes */}
      <line x1="14" y1="4" x2="14" y2="8" />
      <line x1="14" y1="20" x2="14" y2="24" />
      <line x1="4" y1="14" x2="8" y2="14" />
      <line x1="20" y1="14" x2="24" y2="14" />
      <line x1="7.1" y1="7.1" x2="9.9" y2="9.9" />
      <line x1="18.1" y1="18.1" x2="20.9" y2="20.9" />
      <line x1="20.9" y1="7.1" x2="18.1" y2="9.9" />
      <line x1="9.9" y1="18.1" x2="7.1" y2="20.9" />
    </svg>
  );
}

export function IconBadgeUKCA({ size = 28, color = 'currentColor' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      {/* outer circle */}
      <circle cx="14" cy="14" r="11" />
      {/* vertical bar */}
      <line x1="14" y1="3" x2="14" y2="25" />
      {/* horizontal bar */}
      <line x1="3" y1="14" x2="25" y2="14" />
      {/* diagonal lines (union jack style) */}
      <line x1="6" y1="6" x2="22" y2="22" />
      <line x1="22" y1="6" x2="6" y2="22" />
    </svg>
  );
}

// ── Map helpers ───────────────────────────────────────────────────────────────

export function CategoryIcon({ category, size = 16, color = 'currentColor' }: { category: StandardCategory; size?: number; color?: string }) {
  switch (category) {
    case 'QMS':                return <IconQMS size={size} color={color} />;
    case 'Risk':               return <IconRisk size={size} color={color} />;
    case 'Software':           return <IconSoftware size={size} color={color} />;
    case 'Electrical':         return <IconElectrical size={size} color={color} />;
    case 'Battery':            return <IconBattery size={size} color={color} />;
    case 'Biocompatibility':   return <IconBiocompat size={size} color={color} />;
    case 'Sterilization':      return <IconSterilization size={size} color={color} />;
    case 'Usability':          return <IconUsability size={size} color={color} />;
    case 'Clinical':           return <IconClinical size={size} color={color} />;
    case 'Labeling':           return <IconLabeling size={size} color={color} />;
    case 'Market Regulatory':  return <IconMarketReg size={size} color={color} />;
    case 'Cybersecurity':      return <IconCyber size={size} color={color} />;
    case 'Privacy':            return <IconPrivacy size={size} color={color} />;
    case 'Safety Certification': return <IconSafetyCert size={size} color={color} />;
    default:                   return null;
  }
}

export type CertBadgeId = 'HIPAA' | 'UL' | 'FDA' | 'CE' | 'ANSI' | 'FCC' | 'ISO' | 'TGA' | 'PMDA' | 'UKCA';

export interface CertBadgeDef {
  id: CertBadgeId;
  label: string;
  subtitle: string;
}

export const CERT_BADGES: CertBadgeDef[] = [
  { id: 'HIPAA', label: 'HIPAA',  subtitle: 'Privacy & Security' },
  { id: 'UL',    label: 'UL',     subtitle: 'NRTL Safety Listing' },
  { id: 'FDA',   label: 'FDA',    subtitle: '510(k) / PMA / De Novo' },
  { id: 'CE',    label: 'CE',     subtitle: 'EU MDR / IVDR' },
  { id: 'ANSI',  label: 'ANSI',   subtitle: 'US National Standard' },
  { id: 'FCC',   label: 'FCC',    subtitle: 'RF Authorization' },
  { id: 'ISO',   label: 'ISO',    subtitle: 'International Standard' },
  { id: 'TGA',   label: 'TGA',    subtitle: 'Australia ARTG' },
  { id: 'PMDA',  label: 'PMDA',   subtitle: 'Japan Approval' },
  { id: 'UKCA',  label: 'UKCA',   subtitle: 'UK Conformity' },
];

export function CertBadgeIcon({ id, size = 28, color = 'currentColor' }: { id: CertBadgeId; size?: number; color?: string }) {
  switch (id) {
    case 'HIPAA': return <IconBadgeHIPAA size={size} color={color} />;
    case 'UL':    return <IconBadgeUL    size={size} color={color} />;
    case 'FDA':   return <IconBadgeFDA   size={size} color={color} />;
    case 'CE':    return <IconBadgeCE    size={size} color={color} />;
    case 'ANSI':  return <IconBadgeANSI  size={size} color={color} />;
    case 'FCC':   return <IconBadgeFCC   size={size} color={color} />;
    case 'ISO':   return <IconBadgeISO   size={size} color={color} />;
    case 'TGA':   return <IconBadgeTGA   size={size} color={color} />;
    case 'PMDA':  return <IconBadgePMDA  size={size} color={color} />;
    case 'UKCA':  return <IconBadgeUKCA  size={size} color={color} />;
    default:      return null;
  }
}
