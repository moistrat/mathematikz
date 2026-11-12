import { useState } from 'react'
import { MINUS } from '../../math/exact'
import { Frame, LinSlider, Readouts, Seg } from './shared'
import { curve, Plot } from './Solving'

const num = (x: number, d = 3) => (Number.isFinite(x) ? Number(x.toFixed(d)).toString().replace('-', MINUS) : 'undefined')
const SUP = '⁰¹²³⁴⁵⁶⁷⁸⁹'
const sup = (n: number) => String(n).split('').map((d) => SUP[Number(d)]).join('')

/* ------------------------------------------------------------------ terms of an arithmetic or geometric sequence */

export function SeqLab() {
  const [kind, setKind] = useState<'arith' | 'geom'>('arith')
  const [a, setA] = useState(2)
  const [d, setD] = useState(3)
  const [r, setR] = useState(1.5)
  const N = 12
  const term = (n: number) => (kind === 'arith' ? a + (n - 1) * d : a * Math.pow(r, n - 1))
  const terms = Array.from({ length: N }, (_, i) => term(i + 1))
  const maxAbs = Math.max(2, ...terms.map(Math.abs))
  const top = Math.min(60, Math.ceil(maxAbs * 1.1))
  const S = (n: number) => (kind === 'arith' ? (n / 2) * (2 * a + (n - 1) * d) : r === 1 ? a * n : (a * (1 - Math.pow(r, n))) / (1 - r))
  const converges = kind === 'geom' && Math.abs(r) < 1
  return (
    <Frame caption="Each dot is a term. An arithmetic sequence adds the same amount each step, so its dots lie on a straight line. A geometric sequence multiplies by the same factor each step, so its dots follow a curve that grows (|r| > 1), shrinks to 0 (|r| < 1) or alternates (r < 0).">
      <Plot x0={0} x1={N + 1} y0={-top} y1={top} label={`The first ${N} terms of a ${kind === 'arith' ? 'arithmetic' : 'geometric'} sequence`}>
        {(sx, sy) => (
          <>
            {terms.map((t, i) => (Math.abs(t) <= top * 1.02 ? <circle key={i} cx={sx(i + 1)} cy={sy(t)} r={5} className="w-dot" /> : null))}
            <path d={curve((x) => (kind === 'arith' ? a + (x - 1) * d : a * Math.pow(Math.abs(r), x - 1) * (r < 0 ? NaN : 1)), 1, N, sx, sy, Infinity, 100)} className="w-curve alt" />
          </>
        )}
      </Plot>
      <div className="widget-controls">
        <Seg label="Type" value={kind} options={[{ id: 'arith', label: 'arithmetic' }, { id: 'geom', label: 'geometric' }]} onChange={setKind} />
        <div className="two-col">
          <LinSlider label="First term a" value={a} min={-8} max={8} onChange={setA} fmt={(v) => num(v, 0)} />
          {kind === 'arith' ? <LinSlider label="Difference d" value={d} min={-6} max={6} onChange={setD} fmt={(v) => num(v, 0)} /> : <LinSlider label="Ratio r" value={r} min={-2} max={2} step={0.1} onChange={(v) => setR(Math.abs(v) < 0.05 ? 0.1 : v)} fmt={(v) => num(v, 1)} />}
        </div>
        <Readouts items={[
          ['nth term', kind === 'arith' ? `uₙ = ${num(a, 0)} + (n − 1)(${num(d, 0)})` : `uₙ = ${num(a, 0)} × (${num(r, 1)})^(n−1)`],
          ['First five terms', terms.slice(0, 5).map((t) => num(t, 2)).join(', ')],
          ['Sum of the first 10 terms', num(S(10), 2), kind === 'arith' ? 'S = n/2 (2a + (n − 1)d)' : 'S = a(1 − rⁿ)/(1 − r)'],
          ['Sum to infinity', converges ? num(a / (1 - r), 3) : kind === 'geom' ? 'does not exist (|r| ≥ 1)' : 'does not exist', converges ? 'a/(1 − r), because |r| < 1' : undefined],
        ]} />
      </div>
    </Frame>
  )
}

