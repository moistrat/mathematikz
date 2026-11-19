import { useState } from 'react'
import { MINUS } from '../../math/exact'
import { Frame, LinSlider, Readouts, Seg } from './shared'

const num = (x: number, d = 3) => (Number.isFinite(x) ? Number(x.toFixed(d)).toString().replace('-', MINUS) : 'undefined')
const W = 640

/* ------------------------------------------------------------------ angles in triangles and polygons */

export function AngleLab() {
  const [mode, setMode] = useState<'tri' | 'poly'>('tri')
  const [a, setA] = useState(50)
  const [b, setB] = useState(60)
  const [n, setN] = useState(6)
  const c = 180 - a - b
  // triangle with base on the x axis, base angles a (left) and b (right)
  const base = 300, x0 = 170, y0 = 200
  const ra = (a * Math.PI) / 180, rb = (b * Math.PI) / 180
  const apexX = x0 + (base * Math.tan(rb)) / (Math.tan(ra) + Math.tan(rb)), apexY = y0 - ((base * Math.tan(ra) * Math.tan(rb)) / (Math.tan(ra) + Math.tan(rb)))
  const pts = Array.from({ length: n }, (_, i) => [320 + 110 * Math.sin((2 * Math.PI * i) / n), 120 - 100 * Math.cos((2 * Math.PI * i) / n)])
  const kind = c > 90 ? 'obtuse' : c === 90 || a === 90 || b === 90 ? 'right-angled' : a === b && b === c ? 'equilateral' : a === b || b === c || a === c ? 'isosceles (acute)' : 'acute'
  return (
    <Frame caption="The three angles of any triangle add up to 180°: tear off the corners of a paper triangle and they fit together along a straight line. A polygon with n sides can be cut into n − 2 triangles, so its interior angles add up to (n − 2) × 180°. A regular polygon has equal angles, and its exterior angles always total 360°.">
      <svg viewBox={`0 0 ${W} 240`} className="wsvg" role="img" aria-label="A triangle or polygon with its angles">
        {mode === 'tri' && c > 0 && (
          <>
            <polygon points={`${x0},${y0} ${x0 + base},${y0} ${apexX},${apexY}`} className="w-area" stroke="var(--accent)" strokeWidth={2} />
            <text x={x0 + 22} y={y0 - 6} className="w-t sm">{a}°</text>
            <text x={x0 + base - 52} y={y0 - 6} className="w-t sm">{b}°</text>
            <text x={apexX} y={apexY + 28} textAnchor="middle" className="w-t sm">{c}°</text>
          </>
        )}
        {mode === 'poly' && (
          <>
            <polygon points={pts.map((p) => p.join(',')).join(' ')} className="w-area" stroke="var(--accent)" strokeWidth={2} />
            {pts.slice(1, n - 1).map((p, i) => <line key={i} x1={pts[0][0]} y1={pts[0][1]} x2={p[0]} y2={p[1]} className="w-ref" />)}
          </>
        )}
      </svg>
      <div className="widget-controls">
        <Seg label="Shape" value={mode} options={[{ id: 'tri', label: 'triangle' }, { id: 'poly', label: 'regular polygon' }]} onChange={setMode} />
        {mode === 'tri' ? (
          <div className="two-col">
            <LinSlider label="Left angle" value={a} min={10} max={100} onChange={(v) => { setA(v); if (v + b > 170) setB(170 - v) }} fmt={(v) => `${v}°`} />
            <LinSlider label="Right angle" value={b} min={10} max={100} onChange={(v) => { setB(v); if (v + a > 170) setA(170 - v) }} fmt={(v) => `${v}°`} />
          </div>
        ) : (
          <LinSlider label="Number of sides n" value={n} min={3} max={14} onChange={setN} fmt={(v) => String(v)} />
        )}
        <Readouts items={mode === 'tri' ? [['Third angle', `${c}°`, `180° − ${a}° − ${b}°`], ['Type', kind], ['Exterior angle at the apex', `${a + b}°`, 'the sum of the two opposite interior angles']] : [['Triangles it splits into', String(n - 2)], ['Sum of interior angles', `${(n - 2) * 180}°`, `(${n} − 2) × 180°`], ['Each interior angle (regular)', `${num(((n - 2) * 180) / n, 2)}°`], ['Each exterior angle', `${num(360 / n, 2)}°`, '360° ÷ n']]} />
      </div>
    </Frame>
  )
}

