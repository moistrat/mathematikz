import { useMemo, useState } from 'react'
import {
  AlgError, evalNode, fmtFrac, fmtPoly, fracStr, isConst, looksExpanded, Node, parse, parsePoly, parseRat, pDeg, pretty, rationalRoots, rEq,
  Rat, rVars, solveEquation, toRat,
} from '../../math/algebra'
import { MINUS } from '../../math/exact'
import { Frame, LinSlider, Readouts, Seg } from './shared'

const num = (x: number) => (Number.isFinite(x) ? Number(x.toFixed(4)).toString().replace('-', MINUS) : 'undefined')
/** (x − 3), (x + 2), or just x */
const lin = (r: number, v = 'x') => (r === 0 ? v : `${v} ${r < 0 ? '+' : MINUS} ${Math.abs(r)}`)
const br = (r: number, v = 'x') => (r === 0 ? v : `(${lin(r, v)})`)

/* ------------------------------------------------------------------ expression lab */

type Parsed = { ok: true; node: Node; rat: Rat } | { ok: false; msg: string }
function analyse(text: string): Parsed {
  try { const node = parse(text); return { ok: true, node, rat: toRat(node) } } catch (e) { return { ok: false, msg: e instanceof AlgError ? e.message : 'Could not read that.' } }
}
const standard = (p: Parsed) => {
  if (!p.ok) return p.msg
  return isConst(p.rat.d) ? fmtPoly(p.rat.n) : fracStr(fmtPoly(p.rat.n), fmtPoly(p.rat.d))
}
const shape = (p: Parsed) => {
  if (!p.ok) return ''
  if (!isConst(p.rat.d)) return 'a rational expression'
  const terms = p.rat.n.length
  return `degree ${pDeg(p.rat.n)}, ${terms} term${terms === 1 ? '' : 's'}${looksExpanded(p.node, terms) ? ', fully expanded' : ', not yet expanded'}`
}

const LAB_PRESETS: [string, string][] = [
  ['(x+2)(x-3)', 'x^2 - x - 6'],
  ['(x+y)^3', 'x^3 + y^3'],
  ['(x^2-9)/(x-3)', 'x + 3'],
  ['x^3 - 8', '(x-2)(x^2+2x+4)'],
  ['1/x + 1/y', '(x+y)/(xy)'],
]

export function ExprLab() {
  const [a, setA] = useState(LAB_PRESETS[0][0])
  const [b, setB] = useState(LAB_PRESETS[0][1])
  const pa = useMemo(() => analyse(a), [a])
  const pb = useMemo(() => analyse(b), [b])
  let verdict = 'Type two expressions.'
  let hint: string | undefined
  if (pa.ok && pb.ok) {
    if (rEq(pa.rat, pb.rat)) verdict = 'Equal: the same expression written two ways.'
    else {
      verdict = 'Not equal.'
      const vars = [...new Set([...rVars(pa.rat), ...rVars(pb.rat)])].sort()
      for (const base of [2, 3, 5, 7, -2, 4]) {
        const env: Record<string, number> = {}
        vars.forEach((v, i) => { env[v] = base + i })
        const x = evalNode(pa.node, env), y = evalNode(pb.node, env)
        if (Number.isFinite(x) && Number.isFinite(y)) { hint = `Test: with ${vars.map((v) => `${v} = ${num(env[v])}`).join(', ') || 'no letters'}, the first gives ${num(x)} and the second ${num(y)}.`; break }
      }
    }
  } else if (!pa.ok || !pb.ok) verdict = 'One of the boxes cannot be read yet.'
  return (
    <Frame caption="Type any expression using letters, + − × ÷, ^ for powers and brackets: 2x(x+1), (x+y)^3, (x^2-1)/(x-1). The checker expands both and compares them.">
      <div className="widget-controls">
        <div className="tool-row">
          {LAB_PRESETS.map(([p, q]) => <button key={p + q} className="btn" onClick={() => { setA(p); setB(q) }}>{pretty(p)} vs {pretty(q)}</button>)}
        </div>
        <div className="two-col">
          <label className="field">First expression
            <input value={a} onChange={(e) => setA(e.target.value)} spellCheck={false} autoComplete="off" aria-label="First expression" />
          </label>
          <label className="field">Second expression
            <input value={b} onChange={(e) => setB(e.target.value)} spellCheck={false} autoComplete="off" aria-label="Second expression" />
          </label>
        </div>
        <Readouts items={[
          ['First, in standard form', standard(pa), shape(pa)],
          ['Second, in standard form', standard(pb), shape(pb)],
          ['Same expression?', verdict, hint],
        ]} />
      </div>
    </Frame>
  )
}

