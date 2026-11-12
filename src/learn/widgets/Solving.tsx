import { useMemo, useState } from 'react'
import { fmtFrac, fr } from '../../math/algebra'
import { MINUS } from '../../math/exact'
import {
  fmtIntervals, fmtPlusMinus, fmtRoot, fmtSet, inSet, IntervalSet, quadRoots, rootValue, signSet, solveSystem, systemKind, vertex,
} from '../../math/solve'
import { Frame, LinSlider, Readouts, Seg } from './shared'

const num = (x: number) => (Number.isFinite(x) ? Number(x.toFixed(3)).toString().replace('-', MINUS) : 'undefined')
const sgn = (k: number) => (k < 0 ? MINUS : '+')
const coef = (k: number, v: string) => (k === 0 ? '' : k === 1 ? v : k === -1 ? `${MINUS}${v}` : `${num(k)}${v}`)
/** "2x − 3", "−x + 4", "5" */
function poly(terms: [number, string][]): string {
  let out = ''
  for (const [k, v] of terms) {
    if (k === 0) continue
    const body = v === '' ? String(Math.abs(k)) : `${Math.abs(k) === 1 ? '' : num(Math.abs(k))}${v}`
    out += out ? ` ${sgn(k)} ${body}` : `${k < 0 ? MINUS : ''}${body}`
  }
  return out || '0'
}

/** A square plot window with grid, axes and numbered ticks. */
export function Plot({ x0, x1, y0, y1, children, label, xTicks }: { x0: number; x1: number; y0: number; y1: number; children: (sx: (x: number) => number, sy: (y: number) => number) => React.ReactNode; label: string; xTicks?: { x: number; label: string }[] }) {
  const W = 640, H = 300
  const sx = (x: number) => ((x - x0) / (x1 - x0)) * W
  const sy = (y: number) => H - ((y - y0) / (y1 - y0)) * H
  const xs: number[] = [], ys: number[] = []
  for (let t = Math.ceil(x0); t <= x1; t++) xs.push(t)
  for (let t = Math.ceil(y0); t <= y1; t++) ys.push(t)
  const stepX = x1 - x0 > 20 ? 5 : x1 - x0 > 12 ? 2 : 1
  const stepY = y1 - y0 > 24 ? 5 : y1 - y0 > 12 ? 2 : 1
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="wsvg" role="img" aria-label={label}>
      <defs><clipPath id={`clip-${label.length}`}><rect x={0} y={0} width={W} height={H} /></clipPath></defs>
      {(xTicks ?? xs.filter((t) => t % stepX === 0).map((t) => ({ x: t, label: '' }))).map((t) => <line key={`gx${t.x}`} x1={sx(t.x)} x2={sx(t.x)} y1={0} y2={H} className="w-grid" />)}
      {ys.filter((t) => t % stepY === 0).map((t) => <line key={`gy${t}`} x1={0} x2={W} y1={sy(t)} y2={sy(t)} className="w-grid" />)}
      {y0 < 0 && y1 > 0 && <line x1={0} x2={W} y1={sy(0)} y2={sy(0)} className="w-axis" />}
      {x0 < 0 && x1 > 0 && <line x1={sx(0)} x2={sx(0)} y1={0} y2={H} className="w-axis" />}
      {xTicks
        ? xTicks.filter((t) => t.label).map((t) => <text key={`tx${t.x}`} x={sx(t.x)} y={Math.min(H - 4, Math.max(12, sy(0) + 13))} textAnchor="middle" className="w-t sm">{t.label}</text>)
        : xs.filter((t) => t % stepX === 0 && t !== 0).map((t) => <text key={`tx${t}`} x={sx(t)} y={Math.min(H - 4, Math.max(12, sy(0) + 13))} textAnchor="middle" className="w-t sm">{t < 0 ? `${MINUS}${-t}` : t}</text>)}
      {ys.filter((t) => t % stepY === 0 && t !== 0).map((t) => <text key={`ty${t}`} x={Math.min(W - 18, Math.max(4, sx(0) + 5))} y={sy(t) - 3} className="w-t sm">{t < 0 ? `${MINUS}${-t}` : t}</text>)}
      <g clipPath={`url(#clip-${label.length})`}>{children(sx, sy)}</g>
    </svg>
  )
}

/** a polyline for y = f(x), broken where f is not finite or jumps */
export function curve(f: (x: number) => number, x0: number, x1: number, sx: (x: number) => number, sy: (y: number) => number, jump = Infinity, n = 400): string {
  let d = '', pen = false, last = NaN
  for (let i = 0; i <= n; i++) {
    const x = x0 + ((x1 - x0) * i) / n, y = f(x)
    if (!Number.isFinite(y) || Math.abs(y) > 1e4 || (pen && Math.abs(y - last) > jump)) { pen = false; last = y; continue }
    d += `${pen ? 'L' : 'M'}${sx(x).toFixed(1)},${sy(y).toFixed(1)} `
    pen = true; last = y
  }
  return d
}

