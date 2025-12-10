import { createRouter, createWebHistory } from 'vue-router'
import RegistrationView from '@/views/RegistrationView.vue'
import AdminView from '@/views/AdminView.vue'
import QRGeneratorView from '@/views/QRGeneratorView.vue'
import QRView from '@/views/QRView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: QRView,
      meta: { title: 'QR Check-In' }
    },
    {
      path: '/register',
      name: 'admin-registration',
      component: RegistrationView,
      meta: { title: 'Registration', requiresAuth: true }
    },
    {
      path: '/admin',
      name: 'admin',
      component: AdminView,
      meta: { title: 'Admin Panel', requiresAdmin: true }
    },
    {
      path: '/qr-generator',
      name: 'qr-generator',
      component: QRGeneratorView,
      meta: { title: 'QR Code Generator', requiresAuth: true }
    }
  ]
})

// Navigation guards
router.beforeEach((to, _from, next) => {
  // Update page title
  document.title = `${to.meta.title || 'Lubowa Morph'} - Lubowa Morph Registration`
  
  // QR-only route handling is done in the component
  next()
})

export default router
