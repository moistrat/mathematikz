import { useState } from 'react'
import { fmtDeg, fmtPi, MINUS } from '../../math/exact'
import { Frame, LinSlider, Readouts, Seg } from './shared'
import { curve, Plot } from './Solving'

const rad = (d: number) => (d * Math.PI) / 180
const deg = (r: number) => (r * 180) / Math.PI
const num = (x: number, d = 3) => (Number.isFinite(x) ? Number(x.toFixed(d)).toString().replace('-', MINUS) : 'undefined')

/** x-axis ticks at multiples of π/2 (labelled) between lo and hi, in radians */
const piTicks = (lo: number, hi: number): { x: number; label: string }[] => {
  const out: { x: number; label: string }[] = []
  for (let k = Math.ceil((lo / Math.PI) * 2 - 1e-9); k <= Math.floor((hi / Math.PI) * 2 + 1e-9); k++) out.push({ x: (k * Math.PI) / 2, label: k === 0 ? '' : fmtPi(k * 90) })
  return out
}

/* ------------------------------------------------------------------ right-angled triangle */

export function RightTriangle() {
  const [th, setTh] = useState(35)
  const [known, setKnown] = useState<'hyp' | 'adj' | 'opp'>('hyp')
  const [len, setLen] = useState(10)
  const hyp = known === 'hyp' ? len : known === 'adj' ? len / Math.cos(rad(th)) : len / Math.sin(rad(th))
  const adj = hyp * Math.cos(rad(th)), opp = hyp * Math.sin(rad(th))
  const sc = 230 / Math.max(hyp, 1e-6)
  const X0 = 40, Y0 = 250, X1 = X0 + adj * sc, Y1 = Y0 - opp * sc
  return (
    <Frame caption="Name the sides from the marked angle θ: the hypotenuse is opposite the right angle, the opposite side faces θ, the adjacent side touches θ. SOH CAH TOA: sin θ = opposite / hypotenuse, cos θ = adjacent / hypotenuse, tan θ = opposite / adjacent.">
      <svg viewBox="0 0 640 290" className="wsvg" role="img" aria-label={`Right-angled triangle with angle ${th} degrees`}>
        <polygon points={`${X0},${Y0} ${X1},${Y0} ${X1},${Y1}`} fill="none" className="w-curve" />
        <rect x={X1 - 14} y={Y0 - 14} width={14} height={14} fill="none" className="w-axis" />
        <path d={`M ${X0 + 44} ${Y0} A 44 44 0 0 0 ${X0 + 44 * Math.cos(rad(th))} ${Y0 - 44 * Math.sin(rad(th))}`} fill="none" className="w-ref" />
        <text x={X0 + 56} y={Y0 - 8} className="w-t accent">θ = {th}°</text>
        <text x={(X0 + X1) / 2} y={Y0 + 20} textAnchor="middle" className="w-t">adjacent {num(adj, 2)}</text>
        <text x={X1 + 10} y={(Y0 + Y1) / 2} className="w-t">opposite {num(opp, 2)}</text>
        <text x={(X0 + X1) / 2 - 24} y={(Y0 + Y1) / 2 - 10} textAnchor="end" className="w-t">hypotenuse {num(hyp, 2)}</text>
      </svg>
      <div className="widget-controls">
        <Seg label="Known side" value={known} options={[{ id: 'hyp', label: 'hypotenuse' }, { id: 'adj', label: 'adjacent' }, { id: 'opp', label: 'opposite' }]} onChange={setKnown} />
        <div className="two-col">
          <LinSlider label="Angle θ" value={th} min={5} max={85} onChange={setTh} fmt={(v) => `${v}°`} />
          <LinSlider label="Known length" value={len} min={2} max={20} onChange={setLen} fmt={(v) => String(v)} />
        </div>
        <Readouts items={[
          ['sin θ  =  opposite / hypotenuse', `${num(opp, 2)} / ${num(hyp, 2)} = ${num(Math.sin(rad(th)), 4)}`],
          ['cos θ  =  adjacent / hypotenuse', `${num(adj, 2)} / ${num(hyp, 2)} = ${num(Math.cos(rad(th)), 4)}`],
          ['tan θ  =  opposite / adjacent', `${num(opp, 2)} / ${num(adj, 2)} = ${num(Math.tan(rad(th)), 4)}`],
          ['Other acute angle', `${90 - th}°`, 'the angles of a triangle add up to 180°'],
        ]} />
      </div>
    </Frame>
  )
}

