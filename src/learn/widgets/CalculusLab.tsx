import { useState } from 'react'
import { MINUS } from '../../math/exact'
import { Arrow, H as PH, Plane, W as PW } from './ComplexVec'
import { Frame, LinSlider, Readouts, Seg } from './shared'
import { curve, Plot } from './Solving'

const num = (x: number, d = 3) => (Number.isFinite(x) ? Number(x.toFixed(d)).toString().replace('-', MINUS) : 'undefined')

/* ------------------------------------------------------------------ approaching a limit */

interface LimitCase { id: string; label: string; f: (x: number) => number; a: number; x0: number; x1: number; y0: number; y1: number; left: string; right: string; verdict: string; hole?: number }
const CASES: LimitCase[] = [
  { id: 'hole', label: '(x² − 1)/(x − 1) at 1', f: (x) => (x * x - 1) / (x - 1), a: 1, x0: -1, x1: 3, y0: -1, y1: 5, left: '2', right: '2', verdict: 'The limit is 2, even though f(1) does not exist: the graph has a hole.', hole: 2 },
  { id: 'sinc', label: 'sin x / x at 0', f: (x) => Math.sin(x) / x, a: 0, x0: -8, x1: 8, y0: -0.5, y1: 1.5, left: '1', right: '1', verdict: 'The limit is 1. This is the most important limit in trigonometry.', hole: 1 },
  { id: 'root', label: '(√(x + 4) − 2)/x at 0', f: (x) => (Math.sqrt(x + 4) - 2) / x, a: 0, x0: -3, x1: 5, y0: 0, y1: 0.6, left: '0.25', right: '0.25', verdict: 'The limit is 1/4. Rationalising the numerator shows it exactly.', hole: 0.25 },
  { id: 'jump', label: '|x| / x at 0', f: (x) => Math.abs(x) / x, a: 0, x0: -3, x1: 3, y0: -2, y1: 2, left: '−1', right: '1', verdict: 'The left and right limits disagree, so the limit does not exist (a jump).' },
  { id: 'pole', label: '1/x at 0', f: (x) => 1 / x, a: 0, x0: -3, x1: 3, y0: -6, y1: 6, left: 'falls without bound', right: 'grows without bound', verdict: 'The values grow without bound: the limit does not exist (a vertical asymptote).' },
]

export function LimitLab() {
  const [id, setId] = useState('hole')
  const [t, setT] = useState(0.7)
  const c = CASES.find((k) => k.id === id) ?? CASES[0]
  const h = Math.pow(10, -t)
  const xl = c.a - h, xr = c.a + h
  return (
    <Frame caption="Drag the slider to squeeze the two sample points towards the target value of x, from the left and from the right. If both heights settle on the same number, that number is the limit. A limit describes where the graph is heading, so it can exist even when the function has no value at the point itself.">
      <Plot x0={c.x0} x1={c.x1} y0={c.y0} y1={c.y1} label={`Approaching x = ${c.a} on the graph of ${c.label}`}>
        {(sx, sy) => (
          <>
            <line x1={sx(c.a)} x2={sx(c.a)} y1={0} y2={300} className="w-ref" />
            <path d={curve(c.f, c.x0, c.x1, sx, sy, 5, 600)} className="w-curve" />
            {c.hole !== undefined && <circle cx={sx(c.a)} cy={sy(c.hole)} r={5} className="w-joint" />}
            {[xl, xr].map((x, i) => Number.isFinite(c.f(x)) && Math.abs(c.f(x)) < 1e3 && <circle key={i} cx={sx(x)} cy={sy(Math.max(c.y0 - 1, Math.min(c.y1 + 1, c.f(x))))} r={6} className="w-dot" />)}
          </>
        )}
      </Plot>
      <div className="widget-controls">
        <Seg label="Function" value={id} options={CASES.map((k) => ({ id: k.id, label: k.label }))} onChange={setId} />
        <LinSlider label="Distance h from the target" value={t} min={0} max={4} step={0.05} onChange={setT} fmt={() => num(h, 4)} />
        <Readouts items={[
          [`f(${num(c.a)} − h)`, num(c.f(xl), 5), `x = ${num(xl, 5)}`],
          [`f(${num(c.a)} + h)`, num(c.f(xr), 5), `x = ${num(xr, 5)}`],
          ['Limit from the left', c.left], ['Limit from the right', c.right], ['Verdict', c.verdict],
        ]} />
      </div>
    </Frame>
  )
}

