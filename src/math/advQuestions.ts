/** All Unit 11 generators: series and advanced calculus. */
import { MV_GENS } from './mvQuestions'
import type { Gen } from './questions'
import { SERIES_GENS } from './serQuestions'

export const ADV_GENS: Gen[] = [...SERIES_GENS, ...MV_GENS]
