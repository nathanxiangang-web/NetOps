import { createRouter, createWebHashHistory } from 'vue-router'

const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('@/features/learning/HomeView.vue'),
    },
    {
      path: '/courses',
      name: 'courses',
      component: () => import('@/features/learning/CourseCatalogView.vue'),
    },
    {
      path: '/learn/:courseId',
      name: 'course',
      component: () => import('@/features/learning/CourseView.vue'),
      props: true,
    },
    {
      path: '/canvas',
      name: 'canvases',
      component: () => import('@/features/canvas/CanvasListView.vue'),
    },
    {
      path: '/canvas/:id',
      name: 'canvas',
      component: () => import('@/features/canvas/CanvasEditorView.vue'),
      props: true,
    },
    {
      path: '/notes',
      name: 'notes',
      component: () => import('@/features/notes/NotesView.vue'),
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: () => import('@/features/learning/NotFoundView.vue'),
    },
  ],
  scrollBehavior(to, _from, savedPosition) {
    if (savedPosition) return savedPosition
    if (to.hash) return { el: to.hash, top: 100 }
    return { top: 0 }
  },
})

export default router