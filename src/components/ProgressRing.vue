<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    value: number
    size?: number
    caption?: string
  }>(),
  {
    size: 118,
    caption: '',
  },
)

const RADIUS = 46
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

const percent = computed(() => {
  if (!Number.isFinite(props.value)) return 0
  return Math.min(100, Math.max(0, Math.round(props.value)))
})

const dashOffset = computed(() => CIRCUMFERENCE * (1 - percent.value / 100))
</script>

<template>
  <div class="progress-ring" :style="{ '--ring-size': `${size}px` }">
    <svg viewBox="0 0 110 110" aria-hidden="true">
      <circle class="ring-track" cx="55" cy="55" :r="RADIUS" />
      <circle
        class="ring-value"
        cx="55"
        cy="55"
        :r="RADIUS"
        :stroke-dasharray="CIRCUMFERENCE"
        :stroke-dashoffset="dashOffset"
      />
    </svg>
    <div class="progress-ring-center">
      <span class="progress-ring-value">{{ percent }}%</span>
      <span v-if="caption" class="progress-ring-caption">{{ caption }}</span>
    </div>
  </div>
</template>