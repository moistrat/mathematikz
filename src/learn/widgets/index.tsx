import { WidgetId } from '../types'
import { Converter, Radians } from './Angles'
import { Astc, Reference, Triangles, UnitCircle } from './Circle'
import { GraphSolve, Inverse } from './Equations'

export function Widget({ id }: { id: WidgetId }) {
  switch (id) {
    case 'radians': return <Radians />
    case 'converter': return <Converter />
    case 'unitcircle': return <UnitCircle />
    case 'triangles': return <Triangles />
    case 'astc': return <Astc />
    case 'reference': return <Reference />
    case 'graphsolve': return <GraphSolve />
    case 'inverse': return <Inverse />
  }
}
