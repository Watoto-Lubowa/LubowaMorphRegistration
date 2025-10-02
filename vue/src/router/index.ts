import { createRouter, createWebHistory } from 'vue-router'
import RegistrationView from '@/views/RegistrationView.vue'
import AdminView from '@/views/AdminView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'registration',
      component: RegistrationView,
      meta: { title: 'Member Registration' }
    },
    {
      path: '/admin',
      name: 'admin',
      component: AdminView,
      meta: { title: 'Admin Panel', requiresAdmin: true }
    }
  ]
})

// Update page title
router.beforeEach((to, _from, next) => {
  document.title = `${to.meta.title || 'Lubowa Morph'} - Lubowa Morph Registration`
  next()
})

export default router
