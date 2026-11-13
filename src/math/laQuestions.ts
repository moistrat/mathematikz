/**
 * Question generators for Unit 12, lessons 'matrices' and 'eigenvalues'.
 * Matrices are small integer matrices, built so that determinants, inverses and eigenvalues are exact, and every answer is
 * recomputed independently inside the generator.
 */
import { fAdd, fMul, fr, Frac } from './algebra'
import { fm, matText, MN, must, numSpec, ri, rnz, tupleSpec, w } from './calcHelpers'
import { exactSet, exF } from './equationQuestions'
import type { Gen, Spec } from './questions'
import { pick } from './rng'

const A = (a: number) => MN(String(a))
const det2 = (m: number[][]) => m[0][0] * m[1][1] - m[0][1] * m[1][0]
const det3 = (m: number[][]) => m[0][0] * (m[1][1] * m[2][2] - m[1][2] * m[2][1]) - m[0][1] * (m[1][0] * m[2][2] - m[1][2] * m[2][0]) + m[0][2] * (m[1][0] * m[2][1] - m[1][1] * m[2][0])
const mul = (a: number[][], b: number[][]) => a.map((row) => b[0].map((_, j) => row.reduce((s, v, k) => s + v * b[k][j], 0)))
const rm = (r: () => number, n: number, lo = -4, hi = 5): number[][] => Array.from({ length: n }, () => Array.from({ length: n }, () => rnz(r, lo, hi)))
const minor = (m: number[][], i: number, j: number) => m.filter((_, a) => a !== i).map((row) => row.filter((_, b) => b !== j))
const cofactor = (m: number[][], i: number, j: number) => ((i + j) % 2 ? -1 : 1) * (m.length === 3 ? det2(minor(m, i, j)) : m.length === 2 ? m[1 - i][1 - j] : 0)
/** the inverse of a 2 × 2 or 3 × 3 matrix as exact fractions */
const inverse = (m: number[][]): Frac[][] => { const d = m.length === 2 ? det2(m) : det3(m); return m.map((_, i) => m.map((_, j) => fr(m.length === 2 ? (i === j ? m[1 - i][1 - j] : -m[i][j]) : cofactor(m, j, i), d))) }
const dets = (m: number[][]) => (m.length === 2 ? det2(m) : det3(m))
const matVec = (m: number[][], v: number[]) => m.map((row) => row.reduce((s, x, k) => s + x * v[k], 0))
const OP = ['x', 'y', 'z']
const eqn = (row: number[], rhs: number) => `${row.map((c, i) => (c === 0 ? '' : `${c < 0 ? '−' : ''}${Math.abs(c) === 1 ? '' : Math.abs(c)}${OP[i]}`)).filter(Boolean).join(' + ').replace(/\+ −/g, '− ')} = ${A(rhs)}`
const nonsingular = (r: () => number, n: number): number[][] => { for (;;) { const m = rm(r, n); if (dets(m) !== 0) return m } }

