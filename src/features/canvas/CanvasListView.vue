<template>
  <div class="canvas-library">
    <header class="library-head">
      <div class="head-copy">
        <p class="eyebrow">自由画布</p>
        <h1>我的画布</h1>
        <p class="lede">
          把课程里的拓扑改造成自己的练习图，或从空白开始搭建。所有画布保存在本机浏览器，刷新后仍在。
        </p>
      </div>
      <div class="head-actions">
        <button class="btn" type="button" aria-label="新建空白画布" @click="createCanvas">
          新建空白画布
        </button>
        <button class="btn secondary" type="button" aria-label="导入画布 JSON" @click="triggerImport">
          导入 JSON
        </button>
        <input
          ref="fileInput"
          class="sr-only"
          type="file"
          accept=".json,application/json"
          aria-label="选择画布 JSON 文件"
          @change="handleImport"
        />
      </div>
    </header>

    <p class="storage-note">
      本机存储：画布写入浏览器 localStorage，不会上传。清除站点数据会同时删除画布，请用导出 JSON 备份。
      <span v-if="storageInfo">当前已用 {{ formatBytes(storageInfo.usage) }} / 可用 {{ formatBytes(storageInfo.quota) }}。</span>
    </p>

    <p v-if="errorText" class="library-alert" role="alert">{{ errorText }}</p>

    <div v-if="loading" class="empty-state">
      <p>正在读取本地画布…</p>
    </div>

    <div v-else-if="entries.length === 0" class="empty-state">
      <h2>还没有画布</h2>
      <p>新建一张空白画布，或导入之前导出的 JSON 文件。</p>
      <div class="empty-actions">
        <button class="btn" type="button" aria-label="新建第一张空白画布" @click="createCanvas">
          新建空白画布
        </button>
        <button class="btn secondary" type="button" aria-label="导入画布 JSON" @click="triggerImport">
          导入 JSON
        </button>
      </div>
    </div>

    <div v-else class="canvas-grid">
      <article v-for="entry in entries" :key="entry.id" class="canvas-card">
        <div class="card-top">
          <span v-if="entry.basedOnCourseId" class="badge accent">源自课程 {{ entry.basedOnCourseId }}</span>
          <span v-else class="badge">自由画布</span>
          <span class="updated mono">{{ formatUpdated(entry.updatedAt) }}</span>
        </div>

        <form v-if="renamingId === entry.id" class="rename-row" @submit.prevent="commitRename">
          <label class="sr-only" :for="`rename-${entry.id}`">画布标题</label>
          <input
            :id="`rename-${entry.id}`"
            v-model="renameDraft"
            class="input rename-input"
            :maxlength="MAX_TITLE_LENGTH"
            aria-label="新的画布标题"
            @keydown.esc.prevent="cancelRename"
          />
          <div class="rename-actions">
            <button class="btn small" type="submit" aria-label="保存画布标题">保存</button>
            <button class="btn ghost small" type="button" aria-label="取消重命名" @click="cancelRename">取消</button>
          </div>
        </form>

        <template v-else>
          <h2 class="card-title">{{ entry.title }}</h2>
          <p class="card-meta">
            <span>{{ entry.nodeCount }} 个节点</span>
            <span aria-hidden="true">·</span>
            <span>{{ entry.edgeCount }} 条连线</span>
          </p>
        </template>

        <div class="card-actions">
          <RouterLink class="btn small" :to="{ name: 'canvas', params: { id: entry.id } }" :aria-label="`打开画布 ${entry.title}`">
            打开
          </RouterLink>
          <button class="btn secondary small" type="button" :aria-label="`复制画布 ${entry.title}`" @click="copyCanvas(entry)">
            复制
          </button>
          <button class="btn ghost small" type="button" :aria-label="`重命名画布 ${entry.title}`" @click="startRename(entry)">
            重命名
          </button>
          <button class="btn ghost small" type="button" :aria-label="`导出画布 ${entry.title} 为 JSON`" @click="exportJson(entry)">
            导出 JSON
          </button>
          <button class="btn danger small" type="button" :aria-label="`删除画布 ${entry.title}`" @click="requestDelete(entry)">
            删除
          </button>
        </div>

        <div v-if="deleteId === entry.id" class="delete-confirm" role="alert">
          <p>确认删除「{{ entry.title }}」？删除后本机数据无法恢复，建议先导出 JSON。</p>
          <div class="delete-actions">
            <button class="btn danger small" type="button" :aria-label="`确认删除画布 ${entry.title}`" @click="confirmDelete(entry)">
              确认删除
            </button>
            <button class="btn ghost small" type="button" aria-label="取消删除" @click="deleteId = null">取消</button>
          </div>
        </div>
      </article>
    </div>
  </div>
