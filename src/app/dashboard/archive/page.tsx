'use client';
import Link from 'next/link';
import { useState, useMemo } from 'react';

type Status = 'Stable' | 'Improved' | 'Declined' | 'Deceased';

const STATUS_STYLE: Record<Status, { bg: string; color: string }> = {
  Stable:   { bg: 'rgba(35,133,81,0.22)',   color: '#3DCC91' },
  Improved: { bg: 'rgba(45,114,210,0.22)',   color: '#669EFF' },
  Declined: { bg: 'rgba(200,150,25,0.22)',   color: '#FFC940' },
  Deceased: { bg: 'rgba(95,107,124,0.22)',   color: '#8F99A8' },
};

function Badge({ label, style }: { label: string; style: { bg: string; color: string } }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', padding: '2px 8px',
      borderRadius: 99, fontSize: 11, fontWeight: 500,
      background: style.bg, color: style.color,
      fontFamily: 'var(--mono)', letterSpacing: '0.03em',
    }}>{label}</span>
  );
}

const ARCHIVED = [
  { id:'ARC-001', name:'Subject A', room:'MOH 303', admitted:'Sep 4, 2024',  discharged:'Nov 28, 2024', stay:85,  falls:0, reason:'Discharged — home',           status:'Stable'   as Status },
  { id:'ARC-002', name:'Subject B', room:'MOH 307', admitted:'Aug 12, 2024', discharged:'Nov 21, 2024', stay:101, falls:2, reason:'Transferred — higher care',    status:'Declined' as Status },
  { id:'ARC-003', name:'Subject C', room:'MOH 305', admitted:'Oct 1, 2024',  discharged:'Nov 14, 2024', stay:44,  falls:1, reason:'Discharged — rehab complete',  status:'Improved' as Status },
  { id:'ARC-004', name:'Subject D', room:'MOH 302', admitted:'Jul 20, 2024', discharged:'Oct 30, 2024', stay:102, falls:3, reason:'Transferred — acute hospital',  status:'Declined' as Status },
  { id:'ARC-005', name:'Subject E', room:'MOH 309', admitted:'Sep 19, 2024', discharged:'Oct 18, 2024', stay:29,  falls:0, reason:'Discharged — home',            status:'Stable'   as Status },
  { id:'ARC-006', name:'Subject F', room:'MOH 301', admitted:'Jun 5, 2024',  discharged:'Sep 29, 2024', stay:116, falls:5, reason:'Deceased',                     status:'Deceased' as Status },
  { id:'ARC-007', name:'Subject G', room:'MOH 310', admitted:'Aug 28, 2024', discharged:'Sep 22, 2024', stay:25,  falls:1, reason:'Transferred — higher care',    status:'Declined' as Status },
  { id:'ARC-008', name:'Subject H', room:'MOH 304', admitted:'May 14, 2024', discharged:'Aug 9, 2024',  stay:87,  falls:2, reason:'Discharged — rehab complete',  status:'Improved' as Status },
  { id:'ARC-009', name:'Subject I', room:'MOH 306', admitted:'Jul 3, 2024',  discharged:'Jul 31, 2024', stay:28,  falls:0, reason:'Discharged — home',            status:'Stable'   as Status },
  { id:'ARC-010', name:'Subject J', room:'MOH 308', admitted:'Apr 22, 2024', discharged:'Jul 15, 2024', stay:84,  falls:4, reason:'Transferred — acute hospital',  status:'Declined' as Status },
  { id:'ARC-011', name:'Subject K', room:'MOH 303', admitted:'Mar 8, 2024',  discharged:'Jun 10, 2024', stay:94,  falls:1, reason:'Discharged — home',            status:'Stable'   as Status },
  { id:'ARC-012', name:'Subject L', room:'MOH 307', admitted:'Feb 1, 2024',  discharged:'May 20, 2024', stay:109, falls:6, reason:'Deceased',                     status:'Deceased' as Status },
];

const STATUS_FILTERS: (Status | 'All')[] = ['All', 'Stable', 'Improved', 'Declined', 'Deceased'];

