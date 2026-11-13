import { WidgetId } from '../types'
import { CubicRoots, ExprLab, Holes, RatGraph } from './Algebra'
import { ConvInterval, DoubleInt, GradLab, SeriesConv, TaylorLab } from './SeriesLab'
import { BinomLab, MatrixLab, NormalLab, Oscillator, Regression, SlopeField } from './FinalLab'
import { Converter, Radians } from './Angles'
import { AccumLab, BetweenLab, FamilyLab, PartSteps, RevolveLab, RiemannLab, SubSteps } from './IntegralLab'
import { BoxOpt, DerivGraph, ImplicitLab, Ladder, LimitLab, SecantLab } from './CalculusLab'
import { Argand, CrossLab, RootsUnity, VectorLab } from './ComplexVec'
import { Astc, Reference, Triangles, UnitCircle } from './Circle'
import { GraphSolve, Inverse } from './Equations'
import { Asymptotes, Composer, DomainRange, InverseGraph, PolySketch, Transform } from './FunctionsLab'
import { ExpLog, LogLab, RadicalFactor } from './Powers'
import { Cobweb, PartialSums, Pascal, SeqLab } from './SeqLab'
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
    case 'seqlab': return <SeqLab />
    case 'partialsums': return <PartialSums />
    case 'pascal': return <Pascal />
    case 'cobweb': return <Cobweb />
    case 'argand': return <Argand />
    case 'rootsunity': return <RootsUnity />
    case 'vectorlab': return <VectorLab />
    case 'crosslab': return <CrossLab />
    case 'limitlab': return <LimitLab />
    case 'secantlab': return <SecantLab />
    case 'derivgraph': return <DerivGraph />
    case 'implicitlab': return <ImplicitLab />
    case 'boxopt': return <BoxOpt />
    case 'ladder': return <Ladder />
    case 'family': return <FamilyLab />
    case 'riemann': return <RiemannLab />
    case 'accumulate': return <AccumLab />
    case 'betweencurves': return <BetweenLab />
    case 'revolve': return <RevolveLab />
    case 'substeps': return <SubSteps />
    case 'partsteps': return <PartSteps />
    case 'seriesconv': return <SeriesConv />
    case 'taylorlab': return <TaylorLab />
    case 'convinterval': return <ConvInterval />
    case 'gradlab': return <GradLab />
    case 'doubleint': return <DoubleInt />
    case 'slopefield': return <SlopeField />
    case 'oscillator': return <Oscillator />
    case 'matrixlab': return <MatrixLab />
    case 'binomlab': return <BinomLab />
    case 'normallab': return <NormalLab />
    case 'regression': return <Regression />
  }
}
