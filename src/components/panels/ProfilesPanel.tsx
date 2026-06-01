import { FC } from 'react'
import {
  Box,
  FormControl,
  InputAdornment,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import { ActionToolbar } from '../ActionToolbar'
import type { Profile } from '../../types'
import { activeOptions } from '../../data/mockData'

interface ProfilesPanelProps {
  profiles: Profile[]
  paginatedProfiles: Profile[]
  filteredProfiles: Profile[]
  selectedProfileIds: string[]
  searchCode: string
  searchDescription: string
  searchActive: string
  pageSize: number
  currentPage: number
  totalPages: number
  onSearchCodeChange: (value: string) => void
  onSearchDescriptionChange: (value: string) => void
  onSearchActiveChange: (value: string) => void
  onProfileToggle: (profileId: string) => void
  onToggleAll: () => void
  onPageSizeChange: (size: number) => void
  onPreviousPage: () => void
  onNextPage: () => void
  onAddClick: () => void
  onDeleteClick: () => void
  onFilterClick: () => void
  canDelete: boolean
}

export const ProfilesPanel: FC<ProfilesPanelProps> = ({
  paginatedProfiles,
  filteredProfiles,
  selectedProfileIds,
  searchCode,
  searchDescription,
  searchActive,
  pageSize,
  currentPage,
  totalPages,
  onSearchCodeChange,
  onSearchDescriptionChange,
  onSearchActiveChange,
  onProfileToggle,
  onToggleAll,
  onPageSizeChange,
  onPreviousPage,
  onNextPage,
  onAddClick,
  onDeleteClick,
  onFilterClick,
  canDelete,
}) => {
  const areAllVisible = paginatedProfiles.length > 0 &&
    paginatedProfiles.every((profile) => selectedProfileIds.includes(profile.id))

  return (
    <Paper className="panel panel-left" elevation={0}>
      <Box className="panel-section">
        <Typography variant="h6">Generic Authorization Profiles</Typography>
        <Typography variant="caption" color="text.secondary">
          Search, select, and maintain reusable authorization profile definitions.
        </Typography>
      </Box>

      <Box className="panel-section profile-search-grid">
        <TextField
          label="Code"
          value={searchCode}
          onChange={(event) => onSearchCodeChange(event.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
          }}
        />
        <TextField
          label="Description"
          value={searchDescription}
          onChange={(event) => onSearchDescriptionChange(event.target.value)}
        />
        <FormControl>
          <InputLabel>Active</InputLabel>
          <Select
            label="Active"
            value={searchActive}
            onChange={(event) => onSearchActiveChange(event.target.value)}
          >
            {activeOptions.map((option: any) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      <ActionToolbar
        actions={[
          { label: 'Add', kind: 'add', onClick: onAddClick },
          { label: 'Delete', kind: 'delete', onClick: onDeleteClick, disabled: !canDelete },
          { label: 'Export to Excel', kind: 'export', onClick: () => {} },
          { label: 'Filter', kind: 'filter', onClick: onFilterClick },
          { label: 'More Actions', kind: 'more', onClick: () => {} },
        ]}
      />

      <Box className="panel-section panel-meta-row">
        <Typography variant="caption">Total Profiles: {filteredProfiles.length}</Typography>
        <Typography variant="caption">Selected: {selectedProfileIds.length}</Typography>
      </Box>

      <TableContainer className="table-container enterprise-scroll">
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox">
                <input
                  type="checkbox"
                  checked={areAllVisible}
                  onChange={onToggleAll}
                />
              </TableCell>
              <TableCell>Auth Profile Code</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>Active</TableCell>
              <TableCell>Last Change Engg Nr</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedProfiles.map((profile) => {
              const isSelected = selectedProfileIds.includes(profile.id)
              return (
                <TableRow
                  key={profile.id}
                  hover
                  selected={isSelected}
                  onClick={() => onProfileToggle(profile.id)}
                  className={isSelected ? 'selected-row' : ''}
                >
                  <TableCell padding="checkbox">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => onProfileToggle(profile.id)}
                      onClick={(event) => event.stopPropagation()}
                    />
                  </TableCell>
                  <TableCell>{profile.code}</TableCell>
                  <TableCell>{profile.description}</TableCell>
                  <TableCell>{profile.active ? 'Yes' : 'No'}</TableCell>
                  <TableCell>{profile.lastChange}</TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </TableContainer>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, justifyContent: 'space-between', p: 1.5, borderTop: '1px solid #e0e0e0' }}>
        <FormControl sx={{ minWidth: 100 }} size="small">
          <InputLabel>Page Size</InputLabel>
          <Select
            label="Page Size"
            value={pageSize}
            onChange={(event) => onPageSizeChange(event.target.value as number)}
          >
            <MenuItem value={5}>5 rows</MenuItem>
            <MenuItem value={10}>10 rows</MenuItem>
            <MenuItem value={25}>25 rows</MenuItem>
            <MenuItem value={50}>50 rows</MenuItem>
          </Select>
        </FormControl>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <button
            onClick={onPreviousPage}
            disabled={currentPage === 0}
            style={{
              padding: '6px 12px',
              borderRadius: '4px',
              border: '1px solid #d6deea',
              cursor: currentPage === 0 ? 'not-allowed' : 'pointer',
              opacity: currentPage === 0 ? 0.5 : 1,
            }}
          >
            ← Previous
          </button>
          <Typography variant="caption" sx={{ minWidth: '120px', textAlign: 'center' }}>
            Page {currentPage + 1} of {totalPages || 1}
          </Typography>
          <button
            onClick={onNextPage}
            disabled={currentPage >= totalPages - 1}
            style={{
              padding: '6px 12px',
              borderRadius: '4px',
              border: '1px solid #d6deea',
              cursor: currentPage >= totalPages - 1 ? 'not-allowed' : 'pointer',
              opacity: currentPage >= totalPages - 1 ? 0.5 : 1,
            }}
          >
            Next →
          </button>
        </Box>
      </Box>
    </Paper>
  )
}