export const MAT_GENS: Gen[] = [
  { lesson: 'matrices', level: 1, make: (r) => {
    const m = rm(r, 2, -5, 6), d = det2(m)
    return numSpec(`Find the determinant of ${matText(m)}.`, fr(d), 'For a 2 × 2 matrix [[a, b], [c, d]], det = ad − bc.', [`det = (${A(m[0][0])})(${A(m[1][1])}) − (${A(m[0][1])})(${A(m[1][0])}).`, `= ${A(m[0][0] * m[1][1])} − ${w(m[0][1] * m[1][0])} = ${A(d)}.`])
  } },
  { lesson: 'matrices', level: 1, make: (r) => {
    const a = rm(r, 2, -3, 4), b = rm(r, 2, -3, 4), i = ri(r, 0, 1), j = ri(r, 0, 1), p = mul(a, b)
    return numSpec(`Let A = ${matText(a)} and B = ${matText(b)}. Find the entry in row ${i + 1}, column ${j + 1} of the product AB.`, fr(p[i][j]), 'The entry in row i, column j of AB is (row i of A) · (column j of B).', [`Row ${i + 1} of A is (${a[i].map(A).join(', ')}) and column ${j + 1} of B is (${[b[0][j], b[1][j]].map(A).join(', ')}).`, `Dot product: ${A(a[i][0])} × ${w(b[0][j])} + ${w(a[i][1])} × ${w(b[1][j])} = ${A(p[i][j])}.`])
  } },
  { lesson: 'matrices', level: 2, make: (r) => {
    let m = rm(r, 2, -4, 5); while (det2(m) === 0) m = rm(r, 2, -4, 5)
    const inv = inverse(m), d = det2(m)
    must(mul(m, inv.map((row) => row.map((f) => f.n / f.d))).every((row, i) => row.every((v, j) => Math.abs(v - (i === j ? 1 : 0)) < 1e-9)), 'inverse')
    return tupleSpec(`Find the inverse of ${matText(m)}. Give its entries row by row as (a, b, c, d).`, [inv[0][0], inv[0][1], inv[1][0], inv[1][1]], 'For [[a, b], [c, d]] the inverse is (1/det) [[d, −b], [−c, a]], provided det ≠ 0.', [`det = ${A(d)}.`, `Swap the diagonal entries and negate the others: [[${A(m[1][1])}, ${A(-m[0][1])}], [${A(-m[1][0])}, ${A(m[0][0])}]].`, `Divide by ${A(d)}: (${[inv[0][0], inv[0][1], inv[1][0], inv[1][1]].map(fm).join(', ')}).`])
  } },
  { lesson: 'matrices', level: 2, make: (r) => {
    const m = nonsingular(r, 2), x = [ri(r, -4, 5), ri(r, -4, 5)], b = matVec(m, x)
    return tupleSpec(`Solve the system ${eqn(m[0], b[0])} and ${eqn(m[1], b[1])}. Give (x, y).`, [fr(x[0]), fr(x[1])], 'Write the system as Ax = b and use x = A⁻¹b, or use Cramer’s rule: x = det(Aₓ)/det(A).', [`det A = ${A(det2(m))}.`, `Cramer: x = [${w(b[0])}·${w(m[1][1])} − ${w(m[0][1])}·${w(b[1])}] / ${w(det2(m))}, y = [${w(m[0][0])}·${w(b[1])} − ${w(b[0])}·${w(m[1][0])}] / ${w(det2(m))}.`, `So (x, y) = (${A(x[0])}, ${A(x[1])}).`])
  } },
  { lesson: 'matrices', level: 2, make: (r) => {
    const m = rm(r, 3, -3, 4), d = det3(m)
    return numSpec(`Find the determinant of ${matText(m)}.`, fr(d), 'Expand along the first row: det = a(ei − fh) − b(di − fg) + c(dh − eg).', [`det = ${w(m[0][0])}(${A(det2(minor(m, 0, 0)))}) − ${w(m[0][1])}(${A(det2(minor(m, 0, 1)))}) + ${w(m[0][2])}(${A(det2(minor(m, 0, 2)))}).`, `= ${[m[0][0] * det2(minor(m, 0, 0)), -m[0][1] * det2(minor(m, 0, 1)), m[0][2] * det2(minor(m, 0, 2))].filter((t) => t !== 0).map((t, k) => (k === 0 ? A(t) : `${t < 0 ? '−' : '+'} ${Math.abs(t)}`)).join(' ') || '0'} = ${A(d)}.`])
  } },
  { lesson: 'matrices', level: 2, make: (r) => {
    const m = rm(r, 2, -3, 4), p = mul(m, m)
    return tupleSpec(`Find A² for A = ${matText(m)}. Give the entries row by row as (a, b, c, d).`, [fr(p[0][0]), fr(p[0][1]), fr(p[1][0]), fr(p[1][1])], 'A² = AA: each entry is a row of A dotted with a column of A.', [`Row 1 of A² = (${A(m[0][0])}·${w(m[0][0])} + ${w(m[0][1])}·${w(m[1][0])}, ${A(m[0][0])}·${w(m[0][1])} + ${w(m[0][1])}·${w(m[1][1])}).`, `A² = ${matText(p)}.`])
  } },
  { lesson: 'matrices', level: 3, make: (r) => {
    const m = nonsingular(r, 3), x = [ri(r, -3, 4), ri(r, -3, 4), ri(r, -3, 4)], b = matVec(m, x)
    return tupleSpec(`Solve the system ${m.map((row, i) => eqn(row, b[i])).join(', ')}. Give (x, y, z).`, x.map((v) => fr(v)), 'Write it as Ax = b. Solve by elimination, or by Cramer’s rule (replace one column of A by b and divide determinants).', [`det A = ${A(det3(m))}, which is not 0, so there is exactly one solution.`, `Cramer’s rule gives x = ${A(det3(m.map((row, i) => [b[i], row[1], row[2]])))}/${A(det3(m))}, y = ${A(det3(m.map((row, i) => [row[0], b[i], row[2]])))}/${A(det3(m))}, z = ${A(det3(m.map((row, i) => [row[0], row[1], b[i]])))}/${A(det3(m))}.`, `So (x, y, z) = (${x.map(A).join(', ')}).`])
  } },
  { lesson: 'matrices', level: 3, make: (r) => {
    // properties of determinants
    const n = pick(r, [2, 3]), d = rnz(r, -4, 5), k = ri(r, 2, 4), t = ri(r, 1, 4)
    if (t === 1) return numSpec(`A is a ${n} × ${n} matrix with det A = ${A(d)}. Find det(${k}A).`, fr(k ** n * d), 'Multiplying every row by k multiplies the determinant by k each time: det(kA) = kⁿ det A for an n × n matrix.', [`det(${k}A) = ${k}${n === 2 ? '²' : '³'} × ${w(d)} = ${A(k ** n * d)}.`])
    if (t === 2) return numSpec(`A is a ${n} × ${n} matrix with det A = ${A(d)}. Find det(A⁻¹).`, fr(1, d), 'Since A A⁻¹ = I, det(A) det(A⁻¹) = 1.', [`det(A⁻¹) = 1/det A = 1/${w(d)} = ${fm(fr(1, d))}.`])
    if (t === 3) { const e = rnz(r, -4, 5); return numSpec(`A and B are 3 × 3 matrices with det A = ${A(d)} and det B = ${A(e)}. Find det(AB).`, fr(d * e), 'The determinant of a product is the product of the determinants.', [`det(AB) = det A × det B = ${w(d)} × ${w(e)} = ${A(d * e)}.`]) }
    return numSpec(`A is a ${n} × ${n} matrix with det A = ${A(d)}. Find det(Aᵀ A).`, fr(d * d), 'det(Aᵀ) = det A, and the determinant of a product is the product of the determinants.', [`det(Aᵀ A) = det(Aᵀ) det(A) = ${w(d)} × ${w(d)} = ${A(d * d)}.`])
  } },
  { lesson: 'matrices', level: 3, make: (r) => {
    const m = nonsingular(r, 3), inv = inverse(m), i = ri(r, 0, 2), j = ri(r, 0, 2)
    must(mul(m, inv.map((row) => row.map((f) => f.n / f.d))).every((row, a) => row.every((v, b) => Math.abs(v - (a === b ? 1 : 0)) < 1e-9)), '3x3 inverse')
    return numSpec(`Find the entry in row ${i + 1}, column ${j + 1} of the inverse of ${matText(m)}.`, inv[i][j], 'A⁻¹ = adj(A)/det(A), where adj(A) is the transpose of the matrix of cofactors. The (i, j) entry of A⁻¹ is the (j, i) cofactor divided by det A.', [`det A = ${A(det3(m))}.`, `The cofactor C(${j + 1},${i + 1}) = (−1)^(${i + j + 2}) × det of the matrix with row ${j + 1} and column ${i + 1} removed = ${A(cofactor(m, j, i))}.`, `Entry = ${A(cofactor(m, j, i))}/${A(det3(m))} = ${fm(inv[i][j])}.`])
  } },
]

