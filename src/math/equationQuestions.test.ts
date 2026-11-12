import { describe, expect, it } from 'vitest'
import { EQ_GENS } from './equationQuestions'
import { checkAnswer, generateQuestion, GENERATORS, Question } from './questions'
import { inSet, normalise, parseSet, setsEqual } from './solve'
import { mulberry } from './rng'

const LESSON_IDS = ['linear-equations', 'quadratic-solving', 'quadratic-formula', 'inequalities', 'absolute-value', 'systems']
const SEEDS = 150

function make(gen: number, seed: number): Question {
  const g = GENERATORS[gen]
  return { ...g.make(mulberry(seed)), id: `${gen}-${seed}`, lesson: g.lesson, level: g.level, gen }
}
const eqIndexes = GENERATORS.map((g, i) => ({ g, i })).filter((x) => EQ_GENS.includes(x.g)).map((x) => x.i)

describe('unit 3 generators', () => {
  it('cover every lesson at all three levels', () => {
    for (const l of LESSON_IDS) for (const lv of [1, 2, 3]) expect(EQ_GENS.filter((g) => g.lesson === l && g.level === lv).length, `${l} L${lv}`).toBeGreaterThanOrEqual(2)
    expect(EQ_GENS.length).toBeGreaterThanOrEqual(36)
  })

  it('every question accepts its own answer and is well formed', () => {
    for (const gi of eqIndexes) for (let s = 1; s <= SEEDS; s++) {
      const q = make(gi, s * 7919 + gi)
      const tag = `gen ${gi} (${q.lesson} L${q.level}) seed ${s}: ${q.prompt}`
      const res = checkAnswer(q, q.input)
      expect(res.ok, `${tag} -> input "${q.input}" ${res.note ?? ''}`).toBe(true)
      expect(q.explanation.length, tag).toBeGreaterThanOrEqual(2)
      expect(q.hint.length, tag).toBeGreaterThan(10)
      expect(/NaN|Infinity|\[object|undefined|√0|\b1x\b|\+ −|− −|−−|\+ \+|\(\s*\)|, ,/.test([q.prompt, q.display, q.input, ...q.explanation].join(' | ')), `${tag}: junk in text: ${q.display} | ${q.explanation.join(' | ')}`).toBe(false)
    }
  }, 120000)

  it('the shown answer reads back as the same answer', () => {
    for (const gi of eqIndexes) for (let s = 1; s <= 60; s++) {
      const q = make(gi, s * 31 + gi)
      if (q.kind !== 'ineq') continue
      expect(setsEqual(parseSet(q.display), q.iv!), `${q.prompt} -> ${q.display}`).toBe(true)
    }
  })

  it('answers agree with the equation or inequality as written (independent check)', () => {
    let checked = 0
    for (const gi of eqIndexes) for (let s = 1; s <= SEEDS; s++) {
      const q = make(gi, s * 104729 + gi)
      if (!q.holds) continue
      const tag = `gen ${gi} seed ${s}: ${q.prompt}`
      checked++
      const grid: number[] = []
      for (let x = -40; x <= 40; x += 0.125) grid.push(x)
      for (let n = -40; n <= 40; n++) for (const d of [3, 5, 6, 7]) grid.push(n / d)
      if (q.kind === 'ineq') {
        const ends = normalise(q.iv!).flatMap((i) => [i.lo, i.hi]).filter(isFinite)
        for (const x of grid) {
          if (ends.some((e) => Math.abs(e - x) < 1e-6)) continue
          expect(inSet(q.iv!, x), `${tag} at x = ${x}`).toBe(q.holds(x))
        }
        for (const e of ends) expect(inSet(q.iv!, e), `${tag} at the boundary ${e}`).toBe(q.holds(e))
      } else {
        for (const a of q.answers as number[]) expect(q.holds(a), `${tag}: ${a} does not satisfy it`).toBe(true)
        for (const x of grid) if (q.holds(x)) expect((q.answers as number[]).some((a) => Math.abs(a - x) < 1e-6), `${tag}: ${x} also solves it but is not an answer`).toBe(true)
      }
    }
    expect(checked).toBeGreaterThan(2000)
  }, 120000)

  it('wrong answers are rejected', () => {
    for (const gi of eqIndexes) for (let s = 1; s <= 30; s++) {
      const q = make(gi, s * 13 + gi)
      const bads = q.kind === 'ineq' ? ['x > 1000', 'x < -1000', 'all real numbers', 'no solution', '7 < x < 8']
        : q.kind === 'pair' ? ['(999, 999)', '(0, 0)', '999'] : ['999', '0.123', '-777, 888', 'no solution', '1, 2, 3, 4']
      for (const bad of bads) {
        if (bad === q.input) continue
        const res = checkAnswer(q, bad)
        if (res.ok) {
          // only acceptable when it really is the answer written another way
          if (q.kind === 'ineq') expect(setsEqual(parseSet(bad), q.iv!), `${q.prompt} accepted "${bad}"`).toBe(true)
          else if (q.kind === 'set' && q.answers.length === 0) expect(bad).toBe('no solution')
          else expect.fail(`${q.prompt} accepted "${bad}" (answer ${q.display})`)
        }
      }
    }
  })

  it('an exact-answer question refuses decimals, and ± is understood', () => {
    let irr = 0
    for (const gi of eqIndexes) for (let s = 1; s <= 200 && irr < 40; s++) {
      const q = make(gi, s * 17 + gi)
      if (q.kind !== 'set' || !q.needsExact || q.answers.length !== 2) continue
      if (!q.display.includes('±')) continue
      irr++
      const dec = (q.answers as number[]).map((a) => a.toFixed(4)).join(', ')
      expect(checkAnswer(q, dec).ok, q.prompt).toBe(false)
      const m = /= (.*)$/.exec(q.display)!
      const typed = m[1].replace(/−/g, '-').replace(/√(\d+)/g, 'sqrt($1)').replace(/(\d)sqrt/g, '$1*sqrt')
      expect(checkAnswer(q, typed).ok, `${q.prompt}: typed "${typed}"`).toBe(true)
    }
    expect(irr).toBeGreaterThan(10)
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
    for (const gi of eqIndexes) {
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
