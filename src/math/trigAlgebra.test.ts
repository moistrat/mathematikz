import { describe, expect, it } from 'vitest'
import { evaluate } from './parse'
import { checkTrig, countFuncs, showTrig, trigEqual } from './trigAlgebra'

describe('evaluating trig expressions', () => {
  it('reads functions, powers and variables in several spellings', () => {
    const t = 0.7
    const v = (s: string) => evaluate(s, { x: t, theta: t })
    expect(v('sin(x)')).toBeCloseTo(Math.sin(t))
    expect(v('sin x')).toBeCloseTo(Math.sin(t))
    expect(v('sin(x)^2')).toBeCloseTo(Math.sin(t) ** 2)
    expect(v('sin^2(x)')).toBeCloseTo(Math.sin(t) ** 2)
    expect(v('sin²x')).toBeCloseTo(Math.sin(t) ** 2)
    expect(v('sin²θ + cos²θ')).toBeCloseTo(1)
    expect(v('2sin(x)cos(x)')).toBeCloseTo(Math.sin(2 * t))
    expect(v('sec(x)')).toBeCloseTo(1 / Math.cos(t))
    expect(v('csc(x) - sin(x)')).toBeCloseTo(1 / Math.sin(t) - Math.sin(t))
    expect(v('cot(x)')).toBeCloseTo(1 / Math.tan(t))
    expect(v('sin(x + pi/3)')).toBeCloseTo(Math.sin(t + Math.PI / 3))
    expect(v('cos^2(x) - sin^2(x)')).toBeCloseTo(Math.cos(2 * t))
    expect(v('sin(x)^2 + 3')).toBeCloseTo(Math.sin(t) ** 2 + 3)
    expect(() => evaluate('sin(y)')).toThrow()
  })
})

describe('checking identities', () => {
  const spec = (source: string, answer: string) => ({ source, answer })
  it('accepts any simplest equal form, in several spellings', () => {
    const s = spec('(1-cos(x)^2)/sin(x)', 'sin(x)')
    for (const ok of ['sin(x)', 'sin x', 'y = sin(x)', 'f(x) = sin x', 'SIN(X)']) expect(checkTrig(s, ok).ok, ok).toBe(true)
    expect(checkTrig(spec('sin(x)/cos(x)', 'tan(x)'), 'sin(x)*sec(x)').ok).toBe(false)
    expect(checkTrig(spec('sin(x)^2+cos(x)^2', '1'), '1').ok).toBe(true)
    expect(checkTrig(spec('sin(x)^2+cos(x)^2', '1'), '2/2').ok).toBe(true)
    expect(checkTrig(spec('1/(1-sin(x))+1/(1+sin(x))', '2sec(x)^2'), '2/cos(x)^2').ok).toBe(true)
    expect(checkTrig(spec('cos(x)^2-sin(x)^2', 'cos(2x)'), '2cos(x)^2-1').ok).toBe(true)
    expect(checkTrig({ ...spec('cos(x)^2-sin(x)^2', 'cos(2x)'), must: '\\(2\\*?x\\)' }, '2cos(x)^2-1').ok).toBe(false)
    expect(checkTrig({ ...spec('cos(x)^2-sin(x)^2', 'cos(2x)'), must: '\\(2\\*?x\\)' }, 'cos(2x)').ok).toBe(true)
    expect(checkTrig(spec('cos(x)^2-sin(x)^2', 'cos(2x)'), 'cos(2x)').ok).toBe(true)
    expect(checkTrig(spec('2sin(x)cos(x)', 'sin(2x)'), 'sin(2*x)').ok).toBe(true)
    expect(checkTrig(spec('2sin(x)cos(x)', 'sin(2x)'), 'sin 2x').ok).toBe(false)
  })
  it('rejects wrong answers, the question itself, and unsimplified forms', () => {
    const s = spec('(1-cos(x)^2)/sin(x)', 'sin(x)')
    expect(checkTrig(s, 'cos(x)').ok).toBe(false)
    expect(checkTrig(s, '(1-cos(x)^2)/sin(x)').ok).toBe(false)
    expect(checkTrig(s, '(1 - cos(x)^2) / sin(x)').note).toMatch(/question|simplif/)
    expect(checkTrig(s, 'sin(x)*cos(x)/cos(x)').ok).toBe(false)
    expect(checkTrig(s, 'banana').invalid).toBe(true)
    expect(checkTrig(s, '').invalid).toBe(true)
    expect(checkTrig(s, 'sin(x').invalid).toBe(true)
  })
  it('counts trig functions and typesets expressions', () => {
    expect(countFuncs('2sin(x)cos(x)')).toBe(2)
    expect(countFuncs('sec(x)^2')).toBe(1)
    expect(countFuncs('1')).toBe(0)
    expect(showTrig('(1-cos(x)^2)/sin(x)')).toBe('(1 − cos²x)/sin x')
    expect(showTrig('2sin(x)cos(x)')).toBe('2 sin x cos x')
    expect(showTrig('sin(x+pi/3)')).toBe('sin(x + π/3)')
    expect(trigEqual('tan(x)', 'sin(x)/cos(x)')).toBe(true)
    expect(trigEqual('tan(x)', 'sin(x)')).toBe(false)
  })
})
