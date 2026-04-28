'use client';
import Link from 'next/link';

import { useState, useMemo } from 'react';
import {
  REQUIREMENTS, HAZARDS, RISK_CONTROLS, SOUP, VERIFICATION_TESTS, RELEASES, SAMD_META,
  type ReqStatus, type ReleaseStatus, type SoupScope,
} from './data';

type Tab = 'requirements' | 'risk' | 'soup' | 'verification' | 'releases';

// ── Badge ─────────────────────────────────────────────────────────────────────

const REQ_STATUS_STYLE: Record<ReqStatus, { bg: string; color: string }> = {
  Draft:          { bg: 'rgba(120,110,100,0.10)', color: '#6b6256' },
  'Under Review': { bg: 'rgba(217,119,87,0.14)',  color: '#b85a30' },
  Approved:       { bg: 'rgba(58,100,200,0.10)',  color: '#2a4fa0' },
  Verified:       { bg: 'rgba(58,155,92,0.12)',   color: '#2e7d4f' },
};

const RELEASE_STATUS_STYLE: Record<ReleaseStatus, { bg: string; color: string }> = {
  Draft:    { bg: 'rgba(120,110,100,0.10)', color: '#6b6256' },
  Approved: { bg: 'rgba(58,100,200,0.10)',  color: '#2a4fa0' },
  Released: { bg: 'rgba(58,155,92,0.12)',   color: '#2e7d4f' },
};

const CONTROL_TYPE_STYLE: Record<string, { bg: string; color: string }> = {
  'Inherent safety':         { bg: 'rgba(58,155,92,0.12)',   color: '#2e7d4f' },
  'Protective measure':      { bg: 'rgba(58,100,200,0.10)',  color: '#2a4fa0' },
  'Information for safety':  { bg: 'rgba(184,131,10,0.12)',  color: '#8a6200' },
};

const TEST_RESULT_STYLE: Record<string, { bg: string; color: string }> = {
  Pass:    { bg: 'rgba(58,155,92,0.12)',   color: '#2e7d4f' },
  Fail:    { bg: 'rgba(192,57,43,0.12)',   color: '#a02020' },
  'Not run': { bg: 'rgba(120,110,100,0.10)', color: '#6b6256' },
};

const SCOPE_STYLE: Record<SoupScope, { bg: string; color: string }> = {
  Production: { bg: 'rgba(58,100,200,0.10)', color: '#2a4fa0' },
  'Dev only': { bg: 'rgba(120,110,100,0.10)', color: '#6b6256' },
};

function Badge({ label, style }: { label: string; style: { bg: string; color: string } }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', padding: '2px 8px',
      borderRadius: 99, fontSize: 11, fontWeight: 500,
      background: style.bg, color: style.color,
      fontFamily: 'var(--mono)', letterSpacing: '0.03em', whiteSpace: 'nowrap',
    }}>{label}</span>
  );
}

// ── Severity chip ─────────────────────────────────────────────────────────────

function SeverityChip({ value }: { value: number | null }) {
  if (value === null) return <span style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--text-4)' }}>TODO</span>;
  const colors = ['', '#2e7d4f', '#5c7a2a', '#8a6200', '#c06000', '#a02020'];
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      width: 28, height: 28, borderRadius: 6, fontFamily: 'var(--mono)', fontSize: 13,
      fontWeight: 600, background: `${colors[value]}22`, color: colors[value],
    }}>{value}</span>
  );
}

// ── Stat card ─────────────────────────────────────────────────────────────────

