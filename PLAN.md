# Mathematikz — Plan

The mathematics branch of Ikz (alongside Cirkitz and Mekanikz): same stack, layout and theme (violet accent `#9b8cff`), aimed at learning the maths that engineering needs, free online, from algebra upwards.

## Status

Two units are built.

- **Unit 1, the unit circle**: 5 lessons, 8 interactive figures, about 30 question generators.
- **Unit 2, factoring and rational expressions**: 6 lessons (expanding, factoring, polynomials and roots, simplifying, operations, rational equations), 4 interactive figures (expression checker, cubic with draggable roots, holes and asymptotes, rational equations graphed), about 60 question generators, and a symbolic answer checker.

Explore still only has the unit-circle tools.

## Pages
1. **Learn** – units and lessons with worked examples, check questions and progress.
2. **Practice** – generated questions with exact-answer checking and worked solutions.
3. **Explore** – open-ended interactive tools.

## Tech
Vite + React + TypeScript, plain CSS (tokens copied from Cirkitz), Vitest, static deploy to GitHub Pages. No runtime dependencies beyond React.

## Done when (each unit)
Content tests, engine tests and thousands of generated questions pass (every question accepts its own answer, its source equals its answer, and every generator offers real variety); the production build is clean; every page was loaded and exercised in the browser, including at phone width.

## Roadmap (suggested order)
1. **Algebra foundations** (partly done in Unit 2): still to add arithmetic with fractions and surds, linear and quadratic equations and the quadratic formula, inequalities, exponents and radicals, logs.
2. **Functions and graphs**: functions, transformations, quadratics, polynomials.
3. **Trigonometry, continued**: right-triangle trig, sine and cosine rules, identities (Pythagorean, double angle, sum and difference), reciprocal functions (sec, csc, cot), general solutions of trig equations, graphs of sin/cos/tan with amplitude, period and phase.
4. **Vectors and complex numbers**, then **calculus** (limits, derivatives, integrals), then **differential equations**, **linear algebra** and **statistics**.

## Ideas for later
- A Games page (for example "name that angle", "beat the clock" on exact values, "solve the equation" with a graph).
- Step-by-step solver that checks each line of a student's working.
- Extend exact values to 15° multiples with the sum and difference formulas.
- Complex numbers, so quadratics and cubics with no real roots get complex solutions instead of "none".
- Partial fractions (the reverse of adding rational expressions), a natural fit for the calculus unit.
- Check each line of a student's working in a factoring or simplifying chain, using the same engine.
- Shared header or landing page linking Cirkitz, Mekanikz and Mathematikz.
- Maths-to-engineering links: lessons that point at the Mekanikz and Cirkitz lessons that use them (vectors in statics, phasors in AC circuits).
