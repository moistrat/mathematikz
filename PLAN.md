# Mathematikz — Plan

The mathematics branch of Ikz (alongside Cirkitz and Mekanikz): same stack, layout and theme (violet accent `#9b8cff`), aimed at learning the maths that engineering needs, free online, from algebra upwards.

## Status

Unit 1, **The unit circle**, is built: Learn (5 lessons, 8 interactive figures), Practice (free and section practice, about 30 question generators) and Explore (draggable unit circle, special-angle table, converter).

## Pages
1. **Learn** – units and lessons with worked examples, check questions and progress.
2. **Practice** – generated questions with exact-answer checking and worked solutions.
3. **Explore** – open-ended interactive tools.

## Tech
Vite + React + TypeScript, plain CSS (tokens copied from Cirkitz), Vitest, static deploy to GitHub Pages. No runtime dependencies beyond React.

## Done when (Unit 1)
Content tests, engine tests and 1,800+ generated questions pass; production build is clean; every page was loaded and exercised in the browser, including at phone width.

## Roadmap (suggested order)
1. **Algebra foundations**: arithmetic with fractions and surds, linear equations, rearranging formulas, exponents and logs.
2. **Functions and graphs**: functions, transformations, quadratics, polynomials.
3. **Trigonometry, continued**: right-triangle trig, sine and cosine rules, identities (Pythagorean, double angle, sum and difference), reciprocal functions (sec, csc, cot), general solutions of trig equations, graphs of sin/cos/tan with amplitude, period and phase.
4. **Vectors and complex numbers**, then **calculus** (limits, derivatives, integrals), then **differential equations**, **linear algebra** and **statistics**.

## Ideas for later
- A Games page (for example "name that angle", "beat the clock" on exact values, "solve the equation" with a graph).
- Step-by-step solver that checks each line of a student's working.
- Extend exact values to 15° multiples with the sum and difference formulas.
- Shared header or landing page linking Cirkitz, Mekanikz and Mathematikz.
- Maths-to-engineering links: lessons that point at the Mekanikz and Cirkitz lessons that use them (vectors in statics, phasors in AC circuits).