function StatCard({ label, value, color }: { label: string; value: number | string; color?: string }) {
  return (
    <div style={{ background: 'var(--surface-1)', border: '1px solid var(--line)', borderRadius: 8, padding: '8px 16px', display: 'flex', flexDirection: 'column', gap: 2 }}>
      <span style={{ fontFamily: 'var(--mono)', fontSize: 20, fontWeight: 500, color: color ?? 'var(--text)' }}>{value}</span>
      <span style={{ fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</span>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function SamdPage() {
  const [tab, setTab] = useState<Tab>('requirements');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<ReqStatus | 'All'>('All');
  const [expandedReq, setExpandedReq] = useState<string | null>(null);

  const navItems: { key: Tab; label: string }[] = [
    { key: 'requirements', label: 'Requirements' },
    { key: 'risk',         label: 'Risk Register' },
    { key: 'soup',         label: 'SOUP Inventory' },
    { key: 'verification', label: 'Verification' },
    { key: 'releases',     label: 'Releases' },
  ];

  const filteredReqs = useMemo(() => {
    const q = search.toLowerCase();
    return REQUIREMENTS.filter(r =>
      (statusFilter === 'All' || r.status === statusFilter) &&
      (!q || r.id.toLowerCase().includes(q) || r.title.toLowerCase().includes(q) || r.description.toLowerCase().includes(q))
    );
  }, [search, statusFilter]);

  const verifiedCount  = REQUIREMENTS.filter(r => r.status === 'Verified').length;
  const approvedCount  = REQUIREMENTS.filter(r => r.status === 'Approved').length;
  const passCount      = VERIFICATION_TESTS.filter(t => t.result === 'Pass').length;
  const todoControls   = RISK_CONTROLS.filter(c => c.implementationRef === 'TODO').length;
  const soupPending    = SOUP.filter(s => s.anomalyReviewDate === null).length;

  return (
    <div className="app">
      {/* Sidebar */}
      <nav className="sidebar">
        <Link href="/" style={{ textDecoration: "none", color: "inherit" }}>
          <div className="brand">
            <span className="brand-name">Ambient <em>Intelligence</em></span>
          </div>
        </Link>

        <div className="nav-section">
          <p className="nav-label">SaMD</p>
          {navItems.map(item => (
            <button
              key={item.key}
              className={`nav-item${tab === item.key ? ' active' : ''}`}
              onClick={() => setTab(item.key)}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Status summary */}
        <div style={{ marginTop: 'auto' }}>
          <p className="nav-label">Status</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: '0 8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
              <span style={{ color: 'var(--text-3)' }}>Safety class</span>
              <span style={{ fontFamily: 'var(--mono)', fontWeight: 600, color: '#b85a30' }}>{SAMD_META.safetyClass}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
              <span style={{ color: 'var(--text-3)' }}>Reqs verified</span>
              <span style={{ fontFamily: 'var(--mono)', fontWeight: 600, color: '#2e7d4f' }}>{verifiedCount}/{REQUIREMENTS.length}</span>
            </div>
            {todoControls > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                <span style={{ color: '#8a6200' }}>Controls TODO</span>
                <span style={{ fontFamily: 'var(--mono)', fontWeight: 600, color: '#8a6200' }}>{todoControls}</span>
              </div>
            )}
            {soupPending > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                <span style={{ color: '#8a6200' }}>SOUP unreviewed</span>
                <span style={{ fontFamily: 'var(--mono)', fontWeight: 600, color: '#8a6200' }}>{soupPending}</span>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Main */}
      <main style={{ padding: '32px 40px', overflowY: 'auto' }}>

        {/* ── Header card (always visible) ── */}
        <div style={{ background: 'var(--surface-1)', border: '1px solid var(--line)', borderRadius: 10, padding: '14px 20px', marginBottom: 28, display: 'flex', gap: 32, alignItems: 'center', flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: 11, color: 'var(--text-4)', fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 3 }}>Package</div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 14, color: 'var(--accent)' }}>{SAMD_META.packageName}</div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: 'var(--text-4)', fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 3 }}>Class (IEC 62304)</div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 14, color: '#b85a30', fontWeight: 600 }}>{SAMD_META.safetyClass}</div>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, color: 'var(--text-4)', fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 3 }}>Regulatory status</div>
            <div style={{ fontSize: 13, color: 'var(--text-3)' }}>{SAMD_META.regulatoryStatus}</div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: 'var(--text-4)', fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 3 }}>Standards</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {SAMD_META.standards.map(s => (
                <span key={s} style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-3)', background: 'var(--surface-2)', border: '1px solid var(--line)', borderRadius: 4, padding: '2px 6px' }}>{s}</span>
              ))}
            </div>
          </div>
          <a href={SAMD_META.repo} target="_blank" rel="noreferrer" style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--accent)', textDecoration: 'none', borderBottom: '1px solid var(--accent)', paddingBottom: 1 }}>
            github ↗
          </a>
        </div>

        {/* ── Requirements ── */}
        {tab === 'requirements' && (
          <>
            <div style={{ marginBottom: 24 }}>
              <p style={{ fontFamily: 'var(--mono)', fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '0.14em', color: 'var(--text-4)', margin: '0 0 6px' }}>SaMD · SRS</p>
              <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16 }}>
                <h1 style={{ fontFamily: 'var(--serif)', fontWeight: 400, fontSize: 26, margin: 0, letterSpacing: '-0.02em' }}>Software Requirements</h1>
                <div style={{ display: 'flex', gap: 10 }}>
                  <input
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Search requirements…"
                    style={{ padding: '7px 12px', borderRadius: 999, border: '1px solid var(--line-strong)', background: 'transparent', fontSize: 13, color: 'var(--text)', outline: 'none', width: 220 }}
                  />
                  <select
                    value={statusFilter}
                    onChange={e => setStatusFilter(e.target.value as ReqStatus | 'All')}
                    style={{ padding: '7px 12px', borderRadius: 999, border: '1px solid var(--line-strong)', background: 'var(--surface-1)', fontSize: 13, color: 'var(--text)', outline: 'none', cursor: 'pointer' }}
                  >
                    <option value="All">All status</option>
                    <option value="Draft">Draft</option>
                    <option value="Under Review">Under Review</option>
                    <option value="Approved">Approved</option>
                    <option value="Verified">Verified</option>
                  </select>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
              <StatCard label="Total" value={REQUIREMENTS.length} />
              <StatCard label="Verified" value={verifiedCount} color="#2e7d4f" />
              <StatCard label="Approved" value={approvedCount} color="#2a4fa0" />
              <StatCard label="Draft / Review" value={REQUIREMENTS.filter(r => r.status === 'Draft' || r.status === 'Under Review').length} color="#8a6200" />
            </div>

            <div style={{ border: '1px solid var(--line)', borderRadius: 10, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'var(--surface-2)', borderBottom: '1px solid var(--line)' }}>
                    {['ID', 'Title', 'Verification', 'Risk Control', 'Status'].map(h => (
                      <th key={h} style={{ padding: '9px 14px', textAlign: 'left', fontSize: 11, fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-3)', fontWeight: 500, whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredReqs.map((req, i) => {
                    const expanded = expandedReq === req.id;
                    return (
                      <>
                        <tr
                          key={req.id}
                          onClick={() => setExpandedReq(expanded ? null : req.id)}
                          style={{ borderBottom: '1px solid var(--line)', cursor: 'pointer', background: expanded ? 'var(--surface-1)' : 'transparent' }}
                        >
                          <td style={{ padding: '10px 14px', fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--accent)', whiteSpace: 'nowrap' }}>{req.id}</td>
                          <td style={{ padding: '10px 14px', fontSize: 13 }}>{req.title}</td>
                          <td style={{ padding: '10px 14px', fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-3)' }}>{req.verificationMethod}</td>
                          <td style={{ padding: '10px 14px', fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-3)' }}>
                            {req.riskControls.length > 0 ? req.riskControls.join(', ') : '—'}
                          </td>
                          <td style={{ padding: '10px 14px' }}>
                            <Badge label={req.status} style={REQ_STATUS_STYLE[req.status]} />
                          </td>
                        </tr>
                        {expanded && (
                          <tr key={req.id + '-detail'} style={{ background: 'var(--surface-1)', borderBottom: '1px solid var(--line)' }}>
                            <td colSpan={5} style={{ padding: '14px 20px 18px' }}>
                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 32px' }}>
                                <div>
                                  <div style={{ fontSize: 10.5, fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--text-4)', marginBottom: 4 }}>Description</div>
                                  <div style={{ fontSize: 13, lineHeight: 1.6 }}>{req.description}</div>
                                </div>
                                <div>
                                  <div style={{ fontSize: 10.5, fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--text-4)', marginBottom: 4 }}>Rationale</div>
                                  <div style={{ fontSize: 13, lineHeight: 1.6, color: 'var(--text-2)' }}>{req.rationale}</div>
                                </div>
                                <div>
                                  <div style={{ fontSize: 10.5, fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--text-4)', marginBottom: 4 }}>User Need</div>
                                  <div style={{ fontFamily: 'var(--mono)', fontSize: 12 }}>{req.userNeed}</div>
                                </div>
                                <div>
                                  <div style={{ fontSize: 10.5, fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--text-4)', marginBottom: 4 }}>Verification Reference</div>
                                  <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: req.verificationRef ? 'var(--text-2)' : 'var(--text-4)' }}>
                                    {req.verificationRef ?? '—'}
                                  </div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                    );
                  })}
                  {filteredReqs.length === 0 && (
                    <tr><td colSpan={5} style={{ padding: 32, textAlign: 'center', color: 'var(--text-4)', fontSize: 13 }}>No requirements match.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            <p style={{ fontSize: 11, color: 'var(--text-4)', fontFamily: 'var(--mono)', marginTop: 10 }}>Click a row to expand description and rationale.</p>
          </>
        )}

        {/* ── Risk Register ── */}
        {tab === 'risk' && (
          <>
            <div style={{ marginBottom: 24 }}>
              <p style={{ fontFamily: 'var(--mono)', fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '0.14em', color: 'var(--text-4)', margin: '0 0 6px' }}>SaMD · ISO 14971</p>
              <h1 style={{ fontFamily: 'var(--serif)', fontWeight: 400, fontSize: 26, margin: 0, letterSpacing: '-0.02em' }}>Risk Register</h1>
            </div>

            <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
              <StatCard label="Hazards" value={HAZARDS.length} />
              <StatCard label="Controls" value={RISK_CONTROLS.length} />
              <StatCard label="Controls TODO" value={todoControls} color={todoControls > 0 ? '#8a6200' : '#2e7d4f'} />
              <StatCard label="Residual risk" value="TBD" color="#8a6200" />
            </div>

            {/* Hazard table */}
            <p style={{ fontFamily: 'var(--mono)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-4)', margin: '0 0 10px' }}>Hazard Register</p>
            <div style={{ border: '1px solid var(--line)', borderRadius: 10, overflow: 'hidden', marginBottom: 28 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'var(--surface-2)', borderBottom: '1px solid var(--line)' }}>
                    {['ID', 'Hazard', 'Hazardous Situation', 'Harm', 'S', 'Controls'].map(h => (
                      <th key={h} style={{ padding: '9px 14px', textAlign: 'left', fontSize: 11, fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-3)', fontWeight: 500 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {HAZARDS.map((hz, i) => (
                    <tr key={hz.id} style={{ borderBottom: i < HAZARDS.length - 1 ? '1px solid var(--line)' : 'none' }}>
                      <td style={{ padding: '10px 14px', fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--accent)', whiteSpace: 'nowrap' }}>{hz.id}</td>
                      <td style={{ padding: '10px 14px', fontSize: 13, fontWeight: 500 }}>{hz.hazard}</td>
                      <td style={{ padding: '10px 14px', fontSize: 13, color: 'var(--text-2)' }}>{hz.hazardousSituation}</td>
                      <td style={{ padding: '10px 14px', fontSize: 13, color: 'var(--text-2)' }}>{hz.harm}</td>
                      <td style={{ padding: '10px 14px' }}><SeverityChip value={hz.severity} /></td>
                      <td style={{ padding: '10px 14px', fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-3)' }}>{hz.controls.join(', ')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Risk controls table */}
            <p style={{ fontFamily: 'var(--mono)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-4)', margin: '0 0 10px' }}>Risk Controls</p>
            <div style={{ border: '1px solid var(--line)', borderRadius: 10, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'var(--surface-2)', borderBottom: '1px solid var(--line)' }}>
                    {['ID', 'Hazard(s)', 'Control', 'Type', 'Implementation', 'Residual'].map(h => (
                      <th key={h} style={{ padding: '9px 14px', textAlign: 'left', fontSize: 11, fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-3)', fontWeight: 500 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {RISK_CONTROLS.map((rc, i) => (
                    <tr key={rc.id} style={{ borderBottom: i < RISK_CONTROLS.length - 1 ? '1px solid var(--line)' : 'none' }}>
                      <td style={{ padding: '10px 14px', fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--accent)', whiteSpace: 'nowrap' }}>{rc.id}</td>
                      <td style={{ padding: '10px 14px', fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-3)' }}>{rc.hazardIds.join(', ')}</td>
                      <td style={{ padding: '10px 14px', fontSize: 13 }}>{rc.description}</td>
                      <td style={{ padding: '10px 14px' }}><Badge label={rc.type} style={CONTROL_TYPE_STYLE[rc.type]} /></td>
                      <td style={{ padding: '10px 14px', fontFamily: 'var(--mono)', fontSize: 11, color: rc.implementationRef === 'TODO' ? '#8a6200' : 'var(--text-2)' }}>
                        {rc.implementationRef}
                      </td>
                      <td style={{ padding: '10px 14px', fontFamily: 'var(--mono)', fontSize: 11, color: rc.residualRisk === 'TODO' ? '#8a6200' : 'var(--text-2)' }}>
                        {rc.residualRisk}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p style={{ fontSize: 11, color: 'var(--text-4)', fontFamily: 'var(--mono)', marginTop: 10 }}>
              S = severity (1–5). Probability and residual risk require clinical validation data.
            </p>
          </>
        )}

        {/* ── SOUP Inventory ── */}
        {tab === 'soup' && (
          <>
            <div style={{ marginBottom: 24 }}>
              <p style={{ fontFamily: 'var(--mono)', fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '0.14em', color: 'var(--text-4)', margin: '0 0 6px' }}>SaMD · IEC 62304 §8.1.2</p>
              <h1 style={{ fontFamily: 'var(--serif)', fontWeight: 400, fontSize: 26, margin: 0, letterSpacing: '-0.02em' }}>SOUP Inventory</h1>
            </div>

            <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
              <StatCard label="Total entries" value={SOUP.length} />
              <StatCard label="Production deps" value={SOUP.filter(s => s.scope === 'Production').length} color="#2a4fa0" />
              <StatCard label="Dev only" value={SOUP.filter(s => s.scope === 'Dev only').length} color="var(--text-3)" />
              <StatCard label="Anomaly review pending" value={soupPending} color={soupPending > 0 ? '#8a6200' : '#2e7d4f'} />
            </div>

            <div style={{ border: '1px solid var(--line)', borderRadius: 10, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'var(--surface-2)', borderBottom: '1px solid var(--line)' }}>
                    {['Package', 'Version', 'Purpose', 'License', 'Scope', 'Anomaly Review', 'Assessor'].map(h => (
                      <th key={h} style={{ padding: '9px 14px', textAlign: 'left', fontSize: 11, fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-3)', fontWeight: 500, whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {SOUP.map((s, i) => (
                    <tr key={s.name} style={{ borderBottom: i < SOUP.length - 1 ? '1px solid var(--line)' : 'none' }}>
                      <td style={{ padding: '10px 14px', fontFamily: 'var(--mono)', fontSize: 13, color: 'var(--text)', fontWeight: 500 }}>{s.name}</td>
                      <td style={{ padding: '10px 14px', fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--text-3)' }}>{s.version}</td>
                      <td style={{ padding: '10px 14px', fontSize: 13 }}>{s.purpose}</td>
                      <td style={{ padding: '10px 14px', fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-3)' }}>{s.license}</td>
                      <td style={{ padding: '10px 14px' }}><Badge label={s.scope} style={SCOPE_STYLE[s.scope]} /></td>
                      <td style={{ padding: '10px 14px', fontFamily: 'var(--mono)', fontSize: 11, color: s.anomalyReviewDate ? 'var(--text-2)' : '#8a6200' }}>
                        {s.anomalyReviewDate ?? 'TODO'}
                      </td>
                      <td style={{ padding: '10px 14px', fontFamily: 'var(--mono)', fontSize: 11, color: s.assessor ? 'var(--text-2)' : '#8a6200' }}>
                        {s.assessor ?? 'TODO'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p style={{ fontSize: 11, color: 'var(--text-4)', fontFamily: 'var(--mono)', marginTop: 10 }}>
              Per IEC 62304 §8.1.2, all entries require anomaly review before regulated release.
            </p>
          </>
        )}

        {/* ── Verification ── */}
        {tab === 'verification' && (
          <>
            <div style={{ marginBottom: 24 }}>
              <p style={{ fontFamily: 'var(--mono)', fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '0.14em', color: 'var(--text-4)', margin: '0 0 6px' }}>SaMD · IEC 62304 §5.6</p>
              <h1 style={{ fontFamily: 'var(--serif)', fontWeight: 400, fontSize: 26, margin: 0, letterSpacing: '-0.02em' }}>Verification</h1>
            </div>

            {/* Coverage summary card */}
            <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
              <StatCard label="Tests" value={VERIFICATION_TESTS.length} />
              <StatCard label="Passing" value={passCount} color="#2e7d4f" />
              <StatCard label="Failing" value={VERIFICATION_TESTS.filter(t => t.result === 'Fail').length} color="#a02020" />
              <StatCard label="Coverage" value="100%" color="#2e7d4f" />
            </div>

            <div style={{ border: '1px solid var(--line)', borderRadius: 10, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'var(--surface-2)', borderBottom: '1px solid var(--line)' }}>
                    {['Test ID', 'Description', 'Requirements', 'Result', 'CI Commit'].map(h => (
                      <th key={h} style={{ padding: '9px 14px', textAlign: 'left', fontSize: 11, fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-3)', fontWeight: 500 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {VERIFICATION_TESTS.map((t, i) => (
                    <tr key={t.id} style={{ borderBottom: i < VERIFICATION_TESTS.length - 1 ? '1px solid var(--line)' : 'none' }}>
                      <td style={{ padding: '10px 14px', fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-2)', whiteSpace: 'nowrap', maxWidth: 240 }}>
                        <div style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.id}</div>
                      </td>
                      <td style={{ padding: '10px 14px', fontSize: 13 }}>{t.description}</td>
                      <td style={{ padding: '10px 14px', fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--accent)' }}>
                        {t.linkedReqs.join(', ')}
                      </td>
                      <td style={{ padding: '10px 14px' }}>
                        <Badge label={t.result} style={TEST_RESULT_STYLE[t.result]} />
                      </td>
                      <td style={{ padding: '10px 14px', fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-3)' }}>
                        {t.ciRun ? (
                          <a href={`${SAMD_META.repo}/commit/${t.ciRun}`} target="_blank" rel="noreferrer"
                            style={{ color: 'var(--accent)', textDecoration: 'none' }}>
                            {t.ciRun.slice(0, 7)}
                          </a>
                        ) : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p style={{ fontSize: 11, color: 'var(--text-4)', fontFamily: 'var(--mono)', marginTop: 10 }}>
              Coverage report generated by pytest-cov and attached to each GitHub Release.
            </p>
          </>
        )}

        {/* ── Releases ── */}
        {tab === 'releases' && (
          <>
            <div style={{ marginBottom: 24 }}>
              <p style={{ fontFamily: 'var(--mono)', fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '0.14em', color: 'var(--text-4)', margin: '0 0 6px' }}>SaMD · Configuration management</p>
              <h1 style={{ fontFamily: 'var(--serif)', fontWeight: 400, fontSize: 26, margin: 0, letterSpacing: '-0.02em' }}>Releases</h1>
            </div>

            {RELEASES.map(rel => (
              <div key={rel.version} style={{ background: 'var(--surface-1)', border: '1px solid var(--line)', borderRadius: 10, padding: '20px 24px', marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <span style={{ fontFamily: 'var(--mono)', fontSize: 18, fontWeight: 600, color: 'var(--accent)' }}>{rel.version}</span>
                    <Badge label={rel.status} style={RELEASE_STATUS_STYLE[rel.status]} />
                  </div>
                  <span style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--text-4)' }}>{rel.date}</span>
                </div>

                <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap', marginBottom: 16 }}>
                  <div>
                    <div style={{ fontSize: 10.5, fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-4)', marginBottom: 3 }}>Algorithm version</div>
                    <div style={{ fontFamily: 'var(--mono)', fontSize: 13 }}>{rel.algorithmVersion}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 10.5, fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-4)', marginBottom: 3 }}>Model version</div>
                    <div style={{ fontFamily: 'var(--mono)', fontSize: 13, color: rel.modelVersion === 'unset' ? '#8a6200' : 'var(--text)' }}>{rel.modelVersion}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 10.5, fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-4)', marginBottom: 3 }}>Coverage</div>
                    <div style={{ fontFamily: 'var(--mono)', fontSize: 13, color: rel.coverage === 100 ? '#2e7d4f' : '#a02020' }}>{rel.coverage}%</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 10.5, fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-4)', marginBottom: 3 }}>Approved by</div>
                    <div style={{ fontFamily: 'var(--mono)', fontSize: 12, color: rel.approvedBy.length > 0 ? 'var(--text)' : '#8a6200' }}>
                      {rel.approvedBy.length > 0 ? rel.approvedBy.join(', ') : 'Pending'}
                    </div>
                  </div>
                </div>

                {/* Checklist */}
                <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 14 }}>
                  {[
                    { label: 'Tests pass', ok: rel.testsPass },
                    { label: 'SBOM generated', ok: rel.sbom },
                    { label: '2-person approval', ok: rel.approvedBy.length >= 2 },
                  ].map(item => (
                    <span key={item.label} style={{ fontSize: 12, fontFamily: 'var(--mono)', color: item.ok ? '#2e7d4f' : '#8a6200' }}>
                      {item.ok ? '✓' : '○'} {item.label}
                    </span>
                  ))}
                </div>

                <div style={{ fontSize: 13, color: 'var(--text-3)', lineHeight: 1.6, borderTop: '1px solid var(--line)', paddingTop: 12 }}>
                  {rel.notes}
                </div>
              </div>
            ))}
          </>
        )}
      </main>
    </div>
  );
}