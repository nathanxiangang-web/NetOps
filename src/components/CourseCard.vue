<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { courseById, levelMeta, topologyById } from '@/content'
import type { Course } from '@/domain/types'

const props = defineProps<{ course: Course }>()

const meta = computed(() => levelMeta[props.course.level])
const topology = computed(() => topologyById.get(props.course.topologyId))
const prerequisiteTitles = computed(() =>
  props.course.prerequisites.map((id) => courseById.get(id)?.title ?? id),
)
const labStatus = computed(() => {
  if (props.course.lab.status === 'verified') {
    return { label: '已实机验证', tone: 'ok' }
  }
  if (props.course.lab.status === 'partial') {
    return { label: '部分支持', tone: 'accent' }
  }
  return { label: '文档指导', tone: 'warn' }
})
</script>

<template>
  <RouterLink
    class="course-card"
    :to="{ name: 'course', params: { courseId: course.id } }"
    :style="{ '--level-accent': meta.accent }"
  >
    <div class="course-card-top">
      <span class="course-level">{{ course.level }} · {{ meta.short }}</span>
      <span class="course-card-meta">{{ course.minutes }} 分钟 · {{ course.steps.length }} 步</span>
    </div>
    <h3>{{ course.title }}</h3>
    <p class="course-question">{{ course.question }}</p>
    <div class="course-card-facts">
      <span class="course-fact">
        <b>先修</b>
        {{ prerequisiteTitles.length > 0 ? prerequisiteTitles.join('、') : '无' }}
      </span>
      <span class="course-fact">
        <b>拓扑</b>
        {{ topology?.title ?? course.topologyId }}
      </span>
    </div>
    <div class="course-card-foot">
      <span class="badge" :class="labStatus.tone">{{ labStatus.label }}</span>
      <span class="course-cta">进入课程 →</span>
    </div>
  </RouterLink>
</template>