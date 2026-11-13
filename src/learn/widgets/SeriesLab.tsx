import { useState } from 'react'
import { MINUS } from '../../math/exact'
import { Arrow, H as PH, Plane, W as PW } from './ComplexVec'
import { Frame, LinSlider, Readouts, Seg } from './shared'
import { curve, Plot } from './Solving'

const num = (x: number, d = 4) => (Number.isFinite(x) ? Number(x.toFixed(d)).toString().replace('-', MINUS) : 'undefined')
const fact = (n: number) => { let f = 1; for (let i = 2; i <= n; i++) f *= i; return f }

/* ------------------------------------------------------------------ partial sums of a series */

interface Ser { id: string; label: string; term: (n: number) => number; limit?: number; limitText?: string; verdict: string }
const SERS: Ser[] = [
  { id: 'geo', label: 'Σ (1/2)ⁿ', term: (n) => 0.5 ** n, limit: 1, limitText: '1', verdict: 'Geometric with |r| < 1: converges to 1.' },
  { id: 'harm', label: 'Σ 1/n', term: (n) => 1 / n, verdict: 'The harmonic series diverges, though very slowly: the partial sums keep climbing like ln N.' },
  { id: 'p2', label: 'Σ 1/n²', term: (n) => 1 / (n * n), limit: Math.PI ** 2 / 6, limitText: 'π²/6 ≈ 1.6449', verdict: 'A p-series with p = 2 > 1: converges (to π²/6, a famous result of Euler).' },
  { id: 'alt', label: 'Σ (−1)ⁿ⁺¹/n', term: (n) => (-1) ** (n + 1) / n, limit: Math.LN2, limitText: 'ln 2 ≈ 0.6931', verdict: 'The alternating series test says it converges, to ln 2. It is only conditionally convergent: the absolute values give the harmonic series.' },
  { id: 'root', label: 'Σ 1/√n', term: (n) => 1 / Math.sqrt(n), verdict: 'A p-series with p = 1/2 ≤ 1: diverges, and faster than the harmonic series.' },
  { id: 'dt', label: 'Σ n/(n + 1)', term: (n) => n / (n + 1), verdict: 'The terms tend to 1, not 0, so the series diverges (the divergence test).' },
]

export function SeriesConv() {
  const [id, setId] = useState('geo')
  const [N, setN] = useState(20)
  const s = SERS.find((k) => k.id === id) ?? SERS[0]
  const sums: number[] = []
  let t = 0
  for (let n = 1; n <= 60; n++) { t += s.term(n); sums.push(t) }
  const hi = Math.max(...sums.slice(0, 60)), lo = Math.min(0, ...sums)
  const top = s.limit !== undefined ? Math.max(s.limit * 1.3, hi * 1.05) : hi * 1.05
  return (
    <Frame caption="Each dot is a partial sum S(N), the total of the first N terms. If the dots settle towards a horizontal line, the series converges to that number. If they climb without bound, wander or keep jumping, it diverges. Compare the geometric series, the p-series 1/n² and 1/n, and the alternating harmonic series, whose dots straddle the limit.">
      <Plot x0={0} x1={61} y0={Math.min(lo - 0.1, -0.1)} y1={top} label={`Partial sums of ${s.label}`}>
        {(sx, sy) => (
          <>
            {s.limit !== undefined && <line x1={sx(0)} x2={sx(61)} y1={sy(s.limit)} y2={sy(s.limit)} className="w-ref" />}
            {sums.map((v, i) => <circle key={i} cx={sx(i + 1)} cy={sy(v)} r={i + 1 === N ? 6 : 3.5} className="w-dot" opacity={i + 1 <= N ? 1 : 0.28} />)}
          </>
        )}
      </Plot>
      <div className="widget-controls">
        <Seg label="Series" value={id} options={SERS.map((k) => ({ id: k.id, label: k.label }))} onChange={setId} />
        <LinSlider label="Number of terms N" value={N} min={1} max={60} onChange={setN} fmt={(v) => String(v)} />
        <Readouts items={[[`S(${N})`, num(sums[N - 1], 5)], ['Next term', num(s.term(N + 1), 5)], ['Limit', s.limitText ?? 'none (diverges)'], ['Verdict', s.verdict]]} />
      </div>
    </Frame>
  )
}

