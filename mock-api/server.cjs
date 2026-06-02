const path = require('path')
const fs = require('fs')
const jsonServer = require('json-server')

const server = jsonServer.create()

const configuredDbPath = process.env.MATRIX_DB_PATH
  ? path.resolve(process.env.MATRIX_DB_PATH)
  : path.resolve(__dirname, '../src/data/mockMatrixData.json')

const middlewares = jsonServer.defaults({
  readOnly: false,
})

const DEFAULT_MAX_ROWS = 3000
const HARD_MAX_ROWS = 10000
const DEFAULT_PAGE = 1
const DEFAULT_PAGE_SIZE = 200
const HARD_MAX_PAGE_SIZE = 1000
const PORT = Number(process.env.MATRIX_API_PORT || 4000)

function loadRecords(dbPath) {
  if (!fs.existsSync(dbPath)) {
    return []
  }

  const raw = JSON.parse(fs.readFileSync(dbPath, 'utf8'))

  if (Array.isArray(raw)) return raw
  if (raw && Array.isArray(raw.records)) return raw.records
  if (raw && Array.isArray(raw.matrix)) return raw.matrix

  return []
}

const allRecords = loadRecords(configuredDbPath)

function parseCodes(query) {
  const set = new Set()

  const fromRepeated = query.profileCode
  if (Array.isArray(fromRepeated)) {
    fromRepeated.forEach((value) => {
      if (typeof value === 'string' && value.trim()) set.add(value.trim())
    })
  } else if (typeof fromRepeated === 'string' && fromRepeated.trim()) {
    set.add(fromRepeated.trim())
  }

  const fromCsv = query.profileCodes
  if (typeof fromCsv === 'string' && fromCsv.trim()) {
    fromCsv
      .split(',')
      .map((v) => v.trim())
      .filter(Boolean)
      .forEach((value) => set.add(value))
  }

  return Array.from(set)
}

function parseMaxRows(queryValue) {
  const parsed = Number(queryValue)
  if (!Number.isFinite(parsed) || parsed <= 0) return DEFAULT_MAX_ROWS
  return Math.min(Math.floor(parsed), HARD_MAX_ROWS)
}

function parsePage(queryValue) {
  const parsed = Number(queryValue)
  if (!Number.isFinite(parsed) || parsed <= 0) return DEFAULT_PAGE
  return Math.floor(parsed)
}

function parsePageSize(queryValue) {
  const parsed = Number(queryValue)
  if (!Number.isFinite(parsed) || parsed <= 0) return DEFAULT_PAGE_SIZE
  return Math.min(Math.floor(parsed), HARD_MAX_PAGE_SIZE)
}

function parseOptionalText(value) {
  if (typeof value !== 'string') return undefined
  const trimmed = value.trim()
  return trimmed.length ? trimmed : undefined
}

function getFilteredRecords(query) {
  const profileCodes = parseCodes(query)
  const region = parseOptionalText(query.region)
  const subRegion = parseOptionalText(query.subRegion)
  const country = parseOptionalText(query.country)
  const businessGroup = parseOptionalText(query.businessGroup)
  const businessUnit = parseOptionalText(query.businessUnit)

  const hasProfileCodes = profileCodes.length > 0
  const codeSet = new Set(profileCodes)

  const filtered = allRecords.filter((record) => {
    if (hasProfileCodes && !codeSet.has(record.authProfileCode)) return false
    if (region && record.region !== region) return false
    if (subRegion && record.subRegion !== subRegion) return false
    if (country && record.country !== country) return false
    if (businessGroup && record.businessGroup !== businessGroup) return false
    if (businessUnit && record.businessUnit !== businessUnit) return false
    return true
  })

  return {
    filtered,
    appliedFilters: {
      profileCodes,
      region: region || null,
      subRegion: subRegion || null,
      country: country || null,
      businessGroup: businessGroup || null,
      businessUnit: businessUnit || null,
    },
    mode: hasProfileCodes ? 'profile-codes' : 'broad',
  }
}

function toCsv(records) {
  if (!records.length) return ''

  const columns = [
    'id',
    'authProfileCode',
    'region',
    'subRegion',
    'country',
    'businessModel',
    'mcChargeCode',
    'businessGroup',
    'businessUnit',
    'productLine',
    'productFamily',
    'dealType',
    'maxApprovalPct',
    'minMarginApprovalPct',
    'authMarginFlag',
    'plSummaryAuthFlag',
    'maxLineUsdAmt',
    'creationDate',
    'updateDate',
    'lastChangeEmpNr',
    'effectiveDate',
    'effectiveEndDate',
  ]

  const escapeCell = (value) => {
    const text = value == null ? '' : String(value)
    return `"${text.replace(/"/g, '""')}"`
  }

  const lines = [columns.join(',')]
  records.forEach((record) => {
    lines.push(columns.map((column) => escapeCell(record[column])).join(','))
  })

  return lines.join('\n')
}

server.use(middlewares)
server.use(jsonServer.bodyParser)

server.get('/health', (_req, res) => {
  res.json({ ok: true, dbPath: configuredDbPath, records: allRecords.length })
})

server.get('/profile-codes', (_req, res) => {
  const codes = Array.from(new Set(allRecords.map((r) => r.authProfileCode))).sort()

  res.json({
    count: codes.length,
    codes,
  })
})

server.get('/matrix', (req, res) => {
  const maxRows = parseMaxRows(req.query.maxRows)
  const page = parsePage(req.query.page)
  const pageSize = parsePageSize(req.query.pageSize)
  const { filtered, appliedFilters, mode } = getFilteredRecords(req.query)

  if (mode === 'profile-codes') {
    const records = filtered.slice(0, maxRows)
    res.json({
      total: filtered.length,
      returned: records.length,
      page: 1,
      pageSize: records.length || maxRows,
      totalPages: 1,
      mode,
      isCapped: filtered.length > maxRows,
      maxRows,
      appliedFilters,
      records,
    })
    return
  }

  const total = filtered.length
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const safePage = Math.min(page, totalPages)
  const startIdx = (safePage - 1) * pageSize
  const endIdx = startIdx + pageSize
  const records = filtered.slice(startIdx, endIdx)

  res.json({
    total,
    returned: records.length,
    page: safePage,
    pageSize,
    totalPages,
    mode,
    isCapped: false,
    maxRows,
    appliedFilters,
    records,
  })
})

server.get('/matrix/export', (req, res) => {
  const { filtered } = getFilteredRecords(req.query)
  const csv = toCsv(filtered)

  res.setHeader('Content-Type', 'text/csv; charset=utf-8')
  res.setHeader('Content-Disposition', 'attachment; filename="matrix-filtered-export.csv"')
  res.send(csv)
})

server.get('/matrix/export-all', (_req, res) => {
  const csv = toCsv(allRecords)

  res.setHeader('Content-Type', 'text/csv; charset=utf-8')
  res.setHeader('Content-Disposition', 'attachment; filename="matrix-all-export.csv"')
  res.send(csv)
})

server.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`[matrix-api] json-server running at http://localhost:${PORT}`)
  // eslint-disable-next-line no-console
  console.log(`[matrix-api] db source: ${configuredDbPath}`)
})