export default function ArchivePage() {
  const [statusFilter, setStatusFilter] = useState<Status | 'All'>('All');
  const [search, setSearch] = useState('');

  const visible = useMemo(() => {
    const q = search.toLowerCase();
    return ARCHIVED.filter(r =>
      (statusFilter === 'All' || r.status === statusFilter) &&
      (!q || r.name.toLowerCase().includes(q) || r.room.toLowerCase().includes(q) || r.id.toLowerCase().includes(q) || r.reason.toLowerCase().includes(q))
    );
  }, [search, statusFilter]);

  const totalFalls = ARCHIVED.reduce((s, r) => s + r.falls, 0);
  const avgStay = Math.round(ARCHIVED.reduce((s, r) => s + r.stay, 0) / ARCHIVED.length);

  return (
    <div className="app">
      {/* Sidebar */}
      <nav className="sidebar">
        <Link href="/" style={{ textDecoration: 'none', color: 'inherit' }}>
          <div className="brand">
            <span className="brand-name">Ambient <em>Intelligence</em></span>
          </div>
        </Link>

        <div className="nav-section">
          <p className="nav-label">Clinical</p>
          {([
            ['/dashboard/overview',  'Nurse Dashboard'],
            ['/dashboard/alerts',    'Alerts'],
            ['/dashboard/reports',   'Reports'],
            ['/dashboard/analytics', 'Analytics'],
            ['/dashboard/archive',   'Resident Archive'],
          ] as [string, string][]).map(([href, label]) => (
            <Link key={href} href={href}
              className={`nav-item${href === '/dashboard/archive' ? ' active' : ''}`}
              style={{ textDecoration: 'none', color: 'inherit' }}>
              {label}
            </Link>
          ))}
        </div>

        <div className="nav-section">
          <p className="nav-label">Pages</p>
          {([
            ['/engineering',     'Engineering Hub'],
            ['/bom',             'Bill of Materials'],
            ['/gapanalysis',     'Gap Analysis'],
            ['/samd',            'SaMD'],
          ] as [string, string][]).map(([href, label]) => (
            <Link key={href} href={href}
              className="nav-item"
              style={{ textDecoration: 'none', color: 'inherit' }}>
              {label}
            </Link>
          ))}
        </div>

        <div style={{ marginTop: 'auto' }}>
          <p className="nav-label">Summary</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: '0 8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-3)' }}>
              <span>Total archived</span>
              <span style={{ fontFamily: 'var(--mono)', fontWeight: 600, color: 'var(--text-2)' }}>{ARCHIVED.length}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#FFC940' }}>
              <span>Fall events</span>
              <span style={{ fontFamily: 'var(--mono)', fontWeight: 600 }}>{totalFalls}</span>
            </div>
          </div>
        </div>
      </nav>

      {/* Main */}
      <main style={{ padding: '32px 40px', overflowY: 'auto' }}>

        {/* Stats box */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 28 }}>
          <div style={{ background: 'var(--surface-1)', border: '1px solid var(--line-strong)', borderRadius: 10, padding: '14px 20px', minWidth: 200 }}>
            <p style={{ fontFamily: 'var(--mono)', fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '0.14em', color: 'var(--text-4)', margin: '0 0 6px' }}>
              Avg. Length of Stay
            </p>
            <p style={{ fontFamily: 'var(--serif)', fontSize: 28, fontWeight: 400, margin: 0, letterSpacing: '-0.02em' }}>
              {avgStay} days
            </p>
            <p style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-3)', margin: '5px 0 0' }}>
              across {ARCHIVED.length} archived residents
            </p>
          </div>
        </div>

        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <p style={{ fontFamily: 'var(--mono)', fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '0.14em', color: 'var(--text-4)', margin: '0 0 6px' }}>
            Clinical · MOH Floor
          </p>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16 }}>
            <h1 style={{ fontFamily: 'var(--serif)', fontWeight: 400, fontSize: 26, margin: 0, letterSpacing: '-0.02em' }}>
              Resident Archive
            </h1>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search name, room, ID…"
                style={{
                  padding: '7px 12px', borderRadius: 999, border: '1px solid var(--line-strong)',
                  background: 'transparent', fontSize: 13, color: 'var(--text)', outline: 'none', width: 220,
                }}
              />
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value as Status | 'All')}
                style={{
                  padding: '7px 12px', borderRadius: 999, border: '1px solid var(--line-strong)',
                  background: 'var(--surface-1)', fontSize: 13, color: 'var(--text)', outline: 'none', cursor: 'pointer',
                }}
              >
                {STATUS_FILTERS.map(f => (
                  <option key={f} value={f}>{f === 'All' ? 'All statuses' : f}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Stats row */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
          {[
            { label: 'Total Records',     value: ARCHIVED.length,                                           color: 'var(--text)' },
            { label: 'Stable',            value: ARCHIVED.filter(r => r.status === 'Stable').length,        color: '#3DCC91' },
            { label: 'Improved',          value: ARCHIVED.filter(r => r.status === 'Improved').length,      color: '#669EFF' },
            { label: 'Declined',          value: ARCHIVED.filter(r => r.status === 'Declined').length,      color: '#FFC940' },
            { label: 'Deceased',          value: ARCHIVED.filter(r => r.status === 'Deceased').length,      color: '#8F99A8' },
            { label: 'Total Fall Events', value: totalFalls,                                                 color: 'var(--text-2)' },
          ].map(stat => (
            <div key={stat.label} style={{ background: 'var(--surface-1)', border: '1px solid var(--line)', borderRadius: 8, padding: '8px 16px', display: 'flex', flexDirection: 'column', gap: 2 }}>
              <span style={{ fontFamily: 'var(--mono)', fontSize: 20, fontWeight: 500, color: stat.color }}>{stat.value}</span>
              <span style={{ fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{stat.label}</span>
            </div>
          ))}
        </div>

        {/* Table */}
        <div style={{ border: '1px solid var(--line)', borderRadius: 10, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--surface-2)', borderBottom: '1px solid var(--line)' }}>
                {['ID', 'Resident', 'Room', 'Admitted', 'Discharged', 'Stay', 'Falls', 'Reason', 'Status'].map(h => (
                  <th key={h} style={{ padding: '9px 14px', textAlign: h === 'Falls' || h === 'Stay' ? 'right' : 'left', fontSize: 11, fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-3)', fontWeight: 500, whiteSpace: 'nowrap' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visible.map((r, i) => (
                <tr key={r.id} style={{ borderBottom: i < visible.length - 1 ? '1px solid var(--line)' : 'none' }}>
                  <td style={{ padding: '9px 14px', fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--accent)', whiteSpace: 'nowrap' }}>{r.id}</td>
                  <td style={{ padding: '9px 14px', fontSize: 13 }}>{r.name}</td>
                  <td style={{ padding: '9px 14px', fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--text-2)', whiteSpace: 'nowrap' }}>{r.room}</td>
                  <td style={{ padding: '9px 14px', fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--text-3)', whiteSpace: 'nowrap' }}>{r.admitted}</td>
                  <td style={{ padding: '9px 14px', fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--text-3)', whiteSpace: 'nowrap' }}>{r.discharged}</td>
                  <td style={{ padding: '9px 14px', fontFamily: 'var(--mono)', fontSize: 13, textAlign: 'right', color: 'var(--text-2)' }}>{r.stay}d</td>
                  <td style={{ padding: '9px 14px', fontFamily: 'var(--mono)', fontSize: 13, textAlign: 'right', color: r.falls > 2 ? '#FF7373' : r.falls > 0 ? '#FFC940' : 'var(--text-4)', fontWeight: r.falls > 0 ? 500 : 400 }}>{r.falls}</td>
                  <td style={{ padding: '9px 14px', fontSize: 13, color: 'var(--text-2)' }}>{r.reason}</td>
                  <td style={{ padding: '9px 14px' }}><Badge label={r.status} style={STATUS_STYLE[r.status]} /></td>
                </tr>
              ))}
              {visible.length === 0 && (
                <tr>
                  <td colSpan={9} style={{ padding: '32px', textAlign: 'center', color: 'var(--text-4)', fontSize: 13 }}>
                    No records match your filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <p style={{ fontSize: 11, color: 'var(--text-4)', fontFamily: 'var(--mono)', marginTop: 10 }}>
          {visible.length} of {ARCHIVED.length} records · MOH 301–312 · pilot cohort
        </p>
      </main>
    </div>
  );
}
