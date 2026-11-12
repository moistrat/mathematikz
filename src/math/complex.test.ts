import { describe, expect, it } from 'vitest'
import { cAbs2, cAdd, cConj, cDiv, cEq, cMul, cPow, cSub, cx, cxInput, fmtCx, parseCx, splitList } from './complex'

describe('complex arithmetic', () => {
  it('adds, multiplies and divides exactly', () => {
    const a = cx(3, 4), b = cx(1, -2)
    expect(fmtCx(cAdd(a, b))).toBe('4 + 2i')
    expect(fmtCx(cSub(a, b))).toBe('2 + 6i')
    expect(fmtCx(cMul(a, b))).toBe('11 − 2i')
    expect(fmtCx(cDiv(a, b))).toBe('−1 + 2i')
    expect(fmtCx(cConj(a))).toBe('3 − 4i')
    expect(cAbs2(a).n).toBe(25)
    expect(fmtCx(cPow(cx(1, 1), 8))).toBe('16')
    expect(fmtCx(cPow(cx(0, 1), 3))).toBe('−i')
    expect(fmtCx(cDiv(cx(1), cx(0, 2)))).toBe('−i/2')
    expect(fmtCx(cx(1, 0))).toBe('1')
    expect(fmtCx(cx(0, -3))).toBe('−3i')
    expect(fmtCx(cx(fmtFr(1, 2), fmtFr(3, 2)))).toBe('1/2 + 3i/2')
    expect(fmtCx(cPow(cx(2, 1), -1))).toBe('2/5 − i/5')
  })
})
function fmtFr(n: number, d: number) { return { n, d } }

describe('reading typed complex numbers', () => {
  const val = (s: string) => parseCx(s).z
  it('understands many spellings of the same number', () => {
    const want = cx(3, 4)
    for (const t of ['3+4i', '3 + 4i', '4i+3', '3+4*i', 'z = 3 + 4i', '(6+8i)/2', '3 + 4 i', '3+4j']) expect(cEq(val(t), want), t).toBe(true)
    expect(cEq(val('i'), cx(0, 1))).toBe(true)
    expect(cEq(val('-2i'), cx(0, -2))).toBe(true)
    expect(cEq(val('i^2'), cx(-1))).toBe(true)
    expect(cEq(val('i^3'), cx(0, -1))).toBe(true)
    expect(cEq(val('(1+i)(1-i)'), cx(2))).toBe(true)
    expect(cEq(val('(1+i)/(1-i)'), cx(0, 1))).toBe(true)
    expect(cEq(val('1/2 + 3i/2'), cx({ n: 1, d: 2 }, { n: 3, d: 2 }))).toBe(true)
    expect(cEq(val('(3/2)i'), cx(0, { n: 3, d: 2 }))).toBe(true)
  })
  it('knows what is in the form a + bi', () => {
    for (const ok of ['3+4i', '-2i', '5', 'i', '(6+8i)/2', '(3/2)i', '1/2+3i/2', '3 + 4 i']) expect(parseCx(ok).simple, ok).toBe(true)
    for (const bad of ['(1+i)(1-i)', 'i^2', '(1+i)/(1-i)', '2/(1-i)', '3(1+2i)', 'i*i', '(2+i)^2']) expect(parseCx(bad).simple, bad).toBe(false)
  })
  it('rejects anything that is not a complex number', () => {
    for (const bad of ['x+1', 'sqrt(2)i', '3 +', '']) expect(() => parseCx(bad), bad).toThrow()
    expect(cxInput(cx(-1, 2))).toBe('-1 + 2i')
  })
  it('splits lists at top-level commas', () => {
    expect(splitList('1+i, 1-i, -1+i')).toEqual(['1+i', '1-i', '-1+i'])
    expect(splitList('(1, 2) and 3')).toEqual(['(1, 2)', '3'])
  })
})
