// ตรรกะล้วนสำหรับ HTML entities — ไม่มี React
//
// encode: escape 5 ตัวอักษรที่อันตรายใน HTML (& < > " ') เป็น named entity
// decode: รองรับทั้ง named (&amp;), numeric (&#38;) และ hex (&#x26;)
//         entity ที่ไม่รู้จักหรือ codepoint ไม่ถูกต้องจะปล่อยผ่านไปทั้งดุ้น
//         ถอดรหัสครั้งละชั้น (single pass) — ข้อความที่ encode ซ้ำต้องถอดสองรอบ

export const NAMED_ENTITIES: ReadonlyArray<readonly [name: string, char: string]> = [
  // --- พื้นฐาน / อักขระสำคัญ ---
  ['quot', '"'],
  ['amp', '&'],
  ['lt', '<'],
  ['gt', '>'],
  ['apos', "'"],
  ['nbsp', '\u00A0'],
  ['ensp', '\u2002'],
  ['emsp', '\u2003'],
  ['zwnj', '\u200C'],
  ['zwj', '\u200D'],
  // --- Latin-1 / สัญลักษณ์ทั่วไป ---
  ['iexcl', '¡'],
  ['cent', '¢'],
  ['pound', '£'],
  ['curren', '¤'],
  ['yen', '¥'],
  ['brvbar', '¦'],
  ['sect', '§'],
  ['uml', '¨'],
  ['copy', '©'],
  ['ordf', 'ª'],
  ['laquo', '«'],
  ['not', '¬'],
  ['shy', '\u00AD'],
  ['reg', '®'],
  ['macr', '¯'],
  ['deg', '°'],
  ['plusmn', '±'],
  ['sup2', '²'],
  ['sup3', '³'],
  ['acute', '´'],
  ['micro', 'µ'],
  ['para', '¶'],
  ['middot', '·'],
  ['cedil', '¸'],
  ['sup1', '¹'],
  ['ordm', 'º'],
  ['raquo', '»'],
  ['frac14', '¼'],
  ['frac12', '½'],
  ['frac34', '¾'],
  ['iquest', '¿'],
  ['times', '×'],
  ['divide', '÷'],
  // --- ตัวอักษรยุโรป ---
  ['fnof', 'ƒ'],
  ['circ', 'ˆ'],
  ['tilde', '˜'],
  ['OElig', 'Œ'],
  ['oelig', 'œ'],
  ['Scaron', 'Š'],
  ['scaron', 'š'],
  ['Yuml', 'Ÿ'],
  // --- เครื่องหมายวรรคตอน / พิมพ์ดีด ---
  ['lsquo', '‘'],
  ['rsquo', '’'],
  ['sbquo', '‚'],
  ['ldquo', '“'],
  ['rdquo', '”'],
  ['bdquo', '„'],
  ['ndash', '–'],
  ['mdash', '—'],
  ['dagger', '†'],
  ['Dagger', '‡'],
  ['bull', '•'],
  ['hellip', '…'],
  ['permil', '‰'],
  ['prime', '′'],
  ['Prime', '″'],
  ['lsaquo', '‹'],
  ['rsaquo', '›'],
  ['oline', '‾'],
  ['frasl', '⁄'],
  ['euro', '€'],
  ['trade', '™'],
  // --- ลูกศร ---
  ['larr', '←'],
  ['uarr', '↑'],
  ['rarr', '→'],
  ['darr', '↓'],
  ['harr', '↔'],
  ['crarr', '↵'],
  ['lArr', '⇐'],
  ['rArr', '⇒'],
  // --- คณิตศาสตร์ ---
  ['forall', '∀'],
  ['part', '∂'],
  ['exist', '∃'],
  ['empty', '∅'],
  ['nabla', '∇'],
  ['isin', '∈'],
  ['notin', '∉'],
  ['ni', '∋'],
  ['prod', '∏'],
  ['sum', '∑'],
  ['minus', '−'],
  ['lowast', '∗'],
  ['radic', '√'],
  ['prop', '∝'],
  ['infin', '∞'],
  ['ang', '∠'],
  ['and', '∧'],
  ['or', '∨'],
  ['cap', '∩'],
  ['cup', '∪'],
  ['int', '∫'],
  ['there4', '∴'],
  ['sim', '∼'],
  ['cong', '≅'],
  ['asymp', '≈'],
  ['ne', '≠'],
  ['equiv', '≡'],
  ['le', '≤'],
  ['ge', '≥'],
  ['sub', '⊂'],
  ['sup', '⊃'],
  ['nsub', '⊄'],
  ['sube', '⊆'],
  ['supe', '⊇'],
  ['oplus', '⊕'],
  ['otimes', '⊗'],
  ['perp', '⊥'],
  ['sdot', '⋅'],
  ['lceil', '⌈'],
  ['rceil', '⌉'],
  ['lfloor', '⌊'],
  ['rfloor', '⌋'],
  ['lang', '〈'],
  ['rang', '〉'],
  ['loz', '◊'],
  // --- ไพ่ ---
  ['spades', '♠'],
  ['clubs', '♣'],
  ['hearts', '♥'],
  ['diams', '♦'],
  // --- กรีก ---
  ['alpha', 'α'],
  ['beta', 'β'],
  ['gamma', 'γ'],
  ['delta', 'δ'],
  ['epsilon', 'ε'],
  ['zeta', 'ζ'],
  ['eta', 'η'],
  ['theta', 'θ'],
  ['iota', 'ι'],
  ['kappa', 'κ'],
  ['lambda', 'λ'],
  ['mu', 'μ'],
  ['nu', 'ν'],
  ['xi', 'ξ'],
  ['omicron', 'ο'],
  ['pi', 'π'],
  ['rho', 'ρ'],
  ['sigmaf', 'ς'],
  ['sigma', 'σ'],
  ['tau', 'τ'],
  ['upsilon', 'υ'],
  ['phi', 'φ'],
  ['chi', 'χ'],
  ['psi', 'ψ'],
  ['omega', 'ω'],
  ['thetasym', 'ϑ'],
  ['upsih', 'ϒ'],
  ['piv', 'ϖ'],
]

const NAMED_MAP = new Map(NAMED_ENTITIES)

const ENCODE_MAP: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&apos;',
}

/** เข้ารหัส 5 ตัวอักษรที่อันตรายใน HTML เป็น named entity */
export function encodeEntities(text: string): string {
  return text.replace(/[&<>"']/g, (ch) => ENCODE_MAP[ch])
}

const ENTITY_RE = /&(#[xX][0-9a-fA-F]+|#\d+|[A-Za-z][A-Za-z0-9]*);/g

/** ถอดรหัส entity แบบ single pass — ตัวที่ไม่รู้จัก/ค่าไม่ถูกต้องปล่อยผ่าน */
export function decodeEntities(text: string): string {
  return text.replace(ENTITY_RE, (match, body: string) => {
    if (body[0] === '#') {
      const hex = body[1] === 'x' || body[1] === 'X'
      const code = Number.parseInt(hex ? body.slice(2) : body.slice(1), hex ? 16 : 10)
      // ปฏิเสธ NUL, surrogate และ code point เกินช่วง Unicode
      if (!Number.isFinite(code) || code <= 0 || code > 0x10ffff || (code >= 0xd800 && code <= 0xdfff)) return match
      return String.fromCodePoint(code)
    }
    return NAMED_MAP.get(body) ?? match
  })
}
