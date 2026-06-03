import { useEffect, useState } from 'react'
import {
  Alert,
  Button,
  Checkbox,
  Box,
  FormControlLabel,
  FormGroup,
  FormControl,
  InputAdornment,
  InputLabel,
  Menu,
  MenuItem,
  Paper,
  Select,
  Snackbar,
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
import { ActionToolbar } from '../components/ActionToolbar'
import { ProfileActionModal } from '../components/ProfileActionModal'
import { useProfileFiltering, usePagination, useModalOperations } from '../hooks'
import { ProfileService } from '../services/index'
import { mockProfiles, mockMatrixRecords, defaultModalForm, activeOptions } from '../data/mockData'
import type { Profile, MatrixRecord } from '../types'
import { downloadCsv, toCsv } from '../utils/csv'

const PROFILE_COLUMN_OPTIONS = [
  { key: 'code', label: 'Auth Profile Code' },
  { key: 'description', label: 'Description' },
  { key: 'region', label: 'Region' },
  { key: 'subRegion', label: 'Sub-Region' },
  { key: 'country', label: 'Country' },
  { key: 'active', label: 'Active' },
  { key: 'lastChange', label: 'Last Change Engg Nr' },
]

const PROFILE_DEFAULT_VISIBLE_COLUMNS: Record<string, boolean> = {
  code: true,
  description: true,
  region: true,
  subRegion: false,
  country: true,
  active: true,
  lastChange: false,
}

export function ProfilesPage() {
  // ====== State ======
  const [profiles, setProfiles] = useState<Profile[]>(mockProfiles)
  const [matrixRecords, setMatrixRecords] = useState<MatrixRecord[]>(mockMatrixRecords)
  const [selectedProfileIds, setSelectedProfileIds] = useState<string[]>([])
  const [snackbar, setSnackbar] = useState<string>('')
  const [profileSearch, setProfileSearch] = useState({
    code: '',
    description: '',
    active: 'all' as 'all' | 'active' | 'inactive',
  })
  const [profileColumnMenuAnchor, setProfileColumnMenuAnchor] = useState<HTMLElement | null>(null)
  const [visibleProfileColumns, setVisibleProfileColumns] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem('profiles-visible-columns')
      if (!saved) return PROFILE_DEFAULT_VISIBLE_COLUMNS
      return {
        ...PROFILE_DEFAULT_VISIBLE_COLUMNS,
        ...JSON.parse(saved),
      }
    } catch {
      return PROFILE_DEFAULT_VISIBLE_COLUMNS
    }
  })

  useEffect(() => {
    localStorage.setItem('profiles-visible-columns', JSON.stringify(visibleProfileColumns))
  }, [visibleProfileColumns])

  // ====== Derived data ======
  const filteredProfiles = useProfileFiltering(profiles, profileSearch, null)

  const {
    paginatedItems: paginatedProfiles,
    pageSize,
    currentPage,
    totalPages,
    setPageSize,
    nextPage,
    previousPage,
  } = usePagination({
    items: filteredProfiles,
    initialPageSize: 25,
    resetDependencies: [profileSearch],
  })

  const { modalState, openModal, closeModal, applyModal: applyModalLogic } = useModalOperations({
    onProfilesChange: setProfiles,
    onMatrixRecordsChange: setMatrixRecords,
    onSelectedProfileIdsChange: setSelectedProfileIds,
    onSnackbarShow: setSnackbar,
  })

  // ====== Handlers ======
  const handleProfileToggle = (profileId: string) => {
    setSelectedProfileIds((current) =>
      current.includes(profileId)
        ? current.filter((id) => id !== profileId)
        : [...current, profileId],
    )
  }

  const handleToggleAll = () => {
    const visibleIds = paginatedProfiles.map((p) => p.id)
    const everySelected = visibleIds.every((id) => selectedProfileIds.includes(id))
    setSelectedProfileIds(everySelected ? [] : visibleIds)
  }

  const handleDeleteProfiles = () => {
    if (!selectedProfileIds.length) {
      setSnackbar('Select at least one authorization profile to delete.')
      return
    }
    const { profiles: updated, matrixRecords: matrixUpdated } = ProfileService.deleteProfiles(
      profiles,
      matrixRecords,
      selectedProfileIds,
    )
    setProfiles(updated)
    setMatrixRecords(matrixUpdated)
    setSelectedProfileIds([])
    setSnackbar('Selected authorization profiles were removed.')
  }

  const handleApplyModal = () => {
    applyModalLogic(profiles, matrixRecords)
  }

  const handleExportProfiles = () => {
    const rows = profiles.filter((profile) => selectedProfileIds.includes(profile.id))
    if (!rows.length) {
      setSnackbar('Select one or more profile rows to export filtered profile data.')
      return
    }

    const csv = toCsv(rows, [
      'id',
      'code',
      'description',
      'active',
      'lastChange',
      'region',
      'subRegion',
      'country',
    ])
    downloadCsv(csv, 'generic-auth-profiles-selected-export.csv')
    setSnackbar('Selected authorization profiles export downloaded.')
  }

  const handleExportAllProfiles = () => {
    if (!profiles.length) {
      setSnackbar('No profile rows available to export.')
      return
    }

    const csv = toCsv(profiles, [
      'id',
      'code',
      'description',
      'active',
      'lastChange',
      'region',
      'subRegion',
      'country',
    ])
    downloadCsv(csv, 'generic-auth-profiles-all-export.csv')
    setSnackbar('All authorization profiles export downloaded.')
  }

  const areAllVisible =
    paginatedProfiles.length > 0 &&
    paginatedProfiles.every((p) => selectedProfileIds.includes(p.id))

  const visibleProfileColumnCount = PROFILE_COLUMN_OPTIONS.filter(
    (option) => visibleProfileColumns[option.key],
  ).length

  const toggleProfileColumn = (key: string) => {
    setVisibleProfileColumns((current) => {
      if (current[key] && visibleProfileColumnCount <= 1) {
        return current
      }

      return {
        ...current,
        [key]: !current[key],
      }
    })
  }

  return (
    <>
      <Paper className="panel-full" elevation={0}>
        {/* Header */}
        <Box className="panel-section">
          <Typography variant="h6">Generic Authorization Profiles</Typography>
          <Typography variant="caption" color="text.secondary">
            Search, manage, and maintain reusable authorization profile definitions.
          </Typography>
        </Box>

        {/* Search bar */}
        <Box className="panel-section profiles-page-search-grid">
          <TextField
            label="Code"
            size="small"
            value={profileSearch.code}
            onChange={(e) => setProfileSearch((s) => ({ ...s, code: e.target.value }))}
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
            size="small"
            value={profileSearch.description}
            onChange={(e) => setProfileSearch((s) => ({ ...s, description: e.target.value }))}
          />
          <FormControl size="small">
            <InputLabel>Active</InputLabel>
            <Select
              label="Active"
              value={profileSearch.active}
              onChange={(e) =>
                setProfileSearch((s) => ({
                  ...s,
                  active: e.target.value as 'all' | 'active' | 'inactive',
                }))
              }
            >
              {activeOptions.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        {/* Toolbar */}
        <ActionToolbar
          actions={[
            { label: 'Add', kind: 'add', onClick: () => openModal('add', 'profile') },
            {
              label: 'Delete',
              kind: 'delete',
              onClick: handleDeleteProfiles,
              disabled: selectedProfileIds.length === 0,
            },
            {
              label: 'Export Selected',
              kind: 'export',
              onClick: handleExportProfiles,
              disabled: selectedProfileIds.length === 0,
            },
            {
              label: 'Export All Profiles',
              kind: 'export',
              onClick: handleExportAllProfiles,
            },
            { label: 'Filter', kind: 'filter', onClick: () => openModal('filter', 'profile') },
            { label: 'More Actions', kind: 'more', onClick: () => {} },
          ]}
          trailing={
            <Button
              size="small"
              variant="outlined"
              onClick={(event) => setProfileColumnMenuAnchor(event.currentTarget)}
            >
              Columns
            </Button>
          }
        />

        <Menu
          anchorEl={profileColumnMenuAnchor}
          open={Boolean(profileColumnMenuAnchor)}
          onClose={() => setProfileColumnMenuAnchor(null)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        >
          <Box sx={{ px: 2, py: 1.5, minWidth: 250 }}>
            <Typography variant="subtitle2" sx={{ mb: 0.75 }}>
              Visible Profile Columns
            </Typography>
            <FormGroup>
              {PROFILE_COLUMN_OPTIONS.map((option) => {
                const checked = Boolean(visibleProfileColumns[option.key])
                const disableUncheck = checked && visibleProfileColumnCount <= 1

                return (
                  <FormControlLabel
                    key={option.key}
                    control={
                      <Checkbox
                        size="small"
                        checked={checked}
                        disabled={disableUncheck}
                        onChange={() => toggleProfileColumn(option.key)}
                      />
                    }
                    label={<Typography sx={{ fontSize: '0.82rem' }}>{option.label}</Typography>}
                  />
                )
              })}
            </FormGroup>
          </Box>
        </Menu>

        {/* Meta row */}
        <Box className="panel-section panel-meta-row">
          <Typography variant="caption">Total Profiles: {filteredProfiles.length}</Typography>
          <Typography variant="caption">Selected: {selectedProfileIds.length}</Typography>
        </Box>

        {/* Table */}
        <TableContainer className="table-container profiles-page-table">
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell padding="checkbox">
                  <input type="checkbox" checked={areAllVisible} onChange={handleToggleAll} />
                </TableCell>
                {visibleProfileColumns.code && <TableCell>Auth Profile Code</TableCell>}
                {visibleProfileColumns.description && <TableCell>Description</TableCell>}
                {visibleProfileColumns.region && <TableCell>Region</TableCell>}
                {visibleProfileColumns.subRegion && <TableCell>Sub-Region</TableCell>}
                {visibleProfileColumns.country && <TableCell>Country</TableCell>}
                {visibleProfileColumns.active && <TableCell>Active</TableCell>}
                {visibleProfileColumns.lastChange && <TableCell>Last Change Engg Nr</TableCell>}
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
                    onClick={() => handleProfileToggle(profile.id)}
                    className={isSelected ? 'selected-row' : ''}
                    sx={{ cursor: 'pointer' }}
                  >
                    <TableCell padding="checkbox">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleProfileToggle(profile.id)}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </TableCell>
                    {visibleProfileColumns.code && <TableCell>{profile.code}</TableCell>}
                    {visibleProfileColumns.description && <TableCell>{profile.description}</TableCell>}
                    {visibleProfileColumns.region && <TableCell>{profile.region}</TableCell>}
                    {visibleProfileColumns.subRegion && <TableCell>{profile.subRegion}</TableCell>}
                    {visibleProfileColumns.country && <TableCell>{profile.country}</TableCell>}
                    {visibleProfileColumns.active && <TableCell>{profile.active ? 'Yes' : 'No'}</TableCell>}
                    {visibleProfileColumns.lastChange && <TableCell>{profile.lastChange}</TableCell>}
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Pagination */}
        <Box className="profiles-page-pagination">
          <FormControl size="small" sx={{ minWidth: 110 }}>
            <InputLabel>Page Size</InputLabel>
            <Select
              label="Page Size"
              value={pageSize}
              onChange={(e) => setPageSize(e.target.value as number)}
            >
              <MenuItem value={10}>10 rows</MenuItem>
              <MenuItem value={25}>25 rows</MenuItem>
              <MenuItem value={50}>50 rows</MenuItem>
              <MenuItem value={100}>100 rows</MenuItem>
            </Select>
          </FormControl>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <button
              onClick={previousPage}
              disabled={currentPage === 0}
              className="pagination-btn"
            >
              Previous
            </button>
            <Typography variant="caption">
              Page {currentPage + 1} of {Math.max(totalPages, 1)}
            </Typography>
            <button
              onClick={nextPage}
              disabled={currentPage >= totalPages - 1}
              className="pagination-btn"
            >
              Next
            </button>
          </Box>
        </Box>
      </Paper>

      {/* Modal */}
      <ProfileActionModal
        open={Boolean(modalState)}
        mode={modalState?.mode ?? 'add'}
        scope={modalState?.scope === 'matrix-applied' ? 'matrix' : modalState?.scope ?? 'profile'}
        value={modalState?.form ?? defaultModalForm}
        onChange={() => {}}
        onApply={handleApplyModal}
        onClose={closeModal}
      />

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
