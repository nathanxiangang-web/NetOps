export type CourseLevel = 'L1' | 'L2' | 'L3' | 'L4' | 'L5'
export type PublicationStatus = 'published' | 'draft'
export type LabStatus = 'verified' | 'guide-only' | 'partial'
export type EdgeKind = 'physical' | 'logical' | 'annotation' | 'mirror'
export type EdgeDirection = 'none' | 'forward' | 'backward'
export type IconCategory = 'terminal' | 'switching' | 'routing' | 'security' | 'cloud' | 'operations'

export interface IconDefinition {
  id: string
  deviceType: string
  labelZh: string
  labelEn: string
  aliases: string[]
  category: IconCategory
  asset: string
  source: string
  license: string
  version: string
}

export interface CanvasNodeData {
  iconId: string
  label: string
  role: string
  ip?: string
  note?: string
}

export interface CanvasEdgeData {
  kind: EdgeKind
  label?: string
  direction: EdgeDirection
  note?: string
}

export interface TopologyNode {
  id: string
  iconId: string
  label: string
  role: string
  position: { x: number; y: number }
  ip?: string
  note?: string
  ports?: string[]
}

export interface TopologyEdge {
  id: string
  source: string
  target: string
  sourcePort?: string
  targetPort?: string
  kind: EdgeKind
  label?: string
  direction?: EdgeDirection
  note?: string
}

export interface TopologyZone {
  id: string
  label: string
  x: number
  y: number
  width: number
  height: number
  tone?: 'default' | 'secure' | 'cloud' | 'warning'
}

export interface Topology {
  schemaVersion: 1
  id: string
  title: string
  summary: string
  nodes: TopologyNode[]
  edges: TopologyEdge[]
  zones?: TopologyZone[]
  assumptions: string[]
}

export interface Step {
  id: string
  title: string
  plainText: string
  professionalText: string
  focusNodeIds: string[]
  focusEdgeIds: string[]
  evidenceText?: string
  directionHints?: string[]
}

export interface TheorySection {
  heading: string
  paragraphs: string[]
  bullets?: string[]
}

export interface LabTask {
  title: string
  steps: string[]
  observe: string
}

export interface LabCommand {
  title: string
  language: 'text' | 'bash' | 'json'
  code: string
}

export interface LabGuide {
  platform: 'eNSP' | 'EVE-NG' | 'Linux 隔离虚拟机'
  devices: string[]
  versions: string
  requirements: string[]
  addressing: string[]
  tasks: LabTask[]
  commands: LabCommand[]
  verification: string[]
  expected: string[]
  faults: string[]
  recovery: string[]
  status: LabStatus
  checkedAt?: string
  statusNote: string
  sources: SourceRef[]
}

export interface ChallengeOption {
  id: string
  label: string
  correct?: boolean
  explanation: string
}

export interface Challenge {
  id: string
  kind: 'choice' | 'open'
  prompt: string
  hint?: string
  options?: ChallengeOption[]
  explanation: string
}

export interface SourceRef {
  title: string
  url: string
  note?: string
}

export interface Course {
  id: string
  title: string
  question: string
  level: CourseLevel
  minutes: number
  goals: string[]
  prerequisites: string[]
  topicIds: string[]
  topologyId: string
  steps: Step[]
  why: TheorySection[]
  theory: TheorySection[]
  proTheory: TheorySection[]
  lab: LabGuide
  challenges: Challenge[]
  summary: string[]
  misconceptions: { wrong: string; right: string }[]
  sources: SourceRef[]
  publicationStatus: PublicationStatus
}

export interface LearningPath {
  id: string
  title: string
  description: string
  courseIds: string[]
}

export interface LocalProgress {
  courseId: string
  lastStepId?: string
  read: boolean
  challengeAttempted: boolean
  updatedAt: string
}

export interface PersonalCanvas {
  schemaVersion: 1
  id: string
  title: string
  basedOnCourseId?: string
  basedOnTopologyId?: string
  canvasNote: string
  nodes: TopologyNode[]
  edges: TopologyEdge[]
  zones: TopologyZone[]
  createdAt: string
  updatedAt: string
}

export interface CanvasIndexEntry {
  id: string
  title: string
  nodeCount: number
  edgeCount: number
  basedOnCourseId?: string
  updatedAt: string
}

export interface CanvasLibraryItem {
  iconId: string
  label: string
  category: IconCategory
  description: string
}