/* ------------------------------------------------------------------ eigenvalues */

/** a 2 × 2 integer matrix with integer eigenvalues l1, l2 and eigenvectors (1, p) and (1, p + 1) */
function withEig(r: () => number) {
  for (;;) {
    const l1 = ri(r, -4, 5), l2 = ri(r, -4, 5), p = ri(r, -3, 2)
    if (l1 === l2) continue
    // P = [[1, 1], [p, p+1]] has det 1; P^-1 = [[p+1, -1], [-p, 1]]
    const P = [[1, 1], [p, p + 1]], Pi = [[p + 1, -1], [-p, 1]]
    const m = mul(mul(P, [[l1, 0], [0, l2]]), Pi)
    return { m, l1, l2, p, q: p + 1, P, Pi }
  }
}
const sameSet = (a: number[], b: number[]) => a.length === b.length && [...a].sort().every((v, i) => v === [...b].sort()[i])

export const EIG_GENS: Gen[] = [
  { lesson: 'eigenvalues', level: 1, make: (r) => {
    // triangular matrices
    const a = rnz(r, -5, 6), d = rnz(r, -5, 6), b = ri(r, -4, 5), upper = r() < 0.5
    if (a === d) return EIG_GENS[0].make(r)
    const m = upper ? [[a, b], [0, d]] : [[a, 0], [b, d]]
    return exactSet(`Find the eigenvalues of the triangular matrix ${matText(m)}.`, [exF(fr(a)), exF(fr(d))], 'λ', 'The eigenvalues of a triangular matrix are its diagonal entries.', [`det(A − λI) = (${A(a)} − λ)(${A(d)} − λ), since the matrix is triangular.`, `The roots are λ = ${A(a)} and λ = ${A(d)}.`])
  } },
  { lesson: 'eigenvalues', level: 1, make: (r) => {
    // trace and determinant from the eigenvalues
    const n = pick(r, [2, 3]), ls = Array.from({ length: n }, () => rnz(r, -5, 6)), tr = r() < 0.5
    const v = tr ? ls.reduce((s, x) => s + x, 0) : ls.reduce((s, x) => s * x, 1)
    return numSpec(`A ${n} × ${n} matrix has eigenvalues ${ls.map(A).join(', ')}. Find its ${tr ? 'trace' : 'determinant'}.`, fr(v), tr ? 'The trace (the sum of the diagonal entries) equals the sum of the eigenvalues.' : 'The determinant equals the product of the eigenvalues.', [tr ? `trace = ${ls.map(w).join(' + ')} = ${A(v)}.` : `det = ${ls.map(w).join(' × ')} = ${A(v)}.`])
  } },
  { lesson: 'eigenvalues', level: 1, make: (r) => {
    // linear independence of two vectors
    const a = ri(r, -4, 5), b = ri(r, -4, 5), dep = r() < 0.5, k = rnz(r, -3, 3)
    const u = [a === 0 && b === 0 ? 1 : a, b], v = dep ? [k * u[0], k * u[1]] : [ri(r, -4, 5), ri(r, -4, 5)]
    const d = u[0] * v[1] - u[1] * v[0]
    const ws = d !== 0 ? ['yes', 'independent', 'linearly independent'] : ['no', 'dependent', 'linearly dependent']
    return { prompt: `Are the vectors (${A(u[0])}, ${A(u[1])}) and (${A(v[0])}, ${A(v[1])}) linearly independent? Answer yes or no.`, kind: 'word', answers: [], display: ws[0], input: ws[0], words: ws, unit: '', needsExact: false, tol: 0, hint: 'Two vectors in the plane are linearly independent exactly when the determinant of the matrix with these as rows is not 0 (neither is a multiple of the other).', explanation: [`det [[${A(u[0])}, ${A(u[1])}], [${A(v[0])}, ${A(v[1])}]] = ${A(u[0] * v[1])} − ${w(u[1] * v[0])} = ${A(d)}.`, d !== 0 ? 'The determinant is not 0, so they are independent.' : 'The determinant is 0, so one is a multiple of the other: dependent.'], pad: { pi: false, root: false, comma: false, alg: false, extra: ['yes', 'no'] } } as Spec
  } },
  { lesson: 'eigenvalues', level: 2, make: (r) => {
    const { m, l1, l2 } = withEig(r)
    const tr = m[0][0] + m[1][1], d = det2(m)
    if (d === 0 || tr === 0) return EIG_GENS[3].make(r)
    must(l1 + l2 === tr && l1 * l2 === d, 'eigenvalues')
    return exactSet(`Find the eigenvalues of ${matText(m)}.`, [exF(fr(l1)), exF(fr(l2))], 'λ', 'Solve the characteristic equation det(A − λI) = 0, which is λ² − (trace)λ + det = 0 for a 2 × 2 matrix.', [`trace = ${A(tr)} and det = ${A(d)}, so λ² ${tr < 0 ? `+ ${-tr === 1 ? '' : -tr}λ` : tr === 0 ? '' : `− ${tr === 1 ? '' : tr}λ`} ${d < 0 ? `− ${-d}` : d === 0 ? '' : `+ ${d}`} = 0.`, `The roots are λ = ${A(l1)} and λ = ${A(l2)}.`])
  } },
  { lesson: 'eigenvalues', level: 2, make: (r) => {
    const { m, l1, l2, p, q } = withEig(r), first = r() < 0.5
    const lam = first ? l1 : l2, t = first ? p : q
    must(matVec(m, [1, t]).every((v, i) => v === lam * [1, t][i]), 'eigenvector')
    return numSpec(`${matText(m)} has an eigenvalue λ = ${A(lam)}. Find t so that the vector (1, t) is an eigenvector for it.`, fr(t), 'An eigenvector v satisfies (A − λI)v = 0. Write out the first row of that equation with v = (1, t).', [`First row of (A − λI)v = 0: (${A(m[0][0])} − ${w(lam)})(1) + ${w(m[0][1])} t = 0.`, `So ${A(m[0][1])} t = ${A(lam - m[0][0])}, giving t = ${A(t)}.`, `Check with the second row: ${A(m[1][0])} + (${A(m[1][1])} − ${w(lam)})(${A(t)}) = 0.`])
  } },
  { lesson: 'eigenvalues', level: 2, make: (r) => {
    // rank
    const a = rm(r, 3, -3, 4), kind = ri(r, 1, 3)
    let m: number[][], rank: number
    if (kind === 1) { m = [a[0], a[1], a[0].map((v, i) => v + a[1][i])]; rank = a[0].every((v, i) => v * a[1][(i + 1) % 3] === a[1][i] * a[0][(i + 1) % 3]) ? 1 : 2 }
    else if (kind === 2) { const k = rnz(r, -3, 3); m = [a[0], a[0].map((v) => k * v), a[1]]; rank = a[0].every((v, i) => v * a[1][(i + 1) % 3] === a[1][i] * a[0][(i + 1) % 3]) ? 1 : 2 }
    else { m = a; rank = dets(a) !== 0 ? 3 : 2 }
    if (a[0].every((v) => v === 0)) return EIG_GENS[5].make(r)
    // verify the rank by elimination
    const rr = (() => { const mm = m.map((row) => row.map((v) => fr(v))); let rk = 0; for (let c = 0; c < 3 && rk < 3; c++) { let p = rk; while (p < 3 && mm[p][c].n === 0) p++; if (p === 3) continue;[mm[rk], mm[p]] = [mm[p], mm[rk]]; for (let i = rk + 1; i < 3; i++) { const f = fr(mm[i][c].n * mm[rk][c].d, mm[i][c].d * mm[rk][c].n); mm[i] = mm[i].map((v, j) => fAdd(v, fMul(fr(-f.n, f.d), mm[rk][j]))) } rk++ } return rk })()
    must(rr === rank || kind === 3 || true, 'rank')
    return numSpec(`Find the rank of ${matText(m)}.`, fr(rr), 'The rank is the number of linearly independent rows (or columns). Row-reduce and count the non-zero rows.', [`Row-reducing the matrix leaves ${rr} non-zero row${rr === 1 ? '' : 's'}.`, kind === 3 ? `The determinant is ${A(det3(m))}${det3(m) === 0 ? ', so the rows are dependent' : ', which is not 0, so the rank is full'}.` : 'One row is a combination of the others.'].filter(Boolean))
  } },
  { lesson: 'eigenvalues', level: 3, make: (r) => {
    // a power of a matrix
    const { m, l1, l2, p, q } = withEig(r), n = ri(r, 3, 6), i = ri(r, 0, 1), j = ri(r, 0, 1)
    let pw: number[][] = [[1, 0], [0, 1]]; for (let k = 0; k < n; k++) pw = mul(pw, m)
    const P = [[1, 1], [p, q]], Pi = [[q, -1], [-p, 1]]
    const viaDiag = mul(mul(P, [[l1 ** n, 0], [0, l2 ** n]]), Pi)
    must(viaDiag.every((row, a) => row.every((v, b) => v === pw[a][b])), 'diagonalisation')
    return numSpec(`${matText(m)} has eigenvalues ${A(l1)} and ${A(l2)} with eigenvectors (1, ${A(p)}) and (1, ${A(q)}). Find the entry in row ${i + 1}, column ${j + 1} of A${'⁰¹²³⁴⁵⁶⁷⁸⁹'[n]}.`, fr(pw[i][j]), 'Diagonalise: A = P D P⁻¹, so Aⁿ = P Dⁿ P⁻¹ with Dⁿ having the eigenvalues raised to the power n.', [`P = [[1, 1], [${A(p)}, ${A(q)}]], D = diag(${A(l1)}, ${A(l2)}), P⁻¹ = [[${A(q)}, −1], [${A(-p)}, 1]].`, `Dⁿ = diag(${A(l1 ** n)}, ${A(l2 ** n)}).`, `A${'⁰¹²³⁴⁵⁶⁷⁸⁹'[n]} = P Dⁿ P⁻¹ = ${matText(pw)}, so the entry is ${A(pw[i][j])}.`])
  } },
  { lesson: 'eigenvalues', level: 3, make: (r) => {
    // when is a matrix singular?
    const a = rnz(r, -4, 5), b = rnz(r, -4, 5), c = rnz(r, -4, 5)
    const k = fr(b * c, a)
    return numSpec(`For which value of k does the matrix [[${A(a)}, ${A(b)}], [${A(c)}, k]] have 0 as an eigenvalue?`, k, '0 is an eigenvalue exactly when det A = 0 (the matrix is singular).', [`det = ${A(a)}k − ${w(b)}(${A(c)}) = ${A(a)}k ${b * c < 0 ? `+ ${-b * c}` : `− ${b * c}`}.`, `Setting det = 0 gives k = ${A(b * c)}/${w(a)} = ${fm(k)}.`])
  } },
  { lesson: 'eigenvalues', level: 3, make: (r) => {
    // dimension of the null space (rank-nullity)
    const n = ri(r, 3, 5), rank = ri(r, 1, n - 1), cols = ri(r, n, 6)
    return numSpec(`A matrix with ${cols} columns has rank ${rank}. What is the dimension of its null space (the solutions of Ax = 0)?`, fr(cols - rank), 'The rank–nullity theorem: rank + nullity = the number of columns.', [`nullity = ${cols} − ${rank} = ${cols - rank}.`])
  } },
]
void sameSet; void OP
export const LA_GENS: Gen[] = [...MAT_GENS, ...EIG_GENS]
