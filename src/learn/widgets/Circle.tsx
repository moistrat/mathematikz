import { useRef, useState } from 'react'
import {
  cosExact, degToRad, evalExact, Fn, FNS, fmtDeg, fmtPi, fmtSurd, isSpecial, norm360, quadrant, radToDeg, referenceAngle, sinExact,
  SPECIAL_DEGREES, tanExact,
} from '../../math/exact'
import { U, valueSteps } from '../../math/questions'
import { Frame, LinSlider, Readouts, Seg } from './shared'

const W = 480, H = 480, CX = 240, CY = 228, R = 160
const SPECIALS = SPECIAL_DEGREES.filter((d) => d < 360)
const pt = (deg: number, rr = R) => ({ x: CX + rr * Math.cos(degToRad(deg)), y: CY - rr * Math.sin(degToRad(deg)) })

const dec = (x: number) => (Math.abs(x) < 5e-4 ? '0' : x.toFixed(3).replace(/0+$/, '').replace(/\.$/, '').replace('-', '−'))

/** Exact text when the angle is special, otherwise a decimal. */
export function valueText(fn: Fn, deg: number): { main: string; hint?: string } {
  const num = fn === 'sin' ? Math.sin(degToRad(deg)) : fn === 'cos' ? Math.cos(degToRad(deg)) : Math.tan(degToRad(deg))
  if (isSpecial(deg)) {
    const v = evalExact(fn, deg)
    return v ? { main: fmtSurd(v), hint: `≈ ${dec(num)}` } : { main: 'undefined', hint: 'cos θ = 0' }
  }
  if (fn === 'tan' && Math.abs(Math.cos(degToRad(deg))) < 1e-9) return { main: 'undefined', hint: 'cos θ = 0' }
  return { main: dec(num) }
}

/** The draggable unit circle. Controlled: the parent owns the angle. */
export function UnitCircleView({ deg, onDeg, snap }: { deg: number; onDeg: (d: number) => void; snap: boolean }) {
  const ref = useRef<SVGSVGElement>(null)
  const dragging = useRef(false)
  const th = degToRad(deg)
  const P = pt(deg)
  const tan = Math.tan(th)
  const tanOk = Math.abs(Math.cos(th)) > 1e-9 && Math.abs(tan) <= 2.2

  const fromEvent = (e: React.PointerEvent) => {
    const rect = ref.current!.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * W - CX
    const y = CY - ((e.clientY - rect.top) / rect.height) * H
    let d = radToDeg(Math.atan2(y, x))
    if (d < 0) d += 360
    if (snap) d = SPECIALS.reduce((best, s) => (Math.min(Math.abs(s - d), 360 - Math.abs(s - d)) < Math.min(Math.abs(best - d), 360 - Math.abs(best - d)) ? s : best), 0)
    else d = Math.round(d)
    onDeg(d % 360)
  }
  const step = (dir: 1 | -1) => {
    if (snap) {
      const i = SPECIALS.indexOf(norm360(deg))
      if (i >= 0) return onDeg(SPECIALS[(i + dir + SPECIALS.length) % SPECIALS.length])
      return onDeg(dir === 1 ? (SPECIALS.find((s) => s > deg) ?? 0) : ([...SPECIALS].reverse().find((s) => s < deg) ?? 0))
    }
    onDeg(norm360(deg + dir))
  }

  const arcR = 38
  const a0 = pt(0, arcR), a1 = pt(deg, arcR)
  const arc = deg > 0 ? `M ${a0.x} ${a0.y} A ${arcR} ${arcR} 0 ${deg > 180 ? 1 : 0} 0 ${a1.x} ${a1.y}` : ''
  const tx = CX + R, ty = CY - R * tan

  return (
    <svg
      ref={ref} viewBox={`0 0 ${W} ${H}`} className="wsvg uc" role="slider" tabIndex={0}
      aria-label="Angle on the unit circle" aria-valuemin={0} aria-valuemax={360} aria-valuenow={Math.round(deg)} aria-valuetext={`${Math.round(deg)} degrees`}
      onPointerDown={(e) => { dragging.current = true; (e.currentTarget as SVGSVGElement).setPointerCapture(e.pointerId); fromEvent(e) }}
      onPointerMove={(e) => { if (dragging.current) fromEvent(e) }}
      onPointerUp={() => { dragging.current = false }}
      onKeyDown={(e) => {
        if (e.key === 'ArrowRight' || e.key === 'ArrowUp') { e.preventDefault(); step(1) }
        if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') { e.preventDefault(); step(-1) }
      }}
      style={{ touchAction: 'none', cursor: 'grab' }}
    >
      <line x1={14} x2={W - 14} y1={CY} y2={CY} className="w-axis" />
      <line x1={CX} x2={CX} y1={14} y2={H - 14} className="w-axis" />
      <circle cx={CX} cy={CY} r={R} className="w-circle" />
      {tanOk && <line x1={CX + R} x2={CX + R} y1={CY - R * 2.2} y2={CY + R * 2.2} className="w-grid" />}
      {SPECIALS.map((d) => {
        const p = pt(d), l = pt(d, R + 30)
        const on = norm360(deg) === d
        return (
          <g key={d} className={on ? 'uc-on' : ''}>
            <circle cx={p.x} cy={p.y} r={3} className="uc-dot" />
            <text x={l.x} y={l.y + 4} textAnchor="middle" className="w-t sm uc-lbl">{fmtPi(d)}</text>
          </g>
        )
      })}
      {arc && <path d={arc} className="w-angle" />}
      {tanOk && <line x1={CX} y1={CY} x2={tx} y2={ty} className="w-ref" />}
      {tanOk && <line x1={tx} y1={CY} x2={tx} y2={ty} className="w-tan" />}
      <line x1={CX} y1={CY} x2={P.x} y2={P.y} className="w-radius" />
      <line x1={CX} y1={CY} x2={P.x} y2={CY} className="w-cos" />
      <line x1={P.x} y1={CY} x2={P.x} y2={P.y} className="w-sin" />
      <circle cx={P.x} cy={P.y} r={8} className="w-pt" />
      <g className="uc-key" transform={`translate(${CX - 150}, ${H - 18})`}>
        <line x1={0} x2={24} y1={0} y2={0} className="w-cos" /><text x={32} y={4}>cos θ = x</text>
        <line x1={110} x2={134} y1={0} y2={0} className="w-sin" /><text x={142} y={4}>sin θ = y</text>
        <line x1={220} x2={244} y1={0} y2={0} className="w-tan" /><text x={252} y={4}>tan θ</text>
      </g>
    </svg>
  )
}

