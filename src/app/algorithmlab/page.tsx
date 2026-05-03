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
    { name: 'Fragmentation (ASTP)',   value: +Math.min(100, m.astp * 320).toFixed(1),              weight: 0.22, citation: 'Karas 2019' },
    { name: 'Circadian Stability (IS)', value: +Math.min(100, (1 - m.is_) * 160).toFixed(1),       weight: 0.15, citation: 'Urbanek / JHU-COAH' },
    { name: 'Rhythm Fragmentation (IV)', value: +Math.min(100, m.iv * 75).toFixed(1),             weight: 0.12, citation: 'Urbanek / JHU-COAH' },
    { name: 'Circadian Contrast (RA)', value: +Math.min(100, (1 - m.ra) * 130).toFixed(1),        weight: 0.10, citation: 'Urbanek / JHU-COAH' },
    { name: 'DFA Deviation from 1/f', value: +Math.min(100, Math.abs(m.dfa - 1.0) * 110).toFixed(1), weight: 0.12, citation: 'Khan & Jacobs 2021' },
    { name: 'Signal Regularity (SampEn)', value: +Math.min(100, Math.max(0, (1.5 - m.se) * 85)).toFixed(1), weight: 0.10, citation: 'Khan & Jacobs 2021' },
    { name: 'Movement Complexity (CC)', value: +Math.min(100, Math.max(0, (m.cc - 2) * 11)).toFixed(1), weight: 0.10, citation: 'Khan & Jacobs 2021' },
    { name: 'Persistence (Hurst H)', value: +Math.min(100, Math.abs(m.hurst - 0.7) * 160).toFixed(1), weight: 0.09, citation: 'Khan & Jacobs 2021' },
  ];
  const totalW = components.reduce((a, c) => a + c.weight, 0);
  const score = +(components.reduce((a, c) => a + Number(c.value) * c.weight, 0) / totalW).toFixed(1);
  return { score, components };
}

// ── Lin et al. 2026 — Fall Risk Models ──────────────────────────
const FALL_MODELS = [
  { name: 'AGRU',     auroc: 0.934, acc: 91.4, f1: 91.2, recall: 89.1, isDeep: true  },
  { name: 'GRU',      auroc: 0.911, acc: 88.2, f1: 87.8, recall: 86.3, isDeep: true  },
  { name: 'CatBoost', auroc: 0.893, acc: 86.1, f1: 85.6, recall: 84.1, isDeep: false },
  { name: 'XGBoost',  auroc: 0.881, acc: 84.7, f1: 84.3, recall: 82.7, isDeep: false },
  { name: 'GBDT',     auroc: 0.872, acc: 83.4, f1: 82.9, recall: 81.3, isDeep: false },
  { name: 'RF',       auroc: 0.851, acc: 81.2, f1: 80.7, recall: 79.5, isDeep: false },
  { name: 'KNN',      auroc: 0.786, acc: 76.3, f1: 74.8, recall: 73.2, isDeep: false },
];

const AGRU_SUBGROUPS = [
  { group: '20–45', label: 'Young',   auroc: 0.891, acc: 88.3 },
  { group: '46–65', label: 'Middle',  auroc: 0.921, acc: 90.7 },
  { group: '>65',   label: 'Older',   auroc: 0.938, acc: 91.9 },
];

type AgeGroup = 'overall' | 'young' | 'middle' | 'older';

function shapFeatureData(group: AgeGroup) {
  const sets: Record<AgeGroup, { feature: string; shap: number }[]> = {
    overall: [
      { feature: 'Pulse Rate',       shap:  0.42 },
      { feature: 'Living Alone',     shap:  0.38 },
      { feature: 'Systolic BP',      shap:  0.31 },
      { feature: '5× Sit-to-Stand',  shap:  0.29 },
      { feature: 'Sex (female)',      shap:  0.24 },
      { feature: 'BMI',              shap:  0.18 },
      { feature: 'Age',              shap:  0.16 },
      { feature: 'Gait Speed',       shap: -0.15 },
      { feature: 'Activity Level',   shap: -0.12 },
      { feature: 'Social Support',   shap: -0.09 },
    ],
    young: [
      { feature: 'Injury History',   shap:  0.48 },
      { feature: 'BMI',              shap:  0.38 },
      { feature: 'Alcohol Use',      shap:  0.35 },
      { feature: 'Pulse Rate',       shap:  0.28 },
      { feature: 'Medications',      shap:  0.22 },
      { feature: 'Activity Level',   shap: -0.32 },
      { feature: 'Sleep Quality',    shap: -0.18 },
      { feature: 'Gait Speed',       shap: -0.14 },
      { feature: 'Social Support',   shap: -0.10 },
      { feature: 'Vitamin D',        shap: -0.07 },
    ],
    middle: [
      { feature: 'Systolic BP',      shap:  0.44 },
      { feature: '5× Sit-to-Stand',  shap:  0.39 },
      { feature: 'Medication Count', shap:  0.33 },
      { feature: 'Pulse Rate',       shap:  0.31 },
      { feature: 'BMI',              shap:  0.25 },
      { feature: 'Living Alone',     shap:  0.22 },
      { feature: 'Activity Level',   shap: -0.24 },
      { feature: 'Gait Speed',       shap: -0.19 },
      { feature: 'Social Support',   shap: -0.15 },
      { feature: 'Sleep Quality',    shap: -0.11 },
    ],
    older: [
      { feature: 'Living Alone',     shap:  0.52 },
      { feature: '5× Sit-to-Stand',  shap:  0.47 },
      { feature: 'Systolic BP',      shap:  0.38 },
      { feature: 'Sex (female)',      shap:  0.35 },
      { feature: 'Cognitive Score',  shap:  0.31 },
      { feature: 'Medication Count', shap:  0.27 },
      { feature: 'Gait Speed',       shap: -0.43 },
      { feature: 'Activity Level',   shap: -0.29 },
      { feature: 'Social Support',   shap: -0.22 },
      { feature: 'Vitamin D',        shap: -0.16 },
    ],
  };
  return sets[group].map(d => ({ ...d, absShap: Math.abs(d.shap), isRisk: d.shap > 0 }));
}

const AGE_STRATA: { group: string; label: string; color: string; factors: { name: string; value: number; dir: string }[] }[] = [
  {
    group: '20–45', label: 'Young Adults', color: C.sage,
    factors: [
      { name: 'Injury History', value: 48, dir: 'risk' },
      { name: 'BMI', value: 38, dir: 'risk' },
      { name: 'Alcohol Use', value: 35, dir: 'risk' },
      { name: 'Activity Level', value: 32, dir: 'protect' },
      { name: 'Pulse Rate', value: 28, dir: 'risk' },
    ],
  },
  {
    group: '46–65', label: 'Middle-Aged', color: C.amber,
    factors: [
      { name: 'Systolic BP', value: 44, dir: 'risk' },
      { name: '5× Sit-to-Stand', value: 39, dir: 'risk' },
      { name: 'Medication Count', value: 33, dir: 'risk' },
      { name: 'Pulse Rate', value: 31, dir: 'risk' },
      { name: 'Activity Level', value: 24, dir: 'protect' },
    ],
  },
  {
    group: '>65', label: 'Older Adults', color: C.coral,
    factors: [
      { name: 'Living Alone', value: 52, dir: 'risk' },
      { name: '5× Sit-to-Stand', value: 47, dir: 'risk' },
      { name: 'Gait Speed', value: 43, dir: 'protect' },
      { name: 'Systolic BP', value: 38, dir: 'risk' },
      { name: 'Sex (female)', value: 35, dir: 'risk' },
    ],
  },
];

// ── Sleep Analysis data ───────────────────────────────────────
const STAGE_COLOR: Record<number,string> = { 0: C.purple, 1: C.sage, 2: C.accent, 3: C.text4 };
const STAGE_LABEL: Record<number,string> = { 0: 'Deep',   1: 'Light', 2: 'REM',   3: 'Awake' };
const STAGE_Y:     Record<number,number> = { 0: 0, 1: 2, 2: 1, 3: 3 }; // deep=bottom

function genHypnogram(seed = 0) {
  const rng = (s: number) => { const x = Math.sin(s * 9301 + 49297) * 233280; return x - Math.floor(x); };
  const seq: number[] = [
    ...Array(2).fill(3), ...Array(5).fill(1), ...Array(14).fill(0),
    ...Array(4).fill(1), ...Array(9).fill(2),  ...Array(4).fill(1),
    ...Array(8).fill(0), ...Array(3).fill(1),  ...Array(1).fill(3),
    ...Array(3).fill(1), ...Array(12).fill(2), ...Array(4).fill(1),
    ...Array(6).fill(0), ...Array(4).fill(1),  ...Array(14).fill(2),
    ...Array(3).fill(1),
  ];
  const sHRV = [58, 38, 42, 28];
  const sHR  = [52, 60, 62, 68];
  return seq.slice(0, 96).map((s, i) => {
    const jitter = rng(i * 5 + seed * 7) < 0.06 ? Math.min(3, s + 1) : s;
    const stage  = Math.min(3, Math.max(0, jitter)) as 0|1|2|3;
    const hh = String(Math.floor(i * 5 / 60)).padStart(2,'0');
    const mm = String((i * 5) % 60).padStart(2,'0');
    return {
      t: i, time: `${hh}:${mm}`,
      stageY: STAGE_Y[stage], stage, stageLabel: STAGE_LABEL[stage],
      hrv: +(sHRV[stage] + (rng(i * 3 + seed) - 0.5) * 10).toFixed(1),
      hr:  +(sHR[stage]  + (rng(i * 7 + seed) - 0.5) * 8).toFixed(0),
    };
  });
}

function sleepStageStats(hyp: ReturnType<typeof genHypnogram>) {
  const total = hyp.length;
  return [0,1,2,3].map(s => ({
    stage: STAGE_LABEL[s], color: STAGE_COLOR[s],
    pct: +((hyp.filter(d => d.stage === s).length / total) * 100).toFixed(1),
    mins: hyp.filter(d => d.stage === s).length * 5,
  }));
}

const _srng = (s: number) => { const x = Math.sin(s * 9301 + 49297) * 233280; return x - Math.floor(x); };
const SLEEP_NIGHTS = Array.from({ length: 14 }, (_, i) => {
  const bed  = Math.round(23 * 60 + (_srng(i * 11 + 3) - 0.5) * 90);
  const dur  = Math.round(420 + (_srng(i * 13 + 7) - 0.5) * 80);
  const wake = (bed + dur) % (24 * 60);
  const mid  = (bed + Math.round(dur / 2)) % (24 * 60);
  const eff  = +Math.round(80 + _srng(i * 17 + 5) * 14).toFixed(0);
  const hrv  = +(_srng(i * 19 + 11) * 18 + 36).toFixed(1);
  const day  = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'][i % 7];
  const fmt  = (m: number) => `${String(Math.floor(m/60)%24).padStart(2,'0')}:${String(m%60).padStart(2,'0')}`;
  return { night: i+1, day, bed, wake, dur, mid, eff, hrv, bedH: fmt(bed), wakeH: fmt(wake), midH: fmt(mid), isWeekend: day === 'Sat' || day === 'Sun' };
});

function sleepIrregularityIndex(nights: typeof SLEEP_NIGHTS) { return +sd(nights.map(n => n.mid)).toFixed(1); }
function interpSII(sii: number) {
  return sii < 30 ? { text: 'Regular', c: C.sage } : sii < 60 ? { text: 'Mild', c: C.amber } : sii < 90 ? { text: 'Moderate', c: C.coral } : { text: 'High', c: C.red };
}
function computeRecovery(night: typeof SLEEP_NIGHTS[0], stats: ReturnType<typeof sleepStageStats>) {
  const deep = stats.find(s => s.stage === 'Deep')?.pct ?? 0;
  const rem  = stats.find(s => s.stage === 'REM')?.pct  ?? 0;
  const comps = [
    { name: 'HRV Balance',      value: +Math.min(100, night.hrv * 1.8).toFixed(0), weight: 0.25 },
    { name: 'Sleep Efficiency', value: night.eff,                                   weight: 0.20 },
    { name: 'Deep Sleep',       value: +Math.min(100, deep * 5.0).toFixed(0),       weight: 0.20 },
    { name: 'REM Sleep',        value: +Math.min(100, rem  * 4.0).toFixed(0),       weight: 0.15 },
    { name: 'Total Duration',   value: +Math.min(100, night.dur / 5.04).toFixed(0), weight: 0.20 },
  ];
  const score = +Math.round(comps.reduce((a,c) => a + c.value * c.weight, 0) / comps.reduce((a,c) => a + c.weight, 0)).toFixed(0);
  return { score, comps };
}
function interpRecovery(s: number) {
  return s >= 85 ? { text: 'Optimal', c: C.sage } : s >= 70 ? { text: 'Good', c: C.accent } : s >= 50 ? { text: 'Fair', c: C.amber } : { text: 'Poor', c: C.red };
}

// ── Sedentary Behavior data ───────────────────────────────────
const SED_THRESHOLD = 20;
function sedMetrics(activity: number[], thresh = SED_THRESHOLD) {
  const isSed = activity.map(v => v < thresh);
  const totalSedMins = isSed.filter(Boolean).length * 5;
  const bouts: number[] = [];
  let bl = 0;
  isSed.forEach((s, i) => { if (s) bl++; else if (bl > 0) { bouts.push(bl * 5); bl = 0; } if (i === isSed.length - 1 && bl > 0) bouts.push(bl * 5); });
  let breaks = 0;
  for (let i = 1; i < isSed.length; i++) if (isSed[i - 1] && !isSed[i]) breaks++;
  const sedHours = totalSedMins / 60;
  const breaksPerHour = sedHours > 0 ? +(breaks / sedHours).toFixed(2) : 0;
  const prolonged = bouts.filter(b => b >= 30).length;
  const longBouts = bouts.filter(b => b >= 60).length;
  const pctSed = +((totalSedMins / (activity.length * 5)) * 100).toFixed(1);
  return { totalSedMins, bouts, breaks, breaksPerHour, prolonged, longBouts, pctSed, sedHours: +sedHours.toFixed(1) };
}

function intensityDist(activity: number[]) {
  const n = activity.length;
  return [
    { label: 'Sedentary', mins: activity.filter(v => v < 20).length * 5,                              color: C.text4  },
    { label: 'Light',     mins: activity.filter(v => v >= 20 && v < 45).length * 5,                   color: C.sage   },
    { label: 'Moderate',  mins: activity.filter(v => v >= 45 && v < 70).length * 5,                   color: C.amber  },
    { label: 'Vigorous',  mins: activity.filter(v => v >= 70).length * 5,                             color: C.red    },
  ].map(d => ({ ...d, pct: +((d.mins / (n * 5)) * 100).toFixed(1) }));
}

// ── Stress & Autonomic data ───────────────────────────────────
const _arng = (s: number) => { const x = Math.sin(s * 9301 + 49297) * 233280; return x - Math.floor(x); };

function generateRRIntervals(n = 200, seed = 0) {
  return Array.from({ length: n }, (_, i) => {
    const noise = (_arng(i * 3 + seed) - 0.5) * 80 + (_arng(i * 7 + seed) - 0.5) * 30;
    return Math.max(600, Math.min(1100, Math.round(860 + noise)));
  });
}

function poincarePlotData(rr: number[]) {
  const pairs = rr.slice(0, -1).map((v, i) => ({ rr1: v, rr2: rr[i + 1] }));
  const diffs  = pairs.map(p => (p.rr1 - p.rr2) / Math.sqrt(2));
  const sums   = pairs.map(p => (p.rr1 + p.rr2) / Math.sqrt(2));
  const meanDiff = mn(diffs), meanSum = mn(sums);
  const sd1 = +(Math.sqrt(diffs.reduce((a, v) => a + (v - meanDiff) * (v - meanDiff), 0) / diffs.length)).toFixed(1);
  const sd2 = +(Math.sqrt(sums.reduce((a, v) => a + (v - meanSum) * (v - meanSum), 0) / sums.length)).toFixed(1);
  return { pairs, sd1, sd2, ratio: +(sd1 / sd2).toFixed(3) };
}

const LFHF_24H = Array.from({ length: 24 }, (_, h) => {
  const base = h >= 6 && h <= 22 ? 1.6 + Math.sin(Math.PI * (h - 6) / 16) * 1.1 : 0.75;
  return { h, label: `${String(h).padStart(2, '0')}h`, lfhf: +Math.max(0.3, base + (_arng(h * 7) - 0.5) * 0.4).toFixed(2) };
});

const HRV_SPECTRUM = Array.from({ length: 80 }, (_, i) => {
  const freq = +(0.003 + i * 0.005).toFixed(3);
  let power = 0;
  if (freq < 0.04) power = 2200 * Math.exp(-((freq - 0.015) * (freq - 0.015)) / (2 * 0.008 * 0.008));
  else if (freq < 0.15) power = 1100 * Math.exp(-((freq - 0.09) * (freq - 0.09)) / (2 * 0.025 * 0.025));
  else if (freq <= 0.4)  power = 750 * Math.exp(-((freq - 0.25) * (freq - 0.25)) / (2 * 0.06 * 0.06));
  return { freq, power: +Math.max(0, power + (_arng(i * 5) - 0.5) * 80).toFixed(1), band: freq < 0.04 ? 'VLF' : freq < 0.15 ? 'LF' : 'HF' };
});

function interpLFHF(r: number) {
  return r < 1.0 ? { text: 'Parasympathetic dominant', c: C.sage }
    : r < 2.0 ? { text: 'Balanced', c: C.accent }
    : r < 3.0 ? { text: 'Mild sympathetic', c: C.amber }
    : { text: 'High sympathetic stress', c: C.red };
}

// ── CGM / Metabolic data ──────────────────────────────────────
const _grng = (s: number) => { const x = Math.sin(s * 9301 + 49297) * 233280; return x - Math.floor(x); };

const CGM_DATA = Array.from({ length: 288 }, (_, i) => {
  const h = (i * 5) / 60;
  let base = 84;
  const br = (h - 7.8) / 0.7;  base += h >= 7.0 && h < 10.5 ? 68 * Math.exp(-(br * br)) : 0;
  const lu = (h - 13.0) / 0.55; base += h >= 12.0 && h < 15.5 ? 58 * Math.exp(-(lu * lu)) : 0;
  const sn = (h - 16.2) / 0.3;  base += h >= 15.5 && h < 17.5 ? 28 * Math.exp(-(sn * sn)) : 0;
  const di = (h - 19.2) / 0.75; base += h >= 18.0 && h < 22.0 ? 62 * Math.exp(-(di * di)) : 0;
  const dn = (h - 6.0) / 0.9;   base += h >= 4.5 && h < 7.5  ? 14 * Math.exp(-(dn * dn)) : 0;
  if (h < 5.5 || h >= 23.0) base = 80 + (_grng(i * 3) - 0.5) * 6;
  const noise = (_grng(i * 7 + 3) - 0.5) * 7;
  const hh = String(Math.floor(h)).padStart(2, '0');
  const mm = String(Math.round((h % 1) * 60)).padStart(2, '0');
  return { t: i, time: `${hh}:${mm}`, glucose: +Math.max(55, Math.min(240, base + noise)).toFixed(0) };
});

