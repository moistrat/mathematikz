import { useState } from 'react'
import { MINUS } from '../../math/exact'
import { Frame, LinSlider, Readouts, Seg } from './shared'
import { curve, Plot } from './Solving'

const num = (x: number, d = 3) => (Number.isFinite(x) ? Number(x.toFixed(d)).toString().replace('-', MINUS) : 'undefined')
const area = (f: (x: number) => number, a: number, b: number, n = 600) => { const h = (b - a) / n; let s = (f(a) + f(b)) / 2; for (let i = 1; i < n; i++) s += f(a + i * h); return s * h }

/* ------------------------------------------------------------------ a family of antiderivatives */

interface Fam { id: string; label: string; f: string; F: (x: number) => number; fn: (x: number) => number; x0: number; x1: number }
const FAMS: Fam[] = [
  { id: 'two', label: '2x', f: '2x', F: (x) => x * x, fn: (x) => 2 * x, x0: -3, x1: 3 },
  { id: 'cos', label: 'cos x', f: 'cos x', F: Math.sin, fn: Math.cos, x0: -6, x1: 6 },
  { id: 'exp', label: 'eˣ', f: 'eˣ', F: Math.exp, fn: Math.exp, x0: -3, x1: 3 },
  { id: 'sq', label: 'x²', f: 'x²', F: (x) => (x ** 3) / 3, fn: (x) => x * x, x0: -3, x1: 3 },
]

export function FamilyLab() {
  const [id, setId] = useState('two')
  const [C, setC] = useState(1)
  const [a, setA] = useState(1)
  const fam = FAMS.find((k) => k.id === id) ?? FAMS[0]
  const y0 = id === 'exp' ? -4 : -8, y1 = id === 'exp' ? 10 : 8
  const m = fam.fn(a)
  return (
    <Frame caption="Integrating undoes differentiating, but a derivative cannot tell two functions apart if they differ only by a constant. So an indefinite integral is a whole family of curves, each a vertical shift of the others. The tangents at the same x are all parallel, with gradient f(x). Choosing the constant C picks one curve of the family, which is how a point on the curve fixes the answer.">
      <Plot x0={fam.x0} x1={fam.x1} y0={y0} y1={y1} label={`The curves y = antiderivative of ${fam.f} plus C`}>
        {(sx, sy) => (
          <>
            {[-4, -3, -2, -1, 0, 1, 2, 3, 4].map((c) => <path key={c} d={curve((x) => fam.F(x) + c, fam.x0, fam.x1, sx, sy, 8, 300)} className="w-curve alt" opacity={0.35} />)}
            <path d={curve((x) => fam.F(x) + C, fam.x0, fam.x1, sx, sy, 8, 300)} className="w-curve" />
            <line x1={sx(a - 1)} y1={sy(fam.F(a) + C - m)} x2={sx(a + 1)} y2={sy(fam.F(a) + C + m)} className="w-ref" />
            <circle cx={sx(a)} cy={sy(fam.F(a) + C)} r={6} className="w-dot" />
          </>
        )}
      </Plot>
      <div className="widget-controls">
        <Seg label="Integrand" value={id} options={FAMS.map((k) => ({ id: k.id, label: k.label }))} onChange={setId} />
        <div className="two-col">
          <LinSlider label="Constant C" value={C} min={-4} max={4} onChange={setC} fmt={(v) => num(v, 0)} />
          <LinSlider label="Point x" value={a} min={Math.ceil(fam.x0 + 1)} max={Math.floor(fam.x1 - 1)} step={0.1} onChange={setA} fmt={(v) => num(v, 1)} />
        </div>
        <Readouts items={[['Integrand f(x)', fam.f], ['Highlighted curve', `y = F(x) + ${num(C, 0)}`], [`Height at x = ${num(a, 1)}`, num(fam.F(a) + C, 3)], ['Tangent gradient there', num(m, 3), 'the same for every C']]} />
      </div>
    </Frame>
  )
}

