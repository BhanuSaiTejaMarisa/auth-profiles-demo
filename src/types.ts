export type YesNoFlag = 'Y' | 'N'

export type Profile = {
  id: string
  code: string
  description: string
  active: boolean
  lastChange: number
  region: string
  subRegion: string
  country: string
}

export type MatrixRecord = {
  id: string
  authProfileCode: string
  region: string
  subRegion: string
  country: string
  businessGroup: string
  businessUnit: string
  productLine: string
  pfCode: string
  maxPlPercent: number
  minMarginPercent: number
  authMarginFlag: YesNoFlag
  plSumAuth: YesNoFlag
  maxLineAmount: number
  dealType: number
  startDate: string
  endDate: string
  updatedBy: string
}

export type ModalFormState = {
  region: string[]
  subRegion: string[]
  countries: string[]
  businessGroup: string[]
  businessUnit: string[]
  productLines: string[]
}

export type ModalMode = 'add' | 'filter'

export type ModalScope = 'profile' | 'matrix' | 'matrix-applied'

export type ModalState = {
  mode: ModalMode
  scope: ModalScope
  form: ModalFormState
  filters?: ModalFormState
}

export type BulkEditFormState = {
  region: string
  subRegion: string
  country: string
  businessGroup: string
  businessUnit: string
  productLine: string
  pfCode: string
  maxPlPercent: string
  minMarginPercent: string
  authMarginFlag: YesNoFlag
  plSumAuth: YesNoFlag
  maxLineAmount: string
  dealType: string
}

export type ActionKind = 'add' | 'delete' | 'export' | 'filter' | 'more' | 'import' | 'validate'