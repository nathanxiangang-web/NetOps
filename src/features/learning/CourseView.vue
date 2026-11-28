<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { notify } from '@/app/toast'
import { courseById, levelMeta, topologyById } from '@/content'
import { topologyToPersonalCanvas } from '@/domain/canvas'
import type { LocalProgress } from '@/domain/types'
import { getProgress, markCourseRead, markCourseStep, saveCanvas } from '@/storage/localStore'
import ChallengeCard from './ChallengeCard.vue'
import LabGuidePanel from './LabGuide.vue'
import NetworkCanvas from '@/features/canvas/NetworkCanvas.vue'

const props = defineProps<{ courseId: string }>()
const router = useRouter()

const course = computed(() => courseById.get(props.courseId))
const level = computed(() => (course.value ? levelMeta[course.value.level] : levelMeta.L1))
const topology = computed(() => (course.value ? topologyById.get(course.value.topologyId) : undefined))

const currentStepIndex = ref(0)
const currentStep = computed(() => course.value?.steps[currentStepIndex.value])
const stepCount = computed(() => course.value?.steps.length ?? 0)
const isFirstStep = computed(() => currentStepIndex.value <= 0)
const isLastStep = computed(() => currentStepIndex.value >= stepCount.value - 1)

const activeNodeIds = computed(() => currentStep.value?.focusNodeIds ?? [])
const activeEdgeIds = computed(() => currentStep.value?.focusEdgeIds ?? [])

const selectedNodeId = ref<string | null>(null)
const selectedEdgeId = ref<string | null>(null)

const selectedNode = computed(() => {
  if (!topology.value || !selectedNodeId.value) return undefined
  return topology.value.nodes.find((node) => node.id === selectedNodeId.value)
})

const selectedEdge = computed(() => {
  if (!topology.value || !selectedEdgeId.value) return undefined
  return topology.value.edges.find((edge) => edge.id === selectedEdgeId.value)
})

const progressEntry = ref<LocalProgress | null>(null)
const storageIssue = ref('')

const prerequisiteTitles = computed(() =>
  (course.value?.prerequisites ?? []).map((id) => courseById.get(id)?.title ?? id),
)

const labMeta = computed(() => {
  const status = course.value?.lab.status
  if (status === 'verified') return { label: '已实机验证', tone: 'ok' }
  if (status === 'partial') return { label: '部分支持', tone: 'accent' }
  return { label: '文档指导，尚未实机', tone: 'warn' }
})

const tabs = [
  { id: 'plain', label: '通俗讲解' },
  { id: 'theory', label: '专业理论' },
  { id: 'lab', label: '外部实验' },
  { id: 'challenge', label: '挑战' },
  { id: 'summary', label: '总结与误区' },
] as const

type DetailTab = (typeof tabs)[number]['id']
const activeTab = ref<DetailTab>('plain')

const mobilePane = ref<'topology' | 'explain'>('topology')

const canvasRef = ref<InstanceType<typeof NetworkCanvas> | null>(null)
const lightboxCanvasRef = ref<InstanceType<typeof NetworkCanvas> | null>(null)
const fullscreenButtonRef = ref<HTMLButtonElement | null>(null)
const closeLightboxButtonRef = ref<HTMLButtonElement | null>(null)
const lightboxOpen = ref(false)
let previousBodyOverflow = ''

function stepNumber(index: number): string {
  return String(index + 1).padStart(2, '0')
}

function nodeLabel(nodeId: string): string {
  return topology.value?.nodes.find((node) => node.id === nodeId)?.label ?? nodeId
}

function edgeKindLabel(kind: string): string {
  if (kind === 'physical') return '物理链路'
  if (kind === 'logical') return '逻辑链路'
  if (kind === 'annotation') return '标注'
  if (kind === 'mirror') return '镜像'
  return kind
}

function edgeDirectionLabel(direction: string | undefined): string {
  if (direction === 'forward') return '正向'
  if (direction === 'backward') return '反向'
  return '无向'
}

function loadStoredProgress() {
  const currentCourse = course.value
  if (!currentCourse) return
  try {
    const entry = getProgress().find((item) => item.courseId === currentCourse.id)
    progressEntry.value = entry ?? null
    if (entry?.lastStepId) {
      const index = currentCourse.steps.findIndex((step) => step.id === entry.lastStepId)
      if (index >= 0) currentStepIndex.value = index
    }
  } catch {
    progressEntry.value = null
    storageIssue.value = '本机存储不可用，学习记录不会保存。'
  }
}

