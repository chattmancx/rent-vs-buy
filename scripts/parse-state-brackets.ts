import { createRequire } from 'module'
import * as fs from 'fs'
import * as path from 'path'

const require = createRequire(import.meta.url)
const XLSX = require('xlsx') as typeof import('xlsx')

// Canonical state name → Excel abbreviation prefix
// Match by: col0.split('(')[0].trim().startsWith(abbrev)
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

// Build reverse map: abbrev prefix → canonical name
const ABBREV_TO_CANONICAL: Record<string, string> = {}
for (const [canonical, abbrev] of Object.entries(STATE_ABBREV_MAP)) {
  ABBREV_TO_CANONICAL[abbrev] = canonical
}

type BracketEntry = { floor: number; rate: number }
type StateEntry = {
  no_tax: boolean
  single: BracketEntry[]
  married_filing_jointly: BracketEntry[]
  single_standard_deduction: number | null
  mfj_standard_deduction: number | null
}

function lookupCanonical(col0: string): string | null {
  const stripped = col0.split('(')[0].trim()
  for (const [abbrev, canonical] of Object.entries(ABBREV_TO_CANONICAL)) {
    if (stripped === abbrev || stripped.startsWith(abbrev)) {
      return canonical
    }
  }
  return null
}

function isStateHeader(col0: unknown): col0 is string {
  if (typeof col0 !== 'string') return false
  const s = col0.trim()
  if (!s || s === '\xa0') return false
  if (s.startsWith('(')) return false
  if (s.length >= 60) return false
  return true
}

function toNumOrNull(v: unknown): number | null {
  return typeof v === 'number' ? v : null
}

function main(): void {
  const excelPath = path.resolve(
    process.cwd(),
    'reference/income-tax-brackets/2026-State-Individual-Income-Tax-Rate-Brackets.xlsx',
  )
  const outPath = path.resolve(process.cwd(), 'src/lib/state-brackets.json')

  if (!fs.existsSync(excelPath)) {
    console.error(`Excel file not found: ${excelPath}`)
    process.exit(1)
  }

  const wb = XLSX.readFile(excelPath)
  const ws = wb.Sheets['2026']
  if (!ws) {
    console.error('Sheet "2026" not found in workbook')
    process.exit(1)
  }

  const rows = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1, defval: null })

  const result: Record<string, StateEntry> = {}
  let currentCanonical: string | null = null
  let currentEntry: StateEntry | null = null

  function saveCurrentEntry(): void {
    if (currentCanonical && currentEntry) {
      currentEntry.single.sort((a, b) => a.floor - b.floor)
      currentEntry.married_filing_jointly.sort((a, b) => a.floor - b.floor)
      result[currentCanonical] = currentEntry
    }
  }

  for (let i = 2; i < rows.length; i++) {
    const row = rows[i]
    if (!row) continue
    const col0 = row[0]
    const col1 = row[1]
    const col3 = row[3]
    const col4 = row[4]
    const col6 = row[6]
    const col7 = row[7]
    const col8 = row[8]

    // Detect new state header
    if (isStateHeader(col0)) {
      const canonical = lookupCanonical(col0)
      if (canonical) {
        saveCurrentEntry()
        currentCanonical = canonical
        currentEntry = {
          no_tax: false,
          single: [],
          married_filing_jointly: [],
          single_standard_deduction: toNumOrNull(col7),
          mfj_standard_deduction: toNumOrNull(col8),
        }
      } else {
        // Unknown state abbreviation — log and skip
        console.warn(`Unknown state abbreviation: "${col0}"`)
        saveCurrentEntry()
        currentCanonical = null
        currentEntry = null
      }
      // Also check this row for a no-tax marker or bracket data (falls through below)
    }

    // Collect bracket data for current state
    if (currentCanonical && currentEntry) {
      if (col1 === 'none' || col1 === 'Capital gains income only') {
        currentEntry.no_tax = true
      } else if (!currentEntry.no_tax) {
        const rate = toNumOrNull(col1)
        const floor = toNumOrNull(col3)
        if (rate !== null && floor !== null) {
          currentEntry.single.push({ floor, rate })
        }
        const mfjRate = toNumOrNull(col4)
        const mfjFloor = toNumOrNull(col6)
        if (mfjRate !== null && mfjFloor !== null) {
          currentEntry.married_filing_jointly.push({ floor: mfjFloor, rate: mfjRate })
        }
      }
    }
  }

  // Save the last state
  saveCurrentEntry()

  const stateCount = Object.keys(result).length
  console.log(`Parsed ${stateCount} state entries`)

  // Spot-check a few states
  const md = result['Maryland']
  const ca = result['California']
  const ak = result['Alaska']
  const il = result['Illinois']
  const dc = result['D.C.']

  if (md)
    console.log(
      `Maryland: ${md.single.length} single brackets, std_ded=$${md.single_standard_deduction}`,
    )
  if (ca)
    console.log(
      `California: ${ca.single.length} single brackets, std_ded=$${ca.single_standard_deduction}`,
    )
  if (ak) console.log(`Alaska: no_tax=${ak.no_tax}, single brackets=${ak.single.length}`)
  if (il) console.log(`Illinois: ${il.single.length} single bracket(s), no_tax=${il.no_tax}`)
  if (dc)
    console.log(
      `D.C.: ${dc.single.length} single brackets, std_ded=$${dc.single_standard_deduction}`,
    )

  fs.writeFileSync(outPath, JSON.stringify(result, null, 2) + '\n')
  console.log(`Wrote ${outPath}`)
}

main()