/* ------------------------------------------------------------------ Riemann sums */

interface Rf { id: string; label: string; f: (x: number) => number; a: number; b: number; exact: number; exactText: string; y1: number }
const RF: Rf[] = [
  { id: 'sq', label: 'x² on [0, 3]', f: (x) => x * x, a: 0, b: 3, exact: 9, exactText: '9', y1: 10 },
  { id: 'sin', label: 'sin x on [0, π]', f: Math.sin, a: 0, b: Math.PI, exact: 2, exactText: '2', y1: 1.3 },
  { id: 'sqrt', label: '√x on [0, 4]', f: Math.sqrt, a: 0, b: 4, exact: 16 / 3, exactText: '16/3', y1: 2.4 },
  { id: 'par', label: '4 − x² on [0, 2]', f: (x) => 4 - x * x, a: 0, b: 2, exact: 16 / 3, exactText: '16/3', y1: 4.5 },
]
type Mode = 'left' | 'right' | 'mid' | 'trap'

export function RiemannLab() {
  const [id, setId] = useState('sq')
  const [n, setN] = useState(6)
  const [mode, setMode] = useState<Mode>('left')
  const r = RF.find((k) => k.id === id) ?? RF[0]
  const h = (r.b - r.a) / n
  const xs = Array.from({ length: n }, (_, i) => r.a + i * h)
  const hgt = (x: number) => (mode === 'left' ? r.f(x) : mode === 'right' ? r.f(x + h) : r.f(x + h / 2))
  const sum = mode === 'trap' ? xs.reduce((s, x) => s + ((r.f(x) + r.f(x + h)) / 2) * h, 0) : xs.reduce((s, x) => s + hgt(x) * h, 0)
  return (
    <Frame caption="Cut the interval into n strips and approximate the area under the curve by simple shapes. With more strips the shapes fit the curve better and the total settles on a single number: the definite integral. Left and right sums are too small or too large when the function is increasing or decreasing. The trapezium and midpoint rules are much more accurate for the same effort.">
      <Plot x0={r.a - 0.2} x1={r.b + 0.2} y0={-0.1 * r.y1} y1={r.y1} label={`${mode} sum with ${n} strips under ${r.label}`}>
        {(sx, sy) => (
          <>
            {xs.map((x, i) => mode === 'trap'
              ? <polygon key={i} points={`${sx(x)},${sy(0)} ${sx(x)},${sy(r.f(x))} ${sx(x + h)},${sy(r.f(x + h))} ${sx(x + h)},${sy(0)}`} className="w-area" stroke="var(--accent)" strokeWidth={1} />
              : <rect key={i} x={sx(x)} y={sy(Math.max(0, hgt(x)))} width={Math.max(0, sx(x + h) - sx(x))} height={Math.abs(sy(0) - sy(hgt(x)))} className="w-area" stroke="var(--accent)" strokeWidth={1} />)}
            <path d={curve(r.f, r.a, r.b, sx, sy, Infinity, 300)} className="w-curve" />
          </>
        )}
      </Plot>
      <div className="widget-controls">
        <Seg label="Rule" value={mode} options={[{ id: 'left', label: 'left' }, { id: 'right', label: 'right' }, { id: 'mid', label: 'midpoint' }, { id: 'trap', label: 'trapezium' }]} onChange={setMode} />
        <Seg label="Function" value={id} options={RF.map((k) => ({ id: k.id, label: k.label }))} onChange={setId} />
        <LinSlider label="Number of strips n" value={n} min={1} max={60} onChange={setN} fmt={(v) => String(v)} />
        <Readouts items={[['Estimate', num(sum, 4)], ['Exact value of the integral', r.exactText, `= ${num(r.exact, 4)}`], ['Error', num(sum - r.exact, 4), sum > r.exact + 1e-9 ? 'an overestimate' : sum < r.exact - 1e-9 ? 'an underestimate' : 'exact']]} />
      </div>
    </Frame>
  )
}

/* ------------------------------------------------------------------ the accumulation function and the fundamental theorem */

