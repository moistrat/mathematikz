import { useState } from 'react'
import { MINUS } from '../../math/exact'
import { Frame, LinSlider, Readouts, Seg } from './shared'

const num = (x: number, d = 2) => (Number.isFinite(x) ? Number(x.toFixed(d)).toString().replace('-', MINUS) : 'undefined')
const cxText = (re: number, im: number, d = 2) => {
  const a = Number(re.toFixed(d)), b = Number(im.toFixed(d))
  if (b === 0) return num(a, d)
  const bi = `${Math.abs(b) === 1 ? '' : num(Math.abs(b), d)}i`
  if (a === 0) return `${b < 0 ? MINUS : ''}${bi}`
  return `${num(a, d)} ${b < 0 ? MINUS : '+'} ${bi}`
}
const deg = (r: number) => (r * 180) / Math.PI

/** an arrow from (x1,y1) to (x2,y2) in screen coordinates */
function Arrow({ x1, y1, x2, y2, cls = '', label, dx = 6, dy = -6 }: { x1: number; y1: number; x2: number; y2: number; cls?: string; label?: string; dx?: number; dy?: number }) {
  const L = Math.hypot(x2 - x1, y2 - y1)
  if (L < 1) return null
  const ux = (x2 - x1) / L, uy = (y2 - y1) / L, h = Math.min(11, L * 0.5)
  const bx = x2 - ux * h, by = y2 - uy * h
  return (
    <g className={`w-arrow ${cls}`}>
      <line x1={x1} y1={y1} x2={bx} y2={by} />
      <polygon points={`${x2},${y2} ${bx - uy * h * 0.42},${by + ux * h * 0.42} ${bx + uy * h * 0.42},${by - ux * h * 0.42}`} />
      {label && <text x={x2 + dx} y={y2 + dy} className="w-t">{label}</text>}
    </g>
  )
}

const W = 640, H = 340

/** the plane with a square grid, scaled so that `reach` units fit in half the height */
function Plane({ reach, label, children }: { reach: number; label: string; children: (p: (x: number, y: number) => [number, number], unit: number) => React.ReactNode }) {
  const unit = (H / 2 - 12) / reach
  const p = (x: number, y: number): [number, number] => [W / 2 + x * unit, H / 2 - y * unit]
  const step = reach > 14 ? 5 : reach > 7 ? 2 : 1
  const xs: number[] = [], ys: number[] = []
  for (let t = -Math.floor(W / 2 / unit); t <= W / 2 / unit; t += 1) if (t % step === 0) xs.push(t)
  for (let t = -Math.floor(reach); t <= reach; t += 1) if (t % step === 0) ys.push(t)
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="wsvg" role="img" aria-label={label}>
      {xs.map((t) => <line key={`x${t}`} x1={p(t, 0)[0]} x2={p(t, 0)[0]} y1={0} y2={H} className="w-grid" />)}
      {ys.map((t) => <line key={`y${t}`} x1={0} x2={W} y1={p(0, t)[1]} y2={p(0, t)[1]} className="w-grid" />)}
      <line x1={0} x2={W} y1={H / 2} y2={H / 2} className="w-axis" />
      <line x1={W / 2} x2={W / 2} y1={0} y2={H} className="w-axis" />
      {xs.filter((t) => t !== 0).map((t) => <text key={`tx${t}`} x={p(t, 0)[0]} y={H / 2 + 13} textAnchor="middle" className="w-t sm">{t < 0 ? `${MINUS}${-t}` : t}</text>)}
      {ys.filter((t) => t !== 0).map((t) => <text key={`ty${t}`} x={W / 2 + 5} y={p(0, t)[1] - 3} className="w-t sm">{t < 0 ? `${MINUS}${-t}` : t}</text>)}
      <text x={W - 28} y={H / 2 - 6} className="w-t sm">Re</text>
      <text x={W / 2 + 6} y={12} className="w-t sm">Im</text>
      {children(p, unit)}
    </svg>
  )
}

/* ------------------------------------------------------------------ the Argand diagram */

type Op = 'add' | 'mul' | 'div' | 'conj'

