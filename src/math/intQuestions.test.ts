import { describe, expect, it } from 'vitest'
import { parseRat, rEq } from './algebra'
import { INT_GENS } from './intQuestions'
import { isDerivative, sameFormula } from './calculus'
import { evaluate } from './parse'
import { checkAnswer, generateQuestion, GENERATORS, Question } from './questions'
import { mulberry } from './rng'
import { normalise, parseSet } from './solve'

const LESSON_IDS = ['antiderivatives', 'definite-integrals', 'integration-substitution', 'integration-techniques', 'integral-applications']
const SEEDS = 150

function make(gen: number, seed: number): Question {
  const g = GENERATORS[gen]
  return { ...g.make(mulberry(seed)), id: `${gen}-${seed}`, lesson: g.lesson, level: g.level, gen }
}
const idx = GENERATORS.map((g, i) => ({ g, i })).filter((x) => INT_GENS.includes(x.g)).map((x) => x.i)

describe('unit 10 generators', () => {
  it('cover every lesson at all three levels', () => {
    for (const l of LESSON_IDS) for (const lv of [1, 2, 3]) expect(INT_GENS.filter((g) => g.lesson === l && g.level === lv).length, `${l} L${lv}`).toBeGreaterThanOrEqual(2 - (l === 'functions' && lv === 1 ? 0 : 0))
    expect(INT_GENS.length).toBeGreaterThanOrEqual(1)
  })

  it('every question accepts its own answer and is well formed', () => {
    for (const gi of idx) for (let s = 1; s <= SEEDS; s++) {
      const q = make(gi, s * 7919 + gi)
      const tag = `gen ${gi} (${q.lesson} L${q.level}) seed ${s}: ${q.prompt}`
      const res = checkAnswer(q, q.input)
      expect(res.ok, `${tag} -> input "${q.input}" ${res.note ?? ''}`).toBe(true)
      expect(/undefined/.test(q.prompt + q.display + q.input), tag).toBe(false)
      expect(q.explanation.length, tag).toBeGreaterThanOrEqual(1)
      expect(q.hint.length, tag).toBeGreaterThan(10)
      expect(/NaN|Infinity|\[object|√0\b|\b1x\b|\+ −|− −|−−|\+ \+|\(\s*\)|, ,|\*\*|\+ 0\b/.test([q.prompt, q.display, ...q.explanation].join(' | ')), `${tag}: junk in text: ${q.display} | ${q.explanation.join(' | ')}`).toBe(false)
    }
  }, 120000)

  it('wrong answers are rejected', () => {
    for (const gi of idx) for (let s = 1; s <= 30; s++) {
      const q = make(gi, s * 13 + gi)
      const bads = q.calc ? ['0', '1', 'x', '7', 'x^2+1', 'banana'] : q.kind === 'complex' ? ['0', '1', 'i', '2 + 3i', '-5i', 'banana'] : q.kind === 'word' ? ['banana', 'maybe', 'both'] : q.alg ? ['0', '1', 'x', '7', 'x^2+1'] : q.kind === 'ineq' ? ['x > 1000', 'x < -1000', 'no solution', '7 < x < 8'] : q.kind === 'pair' ? ['(999, 999)', '(0, 0)', '999'] : q.kind === 'set' ? ['999', '0.123', '-777, 888', '1, 2, 3, 4'] : ['999', '0.123', '-777', '7/3']
      for (const bad of bads) {
        if (bad === q.input) continue
        const res = checkAnswer(q, bad)
        if (!res.ok) continue
        if (q.calc) expect(sameFormula(bad, q.calc.answer, q.calc.pos, q.calc.dom), `${q.prompt} accepted "${bad}"`).toBe(true)
        else if (q.alg) expect(rEq(parseRat(bad), parseRat(q.alg.answer)), `${q.prompt} accepted "${bad}"`).toBe(true)
        else if (q.kind === 'ineq') expect(normalise(parseSet(bad)).length >= 0 && q.iv !== undefined, `${q.prompt} accepted "${bad}"`).toBe(false)
        else if (q.kind === 'value') expect(q.answers[0] !== null && Math.abs(evaluate(bad) - (q.answers[0] as number)) <= q.tol, `${q.prompt} accepted "${bad}" (answer ${q.display})`).toBe(true)
        else expect.fail(`${q.prompt} accepted "${bad}" (answer ${q.display})`)
      }
    }
  })

  it('every antiderivative really differentiates to its integrand, and + C is accepted', () => {
    let n = 0
    for (const gi of idx) for (let s = 1; s <= 60; s++) {
      const q = make(gi, s * 31 + gi)
      if (!q.calc?.plusC) continue
      n++
      expect(isDerivative(q.calc.answer, q.calc.source, 1, q.calc.pos, q.calc.dom), q.prompt).toBe(true)
      expect(checkAnswer(q, `${q.input} + C`).ok, q.prompt).toBe(true)
      expect(checkAnswer(q, `${q.input} + 7`).ok, q.prompt).toBe(true)
      expect(checkAnswer(q, q.calc.source).ok, `${q.prompt}: the integrand itself was accepted`).toBe(false)
    }
    expect(n).toBeGreaterThan(40)
  })

  it('free practice builds every lesson at every level', () => {
    for (const l of LESSON_IDS) for (const lv of [1, 2, 3]) for (let s = 1; s <= 40; s++) {
      const q = generateQuestion([l], lv, s * 13)
      expect(q.lesson).toBe(l)
      expect(q.level).toBe(lv)
      expect(checkAnswer(q, q.input).ok).toBe(true)
    }
  })

  it('generates quickly', () => {
    const t0 = performance.now()
    let n = 0
    for (const l of LESSON_IDS) for (const lv of [1, 2, 3]) for (let s = 1; s <= 30; s++) { generateQuestion([l], lv, s * 31); n++ }
    expect((performance.now() - t0) / n).toBeLessThan(15)
  })

  it('every generator offers real variety', { timeout: 120000 }, () => {
    for (const gi of idx) {
      const prompts = new Set<string>()
      for (let s = 1; s <= 200; s++) prompts.add(make(gi, s * 7 + gi).prompt)
      expect(prompts.size, `gen ${gi} (${GENERATORS[gi].lesson} L${GENERATORS[gi].level})`).toBeGreaterThanOrEqual(8)
    }
  })

  it('has variety across each lesson', () => {
    for (const l of LESSON_IDS) {
      const prompts = new Set<string>()
      for (let s = 1; s <= 200; s++) prompts.add(generateQuestion([l], (s % 3) + 1, s * 977).prompt)
      expect(prompts.size, l).toBeGreaterThanOrEqual(50)
    }
  })
})
