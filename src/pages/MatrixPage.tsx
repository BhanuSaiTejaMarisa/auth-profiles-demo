import { useEffect, useMemo, useState } from 'react'
import {
  Alert,
  Autocomplete,
  Box,
  Chip,
  CircularProgress,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Snackbar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material'
import { ActionToolbar } from '../components/ActionToolbar'
import { BulkEditPanel } from '../components/BulkEditPanel'
import { MatrixGroupSection } from '../components/MatrixGroupSection'
import { useMatrixData } from '../hooks'
import {
  mockProfiles,
  createBulkEditSeed,
  regionOptions,
  subRegionOptions,
  countryOptions,
  businessGroupOptions,
  businessUnitOptions,
} from '../data/mockData'
import { MatrixService } from '../services'
import type { MatrixRecord, BulkEditFormState } from '../types'
import type { MatrixRecord as ApiMatrixRecord } from '../services/MatrixApiService'
import { downloadUrlAsFile } from '../utils/csv'

const allProfileCodes = mockProfiles.map((p) => p.code)

/**
 * Transform API record format to component expected format
 */
function adaptApiRecord(apiRecord: ApiMatrixRecord): MatrixRecord {
  return {
    id: apiRecord.id,
    authProfileCode: apiRecord.authProfileCode,
    region: apiRecord.region,
    subRegion: apiRecord.subRegion,
    country: apiRecord.country,
    businessGroup: apiRecord.businessGroup,
    businessUnit: apiRecord.businessUnit,
    productLine: apiRecord.productLine,
    pfCode: apiRecord.productFamily,
    maxPlPercent: apiRecord.maxApprovalPct,
    minMarginPercent: apiRecord.minMarginApprovalPct,
    authMarginFlag: apiRecord.authMarginFlag as 'Y' | 'N',
    plSumAuth: apiRecord.plSummaryAuthFlag as 'Y' | 'N',
    maxLineAmount: apiRecord.maxLineUsdAmt,
    dealType: apiRecord.dealType,
    startDate: apiRecord.effectiveDate,
    endDate: apiRecord.effectiveEndDate,
    updatedBy: apiRecord.lastChangeEmpNr,
  }
}

export function MatrixPage() {
  // ====== State ======
  const [selectedProfileCodes, setSelectedProfileCodes] = useState<string[]>([
    mockProfiles[0].code,
    mockProfiles[1].code,
    mockProfiles[2].code,
  ])
  const [selectedMatrixIds, setSelectedMatrixIds] = useState<string[]>([])
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({})
  const [bulkEditForm, setBulkEditForm] = useState<BulkEditFormState>(createBulkEditSeed())
  const [snackbar, setSnackbar] = useState<string>('')
  const [localRecords, setLocalRecords] = useState<MatrixRecord[]>([])
  const [matrixPage, setMatrixPage] = useState(1)
  const [matrixPageSize, setMatrixPageSize] = useState(200)
  const [regionFilter, setRegionFilter] = useState('')
  const [subRegionFilter, setSubRegionFilter] = useState('')
  const [countryFilter, setCountryFilter] = useState('')
  const [businessGroupFilter, setBusinessGroupFilter] = useState('')
  const [businessUnitFilter, setBusinessUnitFilter] = useState('')

  const jsonServerBaseUrl =
    import.meta.env.VITE_MATRIX_API_BASE_URL?.trim() || 'http://localhost:4000'

  const hasBroadFilters =
    Boolean(regionFilter) ||
    Boolean(subRegionFilter) ||
    Boolean(countryFilter) ||
    Boolean(businessGroupFilter) ||
    Boolean(businessUnitFilter)
  const isProfileMode = selectedProfileCodes.length > 0

  // ====== API Hook (filter-first + capped results) ======
  const {
    records: apiRecords,
    total,
    returned,
    page,
    pageSize,
    totalPages,
    isCapped,
    maxRows,
    mode,
    dataSource,
    isLoading,
    error,
    appliedFilters,
  } = useMatrixData({
    authProfileCodes: selectedProfileCodes,
    region: regionFilter,
    subRegion: subRegionFilter,
    country: countryFilter,
    businessGroup: businessGroupFilter,
    businessUnit: businessUnitFilter,
    page: matrixPage,
    pageSize: matrixPageSize,
    maxRows: 3000,
  })

  useEffect(() => {
    setMatrixPage(page)
  }, [page])

  useEffect(() => {
    setMatrixPageSize(pageSize)
  }, [pageSize])

  // ====== Transform API records to component format ======
  const records = useMemo(() => apiRecords.map(adaptApiRecord), [apiRecords])

  // Keep a local editable copy for delete/bulk-edit actions in standalone matrix view.
  useEffect(() => {
    setLocalRecords(records)
  }, [records])

  // ====== Derived data: Group current page records by profile code ======
  const groupedRecords = useMemo(
    () =>
      localRecords.reduce<Record<string, MatrixRecord[]>>((groups, record) => {
        if (!groups[record.authProfileCode]) groups[record.authProfileCode] = []
        groups[record.authProfileCode].push(record)
        return groups
      }, {}),
    [localRecords],
  )

  const selectedMatrixRecords = useMemo(
    () => localRecords.filter((r) => selectedMatrixIds.includes(r.id)),
    [localRecords, selectedMatrixIds],
  )

  // ====== Handlers ======
  const handleRowSelectionChange = (recordId: string, checked: boolean) => {
    setSelectedMatrixIds((current) => {
      const next = checked ? [...current, recordId] : current.filter((id) => id !== recordId)
      const firstRecord = localRecords.find((r) => r.id === next[0])
      if (firstRecord) {
        setBulkEditForm({
          region: firstRecord.region,
          subRegion: firstRecord.subRegion,
          country: firstRecord.country,
          businessGroup: firstRecord.businessGroup,
          businessUnit: firstRecord.businessUnit,
          productLine: firstRecord.productLine,
          pfCode: firstRecord.pfCode,
          maxPlPercent: String(firstRecord.maxPlPercent),
          minMarginPercent: String(firstRecord.minMarginPercent),
          authMarginFlag: firstRecord.authMarginFlag,
          plSumAuth: firstRecord.plSumAuth,
          maxLineAmount: String(firstRecord.maxLineAmount),
          dealType: String(firstRecord.dealType),
        })
      }
      return next
    })
  }

  const handleGroupSelectionChange = (recordIds: string[], checked: boolean) => {
    setSelectedMatrixIds((current) =>
      checked
        ? Array.from(new Set([...current, ...recordIds]))
        : current.filter((id) => !recordIds.includes(id)),
    )
  }

  const handleDeleteMatrix = () => {
    if (!selectedMatrixIds.length) {
      setSnackbar('Select matrix rows before deleting.')
      return
    }
    const updated = MatrixService.deleteMatrixRecords(localRecords, selectedMatrixIds)
    setLocalRecords(updated)
    setSelectedMatrixIds([])
    setSnackbar('Selected matrix rows were removed in local page state.')
  }

  const handleApplyBulkEdit = () => {
    if (!selectedMatrixIds.length) {
      setSnackbar('Select one or more matrix rows before updating them.')
      return
    }
    const updated = MatrixService.applyBulkEdit(localRecords, selectedMatrixIds, bulkEditForm)
    setLocalRecords(updated)
    setSnackbar('Selected matrix rows were updated in local page state.')
  }

  const handleToggleExpanded = (code: string) => {
    setExpandedGroups((current) => ({ ...current, [code]: !(current[code] ?? true) }))
  }

  const handleProfileCodesChange = (codes: string[]) => {
    if (codes.length > 0 && hasBroadFilters) {
      const confirmed = window.confirm(
        'Switching to Profile Code mode will clear Region/Sub-Region/Country/Business filters. Continue?',
      )
      if (!confirmed) return
      setRegionFilter('')
      setSubRegionFilter('')
      setCountryFilter('')
      setBusinessGroupFilter('')
      setBusinessUnitFilter('')
    }

    setSelectedProfileCodes(codes)
    setMatrixPage(1)
    setSelectedMatrixIds([])
  }

  const handleBroadFilterChange = (
    setter: (value: string) => void,
    nextValue: string,
  ) => {
    if (nextValue && selectedProfileCodes.length > 0) {
      const confirmed = window.confirm(
        'Switching to broad filters will clear selected Profile Codes and use flat table mode. Continue?',
      )
      if (!confirmed) return
      setSelectedProfileCodes([])
    }

    setter(nextValue)
    setMatrixPage(1)
    setSelectedMatrixIds([])
  }

  const handleExportFiltered = async () => {
    try {
      const params = new URLSearchParams()
      selectedProfileCodes.forEach((code) => params.append('profileCode', code))
      if (regionFilter) params.set('region', regionFilter)
      if (subRegionFilter) params.set('subRegion', subRegionFilter)
      if (countryFilter) params.set('country', countryFilter)
      if (businessGroupFilter) params.set('businessGroup', businessGroupFilter)
      if (businessUnitFilter) params.set('businessUnit', businessUnitFilter)

      await downloadUrlAsFile(
        `${jsonServerBaseUrl}/matrix/export?${params.toString()}`,
        'matrix-filtered-export.csv',
      )
      setSnackbar('Filtered matrix export downloaded.')
    } catch (err) {
      setSnackbar(err instanceof Error ? err.message : 'Failed to export filtered matrix data.')
    }
  }

  const handleExportAll = async () => {
    try {
      await downloadUrlAsFile(
        `${jsonServerBaseUrl}/matrix/export-all`,
        'matrix-all-export.csv',
      )
      setSnackbar('Global matrix export downloaded.')
    } catch (err) {
      setSnackbar(err instanceof Error ? err.message : 'Failed to export all matrix data.')
    }
  }

  return (
    <>
      <Paper className="panel-full" elevation={0}>
        {/* Header */}
        <Box className="panel-section">
          <Typography variant="h6">Authorization Profile Matrix</Typography>
          <Typography variant="caption" color="text.secondary">
            {isProfileMode
              ? 'Profile Code mode: grouped matrix sections for selected authorization profile codes.'
              : 'Broad filter mode: flat matrix table with server-side pagination.'}{' '}
            Showing {returned.toLocaleString()} of {total.toLocaleString()} matched records.
          </Typography>
        </Box>

        {/* Filter: Auth profile code multi-select */}
        <Box className="panel-section matrix-page-filter-row">
          <Autocomplete
            multiple
            options={allProfileCodes}
            value={selectedProfileCodes}
            onChange={(_, newValue) => handleProfileCodesChange(newValue)}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Filter by Auth Profile Code"
                size="small"
                placeholder={
                  selectedProfileCodes.length === 0 ? 'Select one or more profiles…' : ''
                }
              />
            )}
            renderTags={(value, getTagProps) =>
              value.map((option, index) => (
                <Chip label={option} size="small" {...getTagProps({ index })} />
              ))
            }
            disableCloseOnSelect
            sx={{ flex: 1 }}
          />
          <FormControl size="small" sx={{ minWidth: 130 }}>
            <InputLabel>Region</InputLabel>
            <Select
              label="Region"
              value={regionFilter}
              onChange={(e) => {
                handleBroadFilterChange(setRegionFilter, e.target.value)
              }}
            >
              <MenuItem value="">All</MenuItem>
              {regionOptions.map((option) => (
                <MenuItem key={option} value={option}>
                  {option}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 140 }}>
            <InputLabel>Sub-Region</InputLabel>
            <Select
              label="Sub-Region"
              value={subRegionFilter}
              onChange={(e) => {
                handleBroadFilterChange(setSubRegionFilter, e.target.value)
              }}
            >
              <MenuItem value="">All</MenuItem>
              {subRegionOptions.map((option) => (
                <MenuItem key={option} value={option}>
                  {option}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 130 }}>
            <InputLabel>Country</InputLabel>
            <Select
              label="Country"
              value={countryFilter}
              onChange={(e) => {
                handleBroadFilterChange(setCountryFilter, e.target.value)
              }}
            >
              <MenuItem value="">All</MenuItem>
              {countryOptions.map((option) => (
                <MenuItem key={option} value={option}>
                  {option}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Business Group</InputLabel>
            <Select
              label="Business Group"
              value={businessGroupFilter}
              onChange={(e) => {
                handleBroadFilterChange(setBusinessGroupFilter, e.target.value)
              }}
            >
              <MenuItem value="">All</MenuItem>
              {businessGroupOptions.map((option) => (
                <MenuItem key={option} value={option}>
                  {option}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 140 }}>
            <InputLabel>Business Unit</InputLabel>
            <Select
              label="Business Unit"
              value={businessUnitFilter}
              onChange={(e) => {
                handleBroadFilterChange(setBusinessUnitFilter, e.target.value)
              }}
            >
              <MenuItem value="">All</MenuItem>
              {businessUnitOptions.map((option) => (
                <MenuItem key={option} value={option}>
                  {option}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'nowrap', alignSelf: 'center' }}>
            {isLoading ? (
              <CircularProgress size={16} sx={{ mr: 1 }} />
            ) : (
              <>
                {returned.toLocaleString()} of {total.toLocaleString()} shown
              </>
            )}
          </Typography>
        </Box>

        <Alert severity="info" sx={{ mb: 1.5 }}>
          Current mode: {mode === 'profile-codes' ? 'Profile Code (grouped)' : 'Broad Filter (flat)'}
        </Alert>

        {mode === 'profile-codes' && isCapped && (
          <Alert severity="warning" sx={{ mb: 1.5 }}>
            Grouped profile-code results were capped at {maxRows.toLocaleString()} rows. Narrow selection or filters to load more relevant rows.
          </Alert>
        )}

        {/* Error state */}
        {error && (
          <Alert severity="error" sx={{ mb: 1.5 }}>
            {error}
          </Alert>
        )}

        {/* Toolbar */}
        <ActionToolbar
          actions={[
            { label: 'Add Profile', kind: 'add', onClick: () => setSnackbar('Add action is mocked.') },
            {
              label: 'Delete',
              kind: 'delete',
              onClick: handleDeleteMatrix,
              disabled: selectedMatrixIds.length === 0 || isLoading,
            },
            { label: 'Import', kind: 'import', onClick: () => {} },
            {
              label: 'Validate',
              kind: 'validate',
              onClick: () => setSnackbar('Validation complete: no blocking errors found.'),
            },
            {
              label: 'Export',
              kind: 'export',
              onClick: handleExportFiltered,
            },
            {
              label: 'Export All Matrix',
              kind: 'export',
              onClick: handleExportAll,
            },
          ]}
          trailing={
            <FormControl sx={{ minWidth: 180 }} size="small">
              <InputLabel>Group By</InputLabel>
              <Select
                label="Group By"
                value={isProfileMode ? 'Auth Profile Code' : 'Flat Table'}
                disabled
              >
                <MenuItem value="Auth Profile Code">Auth Profile Code</MenuItem>
                <MenuItem value="Flat Table">Flat Table</MenuItem>
              </Select>
            </FormControl>
          }
        />

        {/* Active filter summary */}
        <Box className="panel-section" sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Chip size="small" variant="outlined" label={`Profile Codes: ${appliedFilters.profileCodes.length || 0}`} />
          <Chip size="small" variant="outlined" label={`Region: ${appliedFilters.region || 'All'}`} />
          <Chip size="small" variant="outlined" label={`Sub-Region: ${appliedFilters.subRegion || 'All'}`} />
          <Chip size="small" variant="outlined" label={`Country: ${appliedFilters.country || 'All'}`} />
          <Chip size="small" variant="outlined" label={`Business Group: ${appliedFilters.businessGroup || 'All'}`} />
          <Chip size="small" variant="outlined" label={`Business Unit: ${appliedFilters.businessUnit || 'All'}`} />
        </Box>

        {/* Meta row */}
        <Box className="panel-section panel-meta-row">
          <Typography variant="caption">
            Data source: {dataSource === 'json-server' ? 'json-server' : 'local fallback'}
          </Typography>
          <Typography variant="caption">Selected rows: {selectedMatrixIds.length}</Typography>
        </Box>

        {/* Matrix groups with loading overlay */}
        <Box
          className="matrix-page-groups enterprise-scroll"
          sx={{ position: 'relative', opacity: isLoading ? 0.6 : 1 }}
        >
          {isProfileMode
            ? Object.entries(groupedRecords).map(([authProfileCode, recs]) => (
                <MatrixGroupSection
                  key={authProfileCode}
                  authProfileCode={authProfileCode}
                  records={recs}
                  expanded={expandedGroups[authProfileCode] ?? true}
                  selectedMatrixIds={selectedMatrixIds}
                  onToggleExpanded={() => handleToggleExpanded(authProfileCode)}
                  onRowSelectionChange={handleRowSelectionChange}
                  onGroupSelectionChange={handleGroupSelectionChange}
                />
              ))
            : (
              <TableContainer className="table-container">
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell padding="checkbox"></TableCell>
                      <TableCell>Auth Profile Code</TableCell>
                      <TableCell>Region</TableCell>
                      <TableCell>Sub-Region</TableCell>
                      <TableCell>Country</TableCell>
                      <TableCell>Business Group</TableCell>
                      <TableCell>Business Unit</TableCell>
                      <TableCell>PL Code</TableCell>
                      <TableCell>PF Code</TableCell>
                      <TableCell>Max PL %</TableCell>
                      <TableCell>Min Margin %</TableCell>
                      <TableCell>Updated By</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {localRecords.map((record) => {
                      const checked = selectedMatrixIds.includes(record.id)
                      return (
                        <TableRow
                          key={record.id}
                          hover
                          selected={checked}
                          sx={{ backgroundColor: checked ? '#edf4ff' : undefined }}
                        >
                          <TableCell padding="checkbox">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={(event) =>
                                handleRowSelectionChange(record.id, event.target.checked)
                              }
                            />
                          </TableCell>
                          <TableCell>{record.authProfileCode}</TableCell>
                          <TableCell>{record.region}</TableCell>
                          <TableCell>{record.subRegion}</TableCell>
                          <TableCell>{record.country}</TableCell>
                          <TableCell>{record.businessGroup}</TableCell>
                          <TableCell>{record.businessUnit}</TableCell>
                          <TableCell>{record.productLine}</TableCell>
                          <TableCell>{record.pfCode}</TableCell>
                          <TableCell>{record.maxPlPercent}</TableCell>
                          <TableCell>{record.minMarginPercent}</TableCell>
                          <TableCell>{record.updatedBy}</TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          {Object.keys(groupedRecords).length === 0 && !isLoading && (
            <Paper variant="outlined" className="empty-state">
              <Typography variant="body2">
                No matrix records found for the selected filters.
              </Typography>
            </Paper>
          )}
          {isLoading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          )}
        </Box>

        {mode === 'broad' && (
          <Box className="profiles-page-pagination">
            <FormControl size="small" sx={{ minWidth: 130 }}>
              <InputLabel>Page Size</InputLabel>
              <Select
                label="Page Size"
                value={matrixPageSize}
                onChange={(event) => {
                  setMatrixPageSize(event.target.value as number)
                  setMatrixPage(1)
                }}
              >
                <MenuItem value={100}>100 rows</MenuItem>
                <MenuItem value={200}>200 rows</MenuItem>
                <MenuItem value={500}>500 rows</MenuItem>
              </Select>
            </FormControl>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <button
                onClick={() => setMatrixPage((p) => Math.max(1, p - 1))}
                disabled={matrixPage <= 1 || isLoading}
                className="pagination-btn"
              >
                Previous
              </button>
              <Typography variant="caption">
                Page {page} of {totalPages}
              </Typography>
              <button
                onClick={() => setMatrixPage((p) => Math.min(totalPages, p + 1))}
                disabled={matrixPage >= totalPages || isLoading}
                className="pagination-btn"
              >
                Next
              </button>
            </Box>
          </Box>
        )}

        {/* Bulk edit */}
        {selectedMatrixRecords.length > 0 && (
          <BulkEditPanel
            selectedCount={selectedMatrixRecords.length}
            form={bulkEditForm}
            onFormChange={setBulkEditForm}
            onUpdate={handleApplyBulkEdit}
            onClearSelection={() => setSelectedMatrixIds([])}
          />
        )}
      </Paper>

      {/* Snackbar */}
      <Snackbar
        open={Boolean(snackbar)}
        autoHideDuration={4000}
        onClose={() => setSnackbar('')}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        <Alert onClose={() => setSnackbar('')} severity="info" sx={{ width: '100%' }}>
          {snackbar}
        </Alert>
      </Snackbar>
    </>
  )
}