function cgmMetrics(data: typeof CGM_DATA) {
  const vals = data.map(d => +d.glucose);
  const meanG = mn(vals);
  const sdG   = sd(vals);
  const tir   = +(vals.filter(v => v >= 70 && v <= 180).length / vals.length * 100).toFixed(1);
  const tar1  = +(vals.filter(v => v > 180 && v <= 250).length / vals.length * 100).toFixed(1);
  const tar2  = +(vals.filter(v => v > 250).length / vals.length * 100).toFixed(1);
  const tbr1  = +(vals.filter(v => v >= 54 && v < 70).length / vals.length * 100).toFixed(1);
  const tbr2  = +(vals.filter(v => v < 54).length / vals.length * 100).toFixed(1);
  const cv    = +(sdG / meanG * 100).toFixed(1);
  const gmi   = +(3.31 + 0.02392 * meanG).toFixed(2);
  let mage = 0, mageCount = 0;
  for (let i = 1; i < vals.length - 1; i++) {
    const excursion = Math.abs(vals[i] - vals[i - 1]);
    if (excursion > sdG) { mage += excursion; mageCount++; }
  }
  mage = mageCount > 0 ? +(mage / mageCount).toFixed(1) : 0;
  return { meanG: +meanG.toFixed(1), sdG: +sdG.toFixed(1), tir, tar1, tar2, tbr1, tbr2, cv, gmi, mage };
}

const AGP_DATA = Array.from({ length: 24 }, (_, h) => {
  const epochsInHour = CGM_DATA.filter(d => Math.floor((d.t * 5) / 60) === h).map(d => +d.glucose);
  if (epochsInHour.length === 0) return { h, label: `${String(h).padStart(2, '0')}:00`, p5: 80, p25: 90, p50: 95, p75: 105, p95: 120 };
  const sorted = [...epochsInHour].sort((a, b) => a - b);
  const pct = (p: number) => sorted[Math.min(sorted.length - 1, Math.floor(p / 100 * sorted.length))];
  return { h, label: `${String(h).padStart(2, '0')}:00`, p5: pct(5), p25: pct(25), p50: pct(50), p75: pct(75), p95: pct(95) };
});

function interpTIR(tir: number) {
  return tir >= 70 ? { text: 'On target', c: C.sage } : tir >= 50 ? { text: 'Below target', c: C.amber } : { text: 'Poor control', c: C.red };
}
function interpCV(cv: number) {
  return cv < 28 ? { text: 'Stable', c: C.sage } : cv < 36 ? { text: 'Moderate', c: C.amber } : { text: 'High variability', c: C.red };
}

// ── Longitudinal data ─────────────────────────────────────────
const _lrng2 = (s: number) => { const x = Math.sin(s * 9301 + 49297) * 233280; return x - Math.floor(x); };
const THIRTY_DAYS = Array.from({ length: 30 }, (_, d) => {
  const sleepH    = +(5.8 + _lrng2(d * 3 + 1) * 2.8).toFixed(1);
  const siiD      = Math.round(22 + _lrng2(d * 5 + 2) * 60);
  const sedHD     = +(7 + _lrng2(d * 7 + 3) * 5).toFixed(1);
  const glucoseCV = +(13 + _lrng2(d * 11 + 4) * 20).toFixed(1);
  const lfhfD     = +(0.8 + _lrng2(d * 13 + 5) * 2.8).toFixed(2);
  const steps     = Math.round(2800 + _lrng2(d * 17 + 6) * 7200);
  const baseRec = 75 - (Math.max(0, siiD - 40) * 0.2) - (Math.max(0, +lfhfD - 2.0) * 4) + (sleepH - 7) * 4;
  const recovery = Math.round(Math.max(20, Math.min(98, baseRec + (_lrng2(d * 19 + 8) - 0.5) * 10)));
  return { day: d + 1, label: `D${d + 1}`, sleepH, siiD, sedHD, glucoseCV, lfhfD: +lfhfD, steps, recovery };
});

function pearsonCorr(a: number[], b: number[]) {
  const ma = mn(a), mb = mn(b);
  const num = a.reduce((s, v, i) => s + (v - ma) * (b[i] - mb), 0);
  const den = Math.sqrt(a.reduce((s, v) => s + (v - ma) * (v - ma), 0) * b.reduce((s, v) => s + (v - mb) * (v - mb), 0));
  return den === 0 ? 0 : +(num / den).toFixed(2);
}

const METRICS_FOR_CORR = [
  { key: 'sleepH',    label: 'Sleep Duration'    },
  { key: 'siiD',      label: 'Sleep Irregularity' },
  { key: 'recovery',  label: 'Recovery'           },
  { key: 'lfhfD',     label: 'LF/HF Ratio'       },
  { key: 'glucoseCV', label: 'Glucose CV%'        },
  { key: 'sedHD',     label: 'Sedentary Hours'    },
  { key: 'steps',     label: 'Steps'              },
] as const;

// ── Types ──────────────────────────────────────────────────────
type SignalAlgoId      = 'moving_avg' | 'exp_smooth' | 'zscore' | 'rolling_std' | 'autocorr';
type ComplexAlgoId  = 'cc' | 'dfa' | 'sample_entropy' | 'perm_entropy' | 'hurst' | 'fingerprint';
type ActivityAlgoId    = 'fragmentation' | 'circadian';
type PredictiveAlgoId  = 'mse' | 'phase_space' | 'cusum' | 'risk_panel' | 'fall_risk' | 'shap_features' | 'age_strata';
type SleepAlgoId       = 'sleep_arch' | 'sleep_sii' | 'sleep_hrv' | 'recovery' | 'chronotype';
type SedentaryAlgoId   = 'sed_overview' | 'sed_bouts' | 'sed_breaks' | 'sed_intensity';
type AutonomicAlgoId   = 'lfhf' | 'poincare_plot' | 'stress_index' | 'autonomic_24h';
type MetabolicAlgoId   = 'glucose_trace' | 'time_in_range' | 'agp' | 'glucose_variability';
type LongitudinalAlgoId = 'timeline' | 'correlation' | 'health_calendar' | 'risk_evolution';
type AlgoId = SignalAlgoId | ComplexAlgoId | ActivityAlgoId | PredictiveAlgoId | SleepAlgoId | SedentaryAlgoId | AutonomicAlgoId | MetabolicAlgoId | LongitudinalAlgoId;
const isComplex     = (a: AlgoId): a is ComplexAlgoId     =>
  ['cc','dfa','sample_entropy','perm_entropy','hurst','fingerprint'].includes(a);
const isActivity    = (a: AlgoId): a is ActivityAlgoId    =>
  ['fragmentation','circadian'].includes(a);
const isPredictive  = (a: AlgoId): a is PredictiveAlgoId  =>
  ['mse','phase_space','cusum','risk_panel','fall_risk','shap_features','age_strata'].includes(a);
const isSleep       = (a: AlgoId): a is SleepAlgoId       =>
  ['sleep_arch','sleep_sii','sleep_hrv','recovery','chronotype'].includes(a);
const isSedentary   = (a: AlgoId): a is SedentaryAlgoId   =>
  ['sed_overview','sed_bouts','sed_breaks','sed_intensity'].includes(a);
const isAutonomic   = (a: AlgoId): a is AutonomicAlgoId   =>
  ['lfhf','poincare_plot','stress_index','autonomic_24h'].includes(a);
const isMetabolic   = (a: AlgoId): a is MetabolicAlgoId   =>
  ['glucose_trace','time_in_range','agp','glucose_variability'].includes(a);
