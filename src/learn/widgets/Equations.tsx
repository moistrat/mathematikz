import { useState } from 'react'
import {
  degToRad, evalNumeric, Fn, FNS, fmtDeg, fmtPi, fmtSurd, INV_RANGE, InvFn, invLabel, inverseExact, norm360, solveSpecial,
  specialValues, Surd, surdValue,
} from '../../math/exact'
import { formA, U } from '../../math/questions'
import { Frame, Readouts, Seg } from './shared'

const FN_DEFAULT: Record<Fn, string> = { cos: '√3/2', sin: '1/2', tan: '1' }
const findValue = (fn: Fn, key: string): Surd => specialValues(fn).find((v) => fmtSurd(v) === key) ?? specialValues(fn)[0]

/* ------------------------------------------------------------------ graph view of solving f(x) = k */

export function GraphSolve() {
  const [fn, setFn] = useState<Fn>('cos')
  const [key, setKey] = useState(FN_DEFAULT.cos)
  const [u, setU] = useState<U>('rad')
  const vals = specialValues(fn)
  const v = findValue(fn, key)
  const k = surdValue(v)
  const sols = solveSpecial(fn, v)
  const label = (d: number) => (u === 'rad' ? fmtPi(d) : fmtDeg(d))

  const Wd = 640, Ht = 310, X0 = 92, X1 = 612, YC = 150
  const sx = (d: number) => X0 + (d / 360) * (X1 - X0)
  const ky = fn === 'tan' ? 34 : 78
  const sy = (y: number) => YC - y * ky
  const limit = (YC - 6) / ky
  let path = ''
  let pen = false
  for (let i = 0; i <= 720; i++) {
    const d = i / 2, y = evalNumeric(fn, d)
    if (!isFinite(y) || Math.abs(y) > limit) { pen = false; continue }
    path += `${pen ? 'L' : 'M'}${sx(d).toFixed(1)},${sy(y).toFixed(1)} `
    pen = true
  }
  const ticks = [0, 90, 180, 270, 360]
  const asympt = fn === 'tan' ? [90, 270] : []
  const eq = `${formA(fn, v)} = 0`

  return (
    <Frame caption="Each place the horizontal line y = k meets the curve between 0 and 2π is a solution. Change the function or the value of k and watch the crossings.">
      <svg viewBox={`0 0 ${Wd} ${Ht}`} className="wsvg" role="img" aria-label={`Graph of ${fn} x with the line y = ${fmtSurd(v)}`}>
        {[-1, 1].map((g) => <line key={g} x1={X0} x2={X1} y1={sy(g)} y2={sy(g)} className="w-grid" />)}
        <line x1={X0} x2={X1} y1={YC} y2={YC} className="w-axis" />
        <line x1={X0} x2={X0} y1={8} y2={YC + 8 + (Ht - YC - 40)} className="w-axis" />
        {asympt.map((d) => <line key={d} x1={sx(d)} x2={sx(d)} y1={8} y2={Ht - 44} className="w-ref" />)}
        {ticks.map((d) => <text key={d} x={sx(d)} y={YC + 16} textAnchor="middle" className="w-t sm">{d === 0 ? '' : label(d)}</text>)}
        {Math.abs(k) !== 1 && <text x={X0 - 8} y={sy(1) + 4} textAnchor="end" className="w-t sm">1</text>}
        {Math.abs(k) !== 1 && <text x={X0 - 8} y={sy(-1) + 4} textAnchor="end" className="w-t sm">{'−1'}</text>}
        <path d={path} className="w-curve" />
        <line x1={X0} x2={X1} y1={sy(k)} y2={sy(k)} className="w-line-k" />
        <text x={X0 - 8} y={sy(k) + 4} textAnchor="end" className="w-t sm accent">y = {fmtSurd(v)}</text>
        {sols.map((d) => (
          <g key={d}>
            <line x1={sx(d)} x2={sx(d)} y1={sy(k)} y2={Ht - 40} className="w-ref" />
            <circle cx={sx(d)} cy={sy(k)} r={6} className="w-dot" />
            <text x={sx(d)} y={Ht - 22} textAnchor="middle" className="w-t accent">{label(d)}</text>
          </g>
        ))}
        <text x={X0} y={Ht - 4} className="w-t sm">solutions of {fn}(x) = {fmtSurd(v)} in [0, {u === 'rad' ? '2π' : '360°'}]</text>
      </svg>
      <div className="widget-controls">
        <div className="two-col">
          <Seg label="Function" value={fn} options={FNS.map((f) => ({ id: f, label: f }))} onChange={(f) => { setFn(f); setKey(FN_DEFAULT[f]) }} />
          <Seg label="Units" value={u} options={[{ id: 'rad', label: 'radians' }, { id: 'deg', label: 'degrees' }]} onChange={setU} />
        </div>
        <label className="field">Value of k in {fn}(x) = k
          <select value={fmtSurd(v)} onChange={(e) => setKey(e.target.value)}>
            {vals.map((x) => <option key={fmtSurd(x)} value={fmtSurd(x)}>{fmtSurd(x)}</option>)}
          </select>
        </label>
        <Readouts items={[
          ['One way to write it', eq, `which rearranges to ${fn}(x) = ${fmtSurd(v)}`],
          ['Solutions', sols.map(label).join(',  '), `${sols.length} solution${sols.length === 1 ? '' : 's'} in the closed interval`],
        ]} />
      </div>
    </Frame>
  )
}

