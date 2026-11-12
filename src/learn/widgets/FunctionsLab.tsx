import { useMemo, useState } from 'react'
import { fmtPoly, parsePoly, pDivide } from '../../math/algebra'
import { MINUS } from '../../math/exact'
import { fmtIntervals, fmtSet, IntervalSet } from '../../math/solve'
import { Frame, LinSlider, Readouts, Seg } from './shared'
import { curve, Plot } from './Solving'

const num = (x: number) => Number(x.toFixed(2)).toString().replace('-', MINUS)
const sgn = (k: number) => (k < 0 ? MINUS : '+')

/* ------------------------------------------------------------------ transformations of a basic graph */

interface Base { id: string; label: string; f: (x: number) => number; name: string; pts: [number, number][]; jump?: number }
const BASES: Base[] = [
  { id: 'sq', label: 'x²', f: (x) => x * x, name: 'x²', pts: [[-2, 4], [0, 0], [2, 4]] },
  { id: 'cube', label: 'x³', f: (x) => x ** 3, name: 'x³', pts: [[-1.5, -3.375], [0, 0], [1.5, 3.375]] },
  { id: 'abs', label: '|x|', f: (x) => Math.abs(x), name: '|x|', pts: [[-2, 2], [0, 0], [2, 2]] },
  { id: 'sqrt', label: '√x', f: (x) => (x >= 0 ? Math.sqrt(x) : NaN), name: '√x', pts: [[0, 0], [1, 1], [4, 2]] },
  { id: 'rec', label: '1/x', f: (x) => (x === 0 ? NaN : 1 / x), name: '1/x', pts: [[-2, -0.5], [1, 1], [2, 0.5]], jump: 6 },
]

export function Transform() {
  const [id, setId] = useState('sq')
  const [a, setA] = useState(1)
  const [b, setB] = useState(1)
  const [h, setH] = useState(0)
  const [k, setK] = useState(0)
  const base = BASES.find((x) => x.id === id)!
  const g = (x: number) => a * base.f(b * (x - h)) + k
  const moved = base.pts.map(([x, y]): [number, number] => [x / b + h, a * y + k])
  const inner = b === 1 ? (h === 0 ? 'x' : `x ${h < 0 ? '+' : MINUS} ${Math.abs(h)}`) : `${b === -1 ? MINUS : num(b)}(${h === 0 ? 'x' : `x ${h < 0 ? '+' : MINUS} ${Math.abs(h)}`})`
  const eq = `${a === 1 ? '' : a === -1 ? MINUS : num(a)}f(${inner})${k === 0 ? '' : ` ${sgn(k)} ${Math.abs(k)}`}`
  const words: string[] = []
  if (h !== 0) words.push(`shifted ${Math.abs(h)} to the ${h > 0 ? 'right' : 'left'}`)
  if (k !== 0) words.push(`shifted ${Math.abs(k)} ${k > 0 ? 'up' : 'down'}`)
  if (a < 0) words.push('reflected in the x-axis')
  if (Math.abs(a) !== 1) words.push(`stretched vertically by ${num(Math.abs(a))}`)
  if (b < 0) words.push('reflected in the y-axis')
  if (Math.abs(b) !== 1) words.push(`${Math.abs(b) > 1 ? 'compressed' : 'stretched'} horizontally by a factor of ${num(Math.abs(b) > 1 ? Math.abs(b) : 1 / Math.abs(b))}`)
  return (
    <Frame caption="The dim curve is the basic graph y = f(x). The bright curve is y = a·f(b(x − h)) + k. Changes outside the bracket act on y and do what they look like; changes inside act on x and do the opposite. The dots follow three key points.">
      <Plot x0={-8} x1={8} y0={-8} y1={8} label={`Graph of y = ${eq} where f(x) = ${base.name}`}>
        {(sx, sy) => (
          <>
            <path d={curve(base.f, -8, 8, sx, sy, base.jump ?? Infinity, 600)} className="w-curve alt" />
            <path d={curve(g, -8, 8, sx, sy, base.jump ? base.jump * Math.abs(a) : Infinity, 800)} className="w-curve" />
            {base.pts.map(([x, y], i) => <circle key={`b${i}`} cx={sx(x)} cy={sy(y)} r={4} className="w-e dim" />)}
            {moved.map(([x, y], i) => <circle key={`m${i}`} cx={sx(x)} cy={sy(y)} r={5.5} className="w-dot" />)}
          </>
        )}
      </Plot>
      <div className="widget-controls">
        <Seg label="Basic graph" value={id} options={BASES.map((x) => ({ id: x.id, label: x.label }))} onChange={setId} />
        <div className="two-col">
          <LinSlider label="a (vertical)" value={a} min={-3} max={3} step={0.5} onChange={setA} fmt={num} />
          <LinSlider label="b (horizontal)" value={b} min={-3} max={3} step={0.5} onChange={(v) => setB(v === 0 ? 0.5 : v)} fmt={num} />
          <LinSlider label="h (right)" value={h} min={-6} max={6} onChange={setH} fmt={num} />
          <LinSlider label="k (up)" value={k} min={-6} max={6} onChange={setK} fmt={num} />
        </div>
        <Readouts items={[
          [`y = ${eq}`, `where f(x) = ${base.name}`],
          ['In words', words.length ? words.join(', then ') : 'no change: the same graph'],
          ['Key points', moved.map(([x, y]) => `(${num(x)}, ${num(y)})`).join('  '), 'x → x/b + h and y → a·y + k'],
        ]} />
      </div>
    </Frame>
  )
}