export function Argand() {
  const [a, setA] = useState(3)
  const [b, setB] = useState(2)
  const [c, setC] = useState(-1)
  const [d, setD] = useState(2)
  const [op, setOp] = useState<Op>('add')
  const z2zero = c === 0 && d === 0
  let rr = 0, ri = 0
  if (op === 'add') { rr = a + c; ri = b + d }
  else if (op === 'mul') { rr = a * c - b * d; ri = a * d + b * c }
  else if (op === 'div') { const m = c * c + d * d || 1; rr = (a * c + b * d) / m; ri = (b * c - a * d) / m }
  else { rr = a; ri = -b }
  const reach = Math.max(6, Math.ceil(Math.max(Math.abs(a), Math.abs(b), Math.abs(c), Math.abs(d), Math.abs(rr), Math.abs(ri)) * 1.2))
  const usesW = op !== 'conj'
  const sym = { add: '+', mul: '×', div: '÷', conj: '' }[op]
  const mod = (x: number, y: number) => Math.hypot(x, y)
  const arg = (x: number, y: number) => deg(Math.atan2(y, x))
  const bad = op === 'div' && z2zero
  return (
    <Frame caption="Complex numbers live on a plane: the real part goes across, the imaginary part up. Adding is joining the arrows tip to tail. Multiplying multiplies the lengths and adds the angles. Dividing divides the lengths and subtracts the angles. The conjugate is the mirror image in the real axis.">
      <Plane reach={reach} label="An Argand diagram showing two complex numbers and a result">
        {(p) => (
          <>
            {usesW && op === 'add' && <path d={`M${p(a, b).join(',')} L${p(rr, ri).join(',')} L${p(c, d).join(',')}`} className="w-ref" fill="none" />}
            <Arrow x1={p(0, 0)[0]} y1={p(0, 0)[1]} x2={p(a, b)[0]} y2={p(a, b)[1]} label="z" />
            {usesW && <Arrow x1={p(0, 0)[0]} y1={p(0, 0)[1]} x2={p(c, d)[0]} y2={p(c, d)[1]} cls="alt" label="w" />}
            {!bad && <Arrow x1={p(0, 0)[0]} y1={p(0, 0)[1]} x2={p(rr, ri)[0]} y2={p(rr, ri)[1]} cls="red" label={op === 'conj' ? 'z̄' : op === 'add' ? 'z + w' : op === 'mul' ? 'zw' : 'z/w'} />}
          </>
        )}
      </Plane>
      <div className="widget-controls">
        <Seg label="Operation" value={op} options={[{ id: 'add', label: 'z + w' }, { id: 'mul', label: 'z × w' }, { id: 'div', label: 'z ÷ w' }, { id: 'conj', label: 'conjugate z̄' }]} onChange={setOp} />
        <div className="two-col">
          <LinSlider label="Re z" value={a} min={-6} max={6} onChange={setA} fmt={(v) => num(v, 0)} />
          <LinSlider label="Im z" value={b} min={-6} max={6} onChange={setB} fmt={(v) => num(v, 0)} />
          {usesW && <LinSlider label="Re w" value={c} min={-6} max={6} onChange={setC} fmt={(v) => num(v, 0)} />}
          {usesW && <LinSlider label="Im w" value={d} min={-6} max={6} onChange={setD} fmt={(v) => num(v, 0)} />}
        </div>
        <Readouts items={[
          ['z', cxText(a, b), `|z| = ${num(mod(a, b))},  arg z = ${num(arg(a, b), 1)}°`],
          ...(usesW ? [['w', cxText(c, d), `|w| = ${num(mod(c, d))},  arg w = ${num(arg(c, d), 1)}°`] as [string, string, string]] : []),
          [op === 'conj' ? 'z̄' : `z ${sym} w`, bad ? 'undefined (w = 0)' : cxText(rr, ri), bad ? undefined : `|result| = ${num(mod(rr, ri))},  arg = ${num(arg(rr, ri), 1)}°`],
        ]} />
      </div>
    </Frame>
  )
}

/* ------------------------------------------------------------------ roots of unity and the roots of a number */

