import { Box, Checkbox, FormControlLabel, FormGroup, Menu, Typography } from '@mui/material'

type ColumnOption = {
  key: string
  label: string
}

type ColumnVisibilityMenuProps = {
  anchorEl: HTMLElement | null
  title: string
  options: ColumnOption[]
  visibleMap: Record<string, boolean>
  onToggle: (key: string) => void
  onClose: () => void
  minVisible?: number
}

export function ColumnVisibilityMenu({
  anchorEl,
  title,
  options,
  visibleMap,
  onToggle,
  onClose,
  minVisible = 1,
}: ColumnVisibilityMenuProps) {
  const open = Boolean(anchorEl)
  const visibleCount = options.filter((option) => visibleMap[option.key]).length

  return (
    <Menu
      anchorEl={anchorEl}
      open={open}
      onClose={onClose}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      transformOrigin={{ vertical: 'top', horizontal: 'right' }}
    >
      <Box sx={{ px: 2, py: 1.5, minWidth: 250 }}>
        <Typography variant="subtitle2" sx={{ mb: 0.75 }}>
          {title}
        </Typography>
        <FormGroup>
          {options.map((option) => {
            const checked = Boolean(visibleMap[option.key])
            const disableUncheck = checked && visibleCount <= minVisible

            return (
              <FormControlLabel
                key={option.key}
                control={
                  <Checkbox
                    size="small"
                    checked={checked}
                    disabled={disableUncheck}
                    onChange={() => onToggle(option.key)}
                  />
                }
                label={<Typography sx={{ fontSize: '0.82rem' }}>{option.label}</Typography>}
              />
            )
          })}
        </FormGroup>
      </Box>
    </Menu>
  )
}
