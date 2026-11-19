import { useState } from 'react'
import { MINUS } from '../../math/exact'
import { Frame, LinSlider, Readouts, Seg } from './shared'

const num = (x: number, d = 3) => (Number.isFinite(x) ? Number(x.toFixed(d)).toString().replace('-', MINUS) : 'undefined')
const gcd = (a: number, b: number): number => (b === 0 ? Math.abs(a) : gcd(b, a % b))
const W = 640

/* ------------------------------------------------------------------ the number line */

export function NumberLine() {
  const [a, setA] = useState(3)
  const [b, setB] = useState(-5)
  const [op, setOp] = useState<'add' | 'sub'>('add')
  const move = op === 'add' ? b : -b
  const res = a + move
  const lo = -15, hi = 15
  const sx = (v: number) => 20 + ((v - lo) / (hi - lo)) * (W - 40)
  const arrow = (x1: number, x2: number, y: number, cls: string) => (
    <g className={`w-arrow ${cls}`}><line x1={sx(x1)} y1={y} x2={sx(x2) - Math.sign(x2 - x1) * 8} y2={y} /><polygon points={`${sx(x2)},${y} ${sx(x2) - Math.sign(x2 - x1) * 12},${y - 6} ${sx(x2) - Math.sign(x2 - x1) * 12},${y + 6}`} /></g>
  )
  return (
    <Frame caption="Start at the first number and move along the number line. Adding a positive number moves right and adding a negative number moves left. Subtracting a number is the same as adding its opposite, so subtracting a negative moves right.">
      <svg viewBox={`0 0 ${W} 150`} className="wsvg" role="img" aria-label="A number line showing a move from the first number">
        <line x1={20} x2={W - 20} y1={100} y2={100} className="w-axis" />
        {Array.from({ length: hi - lo + 1 }, (_, i) => lo + i).map((t) => <g key={t}><line x1={sx(t)} x2={sx(t)} y1={t === 0 ? 90 : 95} y2={t === 0 ? 110 : 105} className="w-axis" />{t % 5 === 0 && <text x={sx(t)} y={128} textAnchor="middle" className="w-t sm">{t < 0 ? `${MINUS}${-t}` : t}</text>}</g>)}
        {arrow(a, res, 70, 'red')}
        <circle cx={sx(a)} cy={100} r={6} className="w-dot" /><circle cx={sx(res)} cy={100} r={6} className="w-joint" />
        <text x={sx(a)} y={55} textAnchor="middle" className="w-t sm">start {num(a, 0)}</text>
        <text x={sx(res)} y={55} textAnchor="middle" className="w-t sm">end {num(res, 0)}</text>
      </svg>
      <div className="widget-controls">
        <Seg label="Operation" value={op} options={[{ id: 'add', label: 'add' }, { id: 'sub', label: 'subtract' }]} onChange={setOp} />
        <div className="two-col">
          <LinSlider label="First number" value={a} min={-10} max={10} onChange={setA} fmt={(v) => num(v, 0)} />
          <LinSlider label="Second number" value={b} min={-10} max={10} onChange={setB} fmt={(v) => num(v, 0)} />
        </div>
        <Readouts items={[['Calculation', `${num(a, 0)} ${op === 'add' ? '+' : '−'} ${b < 0 ? `(${num(b, 0)})` : num(b, 0)} = ${num(res, 0)}`], ['Same as', `${num(a, 0)} + (${num(move, 0)})`, op === 'sub' ? 'subtracting is adding the opposite' : undefined], ['Direction', move > 0 ? 'right' : move < 0 ? 'left' : 'no move']]} />
      </div>
    </Frame>
  )
}

/* ------------------------------------------------------------------ fraction bars */

function Bar({ n, d, y, label }: { n: number; d: number; y: number; label: string }) {
  const w = (W - 120) / d
  return (
    <g>
      <text x={8} y={y + 20} className="w-t sm">{label}</text>
      {Array.from({ length: d }, (_, i) => <rect key={i} x={60 + i * w} y={y} width={w - 2} height={30} className={i < n ? 'w-area' : 'w-fill'} stroke="var(--border-strong)" />)}
    </g>
  )
}

