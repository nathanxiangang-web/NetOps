<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import CourseCard from '@/components/CourseCard.vue'
import ProgressRing from '@/components/ProgressRing.vue'
import { contentStats, courseById, courses, learningPaths, levelMeta, publicTopicCoverage } from '@/content'
import type { Course, CourseLevel, LocalProgress } from '@/domain/types'
import { getProgress } from '@/storage/localStore'

const levels: CourseLevel[] = ['L1', 'L2', 'L3', 'L4', 'L5']
const publishedCourses = computed(() => courses.filter((course) => course.publicationStatus === 'published'))

const stats = [
  {
    value: contentStats.analyzedSourceCount,
    label: '条本地解析已清点',
    note: '只统计来源文件，不等于全部转换',
  },
  {
    value: contentStats.courseCount,
    label: '门已发布课程',
    note: `${contentStats.stepCount} 个学习步骤`,
  },
  {
    value: contentStats.topologyCount,
    label: '套合成拓扑',
    note: '静态教学，无协议模拟',
  },
  {
    value: contentStats.guideOnlyLabCount,
    label: '个实验指导',
    note: '仅外部隔离环境文档',
  },
  {
    value: contentStats.verifiedLabCount,
    label: '个实机验证',
    note: '按实际记录，未验证不虚报',
  },
]

function levelCourses(level: CourseLevel): Course[] {
  return publishedCourses.value.filter((course) => course.level === level)
}

function pathCourses(courseIds: string[]): Course[] {
  return courseIds
    .map((id) => courseById.get(id))
    .filter((course): course is Course => course !== undefined)
}

function pathLevels(courseIds: string[]): CourseLevel[] {
  const present = new Set(pathCourses(courseIds).map((course) => course.level))
  return levels.filter((level) => present.has(level))
}

const expandedPathId = ref<string | null>(learningPaths[0]?.id ?? null)

function togglePath(pathId: string) {
  expandedPathId.value = expandedPathId.value === pathId ? null : pathId
}

const progress = ref<LocalProgress[]>([])
const progressUnavailable = ref(false)

onMounted(() => {
  try {
    progress.value = getProgress()
  } catch {
    progressUnavailable.value = true
  }
})

const latestProgress = computed(() => {
  return [...progress.value]
    .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))
    .find((entry) => courseById.has(entry.courseId))
})

const latestCourse = computed(() => {
  const entry = latestProgress.value
  return entry ? courseById.get(entry.courseId) : undefined
})

const latestStepIndex = computed(() => {
  const entry = latestProgress.value
  const course = latestCourse.value
  if (!entry || !course) return 0
  const index = course.steps.findIndex((step) => step.id === entry.lastStepId)
  return index >= 0 ? index : 0
})

const latestStep = computed(() => latestCourse.value?.steps[latestStepIndex.value])
const latestPercent = computed(() => {
  const course = latestCourse.value
  if (!course) return 0
  if (latestProgress.value?.read) return 100
  return Math.round(((latestStepIndex.value + 1) / course.steps.length) * 100)
})

const recommendedCourse = computed(() => courseById.get('l1-ping-path'))

const searchQuery = ref('')
const searchResults = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()
  if (!query) return []
  return publishedCourses.value.filter((course) => {
    return (
      course.title.toLowerCase().includes(query) ||
      course.question.toLowerCase().includes(query) ||
      course.id.toLowerCase().includes(query) ||
      course.topicIds.some((topicId) => topicId.toLowerCase().includes(query))
    )
  })
})
</script>

