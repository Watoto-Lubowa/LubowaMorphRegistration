import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { ToastMessage } from '@/types'
import { generateId } from '@/utils/validation'
import { VALIDATION_CONSTANTS } from '@/config'

export const useUIStore = defineStore('ui', () => {
  const toasts = ref<ToastMessage[]>([])
  const isLoading = ref(false)

  function showToast(
    message: string,
    type: ToastMessage['type'] = 'info',
    duration: number = VALIDATION_CONSTANTS.TOAST_DURATION
  ) {
    const id = generateId()
    const toast: ToastMessage = { id, type, message, duration }
    
    toasts.value.push(toast)
    
    if (duration > 0) {
      setTimeout(() => {
        removeToast(id)
      }, duration)
    }
    
    return id
  }

  function removeToast(id: string) {
    const index = toasts.value.findIndex(t => t.id === id)
    if (index !== -1) {
      toasts.value.splice(index, 1)
    }
  }

  function success(message: string, duration?: number) {
    return showToast(message, 'success', duration)
  }

  function error(message: string, duration?: number) {
    return showToast(message, 'error', duration)
  }

  function warning(message: string, duration?: number) {
    return showToast(message, 'warning', duration)
  }

  function info(message: string, duration?: number) {
    return showToast(message, 'info', duration)
  }

  function setLoading(loading: boolean) {
    isLoading.value = loading
  }

  return {
    toasts,
    isLoading,
    showToast,
    removeToast,
    success,
    error,
    warning,
    info,
    setLoading
  }
})
