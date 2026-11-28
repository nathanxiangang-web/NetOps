import { describe, expect, it } from 'vitest'
import {
  CanvasValidationError,
  GRID_PLACEMENT_COLUMNS,
  GRID_PLACEMENT_NODE_HEIGHT,
  GRID_PLACEMENT_NODE_WIDTH,
  GRID_PLACEMENT_X_GAP,
  GRID_PLACEMENT_Y_GAP,
  MAX_EDGES,
  MAX_NODES,
  addEdge,
  addNode,
  computeGridPlacement,
  createEmptyCanvas,
  createId,
  deepClone,
  deleteEdge,
  deleteNode,
  topologyToPersonalCanvas,
  updateEdge,
  updateNode,
  validateCanvas,
} from '@/domain/canvas'
import type { PersonalCanvas, Topology } from '@/domain/types'

function expectValidationError(action: () => unknown): CanvasValidationError {
  let caught: unknown
  try {
    action()
  } catch (error) {
    caught = error
  }
  expect(caught).toBeInstanceOf(CanvasValidationError)
  return caught as CanvasValidationError
}

function buildCanvasWithNodes(count: number): PersonalCanvas {
  let canvas = createEmptyCanvas('容量测试')
  for (let index = 0; index < count; index += 1) {
    canvas = addNode(canvas, {
      iconId: 'endpoint.pc',
      label: `节点${index}`,
      role: '终端',
      position: { x: 100 + index, y: 100 },
    })
  }
  return canvas
}

function buildTwoNodeCanvas(): { canvas: PersonalCanvas; firstId: string; secondId: string } {
  let canvas = createEmptyCanvas('双节点')
  canvas = addNode(canvas, {
    iconId: 'device.router',
    label: '路由器',
    role: '出口',
    position: { x: 100, y: 100 },
  })
  canvas = addNode(canvas, {
    iconId: 'device.switch.l2',
    label: '交换机',
    role: '接入',
    position: { x: 300, y: 100 },
  })
  return { canvas, firstId: canvas.nodes[0].id, secondId: canvas.nodes[1].id }
}

