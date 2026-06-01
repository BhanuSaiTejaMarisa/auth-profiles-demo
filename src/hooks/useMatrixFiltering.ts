import { useMemo } from 'react'
import type { MatrixRecord, Profile } from '../types'
import type { ModalFormState } from '../types'

export function useMatrixFiltering(
  matrixRecords: MatrixRecord[],
  selectedProfiles: Profile[],
  matrixFilter: ModalFormState | null,
) {
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

  return {
    visibleMatrixRecords,
    groupedMatrixRecords,
  }
}