/** Inline widget: the circle with controls and readouts. */
export function UnitCircle() {
  const [deg, setDeg] = useState(30)
  const [snap, setSnap] = useState(true)
  const c = valueText('cos', deg), s = valueText('sin', deg), t = valueText('tan', deg)
  const set = (d: number) => setDeg(snap ? SPECIALS.reduce((b, x) => (Math.abs(x - d) < Math.abs(b - d) ? x : b), 0) : d)
  return (
    <Frame caption="Drag the point around the circle, or use the arrow keys. With snapping on it jumps between the special angles, where the values are exact.">
      <div className="lab-main">
        <div className="lab-canvas"><UnitCircleView deg={deg} onDeg={setDeg} snap={snap} /></div>
        <div className="lab-controls">
          <label className="slider toggle">
            <span className="slider-label">Snap</span>
            <input type="checkbox" checked={snap} onChange={(e) => { setSnap(e.target.checked); if (e.target.checked) setDeg(SPECIALS.reduce((b, x) => (Math.abs(x - deg) < Math.abs(b - deg) ? x : b), 0)) }} />
            <span className="slider-value">special angles only</span>
          </label>
          <LinSlider label="Angle" value={Math.round(deg)} min={0} max={359} onChange={set} fmt={(v) => `${v}°`} />
          <Readouts items={[
            ['Angle θ', fmtDeg(Math.round(deg)), isSpecial(deg) || Number.isInteger(deg) ? `${fmtPi(Math.round(deg))} radians` : undefined],
            ['cos θ (x)', c.main, c.hint],
            ['sin θ (y)', s.main, s.hint],
            ['tan θ (y / x)', t.main, t.hint],
          ]} />
        </div>
      </div>
    </Frame>
  )
}

/* ------------------------------------------------------------------ the two special triangles */