interface Acc { id: string; label: string; f: (t: number) => number; x0: number; x1: number; y0: number; y1: number; closed: string }
const ACC: Acc[] = [
  { id: 'cos', label: 'cos t', f: Math.cos, x0: 0, x1: 6.3, y0: -1.5, y1: 1.5, closed: 'sin x' },
  { id: 'lin', label: '2 − t', f: (t) => 2 - t, x0: 0, x1: 5, y0: -3, y1: 3, closed: '2x − x²/2' },
  { id: 'sq', label: 't²', f: (t) => t * t, x0: 0, x1: 3, y0: -1, y1: 10, closed: 'x³/3' },
  { id: 'exp', label: 'e^(−t)', f: (t) => Math.exp(-t), x0: 0, x1: 5, y0: -0.2, y1: 1.2, closed: '1 − e^(−x)' },
]

export function AccumLab() {
  const [id, setId] = useState('cos')
  const [x, setX] = useState(2)
  const g = ACC.find((k) => k.id === id) ?? ACC[0]
  const xc = Math.max(g.x0 + 0.05, Math.min(g.x1, x))
  const A = (u: number) => area(g.f, 0, u, 300)
  const xs = Array.from({ length: 61 }, (_, i) => g.x0 + ((xc - g.x0) * i) / 60)
  const aLo = Math.min(...Array.from({ length: 80 }, (_, i) => A(g.x0 + ((g.x1 - g.x0) * i) / 79)), -0.2), aHi = Math.max(...Array.from({ length: 80 }, (_, i) => A(g.x0 + ((g.x1 - g.x0) * i) / 79)), 0.2)
  return (
    <Frame caption="Top: the graph of f, with the area from 0 up to x shaded (area below the axis counts as negative). Bottom: that area, A(x), plotted as a function of x. Its gradient at any point is the height of f there: the area function is an antiderivative of f. This is the fundamental theorem of calculus: differentiating the accumulated area gives back the function.">
      <Plot x0={g.x0} x1={g.x1} y0={g.y0} y1={g.y1} label={`The area under ${g.label} from 0 to x`}>
        {(sx, sy) => (
          <>
            <polygon points={`${sx(0)},${sy(0)} ${xs.map((t) => `${sx(t)},${sy(g.f(t))}`).join(' ')} ${sx(xc)},${sy(0)}`} className="w-area" />
            <path d={curve(g.f, g.x0, g.x1, sx, sy, Infinity, 300)} className="w-curve" />
            <line x1={sx(xc)} x2={sx(xc)} y1={sy(0)} y2={sy(g.f(xc))} className="w-ref" />
          </>
        )}
      </Plot>
      <Plot x0={g.x0} x1={g.x1} y0={aLo - 0.1 * (aHi - aLo)} y1={aHi + 0.1 * (aHi - aLo)} label="The accumulated area A(x)">
        {(sx, sy) => (
          <>
            <path d={curve(A, g.x0, g.x1, sx, sy, Infinity, 120)} className="w-curve alt" />
            <circle cx={sx(xc)} cy={sy(A(xc))} r={6} className="w-dot" />
            <line x1={sx(xc - 0.6)} y1={sy(A(xc) - 0.6 * g.f(xc))} x2={sx(xc + 0.6)} y2={sy(A(xc) + 0.6 * g.f(xc))} className="w-ref" />
          </>
        )}
      </Plot>
      <div className="widget-controls">
        <Seg label="Function" value={id} options={ACC.map((k) => ({ id: k.id, label: k.label }))} onChange={setId} />
        <LinSlider label="x" value={xc} min={g.x0 + 0.05} max={g.x1} step={0.05} onChange={setX} fmt={(v) => num(v, 2)} />
        <Readouts items={[['f(x)', num(g.f(xc), 4), 'the gradient of the lower graph here'], ['Area A(x)', num(A(xc), 4), `exactly ${g.closed}`]]} />
      </div>
    </Frame>
  )
}

