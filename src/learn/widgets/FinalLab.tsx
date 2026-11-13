import { useState } from 'react'
import { phi } from '../../math/psQuestions'
import { MINUS } from '../../math/exact'
import { Arrow, H as PH, Plane, W as PW } from './ComplexVec'
import { Frame, LinSlider, Readouts, Seg } from './shared'
import { curve, Plot } from './Solving'

const num = (x: number, d = 3) => (Number.isFinite(x) ? Number(x.toFixed(d)).toString().replace('-', MINUS) : 'undefined')

/* ------------------------------------------------------------------ slope fields and Euler's method */

interface Ode { id: string; label: string; f: (x: number, y: number) => number; y0: number; x1: number; ya: number; yb: number }
const ODES: Ode[] = [
  { id: 'x', label: "y′ = x", f: (x) => x, y0: 0, x1: 3, ya: -3, yb: 5 },
  { id: 'y', label: "y′ = y", f: (_, y) => y, y0: 1, x1: 3, ya: -4, yb: 8 },
  { id: 'xy', label: "y′ = x − y", f: (x, y) => x - y, y0: 2, x1: 4, ya: -3, yb: 5 },
  { id: 'log', label: "y′ = y(1 − y/4)", f: (_, y) => y * (1 - y / 4), y0: 0.5, x1: 5, ya: -1, yb: 6 },
  { id: 'sin', label: "y′ = sin x − y/2", f: (x, y) => Math.sin(x) - y / 2, y0: 1, x1: 6, ya: -3, yb: 4 },
]

export function SlopeField() {
  const [id, setId] = useState('xy')
  const [y0, setY0] = useState(2)
  const [h, setH] = useState(0.5)
  const o = ODES.find((k) => k.id === id) ?? ODES[0]
  const x0 = 0
  // Euler's polyline and a fine RK4 curve for comparison
  const eu: [number, number][] = [[x0, y0]]
  for (let x = x0, y = y0; x < o.x1 - 1e-9; ) { y += h * o.f(x, y); x += h; eu.push([x, y]) }
  const rk: [number, number][] = [[x0, y0]]
  { const dt = 0.02; for (let x = x0, y = y0; x < o.x1 - 1e-9; ) { const k1 = o.f(x, y), k2 = o.f(x + dt / 2, y + (dt / 2) * k1), k3 = o.f(x + dt / 2, y + (dt / 2) * k2), k4 = o.f(x + dt, y + dt * k3); y += (dt / 6) * (k1 + 2 * k2 + 2 * k3 + k4); x += dt; rk.push([x, y]) } }
  const last = eu[eu.length - 1], exactEnd = rk[rk.length - 1]
  return (
    <Frame caption="At every point the equation y′ = f(x, y) gives a slope, drawn here as a short segment: this is the slope field. A solution is a curve that follows the segments. Euler's method (the polyline) starts at the initial point and repeatedly steps along the local slope; shrinking the step size h brings it closer to the true solution (the smooth curve).">
      <Plot x0={0} x1={o.x1} y0={o.ya} y1={o.yb} label={`The slope field of ${o.label} with a solution curve and Euler's method`}>
        {(sx, sy) => (
          <>
            {Array.from({ length: 16 }, (_, i) => Array.from({ length: 10 }, (_, j) => {
              const x = ((i + 0.5) * o.x1) / 16, y = o.ya + ((j + 0.5) * (o.yb - o.ya)) / 10, m = o.f(x, y)
              const dx = 0.16 * (o.x1 / 3), L = Math.hypot(1, m * ((o.x1 / 640) * (300 / (o.yb - o.ya)) ** -1 * 0 + 1)) || 1
              void L
              const ang = Math.atan(m * ((300 / (o.yb - o.ya)) / (640 / o.x1)))
              const half = 9
              return <line key={`${i}-${j}`} x1={sx(x) - half * Math.cos(ang)} y1={sy(y) + half * Math.sin(ang)} x2={sx(x) + half * Math.cos(ang)} y2={sy(y) - half * Math.sin(ang)} className="w-grid" strokeWidth={2} style={{ stroke: 'var(--text-faint)' }} data-dx={dx} />
            }))}
            <path d={`M${rk.filter((_, i) => i % 2 === 0).map(([x, y]) => `${sx(x).toFixed(1)},${sy(y).toFixed(1)}`).join(' L')}`} className="w-curve" />
            <path d={`M${eu.map(([x, y]) => `${sx(x).toFixed(1)},${sy(y).toFixed(1)}`).join(' L')}`} className="w-curve alt" strokeDasharray="5 4" />
            {eu.map(([x, y], i) => <circle key={i} cx={sx(x)} cy={sy(y)} r={3.5} className="w-dot" />)}
          </>
        )}
      </Plot>
      <div className="widget-controls">
        <Seg label="Equation" value={id} options={ODES.map((k) => ({ id: k.id, label: k.label }))} onChange={(v) => { setId(v); setY0((ODES.find((k) => k.id === v) ?? ODES[0]).y0) }} />
        <div className="two-col">
          <LinSlider label="Initial value y(0)" value={y0} min={o.ya + 0.5} max={o.yb - 0.5} step={0.1} onChange={setY0} fmt={(v) => num(v, 1)} />
          <LinSlider label="Euler step h" value={h} min={0.05} max={1} step={0.05} onChange={setH} fmt={(v) => num(v, 2)} />
        </div>
        <Readouts items={[[`Euler at x = ${num(last[0], 2)}`, num(last[1], 4)], ['Accurate solution there', num(exactEnd[1], 4)], ['Error', num(last[1] - exactEnd[1], 4), 'shrinks as h shrinks']]} />
      </div>
    </Frame>
  )
}

