# Mathematikz

An interactive website for learning mathematics, from the ground up and free. It is the maths branch of the Ikz family, a sibling of Cirkitz and Mekanikz (same layout and dark theme, with a violet accent).

The course starts with **Unit 1: the unit circle** and is meant to grow from algebra upwards (see `PLAN.md`).

- **Learn**: five ordered lessons with worked examples, check questions, progress tracking and interactive figures:
  1. *Degrees and radians*: what a radian is, converting both ways, the sixteen common angles, negative and coterminal angles, arc length.
  2. *The unit circle*: sin and cos as coordinates, where the exact values come from (the 45-45-90 and 30-60-90 triangles), quadrants, reference angles, ASTC.
  3. *Exact values of sin, cos and tan*: the four-step method, tan undefined, rationalising, combining surds.
  4. *Solving trig equations*: equations such as `2cos(x) − √3 = 0` on `0 ≤ x ≤ 2π` (or in degrees), the axis cases, squares and factors.
  5. *Inverse trig functions*: principal values of arcsin, arccos and arctan at unit-circle values, and compositions like `arccos(cos θ)` and `sin(arccos x)`.
- **Practice**: *Free practice* generates endless questions with worked solutions by lesson and difficulty. *Section practice* gives a repeatable 10-question round for every lesson and the whole unit (new numbers each time, concept questions mixed in), a review of what you missed, and your best score. Answers are typed and checked by value, so `√3/2`, `sqrt(3)/2` and `1/√2` all count, and `5π/6` can be typed `5pi/6`. Decimals are rejected where an exact answer is wanted.
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
- `src/math/questions.ts` has the question generators (about 30, in three levels, each with a worked solution) and the answer checker. Tests run every generator over many random seeds and confirm that each question accepts its own answer and rejects wrong ones.
- `src/learn/content/` holds the course as typed data. `src/learn/widgets/` has the interactive figures.

Limitations: exact values cover multiples of 30° and 45° only (not 15° or 75°). Equations are solved on `[0, 2π]` / `[0°, 360°]`, with general solutions only mentioned in a note. Only sin, cos and tan so far (no sec, csc, cot).
