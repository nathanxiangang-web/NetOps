import { iconById } from './icons'
import type {
  EdgeDirection,
  EdgeKind,
  PersonalCanvas,
  Topology,
  TopologyEdge,
  TopologyNode,
  TopologyZone,
} from './types'

export const MAX_NODES = 40
export const MAX_EDGES = 80
export const MAX_ZONES = 6
export const MAX_NOTE_LENGTH = 2000
export const MAX_CANVAS_NOTE_LENGTH = 5000
export const MAX_TITLE_LENGTH = 80
export const MAX_LABEL_LENGTH = 120
export const MAX_ROLE_LENGTH = 300
export const MAX_IP_LENGTH = 80

const EDGE_KINDS: readonly EdgeKind[] = ['physical', 'logical', 'annotation', 'mirror']
const EDGE_DIRECTIONS: readonly EdgeDirection[] = ['none', 'forward', 'backward']
const ZONE_TONES: readonly NonNullable<TopologyZone['tone']>[] = ['default', 'secure', 'cloud', 'warning']

export class CanvasValidationError extends Error {
  readonly issues: string[]

  constructor(issues: string[]) {
    super(issues.length > 0 ? issues[0] : '画布校验未通过')
    this.name = 'CanvasValidationError'
    this.issues = [...issues]
  }
}

export interface AddNodeInput {
  iconId: string
  label: string
  role: string
  position?: { x: number; y: number }
  ip?: string
  note?: string
  ports?: string[]
  id?: string
}

export interface AddEdgeInput {
  source: string
  target: string
  kind?: EdgeKind
  direction?: EdgeDirection
  label?: string
  note?: string
  sourcePort?: string
  targetPort?: string
  id?: string
}

