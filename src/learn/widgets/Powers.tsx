import { useMemo, useState } from 'react'
import { MINUS } from '../../math/exact'
import { extractRoot } from '../../math/radicals'
import { Frame, LinSlider, Readouts, Seg } from './shared'
import { curve, Plot } from './Solving'

const sup = (n: number) => String(n).split('').map((d) => '⁰¹²³⁴⁵⁶⁷⁸⁹'[Number(d)]).join('')
const num = (x: number, d = 4) => (Number.isFinite(x) ? Number(x.toFixed(d)).toString().replace('-', MINUS) : 'undefined')

/* ------------------------------------------------------------------ exponential and logarithm as mirror images */

type Base = '2' | '3' | '10' | 'e' | '0.5'
const BASES: { id: Base; label: string }[] = [{ id: '2', label: 'b = 2' }, { id: '3', label: 'b = 3' }, { id: '10', label: 'b = 10' }, { id: 'e', label: 'b = e' }, { id: '0.5', label: 'b = ½' }]
const baseValue = (b: Base) => (b === 'e' ? Math.E : Number(b))

export function ExpLog() {
  const [b, setB] = useState<Base>('2')
  const [x, setX] = useState(2)
  const base = baseValue(b)
  const ln = Math.log(base)
  const exp = (t: number) => Math.pow(base, t)
  const log = (t: number) => (t > 0 ? Math.log(t) / ln : NaN)
  const name = b === 'e' ? 'e' : b === '0.5' ? '½' : b
  const y = exp(x)
  return (
    <Frame caption="y = bˣ and y = log_b x are inverse functions, so each graph is the other reflected in the dashed line y = x. The exponential never reaches zero (the x-axis is its asymptote); the logarithm never reaches x = 0. Move x to see the logarithm undo the power.">
      <Plot x0={-5} x1={9} y0={-5} y1={9} label={`Graphs of y = ${name}^x and y = log base ${name} of x`}>
        {(sx, sy) => (
          <>
            <line x1={sx(-5)} y1={sy(-5)} x2={sx(9)} y2={sy(9)} className="w-ref" />
            <path d={curve(exp, -5, 9, sx, sy, Infinity, 500)} className="w-curve" />
            <path d={curve(log, 0.0005, 9, sx, sy, Infinity, 900)} className="w-curve alt" />
            <circle cx={sx(0)} cy={sy(1)} r={5} className="w-dot" />
            <circle cx={sx(1)} cy={sy(0)} r={5} className="w-dot" />
            {y < 9 && y > -5 && x > -5 && <><circle cx={sx(x)} cy={sy(y)} r={6.5} className="w-open" /><circle cx={sx(y)} cy={sy(x)} r={6.5} className="w-open" /></>}
          </>
        )}
      </Plot>
      <div className="widget-controls">
        <Seg label="Base" value={b} options={BASES} onChange={setB} />
        <LinSlider label="x" value={x} min={-3} max={4} step={0.5} onChange={setX} fmt={(v) => num(v, 1)} />
        <Readouts items={[
          [`${name}^x at x = ${num(x, 1)}`, num(y), 'a point on the exponential curve'],
          [`log base ${name} of ${num(y)}`, num(Math.log(y) / ln), 'the mirror point: the logarithm undoes the power and returns x'],
          ['Fixed points', '(0, 1) and (1, 0)', 'b⁰ = 1 and log_b 1 = 0, for every base'],
          ['Behaviour', base > 1 ? 'increasing: both curves rise' : 'decreasing: both curves fall', base > 1 ? 'for a base above 1, growth' : 'for a base between 0 and 1, decay'],
        ]} />
      </div>
    </Frame>
  )
}

/* ------------------------------------------------------------------ pulling factors out of a root */

function primeFactors(n: number): number[] {
  const out: number[] = []
  let m = n
  for (let p = 2; p * p <= m; p++) while (m % p === 0) { out.push(p); m /= p }
  if (m > 1) out.push(m)
  return out
}