/* ------------------------------------------------------------------ Taylor polynomials */

interface TF { id: string; label: string; f: (x: number) => number; coef: (k: number) => number; x0: number; x1: number; y0: number; y1: number; radius: number }
const TFS: TF[] = [
  { id: 'sin', label: 'sin x', f: Math.sin, coef: (k) => (k % 2 ? (-1) ** ((k - 1) / 2) / fact(k) : 0), x0: -7, x1: 7, y0: -3, y1: 3, radius: Infinity },
  { id: 'cos', label: 'cos x', f: Math.cos, coef: (k) => (k % 2 === 0 ? (-1) ** (k / 2) / fact(k) : 0), x0: -7, x1: 7, y0: -3, y1: 3, radius: Infinity },
  { id: 'exp', label: 'eˣ', f: Math.exp, coef: (k) => 1 / fact(k), x0: -4, x1: 3, y0: -2, y1: 12, radius: Infinity },
  { id: 'ln', label: 'ln(1 + x)', f: (x) => Math.log(1 + x), coef: (k) => (k === 0 ? 0 : (-1) ** (k + 1) / k), x0: -0.95, x1: 3, y0: -3, y1: 3, radius: 1 },
  { id: 'geo', label: '1/(1 − x)', f: (x) => 1 / (1 - x), coef: () => 1, x0: -2, x1: 2, y0: -3, y1: 6, radius: 1 },
]

export function TaylorLab() {
  const [id, setId] = useState('sin')
  const [deg, setDeg] = useState(5)
  const [x, setX] = useState(1.5)
  const f = TFS.find((k) => k.id === id) ?? TFS[0]
  const P = (u: number) => { let s = 0; for (let k = 0; k <= deg; k++) s += f.coef(k) * u ** k; return s }
  const xs = Math.max(f.x0 + 0.05, Math.min(f.x1, x))
  const terms = Array.from({ length: deg + 1 }, (_, k) => f.coef(k)).map((c, k) => ({ c, k })).filter((t) => t.c !== 0)
  const poly = terms.map((t, i) => { const mag = Math.abs(t.c); const body = `${t.k === 0 ? '' : t.k === 1 ? 'x' : `x^${t.k}`}`; const cs = Math.abs(mag - 1) < 1e-12 && t.k > 0 ? '' : Number.isInteger(1 / mag) && mag !== 1 ? `1/${Math.round(1 / mag)}·` : num(mag, 4); return `${i === 0 ? (t.c < 0 ? '−' : '') : t.c < 0 ? ' − ' : ' + '}${cs}${body}`.replace('·x', 'x').replace('·', '') }).join('') || '0'
  return (
    <Frame caption="The Maclaurin polynomial of degree n is the best polynomial fit at x = 0: it matches the function and its first n derivatives there. Raise the degree and the polynomial hugs the curve over a wider window. The series for ln(1 + x) and 1/(1 − x) only work for |x| < 1: outside that radius the polynomials fly off however high the degree.">
      <Plot x0={f.x0} x1={f.x1} y0={f.y0} y1={f.y1} label={`The function ${f.label} and its Maclaurin polynomial of degree ${deg}`}>
        {(sx, sy) => (
          <>
            <path d={curve(f.f, f.x0, f.x1, sx, sy, 6, 500)} className="w-curve" />
            <path d={curve(P, f.x0, f.x1, sx, sy, 20, 500)} className="w-curve alt" />
            <line x1={sx(xs)} x2={sx(xs)} y1={0} y2={300} className="w-ref" />
          </>
        )}
      </Plot>
      <div className="widget-controls">
        <Seg label="Function" value={id} options={TFS.map((k) => ({ id: k.id, label: k.label }))} onChange={setId} />
        <div className="two-col">
          <LinSlider label="Degree n" value={deg} min={0} max={14} onChange={setDeg} fmt={(v) => String(v)} />
          <LinSlider label="x" value={xs} min={f.x0 + 0.05} max={f.x1} step={0.05} onChange={setX} fmt={(v) => num(v, 2)} />
        </div>
        <Readouts items={[['Polynomial', poly], [`f(${num(xs, 2)})`, num(f.f(xs), 5)], [`P(${num(xs, 2)})`, num(P(xs), 5)], ['Error', num(P(xs) - f.f(xs), 5), Math.abs(xs) >= f.radius ? 'outside the radius of convergence' : undefined]]} />
      </div>
    </Frame>
  )
}

