import { WidgetId } from '../types'
import { CubicRoots, ExprLab, Holes, RatGraph } from './Algebra'
import { Converter, Radians } from './Angles'
import { Astc, Reference, Triangles, UnitCircle } from './Circle'
import { GraphSolve, Inverse } from './Equations'
import { LinearGraph, QuadLab, SignChart, SystemsLab } from './Solving'

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
    case 'exprlab': return <ExprLab />
    case 'cubicroots': return <CubicRoots />
    case 'holes': return <Holes />
    case 'ratgraph': return <RatGraph />
    case 'lineargraph': return <LinearGraph />
    case 'quadlab': return <QuadLab />
    case 'signchart': return <SignChart />
    case 'systemslab': return <SystemsLab />
  }
}
