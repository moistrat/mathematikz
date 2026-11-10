import { ReactNode } from 'react'

export function Frame({ children, caption }: { children: ReactNode; caption?: string }) {
  return (
    <figure className="widget card">
      {children}
      {caption && <figcaption><span>{caption}</span></figcaption>}
    </figure>
  )
}

export function Row({ label, children, value }: { label: string; children: ReactNode; value: string }) {
  return (
    <label className="slider">
      <span className="slider-label">{label}</span>
      {children}
      <span className="slider-value">{value}</span>
    </label>
  )
}

export function LinSlider({ label, value, min, max, step = 1, onChange, fmt }: {
  label: string; value: number; min: number; max: number; step?: number; onChange: (v: number) => void; fmt: (v: number) => string
}) {
  return (
    <Row label={label} value={fmt(value)}>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} />
    </Row>
  )
}

export function Readouts({ items }: { items: [string, string, string?][] }) {
  return (
    <dl className="readouts">
      {items.map(([k, v, h]) => (
        <div key={k}><dt>{k}</dt><dd>{v}{h && <small>{h}</small>}</dd></div>
      ))}
    </dl>
  )
}

/** Segmented control. */
export function Seg<T extends string>({ value, options, onChange, label }: {
  value: T; options: { id: T; label: string }[]; onChange: (v: T) => void; label: string
}) {
  return (
    <div className="seg" role="group" aria-label={label}>
      {options.map((o) => <button key={o.id} type="button" className={o.id === value ? 'on' : ''} onClick={() => onChange(o.id)}>{o.label}</button>)}
    </div>
  )
}