/* ------------------------------------------------------------------ partial sums of a geometric series */

export function PartialSums() {
  const [a, setA] = useState(4)
  const [r, setR] = useState(0.6)
  const N = 20
  const parts: number[] = []
  let s = 0, t = a
  for (let i = 0; i < N; i++) { s += t; parts.push(s); t *= r }
  const L = Math.abs(r) < 1 ? a / (1 - r) : NaN
  const top = Math.min(40, Math.max(6, Math.ceil(Math.max(...parts.map(Math.abs), Math.abs(L) || 0) * 1.15)))
  return (
    <Frame caption="The partial sums Sₙ are the running totals. When |r| < 1 each new term is smaller than the last, so the running total creeps towards a limit: the sum to infinity a/(1 − r). When |r| ≥ 1 the totals run away or bounce without settling.">
      <Plot x0={0} x1={N + 1} y0={-top / 3} y1={top} label="Partial sums of a geometric series">
        {(sx, sy) => (
          <>
            {Number.isFinite(L) && Math.abs(L) <= top && <line x1={sx(0)} x2={sx(N + 1)} y1={sy(L)} y2={sy(L)} className="w-ref" />}
            {parts.map((v, i) => (Math.abs(v) <= top ? <g key={i}><line x1={sx(i + 1)} x2={sx(i + 1)} y1={sy(0)} y2={sy(v)} className="w-axis" /><circle cx={sx(i + 1)} cy={sy(v)} r={4.5} className="w-dot" /></g> : null))}
          </>
        )}
      </Plot>
      <div className="widget-controls">
        <div className="two-col">
          <LinSlider label="First term a" value={a} min={1} max={10} onChange={setA} fmt={(v) => num(v, 0)} />
          <LinSlider label="Ratio r" value={r} min={-1.2} max={1.2} step={0.05} onChange={(v) => setR(Math.abs(v) < 0.04 ? 0.05 : v)} fmt={(v) => num(v, 2)} />
        </div>
        <Readouts items={[
          ['Series', `${num(a, 0)} + ${num(a * r, 2)} + ${num(a * r * r, 2)} + …`],
          ['Partial sums S₁ … S₅', parts.slice(0, 5).map((v) => num(v, 2)).join(', ')],
          ['S₂₀', num(parts[N - 1], 4)],
          ['Sum to infinity', Number.isFinite(L) ? num(L, 4) : 'none: the series diverges', Number.isFinite(L) ? `a/(1 − r), shown as the dashed line; S₂₀ is already within ${num(Math.abs(L - parts[N - 1]), 6)}` : '|r| ≥ 1, so the terms do not shrink'],
        ]} />
      </div>
    </Frame>
  )
}

/* ------------------------------------------------------------------ Pascal's triangle and the binomial theorem */

const choose = (n: number, k: number) => { let c = 1; for (let i = 1; i <= k; i++) c = (c * (n - k + i)) / i; return Math.round(c) }

