import RAW_BRACKETS from './state-brackets.json'

export const STATE_TAX_SOURCE =
  'reference/income-tax-brackets/2026-State-Individual-Income-Tax-Rate-Brackets.xlsx'
export const STATE_TAX_AS_OF_DATE = '2026'

// ---------------------------------------------------------------------------
// Internal types
// ---------------------------------------------------------------------------

type BracketRow = { floor: number; rate: number }

type StateBracketSchedule = {
  no_tax: boolean
  single: BracketRow[]
  married_filing_jointly: BracketRow[]
  single_standard_deduction: number | null
  mfj_standard_deduction: number | null
  source: 'excel' | 'pdf'
  as_of_date: string
}

// ---------------------------------------------------------------------------
// State name mapping (canonical → Excel abbreviation prefix)
// ---------------------------------------------------------------------------

const STATE_ABBREV_MAP: Record<string, string> = {
  Alabama: 'Ala.',
  Alaska: 'Alaska',
  Arizona: 'Ariz.',
  Arkansas: 'Ark.',
  California: 'Calif.',
  Colorado: 'Colo.',
  Connecticut: 'Conn.',
  Delaware: 'Del.',
  Florida: 'Fla.',
  Georgia: 'Ga.',
  Hawaii: 'Hawaii',
  Idaho: 'Idaho',
  Illinois: 'Ill.',
  Indiana: 'Ind.',
  Iowa: 'Iowa',
  Kansas: 'Kans.',
  Kentucky: 'Ky.',
  Louisiana: 'La.',
  Maine: 'Maine',
  Maryland: 'Md.',
  Massachusetts: 'Mass.',
  Michigan: 'Mich.',
  Minnesota: 'Minn.',
  Mississippi: 'Miss.',
  Missouri: 'Mo.',
  Montana: 'Mont.',
  Nebraska: 'Nebr.',
  Nevada: 'Nev.',
  'New Hampshire': 'N.H.',
  'New Jersey': 'N.J.',
  'New Mexico': 'N.M.',
  'New York': 'N.Y.',
  'North Carolina': 'N.C.',
  'North Dakota': 'N.D.',
  Ohio: 'Ohio',
  Oklahoma: 'Okla.',
  Oregon: 'Ore.',
  Pennsylvania: 'Pa.',
  'Rhode Island': 'R.I.',
  'South Carolina': 'S.C.',
  'South Dakota': 'S.D.',
  Tennessee: 'Tenn.',
  Texas: 'Tex.',
  Utah: 'Utah',
  Vermont: 'Vt.',
  Virginia: 'Va.',
  Washington: 'Wash.',
  'West Virginia': 'W.Va.',
  Wisconsin: 'Wis.',
  Wyoming: 'Wyo.',
  'D.C.': 'D.C.',
}

// Set of all canonical names for fast lookup
const CANONICAL_NAMES = new Set(Object.keys(STATE_ABBREV_MAP))

// Build abbreviation → canonical reverse map (lower-cased for case-insensitive lookup)
const ABBREV_LOWER_TO_CANONICAL = new Map<string, string>()
for (const [canonical, abbrev] of Object.entries(STATE_ABBREV_MAP)) {
  ABBREV_LOWER_TO_CANONICAL.set(abbrev.toLowerCase(), canonical)
}

// D.C. variants (case-insensitive keys → canonical)
const DC_VARIANTS = new Map<string, string>([
  ['dc', 'D.C.'],
  ['d.c.', 'D.C.'],
  ['washington dc', 'D.C.'],
  ['washington d.c.', 'D.C.'],
  ['district of columbia', 'D.C.'],
])

// ---------------------------------------------------------------------------
// Module-level bracket cache (built once at load time)
// ---------------------------------------------------------------------------

type RawEntry = {
  no_tax: boolean
  single: BracketRow[]
  married_filing_jointly: BracketRow[]
  single_standard_deduction: number | null
  mfj_standard_deduction: number | null
}

