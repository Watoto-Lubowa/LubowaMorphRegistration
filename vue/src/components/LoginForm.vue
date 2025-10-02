<template>
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-500 to-secondary-500 p-4">
    <div class="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8 animate-fadeInUp">
      <div class="text-center mb-8">
        <div class="text-6xl mb-4">{{ icon }}</div>
        <h1 class="text-3xl font-bold text-gray-800 mb-2">Welcome</h1>
        <p class="text-gray-600">{{ subtitle }}</p>
      </div>

      <div class="bg-gray-50 rounded-xl p-6 mb-6">
        <div class="text-4xl text-center mb-4">👤</div>
        <h2 class="text-xl font-semibold text-center mb-2">Sign In to Continue</h2>
        <p class="text-gray-600 text-center text-sm mb-6">
          Please sign in to access the {{ isAdmin ? 'admin panel' : 'registration system' }}
        </p>

        <form @submit.prevent="handleSignIn" class="space-y-4">
          <div>
            <label for="email" class="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <span>📧</span>
              <span>Email Address</span>
            </label>
            <input
              id="email"
              v-model="email"
              type="email"
              required
              placeholder="your@email.com"
              class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
            />
            <p class="text-xs text-gray-500 mt-1">Enter your authorized email address</p>
          </div>

          <div>
            <label for="password" class="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <span>🔐</span>
              <span>Password</span>
            </label>
            <input
              id="password"
              v-model="password"
              type="password"
              required
              placeholder="••••••••••"
              class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
            />
            <p class="text-xs text-gray-500 mt-1">Enter your password</p>
          </div>

          <button
            type="submit"
            :disabled="isLoading"
            class="w-full bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            <span v-if="!isLoading" class="flex items-center justify-center gap-2">
              <span>🚀</span>
              <span>Sign In</span>
            </span>
            <span v-else class="flex items-center justify-center gap-2">
              <svg class="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Signing In...</span>
            </span>
          </button>
          
          <button
            type="button"
            @click="handlePasswordReset"
            :disabled="isLoading || !email"
            class="w-full text-primary-600 hover:text-primary-700 font-medium py-2 px-4 text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Forgot Password?
          </button>
        </form>
      </div>

      <div class="text-center text-sm text-gray-600">
        <p>© 2025 Lubowa Morph Registration</p>
        <p class="mt-1">Secure & Confidential</p>
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