/* ------------------------------------------------------------------ the interval of convergence */

interface PS { id: string; label: string; R: number; left: boolean; right: boolean; note: string }
const PSS: PS[] = [
  { id: 'a', label: '(x − a)ⁿ / (n 2ⁿ)', R: 2, left: true, right: false, note: 'Left end: Σ(−1)ⁿ/n converges. Right end: the harmonic series diverges.' },
  { id: 'b', label: '(x − a)ⁿ / (n² 2ⁿ)', R: 2, left: true, right: true, note: 'Both ends give a convergent Σ 1/n².' },
  { id: 'c', label: 'n (x − a)ⁿ / 2ⁿ', R: 2, left: false, right: false, note: 'At both ends the terms do not tend to 0.' },
  { id: 'd', label: '(x − a)ⁿ / n!', R: Infinity, left: true, right: true, note: 'The ratio tends to 0 for every x: it converges everywhere.' },
]

export function ConvInterval() {
  const [id, setId] = useState('a')
  const [a, setA] = useState(1)
  const [x, setX] = useState(2)
  const p = PSS.find((k) => k.id === id) ?? PSS[0]
  const d = x - a
  const inside = Math.abs(d) < p.R || (Math.abs(d - p.R) < 1e-9 && p.right) || (Math.abs(d + p.R) < 1e-9 && p.left) || p.R === Infinity
  const L = -6, Rr = 8, W = 640
  const sx = (v: number) => ((v - L) / (Rr - L)) * W
  const lo = a - p.R, hi = a + p.R
  return (
    <Frame caption="A power series converges on an interval centred at x = a, with radius R from the ratio test. Inside the interval it converges, outside it diverges, and at the two endpoints you must test the series separately (a filled dot means the endpoint is included). Move x and watch the verdict.">
      <svg viewBox={`0 0 ${W} 120`} className="wsvg" role="img" aria-label="The interval of convergence on a number line">
        <line x1={0} x2={W} y1={70} y2={70} className="w-axis" />
        {Array.from({ length: Rr - L + 1 }, (_, i) => L + i).map((t) => <g key={t}><line x1={sx(t)} x2={sx(t)} y1={64} y2={76} className="w-axis" /><text x={sx(t)} y={96} textAnchor="middle" className="w-t sm">{t < 0 ? `${MINUS}${-t}` : t}</text></g>)}
        {p.R === Infinity ? <rect x={0} y={62} width={W} height={16} className="w-area" /> : <rect x={sx(lo)} y={62} width={sx(hi) - sx(lo)} height={16} className="w-area" />}
        {p.R !== Infinity && <><circle cx={sx(lo)} cy={70} r={7} className={p.left ? 'w-dot' : 'w-joint'} /><circle cx={sx(hi)} cy={70} r={7} className={p.right ? 'w-dot' : 'w-joint'} /></>}
        <circle cx={sx(a)} cy={70} r={3} className="w-axis" />
        <text x={sx(a)} y={50} textAnchor="middle" className="w-t sm">centre a</text>
        <polygon points={`${sx(x)},62 ${sx(x) - 6},46 ${sx(x) + 6},46`} className={inside ? 'w-dot' : 'w-joint'} />
      </svg>
      <div className="widget-controls">
        <Seg label="Series" value={id} options={PSS.map((k) => ({ id: k.id, label: k.label }))} onChange={setId} />
        <div className="two-col">
          <LinSlider label="Centre a" value={a} min={-3} max={5} onChange={setA} fmt={(v) => num(v, 0)} />
          <LinSlider label="Test point x" value={x} min={-5} max={7} step={0.5} onChange={setX} fmt={(v) => num(v, 1)} />
        </div>
        <Readouts items={[['Radius of convergence', p.R === Infinity ? '∞' : String(p.R)], ['Interval of convergence', p.R === Infinity ? 'all real numbers' : `${p.left ? '[' : '('}${num(lo, 0)}, ${num(hi, 0)}${p.right ? ']' : ')'}`, p.note], [`At x = ${num(x, 1)}`, inside ? 'the series converges' : 'the series diverges']]} />
      </div>
    </Frame>
  )
}

