// Canonical per-domain progress data shared by /eng and /engineering.
// Both pages read here so percentages can't drift.
// Ground truth at runtime is /api/eng/state; these are the fallbacks
// used when the server has no state for a domain yet.

export interface EngDomainMeta {
  id:               string;
  serverKey:        string;
  href:             string;
  lsKey:            string;
  freezeKey:        string;
  checklistTotal:   number;
  checklistDefault: number;
}

export const ENG_DOMAINS: EngDomainMeta[] = [
  { id: 'firmware',         serverKey: 'firmware',  href: '/firmware',         lsKey: 'ambient-fw-checklist-v2',         freezeKey: 'ambient-fw-frozen-v1',         checklistTotal: 20, checklistDefault: 9  },
  { id: 'ee',               serverKey: 'ee',        href: '/ee',               lsKey: 'ambient-ee-checklist-v1',         freezeKey: 'ambient-ee-frozen-v1',         checklistTotal: 22, checklistDefault: 13 },
  { id: 'mobileapp',        serverKey: 'mobileapp', href: '/mobileapp',        lsKey: 'ambient-mobileapp-checklist-v1',  freezeKey: 'ambient-mobileapp-frozen-v1',  checklistTotal: 23, checklistDefault: 17 },
  { id: 'cloudengineering', serverKey: 'cloud',     href: '/cloudengineering', lsKey: 'ambient-cloud-checklist-v2',      freezeKey: 'ambient-cloud-frozen-v1',      checklistTotal: 22, checklistDefault: 21 },
  { id: 'mechanical',       serverKey: 'mechanical', href: '/mechanical',      lsKey: 'ambient-mechanical-checklist-v1', freezeKey: 'ambient-mechanical-frozen-v1', checklistTotal: 22, checklistDefault: 5  },
  { id: 'webapp',           serverKey: 'webapp',    href: '/webapp',           lsKey: 'ambient-webapp-checklist-v1',     freezeKey: 'ambient-webapp-frozen-v1',     checklistTotal: 20, checklistDefault: 20 },
  { id: 'cybersecurity',    serverKey: 'cyber',     href: '/cybersecurity',    lsKey: 'ambient-cyber-checklist-v1',      freezeKey: 'ambient-cyber-frozen-v1',      checklistTotal: 23, checklistDefault: 19 },
];

export const ENG_DOMAIN_BY_ID = Object.fromEntries(ENG_DOMAINS.map(d => [d.id, d])) as Record<string, EngDomainMeta>;
export const ENG_DOMAIN_BY_SERVER_KEY = Object.fromEntries(ENG_DOMAINS.map(d => [d.serverKey, d])) as Record<string, EngDomainMeta>;