function recordStep() {
  const currentCourse = course.value
  const step = currentStep.value
  if (!currentCourse || !step) return
  try {
    let entry = markCourseStep(currentCourse.id, step.id)
    if (currentStepIndex.value === currentCourse.steps.length - 1) {
      entry = markCourseRead(currentCourse.id)
    }
    progressEntry.value = entry
  } catch {
    storageIssue.value = '本机存储不可用，学习记录不会保存。'
  }
}

function refreshProgress() {
  const currentCourse = course.value
  if (!currentCourse) return
  try {
    progressEntry.value = getProgress().find((item) => item.courseId === currentCourse.id) ?? null
  } catch {
    storageIssue.value = '本机存储不可用，学习记录不会保存。'
  }
}

function initCourse() {
  currentStepIndex.value = 0
  selectedNodeId.value = null
  selectedEdgeId.value = null
  activeTab.value = 'plain'
  mobilePane.value = 'topology'
  storageIssue.value = ''
  loadStoredProgress()
  void nextTick(() => recordStep())
}

function changeStep(delta: number) {
  const nextIndex = currentStepIndex.value + delta
  if (nextIndex < 0 || nextIndex >= stepCount.value) return
  currentStepIndex.value = nextIndex
}

function goStep(index: number) {
  if (index < 0 || index >= stepCount.value) return
  currentStepIndex.value = index
  mobilePane.value = 'explain'
  jump('course-topology')
}

function jump(elementId: string) {
  document.getElementById(elementId)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

function openTab(tab: DetailTab) {
  activeTab.value = tab
  void nextTick(() => jump('course-detail'))
}

function handleNodeSelect(payload: unknown) {
  const id =
    typeof payload === 'string'
      ? payload
      : payload && typeof payload === 'object' && 'id' in payload
        ? String((payload as { id: unknown }).id)
        : ''
  if (!id) return
  selectedNodeId.value = id
  selectedEdgeId.value = null
}

function handleEdgeSelect(payload: unknown) {
  const id =
    typeof payload === 'string'
      ? payload
      : payload && typeof payload === 'object' && 'id' in payload
        ? String((payload as { id: unknown }).id)
        : ''
  if (!id) return
  selectedEdgeId.value = id
  selectedNodeId.value = null
}

function handlePaneClick() {
  selectedNodeId.value = null
  selectedEdgeId.value = null
}

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  const tag = target.tagName.toLowerCase()
  return tag === 'input' || tag === 'textarea' || tag === 'select' || target.isContentEditable
}

function openLightbox() {
  if (!topology.value || lightboxOpen.value) return
  previousBodyOverflow = document.body.style.overflow
  document.body.style.overflow = 'hidden'
  lightboxOpen.value = true
  void nextTick(() => closeLightboxButtonRef.value?.focus())
}

function closeLightbox() {
  if (!lightboxOpen.value) return
  lightboxOpen.value = false
  document.body.style.overflow = previousBodyOverflow
  previousBodyOverflow = ''
  void nextTick(() => fullscreenButtonRef.value?.focus())
}

function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape' && lightboxOpen.value) {
    event.preventDefault()
    closeLightbox()
    return
  }
  if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return
  if (isEditableTarget(event.target)) return
  if (event.metaKey || event.ctrlKey || event.altKey) return
  event.preventDefault()
  changeStep(event.key === 'ArrowLeft' ? -1 : 1)
}

function zoomIn() {
  canvasRef.value?.zoomIn()
}

function zoomOut() {
  canvasRef.value?.zoomOut()
}

function fitView() {
  canvasRef.value?.fitView()
}

function copyAsCanvas() {
  const currentCourse = course.value
  const currentTopology = topology.value
  if (!currentCourse || !currentTopology) {
    notify('当前课程缺少可复制的拓扑数据。', 'error')
    return
  }
  try {
    const canvas = topologyToPersonalCanvas(currentTopology, {
      title: `${currentCourse.title} 学习副本`,
      courseId: currentCourse.id,
    })
    const saved = saveCanvas(canvas)
    notify('已复制为我的画布，可在自由画布中继续编辑。')
    void router.push(`/canvas/${saved.id}`)
  } catch (error) {
    notify(error instanceof Error ? error.message : '复制画布失败。', 'error')
  }
}