function Tri({ x, y, base, height, lb, lh, lc, a, c }: { x: number; y: number; base: number; height: number; lb: string; lh: string; lc: string; a: string; c: string }) {
  const bx = x + base, ty = y - height
  const mx = (x + bx) / 2, my = (y + ty) / 2
  return (
    <g>
      <polygon points={`${x},${y} ${bx},${y} ${bx},${ty}`} className="w-body" />
      <path d={`M ${bx - 11} ${y} L ${bx - 11} ${y - 11} L ${bx} ${y - 11}`} className="w-rt" />
      <text x={mx} y={y + 17} textAnchor="middle" className="w-t">{lb}</text>
      <text x={bx + 8} y={(y + ty) / 2 + 5} className="w-t">{lh}</text>
      <text x={mx - 10} y={my - 8} textAnchor="end" className="w-t accent">{lc}</text>
      <text x={x + 26} y={y - 6} className="w-t sm">{a}</text>
      <text x={bx + 8} y={ty - 6} className="w-t sm">{c}</text>
    </g>
  )
}

export function Triangles() {
  const s2 = Math.SQRT2, s3 = Math.sqrt(3)
  return (
    <Frame caption="Scale each triangle so its hypotenuse is 1. The other two sides become the x and y coordinates of a point on the unit circle.">
      <svg viewBox="0 0 680 392" className="wsvg" role="img" aria-label="The 45-45-90 and 30-60-90 triangles, before and after scaling to hypotenuse 1">
        <text x={30} y={24} className="w-t">45° – 45° – 90°</text>
        <Tri x={40} y={170} base={76} height={76} lb="1" lh="1" lc="√2" a="45°" c="45°" />
        <text x={236} y={118} className="w-t sm">÷ √2</text>
        <path d="M 222 128 H 290 M 281 122 L 290 128 L 281 134" className="w-arrowpath" />
        <Tri x={380} y={170} base={150 / s2} height={150 / s2} lb="√2/2" lh="√2/2" lc="1" a="45°" c="45°" />
        <text x={30} y={216} className="w-t">30° – 60° – 90°</text>
        <Tri x={40} y={354} base={50 * s3} height={50} lb="√3" lh="1" lc="2" a="30°" c="60°" />
        <text x={236} y={310} className="w-t sm">÷ 2</text>
        <path d="M 222 320 H 290 M 281 314 L 290 320 L 281 326" className="w-arrowpath" />
        <Tri x={380} y={354} base={75 * s3} height={75} lb="√3/2" lh="1/2" lc="1" a="30°" c="60°" />
      </svg>
    </Frame>
  )
}

/* ------------------------------------------------------------------ ASTC */

export function Astc() {
  const cx = 210, cy = 160, r = 118
  const q = (x: number, y: number, a: string, b: string) => (
    <text x={x} y={y} textAnchor="middle"><tspan className="w-t accent" x={x} dy={0}>{a}</tspan><tspan className="w-t sm" x={x} dy={18}>{b}</tspan></text>
  )
  const SIGN = { sin: ['+', '+', '−', '−'], cos: ['+', '−', '−', '+'], tan: ['+', '−', '+', '−'] }
  return (
    <Frame caption="All Students Take Calculus. In each quadrant, only the functions named are positive; the others are negative.">
      <svg viewBox="0 0 420 330" className="wsvg" role="img" aria-label="ASTC diagram of signs in each quadrant">
        <line x1={20} x2={400} y1={cy} y2={cy} className="w-axis" />
        <line x1={cx} x2={cx} y1={12} y2={308} className="w-axis" />
        <circle cx={cx} cy={cy} r={r} className="w-circle" />
        {q(cx + 62, cy - 34, 'I  All', 'x +, y +')}
        {q(cx - 62, cy - 34, 'II  Sine', 'x −, y +')}
        {q(cx - 62, cy + 40, 'III  Tangent', 'x −, y −')}
        {q(cx + 62, cy + 40, 'IV  Cosine', 'x +, y −')}
      </svg>
      <div className="table-wrap">
        <table>
          <thead><tr><th>Sign of</th><th>Quadrant I</th><th>Quadrant II</th><th>Quadrant III</th><th>Quadrant IV</th></tr></thead>
          <tbody>
            {(['sin', 'cos', 'tan'] as Fn[]).map((f) => <tr key={f}><td>{f} θ</td>{SIGN[f].map((sg, i) => <td key={i} className={sg === '+' ? 'sg-pos' : 'sg-neg'}>{sg === '+' ? 'positive' : 'negative'}</td>)}</tr>)}
          </tbody>
        </table>
      </div>
    </Frame>
  )
}

