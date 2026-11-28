<template>
  <div v-if="loading" class="canvas-state">
    <p class="state-eyebrow">本地画布</p>
    <h1>正在读取画布…</h1>
  </div>

  <div v-else-if="!canvas" class="canvas-state">
    <p class="state-eyebrow">本地画布</p>
    <h1>{{ loadErrorTitle }}</h1>
    <p class="state-text">{{ loadError }}</p>
    <div class="state-actions">
      <button class="btn" type="button" aria-label="新建空白画布" @click="createBlankCanvas">
        新建空白画布
      </button>
      <RouterLink class="btn ghost" to="/canvas" aria-label="返回我的画布">返回我的画布</RouterLink>
    </div>
  </div>

  <div v-else class="canvas-editor">
    <header class="editor-topbar">
      <div class="editor-heading">
        <nav class="breadcrumb" aria-label="面包屑导航">
          <RouterLink to="/canvas">我的画布</RouterLink>
          <span aria-hidden="true">/</span>
          <span>{{ canvas.title }}</span>
        </nav>
        <label class="title-field">
          <span class="sr-only">画布标题</span>
          <input
            class="title-input"
            :value="canvas.title"
            :maxlength="MAX_TITLE_LENGTH"
            aria-label="画布标题"
            @change="handleTitleChange"
          />
        </label>
        <div class="editor-meta">
          <span class="badge">{{ canvas.nodes.length }} 节点</span>
          <span class="badge">{{ canvas.edges.length }} 连线</span>
          <span v-if="canvas.basedOnCourseId" class="badge accent">源自课程 {{ canvas.basedOnCourseId }}</span>
          <span class="save-status" :class="saveStatusClass" aria-live="polite">{{ saveStatusText }}</span>
        </div>
      </div>
      <div class="editor-actions">
        <button class="btn ghost small" type="button" :disabled="!canUndo" aria-label="撤销上一步" @click="undo">
          撤销
        </button>
        <button class="btn ghost small" type="button" :disabled="!canRedo" aria-label="重做下一步" @click="redo">
          重做
        </button>
        <button class="btn small" type="button" aria-label="立即保存画布" @click="saveNow(true)">保存</button>
      </div>
    </header>

    <p v-if="saveError" class="canvas-alert" role="alert">{{ saveError }}</p>

    <div class="mobile-panel-bar">
      <button
        class="btn ghost small"
        type="button"
        aria-label="展开或收起图标库"
        :aria-expanded="mobilePanel === 'library'"
        @click="toggleMobilePanel('library')"
      >
        图标库
      </button>
      <button
        class="btn ghost small"
        type="button"
        aria-label="展开或收起属性面板"
        :aria-expanded="mobilePanel === 'properties'"
        @click="toggleMobilePanel('properties')"
      >
        属性
      </button>
    </div>

    <div class="canvas-layout">
      <aside class="panel library-panel" :class="{ 'panel-open': mobilePanel === 'library' }" aria-label="图标库">
        <div class="panel-head">
          <div>
            <p class="panel-eyebrow">图标库</p>
            <h2>设备与资源</h2>
          </div>
          <span class="badge">{{ filteredIcons.length }}</span>
        </div>

        <label class="search-field">
          <span class="sr-only">搜索图标</span>
          <input
            v-model="keyword"
            class="input"
            type="search"
            placeholder="搜索名称、型号或别名"
            aria-label="搜索图标"
          />
        </label>

        <div class="category-chips" role="group" aria-label="按分类筛选图标">
          <button
            class="chip"
            :class="{ 'is-on': activeCategory === 'all' }"
            type="button"
            :aria-pressed="activeCategory === 'all'"
            @click="activeCategory = 'all'"
          >
            全部
          </button>
          <button
            v-for="category in iconCategories"
            :key="category.id"
            class="chip"
            :class="{ 'is-on': activeCategory === category.id }"
            type="button"
            :aria-pressed="activeCategory === category.id"
            @click="activeCategory = category.id"
          >
            {{ category.label }}
          </button>
        </div>

        <div class="icon-grid">
          <button
            v-for="icon in filteredIcons"
            :key="icon.id"
            class="icon-card"
            type="button"
            draggable="true"
            :aria-label="`添加 ${icon.labelZh}`"
            :title="`${icon.labelZh} · ${icon.deviceType}`"
            @click="handleIconClick(icon)"
            @dragstart="handleIconDragStart($event, icon)"
          >
            <img :src="icon.asset" alt="" width="44" height="44" loading="lazy" draggable="false" />
            <span>{{ icon.labelZh }}</span>
            <small>{{ icon.deviceType }}</small>
          </button>
        </div>

        <p v-if="filteredIcons.length === 0" class="panel-empty">没有匹配的图标，换个关键词试试。</p>
      </aside>

      <section class="canvas-stage" aria-label="拓扑画布">
        <div ref="canvasHost" class="canvas-host">
          <NetworkCanvas
            ref="canvasRef"
            :topology-id="canvas.id"
            :nodes="canvas.nodes"
            :edges="canvas.edges"
            :zones="canvas.zones"
            mode="edit"
            :selected-node-id="selectedNodeId"
            :selected-edge-id="selectedEdgeId"
            @node-select="handleNodeSelect"
            @edge-select="handleEdgeSelect"
            @pane-click="handlePaneClick"
            @node-move="handleNodeMove"
            @connect="handleConnect"
            @node-drop="handleNodeDrop"
          />
        </div>
        <p class="canvas-hint">
          拖动节点调整布局，拖动空白处平移画布，滚轮缩放。Delete 删除选中，Ctrl/Cmd+S 立即保存。
        </p>
      </section>

      <aside
        class="panel properties-panel"
        :class="{ 'panel-open': mobilePanel === 'properties' }"
        aria-label="属性面板"
      >
        <div class="panel-head">
          <div>
            <p class="panel-eyebrow">属性</p>
            <h2>{{ selectedNode ? '节点' : selectedEdge ? '连线' : '未选择元素' }}</h2>
          </div>
          <span v-if="selectedNode" class="badge">节点</span>
          <span v-else-if="selectedEdge" class="badge">连线</span>
        </div>

        <div v-if="selectedNode" class="property-scroll">
          <div class="current-icon">
            <img :src="getIcon(selectedNode.iconId).asset" alt="" width="40" height="40" />
            <div>
              <strong>{{ getIcon(selectedNode.iconId).labelZh }}</strong>
              <small class="mono">{{ selectedNode.iconId }}</small>
            </div>
          </div>

          <label class="field">
            <span>名称</span>
            <input
              class="input"
              :value="selectedNode.label"
              :maxlength="MAX_LABEL_LENGTH"
              aria-label="节点名称"
              @change="handleNodeLabelChange"
            />
          </label>

          <label class="field">
            <span>角色</span>
            <input
              class="input"
              :value="selectedNode.role"
              :maxlength="MAX_ROLE_LENGTH"
              aria-label="节点角色"
              @change="handleNodeRoleChange"
            />
          </label>

          <label class="field">
            <span>IP / 地址</span>
            <input
              class="input mono"
              :value="selectedNode.ip ?? ''"
              :maxlength="MAX_IP_LENGTH"
              placeholder="例如 192.0.2.10/24"
              aria-label="节点 IP 地址"
              @change="handleNodeIpChange"
            />
          </label>

          <label class="field">
            <span>备注</span>
            <textarea
              class="textarea"
              :value="selectedNode.note ?? ''"
              :maxlength="MAX_NOTE_LENGTH"
              aria-label="节点备注"
              @change="handleNodeNoteChange"
            />
          </label>

          <p class="field-note">节点 ID：<span class="mono">{{ selectedNode.id }}</span></p>

          <button class="btn danger small" type="button" aria-label="删除当前节点" @click="requestDeleteNode">
            删除节点
          </button>

          <div v-if="pendingDelete" class="confirm-box" role="alert">
            <p>
              删除该节点将同时移除
              <strong>{{ pendingDelete.edgeCount }}</strong>
              条关联连线，确定继续吗？
            </p>
            <div class="confirm-actions">
              <button class="btn danger small" type="button" aria-label="确认删除节点" @click="confirmDeleteNode">
                确认删除
              </button>
              <button class="btn ghost small" type="button" aria-label="取消删除节点" @click="pendingDelete = null">
                取消
              </button>
            </div>
          </div>
        </div>

        <div v-else-if="selectedEdge" class="property-scroll">
          <p class="edge-endpoints mono">
            {{ nodeLabelById(selectedEdge.source) }} → {{ nodeLabelById(selectedEdge.target) }}
          </p>

          <label class="field">
            <span>标签</span>
            <input
              class="input"
              :value="selectedEdge.label ?? ''"
              :maxlength="MAX_LABEL_LENGTH"
              aria-label="连线标签"
              @change="handleEdgeLabelChange"
            />
          </label>

          <label class="field">
            <span>类型</span>
            <select
              class="select"
              :value="selectedEdge.kind"
              aria-label="连线类型"
              @change="handleEdgeKindChange"
            >
              <option value="physical">物理链路</option>
              <option value="logical">逻辑链路</option>
              <option value="annotation">标注关联</option>
              <option value="mirror">镜像链路</option>
            </select>
          </label>

          <label class="field">
            <span>方向</span>
            <select
              class="select"
              :value="selectedEdge.direction ?? 'none'"
              aria-label="连线方向"
              @change="handleEdgeDirectionChange"
            >
              <option value="none">无向</option>
              <option value="forward">正向</option>
              <option value="backward">反向</option>
            </select>
          </label>

          <label class="field">
            <span>备注</span>
            <textarea
              class="textarea"
              :value="selectedEdge.note ?? ''"
              :maxlength="MAX_NOTE_LENGTH"
              aria-label="连线备注"
              @change="handleEdgeNoteChange"
            />
          </label>

          <p class="field-note">连线 ID：<span class="mono">{{ selectedEdge.id }}</span></p>

          <button class="btn danger small" type="button" aria-label="删除当前连线" @click="removeSelectedEdge">
            删除连线
          </button>
        </div>

        <div v-else class="property-scroll">
          <p class="panel-empty">在画布中选择节点或连线，编辑名称、角色、IP、方向与备注。</p>
        </div>

        <section class="canvas-info" aria-label="画布说明">
          <h3>画布说明</h3>
          <label class="field">
            <span>说明</span>
            <textarea
              class="textarea"
              :value="canvas.canvasNote"
              :maxlength="MAX_CANVAS_NOTE_LENGTH"
              placeholder="记录本图用途、假设、待办或学习笔记"
              aria-label="画布说明"
              @change="handleCanvasNoteChange"
            />
          </label>
          <p class="field-note">
            仅保存在本机浏览器，不会上传。刷新页面后自动恢复。
            <span v-if="canvas.basedOnTopologyId" class="mono">基于拓扑 {{ canvas.basedOnTopologyId }}</span>
          </p>
        </section>
      </aside>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import NetworkCanvas from './NetworkCanvas.vue'