/* ------------------------------------------------------------------ area between two curves */

export function BetweenLab() {
  const [k, setK] = useState(3)
  const f = (x: number) => x * x, g = (x: number) => k * x
  const A = (k ** 3) / 6
  return (
    <Frame caption="The region between two curves has area ∫ (top − bottom) dx between their intersection points. For the parabola y = x² and the line y = kx the curves meet at x = 0 and x = k, the line is on top, and the area is k³/6. Slide k to see the region grow.">
      <Plot x0={-0.5} x1={k + 1} y0={-0.5} y1={k * k + 1} label="The region between a parabola and a line">
        {(sx, sy) => {
          const xs = Array.from({ length: 61 }, (_, i) => (k * i) / 60)
          return (
            <>
              <polygon points={`${xs.map((x) => `${sx(x)},${sy(g(x))}`).join(' ')} ${[...xs].reverse().map((x) => `${sx(x)},${sy(f(x))}`).join(' ')}`} className="w-area" />
              <path d={curve(f, -0.5, k + 1, sx, sy, Infinity, 300)} className="w-curve" />
              <path d={curve(g, -0.5, k + 1, sx, sy, Infinity, 60)} className="w-curve alt" />
            </>
          )
        }}
      </Plot>
      <div className="widget-controls">
        <LinSlider label="Slope k of the line y = kx" value={k} min={1} max={6} onChange={setK} fmt={(v) => String(v)} />
        <Readouts items={[['Intersections', `x = 0 and x = ${k}`, 'x² = kx'], ['Area', `${k}³/6 = ${num(A, 3)}`, '∫ from 0 to k of (kx − x²) dx'], ['Check', num(area((x) => g(x) - f(x), 0, k), 3), 'numerical estimate']]} />
      </div>
    </Frame>
  )
}

/* ------------------------------------------------------------------ solids of revolution */

interface Prof { id: string; label: string; f: (x: number) => number; a: number; b: number }
const PROF: Prof[] = [
  { id: 'sqrt', label: 'y = √x', f: Math.sqrt, a: 0, b: 4 },
  { id: 'line', label: 'y = x/2', f: (x) => x / 2, a: 0, b: 4 },
  { id: 'par', label: 'y = x²/4', f: (x) => (x * x) / 4, a: 0, b: 4 },
  { id: 'bump', label: 'y = sin x', f: Math.sin, a: 0, b: Math.PI },
]

export function RevolveLab() {
  const [id, setId] = useState('sqrt')
  const [n, setN] = useState(8)
  const p = PROF.find((k) => k.id === id) ?? PROF[0]
  const h = (p.b - p.a) / n
  const mids = Array.from({ length: n }, (_, i) => p.a + (i + 0.5) * h)
  const est = mids.reduce((s, x) => s + Math.PI * p.f(x) ** 2 * h, 0)
  const exact = Math.PI * area((x) => p.f(x) ** 2, p.a, p.b)
  const ymax = Math.max(...Array.from({ length: 80 }, (_, i) => p.f(p.a + ((p.b - p.a) * i) / 79)))
  return (
    <Frame caption="Spin the curve about the x-axis and slice the solid into n thin discs. Each disc is a cylinder with radius f(x) and thickness h, so its volume is πf(x)²h. Adding the discs approximates the volume, and as n grows the sum becomes the integral V = π ∫ f(x)² dx.">
      <Plot x0={p.a - 0.3} x1={p.b + 0.3} y0={-ymax * 1.2} y1={ymax * 1.2} label={`A solid made by rotating ${p.label} about the x-axis, cut into discs`}>
        {(sx, sy) => (
          <>
            {mids.map((x, i) => <rect key={i} x={sx(x - h / 2)} y={sy(p.f(x))} width={Math.max(0, sx(x + h / 2) - sx(x - h / 2))} height={Math.abs(sy(-p.f(x)) - sy(p.f(x)))} className="w-area" stroke="var(--accent)" strokeWidth={1} />)}
            <path d={curve(p.f, p.a, p.b, sx, sy, Infinity, 200)} className="w-curve" />
            <path d={curve((x) => -p.f(x), p.a, p.b, sx, sy, Infinity, 200)} className="w-curve" />
          </>
        )}
      </Plot>
      <div className="widget-controls">
        <Seg label="Curve" value={id} options={PROF.map((k) => ({ id: k.id, label: k.label }))} onChange={setId} />
        <LinSlider label="Number of discs n" value={n} min={1} max={40} onChange={setN} fmt={(v) => String(v)} />
        <Readouts items={[['Sum of the discs', num(est, 3)], ['Exact volume π ∫ y² dx', num(exact, 3), `≈ ${num(exact / Math.PI, 4)}π`], ['Difference', num(est - exact, 3)]]} />
      </div>
    </Frame>
  )
}

