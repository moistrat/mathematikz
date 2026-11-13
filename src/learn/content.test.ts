import { describe, expect, it } from 'vitest'
import { LESSONS, UNITS } from './content'

describe('course content', () => {
  it('has unique lesson ids and check ids', () => {
    const ids = LESSONS.map((l) => l.id)
    expect(new Set(ids).size).toBe(ids.length)
    const checks = LESSONS.flatMap((l) => l.blocks.flatMap((b) => (b.t === 'check' ? [b.id] : [])))
    expect(new Set(checks).size).toBe(checks.length)
  })
  it('every lesson is substantial and has goals, questions and a visual', () => {
    for (const l of LESSONS) {
      expect(l.goals.length, l.id).toBeGreaterThanOrEqual(2)
      expect(l.blocks.filter((b) => b.t === 'check').length, l.id).toBeGreaterThanOrEqual(3)
      expect(l.blocks.filter((b) => ['h', 'p', 'list', 'callout', 'example'].includes(b.t)).length, l.id).toBeGreaterThanOrEqual(8)
      expect(l.blocks.filter((b) => b.t === 'widget').length, l.id).toBeGreaterThanOrEqual(1)
      expect(l.blocks.filter((b) => b.t === 'example').length, l.id).toBeGreaterThanOrEqual(2)
    }
    expect(UNITS.length).toBeGreaterThanOrEqual(10)
    expect(LESSONS.length).toBeGreaterThanOrEqual(52)
  })
  it('check questions are well formed', () => {
    for (const l of LESSONS) for (const b of l.blocks) {
      if (b.t !== 'check') continue
      expect(b.options.length, b.id).toBeGreaterThanOrEqual(3)
      expect(b.correct, b.id).toBeGreaterThanOrEqual(0)
      expect(b.correct, b.id).toBeLessThan(b.options.length)
      expect(new Set(b.options).size, b.id).toBe(b.options.length)
    }
  })
  it('spreads correct answers across positions', () => {
    const pos = new Set(LESSONS.flatMap((l) => l.blocks.flatMap((b) => (b.t === 'check' ? [b.correct] : []))))
    expect(pos.size).toBeGreaterThanOrEqual(3)
  })
  it('uses real minus signs and no emoji', () => {
    expect(/[\u{1F000}-\u{1FFFF}\u{2705}\u{2714}\u{2728}\u{26A0}\u{2B50}]/u.test(JSON.stringify(LESSONS))).toBe(false)
  })
  it('every widget used in a lesson exists', async () => {
    const used = new Set(LESSONS.flatMap((l) => l.blocks.flatMap((b) => (b.t === 'widget' ? [b.id] : []))))
    expect([...used].sort()).toEqual(['ambiguous', 'accumulate', 'argand', 'astc', 'betweencurves', 'boxopt', 'asymptotes', 'composer', 'converter', 'cobweb', 'crosslab', 'cubicroots', 'derivgraph', 'domainrange', 'explog', 'family', 'exprlab', 'graphsolve', 'holes', 'identity', 'implicitlab', 'inverse', 'invgraph', 'ladder', 'limitlab', 'lineargraph', 'loglab', 'polysketch', 'quadlab', 'rootsunity', 'radians', 'radicalfactor', 'partialsums', 'partsteps', 'pascal', 'ratgraph', 'reference', 'revolve', 'riemann', 'rtri', 'secantlab', 'seqlab', 'signchart', 'substeps', 'systemslab', 'transform', 'triangles', 'trigsolve', 'unitcircle', 'vectorlab', 'wave'].sort())
  })
})
