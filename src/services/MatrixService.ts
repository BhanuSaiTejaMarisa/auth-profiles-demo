import type { BulkEditFormState, MatrixRecord } from '../types'

export class MatrixService {
  /**
   * Delete matrix records by their IDs
   */
  static deleteMatrixRecords(
    matrixRecords: MatrixRecord[],
    recordIdsToDelete: string[],
  ): MatrixRecord[] {
    return matrixRecords.filter((record) => !recordIdsToDelete.includes(record.id))
  }

  /**
   * Apply bulk edit to selected matrix records
   */
  static applyBulkEdit(
    matrixRecords: MatrixRecord[],
    selectedMatrixIds: string[],
    bulkEditForm: BulkEditFormState,
  ): MatrixRecord[] {
    return matrixRecords.map((record) => {
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
    })
  }
}
