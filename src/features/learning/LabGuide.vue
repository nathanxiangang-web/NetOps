<script setup lang="ts">
import { computed, ref } from 'vue'
import { notify } from '@/app/toast'
import type { LabGuide as LabGuideData } from '@/domain/types'

const props = defineProps<{ guide: LabGuideData }>()

const statusMeta = computed(() => {
  if (props.guide.status === 'verified') {
    return { label: '已实机验证', tone: 'ok' }
  }
  if (props.guide.status === 'partial') {
    return { label: '部分支持', tone: 'accent' }
  }
  return { label: '文档指导，尚未实机', tone: 'warn' }
})

const copiedIndex = ref<number | null>(null)

async function copyCommand(code: string, index: number) {
  try {
    if (!navigator.clipboard) {
      throw new Error('clipboard unavailable')
    }
    await navigator.clipboard.writeText(code)
    copiedIndex.value = index
    notify('命令已复制。本网站不会执行任何命令。')
    window.setTimeout(() => {
      if (copiedIndex.value === index) copiedIndex.value = null
    }, 2200)
  } catch {
    notify('复制失败，请手动选择命令文本。', 'error')
  }
}
</script>

<template>
  <div class="lab-guide">
    <div class="lab-head">
      <div>
        <h3>外部实验指导</h3>
        <div class="lab-meta">
          <span>平台 <b>{{ guide.platform }}</b></span>
          <span>版本 <b>{{ guide.versions }}</b></span>
          <span v-if="guide.checkedAt">核查 <b>{{ guide.checkedAt }}</b></span>
        </div>
        <p class="lab-note">{{ guide.statusNote }}</p>
      </div>
      <span class="badge" :class="statusMeta.tone">{{ statusMeta.label }}</span>
    </div>

    <p class="lab-safe-note">
      仅供外部隔离环境。本网站不连接设备、不执行命令，命令块只供复制到自行准备的实验环境。
    </p>

    <details class="lab-details" open>
      <summary>设备与准备 <small>{{ guide.devices.length }} 项设备</small></summary>
      <div class="lab-details-body">
        <ul class="lab-list">
          <li v-for="device in guide.devices" :key="device">{{ device }}</li>
        </ul>
        <ul class="lab-list">
          <li v-for="requirement in guide.requirements" :key="requirement">{{ requirement }}</li>
        </ul>
      </div>
    </details>

    <details class="lab-details" open>
      <summary>地址与实验任务 <small>{{ guide.tasks.length }} 个任务</small></summary>
      <div class="lab-details-body">
        <ul class="lab-list mono-list">
          <li v-for="address in guide.addressing" :key="address">{{ address }}</li>
        </ul>
        <div class="lab-tasks">
          <article v-for="task in guide.tasks" :key="task.title" class="lab-task">
            <h4 class="lab-task-title">{{ task.title }}</h4>
            <ol>
              <li v-for="step in task.steps" :key="step">{{ step }}</li>
            </ol>
            <p class="lab-task-observe">观察：{{ task.observe }}</p>
          </article>
        </div>
      </div>
    </details>

    <details class="lab-details">
      <summary>命令参考 <small>{{ guide.commands.length }} 段，可复制</small></summary>
      <div class="lab-details-body">
        <div class="lab-commands">
          <div v-for="(command, index) in guide.commands" :key="command.title" class="lab-cmd">
            <div class="lab-cmd-head">
              <span>{{ command.title }} · {{ command.language }}</span>
              <button
                type="button"
                class="code-copy"
                @click="copyCommand(command.code, index)"
              >
                {{ copiedIndex === index ? '已复制' : '复制命令' }}
              </button>
            </div>
            <pre class="code-block"><code>{{ command.code }}</code></pre>
          </div>
        </div>
      </div>
    </details>

    <details class="lab-details">
      <summary>验证标准与预期 <small>{{ guide.verification.length }} 条验证</small></summary>
      <div class="lab-details-body">
        <ul class="lab-list">
          <li v-for="item in guide.verification" :key="item">{{ item }}</li>
        </ul>
        <ul class="lab-list">
          <li v-for="item in guide.expected" :key="item">{{ item }}</li>
        </ul>
      </div>
    </details>

    <details class="lab-details">
      <summary>常见故障与恢复 <small>{{ guide.faults.length }} 个故障</small></summary>
      <div class="lab-details-body">
        <ul class="lab-list">
          <li v-for="item in guide.faults" :key="item">{{ item }}</li>
        </ul>
        <ul class="lab-list">
          <li v-for="item in guide.recovery" :key="item">{{ item }}</li>
        </ul>
      </div>
    </details>

    <details class="lab-details">
      <summary>实验来源 <small>{{ guide.sources.length }} 条</small></summary>
      <div class="lab-details-body">
        <ul class="lab-list">
          <li v-for="source in guide.sources" :key="source.url">
            <a :href="source.url" target="_blank" rel="noopener noreferrer">{{ source.title }}</a>
            <template v-if="source.note">：{{ source.note }}</template>
          </li>
        </ul>
      </div>
    </details>
  </div>
</template>