/* ------------------------------------------------------------------ inverse functions as mirror images */

interface Inv { id: string; label: string; f: (x: number) => number; inv: (x: number) => number; text: string; invText: string; note: string }
const INVS: Inv[] = [
  { id: 'lin', label: '2x + 1', f: (x) => 2 * x + 1, inv: (x) => (x - 1) / 2, text: '2x + 1', invText: '(x − 1)/2', note: 'Undo ×2 and +1 in reverse order: subtract 1, then divide by 2.' },
  { id: 'cube', label: 'x³ + 1', f: (x) => x ** 3 + 1, inv: (x) => Math.cbrt(x - 1), text: 'x³ + 1', invText: '∛(x − 1)', note: 'One-to-one over all the reals, so no restriction is needed.' },
  { id: 'exp', label: '2ˣ', f: (x) => 2 ** x, inv: (x) => (x > 0 ? Math.log2(x) : NaN), text: '2ˣ', invText: 'log₂ x', note: 'The inverse of an exponential is a logarithm.' },
  { id: 'rec', label: '1/x + 2', f: (x) => (x === 0 ? NaN : 1 / x + 2), inv: (x) => (x === 2 ? NaN : 1 / (x - 2)), text: '1/x + 2', invText: '1/(x − 2)', note: 'The asymptotes swap: the vertical x = 0 and horizontal y = 2 become y = 0 and x = 2.' },
  { id: 'sq', label: 'x² (x ≥ 0)', f: (x) => (x >= 0 ? x * x : NaN), inv: (x) => (x >= 0 ? Math.sqrt(x) : NaN), text: 'x², x ≥ 0', invText: '√x', note: 'x² is not one-to-one over all the reals (it fails the horizontal line test), so we restrict it to x ≥ 0 first.' },
]

export function InverseGraph() {
  const [id, setId] = useState('lin')
  const [x, setX] = useState(1)
  const fn = INVS.find((i) => i.id === id)!
  const y = fn.f(x)
  return (
    <Frame caption="The graph of an inverse function is the original reflected in the line y = x: every point (a, b) becomes (b, a). If a function fails the horizontal line test it has no inverse, unless its domain is restricted first.">
      <Plot x0={-8} x1={8} y0={-8} y1={8} label={`Graphs of f(x) = ${fn.text} and its inverse`}>
        {(sx, sy) => (
          <>
            <line x1={sx(-8)} y1={sy(-8)} x2={sx(8)} y2={sy(8)} className="w-ref" />
            <path d={curve(fn.f, -8, 8, sx, sy, 6, 800)} className="w-curve" />
            <path d={curve(fn.inv, -8, 8, sx, sy, 6, 800)} className="w-curve alt" />
            {Number.isFinite(y) && <><circle cx={sx(x)} cy={sy(y)} r={6} className="w-dot" /><circle cx={sx(y)} cy={sy(x)} r={6} className="w-open" /></>}
          </>
        )}
      </Plot>
      <div className="widget-controls">
        <Seg label="Function" value={id} options={INVS.map((i) => ({ id: i.id, label: i.label }))} onChange={setId} />
        <LinSlider label="x" value={x} min={-4} max={4} step={0.5} onChange={setX} fmt={num} />
        <Readouts items={[
          ['f(x)', fn.text],
          ['Inverse f⁻¹(x)', fn.invText, fn.note],
          [`f(${num(x)})`, Number.isFinite(y) ? num(y) : 'not defined here', Number.isFinite(y) ? `so f⁻¹(${num(y)}) = ${num(x)}: the mirror point is (${num(y)}, ${num(x)})` : undefined],
        ]} />
      </div>
    </Frame>
  )
}