export function FractionBars() {
  const [n1, setN1] = useState(1)
  const [d1, setD1] = useState(3)
  const [n2, setN2] = useState(1)
  const [d2, setD2] = useState(4)
  const a = Math.min(n1, d1), b = Math.min(n2, d2)
  const L = (d1 * d2) / gcd(d1, d2)
  const sumN = a * (L / d1) + b * (L / d2), g = gcd(sumN, L)
  return (
    <Frame caption="A fraction is parts of a whole cut into equal pieces. To add fractions with different denominators, cut both wholes into pieces of the same size (the common denominator), then count the pieces. The third bar shows the total over the common denominator, and the readout shows it in lowest terms.">
      <svg viewBox={`0 0 ${W} 190`} className="wsvg" role="img" aria-label="Fraction bars for adding two fractions">
        <Bar n={a} d={d1} y={10} label={`${a}/${d1}`} />
        <Bar n={b} d={d2} y={55} label={`${b}/${d2}`} />
        <Bar n={a * (L / d1)} d={L} y={110} label={`${a * (L / d1)}/${L}`} />
        <Bar n={b * (L / d2)} d={L} y={150} label={`${b * (L / d2)}/${L}`} />
      </svg>
      <div className="widget-controls">
        <div className="two-col">
          <LinSlider label="First: parts taken" value={a} min={0} max={d1} onChange={setN1} fmt={(v) => String(v)} />
          <LinSlider label="First: parts in the whole" value={d1} min={2} max={12} onChange={(v) => { setD1(v); setN1(Math.min(n1, v)) }} fmt={(v) => String(v)} />
          <LinSlider label="Second: parts taken" value={b} min={0} max={d2} onChange={setN2} fmt={(v) => String(v)} />
          <LinSlider label="Second: parts in the whole" value={d2} min={2} max={12} onChange={(v) => { setD2(v); setN2(Math.min(n2, v)) }} fmt={(v) => String(v)} />
        </div>
        <Readouts items={[['Common denominator', String(L), 'the smallest number both denominators divide into'], ['Sum', `${sumN}/${L} = ${sumN / g}/${L / g}`, `≈ ${num(sumN / L, 4)}`], ['Which is bigger?', a / d1 > b / d2 ? `${a}/${d1}` : a / d1 < b / d2 ? `${b}/${d2}` : 'they are equal']]} />
      </div>
    </Frame>
  )
}

/* ------------------------------------------------------------------ ratios and scaling */

export function RatioLab() {
  const [a, setA] = useState(2)
  const [b, setB] = useState(3)
  const [k, setK] = useState(4)
  const g = gcd(a, b)
  return (
    <Frame caption="A ratio a : b compares two quantities. Multiplying both parts by the same number gives an equivalent ratio (a proportion), and the picture keeps the same shape: the two bars scale together. The unit rate b/a says how much of the second quantity goes with one of the first.">
      <svg viewBox={`0 0 ${W} 130`} className="wsvg" role="img" aria-label="Two bars in the ratio a to b, scaled by k">
        {[{ v: a, y: 15, label: 'A' }, { v: b, y: 70, label: 'B' }].map((r) => (
          <g key={r.label}>
            <text x={8} y={r.y + 22} className="w-t sm">{r.label}</text>
            {Array.from({ length: r.v * k }, (_, i) => <rect key={i} x={40 + i * Math.min(24, (W - 60) / (Math.max(a, b) * k))} y={r.y} width={Math.min(24, (W - 60) / (Math.max(a, b) * k)) - 2} height={34} className="w-area" stroke="var(--accent)" />)}
          </g>
        ))}
      </svg>
      <div className="widget-controls">
        <div className="two-col">
          <LinSlider label="a" value={a} min={1} max={9} onChange={setA} fmt={(v) => String(v)} />
          <LinSlider label="b" value={b} min={1} max={9} onChange={setB} fmt={(v) => String(v)} />
          <LinSlider label="Scale factor k" value={k} min={1} max={8} onChange={setK} fmt={(v) => `× ${v}`} />
        </div>
        <Readouts items={[['Ratio', `${a} : ${b}`, g > 1 ? `simplest form ${a / g} : ${b / g}` : 'already in simplest form'], ['Scaled ratio', `${a * k} : ${b * k}`, 'equivalent: same proportion'], ['Unit rate b/a', num(b / a, 4)], ['Cross-products', `${a} × ${b * k} = ${a * b * k} and ${b} × ${a * k} = ${a * b * k}`, 'equal in a true proportion']]} />
      </div>
    </Frame>
  )
}