export function createId(prefix: string): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}-${crypto.randomUUID()}`
  }
  const random = Math.random().toString(36).slice(2, 10)
  return `${prefix}-${Date.now().toString(36)}-${random}`
}

export function deepClone<T>(value: T): T {
  if (typeof structuredClone === 'function') {
    try {
      return structuredClone(value)
    } catch (cloneError) {
      try {
        return JSON.parse(JSON.stringify(value)) as T
      } catch {
        throw cloneError
      }
    }
  }
  return JSON.parse(JSON.stringify(value)) as T
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

function normalizeTitle(value: string): string {
  const trimmed = value.trim()
  if (trimmed === '') {
    return '未命名画布'
  }
  return trimmed.slice(0, MAX_TITLE_LENGTH)
}

export function validateCanvas(canvas: PersonalCanvas): string[] {
  const issues: string[] = []
  if (!isRecord(canvas)) {
    return ['画布数据不是有效的对象']
  }
  const data = canvas as unknown as Record<string, unknown>

  if (data.schemaVersion !== 1) {
    issues.push('画布 schemaVersion 必须为 1')
  }
  if (typeof data.id !== 'string' || data.id.trim() === '') {
    issues.push('画布 ID 不能为空')
  }
  if (typeof data.title !== 'string' || data.title.trim() === '') {
    issues.push('画布标题不能为空')
  } else if (data.title.length > MAX_TITLE_LENGTH) {
    issues.push(`画布标题不能超过 ${MAX_TITLE_LENGTH} 个字符`)
  }
  if (typeof data.canvasNote !== 'string') {
    issues.push('画布备注必须是字符串')
  } else if (data.canvasNote.length > MAX_CANVAS_NOTE_LENGTH) {
    issues.push(`画布备注不能超过 ${MAX_CANVAS_NOTE_LENGTH} 个字符`)
  }
  if (typeof data.createdAt !== 'string' || Number.isNaN(Date.parse(data.createdAt))) {
    issues.push('画布创建时间无效')
  }
  if (typeof data.updatedAt !== 'string' || Number.isNaN(Date.parse(data.updatedAt))) {
    issues.push('画布更新时间无效')
  }

  const allIds = new Set<string>()
  const nodeIds = new Set<string>()

  const registerId = (id: string, kindLabel: string, index: number): void => {
    if (allIds.has(id)) {
      issues.push(`${kindLabel} #${index + 1} 的 ID 与已有元素重复：${id}`)
      return
    }
    allIds.add(id)
  }

  if (!Array.isArray(data.nodes)) {
    issues.push('画布 nodes 必须是数组')
  } else {
    if (data.nodes.length > MAX_NODES) {
      issues.push(`画布节点数量不能超过 ${MAX_NODES} 个`)
    }
    data.nodes.forEach((raw, index) => {
      const position = index + 1
      if (!isRecord(raw)) {
        issues.push(`节点 #${position} 数据无效`)
        return
      }
      if (typeof raw.id !== 'string' || raw.id.trim() === '') {
        issues.push(`节点 #${position} 的 ID 不能为空`)
      } else {
        registerId(raw.id, '节点', index)
        nodeIds.add(raw.id)
      }
      if (typeof raw.iconId !== 'string' || !iconById.has(raw.iconId)) {
        issues.push(`节点 #${position} 使用了未知图标`)
      }
      if (typeof raw.label !== 'string' || raw.label.trim() === '') {
        issues.push(`节点 #${position} 的名称不能为空`)
      } else if (raw.label.length > MAX_LABEL_LENGTH) {
        issues.push(`节点 #${position} 的名称不能超过 ${MAX_LABEL_LENGTH} 个字符`)
      }
      if (typeof raw.role !== 'string') {
        issues.push(`节点 #${position} 的角色必须是字符串`)
      } else if (raw.role.length > MAX_ROLE_LENGTH) {
        issues.push(`节点 #${position} 的角色不能超过 ${MAX_ROLE_LENGTH} 个字符`)
      }
      if (raw.ip !== undefined) {
        if (typeof raw.ip !== 'string') {
          issues.push(`节点 #${position} 的 IP 必须是字符串`)
        } else if (raw.ip.length > MAX_IP_LENGTH) {
          issues.push(`节点 #${position} 的 IP 不能超过 ${MAX_IP_LENGTH} 个字符`)
        }
      }
      if (raw.note !== undefined) {
        if (typeof raw.note !== 'string') {
          issues.push(`节点 #${position} 的备注必须是字符串`)
        } else if (raw.note.length > MAX_NOTE_LENGTH) {
          issues.push(`节点 #${position} 的备注不能超过 ${MAX_NOTE_LENGTH} 个字符`)
        }
      }
      if (!isRecord(raw.position)) {
        issues.push(`节点 #${position} 缺少有效坐标`)
      } else if (!isFiniteNumber(raw.position.x) || !isFiniteNumber(raw.position.y)) {
        issues.push(`节点 #${position} 的坐标必须是有限数字`)
      }
      if (raw.ports !== undefined) {
        if (!Array.isArray(raw.ports) || raw.ports.some((port) => typeof port !== 'string')) {
          issues.push(`节点 #${position} 的端口列表必须是字符串数组`)
        }
      }
    })
  }

  if (!Array.isArray(data.edges)) {
    issues.push('画布 edges 必须是数组')
  } else {
    if (data.edges.length > MAX_EDGES) {
      issues.push(`画布连线数量不能超过 ${MAX_EDGES} 条`)
    }
    data.edges.forEach((raw, index) => {
      const position = index + 1
      if (!isRecord(raw)) {
        issues.push(`连线 #${position} 数据无效`)
        return
      }
      if (typeof raw.id !== 'string' || raw.id.trim() === '') {
        issues.push(`连线 #${position} 的 ID 不能为空`)
      } else {
        registerId(raw.id, '连线', index)
      }
      const source = raw.source
      const target = raw.target
      if (typeof source !== 'string' || source.trim() === '') {
        issues.push(`连线 #${position} 的起点不能为空`)
      }
      if (typeof target !== 'string' || target.trim() === '') {
        issues.push(`连线 #${position} 的终点不能为空`)
      }
      if (typeof source === 'string' && source !== '' && typeof target === 'string' && source === target) {
        issues.push(`连线 #${position} 不能连接到同一个节点`)
      }
      if (typeof source === 'string' && source !== '' && !nodeIds.has(source)) {
        issues.push(`连线 #${position} 的起点节点不存在：${source}`)
      }
      if (typeof target === 'string' && target !== '' && !nodeIds.has(target)) {
        issues.push(`连线 #${position} 的终点节点不存在：${target}`)
      }
      if (typeof raw.kind !== 'string' || !EDGE_KINDS.includes(raw.kind as EdgeKind)) {
        issues.push(`连线 #${position} 的类型无效`)
      }
      if (raw.direction !== undefined) {
        if (typeof raw.direction !== 'string' || !EDGE_DIRECTIONS.includes(raw.direction as EdgeDirection)) {
          issues.push(`连线 #${position} 的方向无效`)
        }
      }
      if (raw.label !== undefined) {
        if (typeof raw.label !== 'string') {
          issues.push(`连线 #${position} 的标签必须是字符串`)
        } else if (raw.label.length > MAX_LABEL_LENGTH) {
          issues.push(`连线 #${position} 的标签不能超过 ${MAX_LABEL_LENGTH} 个字符`)
        }
      }
      if (raw.note !== undefined) {
        if (typeof raw.note !== 'string') {
          issues.push(`连线 #${position} 的备注必须是字符串`)
        } else if (raw.note.length > MAX_NOTE_LENGTH) {
          issues.push(`连线 #${position} 的备注不能超过 ${MAX_NOTE_LENGTH} 个字符`)
        }
      }
      if (raw.sourcePort !== undefined && typeof raw.sourcePort !== 'string') {
        issues.push(`连线 #${position} 的源端口必须是字符串`)
      }
      if (raw.targetPort !== undefined && typeof raw.targetPort !== 'string') {
        issues.push(`连线 #${position} 的目标端口必须是字符串`)
      }
    })
  }

  if (!Array.isArray(data.zones)) {
    issues.push('画布 zones 必须是数组')
  } else {
    if (data.zones.length > MAX_ZONES) {
      issues.push(`画布区域数量不能超过 ${MAX_ZONES} 个`)
    }
    data.zones.forEach((raw, index) => {
      const position = index + 1
      if (!isRecord(raw)) {
        issues.push(`区域 #${position} 数据无效`)
        return
      }
      if (typeof raw.id !== 'string' || raw.id.trim() === '') {
        issues.push(`区域 #${position} 的 ID 不能为空`)
      } else {
        registerId(raw.id, '区域', index)
      }
      if (typeof raw.label !== 'string' || raw.label.trim() === '') {
        issues.push(`区域 #${position} 的名称不能为空`)
      } else if (raw.label.length > MAX_LABEL_LENGTH) {
        issues.push(`区域 #${position} 的名称不能超过 ${MAX_LABEL_LENGTH} 个字符`)
      }
      if (!isFiniteNumber(raw.x) || !isFiniteNumber(raw.y)) {
        issues.push(`区域 #${position} 的坐标必须是有限数字`)
      }
      if (!isFiniteNumber(raw.width) || raw.width <= 0) {
        issues.push(`区域 #${position} 的宽度必须是正数`)
      }
      if (!isFiniteNumber(raw.height) || raw.height <= 0) {
        issues.push(`区域 #${position} 的高度必须是正数`)
      }
      if (raw.tone !== undefined) {
        if (typeof raw.tone !== 'string' || !ZONE_TONES.includes(raw.tone as NonNullable<TopologyZone['tone']>)) {
          issues.push(`区域 #${position} 的色调无效`)
        }
      }
    })
  }

  return issues
}