/* ------------------------------------------------------------------ composition machine */

interface Piece { id: string; label: string; f: (x: number) => number; text: string }
const PIECES: Piece[] = [
  { id: 'dbl', label: '2x', f: (x) => 2 * x, text: '2x' },
  { id: 'add', label: 'x + 3', f: (x) => x + 3, text: 'x + 3' },
  { id: 'sq', label: 'x²', f: (x) => x * x, text: 'x²' },
  { id: 'neg', label: '−x', f: (x) => -x, text: '−x' },
  { id: 'rec', label: '1/x', f: (x) => (x === 0 ? NaN : 1 / x), text: '1/x' },
]

export function Composer() {
  const [fi, setFi] = useState('sq')
  const [gi, setGi] = useState('add')
  const [x, setX] = useState(2)
  const f = PIECES.find((p) => p.id === fi)!, g = PIECES.find((p) => p.id === gi)!
  const gx = g.f(x), fgx = f.f(gx), fx = f.f(x), gfx = g.f(fx)
  const same = Number.isFinite(fgx) && Number.isFinite(gfx) && Math.abs(fgx - gfx) < 1e-9
  return (
    <Frame caption="A composition is a machine feeding a machine: x goes into g, and g's output goes into f. The order matters, because f(g(x)) and g(f(x)) are usually different functions.">
      <Plot x0={-6} x1={6} y0={-8} y1={8} label={`Graphs of f(g(x)) and g(f(x)) for f(x) = ${f.text} and g(x) = ${g.text}`}>
        {(sx, sy) => (
          <>
            <path d={curve((t) => f.f(g.f(t)), -6, 6, sx, sy, 6, 800)} className="w-curve" />
            <path d={curve((t) => g.f(f.f(t)), -6, 6, sx, sy, 6, 800)} className="w-curve alt" />
            {Number.isFinite(fgx) && <circle cx={sx(x)} cy={sy(fgx)} r={6} className="w-dot" />}
            {Number.isFinite(gfx) && <circle cx={sx(x)} cy={sy(gfx)} r={6} className="w-open" />}
          </>
        )}
      </Plot>
      <div className="widget-controls">
        <div className="two-col">
          <Seg label="Outer function f" value={fi} options={PIECES.map((p) => ({ id: p.id, label: p.label }))} onChange={setFi} />
          <Seg label="Inner function g" value={gi} options={PIECES.map((p) => ({ id: p.id, label: p.label }))} onChange={setGi} />
        </div>
        <LinSlider label="x" value={x} min={-4} max={4} step={0.5} onChange={setX} fmt={num} />
        <Readouts items={[
          [`f(g(${num(x)}))  (bright curve)`, Number.isFinite(fgx) ? `g(${num(x)}) = ${num(gx)}, then f(${num(gx)}) = ${num(fgx)}` : 'not defined here'],
          [`g(f(${num(x)}))  (grey curve)`, Number.isFinite(gfx) ? `f(${num(x)}) = ${num(fx)}, then g(${num(fx)}) = ${num(gfx)}` : 'not defined here'],
          ['Same?', same ? 'equal at this x, but check other values of x' : 'different: order matters'],
        ]} />
      </div>
    </Frame>
  )
}

/* ------------------------------------------------------------------ sketching a polynomial from its roots */

