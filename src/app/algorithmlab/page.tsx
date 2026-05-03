"use client";
import Link from "next/link";
import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import {
  LineChart, Line,
  AreaChart, Area,
  BarChart, Bar,
  ComposedChart,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, ReferenceLine, ReferenceArea, Cell,
  ScatterChart, Scatter, ZAxis,
} from "recharts";

// ── Design tokens ─────────────────────────────────────────────
const C = {
  bg:     '#1C2127',
  s1:     '#252A31',
  s2:     '#2F343C',
  s3:     '#383E47',
  line:   'rgba(255,255,255,0.07)',
  lineS:  'rgba(255,255,255,0.14)',
  text:   '#F6F7F8',
  text2:  'rgba(246,247,248,0.65)',
  text3:  'rgba(246,247,248,0.42)',
  text4:  'rgba(246,247,248,0.26)',
  accent: '#2D72D2',
  sage:   '#3DCC91',
  amber:  '#FFC940',
  red:    '#FF6B6B',
  purple: '#7C6EAD',
  coral:  '#E06C75',
  gold:   '#E0C97A',
};

const TT_STYLE = {
  backgroundColor: C.bg,
  border: `1px solid ${C.lineS}`,
  borderRadius: 8,
  fontFamily: 'var(--mono)',
  fontSize: 11,
  color: C.text,
  padding: '10px 14px',
};

// ── Synthetic sensor signal ────────────────────────────────────
function generateSignal(points: number, seed = 1): number[] {
  const rng = (s: number) => { const x = Math.sin(s * 9301 + 49297) * 233280; return x - Math.floor(x); };
  return Array.from({ length: points }, (_, i) => {
    const v = 50 + Math.sin(i / 28) * 12 + Math.sin(i / 7 + seed) * 8
      + (rng(i + seed * 100) - 0.5) * 14
      + (i === 45 || i === 112 || i === 167 ? 28 : 0);
    return Math.round(v * 10) / 10;
  });
}
const RAW = generateSignal(200);

// ── Activity signal (5-min epochs, 2 days) ────────────────────
function generateActivitySignal(pts = 576): number[] {
  const epd = 288;
  const rng = (s: number) => { const x = Math.sin(s * 9301 + 49297) * 233280; return x - Math.floor(x); };
  return Array.from({ length: pts }, (_, i) => {
    const h = ((i % epd) / epd) * 24;
    const d = Math.floor(i / epd);
    let base = h >= 7 && h < 23
      ? 18 + 25 * Math.sin(Math.PI * (h - 7) / 16)
        + (h >= 7.5 && h < 10  ? 55 * Math.exp(-(((h - 9)    / 0.7) * ((h - 9)    / 0.7))) : 0)
        + (h >= 14  && h < 17  ? 48 * Math.exp(-(((h - 15.5) / 1.0) * ((h - 15.5) / 1.0))) : 0)
        + (h >= 12  && h < 13  ? 22 * Math.exp(-(((h - 12.5) / 0.4) * ((h - 12.5) / 0.4))) : 0)
      : 3 + rng((i + d * 7) * 3) * 8;
    return Math.max(0, Math.round(base + (rng(i * 3 + 17) - 0.5) * 22));
  });
}
const ACTIVITY = generateActivitySignal();
function epochToTime(i: number): string {
  const m = i * 5; return `${String(Math.floor(m / 60) % 24).padStart(2,'0')}:${String(m % 60).padStart(2,'0')}`;
}

// ── Signal processing algorithms ──────────────────────────────
function movingAverage(data: number[], w: number): (number | null)[] {
  return data.map((_, i) => i < w - 1 ? null
    : Math.round(data.slice(i - w + 1, i + 1).reduce((a, b) => a + b) / w * 100) / 100);
}
function exponentialSmoothing(data: number[], a: number): number[] {
  return data.reduce((out, v, i) => {
    out.push(i === 0 ? v : Math.round((a * v + (1 - a) * out[i - 1]) * 100) / 100);
    return out;
  }, [] as number[]);
}
function zScore(data: number[], w: number): (number | null)[] {
  return data.map((v, i) => {
    if (i < w - 1) return null;
    const s = data.slice(i - w + 1, i + 1);
    const m = s.reduce((a, b) => a + b) / w;
    const sd = Math.sqrt(s.reduce((a, b) => a + (b - m) ** 2) / w) || 1;
    return Math.round(((v - m) / sd) * 100) / 100;
  });
}
function rollingStd(data: number[], w: number): (number | null)[] {
  return data.map((_, i) => {
    if (i < w - 1) return null;
    const s = data.slice(i - w + 1, i + 1);
    const m = s.reduce((a, b) => a + b) / w;
    return Math.round(Math.sqrt(s.reduce((a, b) => a + (b - m) ** 2) / w) * 100) / 100;
  });
}
function fft(data: number[], bins: number) {
  const n = data.length;
  return Array.from({ length: bins }, (_, k) => {
    let re = 0, im = 0;
    for (let t = 0; t < n; t++) { const a = 2 * Math.PI * (k + 1) * t / n; re += data[t] * Math.cos(a); im -= data[t] * Math.sin(a); }
    return { freq: ((k + 1) / n).toFixed(3), power: Math.round(Math.sqrt(re * re + im * im) / n * 100) / 100 };
  });
}
function acf(data: number[], maxLag: number): { lag: number; r: number }[] {
  const mu = mn(data), n = data.length;
  const v = data.reduce((a, x) => a + (x - mu) ** 2, 0) / n || 1;
  return Array.from({ length: Math.min(maxLag, n - 1) }, (_, lag) => {
    const r = data.slice(0, n - lag).reduce((a, x, i) => a + (x - mu) * (data[i + lag] - mu), 0) / (n * v);
    return { lag: lag + 1, r: +r.toFixed(4) };
  });
}
function histogram(data: number[], bins: number) {
  const min = Math.min(...data), width = (Math.max(...data) - min) / bins;
  const counts = Array(bins).fill(0);
  data.forEach(v => counts[Math.min(bins - 1, Math.floor((v - min) / width))]++);
  return counts.map((count, i) => ({ bin: (min + i * width).toFixed(1), count }));
}

// ── Math helpers ──────────────────────────────────────────────
const mn  = (d: number[]) => d.reduce((a, b) => a + b, 0) / d.length;
const sd  = (d: number[]) => { const m = mn(d); return Math.sqrt(d.reduce((a, v) => a + (v - m) ** 2, 0) / d.length); };
const fct = (n: number)   => { let r = 1; for (let i = 2; i <= n; i++) r *= i; return r; };
function linReg(x: number[], y: number[]) {
  const n = x.length, sx = mn(x) * n, sy = mn(y) * n;
  const sxy = x.reduce((a, v, i) => a + v * y[i], 0);
  const sx2 = x.reduce((a, v) => a + v * v, 0);
  const slope = (n * sxy - sx * sy) / (n * sx2 - sx ** 2 || 1);
  return { slope, intercept: (sy - slope * sx) / n };
}
function logSizes(lo: number, hi: number, n: number): number[] {
  return [...new Set(Array.from({ length: n }, (_, i) =>
    Math.round(Math.exp(Math.log(lo) + i * (Math.log(hi) - Math.log(lo)) / (n - 1)))
  ).filter(v => v >= lo && v <= hi))];
}

// ── Complexity Suite algorithms ────────────────────────────────

// 1 · Cyclomatic Complexity — movement graph branching
function cyclomaticComplexity(data: number[], numStates: number) {
  const lo = Math.min(...data), range = Math.max(...data) - lo + 1e-10;
  const seq = data.map(v => Math.min(numStates - 1, Math.floor((v - lo) / range * numStates)));
  const edges = new Set<string>(), nodes = new Set<number>();
  const matrix = Array.from({ length: numStates }, () => Array(numStates).fill(0));
  for (let i = 0; i < seq.length - 1; i++) {
    const [f, t] = [seq[i], seq[i + 1]];
    nodes.add(f); nodes.add(t); edges.add(`${f}-${t}`); matrix[f][t]++;
  }
  return { cc: Math.max(1, edges.size - Math.max(nodes.size, 1) + 2), matrix, seq, E: edges.size, N: nodes.size };
}
function ccWindowed(data: number[], wSize: number, step: number, numStates: number) {
  const out: { t: number; cc: number }[] = [];
  for (let i = 0; i + wSize <= data.length; i += step)
    out.push({ t: i + Math.floor(wSize / 2), cc: cyclomaticComplexity(data.slice(i, i + wSize), numStates).cc });
  return out;
}

// 2 · Detrended Fluctuation Analysis — long-range correlations
function dfaAnalysis(data: number[], numBoxes = 18) {
  const m = mn(data); let cs = 0;
  const profile = data.map(v => { cs += v - m; return cs; });
  const n = data.length;
  const sizes = logSizes(10, Math.max(11, Math.floor(n / 4)), numBoxes);
  const logN: number[] = [], logF: number[] = [];
  for (const sz of sizes) {
    const nb = Math.floor(n / sz); if (nb < 2) continue;
    let sumSq = 0;
    for (let b = 0; b < nb; b++) {
      const seg = profile.slice(b * sz, (b + 1) * sz);
      const xs = seg.map((_, k) => k);
      const { slope: s, intercept: ic } = linReg(xs, seg);
      sumSq += seg.reduce((a, v, k) => a + (v - (s * k + ic)) ** 2, 0) / seg.length;
    }
    const F = Math.sqrt(sumSq / nb);
    if (F > 0) { logN.push(Math.log10(sz)); logF.push(Math.log10(F)); }
  }
  const reg = linReg(logN, logF);
  return {
    alpha: +reg.slope.toFixed(3),
    points: logN.map((ln, i) => ({ logN: +ln.toFixed(3), logF: +logF[i].toFixed(3), fit: +(reg.slope * ln + reg.intercept).toFixed(3) })),
  };
}

// 3 · Sample Entropy — pattern irregularity
function sampleEntropy(data: number[], m: number, r: number): number {
  const n = data.length, tol = r * (sd(data) || 1);
  let B = 0, A = 0;
  for (let i = 0; i < n - m; i++)
    for (let j = i + 1; j < n - m; j++) {
      let ok = true;
      for (let k = 0; k < m && ok; k++) if (Math.abs(data[i + k] - data[j + k]) > tol) ok = false;
      if (ok) { B++; if (Math.abs(data[i + m] - data[j + m]) <= tol) A++; }
    }
  return B === 0 ? 0 : A === 0 ? +(-Math.log(1 / B)).toFixed(4) : +(-Math.log(A / B)).toFixed(4);
}
function seWindowed(data: number[], m: number, r: number, wSize = 60, step = 8) {
  const out: { t: number; se: number }[] = [];
  for (let i = 0; i + wSize <= data.length; i += step)
    out.push({ t: i + Math.floor(wSize / 2), se: sampleEntropy(data.slice(i, i + wSize), m, r) });
  return out;
}

// 4 · Permutation Entropy — ordinal pattern diversity
function permutationEntropy(data: number[], m: number, delay: number) {
  const n = data.length - (m - 1) * delay;
  const counts = new Map<string, number>();
  for (let i = 0; i < n; i++) {
    const pat = Array.from({ length: m }, (_, k) => ({ v: data[i + k * delay], k }));
    const key = [...pat].sort((a, b) => a.v - b.v).map((x, r) => ({ ...x, r }))
      .sort((a, b) => a.k - b.k).map(x => x.r).join('');
    counts.set(key, (counts.get(key) || 0) + 1);
  }
  let h = 0;
  const patterns: { key: string; count: number }[] = [];
  for (const [key, c] of counts) {
    const p = c / n; h -= p * Math.log2(p);
    patterns.push({ key, count: c });
  }
  const maxH = Math.log2(fct(m));
  return { pe: maxH > 0 ? +(h / maxH).toFixed(4) : 0, patterns: patterns.sort((a, b) => b.count - a.count) };
}
function peWindowed(data: number[], m: number, delay: number, wSize = 50, step = 8) {
  const out: { t: number; pe: number }[] = [];
  for (let i = 0; i + wSize <= data.length; i += step)
    out.push({ t: i + Math.floor(wSize / 2), pe: permutationEntropy(data.slice(i, i + wSize), m, delay).pe });
  return out;
}

// 5 · Hurst Exponent (R/S analysis) — signal persistence
function hurstExponent(data: number[]) {
  const n = data.length;
  const sizes = logSizes(10, Math.floor(n / 2), 14);
  const logN: number[] = [], logRS: number[] = [];
  for (const sz of sizes) {
    const nb = Math.floor(n / sz); if (nb < 2) continue;
    let sumRS = 0, cnt = 0;
    for (let b = 0; b < nb; b++) {
      const block = data.slice(b * sz, (b + 1) * sz);
      const m = mn(block), adj = block.map(v => v - m);
      let cs2 = 0; const cum = adj.map(v => { cs2 += v; return cs2; });
      const R = Math.max(...cum) - Math.min(...cum), S = sd(block);
      if (S > 0 && R > 0) { sumRS += R / S; cnt++; }
    }
    if (cnt > 0) { logN.push(Math.log10(sz)); logRS.push(Math.log10(sumRS / cnt)); }
  }
  const reg = linReg(logN, logRS);
  return {
    hurst: +Math.max(0, Math.min(1.5, reg.slope)).toFixed(3),
    points: logN.map((ln, i) => ({ logN: +ln.toFixed(3), logRS: +logRS[i].toFixed(3), fit: +(reg.slope * ln + reg.intercept).toFixed(3) })),
  };
}

// ── Activity Analysis algorithms (Karas et al. 2019 · Urbanek/COAH) ──

function activityBouts(data: number[], threshold: number) {
  const active = data.map(v => v > threshold);
  const activeBouts: number[] = [], sedBouts: number[] = [];
  let len = 1;
  for (let i = 1; i <= data.length; i++) {
    if (i < data.length && active[i] === active[i - 1]) { len++; }
    else { (active[i - 1] ? activeBouts : sedBouts).push(len); len = 1; }
  }
  let aToS = 0, sToA = 0, totA = 0, totS = 0;
  for (let i = 0; i < active.length - 1; i++) {
    if (active[i]) { totA++; if (!active[i + 1]) aToS++; }
    else { totS++; if (active[i + 1]) sToA++; }
  }
  if (active[active.length - 1]) totA++; else totS++;
  return {
    astp: totA > 0 ? +(aToS / totA).toFixed(4) : 0,
    satp: totS > 0 ? +(sToA / totS).toFixed(4) : 0,
    activeBouts, sedBouts, totA, totS, active,
    meanActiveBout: activeBouts.length ? +(activeBouts.reduce((a, b) => a + b, 0) / activeBouts.length).toFixed(1) : 0,
    meanSedBout:    sedBouts.length    ? +(sedBouts.reduce((a, b) => a + b, 0) / sedBouts.length).toFixed(1) : 0,
  };
}