export function assertValidCanvas(canvas: PersonalCanvas): void {
  const issues = validateCanvas(canvas)
  if (issues.length > 0) {
    throw new CanvasValidationError(issues)
  }
}

export function createEmptyCanvas(title?: string): PersonalCanvas {
  const now = new Date().toISOString()
  return {
    schemaVersion: 1,
    id: createId('canvas'),
    title: normalizeTitle(title ?? ''),
    canvasNote: '',
    nodes: [],
    edges: [],
    zones: [],
    createdAt: now,
    updatedAt: now,
  }
}

export function topologyToPersonalCanvas(
  topology: Topology,
  options?: { title?: string; courseId?: string },
): PersonalCanvas {
  const now = new Date().toISOString()
  const canvas: PersonalCanvas = {
    schemaVersion: 1,
    id: createId('canvas'),
    title: normalizeTitle(options?.title ?? topology.title),
    basedOnTopologyId: topology.id,
    canvasNote: '',
    nodes: deepClone(topology.nodes),
    edges: deepClone(topology.edges),
    zones: deepClone(topology.zones ?? []),
    createdAt: now,
    updatedAt: now,
  }
  if (options?.courseId !== undefined) {
    canvas.basedOnCourseId = options.courseId
  }
  return canvas
}

function defaultNodePosition(index: number): { x: number; y: number } {
  const columns = 5
  return {
    x: 80 + (index % columns) * 180,
    y: 80 + Math.floor(index / columns) * 140,
  }
}

export interface GridPlacementPoint {
  x: number
  y: number
}

export interface GridPlacementNode {
  position: GridPlacementPoint
}

export const GRID_PLACEMENT_COLUMNS = 4
export const GRID_PLACEMENT_X_GAP = 210
export const GRID_PLACEMENT_Y_GAP = 190
export const GRID_PLACEMENT_NODE_WIDTH = 168
export const GRID_PLACEMENT_NODE_HEIGHT = 150