/* ------------------------------------------------------------------ the damped oscillator */

export function Oscillator() {
  const [b, setB] = useState(0.4)
  const [c, setC] = useState(4)
  const [y0, setY0] = useState(2)
  const T = 12
  const pts: [number, number][] = []
  { const dt = 0.01; let y = y0, v = 0; for (let t = 0; t <= T + 1e-9; t += dt) { if (Math.round(t / dt) % 5 === 0) pts.push([t, y]); const acc = (yy: number, vv: number) => -b * vv - c * yy; const k1y = v, k1v = acc(y, v), k2y = v + (dt / 2) * k1v, k2v = acc(y + (dt / 2) * k1y, v + (dt / 2) * k1v), k3y = v + (dt / 2) * k2v, k3v = acc(y + (dt / 2) * k2y, v + (dt / 2) * k2v), k4y = v + dt * k3v, k4v = acc(y + dt * k3y, v + dt * k3v); y += (dt / 6) * (k1y + 2 * k2y + 2 * k3y + k4y); v += (dt / 6) * (k1v + 2 * k2v + 2 * k3v + k4v) } }
  const D = b * b - 4 * c
  const kind = D > 1e-9 ? 'overdamped: two real roots, no oscillation' : D < -1e-9 ? 'underdamped: oscillates inside a shrinking envelope' : 'critically damped: the fastest return without oscillating'
  const roots = D >= 0 ? `${num((-b + Math.sqrt(D)) / 2, 3)} and ${num((-b - Math.sqrt(D)) / 2, 3)}` : `${num(-b / 2, 3)} ± ${num(Math.sqrt(-D) / 2, 3)}i`
  const ymax = Math.max(1, Math.abs(y0)) * 1.1
  return (
    <Frame caption="The motion y″ + b y′ + c y = 0 of a mass on a spring with friction b and stiffness c, released from rest at y(0). The characteristic equation r² + br + c = 0 decides the behaviour: complex roots (b² < 4c) give oscillation whose size decays like e^(−bt/2); real roots give a smooth return to rest. With no friction (b = 0) the oscillation never dies.">
      <Plot x0={0} x1={T} y0={-ymax} y1={ymax} label="Displacement against time for a damped oscillator">
        {(sx, sy) => (
          <>
            {D < 0 && <><path d={curve((t) => Math.abs(y0) * Math.exp((-b * t) / 2), 0, T, sx, sy, Infinity, 120)} className="w-ref" fill="none" /><path d={curve((t) => -Math.abs(y0) * Math.exp((-b * t) / 2), 0, T, sx, sy, Infinity, 120)} className="w-ref" fill="none" /></>}
            <path d={`M${pts.map(([t, y]) => `${sx(t).toFixed(1)},${sy(y).toFixed(1)}`).join(' L')}`} className="w-curve" />
          </>
        )}
      </Plot>
      <div className="widget-controls">
        <div className="two-col">
          <LinSlider label="Damping b" value={b} min={0} max={6} step={0.1} onChange={setB} fmt={(v) => num(v, 1)} />
          <LinSlider label="Stiffness c" value={c} min={0.5} max={12} step={0.1} onChange={setC} fmt={(v) => num(v, 1)} />
          <LinSlider label="Start y(0)" value={y0} min={-3} max={3} step={0.5} onChange={setY0} fmt={(v) => num(v, 1)} />
        </div>
        <Readouts items={[['Characteristic roots', roots], ['Discriminant b² − 4c', num(D, 2)], ['Behaviour', kind]]} />
      </div>
    </Frame>
  )
}