/* ------------------------------------------------------------------ linear equation as an intersection */

export function LinearGraph() {
  const [m1, setM1] = useState(2)
  const [b1, setB1] = useState(-3)
  const [m2, setM2] = useState(-1)
  const [b2, setB2] = useState(6)
  // m1 x + b1 = m2 x + b2
  const k = m1 - m2, rhs = b2 - b1
  const root = k !== 0 ? fr(rhs, k) : null
  const left = `${poly([[m1, 'x'], [b1, '']])}`, right = `${poly([[m2, 'x'], [b2, '']])}`
  const outcome = k !== 0 ? `x = ${fmtFrac(root!)}` : rhs === 0 ? 'every x works (the lines are the same)' : 'no solution (parallel lines)'
  return (
    <Frame caption="The solution of an equation is where the two sides agree. Graph each side as a line: the lines cross at the solution. Parallel lines never agree (no solution) and identical lines always agree (every x).">
      <Plot x0={-8} x1={8} y0={-10} y1={10} label={`Graphs of y = ${left} and y = ${right}`}>
        {(sx, sy) => (
          <>
            <path d={curve((x) => m1 * x + b1, -8, 8, sx, sy, Infinity, 2)} className="w-curve" />
            <path d={curve((x) => m2 * x + b2, -8, 8, sx, sy, Infinity, 2)} className="w-curve alt" />
            {root && Math.abs(fmtNum(root)) <= 8 && <circle cx={sx(fmtNum(root))} cy={sy(m1 * fmtNum(root) + b1)} r={7} className="w-dot" />}
          </>
        )}
      </Plot>
      <div className="widget-controls">
        <div className="two-col">
          <LinSlider label="Left slope" value={m1} min={-5} max={5} onChange={setM1} fmt={num} />
          <LinSlider label="Left constant" value={b1} min={-9} max={9} onChange={setB1} fmt={num} />
          <LinSlider label="Right slope" value={m2} min={-5} max={5} onChange={setM2} fmt={num} />
          <LinSlider label="Right constant" value={b2} min={-9} max={9} onChange={setB2} fmt={num} />
        </div>
        <Readouts items={[
          ['Equation', `${left} = ${right}`],
          ['Collect x terms', k === 0 ? `0x = ${num(rhs)}` : `${coef(k, 'x')} = ${num(rhs)}`],
          ['Solution', outcome],
        ]} />
      </div>
    </Frame>
  )
}
const fmtNum = (f: { n: number; d: number }) => f.n / f.d

/* ------------------------------------------------------------------ quadratic explorer */

export function QuadLab() {
  const [a, setA] = useState(1)
  const [b, setB] = useState(-2)
  const [c, setC] = useState(-3)
  const f = (x: number) => a * x * x + b * x + c
  const isQuad = a !== 0
  const q = isQuad ? quadRoots(a, b, c) : null
  const v = isQuad ? vertex(a, b, c) : null
  const vx = v ? fmtNum(v.x) : 0, vy = v ? fmtNum(v.y) : 0
  const nature = !q ? 'not a quadratic (a = 0): a straight line' : q.disc > 0 ? (q.r === 1 ? 'two different rational roots' : 'two different irrational roots') : q.disc === 0 ? 'one repeated root' : 'no real roots'
  const rootText = !q ? (b !== 0 ? `x = ${fmtFrac(fr(-c, b))}` : '') : q.disc > 0 ? (q.r === 1 ? q.roots.map((r) => `x = ${fmtRoot(r)}`).join(', ') : `x = ${fmtPlusMinus(a, b, c)}`) : q.disc === 0 ? `x = ${fmtRoot(q.roots[0])}` : 'none (the parabola never reaches the axis)'
  return (
    <Frame caption="Change a, b and c and watch the parabola. The roots are where it crosses the x-axis; the discriminant b² − 4ac tells you in advance how many there are. The dashed line is the axis of symmetry, through the vertex.">
      <Plot x0={-8} x1={8} y0={-12} y1={12} label={`Graph of y = ${poly([[a, 'x²'], [b, 'x'], [c, '']])}`}>
        {(sx, sy) => (
          <>
            {v && <line x1={sx(vx)} x2={sx(vx)} y1={0} y2={300} className="w-ref" />}
            <path d={curve(f, -8, 8, sx, sy)} className="w-curve" />
            {q?.roots.map((r) => <circle key={r.r + fmtRoot(r)} cx={sx(rootValue(r))} cy={sy(0)} r={6} className="w-dot" />)}
            {v && <rect x={sx(vx) - 5} y={sy(vy) - 5} width={10} height={10} className="w-e" />}
          </>
        )}
      </Plot>
      <div className="widget-controls">
        <div className="two-col">
          <LinSlider label="a" value={a} min={-5} max={5} onChange={setA} fmt={num} />
          <LinSlider label="b" value={b} min={-10} max={10} onChange={setB} fmt={num} />
          <LinSlider label="c" value={c} min={-10} max={10} onChange={setC} fmt={num} />
        </div>
        <Readouts items={[
          ['Equation', `y = ${poly([[a, 'x²'], [b, 'x'], [c, '']])}`, isQuad ? `opens ${a > 0 ? 'upwards' : 'downwards'}` : undefined],
          ['Discriminant b² − 4ac', isQuad ? `${num(b * b - 4 * a * c)}` : '', nature],
          ['Roots', rootText],
          ['Vertex', v ? `(${fmtFrac(v.x)}, ${fmtFrac(v.y)})` : '', v ? `${a > 0 ? 'minimum' : 'maximum'} value ${fmtFrac(v.y)}` : undefined],
          ['Sum and product of roots', isQuad ? `${fmtFrac(fr(-b, a))} and ${fmtFrac(fr(c, a))}` : '', 'always −b/a and c/a, even when the roots are not real'],
        ]} />
      </div>
    </Frame>
  )
}

