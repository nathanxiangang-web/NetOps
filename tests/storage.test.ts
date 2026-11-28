import { beforeEach, describe, expect, it, vi } from 'vitest'
import { addNode, createEmptyCanvas, deepClone } from '@/domain/canvas'
import type { LocalProgress, PersonalCanvas } from '@/domain/types'
import { NetOpsStorageError } from '@/storage/errors'
import type { StorageErrorCode } from '@/storage/errors'
import {
  clearProgress,
  deleteCanvas,
  duplicateCanvas,
  exportCanvasJson,
  getProgress,
  importCanvasJson,
  isStorageAvailable,
  listCanvases,
  loadCanvas,
  markCourseChallenge,
  markCourseRead,
  markCourseStep,
  renameCanvas,
  saveCanvas,
  saveProgress,
} from '@/storage/localStore'

function expectStorageError(action: () => unknown, code: StorageErrorCode): NetOpsStorageError {
  let caught: unknown
  try {
    action()
  } catch (error) {
    caught = error
  }
  expect(caught).toBeInstanceOf(NetOpsStorageError)
  const storageError = caught as NetOpsStorageError
  expect(storageError.code).toBe(code)
  return storageError
}

function makeCanvas(title: string): PersonalCanvas {
  let canvas = createEmptyCanvas(title)
  canvas = addNode(canvas, {
    iconId: 'endpoint.pc',
    label: '终端',
    role: '用户终端',
    position: { x: 120, y: 80 },
  })
  canvas = addNode(canvas, {
    iconId: 'device.router',
    label: '路由器',
    role: '出口网关',
    position: { x: 360, y: 80 },
  })
  const firstId = canvas.nodes[0].id
  const secondId = canvas.nodes[1].id
  return {
    ...canvas,
    edges: [{ id: 'edge-main', source: firstId, target: secondId, kind: 'physical' }],
  }
}

function makeNode(index: number) {
  return {
    id: `legacy-node-${index}`,
    iconId: 'endpoint.pc',
    label: `节点${index}`,
    role: '终端',
    position: { x: index, y: index },
  }
}

beforeEach(() => {
  localStorage.clear()
  vi.useRealTimers()
  vi.restoreAllMocks()
})

