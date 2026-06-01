import { FC } from 'react'
import {
  Box,
  Chip,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Typography,
} from '@mui/material'
import { ActionToolbar } from '../ActionToolbar'
import { MatrixGroupSection } from '../MatrixGroupSection'
import { BulkEditPanel } from '../BulkEditPanel'
import type { Profile, MatrixRecord } from '../../types'

interface MatrixPanelProps {
  selectedProfiles: Profile[]
  groupedMatrixRecords: Record<string, MatrixRecord[]>
  expandedGroups: Record<string, boolean>
  selectedMatrixIds: string[]
  selectedMatrixRecords: MatrixRecord[]
  bulkEditForm: any
  onToggleExpanded: (profileCode: string) => void
  onRowSelectionChange: (recordId: string, checked: boolean) => void
  onGroupSelectionChange: (recordIds: string[], checked: boolean) => void
  onAddClick: () => void
  onDeleteClick: () => void
  onFilterClick: () => void
  onValidateClick: () => void
  onExportClick: () => void
  onBulkEditFormChange: (form: any) => void
  onBulkEditApply: () => void
  onBulkEditClearSelection: () => void
  canDelete: boolean
}

export const MatrixPanel: FC<MatrixPanelProps> = ({
  selectedProfiles,
  groupedMatrixRecords,
  expandedGroups,
  selectedMatrixIds,
  selectedMatrixRecords,
  bulkEditForm,
  onToggleExpanded,
  onRowSelectionChange,
  onGroupSelectionChange,
  onAddClick,
  onDeleteClick,
  onFilterClick,
  onValidateClick,
  onExportClick,
  onBulkEditFormChange,
  onBulkEditApply,
  onBulkEditClearSelection,
  canDelete,
}) => {
  return (
    <Paper className="panel panel-right" elevation={0}>
      <Box className="panel-section right-header-row">
        <Box>
          <Typography variant="h6">Authorization Profile Matrix</Typography>
          <Typography variant="caption" color="text.secondary">
            Records grouped by authorization profile code for high-density maintenance work.
          </Typography>
        </Box>
        <Box className="selected-chip-list">
          {selectedProfiles.map((profile) => (
            <Chip key={profile.id} size="small" label={profile.code} />
          ))}
        </Box>
      </Box>

      <ActionToolbar
        actions={[
          { label: 'Add Profile', kind: 'add', onClick: onAddClick },
          { label: 'Delete Profile', kind: 'delete', onClick: onDeleteClick, disabled: !canDelete },
          { label: 'Import', kind: 'import', onClick: () => {} },
          { label: 'Validate', kind: 'validate', onClick: onValidateClick },
          { label: 'Export', kind: 'export', onClick: onExportClick },
          { label: 'Filter', kind: 'filter', onClick: onFilterClick },
        ]}
        trailing={
          <FormControl sx={{ minWidth: 180 }}>
            <InputLabel>Group By</InputLabel>
            <Select label="Group By" value="Auth Profile Code" disabled>
              <MenuItem value="Auth Profile Code">Auth Profile Code</MenuItem>
            </Select>
          </FormControl>
        }
      />

      <Box className="panel-section panel-meta-row">
        <Typography variant="caption">Matrix View</Typography>
        <Typography variant="caption">Show Only Differences</Typography>
      </Box>

      <Box className="group-section enterprise-scroll">
        {Object.entries(groupedMatrixRecords).map(([authProfileCode, records]) => (
          <MatrixGroupSection
            key={authProfileCode}
            authProfileCode={authProfileCode}
            records={records}
            expanded={expandedGroups[authProfileCode] ?? true}
            selectedMatrixIds={selectedMatrixIds}
            onToggleExpanded={() => onToggleExpanded(authProfileCode)}
            onRowSelectionChange={onRowSelectionChange}
            onGroupSelectionChange={onGroupSelectionChange}
          />
        ))}
        {!Object.keys(groupedMatrixRecords).length && (
          <Paper variant="outlined" className="empty-state">
            <Typography variant="body2">
              Select profiles on the left or clear the workspace filter to populate the matrix workspace.
            </Typography>
          </Paper>
        )}
      </Box>

      <BulkEditPanel
        selectedCount={selectedMatrixRecords.length}
        form={bulkEditForm}
        onFormChange={onBulkEditFormChange}
        onUpdate={onBulkEditApply}
        onClearSelection={onBulkEditClearSelection}
      />
    </Paper>
  )
}
