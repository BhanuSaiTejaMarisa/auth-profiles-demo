import AddIcon from '@mui/icons-material/Add'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined'
import FilterAltOutlinedIcon from '@mui/icons-material/FilterAltOutlined'
import MoreHorizIcon from '@mui/icons-material/MoreHoriz'
import PublishOutlinedIcon from '@mui/icons-material/PublishOutlined'
import RuleFolderOutlinedIcon from '@mui/icons-material/RuleFolderOutlined'
import { Box, Button } from '@mui/material'
import type { ReactNode } from 'react'
import type { ActionKind } from '../types'

type ToolbarAction = {
  label: string
  kind: ActionKind
  onClick: () => void
  disabled?: boolean
}

const iconByKind: Record<ActionKind, ReactNode> = {
  add: <AddIcon fontSize="small" />,
  delete: <DeleteOutlineIcon fontSize="small" />,
  export: <FileDownloadOutlinedIcon fontSize="small" />,
  filter: <FilterAltOutlinedIcon fontSize="small" />,
  more: <MoreHorizIcon fontSize="small" />,
  import: <PublishOutlinedIcon fontSize="small" />,
  validate: <RuleFolderOutlinedIcon fontSize="small" />,
}

type ActionToolbarProps = {
  actions: ToolbarAction[]
  trailing?: ReactNode
}

export function ActionToolbar({ actions, trailing }: ActionToolbarProps) {
  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 1,
        flexWrap: 'wrap',
        mb: 1.25,
      }}
    >
      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
        {actions.map((action) => (
          <Button
            key={action.label}
            variant={action.kind === 'delete' ? 'outlined' : 'contained'}
            color={action.kind === 'delete' ? 'inherit' : 'primary'}
            size="small"
            startIcon={iconByKind[action.kind]}
            disabled={action.disabled}
            onClick={action.onClick}
          >
            {action.label}
          </Button>
        ))}
      </Box>
      {trailing}
    </Box>
  )
}