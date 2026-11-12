# Mathematikz — Plan

The mathematics branch of Ikz (alongside Cirkitz and Mekanikz): same stack, layout and theme (violet accent `#9b8cff`), aimed at learning the maths that engineering needs, free online, from algebra upwards.

## Status

Two units are built.

- **Unit 1, the unit circle**: 5 lessons, 8 interactive figures, about 30 question generators.
- **Unit 2, factoring and rational expressions**: 6 lessons (expanding, factoring, polynomials and roots, simplifying, operations, rational equations), 4 interactive figures (expression checker, cubic with draggable roots, holes and asymptotes, rational equations graphed), about 60 question generators, and a symbolic answer checker.

Explore still only has the unit-circle tools. A Games page (Sprint, Survival, Match-up, Root hunter) is live.

## Pages
1. **Learn** – units and lessons with worked examples, check questions and progress.
2. **Practice** – generated questions with exact-answer checking and worked solutions.
3. **Explore** – open-ended interactive tools.

## Tech
Vite + React + TypeScript, plain CSS (tokens copied from Cirkitz), Vitest, static deploy to GitHub Pages. No runtime dependencies beyond React.

## Done when (each unit)
Content tests, engine tests and thousands of generated questions pass (every question accepts its own answer, its source equals its answer, and every generator offers real variety); the production build is clean; every page was loaded and exercised in the browser, including at phone width.

## Course map (algebra to advanced calculus)

Each unit follows the same recipe: lessons with worked examples, a table or formulas, check questions and interactive figures; generated practice at three levels with worked solutions; and tests that pin the engine and every generator. Games draw on the same generators.

| # | Unit | Status |
|---|------|--------|
| 1 | The unit circle | built |
| 2 | Factoring and rational expressions | built |
| 3 | Equations and inequalities: linear, quadratic (factoring, completing the square, formula), absolute value, inequalities, systems | next |
| 4 | Exponents, radicals and logarithms | planned |
| 5 | Functions and graphs: domain and range, transformations, composition, inverses, polynomial and rational graphs | planned |
| 6 | Trigonometry, continued: right triangles, sine and cosine rules, identities, graphs, general solutions | planned |
| 7 | Sequences, series and the binomial theorem | planned |
| 8 | Complex numbers and vectors | planned |
| 9 | Limits and derivatives: definition, rules, chain rule, implicit, applications (optimisation, related rates) | planned |
| 10 | Integrals: antiderivatives, substitution, by parts, partial fractions, areas and volumes | planned |
| 11 | Series and advanced calculus: convergence tests, Taylor series, multivariable, partial derivatives, multiple integrals | planned |
| 12 | Differential equations, linear algebra, probability and statistics | planned |

Games already live: Sprint, Survival, Match-up (three decks), Root hunter. Each new unit adds a match-up deck and its generators automatically join Sprint and Survival.

## Ideas for later
- Step-by-step solver that checks each line of a student's working.
- Extend exact values to 15° multiples with the sum and difference formulas.
- Complex numbers, so quadratics and cubics with no real roots get complex solutions instead of "none".
- Partial fractions (the reverse of adding rational expressions), a natural fit for the calculus unit.
- Check each line of a student's working in a factoring or simplifying chain, using the same engine.
- Shared header or landing page linking Cirkitz, Mekanikz and Mathematikz.
- Maths-to-engineering links: lessons that point at the Mekanikz and Cirkitz lessons that use them (vectors in statics, phasors in AC circuits).