/* ------------------------------------------------------------------ a linear map of the plane */

export function MatrixLab() {
  const [a, setA] = useState(2)
  const [b, setB] = useState(1)
  const [c, setC] = useState(0)
  const [d, setD] = useState(1.5)
  const det = a * d - b * c, tr = a + d, disc = tr * tr - 4 * det
  const reach = 6
  const eigs = disc >= -1e-9 ? [(tr + Math.sqrt(Math.max(0, disc))) / 2, (tr - Math.sqrt(Math.max(0, disc))) / 2] : []
  const evec = (l: number): [number, number] | null => { if (Math.abs(b) > 1e-9) return [b, l - a]; if (Math.abs(c) > 1e-9) return [l - d, c]; return Math.abs(l - a) < 1e-9 ? [1, 0] : [0, 1] }
  return (
    <Frame caption="A 2 × 2 matrix transforms the plane. The unit square (grey) is mapped to a parallelogram (shaded): its sides are the columns of the matrix, and its area is multiplied by |det|. A negative determinant flips the plane over. An eigenvector (red line) is a direction the map only stretches, by the factor λ, without turning: the parallelogram's image of such a direction stays on the same line.">
      <Plane reach={reach} label="The image of the unit square under a matrix" axes={['x', 'y']}>
        {(p) => {
          const o = p(0, 0), A1 = p(a, c), B1 = p(b, d), AB = p(a + b, c + d), u1 = p(1, 0), u2 = p(0, 1), u12 = p(1, 1)
          return (
            <>
              <polygon points={`${o} ${u1} ${u12} ${u2}`} fill="none" stroke="var(--text-faint)" strokeWidth={1.5} strokeDasharray="4 3" />
              <polygon points={`${o} ${A1} ${AB} ${B1}`} className="w-area" />
              {eigs.map((l, i) => { const v = evec(l); if (!v) return null; const L = Math.hypot(v[0], v[1]) || 1; const e1 = p((-reach * v[0]) / L, (-reach * v[1]) / L), e2 = p((reach * v[0]) / L, (reach * v[1]) / L); return <line key={i} x1={e1[0]} y1={e1[1]} x2={e2[0]} y2={e2[1]} className="w-ref" /> })}
              <Arrow x1={o[0]} y1={o[1]} x2={A1[0]} y2={A1[1]} cls="red" label="Ae₁" />
              <Arrow x1={o[0]} y1={o[1]} x2={B1[0]} y2={B1[1]} label="Ae₂" />
            </>
          )
        }}
      </Plane>
      <div className="widget-controls">
        <div className="two-col">
          <LinSlider label="a (row 1, col 1)" value={a} min={-3} max={3} step={0.5} onChange={setA} fmt={(v) => num(v, 1)} />
          <LinSlider label="b (row 1, col 2)" value={b} min={-3} max={3} step={0.5} onChange={setB} fmt={(v) => num(v, 1)} />
          <LinSlider label="c (row 2, col 1)" value={c} min={-3} max={3} step={0.5} onChange={setC} fmt={(v) => num(v, 1)} />
          <LinSlider label="d (row 2, col 2)" value={d} min={-3} max={3} step={0.5} onChange={setD} fmt={(v) => num(v, 1)} />
        </div>
        <Readouts items={[['Matrix', `[[${num(a, 1)}, ${num(b, 1)}], [${num(c, 1)}, ${num(d, 1)}]]`], ['Determinant', num(det, 2), Math.abs(det) < 1e-9 ? 'singular: the plane collapses onto a line' : det < 0 ? 'orientation reversed' : 'area scale factor'], ['Eigenvalues', eigs.length ? eigs.map((l) => num(l, 3)).join(',  ') : 'complex (no real eigenvector: a rotation)', 'roots of λ² − (trace)λ + det']]} />
      </div>
    </Frame>
  )
}

