import { useEffect, useRef, useState } from 'react'
import { inline } from '../learn/Blocks'
import { LESSONS, UNITS } from '../learn/content'
import { buildRound, RoundItem, scopeById, unitScopeId } from '../math/practice'
import { checkAnswer, generateQuestion, LEVELS, Question } from '../math/questions'
import { load, save } from '../state/storage'

/** Press Enter to continue once a question has been answered (the answer box is disabled by then, so nothing else has focus). */
function useEnterToContinue(active: boolean, next: () => void) {
  const ref = useRef(next)
  ref.current = next
  useEffect(() => {
    if (!active) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Enter' || e.repeat || e.defaultPrevented) return
      // A focused button or link already handles Enter itself; don't advance twice.
      if ((e.target as HTMLElement | null)?.closest('button, a, select, textarea')) return
      e.preventDefault()
      ref.current()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [active])
}

/* ------------------------------------------------------------------ the answer box */

const KEY_LABELS: [string, string, (q: Question) => boolean][] = [
  ['π', 'π', (q) => q.pad.pi],
  ['√', '√', (q) => q.pad.root],
  ['^', '^', (q) => !!q.alg],
  ['/', '/', () => true],
  ['−', '−', () => true],
  ['(', '(', () => true],
  [')', ')', () => true],
  [',', ',', (q) => q.pad.comma],
]

/** One question with a text answer and helper keys. mode "free" allows retries; "round" gives one attempt. */
function Ask({ q, mode, onResult, onNext, nextLabel }: {
  q: Question; mode: 'free' | 'round'; onResult: (ok: boolean) => void; onNext: () => void; nextLabel: string
}) {
  const [text, setText] = useState('')
  const [state, setState] = useState<'ask' | 'right' | 'wrong' | 'revealed'>('ask')
  const [tries, setTries] = useState(0)
  const [note, setNote] = useState('')
  const [hint, setHint] = useState(false)
  const input = useRef<HTMLInputElement>(null)
  useEffect(() => { setText(''); setState('ask'); setTries(0); setNote(''); setHint(false); input.current?.focus() }, [q.id])

  const done = state === 'right' || state === 'revealed' || (mode === 'round' && state === 'wrong')
  useEnterToContinue(done, onNext)
  // Focus the box once it is enabled again (a disabled input cannot take focus), so the next answer can be typed straight away.
  useEffect(() => {
    if (done) return
    // Deferred a tick, so the Enter keypress that advanced cannot also land in the fresh input and submit it.
    const f = setTimeout(() => input.current?.focus(), 0)
    return () => clearTimeout(f)
  }, [done, q.id])
  const insert = (s: string) => {
    const el = input.current
    const a = el?.selectionStart ?? text.length, b = el?.selectionEnd ?? text.length
    setText(text.slice(0, a) + s + text.slice(b))
    requestAnimationFrame(() => { el?.focus(); el?.setSelectionRange(a + s.length, a + s.length) })
  }
  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (done) return onNext()
    const res = checkAnswer(q, text)
    if (res.invalid) { setNote(res.note ?? ''); return }
    if (res.ok) { setState('right'); setNote(''); if (tries === 0) onResult(true); return }
    if (tries === 0) onResult(false)
    setTries(tries + 1); setState('wrong'); setNote(res.note ?? (mode === 'free' ? 'Not quite. Check the signs and the quadrant, then try again.' : ''))
  }
  const quiet = state === 'wrong' && mode === 'free'

  return (
    <form className={`card quiz-card ${state === 'right' ? 'right' : state === 'wrong' || state === 'revealed' ? 'wrong' : ''}`} onSubmit={submit}>
      <p className="eyebrow">{LESSONS.find((l) => l.id === q.lesson)?.title} &middot; level {q.level}</p>
      <p className="q-prompt">{q.prompt}</p>
      <div className="q-row">
        <input ref={input} value={text} onChange={(e) => { setText(e.target.value); if (quiet) setState('ask') }} placeholder="Your answer" autoComplete="off" autoCapitalize="off" spellCheck={false} aria-label="Your answer" disabled={done} />
        {q.unit && <span className="unit">{q.unit}</span>}
        <button className="btn primary" type="submit">{done ? nextLabel : 'Check'}</button>
      </div>
      {!done && (
        <div className="keys" aria-label="Symbols">
          {KEY_LABELS.filter(([, , show]) => show(q)).map(([label, ins]) => <button key={label} type="button" className="symkey" onClick={() => insert(ins)} aria-label={`Insert ${label}`}>{label}</button>)}
          <span className="muted small">{q.alg ? 'Type powers with ^ (x^2) and write products side by side: 2x(x + 1). Any equivalent form counts, as long as it is in the form the question asks for.' : q.pad.alg ? 'Type whole numbers or fractions such as −3 or 1/2, and separate several answers with commas.' : 'You can also type pi and sqrt(3). Any equivalent exact form counts.'}</span>
        </div>
      )}
      {note && state !== 'right' && <p className="q-note">{note}</p>}
      {state === 'right' && <p className="q-good">Correct. {q.display}</p>}
      {mode === 'round' && state === 'wrong' && <p className="q-bad">Not quite. Answer: <b>{q.display}</b></p>}
      {!done && mode === 'free' && (
        <div className="q-actions">
          <button type="button" className="btn ghost" onClick={() => setHint(!hint)}>{hint ? 'Hide hint' : 'Hint'}</button>
          {tries >= 1 && <button type="button" className="btn ghost" onClick={() => { setState('revealed'); setNote('') }}>Show answer</button>}
        </div>
      )}
      {mode === 'round' && !done && <p className="muted small" style={{ marginTop: '.6rem' }}>Hint: {q.hint}</p>}
      {hint && !done && mode === 'free' && <p className="muted small" style={{ marginTop: '.5rem' }}>{q.hint}</p>}
      {state === 'revealed' && <p className="q-bad">Answer: <b>{q.display}</b></p>}
      {done && <div className="q-explain"><ol>{q.explanation.map((s, i) => <li key={i}>{s}</li>)}</ol></div>}
    </form>
  )
}

