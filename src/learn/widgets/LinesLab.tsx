import { useState } from 'react'
import { MINUS } from '../../math/exact'
import { Arrow, Plane } from './ComplexVec'
import { Frame, LinSlider, Readouts, Seg } from './shared'

const num = (x: number, d = 3) => (Number.isFinite(x) ? Number(x.toFixed(d)).toString().replace('-', MINUS) : 'undefined')
const W = 640
const money = (v: number) => `$${v}`

/* ------------------------------------------------------------------ slope from two points */

export function SlopeLab() {
  const [x1, setX1] = useState(-2)
  const [y1, setY1] = useState(-1)
  const [x2, setX2] = useState(3)
  const [y2, setY2] = useState(3)
  const dx = x2 - x1, dy = y2 - y1
  const m = dx === 0 ? NaN : dy / dx
  const reach = 6
  return (
    <Frame caption="Slope measures steepness: how far the line rises for each step it runs across. Between two points, slope = rise ÷ run = (y₂ − y₁)/(x₂ − x₁). A line going up to the right has positive slope, going down has negative slope, a horizontal line has slope 0, and a vertical line has no slope (undefined) because the run is 0.">
      <Plane reach={reach} label="Two points joined by a line with the rise and run marked" axes={['x', 'y']}>
        {(p) => {
          const a = p(x1, y1), b = p(x2, y2), c = p(x2, y1)
          const ext = (t: number) => p(x1 + (x2 - x1) * t, y1 + (y2 - y1) * t)
          return (
            <>
              {dx !== 0 || dy !== 0 ? <line x1={ext(-10)[0]} y1={ext(-10)[1]} x2={ext(10)[0]} y2={ext(10)[1]} className="w-ref" /> : null}
              <line x1={a[0]} y1={a[1]} x2={c[0]} y2={c[1]} className="w-curve alt" />
              <line x1={c[0]} y1={c[1]} x2={b[0]} y2={b[1]} className="w-curve" />
              <circle cx={a[0]} cy={a[1]} r={6} className="w-dot" />
              <circle cx={b[0]} cy={b[1]} r={6} className="w-dot" />
              <Arrow x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} cls="red" />
            </>
          )
        }}
      </Plane>
      <div className="widget-controls">
        <div className="two-col">
          <LinSlider label="x₁" value={x1} min={-6} max={6} onChange={setX1} fmt={(v) => num(v, 0)} />
          <LinSlider label="y₁" value={y1} min={-6} max={6} onChange={setY1} fmt={(v) => num(v, 0)} />
          <LinSlider label="x₂" value={x2} min={-6} max={6} onChange={setX2} fmt={(v) => num(v, 0)} />
          <LinSlider label="y₂" value={y2} min={-6} max={6} onChange={setY2} fmt={(v) => num(v, 0)} />
        </div>
        <Readouts items={[['Rise (Δy)', num(dy, 0)], ['Run (Δx)', num(dx, 0)], ['Slope', dx === 0 ? 'undefined (a vertical line)' : num(m, 3), dx === 0 ? undefined : m > 0 ? 'rising' : m < 0 ? 'falling' : 'horizontal'], ['Perpendicular slope', dx === 0 ? '0' : m === 0 ? 'undefined' : num(-1 / m, 3), 'the negative reciprocal']]} />
      </div>
    </Frame>
  )
}

/* ------------------------------------------------------------------ forms of a line */