/* ------------------------------------------------------------------ the binomial distribution */

const comb = (n: number, k: number) => { let c = 1; for (let i = 1; i <= k; i++) c = (c * (n - k + i)) / i; return c }

export function BinomLab() {
  const [n, setN] = useState(10)
  const [p, setP] = useState(0.4)
  const [k, setK] = useState(4)
  const kk = Math.min(k, n)
  const pm = (j: number) => comb(n, j) * p ** j * (1 - p) ** (n - j)
  const cdf = Array.from({ length: kk + 1 }, (_, j) => pm(j)).reduce((s, v) => s + v, 0)
  const top = Math.max(...Array.from({ length: n + 1 }, (_, j) => pm(j))) * 1.15
  return (
    <Frame caption="The binomial distribution counts the successes in n independent trials, each with success probability p. The bar at k has height P(X = k) = nCk pᵏ(1 − p)ⁿ⁻ᵏ. The distribution is centred on np and its spread is √(np(1 − p)). As n grows the bars trace out the bell-shaped normal curve.">
      <Plot x0={-0.5} x1={n + 0.5} y0={0} y1={top} label={`The binomial distribution with n = ${n} and p = ${p}`}>
        {(sx, sy) => <>{Array.from({ length: n + 1 }, (_, j) => <rect key={j} x={sx(j - 0.4)} y={sy(pm(j))} width={sx(j + 0.4) - sx(j - 0.4)} height={Math.max(0, sy(0) - sy(pm(j)))} className={j === kk ? 'w-bar a' : j < kk ? 'w-bar c' : 'w-bar b'} opacity={j <= kk ? 1 : 0.55} />)}</>}
      </Plot>
      <div className="widget-controls">
        <div className="two-col">
          <LinSlider label="Trials n" value={n} min={1} max={40} onChange={setN} fmt={(v) => String(v)} />
          <LinSlider label="Success probability p" value={p} min={0.05} max={0.95} step={0.05} onChange={setP} fmt={(v) => num(v, 2)} />
          <LinSlider label="k" value={kk} min={0} max={n} onChange={setK} fmt={(v) => String(v)} />
        </div>
        <Readouts items={[[`P(X = ${kk})`, num(pm(kk), 5)], [`P(X ≤ ${kk})`, num(cdf, 5)], ['Mean np', num(n * p, 3)], ['Standard deviation', num(Math.sqrt(n * p * (1 - p)), 3), '√(np(1 − p))']]} />
      </div>
    </Frame>
  )
}

/* ------------------------------------------------------------------ the normal distribution */

export function NormalLab() {
  const [mu, setMu] = useState(0)
  const [sg, setSg] = useState(1)
  const [lo, setLo] = useState(-1)
  const [hi, setHi] = useState(1)
  const l = Math.min(lo, hi), h = Math.max(lo, hi)
  const pdf = (x: number) => Math.exp(-0.5 * ((x - mu) / sg) ** 2) / (sg * Math.sqrt(2 * Math.PI))
  const x0 = mu - 4 * sg, x1 = mu + 4 * sg
  const prob = phi((h - mu) / sg) - phi((l - mu) / sg)
  return (
    <Frame caption="The normal distribution is the bell curve. The mean μ is its centre and the standard deviation σ its spread. The area under the curve between two values is the probability that X lies there. About 68% of the area lies within one standard deviation of the mean, 95% within two, and 99.7% within three.">
      <Plot x0={x0} x1={x1} y0={0} y1={0.45 / sg} label="A normal curve with the area between two values shaded">
        {(sx, sy) => {
          const xs = Array.from({ length: 81 }, (_, i) => Math.max(x0, l) + ((Math.min(x1, h) - Math.max(x0, l)) * i) / 80)
          return (
            <>
              {h > l && <polygon points={`${sx(xs[0])},${sy(0)} ${xs.map((x) => `${sx(x)},${sy(pdf(x))}`).join(' ')} ${sx(xs[80])},${sy(0)}`} className="w-area" />}
              <path d={curve(pdf, x0, x1, sx, sy, Infinity, 200)} className="w-curve" />
            </>
          )
        }}
      </Plot>
      <div className="widget-controls">
        <div className="two-col">
          <LinSlider label="Mean μ" value={mu} min={-5} max={5} step={0.5} onChange={setMu} fmt={(v) => num(v, 1)} />
          <LinSlider label="Standard deviation σ" value={sg} min={0.5} max={3} step={0.25} onChange={setSg} fmt={(v) => num(v, 2)} />
          <LinSlider label="From" value={lo} min={-12} max={12} step={0.25} onChange={setLo} fmt={(v) => num(v, 2)} />
          <LinSlider label="To" value={hi} min={-12} max={12} step={0.25} onChange={setHi} fmt={(v) => num(v, 2)} />
        </div>
        <Readouts items={[['z-scores', `${num((l - mu) / sg, 2)}  and  ${num((h - mu) / sg, 2)}`, 'z = (x − μ)/σ'], [`P(${num(l, 2)} < X < ${num(h, 2)})`, num(prob, 4), `${num(prob * 100, 2)}%`]]} />
      </div>
    </Frame>
  )
}

