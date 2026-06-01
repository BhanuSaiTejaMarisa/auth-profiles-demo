import { useState, useCallback } from 'react'
import type { ModalState, ModalMode, Profile, MatrixRecord } from '../types'
import { defaultModalForm } from '../data/mockData'

interface UseModalProps {
  onProfilesChange: (profiles: Profile[]) => void
  onMatrixRecordsChange: (records: MatrixRecord[]) => void
  onSelectedProfileIdsChange: (ids: string[]) => void
  onSnackbarShow: (message: string) => void
}

export function useModalOperations({
  onProfilesChange,
  onMatrixRecordsChange,
  onSelectedProfileIdsChange,
  onSnackbarShow,
}: UseModalProps) {
  const [modalState, setModalState] = useState<ModalState | null>(null)
  const [profileAdvancedFilter, setProfileAdvancedFilter] = useState<ModalState['form'] | null>(null)
  const [matrixFilter, setMatrixFilter] = useState<ModalState['form'] | null>(null)

  const openModal = useCallback((mode: ModalMode, scope: 'profile' | 'matrix') => {
    const form =
      mode === 'filter'
        ? scope === 'profile'
          ? profileAdvancedFilter ?? defaultModalForm
          : matrixFilter ?? defaultModalForm
        : defaultModalForm

    setModalState({
      mode,
      scope,
      form,
    })
  }, [profileAdvancedFilter, matrixFilter])

  const closeModal = useCallback(() => {
    setModalState(null)
  }, [])

  const applyModal = useCallback(
    (profiles: Profile[], matrixRecords: MatrixRecord[]) => {
      if (!modalState) return

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

        onProfilesChange([newProfile, ...profiles])
        onMatrixRecordsChange([...newRecords, ...matrixRecords])
        onSelectedProfileIdsChange([newProfile.id])
        onSnackbarShow('A new authorization profile and starter matrix rows were added locally.')
      }

      if (modalState.mode === 'filter') {
        if (modalState.scope === 'profile') {
          setProfileAdvancedFilter(modalState.form)
          onSnackbarShow('Advanced profile filter criteria were applied.')
        } else {
          setMatrixFilter(modalState.form)
          onSnackbarShow('Workspace filter criteria were applied to the matrix view.')
        }
      }

      closeModal()
    },
    [modalState, onProfilesChange, onMatrixRecordsChange, onSelectedProfileIdsChange, onSnackbarShow, closeModal],
  )

  const resetMatrixFilter = useCallback(() => {
    setMatrixFilter(null)
    onSnackbarShow('Matrix workspace filters were cleared.')
  }, [onSnackbarShow])

  return {
    modalState,
    profileAdvancedFilter,
    matrixFilter,
    openModal,
    closeModal,
    applyModal,
    setProfileAdvancedFilter,
    setMatrixFilter,
    resetMatrixFilter,
  }
}