/* ------------------------------------------------------------------ the secant line turning into the tangent */

interface Fn { id: string; label: string; f: (x: number) => number; d: (x: number) => number; x0: number; x1: number; y0: number; y1: number }
const FNS: Fn[] = [
  { id: 'sq', label: 'x²', f: (x) => x * x, d: (x) => 2 * x, x0: -3, x1: 3, y0: -2, y1: 9 },
  { id: 'cu', label: 'x³ − 3x', f: (x) => x ** 3 - 3 * x, d: (x) => 3 * x * x - 3, x0: -3, x1: 3, y0: -6, y1: 6 },
  { id: 'sin', label: 'sin x', f: Math.sin, d: Math.cos, x0: -5, x1: 5, y0: -2, y1: 2 },
  { id: 'exp', label: 'eˣ', f: Math.exp, d: Math.exp, x0: -3, x1: 3, y0: -2, y1: 10 },
  { id: 'inv', label: '1/x', f: (x) => 1 / x, d: (x) => -1 / (x * x), x0: -4, x1: 4, y0: -5, y1: 5 },
  { id: 'sqrt', label: '√x', f: Math.sqrt, d: (x) => 1 / (2 * Math.sqrt(x)), x0: 0, x1: 9, y0: -1, y1: 4 },
]

export function SecantLab() {
  const [id, setId] = useState('sq')
  const [a0, setA] = useState(1)
  const [t, setT] = useState(0)
  const fn = FNS.find((k) => k.id === id) ?? FNS[0]
  const a = fn.id === 'sqrt' ? Math.max(0.5, Math.abs(a0) + 0.5) : fn.id === 'inv' ? (Math.abs(a0) < 0.4 ? 0.5 : a0) : a0
  const h = Math.pow(10, -t) * 2
  const fa = fn.f(a), fb = fn.f(a + h)
  const sec = (fb - fa) / h, tan = fn.d(a)
  const line = (m: number, x: number) => fa + m * (x - a)
  return (
    <Frame caption="The secant (dashed) joins the point at x = a to a second point a distance h along the curve. As h shrinks, the second point slides towards the first and the secant turns into the tangent, whose gradient is the derivative f′(a). The slope of the secant is the average rate of change over that gap.">
      <Plot x0={fn.x0} x1={fn.x1} y0={fn.y0} y1={fn.y1} label={`The secant and tangent to y = ${fn.label}`}>
        {(sx, sy) => (
          <>
            <path d={curve(fn.f, fn.x0, fn.x1, sx, sy, 8, 500)} className="w-curve" />
            <line x1={sx(fn.x0)} y1={sy(line(tan, fn.x0))} x2={sx(fn.x1)} y2={sy(line(tan, fn.x1))} className="w-curve alt" />
            <line x1={sx(fn.x0)} y1={sy(line(sec, fn.x0))} x2={sx(fn.x1)} y2={sy(line(sec, fn.x1))} className="w-ref" />
            <circle cx={sx(a)} cy={sy(fa)} r={6} className="w-dot" />
            {Number.isFinite(fb) && <circle cx={sx(a + h)} cy={sy(fb)} r={5} className="w-joint" />}
          </>
        )}
      </Plot>
      <div className="widget-controls">
        <Seg label="Function" value={id} options={FNS.map((k) => ({ id: k.id, label: k.label }))} onChange={setId} />
        <div className="two-col">
          <LinSlider label="Point a" value={a0} min={-2.5} max={2.5} step={0.1} onChange={setA} fmt={(v) => num(v, 1)} />
          <LinSlider label="Gap h" value={t} min={0} max={3.5} step={0.05} onChange={setT} fmt={() => num(h, 4)} />
        </div>
        <Readouts items={[
          ['Point', `(${num(a, 2)}, ${num(fa, 3)})`, `a = ${num(a, 2)}`],
          ['Secant gradient', num(sec, 4), '(f(a + h) − f(a)) / h'],
          ['Tangent gradient f′(a)', num(tan, 4), 'the limit of the secant gradient as h → 0'],
          ['Difference', num(sec - tan, 4)],
        ]} />
      </div>
    </Frame>
  )
}

