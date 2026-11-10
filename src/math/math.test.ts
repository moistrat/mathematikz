import { describe, expect, it } from 'vitest'
import {
  cosExact, degToRad, evalExact, evalNumeric, FNS, fmtPi, fmtSurd, INV_RANGE, InvFn, inverseExact, MINUS, piFraction,
  referenceAngle, sinExact, solveSpecial, SPECIAL_DEGREES, specialValues, surd, surdValue, tanExact,
} from './exact'
import { evaluate, parseList, saysUndefined } from './parse'
import { checkAnswer, generateQuestion, GENERATORS, generatorsForLesson } from './questions'

describe('exact values', () => {
  it('match floating point at every special angle, including negative and large angles', () => {
    const angles = [...SPECIAL_DEGREES.flatMap((d) => [d, d - 360, d + 360, d + 720])]
    for (const d of angles) {
      expect(surdValue(sinExact(d))).toBeCloseTo(Math.sin(degToRad(d)), 12)
      expect(surdValue(cosExact(d))).toBeCloseTo(Math.cos(degToRad(d)), 12)
      const t = tanExact(d)
      if (Math.abs(Math.cos(degToRad(d))) < 1e-9) expect(t, `tan ${d}`).toBeNull()
      else expect(surdValue(t!)).toBeCloseTo(Math.tan(degToRad(d)), 10)
    }
  })
  it('formats surds and angles', () => {
    expect(fmtSurd(surd(1, 2, 3))).toBe('√3/2')
    expect(fmtSurd(surd(-1, 2))).toBe(`${MINUS}1/2`)
    expect(fmtSurd(surd(1, 3, 3))).toBe('√3/3')
    expect(fmtSurd(surd(2, 1, 2))).toBe('2√2')
    expect(fmtSurd(surd(1, 1, 8))).toBe('2√2')
    expect(fmtPi(150)).toBe('5π/6')
    expect(fmtPi(-60)).toBe(`${MINUS}π/3`)
    expect(fmtPi(360)).toBe('2π')
    expect(fmtPi(0)).toBe('0')
    expect(fmtPi(480)).toBe('8π/3')
    expect(piFraction(105)).toEqual({ n: 7, d: 12 })
  })
  it('reference angles', () => {
    expect([150, 210, 330, 45, 225].map(referenceAngle)).toEqual([30, 30, 30, 45, 45])
  })
  it('solves cos x = √3/2 on [0, 2π]', () => {
    expect(solveSpecial('cos', surd(1, 2, 3))).toEqual([30, 330])
    expect(solveSpecial('sin', surd(0))).toEqual([0, 180, 360])
    expect(solveSpecial('tan', surd(-1))).toEqual([135, 315])
    expect(solveSpecial('sin', surd(1))).toEqual([90])
  })
  it('every special value has at least one solution and the solutions are real', () => {
    for (const fn of FNS) for (const v of specialValues(fn)) {
      const sols = solveSpecial(fn, v)
      expect(sols.length).toBeGreaterThan(0)
      for (const d of sols) expect(evalNumeric(fn, d)).toBeCloseTo(surdValue(v), 10)
    }
  })
  it('inverse trig returns principal values', () => {
    const cases: [InvFn, number, number, number, number][] = [
      ['arcsin', 1, 2, 1, 30], ['arcsin', -1, 2, 1, -30], ['arccos', -1, 2, 1, 120], ['arccos', 1, 2, 2, 45],
    ]
    for (const [inv, p, q, r, deg] of cases) expect(inverseExact(inv, surd(p, q, r))).toBe(deg)
    expect(inverseExact('arctan', surd(-1, 1, 3))).toBe(-60)
    expect(inverseExact('arctan', surd(1))).toBe(45)
    for (const inv of ['arcsin', 'arccos', 'arctan'] as InvFn[]) {
      const R = INV_RANGE[inv]
      for (const v of specialValues(R.fn)) {
        const a = inverseExact(inv, v)!
        expect(a).not.toBeNull()
        expect(a >= R.lo && a <= R.hi).toBe(true)
        expect(evalNumeric(R.fn, a)).toBeCloseTo(surdValue(v), 10)
      }
    }
    expect(evalExact('tan', 90)).toBeNull()
  })
})