/* ------------------------------------------------------------------ step-by-step guides */

function Stepper({ items, labels, caption }: { items: { head: string; steps: [string, string][] }[]; labels: string[]; caption: string }) {
  const [i, setI] = useState(0)
  const [shown, setShown] = useState(1)
  const it = items[i]
  const pick = (k: number) => { setI(k); setShown(1) }
  return (
    <Frame caption={caption}>
      <div className="widget-controls">
        <Seg label="Integral" value={String(i)} options={labels.map((l, k) => ({ id: String(k), label: l }))} onChange={(v) => pick(Number(v))} />
        <p className="stepper-head"><strong>{it.head}</strong></p>
        <ol className="stepper-list">
          {it.steps.slice(0, shown).map(([name, text], k) => <li key={k}><span className="muted">{name}</span> {text}</li>)}
        </ol>
        <div className="seg" role="group" aria-label="Steps">
          <button type="button" onClick={() => setShown(Math.min(it.steps.length, shown + 1))} disabled={shown >= it.steps.length}>Next step</button>
          <button type="button" onClick={() => setShown(1)}>Start again</button>
        </div>
      </div>
    </Frame>
  )
}

export function SubSteps() {
  const items = [
    { head: '∫ 2x(x² + 1)³ dx', steps: [['Choose u.', 'Look for a function whose derivative is also present: u = x² + 1.'], ['Differentiate.', 'du = 2x dx, which is exactly the other factor.'], ['Substitute.', '∫ u³ du.'], ['Integrate.', 'u⁴/4 + C.'], ['Substitute back.', '(x² + 1)⁴/4 + C.']] },
    { head: '∫ x e^(x²) dx', steps: [['Choose u.', 'The exponent: u = x².'], ['Differentiate.', 'du = 2x dx, so x dx = du/2.'], ['Substitute.', '(1/2) ∫ eᵘ du.'], ['Integrate.', 'eᵘ/2 + C.'], ['Substitute back.', 'e^(x²)/2 + C.']] },
    { head: '∫ cos x sin²x dx', steps: [['Choose u.', 'u = sin x, whose derivative cos x is present.'], ['Differentiate.', 'du = cos x dx.'], ['Substitute.', '∫ u² du.'], ['Integrate.', 'u³/3 + C.'], ['Substitute back.', 'sin³x/3 + C.']] },
    { head: '∫ x/(x² + 4) dx', steps: [['Choose u.', 'The bottom: u = x² + 4.'], ['Differentiate.', 'du = 2x dx, so x dx = du/2.'], ['Substitute.', '(1/2) ∫ du/u.'], ['Integrate.', '(1/2) ln|u| + C.'], ['Substitute back.', '(1/2) ln(x² + 4) + C.']] },
    { head: '∫ (3x − 1)⁵ dx', steps: [['Choose u.', 'The inside of the bracket: u = 3x − 1.'], ['Differentiate.', 'du = 3 dx, so dx = du/3.'], ['Substitute.', '(1/3) ∫ u⁵ du.'], ['Integrate.', 'u⁶/18 + C.'], ['Substitute back.', '(3x − 1)⁶/18 + C.']] },
    { head: '∫ x√(x + 1) dx', steps: [['Choose u.', 'u = x + 1, so x = u − 1.'], ['Differentiate.', 'du = dx.'], ['Substitute.', '∫ (u − 1)√u du = ∫ (u^(3/2) − u^(1/2)) du.'], ['Integrate.', '(2/5)u^(5/2) − (2/3)u^(3/2) + C.'], ['Substitute back.', '2(x + 1)^(3/2)(3x − 2)/15 + C.']] },
  ] as { head: string; steps: [string, string][] }[]
  return <Stepper items={items} labels={['2x(x²+1)³', 'x e^(x²)', 'cos x sin²x', 'x/(x²+4)', '(3x−1)⁵', 'x√(x+1)']} caption="Substitution undoes the chain rule. Look for an inner function whose derivative (up to a constant) also appears, replace it by u, integrate in u, and substitute back. Step through each example." />
}

