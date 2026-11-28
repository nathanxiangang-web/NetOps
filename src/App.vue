<script setup lang="ts">
import { onMounted } from 'vue'
import { RouterLink, RouterView } from 'vue-router'
import { useTheme } from '@/app/theme'
import { dismissToast, useToasts } from '@/app/toast'
import BrandMark from '@/components/BrandMark.vue'

const { theme, toggleTheme } = useTheme()
const { toasts } = useToasts()

onMounted(() => {
  document.documentElement.dataset.ready = 'true'
})
</script>

<template>
  <a class="skip-link" href="#main-content">跳到主要内容</a>
  <header class="site-header">
    <div class="container header-inner">
      <RouterLink class="brand" to="/" aria-label="NetOps 首页">
        <BrandMark />
        <span class="brand-copy">
          <strong>NetOps</strong>
          <small>TOPOLOGY ATLAS</small>
        </span>
      </RouterLink>

      <nav class="main-nav" aria-label="主导航">
        <RouterLink to="/courses">课程</RouterLink>
        <RouterLink to="/canvas">自由画布</RouterLink>
        <RouterLink to="/notes">我的记录</RouterLink>
      </nav>

      <div class="header-actions">
        <button
          class="theme-button"
          type="button"
          :aria-label="theme === 'dark' ? '切换到浅色主题' : '切换到深色主题'"
          :title="theme === 'dark' ? '切换到浅色主题' : '切换到深色主题'"
          @click="toggleTheme"
        >
          <span aria-hidden="true">{{ theme === 'dark' ? '☼' : '◐' }}</span>
          <span class="theme-label">{{ theme === 'dark' ? '浅色' : '深色' }}</span>
        </button>
      </div>
    </div>
  </header>

  <main id="main-content">
    <RouterView />
  </main>

  <footer class="site-footer">
    <div class="container footer-inner">
      <div>
        <strong>NetOps</strong>
        <span class="muted">以拓扑学网络，以实验验原理，以画布沉淀知识。</span>
      </div>
      <p>静态前端 · 本地保存 · 无协议模拟器 · 无真实设备连接</p>
    </div>
  </footer>

  <div class="app-toast-stack" aria-live="polite" aria-atomic="true">
    <button
      v-for="toast in toasts"
      :key="toast.id"
      type="button"
      class="app-toast"
      :class="{ error: toast.tone === 'error' }"
      @click="dismissToast(toast.id)"
    >
      {{ toast.message }}
    </button>
  </div>
</template>

<style scoped>
.site-header {
  position: sticky;
  top: 0;
  z-index: 100;
  height: var(--header-height);
  border-bottom: 1px solid var(--border);
  background: color-mix(in srgb, var(--bg) 88%, transparent);
  backdrop-filter: blur(16px);
}

.header-inner {
  display: flex;
  align-items: center;
  height: 100%;
  gap: 30px;
}

.brand {
  display: inline-flex;
  align-items: center;
  gap: 11px;
  color: var(--text-strong);
}

.brand:hover {
  color: var(--text-strong);
}

.brand-copy {
  display: grid;
  line-height: 1;
}

.brand-copy strong {
  font-size: 19px;
  letter-spacing: -0.04em;
}

.brand-copy small {
  margin-top: 5px;
  color: var(--muted);
  font-family: var(--font-mono);
  font-size: 8px;
  letter-spacing: .2em;
}

.main-nav {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-left: 8px;
}

.main-nav a {
  padding: 8px 13px;
  border-radius: var(--radius-pill);
  color: var(--muted-strong);
  font-size: 14px;
  font-weight: 650;
  transition: background .18s, color .18s;
}

.main-nav a:hover,
.main-nav a.router-link-active {
  background: var(--accent-wash);
  color: var(--accent);
}

.header-actions {
  margin-left: auto;
}

.theme-button {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  min-height: 36px;
  padding: 0 11px;
  border: 1px solid var(--border);
  border-radius: var(--radius-pill);
  background: var(--panel-soft);
  color: var(--muted-strong);
  cursor: pointer;
  font-size: 12px;
}

.theme-button:hover {
  border-color: var(--accent-line);
  color: var(--accent);
}

.theme-button span:first-child {
  font-size: 16px;
  line-height: 1;
}

.site-footer {
  border-top: 1px solid var(--border);
  background: var(--bg-deep);
}

.footer-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  min-height: 92px;
  color: var(--muted);
  font-size: 13px;
}

.footer-inner > div {
  display: flex;
  gap: 12px;
  align-items: baseline;
}

.footer-inner strong {
  color: var(--text-strong);
}

.footer-inner p {
  margin: 0;
  font-family: var(--font-mono);
  font-size: 11px;
}

@media (max-width: 820px) {
  :root {
    --header-height: 62px;
  }

  .header-inner {
    gap: 12px;
  }

  .brand-copy small,
  .theme-label {
    display: none;
  }

  .main-nav {
    margin-left: auto;
  }

  .main-nav a {
    padding: 7px 8px;
    font-size: 13px;
  }

  .footer-inner {
    display: grid;
    padding: 24px 0;
  }

  .footer-inner > div {
    display: grid;
    gap: 4px;
  }
}

@media (max-width: 520px) {
  .brand-copy strong {
    font-size: 16px;
  }

  .main-nav a:first-child {
    display: none;
  }
}
</style>