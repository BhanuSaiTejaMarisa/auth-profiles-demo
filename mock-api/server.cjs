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
  const profileCodes = parseCodes(req.query)
  const maxRows = parseMaxRows(req.query.maxRows)

  if (!profileCodes.length) {
    res.json({
      total: 0,
      returned: 0,
      isCapped: false,
      maxRows,
      profileCodes,
      records: [],
    })
    return
  }

  const codeSet = new Set(profileCodes)
  const filtered = allRecords.filter((record) => codeSet.has(record.authProfileCode))

  res.json({
    total: filtered.length,
    returned: Math.min(filtered.length, maxRows),
    isCapped: filtered.length > maxRows,
    maxRows,
    profileCodes,
    records: filtered.slice(0, maxRows),
  })
})

server.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`[matrix-api] json-server running at http://localhost:${PORT}`)
  // eslint-disable-next-line no-console
  console.log(`[matrix-api] db source: ${configuredDbPath}`)
})
