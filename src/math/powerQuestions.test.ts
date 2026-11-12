import { describe, expect, it } from 'vitest'
import { evaluate } from './parse'
import { POW_GENS } from './powerQuestions'
import { checkAnswer, generateQuestion, GENERATORS, Question } from './questions'
import { mulberry } from './rng'

const LESSON_IDS = ['exponent-laws', 'radicals', 'logarithms']
const SEEDS = 150

function make(gen: number, seed: number): Question {
  const g = GENERATORS[gen]
  return { ...g.make(mulberry(seed)), id: `${gen}-${seed}`, lesson: g.lesson, level: g.level, gen }
}
const idx = GENERATORS.map((g, i) => ({ g, i })).filter((x) => POW_GENS.includes(x.g)).map((x) => x.i)

describe('unit 4 generators', () => {
  it('cover every lesson at all three levels', () => {
    for (const l of LESSON_IDS) for (const lv of [1, 2, 3]) expect(POW_GENS.filter((g) => g.lesson === l && g.level === lv).length, `${l} L${lv}`).toBeGreaterThanOrEqual(2)
    expect(POW_GENS.length).toBeGreaterThanOrEqual(24)
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
      expect(/NaN|Infinity|\[object|√0\b|\b1x\b|\+ −|− −|−−|\+ \+|\(\s*\)|, ,|\*\*/.test([q.prompt, q.display, ...q.explanation].join(' | ')), `${tag}: junk in text: ${q.display} | ${q.explanation.join(' | ')}`).toBe(false)
    }
  }, 120000)

  it('answers agree with the equation as written (independent check)', () => {
    let checked = 0
    for (const gi of idx) for (let s = 1; s <= SEEDS; s++) {
      const q = make(gi, s * 104729 + gi)
      if (!q.holds) continue
      const tag = `gen ${gi} seed ${s}: ${q.prompt}`
      checked++
      if (q.kind === 'approx') { expect(q.holds(q.answers[0] as number), `${tag}: ${q.answers[0]} does not satisfy it`).toBe(true); continue }
      const grid: number[] = []
      for (let x = -40; x <= 40; x += 0.125) grid.push(x)
      for (let n = -40; n <= 40; n++) for (const d of [3, 5, 6, 7]) grid.push(n / d)
      for (const a of q.answers as number[]) expect(q.holds(a), `${tag}: ${a} does not satisfy it`).toBe(true)
      for (const x of grid) if (q.holds(x)) expect((q.answers as number[]).some((a) => Math.abs(a - x) < 1e-6), `${tag}: ${x} also solves it but is not an answer`).toBe(true)
    }
    expect(checked).toBeGreaterThan(1000)
  }, 120000)

  it('radical answers are in simplest form: unsimplified equivalents are rejected', () => {
    let simplest = 0, rejected = 0
    for (const gi of idx) for (let s = 1; s <= SEEDS; s++) {
      const q = make(gi, s * 31 + gi)
      if (!q.simplest) continue
      simplest++
      for (const bad of q.rejects ?? []) {
        // the rejected form must really be equal in value, so it is the form that is wrong
        expect(Math.abs(evaluate(bad) - (q.answers[0] as number)), `${q.prompt}: "${bad}" is not equal to the answer`).toBeLessThan(1e-9)
        expect(checkAnswer(q, bad).ok, `${q.prompt}: accepted unsimplified "${bad}"`).toBe(false)
        rejected++
      }
    }
    expect(simplest).toBeGreaterThan(300)
    expect(rejected).toBeGreaterThan(200)
  })

  it('negative exponents are not accepted where positive ones are asked for', () => {
    let n = 0
    for (const gi of idx) for (let s = 1; s <= 80; s++) {
      const q = make(gi, s * 53 + gi)
      if (!q.alg?.positiveOnly || !/\^\(-/.test(q.alg.source)) continue
      n++
      expect(checkAnswer(q, q.alg.source).ok, `${q.prompt}: accepted the source with negative exponents`).toBe(false)
    }
    expect(n).toBeGreaterThan(20)
  })

  it('wrong answers are rejected', () => {
    for (const gi of idx) for (let s = 1; s <= 30; s++) {
      const q = make(gi, s * 13 + gi)
      const bads = q.alg ? ['0', '1', 'x', '7', 'x^2', 'x^(-1)'] : q.kind === 'approx' ? ['999', '0.123', '-777', '7', '1'] : q.kind === 'value' ? ['999', '0.123', '-777', '7/3', '1'] : ['999', '0.123', '-777, 888', 'no solution', '1, 2, 3, 4']
      for (const bad of bads) {
        if (bad === q.input) continue
        const res = checkAnswer(q, bad)
        if (res.ok) {
          if (q.alg) expect.fail(`${q.prompt} accepted "${bad}" (answer ${q.display})`)
          else if (q.kind === 'set' && q.answers.length === 0) expect(bad).toBe('no solution')
          else expect(Math.abs(evaluate(bad) - (q.answers[0] as number)) <= q.tol, `${q.prompt} accepted "${bad}" (answer ${q.display})`).toBe(true)
        }
      }
    }
  })

  it('a decimal is refused where an exact answer is wanted, and logs can be typed', () => {
    let exact = 0
    for (const gi of idx) for (let s = 1; s <= 100 && exact < 60; s++) {
      const q = make(gi, s * 17 + gi)
      if (q.kind === 'value' && q.needsExact && !Number.isInteger(q.answers[0] as number)) {
        exact++
        expect(checkAnswer(q, (q.answers[0] as number).toFixed(4)).ok, q.prompt).toBe(false)
      }
      if (q.kind === 'approx') {
        // the exact expression a student would type from the working is accepted
        expect(checkAnswer(q, `${q.answers[0]}`).ok, q.prompt).toBe(true)
      }
    }
    expect(exact).toBeGreaterThan(20)
    const approx = POW_GENS.findIndex((g) => g.lesson === 'logarithms' && g.level === 2)
    expect(approx).toBeGreaterThanOrEqual(0)
    const q = (() => { for (let s = 1; s < 200; s++) { const x = make(GENERATORS.indexOf(POW_GENS[approx + 2]), s); if (x.kind === 'approx' && /^Solve \d+\^x = \d+/.test(x.prompt)) return x } return null })()
    if (q) {
      const m = /^Solve (\d+)\^x = (\d+)/.exec(q.prompt)!
      expect(checkAnswer(q, `ln(${m[2]})/ln(${m[1]})`).ok).toBe(true)
      expect(checkAnswer(q, `log(${m[2]})/log(${m[1]})`).ok).toBe(true)
    }
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

  it('every generator offers real variety', () => {
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
      expect(prompts.size, l).toBeGreaterThanOrEqual(60)
    }
  })
})
