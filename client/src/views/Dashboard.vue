<template>
  <div class="min-h-screen bg-gray-50">
    <div class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div class="px-4 py-6 sm:px-0">
        <!-- Header -->
        <div class="mb-8">
          <h1 class="text-3xl font-bold text-gray-900">Welcome to Secure LMS</h1>
          <p class="mt-1 text-sm text-gray-600">Your learning management system dashboard</p>
        </div>

        <!-- Welcome Card -->
        <div class="bg-white shadow rounded-lg mb-8">
          <div class="px-6 py-8 text-center">
            <div class="w-16 h-16 bg-indigo-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <span class="text-white text-2xl">🎓</span>
            </div>
            <h3 class="text-lg font-medium text-gray-900 mb-2">
              Welcome, {{ authStore.user?.firstName }} {{ authStore.user?.lastName }}!
            </h3>
            <p class="text-gray-600 mb-6">
              You're logged in as a {{ authStore.user?.role }}. Use the navigation above to access your dashboard and features.
            </p>
            <button
              @click="goToDashboard"
              class="bg-indigo-600 text-white px-6 py-3 rounded-md hover:bg-indigo-700 font-medium"
            >
              Go to {{ dashboardName }} Dashboard
            </button>
          </div>
        </div>

        <!-- Quick Links -->
        <div class="bg-white shadow rounded-lg">
          <div class="px-6 py-4 border-b border-gray-200">
            <h3 class="text-lg font-medium text-gray-900">Quick Links</h3>
          </div>
          <div class="p-6">
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                v-if="authStore.user?.role === 'student'"
                @click="$router.push('/courses')"
                class="flex items-center justify-center px-4 py-3 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                <span class="mr-2">📚</span>
                Browse Courses
              </button>
              <button
                v-if="authStore.user?.role === 'instructor'"
                @click="$router.push('/courses')"
                class="flex items-center justify-center px-4 py-3 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                <span class="mr-2">📚</span>
                Manage Courses
              </button>
              <button
                v-if="authStore.user?.role === 'admin'"
                @click="$router.push('/users')"
                class="flex items-center justify-center px-4 py-3 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                <span class="mr-2">👥</span>
                Manage Users
              </button>
              
              <button
                @click="$router.push('/settings')"
                class="flex items-center justify-center px-4 py-3 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                <span class="mr-2">⚙️</span>
                Settings
              </button>
              
              <button
                v-if="authStore.user?.role === 'admin'"
                @click="$router.push('/audit-logs')"
                class="flex items-center justify-center px-4 py-3 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                <span class="mr-2">📋</span>
                Audit Logs
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const dashboardName = computed(() => {
  const role = authStore.user?.role
  return role ? role.charAt(0).toUpperCase() + role.slice(1) : 'User'
})

const goToDashboard = () => {
  const role = authStore.user?.role
  switch (role) {
    case 'admin':
      router.push('/admin')
      break
    case 'instructor':
      router.push('/instructor')
      break
    case 'student':
      router.push('/student')
      break
    default:
      router.push('/dashboard')
  }
}
</script>
