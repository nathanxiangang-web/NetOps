import { iconRegistry } from './icons'
import type { Course, LearningPath, Topology } from './types'

export const ALLOWED_SOURCE_HOSTS = [
  'rfc-editor.org',
  'www.rfc-editor.org',
  'huawei.com',
  'info.support.huawei.com',
  'e.huawei.com',
  'nist.gov',
  'csrc.nist.gov',
  'openssl.org',
  'docs.openssl.org',
  'openstd.samr.gov.cn',
  'developer.mozilla.org',
  'learn.microsoft.com',
  'www.eve-ng.net',
] as const

export const SENSITIVE_TERMS = [
  '贵州',
  '省直',
  '厅局',
  '省委',
  '省政府',
  '地州',
  '政务外网',
  '惠智',
  '奇安信',
  '深信服',
  '网御',
  '吉大',
  '国办',
  '信息中心',
  '附件4',
  '详细网络拓扑图',
] as const

const REQUIRED_COURSE_ARRAYS = [
  'goals',
  'steps',
  'why',
  'theory',
  'proTheory',
  'challenges',
  'summary',
  'misconceptions',
  'sources',
] as const

const REQUIRED_LAB_STRINGS = ['platform', 'versions', 'statusNote'] as const

const REQUIRED_LAB_ARRAYS = [
  'devices',
  'requirements',
  'addressing',
  'tasks',
  'commands',
  'verification',
  'expected',
  'faults',
  'recovery',
  'sources',
] as const

const LAB_STATUSES = ['verified', 'guide-only', 'partial'] as const

const ALLOWED_HOSTS = new Set<string>(ALLOWED_SOURCE_HOSTS)

const IPV4_PATTERN = /(?<![\d.])(\d{1,3}(?:\.\d{1,3}){3})(?![\d.])/g

const PRIVATE_IPV4_PATTERNS = [
  /^10\./,
  /^192\.168\./,
  /^172\.(?:1[6-9]|2\d|3[01])\./,
  /^100\.(?:6[4-9]|[7-9]\d|1[01]\d|12[0-7])\./,
  /^127\./,
  /^169\.254\./,
  /^0\.0\.0\.0$/,
]

type UnknownRecord = Record<string, unknown>

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim() !== ''
}

function isNonEmptyArray(value: unknown): value is unknown[] {
  return Array.isArray(value) && value.length > 0
}

function asRecord(value: unknown): UnknownRecord {
  return isRecord(value) ? value : {}
}

function collectSourceIssues(issues: string[], label: string, sources: unknown): void {
  if (!Array.isArray(sources) || sources.length === 0) {
    issues.push(`${label} 缺少 sources`)
    return
  }
  sources.forEach((source, index) => {
    const record = asRecord(source)
    if (!isNonEmptyString(record.title)) {
      issues.push(`${label} 的第 ${index + 1} 条 source 缺少标题`)
    }
    if (!isNonEmptyString(record.url)) {
      issues.push(`${label} 的第 ${index + 1} 条 source 缺少 URL`)
      return
    }
    let parsed: URL
    try {
      parsed = new URL(record.url)
    } catch {
      issues.push(`${label} 的第 ${index + 1} 条 source URL 无效：${record.url}`)
      return
    }
    if (parsed.protocol !== 'https:') {
      issues.push(`${label} 的第 ${index + 1} 条 source URL 必须使用 https：${record.url}`)
    }
    if (!ALLOWED_HOSTS.has(parsed.hostname)) {
      issues.push(`${label} 的第 ${index + 1} 条 source URL 主机不在白名单：${parsed.hostname}`)
    }
  })
}

function validateSources(course: Course, issues: string[]): void {
  collectSourceIssues(issues, `课程 ${course.id}`, course.sources)
}

