import { describe, expect, it } from 'vitest'
import {
  assertContentValid,
  ContentValidationError,
  validateContent,
} from '@/domain/contentValidation'
import {
  contentStats,
  courseById,
  courses,
  learningPaths,
  levelMeta,
  publicTopicCoverage,
  topologies,
  topologyById,
} from '@/content'

function cloneContent() {
  return structuredClone({ topologies, courses, learningPaths })
}

describe('内容聚合与校验', () => {
  it('实际内容通过校验', () => {
    const issues = validateContent(topologies, courses, learningPaths)
    expect(issues).toEqual([])
  })

  it('课程、拓扑与实验数量满足交付要求', () => {
    const published = courses.filter((course) => course.publicationStatus === 'published')
    expect(published.length).toBeGreaterThanOrEqual(12)
    expect(topologies.length).toBe(13)
    published.forEach((course) => {
      expect(course.steps.length).toBeGreaterThanOrEqual(6)
    })
    expect(contentStats.guideOnlyLabCount).toBeGreaterThanOrEqual(12)
    expect(contentStats.verifiedLabCount).toBeGreaterThanOrEqual(1)
    expect(contentStats.analyzedSourceCount).toBe(27)
    expect(contentStats.courseCount).toBe(courses.length)
    expect(contentStats.labCount).toBe(courses.length)
    expect(contentStats.topologyCount).toBe(topologies.length)
    expect(contentStats.topicCount).toBeGreaterThan(0)
    const stepTotal = courses.reduce((total, course) => total + course.steps.length, 0)
    expect(contentStats.stepCount).toBe(stepTotal)
    const levelTotal = Object.values(contentStats.levelCounts).reduce((total, count) => total + count, 0)
    expect(levelTotal).toBe(courses.length)
  })

  it('已验证实验必须有 checkedAt 且签名课程状态已更新', () => {
    const verified = courses.filter((course) => course.lab.status === 'verified')
    expect(verified.length).toBeGreaterThanOrEqual(1)
    verified.forEach((course) => {
      expect(course.lab.checkedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    })
    const signature = courseById.get('l5-signature')
    expect(signature).toBeDefined()
    expect(signature?.lab.status).toBe('verified')
    expect(signature?.lab.checkedAt).toBe('2026-11-28')
    expect(signature?.lab.statusNote).toContain('未在 eNSP/EVE-NG 执行')
  })

  it('课程按 L1 到 L5 排序且索引一致', () => {
    const order = ['L1', 'L2', 'L3', 'L4', 'L5']
    const levels = courses.map((course) => course.level)
    const sorted = [...levels].sort((left, right) => order.indexOf(left) - order.indexOf(right))
    expect(levels).toEqual(sorted)
    courses.forEach((course) => {
      expect(courseById.get(course.id)).toBe(course)
    })
    topologies.forEach((topology) => {
      expect(topologyById.get(topology.id)).toBe(topology)
    })
    expect(Object.keys(levelMeta)).toEqual(order)
  })

  it('学习路径引用存在且覆盖全部已发布课程', () => {
    const covered = new Set<string>()
    learningPaths.forEach((path) => {
      path.courseIds.forEach((courseId) => {
        expect(courseById.has(courseId)).toBe(true)
        covered.add(courseId)
      })
    })
    courses
      .filter((course) => course.publicationStatus === 'published')
      .forEach((course) => {
        expect(covered.has(course.id)).toBe(true)
      })
  })

  it('公开主题只引用存在的课程', () => {
    expect(publicTopicCoverage.length).toBeGreaterThanOrEqual(12)
    publicTopicCoverage.forEach((topic) => {
      topic.courseIds.forEach((courseId) => {
        expect(courseById.has(courseId)).toBe(true)
      })
    })
  })

  it('重复 ID 被校验拦截', () => {
    const data = cloneContent()
    data.topologies.push(structuredClone(data.topologies[0]))
    const issues = validateContent(data.topologies, data.courses, data.learningPaths)
    expect(issues.some((issue) => issue.includes('ID 重复'))).toBe(true)
  })

  it('悬空焦点节点被校验拦截', () => {
    const data = cloneContent()
    data.courses[0].steps[0].focusNodeIds = ['missing-node']
    const issues = validateContent(data.topologies, data.courses, data.learningPaths)
    expect(issues.some((issue) => issue.includes('missing-node'))).toBe(true)
  })

  it('私有 IPv4 地址被校验拦截', () => {
    const data = cloneContent()
    data.topologies[0].nodes[0].ip = '10.0.0.1'
    const issues = validateContent(data.topologies, data.courses, data.learningPaths)
    expect(issues.some((issue) => issue.includes('10.0.0.1'))).toBe(true)
  })

  it('敏感词被校验拦截', () => {
    const data = cloneContent()
    data.courses[0].question = `${data.courses[0].question} 贵州`
    const issues = validateContent(data.topologies, data.courses, data.learningPaths)
    expect(issues.some((issue) => issue.includes('贵州'))).toBe(true)
  })

  it('来源主机不在白名单被校验拦截', () => {
    const data = cloneContent()
    data.courses[0].sources = [{ title: '外部来源', url: 'https://example.com/content' }]
    const issues = validateContent(data.topologies, data.courses, data.learningPaths)
    expect(issues.some((issue) => issue.includes('example.com'))).toBe(true)
  })

  it('先修关系成环被校验拦截', () => {
    const data = cloneContent()
    const ping = data.courses.find((course) => course.id === 'l1-ping-path')
    expect(ping).toBeDefined()
    if (ping) {
      ping.prerequisites = ['l3-ospf-convergence']
    }
    const issues = validateContent(data.topologies, data.courses, data.learningPaths)
    expect(issues.some((issue) => issue.includes('环'))).toBe(true)
  })

  it('assertContentValid 抛出带 issues 的错误', () => {
    const data = cloneContent()
    data.topologies[0].nodes[0].ip = '192.168.1.1'
    let caught: unknown
    try {
      assertContentValid(data.topologies, data.courses, data.learningPaths)
    } catch (error) {
      caught = error
    }
    expect(caught).toBeInstanceOf(ContentValidationError)
    const validationError = caught as ContentValidationError
    expect(validationError.issues.length).toBeGreaterThan(0)
    expect(validationError.issues.some((issue) => issue.includes('192.168.1.1'))).toBe(true)
  })
})