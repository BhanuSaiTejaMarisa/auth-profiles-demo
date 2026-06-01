import type { Profile, MatrixRecord } from '../types'

export class ProfileService {
  /**
   * Delete profiles by their IDs and cascade-delete associated matrix records
   */
  static deleteProfiles(
    profiles: Profile[],
    matrixRecords: MatrixRecord[],
    profileIdsToDelete: string[],
  ): {
    profiles: Profile[]
    matrixRecords: MatrixRecord[]
  } {
    const selectedCodes = new Set(
      profiles
        .filter((profile) => profileIdsToDelete.includes(profile.id))
        .map((profile) => profile.code),
    )

    return {
      profiles: profiles.filter((profile) => !profileIdsToDelete.includes(profile.id)),
      matrixRecords: matrixRecords.filter(
        (record) => !selectedCodes.has(record.authProfileCode),
      ),
    }
  }

  /**
   * Get selected profile objects
   */
  static getSelectedProfiles(
    profiles: Profile[],
    selectedProfileIds: string[],
  ): Profile[] {
    return profiles.filter((profile) => selectedProfileIds.includes(profile.id))
  }

  /**
   * Get selected matrix records
   */
  static getSelectedMatrixRecords(
    matrixRecords: MatrixRecord[],
    selectedMatrixIds: string[],
  ): MatrixRecord[] {
    return matrixRecords.filter((record) => selectedMatrixIds.includes(record.id))
  }
}