export function RootsUnity() {
  const [n, setN] = useState(5)
  const [R, setR] = useState(1)
  const [th, setTh] = useState(0)
  const rho = Math.pow(R, 1 / n)
  const t0 = (th * Math.PI) / 180 / n
  const roots = Array.from({ length: n }, (_, k) => t0 + (2 * Math.PI * k) / n)
  const reach = Math.max(1.5, Math.ceil(rho * 1.3 * 2) / 2)
  return (
    <Frame caption="The n solutions of zⁿ = c sit evenly round a circle of radius |c|^(1/n), a whole turn divided into n equal steps, starting at an angle of (arg c)/n. For c = 1 these are the nth roots of unity: they always form a regular polygon, and they add up to 0.">
      <Plane reach={reach} label={`The ${n} solutions of z to the power ${n} equals c`}>
        {(p, unit) => (
          <>
            <circle cx={W / 2} cy={H / 2} r={rho * unit} className="w-circle" />
            <path d={`${roots.map((t, k) => `${k ? 'L' : 'M'}${p(rho * Math.cos(t), rho * Math.sin(t)).join(',')}`).join(' ')} Z`} className="w-ref" fill="none" />
            {roots.map((t, k) => {
              const [x, y] = p(rho * Math.cos(t), rho * Math.sin(t))
              return <g key={k}><circle cx={x} cy={y} r={6} className="w-dot" /><text x={x + (Math.cos(t) >= 0 ? 10 : -10)} y={y + (Math.sin(t) >= 0 ? -8 : 16)} textAnchor={Math.cos(t) >= 0 ? 'start' : 'end'} className="w-t sm">z{k}</text></g>
            })}
          </>
        )}
      </Plane>
      <div className="widget-controls">
        <div className="two-col">
          <LinSlider label="Power n" value={n} min={2} max={12} onChange={setN} fmt={(v) => `zⁿ, n = ${v}`} />
          <LinSlider label="|c|" value={R} min={1} max={32} onChange={setR} fmt={(v) => num(v, 0)} />
          <LinSlider label="arg c" value={th} min={0} max={345} step={15} onChange={setTh} fmt={(v) => `${v}°`} />
        </div>
        <Readouts items={[
          ['Radius of every root', num(rho, 3), `|c|^(1/n) = ${num(R, 0)}^(1/${n})`],
          ['First root z₀', `${num(rho, 3)} at ${num(deg(t0), 2)}°`, `arg c / n = ${th}° / ${n}`],
          ['Gap between roots', `${num(360 / n, 2)}°`, '360° / n'],
          ['Sum of the roots', '0', 'the polygon balances at the origin'],
        ]} />
      </div>
    </Frame>
  )
}

/* ------------------------------------------------------------------ vectors in the plane: the dot product */

export function VectorLab() {
  const [ux, setUx] = useState(4)
  const [uy, setUy] = useState(1)
  const [vx, setVx] = useState(1)
  const [vy, setVy] = useState(3)
  const dot = ux * vx + uy * vy
  const lu = Math.hypot(ux, uy), lv = Math.hypot(vx, vy)
  const zero = lu === 0 || lv === 0
  const cos = zero ? NaN : Math.max(-1, Math.min(1, dot / (lu * lv)))
  const th = deg(Math.acos(cos))
  const k = lv === 0 ? 0 : dot / (lv * lv)
  const px = k * vx, py = k * vy
  const reach = Math.max(6, Math.ceil(Math.max(Math.abs(ux), Math.abs(uy), Math.abs(vx), Math.abs(vy)) * 1.2))
  const kind = zero ? '' : Math.abs(dot) < 1e-9 ? 'perpendicular' : dot > 0 ? 'acute' : 'obtuse'
  return (
    <Frame caption="The dot product u·v = u₁v₁ + u₂v₂ equals |u||v| cos θ. It is zero when the vectors are perpendicular, positive when the angle is acute and negative when it is obtuse. The dashed arrow is the projection of u onto v: the shadow of u cast along v.">
      <Plane reach={reach} label="Two vectors, the angle between them and the projection of one onto the other">
        {(p) => {
          const o = p(0, 0)
          return (
            <>
              {!zero && <line x1={p(ux, uy)[0]} y1={p(ux, uy)[1]} x2={p(px, py)[0]} y2={p(px, py)[1]} className="w-ref" />}
              {!zero && <Arrow x1={o[0]} y1={o[1]} x2={p(px, py)[0]} y2={p(px, py)[1]} cls="alt" />}
              <Arrow x1={o[0]} y1={o[1]} x2={p(ux, uy)[0]} y2={p(ux, uy)[1]} cls="red" label="u" />
              <Arrow x1={o[0]} y1={o[1]} x2={p(vx, vy)[0]} y2={p(vx, vy)[1]} label="v" />
            </>
          )
        }}
      </Plane>
      <div className="widget-controls">
        <div className="two-col">
          <LinSlider label="u₁" value={ux} min={-6} max={6} onChange={setUx} fmt={(v) => num(v, 0)} />
          <LinSlider label="u₂" value={uy} min={-6} max={6} onChange={setUy} fmt={(v) => num(v, 0)} />
          <LinSlider label="v₁" value={vx} min={-6} max={6} onChange={setVx} fmt={(v) => num(v, 0)} />
          <LinSlider label="v₂" value={vy} min={-6} max={6} onChange={setVy} fmt={(v) => num(v, 0)} />
        </div>
        <Readouts items={[
          ['u·v', num(dot, 0), `${num(ux, 0)} × ${num(vx, 0)} + ${num(uy, 0)} × ${num(vy, 0)}`],
          ['|u|, |v|', `${num(lu, 3)},  ${num(lv, 3)}`],
          ['Angle between', zero ? 'undefined (a zero vector)' : `${num(th, 1)}°`, kind ? kind : undefined],
          ['Projection of u on v', zero ? 'undefined' : `(${num(px, 2)}, ${num(py, 2)})`, 'u·v / |v|² times v'],
        ]} />
      </div>
    </Frame>
  )
}