/* ------------------------------------------------------------------ cubic with draggable roots */

export function CubicRoots() {
  const [r, setR] = useState<[number, number, number]>([-2, 1, 3])
  const [k, setK] = useState<1 | -1 | 2>(1)
  const set = (i: number) => (v: number) => setR((o) => o.map((x, j) => (j === i ? v : x)) as [number, number, number])
  const f = (x: number) => k * (x - r[0]) * (x - r[1]) * (x - r[2])
  const X0 = 40, X1 = 600, YC = 150
  let ymax = 8
  for (let x = -6; x <= 6; x += 0.1) ymax = Math.max(ymax, Math.min(Math.abs(f(x)), 60))
  const sx = (x: number) => X0 + ((x + 6) / 12) * (X1 - X0)
  const ky = 125 / ymax
  const sy = (y: number) => YC - y * ky
  let path = '', pen = false
  for (let i = 0; i <= 480; i++) {
    const x = -6 + i / 40, y = f(x)
    if (Math.abs(y) > ymax * 1.25) { pen = false; continue }
    path += `${pen ? 'L' : 'M'}${sx(x).toFixed(1)},${sy(y).toFixed(1)} `
    pen = true
  }
  const prefix = k === 1 ? '' : k === -1 ? MINUS : String(k)
  const factored = `${prefix}${r.map((x) => br(x)).join('')}`
  const poly = parsePoly(`${k}(x - (${r[0]}))(x - (${r[1]}))(x - (${r[2]}))`)
  const uniq = [...new Set(r)].sort((a, b) => a - b)
  const repeated = r.length - uniq.length
  return (
    <Frame caption="A cubic is zero where one of its factors is zero. Drag the roots and watch the curve cross the axis exactly there. A repeated root makes the curve touch and turn (two equal roots) or flatten as it crosses (three).">
      <svg viewBox="0 0 640 300" className="wsvg" role="img" aria-label={`Graph of ${factored}`}>
        {Array.from({ length: 13 }, (_, i) => i - 6).map((x) => <line key={x} x1={sx(x)} x2={sx(x)} y1={14} y2={286} className="w-grid" />)}
        <line x1={X0} x2={X1} y1={YC} y2={YC} className="w-axis" />
        <line x1={sx(0)} x2={sx(0)} y1={10} y2={290} className="w-axis" />
        {[-6, -4, -2, 2, 4, 6].map((x) => <text key={x} x={sx(x)} y={YC + 16} textAnchor="middle" className="w-t sm">{x < 0 ? `${MINUS}${-x}` : x}</text>)}
        <path d={path} className="w-curve" />
        {uniq.map((x) => (
          <g key={x}>
            <circle cx={sx(x)} cy={YC} r={6} className="w-dot" />
            <text x={sx(x)} y={YC - 12} textAnchor="middle" className="w-t accent">{x < 0 ? `${MINUS}${-x}` : x}</text>
          </g>
        ))}
      </svg>
      <div className="widget-controls">
        <div className="two-col">
          <LinSlider label="Root 1" value={r[0]} min={-5} max={5} onChange={set(0)} fmt={num} />
          <LinSlider label="Root 2" value={r[1]} min={-5} max={5} onChange={set(1)} fmt={num} />
          <LinSlider label="Root 3" value={r[2]} min={-5} max={5} onChange={set(2)} fmt={num} />
          <Seg label="Leading coefficient" value={String(k) as '1' | '-1' | '2'} options={[{ id: '1', label: 'a = 1' }, { id: '-1', label: 'a = −1' }, { id: '2', label: 'a = 2' }]} onChange={(v) => setK(Number(v) as 1 | -1 | 2)} />
        </div>
        <Readouts items={[
          ['Factored form', factored],
          ['Expanded form', fmtPoly(poly), `y-intercept ${num(f(0))}`],
          ['Roots', uniq.map((x) => `x = ${num(x)}`).join(', '), repeated === 2 ? 'one root three times: the curve flattens as it crosses' : repeated === 1 ? 'a repeated root: the curve touches the axis and turns back' : undefined],
        ]} />
      </div>
    </Frame>
  )
}

