import { MAX_TITLE_LENGTH, createId, deepClone, validateCanvas } from '@/domain/canvas'
import type { CanvasIndexEntry, LocalProgress, PersonalCanvas } from '@/domain/types'
import { NetOpsStorageError, STORAGE_ERROR_CODES } from './errors'

const CANVAS_INDEX_KEY = 'netops.canvas.index.v1'
const CANVAS_KEY_PREFIX = 'netops.canvas.v1.'
const PROGRESS_KEY = 'netops.progress.v1'
const STORAGE_PROBE_KEY = 'netops.storage.probe'
const MAX_IMPORT_BYTES = 2 * 1024 * 1024
const DUPLICATE_SUFFIX = ' 副本'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isQuotaError(error: unknown): boolean {
  if (!isRecord(error)) {
    return false
  }
  const name = (error as { name?: unknown }).name
  return name === 'QuotaExceededError' || name === 'NS_ERROR_DOM_QUOTA_REACHED'
}

function isCanvasIndexEntry(value: unknown): value is CanvasIndexEntry {
  if (!isRecord(value)) {
    return false
  }
  return (
    typeof value.id === 'string' &&
    value.id.trim() !== '' &&
    typeof value.title === 'string' &&
    typeof value.nodeCount === 'number' &&
    typeof value.edgeCount === 'number' &&
    typeof value.updatedAt === 'string' &&
    (value.basedOnCourseId === undefined || typeof value.basedOnCourseId === 'string')
  )
}

function isLocalProgress(value: unknown): value is LocalProgress {
  if (!isRecord(value)) {
    return false
  }
  return (
    typeof value.courseId === 'string' &&
    value.courseId.trim() !== '' &&
    typeof value.read === 'boolean' &&
    typeof value.challengeAttempted === 'boolean' &&
    typeof value.updatedAt === 'string' &&
    (value.lastStepId === undefined || typeof value.lastStepId === 'string')
  )
}

export function isStorageAvailable(): boolean {
  if (typeof localStorage === 'undefined') {
    return false
  }
  try {
    localStorage.setItem(STORAGE_PROBE_KEY, '1')
    localStorage.removeItem(STORAGE_PROBE_KEY)
    return true
  } catch {
    return false
  }
}

function requireStorage(): Storage {
  if (!isStorageAvailable()) {
    throw new NetOpsStorageError(
      STORAGE_ERROR_CODES.STORAGE_UNAVAILABLE,
      '当前浏览器不支持本地存储或本地存储已被禁用',
    )
  }
  return localStorage
}

function readRaw(storage: Storage, key: string): string | null {
  try {
    return storage.getItem(key)
  } catch {
    return null
  }
}

function trySet(storage: Storage, key: string, value: string): boolean {
  try {
    storage.setItem(key, value)
    return true
  } catch {
    return false
  }
}

function restoreRaw(storage: Storage, key: string, previous: string | null): void {
  try {
    if (previous === null) {
      storage.removeItem(key)
    } else {
      storage.setItem(key, previous)
    }
  } catch {
    return
  }
}

function readIndex(storage: Storage): CanvasIndexEntry[] {
  const raw = readRaw(storage, CANVAS_INDEX_KEY)
  if (raw === null) {
    return []
  }
  try {
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) {
      return []
    }
    return parsed.filter(isCanvasIndexEntry)
  } catch {
    return []
  }
}

function toIndexEntry(canvas: PersonalCanvas): CanvasIndexEntry {
  const entry: CanvasIndexEntry = {
    id: canvas.id,
    title: canvas.title,
    nodeCount: canvas.nodes.length,
    edgeCount: canvas.edges.length,
    updatedAt: canvas.updatedAt,
  }
  if (canvas.basedOnCourseId !== undefined) {
    entry.basedOnCourseId = canvas.basedOnCourseId
  }
  return entry
}

function writeIndex(storage: Storage, entries: CanvasIndexEntry[], canvasAlreadySaved: boolean): void {
  try {
    storage.setItem(CANVAS_INDEX_KEY, JSON.stringify(entries))
  } catch (error) {
    if (isQuotaError(error)) {
      const message = canvasAlreadySaved
        ? '画布已保存，但索引写入失败：本地存储空间不足'
        : '索引写入失败：本地存储空间不足'
      throw new NetOpsStorageError(STORAGE_ERROR_CODES.STORAGE_FULL, message, error)
    }
    const message = canvasAlreadySaved ? '画布已保存，但索引写入失败' : '索引写入失败'
    throw new NetOpsStorageError(STORAGE_ERROR_CODES.STORAGE_UNAVAILABLE, message, error)
  }
}

function createUniqueCanvasId(storage: Storage): string {
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const id = createId('canvas')
    if (readRaw(storage, CANVAS_KEY_PREFIX + id) === null) {
      return id
    }
  }
  return createId('canvas')
}