function boutPowerLaw(boutLengths: number[]) {
  if (boutLengths.length < 4) return { alpha: 0, points: [] as { l: number; logL: number; logP: number; fit: number }[] };
  const sorted = [...boutLengths].sort((a, b) => a - b);
  const uniq = [...new Set(sorted)];
  const n = sorted.length;
  const pts = uniq.map(l => ({ l, logL: +Math.log10(l).toFixed(3), logP: +Math.log10(sorted.filter(x => x >= l).length / n).toFixed(3) }));
  const valid = pts.filter(d => d.l > 1);
  if (valid.length < 3) return { alpha: 0, points: [] as { l: number; logL: number; logP: number; fit: number }[] };
  const reg = linReg(valid.map(d => d.logL), valid.map(d => d.logP));
  return { alpha: +Math.abs(reg.slope).toFixed(3), points: valid.map(d => ({ ...d, fit: +(reg.slope * d.logL + reg.intercept).toFixed(3) })) };
}

function intradailyVariability(data: number[]): number {
  const N = data.length, xbar = mn(data);
  const num = data.slice(0, -1).reduce((a, v, i) => a + (data[i + 1] - v) ** 2, 0);
  const den = data.reduce((a, v) => a + (v - xbar) ** 2, 0);
  return +(N * num / ((N - 1) * (den || 1))).toFixed(4);
}

function interdailyStability(data: number[], epd = 288): number {
  const N = data.length, numDays = Math.floor(N / epd);
  if (numDays < 2) return 0;
  const used = data.slice(0, numDays * epd), xbar = mn(used);
  const hourMeans = Array.from({ length: epd }, (_, h) => mn(Array.from({ length: numDays }, (_, d) => used[d * epd + h])));
  const num = hourMeans.reduce((a, hm) => a + (hm - xbar) ** 2, 0);
  const den = used.reduce((a, v) => a + (v - xbar) ** 2, 0);
  return +Math.min(1, numDays * num / (den || 1)).toFixed(4);
}

function relativeAmplitude(data: number[], epd = 288) {
  const day = data.slice(0, epd);
  const m10n = Math.round(10 * epd / 24), l5n = Math.round(5 * epd / 24);
  let m10Val = -Infinity, l5Val = Infinity, m10Start = 0, l5Start = 0;
  for (let i = 0; i <= epd - m10n; i++) {
    const s = day.slice(i, i + m10n).reduce((a, b) => a + b) / m10n;
    if (s > m10Val) { m10Val = s; m10Start = i; }
  }
  for (let i = 0; i <= epd - l5n; i++) {
    const s = day.slice(i, i + l5n).reduce((a, b) => a + b) / l5n;
    if (s < l5Val) { l5Val = s; l5Start = i; }
  }
  const ra = +((m10Val - l5Val) / (m10Val + l5Val + 0.001)).toFixed(4);
  return { m10: +m10Val.toFixed(1), l5: +l5Val.toFixed(1), ra, m10Start, l5Start, m10n, l5n,
    m10HourStart: Math.floor(m10Start / 12), m10HourEnd: Math.min(24, Math.ceil((m10Start + m10n) / 12)),
    l5HourStart:  Math.floor(l5Start / 12),  l5HourEnd:  Math.min(24, Math.ceil((l5Start  + l5n)  / 12)),
  };
}

// ── Predictive Intelligence algorithms ────────────────────────

// Multi-Scale Entropy — Costa et al. 2002 (Science)
function multiScaleEntropy(data: number[], maxScale = 10, m = 2, r = 0.15) {
  return Array.from({ length: maxScale }, (_, i) => {
    const tau = i + 1;
    const coarse: number[] = [];
    for (let j = 0; j + tau <= data.length; j += tau)
      coarse.push(data.slice(j, j + tau).reduce((a, b) => a + b, 0) / tau);
    return { scale: tau, se: coarse.length >= m + 2 ? sampleEntropy(coarse, m, r) : 0, n: coarse.length };
  });
}

// Autocorrelation first-zero-crossing lag (for delay embedding)
function acLag(data: number[]): number {
  const mu = mn(data), n = data.length;
  const v = data.reduce((a, x) => a + (x - mu) ** 2, 0) / n || 1;
  for (let lag = 1; lag < Math.floor(n / 3); lag++) {
    const r = data.slice(0, n - lag).reduce((a, x, i) => a + (x - mu) * (data[i + lag] - mu), 0) / (n * v);
    if (r < 0.1) return lag;
  }
  return Math.max(1, Math.floor(n / 8));
}

// CUSUM — sequential change detection
function cusumAnalysis(data: number[], k = 0.5, h = 5) {
  const mu = mn(data), sigma = sd(data) || 1;
  const kAbs = k * sigma, hAbs = h * sigma;
  let cp = 0, cm = 0, detectedAt: number | null = null;
  const points = data.map((x, i) => {
    cp = Math.max(0, cp + (x - mu - kAbs));
    cm = Math.max(0, cm - (x - mu + kAbs));
    if (detectedAt === null && (cp > hAbs || cm > hAbs)) detectedAt = i;
    return { t: i, signal: x, cp: +cp.toFixed(2), cm: +cm.toFixed(2), alert: detectedAt !== null && i >= (detectedAt ?? Infinity) };
  });
  return { threshold: +hAbs.toFixed(2), points, detectedAt, mu: +mu.toFixed(2), sigma: +sigma.toFixed(2) };
}

// Clinical Risk Panel — weighted composite of all suite metrics
function clinicalRisk(m: { astp: number; dfa: number; se: number; pe: number; hurst: number; iv: number; is_: number; ra: number; cc: number }) {
  const components = [
    { name: 'Fragmentation (ASTP)',   value: +Math.min(100, m.astp * 320).toFixed(1),              weight: 0.22, ref: 'Karas 2019' },
    { name: 'Circadian Stability (IS)', value: +Math.min(100, (1 - m.is_) * 160).toFixed(1),       weight: 0.15, ref: 'Urbanek / JHU-COAH' },
    { name: 'Rhythm Fragmentation (IV)', value: +Math.min(100, m.iv * 75).toFixed(1),             weight: 0.12, ref: 'Urbanek / JHU-COAH' },
    { name: 'Circadian Contrast (RA)', value: +Math.min(100, (1 - m.ra) * 130).toFixed(1),        weight: 0.10, ref: 'Urbanek / JHU-COAH' },
    { name: 'DFA Deviation from 1/f', value: +Math.min(100, Math.abs(m.dfa - 1.0) * 110).toFixed(1), weight: 0.12, ref: 'Khan & Jacobs 2021' },
    { name: 'Signal Regularity (SampEn)', value: +Math.min(100, Math.max(0, (1.5 - m.se) * 85)).toFixed(1), weight: 0.10, ref: 'Khan & Jacobs 2021' },
    { name: 'Movement Complexity (CC)', value: +Math.min(100, Math.max(0, (m.cc - 2) * 11)).toFixed(1), weight: 0.10, ref: 'Khan & Jacobs 2021' },
    { name: 'Persistence (Hurst H)', value: +Math.min(100, Math.abs(m.hurst - 0.7) * 160).toFixed(1), weight: 0.09, ref: 'Khan & Jacobs 2021' },
  ];
  const totalW = components.reduce((a, c) => a + c.weight, 0);
  const score = +(components.reduce((a, c) => a + Number(c.value) * c.weight, 0) / totalW).toFixed(1);
  return { score, components };
}

// ── Types ──────────────────────────────────────────────────────
type SignalAlgoId      = 'moving_avg' | 'exp_smooth' | 'zscore' | 'rolling_std' | 'autocorr';
type ComplexAlgoId  = 'cc' | 'dfa' | 'sample_entropy' | 'perm_entropy' | 'hurst' | 'fingerprint';
type ActivityAlgoId    = 'fragmentation' | 'circadian';
type PredictiveAlgoId  = 'mse' | 'phase_space' | 'cusum' | 'risk_panel';
type AlgoId = SignalAlgoId | ComplexAlgoId | ActivityAlgoId | PredictiveAlgoId;
const isComplex     = (a: AlgoId): a is ComplexAlgoId     =>
  ['cc','dfa','sample_entropy','perm_entropy','hurst','fingerprint'].includes(a);
const isActivity    = (a: AlgoId): a is ActivityAlgoId    =>
  ['fragmentation','circadian'].includes(a);
const isPredictive  = (a: AlgoId): a is PredictiveAlgoId  =>
  ['mse','phase_space','cusum','risk_panel'].includes(a);

const SIGNAL_ALGOS: { id: SignalAlgoId; label: string; color: string }[] = [
  { id: 'moving_avg',  label: 'Moving Average',        color: C.sage   },
  { id: 'exp_smooth',  label: 'Exponential Smoothing', color: C.amber  },
  { id: 'zscore',      label: 'Z-Score',               color: C.purple },
  { id: 'rolling_std', label: 'Rolling Std Dev',       color: C.coral  },
  { id: 'autocorr',   label: 'Autocorrelation',        color: C.gold   },
];
const COMPLEX_ALGOS: { id: ComplexAlgoId; label: string; color: string; sub: string }[] = [
  { id: 'cc',            label: 'Cyclomatic CC',      color: C.sage,   sub: 'Movement graph branching' },
  { id: 'dfa',           label: 'DFA',                color: C.amber,  sub: 'Long-range correlations' },
  { id: 'sample_entropy',label: 'Sample Entropy',     color: C.purple, sub: 'Pattern irregularity' },
  { id: 'perm_entropy',  label: 'Permutation Entropy',color: C.coral,  sub: 'Ordinal pattern diversity' },
  { id: 'hurst',         label: 'Hurst Exponent',     color: C.accent, sub: 'Signal persistence' },
  { id: 'fingerprint',   label: 'Fingerprint',        color: C.gold,   sub: 'All metrics at once' },
];
const PREDICTIVE_ALGOS: { id: PredictiveAlgoId; label: string; color: string; sub: string }[] = [
  { id: 'mse',         label: 'Multi-Scale Entropy', color: C.purple, sub: 'Cross-scale complexity · Costa 2002' },
  { id: 'phase_space', label: 'Phase Space',         color: C.sage,   sub: 'Delay embedding · Takens theorem' },
  { id: 'cusum',       label: 'Drift Detector',      color: C.amber,  sub: 'CUSUM early warning system' },
  { id: 'risk_panel',  label: 'Risk Panel',          color: C.red,    sub: 'Clinical composite score' },
];
const ACTIVITY_ALGOS: { id: ActivityAlgoId; label: string; color: string; sub: string }[] = [
  { id: 'fragmentation', label: 'Fragmentation',      color: C.sage,   sub: 'ASTP · SATP · bout power law' },
  { id: 'circadian',     label: 'Circadian Rhythm',   color: C.purple, sub: 'IS · IV · RA · M10 / L5' },
];

// ── Interpretation helpers ────────────────────────────────────
function interpCC(cc: number)  { return cc <= 3 ? { text: 'Minimal branching', c: C.sage } : cc <= 6 ? { text: 'Moderate complexity', c: C.amber } : cc <= 10 ? { text: 'High complexity', c: C.coral } : { text: 'Wandering pattern', c: C.red }; }
function interpDFA(a: number)  { return a < 0.5 ? { text: 'Anti-correlated', c: C.red } : a < 0.75 ? { text: 'Near-random noise', c: C.amber } : a <= 1.25 ? { text: 'Long-range correlated', c: C.sage } : { text: 'Non-stationary', c: C.purple }; }
function interpSE(se: number)  { return se < 0.5 ? { text: 'Highly regular', c: C.sage } : se < 1.0 ? { text: 'Moderate regularity', c: C.amber } : se < 1.5 ? { text: 'Irregular', c: C.coral } : { text: 'Highly irregular', c: C.red }; }
function interpPE(pe: number)  { return pe < 0.6 ? { text: 'Ordered patterns', c: C.sage } : pe < 0.75 ? { text: 'Mixed complexity', c: C.amber } : pe < 0.9 ? { text: 'High disorder', c: C.coral } : { text: 'Maximum disorder', c: C.red }; }
function interpH(h: number)    { return h < 0.4 ? { text: 'Anti-persistent', c: C.red } : h < 0.6 ? { text: 'Random walk', c: C.amber } : h < 0.8 ? { text: 'Persistent', c: C.sage } : { text: 'Strongly persistent', c: C.accent }; }
function interpASTP(v: number) { return v < 0.10 ? { text: 'Sustained activity', c: C.sage } : v < 0.20 ? { text: 'Somewhat fragmented', c: C.amber } : v < 0.30 ? { text: 'Moderately fragmented', c: C.coral } : { text: 'Highly fragmented', c: C.red }; }
function interpIV(v: number)   { return v < 0.5  ? { text: 'Very stable rhythm', c: C.sage } : v < 1.0  ? { text: 'Stable', c: C.amber } : v < 1.5 ? { text: 'Irregular', c: C.coral } : { text: 'Highly fragmented rhythm', c: C.red }; }
function interpIS(v: number)   { return v > 0.8  ? { text: 'Highly regular', c: C.sage } : v > 0.6 ? { text: 'Regular', c: C.amber } : v > 0.4 ? { text: 'Moderate regularity', c: C.coral } : { text: 'Irregular across days', c: C.red }; }
function interpRA(v: number)   { return v > 0.9  ? { text: 'Strong day/night rhythm', c: C.sage } : v > 0.7 ? { text: 'Good contrast', c: C.amber } : v > 0.5 ? { text: 'Moderate contrast', c: C.coral } : { text: 'Weak rhythm', c: C.red }; }
function interpRisk(s: number) { return s < 25 ? { text: 'Low risk', c: C.sage } : s < 50 ? { text: 'Borderline', c: C.amber } : s < 70 ? { text: 'Elevated risk', c: C.coral } : { text: 'High risk', c: C.red }; }
function interpMSE(slope: number) { return slope > 0.06 ? { text: 'Healthy complexity scaling', c: C.sage } : slope > 0 ? { text: 'Moderate scaling', c: C.amber } : slope > -0.06 ? { text: 'Flat — reduced complexity', c: C.coral } : { text: 'Decreasing — pathological', c: C.red }; }

