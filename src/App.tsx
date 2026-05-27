import { useMemo, useState } from 'react'
import {
  Alert,
  Box,
  Chip,
  CssBaseline,
  FormControl,
  InputAdornment,
  InputLabel,
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
  ThemeProvider,
  Typography,
  createTheme,
} from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import './App.css'
import { ActionToolbar } from './components/ActionToolbar'
import { BulkEditPanel } from './components/BulkEditPanel'
import { MatrixGroupSection } from './components/MatrixGroupSection'
import { ProfileActionModal } from './components/ProfileActionModal'
import {
  activeOptions,
  createBulkEditSeed,
  defaultModalForm,
  mockMatrixRecords,
  mockProfiles,
} from './data/mockData'
import type { BulkEditFormState, MatrixRecord, ModalMode, ModalState, Profile } from './types'

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#0f5bd8',
      dark: '#0a47aa',
    },
    background: {
      default: '#eef2f7',
      paper: '#ffffff',
    },
    divider: '#d6deea',
  },
  shape: {
    borderRadius: 4,
  },
  typography: {
    fontFamily: 'Segoe UI, Tahoma, Arial, sans-serif',
    h4: {
      fontSize: '1.4rem',
      fontWeight: 700,
    },
    h6: {
      fontSize: '0.95rem',
      fontWeight: 700,
    },
    body2: {
      fontSize: '0.78rem',
    },
    caption: {
      fontSize: '0.72rem',
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 4,
          boxShadow: 'none',
          textTransform: 'none',
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderBottom: '1px solid #e3e9f3',
          padding: '8px 10px',
        },
        head: {
          backgroundColor: '#f7f9fc',
          color: '#425066',
          fontSize: '0.72rem',
          fontWeight: 700,
        },
      },
    },
    MuiTextField: {
      defaultProps: {
        size: 'small',
      },
    },
    MuiSelect: {
      defaultProps: {
        size: 'small',
      },
    },
  },
})