describe('canvas 领域操作', () => {
  it('创建空画布包含必填字段和合法时间戳', () => {
    const canvas = createEmptyCanvas('空白画布')
    expect(canvas.schemaVersion).toBe(1)
    expect(canvas.id.startsWith('canvas-')).toBe(true)
    expect(canvas.title).toBe('空白画布')
    expect(canvas.canvasNote).toBe('')
    expect(canvas.nodes).toEqual([])
    expect(canvas.edges).toEqual([])
    expect(canvas.zones).toEqual([])
    expect(Number.isNaN(Date.parse(canvas.createdAt))).toBe(false)
    expect(Number.isNaN(Date.parse(canvas.updatedAt))).toBe(false)
    expect(validateCanvas(canvas)).toEqual([])
  })

  it('createId 带前缀，deepClone 生成独立副本', () => {
    expect(createId('node').startsWith('node-')).toBe(true)
    const source = { nested: { value: 1 }, list: [1, 2, 3] }
    const clone = deepClone(source)
    clone.nested.value = 9
    clone.list.push(4)
    expect(source.nested.value).toBe(1)
    expect(source.list).toEqual([1, 2, 3])
  })

  it('deepClone 遇到不可克隆函数属性时回退 JSON 并返回独立副本', () => {
    const source = {
      label: '带函数对象',
      nested: { value: 1 },
      handler: () => 'noop',
    }
    const clone = deepClone(source)
    expect(clone).not.toBe(source)
    expect(clone.nested).not.toBe(source.nested)
    expect(clone).toEqual({ label: '带函数对象', nested: { value: 1 } })
    clone.nested.value = 9
    expect(source.nested.value).toBe(1)
  })

  it('deepClone 遇到响应式代理等价对象时回退 JSON 且不抛错', () => {
    const source = { label: '代理画布', nested: { value: 2 } }
    const proxy = new Proxy(source, {})
    const clone = deepClone(proxy)
    expect(clone).not.toBe(proxy)
    expect(clone).toEqual({ label: '代理画布', nested: { value: 2 } })
    clone.nested.value = 8
    expect(source.nested.value).toBe(2)
  })

  it('addNode 可直接接受代理画布和带函数属性的输入对象', () => {
    const original = createEmptyCanvas('代理画布')
    const reactiveCanvas = new Proxy(original, {})
    const input = {
      iconId: 'endpoint.pc',
      label: '终端',
      role: '用户',
      position: { x: 120, y: 80 },
      onSelect: () => 'noop',
    }
    const next = addNode(reactiveCanvas, input)
    expect(next).not.toBe(original)
    expect(original.nodes).toHaveLength(0)
    expect(next.nodes).toHaveLength(1)
    expect(next.nodes[0].position).toEqual({ x: 120, y: 80 })
    expect(validateCanvas(next)).toEqual([])
  })

  it('课程拓扑转画布后与源对象互相独立', () => {
    const topology: Topology = {
      schemaVersion: 1,
      id: 'topo-1',
      title: '课程拓扑',
      summary: '摘要',
      nodes: [
        { id: 'n1', iconId: 'device.router', label: '路由器', role: '出口', position: { x: 0, y: 0 } },
        { id: 'n2', iconId: 'device.switch.l2', label: '交换机', role: '接入', position: { x: 200, y: 0 } },
      ],
      edges: [{ id: 'e1', source: 'n1', target: 'n2', kind: 'physical' }],
      zones: [{ id: 'z1', label: '核心区', x: 0, y: 0, width: 320, height: 200 }],
      assumptions: [],
    }
    const canvas = topologyToPersonalCanvas(topology, { courseId: 'course-1' })
    expect(canvas.id).not.toBe(topology.id)
    expect(canvas.basedOnTopologyId).toBe('topo-1')
    expect(canvas.basedOnCourseId).toBe('course-1')
    expect(canvas.canvasNote).toBe('')
    expect(canvas.nodes).not.toBe(topology.nodes)
    expect(canvas.nodes[0]).not.toBe(topology.nodes[0])
    canvas.nodes[0].label = '已修改'
    canvas.nodes[0].position.x = 999
    expect(topology.nodes[0].label).toBe('路由器')
    expect(topology.nodes[0].position.x).toBe(0)
    topology.nodes[1].role = '源对象修改'
    expect(canvas.nodes[1].role).toBe('接入')
    expect(validateCanvas(canvas)).toEqual([])
  })

  it('addNode 返回新对象且不修改原画布，缺省位置有效', () => {
    const original = createEmptyCanvas('不可变')
    const next = addNode(original, { iconId: 'endpoint.pc', label: '终端', role: '用户' })
    expect(next).not.toBe(original)
    expect(original.nodes).toHaveLength(0)
    expect(next.nodes).toHaveLength(1)
    expect(Number.isFinite(next.nodes[0].position.x)).toBe(true)
    expect(Number.isFinite(next.nodes[0].position.y)).toBe(true)
    expect(validateCanvas(next)).toEqual([])
  })

  it('deleteNode 级联删除关联连线，deleteEdge 单独删除', () => {
    const { canvas, firstId, secondId } = buildTwoNodeCanvas()
    const withEdge = addEdge(canvas, { source: firstId, target: secondId, kind: 'physical' })
    const nodeId = withEdge.nodes[0].id
    const edgeId = withEdge.edges[0].id
    const withoutEdge = deleteEdge(withEdge, edgeId)
    expect(withoutEdge.edges).toHaveLength(0)
    expect(withoutEdge.nodes).toHaveLength(2)
    const withoutNode = deleteNode(withEdge, nodeId)
    expect(withoutNode.nodes).toHaveLength(1)
    expect(withoutNode.edges).toHaveLength(0)
    expect(withoutNode.edges.some((edge) => edge.source === nodeId || edge.target === nodeId)).toBe(false)
    expect(validateCanvas(withoutNode)).toEqual([])
  })

  it('拒绝自环、悬空和重复端点连线', () => {
    const { canvas, firstId, secondId } = buildTwoNodeCanvas()
    expectValidationError(() => addEdge(canvas, { source: firstId, target: firstId }))
    expectValidationError(() => addEdge(canvas, { source: firstId, target: 'missing' }))
    const withEdge = addEdge(canvas, { source: firstId, target: secondId, kind: 'logical' })
    expectValidationError(() => addEdge(withEdge, { source: firstId, target: secondId, kind: 'logical' }))
    expectValidationError(() => addEdge(withEdge, { source: secondId, target: firstId, kind: 'logical' }))
    const otherKind = addEdge(withEdge, { source: firstId, target: secondId, kind: 'mirror' })
    expect(otherKind.edges).toHaveLength(2)
  })

  it('节点数量上限为 40', () => {
    const canvas = buildCanvasWithNodes(MAX_NODES)
    expect(canvas.nodes).toHaveLength(MAX_NODES)
    const error = expectValidationError(() =>
      addNode(canvas, { iconId: 'endpoint.pc', label: '溢出节点', role: '终端' }),
    )
    expect(error.issues.length).toBeGreaterThan(0)
  })

  it('连线数量上限为 80', () => {
    let canvas = buildCanvasWithNodes(MAX_NODES)
    const pairs: { source: string; target: string }[] = []
    for (let left = 0; left < canvas.nodes.length && pairs.length < MAX_EDGES; left += 1) {
      for (let right = left + 1; right < canvas.nodes.length && pairs.length < MAX_EDGES; right += 1) {
        pairs.push({ source: canvas.nodes[left].id, target: canvas.nodes[right].id })
      }
    }
    expect(pairs).toHaveLength(MAX_EDGES)
    for (const pair of pairs) {
      canvas = addEdge(canvas, { source: pair.source, target: pair.target, kind: 'physical' })
    }
    expect(canvas.edges).toHaveLength(MAX_EDGES)
    expectValidationError(() =>
      addEdge(canvas, { source: canvas.nodes[0].id, target: canvas.nodes[1].id, kind: 'logical' }),
    )
  })

  it('updateNode 与 updateEdge 可更新字段但不可修改 ID', () => {
    const { canvas, firstId, secondId } = buildTwoNodeCanvas()
    const withEdge = addEdge(canvas, { source: firstId, target: secondId, kind: 'physical' })
    const edgeId = withEdge.edges[0].id
    const updatedNode = updateNode(withEdge, firstId, { label: '核心路由', position: { x: 42, y: 24 } })
    expect(updatedNode.nodes[0].label).toBe('核心路由')
    expect(updatedNode.nodes[0].position).toEqual({ x: 42, y: 24 })
    expect(updatedNode.nodes[0].id).toBe(firstId)
    expectValidationError(() => updateNode(withEdge, firstId, { id: 'changed' }))
    const updatedEdge = updateEdge(withEdge, edgeId, { label: '上联链路', kind: 'logical' })
    expect(updatedEdge.edges[0].label).toBe('上联链路')
    expect(updatedEdge.edges[0].kind).toBe('logical')
    expectValidationError(() => updateEdge(withEdge, edgeId, { id: 'changed' }))
    expect(validateCanvas(updatedEdge)).toEqual([])
  })

  it('删除不存在的节点或连线会抛出校验错误', () => {
    const { canvas } = buildTwoNodeCanvas()
    expectValidationError(() => deleteNode(canvas, 'missing'))
    expectValidationError(() => deleteEdge(canvas, 'missing'))
  })

  it('validateCanvas 能识别未知图标、坐标和悬空引用', () => {
    const { canvas, firstId } = buildTwoNodeCanvas()
    const broken: PersonalCanvas = deepClone(canvas)
    broken.nodes[0].iconId = 'unknown.icon'
    broken.nodes[0].position = { x: Number.NaN, y: 0 }
    broken.edges.push({ id: 'edge-x', source: firstId, target: 'missing', kind: 'physical' })
    const issues = validateCanvas(broken)
    expect(issues.length).toBeGreaterThanOrEqual(3)
    expect(issues.join('；')).toContain('未知图标')
    expect(issues.join('；')).toContain('终点节点不存在')
  })
})
describe('computeGridPlacement 网格放置', () => {
  const center = { x: 500, y: 400 }

  function isOverlapping(
    left: { position: { x: number; y: number } },
    right: { position: { x: number; y: number } },
  ): boolean {
    return (
      Math.abs(left.position.x - right.position.x) < GRID_PLACEMENT_NODE_WIDTH &&
      Math.abs(left.position.y - right.position.y) < GRID_PLACEMENT_NODE_HEIGHT
    )
  }

  it('首节点以画布中心为基准，位置向左上偏移半个节点', () => {
    const point = computeGridPlacement(center, 0)
    expect(point).toEqual({
      x: center.x - GRID_PLACEMENT_NODE_WIDTH / 2,
      y: center.y - GRID_PLACEMENT_NODE_HEIGHT / 2,
    })
  })

  it('前三个节点同排，x 间距 210，互不重叠', () => {
    const points = [0, 1, 2].map((index) => computeGridPlacement(center, index))
    expect(points[1].x - points[0].x).toBe(GRID_PLACEMENT_X_GAP)
    expect(points[2].x - points[1].x).toBe(GRID_PLACEMENT_X_GAP)
    expect(points[1].y).toBe(points[0].y)
    for (let left = 0; left < points.length; left += 1) {
      for (let right = left + 1; right < points.length; right += 1) {
        expect(
          isOverlapping({ position: points[left] }, { position: points[right] }),
        ).toBe(false)
      }
    }
  })

  it('第 4 个节点换行，y 间距 190 且与首排不重叠', () => {
    const first = computeGridPlacement(center, 0)
    const fifth = computeGridPlacement(center, GRID_PLACEMENT_COLUMNS)
    expect(fifth.x).toBe(first.x)
    expect(fifth.y - first.y).toBe(GRID_PLACEMENT_Y_GAP)
    expect(isOverlapping({ position: first }, { position: fifth })).toBe(false)
  })

  it('落点与已有节点冲突时按序选择下一个空格', () => {
    const occupied = computeGridPlacement(center, 0)
    const point = computeGridPlacement(center, 1, [{ position: occupied }])
    expect(point).not.toEqual(occupied)
    expect(point.x - occupied.x).toBe(GRID_PLACEMENT_X_GAP)
    expect(isOverlapping({ position: occupied }, { position: point })).toBe(false)
  })

  it('非法索引按 0 处理，保证返回有限坐标', () => {
    const fromNegative = computeGridPlacement(center, -3)
    expect(fromNegative).toEqual(computeGridPlacement(center, 0))
    const fromNaN = computeGridPlacement(center, Number.NaN)
    expect(Number.isFinite(fromNaN.x)).toBe(true)
    expect(Number.isFinite(fromNaN.y)).toBe(true)
  })
})