/* ------------------------------------------------------------------ a function and its derivative */

interface Pair2 { id: string; label: string; dlabel: string; f: (x: number) => number; d: (x: number) => number; x0: number; x1: number; y0: number; y1: number; dy0: number; dy1: number }
const PAIRS: Pair2[] = [
  { id: 'cu', label: 'x³ − 3x', dlabel: '3x² − 3', f: (x) => x ** 3 - 3 * x, d: (x) => 3 * x * x - 3, x0: -3, x1: 3, y0: -6, y1: 6, dy0: -4, dy1: 10 },
  { id: 'sin', label: 'sin x', dlabel: 'cos x', f: Math.sin, d: Math.cos, x0: -6.3, x1: 6.3, y0: -2, y1: 2, dy0: -2, dy1: 2 },
  { id: 'exp', label: 'eˣ', dlabel: 'eˣ', f: Math.exp, d: Math.exp, x0: -3, x1: 3, y0: -1, y1: 12, dy0: -1, dy1: 12 },
  { id: 'ln', label: 'ln x', dlabel: '1/x', f: Math.log, d: (x) => 1 / x, x0: 0, x1: 6, y0: -3, y1: 3, dy0: -1, dy1: 5 },
  { id: 'quart', label: 'x⁴ − 2x²', dlabel: '4x³ − 4x', f: (x) => x ** 4 - 2 * x * x, d: (x) => 4 * x ** 3 - 4 * x, x0: -2.2, x1: 2.2, y0: -2, y1: 6, dy0: -8, dy1: 8 },
]

export function DerivGraph() {
  const [id, setId] = useState('cu')
  const [a0, setA] = useState(1.5)
  const p = PAIRS.find((k) => k.id === id) ?? PAIRS[0]
  const a = p.id === 'ln' ? Math.max(0.2, Math.abs(a0)) : Math.max(p.x0 + 0.1, Math.min(p.x1 - 0.1, a0))
  const m = p.d(a), fa = p.f(a)
  const tl = (x: number) => fa + m * (x - a)
  return (
    <Frame caption="Top: the graph of f with its tangent at x = a. Bottom: the graph of its derivative f′. The height of the lower graph at x = a is the gradient of the tangent above. Where f has a peak or a valley the tangent is flat, so f′ crosses zero. Where f rises, f′ is positive; where f falls, f′ is negative.">
      <Plot x0={p.x0} x1={p.x1} y0={p.y0} y1={p.y1} label={`The graph of f(x) = ${p.label} with a tangent line`}>
        {(sx, sy) => (
          <>
            <path d={curve(p.f, p.x0, p.x1, sx, sy, 8, 500)} className="w-curve" />
            <line x1={sx(a - 1.2)} y1={sy(tl(a - 1.2))} x2={sx(a + 1.2)} y2={sy(tl(a + 1.2))} className="w-curve alt" />
            <circle cx={sx(a)} cy={sy(fa)} r={6} className="w-dot" />
          </>
        )}
      </Plot>
      <Plot x0={p.x0} x1={p.x1} y0={p.dy0} y1={p.dy1} label={`The graph of the derivative f′(x) = ${p.dlabel}`}>
        {(sx, sy) => (
          <>
            <path d={curve(p.d, p.x0, p.x1, sx, sy, 8, 500)} className="w-curve" />
            <line x1={sx(a)} x2={sx(a)} y1={0} y2={300} className="w-ref" />
            <circle cx={sx(a)} cy={sy(m)} r={6} className="w-dot" />
          </>
        )}
      </Plot>
      <div className="widget-controls">
        <Seg label="Function" value={id} options={PAIRS.map((k) => ({ id: k.id, label: k.label }))} onChange={setId} />
        <LinSlider label="Point a" value={a0} min={-3} max={3} step={0.05} onChange={setA} fmt={(v) => num(Math.abs(p.id === 'ln' ? Math.max(0.2, v) : v) === 0 ? 0 : p.id === 'ln' ? Math.max(0.2, Math.abs(v)) : v, 2)} />
        <Readouts items={[['f(x)', p.label], ['f′(x)', p.dlabel], [`f(${num(a, 2)})`, num(fa, 3)], [`f′(${num(a, 2)}) = tangent gradient`, num(m, 3), m > 0.0005 ? 'f is rising here' : m < -0.0005 ? 'f is falling here' : 'a stationary point']]} />
      </div>
    </Frame>
  )
}

