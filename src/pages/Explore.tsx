import { useState } from 'react'
import { cosExact, fmtDeg, fmtPi, fmtSurd, isSpecial, referenceAngle, sinExact, SPECIAL_DEGREES, tanExact } from '../math/exact'
import { Converter } from '../learn/widgets/Angles'
import { UnitCircleView, valueText } from '../learn/widgets/Circle'
import { LinSlider, Readouts } from '../learn/widgets/shared'

const SPECIALS = SPECIAL_DEGREES.filter((d) => d < 360)
const snapTo = (d: number) => SPECIALS.reduce((b, x) => (Math.abs(x - d) < Math.abs(b - d) ? x : b), 0)

export function Explore() {
  const [deg, setDeg] = useState(150)
  const [snap, setSnap] = useState(true)
  const c = valueText('cos', deg), s = valueText('sin', deg), t = valueText('tan', deg)
  const d = Math.round(deg)
  return (
    <div className="page explore">
      <p className="eyebrow">Explore</p>
      <h1 className="page-title">The unit circle</h1>
      <p className="lead" style={{ maxWidth: '62ch' }}>Drag the point, press the arrow keys, or click a row of the table. Before you reveal a value, try to work it out from the reference angle and the quadrant.</p>
      <div className="explore-main">
        <div className="card lab-canvas big"><UnitCircleView deg={deg} onDeg={setDeg} snap={snap} /></div>
        <div className="card explore-side">
          <label className="slider toggle">
            <span className="slider-label">Snap</span>
            <input type="checkbox" checked={snap} onChange={(e) => { setSnap(e.target.checked); if (e.target.checked) setDeg(snapTo(deg)) }} />
            <span className="slider-value">special angles only</span>
          </label>
          <LinSlider label="Angle" value={d} min={0} max={359} onChange={(v) => setDeg(snap ? snapTo(v) : v)} fmt={(v) => `${v}°`} />
          <Readouts items={[
            ['Angle θ', fmtDeg(d), `${fmtPi(d)} radians`],
            ['Reference angle', isSpecial(d) ? `${fmtDeg(referenceAngle(d))}  =  ${fmtPi(referenceAngle(d))}` : `${referenceAngle(d)}°`],
            ['cos θ (x)', c.main, c.hint],
            ['sin θ (y)', s.main, s.hint],
            ['tan θ (y / x)', t.main, t.hint],
          ]} />
        </div>
      </div>
      <h2 className="lh" style={{ marginTop: '2rem' }}>Every special angle</h2>
      <div className="table-wrap clickable">
        <table>
          <thead><tr><th>Degrees</th><th>Radians</th><th>cos</th><th>sin</th><th>tan</th></tr></thead>
          <tbody>
            {SPECIAL_DEGREES.map((a) => (
              <tr key={a} className={a % 360 === d % 360 ? 'active' : ''} onClick={() => { setDeg(a % 360); window.scrollTo({ top: 0, behavior: 'smooth' }) }}>
                <td>{a}°</td><td>{fmtPi(a)}</td><td>{fmtSurd(cosExact(a))}</td><td>{fmtSurd(sinExact(a))}</td><td>{tanExact(a) ? fmtSurd(tanExact(a)!) : 'undefined'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <h2 className="lh">Convert an angle</h2>
      <Converter />
    </div>
  )
}