/* ------------------------------------------------------------------ the Pythagorean theorem */

export function PythagLab() {
  const [a, setA] = useState(3)
  const [b, setB] = useState(4)
  const c = Math.hypot(a, b)
  const s = Math.min(22, 215 / (a + b), 120 / b)
  const ox = 230, oy = 230
  const P1: [number, number] = [ox + b * s, oy], P2: [number, number] = [ox, oy - a * s]
  const n: [number, number] = [a * s, -b * s]
  const hyp = `${P1[0]},${P1[1]} ${P2[0]},${P2[1]} ${P2[0] + n[0]},${P2[1] + n[1]} ${P1[0] + n[0]},${P1[1] + n[1]}`
  return (
    <Frame caption="In a right-angled triangle the square on the hypotenuse has the same area as the two squares on the other sides added together: a² + b² = c². The big tilted square equals the two upright squares in total. When a, b and c are all whole numbers (such as 3, 4, 5 or 5, 12, 13) they form a Pythagorean triple.">
      <svg viewBox={`0 0 ${W} 360`} className="wsvg" role="img" aria-label="A right triangle with a square drawn on each side">
        <rect x={ox - a * s} y={oy - a * s} width={a * s} height={a * s} className="w-area" stroke="var(--accent)" strokeWidth={1.5} />
        <rect x={ox} y={oy} width={b * s} height={b * s} className="w-area" stroke="var(--accent)" strokeWidth={1.5} />
        <polygon points={hyp} className="w-fill" stroke="var(--text-dim)" strokeWidth={1.5} />
        <polygon points={`${ox},${oy} ${P1[0]},${P1[1]} ${P2[0]},${P2[1]}`} fill="var(--canvas-bg)" stroke="var(--text)" strokeWidth={2.5} />
        <text x={ox - (a * s) / 2} y={oy - (a * s) / 2 + 5} textAnchor="middle" className="w-t">{a * a}</text>
        <text x={ox + (b * s) / 2} y={oy + (b * s) / 2 + 5} textAnchor="middle" className="w-t">{b * b}</text>
        <text x={(P1[0] + P2[0] + n[0]) / 2} y={(P1[1] + P2[1] + n[1]) / 2 + 5} textAnchor="middle" className="w-t">{num(c * c, 2)}</text>
      </svg>
      <div className="widget-controls">
        <div className="two-col">
          <LinSlider label="Side a" value={a} min={1} max={12} onChange={setA} fmt={(v) => String(v)} />
          <LinSlider label="Side b" value={b} min={1} max={12} onChange={setB} fmt={(v) => String(v)} />
        </div>
        <Readouts items={[['a² + b²', `${a * a} + ${b * b} = ${a * a + b * b}`], ['Hypotenuse c', `√${a * a + b * b} = ${num(c, 4)}`, Number.isInteger(c) ? 'a Pythagorean triple: all three are whole numbers' : undefined], ['Check', `c² = ${num(c * c, 4)}`, 'equals a² + b²']]} />
      </div>
    </Frame>
  )
}

/* ------------------------------------------------------------------ area and perimeter of shapes */

