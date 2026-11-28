<template>
  <article
    class="network-node"
    :class="{
      'is-active': data.isActive,
      'is-selected': data.isSelected,
      'is-edit': data.mode === 'edit',
    }"
    :data-testid="`flow-node-${id}`"
    :aria-label="ariaLabel"
  >
    <Handle
      v-if="data.mode === 'edit'"
      id="in"
      type="target"
      :position="Position.Left"
      class="netops-handle"
      aria-label="连接输入端点"
    />
    <span v-if="data.note" class="note-mark" title="含备注" aria-label="含备注">备</span>
    <span v-if="data.isActive" class="state-tag active-tag">当前步骤</span>
    <img class="node-icon" :src="icon.asset" alt="" width="66" height="66" loading="lazy" draggable="false" />
    <h3 class="node-label">{{ data.label }}</h3>
    <p class="node-role">{{ data.role }}</p>
    <p v-if="data.ip" class="node-ip mono">{{ data.ip }}</p>
    <span v-if="data.isSelected" class="state-tag selected-tag">已选</span>
    <Handle
      v-if="data.mode === 'edit'"
      id="out"
      type="source"
      :position="Position.Right"
      class="netops-handle"
      aria-label="连接输出端点"
    />
  </article>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Handle, Position } from '@vue-flow/core'
import { getIcon } from '@/domain/icons'

defineOptions({ inheritAttrs: false })

const props = defineProps<{
  id: string
  data: {
    iconId: string
    label: string
    role: string
    ip?: string
    note?: string
    isActive: boolean
    isSelected: boolean
    mode: 'course' | 'edit'
  }
}>()

const icon = computed(() => getIcon(props.data.iconId))
const ariaLabel = computed(() => {
  const parts = [props.data.label, props.data.role]
  if (props.data.ip) parts.push(props.data.ip)
  if (props.data.isActive) parts.push('当前步骤')
  return parts.filter((part) => part.trim() !== '').join('，')
})
</script>

<style scoped>
.network-node {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 168px;
  padding: 14px 12px 12px;
  border: 1px solid var(--border-strong);
  border-radius: 14px;
  background:
    radial-gradient(circle at 50% 0%, rgba(56, 212, 255, 0.1), transparent 58%),
    linear-gradient(160deg, rgba(255, 255, 255, 0.035), transparent 48%),
    var(--panel);
  box-shadow: var(--shadow-soft);
  color: var(--text);
  text-align: center;
}

.network-node.is-edit {
  cursor: grab;
}

.network-node.is-active {
  border-color: var(--accent);
  box-shadow:
    0 0 0 1px var(--accent-line),
    0 0 22px rgba(56, 212, 255, 0.26),
    var(--shadow-soft);
}

.network-node.is-selected {
  border-color: var(--accent-soft);
  box-shadow:
    0 0 0 2px var(--accent-line),
    0 0 18px rgba(56, 212, 255, 0.18),
    var(--shadow-soft);
}

.network-node.is-active.is-selected {
  border-color: var(--accent-soft);
  box-shadow:
    0 0 0 2px var(--accent),
    0 0 26px rgba(56, 212, 255, 0.34),
    var(--shadow-soft);
}

.node-icon {
  width: 66px;
  height: 66px;
  margin-top: 6px;
  object-fit: contain;
  filter: drop-shadow(0 6px 12px rgba(0, 0, 0, 0.28));
  pointer-events: none;
  user-select: none;
}

.node-label {
  display: -webkit-box;
  max-width: 100%;
  margin: 8px 0 0;
  overflow: hidden;
  color: var(--text-strong);
  font-size: 13px;
  font-weight: 750;
  line-height: 1.35;
  letter-spacing: -0.01em;
  text-overflow: ellipsis;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  word-break: break-word;
}

.node-role {
  display: -webkit-box;
  max-width: 100%;
  margin: 4px 0 0;
  overflow: hidden;
  color: var(--muted);
  font-size: 11px;
  line-height: 1.35;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  word-break: break-word;
}

.node-ip {
  max-width: 100%;
  margin: 5px 0 0;
  overflow: hidden;
  color: var(--muted-strong);
  font-size: 10px;
  line-height: 1.4;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.note-mark {
  position: absolute;
  top: 7px;
  right: 7px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  border: 1px solid rgba(245, 196, 81, 0.45);
  border-radius: 5px;
  background: var(--warn-wash);
  color: var(--warn);
  font-size: 10px;
  font-weight: 800;
  line-height: 1;
}

.state-tag {
  position: absolute;
  left: 7px;
  padding: 2px 6px;
  border-radius: var(--radius-pill);
  font-family: var(--font-mono);
  font-size: 9px;
  font-weight: 800;
  letter-spacing: 0.04em;
  line-height: 1.5;
}

.active-tag {
  top: 7px;
  border: 1px solid var(--accent-line);
  background: var(--accent-wash);
  color: var(--accent);
}

.selected-tag {
  bottom: 6px;
  border: 1px solid var(--border-strong);
  background: var(--panel-soft);
  color: var(--muted-strong);
}
</style>