/* ------------------------------------------------------------------ the area model for expanding brackets */

export function AreaModel() {
  const [k, setK] = useState(3)
  const [a, setA] = useState(2)
  const [b, setB] = useState(4)
  const [x, setX] = useState(3)
  const unit = 34
  const wx = a * x * unit, wb = b * unit, h = k * unit
  return (
    <Frame caption="Multiplying a bracket by a number is finding the area of a rectangle: the outside number is the height and the bracket is the width, split into its two terms. The total area is the sum of the two smaller rectangles, which is why k(ax + b) = kax + kb. Change the value of x to see that both ways of counting agree.">
      <svg viewBox={`0 0 ${W} 220`} className="wsvg" role="img" aria-label="An area model for k times the bracket ax plus b">
        <rect x={40} y={30} width={wx} height={h} className="w-area" stroke="var(--accent)" strokeWidth={2} />
        <rect x={40 + wx} y={30} width={wb} height={h} className="w-fill" stroke="var(--text-dim)" strokeWidth={2} />
        <text x={40 + wx / 2} y={22} textAnchor="middle" className="w-t sm">{a}x</text><text x={40 + wx + wb / 2} y={22} textAnchor="middle" className="w-t sm">{b}</text>
        <text x={26} y={30 + h / 2} textAnchor="end" className="w-t sm">{k}</text>
        <text x={40 + wx / 2} y={34 + h / 2} textAnchor="middle" className="w-t">{k * a}x</text><text x={40 + wx + wb / 2} y={34 + h / 2} textAnchor="middle" className="w-t">{k * b}</text>
      </svg>
      <div className="widget-controls">
        <div className="two-col">
          <LinSlider label="Outside number k" value={k} min={1} max={5} onChange={setK} fmt={(v) => String(v)} />
          <LinSlider label="a (the coefficient of x)" value={a} min={1} max={5} onChange={setA} fmt={(v) => String(v)} />
          <LinSlider label="b (the number)" value={b} min={1} max={6} onChange={setB} fmt={(v) => String(v)} />
          <LinSlider label="Value of x" value={x} min={1} max={6} onChange={setX} fmt={(v) => String(v)} />
        </div>
        <Readouts items={[['Expanded', `${k}(${a}x + ${b}) = ${k * a}x + ${k * b}`], ['Unexpanded value', String(k * (a * x + b)), `${k} × (${a * x} + ${b})`], ['Expanded value', String(k * a * x + k * b), `${k * a * x} + ${k * b}`]]} />
      </div>
    </Frame>
  )
}

/* ------------------------------------------------------------------ scientific notation */

export function SciNotation() {
  const [c, setC] = useState(4.5)
  const [e, setE] = useState(5)
  const val = c * 10 ** e
  const plain = Math.abs(e) <= 9 ? (e >= 0 ? val.toFixed(0) : val.toFixed(-e + 1)).replace(/(\.\d*?)0+$/, '$1').replace(/\.$/, '') : String(val)
  return (
    <Frame caption="Scientific notation writes a number as c × 10ⁿ with 1 ≤ c < 10. A positive exponent n moves the decimal point n places to the right (a big number) and a negative exponent moves it left (a small number). It makes huge and tiny numbers, such as the mass of the Sun or the size of an atom, easy to read and compare.">
      <div className="widget-controls">
        <div className="two-col">
          <LinSlider label="Coefficient c" value={c} min={1} max={9.9} step={0.1} onChange={setC} fmt={(v) => num(v, 1)} />
          <LinSlider label="Exponent n" value={e} min={-8} max={9} onChange={setE} fmt={(v) => String(v)} />
        </div>
        <Readouts items={[['Scientific notation', `${num(c, 1)} × 10^${num(e, 0)}`], ['Ordinary number', plain, e >= 0 ? `decimal point moved ${e} places right` : `decimal point moved ${-e} places left`], ['In words', Math.abs(e) >= 9 ? 'billions' : e >= 6 ? 'millions' : e >= 3 ? 'thousands' : e >= 0 ? 'ordinary size' : 'a small fraction']]} />
      </div>
    </Frame>
  )
}

/* ------------------------------------------------------------------ solving ax + b = c as a balance */

