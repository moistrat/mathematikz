import { useState } from 'react'
import { degToRad, fmtPi, MINUS, piFraction } from '../../math/exact'
import { evaluate } from '../../math/parse'
import { Frame, LinSlider, Readouts, Seg } from './shared'

/* ------------------------------------------------------------------ what a radian is */

export function Radians() {
  const [deg, setDeg] = useState(120)
  const rad = degToRad(deg)
  const cx = 150, cy = 128, r = 84
  const pt = (a: number, rr = r) => ({ x: cx + rr * Math.cos(a), y: cy - rr * Math.sin(a) })
  const end = pt(rad)
  const arc = deg > 0 ? `M ${cx + r} ${cy} A ${r} ${r} 0 ${deg > 180 ? 1 : 0} 0 ${end.x} ${end.y}` : ''
  const barX = 40, barY = 308
  const whole = Math.floor(rad + 1e-9), frac = rad - whole
  const whole360 = Number.isInteger(deg)
  const pf = whole360 ? piFraction(deg) : null
  return (
    <Frame caption="One radian is the angle whose arc is exactly as long as the radius. Below, the arc is straightened into a bar, one block per radius length.">
      <svg viewBox="0 0 640 340" className="wsvg" role="img" aria-label="An arc of the circle compared to radius lengths">
        <line x1={cx - r - 14} x2={cx + r + 14} y1={cy} y2={cy} className="w-axis" />
        <line x1={cx} x2={cx} y1={cy - r - 14} y2={cy + r + 14} className="w-axis" />
        <circle cx={cx} cy={cy} r={r} className="w-circle" />
        {[1, 2, 3, 4, 5, 6].map((k) => {
          const p = pt(k), l = pt(k, r + 14)
          return <g key={k} className={k <= rad ? 'uc-on' : ''}><circle cx={p.x} cy={p.y} r={3} className="uc-dot" /><text x={l.x} y={l.y + 4} textAnchor="middle" className="w-t sm uc-lbl">{k}</text></g>
        })}
        {arc && <path d={arc} className="w-arcthick" />}
        <line x1={cx} y1={cy} x2={cx + r} y2={cy} className="w-radius" />
        <line x1={cx} y1={cy} x2={end.x} y2={end.y} className="w-radius" />
        <text x={cx + r / 2} y={cy + 16} textAnchor="middle" className="w-t sm">r</text>
        <text x={330} y={44} className="w-t">θ = {rad.toFixed(3)} rad</text>
        <text x={330} y={68} className="w-t sm">s = r × θ = {rad.toFixed(2)} radius lengths</text>
        <text x={330} y={92} className="w-t sm">Dots mark 1, 2, 3… radians.</text>
        {Array.from({ length: whole }, (_, k) => (
          <g key={k}>
            <rect x={barX + k * r} y={barY - 22} width={r} height={22} className={k % 2 ? 'w-bar b' : 'w-bar a'} />
            <text x={barX + k * r + r / 2} y={barY - 7} textAnchor="middle" className="w-t sm bar-t">r</text>
          </g>
        ))}
        {frac > 0.002 && <rect x={barX + whole * r} y={barY - 22} width={frac * r} height={22} className="w-bar c" />}
        <line x1={barX} x2={barX + 2 * Math.PI * r} y1={barY + 6} y2={barY + 6} className="w-grid" />
        <text x={barX} y={barY - 34} className="w-t sm">The same arc, straightened out. Each block is one radius long.</text>
      </svg>
      <div className="widget-controls">
        <LinSlider label="Angle" value={deg} min={0} max={360} step={0.1} onChange={setDeg} fmt={(v) => `${Number.isInteger(v) ? v : v.toFixed(1)}°`} />
        <div className="tool-row">
          {[[30, '30°'], [90, '90°'], [180, '180°'], [270, '270°'], [360, '360°'], [180 / Math.PI, '1 radian']].map(([d, l]) => <button key={String(l)} className="btn" onClick={() => setDeg(d as number)}>{l as string}</button>)}
        </div>
        <Readouts items={[
          ['In degrees', `${Number.isInteger(deg) ? deg : deg.toFixed(1)}°`, `${(deg / 360 * 100).toFixed(1)}% of a full turn`],
          ['In radians (exact)', pf ? fmtPi(deg) : 'not a neat multiple of π', pf ? undefined : 'whole degrees give exact answers'],
          ['In radians (decimal)', rad.toFixed(4), 'arc length ÷ radius'],
        ]} />
      </div>
    </Frame>
  )
}

/* ------------------------------------------------------------------ converter */

const D2R = ['30', '45', '60', '90', '120', '135', '180', '270', '360']
const R2D = ['pi/6', 'pi/4', 'pi/3', 'pi/2', '2pi/3', '3pi/4', 'pi', '3pi/2', '2pi']
const tidy = (x: number, d = 4) => Number(x.toFixed(d)).toString().replace('-', MINUS)

export function Converter() {
  const [mode, setMode] = useState<'d2r' | 'r2d'>('d2r')
  const [text, setText] = useState('150')
  let result: { main: string; steps: string[] } | null = null
  try {
    const v = evaluate(text)
    if (mode === 'd2r') {
      if (Number.isInteger(v)) {
        const exact = fmtPi(v)
        result = {
          main: `${exact} rad  ≈  ${tidy(degToRad(v))}`,
          steps: [`Multiply by π/180: ${v < 0 ? `(${MINUS}${Math.abs(v)})` : v} × π/180 = ${v < 0 ? MINUS : ''}${Math.abs(v)}π/180.`, `Simplify the fraction: ${exact}.`],
        }
      } else result = { main: `${tidy(degToRad(v))} rad`, steps: [`Multiply by π/180: ${v} × π/180 ≈ ${tidy(degToRad(v))}.`, 'This is not a whole number of degrees, so there is no neat multiple of π.'] }
    } else {
      const d = (v * 180) / Math.PI
      const whole = Math.abs(d - Math.round(d)) < 1e-9
      result = {
        main: whole ? `${Math.round(d) < 0 ? MINUS : ''}${Math.abs(Math.round(d))}°` : `${tidy(d)}°`,
        steps: [`Multiply by 180/π: ${text.trim()} × 180/π.`, whole ? 'The π cancels, leaving a whole number of degrees.' : `Evaluate: ${tidy(d)}°.`],
      }
    }
  } catch { result = null }
  return (
    <Frame caption="Convert in either direction. In the radians box you can type pi, π or fractions such as 5pi/6.">
      <div className="widget-controls">
        <Seg label="Direction" value={mode} options={[{ id: 'd2r', label: 'degrees → radians' }, { id: 'r2d', label: 'radians → degrees' }]} onChange={(m) => { setMode(m); setText(m === 'd2r' ? '150' : '5pi/6') }} />
        <label className="field">{mode === 'd2r' ? 'Angle in degrees' : 'Angle in radians'}
          <input value={text} onChange={(e) => setText(e.target.value)} spellCheck={false} autoComplete="off" aria-label="Angle to convert" />
        </label>
        <div className="tool-row">{(mode === 'd2r' ? D2R : R2D).map((c) => <button key={c} className="btn" onClick={() => setText(c)}>{mode === 'd2r' ? `${c}°` : c.replace('pi', 'π')}</button>)}</div>
        {result ? (
          <>
            <p className="readout-big">{result.main}</p>
            <ol className="steps">{result.steps.map((s, i) => <li key={i}>{s}</li>)}</ol>
          </>
        ) : <p className="q-note">Could not read that. Try a number like 150, or 5pi/6.</p>}
      </div>
    </Frame>
  )
}