function parseCanvasRecord(raw: string): PersonalCanvas {
  const parsed = JSON.parse(raw) as unknown
  const issues = validateCanvas(parsed as PersonalCanvas)
  if (issues.length > 0) {
    throw new NetOpsStorageError(
      STORAGE_ERROR_CODES.INVALID_CANVAS,
      `画布数据无效：${issues.join('；')}`,
    )
  }
  return parsed as PersonalCanvas
}

export function listCanvases(): CanvasIndexEntry[] {
  const storage = requireStorage()
  const index = readIndex(storage)
  const valid = index.filter((entry) => {
    const raw = readRaw(storage, CANVAS_KEY_PREFIX + entry.id)
    if (raw === null) {
      return false
    }
    try {
      parseCanvasRecord(raw)
      return true
    } catch {
      return false
    }
  })
  const sorted = [...valid].sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))
  if (sorted.length !== index.length) {
    trySet(storage, CANVAS_INDEX_KEY, JSON.stringify(sorted))
  }
  return sorted
}

export function loadCanvas(id: string): PersonalCanvas {
  const storage = requireStorage()
  const raw = readRaw(storage, CANVAS_KEY_PREFIX + id)
  if (raw === null) {
    throw new NetOpsStorageError(STORAGE_ERROR_CODES.CANVAS_NOT_FOUND, '未找到该画布')
  }
  try {
    return parseCanvasRecord(raw)
  } catch (error) {
    if (error instanceof NetOpsStorageError) {
      throw error
    }
    throw new NetOpsStorageError(STORAGE_ERROR_CODES.INVALID_CANVAS, '画布数据已损坏，无法读取', error)
  }
}

export function saveCanvas(canvas: PersonalCanvas): PersonalCanvas {
  const issues = validateCanvas(canvas)
  if (issues.length > 0) {
    throw new NetOpsStorageError(
      STORAGE_ERROR_CODES.INVALID_CANVAS,
      `画布数据无效：${issues.join('；')}`,
    )
  }
  const storage = requireStorage()
  const now = new Date().toISOString()
  const next: PersonalCanvas = { ...deepClone(canvas), updatedAt: now }
  const key = CANVAS_KEY_PREFIX + next.id
  const previous = readRaw(storage, key)
  try {
    storage.setItem(key, JSON.stringify(next))
  } catch (error) {
    restoreRaw(storage, key, previous)
    if (isQuotaError(error)) {
      throw new NetOpsStorageError(STORAGE_ERROR_CODES.STORAGE_FULL, '本地存储空间不足，画布保存失败', error)
    }
    throw new NetOpsStorageError(STORAGE_ERROR_CODES.STORAGE_UNAVAILABLE, '画布写入失败', error)
  }
  const entries = readIndex(storage).filter((entry) => entry.id !== next.id)
  entries.push(toIndexEntry(next))
  writeIndex(storage, entries, true)
  return next
}

export function renameCanvas(id: string, title: string): PersonalCanvas {
  const trimmed = title.trim()
  if (trimmed === '') {
    throw new NetOpsStorageError(STORAGE_ERROR_CODES.INVALID_CANVAS, '画布标题不能为空')
  }
  if (trimmed.length > MAX_TITLE_LENGTH) {
    throw new NetOpsStorageError(
      STORAGE_ERROR_CODES.INVALID_CANVAS,
      `画布标题不能超过 ${MAX_TITLE_LENGTH} 个字符`,
    )
  }
  const canvas = loadCanvas(id)
  return saveCanvas({ ...canvas, title: trimmed })
}

export function deleteCanvas(id: string): void {
  const storage = requireStorage()
  try {
    storage.removeItem(CANVAS_KEY_PREFIX + id)
  } catch (error) {
    throw new NetOpsStorageError(STORAGE_ERROR_CODES.STORAGE_UNAVAILABLE, '删除画布失败', error)
  }
  const entries = readIndex(storage).filter((entry) => entry.id !== id)
  writeIndex(storage, entries, false)
}

export function duplicateCanvas(id: string): PersonalCanvas {
  const storage = requireStorage()
  const source = loadCanvas(id)
  const now = new Date().toISOString()
  const baseTitle = source.title.slice(0, Math.max(1, MAX_TITLE_LENGTH - DUPLICATE_SUFFIX.length))
  const copy: PersonalCanvas = {
    ...deepClone(source),
    id: createUniqueCanvasId(storage),
    title: `${baseTitle}${DUPLICATE_SUFFIX}`,
    createdAt: now,
    updatedAt: now,
  }
  return saveCanvas(copy)
}

export function exportCanvasJson(id: string): string {
  const canvas = loadCanvas(id)
  return JSON.stringify(canvas, null, 2)
}