export function AreaLab() {
  const [shape, setShape] = useState<'rect' | 'tri' | 'trap' | 'circle'>('rect')
  const [p, setP] = useState(6)
  const [q, setQ] = useState(4)
  const [h, setH] = useState(3)
  const u = 22
  let body: React.ReactNode, area = 0, per = 0, formula = ''
  if (shape === 'rect') { area = p * q; per = 2 * (p + q); formula = 'length × width'; body = <rect x={80} y={30} width={p * u} height={q * u} className="w-area" stroke="var(--accent)" strokeWidth={2} /> }
  else if (shape === 'tri') { area = (p * q) / 2; per = p + q + Math.hypot(p, q); formula = '½ × base × height (a right triangle shown)'; body = <polygon points={`80,${30 + q * u} ${80 + p * u},${30 + q * u} 80,30`} className="w-area" stroke="var(--accent)" strokeWidth={2} /> }
  else if (shape === 'trap') { area = ((p + q) * h) / 2; per = p + q + 2 * Math.hypot((p - q) / 2, h); formula = '½ × (a + b) × height'; const off = (Math.max(p, q) - Math.min(p, q)) / 2; body = <polygon points={`80,${30 + h * u} ${80 + p * u},${30 + h * u} ${80 + (p - q) * u / 2 + q * u + 0 * off},30 ${80 + ((p - q) * u) / 2},30`} className="w-area" stroke="var(--accent)" strokeWidth={2} /> }
  else { area = Math.PI * p * p; per = 2 * Math.PI * p; formula = 'π × r²'; body = <circle cx={180} cy={110} r={Math.min(100, p * u)} className="w-area" stroke="var(--accent)" strokeWidth={2} /> }
  return (
    <Frame caption="Area is the amount of flat surface inside a shape, measured in square units; perimeter (the circumference for a circle) is the distance around it, measured in plain units. Each area formula comes from the rectangle: a triangle is half of a rectangle, and a trapezoid is half of a parallelogram made from two copies of itself. A circle’s area is πr².">
      <svg viewBox={`0 0 ${W} 250`} className="wsvg" role="img" aria-label="A shape with its area">{body}</svg>
      <div className="widget-controls">
        <Seg label="Shape" value={shape} options={[{ id: 'rect', label: 'rectangle' }, { id: 'tri', label: 'triangle' }, { id: 'trap', label: 'trapezoid' }, { id: 'circle', label: 'circle' }]} onChange={setShape} />
        <div className="two-col">
          <LinSlider label={shape === 'circle' ? 'Radius r' : shape === 'trap' ? 'Bottom side a' : shape === 'tri' ? 'Base' : 'Length'} value={p} min={1} max={shape === 'circle' ? 4.5 : 10} step={shape === 'circle' ? 0.5 : 1} onChange={setP} fmt={(v) => num(v, 1)} />
          {shape !== 'circle' && <LinSlider label={shape === 'trap' ? 'Top side b' : shape === 'tri' ? 'Height' : 'Width'} value={q} min={1} max={shape === 'trap' ? 10 : 8} onChange={setQ} fmt={(v) => String(v)} />}
          {shape === 'trap' && <LinSlider label="Height" value={h} min={1} max={6} onChange={setH} fmt={(v) => String(v)} />}
        </div>
        <Readouts items={[['Area', num(area, 3), formula], [shape === 'circle' ? 'Circumference' : 'Perimeter', num(per, 3), shape === 'circle' ? '2 × π × r' : undefined]]} />
      </div>
    </Frame>
  )
}

/* ------------------------------------------------------------------ similar figures */

