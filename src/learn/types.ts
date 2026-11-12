export type WidgetId = 'radians' | 'converter' | 'unitcircle' | 'triangles' | 'astc' | 'reference' | 'graphsolve' | 'inverse' | 'exprlab' | 'cubicroots' | 'holes' | 'ratgraph' | 'lineargraph' | 'quadlab' | 'signchart' | 'systemslab' | 'explog' | 'radicalfactor' | 'loglab' | 'transform' | 'invgraph' | 'composer' | 'polysketch' | 'asymptotes' | 'domainrange' | 'rtri' | 'ambiguous' | 'identity' | 'wave' | 'trigsolve' | 'seqlab' | 'partialsums' | 'pascal' | 'cobweb' | 'argand' | 'rootsunity' | 'vectorlab' | 'crosslab'

export type Block =
  | { t: 'h'; text: string }
  | { t: 'p'; text: string }
  | { t: 'list'; items: string[]; ordered?: boolean }
  | { t: 'callout'; kind: 'key' | 'note' | 'warn'; title?: string; text: string }
  | { t: 'formula'; lines: string[]; caption?: string }
  | { t: 'example'; title: string; problem: string; steps: string[]; answer: string }
  | { t: 'table'; head: string[]; rows: string[][]; caption?: string }
  | { t: 'widget'; id: WidgetId }
  | { t: 'check'; id: string; q: string; options: string[]; correct: number; explain: string }

export interface Lesson {
  id: string
  title: string
  summary: string
  minutes: number
  goals: string[]
  blocks: Block[]
}

export interface Unit {
  id: string
  title: string
  blurb: string
  lessons: Lesson[]
}