/* ------------------------------------------------------------------ free practice */

interface Score { answered: number; correct: number; streak: number; best: number }
const EMPTY: Score = { answered: 0, correct: 0, streak: 0, best: 0 }

function FreePractice() {
  const [topic, setTopic] = useState<string>(() => load('mathematikz.free.topic', 'all'))
  const [level, setLevel] = useState<number>(() => load('mathematikz.free.level', 1))
  const [score, setScore] = useState<Score>(() => load('mathematikz.free.score', EMPTY))
  const make = (t: string, l: number) => generateQuestion(t === 'all' ? 'all' : (scopeById(t)?.lessons ?? [t]), l)
  const [q, setQ] = useState(() => make(topic, level))
  const change = (t: string, l: number) => { setTopic(t); setLevel(l); save('mathematikz.free.topic', t); save('mathematikz.free.level', l); setQ(make(t, l)) }
  const onResult = (ok: boolean) => {
    const next: Score = { answered: score.answered + 1, correct: score.correct + (ok ? 1 : 0), streak: ok ? score.streak + 1 : 0, best: Math.max(score.best, ok ? score.streak + 1 : 0) }
    setScore(next); save('mathematikz.free.score', next)
  }
  return (
    <>
      <div className="quiz-top">
        <div className="levels" role="tablist" style={{ gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' }}>
          {LEVELS.map((l) => (
            <button key={l.level} role="tab" aria-selected={l.level === level} className={`level ${l.level === level ? 'active' : ''}`} onClick={() => change(topic, l.level)}>
              <b>{l.level}. {l.name}</b><small>{l.blurb}</small>
            </button>
          ))}
        </div>
        <div className="scoreboard card">
          <div><b>{score.correct}</b><small>/ {score.answered} correct</small></div>
          <div><b>{score.streak}</b><small>streak</small></div>
          <div><b>{score.best}</b><small>best</small></div>
          <button className="btn ghost" onClick={() => { setScore(EMPTY); save('mathematikz.free.score', EMPTY) }}>Reset</button>
        </div>
      </div>
      <div className="topic-groups">
        <div className="seg topic-seg" role="group" aria-label="Topic">
          <button className={topic === 'all' ? 'on' : ''} onClick={() => change('all', level)}>Everything, mixed</button>
        </div>
        {UNITS.map((u, ui) => (
          <div key={u.id} className="topic-group">
            <p className="eyebrow">Unit {ui + 1} &middot; {u.title}</p>
            <div className="seg topic-seg" role="group" aria-label={`Topics in unit ${ui + 1}`}>
              {[{ id: unitScopeId(u.id), name: 'Mixed' }, ...u.lessons.map((l) => ({ id: l.id, name: l.title }))].map((t) => (
                <button key={t.id} className={t.id === topic ? 'on' : ''} onClick={() => change(t.id, level)}>{t.name}</button>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="quiz-one"><Ask q={q} mode="free" onResult={onResult} onNext={() => setQ(make(topic, level))} nextLabel="Next question" /></div>
    </>
  )
}

/* ------------------------------------------------------------------ section practice */

interface Best { best: number; rounds: number }
const key = (id: string) => `mathematikz.practice.${id}`
const SIZE = 10

function SectionPicker() {
  return (
    <div className="section-picker">
      <p className="lead" style={{ maxWidth: '62ch' }}>Pick a unit or a single lesson for a 10-question round. Most are calculations with fresh numbers every time, the rest are concept questions. Repeat as often as you like.</p>
      {UNITS.map((u, ui) => {
        const ub = load<Best | null>(key(unitScopeId(u.id)), null)
        return (
          <div key={u.id} className="card picker-unit">
            <div className="picker-head">
              <div><p className="eyebrow">Unit {ui + 1}</p><h3>{u.title}</h3></div>
              <a className="btn primary" href={`#/practice/${unitScopeId(u.id)}`}>Whole unit{ub ? ` (best ${ub.best}/${SIZE})` : ''}</a>
            </div>
            <div className="picker-lessons">
              {u.lessons.map((l) => {
                const b = load<Best | null>(key(l.id), null)
                return (
                  <a key={l.id} className={`picker-lesson ${b && b.best >= 9 ? 'mastered' : ''}`} href={`#/practice/${l.id}`}>
                    <b>{l.title}</b>
                    <small>{b ? `best ${b.best}/${SIZE} · ${b.rounds} round${b.rounds > 1 ? 's' : ''}` : 'not tried yet'}</small>
                  </a>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}

type Answer = { ok: boolean; given: string }

function Round({ scopeId }: { scopeId: string }) {
  const scope = scopeById(scopeId)!
  const [items, setItems] = useState<RoundItem[]>(() => buildRound(scope.lessons, SIZE))
  const [idx, setIdx] = useState(0)
  const [answers, setAnswers] = useState<Answer[]>([])
  const [pick, setPick] = useState<number | null>(null)
  const [fb, setFb] = useState<null | { ok: boolean }>(null)
  const [best, setBest] = useState<Best>(() => load(key(scope.id), { best: 0, rounds: 0 }))

  const item = items[idx]
  const done = idx >= items.length
  useEnterToContinue(!done && item.kind === 'mc' && !!fb, () => setIdx((i) => i + 1))
  useEffect(() => { setPick(null); setFb(null) }, [idx, items])
  useEffect(() => { setItems(buildRound(scope.lessons, SIZE)); setIdx(0); setAnswers([]); setBest(load(key(scope.id), { best: 0, rounds: 0 })) }, [scopeId]) // eslint-disable-line react-hooks/exhaustive-deps

  const score = answers.filter((a) => a.ok).length
  useEffect(() => {
    if (!done || answers.length !== items.length) return
    const nb = { best: Math.max(best.best, score), rounds: best.rounds + 1 }
    setBest(nb); save(key(scope.id), nb)
  }, [done]) // eslint-disable-line react-hooks/exhaustive-deps

  const again = () => { setItems(buildRound(scope.lessons, SIZE)); setIdx(0); setAnswers([]) }

  if (done) {
    const missed = items.map((it, i) => ({ it, a: answers[i] })).filter((x) => x.a && !x.a.ok)
    return (
      <div className="practice">
        <div className="card round-result">
          <p className="eyebrow">{scope.label}</p>
          <h2 className="rr-score">{score} / {items.length}</h2>
          <p className="muted">{score === items.length ? 'Perfect round.' : score >= 8 ? 'Strong. Review the misses below, then go again.' : score >= 5 ? 'Getting there. Read the explanations and try a fresh round.' : 'Revisit the lesson, then try again. The numbers change every round.'} Best: {best.best} / {SIZE}, rounds played: {best.rounds}.</p>
          <div className="tool-row">
            <button className="btn primary" onClick={again}>New round</button>
            {scope.kind === 'lesson' && <a className="btn" href={`#/learn/${scope.id}`}>Review the lesson</a>}
            <a className="btn" href="#/practice/sections">All sections</a>
          </div>
        </div>
        {missed.length > 0 && (
          <div className="card" style={{ marginTop: '1rem' }}>
            <h2>Review: what you missed</h2>
            {missed.map(({ it, a }, i) => (
              <div key={i} className="missed">
                <p className="q-prompt">{it.kind === 'q' ? it.q.prompt : inline(it.q)}</p>
                <p className="small muted">Your answer: {a.given}. Correct: <b>{it.kind === 'q' ? it.q.display : it.options[it.correct]}</b></p>
                {it.kind === 'q' ? <ol className="small muted">{it.q.explanation.map((s, k) => <li key={k}>{s}</li>)}</ol> : <p className="small muted">{inline(it.explain)}</p>}
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  const last = idx === items.length - 1
  const submitMc = (e: React.FormEvent) => {
    e.preventDefault()
    if (item.kind !== 'mc') return
    if (fb) { setIdx((i) => i + 1); return }
    if (pick === null) return
    const ok = pick === item.correct
    setFb({ ok }); setAnswers((a) => [...a, { ok, given: item.options[pick] }])
  }
  return (
    <div className="practice">
      <div className="round-top">
        <a className="link small" href="#/practice/sections">All sections</a>
        <b>{scope.label}</b>
        <span className="mono">{idx + 1} / {items.length}</span>
        <span className="muted small">{score} correct</span>
      </div>
      <div className="cp-bar" style={{ marginBottom: '1rem' }}><i style={{ width: `${(idx / items.length) * 100}%` }} /></div>
      {item.kind === 'q' ? (
        <Ask key={item.q.id + idx} q={item.q} mode="round" nextLabel={last ? 'See results' : 'Next'}
          onResult={(ok) => setAnswers((a) => [...a, { ok, given: ok ? item.q.display : 'incorrect' }])}
          onNext={() => setIdx((i) => i + 1)} />
      ) : (
        <form className={`card quiz-card ${fb ? (fb.ok ? 'right' : 'wrong') : ''}`} onSubmit={submitMc}>
          <p className="eyebrow">Concept check</p>
          <p className="q-prompt">{inline(item.q)}</p>
          <div className="opts" role="radiogroup">
            {item.options.map((o, i) => (
              <label key={i} className={`opt ${fb && i === item.correct ? 'is-right' : ''} ${fb && pick === i && i !== item.correct ? 'is-wrong' : ''}`}>
                <input type="radio" name="mc" checked={pick === i} disabled={!!fb} onChange={() => setPick(i)} /><span>{inline(o)}</span>
              </label>
            ))}
          </div>
          <div className="check-row"><button className="btn primary" type="submit" disabled={pick === null && !fb}>{fb ? (last ? 'See results' : 'Next') : 'Check'}</button></div>
          {fb && <p className="explain muted">{inline(item.explain)}</p>}
        </form>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ page */

export function Practice({ arg }: { arg?: string }) {
  const scope = scopeById(arg)
  const section = !!scope || arg === 'sections'
  return (
    <div className="page quiz">
      <div className="seg mode-seg" role="group" aria-label="Practice mode">
        <button className={!section ? 'on' : ''} onClick={() => { location.hash = '#/practice' }}>Free practice</button>
        <button className={section ? 'on' : ''} onClick={() => { location.hash = '#/practice/sections' }}>Section practice</button>
      </div>
      {scope ? <Round scopeId={scope.id} /> : section ? <SectionPicker /> : <FreePractice />}
    </div>
  )
}
