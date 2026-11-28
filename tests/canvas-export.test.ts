import { beforeEach, describe, expect, it } from 'vitest'
import { addEdge, addNode, createEmptyCanvas, validateCanvas } from '@/domain/canvas'
import type { PersonalCanvas } from '@/domain/types'
import { exportCanvasJson, importCanvasJson, listCanvases, saveCanvas } from '@/storage/localStore'

function buildCourseDerivedCanvas(): PersonalCanvas {
  let canvas = createEmptyCanvas('课程改练')
  canvas = addNode(canvas, {
    iconId: 'endpoint.pc',
    label: '办公终端',
    role: 'PC',
    position: { x: 80, y: 120 },
    ip: '192.0.2.10/24',
    note: '发起访问的终端',
  })
  canvas = addNode(canvas, {
    iconId: 'device.router',
    label: '边界路由',
    role: 'Router',
    position: { x: 360, y: 120 },
  })
  const firstId = canvas.nodes[0].id
  const secondId = canvas.nodes[1].id
  canvas = addEdge(canvas, {
    source: firstId,
    target: secondId,
    kind: 'logical',
    direction: 'forward',
    label: '默认出口',
    note: '向外部转发',
  })
  return {
    ...canvas,
    basedOnCourseId: 'l1-ping-path',
    basedOnTopologyId: 'topo-l1-ping',
    canvasNote: '用于复习课程中的出口路径。',
    zones: [
      {
        id: 'zone-office',
        label: '办公接入',
        x: 30,
        y: 60,
        width: 420,
        height: 220,
        tone: 'secure',
      },
    ],
  }
}

beforeEach(() => {
  localStorage.clear()
})

describe('画布导出与导入 JSON', () => {
  it('导出的 JSON 保留分区、方向、课程来源和画布说明', () => {
    const saved = saveCanvas(buildCourseDerivedCanvas())
    const text = exportCanvasJson(saved.id)
    expect(text).toContain('\n  "schemaVersion": 1')
    const parsed = JSON.parse(text) as PersonalCanvas
    expect(parsed.zones).toHaveLength(1)
    expect(parsed.zones[0].tone).toBe('secure')
    expect(parsed.edges[0].direction).toBe('forward')
    expect(parsed.basedOnCourseId).toBe('l1-ping-path')
    expect(parsed.canvasNote).toBe('用于复习课程中的出口路径。')
    expect(validateCanvas(parsed)).toEqual([])
  })

  it('导入保留内容但生成新的画布 ID 与时间戳，原画布不受影响', () => {
    const saved = saveCanvas(buildCourseDerivedCanvas())
    const imported = importCanvasJson(exportCanvasJson(saved.id))
    expect(imported.id).not.toBe(saved.id)
    expect(imported.title).toBe('课程改练')
    expect(imported.basedOnCourseId).toBe('l1-ping-path')
    expect(imported.canvasNote).toBe('用于复习课程中的出口路径。')
    expect(imported.zones).toEqual(saved.zones)
    expect(imported.edges[0].direction).toBe('forward')
    expect(validateCanvas(imported)).toEqual([])
    const reloadedOriginal = listCanvases().find((entry) => entry.id === saved.id)
    expect(reloadedOriginal?.title).toBe('课程改练')
  })

  it('同一份 JSON 连续导入两次得到两张独立画布', () => {
    const saved = saveCanvas(buildCourseDerivedCanvas())
    const json = exportCanvasJson(saved.id)
    const first = importCanvasJson(json)
    const second = importCanvasJson(json)
    expect(first.id).not.toBe(second.id)
    expect(listCanvases()).toHaveLength(3)
    expect(listCanvases().every((entry) => entry.basedOnCourseId === 'l1-ping-path')).toBe(true)
  })

  it('导入时补齐缺失的画布说明字段', () => {
    const saved = saveCanvas(buildCourseDerivedCanvas())
    const parsed = JSON.parse(exportCanvasJson(saved.id)) as Record<string, unknown>
    delete parsed.canvasNote
    const imported = importCanvasJson(JSON.stringify(parsed))
    expect(imported.canvasNote).toBe('')
    expect(validateCanvas(imported)).toEqual([])
  })
})