export function RadicalFactor() {
  const [n, setN] = useState(72)
  const [k, setK] = useState<'2' | '3'>('2')
  const idx = Number(k)
  const { outside, inside } = useMemo(() => extractRoot(n, idx), [n, idx])
  const fs = useMemo(() => primeFactors(n), [n])
  // group equal primes into complete sets of size idx (they leave the root) and leftovers (they stay)
  const groups = useMemo(() => {
    const counts = new Map<number, number>()
    fs.forEach((p) => counts.set(p, (counts.get(p) ?? 0) + 1))
    const out: { p: number; leaves: boolean }[][] = [], rest: { p: number; leaves: boolean }[] = []
    for (const [p, c] of counts) {
      for (let i = 0; i < Math.floor(c / idx); i++) out.push(Array.from({ length: idx }, () => ({ p, leaves: true })))
      for (let i = 0; i < c % idx; i++) rest.push({ p, leaves: false })
    }
    return { out, rest }
  }, [fs, idx])
  const sign = idx === 2 ? '√' : '∛'
  const result = inside === 1 ? String(outside) : `${outside === 1 ? '' : outside}${sign}${inside}`
  return (
    <Frame caption="Break the number into prime factors. Every complete group of two (for a square root) or three (for a cube root) equal primes leaves the root as a single number; whatever is left over stays inside.">
      <div className="widget-controls">
        <Seg label="Root" value={k} options={[{ id: '2', label: 'square root' }, { id: '3', label: 'cube root' }]} onChange={setK} />
        <LinSlider label="Number" value={n} min={2} max={500} onChange={setN} fmt={(v) => String(v)} />
        <div className="chip-row" aria-label={`Prime factors of ${n}`}>
          {groups.out.map((g, i) => <span key={`g${i}`} className="chip-group out">{g.map((c, j) => <b key={j} className="chip">{c.p}</b>)}</span>)}
          {groups.rest.map((c, i) => <b key={`r${i}`} className="chip stay">{c.p}</b>)}
        </div>
        <Readouts items={[
          ['Prime factors', fs.join(' × ')],
          ['Leaves the root', groups.out.length ? groups.out.map((g) => g[0].p).join(' × ') + ` = ${outside}` : 'nothing', `each complete group of ${idx} becomes one factor`],
          ['Stays inside', groups.rest.length ? groups.rest.map((c) => c.p).join(' × ') + ` = ${inside}` : '1', undefined],
          [`${sign}${n}`, result, inside === 1 ? `a perfect ${idx === 2 ? 'square' : 'cube'}: the root is a whole number` : idx === 2 ? `${n} = ${outside * outside} × ${inside}` : `${n} = ${outside ** 3} × ${inside}`],
        ]} />
      </div>
    </Frame>
  )
}

/* ------------------------------------------------------------------ the laws, with live numbers */

export function LogLab() {
  const [base, setBase] = useState<'2' | '3' | '10' | 'e'>('2')
  const [A, setA] = useState(8)
  const [B, setB] = useState(4)
  const [p, setP] = useState(3)
  const lg = (v: number) => Math.log(v) / Math.log(base === 'e' ? Math.E : Number(base))
  const name = base === 'e' ? 'ln' : `log${base === '10' ? '₁₀' : base === '2' ? '₂' : '₃'}`
  const row = (label: string, left: number, right: number, note: string): [string, string, string] => [label, `${num(left)} = ${num(right)}`, Math.abs(left - right) < 1e-9 ? `✓ ${note}` : note]
  return (
    <Frame caption="Each law is an identity: the two sides always agree. Change the numbers and the base, and compare the two columns of digits.">
      <div className="widget-controls">
        <Seg label="Base" value={base} options={[{ id: '2', label: '2' }, { id: '3', label: '3' }, { id: '10', label: '10' }, { id: 'e', label: 'e (ln)' }]} onChange={setBase} />
        <div className="two-col">
          <LinSlider label="A" value={A} min={1} max={64} onChange={setA} fmt={(v) => String(v)} />
          <LinSlider label="B" value={B} min={1} max={64} onChange={setB} fmt={(v) => String(v)} />
          <LinSlider label="Power p" value={p} min={-3} max={5} onChange={setP} fmt={(v) => String(v).replace('-', MINUS)} />
        </div>
        <Readouts items={[
          [`${name} A  and  ${name} B`, `${num(lg(A))}  and  ${num(lg(B))}`],
          row(`${name}(AB)  =  ${name} A + ${name} B`, lg(A * B), lg(A) + lg(B), 'product law'),
          row(`${name}(A/B)  =  ${name} A ${MINUS} ${name} B`, lg(A / B), lg(A) - lg(B), 'quotient law'),
          row(`${name}(A${p < 0 ? `⁻${sup(-p)}` : sup(p)})  =  p · ${name} A`, lg(Math.pow(A, p)), p * lg(A), 'power law'),
          ['Change of base', `${num(lg(A))} = ln A / ln b`, 'every logarithm is a ratio of natural logs'],
        ]} />
      </div>
    </Frame>
  )
}