function validateLab(course: Course, issues: string[]): void {
  const lab = course.lab as unknown
  if (!isRecord(lab)) {
    issues.push(`课程 ${course.id} 缺少 lab`)
    return
  }
  const label = `课程 ${course.id} 的 lab`
  REQUIRED_LAB_STRINGS.forEach((field) => {
    if (!isNonEmptyString(lab[field])) {
      issues.push(`${label} 缺少 ${field}`)
    }
  })
  REQUIRED_LAB_ARRAYS.forEach((field) => {
    if (!Array.isArray(lab[field])) {
      issues.push(`${label} 缺少 ${field}`)
    }
  })
  if (!Array.isArray(lab.tasks) || lab.tasks.length < 1) {
    issues.push(`${label} 的 tasks 至少需要 1 项`)
  }
  if (!Array.isArray(lab.verification) || lab.verification.length < 1) {
    issues.push(`${label} 的 verification 至少需要 1 项`)
  }
  const status = lab.status
  if (!LAB_STATUSES.includes(status as (typeof LAB_STATUSES)[number])) {
    issues.push(`${label} 的 status 必须是 verified、guide-only 或 partial`)
    return
  }
  if (status === 'verified' && !isNonEmptyString(lab.checkedAt)) {
    issues.push(`${label} 状态为 verified 但缺少 checkedAt`)
  }
  if (status === 'guide-only') {
    const note = lab.statusNote
    if (!isNonEmptyString(note) || (!note.includes('尚未') && !note.includes('未实际'))) {
      issues.push(`${label} 状态为 guide-only 但 statusNote 未说明尚未实机执行`)
    }
  }
  collectSourceIssues(issues, label, lab.sources)
}

function validateCourseFields(course: Course, issues: string[]): void {
  if (!isNonEmptyString(course.question)) {
    issues.push(`课程 ${course.id} 缺少 question`)
  }
  REQUIRED_COURSE_ARRAYS.forEach((field) => {
    if (!isNonEmptyArray((course as unknown as UnknownRecord)[field])) {
      issues.push(`课程 ${course.id} 缺少 ${field}`)
    }
  })
  if (!Array.isArray(course.goals) || course.goals.length < 3) {
    issues.push(`课程 ${course.id} 的 goals 至少需要 3 项`)
  }
  if (!Array.isArray(course.steps) || course.steps.length < 5) {
    issues.push(`课程 ${course.id} 的 steps 至少需要 5 步`)
  }
  if (!Array.isArray(course.challenges) || course.challenges.length < 1) {
    issues.push(`课程 ${course.id} 的 challenges 至少需要 1 项`)
  }
}

function validateCourseTopologyLinks(
  course: Course,
  topologyById: Map<string, Topology>,
  issues: string[],
): void {
  const topology = topologyById.get(course.topologyId)
  if (!topology) {
    issues.push(`课程 ${course.id} 引用了不存在的拓扑：${course.topologyId}`)
    return
  }
  const nodeIds = new Set(topology.nodes.map((node) => node.id))
  const edgeIds = new Set(topology.edges.map((edge) => edge.id))
  const stepIds = new Set<string>()
  course.steps.forEach((step, index) => {
    if (stepIds.has(step.id)) {
      issues.push(`课程 ${course.id} 的步骤 ID 重复：${step.id}`)
    } else {
      stepIds.add(step.id)
    }
    if (!Array.isArray(step.focusNodeIds) || step.focusNodeIds.length < 1) {
      issues.push(`课程 ${course.id} 步骤 ${step.id} 的 focusNodeIds 至少需要 1 项`)
    } else {
      step.focusNodeIds.forEach((nodeId) => {
        if (!nodeIds.has(nodeId)) {
          issues.push(`课程 ${course.id} 步骤 ${step.id} 引用了不存在的节点：${nodeId}`)
        }
      })
    }
    if (!Array.isArray(step.focusEdgeIds) || step.focusEdgeIds.length < 1) {
      issues.push(`课程 ${course.id} 步骤 ${step.id} 的 focusEdgeIds 至少需要 1 项`)
    } else {
      step.focusEdgeIds.forEach((edgeId) => {
        if (!edgeIds.has(edgeId)) {
          issues.push(`课程 ${course.id} 步骤 ${step.id} 引用了不存在的连线：${edgeId}`)
        }
      })
    }
    if (!isNonEmptyString(step.title) || !isNonEmptyString(step.plainText)) {
      issues.push(`课程 ${course.id} 的第 ${index + 1} 个步骤缺少标题或讲解文本`)
    }
  })
}