const bracketCache = new Map<string, StateBracketSchedule>()

for (const [state, raw] of Object.entries(RAW_BRACKETS as Record<string, RawEntry>)) {
  bracketCache.set(state, {
    no_tax: raw.no_tax,
    single: raw.single,
    married_filing_jointly: raw.married_filing_jointly,
    single_standard_deduction: raw.single_standard_deduction,
    mfj_standard_deduction: raw.mfj_standard_deduction,
    source: 'excel',
    as_of_date: STATE_TAX_AS_OF_DATE,
  })
}

// ---------------------------------------------------------------------------
// PDF lookup stub — returns null always; filled in by a future stage
// ---------------------------------------------------------------------------

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function lookupStatePdfBrackets(_canonicalState: string): StateBracketSchedule | null {
  // TODO: scan reference/income-tax-brackets/ for [STATE]-[YYYYMMDD].pdf
  // Parse PDF, extract brackets, return StateBracketSchedule
  // For now: no PDF parsing implemented
  return null
}

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

/**
 * Returns the canonical state name for the given input string, or null if not recognized.
 * Accepts canonical names, Excel abbreviations, and common D.C. variants.
 * Case-insensitive.
 */
export function normalizeStateName(input: string): string | null {
  const lower = input.trim().toLowerCase()

  // D.C. special cases first (some overlap with 'washington')
  const dcMatch = DC_VARIANTS.get(lower)
  if (dcMatch) return dcMatch

  // Canonical name pass-through (case-insensitive)
  for (const canonical of CANONICAL_NAMES) {
    if (canonical.toLowerCase() === lower) return canonical
  }

  // Abbreviation reverse lookup
  const fromAbbrev = ABBREV_LOWER_TO_CANONICAL.get(lower)
  if (fromAbbrev) return fromAbbrev

  return null
}

/**
 * Returns true if the state has no income tax on wages (always returns 0).
 * Returns false for unrecognized state names.
 */
export function isNoTaxState(state: string): boolean {
  const canonical = normalizeStateName(state)
  if (!canonical) return false
  const schedule = bracketCache.get(canonical)
  return schedule?.no_tax ?? false
}

/**
 * Estimates annual state income tax for the given state, gross income, and filing status.
 *
 * Filing status is limited to 'single' and 'married_filing_jointly'; callers must map
 * 'married_filing_separately' and 'head_of_household' to 'single' before calling.
 *
 * Returns 0 for:
 * - grossIncome <= 0
 * - unrecognized state name
 * - no-income-tax states (Alaska, Florida, Nevada, South Dakota, Tennessee,
 *   Texas, Washington, Wyoming, New Hampshire)
 */
export function estimateStateIncomeTax(
  state: string,
  grossIncome: number,
  filingStatus: 'single' | 'married_filing_jointly',
): number {
  if (grossIncome <= 0) return 0

  const canonical = normalizeStateName(state)
  if (!canonical) return 0

  const schedule = lookupStatePdfBrackets(canonical) ?? bracketCache.get(canonical)
  if (!schedule) return 0

  if (schedule.no_tax) return 0

  const brackets =
    filingStatus === 'married_filing_jointly' ? schedule.married_filing_jointly : schedule.single

  const stdDed =
    filingStatus === 'married_filing_jointly'
      ? schedule.mfj_standard_deduction
      : schedule.single_standard_deduction

  const taxableIncome = stdDed !== null ? Math.max(0, grossIncome - stdDed) : grossIncome

  let tax = 0
  for (let i = 0; i < brackets.length; i++) {
    const bracket = brackets[i]
    if (bracket === undefined) break
    const { floor, rate } = bracket
    const next = brackets[i + 1]
    const ceil = next !== undefined ? next.floor : Infinity
    if (taxableIncome <= floor) break
    tax += (Math.min(taxableIncome, ceil) - floor) * rate
  }
  return tax
}