function App() {
  const [profiles, setProfiles] = useState<Profile[]>(mockProfiles)
  const [matrixRecords, setMatrixRecords] = useState<MatrixRecord[]>(mockMatrixRecords)
  const [selectedProfileIds, setSelectedProfileIds] = useState<string[]>([
    'profile-1',
    'profile-2',
    'profile-3',
  ])
  const [selectedMatrixIds, setSelectedMatrixIds] = useState<string[]>([])
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({})
  const [profileSearch, setProfileSearch] = useState({
    code: '',
    description: '',
    active: 'all',
  })
  const [modalState, setModalState] = useState<ModalState | null>(null)
  const [profileAdvancedFilter, setProfileAdvancedFilter] = useState<ModalState['form'] | null>(null)
  const [matrixFilter, setMatrixFilter] = useState<ModalState['form'] | null>(null)
  const [bulkEditForm, setBulkEditForm] = useState<BulkEditFormState>(createBulkEditSeed())
  const [snackbar, setSnackbar] = useState<string>('')

  const filteredProfiles = useMemo(() => {
    return profiles.filter((profile) => {
      const matchesCode = profile.code
        .toLowerCase()
        .includes(profileSearch.code.trim().toLowerCase())
      const matchesDescription = profile.description
        .toLowerCase()
        .includes(profileSearch.description.trim().toLowerCase())
      const matchesActive =
        profileSearch.active === 'all' ||
        (profileSearch.active === 'active' ? profile.active : !profile.active)

      const matchesAdvancedRegion =
        !profileAdvancedFilter?.region.length || profileAdvancedFilter.region.includes(profile.region)
      const matchesAdvancedSubRegion =
        !profileAdvancedFilter?.subRegion.length ||
        profileAdvancedFilter.subRegion.includes(profile.subRegion)
      const matchesAdvancedCountry =
        !profileAdvancedFilter?.countries.length ||
        profileAdvancedFilter.countries.includes(profile.country)

      return (
        matchesCode &&
        matchesDescription &&
        matchesActive &&
        matchesAdvancedRegion &&
        matchesAdvancedSubRegion &&
        matchesAdvancedCountry
      )
    })
  }, [profileAdvancedFilter, profiles, profileSearch])

  const selectedProfiles = useMemo(() => {
    return profiles.filter((profile) => selectedProfileIds.includes(profile.id))
  }, [profiles, selectedProfileIds])

  const visibleMatrixRecords = useMemo(() => {
    const selectedCodes = new Set(selectedProfiles.map((profile) => profile.code))
    const scopedRecords = matrixRecords.filter((record) => selectedCodes.has(record.authProfileCode))

    if (!matrixFilter) {
      return scopedRecords
    }

    const { region, subRegion, countries, businessGroup, businessUnit, productLines } = matrixFilter

    return scopedRecords.filter((record) => {
      const matchesRegion = !region.length || region.includes(record.region)
      const matchesSubRegion = !subRegion.length || subRegion.includes(record.subRegion)
      const matchesCountry = !countries.length || countries.includes(record.country)
      const matchesBusinessGroup = !businessGroup.length || businessGroup.includes(record.businessGroup)
      const matchesBusinessUnit = !businessUnit.length || businessUnit.includes(record.businessUnit)
      const matchesProductLine = !productLines.length || productLines.includes(record.productLine)

      return (
        matchesRegion &&
        matchesSubRegion &&
        matchesCountry &&
        matchesBusinessGroup &&
        matchesBusinessUnit &&
        matchesProductLine
      )
    })
  }, [matrixFilter, matrixRecords, selectedProfiles])

  const groupedMatrixRecords = useMemo(() => {
    return visibleMatrixRecords.reduce<Record<string, MatrixRecord[]>>((groups, record) => {
      if (!groups[record.authProfileCode]) {
        groups[record.authProfileCode] = []
      }

      groups[record.authProfileCode].push(record)
      return groups
    }, {})
  }, [visibleMatrixRecords])

  const selectedMatrixRecords = useMemo(() => {
    return matrixRecords.filter((record) => selectedMatrixIds.includes(record.id))
  }, [matrixRecords, selectedMatrixIds])

  const handleProfileToggle = (profileId: string) => {
    setSelectedProfileIds((current) =>
      current.includes(profileId)
        ? current.filter((item) => item !== profileId)
        : [...current, profileId],
    )
  }

  const handleProfileToggleAll = () => {
    const visibleIds = filteredProfiles.map((profile) => profile.id)
    const everySelected = visibleIds.every((id) => selectedProfileIds.includes(id))

    setSelectedProfileIds(everySelected ? [] : visibleIds)
  }

  const handleMatrixSelectionChange = (recordId: string, checked: boolean) => {
    setSelectedMatrixIds((current) => {
      const next = checked ? [...current, recordId] : current.filter((id) => id !== recordId)
      const firstRecord = matrixRecords.find((record) => record.id === next[0])
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

  const handleMatrixGroupSelection = (recordIds: string[], checked: boolean) => {
    setSelectedMatrixIds((current) => {
      const merged = checked
        ? Array.from(new Set([...current, ...recordIds]))
        : current.filter((id) => !recordIds.includes(id))
      return merged
    })
  }

  const handleDeleteProfiles = () => {
    if (!selectedProfileIds.length) {
      setSnackbar('Select at least one authorization profile to delete.')
      return
    }

    const selectedCodes = new Set(
      profiles.filter((profile) => selectedProfileIds.includes(profile.id)).map((profile) => profile.code),
    )

    setProfiles((current) => current.filter((profile) => !selectedProfileIds.includes(profile.id)))
    setMatrixRecords((current) => current.filter((record) => !selectedCodes.has(record.authProfileCode)))
    setSelectedProfileIds([])
    setSelectedMatrixIds([])
    setSnackbar('Selected authorization profiles were removed from the prototype workspace.')
  }

  const handleDeleteMatrix = () => {
    if (!selectedMatrixIds.length) {
      setSnackbar('Select matrix rows before deleting profile records.')
      return
    }

    setMatrixRecords((current) => current.filter((record) => !selectedMatrixIds.includes(record.id)))
    setSelectedMatrixIds([])
    setSnackbar('Selected matrix rows were removed locally.')
  }

  const openModal = (mode: ModalMode, scope: 'profile' | 'matrix') => {
    setModalState({
      mode,
      scope,
      form:
        mode === 'filter'
          ? scope === 'profile'
            ? profileAdvancedFilter ?? defaultModalForm
            : matrixFilter ?? defaultModalForm
          : defaultModalForm,
    })
  }

  const applyModal = () => {
    if (!modalState) {
      return
    }

    if (modalState.mode === 'add') {
      const nextProfileId = `profile-${profiles.length + 1}`
      const codeSeed = modalState.form.subRegion[0] ?? modalState.form.region[0] ?? 'NEW'
      const nextCode = `${codeSeed}_AUTH_${profiles.length + 1}`.replace(/\s+/g, '_').toUpperCase()

      const newProfile: Profile = {
        id: nextProfileId,
        code: nextCode,
        description: `${modalState.form.productLines[0] ?? 'New'} profile for ${modalState.form.region[0] ?? 'global'} coverage`,
        active: true,
        lastChange: 2180000 + profiles.length * 13,
        region: modalState.form.region[0] ?? 'AP',
        subRegion: modalState.form.subRegion[0] ?? 'INS2',
        country: modalState.form.countries[0] ?? 'IN',
      }

      const newRecords: MatrixRecord[] = [
        {
          id: `matrix-${matrixRecords.length + 1}`,
          authProfileCode: nextCode,
          region: modalState.form.region[0] ?? 'AP',
          subRegion: modalState.form.subRegion[0] ?? 'INS2',
          country: modalState.form.countries[0] ?? 'IN',
          businessGroup: modalState.form.businessGroup[0] ?? 'PPS',
          businessUnit: modalState.form.businessUnit[0] ?? '302',
          productLine: modalState.form.productLines[0] ?? '5M',
          pfCode: 'DU',
          maxPlPercent: 0,
          minMarginPercent: 0,
          authMarginFlag: 'N',
          plSumAuth: 'N',
          maxLineAmount: 0,
          dealType: 1,
          startDate: '9/8/2023 6:35 AM',
          endDate: '9/8/2026 6:35 AM',
          updatedBy: 'PROTOTYPE.USER',
        },
        {
          id: `matrix-${matrixRecords.length + 2}`,
          authProfileCode: nextCode,
          region: modalState.form.region[0] ?? 'AP',
          subRegion: modalState.form.subRegion[0] ?? 'INS2',
          country: modalState.form.countries[1] ?? modalState.form.countries[0] ?? 'IN',
          businessGroup: modalState.form.businessGroup[0] ?? 'PPS',
          businessUnit: modalState.form.businessUnit[0] ?? '400',
          productLine: modalState.form.productLines[1] ?? modalState.form.productLines[0] ?? '5U',
          pfCode: '5U',
          maxPlPercent: 0,
          minMarginPercent: 0,
          authMarginFlag: 'N',
          plSumAuth: 'N',
          maxLineAmount: 0,
          dealType: 1,
          startDate: '9/8/2023 6:35 AM',
          endDate: '9/8/2026 6:35 AM',
          updatedBy: 'PROTOTYPE.USER',
        },
      ]

      setProfiles((current) => [newProfile, ...current])
      setMatrixRecords((current) => [...newRecords, ...current])
      setSelectedProfileIds((current) => [newProfile.id, ...current])
      setSnackbar('A new authorization profile and starter matrix rows were added locally.')
    }

    if (modalState.mode === 'filter') {
      if (modalState.scope === 'profile') {
        setProfileAdvancedFilter(modalState.form)
        setSnackbar('Advanced profile filter criteria were applied.')
      } else {
        setMatrixFilter(modalState.form)
        setSnackbar('Workspace filter criteria were applied to the matrix view.')
      }

      setModalState(null)
      return
    }

    setModalState(null)
  }

  const resetMatrixFilter = () => {
    setMatrixFilter(null)
    setSnackbar('Matrix workspace filters were cleared.')
  }

  const applyBulkEdit = () => {
    if (!selectedMatrixIds.length) {
      setSnackbar('Select one or more matrix rows before updating them.')
      return
    }

    setMatrixRecords((current) =>
      current.map((record) => {
        if (!selectedMatrixIds.includes(record.id)) {
          return record
        }

        return {
          ...record,
          region: bulkEditForm.region || record.region,
          subRegion: bulkEditForm.subRegion || record.subRegion,
          country: bulkEditForm.country || record.country,
          businessGroup: bulkEditForm.businessGroup || record.businessGroup,
          businessUnit: bulkEditForm.businessUnit || record.businessUnit,
          productLine: bulkEditForm.productLine || record.productLine,
          pfCode: bulkEditForm.pfCode || record.pfCode,
          maxPlPercent: Number(bulkEditForm.maxPlPercent || record.maxPlPercent),
          minMarginPercent: Number(bulkEditForm.minMarginPercent || record.minMarginPercent),
          authMarginFlag: bulkEditForm.authMarginFlag,
          plSumAuth: bulkEditForm.plSumAuth,
          maxLineAmount: Number(bulkEditForm.maxLineAmount || record.maxLineAmount),
          dealType: Number(bulkEditForm.dealType || record.dealType),
          updatedBy: 'PROTOTYPE.USER',
        }
      }),
    )
    setSnackbar('Selected matrix rows were updated in local component state.')
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box className="workspace-shell">
        <Box className="workspace-topbar">
          <Box>
            <Typography variant="h4">Authorization Profiles Workspace</Typography>
            <Typography variant="body2" color="text.secondary">
              Split-view prototype merging profile maintenance with matrix editing.
            </Typography>
          </Box>
          <Box className="workspace-chipbar">
            <Chip size="small" label={`Selected Profiles: ${selectedProfiles.length}`} color="primary" variant="outlined" />
            <Chip size="small" label={`Matrix Rows: ${visibleMatrixRecords.length}`} variant="outlined" />
          </Box>
        </Box>

        <Box className="split-layout">
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
                value={profileSearch.code}
                onChange={(event) => setProfileSearch((current) => ({ ...current, code: event.target.value }))}
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
                value={profileSearch.description}
                onChange={(event) =>
                  setProfileSearch((current) => ({ ...current, description: event.target.value }))
                }
              />
              <FormControl>
                <InputLabel>Active</InputLabel>
                <Select
                  label="Active"
                  value={profileSearch.active}
                  onChange={(event) =>
                    setProfileSearch((current) => ({ ...current, active: event.target.value }))
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

            <ActionToolbar
              actions={[
                { label: 'Add', kind: 'add', onClick: () => openModal('add', 'profile') },
                { label: 'Delete', kind: 'delete', onClick: handleDeleteProfiles, disabled: !selectedProfileIds.length },
                { label: 'Export to Excel', kind: 'export', onClick: () => setSnackbar('Export action is mocked for this prototype.') },
                { label: 'Filter', kind: 'filter', onClick: () => openModal('filter', 'profile') },
                { label: 'More Actions', kind: 'more', onClick: () => setSnackbar('Additional actions are intentionally mocked.') },
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
                        checked={
                          filteredProfiles.length > 0 &&
                          filteredProfiles.every((profile) => selectedProfileIds.includes(profile.id))
                        }
                        onChange={handleProfileToggleAll}
                      />
                    </TableCell>
                    <TableCell>Auth Profile Code</TableCell>
                    <TableCell>Description</TableCell>
                    <TableCell>Active</TableCell>
                    <TableCell>Last Change Engg Nr</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredProfiles.map((profile) => {
                    const isSelected = selectedProfileIds.includes(profile.id)
                    return (
                      <TableRow
                        key={profile.id}
                        hover
                        selected={isSelected}
                        onClick={() => handleProfileToggle(profile.id)}
                        className={isSelected ? 'selected-row' : ''}
                      >
                        <TableCell padding="checkbox">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleProfileToggle(profile.id)}
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
          </Paper>

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
                { label: 'Add Profile', kind: 'add', onClick: () => openModal('add', 'matrix') },
                { label: 'Delete Profile', kind: 'delete', onClick: handleDeleteMatrix, disabled: !selectedMatrixIds.length },
                { label: 'Import', kind: 'import', onClick: () => setSnackbar('Import is represented as a UX placeholder only.') },
                { label: 'Validate', kind: 'validate', onClick: () => setSnackbar('Validation complete: no blocking prototype errors found.') },
                { label: 'Export', kind: 'export', onClick: () => setSnackbar('Export action is mocked for matrix records.') },
                { label: 'Filter', kind: 'filter', onClick: () => openModal('filter', 'matrix') },
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
                  onToggleExpanded={() =>
                    setExpandedGroups((current) => ({
                      ...current,
                      [authProfileCode]: !(current[authProfileCode] ?? true),
                    }))
                  }
                  onRowSelectionChange={handleMatrixSelectionChange}
                  onGroupSelectionChange={handleMatrixGroupSelection}
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
              onFormChange={setBulkEditForm}
              onUpdate={applyBulkEdit}
              onClearSelection={() => setSelectedMatrixIds([])}
            />
          </Paper>
        </Box>

        <ProfileActionModal
          open={Boolean(modalState)}
          mode={modalState?.mode ?? 'add'}
          scope={modalState?.scope === 'matrix-applied' ? 'matrix' : modalState?.scope ?? 'profile'}
          value={modalState?.form ?? defaultModalForm}
          onChange={(nextForm) =>
            setModalState((current) =>
              current
                ? {
                    ...current,
                    form: nextForm,
                  }
                : current,
            )
          }
          onClose={() => setModalState(null)}
          onApply={applyModal}
        />

        <Snackbar open={Boolean(snackbar)} autoHideDuration={2500} onClose={() => setSnackbar('')}>
          <Alert severity="info" variant="filled" onClose={() => setSnackbar('')}>
            {snackbar}
          </Alert>
        </Snackbar>

        {matrixFilter && (
          <Box className="filter-banner">
            <Typography variant="caption">Advanced matrix filter is active.</Typography>
            <button className="link-button" onClick={resetMatrixFilter}>
              Clear filter
            </button>
          </Box>
        )}
      </Box>
    </ThemeProvider>
  )
}

export default App
