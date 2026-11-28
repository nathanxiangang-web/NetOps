<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { courseById } from '@/content'
import type { CanvasIndexEntry, LocalProgress } from '@/domain/types'
import { getProgress, listCanvases } from '@/storage/localStore'

const progress = ref<LocalProgress[]>([])
const canvases = ref<CanvasIndexEntry[]>([])
const storageIssue = ref('')

onMounted(() => {
  try {
    progress.value = [...getProgress()].sort((left, right) =>
      right.updatedAt.localeCompare(left.updatedAt),
    )
    canvases.value = listCanvases()
  } catch {
    storageIssue.value = '当前浏览器本地存储不可用，无法读取本机阅读记录与画布索引。'
  }
})

function courseTitle(courseId: string): string {
  return courseById.get(courseId)?.title ?? courseId
}

function lastStepTitle(entry: LocalProgress): string {
  const course = courseById.get(entry.courseId)
  if (!course) return entry.lastStepId ?? '未记录步骤'
  const step = course.steps.find((item) => item.id === entry.lastStepId)
  return step?.title ?? '未记录步骤'
}

function formatTime(value: string): string {
  const time = new Date(value)
  if (Number.isNaN(time.getTime())) return value
  return time.toLocaleString('zh-CN')
}
</script>

<template>
  <div>
    <section class="catalog-hero">
      <div class="container">
        <div class="eyebrow">LOCAL RECORDS</div>
        <h1 class="page-title">我的记录</h1>
        <p class="page-lede">
          阅读记录与画布索引都来自当前浏览器的本地保存，不上传、不代表认证。换浏览器或清理站点数据后会消失。
        </p>
      </div>
    </section>

    <div class="container page-shell">
      <p v-if="storageIssue" class="lab-safe-note">{{ storageIssue }}</p>

      <section class="notes-section">
        <div class="section-head">
          <div>
            <div class="eyebrow">READING</div>
            <h2 class="section-title">本机阅读记录</h2>
            <p class="section-lede">按最近更新时间排序，继续进入课程时会从上次步骤开始。</p>
          </div>
          <span class="section-count"><strong>{{ progress.length }}</strong> 条记录</span>
        </div>

        <div v-if="progress.length > 0" class="notes-list">
          <article v-for="entry in progress" :key="entry.courseId" class="note-row">
            <div class="note-row-head">
              <RouterLink :to="{ name: 'course', params: { courseId: entry.courseId } }">
                {{ courseTitle(entry.courseId) }}
              </RouterLink>
              <div class="note-badges">
                <span v-if="entry.read" class="badge ok">已完成阅读</span>
                <span v-else class="badge accent">阅读中</span>
                <span v-if="entry.challengeAttempted" class="badge warn">已尝试挑战</span>
              </div>
            </div>
            <div class="note-meta">
              <span>上次步骤：{{ lastStepTitle(entry) }}</span>
              <span>更新时间：{{ formatTime(entry.updatedAt) }}</span>
            </div>
            <div class="note-actions">
              <RouterLink class="btn small" :to="{ name: 'course', params: { courseId: entry.courseId } }">
                继续学习
              </RouterLink>
            </div>
          </article>
        </div>
        <div v-else class="empty-state">
          <p>尚无本机阅读记录。进入任意课程后，步骤会写入当前浏览器。</p>
          <RouterLink class="btn" to="/courses">浏览课程目录</RouterLink>
        </div>
      </section>

      <section class="notes-section">
        <div class="section-head">
          <div>
            <div class="eyebrow">CANVASES</div>
            <h2 class="section-title">本机画布</h2>
            <p class="section-lede">课程拓扑复制出的学习副本与自由画布都保存在本机索引中。</p>
          </div>
          <span class="section-count"><strong>{{ canvases.length }}</strong> 个画布</span>
        </div>

        <div v-if="canvases.length > 0" class="notes-list">
          <article v-for="canvas in canvases" :key="canvas.id" class="note-row">
            <div class="note-row-head">
              <RouterLink :to="{ name: 'canvas', params: { id: canvas.id } }">
                {{ canvas.title }}
              </RouterLink>
              <span class="badge">{{ canvas.nodeCount }} 节点 · {{ canvas.edgeCount }} 连线</span>
            </div>
            <div class="note-meta">
              <span v-if="canvas.basedOnCourseId">来源课程：{{ courseTitle(canvas.basedOnCourseId) }}</span>
              <span>更新时间：{{ formatTime(canvas.updatedAt) }}</span>
            </div>
            <div class="note-actions">
              <RouterLink class="btn small secondary" :to="{ name: 'canvas', params: { id: canvas.id } }">
                打开画布
              </RouterLink>
            </div>
          </article>
        </div>
        <div v-else class="empty-state">
          <p>尚无本机画布。可以在自由画布中新建，或从任意课程复制一份学习副本。</p>
          <RouterLink class="btn" to="/canvas">打开自由画布</RouterLink>
        </div>
      </section>
    </div>
  </div>
</template>