export function PartSteps() {
  const items = [
    { head: '∫ x eˣ dx', steps: [['Choose u and dv.', 'u = x (it gets simpler), dv = eˣ dx.'], ['Differentiate and integrate.', 'du = dx, v = eˣ.'], ['Apply uv − ∫ v du.', 'x eˣ − ∫ eˣ dx.'], ['Finish.', '(x − 1)eˣ + C.']] },
    { head: '∫ x sin x dx', steps: [['Choose u and dv.', 'u = x, dv = sin x dx.'], ['Differentiate and integrate.', 'du = dx, v = −cos x.'], ['Apply uv − ∫ v du.', '−x cos x + ∫ cos x dx.'], ['Finish.', '−x cos x + sin x + C.']] },
    { head: '∫ ln x dx', steps: [['Choose u and dv.', 'Write ln x as 1 × ln x: u = ln x, dv = dx.'], ['Differentiate and integrate.', 'du = dx/x, v = x.'], ['Apply uv − ∫ v du.', 'x ln x − ∫ 1 dx.'], ['Finish.', 'x ln x − x + C.']] },
    { head: '∫ x ln x dx', steps: [['Choose u and dv.', 'u = ln x (we cannot integrate it easily), dv = x dx.'], ['Differentiate and integrate.', 'du = dx/x, v = x²/2.'], ['Apply uv − ∫ v du.', '(x²/2) ln x − ∫ x/2 dx.'], ['Finish.', '(x²/2) ln x − x²/4 + C.']] },
    { head: '∫ x² eˣ dx', steps: [['Choose u and dv.', 'u = x², dv = eˣ dx.'], ['Differentiate and integrate.', 'du = 2x dx, v = eˣ.'], ['Apply uv − ∫ v du.', 'x²eˣ − 2 ∫ x eˣ dx. Another integration by parts is needed.'], ['Use the first example.', '∫ x eˣ dx = (x − 1)eˣ, so the total is x²eˣ − 2(x − 1)eˣ.'], ['Finish.', '(x² − 2x + 2)eˣ + C.']] },
    { head: '∫ tan⁻¹ x dx', steps: [['Choose u and dv.', 'u = tan⁻¹ x, dv = dx.'], ['Differentiate and integrate.', 'du = dx/(1 + x²), v = x.'], ['Apply uv − ∫ v du.', 'x tan⁻¹ x − ∫ x/(1 + x²) dx.'], ['Substitute for the last integral.', '∫ x/(1 + x²) dx = (1/2) ln(1 + x²).'], ['Finish.', 'x tan⁻¹ x − (1/2) ln(1 + x²) + C.']] },
  ] as { head: string; steps: [string, string][] }[]
  return <Stepper items={items} labels={['x eˣ', 'x sin x', 'ln x', 'x ln x', 'x² eˣ', 'tan⁻¹ x']} caption="Integration by parts undoes the product rule: ∫ u dv = uv − ∫ v du. Choose u to be the factor that gets simpler when differentiated (logarithms and inverse functions first, then powers of x, then exponentials and trig). Step through each example." />
}