/* ------------------------------------------------------------------ the ambiguous case (SSA) */

export function Ambiguous() {
  const [A, setA] = useState(35)
  const [b, setB] = useState(10)
  const [a, setA2] = useState(7)
  const h = b * Math.sin(rad(A))
  const cx = b * Math.cos(rad(A)), cy = h
  const disc = a * a - cy * cy
  const xs: number[] = disc < 0 ? [] : disc === 0 ? [cx] : [cx - Math.sqrt(disc), cx + Math.sqrt(disc)]
  const valid = xs.filter((x) => x > 1e-9)
  return (
    <Frame caption="Fix angle A and side b, then try to place side a. The circle of radius a around C meets the base line where B could be. If a is shorter than the height h it cannot reach (no triangle); between h and b the circle cuts the line twice (two triangles); at b or longer only one cut is on the correct side (one triangle).">
      <Plot x0={-2} x1={22} y0={-1} y1={10} label={`Triangle with A = ${A} degrees, b = ${b}, a = ${a}`}>
        {(sx, sy) => (
          <>
            <line x1={sx(0)} x2={sx(22)} y1={sy(0)} y2={sy(0)} className="w-axis" />
            <line x1={sx(0)} y1={sy(0)} x2={sx(cx)} y2={sy(cy)} className="w-curve" />
            <circle cx={sx(cx)} cy={sy(cy)} r={a * (sx(1) - sx(0))} fill="none" className="w-ref" />
            <line x1={sx(cx)} y1={sy(cy)} x2={sx(cx)} y2={sy(0)} className="w-ref" />
            {valid.map((x, i) => <g key={i}><line x1={sx(x)} y1={sy(0)} x2={sx(cx)} y2={sy(cy)} className="w-curve alt" /><circle cx={sx(x)} cy={sy(0)} r={6} className={i === 0 ? 'w-dot' : 'w-open'} /></g>)}
            <circle cx={sx(0)} cy={sy(0)} r={4} className="w-e" /><text x={sx(0) - 12} y={sy(0) + 16} className="w-t sm">A</text>
            <circle cx={sx(cx)} cy={sy(cy)} r={4} className="w-e" /><text x={sx(cx) + 6} y={sy(cy) - 6} className="w-t sm">C</text>
          </>
        )}
      </Plot>
      <div className="widget-controls">
        <div className="two-col">
          <LinSlider label="Angle A" value={A} min={10} max={150} onChange={setA} fmt={(v) => `${v}°`} />
          <LinSlider label="Side b" value={b} min={3} max={14} step={0.5} onChange={setB} fmt={(v) => String(v)} />
          <LinSlider label="Side a" value={a} min={1} max={14} step={0.1} onChange={setA2} fmt={(v) => num(v, 1)} />
        </div>
        <Readouts items={[
          ['Height h = b sin A', num(h, 2)],
          ['Triangles possible', String(valid.length), valid.length === 0 ? 'a is too short to reach the base line' : valid.length === 2 ? 'h < a < b: two positions for B' : a >= b || A >= 90 ? 'only one position gives a proper triangle' : 'a equals h: a right angle at B'],
          ['Angle B', valid.length ? valid.map((x) => `${num(180 - deg(Math.atan2(cy, cx - x)), 1)}°`).join(' or ') : 'none', valid.length === 2 ? 'the two values add up to 180°: sin B is the same for both' : undefined],
        ]} />
      </div>
    </Frame>
  )
}

