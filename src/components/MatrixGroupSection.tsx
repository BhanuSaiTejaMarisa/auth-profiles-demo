import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight'
import { Box, Chip, IconButton, Paper, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material'
import type { MatrixRecord } from '../types'

type MatrixGroupSectionProps = {
  authProfileCode: string
  records: MatrixRecord[]
  expanded: boolean
  selectedMatrixIds: string[]
  onToggleExpanded: () => void
  onRowSelectionChange: (recordId: string, checked: boolean) => void
  onGroupSelectionChange: (recordIds: string[], checked: boolean) => void
}

export function MatrixGroupSection({
  authProfileCode,
  records,
  expanded,
  selectedMatrixIds,
  onToggleExpanded,
  onRowSelectionChange,
  onGroupSelectionChange,
}: MatrixGroupSectionProps) {
  const groupIds = records.map((record) => record.id)
  const isGroupSelected = groupIds.every((id) => selectedMatrixIds.includes(id))

  return (
    <Paper variant="outlined" sx={{ mb: 1.25, borderColor: '#d8e1ee', borderRadius: 1 }}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 1,
          py: 0.75,
          backgroundColor: '#f8fbff',
          borderBottom: expanded ? '1px solid #e3e9f3' : 'none',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <IconButton size="small" onClick={onToggleExpanded}>
            {expanded ? <ExpandMoreIcon fontSize="small" /> : <KeyboardArrowRightIcon fontSize="small" />}
          </IconButton>
          <Typography variant="subtitle2" sx={{ fontSize: '0.8rem' }}>
            Auth Profile Code: {authProfileCode}
          </Typography>
          <Chip size="small" label={`${records.length} records`} sx={{ height: 20, fontSize: '0.68rem' }} />
        </Box>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#5b6880' }}>
          <input
            type="checkbox"
            checked={isGroupSelected && records.length > 0}
            onChange={(event) => onGroupSelectionChange(groupIds, event.target.checked)}
          />
          Select Group
        </label>
      </Box>

      {expanded && (
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox"></TableCell>
              <TableCell>Bus Unit</TableCell>
              <TableCell>PL Code</TableCell>
              <TableCell>PF Code</TableCell>
              <TableCell>Max PL %</TableCell>
              <TableCell>Min Margin %</TableCell>
              <TableCell>Auth Margin</TableCell>
              <TableCell>PL Sum Auth</TableCell>
              <TableCell>Max Line Amt</TableCell>
              <TableCell>Deal Type</TableCell>
              <TableCell>Start Effective Date</TableCell>
              <TableCell>End Effective Date</TableCell>
              <TableCell>Updated By</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {records.map((record) => {
              const checked = selectedMatrixIds.includes(record.id)
              return (
                <TableRow key={record.id} hover selected={checked} sx={{ backgroundColor: checked ? '#edf4ff' : undefined }}>
                  <TableCell padding="checkbox">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(event) => onRowSelectionChange(record.id, event.target.checked)}
                    />
                  </TableCell>
                  <TableCell>{record.businessUnit}</TableCell>
                  <TableCell>{record.productLine}</TableCell>
                  <TableCell>{record.pfCode}</TableCell>
                  <TableCell>{record.maxPlPercent}</TableCell>
                  <TableCell>{record.minMarginPercent}</TableCell>
                  <TableCell>{record.authMarginFlag}</TableCell>
                  <TableCell>{record.plSumAuth}</TableCell>
                  <TableCell>{record.maxLineAmount}</TableCell>
                  <TableCell>{record.dealType}</TableCell>
                  <TableCell>{record.startDate}</TableCell>
                  <TableCell>{record.endDate}</TableCell>
                  <TableCell>{record.updatedBy}</TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      )}
    </Paper>
  )
}