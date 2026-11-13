/** All Unit 12 generators: differential equations, linear algebra, probability and statistics. */
import { tidyText } from './calcHelpers'
import { FO_GENS, SO_GENS } from './deQuestions'
import { LA_GENS } from './laQuestions'
import { PS_GENS } from './psQuestions'
import type { Gen } from './questions'

/** the same generators, with the text of every question tidied (no "+ −" or a coefficient 1 in front of a letter) */
const tidy = (g: Gen): Gen => ({ ...g, make: (r) => { const q = g.make(r); return { ...q, prompt: tidyText(q.prompt), explanation: q.explanation.map(tidyText), display: q.calc || q.kind === 'word' ? tidyText(q.display) : q.display } } })

export const FIN_GENS: Gen[] = [...FO_GENS, ...SO_GENS, ...LA_GENS, ...PS_GENS].map(tidy)
