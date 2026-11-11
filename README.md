# Mathematikz

An interactive website for learning mathematics, from the ground up and free. It is the maths branch of the Ikz family, a sibling of Cirkitz and Mekanikz (same layout and dark theme, with a violet accent).

The course has two units so far, **Unit 1: the unit circle** and **Unit 2: factoring and rational expressions**, and is meant to keep growing (see `PLAN.md`).

- **Learn**: eleven ordered lessons in two units, each with worked examples, check questions, progress tracking and interactive figures.

  *Unit 1, the unit circle:*
  1. *Degrees and radians*: what a radian is, converting both ways, the sixteen common angles, negative and coterminal angles, arc length.
  2. *The unit circle*: sin and cos as coordinates, where the exact values come from (the 45-45-90 and 30-60-90 triangles), quadrants, reference angles, ASTC.
  3. *Exact values of sin, cos and tan*: the four-step method, tan undefined, rationalising, combining surds.
  4. *Solving trig equations*: equations such as `2cos(x) − √3 = 0` on `0 ≤ x ≤ 2π` (or in degrees), the axis cases, squares and factors.
  5. *Inverse trig functions*: principal values of arcsin, arccos and arctan at unit-circle values, and compositions like `arccos(cos θ)` and `sin(arccos x)`.

  *Unit 2, factoring and rational expressions:*
  1. *Expanding and special products*: the distributive law, two and three brackets, squares, cubes, several letters.
  2. *Factoring polynomials*: common factors, trinomials (including leading coefficient not 1), squares and cubes, grouping, substitution, several letters.
  3. *Polynomials and their roots*: degree, the remainder and factor theorems, long division, solving cubics and quartics, the rational root theorem.
  4. *Simplifying rational expressions*: factor and cancel, restrictions, holes and asymptotes, opposite factors, cubes, several letters.
  5. *Operations on rational expressions*: multiplying, dividing, adding and subtracting with factored LCDs, complex fractions, difference quotients.
  6. *Rational equations and solving for a letter*: clearing fractions, extraneous solutions, rearranging formulas.
- **Practice**: *Free practice* generates endless questions with worked solutions by unit, lesson and difficulty. *Section practice* gives a repeatable 10-question round for every lesson and the whole unit (new numbers each time, concept questions mixed in), a review of what you missed, and your best score. Answers are typed and checked by value, so `√3/2`, `sqrt(3)/2` and `1/√2` all count, and `5π/6` can be typed `5pi/6`. Decimals are rejected where an exact answer is wanted. In Unit 2 you type algebra (`(x-1)(x+1)^2`, `x^2 - 3x`, `(x+2)/(x+3)`) and it is checked by value: an expansion must have no brackets left, a factorisation must be *complete* (no bracket that can still be factored, no common factor left inside), and a fraction must be in lowest terms. The feedback says which of these is missing.
- **Explore**: a large draggable unit circle with exact readouts, a table of every special angle (click a row), and a degree/radian converter.

## Develop

```bash
npm install
npm run dev     # http://localhost:5175
npm test        # exact-value engine, answer parser, question generators, course content
npm run build   # type-check and production build into dist/
```

Pushing to `main` deploys to GitHub Pages via `.github/workflows/deploy.yml`.

## How it works

- `src/math/exact.ts` is the engine: surds as `(p/q)√r`, angles as multiples of π, exact sin/cos/tan at every multiple of 30° and 45°, reference angles, equation solving over `[0, 2π]` and principal values of the inverse functions. Lesson tables are computed from it, so lessons and quizzes cannot disagree.
- `src/math/parse.ts` reads what a student types (`5π/6`, `sqrt(3)/2`, `-1/2`, `150°`, lists and pairs).
- `src/math/algebra.ts` is the algebra engine: polynomials in several variables with rational coefficients, rational expressions, exact division, rational roots, equation solving, a forgiving expression parser (`2x(x+1)`, `x²`, `(x+y)^3`) and the answer checker for expanded, factored, fractional and solve-for answers.
- `src/math/algebraQuestions.ts` has the Unit 2 generators (about 60). Each is built from explicit factors or roots, so the answer is known by construction, then run through the engine so the shown text cannot disagree with it.
- `src/math/questions.ts` has the question generators (about 30, in three levels, each with a worked solution) and the answer checker. Tests run every generator over many random seeds and confirm that each question accepts its own answer and rejects wrong ones.
- `src/learn/content/` holds the course as typed data. `src/learn/widgets/` has the interactive figures.

Limitations: exact values cover multiples of 30° and 45° only (not 15° or 75°). Equations are solved on `[0, 2π]` / `[0°, 360°]`, with general solutions only mentioned in a note. Only sin, cos and tan so far (no sec, csc, cot). In Unit 2, factoring is over the rationals (no irrational or complex factors), solution sets are limited to rational roots, and the checker does not mark intermediate working, only the final answer.
