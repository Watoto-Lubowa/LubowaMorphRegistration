<template>
  <Teleport to="body">
    <div class="fixed top-4 right-4 z-[9999] space-y-3 pointer-events-none">
      <TransitionGroup name="toast">
        <div
          v-for="toast in toasts"
          :key="toast.id"
          :class="[
            'toast',
            `toast-${toast.type}`,
            'rounded-xl shadow-2xl p-4 flex items-center gap-3 min-w-[320px] max-w-md',
            'pointer-events-auto backdrop-blur-sm'
          ]"
        >
          <div class="flex-shrink-0 text-2xl">{{ getIcon(toast.type) }}</div>
          <div class="flex-1 min-w-0">
            <p class="font-medium text-white text-sm leading-relaxed break-words">
              {{ toast.message }}
            </p>
          </div>
          <button
            @click="removeToast(toast.id)"
            class="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full hover:bg-white/20 transition-colors text-white text-lg font-bold"
            aria-label="Close notification"
          >
            ×
          </button>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useUIStore } from '@/stores/ui'
import type { ToastMessage } from '@/types'

const uiStore = useUIStore()
const { toasts } = storeToRefs(uiStore)
const { removeToast } = uiStore

function getIcon(type: ToastMessage['type']): string {
  const icons = {
    success: '✅',
    error: '❌',
    warning: '⚠️',
    info: 'ℹ️'
  }
  return icons[type]
}
</script>

<style scoped>
.toast {
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
}

.toast-success {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  border-left: 4px solid #065f46;
}

.toast-error {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  border-left: 4px solid #991b1b;
}

.toast-warning {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  border-left: 4px solid #92400e;
}

.toast-info {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  border-left: 4px solid #1e40af;
}

.toast-enter-active {
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.toast-leave-active {
  transition: all 0.3s cubic-bezier(0.6, -0.28, 0.735, 0.045);
}

.toast-enter-from {
  opacity: 0;
  transform: translateX(120%) scale(0.8);
}

.toast-leave-to {
  opacity: 0;
  transform: translateX(120%) scale(0.6);
}

.toast-move {
  transition: transform 0.3s ease;
}
</style>