import { getIcon, iconById, iconCategories, iconRegistry } from '@/domain/icons'
import {
  CanvasValidationError,
  MAX_CANVAS_NOTE_LENGTH,
  MAX_IP_LENGTH,
  MAX_LABEL_LENGTH,
  MAX_NOTE_LENGTH,
  MAX_ROLE_LENGTH,
  MAX_TITLE_LENGTH,
  addEdge,
  addNode,
  computeGridPlacement,
  createEmptyCanvas,
  deepClone,
  deleteEdge,
  deleteNode,
  updateEdge,
  updateNode,
} from '@/domain/canvas'
import type {
  EdgeDirection,
  EdgeKind,
  IconCategory,
  IconDefinition,
  PersonalCanvas,
  TopologyEdge,
  TopologyNode,
} from '@/domain/types'
import { loadCanvas, saveCanvas } from '@/storage/localStore'
import { NetOpsStorageError, STORAGE_ERROR_CODES } from '@/storage/errors'
import type { StorageErrorCode } from '@/storage/errors'
import { notify } from '@/app/toast'

const props = defineProps<{ id: string }>()
const router = useRouter()

const canvas = ref<PersonalCanvas | null>(null)
const loading = ref(true)
const loadError = ref('')
const loadErrorCode = ref<StorageErrorCode | ''>('')
const canvasHost = ref<HTMLElement | null>(null)
const canvasRef = ref<InstanceType<typeof NetworkCanvas> | null>(null)