describe('answer parser', () => {
  const near = (s: string, v: number) => expect(evaluate(s)).toBeCloseTo(v, 12)
  it('reads the usual ways of typing exact values', () => {
    near('√3/2', Math.sqrt(3) / 2)
    near('sqrt(3)/2', Math.sqrt(3) / 2)
    near('sqrt3/2', Math.sqrt(3) / 2)
    near('-1/2', -0.5)
    near(`${MINUS}1/2`, -0.5)
    near('1/√2', Math.SQRT1_2)
    near('5π/6', (5 * Math.PI) / 6)
    near('5pi/6', (5 * Math.PI) / 6)
    near('(5/6)pi', (5 * Math.PI) / 6)
    near('2√3/3', (2 * Math.sqrt(3)) / 3)
    near('150°', 150)
    near('-pi/4', -Math.PI / 4)
    near('3*sqrt(2)/2', (3 * Math.sqrt(2)) / 2)
  })
  it('rejects nonsense', () => {
    for (const bad of ['', 'abc', '1/', '((1)', 'sqrt(-1)', '1 2 +']) expect(() => evaluate(bad)).toThrow()
  })
  it('lists and undefined', () => {
    expect(parseList('pi/6, 11pi/6')).toHaveLength(2)
    expect(parseList('x = 30, 330')).toEqual([30, 330])
    expect(parseList('(1/2, √3/2)')).toHaveLength(2)
    expect(saysUndefined('Undefined')).toBe(true)
    expect(saysUndefined('DNE')).toBe(true)
  })
})

describe('question generators', () => {
  it('has several generators for every lesson and level 1-3 coverage per lesson', () => {
    for (const l of ['angles', 'unit-circle', 'exact-values', 'trig-equations', 'inverse-trig']) {
      expect(generatorsForLesson(l).length, l).toBeGreaterThanOrEqual(4)
      for (const lv of [1, 2, 3]) expect(GENERATORS.some((g) => g.lesson === l && g.level === lv), `${l} L${lv}`).toBe(true)
    }
  })
  it('every question is sane, its own answer checks out, and a wrong answer does not', () => {
    for (const lesson of ['angles', 'unit-circle', 'exact-values', 'trig-equations', 'inverse-trig']) {
      for (const lv of [1, 2, 3]) {
        for (let s = 1; s <= 120; s++) {
          const q = generateQuestion([lesson], lv, s * 7919 + lv)
          const where = `${lesson} L${lv} seed ${s}: ${q.prompt}`
          expect(q.prompt + q.explanation.join(' ') + q.display, where).not.toMatch(/NaN|Infinity|\[object|null/)
          if (q.answers[0] !== null) expect(q.display, where).not.toMatch(/undefined/)
          expect(q.explanation.length, where).toBeGreaterThan(0)
          expect(q.answers.length, where).toBeGreaterThan(0)
          expect(checkAnswer(q, q.input).ok, `${where}\n  input: ${q.input}`).toBe(true)
          expect(checkAnswer(q, q.display.replace(/ (cm|rad)$/, '')).ok, `${where}\n  display: ${q.display}`).toBe(true)
          expect(checkAnswer(q, '12345').ok, where).toBe(false)
          expect(checkAnswer(q, 'sqrt(7)/9').ok, where).toBe(false)
        }
      }
    }
  })
  it('known answers', () => {
    let eq = false
    for (let s = 1; s < 2000 && !eq; s++) {
      const q = generateQuestion(['trig-equations'], 1, s)
      if (q.prompt.includes('2cos(x) − √3 = 0') && q.prompt.includes('2π')) {
        expect(q.display).toBe('π/6, 11π/6')
        expect(checkAnswer(q, 'pi/6, 11pi/6').ok).toBe(true)
        expect(checkAnswer(q, '11π/6, π/6').ok).toBe(true)
        expect(checkAnswer(q, 'pi/6').ok).toBe(false)
        expect(checkAnswer(q, 'pi/6').note).toMatch(/more solutions/)
        expect(checkAnswer(q, '0.5236, 5.7596').invalid).toBe(true)
        eq = true
      }
    }
    expect(eq).toBe(true)
  })
  it('tan(π/2) style questions expect "undefined"', () => {
    let seen = false
    for (let s = 1; s < 3000 && !seen; s++) {
      const q = generateQuestion(['exact-values'], 1, s)
      if (q.answers[0] === null) {
        expect(checkAnswer(q, 'undefined').ok).toBe(true)
        expect(checkAnswer(q, '0').ok).toBe(false)
        seen = true
      }
    }
    expect(seen).toBe(true)
  })
  it('does not accept a decimal for an exact answer', () => {
    for (let s = 1; s < 500; s++) {
      const q = generateQuestion(['exact-values'], 1, s)
      if (q.answers[0] !== null && q.needsExact) {
        const c = checkAnswer(q, String(q.answers[0]))
        expect(c.ok).toBe(false)
        expect(c.invalid).toBe(true)
        return
      }
    }
  })
})
