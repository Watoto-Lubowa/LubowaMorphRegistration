<script setup lang="ts">
import { onMounted } from 'vue'
import { RouterView } from 'vue-router'
import ToastContainer from '@/components/ToastContainer.vue'
import { initializeFirebase } from '@/utils/firebase'
import { useAuthStore } from '@/stores/auth'

// Initialize Firebase on app mount
onMounted(() => {
  try {
    initializeFirebase()
    
    // Initialize auth listener
    const authStore = useAuthStore()
    authStore.initializeAuthListener()
    
    console.log('✅ App initialized successfully')
  } catch (error) {
    console.error('❌ Failed to initialize app:', error)
  }
})
</script>

<template>
  <div id="app">
    <RouterView />
    <ToastContainer />
  </div>
</template>

<style>
/* Global styles are in style.css */
</style>
