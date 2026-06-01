import { useMemo } from 'react'
import type { Profile } from '../types'
import type { ModalFormState } from '../types'

interface ProfileSearchState {
  code: string
  description: string
  active: 'all' | 'active' | 'inactive'
}

export function useProfileFiltering(
  profiles: Profile[],
  searchState: ProfileSearchState,
  advancedFilter: ModalFormState | null,
) {
  const filteredProfiles = useMemo(() => {
    return profiles.filter((profile) => {
      const matchesCode = profile.code
        .toLowerCase()
        .includes(searchState.code.trim().toLowerCase())
      const matchesDescription = profile.description
        .toLowerCase()
        .includes(searchState.description.trim().toLowerCase())
      const matchesActive =
        searchState.active === 'all' ||
        (searchState.active === 'active' ? profile.active : !profile.active)

      const matchesAdvancedRegion =
        !advancedFilter?.region.length || advancedFilter.region.includes(profile.region)
      const matchesAdvancedSubRegion =
        !advancedFilter?.subRegion.length ||
        advancedFilter.subRegion.includes(profile.subRegion)
      const matchesAdvancedCountry =
        !advancedFilter?.countries.length ||
        advancedFilter.countries.includes(profile.country)

      return (
        matchesCode &&
        matchesDescription &&
        matchesActive &&
        matchesAdvancedRegion &&
        matchesAdvancedSubRegion &&
        matchesAdvancedCountry
      )
    })
  }, [advancedFilter, profiles, searchState])

  return filteredProfiles
}