/* ------------------------------------------------------------------ implicit differentiation on a circle */

export function ImplicitLab() {
  const [R, setR] = useState(5)
  const [ang, setAng] = useState(53)
  const th = (ang * Math.PI) / 180
  const x = R * Math.cos(th), y = R * Math.sin(th)
  const vertical = Math.abs(y) < 1e-9
  const m = vertical ? NaN : -x / y
  const reach = R + 1.5
  return (
    <Frame caption="Differentiating x² + y² = R² with respect to x gives 2x + 2y dy/dx = 0, so dy/dx = −x/y. The tangent at a point on a circle is perpendicular to the radius, and this formula says exactly that: the radius has gradient y/x and the tangent has gradient −x/y. At the left and right ends (y = 0) the tangent is vertical and the gradient is undefined.">
      <Plane reach={reach} label="A circle with a tangent line at a chosen point" axes={['x', 'y']}>
        {(p, unit) => {
          const o = p(0, 0), q = p(x, y), L = 4
          const dx = vertical ? 0 : 1, dy = vertical ? 1 : m
          const nrm = Math.hypot(dx, dy)
          const a1 = p(x - (L * dx) / nrm, y - (L * dy) / nrm), a2 = p(x + (L * dx) / nrm, y + (L * dy) / nrm)
          return (
            <>
              <circle cx={PW / 2} cy={PH / 2} r={R * unit} className="w-circle" />
              <line x1={a1[0]} y1={a1[1]} x2={a2[0]} y2={a2[1]} className="w-curve alt" />
              <Arrow x1={o[0]} y1={o[1]} x2={q[0]} y2={q[1]} cls="red" />
              <circle cx={q[0]} cy={q[1]} r={6} className="w-dot" />
            </>
          )
        }}
      </Plane>
      <div className="widget-controls">
        <div className="two-col">
          <LinSlider label="Radius R" value={R} min={2} max={8} onChange={setR} fmt={(v) => num(v, 0)} />
          <LinSlider label="Point on the circle (angle)" value={ang} min={0} max={355} step={5} onChange={setAng} fmt={(v) => `${v}°`} />
        </div>
        <Readouts items={[
          ['Point (x, y)', `(${num(x, 2)}, ${num(y, 2)})`],
          ['dy/dx = −x/y', vertical ? 'undefined: the tangent is vertical' : num(m, 3)],
          ['Gradient of the radius', Math.abs(x) < 1e-9 ? 'undefined' : num(y / x, 3), 'the product of the two gradients is −1'],
        ]} />
      </div>
    </Frame>
  )
}

/* ------------------------------------------------------------------ the open box */

