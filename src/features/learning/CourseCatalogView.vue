<script setup lang="ts">
import { computed, ref } from 'vue'
import CourseCard from '@/components/CourseCard.vue'
import { courses, levelMeta } from '@/content'
import type { CourseLevel, LabStatus } from '@/domain/types'

const levels: CourseLevel[] = ['L1', 'L2', 'L3', 'L4', 'L5']
const labStatusOrder: LabStatus[] = ['verified', 'guide-only', 'partial']

const publishedCourses = computed(() => courses.filter((course) => course.publicationStatus === 'published'))

const levelFilter = ref<CourseLevel | 'all'>('all')
const labFilter = ref<LabStatus | 'all'>('all')
const query = ref('')

const levelCounts = computed(() => {
  const counts: Record<CourseLevel, number> = { L1: 0, L2: 0, L3: 0, L4: 0, L5: 0 }
  publishedCourses.value.forEach((course) => {
    counts[course.level] += 1
  })
  return counts
})

const availableLabStatuses = computed(() => {
  const present = new Set(publishedCourses.value.map((course) => course.lab.status))
  return labStatusOrder.filter((status) => present.has(status))
})

function labLabel(status: LabStatus): string {
  if (status === 'verified') return '已实机验证'
  if (status === 'partial') return '部分支持'
  return '文档指导'
}

const filteredCourses = computed(() => {
  const keyword = query.value.trim().toLowerCase()
  return publishedCourses.value.filter((course) => {
    if (levelFilter.value !== 'all' && course.level !== levelFilter.value) return false
    if (labFilter.value !== 'all' && course.lab.status !== labFilter.value) return false
    if (!keyword) return true
    return (
      course.title.toLowerCase().includes(keyword) ||
      course.question.toLowerCase().includes(keyword) ||
      course.id.toLowerCase().includes(keyword) ||
      course.topicIds.some((topicId) => topicId.toLowerCase().includes(keyword))
    )
  })
})

function resetFilters() {
  levelFilter.value = 'all'
  labFilter.value = 'all'
  query.value = ''
}
</script>

<template>
  <div>
    <section class="catalog-hero">
      <div class="container">
        <div class="eyebrow">COURSE CATALOG</div>
        <h1 class="page-title">课程目录</h1>
        <p class="page-lede">
          按层级、实验状态与关键词筛选全部已发布课程。这里不设解锁门槛，课时与步骤均来自内容数据。
        </p>
      </div>
    </section>

    <div class="container page-shell">
      <div class="catalog-filters">
        <div class="filter-row">
          <span class="filter-label">层级</span>
          <div class="chips">
            <button
              type="button"
              class="chip"
              :class="{ active: levelFilter === 'all' }"
              @click="levelFilter = 'all'"
            >
              全部
              <small>{{ publishedCourses.length }}</small>
            </button>
            <button
              v-for="level in levels"
              :key="level"
              type="button"
              class="chip"
              :class="{ active: levelFilter === level }"
              @click="levelFilter = level"
            >
              {{ level }} · {{ levelMeta[level].short }}
              <small>{{ levelCounts[level] }}</small>
            </button>
          </div>
        </div>

        <div v-if="availableLabStatuses.length > 0" class="filter-row">
          <span class="filter-label">实验状态</span>
          <div class="chips">
            <button
              type="button"
              class="chip"
              :class="{ active: labFilter === 'all' }"
              @click="labFilter = 'all'"
            >
              全部实验状态
            </button>
            <button
              v-for="status in availableLabStatuses"
              :key="status"
              type="button"
              class="chip"
              :class="{ active: labFilter === status }"
              @click="labFilter = status"
            >
              {{ labLabel(status) }}
            </button>
          </div>
        </div>

        <div class="filter-row">
          <span class="filter-label">搜索</span>
          <label class="catalog-search">
            <span class="sr-only">关键词搜索</span>
            <input
              v-model="query"
              class="input"
              type="search"
              placeholder="标题、问题式标题或主题 ID"
              autocomplete="off"
            />
          </label>
        </div>
      </div>

      <div class="catalog-summary">
        <span>
          实时匹配 <strong>{{ filteredCourses.length }}</strong> 门 / 共
          {{ publishedCourses.length }} 门已发布课程
        </span>
        <button
          v-if="levelFilter !== 'all' || labFilter !== 'all' || query.trim() !== ''"
          type="button"
          class="chip"
          @click="resetFilters"
        >
          清除筛选
        </button>
      </div>

      <div v-if="filteredCourses.length > 0" class="catalog-grid">
        <CourseCard v-for="course in filteredCourses" :key="course.id" :course="course" />
      </div>
      <div v-else class="catalog-empty">
        <strong>没有匹配的课程</strong>
        <span>换一个层级、实验状态或更短的关键词再试。</span>
      </div>
    </div>
  </div>
</template>