/* ------------------------------------------------------------------ vectors in space: the cross product */

export function CrossLab() {
  const [u, setU] = useState<[number, number, number]>([3, 0, 0])
  const [v, setV] = useState<[number, number, number]>([1, 3, 0])
  const set = (which: 'u' | 'v', i: number, val: number) => (which === 'u' ? setU : setV)((old) => old.map((x, j) => (j === i ? val : x)) as [number, number, number])
  const cr: [number, number, number] = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]]
  const area = Math.hypot(...cr)
  const reach = Math.max(5, ...u.map(Math.abs), ...v.map(Math.abs), ...cr.map((c) => Math.abs(c) / 3))
  const unit = 120 / reach
  const proj = (x: number, y: number, z: number): [number, number] => [W / 2 + (x - y) * 0.866 * unit * 1.1, H / 2 + 20 + (x + y) * 0.5 * unit * 1.1 - z * unit * 1.1]
  const o = proj(0, 0, 0)
  const crS: [number, number, number] = cr.map((c) => c / Math.max(1, area / (reach * 1.2))) as [number, number, number]
  const tip = (a: number[]) => proj(a[0], a[1], a[2])
  const sum = [u[0] + v[0], u[1] + v[1], u[2] + v[2]]
  const axisLen = reach
  return (
    <Frame caption="The cross product u × v is a vector perpendicular to both u and v. Its length is the area of the parallelogram they span, and its direction follows the right-hand rule. Swap u and v and it points the opposite way. Parallel vectors give the zero vector. (The arrow for u × v is scaled down when it would not fit.)">
      <svg viewBox={`0 0 ${W} ${H}`} className="wsvg" role="img" aria-label="Two vectors in space, the parallelogram they span and their cross product">
        {(['x', 'y', 'z'] as const).map((ax, i) => {
          const e = proj(i === 0 ? axisLen : 0, i === 1 ? axisLen : 0, i === 2 ? axisLen : 0)
          return <g key={ax}><line x1={o[0]} y1={o[1]} x2={e[0]} y2={e[1]} className="w-axis" /><text x={e[0] + 4} y={e[1] + 4} className="w-t sm">{ax}</text></g>
        })}
        <path d={`M${o} L${tip(u)} L${tip(sum)} L${tip(v)} Z`} className="w-area" />
        <Arrow x1={o[0]} y1={o[1]} x2={tip(u)[0]} y2={tip(u)[1]} cls="alt" label="u" />
        <Arrow x1={o[0]} y1={o[1]} x2={tip(v)[0]} y2={tip(v)[1]} label="v" />
        {area > 1e-9 && <Arrow x1={o[0]} y1={o[1]} x2={tip(crS)[0]} y2={tip(crS)[1]} cls="red" label="u × v" />}
      </svg>
      <div className="widget-controls">
        <div className="two-col">
          {[0, 1, 2].map((i) => <LinSlider key={`u${i}`} label={`u${'₁₂₃'[i]}`} value={u[i]} min={-5} max={5} onChange={(x) => set('u', i, x)} fmt={(x) => num(x, 0)} />)}
          {[0, 1, 2].map((i) => <LinSlider key={`v${i}`} label={`v${'₁₂₃'[i]}`} value={v[i]} min={-5} max={5} onChange={(x) => set('v', i, x)} fmt={(x) => num(x, 0)} />)}
        </div>
        <Readouts items={[
          ['u × v', `(${cr.map((c) => num(c, 0)).join(', ')})`, '(u₂v₃ − u₃v₂, u₃v₁ − u₁v₃, u₁v₂ − u₂v₁)'],
          ['Area of the parallelogram', num(area, 3), '|u × v|'],
          ['Area of the triangle', num(area / 2, 3), '½|u × v|'],
          ['Check: (u × v)·u and (u × v)·v', `${num(cr[0] * u[0] + cr[1] * u[1] + cr[2] * u[2], 0)},  ${num(cr[0] * v[0] + cr[1] * v[1] + cr[2] * v[2], 0)}`, 'both 0: perpendicular to each'],
        ]} />
      </div>
    </Frame>
  )
}