export function BoxOpt() {
  const [s, setS] = useState(24)
  const [x, setX] = useState(2)
  const xm = Math.min(x, s / 2 - 0.05)
  const V = (u: number) => u * (s - 2 * u) ** 2
  const best = s / 6
  return (
    <Frame caption="Cut a square of side x from each corner of a square sheet and fold up the sides: the box has height x and a square base of side s − 2x, so V = x(s − 2x)². The volume rises, peaks and falls. At the peak the tangent is flat, V′ = 0, which happens at x = s/6.">
      <Plot x0={0} x1={s / 2} y0={0} y1={Math.ceil((2 * s ** 3) / 27 * 1.15)} label="Volume of the box against the size of the cut">
        {(sx, sy) => (
          <>
            <path d={curve(V, 0, s / 2, sx, sy, Infinity, 300)} className="w-curve" />
            <line x1={sx(best)} x2={sx(best)} y1={0} y2={300} className="w-ref" />
            <circle cx={sx(best)} cy={sy(V(best))} r={5} className="w-joint" />
            <circle cx={sx(xm)} cy={sy(V(xm))} r={6} className="w-dot" />
          </>
        )}
      </Plot>
      <div className="widget-controls">
        <div className="two-col">
          <LinSlider label="Sheet side s" value={s} min={12} max={60} step={6} onChange={setS} fmt={(v) => `${v} cm`} />
          <LinSlider label="Cut x" value={x} min={0.1} max={30} step={0.1} onChange={(v) => setX(Math.min(v, s / 2 - 0.1))} fmt={() => `${num(xm, 1)} cm`} />
        </div>
        <Readouts items={[
          ['Base side', `${num(s - 2 * xm, 2)} cm`, 's − 2x'], ['Height', `${num(xm, 2)} cm`],
          ['Volume', `${num(V(xm), 1)} cm³`, 'x(s − 2x)²'],
          ['Greatest volume', `${num(V(best), 1)} cm³ at x = ${num(best, 2)}`, 'where V′(x) = (s − 2x)(s − 6x) = 0'],
        ]} />
      </div>
    </Frame>
  )
}

/* ------------------------------------------------------------------ related rates: the sliding ladder */

export function Ladder() {
  const [Lh, setL] = useState(10)
  const [x, setX] = useState(6)
  const [v, setV] = useState(1)
  const xc = Math.min(x, Lh - 0.2)
  const y = Math.sqrt(Lh * Lh - xc * xc)
  const speed = (xc * v) / y
  const sc = 22
  const gx = 90, gy = 300
  return (
    <Frame caption="A ladder of fixed length L leans on a wall, so the foot distance x and the height y satisfy x² + y² = L². Differentiating with respect to time: 2x dx/dt + 2y dy/dt = 0, so dy/dt = −(x/y) dx/dt. The closer the foot gets to the full length of the ladder, the faster the top falls, and the speed grows without bound as the top reaches the ground.">
      <svg viewBox={`0 0 ${PW} 330`} className="wsvg" role="img" aria-label="A ladder leaning against a wall">
        <line x1={gx} y1={20} x2={gx} y2={gy} className="w-ground" stroke="currentColor" />
        <line x1={gx} y1={gy} x2={PW - 20} y2={gy} className="w-axis" />
        <line x1={gx} y1={gy - y * sc} x2={gx + xc * sc} y2={gy} className="w-curve" />
        <circle cx={gx} cy={gy - y * sc} r={6} className="w-dot" />
        <circle cx={gx + xc * sc} cy={gy} r={6} className="w-dot" />
        <text x={gx + (xc * sc) / 2} y={gy + 18} textAnchor="middle" className="w-t">x = {num(xc, 2)} m</text>
        <text x={gx + 10} y={gy - (y * sc) / 2} className="w-t">y = {num(y, 2)} m</text>
      </svg>
      <div className="widget-controls">
        <div className="two-col">
          <LinSlider label="Ladder length L" value={Lh} min={5} max={13} onChange={setL} fmt={(q) => `${q} m`} />
          <LinSlider label="Distance of the foot x" value={x} min={1} max={13} step={0.1} onChange={setX} fmt={() => `${num(xc, 1)} m`} />
          <LinSlider label="Foot speed dx/dt" value={v} min={0.5} max={4} step={0.5} onChange={setV} fmt={(q) => `${q} m/s`} />
        </div>
        <Readouts items={[
          ['Height y', `${num(y, 3)} m`, 'y = √(L² − x²)'],
          ['Speed of the top, −dy/dt', `${num(speed, 3)} m/s`, '(x / y) × dx/dt'],
        ]} />
      </div>
    </Frame>
  )
}
