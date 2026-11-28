import { reactive } from 'vue'

export interface ToastItem {
  id: number
  message: string
  tone: 'info' | 'error'
}

const toasts = reactive<ToastItem[]>([])
let nextId = 1

export function useToasts() {
  return { toasts }
}

export function notify(message: string, tone: 'info' | 'error' = 'info') {
  const id = nextId++
  toasts.push({ id, message, tone })
  window.setTimeout(() => {
    const index = toasts.findIndex((toast) => toast.id === id)
    if (index >= 0) toasts.splice(index, 1)
  }, 3200)
}

export function dismissToast(id: number) {
  const index = toasts.findIndex((toast) => toast.id === id)
  if (index >= 0) toasts.splice(index, 1)
}