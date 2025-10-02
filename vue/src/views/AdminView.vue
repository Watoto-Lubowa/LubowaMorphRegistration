<template>
  <div class="min-h-screen bg-gradient-to-br from-primary-500 to-secondary-500 p-4">
    <!-- Login Section -->
    <div v-if="!isAuthenticated || !isAdmin">
      <LoginForm :is-admin="true" @success="handleLoginSuccess" />
    </div>

    <!-- Admin Dashboard -->
    <div v-else class="max-w-6xl mx-auto">
      <div class="bg-white rounded-2xl shadow-2xl p-8 animate-fadeInUp">
        <!-- Header -->
        <div class="flex justify-between items-center mb-8">
          <div>
            <h1 class="text-3xl font-bold text-gray-800 mb-2">
              🔐 Admin Panel
            </h1>
            <p class="text-gray-600">Lubowa Morph Registration System</p>
          </div>
          <div class="flex gap-2">
            <button
              @click="loadMembers"
              class="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
            >
              🔄 Refresh
            </button>
            <button
              @click="handleSignOut"
              class="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
            >
              🚪 Sign Out
            </button>
          </div>
        </div>

        <!-- Stats -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div class="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white">
            <div class="text-4xl mb-2">👥</div>
            <div class="text-3xl font-bold">{{ members.length }}</div>
            <div class="text-blue-100">Total Members</div>
          </div>
          
          <div class="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white">
            <div class="text-4xl mb-2">📊</div>
            <div class="text-3xl font-bold">{{ members.length }}</div>
            <div class="text-green-100">Active Records</div>
          </div>
          
          <div class="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white">
            <div class="text-4xl mb-2">✅</div>
            <div class="text-3xl font-bold">{{ authStore.userEmail }}</div>
            <div class="text-purple-100 text-sm">Logged in as</div>
          </div>
        </div>

        <!-- Members Table -->
        <div class="bg-gray-50 rounded-xl p-6">
          <h2 class="text-xl font-semibold mb-4">📋 Members List</h2>
          
          <div v-if="isLoading" class="text-center py-8">
            <div class="text-4xl mb-2">⏳</div>
            <p>Loading members...</p>
          </div>

          <div v-else-if="members.length === 0" class="text-center py-8">
            <div class="text-4xl mb-2">📭</div>
            <p>No members found</p>
          </div>

          <div v-else class="overflow-x-auto">
            <table class="w-full">
              <thead>
                <tr class="border-b-2 border-gray-200">
                  <th class="text-left p-3">Name</th>
                  <th class="text-left p-3">Phone</th>
                  <th class="text-left p-3">Registration Date</th>
                  <th class="text-left p-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="member in members"
                  :key="member.id"
                  class="border-b border-gray-200 hover:bg-gray-100 transition-colors"
                >
                  <td class="p-3">
                    {{ member.Name }}
                  </td>
                  <td class="p-3">{{ member.MorphersNumber }}</td>
                  <td class="p-3">{{ formatDate(member.createdAt) }}</td>
                  <td class="p-3">
                    <button
                      @click="deleteMember(member.id!)"
                      class="px-3 py-1 bg-red-500 hover:bg-red-600 text-white text-sm rounded transition-colors"
                    >
                      🗑️ Delete
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useAuthStore } from '@/stores/auth'
import { useMembersStore } from '@/stores/members'
import { useUIStore } from '@/stores/ui'
import LoginForm from '@/components/LoginForm.vue'

const authStore = useAuthStore()
const membersStore = useMembersStore()
const uiStore = useUIStore()

const { isAuthenticated, isAdmin } = storeToRefs(authStore)
const { members } = storeToRefs(membersStore)
const { isLoading } = storeToRefs(uiStore)

onMounted(() => {
  if (isAuthenticated.value && isAdmin.value) {
    loadMembers()
  }
})

function handleLoginSuccess() {
  if (isAdmin.value) {
    uiStore.success('Welcome Admin!')
    loadMembers()
  } else {
    uiStore.error('Access denied: Admin privileges required')
    authStore.signOutUser()
  }
}

async function loadMembers() {
  uiStore.setLoading(true)
  try {
    await membersStore.getAllMembers()
  } catch (error) {
    uiStore.error('Failed to load members')
  } finally {
    uiStore.setLoading(false)
  }
}

async function deleteMember(id: string) {
  if (!confirm('Are you sure you want to delete this member?')) return
  
  uiStore.setLoading(true)
  try {
    await membersStore.deleteMember(id)
  } finally {
    uiStore.setLoading(false)
  }
}

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString()
}

async function handleSignOut() {
  await authStore.signOutUser()
}
</script>
