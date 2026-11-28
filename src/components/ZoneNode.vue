<template>
  <section
    class="zone-node"
    :class="`tone-${data.tone ?? 'default'}`"
    :data-testid="`zone-${id}`"
    :aria-label="`区域：${data.label}`"
  >
    <span class="zone-label">{{ data.label }}</span>
  </section>
</template>

<script setup lang="ts">
import type { TopologyZone } from '@/domain/types'

defineOptions({ inheritAttrs: false })

defineProps<{
  id: string
  data: {
    label: string
    tone?: TopologyZone['tone']
  }
}>()
</script>

<style scoped>
.zone-node {
  width: 100%;
  height: 100%;
  padding: 10px;
  border: 1px dashed var(--border-strong);
  border-radius: 18px;
  background: rgba(56, 212, 255, 0.025);
  pointer-events: none;
}

.zone-label {
  display: inline-flex;
  align-items: center;
  max-width: 100%;
  padding: 3px 10px;
  border: 1px solid var(--border-strong);
  border-radius: var(--radius-pill);
  background: var(--panel-soft);
  color: var(--muted-strong);
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.04em;
  line-height: 1.6;
  pointer-events: none;
}

.tone-secure {
  border-color: rgba(245, 196, 81, 0.38);
  background: rgba(245, 196, 81, 0.035);
}

.tone-secure .zone-label {
  border-color: rgba(245, 196, 81, 0.4);
  background: var(--warn-wash);
  color: var(--warn);
}

.tone-cloud {
  border-color: var(--accent-line);
  background: rgba(56, 212, 255, 0.035);
}

.tone-cloud .zone-label {
  border-color: var(--accent-line);
  background: var(--accent-wash);
  color: var(--accent);
}

.tone-warning {
  border-color: rgba(255, 125, 147, 0.38);
  background: rgba(255, 125, 147, 0.035);
}

.tone-warning .zone-label {
  border-color: rgba(255, 125, 147, 0.4);
  background: var(--danger-wash);
  color: var(--danger);
}
</style>