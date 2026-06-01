import { useState } from 'react'
import { Alert, Box, Chip, Snackbar } from '@mui/material'
import { ProfileActionModal } from '../components/ProfileActionModal'
import { ProfilesPanel } from '../components/panels/ProfilesPanel'
import { MatrixPanel } from '../components/panels/MatrixPanel'
import {
  useProfileFiltering,
  usePagination,
  useMatrixFiltering,
  useModalOperations,
} from '../hooks'
import { ProfileService, MatrixService } from '../services/index'
import { mockProfiles, mockMatrixRecords, createBulkEditSeed, defaultModalForm } from '../data/mockData'
import type { Profile, MatrixRecord, BulkEditFormState } from '../types'

export function SplitViewPage() {
  // ====== State ======
  const [profiles, setProfiles] = useState<Profile[]>(mockProfiles)
  const [matrixRecords, setMatrixRecords] = useState<MatrixRecord[]>(mockMatrixRecords)
  const [selectedProfileIds, setSelectedProfileIds] = useState<string[]>([
    'profile-1',
    'profile-2',
    'profile-3',
  ])
  const [selectedMatrixIds, setSelectedMatrixIds] = useState<string[]>([])
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({})
  const [bulkEditForm, setBulkEditForm] = useState<BulkEditFormState>(createBulkEditSeed())
  const [snackbar, setSnackbar] = useState<string>('')
  const [profileSearch, setProfileSearch] = useState({
    code: '',
    description: '',
    active: 'all' as 'all' | 'active' | 'inactive',
  })

  // ====== Derived data ======
  const filteredProfiles = useProfileFiltering(profiles, profileSearch, null)

  const {
    paginatedItems: paginatedProfiles,
    pageSize: profilePageSize,
    currentPage: profileCurrentPage,
    totalPages,
    setPageSize: setProfilePageSize,
    nextPage: nextProfilePage,
    previousPage: previousProfilePage,
  } = usePagination({
    items: filteredProfiles,
    initialPageSize: 10,
    resetDependencies: [profileSearch],
  })

  const selectedProfiles = ProfileService.getSelectedProfiles(profiles, selectedProfileIds)

  const { visibleMatrixRecords, groupedMatrixRecords } = useMatrixFiltering(
    matrixRecords,
    selectedProfiles,
    null,
  )

  const {
    modalState,
    openModal,
    closeModal,
    applyModal: applyModalLogic,
  } = useModalOperations({
    onProfilesChange: setProfiles,
    onMatrixRecordsChange: setMatrixRecords,
    onSelectedProfileIdsChange: setSelectedProfileIds,
    onSnackbarShow: setSnackbar,
  })

  const selectedMatrixRecords = ProfileService.getSelectedMatrixRecords(
    matrixRecords,
    selectedMatrixIds,
  )

  // ====== Profile handlers ======
  const handleProfileToggle = (profileId: string) => {
    setSelectedProfileIds((current) =>
      current.includes(profileId)
        ? current.filter((id) => id !== profileId)
        : [...current, profileId],
    )
  }

  const handleProfileToggleAll = () => {
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
    setSelectedMatrixIds([])
    setSnackbar('Selected authorization profiles were removed from the prototype workspace.')
  }

  // ====== Matrix handlers ======
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

  const handleDeleteMatrix = () => {
    if (!selectedMatrixIds.length) {
      setSnackbar('Select matrix rows before deleting profile records.')
      return
    }
    const updated = MatrixService.deleteMatrixRecords(matrixRecords, selectedMatrixIds)
    setMatrixRecords(updated)
    setSelectedMatrixIds([])
    setSnackbar('Selected matrix rows were removed locally.')
  }

  const handleApplyBulkEdit = () => {
    if (!selectedMatrixIds.length) {
      setSnackbar('Select one or more matrix rows before updating them.')
      return
    }
    const updated = MatrixService.applyBulkEdit(matrixRecords, selectedMatrixIds, bulkEditForm)
    setMatrixRecords(updated)
    setSnackbar('Selected matrix rows were updated in local component state.')
  }

  const handleApplyModal = () => {
    applyModalLogic(profiles, matrixRecords)
  }

  return (
    <>
      {/* Selection summary chips */}
      <Box className="workspace-chipbar" sx={{ mb: 1.5 }}>
        <Chip
          size="small"
          label={`Selected Profiles: ${selectedProfiles.length}`}
          color="primary"
          variant="outlined"
        />
        <Chip
          size="small"
          label={`Matrix Rows: ${visibleMatrixRecords.length}`}
          variant="outlined"
        />
      </Box>

      {/* Split layout */}
      <Box className="split-layout">
        <ProfilesPanel
          profiles={profiles}
          paginatedProfiles={paginatedProfiles}
          filteredProfiles={filteredProfiles}
          selectedProfileIds={selectedProfileIds}
          searchCode={profileSearch.code}
          searchDescription={profileSearch.description}
          searchActive={profileSearch.active}
          pageSize={profilePageSize}
          currentPage={profileCurrentPage}
          totalPages={totalPages}
          onSearchCodeChange={(code) => setProfileSearch((s) => ({ ...s, code }))}
          onSearchDescriptionChange={(desc) => setProfileSearch((s) => ({ ...s, description: desc }))}
          onSearchActiveChange={(active) =>
            setProfileSearch((s) => ({ ...s, active: active as 'all' | 'active' | 'inactive' }))
          }
          onProfileToggle={handleProfileToggle}
          onToggleAll={handleProfileToggleAll}
          onPageSizeChange={setProfilePageSize}
          onPreviousPage={previousProfilePage}
          onNextPage={nextProfilePage}
          onAddClick={() => openModal('add', 'profile')}
          onDeleteClick={handleDeleteProfiles}
          onFilterClick={() => openModal('filter', 'profile')}
          canDelete={selectedProfileIds.length > 0}
        />

        <MatrixPanel
          selectedProfiles={selectedProfiles}
          groupedMatrixRecords={groupedMatrixRecords}
          expandedGroups={expandedGroups}
          selectedMatrixIds={selectedMatrixIds}
          selectedMatrixRecords={selectedMatrixRecords}
          bulkEditForm={bulkEditForm}
          onToggleExpanded={(code) =>
            setExpandedGroups((current) => ({ ...current, [code]: !(current[code] ?? true) }))
          }
          onRowSelectionChange={handleMatrixSelectionChange}
          onGroupSelectionChange={handleMatrixGroupSelection}
          onAddClick={() => openModal('add', 'matrix')}
          onDeleteClick={handleDeleteMatrix}
          onFilterClick={() => openModal('filter', 'matrix')}
          onValidateClick={() => setSnackbar('Validation complete: no blocking prototype errors found.')}
          onExportClick={() => setSnackbar('Export action is mocked for matrix records.')}
          onBulkEditFormChange={setBulkEditForm}
          onBulkEditApply={handleApplyBulkEdit}
          onBulkEditClearSelection={() => setSelectedMatrixIds([])}
          canDelete={selectedMatrixIds.length > 0}
        />
      </Box>

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