export function PolySketch() {
  const [roots, setRoots] = useState<[number, number, number]>([-3, 0, 2])
  const [mult, setMult] = useState<[number, number, number]>([1, 2, 1])
  const [sign, setSign] = useState<1 | -1>(1)
  const f = useMemo(() => (x: number) => sign * roots.reduce((p, r, i) => p * (x - r) ** mult[i], 1), [roots, mult, sign])
  let peak = 1
  for (let x = -6.5; x <= 6.5; x += 0.05) peak = Math.max(peak, Math.abs(f(x)))
  const scale = 6 / Math.min(peak, 1e9)
  const g = (x: number) => f(x) * scale
  const degree = mult[0] + mult[1] + mult[2]
  const distinct = [...new Set(roots)]
  const setRoot = (i: number) => (v: number) => setRoots((o) => o.map((x, j) => (j === i ? v : x)) as [number, number, number])
  const setMul = (i: number) => (v: number) => setMult((o) => o.map((x, j) => (j === i ? v : x)) as [number, number, number])
  // merge repeated root values so that the shown multiplicity is the total
  const total = new Map<number, number>()
  roots.forEach((r, i) => total.set(r, (total.get(r) ?? 0) + mult[i]))
  const label = [...total.entries()].sort((p, q) => p[0] - q[0])
  const factored = `${sign < 0 ? MINUS : ''}${label.map(([r, m]) => `(x${r === 0 ? '' : r < 0 ? ` + ${-r}` : ` ${MINUS} ${r}`})${m > 1 ? '⁰¹²³⁴⁵⁶⁷⁸⁹'[m] : ''}`).join('')}`
  const expanded = fmtPoly(parsePoly(`${sign}${roots.map((r, i) => `(x-(${r}))^${mult[i]}`).join('')}`))
  const rightUp = sign > 0
  const leftUp = degree % 2 === 0 ? sign > 0 : sign < 0
  return (
    <Frame caption="A polynomial crosses the axis at a root of odd multiplicity (flattening if it is 3) and touches and turns back at a root of even multiplicity. The ends follow the leading term: the degree decides whether they point the same way, the sign decides which way. The vertical scale is adjusted to fit.">
      <Plot x0={-7} x1={7} y0={-8} y1={8} label={`Sketch of y = ${factored}`}>
        {(sx, sy) => (
          <>
            <path d={curve(g, -7, 7, sx, sy, Infinity, 700)} className="w-curve" />
            {distinct.map((r) => <circle key={r} cx={sx(r)} cy={sy(0)} r={6} className={(total.get(r) ?? 1) % 2 === 1 ? 'w-dot' : 'w-open'} />)}
          </>
        )}
      </Plot>
      <div className="widget-controls">
        <div className="two-col">
          {[0, 1, 2].map((i) => (
            <div key={i} className="mult-row">
              <LinSlider label={`Root ${i + 1}`} value={roots[i]} min={-5} max={5} onChange={setRoot(i)} fmt={num} />
              <Seg label={`Multiplicity of root ${i + 1}`} value={String(mult[i]) as '1' | '2' | '3'} options={[{ id: '1', label: '×1' }, { id: '2', label: '×2' }, { id: '3', label: '×3' }]} onChange={(v) => setMul(i)(Number(v))} />
            </div>
          ))}
          <Seg label="Leading coefficient" value={String(sign) as '1' | '-1'} options={[{ id: '1', label: 'positive' }, { id: '-1', label: 'negative' }]} onChange={(v) => setSign(Number(v) as 1 | -1)} />
        </div>
        <Readouts items={[
          ['Factored form', factored],
          ['Expanded form', expanded, `degree ${degree}`],
          ['End behaviour', `left: ${leftUp ? 'up' : 'down'}, right: ${rightUp ? 'up' : 'down'}`, degree % 2 === 0 ? 'even degree: the ends point the same way' : 'odd degree: the ends point opposite ways'],
          ['Turning points', `at most ${degree - 1}`, 'a polynomial of degree n has at most n − 1 of them'],
          ['Filled dot / open dot', 'crosses / touches', 'the axis crossing at a root of odd / even multiplicity'],
        ]} />
      </div>
    </Frame>
  )
}

/* ------------------------------------------------------------------ asymptotes of a rational function */