/* ------------------------------------------------------------------ least-squares regression */

const SETS: Record<string, [number, number][]> = {
  up: [[1, 2], [2, 3.5], [3, 3], [4, 5.5], [5, 6], [6, 7.5], [7, 7]],
  down: [[1, 9], [2, 7.5], [3, 7], [4, 5], [5, 4.5], [6, 2.5], [7, 2]],
  none: [[1, 4], [2, 6], [3, 3], [4, 5], [5, 3.5], [6, 5.5], [7, 4.5]],
}

export function Regression() {
  const [set, setSet] = useState('up')
  const [out, setOut] = useState(0)
  const pts: [number, number][] = [...SETS[set], ...(out ? ([[8, out]] as [number, number][]) : [])]
  const n = pts.length
  const mx = pts.reduce((s, p) => s + p[0], 0) / n, my = pts.reduce((s, p) => s + p[1], 0) / n
  const sxy = pts.reduce((s, p) => s + (p[0] - mx) * (p[1] - my), 0), sxx = pts.reduce((s, p) => s + (p[0] - mx) ** 2, 0), syy = pts.reduce((s, p) => s + (p[1] - my) ** 2, 0)
  const b = sxy / sxx, a = my - b * mx, rr = sxy / Math.sqrt(sxx * syy)
  return (
    <Frame caption="The least-squares line y = a + bx is the line that makes the sum of the squared vertical distances to the points as small as possible. Its slope is b = Σ(x − x̄)(y − ȳ)/Σ(x − x̄)², and it always passes through the point of means. The correlation r (between −1 and 1) measures how tightly the points hug a line. Add an outlier at x = 8 and watch how much one point can move the line.">
      <Plot x0={0} x1={9} y0={0} y1={12} label="A scatter plot with its least-squares line">
        {(sx, sy) => (
          <>
            <line x1={sx(0)} y1={sy(a)} x2={sx(9)} y2={sy(a + 9 * b)} className="w-curve" />
            {pts.map(([x, y], i) => <g key={i}><line x1={sx(x)} x2={sx(x)} y1={sy(y)} y2={sy(a + b * x)} className="w-ref" /><circle cx={sx(x)} cy={sy(y)} r={5} className="w-dot" /></g>)}
            <circle cx={sx(mx)} cy={sy(my)} r={5} className="w-joint" />
          </>
        )}
      </Plot>
      <div className="widget-controls">
        <Seg label="Data" value={set} options={[{ id: 'up', label: 'rising' }, { id: 'down', label: 'falling' }, { id: 'none', label: 'no pattern' }]} onChange={setSet} />
        <LinSlider label="Outlier at x = 8 (0 = none)" value={out} min={0} max={12} step={1} onChange={setOut} fmt={(v) => (v === 0 ? 'none' : String(v))} />
        <Readouts items={[['Line', `y = ${num(a, 3)} ${b < 0 ? MINUS : '+'} ${num(Math.abs(b), 3)}x`], ['Slope b', num(b, 4)], ['Correlation r', num(rr, 4), Math.abs(rr) > 0.8 ? 'strong' : Math.abs(rr) > 0.4 ? 'moderate' : 'weak'], ['Point of means', `(${num(mx, 2)}, ${num(my, 2)})`]]} />
      </div>
    </Frame>
  )
}
void PH; void PW