const isLongitudinal = (a: AlgoId): a is LongitudinalAlgoId =>
  ['timeline','correlation','health_calendar','risk_evolution'].includes(a);

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
  { id: 'mse',           label: 'Multi-Scale Entropy',  color: C.purple, sub: 'Cross-scale complexity' },
  { id: 'phase_space',   label: 'Phase Space',          color: C.sage,   sub: 'Delay embedding · attractor reconstruction' },
  { id: 'cusum',         label: 'Drift Detector',       color: C.amber,  sub: 'CUSUM early warning system' },
  { id: 'risk_panel',    label: 'Risk Panel',           color: C.red,    sub: 'Clinical composite score' },
  { id: 'fall_risk',     label: 'Fall Risk Classifier', color: C.gold,   sub: 'AGRU · attention-gated recurrent unit' },
  { id: 'shap_features', label: 'SHAP Features',        color: C.accent, sub: 'Feature importance by age group' },
  { id: 'age_strata',    label: 'Age Strata',           color: C.coral,  sub: 'Risk profiles 20-45 · 46-65 · >65' },
];
const ACTIVITY_ALGOS: { id: ActivityAlgoId; label: string; color: string; sub: string }[] = [
  { id: 'fragmentation', label: 'Fragmentation',      color: C.sage,   sub: 'ASTP · SATP · bout power law' },
  { id: 'circadian',     label: 'Circadian Rhythm',   color: C.purple, sub: 'IS · IV · RA · M10 / L5' },
];
const SLEEP_ALGOS: { id: SleepAlgoId; label: string; color: string; sub: string }[] = [
  { id: 'sleep_arch',  label: 'Sleep Architecture', color: C.purple, sub: 'Hypnogram · stage distribution' },
  { id: 'sleep_sii',   label: 'Irregularity Index', color: C.coral,  sub: 'Night-to-night variability · SII' },
  { id: 'sleep_hrv',   label: 'Sleep HRV',          color: C.sage,   sub: 'RMSSD across sleep stages' },
  { id: 'recovery',    label: 'Recovery Score',     color: C.gold,   sub: 'Composite readiness · Oura-style' },
  { id: 'chronotype',  label: 'Chronotype',         color: C.accent, sub: 'Sleep timing · social jetlag' },
];
const SEDENTARY_ALGOS: { id: SedentaryAlgoId; label: string; color: string; sub: string }[] = [
  { id: 'sed_overview',  label: 'Overview',          color: C.amber,  sub: 'Total sedentary time · breaks/hour' },
  { id: 'sed_bouts',     label: 'Bout Analysis',     color: C.coral,  sub: 'Sedentary bout distribution' },
  { id: 'sed_breaks',    label: 'Break Frequency',   color: C.sage,   sub: 'Breaks per sedentary hour · protective' },
  { id: 'sed_intensity', label: 'Intensity Profile', color: C.gold,   sub: 'MET-based activity intensity' },
];
const AUTONOMIC_ALGOS: { id: AutonomicAlgoId; label: string; color: string; sub: string }[] = [
  { id: 'lfhf',          label: 'LF/HF Spectrum',    color: C.amber,  sub: 'HRV power bands · sympathovagal balance' },
  { id: 'poincare_plot', label: 'Poincaré Plot',      color: C.sage,   sub: 'RR(n) vs RR(n+1) · SD1 · SD2' },
  { id: 'stress_index',  label: 'Stress Index',       color: C.red,    sub: 'Hourly sympathetic load · 24h' },
  { id: 'autonomic_24h', label: 'Autonomic 24h',      color: C.purple, sub: 'Circadian autonomic pattern' },
];
const METABOLIC_ALGOS: { id: MetabolicAlgoId; label: string; color: string; sub: string }[] = [
  { id: 'glucose_trace',      label: 'CGM Trace',          color: C.sage,   sub: 'Full-day continuous glucose' },
  { id: 'time_in_range',      label: 'Time in Range',       color: C.accent, sub: 'TIR · TBR · TAR · ADA consensus' },
  { id: 'agp',                label: 'Ambulatory Glucose',  color: C.amber,  sub: 'p5/p25/p50/p75/p95 percentile bands' },
  { id: 'glucose_variability',label: 'Variability',         color: C.purple, sub: 'CV% · MAGE · rolling SD' },
];
const LONGITUDINAL_ALGOS: { id: LongitudinalAlgoId; label: string; color: string; sub: string }[] = [
  { id: 'timeline',         label: 'Timeline',          color: C.accent, sub: '30-day multi-domain sparklines' },
  { id: 'correlation',      label: 'Correlation Matrix', color: C.gold,   sub: 'Cross-domain Pearson r matrix' },
  { id: 'health_calendar',  label: 'Health Calendar',   color: C.sage,   sub: '30-day recovery heatmap' },
  { id: 'risk_evolution',   label: 'Risk Evolution',     color: C.coral,  sub: 'Recovery trend · anomaly days' },
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
  const [ageGroup, setAgeGroup]           = useState<AgeGroup>('overall');
  const [sleepNight, setSleepNight]       = useState(0);
  const [hoveredCell, setHoveredCell]     = useState<{ day: number; val: number } | null>(null);

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

  // ── Sleep Analysis computations ─────────────────────────────
  const hypnogram  = useMemo(() => genHypnogram(sleepNight), [sleepNight]);
  const sleepStats = useMemo(() => sleepStageStats(hypnogram), [hypnogram]);
  const sii        = useMemo(() => sleepIrregularityIndex(SLEEP_NIGHTS), []);
  const recov      = useMemo(() => computeRecovery(SLEEP_NIGHTS[sleepNight], sleepStats), [sleepNight, sleepStats]);
  const recovTrend = useMemo(() => SLEEP_NIGHTS.map((n, i) => {
    const h = genHypnogram(i); const st = sleepStageStats(h);
    return { night: n.day, score: computeRecovery(n, st).score };
  }), []);

  // ── Sedentary computations ───────────────────────────────────
  const sedResult    = useMemo(() => sedMetrics(ACTIVITY.slice(0, 288)), []);
  const intDist      = useMemo(() => intensityDist(ACTIVITY.slice(0, 288)), []);
  const sedHourly    = useMemo(() => Array.from({ length: 24 }, (_, h) => {
    const vals = ACTIVITY.slice(h * 12, h * 12 + 12);
    const sedCount = vals.filter(v => v < SED_THRESHOLD).length;
    return { h, label: `${String(h).padStart(2, '0')}h`, sedPct: Math.round(sedCount / vals.length * 100), mean: Math.round(mn(vals)) };
  }), []);
  const sedBoutHist  = useMemo(() => {
    const bins = [5, 10, 15, 20, 25, 30, 45, 60];
    return bins.map((b, i) => {
      const lo = i === 0 ? 0 : bins[i - 1];
      const hi = b;
      const count = sedResult.bouts.filter(v => v > lo && v <= hi).length;
      return { bin: `≤${b}m`, count, minutes: b };
    }).concat([{ bin: '>60m', count: sedResult.bouts.filter(v => v > 60).length, minutes: 90 }]);
  }, [sedResult]);
  const sedBreakCumul = useMemo(() => {
    const isSed = ACTIVITY.slice(0, 288).map(v => v < SED_THRESHOLD);
    let cumBreaks = 0;
    return Array.from({ length: 288 }, (_, i) => {
      if (i > 0 && isSed[i - 1] && !isSed[i]) cumBreaks++;
      return { t: i, time: epochToTime(i), breaks: cumBreaks, sedentary: isSed[i] ? 1 : 0 };
    });
  }, []);

  // ── Autonomic computations ───────────────────────────────────
  const rrIntervals  = useMemo(() => generateRRIntervals(200, 42), []);
  const poincareData = useMemo(() => poincarePlotData(rrIntervals), [rrIntervals]);
  const overallLFHF  = useMemo(() => +(mn(LFHF_24H.map(d => d.lfhf))).toFixed(2), []);
  const stressIndexData = useMemo(() => LFHF_24H.map(d => ({
    ...d,
    si: +(d.lfhf * 18 + 12).toFixed(1),
    color: d.lfhf > 2.0 ? C.red : d.lfhf > 1.5 ? C.amber : C.sage,
  })), []);

  // ── Metabolic computations ───────────────────────────────────
  const cgmStats     = useMemo(() => cgmMetrics(CGM_DATA), []);
  const rollingGlucoseSD = useMemo(() => {
    const vals = CGM_DATA.map(d => +d.glucose);
    const w = 12; // 1-hour window
    return CGM_DATA.map((d, i) => {
      if (i < w - 1) return { ...d, rollingSD: null as number | null };
      const seg = vals.slice(i - w + 1, i + 1);
      return { ...d, rollingSD: +sd(seg).toFixed(1) };
    });
  }, []);
  const glucoseHist  = useMemo(() => {
    const vals = CGM_DATA.map(d => +d.glucose);
    const bins = [54, 70, 100, 140, 180, 210, 250];
    return bins.map((hi, i) => {
      const lo = i === 0 ? 0 : bins[i - 1];
      const count = vals.filter(v => v > lo && v <= hi).length;
      const label = i === 0 ? `<${hi}` : `${lo}–${hi}`;
      const zone = hi <= 54 ? 'tbr2' : hi <= 70 ? 'tbr1' : hi <= 180 ? 'tir' : hi <= 250 ? 'tar1' : 'tar2';
      const color = hi <= 54 ? C.red : hi <= 70 ? C.coral : hi <= 180 ? C.sage : hi <= 250 ? C.amber : C.red;
      return { label, count, zone, color };
    }).concat([{ label: '>250', count: vals.filter(v => v > 250).length, zone: 'tar2', color: C.red }]);
  }, []);

  // ── Longitudinal computations ────────────────────────────────
  const corrMatrix   = useMemo(() => {
    const keys = METRICS_FOR_CORR.map(m => m.key);
    return keys.map(ka => keys.map(kb => {
      const a = THIRTY_DAYS.map(d => d[ka as keyof typeof d] as number);
      const b = THIRTY_DAYS.map(d => d[kb as keyof typeof d] as number);
      return pearsonCorr(a, b);
    }));
  }, []);
  const last7Avgs    = useMemo(() => {
    const last7 = THIRTY_DAYS.slice(-7);
    return METRICS_FOR_CORR.map(m => ({
      ...m,
      avg: +(mn(last7.map(d => d[m.key as keyof typeof d] as number))).toFixed(1),
    }));
  }, []);
  const longTrend    = useMemo(() => {
    const xs = THIRTY_DAYS.map(d => d.day);
    const ys = THIRTY_DAYS.map(d => d.recovery);
    const { slope, intercept } = linReg(xs, ys);
    return { slope: +slope.toFixed(2), line: xs.map(x => +(slope * x + intercept).toFixed(1)) };
  }, []);

  // ── Signal-mode stats ────────────────────────────────────────
  const sigStats = useMemo(() => {
    const m = mn(raw), s = sd(raw);
    return { mean: m.toFixed(2), std: s.toFixed(2), min: Math.min(...raw).toFixed(1), max: Math.max(...raw).toFixed(1), anomalies: timeData.filter(d => d.anomaly !== null).length };
  }, [raw, timeData]);

  const activeSignalAlgo   = SIGNAL_ALGOS.find(a => a.id === algo);
  const activeComplexAlgo  = COMPLEX_ALGOS.find(a => a.id === algo);
  const inComplex          = isComplex(algo);
  const inActivity         = isActivity(algo);
  const inPredictive       = isPredictive(algo);
  const inSleep            = isSleep(algo);
  const inSedentary        = isSedentary(algo);
  const inAutonomic        = isAutonomic(algo);
  const inMetabolic        = isMetabolic(algo);
  const inLongitudinal     = isLongitudinal(algo);

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
            ['/algorithmlab',     'Algorithm Lab',<><path key="a1" d="M3 13L6 8l3 3 3-5 3 3" strokeLinecap="round" strokeLinejoin="round"/><circle key="a2" cx="13" cy="9" r="1.5" fill="currentColor"/></>],
            ['/datascience',      'Data Science',<><circle key="ds1" cx="5" cy="5" r="2.5"/><circle key="ds2" cx="11" cy="11" r="2.5"/><path key="ds3" d="M11 5.5a2.5 2.5 0 110 0z"/><path key="ds4" d="M5 11a2.5 2.5 0 110 0z"/></>],
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

        <nav className="nav-section">
          <div className="nav-label">Sleep Analysis</div>
          {SLEEP_ALGOS.map(a => (
            <button key={a.id} className={`nav-item${algo === a.id ? ' active' : ''}`} onClick={() => setAlgo(a.id)} style={{ color: algo === a.id ? a.color : undefined }}>
              <svg className="nav-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4"><circle cx="8" cy="8" r="1.5" fill={algo === a.id ? a.color : 'currentColor'}/></svg>
              <span style={{ flex: 1, textAlign: 'left' }}>{a.label}</span>
            </button>
          ))}
        </nav>

        <nav className="nav-section">
          <div className="nav-label">Sedentary Behavior</div>
          {SEDENTARY_ALGOS.map(a => (
            <button key={a.id} className={`nav-item${algo === a.id ? ' active' : ''}`} onClick={() => setAlgo(a.id)} style={{ color: algo === a.id ? a.color : undefined }}>
              <svg className="nav-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4"><circle cx="8" cy="8" r="1.5" fill={algo === a.id ? a.color : 'currentColor'}/></svg>
              <span style={{ flex: 1, textAlign: 'left' }}>{a.label}</span>
            </button>
          ))}
        </nav>

        <nav className="nav-section">
          <div className="nav-label">Stress & Autonomic</div>
          {AUTONOMIC_ALGOS.map(a => (
            <button key={a.id} className={`nav-item${algo === a.id ? ' active' : ''}`} onClick={() => setAlgo(a.id)} style={{ color: algo === a.id ? a.color : undefined }}>
              <svg className="nav-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4"><circle cx="8" cy="8" r="1.5" fill={algo === a.id ? a.color : 'currentColor'}/></svg>
              <span style={{ flex: 1, textAlign: 'left' }}>{a.label}</span>
            </button>
          ))}
        </nav>

        <nav className="nav-section">
          <div className="nav-label">Metabolic / CGM</div>
          {METABOLIC_ALGOS.map(a => (
            <button key={a.id} className={`nav-item${algo === a.id ? ' active' : ''}`} onClick={() => setAlgo(a.id)} style={{ color: algo === a.id ? a.color : undefined }}>
              <svg className="nav-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4"><circle cx="8" cy="8" r="1.5" fill={algo === a.id ? a.color : 'currentColor'}/></svg>
              <span style={{ flex: 1, textAlign: 'left' }}>{a.label}</span>
            </button>
          ))}
        </nav>

        <nav className="nav-section">
          <div className="nav-label">Longitudinal</div>
          {LONGITUDINAL_ALGOS.map(a => (
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
            <div className="crumb">Ambient Intelligence · {inLongitudinal ? 'Longitudinal · Timeline · Correlation · Calendar · Risk Evolution' : inMetabolic ? 'Metabolic · CGM Trace · TIR · AGP · Variability' : inAutonomic ? 'Autonomic · LF/HF · Poincaré · Stress · 24h' : inSedentary ? 'Sedentary · Overview · Bouts · Breaks · Intensity' : inSleep ? 'Sleep Analysis · Architecture · SII · HRV · Recovery · Chronotype' : inPredictive ? 'Predictive Intelligence · MSE · Phase Space · CUSUM · Risk Panel · Fall Risk · SHAP · Age Strata' : inActivity ? 'Activity Analysis · Fragmentation · Circadian' : inComplex ? 'Complexity Suite · CC · DFA · Entropy · Hurst' : 'Signal Processing'}</div>
            <h1 className="page-title">Algorithm <em>Lab</em></h1>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: C.text3 }}>{files.length ? files.map(f => f.name).join(', ') : 'synthetic demo data'}</span>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: files.length ? C.sage : C.amber, boxShadow: `0 0 5px ${files.length ? C.sage : C.amber}`, display: 'inline-block' }} />
          </div>
        </header>

        {/* KPI strip */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 10, marginBottom: 28 }}>
          {(inLongitudinal ? [
            { label: 'Days',          value: '30',                                                      color: C.accent },
            { label: 'Avg Recovery',  value: Math.round(mn(THIRTY_DAYS.map(d => d.recovery))).toString(), color: interpRecovery(Math.round(mn(THIRTY_DAYS.map(d => d.recovery)))).c },
            { label: 'Avg Sleep',     value: `${mn(THIRTY_DAYS.map(d => d.sleepH)).toFixed(1)}h`,      color: C.purple },
            { label: 'Avg Steps',     value: Math.round(mn(THIRTY_DAYS.map(d => d.steps))).toLocaleString(), color: C.sage },
            { label: 'Trend',         value: longTrend.slope >= 0 ? `+${longTrend.slope}` : `${longTrend.slope}`, color: longTrend.slope >= 0 ? C.sage : C.coral },
            { label: 'Anomaly Days',  value: THIRTY_DAYS.filter(d => d.recovery < 50).length.toString(), color: THIRTY_DAYS.filter(d => d.recovery < 50).length > 5 ? C.red : C.amber },
          ] : inMetabolic ? [
            { label: 'TIR',           value: `${cgmStats.tir}%`,                                       color: interpTIR(cgmStats.tir).c },
            { label: 'Mean Glucose',  value: `${cgmStats.meanG}`,                                      color: C.text2 },
            { label: 'CV%',           value: `${cgmStats.cv}%`,                                        color: interpCV(cgmStats.cv).c },
            { label: 'GMI',           value: cgmStats.gmi.toString(),                                  color: C.amber },
            { label: 'MAGE',          value: `${cgmStats.mage}`,                                       color: C.text3 },
            { label: 'SD',            value: `${cgmStats.sdG}`,                                        color: C.text3 },
          ] : inAutonomic ? [
            { label: 'LF/HF',         value: overallLFHF.toString(),                                   color: interpLFHF(overallLFHF).c },
            { label: 'SD1',           value: `${poincareData.sd1}ms`,                                  color: C.sage },
            { label: 'SD2',           value: `${poincareData.sd2}ms`,                                  color: C.amber },
            { label: 'SD1/SD2',       value: poincareData.ratio.toString(),                            color: C.text2 },
            { label: 'Peak LF/HF',    value: Math.max(...LFHF_24H.map(d => d.lfhf)).toFixed(2),       color: C.coral },
            { label: 'Night LF/HF',   value: mn(LFHF_24H.filter(d => d.h < 6 || d.h >= 22).map(d => d.lfhf)).toFixed(2), color: C.purple },
          ] : inSedentary ? [
            { label: 'Sed Hours',     value: `${sedResult.sedHours}h`,                                 color: sedResult.sedHours > 10 ? C.red : sedResult.sedHours > 8 ? C.amber : C.sage },
            { label: 'Sed %',         value: `${sedResult.pctSed}%`,                                   color: C.text2 },
            { label: 'Breaks',        value: sedResult.breaks.toString(),                              color: C.sage },
            { label: 'Breaks/hr',     value: sedResult.breaksPerHour.toString(),                       color: sedResult.breaksPerHour >= 7 ? C.sage : C.amber },
            { label: 'Prolonged',     value: sedResult.prolonged.toString(),                           color: sedResult.prolonged > 3 ? C.coral : C.text3 },
            { label: 'Long Bouts',    value: sedResult.longBouts.toString(),                           color: sedResult.longBouts > 2 ? C.red : C.text3 },
          ] : inSleep ? [
            { label: 'Night',        value: SLEEP_NIGHTS[sleepNight].day,                              color: C.accent },
            { label: 'Total Sleep',  value: `${Math.floor(SLEEP_NIGHTS[sleepNight].dur/60)}h ${SLEEP_NIGHTS[sleepNight].dur%60}m`, color: C.text2 },
            { label: 'Efficiency',   value: `${SLEEP_NIGHTS[sleepNight].eff}%`,                        color: SLEEP_NIGHTS[sleepNight].eff >= 85 ? C.sage : C.amber },
            { label: 'Avg HRV',      value: `${SLEEP_NIGHTS[sleepNight].hrv}ms`,                      color: C.purple },
            { label: 'Recovery',     value: recov.score.toString(),                                    color: interpRecovery(recov.score).c },
            { label: 'SII',          value: `${sii}min`,                                               color: interpSII(sii).c },
          ] : inPredictive ? [
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
          {!inComplex && !inActivity && !inPredictive && !inSleep && !inSedentary && !inAutonomic && !inMetabolic && !inLongitudinal && <>
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
                      ? 'ASTP · SATP · bout power law · activity fragmentation index'
                      : 'IS · IV · RA · M10 / L5 · non-parametric circadian analysis'}
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
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: C.text3 }}>Movement complexity metrics · MCI detection 6 months pre-diagnosis</div>
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

              <ChartCard full title="Complexity Fingerprint" sub="normalized radar — all 5 metrics on 0–100 scale">
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
                    {algo === 'mse' ? 'Multi-Scale Entropy' : algo === 'phase_space' ? 'Phase Space Portrait' : algo === 'cusum' ? 'CUSUM Drift Detector' : algo === 'fall_risk' ? 'Fall Risk Classifier' : algo === 'shap_features' ? 'SHAP Feature Importance' : algo === 'age_strata' ? 'Age-Stratified Risk Profiles' : 'Clinical Risk Panel'}
                  </div>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: C.text3 }}>
                    {algo === 'mse' ? 'complexity across time scales · coarse-grained entropy at each scale factor' :
                     algo === 'phase_space' ? 'reconstructed attractor · lag τ = autocorrelation first-zero-crossing' :
                     algo === 'cusum' ? 'sequential change detection · detects baseline shift before clinical threshold is crossed' :
                     algo === 'fall_risk' ? 'AGRU 91.4% accuracy · 0.934 AUROC · n=1,441 community-dwelling adults' :
                     algo === 'shap_features' ? 'SHapley Additive exPlanations · feature attribution for AGRU model · age-stratified analysis' :
                     algo === 'age_strata' ? 'top predictors differ significantly across young, middle-aged, and older adults' :
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
                  White noise has high single-scale entropy but low MSE at coarser scales. Healthy adults show increasing MSE across scales. Cardiac patients and MCI subjects show flat or decreasing MSE — loss of adaptive, multiscale complexity.
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
                <div style={{ fontFamily: 'var(--serif)', fontWeight: 300, fontSize: 20, letterSpacing: '-0.01em', marginBottom: 12 }}>Delay Embedding</div>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: C.text3, lineHeight: 1.7 }}>
                  Plotting x(t) vs x(t+τ) reconstructs the topology of the underlying attractor from a single observable. The shape of the cloud reveals the system's dynamics — circular or elliptical attractors suggest oscillation, scattered clouds suggest noise or chaos.
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

              <div style={{ gridColumn: '1 / -1', background: C.s1, border: `1px solid ${C.line}`, borderRadius: 14, padding: '20px 28px' }}>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: C.text4, lineHeight: 1.6 }}>
                  Risk score is a research instrument, not a clinical diagnostic. Weights should be validated in a prospective cohort before clinical deployment. All metrics computed on synthetic demo data above.
                </div>
              </div>
            </>}

            {/* ── FALL RISK CLASSIFIER ── */}
            {algo === 'fall_risk' && <>
              <div style={{ gridColumn: '1 / -1', background: C.s1, border: `1px solid ${C.line}`, borderRadius: 14, padding: '24px 28px' }}>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: C.text4, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 18 }}>Model Comparison — AUROC · n=1,441 community-dwelling adults</div>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart layout="vertical" data={[...FALL_MODELS].reverse()} margin={{ top: 0, right: 60, left: 10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={C.line} horizontal={false} />
                    <XAxis type="number" domain={[0.7, 1.0]} tickFormatter={(v: number) => v.toFixed(2)} tick={{ fontFamily: 'var(--mono)', fontSize: 9, fill: C.text4 }} tickLine={false} axisLine={false} />
                    <YAxis type="category" dataKey="name" width={75} tick={{ fontFamily: 'var(--mono)', fontSize: 10, fill: C.text3 }} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={TT_STYLE} formatter={(v: unknown) => [typeof v === 'number' ? v.toFixed(3) : String(v), 'AUROC'] as [string, string]} />
                    <ReferenceLine x={0.9} stroke={C.gold} strokeDasharray="4 3" label={{ value: 'AUC 0.90', position: 'top', fontFamily: 'var(--mono)', fontSize: 9, fill: C.gold }} />
                    <Bar dataKey="auroc" name="AUROC" radius={[0, 4, 4, 0]}>
                      {[...FALL_MODELS].reverse().map((m, i) => (
                        <Cell key={i} fill={m.name === 'AGRU' ? C.gold : m.isDeep ? C.purple : C.text4} fillOpacity={m.name === 'AGRU' ? 1 : 0.65} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <ChartCard full title="Accuracy · F1 · Recall" sub="per-model comparison · n=1,441 community-dwelling adults">
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={FALL_MODELS} margin={{ top: 4, right: 20, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={C.line} vertical={false} />
                    <XAxis dataKey="name" tick={{ fontFamily: 'var(--mono)', fontSize: 10, fill: C.text3 }} tickLine={false} axisLine={false} />
                    <YAxis domain={[70, 100]} tickFormatter={(v: number) => `${v}%`} tick={{ fontFamily: 'var(--mono)', fontSize: 9, fill: C.text4 }} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={TT_STYLE} formatter={(v: unknown) => [typeof v === 'number' ? `${v.toFixed(1)}%` : String(v)] as [string]} />
                    <Legend iconType="circle" iconSize={7} wrapperStyle={{ fontFamily: 'var(--mono)', fontSize: 10, paddingTop: 10 }} />
                    <Bar dataKey="acc"    name="Accuracy" fill={C.sage}   fillOpacity={0.75} radius={[3,3,0,0]} />
                    <Bar dataKey="f1"     name="F1 Score" fill={C.purple} fillOpacity={0.75} radius={[3,3,0,0]} />
                    <Bar dataKey="recall" name="Recall"   fill={C.amber}  fillOpacity={0.75} radius={[3,3,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>

              <div style={{ background: C.s1, border: `1px solid ${C.line}`, borderRadius: 14, padding: '24px 28px' }}>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: C.text4, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 16 }}>AGRU — Age Subgroup AUROC</div>
                <ResponsiveContainer width="100%" height={160}>
                  <BarChart data={AGRU_SUBGROUPS} margin={{ top: 4, right: 20, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={C.line} vertical={false} />
                    <XAxis dataKey="group" tick={{ fontFamily: 'var(--mono)', fontSize: 11, fill: C.text3 }} tickLine={false} axisLine={false} />
                    <YAxis domain={[0.85, 0.96]} tickFormatter={(v: number) => v.toFixed(2)} tick={{ fontFamily: 'var(--mono)', fontSize: 9, fill: C.text4 }} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={TT_STYLE} formatter={(v: unknown) => [typeof v === 'number' ? v.toFixed(3) : String(v), 'AUROC'] as [string, string]} />
                    <Bar dataKey="auroc" radius={[4,4,0,0]}>
                      {AGRU_SUBGROUPS.map((_, i) => (
                        <Cell key={i} fill={[C.sage, C.amber, C.coral][i]} fillOpacity={0.85} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div style={{ background: C.s1, border: `1px solid ${C.line}`, borderRadius: 14, padding: '24px 28px' }}>
                <div style={{ fontFamily: 'var(--serif)', fontWeight: 300, fontSize: 18, letterSpacing: '-0.01em', marginBottom: 10 }}>AGRU Architecture</div>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: C.text3, lineHeight: 1.7 }}>
                  The Attention-Gated Recurrent Unit adds a learned attention gate to a standard GRU. At each timestep, the model weighs which clinical features — pulse rate, functional mobility, living situation — contribute most to the prediction. This interaction sensitivity is why AGRU outperforms tree-based models when fall risk emerges from the combination of factors, not any single feature. External validation confirmed AUROC 0.88 on an independent cohort.
                </div>
              </div>
            </>}

            {/* ── SHAP FEATURE IMPORTANCE ── */}
            {algo === 'shap_features' && <>
              <div style={{ gridColumn: '1 / -1', background: C.s1, border: `1px solid ${C.line}`, borderRadius: 14, padding: '20px 28px', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: C.text4, textTransform: 'uppercase', letterSpacing: '0.12em' }}>Age Group</span>
                {(['overall', 'young', 'middle', 'older'] as const).map(g => (
                  <button key={g} onClick={() => setAgeGroup(g)} style={{ padding: '6px 18px', borderRadius: 999, border: `1px solid ${ageGroup === g ? C.gold : C.lineS}`, background: ageGroup === g ? `${C.gold}1A` : 'transparent', color: ageGroup === g ? C.gold : C.text3, fontFamily: 'var(--mono)', fontSize: 11, cursor: 'pointer', transition: 'all 0.15s' }}>
                    {g === 'overall' ? 'All ages' : g === 'young' ? '20–45' : g === 'middle' ? '46–65' : '>65'}
                  </button>
                ))}
                <span style={{ marginLeft: 'auto', fontFamily: 'var(--mono)', fontSize: 10, color: C.text4 }}>
                  {ageGroup === 'overall' ? 'n = 1,441' : ageGroup === 'young' ? 'n ≈ 360' : ageGroup === 'middle' ? 'n ≈ 650' : 'n ≈ 431'}
                </span>
              </div>

              <ChartCard full title="SHAP Feature Importance" sub={`mean |SHAP| · AGRU model · ${ageGroup === 'overall' ? 'all ages' : ageGroup === 'young' ? 'young adults 20–45' : ageGroup === 'middle' ? 'middle-aged 46–65' : 'older adults >65'}`}>
                <div style={{ display: 'flex', gap: 16, marginBottom: 14 }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: 'var(--mono)', fontSize: 10, color: C.text3 }}><span style={{ width: 10, height: 10, borderRadius: 2, background: C.coral, display: 'inline-block' }}/> Risk factor</span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: 'var(--mono)', fontSize: 10, color: C.text3 }}><span style={{ width: 10, height: 10, borderRadius: 2, background: C.sage, display: 'inline-block' }}/> Protective factor</span>
                </div>
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart layout="vertical" data={shapFeatureData(ageGroup)} margin={{ top: 0, right: 20, left: 20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={C.line} horizontal={false} />
                    <XAxis type="number" domain={[0, 0.6]} tickFormatter={(v: number) => v.toFixed(2)} tick={{ fontFamily: 'var(--mono)', fontSize: 9, fill: C.text4 }} tickLine={false} axisLine={false} label={{ value: 'mean |SHAP|', position: 'insideBottomRight', offset: -4, fontFamily: 'var(--mono)', fontSize: 9, fill: C.text4 }} />
                    <YAxis type="category" dataKey="feature" width={155} tick={{ fontFamily: 'var(--mono)', fontSize: 10, fill: C.text3 }} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={TT_STYLE} formatter={(v: unknown) => [typeof v === 'number' ? v.toFixed(3) : String(v), 'SHAP impact'] as [string, string]} />
                    <Bar dataKey="absShap" name="SHAP Impact" radius={[0, 4, 4, 0]}>
                      {shapFeatureData(ageGroup).map((d, i) => (
                        <Cell key={i} fill={d.isRisk ? C.coral : C.sage} fillOpacity={0.82} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>
            </>}

            {/* ── AGE STRATA ── */}
            {algo === 'age_strata' && <>
              {AGE_STRATA.map(stratum => (
                <div key={stratum.group} style={{ background: C.s1, border: `1px solid ${C.line}`, borderRadius: 14, padding: '24px 28px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
                    <div>
                      <div style={{ fontFamily: 'var(--serif)', fontWeight: 300, fontSize: 22, letterSpacing: '-0.02em', color: stratum.color }}>{stratum.group}</div>
                      <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: C.text4, marginTop: 2 }}>{stratum.label}</div>
                    </div>
                  </div>
                  <ResponsiveContainer width="100%" height={190}>
                    <BarChart layout="vertical" data={[...stratum.factors].reverse()} margin={{ top: 0, right: 10, left: 10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={C.line} horizontal={false} />
                      <XAxis type="number" domain={[0, 60]} tick={{ fontFamily: 'var(--mono)', fontSize: 8, fill: C.text4 }} tickLine={false} axisLine={false} />
                      <YAxis type="category" dataKey="name" width={130} tick={{ fontFamily: 'var(--mono)', fontSize: 9, fill: C.text3 }} tickLine={false} axisLine={false} />
                      <Tooltip contentStyle={TT_STYLE} formatter={(v: unknown) => [typeof v === 'number' ? v.toFixed(0) : String(v), 'SHAP %'] as [string, string]} />
                      <Bar dataKey="value" radius={[0, 3, 3, 0]}>
                        {[...stratum.factors].reverse().map((f, i) => (
                          <Cell key={i} fill={f.dir === 'risk' ? C.coral : C.sage} fillOpacity={0.8} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ))}
              <div style={{ gridColumn: '1 / -1', background: C.s1, border: `1px solid ${C.line}`, borderRadius: 14, padding: '24px 28px' }}>
                <div style={{ fontFamily: 'var(--serif)', fontWeight: 300, fontSize: 18, letterSpacing: '-0.01em', marginBottom: 10 }}>Why age-specific models matter</div>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: C.text3, lineHeight: 1.7 }}>
                  The dominant fall predictors differ substantially across age groups — injury history dominates in young adults, cardiovascular factors (BP, pulse) drive middle-aged risk, and functional mobility (gait speed, sit-to-stand) becomes the primary signal in older adults. A single model trained on pooled data systematically underweights age-specific signals. Age-stratified models improve AUROC by 2–4 points within each subgroup.
                </div>
                <div style={{ marginTop: 14, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                  {AGRU_SUBGROUPS.map(s => (
                    <div key={s.group} style={{ padding: '12px 16px', background: C.s2, borderRadius: 10, border: `1px solid ${C.line}` }}>
                      <div style={{ fontFamily: 'var(--serif)', fontSize: 28, fontWeight: 300, color: C.gold }}>{s.auroc.toFixed(3)}</div>
                      <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: C.text3 }}>AUROC · {s.group}</div>
                      <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: C.text4, marginTop: 2 }}>{s.acc.toFixed(1)}% accuracy</div>
                    </div>
                  ))}
                </div>
              </div>
            </>}
          </>}

          {/* ── SEDENTARY BEHAVIOR ── */}
          {inSedentary && <>
            {/* Section header */}
            <div style={{ gridColumn: '1 / -1', background: C.s1, border: `1px solid ${C.line}`, borderRadius: 14, padding: '24px 28px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 }}>
                <div>
                  <div style={{ fontFamily: 'var(--serif)', fontWeight: 300, fontSize: 20, letterSpacing: '-0.01em', marginBottom: 4 }}>
                    {algo === 'sed_overview' ? 'Sedentary Overview' : algo === 'sed_bouts' ? 'Bout Analysis' : algo === 'sed_breaks' ? 'Break Frequency' : 'Intensity Profile'}
                  </div>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: C.text3 }}>
                    {algo === 'sed_overview' ? 'sedentary time · breaks per hour · prolonged bouts · 288 epochs · 5-min resolution' :
                     algo === 'sed_bouts'    ? 'sedentary bout length distribution · clinical thresholds at 30 and 60 minutes' :
                     algo === 'sed_breaks'   ? 'cumulative breaks across the day · target ≥7 breaks/sedentary hour' :
                     'METs pyramid · sedentary / light / moderate / vigorous intensity zones'}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {SEDENTARY_ALGOS.map(a => (
                  <button key={a.id} onClick={() => setAlgo(a.id)} style={{ padding: '8px 18px', borderRadius: 999, border: `1px solid ${algo === a.id ? a.color : C.lineS}`, background: algo === a.id ? `${a.color}1A` : 'transparent', color: algo === a.id ? a.color : C.text3, fontFamily: 'var(--mono)', fontSize: 12, cursor: 'pointer', transition: 'all 0.15s' }}>{a.label}</button>
                ))}
              </div>
            </div>

            {/* ── SED OVERVIEW ── */}
            {algo === 'sed_overview' && <>
              {/* KPI tiles */}
              <div style={{ gridColumn: '1 / -1', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
                <MetricBadge label="Total Sedentary" value={`${sedResult.sedHours}h`} interp={{ text: sedResult.sedHours > 10 ? 'Exceeds guidelines' : sedResult.sedHours > 8 ? 'Borderline' : 'Acceptable', c: sedResult.sedHours > 10 ? C.red : sedResult.sedHours > 8 ? C.amber : C.sage }} />
                <MetricBadge label="Breaks / Hour" value={sedResult.breaksPerHour.toString()} interp={{ text: sedResult.breaksPerHour >= 7 ? 'On target' : sedResult.breaksPerHour >= 4 ? 'Below target' : 'Critically low', c: sedResult.breaksPerHour >= 7 ? C.sage : sedResult.breaksPerHour >= 4 ? C.amber : C.red }} />
                <MetricBadge label="Prolonged Bouts ≥30m" value={sedResult.prolonged.toString()} interp={{ text: sedResult.prolonged > 3 ? 'High risk' : sedResult.prolonged > 1 ? 'Moderate' : 'Low', c: sedResult.prolonged > 3 ? C.coral : sedResult.prolonged > 1 ? C.amber : C.sage }} />
                <MetricBadge label="Sedentary %" value={`${sedResult.pctSed}%`} interp={{ text: sedResult.pctSed > 70 ? 'High' : sedResult.pctSed > 55 ? 'Moderate' : 'Acceptable', c: sedResult.pctSed > 70 ? C.red : sedResult.pctSed > 55 ? C.amber : C.sage }} />
              </div>

              {/* Hourly sedentary pattern */}
              <ChartCard full title="Hourly Sedentary Pattern" sub="% of each hour below sedentary threshold (< 20 counts) · day 1 profile" badge={`${sedResult.pctSed}% sedentary`} badgeColor={C.amber}>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={sedHourly} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={C.line} vertical={false} />
                    <XAxis dataKey="label" tick={{ fontFamily: 'var(--mono)', fontSize: 9, fill: C.text4 }} tickLine={false} axisLine={false} interval={1} />
                    <YAxis domain={[0, 100]} tickFormatter={(v: number) => `${v}%`} tick={{ fontFamily: 'var(--mono)', fontSize: 9, fill: C.text4 }} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={TT_STYLE} formatter={(v: unknown) => [typeof v === 'number' ? `${v}%` : String(v), 'Sedentary'] as [string, string]} />
                    <ReferenceLine y={50} stroke={C.amber} strokeDasharray="4 3" strokeOpacity={0.5} label={{ value: '50%', position: 'right', fontFamily: 'var(--mono)', fontSize: 9, fill: C.amber }} />
                    <Bar dataKey="sedPct" name="Sedentary %" radius={[3, 3, 0, 0]}>
                      {sedHourly.map((d, i) => <Cell key={i} fill={d.sedPct > 75 ? C.coral : d.sedPct > 50 ? C.amber : C.sage} fillOpacity={0.8} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>

              {/* Info panel */}
              <div style={{ gridColumn: '1 / -1', background: C.s1, border: `1px solid ${C.line}`, borderRadius: 14, padding: '24px 28px' }}>
                <div style={{ fontFamily: 'var(--serif)', fontWeight: 300, fontSize: 18, letterSpacing: '-0.01em', marginBottom: 10 }}>Break frequency reduces cardiovascular risk</div>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: C.text3, lineHeight: 1.7 }}>
                  Frequent interruptions to sedentary time reduce cardiometabolic risk independently of total physical activity. Each additional break per sedentary hour is associated with lower waist circumference, reduced triglycerides, and improved insulin sensitivity. Prospective cohort analyses suggest ≥7 breaks per sedentary hour confers a relative risk reduction of approximately 0.73 for cardiovascular mortality — even in individuals who exercise regularly.
                </div>
                <div style={{ marginTop: 16, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                  {[
                    { label: 'Target breaks/hr', value: '≥ 7', color: C.sage },
                    { label: 'Max continuous sitting', value: '< 30m', color: C.amber },
                    { label: 'WHO daily guideline', value: '< 8h', color: C.accent },
                  ].map(x => (
                    <div key={x.label} style={{ padding: '12px 16px', background: C.s2, borderRadius: 10, border: `1px solid ${C.line}` }}>
                      <div style={{ fontFamily: 'var(--serif)', fontSize: 26, fontWeight: 300, color: x.color }}>{x.value}</div>
                      <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: C.text4, marginTop: 4 }}>{x.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </>}

            {/* ── SED BOUTS ── */}
            {algo === 'sed_bouts' && <>
              <ChartCard full title="Sedentary Bout Distribution" sub={`${sedResult.bouts.length} total bouts · ${sedResult.prolonged} prolonged (≥30m) · ${sedResult.longBouts} long (≥60m)`} badge={`${sedResult.prolonged} prolonged`} badgeColor={sedResult.prolonged > 3 ? C.coral : C.amber}>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={sedBoutHist} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={C.line} vertical={false} />
                    <XAxis dataKey="bin" tick={{ fontFamily: 'var(--mono)', fontSize: 10, fill: C.text4 }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontFamily: 'var(--mono)', fontSize: 10, fill: C.text4 }} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={TT_STYLE} formatter={(v: unknown) => [String(v), 'bouts'] as [string, string]} />
                    <ReferenceLine x="≤30m" stroke={C.amber} strokeDasharray="4 3" strokeOpacity={0.6} label={{ value: 'prolonged', position: 'insideTopRight', fontFamily: 'var(--mono)', fontSize: 9, fill: C.amber }} />
                    <Bar dataKey="count" name="Bouts" radius={[4, 4, 0, 0]}>
                      {sedBoutHist.map((d, i) => <Cell key={i} fill={d.minutes >= 60 ? C.red : d.minutes >= 30 ? C.coral : d.minutes >= 20 ? C.amber : C.sage} fillOpacity={0.8} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>

              <div style={{ background: C.s1, border: `1px solid ${C.line}`, borderRadius: 14, padding: '24px 28px' }}>
                <div style={{ fontFamily: 'var(--serif)', fontWeight: 300, fontSize: 18, letterSpacing: '-0.01em', marginBottom: 12 }}>Clinical Thresholds</div>
                {[
                  { label: '< 10 minutes', desc: 'Short bouts — minimal metabolic impact', color: C.sage },
                  { label: '10–30 minutes', desc: 'Moderate bouts — increasing dysregulation risk', color: C.amber },
                  { label: '≥ 30 minutes',  desc: 'Prolonged — associated with elevated glucose and triglycerides', color: C.coral },
                  { label: '≥ 60 minutes',  desc: 'Long bout — independent cardiovascular risk factor', color: C.red },
                ].map(x => (
                  <div key={x.label} style={{ padding: '8px 12px', background: C.s2, borderRadius: 8, border: `1px solid ${C.line}`, marginBottom: 8, display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                    <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: x.color, minWidth: 110, flexShrink: 0 }}>{x.label}</span>
                    <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: C.text3, lineHeight: 1.5 }}>{x.desc}</span>
                  </div>
                ))}
              </div>

              <div style={{ background: C.s1, border: `1px solid ${C.line}`, borderRadius: 14, padding: '24px 28px' }}>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: C.text4, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 16 }}>Bout Summary</div>
                {[
                  { label: 'Total bouts',       value: sedResult.bouts.length.toString(),                              color: C.text2 },
                  { label: 'Mean bout length',   value: `${sedResult.bouts.length > 0 ? +(mn(sedResult.bouts)).toFixed(0) : 0}m`, color: C.text2 },
                  { label: 'Longest bout',       value: `${sedResult.bouts.length > 0 ? Math.max(...sedResult.bouts) : 0}m`, color: C.coral },
                  { label: 'Prolonged (≥30m)',   value: sedResult.prolonged.toString(),                               color: C.amber },
                  { label: 'Long (≥60m)',         value: sedResult.longBouts.toString(),                              color: C.red },
                ].map(r => (
                  <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: `1px solid ${C.line}` }}>
                    <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: C.text4 }}>{r.label}</span>
                    <span style={{ fontFamily: 'var(--mono)', fontSize: 13, fontWeight: 600, color: r.color }}>{r.value}</span>
                  </div>
                ))}
              </div>
            </>}

            {/* ── SED BREAKS ── */}
            {algo === 'sed_breaks' && <>
              <ChartCard full title="Cumulative Break Count — Day Profile" sub="breaks from sedentary accumulate through the day · target ≥7 breaks/sedentary hour" badge={`${sedResult.breaks} total breaks`} badgeColor={C.sage}>
                <ResponsiveContainer width="100%" height={280}>
                  <ComposedChart data={sedBreakCumul.filter((_, i) => i % 3 === 0)} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={C.line} />
                    <XAxis dataKey="time" interval={7} tick={{ fontFamily: 'var(--mono)', fontSize: 9, fill: C.text4 }} tickLine={false} axisLine={false} />
                    <YAxis yAxisId="breaks" tick={{ fontFamily: 'var(--mono)', fontSize: 9, fill: C.sage }} tickLine={false} axisLine={false} label={{ value: 'breaks', angle: -90, position: 'insideLeft', fontFamily: 'var(--mono)', fontSize: 9, fill: C.sage }} />
                    <YAxis yAxisId="sed" orientation="right" tick={false} axisLine={false} />
                    <Tooltip contentStyle={TT_STYLE} formatter={(v: unknown, n: unknown) => [String(v), String(n)] as [string, string]} />
                    <Legend iconType="circle" iconSize={7} wrapperStyle={{ fontFamily: 'var(--mono)', fontSize: 10, paddingTop: 10 }} />
                    <Bar yAxisId="sed" dataKey="sedentary" name="Sedentary epoch" fill={C.s3} fillOpacity={0.6} barSize={3} legendType="none" />
                    <Line yAxisId="breaks" type="monotone" dataKey="breaks" stroke={C.sage} strokeWidth={2.5} dot={false} name="Cumulative breaks" />
                  </ComposedChart>
                </ResponsiveContainer>
              </ChartCard>

              <div style={{ background: C.s1, border: `2px solid ${sedResult.breaksPerHour >= 7 ? C.sage : C.amber}44`, borderRadius: 14, padding: '32px 28px', textAlign: 'center' }}>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: C.text4, textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: 12 }}>Breaks per Sedentary Hour</div>
                <div style={{ fontFamily: 'var(--serif)', fontWeight: 300, fontSize: 80, lineHeight: 1, letterSpacing: '-0.04em', color: sedResult.breaksPerHour >= 7 ? C.sage : sedResult.breaksPerHour >= 4 ? C.amber : C.red }}>{sedResult.breaksPerHour}</div>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: C.text3, marginTop: 6 }}>target ≥ 7</div>
                <span style={{ display: 'inline-flex', marginTop: 14, padding: '5px 16px', borderRadius: 999, background: `${sedResult.breaksPerHour >= 7 ? C.sage : C.amber}18`, border: `1px solid ${sedResult.breaksPerHour >= 7 ? C.sage : C.amber}50`, color: sedResult.breaksPerHour >= 7 ? C.sage : C.amber, fontFamily: 'var(--mono)', fontSize: 12 }}>{sedResult.breaksPerHour >= 7 ? 'On target' : sedResult.breaksPerHour >= 4 ? 'Below target' : 'Critically low'}</span>
              </div>

              <div style={{ background: C.s1, border: `1px solid ${C.line}`, borderRadius: 14, padding: '24px 28px' }}>
                <div style={{ fontFamily: 'var(--serif)', fontWeight: 300, fontSize: 18, letterSpacing: '-0.01em', marginBottom: 10 }}>Why breaks matter</div>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: C.text3, lineHeight: 1.7 }}>
                  Interrupting prolonged sitting activates skeletal muscle lipoprotein lipase and restores postprandial glucose clearance. Even 2-minute standing breaks every 20–30 minutes attenuate postprandial glycemia by 30% compared to unbroken sitting. The protective effect is dose-responsive — each additional break per sedentary hour independently reduces waist circumference and fasting triglycerides.
                </div>
              </div>
            </>}

            {/* ── SED INTENSITY ── */}
            {algo === 'sed_intensity' && <>
              <ChartCard full title="Activity Intensity Distribution" sub="METs-based zone classification · sedentary / light / moderate / vigorous" badge={`${intDist.find(d => d.label === 'Vigorous')?.pct ?? 0}% vigorous`} badgeColor={C.red}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 28, alignItems: 'center' }}>
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart layout="vertical" data={[...intDist].reverse()} margin={{ top: 0, right: 30, left: 10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={C.line} horizontal={false} />
                      <XAxis type="number" tickFormatter={(v: number) => `${v}m`} tick={{ fontFamily: 'var(--mono)', fontSize: 9, fill: C.text4 }} tickLine={false} axisLine={false} />
                      <YAxis type="category" dataKey="label" width={78} tick={{ fontFamily: 'var(--mono)', fontSize: 10, fill: C.text3 }} tickLine={false} axisLine={false} />
                      <Tooltip contentStyle={TT_STYLE} formatter={(v: unknown) => [typeof v === 'number' ? `${v}m` : String(v), 'Duration'] as [string, string]} />
                      <Bar dataKey="mins" name="Minutes" radius={[0, 4, 4, 0]}>
                        {[...intDist].reverse().map((d, i) => <Cell key={i} fill={d.color} fillOpacity={0.85} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {intDist.map(d => (
                      <div key={d.label} style={{ padding: '14px 18px', background: C.s2, borderRadius: 10, border: `1px solid ${d.color}30` }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
                          <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: d.color }}>{d.label}</span>
                          <span style={{ fontFamily: 'var(--serif)', fontSize: 28, fontWeight: 300, color: d.color }}>{d.pct}%</span>
                        </div>
                        <div style={{ background: C.s3, borderRadius: 3, height: 4 }}>
                          <div style={{ width: `${d.pct}%`, background: d.color, height: '100%', borderRadius: 3, opacity: 0.8 }} />
                        </div>
                        <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: C.text4, marginTop: 4 }}>{d.mins}m · {d.label === 'Sedentary' ? '< 20 counts · < 1.5 METs' : d.label === 'Light' ? '20–44 counts · 1.5–3 METs' : d.label === 'Moderate' ? '45–69 counts · 3–6 METs' : '≥ 70 counts · > 6 METs'}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </ChartCard>

              <div style={{ gridColumn: '1 / -1', background: C.s1, border: `1px solid ${C.line}`, borderRadius: 14, padding: '24px 28px' }}>
                <div style={{ fontFamily: 'var(--serif)', fontWeight: 300, fontSize: 18, letterSpacing: '-0.01em', marginBottom: 10 }}>METs intensity zones</div>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: C.text3, lineHeight: 1.7 }}>
                  Activity counts map to METs via validated actigraphy cut-points. Sedentary (&lt;1.5 METs) includes seated work and lying still. Light activity (1.5–3 METs) includes slow walking and light standing tasks. Moderate (3–6 METs) covers brisk walking, cycling, and household activities. Vigorous (&gt;6 METs) includes running, stair climbing, and intense exercise. Current guidelines recommend 150–300 minutes/week of moderate or 75–150 minutes/week of vigorous activity.
                </div>
              </div>
            </>}
          </>}

          {/* ── STRESS & AUTONOMIC ── */}
          {inAutonomic && <>
            {/* Section header */}
            <div style={{ gridColumn: '1 / -1', background: C.s1, border: `1px solid ${C.line}`, borderRadius: 14, padding: '24px 28px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 }}>
                <div>
                  <div style={{ fontFamily: 'var(--serif)', fontWeight: 300, fontSize: 20, letterSpacing: '-0.01em', marginBottom: 4 }}>
                    {algo === 'lfhf' ? 'HRV Power Spectrum · LF/HF' : algo === 'poincare_plot' ? 'Poincaré Plot' : algo === 'stress_index' ? 'Stress Index · 24h' : 'Autonomic 24h Profile'}
                  </div>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: C.text3 }}>
                    {algo === 'lfhf' ? 'VLF / LF / HF power bands · sympathovagal balance · synthetic RR interval series' :
                     algo === 'poincare_plot' ? 'RR(n) vs RR(n+1) · SD1 = parasympathetic · SD2 = sympathovagal · n=200 beats' :
                     algo === 'stress_index' ? 'hourly sympathetic load derived from LF/HF ratio · circadian autonomic rhythm' :
                     'LF/HF over 24 hours · morning rise · work-hours peak · evening recovery · sleep nadir'}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {AUTONOMIC_ALGOS.map(a => (
                  <button key={a.id} onClick={() => setAlgo(a.id)} style={{ padding: '8px 18px', borderRadius: 999, border: `1px solid ${algo === a.id ? a.color : C.lineS}`, background: algo === a.id ? `${a.color}1A` : 'transparent', color: algo === a.id ? a.color : C.text3, fontFamily: 'var(--mono)', fontSize: 12, cursor: 'pointer', transition: 'all 0.15s' }}>{a.label}</button>
                ))}
              </div>
            </div>

            {/* ── LF/HF SPECTRUM ── */}
            {algo === 'lfhf' && <>
              <ChartCard full title="HRV Power Spectrum" sub="VLF (< 0.04 Hz) · LF (0.04–0.15 Hz) · HF (0.15–0.4 Hz) · synthetic 5-min RR series" badge={`LF/HF = ${overallLFHF}`} badgeColor={interpLFHF(overallLFHF).c}>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={HRV_SPECTRUM} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="vlfGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={C.text4} stopOpacity={0.5}/><stop offset="95%" stopColor={C.text4} stopOpacity={0.05}/></linearGradient>
                      <linearGradient id="lfGrad"  x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={C.amber} stopOpacity={0.5}/><stop offset="95%" stopColor={C.amber} stopOpacity={0.05}/></linearGradient>
                      <linearGradient id="hfGrad"  x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={C.sage}  stopOpacity={0.5}/><stop offset="95%" stopColor={C.sage}  stopOpacity={0.05}/></linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={C.line} />
                    <XAxis dataKey="freq" tick={{ fontFamily: 'var(--mono)', fontSize: 9, fill: C.text4 }} tickLine={false} axisLine={false} interval={9} label={{ value: 'Hz', position: 'insideBottom', offset: -4, fontFamily: 'var(--mono)', fontSize: 9, fill: C.text4 }} />
                    <YAxis tick={{ fontFamily: 'var(--mono)', fontSize: 9, fill: C.text4 }} tickLine={false} axisLine={false} label={{ value: 'Power (ms²/Hz)', angle: -90, position: 'insideLeft', fontFamily: 'var(--mono)', fontSize: 9, fill: C.text4 }} />
                    <Tooltip contentStyle={TT_STYLE} formatter={(v: unknown, _n: unknown, p: { payload?: { band?: string } }) => [typeof v === 'number' ? v.toFixed(1) : String(v), p?.payload?.band ?? 'Power'] as [string, string]} />
                    <ReferenceLine x={0.04} stroke={C.text4}  strokeDasharray="3 3" strokeOpacity={0.4} label={{ value: 'VLF|LF', position: 'insideTopLeft', fontFamily: 'var(--mono)', fontSize: 8, fill: C.text4 }} />
                    <ReferenceLine x={0.15} stroke={C.amber} strokeDasharray="3 3" strokeOpacity={0.4} label={{ value: 'LF|HF', position: 'insideTopLeft', fontFamily: 'var(--mono)', fontSize: 8, fill: C.amber }} />
                    <Area type="monotone" dataKey="power" stroke="none" fill="url(#lfGrad)">
                      {HRV_SPECTRUM.map((d, i) => <Cell key={i} fill={d.band === 'VLF' ? 'rgba(246,247,248,0.12)' : d.band === 'LF' ? `${C.amber}55` : `${C.sage}55`} />)}
                    </Area>
                    <Line type="monotone" dataKey="power" strokeWidth={0} dot={false}>
                      {HRV_SPECTRUM.map((d, i) => <Cell key={i} fill={d.band === 'VLF' ? C.text4 : d.band === 'LF' ? C.amber : C.sage} />)}
                    </Line>
                  </AreaChart>
                </ResponsiveContainer>
              </ChartCard>

              <ChartCard title="LF/HF · 24h Trend" sub="sympathovagal balance by hour · lower = parasympathetic dominant" badge={interpLFHF(overallLFHF).text} badgeColor={interpLFHF(overallLFHF).c}>
                <ResponsiveContainer width="100%" height={240}>
                  <LineChart data={LFHF_24H} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={C.line} />
                    <XAxis dataKey="label" tick={{ fontFamily: 'var(--mono)', fontSize: 9, fill: C.text4 }} tickLine={false} axisLine={false} interval={3} />
                    <YAxis domain={[0, 4]} tick={{ fontFamily: 'var(--mono)', fontSize: 9, fill: C.text4 }} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={TT_STYLE} formatter={(v: unknown) => [typeof v === 'number' ? v.toFixed(2) : String(v), 'LF/HF'] as [string, string]} />
                    <ReferenceLine y={2.0} stroke={C.amber} strokeDasharray="4 3" label={{ value: 'sympathetic threshold', position: 'right', fontFamily: 'var(--mono)', fontSize: 8, fill: C.amber }} />
                    <Line type="monotone" dataKey="lfhf" stroke={C.amber} strokeWidth={2} dot={{ r: 2, fill: C.amber }} name="LF/HF" />
                  </LineChart>
                </ResponsiveContainer>
              </ChartCard>

              <MetricBadge label="Mean LF/HF" value={overallLFHF.toString()} interp={interpLFHF(overallLFHF)} />

              <div style={{ background: C.s1, border: `1px solid ${C.line}`, borderRadius: 14, padding: '24px 28px' }}>
                <div style={{ fontFamily: 'var(--serif)', fontWeight: 300, fontSize: 18, letterSpacing: '-0.01em', marginBottom: 12 }}>Band Interpretation</div>
                {[
                  { band: 'VLF (< 0.04 Hz)', desc: 'Very-low frequency power — renin-angiotensin, thermoregulation, intrinsic cardiac activity', c: C.text3 },
                  { band: 'LF (0.04–0.15 Hz)', desc: 'Low frequency — mixed sympathetic + parasympathetic; baroreceptor reflex', c: C.amber },
                  { band: 'HF (0.15–0.4 Hz)', desc: 'High frequency — respiratory sinus arrhythmia; pure parasympathetic tone marker', c: C.sage },
                  { band: 'LF/HF ratio', desc: 'Sympathovagal balance; elevated values indicate sympathetic dominance or stress', c: C.coral },
                ].map(x => (
                  <div key={x.band} style={{ padding: '8px 0', borderBottom: `1px solid ${C.line}`, display: 'flex', gap: 14 }}>
                    <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: x.c, minWidth: 145, flexShrink: 0 }}>{x.band}</span>
                    <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: C.text3, lineHeight: 1.5 }}>{x.desc}</span>
                  </div>
                ))}
              </div>
            </>}

            {/* ── POINCARÉ PLOT ── */}
            {algo === 'poincare_plot' && <>
              <ChartCard full title="Poincaré Plot · RR(n) vs RR(n+1)" sub={`${rrIntervals.length - 1} consecutive RR pairs · SD1 = short-term variability · SD2 = long-term variability`} badge={`SD1/SD2 = ${poincareData.ratio}`} badgeColor={C.sage}>
                <ResponsiveContainer width="100%" height={400}>
                  <ScatterChart margin={{ top: 4, right: 8, left: -20, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={C.line} />
                    <XAxis type="number" dataKey="rr1" name="RR(n)" domain={[600, 1100]} tick={{ fontFamily: 'var(--mono)', fontSize: 10, fill: C.text4 }} tickLine={false} axisLine={false} label={{ value: 'RR(n) ms', position: 'insideBottom', offset: -8, fontFamily: 'var(--mono)', fontSize: 9, fill: C.text4 }} />
                    <YAxis type="number" dataKey="rr2" name="RR(n+1)" domain={[600, 1100]} tick={{ fontFamily: 'var(--mono)', fontSize: 10, fill: C.text4 }} tickLine={false} axisLine={false} label={{ value: 'RR(n+1) ms', angle: -90, position: 'insideLeft', fontFamily: 'var(--mono)', fontSize: 9, fill: C.text4 }} />
                    <ZAxis range={[18, 18]} />
                    <Tooltip contentStyle={TT_STYLE} formatter={(v: unknown, n: unknown) => [typeof v === 'number' ? `${v}ms` : String(v), String(n)] as [string, string]} />
                    <ReferenceLine segment={[{ x: 600, y: 600 }, { x: 1100, y: 1100 }]} stroke={C.lineS} strokeDasharray="3 3" />
                    <Scatter data={poincareData.pairs} fill={C.sage} fillOpacity={0.5} name="RR pair" />
                  </ScatterChart>
                </ResponsiveContainer>
              </ChartCard>

              <div style={{ gridColumn: '1 / -1', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                <MetricBadge label="SD1 · Parasympathetic" value={`${poincareData.sd1}ms`} interp={{ text: poincareData.sd1 > 30 ? 'Good vagal tone' : poincareData.sd1 > 15 ? 'Moderate' : 'Low vagal tone', c: poincareData.sd1 > 30 ? C.sage : poincareData.sd1 > 15 ? C.amber : C.red }} />
                <MetricBadge label="SD2 · Sympathovagal" value={`${poincareData.sd2}ms`} interp={{ text: `SD1/SD2 = ${poincareData.ratio}`, c: C.amber }} />
                <MetricBadge label="SD1/SD2 Ratio" value={poincareData.ratio.toString()} interp={{ text: poincareData.ratio < 0.5 ? 'Sympathetic dominance' : poincareData.ratio < 0.8 ? 'Balanced' : 'Parasympathetic lead', c: poincareData.ratio < 0.5 ? C.coral : poincareData.ratio < 0.8 ? C.sage : C.accent }} />
              </div>

              <div style={{ gridColumn: '1 / -1', background: C.s1, border: `1px solid ${C.line}`, borderRadius: 14, padding: '24px 28px' }}>
                <div style={{ fontFamily: 'var(--serif)', fontWeight: 300, fontSize: 18, letterSpacing: '-0.01em', marginBottom: 10 }}>Reading the Poincaré plot</div>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: C.text3, lineHeight: 1.7 }}>
                  SD1 measures the width of the point cloud perpendicular to the line-of-identity — it captures beat-to-beat parasympathetic modulation (respiratory sinus arrhythmia). SD2 measures the cloud length along the identity line — it reflects longer-term sympathovagal dynamics. A tight, elongated ellipse (low SD1, high SD2) indicates parasympathetic withdrawal. A broad, round ellipse indicates healthy high-frequency variability. Athletes and well-rested individuals show larger SD1.
                </div>
              </div>
            </>}

            {/* ── STRESS INDEX ── */}
            {algo === 'stress_index' && <>
              <ChartCard full title="Hourly Stress Index" sub="sympathetic load derived from LF/HF · higher = more sympathetic activation" badge={`peak ${Math.max(...stressIndexData.map(d => d.si)).toFixed(0)}`} badgeColor={C.red}>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={stressIndexData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={C.line} vertical={false} />
                    <XAxis dataKey="label" tick={{ fontFamily: 'var(--mono)', fontSize: 9, fill: C.text4 }} tickLine={false} axisLine={false} interval={1} />
                    <YAxis tick={{ fontFamily: 'var(--mono)', fontSize: 9, fill: C.text4 }} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={TT_STYLE} formatter={(v: unknown) => [typeof v === 'number' ? v.toFixed(1) : String(v), 'Stress Index'] as [string, string]} />
                    <ReferenceLine y={40} stroke={C.amber} strokeDasharray="4 3" label={{ value: 'elevated', position: 'right', fontFamily: 'var(--mono)', fontSize: 9, fill: C.amber }} />
                    <ReferenceLine y={52} stroke={C.red}   strokeDasharray="4 3" label={{ value: 'high', position: 'right', fontFamily: 'var(--mono)', fontSize: 9, fill: C.red }} />
                    <Bar dataKey="si" name="Stress Index" radius={[3, 3, 0, 0]}>
                      {stressIndexData.map((d, i) => <Cell key={i} fill={d.color} fillOpacity={0.8} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>

              <div style={{ background: C.s1, border: `1px solid ${C.line}`, borderRadius: 14, padding: '24px 28px' }}>
                <div style={{ fontFamily: 'var(--serif)', fontWeight: 300, fontSize: 18, letterSpacing: '-0.01em', marginBottom: 12 }}>Autonomic Zones</div>
                {[
                  { range: '< 30', label: 'Rest / recovery — parasympathetic dominant', color: C.sage },
                  { range: '30–40', label: 'Normal waking — balanced ANS', color: C.accent },
                  { range: '40–52', label: 'Elevated — mild sympathetic activation', color: C.amber },
                  { range: '> 52', label: 'High stress — sympathetic dominance', color: C.red },
                ].map(r => (
                  <div key={r.range} style={{ display: 'flex', gap: 12, padding: '7px 0', borderBottom: `1px solid ${C.line}`, alignItems: 'center' }}>
                    <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: r.color, minWidth: 55 }}>{r.range}</span>
                    <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: C.text3 }}>{r.label}</span>
                  </div>
                ))}
              </div>

              <MetricBadge label="Mean Stress Index" value={(+(mn(stressIndexData.map(d => d.si))).toFixed(1)).toString()} interp={{ text: mn(stressIndexData.map(d => d.si)) > 52 ? 'High stress load' : mn(stressIndexData.map(d => d.si)) > 40 ? 'Elevated' : 'Normal range', c: mn(stressIndexData.map(d => d.si)) > 52 ? C.red : mn(stressIndexData.map(d => d.si)) > 40 ? C.amber : C.sage }} />
            </>}

            {/* ── AUTONOMIC 24H ── */}
            {algo === 'autonomic_24h' && <>
              <ChartCard full title="Autonomic Balance · 24-Hour Profile" sub="LF/HF over the day · reference line at 2.0 (sympathetic threshold) · morning rise · work hours · recovery" badge={`mean ${overallLFHF}`} badgeColor={interpLFHF(overallLFHF).c}>
                <ResponsiveContainer width="100%" height={320}>
                  <ComposedChart data={LFHF_24H} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="lfhfGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor={C.amber} stopOpacity={0.25}/>
                        <stop offset="95%" stopColor={C.amber} stopOpacity={0.03}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={C.line} />
                    <XAxis dataKey="label" tick={{ fontFamily: 'var(--mono)', fontSize: 9, fill: C.text4 }} tickLine={false} axisLine={false} interval={1} />
                    <YAxis domain={[0, 3.5]} tick={{ fontFamily: 'var(--mono)', fontSize: 9, fill: C.text4 }} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={TT_STYLE} formatter={(v: unknown) => [typeof v === 'number' ? v.toFixed(2) : String(v), 'LF/HF'] as [string, string]} />
                    <ReferenceLine y={2.0} stroke={C.red} strokeDasharray="4 3" label={{ value: 'sympathetic threshold', position: 'right', fontFamily: 'var(--mono)', fontSize: 8, fill: C.red }} />
                    <ReferenceArea x1="06h" x2="09h" fill={C.coral} fillOpacity={0.07} label={{ value: 'morning rise', position: 'insideTop', fontFamily: 'var(--mono)', fontSize: 8, fill: C.coral }} />
                    <ReferenceArea x1="09h" x2="17h" fill={C.amber} fillOpacity={0.05} label={{ value: 'work hours', position: 'insideTop', fontFamily: 'var(--mono)', fontSize: 8, fill: C.amber }} />
                    <ReferenceArea x1="20h" x2="23h" fill={C.sage}  fillOpacity={0.05} label={{ value: 'evening recovery', position: 'insideTop', fontFamily: 'var(--mono)', fontSize: 8, fill: C.sage }} />
                    <Area type="monotone" dataKey="lfhf" stroke={C.amber} strokeWidth={2.5} fill="url(#lfhfGrad)" name="LF/HF" dot={{ r: 3, fill: C.amber }} />
                  </ComposedChart>
                </ResponsiveContainer>
              </ChartCard>

              <div style={{ gridColumn: '1 / -1', background: C.s1, border: `1px solid ${C.line}`, borderRadius: 14, padding: '24px 28px' }}>
                <div style={{ fontFamily: 'var(--serif)', fontWeight: 300, fontSize: 18, letterSpacing: '-0.01em', marginBottom: 10 }}>Circadian autonomic rhythm</div>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: C.text3, lineHeight: 1.7 }}>
                  Healthy circadian autonomic rhythm shows a low overnight LF/HF (parasympathetic recovery during sleep), a morning surge at 6–9h (cortisol-driven sympathetic activation), sustained elevation during work hours, and progressive parasympathetic recovery from 18h onward. Disrupted patterns — flat circadian LF/HF, elevated overnight values, or absent morning rise — are associated with burnout, chronic stress, impaired insulin sensitivity, and increased cardiovascular risk.
                </div>
              </div>
            </>}
          </>}

          {/* ── METABOLIC / CGM ── */}
          {inMetabolic && <>
            {/* Section header */}
            <div style={{ gridColumn: '1 / -1', background: C.s1, border: `1px solid ${C.line}`, borderRadius: 14, padding: '24px 28px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 }}>
                <div>
                  <div style={{ fontFamily: 'var(--serif)', fontWeight: 300, fontSize: 20, letterSpacing: '-0.01em', marginBottom: 4 }}>
                    {algo === 'glucose_trace' ? 'CGM Glucose Trace' : algo === 'time_in_range' ? 'Time in Range' : algo === 'agp' ? 'Ambulatory Glucose Profile' : 'Glucose Variability'}
                  </div>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: C.text3 }}>
                    {algo === 'glucose_trace'       ? 'continuous glucose monitor · 5-min epochs · 24-hour synthetic day with meal events' :
                     algo === 'time_in_range'        ? 'TIR 70–180 · TBR2 <54 · TBR1 54–70 · TAR1 180–250 · TAR2 >250 · ADA consensus targets' :
                     algo === 'agp'                  ? 'p5/p25/p50/p75/p95 percentile bands · 24-hour glucose pattern from CGM data' :
                     'CV% · MAGE · rolling 1h SD · glucose distribution by zone'}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {METABOLIC_ALGOS.map(a => (
                  <button key={a.id} onClick={() => setAlgo(a.id)} style={{ padding: '8px 18px', borderRadius: 999, border: `1px solid ${algo === a.id ? a.color : C.lineS}`, background: algo === a.id ? `${a.color}1A` : 'transparent', color: algo === a.id ? a.color : C.text3, fontFamily: 'var(--mono)', fontSize: 12, cursor: 'pointer', transition: 'all 0.15s' }}>{a.label}</button>
                ))}
              </div>
            </div>

            {/* ── GLUCOSE TRACE ── */}
            {algo === 'glucose_trace' && <>
              <ChartCard full title="Continuous Glucose Monitor — 24h" sub="5-min epochs · zones: TBR red · TIR green · TAR amber · reference lines at 70 and 180 mg/dL" badge={`TIR ${cgmStats.tir}%`} badgeColor={interpTIR(cgmStats.tir).c}>
                <ResponsiveContainer width="100%" height={320}>
                  <AreaChart data={CGM_DATA} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="cgmGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor={C.sage} stopOpacity={0.25}/>
                        <stop offset="95%" stopColor={C.sage} stopOpacity={0.04}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={C.line} vertical={false} />
                    <XAxis dataKey="time" tick={{ fontFamily: 'var(--mono)', fontSize: 9, fill: C.text4 }} tickLine={false} axisLine={false} interval={23} />
                    <YAxis domain={[50, 250]} tick={{ fontFamily: 'var(--mono)', fontSize: 9, fill: C.text4 }} tickLine={false} axisLine={false} label={{ value: 'mg/dL', angle: -90, position: 'insideLeft', fontFamily: 'var(--mono)', fontSize: 9, fill: C.text4 }} />
                    <Tooltip contentStyle={TT_STYLE} formatter={(v: unknown) => [typeof v === 'number' ? `${v} mg/dL` : String(v), 'Glucose'] as [string, string]} />
                    <ReferenceArea y1={50}  y2={54}  fill={C.red}   fillOpacity={0.15} />
                    <ReferenceArea y1={54}  y2={70}  fill={C.coral} fillOpacity={0.10} />
                    <ReferenceArea y1={70}  y2={180} fill={C.sage}  fillOpacity={0.06} />
                    <ReferenceArea y1={180} y2={250} fill={C.amber} fillOpacity={0.08} />
                    <ReferenceArea y1={250} y2={280} fill={C.red}   fillOpacity={0.10} />
                    <ReferenceLine y={70}  stroke={C.coral} strokeDasharray="4 3" strokeOpacity={0.6} label={{ value: '70', position: 'right', fontFamily: 'var(--mono)', fontSize: 9, fill: C.coral }} />
                    <ReferenceLine y={180} stroke={C.amber} strokeDasharray="4 3" strokeOpacity={0.6} label={{ value: '180', position: 'right', fontFamily: 'var(--mono)', fontSize: 9, fill: C.amber }} />
                    <Area type="monotone" dataKey="glucose" stroke={C.sage} strokeWidth={2} fill="url(#cgmGrad)" name="Glucose" dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </ChartCard>

              <div style={{ gridColumn: '1 / -1', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                <MetricBadge label="Time in Range (70–180)" value={`${cgmStats.tir}%`} interp={interpTIR(cgmStats.tir)} />
                <MetricBadge label="Mean Glucose" value={`${cgmStats.meanG}`} unit="mg/dL" interp={{ text: cgmStats.meanG <= 100 ? 'Optimal' : cgmStats.meanG <= 140 ? 'Elevated' : 'High', c: cgmStats.meanG <= 100 ? C.sage : cgmStats.meanG <= 140 ? C.amber : C.red }} />
                <MetricBadge label="GMI" value={cgmStats.gmi.toString()} interp={{ text: cgmStats.gmi < 6.5 ? 'Below diabetes threshold' : 'Above threshold', c: cgmStats.gmi < 6.5 ? C.sage : C.coral }} />
              </div>
            </>}

            {/* ── TIME IN RANGE ── */}
            {algo === 'time_in_range' && <>
              {/* TIR headline + stacked bar */}
              <div style={{ background: C.s1, border: `2px solid ${interpTIR(cgmStats.tir).c}44`, borderRadius: 14, padding: '32px 28px', textAlign: 'center' }}>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: C.text4, textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: 12 }}>Time in Range</div>
                <div style={{ fontFamily: 'var(--serif)', fontWeight: 300, fontSize: 88, lineHeight: 1, letterSpacing: '-0.04em', color: interpTIR(cgmStats.tir).c }}>{cgmStats.tir}%</div>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: C.text3, marginTop: 6 }}>70–180 mg/dL</div>
                <span style={{ display: 'inline-flex', marginTop: 14, padding: '5px 16px', borderRadius: 999, background: `${interpTIR(cgmStats.tir).c}18`, border: `1px solid ${interpTIR(cgmStats.tir).c}50`, color: interpTIR(cgmStats.tir).c, fontFamily: 'var(--mono)', fontSize: 12 }}>{interpTIR(cgmStats.tir).text}</span>
              </div>

              <div style={{ background: C.s1, border: `1px solid ${C.line}`, borderRadius: 14, padding: '24px 28px' }}>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: C.text4, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 16 }}>Zone Distribution</div>
                {/* Horizontal stacked bar */}
                <div style={{ display: 'flex', height: 32, borderRadius: 6, overflow: 'hidden', marginBottom: 20 }}>
                  {[
                    { label: 'TBR2', pct: cgmStats.tbr2, color: C.red },
                    { label: 'TBR1', pct: cgmStats.tbr1, color: C.coral },
                    { label: 'TIR',  pct: cgmStats.tir,  color: C.sage },
                    { label: 'TAR1', pct: cgmStats.tar1, color: C.amber },
                    { label: 'TAR2', pct: cgmStats.tar2, color: C.red },
                  ].map(z => z.pct > 0 ? <div key={z.label} style={{ width: `${z.pct}%`, background: z.color, opacity: 0.85, transition: 'width 0.4s' }} title={`${z.label}: ${z.pct}%`} /> : null)}
                </div>
                {[
                  { label: 'TBR2 (< 54)',    pct: cgmStats.tbr2, color: C.red,   target: '< 1%'  },
                  { label: 'TBR1 (54–70)',   pct: cgmStats.tbr1, color: C.coral, target: '< 4%'  },
                  { label: 'TIR (70–180)',   pct: cgmStats.tir,  color: C.sage,  target: '> 70%' },
                  { label: 'TAR1 (180–250)', pct: cgmStats.tar1, color: C.amber, target: '< 25%' },
                  { label: 'TAR2 (> 250)',   pct: cgmStats.tar2, color: C.red,   target: '< 5%'  },
                ].map(z => (
                  <div key={z.label} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                    <span style={{ width: 10, height: 10, borderRadius: 2, background: z.color, flexShrink: 0, opacity: 0.8, display: 'inline-block' }} />
                    <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: C.text3, flex: 1 }}>{z.label}</span>
                    <span style={{ fontFamily: 'var(--mono)', fontSize: 13, fontWeight: 600, color: z.color }}>{z.pct}%</span>
                    <span style={{ fontFamily: 'var(--mono)', fontSize: 9, color: C.text4, minWidth: 40, textAlign: 'right' }}>target {z.target}</span>
                  </div>
                ))}
              </div>

              <div style={{ gridColumn: '1 / -1', background: C.s1, border: `1px solid ${C.line}`, borderRadius: 14, padding: '24px 28px' }}>
                <div style={{ fontFamily: 'var(--serif)', fontWeight: 300, fontSize: 18, letterSpacing: '-0.01em', marginBottom: 10 }}>ADA / EASD consensus targets</div>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: C.text3, lineHeight: 1.7 }}>
                  TIR ≥70% is the primary CGM quality target. Each 10% improvement in TIR (72 min/day) corresponds to a 0.8% reduction in HbA1c-equivalent and is independently associated with reduced risk of microvascular complications. TBR &lt;4% and TBR2 &lt;1% are safety thresholds for hypoglycemia prevention. These targets apply to type 1 and type 2 diabetes; non-diabetic adults typically achieve TIR &gt;90%.
                </div>
              </div>
            </>}

            {/* ── AGP ── */}
            {algo === 'agp' && <>
              <ChartCard full title="Ambulatory Glucose Profile" sub="p5/p25/p50/p75/p95 percentile bands · 24h glucose pattern · reference lines at 70 and 180 mg/dL">
                <ResponsiveContainer width="100%" height={340}>
                  <ComposedChart data={AGP_DATA} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="agpOuter" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={C.accent} stopOpacity={0.08}/><stop offset="95%" stopColor={C.accent} stopOpacity={0.02}/></linearGradient>
                      <linearGradient id="agpInner" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={C.accent} stopOpacity={0.20}/><stop offset="95%" stopColor={C.accent} stopOpacity={0.06}/></linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={C.line} />
                    <XAxis dataKey="label" tick={{ fontFamily: 'var(--mono)', fontSize: 9, fill: C.text4 }} tickLine={false} axisLine={false} interval={3} />
                    <YAxis domain={[50, 220]} tick={{ fontFamily: 'var(--mono)', fontSize: 9, fill: C.text4 }} tickLine={false} axisLine={false} label={{ value: 'mg/dL', angle: -90, position: 'insideLeft', fontFamily: 'var(--mono)', fontSize: 9, fill: C.text4 }} />
                    <Tooltip contentStyle={TT_STYLE} formatter={(v: unknown, n: unknown) => [typeof v === 'number' ? `${v} mg/dL` : String(v), String(n)] as [string, string]} />
                    <ReferenceLine y={70}  stroke={C.coral} strokeDasharray="4 3" strokeOpacity={0.5} label={{ value: '70', position: 'right', fontFamily: 'var(--mono)', fontSize: 9, fill: C.coral }} />
                    <ReferenceLine y={180} stroke={C.amber} strokeDasharray="4 3" strokeOpacity={0.5} label={{ value: '180', position: 'right', fontFamily: 'var(--mono)', fontSize: 9, fill: C.amber }} />
                    <Area type="monotone" dataKey="p95" stroke="none" fill="url(#agpOuter)" name="p95" legendType="none" />
                    <Area type="monotone" dataKey="p5"  stroke="none" fill={C.bg} name="p5" legendType="none" />
                    <Area type="monotone" dataKey="p75" stroke="none" fill="url(#agpInner)" name="p75 (IQR upper)" />
                    <Area type="monotone" dataKey="p25" stroke="none" fill={C.s1} name="p25 (IQR lower)" />
                    <Line type="monotone" dataKey="p50" stroke={C.accent} strokeWidth={2.5} dot={false} name="Median (p50)" />
                    <Legend iconType="circle" iconSize={7} wrapperStyle={{ fontFamily: 'var(--mono)', fontSize: 10, paddingTop: 10 }} />
                  </ComposedChart>
                </ResponsiveContainer>
              </ChartCard>

              <div style={{ gridColumn: '1 / -1', background: C.s1, border: `1px solid ${C.line}`, borderRadius: 14, padding: '24px 28px' }}>
                <div style={{ fontFamily: 'var(--serif)', fontWeight: 300, fontSize: 18, letterSpacing: '-0.01em', marginBottom: 10 }}>Reading the AGP</div>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: C.text3, lineHeight: 1.7 }}>
                  The AGP condenses days or weeks of CGM data into a single 24-hour summary. The p50 median shows the typical glucose pattern. The IQR (p25–p75) band represents day-to-day reproducibility — narrow bands indicate predictable glucose; wide bands indicate high variability. The p5–p95 band captures extreme excursions. Clinicians use the AGP to identify meal-driven spikes, overnight patterns, and high-risk hypoglycemia windows.
                </div>
              </div>
            </>}

            {/* ── GLUCOSE VARIABILITY ── */}
            {algo === 'glucose_variability' && <>
              <div style={{ gridColumn: '1 / -1', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
                <MetricBadge label="CV% · Coefficient of Variation" value={`${cgmStats.cv}%`} interp={interpCV(cgmStats.cv)} />
                <MetricBadge label="MAGE · Glycemic Excursion" value={`${cgmStats.mage}`} unit="mg/dL" interp={{ text: cgmStats.mage > 50 ? 'High excursion' : cgmStats.mage > 30 ? 'Moderate' : 'Low', c: cgmStats.mage > 50 ? C.coral : cgmStats.mage > 30 ? C.amber : C.sage }} />
                <MetricBadge label="SD · Standard Deviation" value={`${cgmStats.sdG}`} unit="mg/dL" interp={{ text: cgmStats.sdG > 40 ? 'High' : cgmStats.sdG > 25 ? 'Moderate' : 'Low', c: cgmStats.sdG > 40 ? C.coral : cgmStats.sdG > 25 ? C.amber : C.sage }} />
                <MetricBadge label="Mean Glucose" value={`${cgmStats.meanG}`} unit="mg/dL" interp={{ text: cgmStats.meanG <= 100 ? 'Optimal' : cgmStats.meanG <= 140 ? 'Elevated' : 'High', c: cgmStats.meanG <= 100 ? C.sage : cgmStats.meanG <= 140 ? C.amber : C.red }} />
              </div>

              <ChartCard full title="Rolling 1-Hour Glucose SD" sub="variability across the day · peaks around meals · low overnight = stable fasting" badge={`CV = ${cgmStats.cv}%`} badgeColor={interpCV(cgmStats.cv).c}>
                <ResponsiveContainer width="100%" height={260}>
                  <AreaChart data={rollingGlucoseSD.filter(d => d.rollingSD !== null)} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="sdGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={C.purple} stopOpacity={0.3}/><stop offset="95%" stopColor={C.purple} stopOpacity={0.04}/></linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={C.line} vertical={false} />
                    <XAxis dataKey="time" tick={{ fontFamily: 'var(--mono)', fontSize: 9, fill: C.text4 }} tickLine={false} axisLine={false} interval={23} />
                    <YAxis tick={{ fontFamily: 'var(--mono)', fontSize: 9, fill: C.text4 }} tickLine={false} axisLine={false} label={{ value: 'SD (mg/dL)', angle: -90, position: 'insideLeft', fontFamily: 'var(--mono)', fontSize: 9, fill: C.text4 }} />
                    <Tooltip contentStyle={TT_STYLE} formatter={(v: unknown) => [typeof v === 'number' ? `${v} mg/dL` : String(v), 'Rolling SD'] as [string, string]} />
                    <Area type="monotone" dataKey="rollingSD" stroke={C.purple} strokeWidth={2} fill="url(#sdGrad)" name="1h SD" dot={false} connectNulls />
                  </AreaChart>
                </ResponsiveContainer>
              </ChartCard>

              <ChartCard full title="Glucose Distribution by Zone" sub="frequency histogram with TBR / TIR / TAR zone coloring" badge={`${glucoseHist.find(d => d.zone === 'tir')?.count ?? 0} in-range readings`} badgeColor={C.sage}>
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={glucoseHist} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={C.line} vertical={false} />
                    <XAxis dataKey="label" tick={{ fontFamily: 'var(--mono)', fontSize: 9, fill: C.text4 }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontFamily: 'var(--mono)', fontSize: 9, fill: C.text4 }} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={TT_STYLE} formatter={(v: unknown) => [String(v), 'readings'] as [string, string]} />
                    <Bar dataKey="count" name="Readings" radius={[4, 4, 0, 0]}>
                      {glucoseHist.map((d, i) => <Cell key={i} fill={d.color} fillOpacity={0.8} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>
            </>}
          </>}

          {/* ── LONGITUDINAL ── */}
          {inLongitudinal && <>
            {/* Section header */}
            <div style={{ gridColumn: '1 / -1', background: C.s1, border: `1px solid ${C.line}`, borderRadius: 14, padding: '24px 28px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 }}>
                <div>
                  <div style={{ fontFamily: 'var(--serif)', fontWeight: 300, fontSize: 20, letterSpacing: '-0.01em', marginBottom: 4 }}>
                    {algo === 'timeline' ? '30-Day Timeline' : algo === 'correlation' ? 'Cross-Domain Correlation' : algo === 'health_calendar' ? 'Health Calendar' : 'Risk Evolution'}
                  </div>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: C.text3 }}>
                    {algo === 'timeline'         ? 'multi-domain sparklines · sleep · autonomic · metabolic · sedentary · 30 days' :
                     algo === 'correlation'       ? '7×7 Pearson r matrix · cross-domain relationships · recovery as primary outcome' :
                     algo === 'health_calendar'   ? '30-day grid colored by recovery score · identify patterns and anomalies' :
                     'recovery trajectory · reference bands · anomaly days · 30-day trend line'}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {LONGITUDINAL_ALGOS.map(a => (
                  <button key={a.id} onClick={() => setAlgo(a.id)} style={{ padding: '8px 18px', borderRadius: 999, border: `1px solid ${algo === a.id ? a.color : C.lineS}`, background: algo === a.id ? `${a.color}1A` : 'transparent', color: algo === a.id ? a.color : C.text3, fontFamily: 'var(--mono)', fontSize: 12, cursor: 'pointer', transition: 'all 0.15s' }}>{a.label}</button>
                ))}
              </div>
            </div>

            {/* ── TIMELINE ── */}
            {algo === 'timeline' && <>
              {([
                { key: 'recovery',  label: 'Recovery',          color: C.gold,   unit: '',    domain: 'sleep' },
                { key: 'sleepH',    label: 'Sleep Duration',    color: C.purple, unit: 'h',   domain: 'sleep' },
                { key: 'siiD',      label: 'Sleep Irregularity', color: C.coral, unit: 'min', domain: 'sleep' },
                { key: 'lfhfD',     label: 'LF/HF Ratio',       color: C.amber, unit: '',    domain: 'autonomic' },
                { key: 'glucoseCV', label: 'Glucose CV%',        color: C.sage,  unit: '%',   domain: 'metabolic' },
                { key: 'sedHD',     label: 'Sedentary Hours',    color: C.coral, unit: 'h',   domain: 'sedentary' },
                { key: 'steps',     label: 'Steps',              color: C.accent, unit: '',   domain: 'activity' },
              ] as const).map(m => {
                const vals = THIRTY_DAYS.map(d => d[m.key as keyof typeof d] as number);
                const avg7  = +(mn(vals.slice(-7))).toFixed(1);
                return (
                  <div key={m.key} style={{ gridColumn: '1 / -1', background: C.s1, border: `1px solid ${C.line}`, borderRadius: 10, padding: '16px 22px', display: 'grid', gridTemplateColumns: '160px 1fr 100px', gap: 16, alignItems: 'center' }}>
                    <div>
                      <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: m.color, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 2 }}>{m.label}</div>
                      <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: C.text4 }}>{m.domain}</div>
                    </div>
                    <ResponsiveContainer width="100%" height={48}>
                      <LineChart data={THIRTY_DAYS} margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
                        <Line type="monotone" dataKey={m.key} stroke={m.color} strokeWidth={1.5} dot={false} />
                        <YAxis hide domain={['auto', 'auto']} />
                        <XAxis hide />
                        <Tooltip contentStyle={{ ...TT_STYLE, padding: '6px 10px' }} formatter={(v: unknown) => [`${v}${m.unit}`, m.label] as [string, string]} labelFormatter={(l: unknown) => `Day ${l}`} />
                      </LineChart>
                    </ResponsiveContainer>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontFamily: 'var(--serif)', fontSize: 22, fontWeight: 300, color: m.color }}>{avg7}{m.unit}</div>
                      <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: C.text4 }}>7-day avg</div>
                    </div>
                  </div>
                );
              })}
            </>}

            {/* ── CORRELATION MATRIX ── */}
            {algo === 'correlation' && <>
              <ChartCard full title="Cross-Domain Correlation Matrix" sub="Pearson r · 30 days · red = negative · green = positive · diagonal = 1.0" badge="n = 30 days" badgeColor={C.gold}>
                <div style={{ overflowX: 'auto' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: `120px repeat(${METRICS_FOR_CORR.length}, 1fr)`, gap: 3, minWidth: 560 }}>
                    <div />
                    {METRICS_FOR_CORR.map(m => (
                      <div key={m.key} style={{ fontFamily: 'var(--mono)', fontSize: 8, color: C.text4, textAlign: 'center', padding: '4px 2px', lineHeight: 1.2 }}>{m.label.split(' ').map((w, i) => <span key={i} style={{ display: 'block' }}>{w}</span>)}</div>
                    ))}
                    {METRICS_FOR_CORR.map((rm, ri) => [
                      <div key={`lbl-${ri}`} style={{ fontFamily: 'var(--mono)', fontSize: 9, color: C.text3, display: 'flex', alignItems: 'center', paddingRight: 8, justifyContent: 'flex-end' }}>{rm.label}</div>,
                      ...METRICS_FOR_CORR.map((cm, ci) => {
                        const r = corrMatrix[ri][ci];
                        const isDiag = ri === ci;
                        const bg = isDiag ? C.s3 : r > 0 ? `rgba(61,204,145,${Math.min(0.8, Math.abs(r) * 0.85)})` : `rgba(255,107,107,${Math.min(0.8, Math.abs(r) * 0.85)})`;
                        return (
                          <div key={`${ri}-${ci}`} title={`${rm.label} × ${cm.label}: r = ${r}`} style={{ aspectRatio: '1', background: bg, borderRadius: 4, border: `1px solid rgba(255,255,255,0.04)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--mono)', fontSize: 9, color: isDiag ? C.text3 : Math.abs(r) > 0.4 ? '#fff' : C.text4 }}>
                            {isDiag ? '1.0' : r.toFixed(2)}
                          </div>
                        );
                      })
                    ])}
                  </div>
                </div>
              </ChartCard>

              <div style={{ gridColumn: '1 / -1', background: C.s1, border: `1px solid ${C.line}`, borderRadius: 14, padding: '24px 28px' }}>
                <div style={{ fontFamily: 'var(--serif)', fontWeight: 300, fontSize: 18, letterSpacing: '-0.01em', marginBottom: 10 }}>Key relationships</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  {[
                    { pair: 'Sleep Duration → Recovery',   r: corrMatrix[METRICS_FOR_CORR.findIndex(m=>m.key==='sleepH')][METRICS_FOR_CORR.findIndex(m=>m.key==='recovery')], desc: 'Longer sleep drives recovery score' },
                    { pair: 'LF/HF → Recovery',            r: corrMatrix[METRICS_FOR_CORR.findIndex(m=>m.key==='lfhfD')][METRICS_FOR_CORR.findIndex(m=>m.key==='recovery')], desc: 'High sympathetic load reduces recovery' },
                    { pair: 'Glucose CV → Recovery',       r: corrMatrix[METRICS_FOR_CORR.findIndex(m=>m.key==='glucoseCV')][METRICS_FOR_CORR.findIndex(m=>m.key==='recovery')], desc: 'Metabolic instability impairs recovery' },
                    { pair: 'Sedentary Hours → Steps',     r: corrMatrix[METRICS_FOR_CORR.findIndex(m=>m.key==='sedHD')][METRICS_FOR_CORR.findIndex(m=>m.key==='steps')], desc: 'Less movement = more sedentary time' },
                  ].map(x => (
                    <div key={x.pair} style={{ padding: '12px 16px', background: C.s2, borderRadius: 10, border: `1px solid ${C.line}` }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                        <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: C.text2 }}>{x.pair}</span>
                        <span style={{ fontFamily: 'var(--mono)', fontSize: 13, fontWeight: 600, color: x.r > 0 ? C.sage : C.coral }}>r = {x.r}</span>
                      </div>
                      <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: C.text4 }}>{x.desc}</div>
                    </div>
                  ))}
                </div>
              </div>
            </>}

            {/* ── HEALTH CALENDAR ── */}
            {algo === 'health_calendar' && <>
              <ChartCard full title="30-Day Health Calendar" sub="recovery score per day · hover for details · color: red poor → green optimal">
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(10, 1fr)', gap: 6, padding: '8px 0' }}>
                  {THIRTY_DAYS.map(d => {
                    const c = d.recovery >= 85 ? C.sage : d.recovery >= 70 ? C.accent : d.recovery >= 50 ? C.amber : d.recovery >= 35 ? C.coral : C.red;
                    return (
                      <div key={d.day}
                        onMouseEnter={() => setHoveredCell({ day: d.day, val: d.recovery })}
                        onMouseLeave={() => setHoveredCell(null)}
                        style={{ aspectRatio: '1', borderRadius: 8, background: `${c}${d.recovery >= 70 ? '33' : '22'}`, border: `1px solid ${hoveredCell?.day === d.day ? c : C.line}`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'default', transition: 'border-color 0.15s', position: 'relative' }}>
                        <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: C.text4 }}>D{d.day}</div>
                        <div style={{ fontFamily: 'var(--mono)', fontSize: 13, fontWeight: 600, color: c }}>{d.recovery}</div>
                        {hoveredCell?.day === d.day && (
                          <div style={{ position: 'absolute', bottom: '110%', left: '50%', transform: 'translateX(-50%)', background: C.s1, border: `1px solid ${C.lineS}`, borderRadius: 6, padding: '6px 10px', whiteSpace: 'nowrap', zIndex: 10, fontFamily: 'var(--mono)', fontSize: 10, color: C.text2 }}>
                            Day {d.day} · Recovery {d.recovery} · Sleep {d.sleepH}h
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                {/* Legend */}
                <div style={{ display: 'flex', gap: 16, marginTop: 16, flexWrap: 'wrap' }}>
                  {[
                    { label: 'Optimal (≥85)', color: C.sage },
                    { label: 'Good (70–84)',  color: C.accent },
                    { label: 'Fair (50–69)',  color: C.amber },
                    { label: 'Low (35–49)',   color: C.coral },
                    { label: 'Poor (<35)',    color: C.red },
                  ].map(x => (
                    <div key={x.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ width: 12, height: 12, borderRadius: 3, background: `${x.color}33`, border: `1px solid ${x.color}66` }} />
                      <span style={{ fontFamily: 'var(--mono)', fontSize: 9, color: C.text4 }}>{x.label}</span>
                    </div>
                  ))}
                </div>
              </ChartCard>
            </>}

            {/* ── RISK EVOLUTION ── */}
            {algo === 'risk_evolution' && <>
              <ChartCard full title="Recovery Score · 30-Day Trend" sub={`trajectory · reference bands · trend slope ${longTrend.slope > 0 ? '+' : ''}${longTrend.slope}/day · anomaly days highlighted`} badge={`trend ${longTrend.slope > 0 ? '+' : ''}${longTrend.slope}/day`} badgeColor={longTrend.slope >= 0 ? C.sage : C.coral}>
                <ResponsiveContainer width="100%" height={320}>
                  <ComposedChart data={THIRTY_DAYS.map((d, i) => ({ ...d, trend: longTrend.line[i], anomaly: d.recovery < 50 ? d.recovery : null }))} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={C.line} vertical={false} />
                    <XAxis dataKey="label" tick={{ fontFamily: 'var(--mono)', fontSize: 9, fill: C.text4 }} tickLine={false} axisLine={false} interval={4} />
                    <YAxis domain={[0, 100]} tick={{ fontFamily: 'var(--mono)', fontSize: 9, fill: C.text4 }} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={TT_STYLE} formatter={(v: unknown, n: unknown) => [String(v), String(n)] as [string, string]} />
                    <Legend iconType="circle" iconSize={7} wrapperStyle={{ fontFamily: 'var(--mono)', fontSize: 10, paddingTop: 10 }} />
                    <ReferenceArea y1={85} y2={100} fill={C.sage}  fillOpacity={0.06} label={{ value: 'Optimal', position: 'insideTopRight', fontFamily: 'var(--mono)', fontSize: 8, fill: C.sage }} />
                    <ReferenceArea y1={70} y2={85}  fill={C.accent} fillOpacity={0.04} label={{ value: 'Good',    position: 'insideTopRight', fontFamily: 'var(--mono)', fontSize: 8, fill: C.accent }} />
                    <ReferenceArea y1={50} y2={70}  fill={C.amber}  fillOpacity={0.04} label={{ value: 'Fair',    position: 'insideTopRight', fontFamily: 'var(--mono)', fontSize: 8, fill: C.amber }} />
                    <ReferenceArea y1={0}  y2={50}  fill={C.red}    fillOpacity={0.03} label={{ value: 'Poor',    position: 'insideTopRight', fontFamily: 'var(--mono)', fontSize: 8, fill: C.red }} />
                    <Bar dataKey="anomaly" name="Anomaly day" fill={C.red} fillOpacity={0.5} radius={[3, 3, 0, 0]} barSize={12} legendType="circle" />
                    <Line type="monotone" dataKey="recovery" stroke={C.gold}  strokeWidth={2.5} dot={{ r: 2, fill: C.gold }} name="Recovery" />
                    <Line type="monotone" dataKey="trend"    stroke={longTrend.slope >= 0 ? C.sage : C.coral} strokeWidth={1.5} dot={false} strokeDasharray="6 3" name="Trend" />
                  </ComposedChart>
                </ResponsiveContainer>
              </ChartCard>

              <div style={{ background: C.s1, border: `1px solid ${C.line}`, borderRadius: 14, padding: '24px 28px' }}>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: C.text4, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 16 }}>30-Day Summary</div>
                {[
                  { label: 'Mean recovery',     value: `${Math.round(mn(THIRTY_DAYS.map(d => d.recovery)))}`,         color: interpRecovery(Math.round(mn(THIRTY_DAYS.map(d => d.recovery)))).c },
                  { label: 'Best day',          value: `Day ${THIRTY_DAYS.reduce((a, d) => d.recovery > a.recovery ? d : a).day} (${THIRTY_DAYS.reduce((a, d) => d.recovery > a.recovery ? d : a).recovery})`, color: C.sage },
                  { label: 'Worst day',         value: `Day ${THIRTY_DAYS.reduce((a, d) => d.recovery < a.recovery ? d : a).day} (${THIRTY_DAYS.reduce((a, d) => d.recovery < a.recovery ? d : a).recovery})`, color: C.coral },
                  { label: 'Anomaly days (<50)', value: THIRTY_DAYS.filter(d => d.recovery < 50).length.toString(),   color: C.red },
                  { label: 'Trend slope',       value: `${longTrend.slope > 0 ? '+' : ''}${longTrend.slope}/day`,     color: longTrend.slope >= 0 ? C.sage : C.coral },
                ].map(r => (
                  <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: `1px solid ${C.line}` }}>
                    <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: C.text4 }}>{r.label}</span>
                    <span style={{ fontFamily: 'var(--mono)', fontSize: 13, fontWeight: 600, color: r.color }}>{r.value}</span>
                  </div>
                ))}
              </div>

              <div style={{ background: C.s1, border: `1px solid ${C.line}`, borderRadius: 14, padding: '24px 28px' }}>
                <div style={{ fontFamily: 'var(--serif)', fontWeight: 300, fontSize: 18, letterSpacing: '-0.01em', marginBottom: 10 }}>Longitudinal health modeling</div>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: C.text3, lineHeight: 1.7 }}>
                  Tracking recovery across 30 days reveals patterns invisible in single-night snapshots. A declining trend signals accumulating physiological debt — often driven by poor sleep regularity, elevated autonomic stress, or worsening metabolic control. Anomaly days cluster around high LF/HF weeks and glucose variability spikes. CUSUM-style sequential monitoring of recovery can flag emerging decline 5–10 days before it becomes clinically apparent.
                </div>
              </div>
            </>}
          </>}

          {/* ── SLEEP ANALYSIS ── */}
          {inSleep && <>
            {/* Section header */}
            <div style={{ gridColumn: '1 / -1', background: C.s1, border: `1px solid ${C.line}`, borderRadius: 14, padding: '24px 28px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 }}>
                <div>
                  <div style={{ fontFamily: 'var(--serif)', fontWeight: 300, fontSize: 20, letterSpacing: '-0.01em', marginBottom: 4 }}>
                    {algo === 'sleep_arch' ? 'Sleep Architecture' : algo === 'sleep_sii' ? 'Sleep Irregularity Index' : algo === 'sleep_hrv' ? 'Sleep HRV' : algo === 'recovery' ? 'Recovery Score' : 'Chronotype'}
                  </div>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: C.text3 }}>
                    {algo === 'sleep_arch' ? 'hypnogram · stage distribution · 8-hour synthetic night' :
                     algo === 'sleep_sii'  ? 'night-to-night variability · sleep midpoint SD · cardiometabolic risk marker' :
                     algo === 'sleep_hrv'  ? 'RMSSD across the night · parasympathetic activity by sleep stage' :
                     algo === 'recovery'   ? 'composite readiness score · HRV · efficiency · deep sleep · duration' :
                     'sleep timing distribution · social jetlag · chronotype classification'}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
                {SLEEP_ALGOS.map(a => (
                  <button key={a.id} onClick={() => setAlgo(a.id)} style={{ padding: '8px 18px', borderRadius: 999, border: `1px solid ${algo === a.id ? a.color : C.lineS}`, background: algo === a.id ? `${a.color}1A` : 'transparent', color: algo === a.id ? a.color : C.text3, fontFamily: 'var(--mono)', fontSize: 12, cursor: 'pointer', transition: 'all 0.15s' }}>{a.label}</button>
                ))}
              </div>
              {/* Night selector (shown for arch / hrv / recovery) */}
              {(algo === 'sleep_arch' || algo === 'sleep_hrv' || algo === 'recovery') && (
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: C.text4, alignSelf: 'center', marginRight: 4 }}>Night:</span>
                  {SLEEP_NIGHTS.map((n, i) => (
                    <button key={i} onClick={() => setSleepNight(i)} style={{ padding: '4px 10px', borderRadius: 6, border: `1px solid ${sleepNight === i ? C.purple : C.lineS}`, background: sleepNight === i ? `${C.purple}1A` : 'transparent', color: sleepNight === i ? C.purple : C.text4, fontFamily: 'var(--mono)', fontSize: 10, cursor: 'pointer' }}>
                      {n.day}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* ── SLEEP ARCHITECTURE ── */}
            {algo === 'sleep_arch' && <>
              <ChartCard full title="Hypnogram" sub={`${SLEEP_NIGHTS[sleepNight].bedH} → ${SLEEP_NIGHTS[sleepNight].wakeH} · ${Math.floor(SLEEP_NIGHTS[sleepNight].dur/60)}h ${SLEEP_NIGHTS[sleepNight].dur%60}m · efficiency ${SLEEP_NIGHTS[sleepNight].eff}%`}>
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={hypnogram} margin={{ top: 4, right: 10, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={C.line} vertical={false} />
                    <XAxis dataKey="time" interval={11} tick={{ fontFamily: 'var(--mono)', fontSize: 9, fill: C.text4 }} tickLine={false} axisLine={false} />
                    <YAxis domain={[-0.4, 3.4]} ticks={[0,1,2,3]} tickFormatter={(v: number) => ['Deep','REM','Light','Awake'][v] ?? ''} tick={{ fontFamily: 'var(--mono)', fontSize: 9, fill: C.text4 }} tickLine={false} axisLine={false} width={45} />
                    <Tooltip contentStyle={TT_STYLE} formatter={(_v: unknown, _n: unknown, p: {payload?: {stageLabel?: string}}) => [p?.payload?.stageLabel ?? '', 'Stage'] as [string,string]} />
                    <ReferenceArea y1={-0.4} y2={0.4} fill={C.purple} fillOpacity={0.08} />
                    <ReferenceArea y1={0.6}  y2={1.4} fill={C.accent} fillOpacity={0.08} />
                    <ReferenceArea y1={1.6}  y2={2.4} fill={C.sage}   fillOpacity={0.08} />
                    <ReferenceArea y1={2.6}  y2={3.4} fill={C.text4}  fillOpacity={0.04} />
                    <Line type="stepAfter" dataKey="stageY" stroke={C.purple} strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </ChartCard>

              <div style={{ background: C.s1, border: `1px solid ${C.line}`, borderRadius: 14, padding: '24px 28px' }}>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: C.text4, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 16 }}>Stage Distribution</div>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={sleepStats} margin={{ top: 0, right: 10, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={C.line} vertical={false} />
                    <XAxis dataKey="stage" tick={{ fontFamily: 'var(--mono)', fontSize: 10, fill: C.text3 }} tickLine={false} axisLine={false} />
                    <YAxis tickFormatter={(v: number) => `${v}%`} tick={{ fontFamily: 'var(--mono)', fontSize: 9, fill: C.text4 }} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={TT_STYLE} formatter={(v: unknown) => [`${v}%`, 'Time in stage'] as [string,string]} />
                    <Bar dataKey="pct" radius={[4,4,0,0]}>
                      {sleepStats.map((s, i) => <Cell key={i} fill={s.color} fillOpacity={0.8} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div style={{ background: C.s1, border: `1px solid ${C.line}`, borderRadius: 14, padding: '24px 28px' }}>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: C.text4, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 16 }}>Stage Minutes</div>
                {sleepStats.map(s => (
                  <div key={s.stage} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                    <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: s.color, width: 40 }}>{s.stage}</span>
                    <div style={{ flex: 1, background: C.s3, borderRadius: 4, height: 6 }}>
                      <div style={{ width: `${s.pct}%`, background: s.color, height: '100%', borderRadius: 4, opacity: 0.75 }} />
                    </div>
                    <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: C.text3, width: 48, textAlign: 'right' }}>{s.mins}m</span>
                  </div>
                ))}
                <div style={{ marginTop: 16, fontFamily: 'var(--mono)', fontSize: 10, color: C.text4, lineHeight: 1.6 }}>
                  Ideal targets: Deep 15–20% · REM 20–25% · Light 50–55% · Awake &lt;5%
                </div>
              </div>
            </>}

            {/* ── SLEEP IRREGULARITY ── */}
            {algo === 'sleep_sii' && <>
              <div style={{ background: C.s1, border: `2px solid ${interpSII(sii).c}44`, borderRadius: 14, padding: '32px 28px', textAlign: 'center' }}>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: C.text4, textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: 12 }}>Sleep Irregularity Index</div>
                <div style={{ fontFamily: 'var(--serif)', fontWeight: 300, fontSize: 80, lineHeight: 1, letterSpacing: '-0.04em', color: interpSII(sii).c }}>{sii}</div>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: C.text3, marginTop: 6 }}>minutes (SD of sleep midpoint)</div>
                <span style={{ display: 'inline-flex', marginTop: 14, padding: '5px 16px', borderRadius: 999, background: `${interpSII(sii).c}18`, border: `1px solid ${interpSII(sii).c}50`, color: interpSII(sii).c, fontFamily: 'var(--mono)', fontSize: 12 }}>{interpSII(sii).text}</span>
              </div>

              <ChartCard full title="Sleep Timing — 14 Nights" sub="bedtime · midpoint · wake time per night">
                <ResponsiveContainer width="100%" height={260}>
                  <ComposedChart data={SLEEP_NIGHTS} margin={{ top: 4, right: 20, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={C.line} vertical={false} />
                    <XAxis dataKey="day" tick={{ fontFamily: 'var(--mono)', fontSize: 10, fill: C.text3 }} tickLine={false} axisLine={false} />
                    <YAxis domain={[1260, 1560]} tickFormatter={(v: number) => `${String(Math.floor(v/60)%24).padStart(2,'0')}:${String(v%60).padStart(2,'0')}`} tick={{ fontFamily: 'var(--mono)', fontSize: 9, fill: C.text4 }} tickLine={false} axisLine={false} width={48} />
                    <Tooltip contentStyle={TT_STYLE} formatter={(v: unknown, name: unknown) => [typeof v === 'number' ? `${String(Math.floor(v/60)%24).padStart(2,'0')}:${String(v%60).padStart(2,'0')}` : String(v), String(name)] as [string,string]} />
                    <Legend iconType="circle" iconSize={7} wrapperStyle={{ fontFamily: 'var(--mono)', fontSize: 10, paddingTop: 10 }} />
                    <Line type="monotone" dataKey="bed" stroke={C.purple} strokeWidth={1.5} dot={{ r: 3, fill: C.purple }} name="Bedtime" />
                    <Line type="monotone" dataKey="mid" stroke={C.gold}   strokeWidth={2}   dot={{ r: 3, fill: C.gold }}   name="Midpoint" strokeDasharray="4 2" />
                  </ComposedChart>
                </ResponsiveContainer>
              </ChartCard>

              <div style={{ gridColumn: '1 / -1', background: C.s1, border: `1px solid ${C.line}`, borderRadius: 14, padding: '24px 28px' }}>
                <div style={{ fontFamily: 'var(--serif)', fontWeight: 300, fontSize: 18, letterSpacing: '-0.01em', marginBottom: 10 }}>Why sleep irregularity matters</div>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: C.text3, lineHeight: 1.7 }}>
                  Large prospective studies show sleep irregularity predicts obesity, metabolic syndrome, diabetes, and cardiovascular disease — independent of total sleep duration. In some analyses it is a stronger predictor than how long you sleep. The SII (SD of sleep midpoint across 7–14 nights) quantifies this: &lt;30 min is low risk, 30–60 min moderate, &gt;60 min elevated cardiometabolic risk. Social jetlag (shifting bedtime on weekends) is the most common driver.
                </div>
              </div>
            </>}

            {/* ── SLEEP HRV ── */}
            {algo === 'sleep_hrv' && <>
              <ChartCard full title="HRV + HR Through the Night" sub={`RMSSD (ms) and heart rate (bpm) · ${SLEEP_NIGHTS[sleepNight].day} · avg HRV ${SLEEP_NIGHTS[sleepNight].hrv}ms`}>
                <ResponsiveContainer width="100%" height={280}>
                  <ComposedChart data={hypnogram} margin={{ top: 4, right: 30, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={C.line} vertical={false} />
                    <XAxis dataKey="time" interval={11} tick={{ fontFamily: 'var(--mono)', fontSize: 9, fill: C.text4 }} tickLine={false} axisLine={false} />
                    <YAxis yAxisId="hrv" domain={[20, 75]} tick={{ fontFamily: 'var(--mono)', fontSize: 9, fill: C.purple }} tickLine={false} axisLine={false} label={{ value: 'HRV ms', angle: -90, position: 'insideLeft', fontFamily: 'var(--mono)', fontSize: 9, fill: C.purple }} />
                    <YAxis yAxisId="hr"  domain={[45, 80]} orientation="right" tick={{ fontFamily: 'var(--mono)', fontSize: 9, fill: C.coral }} tickLine={false} axisLine={false} label={{ value: 'HR bpm', angle: 90, position: 'insideRight', fontFamily: 'var(--mono)', fontSize: 9, fill: C.coral }} />
                    <Tooltip contentStyle={TT_STYLE} />
                    <ReferenceArea yAxisId="hrv" y1={20} y2={75} x1="00:00" x2="01:10" fill={C.purple} fillOpacity={0.04} />
                    <Line yAxisId="hrv" type="monotone" dataKey="hrv" stroke={C.purple} strokeWidth={1.8} dot={false} name="HRV (RMSSD)" />
                    <Line yAxisId="hr"  type="monotone" dataKey="hr"  stroke={C.coral}  strokeWidth={1.5} dot={false} name="Heart Rate" strokeDasharray="3 2" />
                  </ComposedChart>
                </ResponsiveContainer>
              </ChartCard>

              <div style={{ background: C.s1, border: `1px solid ${C.line}`, borderRadius: 14, padding: '24px 28px' }}>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: C.text4, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 16 }}>Avg HRV by Stage</div>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={[0,1,2,3].map(s => ({ stage: STAGE_LABEL[s], hrv: +(hypnogram.filter(d=>d.stage===s).reduce((a,d)=>a+d.hrv,0) / Math.max(1,hypnogram.filter(d=>d.stage===s).length)).toFixed(1), color: STAGE_COLOR[s] }))} margin={{ top: 0, right: 10, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={C.line} vertical={false} />
                    <XAxis dataKey="stage" tick={{ fontFamily: 'var(--mono)', fontSize: 10, fill: C.text3 }} tickLine={false} axisLine={false} />
                    <YAxis domain={[0, 70]} tick={{ fontFamily: 'var(--mono)', fontSize: 9, fill: C.text4 }} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={TT_STYLE} formatter={(v: unknown) => [`${v}ms`, 'Avg RMSSD'] as [string,string]} />
                    <Bar dataKey="hrv" radius={[4,4,0,0]}>
                      {[0,1,2,3].map(i => <Cell key={i} fill={STAGE_COLOR[i]} fillOpacity={0.8} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div style={{ background: C.s1, border: `1px solid ${C.line}`, borderRadius: 14, padding: '24px 28px' }}>
                <div style={{ fontFamily: 'var(--serif)', fontWeight: 300, fontSize: 18, letterSpacing: '-0.01em', marginBottom: 10 }}>HRV during sleep</div>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: C.text3, lineHeight: 1.7 }}>
                  HRV peaks in deep (N3) sleep when parasympathetic tone dominates. REM sleep shows intermediate HRV with high sympathetic activation. The overnight HRV trajectory — rising in the first half, declining toward morning — reflects restorative autonomic recovery. A flat or declining HRV curve is an early stress or illness signal.
                </div>
              </div>
            </>}

            {/* ── RECOVERY SCORE ── */}
            {algo === 'recovery' && <>
              <div style={{ background: C.s1, border: `2px solid ${interpRecovery(recov.score).c}44`, borderRadius: 14, padding: '32px 28px', textAlign: 'center' }}>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: C.text4, textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: 12 }}>Recovery Score</div>
                <div style={{ fontFamily: 'var(--serif)', fontWeight: 300, fontSize: 88, lineHeight: 1, letterSpacing: '-0.04em', color: interpRecovery(recov.score).c }}>{recov.score}</div>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: C.text3, marginTop: 6 }}>out of 100</div>
                <span style={{ display: 'inline-flex', marginTop: 16, padding: '5px 16px', borderRadius: 999, background: `${interpRecovery(recov.score).c}18`, border: `1px solid ${interpRecovery(recov.score).c}50`, color: interpRecovery(recov.score).c, fontFamily: 'var(--mono)', fontSize: 12 }}>{interpRecovery(recov.score).text}</span>
              </div>

              <div style={{ background: C.s1, border: `1px solid ${C.line}`, borderRadius: 14, padding: '24px 28px' }}>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: C.text4, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 16 }}>Component Breakdown</div>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart layout="vertical" data={recov.comps} margin={{ top: 0, right: 40, left: 4, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={C.line} horizontal={false} />
                    <XAxis type="number" domain={[0,100]} tick={{ fontFamily: 'var(--mono)', fontSize: 9, fill: C.text4 }} tickLine={false} axisLine={false} />
                    <YAxis type="category" dataKey="name" width={140} tick={{ fontFamily: 'var(--mono)', fontSize: 9, fill: C.text3 }} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={TT_STYLE} formatter={(v: unknown) => [String(v), 'Score'] as [string,string]} />
                    <ReferenceLine x={70} stroke={C.amber} strokeDasharray="4 3" strokeOpacity={0.5} />
                    <Bar dataKey="value" radius={[0,3,3,0]}>
                      {recov.comps.map((c,i) => <Cell key={i} fill={c.value >= 75 ? C.sage : c.value >= 50 ? C.amber : C.coral} fillOpacity={0.8} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <ChartCard full title="Recovery Trend — 14 Nights" sub="composite score across all recorded nights">
                <ResponsiveContainer width="100%" height={200}>
                  <ComposedChart data={recovTrend} margin={{ top: 4, right: 20, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={C.line} vertical={false} />
                    <XAxis dataKey="night" tick={{ fontFamily: 'var(--mono)', fontSize: 9, fill: C.text4 }} tickLine={false} axisLine={false} />
                    <YAxis domain={[40,100]} tick={{ fontFamily: 'var(--mono)', fontSize: 9, fill: C.text4 }} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={TT_STYLE} />
                    <ReferenceArea y1={85} y2={100} fill={C.sage}  fillOpacity={0.06} />
                    <ReferenceArea y1={70} y2={85} fill={C.accent} fillOpacity={0.04} />
                    <ReferenceArea y1={50} y2={70} fill={C.amber}  fillOpacity={0.04} />
                    <Area type="monotone" dataKey="score" stroke={C.gold} strokeWidth={2} fill={C.gold} fillOpacity={0.08} dot={{ r: 3, fill: C.gold }} name="Recovery" />
                  </ComposedChart>
                </ResponsiveContainer>
              </ChartCard>
            </>}

            {/* ── CHRONOTYPE ── */}
            {algo === 'chronotype' && <>
              <ChartCard full title="Sleep Timing — 14 Nights" sub="bedtime and sleep midpoint distribution">
                <ResponsiveContainer width="100%" height={280}>
                  <ComposedChart data={SLEEP_NIGHTS} margin={{ top: 4, right: 20, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={C.line} vertical={false} />
                    <XAxis dataKey="day" tick={{ fontFamily: 'var(--mono)', fontSize: 10, fill: C.text3 }} tickLine={false} axisLine={false} />
                    <YAxis domain={[1260, 1560]} tickFormatter={(v: number) => `${String(Math.floor(v/60)%24).padStart(2,'0')}:00`} tick={{ fontFamily: 'var(--mono)', fontSize: 9, fill: C.text4 }} tickLine={false} axisLine={false} width={44} />
                    <Tooltip contentStyle={TT_STYLE} formatter={(v: unknown, name: unknown) => [typeof v === 'number' ? `${String(Math.floor(v/60)%24).padStart(2,'0')}:${String(v%60).padStart(2,'0')}` : String(v), String(name)] as [string,string]} />
                    <Legend iconType="circle" iconSize={7} wrapperStyle={{ fontFamily: 'var(--mono)', fontSize: 10, paddingTop: 10 }} />
                    {SLEEP_NIGHTS.map((n, i) => n.isWeekend ? <ReferenceArea key={i} x1={n.day} x2={n.day} fill={C.amber} fillOpacity={0.08} /> : null)}
                    <Bar dataKey="bed"  name="Bedtime"  fill={C.purple} fillOpacity={0.5} radius={[3,3,0,0]} />
                    <Line type="monotone" dataKey="mid" stroke={C.gold} strokeWidth={2} dot={{ r: 3, fill: C.gold }} name="Midpoint" />
                  </ComposedChart>
                </ResponsiveContainer>
              </ChartCard>

              <div style={{ background: C.s1, border: `1px solid ${C.line}`, borderRadius: 14, padding: '24px 28px' }}>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: C.text4, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 16 }}>Weekday vs Weekend</div>
                {(['bed','mid'] as const).map(k => {
                  const wd = SLEEP_NIGHTS.filter(n => !n.isWeekend).map(n => n[k]);
                  const we = SLEEP_NIGHTS.filter(n =>  n.isWeekend).map(n => n[k]);
                  const wdMean = Math.round(mn(wd)), weMean = Math.round(mn(we));
                  const jl = Math.abs(weMean - wdMean);
                  const fmt = (m: number) => `${String(Math.floor(m/60)%24).padStart(2,'0')}:${String(m%60).padStart(2,'0')}`;
                  return (
                    <div key={k} style={{ marginBottom: 18 }}>
                      <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: C.text3, marginBottom: 6 }}>{k === 'bed' ? 'Bedtime' : 'Sleep Midpoint'}</div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                        <div style={{ padding: '10px 14px', background: C.s2, borderRadius: 8 }}>
                          <div style={{ fontFamily: 'var(--mono)', fontSize: 14, color: C.text2 }}>{fmt(wdMean)}</div>
                          <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: C.text4, marginTop: 2 }}>Weekdays</div>
                        </div>
                        <div style={{ padding: '10px 14px', background: C.s2, borderRadius: 8 }}>
                          <div style={{ fontFamily: 'var(--mono)', fontSize: 14, color: C.text2 }}>{fmt(weMean)}</div>
                          <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: C.text4, marginTop: 2 }}>Weekends</div>
                        </div>
                        <div style={{ padding: '10px 14px', background: C.s2, borderRadius: 8 }}>
                          <div style={{ fontFamily: 'var(--mono)', fontSize: 14, color: jl > 60 ? C.coral : jl > 30 ? C.amber : C.sage }}>{Math.floor(jl/60)}h {jl%60}m</div>
                          <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: C.text4, marginTop: 2 }}>Social jetlag</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div style={{ background: C.s1, border: `1px solid ${C.line}`, borderRadius: 14, padding: '24px 28px' }}>
                <div style={{ fontFamily: 'var(--serif)', fontWeight: 300, fontSize: 18, letterSpacing: '-0.01em', marginBottom: 10 }}>Social jetlag</div>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: C.text3, lineHeight: 1.7 }}>
                  Social jetlag is the difference between your biological clock (free days) and social schedule (work days). Even 1–2 hours of chronic jetlag is associated with higher BMI, metabolic dysregulation, and mood disruption. Irregular sleep timing compounds SII — shifting the midpoint shifts phase relationships between sleep and circadian regulators including cortisol, melatonin, and core body temperature.
                </div>
              </div>
            </>}
          </>}

        </div>

        <div className="agent-note" style={{ marginTop: 48 }}>
          — Ambient Intelligence · algorithm lab · cyclomatic complexity · DFA · sample entropy · permutation entropy · Hurst · ASTP · SATP · IS · IV · RA · M10/L5 · AGRU · SHAP · fall risk · sleep architecture · SII · HRV · recovery · chronotype · sedentary behavior · breaks/hour · LF/HF · Poincaré · stress index · CGM · TIR · AGP · CV% · MAGE · longitudinal · correlation matrix · health calendar · risk evolution —
        </div>
      </main>
    </div>
  );
}