export function Asymptotes() {
  const [n1, setN1] = useState(-2)
  const [n2, setN2] = useState(3)
  const [d1, setD1] = useState(1)
  const [d2, setD2] = useState(-3)
  const [denDeg, setDenDeg] = useState<'1' | '2'>('2')
  const quadDen = denDeg === '2'
  const numStr = `(x-(${n1}))(x-(${n2}))`, denStr = quadDen ? `(x-(${d1}))(x-(${d2}))` : `(x-(${d1}))`
  const f = (x: number) => ((x - n1) * (x - n2)) / ((x - d1) * (quadDen ? x - d2 : 1))
  const dRoots = quadDen ? [d1, d2] : [d1]
  const holes = [...new Set([n1, n2])].filter((r) => dRoots.includes(r))
  const vas = [...new Set(dRoots)].filter((r) => {
    const mult = (v: number) => dRoots.filter((q) => q === v).length - [n1, n2].filter((q) => q === v).length
    return mult(r) > 0
  })
  const degNum = 2, degDen = quadDen ? 2 : 1
  const quotient = !quadDen ? pDivide(parsePoly(`${numStr}`), parsePoly(denStr)).q : []
  const slant = !quadDen ? fmtPoly(quotient) : ''
  const c0 = quotient.find((t) => Object.keys(t.e).length === 0)?.c
  const slantShift = c0 ? c0.n / c0.d : 0
  const br = (r: number) => (r === 0 ? 'x' : `(x ${r < 0 ? '+' : MINUS} ${Math.abs(r)})`)
  const hy = quadDen ? 1 : null
  const holeY = (r: number) => {
    // value after cancelling the common factor
    const e = 1e-6
    return (f(r + e) + f(r - e)) / 2
  }
  return (
    <Frame caption="Vertical asymptotes sit where the denominator is zero and does not cancel. A factor that cancels leaves a hole instead. For large x the graph follows the horizontal or oblique asymptote, decided by comparing degrees.">
      <Plot x0={-8} x1={8} y0={-8} y1={8} label={`Graph of y = ${br(n1)}${br(n2)} over ${quadDen ? `${br(d1)}${br(d2)}` : br(d1)}`}>
        {(sx, sy) => (
          <>
            {vas.map((v) => <line key={v} x1={sx(v)} x2={sx(v)} y1={0} y2={300} className="w-ref" />)}
            {hy !== null && <line x1={0} x2={640} y1={sy(hy)} y2={sy(hy)} className="w-ref" />}
            {!quadDen && <line x1={sx(-8)} y1={sy(-8 + slantShift)} x2={sx(8)} y2={sy(8 + slantShift)} className="w-ref" />}
            <path d={curve(f, -8, 8, sx, sy, 5, 1200)} className="w-curve" />
            {holes.map((r) => <circle key={r} cx={sx(r)} cy={sy(holeY(r))} r={6.5} className="w-open" />)}
          </>
        )}
      </Plot>
      <div className="widget-controls">
        <Seg label="Denominator degree" value={denDeg} options={[{ id: '1', label: 'degree 1' }, { id: '2', label: 'degree 2' }]} onChange={setDenDeg} />
        <div className="two-col">
          <LinSlider label="Numerator root" value={n1} min={-6} max={6} onChange={setN1} fmt={num} />
          <LinSlider label="Numerator root" value={n2} min={-6} max={6} onChange={setN2} fmt={num} />
          <LinSlider label="Denominator root" value={d1} min={-6} max={6} onChange={setD1} fmt={num} />
          {quadDen && <LinSlider label="Denominator root" value={d2} min={-6} max={6} onChange={setD2} fmt={num} />}
        </div>
        <Readouts items={[
          ['f(x)', `${br(n1)}${br(n2)} / ${quadDen ? `${br(d1)}${br(d2)}` : br(d1)}`],
          ['Vertical asymptotes', vas.length ? vas.map((v) => `x = ${num(v)}`).join(', ') : 'none'],
          ['Holes', holes.length ? holes.map((r) => `at x = ${num(r)} (y ≈ ${num(holeY(r))})`).join(', ') : 'none', holes.length ? 'a factor cancels between top and bottom' : undefined],
          [degNum === degDen ? 'Horizontal asymptote' : 'Oblique asymptote', quadDen ? 'y = 1' : `y = ${slant}`, quadDen ? 'equal degrees: the ratio of leading coefficients, 1/1' : 'the numerator has one more degree than the denominator: divide, and the quotient is the asymptote'],
        ]} />
      </div>
    </Frame>
  )
}