export function SimilarLab() {
  const [k, setK] = useState(2)
  const [a, setA] = useState(3)
  const [b, setB] = useState(4)
  const u = 16
  return (
    <Frame caption="Similar figures have the same shape but different sizes: all lengths are multiplied by the same scale factor k. Areas are multiplied by k² (two dimensions) and volumes by k³ (three dimensions). Doubling the lengths makes the area four times as big and the volume eight times as big, which is why a giant ant could not exist: its weight would grow faster than the strength of its legs.">
      <svg viewBox={`0 0 ${W} 220`} className="wsvg" role="img" aria-label="A right triangle and a larger similar triangle">
        <polygon points={`40,200 ${40 + b * u},200 40,${200 - a * u}`} className="w-area" stroke="var(--accent)" strokeWidth={2} />
        <polygon points={`${300},200 ${300 + b * k * u * 0.5},200 ${300},${200 - a * k * u * 0.5}`} className="w-body alt" stroke="var(--accent)" strokeWidth={2} opacity={0.9} />
        <text x={40 + (b * u) / 2} y={216} textAnchor="middle" className="w-t sm">{b}</text>
        <text x={300 + (b * k * u * 0.5) / 2} y={216} textAnchor="middle" className="w-t sm">{b * k}</text>
      </svg>
      <div className="widget-controls">
        <div className="two-col">
          <LinSlider label="Scale factor k" value={k} min={1} max={5} step={0.5} onChange={setK} fmt={(v) => `× ${num(v, 1)}`} />
          <LinSlider label="Short side" value={a} min={1} max={8} onChange={setA} fmt={(v) => String(v)} />
          <LinSlider label="Long side" value={b} min={1} max={8} onChange={setB} fmt={(v) => String(v)} />
        </div>
        <Readouts items={[['Lengths', `× ${num(k, 1)}`, `${a} → ${num(a * k, 2)} and ${b} → ${num(b * k, 2)}`], ['Areas', `× ${num(k * k, 2)}`, `${num((a * b) / 2, 2)} → ${num(((a * b) / 2) * k * k, 2)}`], ['Volumes (similar solids)', `× ${num(k ** 3, 2)}`, 'k³']]} />
      </div>
    </Frame>
  )
}

/* ------------------------------------------------------------------ arcs and sectors */

export function SectorLab() {
  const [r, setR] = useState(4)
  const [th, setTh] = useState(90)
  const R = Math.min(110, r * 22)
  const cx = 200, cy = 125
  const rad = (th * Math.PI) / 180
  const x2 = cx + R * Math.cos(rad), y2 = cy - R * Math.sin(rad)
  return (
    <Frame caption="A sector is a slice of a circle, like a slice of pizza. If the central angle is θ, the slice is the fraction θ/360 of the whole circle, so its arc is θ/360 of the circumference and its area is θ/360 of the circle’s area. An inscribed angle (a corner on the circle) is half the central angle on the same arc.">
      <svg viewBox={`0 0 ${W} 250`} className="wsvg" role="img" aria-label="A circle with a shaded sector">
        <circle cx={cx} cy={cy} r={R} fill="none" stroke="var(--text-dim)" strokeWidth={2} />
        <path d={`M${cx},${cy} L${cx + R},${cy} A${R},${R} 0 ${th > 180 ? 1 : 0} 0 ${x2},${y2} Z`} className="w-area" stroke="var(--accent)" strokeWidth={2} />
        <text x={cx + 28} y={cy - 8} className="w-t sm">{th}°</text>
      </svg>
      <div className="widget-controls">
        <div className="two-col">
          <LinSlider label="Radius r" value={r} min={1} max={5} onChange={setR} fmt={(v) => String(v)} />
          <LinSlider label="Central angle θ" value={th} min={10} max={350} step={5} onChange={setTh} fmt={(v) => `${v}°`} />
        </div>
        <Readouts items={[['Fraction of the circle', `${th}/360 = ${num(th / 360, 4)}`], ['Arc length', `${num((th / 360) * 2 * Math.PI * r, 3)}`, `(θ/360) × 2πr = ${num((th * 2 * r) / 360, 4)}π`], ['Sector area', `${num((th / 360) * Math.PI * r * r, 3)}`, `(θ/360) × πr² = ${num((th * r * r) / 360, 4)}π`], ['Inscribed angle on the same arc', `${num(th / 2, 1)}°`, 'half the central angle']]} />
      </div>
    </Frame>
  )
}