export function Balance() {
  const [a, setA] = useState(3)
  const [b, setB] = useState(4)
  const [x, setX] = useState(5)
  const c = a * x + b
  const step = (n: number) => (n === 0 ? `${a}x + ${b} = ${c}` : n === 1 ? `${a}x = ${c - b}` : `x = ${(c - b) / a}`)
  const [s, setS] = useState(0)
  const pan = (cx: number, label: string, items: string[]) => (
    <g>
      <rect x={cx - 120} y={110} width={240} height={14} rx={4} className="w-body" />
      {items.map((t, i) => <g key={i}><rect x={cx - 110 + i * 70} y={70} width={60} height={36} rx={5} className={t.includes('x') ? 'w-body alt' : 'w-body'} /><text x={cx - 80 + i * 70} y={94} textAnchor="middle" className="w-t sm">{t}</text></g>)}
      <text x={cx} y={146} textAnchor="middle" className="w-t sm">{label}</text>
    </g>
  )
  return (
    <Frame caption="An equation is a balance: both pans weigh the same. Whatever you do to one side you must do to the other so the scale stays level. To solve ax + b = c, first undo the addition by taking b from both sides, then undo the multiplication by dividing both sides by a. Step through the solution below.">
      <svg viewBox={`0 0 ${W} 170`} className="wsvg" role="img" aria-label="A balance scale for the equation">
        <line x1={W / 2} y1={30} x2={W / 2} y2={160} className="w-axis" />
        {pan(180, 'left side', s === 0 ? [`${a}x`, `+${b}`] : s === 1 ? [`${a}x`] : ['x'])}
        {pan(460, 'right side', s === 0 ? [String(c)] : s === 1 ? [String(c - b)] : [String((c - b) / a)])}
      </svg>
      <div className="widget-controls">
        <div className="two-col">
          <LinSlider label="a" value={a} min={2} max={9} onChange={(v) => { setA(v); setS(0) }} fmt={(v) => String(v)} />
          <LinSlider label="b" value={b} min={1} max={12} onChange={(v) => { setB(v); setS(0) }} fmt={(v) => String(v)} />
          <LinSlider label="Hidden value of x" value={x} min={1} max={12} onChange={(v) => { setX(v); setS(0) }} fmt={(v) => String(v)} />
        </div>
        <div className="seg" role="group" aria-label="Steps"><button type="button" onClick={() => setS(Math.min(2, s + 1))} disabled={s >= 2}>Next step</button><button type="button" onClick={() => setS(0)}>Start again</button></div>
        <Readouts items={[['Equation', step(s)], ['Operation', s === 0 ? 'ready to start' : s === 1 ? `subtract ${b} from both sides` : `divide both sides by ${a}`], ['Check', `${a}(${(c - b) / a}) + ${b} = ${c}`]]} />
      </div>
    </Frame>
  )
}

/* ------------------------------------------------------------------ two travellers closing a gap */

export function Meeting() {
  const [v1, setV1] = useState(60)
  const [v2, setV2] = useState(40)
  const [gap, setGap] = useState(300)
  const [t, setT] = useState(1)
  const meet = gap / (v1 + v2)
  const tt = Math.min(t, meet * 1.4)
  const p1 = Math.min(gap, v1 * tt), p2 = Math.max(0, gap - v2 * tt)
  const sx = (d: number) => 40 + (d / gap) * (W - 80)
  return (
    <Frame caption="Two travellers start at opposite ends of a road and walk towards each other. Together they close the gap at the sum of their speeds, so they meet after time gap ÷ (v₁ + v₂). The equation v₁t + v₂t = gap is a linear equation in t, and its solution is the moment the dots meet.">
      <svg viewBox={`0 0 ${W} 120`} className="wsvg" role="img" aria-label="Two travellers moving towards each other along a road">
        <line x1={40} x2={W - 40} y1={70} y2={70} className="w-axis" />
        <circle cx={sx(p1)} cy={70} r={9} className="w-dot" /><circle cx={sx(p2)} cy={70} r={9} className="w-joint" />
        <text x={sx(p1)} y={50} textAnchor="middle" className="w-t sm">A</text><text x={sx(p2)} y={50} textAnchor="middle" className="w-t sm">B</text>
        <text x={40} y={100} className="w-t sm">0 km</text><text x={W - 40} y={100} textAnchor="end" className="w-t sm">{gap} km</text>
      </svg>
      <div className="widget-controls">
        <div className="two-col">
          <LinSlider label="Speed of A (km/h)" value={v1} min={10} max={100} step={5} onChange={setV1} fmt={(v) => String(v)} />
          <LinSlider label="Speed of B (km/h)" value={v2} min={10} max={100} step={5} onChange={setV2} fmt={(v) => String(v)} />
          <LinSlider label="Distance apart (km)" value={gap} min={100} max={600} step={50} onChange={setGap} fmt={(v) => String(v)} />
          <LinSlider label="Time (hours)" value={t} min={0} max={6} step={0.05} onChange={setT} fmt={(v) => num(v, 2)} />
        </div>
        <Readouts items={[['Equation', `${v1}t + ${v2}t = ${gap}`], ['They meet after', `${num(meet, 3)} hours`, `${gap} ÷ ${v1 + v2}`], ['Distance between them now', `${num(Math.max(0, gap - (v1 + v2) * tt), 1)} km`]]} />
      </div>
    </Frame>
  )
}