function overlapsExistingNode(
  point: GridPlacementPoint,
  existing: readonly GridPlacementNode[],
): boolean {
  return existing.some(
    (node) =>
      Math.abs(node.position.x - point.x) < GRID_PLACEMENT_NODE_WIDTH &&
      Math.abs(node.position.y - point.y) < GRID_PLACEMENT_NODE_HEIGHT,
  )
}

/**
 * 以画布中心为基准，把第 index 个节点放进 4 列网格。
 * 首节点位于中心，x 间距 210、y 间距 190 flow 单位；若落点与已有节点重叠，
 * 则按序尝试下一格，最多尝试 index + existing.length + 一个完整整列。
 */
export function computeGridPlacement(
  center: GridPlacementPoint,
  index: number,
  existing: readonly GridPlacementNode[] = [],
): GridPlacementPoint {
  const start = Number.isFinite(index) ? Math.max(0, Math.floor(index)) : 0
  const attempts = start + existing.length + GRID_PLACEMENT_COLUMNS * 4
  for (let cursor = start; cursor < attempts; cursor += 1) {
    const column = cursor % GRID_PLACEMENT_COLUMNS
    const row = Math.floor(cursor / GRID_PLACEMENT_COLUMNS)
    const point = {
      x: Math.round(center.x - GRID_PLACEMENT_NODE_WIDTH / 2 + column * GRID_PLACEMENT_X_GAP),
      y: Math.round(center.y - GRID_PLACEMENT_NODE_HEIGHT / 2 + row * GRID_PLACEMENT_Y_GAP),
    }
    if (!overlapsExistingNode(point, existing)) {
      return point
    }
  }
  const column = start % GRID_PLACEMENT_COLUMNS
  const row = Math.floor(start / GRID_PLACEMENT_COLUMNS)
  return {
    x: Math.round(center.x - GRID_PLACEMENT_NODE_WIDTH / 2 + column * GRID_PLACEMENT_X_GAP),
    y: Math.round(center.y - GRID_PLACEMENT_NODE_HEIGHT / 2 + row * GRID_PLACEMENT_Y_GAP),
  }
}

function applyPatch<T extends object>(base: T, patch: Partial<T>): T {
  const merged = { ...(base as unknown as Record<string, unknown>) }
  const source = patch as unknown as Record<string, unknown>
  for (const key of Object.keys(source)) {
    const value = source[key]
    if (value !== undefined) {
      merged[key] = value
    }
  }
  return merged as T
}

function hasSameEndpoints(edge: TopologyEdge, source: string, target: string): boolean {
  return (
    (edge.source === source && edge.target === target) ||
    (edge.source === target && edge.target === source)
  )
}

export function addNode(canvas: PersonalCanvas, input: AddNodeInput): PersonalCanvas {
  assertValidCanvas(canvas)
  if (canvas.nodes.length >= MAX_NODES) {
    throw new CanvasValidationError([`画布最多支持 ${MAX_NODES} 个节点`])
  }
  const id = input.id !== undefined && input.id.trim() !== '' ? input.id.trim() : createId('node')
  if (canvas.nodes.some((node) => node.id === id)) {
    throw new CanvasValidationError([`节点 ID 已存在：${id}`])
  }
  const node: TopologyNode = {
    id,
    iconId: input.iconId,
    label: input.label,
    role: input.role,
    position:
      input.position !== undefined && isFiniteNumber(input.position.x) && isFiniteNumber(input.position.y)
        ? deepClone(input.position)
        : defaultNodePosition(canvas.nodes.length),
  }
  if (input.ip !== undefined) {
    node.ip = input.ip
  }
  if (input.note !== undefined) {
    node.note = input.note
  }
  if (input.ports !== undefined) {
    node.ports = deepClone(input.ports)
  }
  const next = deepClone(canvas)
  next.nodes.push(node)
  assertValidCanvas(next)
  return next
}

