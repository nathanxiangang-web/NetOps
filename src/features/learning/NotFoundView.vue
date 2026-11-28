<script setup lang="ts">
import { useRoute } from 'vue-router'
import { RouterLink } from 'vue-router'

const route = useRoute()
</script>

<template>
  <div class="notfound">
    <div class="container notfound-inner">
      <div>
        <div class="notfound-code">404 · PATH NOT FOUND</div>
        <h1 class="notfound-title">这条路径没有下一跳</h1>
        <code class="notfound-path">{{ route.fullPath }}</code>
        <p>当前地址没有对应的本地页面。可以回到首页继续选择课程，或从课程目录重新进入一张拓扑。</p>
        <div class="notfound-actions">
          <RouterLink class="btn" to="/">返回首页</RouterLink>
          <RouterLink class="btn secondary" to="/courses">查看课程目录</RouterLink>
          <RouterLink class="btn ghost" to="/canvas">打开自由画布</RouterLink>
        </div>
      </div>
      <svg class="notfound-art" viewBox="0 0 420 300" aria-hidden="true">
        <path class="nf-line" d="M40 220 L120 160 L200 188 L280 96 L372 132" />
        <path class="nf-line" d="M40 92 L128 58 L206 96" />
        <path class="nf-broken" d="M206 96 L280 96" />
        <path class="nf-broken" d="M280 96 L302 190" stroke-dasharray="4 7" />
        <rect class="nf-node" x="22" y="202" width="38" height="36" rx="8" />
        <rect class="nf-node" x="102" y="142" width="38" height="36" rx="8" />
        <rect class="nf-node" x="182" y="170" width="38" height="36" rx="8" />
        <rect class="nf-node" x="262" y="78" width="38" height="36" rx="8" />
        <rect class="nf-node" x="354" y="114" width="38" height="36" rx="8" />
        <rect class="nf-node" x="110" y="40" width="38" height="36" rx="8" />
        <circle cx="208" cy="118" r="4" fill="#ff7d93" />
        <path d="M196 108 L220 128 M220 108 L196 128" stroke="#ff7d93" stroke-width="2" stroke-linecap="round" />
        <circle cx="40" cy="220" r="3" fill="#38d4ff" />
        <circle cx="120" cy="160" r="3" fill="#38d4ff" />
        <circle cx="200" cy="188" r="3" fill="#38d4ff" />
        <circle cx="280" cy="96" r="3" fill="#38d4ff" />
        <circle cx="372" cy="132" r="3" fill="#38d4ff" />
      </svg>
    </div>
  </div>
</template>