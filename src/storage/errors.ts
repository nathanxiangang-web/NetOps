export const STORAGE_ERROR_CODES = {
  CANVAS_NOT_FOUND: 'CANVAS_NOT_FOUND',
  INVALID_CANVAS: 'INVALID_CANVAS',
  STORAGE_FULL: 'STORAGE_FULL',
  STORAGE_UNAVAILABLE: 'STORAGE_UNAVAILABLE',
  IMPORT_INVALID: 'IMPORT_INVALID',
} as const

export type StorageErrorCode = (typeof STORAGE_ERROR_CODES)[keyof typeof STORAGE_ERROR_CODES]

export class NetOpsStorageError extends Error {
  readonly code: StorageErrorCode

  constructor(code: StorageErrorCode, message: string, cause?: unknown) {
    super(message, cause === undefined ? undefined : { cause })
    this.name = 'NetOpsStorageError'
    this.code = code
  }
}