<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { notify } from '@/app/toast'
import type { Challenge } from '@/domain/types'
import { getProgress, markCourseChallenge } from '@/storage/localStore'

const props = defineProps<{ challenge: Challenge; courseId: string }>()
const emit = defineEmits<{ attempted: [] }>()

const selectedOptionId = ref('')
const submitted = ref(false)
const attempted = ref(false)
const openText = ref('')
const showExplanation = ref(false)
const storageIssue = ref('')

const selectedOption = computed(() =>
  props.challenge.options?.find((option) => option.id === selectedOptionId.value),
)
const isCorrect = computed(() => selectedOption.value?.correct === true)

onMounted(() => {
  try {
    const entry = getProgress().find((item) => item.courseId === props.courseId)
    if (entry?.challengeAttempted) attempted.value = true
  } catch {
    storageIssue.value = '本地存储不可用'
  }
})

function markAttempt() {
  attempted.value = true
  try {
    markCourseChallenge(props.courseId)
    emit('attempted')
  } catch {
    storageIssue.value = '本机记录未保存'
  }
}

function submitChoice() {
  if (!selectedOptionId.value) return
  submitted.value = true
  markAttempt()
}

function retryChoice() {
  selectedOptionId.value = ''
  submitted.value = false
}

function showOpenOutline() {
  showExplanation.value = true
  markAttempt()
}

function saveOpenAttempt() {
  markAttempt()
  notify('已把挑战尝试记录到本机（只记录尝试标记，不保存文本内容）。')
}

function optionClass(optionId: string, correct: boolean | undefined) {
  return {
    selected: !submitted.value && selectedOptionId.value === optionId,
    correct: submitted.value && correct === true,
    wrong: submitted.value && selectedOptionId.value === optionId && correct !== true,
  }
}
</script>

<template>
  <article class="challenge-card">
    <div class="challenge-head">
      <span class="challenge-kind">
        {{ challenge.kind === 'choice' ? '选择题' : '开放题' }}
      </span>
      <span v-if="attempted" class="challenge-attempted">已尝试 · 本机记录</span>
    </div>

    <p class="challenge-prompt">{{ challenge.prompt }}</p>
    <p v-if="challenge.hint" class="challenge-hint">提示：{{ challenge.hint }}</p>

    <template v-if="challenge.kind === 'choice'">
      <div class="challenge-options" role="group" aria-label="挑战选项">
        <button
          v-for="(option, index) in challenge.options"
          :key="option.id"
          type="button"
          class="challenge-option"
          :class="optionClass(option.id, option.correct)"
          :disabled="submitted"
          :aria-pressed="selectedOptionId === option.id"
          @click="selectedOptionId = option.id"
        >
          <span class="challenge-option-marker">{{ String.fromCharCode(65 + index) }}</span>
          <span>{{ option.label }}</span>
        </button>
      </div>

      <div v-if="submitted" class="challenge-result" :class="isCorrect ? 'ok' : 'bad'">
        {{ isCorrect ? '回答正确。可以重试，但本机会保留“已尝试”标记。' : '回答不正确。查看逐项解释后可重新作答。' }}
      </div>

      <div class="challenge-actions">
        <button
          v-if="!submitted"
          type="button"
          class="btn small"
          :disabled="!selectedOptionId"
          @click="submitChoice"
        >
          提交答案
        </button>
        <button v-else type="button" class="btn secondary small" @click="retryChoice">
          重试
        </button>
      </div>

      <template v-if="submitted">
        <ul class="challenge-explanations">
          <li v-for="option in challenge.options" :key="option.id">
            <b>{{ option.label }}</b>：{{ option.explanation }}
          </li>
        </ul>
        <p class="challenge-explanation">{{ challenge.explanation }}</p>
      </template>
    </template>

    <template v-else>
      <label class="challenge-open field">
        <span>本地临时输入（不会自动上传）</span>
        <textarea
          v-model="openText"
          class="textarea"
          placeholder="先写下你的判断依据，再查看思路"
        ></textarea>
      </label>

      <div class="challenge-actions">
        <button type="button" class="btn secondary small" @click="showOpenOutline">
          查看思路
        </button>
        <button type="button" class="btn ghost small" @click="saveOpenAttempt">
          保存到本机
        </button>
      </div>

      <div v-if="showExplanation" class="challenge-outline">
        <p class="challenge-explanation">{{ challenge.explanation }}</p>
        <p class="challenge-hint">
          “保存到本机”只写入该课程的挑战尝试标记，不保存上面输入的文本。
        </p>
      </div>
    </template>

    <p v-if="storageIssue" class="challenge-hint">{{ storageIssue }}：本机记录可能不会保留。</p>
  </article>
</template>