describe('localStore 画布持久化', () => {
  it('localStorage 可用', () => {
    expect(isStorageAvailable()).toBe(true)
  })

  it('保存后可重新读取，索引记录节点和连线数量', () => {
    const canvas = makeCanvas('持久化画布')
    const saved = saveCanvas(canvas)
    const list = listCanvases()
    expect(list).toHaveLength(1)
    expect(list[0].id).toBe(canvas.id)
    expect(list[0].nodeCount).toBe(2)
    expect(list[0].edgeCount).toBe(1)
    expect(list[0].updatedAt).toBe(saved.updatedAt)
    const reloaded = loadCanvas(canvas.id)
    expect(reloaded.title).toBe('持久化画布')
    expect(reloaded.canvasNote).toBe('')
    expect(reloaded.nodes).toHaveLength(2)
  })

  it('索引按 updatedAt 降序排列', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-01-01T00:00:00.000Z'))
    const first = saveCanvas(makeCanvas('第一张'))
    vi.setSystemTime(new Date('2026-01-02T00:00:00.000Z'))
    const second = saveCanvas(makeCanvas('第二张'))
    vi.useRealTimers()
    expect(listCanvases().map((entry) => entry.id)).toEqual([second.id, first.id])
  })

  it('重命名画布', () => {
    const saved = saveCanvas(makeCanvas('旧标题'))
    const renamed = renameCanvas(saved.id, '新标题')
    expect(renamed.title).toBe('新标题')
    expect(loadCanvas(saved.id).title).toBe('新标题')
    expect(listCanvases()[0].title).toBe('新标题')
    expectStorageError(() => renameCanvas(saved.id, '   '), 'INVALID_CANVAS')
  })

  it('复制画布生成新 ID、副本后缀和独立深拷贝', () => {
    const saved = saveCanvas(makeCanvas('源画布'))
    const copy = duplicateCanvas(saved.id)
    expect(copy.id).not.toBe(saved.id)
    expect(copy.title).toBe('源画布 副本')
    expect(copy.nodes).not.toBe(saved.nodes)
    copy.nodes[0].label = '副本内修改'
    expect(loadCanvas(saved.id).nodes[0].label).toBe('终端')
    expect(listCanvases()).toHaveLength(2)
  })

  it('删除画布后索引与记录都消失', () => {
    const saved = saveCanvas(makeCanvas('待删除'))
    deleteCanvas(saved.id)
    expect(listCanvases()).toEqual([])
    expectStorageError(() => loadCanvas(saved.id), 'CANVAS_NOT_FOUND')
  })

  it('导出再导入会生成新 ID 且保留内容', () => {
    const saved = saveCanvas(makeCanvas('导出画布'))
    const json = exportCanvasJson(saved.id)
    const parsed = JSON.parse(json) as PersonalCanvas
    expect(parsed.schemaVersion).toBe(1)
    expect(parsed.canvasNote).toBe('')
    const imported = importCanvasJson(json)
    expect(imported.id).not.toBe(saved.id)
    expect(imported.title).toBe('导出画布')
    expect(imported.nodes).toHaveLength(2)
    expect(imported.edges).toHaveLength(1)
    expect(loadCanvas(saved.id).id).toBe(saved.id)
    expect(listCanvases()).toHaveLength(2)
  })

  it('导入非法 JSON、未知 schemaVersion 均失败', () => {
    expectStorageError(() => importCanvasJson('{bad json'), 'IMPORT_INVALID')
    expectStorageError(() => importCanvasJson(JSON.stringify({ schemaVersion: 2, id: 'x' })), 'IMPORT_INVALID')
    expectStorageError(() => importCanvasJson('x'.repeat(2 * 1024 * 1024 + 1)), 'IMPORT_INVALID')
    expect(listCanvases()).toEqual([])
  })

  it('导入悬空边、未知图标、超限节点失败且不覆盖已有画布', () => {
    const saved = saveCanvas(makeCanvas('原始画布'))
    const dangling = deepClone(saved)
    dangling.edges[0].target = 'missing-node'
    expectStorageError(() => importCanvasJson(JSON.stringify(dangling)), 'IMPORT_INVALID')
    const unknownIcon = deepClone(saved)
    unknownIcon.nodes[0].iconId = 'unknown.icon'
    expectStorageError(() => importCanvasJson(JSON.stringify(unknownIcon)), 'IMPORT_INVALID')
    const overloaded = { ...deepClone(saved), nodes: Array.from({ length: 41 }, (_, index) => makeNode(index)) }
    overloaded.edges = []
    expectStorageError(() => importCanvasJson(JSON.stringify(overloaded)), 'IMPORT_INVALID')
    const reloaded = loadCanvas(saved.id)
    expect(reloaded.title).toBe('原始画布')
    expect(reloaded.nodes).toHaveLength(2)
    expect(listCanvases()).toHaveLength(1)
  })

  it('配额错误抛出 STORAGE_FULL 且旧记录不被覆盖', () => {
    const saved = saveCanvas(makeCanvas('配额画布'))
    const originalSetItem = Storage.prototype.setItem
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(function (this: Storage, key: string, value: string) {
      if (key.startsWith('netops.canvas.v1.')) {
        const error = new Error('quota')
        error.name = 'QuotaExceededError'
        throw error
      }
      return originalSetItem.call(this, key, value)
    })
    expectStorageError(() => saveCanvas({ ...saved, title: '失败标题' }), 'STORAGE_FULL')
    vi.restoreAllMocks()
    const reloaded = loadCanvas(saved.id)
    expect(reloaded.title).toBe('配额画布')
  })

  it('localStorage 中的坏数据不会导致崩溃', () => {
    localStorage.setItem('netops.canvas.index.v1', '{bad')
    localStorage.setItem('netops.canvas.v1.bad', 'oops')
    expect(listCanvases()).toEqual([])
    expectStorageError(() => loadCanvas('bad'), 'INVALID_CANVAS')
    expectStorageError(() => loadCanvas('ghost'), 'CANVAS_NOT_FOUND')
  })

  it('索引中不存在的记录会被过滤', () => {
    localStorage.setItem(
      'netops.canvas.index.v1',
      JSON.stringify([
        {
          id: 'ghost',
          title: '幽灵画布',
          nodeCount: 0,
          edgeCount: 0,
          updatedAt: new Date().toISOString(),
        },
      ]),
    )
    expect(listCanvases()).toEqual([])
  })
})

describe('localStore 学习进度', () => {
  it('标记步骤、已读和挑战状态', () => {
    markCourseStep('course-a', 'step-1')
    let entries = getProgress()
    expect(entries).toHaveLength(1)
    expect(entries[0].courseId).toBe('course-a')
    expect(entries[0].lastStepId).toBe('step-1')
    expect(entries[0].read).toBe(false)
    markCourseRead('course-a')
    markCourseChallenge('course-a')
    entries = getProgress()
    expect(entries[0].read).toBe(true)
    expect(entries[0].challengeAttempted).toBe(true)
    markCourseChallenge('course-a', false)
    expect(getProgress()[0].challengeAttempted).toBe(false)
    expect(Number.isNaN(Date.parse(getProgress()[0].updatedAt))).toBe(false)
  })

  it('saveProgress 校验失败抛出 INVALID_CANVAS', () => {
    const invalid = {
      courseId: '',
      read: 'yes',
      challengeAttempted: false,
      updatedAt: new Date().toISOString(),
    } as unknown as LocalProgress
    expectStorageError(() => saveProgress(invalid), 'INVALID_CANVAS')
    expect(getProgress()).toEqual([])
  })

  it('clearProgress 可按课程或全部清除', () => {
    markCourseStep('course-a', 'step-1')
    markCourseStep('course-b', 'step-2')
    clearProgress('course-a')
    expect(getProgress().map((entry) => entry.courseId)).toEqual(['course-b'])
    clearProgress()
    expect(getProgress()).toEqual([])
  })

  it('进度 JSON 损坏时返回空数组', () => {
    localStorage.setItem('netops.progress.v1', 'not-json')
    expect(getProgress()).toEqual([])
    localStorage.setItem('netops.progress.v1', JSON.stringify([{ courseId: 1 }]))
    expect(getProgress()).toEqual([])
  })
})