/* ------------------------------------------------------------------ identities, tested on a graph */

interface Ident { id: string; label: string; lhs: (x: number, y: number) => number; rhs: (x: number, y: number) => number; lText: string; rText: string; two?: boolean }
const IDS: Ident[] = [
  { id: 'pyth', label: 'sin² + cos² = 1', lhs: (x) => Math.sin(x) ** 2 + Math.cos(x) ** 2, rhs: () => 1, lText: 'sin²x + cos²x', rText: '1' },
  { id: 'tan', label: 'tan = sin / cos', lhs: (x) => Math.tan(x), rhs: (x) => Math.sin(x) / Math.cos(x), lText: 'tan x', rText: 'sin x / cos x' },
  { id: 'sec', label: '1 + tan² = sec²', lhs: (x) => 1 + Math.tan(x) ** 2, rhs: (x) => 1 / Math.cos(x) ** 2, lText: '1 + tan²x', rText: 'sec²x' },
  { id: 'dbl', label: 'sin 2x = 2 sin x cos x', lhs: (x) => Math.sin(2 * x), rhs: (x) => 2 * Math.sin(x) * Math.cos(x), lText: 'sin 2x', rText: '2 sin x cos x' },
  { id: 'cos2', label: 'cos 2x = 1 − 2 sin²x', lhs: (x) => Math.cos(2 * x), rhs: (x) => 1 - 2 * Math.sin(x) ** 2, lText: 'cos 2x', rText: '1 − 2sin²x' },
  { id: 'sum', label: 'sin(x + y) = sin x cos y + cos x sin y', lhs: (x, y) => Math.sin(x + y), rhs: (x, y) => Math.sin(x) * Math.cos(y) + Math.cos(x) * Math.sin(y), lText: 'sin(x + y)', rText: 'sin x cos y + cos x sin y', two: true },
  { id: 'wrong', label: 'sin(x + y) = sin x + sin y ?', lhs: (x, y) => Math.sin(x + y), rhs: (x, y) => Math.sin(x) + Math.sin(y), lText: 'sin(x + y)', rText: 'sin x + sin y', two: true },
]

export function IdentityLab() {
  const [id, setId] = useState('pyth')
  const [x, setX] = useState(40)
  const [y, setY] = useState(25)
  const it = IDS.find((i) => i.id === id)!
  const xr = rad(x), yr = rad(y)
  const l = it.lhs(xr, yr), r = it.rhs(xr, yr)
  const equal = Number.isFinite(l) && Number.isFinite(r) && Math.abs(l - r) < 1e-9
  return (
    <Frame caption="An identity is an equation that is true for every angle where both sides are defined, so the graphs of the two sides lie exactly on top of each other. A false 'identity' (the last one) shows two different curves. Testing a few angles is the quickest way to catch a false claim.">
      <Plot x0={-2 * Math.PI} x1={2 * Math.PI} y0={-4} y1={4} xTicks={piTicks(-2 * Math.PI, 2 * Math.PI)} label={`Graphs of ${it.lText} and ${it.rText}`}>
        {(sx, sy) => (
          <>
            <path d={curve((t) => it.lhs(t, yr), -2 * Math.PI, 2 * Math.PI, sx, sy, 5, 900)} className="w-curve" />
            <path d={curve((t) => it.rhs(t, yr), -2 * Math.PI, 2 * Math.PI, sx, sy, 5, 900)} className="w-curve alt" strokeDasharray="6 5" />
            {Number.isFinite(l) && Math.abs(l) < 4 && <circle cx={sx(xr)} cy={sy(l)} r={6} className="w-dot" />}
            {Number.isFinite(r) && Math.abs(r) < 4 && <circle cx={sx(xr)} cy={sy(r)} r={9} className="w-open" />}
          </>
        )}
      </Plot>
      <div className="widget-controls">
        <Seg label="Identity" value={id} options={IDS.map((i) => ({ id: i.id, label: i.label }))} onChange={setId} />
        <div className="two-col">
          <LinSlider label="Test angle x" value={x} min={-180} max={180} onChange={setX} fmt={(v) => fmtDeg(v)} />
          {it.two && <LinSlider label="Test angle y" value={y} min={-180} max={180} onChange={setY} fmt={(v) => fmtDeg(v)} />}
        </div>
        <Readouts items={[
          [`Left side: ${it.lText}`, num(l, 5)],
          [`Right side: ${it.rText}`, num(r, 5)],
          ['Equal at this angle?', equal ? 'yes, to 5 decimal places' : Number.isFinite(l) && Number.isFinite(r) ? 'no: so this is not an identity' : 'one side is undefined here', it.id === 'wrong' ? 'a counter-example is enough to disprove an identity' : 'it will always say yes for a true identity'],
        ]} />
      </div>
    </Frame>
  )
}