/* ------------------------------------------------------------------ domain and range */

const ALL: IntervalSet = [{ lo: -Infinity, hi: Infinity, loIncl: false, hiIncl: false }]
const from = (lo: number, loIncl = true): IntervalSet => [{ lo, hi: Infinity, loIncl, hiIncl: false }]
const without = (v: number): IntervalSet => [{ lo: -Infinity, hi: v, loIncl: false, hiIncl: false }, { lo: v, hi: Infinity, loIncl: false, hiIncl: false }]

interface DR { id: string; label: string; f: (x: number) => number; dom: IntervalSet; rng: IntervalSet; why: string }
const DRS: DR[] = [
  { id: 'sq', label: 'x²', f: (x) => x * x, dom: ALL, rng: from(0), why: 'any number can be squared, but a square is never negative' },
  { id: 'sqrt', label: '√x', f: (x) => (x >= 0 ? Math.sqrt(x) : NaN), dom: from(0), rng: from(0), why: 'the root needs x ≥ 0, and a root is never negative' },
  { id: 'rec', label: '1/x', f: (x) => (x === 0 ? NaN : 1 / x), dom: without(0), rng: without(0), why: 'x cannot be 0, and 1/x is never 0' },
  { id: 'ln', label: 'ln x', f: (x) => (x > 0 ? Math.log(x) : NaN), dom: from(0, false), rng: ALL, why: 'ln needs a positive input, but its output can be any number' },
  { id: 'semi', label: '√(4 − x²)', f: (x) => (4 - x * x >= 0 ? Math.sqrt(4 - x * x) : NaN), dom: [{ lo: -2, hi: 2, loIncl: true, hiIncl: true }], rng: [{ lo: 0, hi: 2, loIncl: true, hiIncl: true }], why: 'we need 4 − x² ≥ 0, which means −2 ≤ x ≤ 2; the result is at most 2' },
  { id: 'shift', label: '1/(x − 1) + 2', f: (x) => (x === 1 ? NaN : 1 / (x - 1) + 2), dom: without(1), rng: without(2), why: 'x cannot be 1, and 1/(x − 1) is never 0, so f is never 2' },
]

export function DomainRange() {
  const [id, setId] = useState('sqrt')
  const d = DRS.find((x) => x.id === id)!
  return (
    <Frame caption="The domain is the set of inputs the formula accepts (the part of the x-axis the graph sits over, shaded below the curve). The range is the set of outputs it produces (the part of the y-axis it reaches, shaded on the left).">
      <Plot x0={-6} x1={6} y0={-6} y1={6} label={`Graph of y = ${d.label}, with its domain and range`}>
        {(sx, sy) => (
          <>
            {d.dom.map((i, n) => { const lo = Math.max(-6, i.lo), hi = Math.min(6, i.hi); return hi > lo ? <rect key={`x${n}`} x={sx(lo)} y={sy(0) - 4} width={sx(hi) - sx(lo)} height={8} className="w-shade" /> : null })}
            {d.rng.map((i, n) => { const lo = Math.max(-6, i.lo), hi = Math.min(6, i.hi); return hi > lo ? <rect key={`y${n}`} x={sx(0) - 4} y={sy(hi)} width={8} height={sy(lo) - sy(hi)} className="w-shade" /> : null })}
            <path d={curve(d.f, -6, 6, sx, sy, 5, 1000)} className="w-curve" />
          </>
        )}
      </Plot>
      <div className="widget-controls">
        <Seg label="Function" value={id} options={DRS.map((x) => ({ id: x.id, label: x.label }))} onChange={setId} />
        <Readouts items={[
          ['Domain', fmtSet(d.dom), fmtIntervals(d.dom)],
          ['Range', fmtSet(d.rng, 'y'), fmtIntervals(d.rng)],
          ['Why', d.why],
        ]} />
      </div>
    </Frame>
  )
}