/* ------------------------------------------------------------------ the gradient on a contour map */

interface Surf { id: string; label: string; f: (x: number, y: number) => number; fx: (x: number, y: number) => number; fy: (x: number, y: number) => number }
const SURFS: Surf[] = [
  { id: 'bowl', label: 'x² + y²', f: (x, y) => x * x + y * y, fx: (x) => 2 * x, fy: (_, y) => 2 * y },
  { id: 'saddle', label: 'x² − y²', f: (x, y) => x * x - y * y, fx: (x) => 2 * x, fy: (_, y) => -2 * y },
  { id: 'slope', label: 'x + 2y', f: (x, y) => x + 2 * y, fx: () => 1, fy: () => 2 },
  { id: 'wave', label: 'sin x · cos y', f: (x, y) => Math.sin(x) * Math.cos(y), fx: (x, y) => Math.cos(x) * Math.cos(y), fy: (x, y) => -Math.sin(x) * Math.sin(y) },
]

export function GradLab() {
  const [id, setId] = useState('bowl')
  const [px, setPx] = useState(1)
  const [py, setPy] = useState(1)
  const [ang, setAng] = useState(45)
  const s = SURFS.find((k) => k.id === id) ?? SURFS[0]
  const reach = 3
  const unit = (PH / 2 - 8) / reach
  const sc = (x: number, y: number): [number, number] => [PW / 2 + x * unit, PH / 2 - y * unit]
  const N = 30, step = (2 * reach) / N
  let lo = Infinity, hi = -Infinity
  for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) { const v = s.f(-reach + (i + 0.5) * step, -reach + (j + 0.5) * step); lo = Math.min(lo, v); hi = Math.max(hi, v) }
  const gx = s.fx(px, py), gy = s.fy(px, py), gl = Math.hypot(gx, gy)
  const u = [Math.cos((ang * Math.PI) / 180), Math.sin((ang * Math.PI) / 180)]
  const dd = gx * u[0] + gy * u[1]
  const o = sc(px, py)
  const gs = gl > 1e-9 ? 1.2 / Math.max(1, gl) : 0
  return (
    <Frame caption="A contour map: lighter colour means a higher value of f. The red arrow is the gradient ∇f = (∂f/∂x, ∂f/∂y). It always points in the direction of steepest increase and is perpendicular to the level curve through the point. The dashed arrow is a chosen direction u: the directional derivative ∇f · u is the rate of change of f that way, and it is greatest when u points along the gradient.">
      <svg viewBox={`0 0 ${PW} ${PH}`} className="wsvg" role="img" aria-label="A contour map of a function of two variables with its gradient at a point">
        {Array.from({ length: N }, (_, i) => Array.from({ length: N }, (_, j) => {
          const x = -reach + i * step, y = -reach + (j + 1) * step, v = (s.f(x + step / 2, y - step / 2) - lo) / (hi - lo || 1)
          const [cx, cy] = sc(x, y)
          return <rect key={`${i}-${j}`} x={cx} y={cy} width={step * unit + 0.5} height={step * unit + 0.5} style={{ fill: `color-mix(in srgb, var(--accent) ${Math.round(v * 80 + 8)}%, var(--canvas-bg))` }} />
        }))}
        <line x1={0} x2={PW} y1={PH / 2} y2={PH / 2} className="w-axis" /><line x1={PW / 2} x2={PW / 2} y1={0} y2={PH} className="w-axis" />
        {gl > 1e-9 && <Arrow x1={o[0]} y1={o[1]} x2={sc(px + gx * gs, py + gy * gs)[0]} y2={sc(px + gx * gs, py + gy * gs)[1]} cls="red" label="∇f" />}
        <Arrow x1={o[0]} y1={o[1]} x2={sc(px + u[0], py + u[1])[0]} y2={sc(px + u[0], py + u[1])[1]} cls="alt" label="u" />
        <circle cx={o[0]} cy={o[1]} r={5} className="w-dot" />
      </svg>
      <div className="widget-controls">
        <Seg label="Function" value={id} options={SURFS.map((k) => ({ id: k.id, label: k.label }))} onChange={setId} />
        <div className="two-col">
          <LinSlider label="x" value={px} min={-2.5} max={2.5} step={0.1} onChange={setPx} fmt={(v) => num(v, 1)} />
          <LinSlider label="y" value={py} min={-2.5} max={2.5} step={0.1} onChange={setPy} fmt={(v) => num(v, 1)} />
          <LinSlider label="Direction u (angle)" value={ang} min={0} max={355} step={5} onChange={setAng} fmt={(v) => `${v}°`} />
        </div>
        <Readouts items={[[`f(${num(px, 1)}, ${num(py, 1)})`, num(s.f(px, py), 3)], ['∂f/∂x, ∂f/∂y', `${num(gx, 3)},  ${num(gy, 3)}`], ['|∇f|', num(gl, 3), 'the steepest rate of increase'], ['Directional derivative along u', num(dd, 3), 'cannot exceed |∇f|']]} />
      </div>
    </Frame>
  )
}