// ── ChartCard ─────────────────────────────────────────────────
function ChartCard({ title, sub, badge, badgeColor, full, children }: {
  title: string; sub: string; badge?: string; badgeColor?: string; full?: boolean; children: React.ReactNode;
}) {
  const bc = badgeColor ?? C.accent;
  return (
    <div style={{ background: C.s1, border: `1px solid ${C.line}`, borderRadius: 14, padding: '28px 28px 24px', gridColumn: full ? '1 / -1' : undefined }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 22 }}>
        <div>
          <div style={{ fontFamily: 'var(--serif)', fontWeight: 300, fontSize: 22, letterSpacing: '-0.01em', marginBottom: 4 }}>{title}</div>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: C.text3 }}>{sub}</div>
        </div>
        {badge && (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 11px', borderRadius: 999, background: `${bc}22`, border: `1px solid ${bc}55`, color: bc, fontFamily: 'var(--mono)', fontSize: 11 }}>{badge}</span>
        )}
      </div>
      {children}
    </div>
  );
}

// ── Metric badge ──────────────────────────────────────────────
function MetricBadge({ label, value, unit, interp }: { label: string; value: string; unit?: string; interp: { text: string; c: string } }) {
  return (
    <div style={{ background: C.s2, border: `1px solid ${C.line}`, borderRadius: 10, padding: '18px 22px', display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ fontFamily: 'var(--mono)', fontSize: 9.5, color: C.text4, textTransform: 'uppercase', letterSpacing: '0.14em' }}>{label}</div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
        <span style={{ fontFamily: 'var(--serif)', fontWeight: 300, fontSize: 52, lineHeight: 1, letterSpacing: '-0.02em', color: C.text }}>{value}</span>
        {unit && <span style={{ fontFamily: 'var(--mono)', fontSize: 12, color: C.text3 }}>{unit}</span>}
      </div>
      <span style={{ display: 'inline-flex', alignSelf: 'flex-start', padding: '3px 10px', borderRadius: 999, background: `${interp.c}18`, border: `1px solid ${interp.c}40`, color: interp.c, fontFamily: 'var(--mono)', fontSize: 10.5 }}>{interp.text}</span>
    </div>
  );
}