/* ------------------------------------------------------------------ inequalities on a number line */

export function IneqLine() {
  const [a, setA] = useState(2)
  const [k, setK] = useState(3)
  const [op, setOp] = useState<'<' | '≤' | '>' | '≥'>('<')
  const lo = -10, hi = 10
  const sx = (v: number) => 20 + ((v - lo) / (hi - lo)) * (W - 40)
  const incl = op === '≤' || op === '≥'
  // k x op k a: dividing by k keeps the sign; show also the flipped case for -k
  const [neg, setNeg] = useState(false)
  const kk = neg ? -k : k
  const solOp = neg ? ({ '<': '>', '≤': '≥', '>': '<', '≥': '≤' } as const)[op] : op
  const sRight = solOp === '>' || solOp === '≥'
  return (
    <Frame caption="The solutions of an inequality fill a whole region of the number line. An open circle means the end point is not included (< or >) and a filled circle means it is included (≤ or ≥). The one new rule: when you multiply or divide both sides by a negative number, the inequality sign must flip, because negating reverses the order of the numbers.">
      <svg viewBox={`0 0 ${W} 110`} className="wsvg" role="img" aria-label="The solution of an inequality shaded on a number line">
        <line x1={20} x2={W - 20} y1={60} y2={60} className="w-axis" />
        {Array.from({ length: hi - lo + 1 }, (_, i) => lo + i).map((t) => <g key={t}><line x1={sx(t)} x2={sx(t)} y1={55} y2={65} className="w-axis" />{t % 2 === 0 && <text x={sx(t)} y={86} textAnchor="middle" className="w-t sm">{t < 0 ? `${MINUS}${-t}` : t}</text>}</g>)}
        <rect x={sRight ? sx(a) : 20} y={54} width={sRight ? W - 20 - sx(a) : sx(a) - 20} height={12} className="w-area" />
        <circle cx={sx(a)} cy={60} r={7} className={incl ? 'w-dot' : 'w-joint'} />
      </svg>
      <div className="widget-controls">
        <Seg label="Sign" value={op} options={[{ id: '<', label: '<' }, { id: '≤', label: '≤' }, { id: '>', label: '>' }, { id: '≥', label: '≥' }]} onChange={setOp} />
        <div className="two-col">
          <LinSlider label="Boundary a" value={a} min={-8} max={8} onChange={setA} fmt={(v) => num(v, 0)} />
          <LinSlider label="Multiplier k" value={k} min={1} max={5} onChange={setK} fmt={(v) => String(v)} />
        </div>
        <div className="seg" role="group" aria-label="Negative multiplier"><button type="button" className={!neg ? 'on' : ''} onClick={() => setNeg(false)}>positive k</button><button type="button" className={neg ? 'on' : ''} onClick={() => setNeg(true)}>negative k</button></div>
        <Readouts items={[['Inequality', `${kk === 1 ? '' : kk === -1 ? '−' : kk}x ${op} ${num(kk * a, 0)}`], ['Divide by ' + num(kk, 0), `x ${solOp} ${num(a, 0)}`, neg ? 'the sign flipped' : 'the sign stays'], ['Solution set', sRight ? `${incl ? '[' : '('}${num(a, 0)}, ∞)` : `(−∞, ${num(a, 0)}${incl ? ']' : ')'}`]]} />
      </div>
    </Frame>
  )
}