export function importCanvasJson(text: string): PersonalCanvas {
  const bytes = typeof TextEncoder !== 'undefined' ? new TextEncoder().encode(text).length : text.length * 2
  if (bytes > MAX_IMPORT_BYTES) {
    throw new NetOpsStorageError(STORAGE_ERROR_CODES.IMPORT_INVALID, '导入内容超过 2 MiB 限制')
  }
  let parsed: unknown
  try {
    parsed = JSON.parse(text) as unknown
  } catch (error) {
    throw new NetOpsStorageError(STORAGE_ERROR_CODES.IMPORT_INVALID, '导入内容不是合法的 JSON', error)
  }
  if (!isRecord(parsed) || parsed.schemaVersion !== 1) {
    throw new NetOpsStorageError(
      STORAGE_ERROR_CODES.IMPORT_INVALID,
      '仅支持 schemaVersion 为 1 的画布',
    )
  }
  const storage = requireStorage()
  const candidate = deepClone(parsed) as Record<string, unknown>
  candidate.id = createUniqueCanvasId(storage)
  const now = new Date().toISOString()
  candidate.createdAt = now
  candidate.updatedAt = now
  if (typeof candidate.canvasNote !== 'string') {
    candidate.canvasNote = ''
  }
  const canvas = candidate as unknown as PersonalCanvas
  const issues = validateCanvas(canvas)
  if (issues.length > 0) {
    throw new NetOpsStorageError(
      STORAGE_ERROR_CODES.IMPORT_INVALID,
      `画布校验失败：${issues.join('；')}`,
    )
  }
  return saveCanvas(canvas)
}

export function getProgress(): LocalProgress[] {
  const storage = requireStorage()
  const raw = readRaw(storage, PROGRESS_KEY)
  if (raw === null) {
    return []
  }
  try {
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) {
      return []
    }
    return parsed.filter(isLocalProgress).map((entry) => deepClone(entry))
  } catch {
    return []
  }
}

function writeProgress(storage: Storage, entries: LocalProgress[]): void {
  try {
    storage.setItem(PROGRESS_KEY, JSON.stringify(entries))
  } catch (error) {
    if (isQuotaError(error)) {
      throw new NetOpsStorageError(STORAGE_ERROR_CODES.STORAGE_FULL, '本地存储空间不足，学习进度保存失败', error)
    }
    throw new NetOpsStorageError(STORAGE_ERROR_CODES.STORAGE_UNAVAILABLE, '学习进度写入失败', error)
  }
}

export function saveProgress(entry: LocalProgress): LocalProgress {
  const storage = requireStorage()
  if (typeof entry.courseId !== 'string' || entry.courseId.trim() === '') {
    throw new NetOpsStorageError(STORAGE_ERROR_CODES.INVALID_CANVAS, '课程 ID 不能为空')
  }
  if (typeof entry.read !== 'boolean' || typeof entry.challengeAttempted !== 'boolean') {
    throw new NetOpsStorageError(STORAGE_ERROR_CODES.INVALID_CANVAS, '学习进度字段类型无效')
  }
  if (entry.lastStepId !== undefined && typeof entry.lastStepId !== 'string') {
    throw new NetOpsStorageError(STORAGE_ERROR_CODES.INVALID_CANVAS, '学习步骤 ID 必须是字符串')
  }
  const next: LocalProgress = { ...entry, updatedAt: new Date().toISOString() }
  const entries = getProgress().filter((item) => item.courseId !== next.courseId)
  entries.push(next)
  writeProgress(storage, entries)
  return next
}

function findProgress(courseId: string): LocalProgress {
  const existing = getProgress().find((entry) => entry.courseId === courseId)
  if (existing !== undefined) {
    return existing
  }
  return {
    courseId,
    read: false,
    challengeAttempted: false,
    updatedAt: new Date().toISOString(),
  }
}

export function markCourseStep(courseId: string, stepId: string): LocalProgress {
  if (typeof stepId !== 'string' || stepId.trim() === '') {
    throw new NetOpsStorageError(STORAGE_ERROR_CODES.INVALID_CANVAS, '学习步骤 ID 不能为空')
  }
  return saveProgress({ ...findProgress(courseId), courseId, lastStepId: stepId })
}

export function markCourseChallenge(courseId: string, attempted = true): LocalProgress {
  return saveProgress({ ...findProgress(courseId), courseId, challengeAttempted: attempted })
}

export function markCourseRead(courseId: string): LocalProgress {
  return saveProgress({ ...findProgress(courseId), courseId, read: true })
}

export function clearProgress(courseId?: string): void {
  const storage = requireStorage()
  if (courseId === undefined) {
    try {
      storage.removeItem(PROGRESS_KEY)
    } catch (error) {
      throw new NetOpsStorageError(STORAGE_ERROR_CODES.STORAGE_UNAVAILABLE, '清除学习进度失败', error)
    }
    return
  }
  const entries = getProgress().filter((entry) => entry.courseId !== courseId)
  if (entries.length === 0) {
    try {
      storage.removeItem(PROGRESS_KEY)
    } catch (error) {
      throw new NetOpsStorageError(STORAGE_ERROR_CODES.STORAGE_UNAVAILABLE, '清除学习进度失败', error)
    }
    return
  }
  writeProgress(storage, entries)
}