/* ------------------------------------------------------------------ sinusoidal waves */

export function WaveLab() {
  const [fn, setFn] = useState<'sin' | 'cos'>('sin')
  const [a, setA] = useState(2)
  const [b, setB] = useState(2)
  const [h, setH] = useState(0.5)
  const [d, setD] = useState(1)
  const f = (x: number) => a * (fn === 'sin' ? Math.sin(b * (x - h)) : Math.cos(b * (x - h))) + d
  const period = (2 * Math.PI) / Math.abs(b)
  const hDeg = deg(h)
  return (
    <Frame caption="y = a sin(b(x − h)) + d. The amplitude |a| is the height of the wave above its midline y = d; the period 2π/|b| is the length of one cycle; h slides the wave right (the phase shift). A negative a flips it upside down.">
      <Plot x0={-2 * Math.PI} x1={2 * Math.PI} y0={-8} y1={8} xTicks={piTicks(-2 * Math.PI, 2 * Math.PI)} label={`Graph of y = ${a} ${fn}(${b}(x − ${num(h, 2)})) + ${d}`}>
        {(sx, sy) => (
          <>
            <line x1={sx(-2 * Math.PI)} x2={sx(2 * Math.PI)} y1={sy(d)} y2={sy(d)} className="w-ref" />
            <line x1={sx(-2 * Math.PI)} x2={sx(2 * Math.PI)} y1={sy(d + Math.abs(a))} y2={sy(d + Math.abs(a))} className="w-grid" />
            <line x1={sx(-2 * Math.PI)} x2={sx(2 * Math.PI)} y1={sy(d - Math.abs(a))} y2={sy(d - Math.abs(a))} className="w-grid" />
            <path d={curve(f, -2 * Math.PI, 2 * Math.PI, sx, sy, Infinity, 900)} className="w-curve" />
            <circle cx={sx(h)} cy={sy(f(h))} r={6} className="w-dot" />
          </>
        )}
      </Plot>
      <div className="widget-controls">
        <Seg label="Function" value={fn} options={[{ id: 'sin', label: 'sine' }, { id: 'cos', label: 'cosine' }]} onChange={setFn} />
        <div className="two-col">
          <LinSlider label="a (amplitude)" value={a} min={-5} max={5} step={0.5} onChange={setA} fmt={(v) => num(v, 1)} />
          <LinSlider label="b (frequency)" value={b} min={0.5} max={4} step={0.5} onChange={setB} fmt={(v) => num(v, 1)} />
          <LinSlider label="h (phase shift)" value={h} min={-3} max={3} step={0.25} onChange={setH} fmt={(v) => num(v, 2)} />
          <LinSlider label="d (midline)" value={d} min={-4} max={4} onChange={setD} fmt={(v) => num(v, 0)} />
        </div>
        <Readouts items={[
          ['Amplitude', num(Math.abs(a), 1)],
          ['Period', `${num(period, 3)}`, `= 2π / ${num(Math.abs(b), 1)}, about ${num(period / Math.PI, 3)}π`],
          ['Phase shift', `${num(h, 2)} to the right`, `about ${num(hDeg, 1)}°`],
          ['Midline, maximum, minimum', `y = ${d}, ${num(d + Math.abs(a), 1)}, ${num(d - Math.abs(a), 1)}`],
        ]} />
      </div>
    </Frame>
  )
}