/* ------------------------------------------------------------------ holes and asymptotes */

export function Holes() {
  const [a, setA] = useState(2)
  const [b, setB] = useState(-1)
  const [c, setC] = useState(-3)
  const f = (x: number) => (x - c) / (x - b)
  const X0 = 40, X1 = 600, YC = 150, ymax = 6
  const sx = (x: number) => X0 + ((x + 6) / 12) * (X1 - X0)
  const sy = (y: number) => YC - (y / ymax) * 130
  let path = '', pen = false, last = NaN
  for (let i = 0; i <= 600; i++) {
    const x = -6 + i / 50, y = f(x)
    if (Math.abs(x - b) < 1e-9 || !Number.isFinite(y) || Math.abs(y) > ymax * 1.2 || (Number.isFinite(last) && Math.abs(y - last) > 4)) { pen = false; last = y; if (!Number.isFinite(y) || Math.abs(y) > ymax * 1.2) continue }
    path += `${pen ? 'L' : 'M'}${sx(x).toFixed(1)},${sy(y).toFixed(1)} `
    pen = true; last = y
  }
  const hasHole = a !== b
  const ya = f(a)
  const original = `(${br(c)}${br(a)}) / (${br(b)}${br(a)})`
  return (
    <Frame caption="Cancelling a common factor does not make it disappear: where that factor is zero the original expression is still undefined. It leaves a hole. A factor left in the denominator leaves a vertical asymptote.">
      <svg viewBox="0 0 640 300" className="wsvg" role="img" aria-label={`Graph of ${original}`}>
        {Array.from({ length: 13 }, (_, i) => i - 6).map((x) => <line key={x} x1={sx(x)} x2={sx(x)} y1={14} y2={286} className="w-grid" />)}
        <line x1={X0} x2={X1} y1={YC} y2={YC} className="w-axis" />
        <line x1={sx(0)} x2={sx(0)} y1={10} y2={290} className="w-axis" />
        <line x1={sx(b)} x2={sx(b)} y1={12} y2={288} className="w-ref" />
        <text x={sx(b) + 6} y={26} className="w-t sm">x = {num(b)}</text>
        <path d={path} className="w-curve" />
        {hasHole && Math.abs(ya) < ymax && (
          <g>
            <circle cx={sx(a)} cy={sy(ya)} r={7} className="w-open" />
            <text x={sx(a) + (a > 3 ? -12 : 12)} y={sy(ya) - 12} textAnchor={a > 3 ? 'end' : 'start'} className="w-t accent">hole at x = {num(a)}</text>
          </g>
        )}
      </svg>
      <div className="widget-controls">
        <div className="two-col">
          <LinSlider label="Cancelled factor (x − a), a" value={a} min={-5} max={5} onChange={setA} fmt={num} />
          <LinSlider label="Denominator factor (x − b), b" value={b} min={-5} max={5} onChange={setB} fmt={num} />
          <LinSlider label="Numerator factor (x − c), c" value={c} min={-5} max={5} onChange={setC} fmt={num} />
        </div>
        <Readouts items={[
          ['Before cancelling', original],
          ['After cancelling', `(${lin(c)}) / (${lin(b)})`, a === b ? 'the factor you cancelled is also the one in the denominator, so it still leaves an asymptote' : undefined],
          ['Excluded values', a === b ? `x ≠ ${num(a)}` : `x ≠ ${num(a)} and x ≠ ${num(b)}`, 'both stay excluded from the domain'],
          ['At x = ' + num(a), hasHole ? `a hole at (${num(a)}, ${num(ya)})` : 'vertical asymptote'],
          ['At x = ' + num(b), 'vertical asymptote' + (a === b ? '' : ' (the denominator is zero and nothing cancels it)')],
        ]} />
      </div>
    </Frame>
  )
}

/* ------------------------------------------------------------------ rational equations, graphically */

