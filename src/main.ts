import { createApp } from 'vue'
import '@vue-flow/core/dist/style.css'
import '@vue-flow/core/dist/theme-default.css'
import '@/styles/base.css'
import '@/styles/flow.css'
import '@/styles/learning.css'
import App from './App.vue'
import router from './app/router'
import { initTheme } from './app/theme'

initTheme()

createApp(App).use(router).mount('#app')