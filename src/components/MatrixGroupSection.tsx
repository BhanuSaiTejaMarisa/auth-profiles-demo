import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight'
import { Box, Chip, IconButton, Paper, Typography } from '@mui/material'
import { FixedSizeList, type ListChildComponentProps } from 'react-window'
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

const ROW_HEIGHT = 34
const MAX_LIST_HEIGHT = 320

type RowData = {
  records: MatrixRecord[]
  selectedMatrixIds: string[]
  onRowSelectionChange: (recordId: string, checked: boolean) => void
}

function VirtualRow({ index, style, data }: ListChildComponentProps<RowData>) {
  const record = data.records[index]
  const checked = data.selectedMatrixIds.includes(record.id)

  return (
    <Box
      style={style}
      className="matrix-grid-row"
      sx={{
        display: 'grid',
        gridTemplateColumns: '36px repeat(12, minmax(88px, 1fr))',
        alignItems: 'center',
        borderBottom: '1px solid #e3e9f3',
        backgroundColor: checked ? '#edf4ff' : '#fff',
        px: 1,
      }}
    >
      <Box>
        <input
          type="checkbox"
          checked={checked}
          onChange={(event) => data.onRowSelectionChange(record.id, event.target.checked)}
        />
      </Box>
      <Box>{record.businessUnit}</Box>
      <Box>{record.productLine}</Box>
      <Box>{record.pfCode}</Box>
      <Box>{record.maxPlPercent}</Box>
      <Box>{record.minMarginPercent}</Box>
      <Box>{record.authMarginFlag}</Box>
      <Box>{record.plSumAuth}</Box>
      <Box>{record.maxLineAmount}</Box>
      <Box>{record.dealType}</Box>
      <Box>{record.startDate}</Box>
      <Box>{record.endDate}</Box>
      <Box>{record.updatedBy}</Box>
    </Box>
  )
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
        <Box>
          <Box
            className="matrix-grid-header"
            sx={{
              display: 'grid',
              gridTemplateColumns: '36px repeat(12, minmax(88px, 1fr))',
              alignItems: 'center',
              px: 1,
              py: 0.75,
              borderBottom: '1px solid #e3e9f3',
              backgroundColor: '#f7f9fc',
              color: '#425066',
              fontSize: '0.72rem',
              fontWeight: 700,
            }}
          >
            <Box></Box>
            <Box>Bus Unit</Box>
            <Box>PL Code</Box>
            <Box>PF Code</Box>
            <Box>Max PL %</Box>
            <Box>Min Margin %</Box>
            <Box>Auth Margin</Box>
            <Box>PL Sum Auth</Box>
            <Box>Max Line Amt</Box>
            <Box>Deal Type</Box>
            <Box>Start Effective Date</Box>
            <Box>End Effective Date</Box>
            <Box>Updated By</Box>
          </Box>

          <FixedSizeList
            height={Math.min(records.length * ROW_HEIGHT, MAX_LIST_HEIGHT)}
            itemCount={records.length}
            itemSize={ROW_HEIGHT}
            width="100%"
            overscanCount={8}
            itemData={{ records, selectedMatrixIds, onRowSelectionChange }}
          >
            {VirtualRow}
          </FixedSizeList>
        </Box>
      )}
    </Paper>
  )
}