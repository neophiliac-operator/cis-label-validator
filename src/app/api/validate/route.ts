import { NextRequest, NextResponse } from 'next/server'
import * as XLSX from 'xlsx'

// ============================================================
// CIS LABEL VALIDATOR - SERVER-SIDE ENGINE (TypeScript port)
// Ported from validator_v2.py
// ============================================================

type Severity = 'error' | 'warning' | 'info'

interface Finding {
  severity: Severity
  check: string
  message: string
  sheet: string
  rows: number[]
  details?: Record<string, any>
}

interface SheetProfile {
  sheet: string
  type: string
  rows: number
  symbology: string
  delimiter: string
  arrow_format: string
  is_totem: boolean
  totem_levels: number
  bc_equals_hr: boolean
  has_color_coding: boolean
  // Internal use
  headerRow: number
  dataStartRow: number
  headers: string[]
  barcodeCols: string[]
  hrCols: string[]
  arrowCol: string | null
  aisleCol: string | null
  bayCol: string | null
  levelCol: string | null
  positionCol: string | null
  locationCol: string | null
  locationTypeCol: string | null
  colorCols: string[]
}

// Arrow normalization
const ARROW_NORMALIZE: Record<string, string> = {
  'UP': 'U', 'DOWN': 'D', 'LEFT': 'L', 'RIGHT': 'R',
  'NONE': 'N', 'N/A': 'N', 'NA': 'N', 'N': 'N',
  'U': 'U', 'D': 'D', 'L': 'L', 'R': 'R', '': 'N'
}

const VALID_ARROWS = new Set(['UP', 'DOWN', 'LEFT', 'RIGHT', 'NONE', 'N/A', 'NA', 'U', 'D', 'L', 'R', 'N', ''])