</template>

<script setup lang="ts">
import { nextTick, onMounted, ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { MAX_TITLE_LENGTH, createEmptyCanvas } from '@/domain/canvas'
import type { CanvasIndexEntry } from '@/domain/types'
import {
  deleteCanvas,
  duplicateCanvas,
  exportCanvasJson,
  importCanvasJson,
  listCanvases,
  renameCanvas,
  saveCanvas,
} from '@/storage/localStore'
import { NetOpsStorageError, STORAGE_ERROR_CODES } from '@/storage/errors'
import type { StorageErrorCode } from '@/storage/errors'
import { notify } from '@/app/toast'

interface StorageEstimateInfo {
  usage: number
  quota: number
}

const router = useRouter()
const entries = ref<CanvasIndexEntry[]>([])
const loading = ref(true)
const errorText = ref('')
const storageInfo = ref<StorageEstimateInfo | null>(null)
const fileInput = ref<HTMLInputElement | null>(null)
const renamingId = ref<string | null>(null)
const renameDraft = ref('')
const deleteId = ref<string | null>(null)

function storageMessage(code: StorageErrorCode): string {
  switch (code) {
    case STORAGE_ERROR_CODES.CANVAS_NOT_FOUND:
      return '未找到该画布，可能已被删除'
    case STORAGE_ERROR_CODES.INVALID_CANVAS:
      return '画布数据无效或已损坏'
    case STORAGE_ERROR_CODES.STORAGE_FULL:
      return '本地存储空间不足，请先导出并删除旧画布'
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
  if (error instanceof Error && error.message) {
    return error.message
  }
  return '操作失败，请重试'
}

function refresh(): void {
  try {
    entries.value = listCanvases()
    errorText.value = ''
  } catch (error) {
    entries.value = []
    errorText.value = describeError(error)
  } finally {
    loading.value = false
  }
}

async function loadStorageEstimate(): Promise<void> {
  if (typeof navigator === 'undefined' || !navigator.storage || typeof navigator.storage.estimate !== 'function') {
    return
  }
  try {
    const estimate = await navigator.storage.estimate()
    if (typeof estimate.usage === 'number' && typeof estimate.quota === 'number' && estimate.quota > 0) {
      storageInfo.value = { usage: estimate.usage, quota: estimate.quota }
    }
  } catch {
    storageInfo.value = null
  }
}

function formatBytes(value: number): string {
  if (!Number.isFinite(value) || value < 0) return '未知'
  if (value < 1024) return `${Math.round(value)} B`
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`
  if (value < 1024 * 1024 * 1024) return `${(value / (1024 * 1024)).toFixed(1)} MB`
  return `${(value / (1024 * 1024 * 1024)).toFixed(2)} GB`
}

function formatUpdated(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return '时间未知'
  return date.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function safeFileName(title: string): string {
  const cleaned = title
    .replace(/[\\/:*?"<>|]/g, '-')
    .replace(/\s+/g, ' ')
    .trim()
  return (cleaned === '' ? 'netops-canvas' : cleaned).slice(0, 80)
}

function createCanvas(): void {
  try {
    const saved = saveCanvas(createEmptyCanvas('未命名拓扑'))
    void router.push({ name: 'canvas', params: { id: saved.id } })
  } catch (error) {
    notify(describeError(error), 'error')
  }
}

function copyCanvas(entry: CanvasIndexEntry): void {
  try {
    const copy = duplicateCanvas(entry.id)
    refresh()
    notify(`已复制为「${copy.title}」`)
  } catch (error) {
    notify(describeError(error), 'error')
  }
}

function startRename(entry: CanvasIndexEntry): void {
  renamingId.value = entry.id
  renameDraft.value = entry.title
  deleteId.value = null
  nextTick(() => {
    const input = document.querySelector<HTMLInputElement>('.rename-input')
    input?.focus()
    input?.select()
  })
}

function cancelRename(): void {
  renamingId.value = null
  renameDraft.value = ''
}

function commitRename(): void {
  const id = renamingId.value
  if (!id) return
  const title = renameDraft.value.trim()
  if (title === '') {
    notify('画布标题不能为空', 'error')
    return
  }
  try {
    renameCanvas(id, title)
    renamingId.value = null
    renameDraft.value = ''
    refresh()
    notify('画布已重命名')
  } catch (error) {
    notify(describeError(error), 'error')
  }
}

function requestDelete(entry: CanvasIndexEntry): void {
  deleteId.value = entry.id
  renamingId.value = null
}

function confirmDelete(entry: CanvasIndexEntry): void {
  try {
    deleteCanvas(entry.id)
    deleteId.value = null
    refresh()
    notify('画布已删除')
  } catch (error) {
    notify(describeError(error), 'error')
  }
}

function exportJson(entry: CanvasIndexEntry): void {
  try {
    const json = exportCanvasJson(entry.id)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${safeFileName(entry.title)}.json`
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.setTimeout(() => URL.revokeObjectURL(url), 1000)
    notify('JSON 已开始下载')
  } catch (error) {
    notify(describeError(error), 'error')
  }
}

function triggerImport(): void {
  fileInput.value?.click()
}

async function handleImport(event: Event): Promise<void> {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return
  try {
    const text = await file.text()
    const imported = importCanvasJson(text)
    refresh()
    notify(`已导入「${imported.title}」`)
    void router.push({ name: 'canvas', params: { id: imported.id } })
  } catch (error) {
    notify(describeError(error), 'error')
  }
}

onMounted(() => {
  refresh()
  void loadStorageEstimate()
})
</script>

<style scoped>
.canvas-library {
  width: min(1240px, calc(100% - 48px));
  margin: 0 auto;
  padding: 44px 0 86px;
}

.library-head {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 14px;
}

.head-copy {
  max-width: 720px;
}

.head-copy h1 {
  margin-bottom: 12px;
  font-size: clamp(30px, 4.4vw, 48px);
  letter-spacing: -0.04em;
}

.lede {
  margin: 0;
  color: var(--muted-strong);
  font-size: 15px;
  line-height: 1.7;
}

.head-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 9px;
}

