import { useMemo, useState } from 'react'
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
  TextField,
  Typography,
} from '@mui/material'
import { ActionToolbar } from '../components/ActionToolbar'
import { BulkEditPanel } from '../components/BulkEditPanel'
import { MatrixGroupSection } from '../components/MatrixGroupSection'
import { useMatrixData } from '../hooks'
import { mockProfiles, createBulkEditSeed } from '../data/mockData'
import type { MatrixRecord, BulkEditFormState } from '../types'
import type { MatrixRecord as ApiMatrixRecord } from '../services/MatrixApiService'

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
  const [pageSize, setPageSize] = useState(100)

  // ====== API Hook (filters + paginates automatically) ======
  const {
    records: apiRecords,
    total,
    page,
    totalPages,
    isLoading,
    error,
    setPage,
  } = useMatrixData({
    authProfileCodes: selectedProfileCodes,
    page: 1,
    pageSize,
  })

  // ====== Transform API records to component format ======
  const records = useMemo(() => apiRecords.map(adaptApiRecord), [apiRecords])

  // ====== Derived data: Group current page records by profile code ======
  const groupedRecords = useMemo(
    () =>
      records.reduce<Record<string, MatrixRecord[]>>((groups, record) => {
        if (!groups[record.authProfileCode]) groups[record.authProfileCode] = []
        groups[record.authProfileCode].push(record)
        return groups
      }, {}),
    [records],
  )

  const selectedMatrixRecords = useMemo(
    () => records.filter((r) => selectedMatrixIds.includes(r.id)),
    [records, selectedMatrixIds],
  )

  // ====== Handlers ======
  const handleRowSelectionChange = (recordId: string, checked: boolean) => {
    setSelectedMatrixIds((current) => {
      const next = checked ? [...current, recordId] : current.filter((id) => id !== recordId)
      const firstRecord = records.find((r) => r.id === next[0])
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
    setSelectedMatrixIds([])
    setSnackbar('Selected matrix rows would be deleted (mocked).')
  }

  const handleApplyBulkEdit = () => {
    if (!selectedMatrixIds.length) {
      setSnackbar('Select one or more matrix rows before updating them.')
      return
    }
    setSnackbar('Selected matrix rows would be updated (mocked).')
  }

  const handleToggleExpanded = (code: string) => {
    setExpandedGroups((current) => ({ ...current, [code]: !(current[code] ?? true) }))
  }

  const handleProfileCodesChange = (codes: string[]) => {
    setSelectedProfileCodes(codes)
    setSelectedMatrixIds([])
    setPage(1)
  }

  return (
    <>
      <Paper className="panel-full" elevation={0}>
        {/* Header */}
        <Box className="panel-section">
          <Typography variant="h6">Authorization Profile Matrix</Typography>
          <Typography variant="caption" color="text.secondary">
            Real-time paginated view: {total.toLocaleString()} total records across selected profiles.
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
          <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'nowrap', alignSelf: 'center' }}>
            {isLoading ? (
              <CircularProgress size={16} sx={{ mr: 1 }} />
            ) : (
              <>
                {records.length} of {total.toLocaleString()} shown
              </>
            )}
          </Typography>
        </Box>

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
              onClick: () => setSnackbar('Export action is mocked.'),
            },
          ]}
          trailing={
            <FormControl sx={{ minWidth: 180 }} size="small">
              <InputLabel>Group By</InputLabel>
              <Select label="Group By" value="Auth Profile Code" disabled>
                <MenuItem value="Auth Profile Code">Auth Profile Code</MenuItem>
              </Select>
            </FormControl>
          }
        />

        {/* Meta row */}
        <Box className="panel-section panel-meta-row">
          <Typography variant="caption">
            Page {page} of {totalPages || 1}
          </Typography>
          <Typography variant="caption">Selected rows: {selectedMatrixIds.length}</Typography>
        </Box>

        {/* Matrix groups with loading overlay */}
        <Box
          className="matrix-page-groups enterprise-scroll"
          sx={{ position: 'relative', opacity: isLoading ? 0.6 : 1 }}
        >
          {Object.entries(groupedRecords).map(([authProfileCode, recs]) => (
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
          ))}
          {Object.keys(groupedRecords).length === 0 && !isLoading && (
            <Paper variant="outlined" className="empty-state">
              <Typography variant="body2">
                {selectedProfileCodes.length === 0
                  ? 'Select one or more authorization profile codes above to view matrix records.'
                  : 'No matrix records found for the selected authorization profiles.'}
              </Typography>
            </Paper>
          )}
          {isLoading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          )}
        </Box>

        {/* Pagination controls */}
        {totalPages > 1 && (
          <Box className="matrix-page-pagination" sx={{ borderTop: '1px solid #e0e0e0', pt: 1.5 }}>
            <FormControl size="small" sx={{ minWidth: 110 }}>
              <InputLabel>Page Size</InputLabel>
              <Select
                label="Page Size"
                value={pageSize}
                onChange={(e) => setPageSize(e.target.value as number)}
                disabled={isLoading}
              >
                <MenuItem value={50}>50 rows</MenuItem>
                <MenuItem value={100}>100 rows</MenuItem>
                <MenuItem value={200}>200 rows</MenuItem>
                <MenuItem value={500}>500 rows</MenuItem>
              </Select>
            </FormControl>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <button
                onClick={() => setPage(page - 1)}
                disabled={page <= 1 || isLoading}
                className="pagination-btn"
              >
                Previous
              </button>
              <Typography variant="caption">
                Page {page} of {totalPages}
              </Typography>
              <button
                onClick={() => setPage(page + 1)}
                disabled={page >= totalPages || isLoading}
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
