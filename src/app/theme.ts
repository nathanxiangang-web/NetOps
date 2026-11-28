import { ref } from 'vue'

export type ThemeMode = 'dark' | 'light'
const STORAGE_KEY = 'netops.theme'

const theme = ref<ThemeMode>('dark')

function applyTheme(next: ThemeMode) {
  theme.value = next
  document.documentElement.dataset.theme = next
  document.documentElement.style.colorScheme = next
}

export function initTheme() {
  const saved = localStorage.getItem(STORAGE_KEY)
  if (saved === 'light' || saved === 'dark') {
    applyTheme(saved)
    return
  }
  applyTheme('dark')
}

export function toggleTheme() {
  const next = theme.value === 'dark' ? 'light' : 'dark'
  applyTheme(next)
  localStorage.setItem(STORAGE_KEY, next)
}

export function useTheme() {
  return { theme, toggleTheme }
}