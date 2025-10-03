<template>
  <!-- Login Section matching original index.html -->
  <div class="login-section">
    <div class="login-container">
      <div class="login-header">
        <h1>Welcome</h1>
        <p class="login-subtitle">Lubowa Morph Registration System</p>
      </div>
      
      <div class="login-card">
        <div class="login-icon">👤</div>
        <h2>Sign In to Continue</h2>
        <p class="login-description">Please sign in to access the registration system</p>
        
        <form @submit.prevent="handleSignIn">
          <div class="field email-field">
            <label for="userEmail">
              <span class="field-icon">📧</span>
              <span class="field-text">Email Address</span>
            </label>
            <input 
              type="email" 
              id="userEmail" 
              v-model="email"
              placeholder="your@email.com" 
              required
            >
            <small class="field-help">Enter your authorized email address</small>
          </div>
          
          <div class="field password-field">
            <label for="userPassword">
              <span class="field-icon">🔐</span>
              <span class="field-text">Password</span>
            </label>
            <input 
              type="password" 
              id="userPassword" 
              v-model="password"
              placeholder="••••••••••" 
              required
            >
            <small class="field-help">Enter your password</small>
          </div>
          
          <div class="button-container">
            <button 
              type="submit"
              :disabled="isLoading"
              :class="{ loading: isLoading }"
            >
              <span v-if="!isLoading" class="btn-text">🚀 Sign In</span>
              <span v-else class="btn-loading">Signing in...</span>
            </button>
          </div>
          
          <div class="login-options">
            <button 
              type="button"
              @click="handlePasswordReset"
              :disabled="isLoading || !email"
              class="link-btn"
            >
              Forgot Password?
            </button>
          </div>
          
          <div class="security-notice" style="text-align: center; margin-top: 20px;">
            <small style="color: #666; font-size: 0.85em;">🔒 Your session will expire when you close your browser for security.</small>
          </div>
          
          <!-- Status messages will be shown via ToastContainer from UIStore -->
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useAuthStore } from '@/stores/auth'
import { useUIStore } from '@/stores/ui'

interface Props {
  icon?: string
  subtitle?: string
  isAdmin?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  icon: '🏥',
  subtitle: 'Lubowa Morph Registration System',
  isAdmin: false
})

const emit = defineEmits<{
  success: []
}>()

const authStore = useAuthStore()
const uiStore = useUIStore()
const { isLoading } = storeToRefs(uiStore)

const email = ref('')
const password = ref('')

async function handleSignIn() {
  if (!email.value || !password.value) {
    uiStore.error('Please enter both email and password')
    return
  }

  uiStore.setLoading(true)
  try {
    const success = await authStore.signIn(email.value, password.value)
    if (success) {
      if (props.isAdmin && !authStore.isAdmin) {
        uiStore.error('You do not have admin privileges')
        await authStore.signOutUser()
        return
      }
      emit('success')
    }
  } finally {
    uiStore.setLoading(false)
  }
}

async function handlePasswordReset() {
  if (!email.value) {
    uiStore.warning('Please enter your email address first')
    return
  }
  
  uiStore.setLoading(true)
  try {
    await authStore.resetPassword(email.value)
  } finally {
    uiStore.setLoading(false)
  }
}
</script>