/* ------------------------------------------------------------------ inverse functions and principal values */

const INVS: InvFn[] = ['arcsin', 'arccos', 'arctan']
const FN_OF: Record<InvFn, Fn> = { arcsin: 'sin', arccos: 'cos', arctan: 'tan' }
const INV_DEFAULT: Record<InvFn, string> = { arcsin: '1/2', arccos: '−1/2', arctan: '−1' }

export function Inverse() {
  const [inv, setInv] = useState<InvFn>('arcsin')
  const [key, setKey] = useState(INV_DEFAULT.arcsin)
  const [u, setU] = useState<U>('rad')
  const fn = FN_OF[inv], R = INV_RANGE[inv]
  const v = findValue(fn, key)
  const ans = inverseExact(inv, v)!
  const label = (d: number) => (u === 'rad' ? fmtPi(d) : fmtDeg(d))
  const others = [...new Set(solveSpecial(fn, v).map(norm360))].filter((d) => d !== norm360(ans))

  const cx = 180, cy = 150, r = 104
  const P = (deg: number, rr = r) => ({ x: cx + rr * Math.cos(degToRad(deg)), y: cy - rr * Math.sin(degToRad(deg)) })
  const a = P(ans), lo = P(R.lo, r + 10), hi = P(R.hi, r + 10)
  const k = surdValue(v)
  const inView = Math.abs(k) * r <= 140

  return (
    <Frame caption="The shaded half of the circle is the range each inverse function is allowed to answer from. Other angles with the same value exist, but they lie outside it.">
      <div className="lab-main">
        <div className="lab-canvas">
          <svg viewBox="0 0 360 300" className="wsvg" role="img" aria-label={`${invLabel(inv)} of ${fmtSurd(v)}`}>
            <line x1={10} x2={350} y1={cy} y2={cy} className="w-axis" />
            <line x1={cx} x2={cx} y1={10} y2={290} className="w-axis" />
            <circle cx={cx} cy={cy} r={r} className="w-circle" />
            <path d={`M ${lo.x} ${lo.y} A ${r + 10} ${r + 10} 0 0 0 ${hi.x} ${hi.y}`} className="w-range" />
            {R.open && [lo, hi].map((p, i) => <circle key={i} cx={p.x} cy={p.y} r={5} className="w-open" />)}
            {inv === 'arcsin' && <line x1={cx - r - 6} x2={cx + r + 6} y1={cy - r * k} y2={cy - r * k} className="w-line-k" />}
            {inv === 'arccos' && <line x1={cx + r * k} x2={cx + r * k} y1={cy - r - 6} y2={cy + r + 6} className="w-line-k" />}
            {inv === 'arctan' && inView && (
              <>
                <line x1={cx + r} x2={cx + r} y1={cy - 140} y2={cy + 140} className="w-grid" />
                <line x1={cx - r * 1.2} y1={cy + r * 1.2 * k} x2={cx + r} y2={cy - r * k} className="w-line-k" />
              </>
            )}
            {others.map((d) => { const p = P(d); return <g key={d}><circle cx={p.x} cy={p.y} r={6} className="w-ghost" /><text x={p.x + (p.x >= cx ? 11 : -11)} y={p.y + (p.y <= cy ? -8 : 15)} textAnchor={p.x >= cx ? 'start' : 'end'} className="w-t sm">{label(d)}</text></g> })}
            <line x1={cx} y1={cy} x2={a.x} y2={a.y} className="w-radius" />
            <circle cx={a.x} cy={a.y} r={8} className="w-pt" />
            <text x={a.x + (a.x >= cx ? 12 : -12)} y={a.y + (a.y <= cy ? -10 : 18)} textAnchor={a.x >= cx ? 'start' : 'end'} className="w-t accent">{label(ans)}</text>
          </svg>
        </div>
        <div className="lab-controls">
          <Seg label="Function" value={inv} options={INVS.map((f) => ({ id: f, label: invLabel(f) }))} onChange={(f) => { setInv(f); setKey(INV_DEFAULT[f]) }} />
          <Seg label="Units" value={u} options={[{ id: 'rad', label: 'radians' }, { id: 'deg', label: 'degrees' }]} onChange={setU} />
          <label className="field">Input value
            <select value={fmtSurd(v)} onChange={(e) => setKey(e.target.value)}>
              {specialValues(fn).map((x) => <option key={fmtSurd(x)} value={fmtSurd(x)}>{fmtSurd(x)}</option>)}
            </select>
          </label>
          <Readouts items={[
            [`${invLabel(inv)}(${fmtSurd(v)})`, label(ans), u === 'rad' ? fmtDeg(ans) : `${fmtPi(ans)} radians`],
            ['Allowed range', u === 'rad' ? R.text : R.textDeg],
            [`Other angles with ${fn} = ${fmtSurd(v)}`, others.length ? others.map(label).join(', ') : 'none in one turn', others.length ? 'outside the range, so not returned' : undefined],
          ]} />
        </div>
      </div>
    </Frame>
  )
}

