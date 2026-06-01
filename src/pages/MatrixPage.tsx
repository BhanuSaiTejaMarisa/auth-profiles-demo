import { useMemo, useState } from 'react'
import {
  Alert,
  Autocomplete,
  Box,
  Chip,
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
import { MatrixService } from '../services/index'
import { mockProfiles, mockMatrixRecords, createBulkEditSeed } from '../data/mockData'
import type { MatrixRecord, BulkEditFormState } from '../types'

// All available auth profile codes for the filter
const allProfileCodes = mockProfiles.map((p) => p.code)

export function MatrixPage() {
  // ====== State ======
  const [matrixRecords, setMatrixRecords] = useState<MatrixRecord[]>(mockMatrixRecords)
  const [selectedProfileCodes, setSelectedProfileCodes] = useState<string[]>([
    mockProfiles[0].code,
    mockProfiles[1].code,
    mockProfiles[2].code,
  ])
  const [selectedMatrixIds, setSelectedMatrixIds] = useState<string[]>([])
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({})
  const [bulkEditForm, setBulkEditForm] = useState<BulkEditFormState>(createBulkEditSeed())
  const [snackbar, setSnackbar] = useState<string>('')

  // ====== Derived data ======
  const filteredRecords = useMemo(
    () =>
      selectedProfileCodes.length > 0
        ? matrixRecords.filter((r) => selectedProfileCodes.includes(r.authProfileCode))
        : [],
    [matrixRecords, selectedProfileCodes],
  )

  const groupedRecords = useMemo(
    () =>
      filteredRecords.reduce<Record<string, MatrixRecord[]>>((groups, record) => {
        if (!groups[record.authProfileCode]) groups[record.authProfileCode] = []
        groups[record.authProfileCode].push(record)
        return groups
      }, {}),
    [filteredRecords],
  )

  const selectedMatrixRecords = useMemo(
    () => matrixRecords.filter((r) => selectedMatrixIds.includes(r.id)),
    [matrixRecords, selectedMatrixIds],
  )

  // ====== Handlers ======
  const handleRowSelectionChange = (recordId: string, checked: boolean) => {
    setSelectedMatrixIds((current) => {
      const next = checked ? [...current, recordId] : current.filter((id) => id !== recordId)
      const firstRecord = matrixRecords.find((r) => r.id === next[0])
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
    const updated = MatrixService.deleteMatrixRecords(matrixRecords, selectedMatrixIds)
    setMatrixRecords(updated)
    setSelectedMatrixIds([])
    setSnackbar('Selected matrix rows were removed locally.')
  }

  const handleApplyBulkEdit = () => {
    if (!selectedMatrixIds.length) {
      setSnackbar('Select one or more matrix rows before updating them.')
      return
    }
    const updated = MatrixService.applyBulkEdit(matrixRecords, selectedMatrixIds, bulkEditForm)
    setMatrixRecords(updated)
    setSnackbar('Selected matrix rows were updated.')
  }

  const handleToggleExpanded = (code: string) => {
    setExpandedGroups((current) => ({ ...current, [code]: !(current[code] ?? true) }))
  }

  return (
    <>
      <Paper className="panel-full" elevation={0}>
        {/* Header */}
        <Box className="panel-section">
          <Typography variant="h6">Authorization Profile Matrix</Typography>
          <Typography variant="caption" color="text.secondary">
            View and manage matrix records grouped by authorization profile code.
          </Typography>
        </Box>

        {/* Auth profile code filter */}
        <Box className="panel-section matrix-page-filter-row">
          <Autocomplete
            multiple
            options={allProfileCodes}
            value={selectedProfileCodes}
            onChange={(_, newValue) => {
              setSelectedProfileCodes(newValue)
              setSelectedMatrixIds([])
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Filter by Auth Profile Code"
                size="small"
                placeholder={selectedProfileCodes.length === 0 ? 'Select one or more profiles…' : ''}
              />
            )}
            renderTags={(value, getTagProps) =>
              value.map((option, index) => (
                <Chip
                  key={option}
                  label={option}
                  size="small"
                  {...getTagProps({ index })}
                />
              ))
            }
            disableCloseOnSelect
            sx={{ flex: 1 }}
          />
          <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'nowrap', alignSelf: 'center' }}>
            {filteredRecords.length} record{filteredRecords.length !== 1 ? 's' : ''} across{' '}
            {Object.keys(groupedRecords).length} profile{Object.keys(groupedRecords).length !== 1 ? 's' : ''}
          </Typography>
        </Box>

        {/* Toolbar */}
        <ActionToolbar
          actions={[
            { label: 'Add Profile', kind: 'add', onClick: () => setSnackbar('Add action is mocked.') },
            {
              label: 'Delete',
              kind: 'delete',
              onClick: handleDeleteMatrix,
              disabled: selectedMatrixIds.length === 0,
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
          <Typography variant="caption">Matrix View</Typography>
          <Typography variant="caption">Selected rows: {selectedMatrixIds.length}</Typography>
        </Box>

        {/* Matrix groups */}
        <Box className="matrix-page-groups enterprise-scroll">
          {Object.entries(groupedRecords).map(([authProfileCode, records]) => (
            <MatrixGroupSection
              key={authProfileCode}
              authProfileCode={authProfileCode}
              records={records}
              expanded={expandedGroups[authProfileCode] ?? true}
              selectedMatrixIds={selectedMatrixIds}
              onToggleExpanded={() => handleToggleExpanded(authProfileCode)}
              onRowSelectionChange={handleRowSelectionChange}
              onGroupSelectionChange={handleGroupSelectionChange}
            />
          ))}
          {Object.keys(groupedRecords).length === 0 && (
            <Paper variant="outlined" className="empty-state">
              <Typography variant="body2">
                {selectedProfileCodes.length === 0
                  ? 'Select one or more authorization profile codes above to view matrix records.'
                  : 'No matrix records found for the selected authorization profiles.'}
              </Typography>
            </Paper>
          )}
        </Box>

        {/* Bulk edit */}
        <BulkEditPanel
          selectedCount={selectedMatrixRecords.length}
          form={bulkEditForm}
          onFormChange={setBulkEditForm}
          onUpdate={handleApplyBulkEdit}
          onClearSelection={() => setSelectedMatrixIds([])}
        />
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
