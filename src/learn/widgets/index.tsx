import { WidgetId } from '../types'
import { CubicRoots, ExprLab, Holes, RatGraph } from './Algebra'
import { Converter, Radians } from './Angles'
import { Astc, Reference, Triangles, UnitCircle } from './Circle'
import { GraphSolve, Inverse } from './Equations'
import { Asymptotes, Composer, DomainRange, InverseGraph, PolySketch, Transform } from './FunctionsLab'
import { ExpLog, LogLab, RadicalFactor } from './Powers'
import { Ambiguous, IdentityLab, RightTriangle, TrigSolve, WaveLab } from './TrigLab'
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
    case 'explog': return <ExpLog />
    case 'radicalfactor': return <RadicalFactor />
    case 'loglab': return <LogLab />
    case 'transform': return <Transform />
    case 'invgraph': return <InverseGraph />
    case 'composer': return <Composer />
    case 'polysketch': return <PolySketch />
    case 'asymptotes': return <Asymptotes />
    case 'domainrange': return <DomainRange />
    case 'rtri': return <RightTriangle />
    case 'ambiguous': return <Ambiguous />
    case 'identity': return <IdentityLab />
    case 'wave': return <WaveLab />
    case 'trigsolve': return <TrigSolve />
  }
}
