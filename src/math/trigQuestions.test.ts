import { describe, expect, it } from 'vitest'
import { evaluate } from './parse'
import { checkAnswer, generateQuestion, GENERATORS, Question } from './questions'
import { mulberry } from './rng'
import { rootsIn, TRIG2_GENS } from './trigQuestions'
import { trigEqual } from './trigAlgebra'

const LESSON_IDS = ['right-triangles', 'sine-cosine-rules', 'trig-identities', 'compound-angles', 'trig-graphs', 'trig-equations-general']
const SEEDS = 120

function make(gen: number, seed: number): Question {
  const g = GENERATORS[gen]
  return { ...g.make(mulberry(seed)), id: `${gen}-${seed}`, lesson: g.lesson, level: g.level, gen }
}
const idx = GENERATORS.map((g, i) => ({ g, i })).filter((x) => TRIG2_GENS.includes(x.g)).map((x) => x.i)

describe('unit 6 generators', () => {
  it('cover every lesson at all three levels', () => {
    for (const l of LESSON_IDS) for (const lv of [1, 2, 3]) expect(TRIG2_GENS.filter((g) => g.lesson === l && g.level === lv).length, `${l} L${lv}`).toBeGreaterThanOrEqual(2)
    expect(TRIG2_GENS.length).toBeGreaterThanOrEqual(36)
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

  it('numeric answers satisfy their defining relation (independent check)', () => {
    let checked = 0
    for (const gi of idx) for (let s = 1; s <= SEEDS; s++) {
      const q = make(gi, s * 104729 + gi)
      if (!q.holds) continue
      checked++
      for (const a of q.answers as number[]) expect(q.holds(a), `${q.prompt}: ${a} does not satisfy the relation`).toBe(true)
    }
    expect(checked).toBeGreaterThan(300)
  }, 120000)

  it('identities are true at many angles, and the model answer is simpler than the question', () => {
    let n = 0
    for (const gi of idx) for (let s = 1; s <= SEEDS; s++) {
      const q = make(gi, s * 31 + gi)
      if (!q.trig || !q.trig.source) continue
      n++
      expect(trigEqual(q.trig.source, q.trig.answer), `${q.prompt}: ${q.trig.source} != ${q.trig.answer}`).toBe(true)
      expect(checkAnswer(q, q.trig.source).ok, `${q.prompt}: accepted the question as the answer`).toBe(false)
    }
    expect(n).toBeGreaterThan(200)
  })

  it('wrong answers are rejected', () => {
    for (const gi of idx) for (let s = 1; s <= 30; s++) {
      const q = make(gi, s * 13 + gi)
      const bads = q.trig ? ['0', '1', 'sin(x)', 'cos(x)', 'tan(x)', 'sec(x)^2'] : q.kind === 'pair' ? ['(999, 999)', '(0, 0)', '999'] : q.kind === 'set' ? ['999', '0.123', '-777, 888', '1, 2, 3, 4'] : ['999', '0.123', '-777', '7/3']
      for (const bad of bads) {
        if (bad === q.input) continue
        const res = checkAnswer(q, bad)
        if (!res.ok) continue
        if (q.trig) expect(trigEqual(bad, q.trig.answer), `${q.prompt} accepted "${bad}"`).toBe(true)
        else if (q.kind === 'value' || q.kind === 'approx') expect(Math.abs(evaluate(bad) - (q.answers[0] as number)) <= q.tol, `${q.prompt} accepted "${bad}" (answer ${q.display})`).toBe(true)
        else expect.fail(`${q.prompt} accepted "${bad}" (answer ${q.display})`)
      }
    }
  })

  it('equations: the solution list is complete (scan agrees) and exact answers refuse decimals', () => {
    let n = 0
    for (const gi of idx) for (let s = 1; s <= 60; s++) {
      const q = make(gi, s * 17 + gi)
      if (q.kind !== 'set' || !/^Solve/.test(q.prompt) || q.needsExact === undefined) continue
      n++
      expect((q.answers as number[]).length).toBeGreaterThan(0)
      if (q.needsExact) expect(checkAnswer(q, (q.answers as number[]).map((a) => a.toFixed(4)).join(', ')).ok, q.prompt).toBe(false)
    }
    expect(n).toBeGreaterThan(80)
    // the scanner itself
    const roots = rootsIn((d) => Math.sin((2 * d * Math.PI) / 180) - Math.sin((d * Math.PI) / 180), 0, 360)
    expect(roots.map(Math.round)).toEqual([0, 60, 180, 300, 360])
    const tangent = rootsIn((d) => Math.cos((d * Math.PI) / 180) ** 2, 0, 360)
    expect(tangent.map(Math.round)).toEqual([90, 270])
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
    expect((performance.now() - t0) / n).toBeLessThan(25)
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
      expect(prompts.size, l).toBeGreaterThanOrEqual(50)
    }
  })
})