/* ------------------------------------------------------------------ sign chart for inequalities */

type Mode = 'quadratic' | 'rational' | 'absolute'
type Op = '<' | '<=' | '>' | '>='
const OPS: { id: Op; label: string }[] = [{ id: '<', label: '<' }, { id: '<=', label: '≤' }, { id: '>', label: '>' }, { id: '>=', label: '≥' }]
const opText = (o: Op) => (o === '<' ? '<' : o === '<=' ? '≤' : o === '>' ? '>' : '≥')

export function SignChart() {
  const [mode, setMode] = useState<Mode>('quadratic')
  const [p, setP] = useState(-2)
  const [q, setQ] = useState(3)
  const [k, setK] = useState(1)
  const [op, setOp] = useState<Op>('>')
  const model = useMemo(() => {
    if (mode === 'quadratic') {
      const f = (x: number) => k * (x - p) * (x - q)
      return { f, crit: [p, q], text: `${k < 0 ? `${MINUS}` : ''}(x ${sgn(-p)} ${Math.abs(p)})(x ${sgn(-q)} ${Math.abs(q)}) ${opText(op)} 0`.replace('+ 0)', ')').replace(/x [+−] 0\)/, 'x)'), rhs: 0 }
    }
    if (mode === 'rational') {
      const f = (x: number) => k * ((x - p) / (x - q))
      return { f, crit: [p, q], text: `${k < 0 ? `${MINUS}` : ''}(x ${sgn(-p)} ${Math.abs(p)}) / (x ${sgn(-q)} ${Math.abs(q)}) ${opText(op)} 0`.replace(/x [+−] 0\)/g, 'x)'), rhs: 0 }
    }
    // |x - p| op d, with d = |q - p| shown as the half-width
    const d = Math.max(0.5, Math.abs(q - p) / 2)
    const f = (x: number) => Math.abs(x - (p + q) / 2) - d
    return { f, crit: [(p + q) / 2 - d, (p + q) / 2 + d], text: `|x ${sgn(-(p + q) / 2)} ${num(Math.abs((p + q) / 2))}| ${opText(op)} ${num(d)}`.replace(/x [+−] 0\|/, 'x|'), rhs: 0 }
  }, [mode, p, q, k, op])
  const set: IntervalSet = useMemo(() => signSet(model.f, model.crit, op), [model, op])
  const X0 = -8, X1 = 8
  const dom = (x: number) => (Number.isFinite(model.f(x)) ? model.f(x) : NaN)
  return (
    <Frame caption="An inequality asks where the curve is above or below the axis. The solution set is shaded along the axis: a filled dot means the boundary is included (≤ or ≥), an open dot means it is not, and a denominator that is zero is never included.">
      <Plot x0={X0} x1={X1} y0={-10} y1={10} label={`Graph of ${model.text}`}>
        {(sx, sy) => (
          <>
            {set.map((i, n) => {
              const lo = Math.max(X0, i.lo), hi = Math.min(X1, i.hi)
              return hi > lo ? <rect key={n} x={sx(lo)} y={sy(0) - 5} width={sx(hi) - sx(lo)} height={10} className="w-shade" /> : null
            })}
            <path d={curve(dom, X0, X1, sx, sy, mode === 'rational' ? 9 : Infinity, 800)} className="w-curve" />
            {mode === 'rational' && <line x1={sx(q)} x2={sx(q)} y1={0} y2={300} className="w-ref" />}
            {[...new Set(model.crit)].map((c) => {
              const included = inSet(set, c)
              return <circle key={c} cx={sx(c)} cy={sy(0)} r={6.5} className={included ? 'w-dot' : 'w-open'} />
            })}
          </>
        )}
      </Plot>
      <div className="widget-controls">
        <Seg label="Kind" value={mode} options={[{ id: 'quadratic', label: 'quadratic' }, { id: 'rational', label: 'rational' }, { id: 'absolute', label: 'absolute value' }]} onChange={setMode} />
        <Seg label="Inequality sign" value={op} options={OPS} onChange={setOp} />
        <div className="two-col">
          <LinSlider label={mode === 'absolute' ? 'End 1' : 'Root p'} value={p} min={-6} max={6} onChange={setP} fmt={num} />
          <LinSlider label={mode === 'absolute' ? 'End 2' : mode === 'rational' ? 'Excluded q' : 'Root q'} value={q} min={-6} max={6} onChange={setQ} fmt={num} />
          {mode !== 'absolute' && <Seg label="Sign" value={String(k) as '1' | '-1'} options={[{ id: '1', label: 'positive' }, { id: '-1', label: 'negative' }]} onChange={(v) => setK(Number(v))} />}
        </div>
        <Readouts items={[
          ['Inequality', model.text],
          ['Solution', fmtSet(set), p === q && mode !== 'absolute' ? 'the two roots coincide, so the sign does not change at it' : undefined],
          ['Interval notation', fmtIntervals(set)],
        ]} />
      </div>
    </Frame>
  )
}