export function LineForms() {
  const [m, setM] = useState(2)
  const [b, setB] = useState(-1)
  const [mode, setMode] = useState<'one' | 'par' | 'perp'>('one')
  const [px, setPx] = useState(2)
  const [py, setPy] = useState(3)
  const reach = 6
  const m2 = mode === 'par' ? m : m === 0 ? Infinity : -1 / m
  const b2 = mode === 'one' ? b : py - m2 * px
  const xi = m === 0 ? NaN : -b / m
  const secondLine: [string, string][] = mode !== 'one' ? [['Second line', Number.isFinite(m2) ? `y = ${num(m2, 2)}x ${b2 < 0 ? '−' : '+'} ${num(Math.abs(b2), 2)}` : `x = ${px}`]] : []
  return (
    <Frame caption="In slope-intercept form y = mx + b, m is the slope and b is where the line crosses the y-axis. A line parallel to it has the same slope m; a line perpendicular to it has slope −1/m. Pick the second line, move the point it must pass through, and read off its equation: substitute the point into y = m₂x + b₂ to find b₂.">
      <Plane reach={reach} label="A line y = mx + b and a second line through a chosen point" axes={['x', 'y']}>
        {(p) => {
          const drawLine = (mm: number, bb: number, cls: string) => (Number.isFinite(mm)
            ? <line x1={p(-reach, mm * -reach + bb)[0]} y1={p(-reach, mm * -reach + bb)[1]} x2={p(reach, mm * reach + bb)[0]} y2={p(reach, mm * reach + bb)[1]} className={cls} />
            : <line x1={p(px, -reach)[0]} y1={p(px, -reach)[1]} x2={p(px, reach)[0]} y2={p(px, reach)[1]} className={cls} />)
          return (
            <>
              {drawLine(m, b, 'w-curve')}
              {mode !== 'one' && drawLine(m2, b2, 'w-curve alt')}
              {mode !== 'one' && <circle cx={p(px, py)[0]} cy={p(px, py)[1]} r={6} className="w-dot" />}
            </>
          )
        }}
      </Plane>
      <div className="widget-controls">
        <Seg label="Second line" value={mode} options={[{ id: 'one', label: 'just one line' }, { id: 'par', label: 'parallel' }, { id: 'perp', label: 'perpendicular' }]} onChange={setMode} />
        <div className="two-col">
          <LinSlider label="Slope m" value={m} min={-4} max={4} step={0.5} onChange={setM} fmt={(v) => num(v, 1)} />
          <LinSlider label="Intercept b" value={b} min={-5} max={5} onChange={setB} fmt={(v) => num(v, 0)} />
          {mode !== 'one' && <LinSlider label="Point x" value={px} min={-5} max={5} onChange={setPx} fmt={(v) => num(v, 0)} />}
          {mode !== 'one' && <LinSlider label="Point y" value={py} min={-5} max={5} onChange={setPy} fmt={(v) => num(v, 0)} />}
        </div>
        <Readouts items={[['Line', `y = ${num(m, 1)}x ${b < 0 ? '−' : '+'} ${num(Math.abs(b), 0)}`], ['Intercepts', `y-intercept ${num(b, 0)},  x-intercept ${Number.isFinite(xi) ? num(xi, 2) : 'none'}`], ...secondLine]} />
      </div>
    </Frame>
  )
}

/* ------------------------------------------------------------------ comparing two linear plans */

export function BreakEven() {
  const [f1, setF1] = useState(20)
  const [r1, setR1] = useState(5)
  const [f2, setF2] = useState(50)
  const [r2, setR2] = useState(2)
  const meet = r1 === r2 ? NaN : (f2 - f1) / (r1 - r2)
  const hi = Math.max(10, Number.isFinite(meet) && meet > 0 ? meet * 1.8 : 10)
  const ymax = Math.max(f1 + r1 * hi, f2 + r2 * hi) * 1.05
  const sx = (x: number) => 50 + (x / hi) * (W - 70)
  const sy = (y: number) => 230 - (y / ymax) * 210
  return (
    <Frame caption="Each plan is a straight line: cost = fixed fee + rate × time. Where the lines cross, the two plans cost the same: that is the break-even point, found by solving f₁ + r₁t = f₂ + r₂t. Before it, one plan is cheaper; after it, the other. Parallel lines (equal rates) never cross.">
      <svg viewBox={`0 0 ${W} 260`} className="wsvg" role="img" aria-label="The cost of two plans against time">
        <line x1={50} x2={W - 20} y1={230} y2={230} className="w-axis" />
        <line x1={50} x2={50} y1={10} y2={230} className="w-axis" />
        <path d={`M${sx(0)},${sy(f1)} L${sx(hi)},${sy(f1 + r1 * hi)}`} className="w-curve" fill="none" />
        <path d={`M${sx(0)},${sy(f2)} L${sx(hi)},${sy(f2 + r2 * hi)}`} className="w-curve alt" fill="none" />
        {Number.isFinite(meet) && meet >= 0 && meet <= hi && <circle cx={sx(meet)} cy={sy(f1 + r1 * meet)} r={7} className="w-dot" />}
        <text x={W - 20} y={250} textAnchor="end" className="w-t sm">time (months)</text>
        <text x={56} y={18} className="w-t sm">cost (dollars)</text>
      </svg>
      <div className="widget-controls">
        <div className="two-col">
          <LinSlider label="Plan A fee" value={f1} min={0} max={100} step={5} onChange={setF1} fmt={money} />
          <LinSlider label="Plan A per month" value={r1} min={1} max={15} onChange={setR1} fmt={money} />
          <LinSlider label="Plan B fee" value={f2} min={0} max={100} step={5} onChange={setF2} fmt={money} />
          <LinSlider label="Plan B per month" value={r2} min={1} max={15} onChange={setR2} fmt={money} />
        </div>
        <Readouts items={[['Equation', `${f1} + ${r1}t = ${f2} + ${r2}t`], ['Break-even time', Number.isFinite(meet) ? (meet >= 0 ? `${num(meet, 2)} months` : 'none (the lines cross before month 0)') : 'never: the lines are parallel'], ['Cost at break-even', Number.isFinite(meet) && meet >= 0 ? money(Number(num(f1 + r1 * meet, 2))) : '—']]} />
      </div>
    </Frame>
  )
}