.storage-note {
  margin: 0 0 24px;
  padding: 9px 13px;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  background: var(--panel-soft);
  color: var(--muted);
  font-size: 12px;
  line-height: 1.7;
}

.storage-note span {
  color: var(--muted-strong);
  font-family: var(--font-mono);
}

.library-alert {
  margin: 0 0 18px;
  padding: 10px 14px;
  border: 1px solid rgba(255, 125, 147, 0.35);
  border-radius: var(--radius-sm);
  background: var(--danger-wash);
  color: var(--danger);
  font-size: 13px;
}

.canvas-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(310px, 1fr));
  gap: 14px;
}

.canvas-card {
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-width: 0;
  padding: 16px;
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  background:
    linear-gradient(155deg, rgba(255, 255, 255, 0.025), transparent 42%),
    var(--panel);
  box-shadow: var(--shadow-soft);
}

.card-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.updated {
  color: var(--muted);
  font-size: 10px;
  white-space: nowrap;
}

.card-title {
  margin: 2px 0 0;
  overflow-wrap: anywhere;
  font-size: 19px;
  line-height: 1.35;
  letter-spacing: -0.02em;
}

.card-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  margin: 0;
  color: var(--muted);
  font-family: var(--font-mono);
  font-size: 11px;
}

.rename-row {
  display: grid;
  gap: 8px;
}

.rename-actions {
  display: flex;
  gap: 7px;
}

.card-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: auto;
  padding-top: 4px;
}

.delete-confirm {
  padding: 10px;
  border: 1px solid rgba(255, 125, 147, 0.35);
  border-radius: var(--radius-sm);
  background: var(--danger-wash);
}

.delete-confirm p {
  margin: 0 0 8px;
  color: var(--text);
  font-size: 12px;
  line-height: 1.65;
}

.delete-actions {
  display: flex;
  gap: 7px;
}

.empty-state {
  display: grid;
  place-items: center;
  gap: 8px;
  padding: 70px 24px;
  border: 1px dashed var(--border-strong);
  border-radius: var(--radius-md);
  background: var(--panel-soft);
  text-align: center;
}

.empty-state h2 {
  margin: 0;
  font-size: 22px;
}

.empty-state p {
  margin: 0;
  color: var(--muted);
  font-size: 14px;
}

.empty-actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 9px;
  margin-top: 10px;
}

@media (max-width: 820px) {
  .canvas-library {
    width: calc(100% - 26px);
    padding-top: 26px;
  }

  .head-actions {
    width: 100%;
  }

  .canvas-grid {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>