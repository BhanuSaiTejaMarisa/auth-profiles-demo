import {
  Box,
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  TextField,
  Typography,
} from '@mui/material'
import type { BulkEditFormState } from '../types'

type BulkEditPanelProps = {
  selectedCount: number
  form: BulkEditFormState
  onFormChange: (value: BulkEditFormState) => void
  onUpdate: () => void
  onClearSelection: () => void
}

const smallFieldStyle = {
  minWidth: 92,
  '& .MuiInputBase-root': {
    fontSize: '0.75rem',
    height: 34,
  },
  '& .MuiInputLabel-root': {
    fontSize: '0.72rem',
  },
}

export function BulkEditPanel({
  selectedCount,
  form,
  onFormChange,
  onUpdate,
  onClearSelection,
}: BulkEditPanelProps) {
  const updateField = <K extends keyof BulkEditFormState>(field: K, value: BulkEditFormState[K]) => {
    onFormChange({
      ...form,
      [field]: value,
    })
  }

  return (
    <Paper
      variant="outlined"
      sx={{
        mt: 1.5,
        p: 1.25,
        borderRadius: 1,
        borderColor: '#d8e1ee',
        backgroundColor: '#fafcff',
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1, mb: 1.2, flexWrap: 'wrap' }}>
        <Typography variant="subtitle2" sx={{ fontSize: '0.82rem', fontWeight: 700 }}>
          Edit Selected Matrix Record(s) {selectedCount ? `(${selectedCount} selected)` : ''}
        </Typography>
        <Button size="small" variant="text" onClick={onClearSelection} disabled={!selectedCount}>
          Clear Selection
        </Button>
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(80px, 1fr))', gap: 1, mb: 1 }}>
        <FormControl sx={smallFieldStyle}>
          <InputLabel>Region</InputLabel>
          <Select label="Region" value={form.region} onChange={(event) => updateField('region', event.target.value)}>
            <MenuItem value="AP">AP</MenuItem>
            <MenuItem value="NA">NA</MenuItem>
            <MenuItem value="EMEA">EMEA</MenuItem>
            <MenuItem value="LA">LA</MenuItem>
          </Select>
        </FormControl>
        <TextField label="Sub Region" value={form.subRegion} onChange={(event) => updateField('subRegion', event.target.value)} sx={smallFieldStyle} />
        <TextField label="Cntry Cd" value={form.country} onChange={(event) => updateField('country', event.target.value)} sx={smallFieldStyle} />
        <TextField label="Bus Group Cd" value={form.businessGroup} onChange={(event) => updateField('businessGroup', event.target.value)} sx={smallFieldStyle} />
        <TextField label="Bus Unit Cd" value={form.businessUnit} onChange={(event) => updateField('businessUnit', event.target.value)} sx={smallFieldStyle} />
        <TextField label="PL Code" value={form.productLine} onChange={(event) => updateField('productLine', event.target.value)} sx={smallFieldStyle} />
        <TextField label="PF Code" value={form.pfCode} onChange={(event) => updateField('pfCode', event.target.value)} sx={smallFieldStyle} />
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(6, minmax(92px, 1fr)) 180px', gap: 1, alignItems: 'end' }}>
        <TextField label="Max PL %" value={form.maxPlPercent} onChange={(event) => updateField('maxPlPercent', event.target.value)} sx={smallFieldStyle} />
        <TextField label="Min Margin %" value={form.minMarginPercent} onChange={(event) => updateField('minMarginPercent', event.target.value)} sx={smallFieldStyle} />
        <FormControl sx={smallFieldStyle}>
          <InputLabel>Auth By Margin</InputLabel>
          <Select label="Auth By Margin" value={form.authMarginFlag} onChange={(event) => updateField('authMarginFlag', event.target.value as 'Y' | 'N')}>
            <MenuItem value="Y">Y</MenuItem>
            <MenuItem value="N">N</MenuItem>
          </Select>
        </FormControl>
        <FormControl sx={smallFieldStyle}>
          <InputLabel>PL Sum Auth</InputLabel>
          <Select label="PL Sum Auth" value={form.plSumAuth} onChange={(event) => updateField('plSumAuth', event.target.value as 'Y' | 'N')}>
            <MenuItem value="Y">Y</MenuItem>
            <MenuItem value="N">N</MenuItem>
          </Select>
        </FormControl>
        <TextField label="Max Line Amt" value={form.maxLineAmount} onChange={(event) => updateField('maxLineAmount', event.target.value)} sx={smallFieldStyle} />
        <TextField label="Deal Type" value={form.dealType} onChange={(event) => updateField('dealType', event.target.value)} sx={smallFieldStyle} />
        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button variant="contained" onClick={onUpdate} disabled={!selectedCount} sx={{ minWidth: 160, height: 34 }}>
            Update Selected Records
          </Button>
        </Box>
      </Box>
    </Paper>
  )
}