import type { Course, CourseLevel, LearningPath, Topology } from '@/domain/types'
import { advancedCourses } from './courses/advanced'
import { foundationCourses } from './courses/foundation'
import { topologies as topologyContent } from './topologies'

const LEVEL_ORDER: CourseLevel[] = ['L1', 'L2', 'L3', 'L4', 'L5']

const allCourses: Course[] = [...foundationCourses, ...advancedCourses]
const sourceOrder = new Map(allCourses.map((course, index) => [course.id, index]))

export const courses: Course[] = [...allCourses].sort((left, right) => {
  const levelDiff = LEVEL_ORDER.indexOf(left.level) - LEVEL_ORDER.indexOf(right.level)
  if (levelDiff !== 0) {
    return levelDiff
  }
  return (sourceOrder.get(left.id) ?? 0) - (sourceOrder.get(right.id) ?? 0)
})

export const topologies: Topology[] = topologyContent

export const courseById = new Map(courses.map((course) => [course.id, course]))
export const topologyById = new Map(topologies.map((topology) => [topology.id, topology]))

export const learningPaths: LearningPath[] = [
  {
    id: 'path-foundation',
    title: '看见网络',
    description: '从一次 Ping 和一张拓扑出发，建立端、路、域的分层读图能力，再进入 VLAN、Trunk 与生成树。',
    courseIds: ['l1-ping-path', 'l1-read-topology', 'l2-vlan-trunk', 'l2-loop-stp'],
  },
  {
    id: 'path-routing',
    title: '三层互联',
    description: '用静态路由和 OSPF 把网段连通，理解回程、最长前缀匹配与邻居收敛。',
    courseIds: ['l3-static-return', 'l3-ospf-convergence'],
  },
  {
    id: 'path-transport',
    title: '承载与可靠',
    description: '把多租户隔离与高可用安全边界放进同一张骨干，理解标签、会话与切换代价。',
    courseIds: ['l4-mpls-vpn', 'l4-ha-security'],
  },
  {
    id: 'path-security',
    title: '身份与证据',
    description: '从零信任身份、数字签名到旁路观测，建立身份、数据完整性与可追溯性的判断链。',
    courseIds: ['l5-zero-trust', 'l5-signature', 'l5-observability'],
  },
  {
    id: 'path-continuity',
    title: '云、数据与连续性',
    description: '把云桌面、跨域数据交换与灾备放进业务连续性视角，理解依赖与恢复目标。',
    courseIds: ['l5-cloud-desktop', 'l5-data-continuity'],
  },
]

export interface LevelMeta {
  short: string
  description: string
  accent: string
}

export const levelMeta: Record<CourseLevel, LevelMeta> = {
  L1: {
    short: '入门与连接',
    description: '从一次 Ping 与一张拓扑开始，认识终端、接入、边界与服务区的基本职责。',
    accent: '#38bdf8',
  },
  L2: {
    short: '二层与园区',
    description: '围绕 VLAN、Trunk、MAC 学习与生成树，理解园区二层的边界与环路控制。',
    accent: '#22d3ee',
  },
  L3: {
    short: '三层互联',
    description: '用静态路由和 OSPF 建立网段互通，分清去程、回程与最长前缀匹配。',
    accent: '#34d399',
  },
  L4: {
    short: '高级互联与可靠性',
    description: '把 MPLS L3VPN 的多租户隔离与双机安全边界的高可用放进骨干视角。',
    accent: '#f59e0b',
  },
  L5: {
    short: '综合架构',
    description: '以身份、签名、观测、云桌面与数据连续性组织综合架构中的证据链。',
    accent: '#f472b6',
  },
}

const levelCounts: Record<CourseLevel, number> = {
  L1: 0,
  L2: 0,
  L3: 0,
  L4: 0,
  L5: 0,
}
courses.forEach((course) => {
  levelCounts[course.level] += 1
})

const topicIds = new Set(courses.flatMap((course) => course.topicIds))

export const contentStats = {
  analyzedSourceCount: 27,
  courseCount: courses.length,
  topologyCount: topologies.length,
  stepCount: courses.reduce((total, course) => total + course.steps.length, 0),
  labCount: courses.length,
  verifiedLabCount: courses.filter((course) => course.lab.status === 'verified').length,
  guideOnlyLabCount: courses.filter((course) => course.lab.status === 'guide-only').length,
  levelCounts,
  topicCount: topicIds.size,
}

export interface PublicTopicCoverage {
  id: string
  label: string
  courseIds: string[]
}

export const publicTopicCoverage: PublicTopicCoverage[] = [
  { id: 'l2-forwarding', label: '二层转发', courseIds: ['l2-vlan-trunk', 'l2-loop-stp'] },
  { id: 'ip-arp', label: 'IP / ARP', courseIds: ['l1-ping-path'] },
  { id: 'static-routing', label: '静态路由', courseIds: ['l3-static-return'] },
  { id: 'ospf', label: 'OSPF', courseIds: ['l3-ospf-convergence'] },
  { id: 'mpls-l3vpn', label: 'MPLS L3VPN', courseIds: ['l4-mpls-vpn'] },
  { id: 'high-availability', label: '高可用', courseIds: ['l4-ha-security'] },
  { id: 'security-zone-acl', label: '安全域 / ACL', courseIds: ['l4-ha-security', 'l5-zero-trust'] },
  { id: 'identity-zero-trust', label: '身份与零信任', courseIds: ['l5-zero-trust', 'l5-cloud-desktop'] },
  { id: 'pki-signature', label: 'PKI / 签名', courseIds: ['l5-signature'] },
  {
    id: 'virtualization-cloud-desktop',
    label: '虚拟化 / 云桌面',
    courseIds: ['l5-cloud-desktop'],
  },
  { id: 'bypass-observability', label: '旁路观测', courseIds: ['l5-observability'] },
  { id: 'cross-domain', label: '跨域交换', courseIds: ['l5-data-continuity'] },
  { id: 'disaster-recovery', label: '灾备 / RPO', courseIds: ['l5-data-continuity'] },
  { id: 'ipv6-dual-stack', label: 'IPv6 / 双栈', courseIds: [] },
  { id: '5g-private-network', label: '5G / 移动专网', courseIds: [] },
  { id: 'application-dependency', label: '应用依赖', courseIds: ['l5-cloud-desktop', 'l5-observability'] },
]

const aggregate = {
  courses,
  topologies,
  courseById,
  topologyById,
  learningPaths,
  levelMeta,
  contentStats,
  publicTopicCoverage,
}

export default aggregate