const selectedNodeId = ref<string | undefined>(undefined)
const selectedEdgeId = ref<string | undefined>(undefined)
const pendingDelete = ref<{ id: string; edgeCount: number } | null>(null)

const dirty = ref(false)
const saveError = ref('')
const lastSavedAt = ref('')
const saveTimer = ref<number | null>(null)

const undoStack = ref<PersonalCanvas[]>([])
const redoStack = ref<PersonalCanvas[]>([])
const canUndo = computed(() => undoStack.value.length > 0)
const canRedo = computed(() => redoStack.value.length > 0)

const keyword = ref('')
const activeCategory = ref<'all' | IconCategory>('all')
const mobilePanel = ref<'library' | 'properties' | null>(null)

const selectedNode = computed<TopologyNode | null>(() => {
  if (!canvas.value || !selectedNodeId.value) return null
  return canvas.value.nodes.find((node) => node.id === selectedNodeId.value) ?? null
})

const selectedEdge = computed<TopologyEdge | null>(() => {
  if (!canvas.value || !selectedEdgeId.value) return null
  return canvas.value.edges.find((edge) => edge.id === selectedEdgeId.value) ?? null
})

const filteredIcons = computed<IconDefinition[]>(() => {
  const query = keyword.value.trim().toLowerCase()
  return iconRegistry.filter((icon) => {
    if (activeCategory.value !== 'all' && icon.category !== activeCategory.value) return false
    if (query === '') return true
    return [icon.labelZh, icon.labelEn, icon.deviceType, ...icon.aliases].some((value) =>
      value.toLowerCase().includes(query),
    )
  })
})