function validateTopology(topology: Topology, issues: string[]): void {
  const label = `拓扑 ${topology.id}`
  const nodeIds = new Set<string>()
  topology.nodes.forEach((node, _index) => {
    if (nodeIds.has(node.id)) {
      issues.push(`${label} 的节点 ID 重复：${node.id}`)
    } else {
      nodeIds.add(node.id)
    }
    if (!iconRegistry.some((icon) => icon.id === node.iconId)) {
      issues.push(`${label} 的节点 ${node.id} 使用了未注册图标：${node.iconId}`)
    }
    if (!Number.isFinite(node.position.x) || !Number.isFinite(node.position.y)) {
      issues.push(`${label} 的节点 ${node.id} 坐标不是有限数字`)
    }
  })
  const edgeIds = new Set<string>()
  topology.edges.forEach((edge, _index) => {
    if (edgeIds.has(edge.id)) {
      issues.push(`${label} 的连线 ID 重复：${edge.id}`)
    } else {
      edgeIds.add(edge.id)
    }
    if (!nodeIds.has(edge.source)) {
      issues.push(`${label} 的连线 ${edge.id} 起点不存在：${edge.source}`)
    }
    if (!nodeIds.has(edge.target)) {
      issues.push(`${label} 的连线 ${edge.id} 终点不存在：${edge.target}`)
    }
    if (edge.kind === 'physical' && edge.direction !== 'none') {
      issues.push(`${label} 的物理连线 ${edge.id} 方向必须为 none`)
    }
  })
  const zoneIds = new Set<string>()
  ;(topology.zones ?? []).forEach((zone, _index) => {
    if (zoneIds.has(zone.id)) {
      issues.push(`${label} 的区域 ID 重复：${zone.id}`)
    } else {
      zoneIds.add(zone.id)
    }
    if (!Number.isFinite(zone.width) || zone.width <= 0) {
      issues.push(`${label} 的区域 ${zone.id} 宽度必须为正数`)
    }
    if (!Number.isFinite(zone.height) || zone.height <= 0) {
      issues.push(`${label} 的区域 ${zone.id} 高度必须为正数`)
    }
  })
}

function findPrerequisiteCycle(courses: Course[]): string[] | null {
  const prereqs = new Map<string, string[]>()
  courses.forEach((course) => {
    prereqs.set(course.id, course.prerequisites.filter((id) => prereqs.has(id) || courses.some((item) => item.id === id)))
  })
  const state = new Map<string, 'visiting' | 'done'>()
  const stack: string[] = []

  const visit = (courseId: string): string[] | null => {
    const current = state.get(courseId)
    if (current === 'visiting') {
      const start = stack.indexOf(courseId)
      return [...stack.slice(start), courseId]
    }
    if (current === 'done') {
      return null
    }
    state.set(courseId, 'visiting')
    stack.push(courseId)
    for (const prerequisite of prereqs.get(courseId) ?? []) {
      const cycle = visit(prerequisite)
      if (cycle) {
        return cycle
      }
    }
    stack.pop()
    state.set(courseId, 'done')
    return null
  }

  for (const course of courses) {
    const cycle = visit(course.id)
    if (cycle) {
      return cycle
    }
  }
  return null
}

function isPrivateOrReservedIpv4(address: string): boolean {
  return PRIVATE_IPV4_PATTERNS.some((pattern) => pattern.test(address))
}

