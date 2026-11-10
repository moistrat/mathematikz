import { Lesson, Unit } from '../types'
import { unit1 } from './unit1'

export const UNITS: Unit[] = [unit1]
export const LESSONS: Lesson[] = UNITS.flatMap((u) => u.lessons)
export const unitOf = (lessonId: string) => UNITS.find((u) => u.lessons.some((l) => l.id === lessonId))