/* ------------------------------------------------------------------ a double integral as a sum over a grid */

export function DoubleInt() {
  const [id, setId] = useState('xy')
  const [n, setN] = useState(4)
  const a = 3, b = 2
  const fs: Record<string, { f: (x: number, y: number) => number; exact: number; text: string }> = {
    xy: { f: (x, y) => x * y, exact: (a * a * b * b) / 4, text: '9' },
    sum: { f: (x, y) => x * x + y, exact: (a ** 3 * b) / 3 + (a * b * b) / 2, text: '24' },
    pk: { f: (x, y) => 6 - x - y, exact: 6 * a * b - (a * a * b) / 2 - (a * b * b) / 2, text: '21' },
  }
  const d = fs[id] ?? fs.xy
  const hx = a / n, hy = b / n
  let sum = 0
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) sum += d.f((i + 0.5) * hx, (j + 0.5) * hy) * hx * hy
  let hi = 0
  for (let i = 0; i <= 12; i++) for (let j = 0; j <= 12; j++) hi = Math.max(hi, d.f((i * a) / 12, (j * b) / 12))
  const unit = 100
  return (
    <Frame caption="Cut the rectangle into an n × n grid. Over each cell, the function has a height f at the cell's centre, and the box of that height and the cell's area contributes f × ΔA to the volume. Adding all the boxes approximates the double integral, the volume under the surface z = f(x, y). As the grid is refined the sum settles on the exact value.">
      <svg viewBox={`0 0 ${PW} ${PH}`} className="wsvg" role="img" aria-label="A grid over a rectangle coloured by the value of the function">
        {Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => {
          const v = d.f((i + 0.5) * hx, (j + 0.5) * hy) / (hi || 1)
          return <rect key={`${i}-${j}`} x={80 + i * hx * unit} y={PH - 50 - (j + 1) * hy * unit} width={hx * unit} height={hy * unit} style={{ fill: `color-mix(in srgb, var(--accent) ${Math.round(Math.max(0, Math.min(1, v)) * 80 + 8)}%, var(--canvas-bg))`, stroke: 'var(--grid)' }} />
        }))}
        <text x={80 + (a * unit) / 2} y={PH - 22} textAnchor="middle" className="w-t sm">x from 0 to {a}</text>
        <text x={60} y={PH - 50 - (b * unit) / 2} textAnchor="end" className="w-t sm">y: 0 to {b}</text>
      </svg>
      <div className="widget-controls">
        <Seg label="Function" value={id} options={[{ id: 'xy', label: 'xy' }, { id: 'sum', label: 'x² + y' }, { id: 'pk', label: '6 − x − y' }]} onChange={setId} />
        <LinSlider label="Grid size n × n" value={n} min={1} max={20} onChange={setN} fmt={(v) => `${v} × ${v}`} />
        <Readouts items={[['Sum of the boxes', num(sum, 4)], ['Exact double integral', d.text, `= ${num(d.exact, 4)}`], ['Error', num(sum - d.exact, 4)]]} />
      </div>
    </Frame>
  )
}
void Plane