/* ------------------------------------------------------------------ two equations, two unknowns */

export function SystemsLab() {
  const [a1, setA1] = useState(2)
  const [b1, setB1] = useState(1)
  const [c1, setC1] = useState(4)
  const [a2, setA2] = useState(1)
  const [b2, setB2] = useState(-1)
  const [c2, setC2] = useState(-1)
  const s = { a1, b1, c1, a2, b2, c2 }
  const kind = systemKind(s)
  const sol = solveSystem(s)
  const lineY = (a: number, b: number, c: number) => (x: number) => (b === 0 ? NaN : (c - a * x) / b)
  const vline = (a: number, b: number, c: number) => (b === 0 && a !== 0 ? c / a : null)
  const eq = (a: number, b: number, c: number) => `${poly([[a, 'x'], [b, 'y']])} = ${num(c)}`
  return (
    <Frame caption="Each equation is a line, and a solution is a point on both. Two lines cross once (one solution), run parallel (none) or lie on top of each other (infinitely many). The determinant a₁b₂ − a₂b₁ is zero exactly when the lines have the same direction.">
      <Plot x0={-8} x1={8} y0={-10} y1={10} label={`Graphs of ${eq(a1, b1, c1)} and ${eq(a2, b2, c2)}`}>
        {(sx, sy) => (
          <>
            {[[a1, b1, c1, 'w-curve'], [a2, b2, c2, 'w-curve alt']].map(([a, b, c, cls], i) => {
              const v = vline(a as number, b as number, c as number)
              return v !== null
                ? <line key={i} x1={sx(v)} x2={sx(v)} y1={0} y2={300} className={cls as string} />
                : <path key={i} d={curve(lineY(a as number, b as number, c as number), -8, 8, sx, sy, Infinity, 2)} className={cls as string} />
            })}
            {sol && <circle cx={sx(fmtNum(sol.x))} cy={sy(fmtNum(sol.y))} r={7} className="w-dot" />}
          </>
        )}
      </Plot>
      <div className="widget-controls">
        <div className="two-col">
          <LinSlider label="a₁ (x)" value={a1} min={-6} max={6} onChange={setA1} fmt={num} />
          <LinSlider label="b₁ (y)" value={b1} min={-6} max={6} onChange={setB1} fmt={num} />
          <LinSlider label="c₁" value={c1} min={-12} max={12} onChange={setC1} fmt={num} />
          <LinSlider label="a₂ (x)" value={a2} min={-6} max={6} onChange={setA2} fmt={num} />
          <LinSlider label="b₂ (y)" value={b2} min={-6} max={6} onChange={setB2} fmt={num} />
          <LinSlider label="c₂" value={c2} min={-12} max={12} onChange={setC2} fmt={num} />
        </div>
        <Readouts items={[
          ['Equation (1)', eq(a1, b1, c1)],
          ['Equation (2)', eq(a2, b2, c2)],
          ['Determinant', num(a1 * b2 - a2 * b1), kind === 'one' ? 'not zero: the lines cross once' : 'zero: the lines have the same direction'],
          ['Solution', kind === 'one' ? `(${fmtFrac(sol!.x)}, ${fmtFrac(sol!.y)})` : kind === 'none' ? 'none: the lines are parallel' : 'infinitely many: the equations describe the same line'],
        ]} />
      </div>
    </Frame>
  )
}
