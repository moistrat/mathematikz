/** All Unit 9 generators: limits and derivatives. */
import { APP_GENS } from './calcApps'
import { DEFN_GENS, LIMIT_GENS } from './calcLimits'
import { HIGHER_GENS, RULE_GENS } from './calcRules'
import type { Gen } from './questions'

export const CALC_GENS: Gen[] = [...LIMIT_GENS, ...DEFN_GENS, ...RULE_GENS, ...HIGHER_GENS, ...APP_GENS]
