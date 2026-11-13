# Mathematikz — Plan

The mathematics branch of Ikz (alongside Cirkitz and Mekanikz): same stack, layout and theme (violet accent `#9b8cff`), aimed at learning the maths that engineering needs, free online, from algebra upwards.

## Status

Seven units are built.

- **Unit 1, the unit circle**: 5 lessons, 8 interactive figures, about 30 question generators.
- **Unit 2, factoring and rational expressions**: 6 lessons (expanding, factoring, polynomials and roots, simplifying, operations, rational equations), 4 interactive figures (expression checker, cubic with draggable roots, holes and asymptotes, rational equations graphed), about 60 question generators, and a symbolic answer checker.

- **Unit 3, equations and inequalities**: 6 lessons (linear equations and formulas, solving quadratics, the quadratic formula, inequalities, absolute value, systems), 4 interactive figures (line intersection, quadratic explorer, sign chart, systems of lines), about 40 question generators, a solution-set checker and an exact-roots checker.

- **Unit 4, exponents, radicals and logarithms**: 3 lessons, 3 interactive figures (exponential and logarithm mirror graph, prime-factor chips for roots, a live log-laws lab), about 25 generators, a simplest-radical-form check.

- **Unit 5, functions and graphs**: 6 lessons, 6 interactive figures (domain and range, transformations, composition, inverse as mirror image, polynomial sketching from roots, rational asymptotes), about 45 generators, domain-style answers (≠, and, except) and one-word answers.

- **Unit 6, trigonometry, continued**: 6 lessons, 5 interactive figures (right triangle, the ambiguous case, identity tester, wave lab, equation grapher), about 45 generators, and a trig-expression checker.

- **Unit 7, sequences, series and the binomial theorem**: 5 lessons, 4 interactive figures (sequence terms, partial sums, Pascal's triangle, cobweb diagram), about 35 generators with built-in brute-force self-checks.

- **Unit 8, complex numbers and vectors**: 5 lessons, 4 interactive figures (Argand diagram, roots of a number, 2D dot-product lab, 3D cross-product lab), about 40 generators, and 3 more match-up decks.

- **Unit 9, limits and derivatives**: 5 lessons, 6 interactive figures (approaching a limit, secant to tangent, function and derivative, circle tangent, open-box optimisation, sliding ladder), about 60 generators with a formula checker, and 3 more match-up decks.

- **Unit 10, integration**: 5 lessons, 7 interactive figures (antiderivative family, Riemann sums, accumulated area, area between curves, solids of revolution, and step-by-step guides for substitution and by parts), about 45 generators with antiderivative and Simpson checks, and 3 more match-up decks.

- **Unit 11, series and advanced calculus**: 5 lessons, 5 interactive figures (partial sums, Taylor polynomials, interval of convergence, gradient on a contour map, double-integral grid), about 45 generators with convergence, series and two-variable checkers, and 3 more match-up decks.

- **Unit 12, differential equations, linear algebra, probability and statistics**: 6 lessons, 6 interactive figures (slope field and Euler, damped oscillator, matrix transformation, binomial distribution, normal distribution, regression), about 50 generators, and 3 more match-up decks. **All twelve units of the course map are now built.**

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
| 3 | Equations and inequalities: linear, quadratic (factoring, completing the square, formula), absolute value, inequalities, systems | built |

| 4 | Exponents, radicals and logarithms | built |
| 5 | Functions and graphs: domain and range, transformations, composition, inverses, polynomial and rational graphs | built |
| 6 | Trigonometry, continued: right triangles, sine and cosine rules, identities, graphs, general solutions | built |
| 7 | Sequences, series and the binomial theorem | built |
| 8 | Complex numbers and vectors | built |
| 9 | Limits and derivatives: definition, rules, chain rule, implicit, applications (optimisation, related rates) | built |
| 10 | Integrals: antiderivatives, substitution, by parts, partial fractions, areas and volumes | built |
| 11 | Series and advanced calculus: convergence tests, Taylor series, multivariable, partial derivatives, multiple integrals | built |
| 12 | Differential equations, linear algebra, probability and statistics | built |

Games already live: Sprint, Survival, Match-up (three decks), Root hunter. Each new unit adds a match-up deck and its generators automatically join Sprint and Survival.

## Ideas for later
- Step-by-step solver that checks each line of a student's working.
- Extend exact values to 15° multiples with the sum and difference formulas.
- Complex numbers, so quadratics and cubics with no real roots get complex solutions instead of "none".
- Partial fractions (the reverse of adding rational expressions), a natural fit for the calculus unit.
- Check each line of a student's working in a factoring or simplifying chain, using the same engine.
- Shared header or landing page linking Cirkitz, Mekanikz and Mathematikz.
- Maths-to-engineering links: lessons that point at the Mekanikz and Cirkitz lessons that use them (vectors in statics, phasors in AC circuits).