<template>
  <div>
    <section class="home-hero">
      <div class="container home-hero-inner">
        <div class="home-hero-copy">
          <div class="eyebrow">NETOPS · 拓扑学习工作台</div>
          <h1 class="home-hero-title">
            以拓扑学网络，<br />
            <span>以实验验原理，</span><br />
            以画布沉淀知识
          </h1>
          <p class="home-hero-lede">
            从一次 Ping、一张陌生拓扑开始，把设备职责、转发路径与排障证据串起来。
            每门课都用合成拓扑与外部实验指导组织内容，进度与画布只留在本机浏览器。
          </p>
          <div class="home-hero-actions">
            <RouterLink class="btn" to="/learn/l1-ping-path">从第一课开始</RouterLink>
            <RouterLink class="btn secondary" to="/canvas">打开自由画布</RouterLink>
          </div>
          <ul class="hero-meta">
            <li class="hero-meta-item">合成拓扑</li>
            <li class="hero-meta-item">静态教学</li>
            <li class="hero-meta-item">无协议模拟</li>
          </ul>
        </div>

        <div class="home-hero-visual">
          <svg class="hero-map" viewBox="0 0 560 400" role="img" aria-label="合成网络拓扑示意图">
            <defs>
              <linearGradient id="hero-zone" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stop-color="#38d4ff" stop-opacity="0.1" />
                <stop offset="1" stop-color="#38d4ff" stop-opacity="0.01" />
              </linearGradient>
            </defs>
            <g class="map-grid">
              <path d="M0 80 H560 M0 160 H560 M0 240 H560 M0 320 H560" />
              <path d="M80 0 V400 M160 0 V400 M240 0 V400 M320 0 V400 M400 0 V400 M480 0 V400" />
            </g>

            <rect class="map-zone" x="34" y="196" width="190" height="164" rx="14" fill="url(#hero-zone)" />
            <rect class="map-zone" x="236" y="110" width="176" height="250" rx="14" fill="url(#hero-zone)" />
            <rect class="map-zone" x="366" y="66" width="166" height="128" rx="14" fill="url(#hero-zone)" />

            <text class="map-zone-label" x="50" y="218">办公接入域</text>
            <text class="map-zone-label" x="252" y="132">转发与边界</text>
            <text class="map-zone-label" x="382" y="88">外部与服务</text>

            <path class="map-line" d="M106 278 C140 278 146 262 176 262" />
            <path class="map-line flow" d="M208 262 C238 262 248 214 282 208" />
            <path class="map-line flow" d="M316 200 C350 190 372 138 412 124" />
            <path class="map-line" d="M316 214 C348 232 362 276 392 292" />
            <path class="map-line secondary" d="M196 124 C228 124 244 160 276 184" />

            <g>
              <rect class="map-node" x="66" y="258" width="40" height="40" rx="10" />
              <circle class="map-node-core" cx="86" cy="278" r="4" />
              <text class="map-node-label" x="60" y="316">办公终端</text>
            </g>
            <g>
              <rect class="map-node" x="176" y="242" width="40" height="40" rx="10" />
              <circle class="map-node-core" cx="196" cy="262" r="4" />
              <text class="map-node-label" x="174" y="300">接入交换</text>
            </g>
            <g>
              <rect class="map-node" x="278" y="180" width="46" height="46" rx="12" />
              <circle class="map-node-core" cx="301" cy="203" r="5" />
              <text class="map-node-label" x="278" y="246">边界路由</text>
            </g>
            <g>
              <rect class="map-node" x="410" y="102" width="42" height="42" rx="11" />
              <circle class="map-node-core" cx="431" cy="123" r="4" />
              <text class="map-node-label" x="414" y="162">互联网</text>
            </g>
            <g>
              <rect class="map-node" x="392" y="272" width="42" height="42" rx="11" />
              <circle class="map-node-core" cx="413" cy="293" r="4" />
              <text class="map-node-label" x="390" y="332">应用服务</text>
            </g>
            <g>
              <rect class="map-node" x="174" y="102" width="42" height="42" rx="11" />
              <circle class="map-node-core" cx="195" cy="123" r="4" />
              <text class="map-node-label" x="172" y="162">身份服务</text>
            </g>

            <circle cx="106" cy="278" r="3" fill="#6ee7ff" />
            <circle cx="208" cy="262" r="3" fill="#6ee7ff" />
            <circle cx="282" cy="208" r="3" fill="#6ee7ff" />
            <circle cx="316" cy="200" r="3" fill="#6ee7ff" />
            <circle cx="392" cy="292" r="3" fill="#a78bfa" />
          </svg>

          <div class="hero-float hero-float-a">
            <span class="hero-float-label">课程地图</span>
            <span class="hero-float-value">{{ contentStats.courseCount }} 门课程 · {{ learningPaths.length }} 条路径</span>
            <div class="hero-float-meter" aria-hidden="true">
              <span></span><span></span><span></span>
            </div>
          </div>

          <div class="hero-float hero-float-b">
            <span class="hero-float-label">当前路径 · L1</span>
            <span class="hero-float-value">一次 Ping 的完整旅程</span>
            <span class="hero-float-label">{{ courseById.get('l1-ping-path')?.steps.length ?? 0 }} 个讲解步骤 · 只读拓扑</span>
          </div>

          <span class="hero-visual-note">合成拓扑 / 静态教学 / 无协议模拟，不连接真实设备</span>
        </div>
      </div>
    </section>

    <div class="container">
      <div class="home-stats">
        <div v-for="item in stats" :key="item.label" class="stat-cell">
          <span class="stat-value">{{ item.value }}</span>
          <span class="stat-label">{{ item.label }}</span>
          <span class="stat-note">{{ item.note }}</span>
        </div>
      </div>
    </div>

    <div class="container home-split">
      <section>
        <div class="section-head">
          <div>
            <div class="eyebrow">CONTINUE</div>
            <h2 class="section-title">从这里继续</h2>
            <p class="section-lede">读取当前浏览器保存的阅读记录；没有记录时给出真实推荐，不生成假进度。</p>
          </div>
        </div>

        <article v-if="latestCourse && latestStep" class="continue-card">
          <ProgressRing :value="latestPercent" :caption="latestProgress?.read ? '本机已读完' : '本机阅读记录'" />
          <div class="continue-copy">
            <h3>
              <RouterLink :to="{ name: 'course', params: { courseId: latestCourse.id } }">
                {{ latestCourse.title }}
              </RouterLink>
            </h3>
            <p>
              上次停在第 {{ latestStepIndex + 1 }} 步「{{ latestStep.title }}」 ·
              {{ latestProgress?.read ? '已标记读完' : '未标记读完' }}
            </p>
            <div class="continue-foot">
              <RouterLink class="btn" :to="{ name: 'course', params: { courseId: latestCourse.id } }">
                继续这一步
              </RouterLink>
              <RouterLink class="btn ghost small" to="/notes">查看我的记录</RouterLink>
            </div>
            <p class="fineprint">本机阅读记录，仅保存在当前浏览器，不代表认证或能力证明。</p>
          </div>
        </article>

        <article v-else class="continue-card empty">
          <div class="continue-copy">
            <div class="eyebrow">尚无本机记录</div>
            <h3>推荐从第一课开始</h3>
            <p>
              当前浏览器还没有学习记录。
              <template v-if="recommendedCourse">
                先看「{{ recommendedCourse.title }}」，把一次 Ping 拆成可取证的步骤。
              </template>
            </p>
            <div class="continue-foot">
              <RouterLink
                v-if="recommendedCourse"
                class="btn"
                :to="{ name: 'course', params: { courseId: recommendedCourse.id } }"
              >
                打开 L1 第一课
              </RouterLink>
              <RouterLink class="btn ghost" to="/courses">浏览全部课程</RouterLink>
            </div>
            <p v-if="progressUnavailable" class="fineprint">当前浏览器本地存储不可用，阅读记录无法保存。</p>
            <p v-else class="fineprint">进度只写入本机 localStorage，不会上传到服务器。</p>
          </div>
        </article>
      </section>

      <section class="search-panel">
        <h3>知识点搜索</h3>
        <label class="field">
          <span>标题 / 问题 / 主题 ID</span>
          <input
            v-model="searchQuery"
            class="input"
            type="search"
            placeholder="例如 ping、VLAN、MPLS、身份"
            autocomplete="off"
          />
        </label>
        <template v-if="searchQuery.trim()">
          <p class="search-count">匹配 {{ searchResults.length }} 门课程</p>
          <ul v-if="searchResults.length > 0" class="search-results">
            <li v-for="course in searchResults" :key="course.id">
              <RouterLink
                class="search-result"
                :to="{ name: 'course', params: { courseId: course.id } }"
              >
                <small>{{ course.level }}</small>
                <span>{{ course.title }}</span>
                <small>{{ course.minutes }} 分钟</small>
              </RouterLink>
            </li>
          </ul>
          <p v-else class="empty-inline">没有匹配的课程，换一个更短的关键词试试。</p>
        </template>
        <p v-else class="search-hint">
          实时筛选课程标题、问题式标题与 topicIds。结果直接进入课程，不新建页面。
        </p>
      </section>
    </div>

    <section class="container home-section">
      <div class="section-head">
        <div>
          <div class="eyebrow">LEARNING PATHS</div>
          <h2 class="section-title">按先修顺序组织学习路径</h2>
          <p class="section-lede">
            五条路径都以问题驱动，顺序即建议的课程先后；也可以直接从任意一门已发布课程进入。
          </p>
        </div>
        <span class="section-count"><strong>{{ learningPaths.length }}</strong> 条路径</span>
      </div>

      <div class="path-grid">
        <article
          v-for="path in learningPaths"
          :key="path.id"
          class="path-card"
          :class="{ expanded: expandedPathId === path.id }"
        >
          <div class="path-top">
            <div>
              <h3>{{ path.title }}</h3>
              <div class="path-levels">
                <span v-for="level in pathLevels(path.courseIds)" :key="level" class="path-level">
                  {{ level }}
                </span>
              </div>
              <div class="path-meta">
                <span class="badge accent">{{ path.courseIds.length }} 门课程</span>
                <span class="badge">先修顺序</span>
              </div>
            </div>
          </div>
          <p>{{ path.description }}</p>

          <ol v-if="expandedPathId === path.id" class="path-course-list">
            <li v-for="(course, index) in pathCourses(path.courseIds)" :key="course.id">
              <span class="path-order">{{ index + 1 }}</span>
              <RouterLink :to="{ name: 'course', params: { courseId: course.id } }">
                {{ course.title }}
              </RouterLink>
              <span class="badge">{{ course.level }}</span>
            </li>
          </ol>

          <div class="path-actions">
            <RouterLink
              v-if="path.courseIds[0]"
              class="btn small"
              :to="{ name: 'course', params: { courseId: path.courseIds[0] } }"
            >
              进入第一课
            </RouterLink>
            <button
              type="button"
              :aria-expanded="expandedPathId === path.id"
              @click="togglePath(path.id)"
            >
              {{ expandedPathId === path.id ? '收起课程顺序' : '展开课程顺序' }}
            </button>
          </div>
        </article>
      </div>
    </section>

    <section class="container home-section">
      <div class="section-head">
        <div>
          <div class="eyebrow">CURRICULUM</div>
          <h2 class="section-title">从 L1 到 L5 的课程地图</h2>
          <p class="section-lede">
            每级课程数量来自当前已发布内容；卡片上的分钟、步骤、先修与实验状态均为真实字段。
          </p>
        </div>
        <span class="section-count"><strong>{{ publishedCourses.length }}</strong> 门已发布</span>
      </div>

      <div class="level-list">
        <section
          v-for="level in levels"
          :key="level"
          class="level-block"
          :style="{ '--level-accent': levelMeta[level].accent }"
        >
          <div class="level-head">
            <span class="level-badge"><i class="level-dot"></i>{{ level }}</span>
            <h3>{{ levelMeta[level].short }}</h3>
            <p>{{ levelMeta[level].description }}</p>
            <span class="level-count">{{ levelCourses(level).length }} 门课程</span>
          </div>
          <div v-if="levelCourses(level).length > 0" class="level-grid">
            <CourseCard v-for="course in levelCourses(level)" :key="course.id" :course="course" />
          </div>
          <p v-else class="empty-inline">这一级暂无已发布课程。</p>
        </section>
      </div>
    </section>

    <section class="container home-section">
      <div class="section-head">
        <div>
          <div class="eyebrow">PUBLIC TOPICS</div>
          <h2 class="section-title">公共主题覆盖</h2>
          <p class="section-lede">有课程的主题直接进入第一门相关课程；暂无课程的主题如实标记为后续扩展。</p>
        </div>
        <span class="section-count">
          <strong>{{ publicTopicCoverage.filter((topic) => topic.courseIds.length > 0).length }}</strong>
          / {{ publicTopicCoverage.length }} 已覆盖
        </span>
      </div>

      <div class="topic-grid">
        <template v-for="topic in publicTopicCoverage" :key="topic.id">
          <RouterLink
            v-if="topic.courseIds.length > 0"
            class="topic-chip"
            :to="{ name: 'course', params: { courseId: topic.courseIds[0] } }"
          >
            {{ topic.label }}
            <small>{{ topic.courseIds.length }} 门</small>
          </RouterLink>
          <span v-else class="topic-chip topic-chip-pending">
            {{ topic.label }}
            <small>后续扩展</small>
          </span>
        </template>
      </div>
    </section>

    <section class="safety-band">
      <div class="container safety-inner">
        <div class="safety-item">
          <span class="safety-index">01</span>
          <div>
            <strong>静态前端</strong>
            <p>页面与拓扑图均为本地静态资源，不含网络模拟器或协议引擎。</p>
          </div>
        </div>
        <div class="safety-item">
          <span class="safety-index">02</span>
          <div>
            <strong>本地保存</strong>
            <p>学习记录与个人画布只写入当前浏览器 localStorage。</p>
          </div>
        </div>
        <div class="safety-item">
          <span class="safety-index">03</span>
          <div>
            <strong>不连接真实设备</strong>
            <p>不发起 SSH、CLI、SNMP 或任何真实网络设备连接。</p>
          </div>
        </div>
        <div class="safety-item">
          <span class="safety-index">04</span>
          <div>
            <strong>不发送报文</strong>
            <p>不构造、不注入、不发送任何探测或业务报文。</p>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>