const loadErrorTitle = computed(() =>
  loadErrorCode.value === STORAGE_ERROR_CODES.CANVAS_NOT_FOUND ? '画布不存在或已删除' : '画布无法打开',
)

const saveStatusText = computed(() => {
  if (saveError.value) return '保存失败'
  if (dirty.value) return '未保存'
  if (lastSavedAt.value) return `已保存 ${lastSavedAt.value}`
  return '尚未保存'
})

const saveStatusClass = computed(() => ({
  'is-saved': !dirty.value && !saveError.value,
  'is-dirty': dirty.value && !saveError.value,
  'is-error': Boolean(saveError.value),
}))

function pad(value: number): string {
  return value.toString().padStart(2, '0')
}

function formatClock(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`
}

function storageMessage(code: StorageErrorCode): string {
  switch (code) {
    case STORAGE_ERROR_CODES.CANVAS_NOT_FOUND:
      return '未找到该画布，可能已被删除'
    case STORAGE_ERROR_CODES.INVALID_CANVAS:
      return '画布数据无效或已损坏'
    case STORAGE_ERROR_CODES.STORAGE_FULL:
      return '本地存储空间不足'
    case STORAGE_ERROR_CODES.STORAGE_UNAVAILABLE:
      return '本地存储不可用或被浏览器禁用'
    case STORAGE_ERROR_CODES.IMPORT_INVALID:
      return '导入内容不是有效的画布 JSON'
    default:
      return '本地存储操作失败'
  }
}

function describeError(error: unknown): string {
  if (error instanceof NetOpsStorageError) {
    return storageMessage(error.code)
  }
  if (error instanceof CanvasValidationError) {
    return error.issues[0] ?? error.message
  }
  if (error instanceof Error && error.message) {
    return error.message
  }
  return '操作失败，请重试'
}

function clearSelection(): void {
  selectedNodeId.value = undefined
  selectedEdgeId.value = undefined
  pendingDelete.value = null
}

function pruneSelection(): void {
  if (!canvas.value) {
    clearSelection()
    return
  }
  if (selectedNodeId.value && !canvas.value.nodes.some((node) => node.id === selectedNodeId.value)) {
    selectedNodeId.value = undefined
  }
  if (selectedEdgeId.value && !canvas.value.edges.some((edge) => edge.id === selectedEdgeId.value)) {
    selectedEdgeId.value = undefined
  }
  pendingDelete.value = null
}

function clearSaveTimer(): void {
  if (saveTimer.value !== null) {
    window.clearTimeout(saveTimer.value)
    saveTimer.value = null
  }
}

function loadCurrentCanvas(): void {
  clearSaveTimer()
  loading.value = true
  loadError.value = ''
  loadErrorCode.value = ''
  canvas.value = null
  clearSelection()
  undoStack.value = []
  redoStack.value = []
  dirty.value = false
  saveError.value = ''
  lastSavedAt.value = ''
  try {
    const loaded = loadCanvas(props.id)
    canvas.value = loaded
    lastSavedAt.value = formatClock(loaded.updatedAt)
  } catch (error) {
    loadError.value = describeError(error)
    loadErrorCode.value = error instanceof NetOpsStorageError ? error.code : ''
  } finally {
    loading.value = false
  }
}

watch(() => props.id, loadCurrentCanvas, { immediate: true })

function pushHistory(snapshot: PersonalCanvas): void {
  undoStack.value.push(deepClone(snapshot))
  if (undoStack.value.length > 30) undoStack.value.shift()
  redoStack.value = []
}

function scheduleAutosave(): void {
  clearSaveTimer()
  saveTimer.value = window.setTimeout(() => {
    saveTimer.value = null
    saveNow(false)
  }, 800)
}

function commit(next: PersonalCanvas): void {
  if (!canvas.value) return
  pushHistory(canvas.value)
  canvas.value = next
  dirty.value = true
  saveError.value = ''
  scheduleAutosave()
}

function saveNow(force = false): void {
  if (!canvas.value) return
  if (!force && !dirty.value) return
  clearSaveTimer()
  try {
    const saved = saveCanvas(canvas.value)
    canvas.value.updatedAt = saved.updatedAt
    lastSavedAt.value = formatClock(saved.updatedAt)
    dirty.value = false
    saveError.value = ''
  } catch (error) {
    saveError.value = describeError(error)
    notify(saveError.value, 'error')
  }
}

function undo(): void {
  const previous = undoStack.value.pop()
  if (!previous || !canvas.value) return
  redoStack.value.push(deepClone(canvas.value))
  canvas.value = previous
  pruneSelection()
  dirty.value = true
  saveError.value = ''
  scheduleAutosave()
}

function redo(): void {
  const next = redoStack.value.pop()
  if (!next || !canvas.value) return
  undoStack.value.push(deepClone(canvas.value))
  if (undoStack.value.length > 30) undoStack.value.shift()
  canvas.value = next
  pruneSelection()
  dirty.value = true
  saveError.value = ''
  scheduleAutosave()
}

function handleTitleChange(event: Event): void {
  const input = event.target as HTMLInputElement
  const value = input.value.trim()
  if (!canvas.value) return
  if (value === '') {
    input.value = canvas.value.title
    notify('画布标题不能为空', 'error')
    return
  }
  if (value.length > MAX_TITLE_LENGTH) {
    input.value = canvas.value.title
    notify(`画布标题不能超过 ${MAX_TITLE_LENGTH} 个字符`, 'error')
    return
  }
  if (value === canvas.value.title) return
  commit({ ...canvas.value, title: value })
}

function handleCanvasNoteChange(event: Event): void {
  if (!canvas.value) return
  const value = (event.target as HTMLTextAreaElement).value
  if (value.length > MAX_CANVAS_NOTE_LENGTH) {
    notify(`画布说明不能超过 ${MAX_CANVAS_NOTE_LENGTH} 个字符`, 'error')
    return
  }
  commit({ ...canvas.value, canvasNote: value })
}

function centerPlacement(): { x: number; y: number } {
  const nodes = canvas.value?.nodes ?? []
  const instance = canvasRef.value
  let rect = canvasHost.value?.getBoundingClientRect() ?? null
  if (rect && (rect.width < 1 || rect.height < 1)) {
    rect = instance?.getCanvasRect() ?? null
  }
  if (!rect || rect.width < 1 || rect.height < 1 || !instance) {
    return computeGridPlacement({ x: 400, y: 300 }, nodes.length, nodes)
  }
  const center = instance.screenToFlow(rect.left + rect.width / 2, rect.top + rect.height / 2)
  return computeGridPlacement(center, nodes.length, nodes)
}

function addIconNode(iconId: string, position?: { x: number; y: number }): void {
  if (!canvas.value) return
  const icon = iconById.get(iconId)
  if (!icon) {
    notify('未知图标，无法添加节点', 'error')
    return
  }
  try {
    const next = addNode(canvas.value, {
      iconId: icon.id,
      label: icon.labelZh,
      role: icon.deviceType,
      position: position ?? centerPlacement(),
    })
    const node = next.nodes[next.nodes.length - 1]
    commit(next)
    selectedNodeId.value = node.id
    selectedEdgeId.value = undefined
    pendingDelete.value = null
    if (mobilePanel.value === 'library') mobilePanel.value = null
  } catch (error) {
    notify(describeError(error), 'error')
  }
}

function handleIconClick(icon: IconDefinition): void {
  addIconNode(icon.id)
}

function handleIconDragStart(event: DragEvent, icon: IconDefinition): void {
  if (!event.dataTransfer) return
  event.dataTransfer.setData('application/netops-icon', icon.id)
  event.dataTransfer.effectAllowed = 'copy'
}

function handleNodeDrop(payload: { iconId: string; x: number; y: number }): void {
  addIconNode(payload.iconId, { x: payload.x, y: payload.y })
}

function handleNodeSelect(id: string): void {
  selectedNodeId.value = id
  selectedEdgeId.value = undefined
  pendingDelete.value = null
}

function handleEdgeSelect(id: string): void {
  selectedEdgeId.value = id
  selectedNodeId.value = undefined
  pendingDelete.value = null
}

function handlePaneClick(): void {
  clearSelection()
}

function handleNodeMove(payload: { id: string; position: { x: number; y: number } }): void {
  if (!canvas.value) return
  const node = canvas.value.nodes.find((item) => item.id === payload.id)
  if (!node) return
  if (node.position.x === payload.position.x && node.position.y === payload.position.y) return
  try {
    commit(updateNode(canvas.value, payload.id, { position: payload.position }))
  } catch (error) {
    notify(describeError(error), 'error')
  }
}

function handleConnect(payload: { source: string; target: string }): void {
  if (!canvas.value) return
  if (payload.source === payload.target) {
    notify('连线不能连接到同一个节点', 'error')
    return
  }
  try {
    const next = addEdge(canvas.value, { source: payload.source, target: payload.target })
    const edge = next.edges[next.edges.length - 1]
    commit(next)
    selectedEdgeId.value = edge.id
    selectedNodeId.value = undefined
    pendingDelete.value = null
  } catch (error) {
    notify(describeError(error), 'error')
  }
}

function commitNodePatch(patch: Partial<TopologyNode>): void {
  if (!canvas.value || !selectedNodeId.value) return
  try {
    commit(updateNode(canvas.value, selectedNodeId.value, patch))
  } catch (error) {
    notify(describeError(error), 'error')
  }
}

function handleNodeLabelChange(event: Event): void {
  const input = event.target as HTMLInputElement
  const value = input.value.trim()
  if (!selectedNode.value) return
  if (value === '') {
    input.value = selectedNode.value.label
    notify('节点名称不能为空', 'error')
    return
  }
  if (value.length > MAX_LABEL_LENGTH) {
    input.value = selectedNode.value.label
    notify(`节点名称不能超过 ${MAX_LABEL_LENGTH} 个字符`, 'error')
    return
  }
  commitNodePatch({ label: value })
}

function handleNodeRoleChange(event: Event): void {
  const value = (event.target as HTMLInputElement).value
  if (value.length > MAX_ROLE_LENGTH) {
    notify(`节点角色不能超过 ${MAX_ROLE_LENGTH} 个字符`, 'error')
    return
  }
  commitNodePatch({ role: value })
}

function handleNodeIpChange(event: Event): void {
  const value = (event.target as HTMLInputElement).value.trim()
  if (value.length > MAX_IP_LENGTH) {
    notify(`节点 IP 不能超过 ${MAX_IP_LENGTH} 个字符`, 'error')
    return
  }
  commitNodePatch({ ip: value })
}

function handleNodeNoteChange(event: Event): void {
  const value = (event.target as HTMLTextAreaElement).value
  if (value.length > MAX_NOTE_LENGTH) {
    notify(`节点备注不能超过 ${MAX_NOTE_LENGTH} 个字符`, 'error')
    return
  }
  commitNodePatch({ note: value })
}

function commitEdgePatch(patch: Partial<TopologyEdge>): void {
  if (!canvas.value || !selectedEdgeId.value) return
  try {
    commit(updateEdge(canvas.value, selectedEdgeId.value, patch))
  } catch (error) {
    notify(describeError(error), 'error')
  }
}

function handleEdgeLabelChange(event: Event): void {
  const value = (event.target as HTMLInputElement).value
  if (value.length > MAX_LABEL_LENGTH) {
    notify(`连线标签不能超过 ${MAX_LABEL_LENGTH} 个字符`, 'error')
    return
  }
  commitEdgePatch({ label: value })
}

function handleEdgeKindChange(event: Event): void {
  const value = (event.target as HTMLSelectElement).value as EdgeKind
  commitEdgePatch({ kind: value })
}

function handleEdgeDirectionChange(event: Event): void {
  const value = (event.target as HTMLSelectElement).value as EdgeDirection
  commitEdgePatch({ direction: value })
}

function handleEdgeNoteChange(event: Event): void {
  const value = (event.target as HTMLTextAreaElement).value
  if (value.length > MAX_NOTE_LENGTH) {
    notify(`连线备注不能超过 ${MAX_NOTE_LENGTH} 个字符`, 'error')
    return
  }
  commitEdgePatch({ note: value })
}

function requestDeleteNode(): void {
  if (!canvas.value || !selectedNode.value) return
  const edgeCount = canvas.value.edges.filter(
    (edge) => edge.source === selectedNode.value?.id || edge.target === selectedNode.value?.id,
  ).length
  pendingDelete.value = { id: selectedNode.value.id, edgeCount }
}

function confirmDeleteNode(): void {
  if (!canvas.value || !pendingDelete.value) return
  const id = pendingDelete.value.id
  try {
    const next = deleteNode(canvas.value, id)
    commit(next)
    if (selectedNodeId.value === id) selectedNodeId.value = undefined
    selectedEdgeId.value = undefined
    notify('节点已删除')
  } catch (error) {
    notify(describeError(error), 'error')
  } finally {
    pendingDelete.value = null
  }
}

function removeSelectedEdge(): void {
  if (!canvas.value || !selectedEdgeId.value) return
  try {
    commit(deleteEdge(canvas.value, selectedEdgeId.value))
    selectedEdgeId.value = undefined
    notify('连线已删除')
  } catch (error) {
    notify(describeError(error), 'error')
  }
}

function nodeLabelById(id: string): string {
  return canvas.value?.nodes.find((node) => node.id === id)?.label ?? id
}

function toggleMobilePanel(panel: 'library' | 'properties'): void {
  mobilePanel.value = mobilePanel.value === panel ? null : panel
}

function isEditableTarget(target: EventTarget | null): boolean {
  const element = target as HTMLElement | null
  if (!element) return false
  const tag = element.tagName
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || element.isContentEditable
}

function handleKeydown(event: KeyboardEvent): void {
  const modifier = event.ctrlKey || event.metaKey
  const key = event.key.toLowerCase()
  if (modifier && key === 's') {
    event.preventDefault()
    saveNow(true)
    return
  }
  if (key === 'escape') {
    clearSelection()
    return
  }
  if (isEditableTarget(event.target)) return
  if (modifier && key === 'z') {
    event.preventDefault()
    if (event.shiftKey) redo()
    else undo()
    return
  }
  if (modifier && key === 'y') {
    event.preventDefault()
    redo()
    return
  }
  if (event.key !== 'Delete') return
  if (selectedNodeId.value) {
    event.preventDefault()
    requestDeleteNode()
    return
  }
  if (selectedEdgeId.value) {
    event.preventDefault()
    removeSelectedEdge()
  }
}

function createBlankCanvas(): void {
  try {
    const saved = saveCanvas(createEmptyCanvas('未命名拓扑'))
    void router.replace({ name: 'canvas', params: { id: saved.id } })
  } catch (error) {
    notify(describeError(error), 'error')
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeydown)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleKeydown)
  clearSaveTimer()
  if (canvas.value && dirty.value) {
    try {
      saveCanvas(canvas.value)
    } catch {
      return
    }
  }
})

nextTick(() => {
  pruneSelection()
})
</script>

<style scoped>
.canvas-editor {
  width: calc(100% - 32px);
  max-width: 1720px;
  margin: 0 auto;
  padding: 16px 0 28px;
}

.canvas-state {
  max-width: 720px;
  margin: 0 auto;
  padding: 96px 24px;
}

.state-eyebrow {
  margin-bottom: 10px;
  color: var(--accent);
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}

.canvas-state h1 {
  margin-bottom: 12px;
  font-size: clamp(24px, 4vw, 36px);
}

.state-text {
  max-width: 560px;
  color: var(--muted);
}

.state-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 22px;
}

.editor-topbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px 20px;
  margin-bottom: 12px;
  padding: 12px 16px;
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  background: var(--panel);
  box-shadow: var(--shadow-soft);
}

.editor-heading {
  display: flex;
  flex: 1 1 520px;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px 14px;
  min-width: 0;
}

.breadcrumb {
  display: flex;
  align-items: center;
  gap: 6px;
  width: 100%;
  color: var(--muted);
  font-family: var(--font-mono);
  font-size: 11px;
}

.breadcrumb a {
  color: var(--muted-strong);
}

.breadcrumb a:hover {
  color: var(--accent);
}

.title-field {
  flex: 1 1 260px;
  min-width: 0;
}

.title-input {
  width: 100%;
  padding: 5px 8px;
  border: 1px solid transparent;
  border-radius: var(--radius-xs);
  background: transparent;
  color: var(--text-strong);
  font-size: clamp(18px, 2.4vw, 24px);
  font-weight: 780;
  letter-spacing: -0.02em;
}

.title-input:hover,
.title-input:focus {
  border-color: var(--border-strong);
  background: var(--panel-soft);
  outline: 0;
}

.editor-meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
}

.save-status {
  display: inline-flex;
  align-items: center;
  padding: 4px 9px;
  border: 1px solid var(--border);
  border-radius: var(--radius-pill);
  background: var(--panel-soft);
  color: var(--muted);
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 700;
}

.save-status.is-saved {
  border-color: rgba(53, 214, 162, 0.3);
  background: var(--ok-wash);
  color: var(--ok);
}

.save-status.is-dirty {
  border-color: rgba(245, 196, 81, 0.32);
  background: var(--warn-wash);
  color: var(--warn);
}

.save-status.is-error {
  border-color: rgba(255, 125, 147, 0.35);
  background: var(--danger-wash);
  color: var(--danger);
}

.editor-actions {
  display: flex;
  align-items: center;
  gap: 7px;
  margin-left: auto;
}

.canvas-alert {
  margin: 0 0 12px;
  padding: 9px 13px;
  border: 1px solid rgba(255, 125, 147, 0.35);
  border-radius: var(--radius-sm);
  background: var(--danger-wash);
  color: var(--danger);
  font-size: 13px;
}

.mobile-panel-bar {
  display: none;
  gap: 8px;
  margin-bottom: 10px;
}

.canvas-layout {
  display: grid;
  grid-template-columns: 268px minmax(0, 1fr) 324px;
  grid-template-rows: minmax(0, 1fr);
  gap: 12px;
  height: calc(100vh - var(--header-height) - 172px);
  min-height: 540px;
}

.panel {
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  background: var(--panel);
  box-shadow: var(--shadow-soft);
}

.panel-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 13px 14px 10px;
  border-bottom: 1px solid var(--border);
}

.panel-eyebrow {
  margin: 0 0 2px;
  color: var(--accent);
  font-family: var(--font-mono);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.panel-head h2 {
  margin: 0;
  font-size: 16px;
}

.library-panel {
  padding-bottom: 10px;
}

.search-field {
  padding: 10px 12px 6px;
}

.category-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  padding: 4px 12px 8px;
}

.chip {
  padding: 3px 9px;
  border: 1px solid var(--border);
  border-radius: var(--radius-pill);
  background: var(--panel-soft);
  color: var(--muted);
  font-size: 11px;
  font-weight: 650;
  cursor: pointer;
}

.chip:hover {
  border-color: var(--accent-line);
  color: var(--accent);
}

.chip.is-on {
  border-color: var(--accent-line);
  background: var(--accent-wash);
  color: var(--accent);
}

.icon-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 7px;
  min-height: 0;
  padding: 0 12px 4px;
  overflow-y: auto;
}

.icon-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  min-width: 0;
  padding: 10px 6px 8px;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  background: var(--panel-soft);
  color: var(--muted-strong);
  font-size: 11px;
  line-height: 1.35;
  text-align: center;
  cursor: grab;
}

.icon-card img {
  width: 44px;
  height: 44px;
  object-fit: contain;
  pointer-events: none;
}

.icon-card span {
  display: -webkit-box;
  max-width: 100%;
  overflow: hidden;
  color: var(--text);
  font-weight: 650;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  line-clamp: 2;
}

.icon-card small {
  max-width: 100%;
  overflow: hidden;
  color: var(--muted);
  font-family: var(--font-mono);
  font-size: 9px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.icon-card:hover {
  border-color: var(--accent-line);
  background: var(--accent-wash);
}

.canvas-stage {
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
}

.canvas-host {
  flex: 1;
  min-height: 0;
}

.canvas-hint {
  margin: 7px 4px 0;
  color: var(--muted);
  font-size: 11px;
  line-height: 1.5;
}

.properties-panel {
  gap: 0;
}

.property-scroll {
  display: grid;
  gap: 10px;
  min-height: 0;
  padding: 12px 14px;
  overflow-y: auto;
}

.current-icon {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  background: var(--panel-soft);
}

.current-icon img {
  width: 40px;
  height: 40px;
  object-fit: contain;
}

.current-icon strong {
  display: block;
  color: var(--text);
  font-size: 13px;
}

.current-icon small {
  color: var(--muted);
  font-size: 10px;
}

.field-note {
  margin: 0;
  color: var(--muted);
  font-size: 11px;
  line-height: 1.6;
  word-break: break-all;
}

.edge-endpoints {
  margin: 0;
  padding: 7px 9px;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  background: var(--panel-soft);
  color: var(--muted-strong);
  font-size: 11px;
  line-height: 1.5;
  word-break: break-all;
}

.confirm-box {
  padding: 10px;
  border: 1px solid rgba(255, 125, 147, 0.35);
  border-radius: var(--radius-sm);
  background: var(--danger-wash);
}

.confirm-box p {
  margin: 0 0 8px;
  color: var(--text);
  font-size: 12px;
  line-height: 1.6;
}

.confirm-box strong {
  color: var(--danger);
}

.confirm-actions {
  display: flex;
  gap: 7px;
}

.canvas-info {
  display: grid;
  gap: 8px;
  margin-top: auto;
  padding: 12px 14px;
  border-top: 1px solid var(--border);
  background: var(--panel-soft);
}

.canvas-info h3 {
  margin: 0;
  font-size: 13px;
}

.panel-empty {
  margin: 0;
  padding: 10px 2px;
  color: var(--muted);
  font-size: 12px;
  line-height: 1.7;
}

@media (max-width: 1180px) {
  .canvas-layout {
    grid-template-columns: 232px minmax(0, 1fr) 286px;
  }
}

@media (max-width: 820px) {
  .canvas-editor {
    width: calc(100% - 24px);
    padding-top: 10px;
  }

  .mobile-panel-bar {
    display: flex;
  }

  .canvas-layout {
    grid-template-columns: minmax(0, 1fr);
    height: auto;
    min-height: 0;
  }

  .canvas-stage {
    height: 62vh;
    min-height: 460px;
    order: 2;
  }

  .library-panel,
  .properties-panel {
    display: none;
  }

  .library-panel.panel-open {
    display: flex;
    order: 1;
    max-height: 44vh;
  }

  .properties-panel.panel-open {
    display: flex;
    order: 3;
    max-height: 52vh;
  }

  .editor-actions {
    width: 100%;
    margin-left: 0;
  }

  .icon-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 520px) {
  .icon-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .canvas-stage {
    min-height: 420px;
  }

  .canvas-hint {
    font-size: 10px;
  }
}
</style>