function detectHeaderRow(sheet: XLSX.WorkSheet, range: XLSX.Range): number {
  const headerKeywords = ['AISLE', 'BAY', 'LEVEL', 'BARCODE', 'ARROW', 'LOCATION',
    'LABEL', 'HUMAN', 'POSITION', 'FRONT', 'BACK', 'BIN', 'PART', 'DESCRIPTION', 'SIGN']
  const totemPattern = /LEVEL\s*\d+\s*\(?\s*(?:BARCODE|BC|HUMAN|HR)/i

  for (let r = range.s.r; r <= Math.min(range.s.r + 10, range.e.r); r++) {
    let nonNull = 0
    let rowText = ''
    for (let c = range.s.c; c <= range.e.c; c++) {
      const cell = sheet[XLSX.utils.encode_cell({ r, c })]
      if (cell && cell.v != null) {
        nonNull++
        rowText += ' ' + String(cell.v).toUpperCase()
      }
    }
    if (nonNull < 2) continue
    const matches = headerKeywords.filter(kw => rowText.includes(kw)).length
    if (matches >= 1 || totemPattern.test(rowText)) return r
  }
  return range.s.r
}

function getHeaders(sheet: XLSX.WorkSheet, headerRow: number, range: XLSX.Range): string[] {
  const headers: string[] = []
  for (let c = range.s.c; c <= range.e.c; c++) {
    const cell = sheet[XLSX.utils.encode_cell({ r: headerRow, c })]
    headers.push(cell && cell.v != null ? String(cell.v).trim() : `COL_${c + 1}`)
  }
  return headers
}

function getCellValue(sheet: XLSX.WorkSheet, r: number, c: number): string | null {
  const cell = sheet[XLSX.utils.encode_cell({ r, c })]
  if (!cell || cell.v == null) return null
  return String(cell.v).trim()
}

function getColIndex(headers: string[], colName: string): number {
  return headers.indexOf(colName)
}

function profileSheet(sheet: XLSX.WorkSheet, sheetName: string): SheetProfile | null {
  const ref = sheet['!ref']
  if (!ref) return null
  const range = XLSX.utils.decode_range(ref)
  if (range.e.r < 1) return null

  const headerRow = detectHeaderRow(sheet, range)
  const headers = getHeaders(sheet, headerRow, range)
  const dataStartRow = headerRow + 1

  // Column detection
  const profile: SheetProfile = {
    sheet: sheetName,
    type: 'unknown',
    rows: range.e.r - dataStartRow + 1,
    symbology: 'unknown',
    delimiter: 'unknown',
    arrow_format: 'unknown',
    is_totem: false,
    totem_levels: 0,
    bc_equals_hr: false,
    has_color_coding: false,
    headerRow,
    dataStartRow,
    headers,
    barcodeCols: [],
    hrCols: [],
    arrowCol: null,
    aisleCol: null,
    bayCol: null,
    levelCol: null,
    positionCol: null,
    locationCol: null,
    locationTypeCol: null,
    colorCols: [],
  }

  const totemBcPattern = /LEVEL\s*(\d+)\s*\(?\s*(?:BARCODE|BC)\s*\)?/i
  const totemHrPattern = /LEVEL\s*(\d+)\s*\(?\s*(?:HUMAN\s*READ(?:ABLE)?|HR)\s*\)?/i
  // DLS-style numbered columns: "BC 1", "BC 2", "HR 1", "HR 2", "COLOR 1", etc.
  const numberedBcPattern = /^BC\s+(\d+)$/i
  const numberedHrPattern = /^HR\s+(\d+)$/i
  const numberedColorPattern = /^COLOR\s+(\d+)$/i
  const totemBcCols: Record<number, string> = {}
  const totemHrCols: Record<number, string> = {}

  for (const h of headers) {
    const hu = h.toUpperCase().trim()
    const bcMatch = totemBcPattern.exec(h)
    const hrMatch = totemHrPattern.exec(h)
    const numberedBcMatch = numberedBcPattern.exec(hu)
    const numberedHrMatch = numberedHrPattern.exec(hu)
    const numberedColorMatch = numberedColorPattern.exec(hu)

    if (bcMatch) {
      totemBcCols[parseInt(bcMatch[1])] = h
    } else if (hrMatch) {
      totemHrCols[parseInt(hrMatch[1])] = h
    } else if (numberedBcMatch) {
      // DLS-style: "BC 1", "BC 2" etc → treat as totem levels
      totemBcCols[parseInt(numberedBcMatch[1])] = h
    } else if (numberedHrMatch) {
      totemHrCols[parseInt(numberedHrMatch[1])] = h
    } else if (numberedColorMatch) {
      profile.colorCols.push(h)
    } else if (/BAR\s*CODE|^BC$|BARCODE/i.test(hu)) {
      profile.barcodeCols.push(h)
    } else if (/HUMAN\s*READ|^HR$|READABLE/i.test(hu)) {
      profile.hrCols.push(h)
    } else if (/ARROW|DIRECTION/i.test(hu)) {
      profile.arrowCol = h
    } else if (/^AISLE$/i.test(hu)) {
      profile.aisleCol = h
    } else if (/^BAY$/i.test(hu)) {
      profile.bayCol = h
    } else if (/^LEVEL$/i.test(hu)) {
      profile.levelCol = h
    } else if (/^POSITION$|^POS$/i.test(hu)) {
      profile.positionCol = h
    } else if (/^LOCATION$/i.test(hu)) {
      profile.locationCol = h
    } else if (/LOCATION\s*TYPE|LOC\s*TYPE/i.test(hu)) {
      profile.locationTypeCol = h
    }
  }

  // Handle totems
  const totemLevels = Object.keys(totemBcCols)
  if (totemLevels.length > 0) {
    profile.is_totem = true
    profile.totem_levels = totemLevels.length
    profile.barcodeCols = totemLevels.sort().map(k => totemBcCols[parseInt(k)])
    profile.hrCols = Object.keys(totemHrCols).sort().map(k => totemHrCols[parseInt(k)])
  }

  // Detect symbology and delimiter from sample barcodes
  if (profile.barcodeCols.length > 0) {
    const bcIdx = getColIndex(headers, profile.barcodeCols[0])
    if (bcIdx >= 0) {
      const sampleBcs: string[] = []
      for (let r = dataStartRow; r <= Math.min(dataStartRow + 50, range.e.r); r++) {
        const v = getCellValue(sheet, r, bcIdx + range.s.c)
        if (v) sampleBcs.push(v)
      }

      // Symbology
      const pctCount = sampleBcs.filter(bc => bc.startsWith('%')).length
      const starCount = sampleBcs.filter(bc => bc.startsWith('*') && bc.endsWith('*')).length
      if (pctCount > sampleBcs.length * 0.8) profile.symbology = 'code_128_percent'
      else if (starCount > sampleBcs.length * 0.8) profile.symbology = 'code_39'
      else profile.symbology = 'plain'

      // Delimiter
      const clean = sampleBcs.map(bc => bc.replace(/^%/, '').replace(/^\*|\*$/g, ''))
      const dashCount = clean.filter(bc => bc.includes('-')).length
      const dotCount = clean.filter(bc => bc.includes('.')).length
      if (dashCount > clean.length * 0.8) profile.delimiter = 'dash'
      else if (dotCount > clean.length * 0.8) profile.delimiter = 'dot'
      else profile.delimiter = 'none'
    }
  }

  // Detect arrow format
  if (profile.arrowCol) {
    const arrowIdx = getColIndex(headers, profile.arrowCol)
    if (arrowIdx >= 0) {
      const sampleArrows: string[] = []
      for (let r = dataStartRow; r <= Math.min(dataStartRow + 50, range.e.r); r++) {
        const v = getCellValue(sheet, r, arrowIdx + range.s.c)
        if (v) sampleArrows.push(v.toUpperCase())
      }
      const fullWords = sampleArrows.filter(a => ['UP', 'DOWN', 'LEFT', 'RIGHT', 'NONE'].includes(a)).length
      const singleChars = sampleArrows.filter(a => ['U', 'D', 'L', 'R', 'N'].includes(a)).length
      if (fullWords > sampleArrows.length * 0.8) profile.arrow_format = 'full_word'
      else if (singleChars > sampleArrows.length * 0.8) profile.arrow_format = 'single_char'
    }
  }

  // Detect file type
  if (profile.is_totem) profile.type = 'totem_labels'
  else if (headers.some(h => h.toUpperCase() === 'FRONT') && headers.some(h => h.toUpperCase() === 'BACK')) profile.type = 'aisle_signs'
  else if (headers.length <= 2 && !profile.aisleCol) profile.type = 'single_column'
  else if (profile.barcodeCols.length > 0 || profile.aisleCol) profile.type = 'rack_labels'

  // Color coding - detect by header name or by cell values
  const COLOR_NAMES = new Set(['RED', 'BLUE', 'GREEN', 'YELLOW', 'ORANGE', 'PINK', 'PURPLE', 'WHITE', 'BLACK', 'BROWN', 'GRAY', 'GREY', 'TEAL', 'CYAN', 'MAGENTA', 'LIME', 'NAVY', 'MAROON', 'OLIVE', 'AQUA', 'SILVER', 'GOLD', 'BEIGE', 'TAN', 'CORAL', 'SALMON', 'LAVENDER', 'VIOLET', 'INDIGO', 'CRIMSON'])
  // Detect columns named COLOR (single, no number)
  for (const h of headers) {
    if (/^COLOR$/i.test(h.trim()) && !profile.colorCols.includes(h)) {
      profile.colorCols.push(h)
    }
  }
  for (let r = dataStartRow; r <= Math.min(dataStartRow + 5, range.e.r); r++) {
    for (let c = range.s.c; c <= range.e.c; c++) {
      const v = getCellValue(sheet, r, c)
      if (!v) continue
      const colIdx = c - range.s.c
      if (colIdx >= headers.length || profile.colorCols.includes(headers[colIdx])) continue
      if (/^#[0-9a-fA-F]{6}$/.test(v) || COLOR_NAMES.has(v.toUpperCase())) {
        profile.colorCols.push(headers[colIdx])
      }
    }
  }
  if (profile.colorCols.length > 0) profile.has_color_coding = true

  return profile
}

// ============================================================
// VALIDATION CHECKS
// ============================================================

function getColumnValues(sheet: XLSX.WorkSheet, profile: SheetProfile, colName: string, range: XLSX.Range): Array<[number, string | null]> {
  const colIdx = getColIndex(profile.headers, colName)
  if (colIdx < 0) return []
  const values: Array<[number, string | null]> = []
  for (let r = profile.dataStartRow; r <= range.e.r; r++) {
    const v = getCellValue(sheet, r, colIdx + range.s.c)
    values.push([r + 1, v]) // 1-indexed for user display
  }
  return values
}

function checkBlanks(sheet: XLSX.WorkSheet, profile: SheetProfile, range: XLSX.Range): Finding[] {
  const findings: Finding[] = []
  const criticalCols = [...profile.barcodeCols]
  if (profile.arrowCol) criticalCols.push(profile.arrowCol)
  if (profile.aisleCol) criticalCols.push(profile.aisleCol)
  if (profile.levelCol) criticalCols.push(profile.levelCol)

  for (const col of criticalCols) {
    const values = getColumnValues(sheet, profile, col, range)
    const blankRows = values.filter(([, v]) => !v).map(([r]) => r)
    if (blankRows.length > 0) {
      findings.push({
        severity: 'error',
        check: 'blank_data',
        message: `Column '${col}': ${blankRows.length} blank cell(s)`,
        sheet: profile.sheet,
        rows: blankRows.slice(0, 20),
      })
    }
  }
  return findings
}

function checkDuplicates(sheet: XLSX.WorkSheet, profile: SheetProfile, range: XLSX.Range): Finding[] {
  const findings: Finding[] = []
  
  for (const bcCol of profile.barcodeCols) {
    const bcMap: Record<string, number[]> = {}
    const values = getColumnValues(sheet, profile, bcCol, range)
    for (const [r, v] of values) {
      if (v) {
        if (!bcMap[v]) bcMap[v] = []
        bcMap[v].push(r)
      }
    }
    for (const [bc, rows] of Object.entries(bcMap)) {
      if (rows.length > 1) {
        findings.push({
          severity: 'error',
          check: 'duplicate_barcode',
          message: `Duplicate barcode '${bc}' in ${rows.length} rows`,
          sheet: profile.sheet,
          rows: rows.slice(0, 20),
        })
      }
    }
  }
  return findings
}

function checkBarcodeFormat(sheet: XLSX.WorkSheet, profile: SheetProfile, range: XLSX.Range): Finding[] {
  const findings: Finding[] = []
  
  for (const bcCol of profile.barcodeCols) {
    const values = getColumnValues(sheet, profile, bcCol, range)
    for (const [r, v] of values) {
      if (!v) continue
      if (v !== v.trim()) {
        findings.push({
          severity: 'error',
          check: 'barcode_whitespace',
          message: `Row ${r}: Barcode has leading/trailing whitespace`,
          sheet: profile.sheet,
          rows: [r],
        })
      }
      // Non-printable chars
      for (const c of v) {
        if (c.charCodeAt(0) < 32 || c.charCodeAt(0) > 126) {
          findings.push({
            severity: 'error',
            check: 'barcode_special_chars',
            message: `Row ${r}: Barcode contains non-printable character (0x${c.charCodeAt(0).toString(16)})`,
            sheet: profile.sheet,
            rows: [r],
          })
          break
        }
      }
    }
  }
  return findings
}

function checkArrows(sheet: XLSX.WorkSheet, profile: SheetProfile, range: XLSX.Range): Finding[] {
  const findings: Finding[] = []
  if (!profile.arrowCol) return findings

  const arrowValues = getColumnValues(sheet, profile, profile.arrowCol, range)
  
  // Validate values
  for (const [r, v] of arrowValues) {
    if (v && !VALID_ARROWS.has(v.toUpperCase())) {
      findings.push({
        severity: 'error',
        check: 'invalid_arrow',
        message: `Row ${r}: Invalid arrow value '${v}'`,
        sheet: profile.sheet,
        rows: [r],
      })
    }
  }

  // Check consistency within aisle+level
  if (profile.aisleCol && profile.levelCol) {
    const aisleIdx = getColIndex(profile.headers, profile.aisleCol)
    const levelIdx = getColIndex(profile.headers, profile.levelCol)
    const arrowIdx = getColIndex(profile.headers, profile.arrowCol)
    
    if (aisleIdx >= 0 && levelIdx >= 0 && arrowIdx >= 0) {
      const groups: Record<string, Record<string, number[]>> = {}
      
      for (let r = profile.dataStartRow; r <= range.e.r; r++) {
        const aisle = getCellValue(sheet, r, aisleIdx + range.s.c)
        const level = getCellValue(sheet, r, levelIdx + range.s.c)
        const arrow = getCellValue(sheet, r, arrowIdx + range.s.c)
        if (!aisle || !level || !arrow) continue
        
        const key = `${aisle}|${level}`
        const normalized = ARROW_NORMALIZE[arrow.toUpperCase()] || arrow.toUpperCase()
        if (!groups[key]) groups[key] = {}
        if (!groups[key][normalized]) groups[key][normalized] = []
        groups[key][normalized].push(r + 1)
      }

      for (const [key, arrows] of Object.entries(groups)) {
        const arrowTypes = Object.keys(arrows)
        if (arrowTypes.length > 1) {
          const total = Object.values(arrows).reduce((sum, rows) => sum + rows.length, 0)
          let minType = arrowTypes[0]
          let minCount = arrows[minType].length
          for (const t of arrowTypes) {
            if (arrows[t].length < minCount) {
              minType = t
              minCount = arrows[t].length
            }
          }
          const pct = (minCount / total * 100).toFixed(0)
          if (parseInt(pct) < 30) {
            const [aisle, level] = key.split('|')
            const counts: Record<string, number> = {}
            for (const [t, rows] of Object.entries(arrows)) counts[t] = rows.length
            findings.push({
              severity: 'warning',
              check: 'mixed_arrows',
              message: `Aisle ${aisle}, Level ${level}: Mixed arrows ${JSON.stringify(counts)} — '${minType}' is minority (${minCount}/${total}, ${pct}%)`,
              sheet: profile.sheet,
              rows: arrows[minType].slice(0, 20),
            })
          }
        }
      }
    }
  }

  return findings
}

function checkSequenceGaps(sheet: XLSX.WorkSheet, profile: SheetProfile, range: XLSX.Range): Finding[] {
  const findings: Finding[] = []
  const locCol = profile.locationCol || profile.bayCol
  if (!locCol || !profile.aisleCol) return findings

  const aisleIdx = getColIndex(profile.headers, profile.aisleCol)
  const locIdx = getColIndex(profile.headers, locCol)
  if (aisleIdx < 0 || locIdx < 0) return findings

  const groups: Record<string, Set<number>> = {}
  for (let r = profile.dataStartRow; r <= range.e.r; r++) {
    const aisle = getCellValue(sheet, r, aisleIdx + range.s.c)
    const loc = getCellValue(sheet, r, locIdx + range.s.c)
    if (!aisle || !loc) continue
    const locNum = parseInt(loc)
    if (isNaN(locNum)) continue
    if (!groups[aisle]) groups[aisle] = new Set()
    groups[aisle].add(locNum)
  }

  for (const [aisle, locs] of Object.entries(groups)) {
    const sorted = Array.from(locs).sort((a, b) => a - b)
    if (sorted.length < 2) continue
    const min = sorted[0], max = sorted[sorted.length - 1]
    const missing: number[] = []
    for (let i = min; i <= max; i++) {
      if (!locs.has(i)) missing.push(i)
    }
    if (missing.length > 0 && missing.length <= 10) {
      const allEven = sorted.every(l => l % 2 === 0)
      const allOdd = sorted.every(l => l % 2 === 1)
      if (!allEven && !allOdd) {
        findings.push({
          severity: 'warning',
          check: 'sequence_gap',
          message: `Aisle ${aisle}: Missing locations ${missing.join(', ')} in range ${min}-${max}`,
          sheet: profile.sheet,
          rows: [],
        })
      }
    }
  }
  return findings
}

function checkLocationType(sheet: XLSX.WorkSheet, profile: SheetProfile, range: XLSX.Range): Finding[] {
  const findings: Finding[] = []
  if (!profile.locationTypeCol || !profile.levelCol) return findings

  const ltIdx = getColIndex(profile.headers, profile.locationTypeCol)
  const lvlIdx = getColIndex(profile.headers, profile.levelCol)
  if (ltIdx < 0 || lvlIdx < 0) return findings

  const ltByLevel: Record<string, Record<string, number[]>> = {}
  for (let r = profile.dataStartRow; r <= range.e.r; r++) {
    const level = getCellValue(sheet, r, lvlIdx + range.s.c)
    const lt = getCellValue(sheet, r, ltIdx + range.s.c)
    if (!level || !lt) continue
    if (!ltByLevel[level]) ltByLevel[level] = {}
    if (!ltByLevel[level][lt]) ltByLevel[level][lt] = []
    ltByLevel[level][lt].push(r + 1)
  }

  for (const [level, types] of Object.entries(ltByLevel)) {
    const total = Object.values(types).reduce((sum, rows) => sum + rows.length, 0)
    for (const [lt, rows] of Object.entries(types)) {
      const pct = rows.length / total * 100
      if (pct < 5 && rows.length <= 3) {
        findings.push({
          severity: 'error',
          check: 'location_type_outlier',
          message: `Level ${level}: Location Type '${lt}' appears only ${rows.length}/${total} (${pct.toFixed(1)}%) — likely incorrect`,
          sheet: profile.sheet,
          rows: rows.slice(0, 20),
        })
      }
    }
  }
  return findings
}

function sheetItemName(profile: SheetProfile): string {
  if (profile.type === 'aisle_signs') return 'signs'
  if (profile.type === 'totem_labels') return 'totem labels'
  if (profile.type === 'dock_signs') return 'signs'
  if (profile.sheet.toLowerCase().includes('sign')) return 'signs'
  if (profile.sheet.toLowerCase().includes('placard')) return 'placards'
  if (profile.sheet.toLowerCase().includes('totem')) return 'totem labels'
  return 'labels'
}

function checkRowCount(profile: SheetProfile): Finding[] {
  const totalItems = profile.is_totem ? profile.rows * profile.totem_levels : profile.rows
  const itemName = sheetItemName(profile)
  return [{
    severity: 'info',
    check: 'row_count',
    message: profile.is_totem
      ? `Sheet '${profile.sheet}': ${profile.rows} totem rows x ${profile.totem_levels} levels = ${totalItems} ${itemName}`
      : `Sheet '${profile.sheet}': ${profile.rows} ${itemName}`,
    sheet: profile.sheet,
    rows: [],
  }]
}

// ============================================================
// MAIN API HANDLER
// ============================================================

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const workbook = XLSX.read(buffer, { type: 'buffer' })

    const profiles: SheetProfile[] = []
    const allFindings: Finding[] = []
    let totalLabels = 0

    for (const sheetName of workbook.SheetNames) {
      const ws = workbook.Sheets[sheetName]
      const ref = ws['!ref']
      if (!ref) continue
      const range = XLSX.utils.decode_range(ref)
      if (range.e.r < 1) continue

      const profile = profileSheet(ws, sheetName)
      if (!profile) continue

      profiles.push(profile)
      totalLabels += profile.is_totem ? profile.rows * profile.totem_levels : profile.rows

      // Run checks
      allFindings.push(...checkRowCount(profile))
      allFindings.push(...checkBlanks(ws, profile, range))
      allFindings.push(...checkDuplicates(ws, profile, range))
      allFindings.push(...checkBarcodeFormat(ws, profile, range))
      allFindings.push(...checkArrows(ws, profile, range))
      allFindings.push(...checkSequenceGaps(ws, profile, range))
      allFindings.push(...checkLocationType(ws, profile, range))
    }

    const errors = allFindings.filter(f => f.severity === 'error').length
    const warnings = allFindings.filter(f => f.severity === 'warning').length
    const info = allFindings.filter(f => f.severity === 'info').length

    const status = errors > 0 ? 'FAIL' : warnings > 0 ? 'PASS_WITH_WARNINGS' : 'PASS'

    return NextResponse.json({
      filename: file.name,
      status,
      sheets_analyzed: profiles.length,
      total_labels: totalLabels,
      total_items_label: profiles.some(p => sheetItemName(p) === 'signs') && profiles.every(p => sheetItemName(p) === 'signs') ? 'signs'
        : profiles.some(p => sheetItemName(p) === 'signs') ? 'items' : 'labels',
      summary: { errors, warnings, info },
      profiles: profiles.map(p => ({
        sheet: p.sheet,
        type: p.type,
        rows: p.rows,
        symbology: p.symbology,
        delimiter: p.delimiter,
        arrow_format: p.arrow_format,
        is_totem: p.is_totem,
        totem_levels: p.totem_levels,
        bc_equals_hr: p.bc_equals_hr,
        has_color_coding: p.has_color_coding,
      })),
      findings: allFindings.map(f => ({
        severity: f.severity,
        check: f.check,
        message: f.message,
        sheet: f.sheet,
        rows: f.rows.slice(0, 50),
      })),
    })
  } catch (err: any) {
    console.error('Validation error:', err)
    return NextResponse.json({ error: err.message || 'Validation failed' }, { status: 500 })
  }
}