function validateContentText(topologies: Topology[], courses: Course[], issues: string[]): void {
  const rawText = JSON.stringify({ topologies, courses })
  const textForIpScan = rawText
    .replaceAll('0.0.0.0/0', 'DEFAULT_ROUTE_PLACEHOLDER')
    .replace(/0\.0\.0\.0\s+0\.0\.0\.0/g, 'DEFAULT_ROUTE_PLACEHOLDER')

  SENSITIVE_TERMS.forEach((term) => {
    if (rawText.includes(term)) {
      issues.push(`内容包含敏感词：${term}`)
    }
  })

  const reported = new Set<string>()
  for (const match of textForIpScan.matchAll(IPV4_PATTERN)) {
    const address = match[1]
    if (!isPrivateOrReservedIpv4(address) || reported.has(address)) {
      continue
    }
    reported.add(address)
    issues.push(`内容包含私有或保留 IPv4 地址：${address}`)
  }
}

export function validateContent(
  topologies: Topology[],
  courses: Course[],
  paths: LearningPath[],
): string[] {
  const issues: string[] = []
  const topologyList = Array.isArray(topologies) ? topologies : []
  const courseList = Array.isArray(courses) ? courses : []
  const pathList = Array.isArray(paths) ? paths : []

  const registeredIds = new Map<string, string[]>()
  const registerId = (id: string, kind: string) => {
    const kinds = registeredIds.get(id) ?? []
    kinds.push(kind)
    registeredIds.set(id, kinds)
  }
  topologyList.forEach((topology) => registerId(topology.id, 'topology'))
  courseList.forEach((course) => registerId(course.id, 'course'))
  pathList.forEach((path) => registerId(path.id, 'path'))
  registeredIds.forEach((kinds, id) => {
    if (kinds.length > 1) {
      issues.push(`内容 ID 重复：${id}（${kinds.join('、')}）`)
    }
  })

  const topologyById = new Map<string, Topology>()
  topologyList.forEach((topology) => {
    topologyById.set(topology.id, topology)
    validateTopology(topology, issues)
  })

  const courseIds = new Set(courseList.map((course) => course.id))
  courseList.forEach((course) => {
    course.prerequisites.forEach((prerequisite) => {
      if (!courseIds.has(prerequisite)) {
        issues.push(`课程 ${course.id} 引用了不存在的先修课程：${prerequisite}`)
      }
    })
  })
  const cycle = findPrerequisiteCycle(courseList)
  if (cycle) {
    issues.push(`课程先修关系存在环：${cycle.join(' → ')}`)
  }

  const publishedCourses = courseList.filter((course) => course.publicationStatus === 'published')
  const coveredCourseIds = new Set(pathList.flatMap((path) => path.courseIds))
  pathList.forEach((path) => {
    path.courseIds.forEach((courseId) => {
      if (!courseIds.has(courseId)) {
        issues.push(`学习路径 ${path.id} 引用了不存在的课程：${courseId}`)
      }
    })
  })

  publishedCourses.forEach((course) => {
    validateCourseFields(course, issues)
    validateLab(course, issues)
    validateSources(course, issues)
    validateCourseTopologyLinks(course, topologyById, issues)
    if (pathList.length > 0 && !coveredCourseIds.has(course.id)) {
      issues.push(`课程 ${course.id} 未被任何学习路径包含`)
    }
  })

  validateContentText(topologyList, courseList, issues)

  return issues
}

export class ContentValidationError extends Error {
  readonly issues: string[]

  constructor(issues: string[]) {
    super(`内容校验失败：${issues.length} 项问题`)
    this.name = 'ContentValidationError'
    this.issues = issues
  }
}

export function assertContentValid(
  topologies: Topology[],
  courses: Course[],
  paths: LearningPath[],
): void {
  const issues = validateContent(topologies, courses, paths)
  if (issues.length > 0) {
    throw new ContentValidationError(issues)
  }
}