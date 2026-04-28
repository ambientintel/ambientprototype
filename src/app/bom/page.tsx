'use client';
import Link from 'next/link';

import { useState, useMemo } from 'react';
import { PARTS, ASSEMBLIES, BUILD_ORDERS, type Part, type BomLine, type Lifecycle } from './data';

type Tab = 'parts' | 'bom' | 'builds';

const LIFECYCLE_STYLE: Record<Lifecycle, { bg: string; color: string }> = {
  Active:   { bg: 'rgba(35,133,81,0.22)',   color: '#3DCC91' },
  NRND:     { bg: 'rgba(200,150,25,0.22)',  color: '#FFC940' },
  EOL:      { bg: 'rgba(205,66,70,0.22)',   color: '#FF7373' },
  Obsolete: { bg: 'rgba(95,107,124,0.22)',  color: '#8F99A8' },
};

const STATUS_STYLE: Record<string, { bg: string; color: string }> = {
  Draft:       { bg: 'rgba(95,107,124,0.20)',  color: '#8F99A8' },
  Released:    { bg: 'rgba(35,133,81,0.22)',   color: '#3DCC91' },
  'In Progress': { bg: 'rgba(45,114,210,0.22)', color: '#669EFF' },
  Complete:    { bg: 'rgba(35,133,81,0.35)',   color: '#3DCC91' },
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

function LifecycleBadge({ lc }: { lc: Lifecycle }) {
  return <Badge label={lc} style={LIFECYCLE_STYLE[lc]} />;
}

function partByPn(pn: string) {
  return PARTS.find(p => p.pn === pn);
}

function BomRow({ line, depth = 0, expandedPns, toggle }: {
  line: BomLine;
  depth?: number;
  expandedPns: Set<string>;
  toggle: (pn: string) => void;
}) {
  const part = partByPn(line.pn);
  const hasChildren = (line.children?.length ?? 0) > 0;
  const expanded = expandedPns.has(line.pn);
  const isNrndOrEol = part && (part.lifecycle === 'NRND' || part.lifecycle === 'EOL' || part.lifecycle === 'Obsolete');

  return (
    <>
      <tr style={{ background: depth > 0 ? 'var(--surface-1)' : 'transparent' }}>
        <td style={{ padding: '8px 14px', paddingLeft: 14 + depth * 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {hasChildren ? (
              <button onClick={() => toggle(line.pn)} style={{
                width: 18, height: 18, borderRadius: 4, border: '1px solid var(--line-strong)',
                background: expanded ? 'var(--surface-3)' : 'transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 8, color: 'var(--text-3)', cursor: 'pointer', flexShrink: 0,
              }}>
                {expanded ? '▼' : '▶'}
              </button>
            ) : (
              <span style={{ width: 18, flexShrink: 0 }} />
            )}
            <span style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--text-2)' }}>{line.pn}</span>
          </div>
        </td>
        <td style={{ padding: '8px 14px', fontSize: 13 }}>
          {part?.description ?? line.pn}
          {line.notes && <span style={{ marginLeft: 8, fontSize: 11, color: 'var(--text-3)' }}>{line.notes}</span>}
        </td>
        <td style={{ padding: '8px 14px', fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-3)' }}>{line.designator}</td>
        <td style={{ padding: '8px 14px', fontFamily: 'var(--mono)', fontSize: 13, textAlign: 'right' }}>{line.qty}</td>
        <td style={{ padding: '8px 14px' }}>
          {part ? <LifecycleBadge lc={part.lifecycle} /> : null}
        </td>
        <td style={{ padding: '8px 14px', fontFamily: 'var(--mono)', fontSize: 12, color: isNrndOrEol ? '#FF7373' : 'var(--text-2)' }}>
          {part?.mpn ?? '—'}
        </td>
        <td style={{ padding: '8px 14px', fontFamily: 'var(--mono)', fontSize: 13, textAlign: 'right', color: 'var(--text-2)' }}>
          {part?.unitCost != null ? `$${(part.unitCost * line.qty).toFixed(2)}` : '—'}
        </td>
      </tr>
      {hasChildren && expanded && line.children!.map(child => (
        <BomRow key={child.pn + child.designator} line={child} depth={depth + 1} expandedPns={expandedPns} toggle={toggle} />
      ))}
    </>
  );
}

export default function BomPage() {
  const [tab, setTab] = useState<Tab>('parts');
  const [search, setSearch] = useState('');
  const [lcFilter, setLcFilter] = useState<Lifecycle | 'All'>('All');
  const [selectedAssembly, setSelectedAssembly] = useState(ASSEMBLIES[0].pn);
  const [expandedPns, setExpandedPns] = useState<Set<string>>(new Set(['AMB-ASM-001']));

  const toggleExpand = (pn: string) => {
    setExpandedPns(prev => {
      const next = new Set(prev);
      next.has(pn) ? next.delete(pn) : next.add(pn);
      return next;
    });
  };

  const filteredParts = useMemo(() => {
    const q = search.toLowerCase();
    return PARTS.filter(p =>
      (lcFilter === 'All' || p.lifecycle === lcFilter) &&
      (!q || p.pn.toLowerCase().includes(q) || p.description.toLowerCase().includes(q) ||
        p.mpn.toLowerCase().includes(q) || p.manufacturer.toLowerCase().includes(q))
    );
  }, [search, lcFilter]);

  const assembly = ASSEMBLIES.find(a => a.pn === selectedAssembly)!;

  const totalBomCost = assembly.bom.reduce((sum, line) => {
    const part = partByPn(line.pn);
    return sum + (part?.unitCost != null ? part.unitCost * line.qty : 0);
  }, 0);
  const costKnown = assembly.bom.some(l => (partByPn(l.pn)?.unitCost ?? null) != null);

  const totalUnitCost = PARTS.reduce((sum, p) => sum + (p.unitCost ?? 0), 0);
  const pricedPartCount = PARTS.filter(p => p.unitCost != null && p.unitCost > 0).length;

  const nrndCount = PARTS.filter(p => p.lifecycle === 'NRND' || p.lifecycle === 'EOL').length;
  const lowStockCount = 0;

  const navItems: { key: Tab; label: string }[] = [
    { key: 'parts', label: 'Parts Library' },
    { key: 'bom',   label: 'Assemblies & BOMs' },
    { key: 'builds', label: 'Build Orders' },
  ];

  return (
    <div className="app">
      {/* Sidebar */}
      <nav className="sidebar">
        <Link href="/home" style={{ textDecoration: "none", color: "inherit" }}>
          <div className="brand">
            <span className="brand-name">Ambient <em>Intelligence</em></span>
          </div>
        </Link>

        <div className="nav-section">
          <p className="nav-label">PLM</p>
          {navItems.map(item => (
            <button key={item.key} className={`nav-item${tab === item.key ? ' active' : ''}`} onClick={() => setTab(item.key)}>
              {item.label}
            </button>
          ))}
        </div>


        <div className="nav-section">
          <p className="nav-label">Pages</p>
          {([
            ['/dashboard', 'Nurse Dashboard'],
            ['/bom',       'Bill of Materials'],
            ['/gapanalysis','Gap Analysis'],
            ['/samd',      'SaMD'],
            ['/cloud',     'Cloud'],
          ] as [string,string][]).map(([href, label]) => (
            <Link key={href} href={href}
              className={`nav-item${typeof window !== 'undefined' && window.location.pathname === href ? ' active' : ''}`}
              style={{ textDecoration: 'none', color: 'inherit' }}>
              {label}
            </Link>
          ))}
        </div>

        {/* Alert summary */}
        <div style={{ marginTop: 'auto' }}>
          <p className="nav-label">Alerts</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: '0 8px' }}>
            {nrndCount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#FFC940' }}>
                <span>NRND / EOL parts</span>
                <span style={{ fontFamily: 'var(--mono)', fontWeight: 600 }}>{nrndCount}</span>
              </div>
            )}
            {lowStockCount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#FF7373' }}>
                <span>Low stock</span>
                <span style={{ fontFamily: 'var(--mono)', fontWeight: 600 }}>{lowStockCount}</span>
              </div>
            )}
            {nrndCount === 0 && lowStockCount === 0 && (
              <span style={{ fontSize: 12, color: 'var(--text-4)' }}>No alerts</span>
            )}
          </div>
        </div>
      </nav>

      {/* Main */}
      <main style={{ padding: '32px 40px', overflowY: 'auto' }}>

        {/* ── Cost summary box ── */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 28 }}>
          <div style={{
            background: 'var(--surface-1)', border: '1px solid var(--line-strong)',
            borderRadius: 10, padding: '14px 20px', minWidth: 200,
          }}>
            <p style={{ fontFamily: 'var(--mono)', fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '0.14em', color: 'var(--text-4)', margin: '0 0 6px' }}>
              Total Unit Cost
            </p>
            <p style={{ fontFamily: 'var(--serif)', fontSize: 28, fontWeight: 400, margin: 0, letterSpacing: '-0.02em' }}>
              ${totalUnitCost.toFixed(2)}
            </p>
            <p style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-3)', margin: '5px 0 0' }}>
              {pricedPartCount} of {PARTS.length} parts priced
            </p>
          </div>
        </div>

        {/* ── Parts Library ── */}
        {tab === 'parts' && (
          <>
            <div style={{ marginBottom: 24 }}>
              <p style={{ fontFamily: 'var(--mono)', fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '0.14em', color: 'var(--text-4)', margin: '0 0 6px' }}>
                PLM · Parts
              </p>
              <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16 }}>
                <h1 style={{ fontFamily: 'var(--serif)', fontWeight: 400, fontSize: 26, margin: 0, letterSpacing: '-0.02em' }}>
                  Parts Library
                </h1>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <input
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Search parts, MPN…"
                    style={{
                      padding: '7px 12px', borderRadius: 999, border: '1px solid var(--line-strong)',
                      background: 'transparent', fontSize: 13, color: 'var(--text)', outline: 'none', width: 220,
                    }}
                  />
                  <select
                    value={lcFilter}
                    onChange={e => setLcFilter(e.target.value as Lifecycle | 'All')}
                    style={{
                      padding: '7px 12px', borderRadius: 999, border: '1px solid var(--line-strong)',
                      background: 'var(--surface-1)', fontSize: 13, color: 'var(--text)', outline: 'none', cursor: 'pointer',
                    }}
                  >
                    <option value="All">All lifecycle</option>
                    <option value="Active">Active</option>
                    <option value="NRND">NRND</option>
                    <option value="EOL">EOL</option>
                    <option value="Obsolete">Obsolete</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
              {[
                { label: 'Total Parts', value: PARTS.length, color: 'var(--text)' },
                { label: 'Active', value: PARTS.filter(p => p.lifecycle === 'Active').length, color: '#3DCC91' },
                { label: 'NRND', value: PARTS.filter(p => p.lifecycle === 'NRND').length, color: '#FFC940' },
                { label: 'EOL', value: PARTS.filter(p => p.lifecycle === 'EOL').length, color: '#FF7373' },
                { label: 'With Pricing', value: PARTS.filter(p => p.unitCost != null && p.unitCost > 0).length, color: 'var(--text-2)' },
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
                    {['Part #', 'Rev', 'Description', 'Category', 'MPN', 'Manufacturer', 'Lifecycle', 'Stock', 'Unit Cost'].map(h => (
                      <th key={h} style={{ padding: '9px 14px', textAlign: 'left', fontSize: 11, fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-3)', fontWeight: 500, whiteSpace: 'nowrap' }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredParts.map((part, i) => (
                    <tr key={part.pn} style={{ borderBottom: i < filteredParts.length - 1 ? '1px solid var(--line)' : 'none' }}>
                      <td style={{ padding: '9px 14px', fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--accent)', whiteSpace: 'nowrap' }}>{part.pn}</td>
                      <td style={{ padding: '9px 14px', fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-4)' }}>{part.rev}</td>
                      <td style={{ padding: '9px 14px', fontSize: 13 }}>{part.description}</td>
                      <td style={{ padding: '9px 14px', fontSize: 12, color: 'var(--text-3)' }}>{part.category}</td>
                      <td style={{ padding: '9px 14px', fontFamily: 'var(--mono)', fontSize: 12, whiteSpace: 'nowrap' }}>{part.mpn}</td>
                      <td style={{ padding: '9px 14px', fontSize: 13, color: 'var(--text-2)' }}>{part.manufacturer}</td>
                      <td style={{ padding: '9px 14px' }}><LifecycleBadge lc={part.lifecycle} /></td>
                      <td style={{ padding: '9px 14px', fontFamily: 'var(--mono)', fontSize: 13, textAlign: 'right', color: 'var(--text-3)' }}>—</td>
                      <td style={{ padding: '9px 14px', fontFamily: 'var(--mono)', fontSize: 13, textAlign: 'right', color: 'var(--text-2)' }}>
                        {part.unitCost != null && part.unitCost > 0 ? (
                          <>
                            {part.priceSource === 'researched' && <span style={{ color: 'var(--text-4)' }}>~ </span>}
                            ${part.unitCost.toFixed(3)}
                            {part.priceSource === 'researched' && <div style={{ fontSize: 10, color: 'var(--text-4)', marginTop: 2 }}>est. qty 1</div>}
                          </>
                        ) : '—'}
                        {part.supplier && part.priceSource === 'csv' && <div style={{ fontSize: 10, color: 'var(--text-4)' }}>{part.supplier}</div>}
                      </td>
                    </tr>
                  ))}
                  {filteredParts.length === 0 && (
                    <tr>
                      <td colSpan={9} style={{ padding: '32px', textAlign: 'center', color: 'var(--text-4)', fontSize: 13 }}>
                        No parts match your filter.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <p style={{ fontSize: 11, color: 'var(--text-4)', fontFamily: 'var(--mono)', marginTop: 10 }}>
              ~ estimated from DigiKey / Mouser at qty 1 · no symbol = from BOM CSV export
            </p>
          </>
        )}

        {/* ── BOM View ── */}
        {tab === 'bom' && (
          <>
            <div style={{ marginBottom: 24 }}>
              <p style={{ fontFamily: 'var(--mono)', fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '0.14em', color: 'var(--text-4)', margin: '0 0 6px' }}>
                PLM · Assemblies
              </p>
              <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16 }}>
                <h1 style={{ fontFamily: 'var(--serif)', fontWeight: 400, fontSize: 26, margin: 0, letterSpacing: '-0.02em' }}>
                  Assemblies & BOMs
                </h1>
                <select
                  value={selectedAssembly}
                  onChange={e => setSelectedAssembly(e.target.value)}
                  style={{ padding: '7px 12px', borderRadius: 999, border: '1px solid var(--line-strong)', background: 'var(--surface-1)', fontSize: 13, color: 'var(--text)', outline: 'none', cursor: 'pointer' }}
                >
                  {ASSEMBLIES.map(a => (
                    <option key={a.pn} value={a.pn}>{a.pn} — {a.description}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Assembly header card */}
            <div style={{ background: 'var(--surface-1)', border: '1px solid var(--line)', borderRadius: 10, padding: '16px 20px', marginBottom: 24, display: 'flex', gap: 40 }}>
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-4)', fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>Assembly</div>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 14, color: 'var(--accent)' }}>{assembly.pn}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-4)', fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>Revision</div>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 14 }}>{assembly.rev}</div>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, color: 'var(--text-4)', fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>Description</div>
                <div style={{ fontSize: 14 }}>{assembly.description}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-4)', fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>BOM Cost</div>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 18, fontWeight: 500 }}>
                  {costKnown ? `$${totalBomCost.toFixed(2)}` : '—'}
                </div>
                {costKnown && <div style={{ fontSize: 10, color: 'var(--text-4)' }}>partial (priced lines only)</div>}
              </div>
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-4)', fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>Line Items</div>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 18, fontWeight: 500 }}>{assembly.bom.length}</div>
              </div>
            </div>

            {/* BOM table */}
            <div style={{ border: '1px solid var(--line)', borderRadius: 10, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'var(--surface-2)', borderBottom: '1px solid var(--line)' }}>
                    {['Part #', 'Description', 'Designator', 'Qty', 'Lifecycle', 'MPN', 'Ext. Cost'].map(h => (
                      <th key={h} style={{ padding: '9px 14px', textAlign: h === 'Qty' || h === 'Ext. Cost' ? 'right' : 'left', fontSize: 11, fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-3)', fontWeight: 500 }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {assembly.bom.map((line, i) => (
                    <BomRow
                      key={line.pn + line.designator}
                      line={line}
                      expandedPns={expandedPns}
                      toggle={toggleExpand}
                    />
                  ))}
                </tbody>
              </table>
            </div>
            <p style={{ fontSize: 11, color: 'var(--text-4)', fontFamily: 'var(--mono)', marginTop: 12 }}>
              ▶ rows are sub-assemblies — click to expand. Cost excludes PCB-integrated antenna and mechanical.
            </p>
          </>
        )}

        {/* ── Build Orders ── */}
        {tab === 'builds' && (
          <>
            <div style={{ marginBottom: 24 }}>
              <p style={{ fontFamily: 'var(--mono)', fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '0.14em', color: 'var(--text-4)', margin: '0 0 6px' }}>
                PLM · Manufacturing
              </p>
              <h1 style={{ fontFamily: 'var(--serif)', fontWeight: 400, fontSize: 26, margin: 0, letterSpacing: '-0.02em' }}>
                Build Orders
              </h1>
            </div>

            <div style={{ border: '1px solid var(--line)', borderRadius: 10, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'var(--surface-2)', borderBottom: '1px solid var(--line)' }}>
                    {['Build #', 'Assembly', 'Rev', 'Qty', 'Target Date', 'Status', 'Shortage'].map(h => (
                      <th key={h} style={{ padding: '9px 14px', textAlign: h === 'Qty' ? 'right' : 'left', fontSize: 11, fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-3)', fontWeight: 500 }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {BUILD_ORDERS.map((bo, i) => {
                    const asm = ASSEMBLIES.find(a => a.pn === bo.assembly);
                    return (
                      <tr key={bo.id} style={{ borderBottom: i < BUILD_ORDERS.length - 1 ? '1px solid var(--line)' : 'none' }}>
                        <td style={{ padding: '11px 14px', fontFamily: 'var(--mono)', fontSize: 13, color: 'var(--accent)' }}>{bo.id}</td>
                        <td style={{ padding: '11px 14px' }}>
                          <div style={{ fontFamily: 'var(--mono)', fontSize: 12 }}>{bo.assembly}</div>
                          <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>{asm?.description}</div>
                        </td>
                        <td style={{ padding: '11px 14px', fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--text-3)' }}>{bo.assemblyRev}</td>
                        <td style={{ padding: '11px 14px', fontFamily: 'var(--mono)', fontSize: 14, fontWeight: 600, textAlign: 'right' }}>{bo.qty}</td>
                        <td style={{ padding: '11px 14px', fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--text-2)' }}>{bo.targetDate}</td>
                        <td style={{ padding: '11px 14px' }}>
                          <Badge label={bo.status} style={STATUS_STYLE[bo.status] ?? STATUS_STYLE.Draft} />
                        </td>
                        <td style={{ padding: '11px 14px' }}>
                          {bo.shortage
                            ? <Badge label="Shortage" style={{ bg: 'rgba(205,66,70,0.22)', color: '#FF7373' }} />
                            : <Badge label="OK" style={{ bg: 'rgba(35,133,81,0.22)', color: '#3DCC91' }} />
                          }
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div style={{ marginTop: 24, padding: '16px 20px', background: 'var(--surface-1)', border: '1px solid var(--line)', borderRadius: 10 }}>
              <p style={{ fontFamily: 'var(--mono)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-4)', margin: '0 0 10px' }}>
                Lifecycle Risk — EOL Parts in BOM
              </p>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--line)' }}>
                    {['Part #', 'MPN', 'Description', 'Designator', 'Qty', 'Status', 'Action Required'].map(h => (
                      <th key={h} style={{ padding: '6px 10px', textAlign: 'left', fontSize: 11, fontFamily: 'var(--mono)', color: 'var(--text-4)', fontWeight: 500 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {ASSEMBLIES[0].bom
                    .filter(line => {
                      const p = partByPn(line.pn);
                      return p && (p.lifecycle === 'EOL' || p.lifecycle === 'NRND' || p.lifecycle === 'Obsolete');
                    })
                    .map(line => {
                      const p = partByPn(line.pn)!;
                      return (
                        <tr key={line.pn}>
                          <td style={{ padding: '6px 10px', fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--accent)' }}>{p.pn}</td>
                          <td style={{ padding: '6px 10px', fontFamily: 'var(--mono)', fontSize: 11 }}>{p.mpn}</td>
                          <td style={{ padding: '6px 10px', fontSize: 12 }}>{p.description}</td>
                          <td style={{ padding: '6px 10px', fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-3)' }}>{line.designator}</td>
                          <td style={{ padding: '6px 10px', fontFamily: 'var(--mono)', fontSize: 12 }}>{line.qty}</td>
                          <td style={{ padding: '6px 10px' }}><LifecycleBadge lc={p.lifecycle} /></td>
                          <td style={{ padding: '6px 10px', fontSize: 12, color: '#FF7373' }}>
                            {p.lifecycle === 'EOL' ? 'Source replacement before DVT' : 'Evaluate alternate for next revision'}
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </main>
    </div>
  );
}