export function addEdge(canvas: PersonalCanvas, input: AddEdgeInput): PersonalCanvas {
  assertValidCanvas(canvas)
  if (canvas.edges.length >= MAX_EDGES) {
    throw new CanvasValidationError([`画布最多支持 ${MAX_EDGES} 条连线`])
  }
  if (input.source === input.target) {
    throw new CanvasValidationError(['连线不能连接到同一个节点'])
  }
  if (!canvas.nodes.some((node) => node.id === input.source)) {
    throw new CanvasValidationError([`起点节点不存在：${input.source}`])
  }
  if (!canvas.nodes.some((node) => node.id === input.target)) {
    throw new CanvasValidationError([`终点节点不存在：${input.target}`])
  }
  const kind = input.kind ?? 'physical'
  if (!EDGE_KINDS.includes(kind)) {
    throw new CanvasValidationError([`连线类型无效：${kind}`])
  }
  if (canvas.edges.some((edge) => edge.kind === kind && hasSameEndpoints(edge, input.source, input.target))) {
    throw new CanvasValidationError(['相同端点之间已存在同类型连线'])
  }
  const id = input.id !== undefined && input.id.trim() !== '' ? input.id.trim() : createId('edge')
  if (canvas.edges.some((edge) => edge.id === id)) {
    throw new CanvasValidationError([`连线 ID 已存在：${id}`])
  }
  const edge: TopologyEdge = {
    id,
    source: input.source,
    target: input.target,
    kind,
  }
  if (input.direction !== undefined) {
    edge.direction = input.direction
  }
  if (input.label !== undefined) {
    edge.label = input.label
  }
  if (input.note !== undefined) {
    edge.note = input.note
  }
  if (input.sourcePort !== undefined) {
    edge.sourcePort = input.sourcePort
  }
  if (input.targetPort !== undefined) {
    edge.targetPort = input.targetPort
  }
  const next = deepClone(canvas)
  next.edges.push(edge)
  assertValidCanvas(next)
  return next
}

export function deleteNode(canvas: PersonalCanvas, nodeId: string): PersonalCanvas {
  assertValidCanvas(canvas)
  if (!canvas.nodes.some((node) => node.id === nodeId)) {
    throw new CanvasValidationError([`节点不存在：${nodeId}`])
  }
  const next = deepClone(canvas)
  next.nodes = next.nodes.filter((node) => node.id !== nodeId)
  next.edges = next.edges.filter((edge) => edge.source !== nodeId && edge.target !== nodeId)
  assertValidCanvas(next)
  return next
}

export function deleteEdge(canvas: PersonalCanvas, edgeId: string): PersonalCanvas {
  assertValidCanvas(canvas)
  if (!canvas.edges.some((edge) => edge.id === edgeId)) {
    throw new CanvasValidationError([`连线不存在：${edgeId}`])
  }
  const next = deepClone(canvas)
  next.edges = next.edges.filter((edge) => edge.id !== edgeId)
  assertValidCanvas(next)
  return next
}

export function updateNode(canvas: PersonalCanvas, nodeId: string, patch: Partial<TopologyNode>): PersonalCanvas {
  assertValidCanvas(canvas)
  const index = canvas.nodes.findIndex((node) => node.id === nodeId)
  if (index < 0) {
    throw new CanvasValidationError([`节点不存在：${nodeId}`])
  }
  if (patch.id !== undefined && patch.id !== nodeId) {
    throw new CanvasValidationError(['不能修改节点 ID'])
  }
  const next = deepClone(canvas)
  next.nodes[index] = applyPatch(next.nodes[index], { ...patch, id: nodeId })
  assertValidCanvas(next)
  return next
}

export function updateEdge(canvas: PersonalCanvas, edgeId: string, patch: Partial<TopologyEdge>): PersonalCanvas {
  assertValidCanvas(canvas)
  const index = canvas.edges.findIndex((edge) => edge.id === edgeId)
  if (index < 0) {
    throw new CanvasValidationError([`连线不存在：${edgeId}`])
  }
  if (patch.id !== undefined && patch.id !== edgeId) {
    throw new CanvasValidationError(['不能修改连线 ID'])
  }
  const next = deepClone(canvas)
  const merged = applyPatch(next.edges[index], { ...patch, id: edgeId })
  if (merged.source === merged.target) {
    throw new CanvasValidationError(['连线不能连接到同一个节点'])
  }
  if (!next.nodes.some((node) => node.id === merged.source)) {
    throw new CanvasValidationError([`起点节点不存在：${merged.source}`])
  }
  if (!next.nodes.some((node) => node.id === merged.target)) {
    throw new CanvasValidationError([`终点节点不存在：${merged.target}`])
  }
  if (
    next.edges.some(
      (edge, edgeIndex) =>
        edgeIndex !== index && edge.kind === merged.kind && hasSameEndpoints(edge, merged.source, merged.target),
    )
  ) {
    throw new CanvasValidationError(['相同端点之间已存在同类型连线'])
  }
  next.edges[index] = merged
  assertValidCanvas(next)
  return next
}