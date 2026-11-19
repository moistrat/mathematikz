/**
 * Final clean-up of the text of a generated question (the prompt, the shown answer and the worked solution), applied to
 * every generator: a real minus sign instead of a hyphen, no "+ −" or "− −", and no coefficient 1 in front of a letter.
 * Typed forms (the `input` of a question) are never touched.
 */
export const tidyText = (t: string) => t
  .replace(/(?<=^|[\s(=,;:])-(?=[\d(a-zA-Zπ√])/g, '−')
  .replace(/\+ −/g, '− ')
  .replace(/− −/g, '+ ')
  .replace(/\+ -/g, '− ')
  .replace(/(?<![\d./^])1(?=[xyzr](?![a-z]))/g, '')
  .replace(/\(([a-z]) \+ 0\)/g, '$1')
  .replace(/(?<=[a-z)²³⁴]) \+ 0(?=\s*[=).,]|\s+has|$)/g, '')
  .replace(/ [+−] 0[a-z](?=\s)/g, '')
  .replace(/(?<=\S) {2,}(?=\S)/g, ' ')
