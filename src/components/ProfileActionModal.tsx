import {
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControlLabel,
  FormGroup,
  Paper,
  Typography,
} from '@mui/material'
import {
  businessGroupOptions,
  businessUnitOptions,
  countryOptions,
  productLineOptions,
  regionOptions,
  subRegionOptions,
} from '../data/mockData'
import type { ModalFormState, ModalMode } from '../types'

type ProfileActionModalProps = {
  open: boolean
  mode: ModalMode
  scope: 'profile' | 'matrix'
  value: ModalFormState
  onChange: (value: ModalFormState) => void
  onClose: () => void
  onApply: () => void
}

type OptionGroupProps = {
  title: string
  options: string[]
  selected: string[]
  field: keyof ModalFormState
  onToggle: (field: keyof ModalFormState, option: string) => void
}

function OptionGroup({ title, options, selected, field, onToggle }: OptionGroupProps) {
  return (
    <Paper variant="outlined" sx={{ p: 1, minHeight: 132, borderColor: '#d9e2ef', borderRadius: 1 }}>
      <Typography variant="caption" sx={{ display: 'block', mb: 0.5, color: '#516178', fontWeight: 700 }}>
        {title}
      </Typography>
      <FormGroup>
        {options.map((option) => (
          <FormControlLabel
            key={option}
            control={
              <Checkbox
                size="small"
                checked={selected.includes(option)}
                onChange={() => onToggle(field, option)}
              />
            }
            label={<Typography sx={{ fontSize: '0.76rem' }}>{option}</Typography>}
          />
        ))}
      </FormGroup>
    </Paper>
  )
}

export function ProfileActionModal({
  open,
  mode,
  scope,
  value,
  onChange,
  onClose,
  onApply,
}: ProfileActionModalProps) {
  const toggleValue = (field: keyof ModalFormState, option: string) => {
    const current = value[field]
    const next = current.includes(option)
      ? current.filter((item) => item !== option)
      : [...current, option]

    onChange({
      ...value,
      [field]: next,
    })
  }

  const modeLabel = mode === 'add' ? 'Add Authorization Profile' : 'Filter Authorization Profiles'
  const scopeLabel = scope === 'matrix' ? 'Matrix Workspace' : 'Generic Authorization Profiles'

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle sx={{ pb: 1 }}>{modeLabel}</DialogTitle>
      <DialogContent dividers>
        <Typography variant="caption" color="text.secondary">
          {scopeLabel} • Reusable enterprise dialog with prop-driven layout.
        </Typography>
        <Divider sx={{ my: 1.5 }} />
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(220px, 1fr))', gap: 1.2 }}>
          <OptionGroup title="Select Region" options={regionOptions} selected={value.region} field="region" onToggle={toggleValue} />
          <OptionGroup title="Select Sub Region" options={subRegionOptions} selected={value.subRegion} field="subRegion" onToggle={toggleValue} />
          <OptionGroup title="Select Country" options={countryOptions} selected={value.countries} field="countries" onToggle={toggleValue} />
          <OptionGroup title="Business Group" options={businessGroupOptions} selected={value.businessGroup} field="businessGroup" onToggle={toggleValue} />
          <OptionGroup title="Business Unit" options={businessUnitOptions} selected={value.businessUnit} field="businessUnit" onToggle={toggleValue} />
          <OptionGroup title="Product Line" options={productLineOptions} selected={value.productLines} field="productLines" onToggle={toggleValue} />
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 1.5 }}>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={onApply}>
          {mode === 'add' ? 'Apply and Add' : 'Apply Filter'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}