watch(currentStepIndex, () => {
  recordStep()
})

watch(
  () => props.courseId,
  () => {
    initCourse()
  },
)

onMounted(() => {
  initCourse()
  window.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
  if (lightboxOpen.value) {
    document.body.style.overflow = previousBodyOverflow
    previousBodyOverflow = ''
  }
})
</script>

<template>
  <div v-if="!course" class="course-page">
    <div class="container course-missing">
      <div class="eyebrow">COURSE NOT FOUND</div>
      <h1>没有找到这门课程</h1>
      <p>课程 ID：<code class="mono">{{ courseId }}</code>。链接可能已失效，或内容尚未发布。</p>
      <div class="notfound-actions">
        <RouterLink class="btn" to="/courses">返回课程目录</RouterLink>
        <RouterLink class="btn ghost" to="/">回到首页</RouterLink>
      </div>
    </div>
  </div>

  <div v-else class="course-page" :style="{ '--level-accent': level.accent }">
    <div class="container">
      <nav class="breadcrumb" aria-label="面包屑">
        <RouterLink to="/">首页</RouterLink>
        <span>/</span>
        <RouterLink to="/courses">课程目录</RouterLink>
        <span>/</span>
        <span>{{ course.title }}</span>
      </nav>

      <header class="course-header">
        <div class="course-header-main">
          <div class="course-kicker">
            <span class="badge accent">{{ course.level }}</span>
            <span>{{ level.short }}</span>
            <span>·</span>
            <span>{{ course.title }}</span>
          </div>
          <h1 class="course-title">{{ course.question }}</h1>
          <ul class="course-goals">
            <li v-for="goal in course.goals" :key="goal">{{ goal }}</li>
          </ul>
        </div>

        <div class="course-facts">
          <div class="fact">
            <span class="fact-label">级别</span>
            <span class="fact-value"><strong>{{ course.level }}</strong> · {{ level.short }}</span>
          </div>
          <div class="fact">
            <span class="fact-label">时长</span>
            <span class="fact-value">{{ course.minutes }} 分钟</span>
          </div>
          <div class="fact">
            <span class="fact-label">步骤</span>
            <span class="fact-value">{{ course.steps.length }} 步 · {{ course.proTheory.length }} 节专业理论</span>
          </div>
          <div class="fact">
            <span class="fact-label">先修</span>
            <span class="fact-value">
              <template v-if="prerequisiteTitles.length > 0">{{ prerequisiteTitles.join('、') }}</template>
              <template v-else>无</template>
            </span>
          </div>
          <div class="fact">
            <span class="fact-label">实验状态</span>
            <span class="fact-value"><span class="badge" :class="labMeta.tone">{{ labMeta.label }}</span></span>
          </div>
          <div class="fact">
            <span class="fact-label">本机记录</span>
            <span class="fact-value">
              <span v-if="progressEntry?.read" class="badge ok">已完成阅读</span>
              <span v-else-if="progressEntry" class="badge accent">阅读中 · 第 {{ currentStepIndex + 1 }} 步</span>
              <span v-else class="badge">未开始</span>
            </span>
          </div>
          <div class="course-tags">
            <span v-for="topicId in course.topicIds" :key="topicId" class="tag">{{ topicId }}</span>
          </div>
          <div class="course-sources">
            <a
              v-for="source in course.sources"
              :key="source.url"
              :href="source.url"
              target="_blank"
              rel="noopener noreferrer"
            >
              来源 · {{ source.title }}
            </a>
          </div>
          <div class="course-header-actions">
            <button type="button" class="btn small" @click="copyAsCanvas">复制为我的画布</button>
            <RouterLink class="btn ghost small" to="/courses">返回目录</RouterLink>
          </div>
        </div>
      </header>

      <p v-if="storageIssue" class="fineprint">{{ storageIssue }}</p>

      <div class="mobile-pane-toggle" role="tablist" aria-label="移动端视图切换">
        <button
          type="button"
          class="pane-tab"
          role="tab"
          :aria-selected="mobilePane === 'topology'"
          :class="{ active: mobilePane === 'topology' }"
          @click="mobilePane = 'topology'"
        >
          拓扑
        </button>
        <button
          type="button"
          class="pane-tab"
          role="tab"
          :aria-selected="mobilePane === 'explain'"
          :class="{ active: mobilePane === 'explain' }"
          @click="mobilePane = 'explain'"
        >
          讲解
        </button>
      </div>

      <div id="course-workbench" class="workbench" :class="`mobile-${mobilePane}`">
        <aside class="workbench-nav" aria-label="课程导航">
          <p class="nav-title">章节</p>
          <button type="button" class="nav-button" @click="jump('course-why')">为什么学这一课</button>
          <button type="button" class="nav-button" @click="jump('course-topology')">看拓扑</button>

          <p class="nav-title">步骤 {{ currentStepIndex + 1 }} / {{ stepCount }}</p>
          <button
            v-for="(step, index) in course.steps"
            :key="step.id"
            type="button"
            class="nav-button"
            :class="{ active: index === currentStepIndex }"
            @click="goStep(index)"
          >
            <span class="nav-step-index">{{ stepNumber(index) }}</span>
            <span class="nav-step-label">{{ step.title }}</span>
          </button>

          <p class="nav-title">深入</p>
          <button type="button" class="nav-button" @click="openTab('theory')">专业理论</button>
          <button type="button" class="nav-button" @click="openTab('lab')">外部实验</button>
          <button type="button" class="nav-button" @click="openTab('challenge')">挑战</button>
          <button type="button" class="nav-button" @click="openTab('summary')">总结与误区</button>
        </aside>

        <section id="course-topology" class="workbench-canvas">
          <div class="canvas-toolbar">
            <div class="canvas-tool-group">
              <button type="button" class="canvas-tool" aria-label="放大拓扑" title="放大" @click="zoomIn">＋</button>
              <button type="button" class="canvas-tool" aria-label="缩小拓扑" title="缩小" @click="zoomOut">－</button>
              <button type="button" class="canvas-tool" aria-label="适应画布" title="适应画布" @click="fitView">适应</button>
            </div>
            <button
              ref="fullscreenButtonRef"
              type="button"
              class="canvas-tool fullscreen-tool"
              aria-label="全屏看图"
              title="全屏看图"
              @click="openLightbox"
            >
              全屏看图
            </button>
            <span class="canvas-tool-spacer"></span>
            <button type="button" class="canvas-tool primary" @click="copyAsCanvas">复制为我的画布</button>
            <span class="canvas-readonly-note">只读 · 课程模式</span>
          </div>

          <div class="canvas-stage">
            <NetworkCanvas
              v-if="topology && !lightboxOpen"
              ref="canvasRef"
              :topology-id="course.topologyId"
              :nodes="topology.nodes"
              :edges="topology.edges"
              :zones="topology.zones"
              mode="course"
              :active-node-ids="activeNodeIds"
              :active-edge-ids="activeEdgeIds"
              :selected-node-id="selectedNodeId"
              :selected-edge-id="selectedEdgeId"
              @node-select="handleNodeSelect"
              @edge-select="handleEdgeSelect"
              @pane-click="handlePaneClick"
            />
            <div v-if="!topology" class="object-empty">当前课程缺少拓扑数据。</div>
          </div>

          <div class="canvas-legend">
            <span class="legend-item"><i class="legend-swatch"></i>当前步骤高亮</span>
            <span class="legend-item"><i class="legend-swatch dim"></i>其他链路</span>
            <span class="legend-item">点击节点或连线查看知识卡，不改变网络状态</span>
          </div>
        </section>

        <aside class="workbench-explain">
          <div v-if="selectedNode" class="object-card">
            <div class="object-card-head">
              <strong>{{ selectedNode.label }}</strong>
              <span>当前对象 · 节点</span>
            </div>
            <div class="object-kv">
              <span><b>角色</b>{{ selectedNode.role }}</span>
              <span v-if="selectedNode.ip"><b>地址</b>{{ selectedNode.ip }}</span>
            </div>
            <p v-if="selectedNode.note" class="object-note">{{ selectedNode.note }}</p>
          </div>
          <div v-else-if="selectedEdge" class="object-card">
            <div class="object-card-head">
              <strong>{{ selectedEdge.label ?? '未命名连线' }}</strong>
              <span>当前对象 · 连线</span>
            </div>
            <div class="object-kv">
              <span><b>端点</b>{{ nodeLabel(selectedEdge.source) }} → {{ nodeLabel(selectedEdge.target) }}</span>
              <span><b>类型</b>{{ edgeKindLabel(selectedEdge.kind) }}</span>
              <span><b>方向</b>{{ edgeDirectionLabel(selectedEdge.direction) }}</span>
            </div>
            <p v-if="selectedEdge.note" class="object-note">{{ selectedEdge.note }}</p>
          </div>
          <div v-else class="object-empty">当前对象：点击拓扑中的节点或连线，知识卡会显示在这里。</div>

          <div v-if="currentStep" class="step-panel">
            <div class="step-mark">
              <span>STEP</span>
              <strong>{{ stepNumber(currentStepIndex) }}</strong>
              <small>/ {{ stepCount }}</small>
            </div>
            <h2 class="step-title">{{ currentStep.title }}</h2>
            <p class="step-plain">{{ currentStep.plainText }}</p>
            <div v-if="currentStep.evidenceText" class="callout">
              <span>证据 · 外部实验观察点</span>
              <p>{{ currentStep.evidenceText }}</p>
            </div>
            <ul v-if="currentStep.directionHints?.length" class="hint-list">
              <li v-for="hint in currentStep.directionHints" :key="hint">{{ hint }}</li>
            </ul>
            <details class="professional">
              <summary>展开专业说明</summary>
              <p>{{ currentStep.professionalText }}</p>
            </details>
            <div class="step-actions">
              <button type="button" class="btn secondary small" :disabled="isFirstStep" @click="changeStep(-1)">
                上一步
              </button>
              <button type="button" class="btn small" :disabled="isLastStep" @click="changeStep(1)">
                下一步
              </button>
            </div>
            <p class="fineprint">
              左右方向键可切步骤；本机阅读记录只写入当前浏览器，不代表认证或能力证明。
            </p>
          </div>
        </aside>
      </div>

      <section id="course-why" class="course-section">
        <h2>为什么学这一课</h2>
        <div class="why-grid">
          <article v-for="section in course.why" :key="section.heading" class="why-card">
            <h3>{{ section.heading }}</h3>
            <p v-for="paragraph in section.paragraphs" :key="paragraph">{{ paragraph }}</p>
          </article>
        </div>
      </section>

      <section id="course-detail" class="course-section course-detail">
        <div class="section-head">
          <div>
            <div class="eyebrow">DEEP DIVE</div>
            <h2 class="section-title">逐层读深</h2>
            <p class="section-lede">步骤讲解、专业理论、外部实验、挑战与总结都可直接切换，不必长距离滚动。</p>
          </div>
        </div>

        <div class="detail-tabs" role="tablist" aria-label="课程深读">
          <button
            v-for="tab in tabs"
            :key="tab.id"
            type="button"
            class="detail-tab"
            role="tab"
            :aria-selected="activeTab === tab.id"
            :class="{ active: activeTab === tab.id }"
            @click="activeTab = tab.id"
          >
            {{ tab.label }}
          </button>
        </div>

        <div class="detail-panel">
          <template v-if="activeTab === 'plain'">
            <h3 v-if="currentStep">通俗讲解 · 第 {{ currentStepIndex + 1 }} 步 {{ currentStep.title }}</h3>
            <p v-if="currentStep" class="step-plain">{{ currentStep.plainText }}</p>
            <div v-if="currentStep?.evidenceText" class="callout">
              <span>证据</span>
              <p>{{ currentStep.evidenceText }}</p>
            </div>
            <details v-if="currentStep" class="professional">
              <summary>展开专业说明</summary>
              <p>{{ currentStep.professionalText }}</p>
            </details>
            <p class="fineprint">右侧讲解面板与这里同步当前步骤，切换步骤时拓扑高亮一起更新。</p>
          </template>

          <template v-else-if="activeTab === 'theory'">
            <h3>专业理论</h3>
            <div class="theory-grid">
              <section v-for="section in course.proTheory" :key="section.heading" class="theory-section">
                <h4>{{ section.heading }}</h4>
                <p v-for="paragraph in section.paragraphs" :key="paragraph">{{ paragraph }}</p>
                <ul v-if="section.bullets?.length">
                  <li v-for="bullet in section.bullets" :key="bullet">{{ bullet }}</li>
                </ul>
              </section>
            </div>
          </template>

          <template v-else-if="activeTab === 'lab'">
            <LabGuidePanel :guide="course.lab" />
          </template>

          <template v-else-if="activeTab === 'challenge'">
            <h3>挑战</h3>
            <div class="challenge-list">
              <ChallengeCard
                v-for="challenge in course.challenges"
                :key="challenge.id"
                :challenge="challenge"
                :course-id="course.id"
                @attempted="refreshProgress"
              />
            </div>
          </template>

          <template v-else>
            <h3>总结与误区</h3>
            <div class="summary-columns">
              <div>
                <h4>关键结论</h4>
                <ul class="summary-list">
                  <li v-for="item in course.summary" :key="item">{{ item }}</li>
                </ul>
              </div>
              <div>
                <h4>常见误区</h4>
                <div class="misconception-list">
                  <div v-for="item in course.misconceptions" :key="item.wrong" class="misconception">
                    <span><b>误区</b> {{ item.wrong }}</span>
                    <span><b>纠正</b> {{ item.right }}</span>
                  </div>
                </div>
              </div>
            </div>
            <h4>来源</h4>
            <ul class="source-list">
              <li v-for="source in course.sources" :key="source.url">
                <a :href="source.url" target="_blank" rel="noopener noreferrer">{{ source.title }}</a>
                <template v-if="source.note">：{{ source.note }}</template>
              </li>
            </ul>
          </template>
        </div>
      </section>
    </div>

    <Teleport to="body">
      <div
        v-if="lightboxOpen && topology && currentStep"
        class="course-lightbox"
        role="dialog"
        aria-modal="true"
        aria-labelledby="course-lightbox-title"
        @click.self="closeLightbox"
      >
        <div class="course-lightbox-panel">
          <div class="course-lightbox-canvas">
            <NetworkCanvas
              ref="lightboxCanvasRef"
              :topology-id="course.topologyId"
              :nodes="topology.nodes"
              :edges="topology.edges"
              :zones="topology.zones"
              mode="course"
              :fit-view-padding="0.05"
              :active-node-ids="activeNodeIds"
              :active-edge-ids="activeEdgeIds"
              :selected-node-id="selectedNodeId"
              :selected-edge-id="selectedEdgeId"
              @node-select="handleNodeSelect"
              @edge-select="handleEdgeSelect"
              @pane-click="handlePaneClick"
            />
          </div>

          <header class="course-lightbox-head">
            <div class="course-lightbox-titles">
              <p class="course-lightbox-eyebrow">全屏看图 · 只读 · 课程模式</p>
              <h2 id="course-lightbox-title" class="course-lightbox-title">{{ course.title }}</h2>
              <p class="course-lightbox-step">
                STEP {{ stepNumber(currentStepIndex) }} / {{ stepCount }} · {{ currentStep.title }}
              </p>
            </div>
            <button
              ref="closeLightboxButtonRef"
              type="button"
              class="course-lightbox-close"
              aria-label="关闭全屏看图"
              @click="closeLightbox"
            >
              关闭 ✕
            </button>
          </header>

          <footer class="course-lightbox-foot">
            <div class="course-lightbox-steps">
              <button type="button" class="btn secondary small" :disabled="isFirstStep" @click="changeStep(-1)">
                上一步
              </button>
              <span class="course-lightbox-stepcount">{{ currentStepIndex + 1 }} / {{ stepCount }}</span>
              <button type="button" class="btn small" :disabled="isLastStep" @click="changeStep(1)">
                下一步
              </button>
            </div>
            <div class="course-lightbox-object">
              <template v-if="selectedNode">
                <strong>{{ selectedNode.label }}</strong>
                <span>
                  当前对象 · 节点 · {{ selectedNode.role }}
                  <template v-if="selectedNode.ip"> · {{ selectedNode.ip }}</template>
                </span>
              </template>
              <template v-else-if="selectedEdge">
                <strong>{{ selectedEdge.label ?? '未命名连线' }}</strong>
                <span>
                  当前对象 · 连线 · {{ nodeLabel(selectedEdge.source) }} → {{ nodeLabel(selectedEdge.target) }}
                </span>
              </template>
              <template v-else>
                <strong>当前对象：未选择</strong>
                <span>点击拓扑中的节点或连线，知识卡会显示在这里。</span>
              </template>
            </div>
          </footer>
        </div>
      </div>
    </Teleport>
  </div>
</template>