export function Pascal() {
  const [n, setN] = useState(5)
  const rows = Array.from({ length: 11 }, (_, i) => Array.from({ length: i + 1 }, (_, k) => choose(i, k)))
  const expansion = rows[n].map((c, k) => {
    const pa = n - k, pb = k
    const body = `${pa ? `a${pa > 1 ? sup(pa) : ''}` : ''}${pb ? `b${pb > 1 ? sup(pb) : ''}` : ''}` || '1'
    return `${c === 1 && body !== '1' ? '' : c}${body}`
  }).join(' + ')
  return (
    <Frame caption="Each number in Pascal's triangle is the sum of the two above it. Row n lists the coefficients nC0, nC1, … of the expansion of (a + b)ⁿ, and the powers of a fall from n to 0 while the powers of b rise from 0 to n. Change n to see the row and its expansion.">
      <div className="pascal" role="img" aria-label={`Pascal's triangle with row ${n} highlighted`}>
        {rows.map((row, i) => (
          <div key={i} className={`pascal-row ${i === n ? 'on' : ''}`}>
            <span className="pascal-n">{i}</span>
            {row.map((c, k) => <b key={k} className="pascal-cell">{c}</b>)}
          </div>
        ))}
      </div>
      <div className="widget-controls">
        <LinSlider label="Power n" value={n} min={0} max={10} onChange={setN} fmt={(v) => String(v)} />
        <Readouts items={[
          [`(a + b)${n > 1 ? sup(n) : n === 1 ? '' : '⁰'}`, expansion],
          ['Row n coefficients', rows[n].join(', '), 'these are nC0, nC1, …, nCn'],
          ['Sum of the row', String(2 ** n), `setting a = b = 1 gives (1 + 1)ⁿ = 2ⁿ`],
          ['Term k (from 0)', `nCk · a^(n−k) b^k`, `for example the term with k = 2 is ${n >= 2 ? `${choose(n, 2)}a${n - 2 > 1 ? sup(n - 2) : n - 2 === 1 ? '' : '⁰'}b²` : 'not present yet'}`],
        ]} />
      </div>
    </Frame>
  )
}

/* ------------------------------------------------------------------ a cobweb diagram */

export function Cobweb() {
  const [m, setM] = useState(0.6)
  const [c, setC] = useState(2)
  const [u1, setU1] = useState(1)
  const steps = 14
  const f = (x: number) => m * x + c
  const L = Math.abs(m - 1) < 1e-9 ? NaN : c / (1 - m)
  const path: [number, number][] = []
  let x = u1
  path.push([x, 0])
  const vals = [u1]
  for (let i = 0; i < steps; i++) { const y = f(x); path.push([x, y]); path.push([y, y]); x = y; vals.push(x) }
  const lo = -2, hi = 12
  return (
    <Frame caption="The cobweb shows uₙ₊₁ = f(uₙ) with f(x) = mx + c. Start at u₁ on the x-axis, go up to the line y = f(x), across to the line y = x (this turns the output into the next input), and repeat. If |m| < 1 the web spirals in to the fixed point, where the two lines cross; if |m| > 1 it spirals outwards.">
      <Plot x0={lo} x1={hi} y0={lo} y1={hi} label={`Cobweb diagram of u(n+1) = ${m} u(n) + ${c}`}>
        {(sx, sy) => (
          <>
            <line x1={sx(lo)} y1={sy(lo)} x2={sx(hi)} y2={sy(hi)} className="w-ref" />
            <path d={curve(f, lo, hi, sx, sy, Infinity, 2)} className="w-curve alt" />
            <polyline points={path.map(([px, py]) => `${sx(px).toFixed(1)},${sy(py).toFixed(1)}`).join(' ')} fill="none" className="w-curve" />
            {Number.isFinite(L) && L > lo && L < hi && <circle cx={sx(L)} cy={sy(L)} r={6} className="w-open" />}
          </>
        )}
      </Plot>
      <div className="widget-controls">
        <div className="two-col">
          <LinSlider label="Multiplier m" value={m} min={-1.4} max={1.4} step={0.1} onChange={setM} fmt={(v) => num(v, 1)} />
          <LinSlider label="Constant c" value={c} min={-4} max={6} onChange={setC} fmt={(v) => num(v, 0)} />
          <LinSlider label="Start u₁" value={u1} min={-2} max={10} onChange={setU1} fmt={(v) => num(v, 0)} />
        </div>
        <Readouts items={[
          ['Rule', `uₙ₊₁ = ${num(m, 1)}uₙ + ${num(c, 0)}`],
          ['First terms', vals.slice(0, 6).map((v) => num(v, 3)).join(', ')],
          ['Fixed point L = c/(1 − m)', Number.isFinite(L) ? num(L, 4) : 'none (m = 1)', 'the value where L = mL + c'],
          ['Converges?', Math.abs(m) < 1 ? 'yes: |m| < 1, the terms approach L' : 'no: |m| ≥ 1, the terms move away from L (unless u₁ = L)'],
        ]} />
      </div>
    </Frame>
  )
}