/* ------------------------------------------------------------------ solving a trig equation on a graph */

export function TrigSolve() {
  const [fn, setFn] = useState<'sin' | 'cos' | 'tan'>('sin')
  const [b, setB] = useState(1)
  const [k, setK] = useState(0.5)
  const F = fn === 'sin' ? Math.sin : fn === 'cos' ? Math.cos : Math.tan
  const g = (x: number) => F(b * x)
  const X1 = 4 * Math.PI
  const sols: number[] = []
  const step = 0.002
  let prev = g(0) - k, px = 0
  for (let x = step; x <= X1 + 1e-9; x += step) {
    const v = g(x) - k
    if (Number.isFinite(prev) && Number.isFinite(v) && prev * v <= 0 && Math.abs(v - prev) < 1) {
      let lo = px, hi = x
      for (let i = 0; i < 40; i++) { const m = (lo + hi) / 2; if ((g(lo) - k) * (g(m) - k) <= 0) hi = m; else lo = m }
      const r = (lo + hi) / 2
      if (!sols.some((s) => Math.abs(s - r) < 1e-4)) sols.push(r)
    }
    prev = v; px = x
  }
  const general = fn === 'tan' ? 'x = (α + nπ)/b' : fn === 'sin' ? 'x = (α + 2nπ)/b  or  (π − α + 2nπ)/b' : 'x = (±α + 2nπ)/b'
  const alpha = fn === 'sin' ? Math.asin(Math.max(-1, Math.min(1, k))) : fn === 'cos' ? Math.acos(Math.max(-1, Math.min(1, k))) : Math.atan(k)
  return (
    <Frame caption="Solving f(bx) = k means finding where the curve meets the horizontal line y = k. Over 0 ≤ x ≤ 4π there are as many solutions as intersections, and a larger b squeezes the wave so that it meets the line more often. The general solution uses the principal value α and the period.">
      <Plot x0={0} x1={X1} y0={-3} y1={3} xTicks={piTicks(0, X1)} label={`Graph of y = ${fn}(${b}x) and the line y = ${k}`}>
        {(sx, sy) => (
          <>
            <line x1={sx(0)} x2={sx(X1)} y1={sy(k)} y2={sy(k)} className="w-ref" />
            <path d={curve(g, 0, X1, sx, sy, 4, 1400)} className="w-curve" />
            {sols.map((s, i) => <circle key={i} cx={sx(s)} cy={sy(k)} r={5} className="w-dot" />)}
          </>
        )}
      </Plot>
      <div className="widget-controls">
        <Seg label="Function" value={fn} options={[{ id: 'sin', label: 'sin' }, { id: 'cos', label: 'cos' }, { id: 'tan', label: 'tan' }]} onChange={setFn} />
        <div className="two-col">
          <LinSlider label="b" value={b} min={1} max={4} onChange={setB} fmt={(v) => String(v)} />
          <LinSlider label="k" value={k} min={-1.5} max={1.5} step={0.1} onChange={setK} fmt={(v) => num(v, 1)} />
        </div>
        <Readouts items={[
          ['Equation', `${fn}(${b === 1 ? '' : b}x) = ${num(k, 1)}`],
          ['Solutions in [0, 4π]', String(sols.length), fn !== 'tan' && Math.abs(k) > 1 ? 'a sine or cosine never exceeds 1 in size: no solutions' : undefined],
          ['Principal value α', `${num(alpha, 4)} rad = ${num(deg(alpha), 2)}°`],
          ['General solution', general, 'n is any whole number'],
          ['The solutions found', sols.slice(0, 8).map((s) => num(s, 3)).join(', ') + (sols.length > 8 ? ', …' : '')],
        ]} />
      </div>
    </Frame>
  )
}