/* ------------------------------------------------------------------ reference angle stepper */

const ALL_ANGLES = [...new Set(SPECIAL_DEGREES.flatMap((d) => [d - 360, d, d + 360]))].sort((a, b) => a - b)

export function Reference() {
  const [fn, setFn] = useState<Fn>('sin')
  const [u, setU] = useState<U>('rad')
  const [deg, setDeg] = useState(150)
  const t = norm360(deg)
  const rho = referenceAngle(t)
  const cx = 160, cy = 180, r = 100
  const p = { x: cx + r * Math.cos(degToRad(t)), y: cy - r * Math.sin(degToRad(t)) }
  const q = quadrant(t)
  const axisAngle = q === 'axis' ? t : t < 90 ? 0 : t < 270 ? 180 : 360
  const lo = Math.min(axisAngle, t), hi = Math.max(axisAngle, t)
  const ar = 34
  const s = { x: cx + ar * Math.cos(degToRad(lo)), y: cy - ar * Math.sin(degToRad(lo)) }
  const e = { x: cx + ar * Math.cos(degToRad(hi)), y: cy - ar * Math.sin(degToRad(hi)) }
  const sign = (v: number) => (v < 0 ? '−' : '+')
  const exact = evalExact(fn, deg)
  const steps = valueSteps(fn, deg, u)
  return (
    <Frame caption="Pick a function and an angle, and the four-step method is worked out for you. The shaded wedge is the reference angle.">
      <div className="lab-main">
        <div className="lab-canvas">
          <svg viewBox="0 0 320 300" className="wsvg" role="img" aria-label={`Angle ${fmtDeg(deg)} with its reference angle`}>
            <line x1={10} x2={310} y1={cy} y2={cy} className="w-axis" />
            <line x1={cx} x2={cx} y1={72} y2={292} className="w-axis" />
            <circle cx={cx} cy={cy} r={r} className="w-circle" />
            {q !== 'axis' && rho > 0 && <path d={`M ${cx} ${cy} L ${s.x} ${s.y} A ${ar} ${ar} 0 0 0 ${e.x} ${e.y} Z`} className="w-wedge" />}
            {q !== 'axis' && <line x1={p.x} y1={cy} x2={p.x} y2={p.y} className="w-ref" />}
            <line x1={cx} y1={cy} x2={p.x} y2={p.y} className="w-radius" />
            <circle cx={p.x} cy={p.y} r={7} className="w-pt" />
            <text x={12} y={20} className="w-t sm">{q === 'axis' ? 'on an axis' : `quadrant ${['', 'I', 'II', 'III', 'IV'][q]}, reference angle ${u === 'rad' ? fmtPi(rho) : fmtDeg(rho)}`}</text>
            <text x={12} y={40} className="w-t sm">signs of (x, y): ({sign(cosExact(t).p || 1)}, {sign(sinExact(t).p || 1)})</text>
            <text x={12} y={60} className="w-t sm">point: ({fmtSurd(cosExact(t))}, {fmtSurd(sinExact(t))})</text>
          </svg>
        </div>
        <div className="lab-controls">
          <Seg label="Function" value={fn} options={FNS.map((f) => ({ id: f, label: f }))} onChange={setFn} />
          <Seg label="Units" value={u} options={[{ id: 'rad', label: 'radians' }, { id: 'deg', label: 'degrees' }]} onChange={setU} />
          <label className="field">Angle
            <select value={deg} onChange={(e) => setDeg(Number(e.target.value))}>
              {ALL_ANGLES.map((d) => <option key={d} value={d}>{u === 'rad' ? `${fmtPi(d)}  (${fmtDeg(d)})` : `${fmtDeg(d)}  (${fmtPi(d)})`}</option>)}
            </select>
          </label>
          <ol className="steps">{steps.map((st, i) => <li key={i}>{st}</li>)}</ol>
          <p className="readout-big">{fn}({u === 'rad' ? fmtPi(deg) : fmtDeg(deg)}) = {exact ? fmtSurd(exact) : 'undefined'}</p>
          {tanExact(deg) === null && fn === 'tan' && <p className="hint">cos θ = 0 here, so tan θ = sin θ / cos θ has a zero denominator.</p>}
        </div>
      </div>
    </Frame>
  )
}