const EQ_PRESETS: { label: string; lhs: string; rhs: string }[] = [
  { label: '1/x + 1/(x−1) = 3/2', lhs: '1/x + 1/(x - 1)', rhs: '3/2' },
  { label: '2/(x−1) = x/(x+2)', lhs: '2/(x - 1)', rhs: 'x/(x + 2)' },
  { label: '(x+6)/(x−3) = 5/(x−3) + 2', lhs: '(x + 6)/(x - 3)', rhs: '5/(x - 3) + 2' },
  { label: 'x/(x−2) = 2/(x−2)', lhs: 'x/(x - 2)', rhs: '2/(x - 2)' },
  { label: '1/(x−2) + 1/(x+2) = 4/(x²−4)', lhs: '1/(x - 2) + 1/(x + 2)', rhs: '4/(x^2 - 4)' },
]

export function RatGraph() {
  const [i, setI] = useState(0)
  const { lhs, rhs, label } = EQ_PRESETS[i]
  const L = parseRat(lhs), R = parseRat(rhs)
  const sol = solveEquation(L, R, 'x')
  const ln = parse(lhs), rn = parse(rhs)
  const X0 = 40, X1 = 600, YC = 150, ymax = 8
  const sx = (x: number) => X0 + ((x + 6) / 12) * (X1 - X0)
  const sy = (y: number) => YC - (y / ymax) * 130
  const curve = (node: Node) => {
    let path = '', pen = false, last = NaN
    for (let k = 0; k <= 600; k++) {
      const x = -6 + k / 50, y = evalNode(node, { x })
      const bad = !Number.isFinite(y) || Math.abs(y) > ymax * 1.2
      if (bad || (Number.isFinite(last) && Math.abs(y - last) > 5)) pen = false
      last = y
      if (bad) continue
      path += `${pen ? 'L' : 'M'}${sx(x).toFixed(1)},${sy(y).toFixed(1)} `
      pen = true
    }
    return path
  }
  const walls = [L.d, R.d].flatMap((d) => (isConst(d) ? [] : rationalRoots(d, 'x').roots)).filter((f, k, all) => all.findIndex((g) => g.n === f.n && g.d === f.d) === k)
  const fx = (f: { n: number; d: number }) => f.n / f.d
  const list = (xs: { n: number; d: number }[]) => (xs.length ? xs.map((f) => `x = ${fmtFrac(f)}`).join(', ') : 'none')
  return (
    <Frame caption="Each side of the equation is drawn as a curve; a solution is where the two curves meet. Dashed lines are values that make a denominator zero. A candidate sitting on a dashed line is extraneous: the curves do not actually meet there.">
      <svg viewBox="0 0 640 300" className="wsvg" role="img" aria-label={`Graphs of both sides of ${label}`}>
        {Array.from({ length: 13 }, (_, k) => k - 6).map((x) => <line key={x} x1={sx(x)} x2={sx(x)} y1={14} y2={286} className="w-grid" />)}
        <line x1={X0} x2={X1} y1={YC} y2={YC} className="w-axis" />
        <line x1={sx(0)} x2={sx(0)} y1={10} y2={290} className="w-axis" />
        {walls.map((w) => <line key={fx(w)} x1={sx(fx(w))} x2={sx(fx(w))} y1={12} y2={288} className="w-ref" />)}
        <path d={curve(ln)} className="w-curve" />
        <path d={curve(rn)} className="w-curve alt" />
        {sol.roots.map((r) => { const y = evalNode(ln, { x: fx(r) }); return Math.abs(y) < ymax ? <circle key={fx(r)} cx={sx(fx(r))} cy={sy(y)} r={7} className="w-pt" /> : null })}
        {sol.extraneous.map((r) => <circle key={fx(r)} cx={sx(fx(r))} cy={YC} r={7} className="w-open" />)}
      </svg>
      <div className="widget-controls">
        <div className="tool-row">
          {EQ_PRESETS.map((p, k) => <button key={p.label} className={`btn ${k === i ? 'primary' : ''}`} onClick={() => setI(k)}>{p.label}</button>)}
        </div>
        <Readouts items={[
          ['Not allowed (denominator = 0)', list(walls)],
          ['Candidates from the algebra', list([...sol.roots, ...sol.extraneous].sort((a, b) => fx(a) - fx(b)))],
          ['Valid solutions', list(sol.roots), sol.roots.length ? 'the curves meet here' : 'the curves never meet'],
          ['Extraneous (rejected)', list(sol.extraneous), sol.extraneous.length ? 'open circles on the axis: the algebra produced them, but they make a denominator zero' : undefined],
        ]} />
      </div>
    </Frame>
  )
}