// ── State transition matrix ───────────────────────────────────
function StateTransitionMatrix({ matrix, n }: { matrix: number[][]; n: number }) {
  const maxV = Math.max(...matrix.flat().filter(v => v > 0), 1);
  const labels = ['S1','S2','S3','S4','S5'].slice(0, n);
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `22px repeat(${n}, 1fr)`, gap: 3 }}>
      <div />
      {labels.map(l => <div key={l} style={{ fontFamily: 'var(--mono)', fontSize: 9, color: C.text4, textAlign: 'center', paddingBottom: 4 }}>{l}</div>)}
      {matrix.slice(0, n).map((row, r) => (
        [
          <div key={`lbl-${r}`} style={{ fontFamily: 'var(--mono)', fontSize: 9, color: C.text4, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingRight: 3 }}>{labels[r]}</div>,
          ...row.slice(0, n).map((v, c) => {
            const intensity = v / maxV;
            return (
              <div key={`${r}-${c}`} title={`${labels[r]}→${labels[c]}: ${v}`} style={{
                aspectRatio: '1', borderRadius: 4,
                background: r === c ? C.s3 : `rgba(45,114,210,${Math.max(0.04, intensity * 0.85)})`,
                border: `1px solid rgba(255,255,255,0.04)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'var(--mono)', fontSize: 9, color: intensity > 0.45 ? '#fff' : C.text4,
              }}>{v > 0 ? v : ''}</div>
            );
          })
        ]
      ))}
    </div>
  );
}

// ── SliderRow ─────────────────────────────────────────────────
function SliderRow({ label, min, max, step, value, fmt, onChange }: {
  label: string; min: number; max: number; step: number; value: number;
  fmt?: (v: number) => string; onChange: (v: number) => void;
}) {
  return (
    <div className="ctrl-row">
      <span className="ctrl-label">{label}</span>
      <input className="ctrl-slider" type="range" min={min} max={max} step={step} value={value} onChange={e => onChange(Number(e.target.value))} />
      <span className="ctrl-val">{fmt ? fmt(value) : value}</span>
    </div>
  );
}

// ── Drop zone ─────────────────────────────────────────────────
function DropZone({ files, onFiles }: { files: { name: string; size: number }[]; onFiles: (f: { name: string; size: number }[]) => void }) {
  const [drag, setDrag] = useState(false);
  const ref = useRef<HTMLInputElement>(null);
  const accept = (list: FileList) => {
    const p = Array.from(list).filter(f => f.name.endsWith('.parquet')).map(f => ({ name: f.name, size: f.size }));
    if (p.length) onFiles([...files, ...p]);
  };
  return (
    <div>
      <div onDragOver={e => { e.preventDefault(); setDrag(true); }} onDragLeave={() => setDrag(false)}
        onDrop={e => { e.preventDefault(); setDrag(false); accept(e.dataTransfer.files); }}
        onClick={() => ref.current?.click()}
        style={{ border: `2px dashed ${drag ? C.accent : C.lineS}`, borderRadius: 10, padding: '24px 32px', textAlign: 'center', cursor: 'pointer', background: drag ? 'rgba(45,114,210,0.06)' : 'transparent', transition: 'all 0.15s' }}>
        <input ref={ref} type="file" accept=".parquet" multiple style={{ display: 'none' }} onChange={e => e.target.files && accept(e.target.files)} />
        <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: C.text3, marginBottom: 4 }}>DROP .PARQUET FILES HERE</div>
        <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: C.text4 }}>or click to browse — demo data active until files are loaded</div>
      </div>
      {files.length > 0 && (
        <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
          {files.map(f => (
            <div key={f.name} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: C.s2, borderRadius: 8, border: `1px solid ${C.line}` }}>
              <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke={C.sage} strokeWidth="1.5"><path d="M3 2h7l3 3v9a1 1 0 01-1 1H3a1 1 0 01-1-1V3a1 1 0 011-1z"/><path d="M10 2v4h4"/></svg>
              <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: C.text2, flex: 1 }}>{f.name}</span>
              <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: C.text4 }}>{(f.size / 1024).toFixed(0)} KB</span>
              <button onClick={() => onFiles(files.filter(x => x.name !== f.name))} style={{ color: C.text4, padding: 0, lineHeight: 1 }}>
                <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 3l10 10M13 3L3 13"/></svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────
export default function AlgorithmLabPage() {
  useEffect(() => { document.body.style.background = C.bg; return () => { document.body.style.background = ''; }; }, []);

  // Signal processing state
  const [files, setFiles]           = useState<{ name: string; size: number }[]>([]);
  const [algo, setAlgo]             = useState<AlgoId>('moving_avg');
  const [maWindow, setMaWindow]     = useState(20);
  const [esAlpha, setEsAlpha]       = useState(0.15);
  const [zWin, setZWin]             = useState(30);
  const [threshold, setThreshold]   = useState(2.0);
  const [fftBins, setFftBins]       = useState(40);
  const [histBins, setHistBins]     = useState(20);
  const [visPoints, setVisPoints]   = useState(200);

  // Complexity Suite state
  const [ccStates, setCcStates]     = useState(5);
  const [ccWindow, setCcWindow]     = useState(40);
  const [ccStep, setCcStep]         = useState(5);
  const [dfaBoxes, setDfaBoxes]     = useState(18);
  const [seM, setSeM]               = useState(2);
  const [seR, setSeR]               = useState(0.20);
  const [peM, setPeM]               = useState(4);
  const [peDelay, setPeDelay]       = useState(1);
  const [fragThreshold, setFragThreshold] = useState(40);
  const [mseScale, setMseScale]           = useState(10);
  const [cusumK, setCusumK]               = useState(0.5);
  const [cusumH, setCusumH]               = useState(5);
  const [acfLags, setAcfLags]             = useState(40);

  const raw = useMemo(() => RAW.slice(0, visPoints), [visPoints]);
  const p2  = (v: number) => v.toFixed(2);

  // ── Signal processing computations ──────────────────────────
  const sigOverlay = useCallback((): (number | null)[] => {
    if (algo === 'moving_avg')  return movingAverage(raw, maWindow);
    if (algo === 'exp_smooth')  return exponentialSmoothing(raw, esAlpha);
    if (algo === 'rolling_std') return rollingStd(raw, zWin);
    return new Array(raw.length).fill(null);
  }, [algo, raw, maWindow, esAlpha, zWin]);

  const anomalyScores = useCallback(() => zScore(raw, zWin), [raw, zWin]);

  const timeData = useMemo(() => {
    const ov = sigOverlay(), az = anomalyScores();
    return raw.map((v, i) => ({
      t: i, raw: v,
      overlay: !isComplex(algo) && algo !== 'zscore' ? ov[i] : null,
      anomaly: az[i] !== null && Math.abs(az[i]!) > threshold ? v : null,
      zscore:  algo === 'zscore' ? az[i] : null,
    }));
  }, [raw, algo, sigOverlay, anomalyScores, threshold]);

  const fftData  = useMemo(() => fft(raw, fftBins), [raw, fftBins]);
  const histData = useMemo(() => histogram(raw, histBins), [raw, histBins]);

  // ── Complexity computations (memoized) ──────────────────────
  const ccResult   = useMemo(() => ({ full: cyclomaticComplexity(raw, ccStates), windowed: ccWindowed(raw, ccWindow, ccStep, ccStates) }), [raw, ccStates, ccWindow, ccStep]);
  const dfaResult  = useMemo(() => dfaAnalysis(raw, dfaBoxes), [raw, dfaBoxes]);
  const seResult   = useMemo(() => ({ value: sampleEntropy(raw, seM, seR), windowed: seWindowed(raw, seM, seR, 60, 8) }), [raw, seM, seR]);
  const peResult   = useMemo(() => ({ ...permutationEntropy(raw, peM, peDelay), windowed: peWindowed(raw, peM, peDelay, 50, 8) }), [raw, peM, peDelay]);
  const hurstResult = useMemo(() => hurstExponent(raw), [raw]);

  // ── Activity Analysis computations ──────────────────────────
  const fragResult   = useMemo(() => activityBouts(ACTIVITY.slice(0, 288), fragThreshold), [fragThreshold]);
  const boutPL       = useMemo(() => boutPowerLaw(fragResult.activeBouts), [fragResult]);
  const ivResult     = useMemo(() => intradailyVariability(ACTIVITY), []);
  const isResult     = useMemo(() => interdailyStability(ACTIVITY, 288), []);
  const raResult     = useMemo(() => relativeAmplitude(ACTIVITY, 288), []);
  const hourlyData   = useMemo(() => Array.from({ length: 24 }, (_, h) => {
    const vals = Array.from({ length: 2 }, (_, d) => Array.from({ length: 12 }, (_, ep) => ACTIVITY[d * 288 + h * 12 + ep] ?? 0)).flat();
    return { hour: h, label: `${String(h).padStart(2,'0')}h`, mean: Math.round(mn(vals)) };
  }), []);
  const fragChartData = useMemo(() => ACTIVITY.slice(0, 288).map((v, i) => ({
    t: i, time: epochToTime(i), signal: v,
    activeBar: v > fragThreshold ? v - fragThreshold : 0,
    sedBar: Math.min(v, fragThreshold),
  })), [fragThreshold]);
  const boutHistData = useMemo(() => {
    const maxL = Math.min(25, Math.max(...fragResult.activeBouts, 1));
    return Array.from({ length: maxL }, (_, i) => ({ l: i + 1, count: fragResult.activeBouts.filter(b => b === i + 1).length })).filter(d => d.count > 0);
  }, [fragResult]);

  // ── Predictive Intelligence computations ────────────────────
  const acfData    = useMemo(() => acf(raw, acfLags), [raw, acfLags]);
  const acfCI      = useMemo(() => 1.96 / Math.sqrt(raw.length), [raw]);
  const mseResult  = useMemo(() => multiScaleEntropy(raw, mseScale), [raw, mseScale]);
  const mseSlopeResult = useMemo(() => linReg(mseResult.map(d => d.scale), mseResult.map(d => d.se)), [mseResult]);
  const psLag      = useMemo(() => acLag(raw), [raw]);
  const phaseData  = useMemo(() => raw.slice(0, raw.length - psLag).map((x, i) => ({ x: +x.toFixed(1), y: +raw[i + psLag].toFixed(1) })), [raw, psLag]);
  const cusumResult = useMemo(() => cusumAnalysis(raw, cusumK, cusumH), [raw, cusumK, cusumH]);

  const fingerprint = useMemo(() => {
    const cc = cyclomaticComplexity(raw, 5).cc;
    const dfa = dfaAnalysis(raw, 14).alpha;
    const se  = sampleEntropy(raw, 2, 0.2);
    const pe  = permutationEntropy(raw, 4, 1).pe;
    const h   = hurstExponent(raw).hurst;
    return { cc, dfa, se, pe, hurst: h,
      radar: [
        { metric: 'CC',      value: +Math.min(100, cc * 10).toFixed(1) },
        { metric: 'DFA α',   value: +Math.min(100, dfa * 60).toFixed(1) },
        { metric: 'SampEn',  value: +Math.min(100, se * 50).toFixed(1) },
        { metric: 'PermEn',  value: +(pe * 100).toFixed(1) },
        { metric: 'Hurst',   value: +(h * 100).toFixed(1) },
      ],
    };
  }, [raw]);

  const riskResult = useMemo(() => clinicalRisk({
    astp: fragResult.astp, dfa: dfaResult.alpha, se: seResult.value, pe: peResult.pe,
    hurst: hurstResult.hurst, iv: ivResult, is_: isResult, ra: raResult.ra, cc: ccResult.full.cc,
  }), [fragResult, dfaResult, seResult, peResult, hurstResult, ivResult, isResult, raResult, ccResult]);

  // ── Signal-mode stats ────────────────────────────────────────
  const sigStats = useMemo(() => {
    const m = mn(raw), s = sd(raw);
    return { mean: m.toFixed(2), std: s.toFixed(2), min: Math.min(...raw).toFixed(1), max: Math.max(...raw).toFixed(1), anomalies: timeData.filter(d => d.anomaly !== null).length };
  }, [raw, timeData]);

  const activeSignalAlgo  = SIGNAL_ALGOS.find(a => a.id === algo);
  const activeComplexAlgo = COMPLEX_ALGOS.find(a => a.id === algo);
  const inComplex  = isComplex(algo);
  const inActivity    = isActivity(algo);
  const inPredictive  = isPredictive(algo);

  return (
    <div className="app" style={{ color: C.text }}>

      {/* ── Sidebar ── */}
      <aside className="sidebar">
        <Link href="/" style={{ textDecoration: 'none', color: 'inherit' }}>
          <div className="brand"><div className="brand-name">Ambient <em>Intelligence</em></div></div>
        </Link>

        <nav className="nav-section">
          <div className="nav-label">Platform</div>
          {([
            ['/dashboard/overview','Dashboard',  <path key="d" d="M2.5 7L8 2.5 13.5 7v6.5h-4V10h-3v3.5h-4z" strokeLinejoin="round"/>],
            ['/bom',              'BOM',         <><rect key="b1" x="3" y="2.5" width="10" height="11" rx="1"/><path key="b2" d="M5.5 6h5M5.5 8.5h5M5.5 11h3" strokeLinecap="round"/></>],
            ['/gapanalysis',      'Gap Analysis',<><path key="g1" d="M2.5 12.5h11M5 12.5V9M8 12.5V5.5M11 12.5V8" strokeLinecap="round"/></>],
            ['/datascience',      'Data Science',<><circle key="ds1" cx="5" cy="5" r="2.5"/><circle key="ds2" cx="11" cy="11" r="2.5"/><path key="ds3" d="M11 5.5a2.5 2.5 0 110 0z"/><path key="ds4" d="M5 11a2.5 2.5 0 110 0z"/></>],
            ['/algorithmlab',     'Algorithm Lab',<><path key="a1" d="M3 13L6 8l3 3 3-5 3 3" strokeLinecap="round" strokeLinejoin="round"/><circle key="a2" cx="13" cy="9" r="1.5" fill="currentColor"/></>],
          ] as [string, string, React.ReactNode][]).map(([href, label, icon]) => (
            <Link key={label} href={href} className={`nav-item${href === '/algorithmlab' ? ' active' : ''}`} style={{ textDecoration: 'none', color: 'inherit' }}>
              <svg className="nav-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4">{icon}</svg>
              {label}
            </Link>
          ))}
        </nav>

        <nav className="nav-section">
          <div className="nav-label">Signal Processing</div>
          {SIGNAL_ALGOS.map(a => (
            <button key={a.id} className={`nav-item${algo === a.id ? ' active' : ''}`} onClick={() => setAlgo(a.id)} style={{ color: algo === a.id ? a.color : undefined }}>
              <svg className="nav-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4"><circle cx="8" cy="8" r="1.5" fill={algo === a.id ? a.color : 'currentColor'}/></svg>
              {a.label}
            </button>
          ))}
        </nav>

        <nav className="nav-section">
          <div className="nav-label">Complexity Suite</div>
          {COMPLEX_ALGOS.map(a => (
            <button key={a.id} className={`nav-item${algo === a.id ? ' active' : ''}`} onClick={() => setAlgo(a.id)} style={{ color: algo === a.id ? a.color : undefined }}>
              <svg className="nav-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4"><circle cx="8" cy="8" r="1.5" fill={algo === a.id ? a.color : 'currentColor'}/></svg>
              <span style={{ flex: 1, textAlign: 'left' }}>{a.label}</span>
            </button>
          ))}
        </nav>

        <nav className="nav-section">
          <div className="nav-label">Predictive Intelligence</div>
          {PREDICTIVE_ALGOS.map(a => (
            <button key={a.id} className={`nav-item${algo === a.id ? ' active' : ''}`} onClick={() => setAlgo(a.id)} style={{ color: algo === a.id ? a.color : undefined }}>
              <svg className="nav-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4"><circle cx="8" cy="8" r="1.5" fill={algo === a.id ? a.color : 'currentColor'}/></svg>
              <span style={{ flex: 1, textAlign: 'left' }}>{a.label}</span>
            </button>
          ))}
        </nav>

        <nav className="nav-section">
          <div className="nav-label">Activity Analysis</div>
          {ACTIVITY_ALGOS.map(a => (
            <button key={a.id} className={`nav-item${algo === a.id ? ' active' : ''}`} onClick={() => setAlgo(a.id)} style={{ color: algo === a.id ? a.color : undefined }}>
              <svg className="nav-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4"><circle cx="8" cy="8" r="1.5" fill={algo === a.id ? a.color : 'currentColor'}/></svg>
              <span style={{ flex: 1, textAlign: 'left' }}>{a.label}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <span className="status-dot" style={{ background: files.length ? C.sage : C.amber, boxShadow: `0 0 0 3px ${files.length ? 'rgba(61,204,145,0.18)' : 'rgba(255,201,64,0.18)'}` }}/>
          <span>{files.length ? `${files.length} file${files.length > 1 ? 's' : ''} loaded` : 'demo data'}</span>
        </div>
      </aside>

      {/* ── Main ── */}
      <main className="main">
        <header className="topbar" style={{ marginBottom: 32 }}>
          <div>
            <div className="crumb">Ambient Intelligence · {inPredictive ? 'Predictive Intelligence · Multi-Scale · Phase Space · CUSUM · Risk Panel' : inActivity ? 'Activity Analysis · Karas 2019 · Urbanek / JHU-COAH' : inComplex ? 'Complexity Suite · Khan & Jacobs 2021' : 'Signal Processing'}</div>
            <h1 className="page-title">Algorithm <em>Lab</em></h1>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: C.text3 }}>{files.length ? files.map(f => f.name).join(', ') : 'synthetic demo data'}</span>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: files.length ? C.sage : C.amber, boxShadow: `0 0 5px ${files.length ? C.sage : C.amber}`, display: 'inline-block' }} />
          </div>
        </header>

        {/* KPI strip */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 10, marginBottom: 28 }}>
          {(inPredictive ? [
            { label: 'Risk Score',   value: riskResult.score.toString(),           color: interpRisk(riskResult.score).c },
            { label: 'MSE Slope',    value: mseSlopeResult.slope.toFixed(3),       color: interpMSE(mseSlopeResult.slope).c },
            { label: 'Phase Lag τ',  value: psLag.toString(),                      color: C.sage   },
            { label: 'CUSUM Alert',  value: cusumResult.detectedAt !== null ? `t=${cusumResult.detectedAt}` : 'None', color: cusumResult.detectedAt !== null ? C.red : C.sage },
            { label: 'Mean',         value: mn(raw).toFixed(2),                    color: C.text2  },
            { label: 'Std Dev',      value: sd(raw).toFixed(2),                    color: C.text2  },
          ] : inActivity ? [
            { label: 'Epochs',       value: '288',                                           color: C.accent },
            { label: 'ASTP',         value: fragResult.astp.toString(),                      color: interpASTP(fragResult.astp).c },
            { label: 'SATP',         value: fragResult.satp.toString(),                      color: C.text2  },
            { label: 'IV',           value: ivResult.toString(),                             color: interpIV(ivResult).c },
            { label: 'IS',           value: isResult.toString(),                             color: interpIS(isResult).c },
            { label: 'RA',           value: raResult.ra.toString(),                          color: interpRA(raResult.ra).c },
          ] : inComplex ? [
            { label: 'Data Points',  value: raw.length.toString(),                           color: C.accent },
            { label: 'Mean',         value: mn(raw).toFixed(2),                              color: C.text2  },
            { label: 'Std Dev',      value: sd(raw).toFixed(2),                              color: C.text2  },
            { label: 'CC',           value: fingerprint.cc.toString(),                       color: interpCC(fingerprint.cc).c },
            { label: 'DFA α',        value: fingerprint.dfa.toString(),                      color: interpDFA(fingerprint.dfa).c },
            { label: 'Hurst H',      value: fingerprint.hurst.toString(),                    color: interpH(fingerprint.hurst).c },
          ] : [
            { label: 'Data Points',  value: raw.length.toString(),                           color: C.accent },
            { label: 'Mean',         value: sigStats.mean,                                   color: C.text2  },
            { label: 'Std Dev',      value: sigStats.std,                                    color: C.text2  },
            { label: 'Min',          value: sigStats.min,                                    color: C.sage   },
            { label: 'Max',          value: sigStats.max,                                    color: C.amber  },
            { label: 'Anomalies',    value: sigStats.anomalies.toString(),                   color: sigStats.anomalies > 0 ? C.red : C.sage },
          ] as { label: string; value: string; color: string }[]).map(s => (
            <div key={s.label} style={{ background: C.s1, border: `1px solid ${C.line}`, borderRadius: 10, padding: '14px 16px' }}>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: C.text4, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 5 }}>{s.label}</div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 16, fontWeight: 600, color: s.color }}>{s.value}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

          {/* Drop zone — always shown */}
          <div style={{ gridColumn: '1 / -1', background: C.s1, border: `1px solid ${C.line}`, borderRadius: 14, padding: '24px 28px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
              <div>
                <div style={{ fontFamily: 'var(--serif)', fontWeight: 300, fontSize: 20, letterSpacing: '-0.01em', marginBottom: 4 }}>Parquet Files</div>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: C.text3 }}>Drop .parquet sensor exports — schema auto-detected on load</div>
              </div>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 11px', borderRadius: 999, background: files.length ? 'rgba(61,204,145,0.12)' : 'rgba(255,201,64,0.12)', border: `1px solid ${files.length ? 'rgba(61,204,145,0.35)' : 'rgba(255,201,64,0.35)'}`, color: files.length ? C.sage : C.amber, fontFamily: 'var(--mono)', fontSize: 11 }}>
                {files.length ? `${files.length} loaded` : 'demo mode'}
              </span>
            </div>
            <DropZone files={files} onFiles={setFiles} />
          </div>

          {/* ── SIGNAL PROCESSING MODE ── */}
          {!inComplex && !inActivity && !inPredictive && <>
            {/* Algorithm selector + sliders */}
            <div style={{ gridColumn: '1 / -1', background: C.s1, border: `1px solid ${C.line}`, borderRadius: 14, padding: '24px 28px' }}>
              <div style={{ marginBottom: 18 }}>
                <div style={{ fontFamily: 'var(--serif)', fontWeight: 300, fontSize: 20, letterSpacing: '-0.01em', marginBottom: 4 }}>Algorithm</div>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: C.text3 }}>Select and configure the signal processing algorithm</div>
              </div>
              <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
                {SIGNAL_ALGOS.map(a => (
                  <button key={a.id} onClick={() => setAlgo(a.id)} style={{ padding: '8px 18px', borderRadius: 999, border: `1px solid ${algo === a.id ? a.color : C.lineS}`, background: algo === a.id ? `${a.color}1A` : 'transparent', color: algo === a.id ? a.color : C.text3, fontFamily: 'var(--mono)', fontSize: 12, cursor: 'pointer', transition: 'all 0.15s' }}>{a.label}</button>
                ))}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 48px' }}>
                <div className="ctrl-strip" style={{ marginTop: 0, paddingTop: 0, borderTop: 'none' }}>
                  {algo === 'moving_avg'  && <SliderRow label="Window size"        min={3}    max={80}   step={1}    value={maWindow}   onChange={setMaWindow} />}
                  {algo === 'exp_smooth'  && <SliderRow label="Alpha (smoothing)"  min={0.01} max={0.99} step={0.01} value={esAlpha}    fmt={p2} onChange={setEsAlpha} />}
                  {algo === 'zscore'      && <SliderRow label="Window size"        min={5}    max={80}   step={1}    value={zWin}       onChange={setZWin} />}
                  {algo === 'zscore'      && <SliderRow label="Anomaly threshold"  min={0.5}  max={5.0}  step={0.1}  value={threshold}  fmt={p2} onChange={setThreshold} />}
                  {algo === 'rolling_std' && <SliderRow label="Window size"        min={3}    max={80}   step={1}    value={zWin}       onChange={setZWin} />}
                  <SliderRow label="Visible points" min={30} max={200} step={5} value={visPoints} onChange={setVisPoints} />
                </div>
                <div className="ctrl-strip" style={{ marginTop: 0, paddingTop: 0, borderTop: 'none' }}>
                  <SliderRow label="FFT bins"       min={10} max={80} step={5}  value={fftBins}  onChange={setFftBins} />
                  <SliderRow label="Histogram bins" min={8}  max={50} step={2}  value={histBins} onChange={setHistBins} />
                </div>
              </div>
            </div>

            {/* Signal + overlay */}
            <ChartCard full
              title={algo === 'zscore' ? 'Z-Score · Anomaly Detection' : `Signal + ${activeSignalAlgo?.label}`}
              sub={algo === 'zscore' ? `rolling window ${zWin} · threshold ±${threshold} · ${sigStats.anomalies} anomalies` : algo === 'moving_avg' ? `${maWindow}-point moving average` : algo === 'exp_smooth' ? `exponential smoothing α=${esAlpha.toFixed(2)}` : `rolling std dev window ${zWin}`}
              badge={files.length ? 'Parquet data' : 'Demo signal'}
            >
              <ResponsiveContainer width="100%" height={300}>
                {algo === 'zscore' ? (
                  <ComposedChart data={timeData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={C.line} />
                    <XAxis dataKey="t" tick={{ fontFamily: 'var(--mono)', fontSize: 10, fill: C.text4 }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontFamily: 'var(--mono)', fontSize: 10, fill: C.text4 }} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={TT_STYLE} cursor={{ stroke: C.lineS }} />
                    <Legend iconType="circle" iconSize={7} wrapperStyle={{ fontFamily: 'var(--mono)', fontSize: 10, paddingTop: 10 }} />
                    <Line type="monotone" dataKey="raw"     stroke={C.text3} strokeWidth={1}   dot={false} name="Raw signal" />
                    <Line type="monotone" dataKey="anomaly" stroke={C.red}   strokeWidth={0}   dot={{ r: 4, fill: C.red }} name="Anomaly" connectNulls={false} />
                    <ReferenceLine y={50 + threshold * 6} stroke={C.red} strokeDasharray="4 3" strokeOpacity={0.4} />
                    <ReferenceLine y={50 - threshold * 6} stroke={C.red} strokeDasharray="4 3" strokeOpacity={0.4} />
                  </ComposedChart>
                ) : (
                  <LineChart data={timeData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={C.line} />
                    <XAxis dataKey="t" tick={{ fontFamily: 'var(--mono)', fontSize: 10, fill: C.text4 }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontFamily: 'var(--mono)', fontSize: 10, fill: C.text4 }} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={TT_STYLE} cursor={{ stroke: C.lineS }} />
                    <Legend iconType="circle" iconSize={7} wrapperStyle={{ fontFamily: 'var(--mono)', fontSize: 10, paddingTop: 10 }} />
                    <Line type="monotone" dataKey="raw"     stroke={C.text3}                 strokeWidth={1.2} dot={false} name="Raw signal" />
                    <Line type="monotone" dataKey="overlay" stroke={activeSignalAlgo?.color} strokeWidth={2.2} dot={false} name={activeSignalAlgo?.label} connectNulls />
                  </LineChart>
                )}
              </ResponsiveContainer>
            </ChartCard>

            {/* Residuals */}
            <ChartCard title={algo === 'zscore' ? 'Z-Score Trace' : 'Residuals'} sub={algo === 'zscore' ? `standardized deviation · window ${zWin}` : `raw minus ${activeSignalAlgo?.label.toLowerCase()} estimate`}>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={timeData.map(d => ({ t: d.t, value: algo === 'zscore' ? d.zscore : d.overlay !== null ? Math.round((d.raw - (d.overlay ?? d.raw)) * 100) / 100 : null }))} margin={{ top: 4, right: 8, left: -20, bottom: 0 }} barSize={1.5}>
                  <CartesianGrid strokeDasharray="3 3" stroke={C.line} vertical={false} />
                  <XAxis dataKey="t" tick={{ fontFamily: 'var(--mono)', fontSize: 10, fill: C.text4 }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontFamily: 'var(--mono)', fontSize: 10, fill: C.text4 }} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={TT_STYLE} />
                  <ReferenceLine y={0} stroke={C.lineS} />
                  {algo === 'zscore' && <><ReferenceLine y={threshold} stroke={C.red} strokeDasharray="3 3" strokeOpacity={0.5} /><ReferenceLine y={-threshold} stroke={C.red} strokeDasharray="3 3" strokeOpacity={0.5} /></>}
                  <Bar dataKey="value" name={algo === 'zscore' ? 'Z-score' : 'Residual'} fill={activeSignalAlgo?.color} fillOpacity={0.7} radius={0} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            {/* FFT */}
            <ChartCard title="FFT Spectrum" sub={`frequency domain · ${fftBins} bins`}>
              {(() => { const mx = Math.max(...fftData.map(d => d.power)); return (
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={fftData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={C.line} vertical={false} />
                    <XAxis dataKey="freq" tick={{ fontFamily: 'var(--mono)', fontSize: 9, fill: C.text4 }} tickLine={false} axisLine={false} interval={Math.floor(fftBins / 6)} />
                    <YAxis tick={{ fontFamily: 'var(--mono)', fontSize: 10, fill: C.text4 }} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={TT_STYLE} formatter={(v: unknown) => [typeof v === 'number' ? v.toFixed(3) : String(v), 'Power'] as [string, string]} />
                    <Bar dataKey="power" name="Power" fill={C.accent} fillOpacity={0.75} radius={[2, 2, 0, 0]}>
                      {fftData.map((d, i) => <rect key={i} fill={d.power === mx ? C.accent : 'rgba(45,114,210,0.32)'} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ); })()}
            </ChartCard>

            {/* Distribution */}
            <ChartCard title="Distribution" sub={`${histBins}-bin histogram · amplitude`}>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={histData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={C.line} vertical={false} />
                  <XAxis dataKey="bin" tick={{ fontFamily: 'var(--mono)', fontSize: 9, fill: C.text4 }} tickLine={false} axisLine={false} interval={Math.floor(histBins / 6)} />
                  <YAxis tick={{ fontFamily: 'var(--mono)', fontSize: 10, fill: C.text4 }} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={TT_STYLE} formatter={(v: unknown) => [String(v), 'Count'] as [string, string]} labelFormatter={(l: unknown) => `Bin ≥ ${l}`} />
                  <Bar dataKey="count" name="Count" fill={C.purple} fillOpacity={0.75} radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            {/* Signal envelope */}
            <ChartCard full title="Signal Envelope" sub="rolling mean ± std dev band">
              {(() => {
                const envData = raw.map((v, i) => {
                  if (i < zWin - 1) return { t: i, raw: v, mean: null as number | null, upper: null as number | null, lower: null as number | null };
                  const s = raw.slice(i - zWin + 1, i + 1), m = mn(s), dev = sd(s);
                  return { t: i, raw: v, mean: +m.toFixed(2), upper: +(m + dev).toFixed(2), lower: +(m - dev).toFixed(2) };
                });
                return (
                  <ResponsiveContainer width="100%" height={260}>
                    <ComposedChart data={envData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                      <defs><linearGradient id="envBand" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={C.accent} stopOpacity={0.18}/><stop offset="95%" stopColor={C.accent} stopOpacity={0.04}/></linearGradient></defs>
                      <CartesianGrid strokeDasharray="3 3" stroke={C.line} />
                      <XAxis dataKey="t" tick={{ fontFamily: 'var(--mono)', fontSize: 10, fill: C.text4 }} tickLine={false} axisLine={false} />
                      <YAxis tick={{ fontFamily: 'var(--mono)', fontSize: 10, fill: C.text4 }} tickLine={false} axisLine={false} />
                      <Tooltip contentStyle={TT_STYLE} cursor={{ stroke: C.lineS }} />
                      <Legend iconType="circle" iconSize={7} wrapperStyle={{ fontFamily: 'var(--mono)', fontSize: 10, paddingTop: 10 }} />
                      <Area type="monotone" dataKey="upper" stroke="none" fill="url(#envBand)" name="Upper band" connectNulls />
                      <Area type="monotone" dataKey="lower" stroke="none" fill={C.bg} name="Lower band" connectNulls />
                      <Line type="monotone" dataKey="mean"  stroke={C.accent} strokeWidth={1.8} dot={false} name="Rolling mean" connectNulls />
                      <Line type="monotone" dataKey="raw"   stroke={C.text3}  strokeWidth={1}   dot={false} name="Raw signal" />
                      <Line type="monotone" dataKey="upper" stroke={C.accent} strokeWidth={0.8} dot={false} strokeDasharray="3 3" connectNulls legendType="none" name="" />
                      <Line type="monotone" dataKey="lower" stroke={C.accent} strokeWidth={0.8} dot={false} strokeDasharray="3 3" connectNulls legendType="none" name="" />
                    </ComposedChart>
                  </ResponsiveContainer>
                );
              })()}
            </ChartCard>

            {/* ACF */}
            {algo === 'autocorr' && <>
              <ChartCard full title="Autocorrelation Function (ACF)" sub={`${acfLags} lags · 95% CI ±${acfCI.toFixed(3)} · seasonal spikes reveal periodicity`} badge={`τ₁ = ${acfData[0]?.r}`} badgeColor={C.gold}>
                <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'flex-end' }}>
                  <SliderRow label="Max lags" min={10} max={80} step={5} value={acfLags} onChange={setAcfLags} />
                </div>
                <ResponsiveContainer width="100%" height={280}>
                  <ComposedChart data={acfData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={C.line} vertical={false} />
                    <XAxis dataKey="lag" tick={{ fontFamily: 'var(--mono)', fontSize: 10, fill: C.text4 }} tickLine={false} axisLine={false} label={{ value: 'Lag', position: 'insideBottom', offset: -2, fontFamily: 'var(--mono)', fontSize: 9, fill: C.text4 }} />
                    <YAxis domain={[-1, 1]} tick={{ fontFamily: 'var(--mono)', fontSize: 10, fill: C.text4 }} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={TT_STYLE} formatter={(v: unknown) => [typeof v === 'number' ? v.toFixed(4) : String(v), 'r(lag)'] as [string, string]} />
                    <ReferenceLine y={0} stroke={C.lineS} />
                    <ReferenceLine y={acfCI}  stroke={C.amber} strokeDasharray="4 3" strokeOpacity={0.5} label={{ value: '+95% CI', position: 'right', fontFamily: 'var(--mono)', fontSize: 9, fill: C.amber }} />
                    <ReferenceLine y={-acfCI} stroke={C.amber} strokeDasharray="4 3" strokeOpacity={0.5} label={{ value: '−95% CI', position: 'right', fontFamily: 'var(--mono)', fontSize: 9, fill: C.amber }} />
                    <Bar dataKey="r" name="ACF" barSize={4}>
                      {acfData.map((d, i) => (
                        <Cell key={i} fill={Math.abs(d.r) > acfCI ? C.gold : C.s3} fillOpacity={Math.abs(d.r) > acfCI ? 0.85 : 0.5} />
                      ))}
                    </Bar>
                  </ComposedChart>
                </ResponsiveContainer>
              </ChartCard>
            </>}
          </>}

          {/* ── ACTIVITY ANALYSIS MODE ── */}
          {inActivity && <>

            {/* Threshold slider */}
            <div style={{ gridColumn: '1 / -1', background: C.s1, border: `1px solid ${C.line}`, borderRadius: 14, padding: '24px 28px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 }}>
                <div>
                  <div style={{ fontFamily: 'var(--serif)', fontWeight: 300, fontSize: 20, letterSpacing: '-0.01em', marginBottom: 4 }}>
                    {algo === 'fragmentation' ? 'Activity Fragmentation' : 'Circadian Rhythm Analysis'}
                  </div>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: C.text3 }}>
                    {algo === 'fragmentation'
                      ? 'Karas et al. 2019 · JAMA Network Open · ASTP/SATP linked to all-cause mortality in NHANES'
                      : 'Urbanek / JHU-COAH · IS · IV · RA · M10 / L5 · non-parametric circadian analysis'}
                  </div>
                </div>
                <SliderRow label="VISIBLE POINTS" min={30} max={200} step={5} value={visPoints} onChange={setVisPoints} />
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 24 }}>
                {ACTIVITY_ALGOS.map(a => (
                  <button key={a.id} onClick={() => setAlgo(a.id)} style={{ padding: '8px 18px', borderRadius: 999, border: `1px solid ${algo === a.id ? a.color : C.lineS}`, background: algo === a.id ? `${a.color}1A` : 'transparent', color: algo === a.id ? a.color : C.text3, fontFamily: 'var(--mono)', fontSize: 12, cursor: 'pointer', transition: 'all 0.15s' }}>{a.label}</button>
                ))}
              </div>
              {algo === 'fragmentation' && (
                <div className="ctrl-strip" style={{ marginTop: 0, paddingTop: 0, borderTop: 'none' }}>
                  <SliderRow label="Activity threshold" min={5} max={80} step={5} value={fragThreshold} onChange={setFragThreshold} />
                </div>
              )}
            </div>

            {/* ── FRAGMENTATION ── */}
            {algo === 'fragmentation' && <>
              {/* Time series colored by active/sedentary */}
              <ChartCard full title="Activity Signal · Active vs Sedentary" sub={`threshold = ${fragThreshold} · green = active · ${fragResult.totA} active epochs · ${fragResult.totS} sedentary epochs`} badge={`ASTP = ${fragResult.astp}`} badgeColor={interpASTP(fragResult.astp).c}>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={fragChartData.slice(0, visPoints)} margin={{ top: 4, right: 8, left: -20, bottom: 0 }} barSize={2} barCategoryGap={0}>
                    <CartesianGrid strokeDasharray="3 3" stroke={C.line} vertical={false} />
                    <XAxis dataKey="time" tick={{ fontFamily: 'var(--mono)', fontSize: 9, fill: C.text4 }} tickLine={false} axisLine={false} interval={23} />
                    <YAxis tick={{ fontFamily: 'var(--mono)', fontSize: 10, fill: C.text4 }} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={TT_STYLE} labelFormatter={(l) => `${l}`} formatter={(v: unknown, name: unknown) => [String(v), String(name)] as [string, string]} />
                    <ReferenceLine y={fragThreshold} stroke={C.amber} strokeDasharray="4 3" strokeOpacity={0.6} label={{ value: 'threshold', position: 'right', fontFamily: 'var(--mono)', fontSize: 9, fill: C.amber }} />
                    <Bar dataKey="signal" name="Activity" radius={0}>
                      {fragChartData.slice(0, visPoints).map((d, i) => (
                        <Cell key={i} fill={d.signal > fragThreshold ? C.sage : C.s3} fillOpacity={d.signal > fragThreshold ? 0.75 : 0.5} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>

              {/* Bout length histogram */}
              <ChartCard title="Active Bout Lengths" sub={`${fragResult.activeBouts.length} active bouts · mean = ${fragResult.meanActiveBout} epochs`}>
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={boutHistData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={C.line} vertical={false} />
                    <XAxis dataKey="l" tick={{ fontFamily: 'var(--mono)', fontSize: 9, fill: C.text4 }} tickLine={false} axisLine={false} label={{ value: 'bout length (epochs)', position: 'insideBottom', offset: -2, fontFamily: 'var(--mono)', fontSize: 9, fill: C.text4 }} />
                    <YAxis tick={{ fontFamily: 'var(--mono)', fontSize: 10, fill: C.text4 }} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={TT_STYLE} formatter={(v: unknown) => [String(v), 'bouts'] as [string, string]} />
                    <Bar dataKey="count" name="Count" fill={C.sage} fillOpacity={0.75} radius={[3,3,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>

              {/* Power law log-log CCDF */}
              <ChartCard title="Bout Power Law (CCDF)" sub={`log P(L ≥ x) vs log x · α = ${boutPL.alpha} · α < 2 → heavy tail (sustained bouts)`} badge={`α = ${boutPL.alpha}`} badgeColor={boutPL.alpha < 2 ? C.sage : C.coral}>
                {boutPL.points.length >= 3 ? (
                  <ResponsiveContainer width="100%" height={240}>
                    <LineChart data={boutPL.points} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={C.line} />
                      <XAxis dataKey="logL" tick={{ fontFamily: 'var(--mono)', fontSize: 10, fill: C.text4 }} tickLine={false} axisLine={false} label={{ value: 'log₁₀(L)', position: 'insideBottom', offset: -4, fontFamily: 'var(--mono)', fontSize: 9, fill: C.text4 }} />
                      <YAxis tick={{ fontFamily: 'var(--mono)', fontSize: 10, fill: C.text4 }} tickLine={false} axisLine={false} label={{ value: 'log P(L≥x)', angle: -90, position: 'insideLeft', fontFamily: 'var(--mono)', fontSize: 9, fill: C.text4 }} />
                      <Tooltip contentStyle={TT_STYLE} />
                      <Legend iconType="circle" iconSize={7} wrapperStyle={{ fontFamily: 'var(--mono)', fontSize: 10, paddingTop: 10 }} />
                      <Line type="monotone" dataKey="logP" stroke={C.sage} strokeWidth={0} dot={{ r: 4, fill: C.sage }} name="CCDF" />
                      <Line type="monotone" dataKey="fit"  stroke={C.sage} strokeWidth={1.5} dot={false} strokeDasharray="5 3" name={`fit (α=${boutPL.alpha})`} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div style={{ height: 240, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--mono)', fontSize: 11, color: C.text4 }}>Insufficient bout data — lower threshold to generate more active bouts</div>
                )}
              </ChartCard>

              {/* ASTP / SATP metric badges */}
              <MetricBadge label="ASTP · Active→Sedentary" value={fragResult.astp.toString()} interp={interpASTP(fragResult.astp)} />
              <MetricBadge label="SATP · Sedentary→Active" value={fragResult.satp.toString()} interp={{ text: `${fragResult.sedBouts.length} sedentary bouts`, c: C.text3 }} />
              <MetricBadge label="Mean Active Bout" value={fragResult.meanActiveBout.toString()} unit="epochs" interp={{ text: `${fragResult.activeBouts.length} bouts total`, c: C.text3 }} />
              <MetricBadge label="Mean Sedentary Bout" value={fragResult.meanSedBout.toString()} unit="epochs" interp={{ text: fragResult.meanSedBout > 12 ? 'Prolonged sedentary' : 'Short sedentary bouts', c: fragResult.meanSedBout > 12 ? C.coral : C.sage }} />
            </>}

            {/* ── CIRCADIAN ── */}
            {algo === 'circadian' && <>
              {/* 24-hour profile with M10/L5 windows */}
              <ChartCard full title="24-Hour Activity Profile" sub="2-day mean per hour · green = M10 most active 10h · amber = L5 least active 5h · synthetic 5-min epochs">
                <ResponsiveContainer width="100%" height={280}>
                  <AreaChart data={hourlyData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="actGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor={C.purple} stopOpacity={0.3}/>
                        <stop offset="95%" stopColor={C.purple} stopOpacity={0.04}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={C.line} />
                    <XAxis dataKey="label" tick={{ fontFamily: 'var(--mono)', fontSize: 9, fill: C.text4 }} tickLine={false} axisLine={false} interval={1} />
                    <YAxis tick={{ fontFamily: 'var(--mono)', fontSize: 10, fill: C.text4 }} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={TT_STYLE} formatter={(v: unknown) => [String(v), 'counts'] as [string, string]} />
                    <ReferenceArea x1={hourlyData[raResult.m10HourStart]?.label} x2={hourlyData[Math.min(23, raResult.m10HourEnd)]?.label} fill={C.sage}  fillOpacity={0.13} label={{ value: 'M10', position: 'insideTop', fontFamily: 'var(--mono)', fontSize: 9, fill: C.sage }} />
                    <ReferenceArea x1={hourlyData[raResult.l5HourStart]?.label}  x2={hourlyData[Math.min(23, raResult.l5HourEnd)]?.label}  fill={C.amber} fillOpacity={0.13} label={{ value: 'L5',  position: 'insideTop', fontFamily: 'var(--mono)', fontSize: 9, fill: C.amber }} />
                    <Area type="monotone" dataKey="mean" stroke={C.purple} strokeWidth={2} fill="url(#actGrad)" name="Activity" dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </ChartCard>

              {/* IS / IV / RA metric tiles */}
              <div style={{ gridColumn: '1 / -1', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                <MetricBadge label="IS · Interdaily Stability" value={isResult.toString()} interp={interpIS(isResult)} />
                <MetricBadge label="IV · Intradaily Variability" value={ivResult.toString()} interp={interpIV(ivResult)} />
                <MetricBadge label="RA · Relative Amplitude" value={raResult.ra.toString()} interp={interpRA(raResult.ra)} />
              </div>

              {/* M10/L5 detail + reference */}
              <div style={{ background: C.s1, border: `1px solid ${C.line}`, borderRadius: 14, padding: '24px 28px' }}>
                <div style={{ fontFamily: 'var(--serif)', fontWeight: 300, fontSize: 20, letterSpacing: '-0.01em', marginBottom: 12 }}>M10 / L5</div>
                {[
                  { label: 'M10 mean',   value: raResult.m10.toString(), sub: `most active 10h window · starts ${epochToTime(raResult.m10Start * 1)} `, color: C.sage },
                  { label: 'L5 mean',    value: raResult.l5.toString(),  sub: `least active 5h window · starts ${epochToTime(raResult.l5Start * 1)}`,   color: C.amber },
                  { label: 'RA = (M10−L5)/(M10+L5)', value: raResult.ra.toString(), sub: 'closer to 1.0 = stronger circadian contrast', color: interpRA(raResult.ra).c },
                ].map(r => (
                  <div key={r.label} style={{ display: 'flex', alignItems: 'baseline', gap: 14, padding: '8px 0', borderBottom: `1px solid ${C.line}` }}>
                    <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: r.color, minWidth: 200 }}>{r.label}</span>
                    <span style={{ fontFamily: 'var(--mono)', fontSize: 16, fontWeight: 600, color: r.color }}>{r.value}</span>
                    <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: C.text4 }}>{r.sub}</span>
                  </div>
                ))}
              </div>

              <div style={{ background: C.s1, border: `1px solid ${C.line}`, borderRadius: 14, padding: '24px 28px' }}>
                <div style={{ fontFamily: 'var(--serif)', fontWeight: 300, fontSize: 20, letterSpacing: '-0.01em', marginBottom: 12 }}>Clinical Context</div>
                {[
                  { m: 'IS',  desc: 'Low IS → irregular day-to-day rhythm; associated with cognitive decline and poor sleep quality' },
                  { m: 'IV',  desc: 'High IV → fragmented within-day rhythm; loss of normal rest-activity structure' },
                  { m: 'RA',  desc: 'Low RA → blurred day/night contrast; common in dementia and institutionalized older adults' },
                  { m: 'M10', desc: 'Timing of peak activity window — delayed or attenuated M10 seen in MCI' },
                  { m: 'L5',  desc: 'Most sedentary 5-hour window — elevated L5 may indicate nighttime activity or poor sleep' },
                ].map(x => (
                  <div key={x.m} style={{ padding: '8px 12px', background: C.s2, borderRadius: 8, border: `1px solid ${C.line}`, marginBottom: 8 }}>
                    <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: C.purple, marginBottom: 3 }}>{x.m}</div>
                    <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: C.text3, lineHeight: 1.5 }}>{x.desc}</div>
                  </div>
                ))}
              </div>
            </>}
          </>}

          {/* ── COMPLEXITY SUITE MODE ── */}
          {inComplex && <>
            {/* Complexity algo selector + sliders */}
            <div style={{ gridColumn: '1 / -1', background: C.s1, border: `1px solid ${C.line}`, borderRadius: 14, padding: '24px 28px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 }}>
                <div>
                  <div style={{ fontFamily: 'var(--serif)', fontWeight: 300, fontSize: 20, letterSpacing: '-0.01em', marginBottom: 4 }}>Complexity Suite</div>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: C.text3 }}>Movement complexity metrics — Khan & Jacobs, IEEE JBHI 2021 · MCI detection 6 months pre-diagnosis</div>
                </div>
                <SliderRow label="Visible points" min={30} max={200} step={5} value={visPoints} onChange={setVisPoints} />
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 24 }}>
                {COMPLEX_ALGOS.map(a => (
                  <button key={a.id} onClick={() => setAlgo(a.id)} style={{ padding: '8px 18px', borderRadius: 999, border: `1px solid ${algo === a.id ? a.color : C.lineS}`, background: algo === a.id ? `${a.color}1A` : 'transparent', color: algo === a.id ? a.color : C.text3, fontFamily: 'var(--mono)', fontSize: 12, cursor: 'pointer', transition: 'all 0.15s' }}>
                    {a.label}
                  </button>
                ))}
              </div>
              {/* Per-algo sliders */}
              <div className="ctrl-strip" style={{ marginTop: 0, paddingTop: 0, borderTop: 'none', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 48px' }}>
                {algo === 'cc' && <>
                  <SliderRow label="Num states"   min={3}  max={8}    step={1}    value={ccStates} onChange={setCcStates} />
                  <SliderRow label="Window size"  min={20} max={100}  step={5}    value={ccWindow} onChange={setCcWindow} />
                  <SliderRow label="Step size"    min={2}  max={20}   step={1}    value={ccStep}   onChange={setCcStep} />
                </>}
                {algo === 'dfa' && <>
                  <SliderRow label="Box count" min={8} max={30} step={2} value={dfaBoxes} onChange={setDfaBoxes} />
                </>}
                {algo === 'sample_entropy' && <>
                  <SliderRow label="Embedding dim m" min={1} max={5}    step={1}    value={seM} onChange={setSeM} />
                  <SliderRow label="Tolerance r"     min={0.05} max={0.5} step={0.05} value={seR} fmt={p2} onChange={setSeR} />
                </>}
                {algo === 'perm_entropy' && <>
                  <SliderRow label="Embedding dim m" min={3} max={7} step={1} value={peM}   onChange={setPeM} />
                  <SliderRow label="Delay τ"         min={1} max={5} step={1} value={peDelay} onChange={setPeDelay} />
                </>}
              </div>
            </div>

            {/* ── CC Charts ── */}
            {algo === 'cc' && <>
              <ChartCard full title="Cyclomatic Complexity" sub={`movement graph · ${ccStates} states · sliding window ${ccWindow} pts`} badge={`CC = ${ccResult.full.cc}`} badgeColor={interpCC(ccResult.full.cc).c}>
                <ResponsiveContainer width="100%" height={260}>
                  <LineChart data={ccResult.windowed} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={C.line} />
                    <XAxis dataKey="t" tick={{ fontFamily: 'var(--mono)', fontSize: 10, fill: C.text4 }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontFamily: 'var(--mono)', fontSize: 10, fill: C.text4 }} tickLine={false} axisLine={false} allowDecimals={false} />
                    <Tooltip contentStyle={TT_STYLE} />
                    <ReferenceLine y={ccResult.full.cc} stroke={C.sage} strokeDasharray="4 3" strokeOpacity={0.5} label={{ value: 'global', fontFamily: 'var(--mono)', fontSize: 9, fill: C.text4, position: 'right' }} />
                    <Line type="monotone" dataKey="cc" stroke={C.sage} strokeWidth={2} dot={{ r: 2, fill: C.sage }} name="CC" />
                  </LineChart>
                </ResponsiveContainer>
              </ChartCard>

              <ChartCard title="State Transition Matrix" sub={`directed transitions · ${ccStates} quantized states · E=${ccResult.full.E} N=${ccResult.full.N}`}>
                <div style={{ padding: '8px 0' }}>
                  <StateTransitionMatrix matrix={ccResult.full.matrix} n={ccStates} />
                </div>
              </ChartCard>

              <MetricBadge label="Cyclomatic Complexity" value={ccResult.full.cc.toString()} interp={interpCC(ccResult.full.cc)} />
            </>}

            {/* ── DFA Charts ── */}
            {algo === 'dfa' && <>
              <ChartCard full title="Detrended Fluctuation Analysis" sub={`log-log F(n) vs box size · α = ${dfaResult.alpha} · slope of regression`} badge={`α = ${dfaResult.alpha}`} badgeColor={interpDFA(dfaResult.alpha).c}>
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={dfaResult.points} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={C.line} />
                    <XAxis dataKey="logN" tick={{ fontFamily: 'var(--mono)', fontSize: 10, fill: C.text4 }} tickLine={false} axisLine={false} label={{ value: 'log₁₀(n)', position: 'insideBottom', offset: -4, fontFamily: 'var(--mono)', fontSize: 9, fill: C.text4 }} />
                    <YAxis tick={{ fontFamily: 'var(--mono)', fontSize: 10, fill: C.text4 }} tickLine={false} axisLine={false} label={{ value: 'log₁₀ F(n)', angle: -90, position: 'insideLeft', fontFamily: 'var(--mono)', fontSize: 9, fill: C.text4 }} />
                    <Tooltip contentStyle={TT_STYLE} />
                    <Legend iconType="circle" iconSize={7} wrapperStyle={{ fontFamily: 'var(--mono)', fontSize: 10, paddingTop: 10 }} />
                    <Line type="monotone" dataKey="logF" stroke={C.amber} strokeWidth={0} dot={{ r: 5, fill: C.amber }} name="F(n)" />
                    <Line type="monotone" dataKey="fit"  stroke={C.amber} strokeWidth={1.5} dot={false} strokeDasharray="5 3" name={`DFA fit (α=${dfaResult.alpha})`} />
                  </LineChart>
                </ResponsiveContainer>
              </ChartCard>

              <MetricBadge label="DFA Exponent α" value={dfaResult.alpha.toString()} interp={interpDFA(dfaResult.alpha)} />

              <div style={{ background: C.s1, border: `1px solid ${C.line}`, borderRadius: 14, padding: '24px 28px' }}>
                <div style={{ fontFamily: 'var(--serif)', fontWeight: 300, fontSize: 20, letterSpacing: '-0.01em', marginBottom: 12 }}>α Reference</div>
                {[
                  { range: 'α < 0.5', label: 'Anti-correlated',       color: C.red    },
                  { range: 'α ≈ 0.5', label: 'White noise',           color: C.amber  },
                  { range: '0.5 < α < 1', label: 'Long-range correlated (1/f)', color: C.sage },
                  { range: 'α ≈ 1.0', label: '1/f noise',             color: C.sage   },
                  { range: 'α > 1.0', label: 'Non-stationary',        color: C.purple },
                ].map(r => (
                  <div key={r.range} style={{ display: 'flex', gap: 10, padding: '6px 0', borderBottom: `1px solid ${C.line}`, alignItems: 'center' }}>
                    <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: r.color, minWidth: 110 }}>{r.range}</span>
                    <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: C.text3 }}>{r.label}</span>
                    {Math.abs(dfaResult.alpha - parseFloat(r.range.replace(/[^0-9.]/g, ''))) < 0.15 && <span style={{ marginLeft: 'auto', fontFamily: 'var(--mono)', fontSize: 9, color: r.color, background: `${r.color}18`, padding: '2px 8px', borderRadius: 999 }}>← current</span>}
                  </div>
                ))}
              </div>
            </>}

            {/* ── Sample Entropy Charts ── */}
            {algo === 'sample_entropy' && <>
              <ChartCard full title="Sample Entropy" sub={`sliding window entropy · m=${seM} · r=${seR.toFixed(2)}×σ`} badge={`SampEn = ${seResult.value}`} badgeColor={interpSE(seResult.value).c}>
                <ResponsiveContainer width="100%" height={260}>
                  <LineChart data={seResult.windowed} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={C.line} />
                    <XAxis dataKey="t" tick={{ fontFamily: 'var(--mono)', fontSize: 10, fill: C.text4 }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontFamily: 'var(--mono)', fontSize: 10, fill: C.text4 }} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={TT_STYLE} />
                    <ReferenceLine y={seResult.value} stroke={C.purple} strokeDasharray="4 3" strokeOpacity={0.5} label={{ value: 'global', fontFamily: 'var(--mono)', fontSize: 9, fill: C.text4, position: 'right' }} />
                    <Line type="monotone" dataKey="se" stroke={C.purple} strokeWidth={2} dot={{ r: 2, fill: C.purple }} name="SampEn" />
                  </LineChart>
                </ResponsiveContainer>
              </ChartCard>

              <MetricBadge label="Sample Entropy" value={seResult.value.toString()} interp={interpSE(seResult.value)} />

              <div style={{ background: C.s1, border: `1px solid ${C.line}`, borderRadius: 14, padding: '24px 28px' }}>
                <div style={{ fontFamily: 'var(--serif)', fontWeight: 300, fontSize: 20, letterSpacing: '-0.01em', marginBottom: 4 }}>What it measures</div>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: C.text3, lineHeight: 1.7, marginTop: 12 }}>
                  Sample Entropy counts how often a template of length <span style={{ color: C.text2 }}>m</span> repeats at length <span style={{ color: C.text2 }}>m+1</span>. Lower values indicate a more regular, predictable signal — a pattern associated with reduced behavioral variability in MCI.
                </div>
                <div style={{ marginTop: 16, display: 'flex', gap: 10 }}>
                  {[{ v: '≈ 0', l: 'Periodic', c: C.sage },{ v: '0.5–1.0', l: 'Moderate', c: C.amber },{ v: '> 1.5', l: 'Irregular', c: C.red }].map(x => (
                    <div key={x.v} style={{ flex: 1, padding: '10px 12px', background: C.s2, borderRadius: 8, border: `1px solid ${C.line}` }}>
                      <div style={{ fontFamily: 'var(--mono)', fontSize: 13, fontWeight: 600, color: x.c }}>{x.v}</div>
                      <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: C.text4, marginTop: 4 }}>{x.l}</div>
                    </div>
                  ))}
                </div>
              </div>
            </>}

            {/* ── Permutation Entropy Charts ── */}
            {algo === 'perm_entropy' && <>
              <ChartCard title="Ordinal Pattern Distribution" sub={`top ${Math.min(12, peResult.patterns.length)} patterns · m=${peM} · ${Math.min(peResult.patterns.length, 999)} unique`}>
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={peResult.patterns.slice(0, 12)} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={C.line} vertical={false} />
                    <XAxis dataKey="key" tick={{ fontFamily: 'var(--mono)', fontSize: 9, fill: C.text4 }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontFamily: 'var(--mono)', fontSize: 10, fill: C.text4 }} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={TT_STYLE} />
                    <Bar dataKey="count" name="Count" fill={C.coral} fillOpacity={0.8} radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>

              <ChartCard title="Permutation Entropy" sub={`windowed PE · m=${peM} · τ=${peDelay}`} badge={`PE = ${peResult.pe}`} badgeColor={interpPE(peResult.pe).c}>
                <ResponsiveContainer width="100%" height={240}>
                  <LineChart data={peResult.windowed} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={C.line} />
                    <XAxis dataKey="t" tick={{ fontFamily: 'var(--mono)', fontSize: 10, fill: C.text4 }} tickLine={false} axisLine={false} />
                    <YAxis domain={[0, 1]} tick={{ fontFamily: 'var(--mono)', fontSize: 10, fill: C.text4 }} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={TT_STYLE} />
                    <ReferenceLine y={peResult.pe} stroke={C.coral} strokeDasharray="4 3" strokeOpacity={0.5} />
                    <Line type="monotone" dataKey="pe" stroke={C.coral} strokeWidth={2} dot={{ r: 2, fill: C.coral }} name="PE" />
                  </LineChart>
                </ResponsiveContainer>
              </ChartCard>
            </>}

            {/* ── Hurst Charts ── */}
            {algo === 'hurst' && <>
              <ChartCard full title="Hurst Exponent (R/S)" sub={`rescaled range · log-log regression · H = ${hurstResult.hurst}`} badge={`H = ${hurstResult.hurst}`} badgeColor={interpH(hurstResult.hurst).c}>
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={hurstResult.points} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={C.line} />
                    <XAxis dataKey="logN" tick={{ fontFamily: 'var(--mono)', fontSize: 10, fill: C.text4 }} tickLine={false} axisLine={false} label={{ value: 'log₁₀(n)', position: 'insideBottom', offset: -4, fontFamily: 'var(--mono)', fontSize: 9, fill: C.text4 }} />
                    <YAxis tick={{ fontFamily: 'var(--mono)', fontSize: 10, fill: C.text4 }} tickLine={false} axisLine={false} label={{ value: 'log₁₀(R/S)', angle: -90, position: 'insideLeft', fontFamily: 'var(--mono)', fontSize: 9, fill: C.text4 }} />
                    <Tooltip contentStyle={TT_STYLE} />
                    <Legend iconType="circle" iconSize={7} wrapperStyle={{ fontFamily: 'var(--mono)', fontSize: 10, paddingTop: 10 }} />
                    <Line type="monotone" dataKey="logRS" stroke={C.accent} strokeWidth={0} dot={{ r: 5, fill: C.accent }} name="R/S" />
                    <Line type="monotone" dataKey="fit"   stroke={C.accent} strokeWidth={1.5} dot={false} strokeDasharray="5 3" name={`fit (H=${hurstResult.hurst})`} />
                  </LineChart>
                </ResponsiveContainer>
              </ChartCard>

              <MetricBadge label="Hurst Exponent H" value={hurstResult.hurst.toString()} interp={interpH(hurstResult.hurst)} />

              <div style={{ background: C.s1, border: `1px solid ${C.line}`, borderRadius: 14, padding: '24px 28px' }}>
                <div style={{ fontFamily: 'var(--serif)', fontWeight: 300, fontSize: 20, letterSpacing: '-0.01em', marginBottom: 12 }}>H Reference</div>
                {[
                  { range: 'H < 0.4',      label: 'Anti-persistent — mean-reverting',     color: C.red    },
                  { range: 'H ≈ 0.5',      label: 'Random walk — no memory',              color: C.amber  },
                  { range: '0.6 < H < 0.8',label: 'Persistent — trending behavior',       color: C.sage   },
                  { range: 'H > 0.8',      label: 'Strongly persistent — long memory',     color: C.accent },
                ].map(r => (
                  <div key={r.range} style={{ display: 'flex', gap: 10, padding: '6px 0', borderBottom: `1px solid ${C.line}`, alignItems: 'center' }}>
                    <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: r.color, minWidth: 130 }}>{r.range}</span>
                    <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: C.text3 }}>{r.label}</span>
                  </div>
                ))}
              </div>
            </>}

            {/* ── Fingerprint ── */}
            {algo === 'fingerprint' && <>
              <div style={{ gridColumn: '1 / -1', display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12 }}>
                <MetricBadge label="Cyclomatic CC" value={fingerprint.cc.toString()} interp={interpCC(fingerprint.cc)} />
                <MetricBadge label="DFA α" value={fingerprint.dfa.toString()} interp={interpDFA(fingerprint.dfa)} />
                <MetricBadge label="Sample Entropy" value={fingerprint.se.toString()} interp={interpSE(fingerprint.se)} />
                <MetricBadge label="Perm Entropy" value={fingerprint.pe.toString()} interp={interpPE(fingerprint.pe)} />
                <MetricBadge label="Hurst H" value={fingerprint.hurst.toString()} interp={interpH(fingerprint.hurst)} />
              </div>

              <ChartCard full title="Complexity Fingerprint" sub="normalized radar — all 5 metrics on 0–100 scale · Khan & Jacobs feature set">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 32, alignItems: 'center' }}>
                  <ResponsiveContainer width="100%" height={340}>
                    <RadarChart data={fingerprint.radar} cx="50%" cy="50%" outerRadius="70%">
                      <PolarGrid stroke={C.line} />
                      <PolarAngleAxis dataKey="metric" tick={{ fontFamily: 'var(--mono)', fontSize: 11, fill: C.text3 }} />
                      <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontFamily: 'var(--mono)', fontSize: 9, fill: C.text4 }} tickCount={4} />
                      <Radar name="Complexity" dataKey="value" stroke={C.gold} fill={C.gold} fillOpacity={0.18} strokeWidth={2} />
                      <Tooltip contentStyle={TT_STYLE} formatter={(v: unknown) => [`${v}`, 'Score']} />
                    </RadarChart>
                  </ResponsiveContainer>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: C.text4, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 6 }}>Clinical context</div>
                    {[
                      { m: 'CC', desc: 'High CC → erratic state transitions, wandering behavior' },
                      { m: 'DFA α', desc: 'Near 0.5 → loss of long-range temporal structure' },
                      { m: 'SampEn', desc: 'Low SE → stereotyped repetitive movement' },
                      { m: 'PermEn', desc: 'Low PE → reduced ordinal pattern diversity' },
                      { m: 'Hurst', desc: 'H → 0.5 → weakening movement persistence' },
                    ].map(x => (
                      <div key={x.m} style={{ padding: '8px 12px', background: C.s2, borderRadius: 8, border: `1px solid ${C.line}` }}>
                        <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: C.gold, marginBottom: 3 }}>{x.m}</div>
                        <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: C.text3, lineHeight: 1.5 }}>{x.desc}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </ChartCard>
            </>}
          </>}

          {/* ── PREDICTIVE INTELLIGENCE ── */}
          {inPredictive && <>

            {/* Section header */}
            <div style={{ gridColumn: '1 / -1', background: C.s1, border: `1px solid ${C.line}`, borderRadius: 14, padding: '24px 28px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 }}>
                <div>
                  <div style={{ fontFamily: 'var(--serif)', fontWeight: 300, fontSize: 20, letterSpacing: '-0.01em', marginBottom: 4 }}>
                    {algo === 'mse' ? 'Multi-Scale Entropy' : algo === 'phase_space' ? 'Phase Space Portrait' : algo === 'cusum' ? 'CUSUM Drift Detector' : 'Clinical Risk Panel'}
                  </div>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: C.text3 }}>
                    {algo === 'mse' ? 'Costa, Goldberger & Peng · Science 2002 · complexity across time scales predicts mortality' :
                     algo === 'phase_space' ? 'Takens embedding theorem · reconstructed attractor · lag τ = autocorrelation first-zero-crossing' :
                     algo === 'cusum' ? 'Page 1954 · sequential change detection · detects baseline shift before clinical threshold is crossed' :
                     'Cross-suite composite score — Signal Processing · Complexity Suite · Activity Analysis · Circadian'}
                  </div>
                </div>
                <SliderRow label="Visible points" min={30} max={200} step={5} value={visPoints} onChange={setVisPoints} />
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
                {PREDICTIVE_ALGOS.map(a => (
                  <button key={a.id} onClick={() => setAlgo(a.id)} style={{ padding: '8px 18px', borderRadius: 999, border: `1px solid ${algo === a.id ? a.color : C.lineS}`, background: algo === a.id ? `${a.color}1A` : 'transparent', color: algo === a.id ? a.color : C.text3, fontFamily: 'var(--mono)', fontSize: 12, cursor: 'pointer', transition: 'all 0.15s' }}>{a.label}</button>
                ))}
              </div>
              {algo === 'cusum' && (
                <div className="ctrl-strip" style={{ marginTop: 0, paddingTop: 0, borderTop: 'none', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 48px' }}>
                  <SliderRow label="Reference k (×σ)" min={0.1} max={1.5} step={0.1} value={cusumK} fmt={v => v.toFixed(1)} onChange={setCusumK} />
                  <SliderRow label="Decision h (×σ)" min={2} max={10} step={0.5} value={cusumH} fmt={v => v.toFixed(1)} onChange={setCusumH} />
                </div>
              )}
              {algo === 'mse' && (
                <div className="ctrl-strip" style={{ marginTop: 0, paddingTop: 0, borderTop: 'none' }}>
                  <SliderRow label="Max scale" min={4} max={15} step={1} value={mseScale} onChange={setMseScale} />
                </div>
              )}
            </div>

            {/* ── MSE ── */}
            {algo === 'mse' && <>
              <ChartCard full title="Multi-Scale Entropy" sub={`sample entropy at each coarsening scale · slope = ${mseSlopeResult.slope.toFixed(4)} · m=2 · r=0.15σ`} badge={interpMSE(mseSlopeResult.slope).text} badgeColor={interpMSE(mseSlopeResult.slope).c}>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={mseResult} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="mseArea" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor={C.purple} stopOpacity={0.2}/>
                        <stop offset="95%" stopColor={C.purple} stopOpacity={0.03}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={C.line} />
                    <XAxis dataKey="scale" tick={{ fontFamily: 'var(--mono)', fontSize: 10, fill: C.text4 }} tickLine={false} axisLine={false} label={{ value: 'Scale τ', position: 'insideBottom', offset: -4, fontFamily: 'var(--mono)', fontSize: 9, fill: C.text4 }} />
                    <YAxis tick={{ fontFamily: 'var(--mono)', fontSize: 10, fill: C.text4 }} tickLine={false} axisLine={false} label={{ value: 'SampEn', angle: -90, position: 'insideLeft', fontFamily: 'var(--mono)', fontSize: 9, fill: C.text4 }} />
                    <Tooltip contentStyle={TT_STYLE} formatter={(v: unknown) => [typeof v === 'number' ? v.toFixed(4) : String(v), 'SampEn'] as [string, string]} />
                    <Legend iconType="circle" iconSize={7} wrapperStyle={{ fontFamily: 'var(--mono)', fontSize: 10, paddingTop: 10 }} />
                    <Line type="monotone" dataKey="se" stroke={C.purple} strokeWidth={2.5} dot={{ r: 5, fill: C.purple }} name="Measured MSE" />
                  </LineChart>
                </ResponsiveContainer>
              </ChartCard>

              <MetricBadge label="MSE Slope" value={mseSlopeResult.slope.toFixed(4)} interp={interpMSE(mseSlopeResult.slope)} />

              <div style={{ background: C.s1, border: `1px solid ${C.line}`, borderRadius: 14, padding: '24px 28px' }}>
                <div style={{ fontFamily: 'var(--serif)', fontWeight: 300, fontSize: 20, letterSpacing: '-0.01em', marginBottom: 12 }}>What the slope means</div>
                {[
                  { r: 'Positive slope',  l: 'Complexity increases with scale — healthy multiscale dynamics', c: C.sage   },
                  { r: 'Flat / plateau',  l: 'Reduced long-range complexity — typical in older adults',        c: C.amber  },
                  { r: 'Negative slope',  l: 'High entropy at fine scales only — pathological (arrhythmia / MCI)', c: C.red },
                ].map(r => (
                  <div key={r.r} style={{ display: 'flex', gap: 10, padding: '7px 0', borderBottom: `1px solid ${C.line}`, alignItems: 'center' }}>
                    <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: r.c, minWidth: 130 }}>{r.r}</span>
                    <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: C.text3 }}>{r.l}</span>
                  </div>
                ))}
                <div style={{ marginTop: 14, fontFamily: 'var(--mono)', fontSize: 10, color: C.text4, lineHeight: 1.6 }}>
                  Costa, Goldberger & Peng 2002 showed that white noise has high single-scale entropy but low MSE at coarser scales. Healthy young adults show increasing MSE. Cardiac patients and MCI subjects show flat or decreasing MSE — loss of adaptive, multiscale complexity.
                </div>
              </div>
            </>}

            {/* ── PHASE SPACE ── */}
            {algo === 'phase_space' && <>
              <ChartCard full title="Phase Space Portrait" sub={`delay embedding · τ = ${psLag} (first AC zero-crossing) · ${phaseData.length} points · reconstructed attractor`} badge={`τ = ${psLag}`} badgeColor={C.sage}>
                <ResponsiveContainer width="100%" height={400}>
                  <ScatterChart margin={{ top: 4, right: 8, left: -20, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={C.line} />
                    <XAxis type="number" dataKey="x" name="x(t)" tick={{ fontFamily: 'var(--mono)', fontSize: 10, fill: C.text4 }} tickLine={false} axisLine={false} label={{ value: 'x(t)', position: 'insideBottom', offset: -8, fontFamily: 'var(--mono)', fontSize: 9, fill: C.text4 }} />
                    <YAxis type="number" dataKey="y" name={`x(t+τ)`} tick={{ fontFamily: 'var(--mono)', fontSize: 10, fill: C.text4 }} tickLine={false} axisLine={false} label={{ value: `x(t+${psLag})`, angle: -90, position: 'insideLeft', fontFamily: 'var(--mono)', fontSize: 9, fill: C.text4 }} />
                    <ZAxis range={[20, 20]} />
                    <Tooltip contentStyle={TT_STYLE} cursor={{ strokeDasharray: '3 3', stroke: C.lineS }} formatter={(v: unknown) => [typeof v === 'number' ? v.toFixed(2) : String(v), ''] as [string, string]} />
                    <Scatter data={phaseData} fill={C.sage} fillOpacity={0.45} name="Phase portrait" />
                  </ScatterChart>
                </ResponsiveContainer>
              </ChartCard>

              <div style={{ background: C.s1, border: `1px solid ${C.line}`, borderRadius: 14, padding: '24px 28px' }}>
                <div style={{ fontFamily: 'var(--serif)', fontWeight: 300, fontSize: 20, letterSpacing: '-0.01em', marginBottom: 12 }}>Takens Embedding</div>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: C.text3, lineHeight: 1.7 }}>
                  By Takens' 1981 theorem, plotting x(t) vs x(t+τ) reconstructs the topology of the underlying attractor from a single observable. The shape of the cloud reveals the system's dynamics — circular or elliptical attractors suggest oscillation, scattered clouds suggest noise or chaos.
                </div>
                <div style={{ marginTop: 16, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  {[
                    { t: 'τ = ' + psLag, d: 'Lag chosen at first AC zero-crossing — decorrelates consecutive samples' },
                    { t: 'Cloud shape', d: 'Ellipse → oscillatory · Filled circle → noise · Fractal → chaos' },
                    { t: 'Density', d: 'Dense core = most probable state · sparse tails = rare excursions' },
                    { t: 'Clinical', d: 'MCI signals show more diffuse attractors — loss of organized dynamics' },
                  ].map(x => (
                    <div key={x.t} style={{ padding: '10px 14px', background: C.s2, borderRadius: 8, border: `1px solid ${C.line}` }}>
                      <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: C.sage, marginBottom: 4 }}>{x.t}</div>
                      <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: C.text4, lineHeight: 1.5 }}>{x.d}</div>
                    </div>
                  ))}
                </div>
              </div>
            </>}

            {/* ── CUSUM DRIFT ── */}
            {algo === 'cusum' && <>
              <ChartCard full title="Signal + Drift Regions" sub={`baseline μ=${cusumResult.mu} · σ=${cusumResult.sigma} · ${cusumResult.detectedAt !== null ? `drift detected at t=${cusumResult.detectedAt}` : 'no drift detected'}`} badge={cusumResult.detectedAt !== null ? `Alert t=${cusumResult.detectedAt}` : 'No drift'} badgeColor={cusumResult.detectedAt !== null ? C.red : C.sage}>
                <ResponsiveContainer width="100%" height={240}>
                  <ComposedChart data={cusumResult.points.slice(0, visPoints)} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={C.line} />
                    <XAxis dataKey="t" tick={{ fontFamily: 'var(--mono)', fontSize: 10, fill: C.text4 }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontFamily: 'var(--mono)', fontSize: 10, fill: C.text4 }} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={TT_STYLE} />
                    <ReferenceLine y={cusumResult.mu} stroke={C.accent} strokeDasharray="4 3" strokeOpacity={0.5} label={{ value: 'μ', position: 'right', fontFamily: 'var(--mono)', fontSize: 9, fill: C.accent }} />
                    {cusumResult.detectedAt !== null && (
                      <ReferenceArea x1={cusumResult.detectedAt} fill={C.red} fillOpacity={0.08} label={{ value: 'drift', position: 'insideTopLeft', fontFamily: 'var(--mono)', fontSize: 9, fill: C.red }} />
                    )}
                    <Line type="monotone" dataKey="signal" stroke={C.text3} strokeWidth={1} dot={false} name="Signal" />
                  </ComposedChart>
                </ResponsiveContainer>
              </ChartCard>

              <ChartCard full title="CUSUM Statistics" sub={`C⁺ and C⁻ · decision threshold h = ${cusumResult.threshold} · k = ${cusumK.toFixed(1)}σ`}>
                <ResponsiveContainer width="100%" height={220}>
                  <ComposedChart data={cusumResult.points.slice(0, visPoints)} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={C.line} />
                    <XAxis dataKey="t" tick={{ fontFamily: 'var(--mono)', fontSize: 10, fill: C.text4 }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontFamily: 'var(--mono)', fontSize: 10, fill: C.text4 }} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={TT_STYLE} />
                    <Legend iconType="circle" iconSize={7} wrapperStyle={{ fontFamily: 'var(--mono)', fontSize: 10, paddingTop: 10 }} />
                    <ReferenceLine y={cusumResult.threshold} stroke={C.red} strokeDasharray="4 3" label={{ value: 'h (threshold)', position: 'right', fontFamily: 'var(--mono)', fontSize: 9, fill: C.red }} />
                    <Line type="monotone" dataKey="cp" stroke={C.sage}  strokeWidth={1.8} dot={false} name="CUSUM⁺ (high shift)" />
                    <Line type="monotone" dataKey="cm" stroke={C.coral} strokeWidth={1.8} dot={false} name="CUSUM⁻ (low shift)" />
                  </ComposedChart>
                </ResponsiveContainer>
              </ChartCard>

              <MetricBadge label="Detection Time" value={cusumResult.detectedAt !== null ? `t = ${cusumResult.detectedAt}` : '—'} interp={cusumResult.detectedAt !== null ? { text: 'Drift detected', c: C.red } : { text: 'Signal stable', c: C.sage }} />
              <div style={{ background: C.s1, border: `1px solid ${C.line}`, borderRadius: 14, padding: '24px 28px' }}>
                <div style={{ fontFamily: 'var(--serif)', fontWeight: 300, fontSize: 20, letterSpacing: '-0.01em', marginBottom: 12 }}>Why CUSUM matters</div>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: C.text3, lineHeight: 1.7 }}>
                  In ambient monitoring, a patient's baseline changes slowly — weeks before a fall or cognitive event. CUSUM accumulates small deviations from baseline, making it far more sensitive than threshold alarms. It trades instantaneous accuracy for longitudinal sensitivity. Clinical deployment: run on 30-day rolling windows, alert care team when drift exceeds h.
                </div>
              </div>
            </>}

            {/* ── RISK PANEL ── */}
            {algo === 'risk_panel' && <>
              {/* Score headline */}
              <div style={{ gridColumn: '1 / -1', display: 'grid', gridTemplateColumns: '280px 1fr', gap: 16, alignItems: 'start' }}>
                <div style={{ background: C.s1, border: `2px solid ${interpRisk(riskResult.score).c}44`, borderRadius: 14, padding: '32px 28px', textAlign: 'center' }}>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: C.text4, textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: 12 }}>Clinical Risk Score</div>
                  <div style={{ fontFamily: 'var(--serif)', fontWeight: 300, fontSize: 88, lineHeight: 1, letterSpacing: '-0.04em', color: interpRisk(riskResult.score).c }}>{riskResult.score}</div>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: C.text3, marginTop: 6 }}>out of 100</div>
                  <span style={{ display: 'inline-flex', marginTop: 16, padding: '5px 16px', borderRadius: 999, background: `${interpRisk(riskResult.score).c}18`, border: `1px solid ${interpRisk(riskResult.score).c}50`, color: interpRisk(riskResult.score).c, fontFamily: 'var(--mono)', fontSize: 12 }}>{interpRisk(riskResult.score).text}</span>
                  <div style={{ marginTop: 20, fontFamily: 'var(--mono)', fontSize: 9, color: C.text4, lineHeight: 1.6, textAlign: 'left' }}>
                    Weighted composite of fragmentation (ASTP 22%), circadian stability (IS 15%), rhythm fragmentation (IV 12%), DFA deviation (12%), circadian contrast (10%), signal regularity (10%), movement complexity (10%), Hurst persistence (9%)
                  </div>
                </div>

                <div style={{ background: C.s1, border: `1px solid ${C.line}`, borderRadius: 14, padding: '24px 28px' }}>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: C.text4, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 16 }}>Component Breakdown</div>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart layout="vertical" data={riskResult.components} margin={{ top: 0, right: 40, left: 4, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={C.line} horizontal={false} />
                      <XAxis type="number" domain={[0, 100]} tick={{ fontFamily: 'var(--mono)', fontSize: 9, fill: C.text4 }} tickLine={false} axisLine={false} />
                      <YAxis type="category" dataKey="name" width={210} tick={{ fontFamily: 'var(--mono)', fontSize: 9, fill: C.text3 }} tickLine={false} axisLine={false} />
                      <Tooltip contentStyle={TT_STYLE} formatter={(v: unknown) => [String(v), 'Component score'] as [string, string]} />
                      <ReferenceLine x={50} stroke={C.amber} strokeDasharray="4 3" strokeOpacity={0.5} />
                      <Bar dataKey="value" name="Score" radius={[0, 3, 3, 0]}>
                        {riskResult.components.map((c, i) => (
                          <Cell key={i} fill={Number(c.value) >= 70 ? C.red : Number(c.value) >= 50 ? C.coral : Number(c.value) >= 30 ? C.amber : C.sage} fillOpacity={0.8} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Evidence citations */}
              <div style={{ gridColumn: '1 / -1', background: C.s1, border: `1px solid ${C.line}`, borderRadius: 14, padding: '24px 28px' }}>
                <div style={{ fontFamily: 'var(--serif)', fontWeight: 300, fontSize: 20, letterSpacing: '-0.01em', marginBottom: 12 }}>Evidence Base</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                  {[
                    { src: 'Karas et al. 2019', title: 'JAMA Network Open', finding: 'ASTP independently predicts all-cause mortality (HR 1.38 per SD) in NHANES cohort of 2,978 adults' },
                    { src: 'Khan & Jacobs 2021', title: 'IEEE JBHI', finding: 'CC, DFA, SampEn, PermEn, Hurst collectively predict MCI 6 months before diagnosis with >82% AUC' },
                    { src: 'Urbanek / JHU-COAH', title: 'Accelerometry Resource Core', finding: 'IS, IV, RA, M10/L5 characterize circadian disruption; lower IS and RA associated with cognitive decline' },
                  ].map(x => (
                    <div key={x.src} style={{ padding: '14px 16px', background: C.s2, borderRadius: 10, border: `1px solid ${C.line}` }}>
                      <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: C.gold, marginBottom: 3 }}>{x.src}</div>
                      <div style={{ fontFamily: 'var(--mono)', fontSize: 9.5, color: C.text3, marginBottom: 8 }}>{x.title}</div>
                      <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: C.text4, lineHeight: 1.55 }}>{x.finding}</div>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: 14, fontFamily: 'var(--mono)', fontSize: 10, color: C.text4, lineHeight: 1.6 }}>
                  Risk score is a research instrument, not a clinical diagnostic. Weights reflect current literature and should be validated in a prospective cohort before clinical deployment. All metrics computed on synthetic demo data above.
                </div>
              </div>
            </>}
          </>}

        </div>

        <div className="agent-note" style={{ marginTop: 48 }}>
          — Ambient Intelligence · algorithm lab · Khan & Jacobs 2021 · cyclomatic complexity · DFA · sample entropy · permutation entropy · Hurst · Karas et al. 2019 · ASTP · SATP · Urbanek / JHU-COAH · IS · IV · RA · M10/L5 —
        </div>
      </main>
    </div>
  );
}
