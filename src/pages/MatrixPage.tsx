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
  TextField,
  Typography,
} from '@mui/material'
import { ActionToolbar } from '../components/ActionToolbar'
import { BulkEditPanel } from '../components/BulkEditPanel'
import { MatrixGroupSection } from '../components/MatrixGroupSection'
import { useMatrixData } from '../hooks'
import { mockProfiles, createBulkEditSeed } from '../data/mockData'
import { MatrixService } from '../services'
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
  const [localRecords, setLocalRecords] = useState<MatrixRecord[]>([])

  // ====== API Hook (filter-first + capped results) ======
  const {
    records: apiRecords,
    total,
    returned,
    isCapped,
    dataSource,
    maxRows,
    isLoading,
    error,
  } = useMatrixData({
    authProfileCodes: selectedProfileCodes,
    maxRows: 3000,
  })

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
    setSelectedProfileCodes(codes)
    setSelectedMatrixIds([])
  }

  return (
    <>
      <Paper className="panel-full" elevation={0}>
        {/* Header */}
        <Box className="panel-section">
          <Typography variant="h6">Authorization Profile Matrix</Typography>
          <Typography variant="caption" color="text.secondary">
            Filter-first matrix view for PM/PO UX review. Showing up to {maxRows.toLocaleString()} rows from {total.toLocaleString()} matched records.
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
                {returned.toLocaleString()} of {total.toLocaleString()} shown
              </>
            )}
          </Typography>
        </Box>

        {isCapped && (
          <Alert severity="info" sx={{ mb: 1.5 }}>
            Result set capped at {maxRows.toLocaleString()} rows for UI smoothness. Add more filters to narrow the dataset.
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
            Data source: {dataSource === 'json-server' ? 'json-server' : 'local fallback'}
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
