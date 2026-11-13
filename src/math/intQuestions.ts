/** All Unit 10 generators: integration. */
import { ANTI_GENS, DEF_GENS, SUB_GENS } from './intAnti'
import { APPL_GENS, TECH_GENS } from './intTech'
import type { Gen } from './questions'

export const INT_GENS: Gen[] = [...ANTI_GENS, ...DEF_GENS, ...SUB_GENS, ...TECH_GENS, ...APPL_GENS]
