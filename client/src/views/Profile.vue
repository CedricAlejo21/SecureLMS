<template>
  <div class="min-h-screen bg-gray-50">
    <div class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div class="px-4 py-6 sm:px-0">
        <h1 class="text-3xl font-bold text-gray-900 mb-8">User Profile</h1>
        
        <!-- User Information Card -->
        <div class="bg-white shadow rounded-lg p-6 mb-6">
          <h2 class="text-xl font-semibold text-gray-900 mb-4">Account Information</h2>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700">Username</label>
              <p class="mt-1 text-sm text-gray-900">{{ user?.username }}</p>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700">Email</label>
              <p class="mt-1 text-sm text-gray-900">{{ user?.email }}</p>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700">Full Name</label>
              <p class="mt-1 text-sm text-gray-900">{{ user?.firstName }} {{ user?.lastName }}</p>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700">Role</label>
              <span class="mt-1 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {{ user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1) }}
              </span>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700">Last Login</label>
              <p class="mt-1 text-sm text-gray-900">
                {{ user?.lastLogin ? formatDate(user.lastLogin) : 'Never' }}
              </p>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700">Account Status</label>
              <span class="mt-1 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Active
              </span>
            </div>
          </div>
        </div>

        <!-- Password Change Form -->
        <div class="bg-white shadow rounded-lg p-6 mb-6">
          <h2 class="text-xl font-semibold text-gray-900 mb-4">Change Password</h2>
          
          <form @submit.prevent="changePassword" class="space-y-4">
            <div>
              <label for="currentPassword" class="block text-sm font-medium text-gray-700">
                Current Password
              </label>
              <input
                type="password"
                id="currentPassword"
                v-model="passwordForm.currentPassword"
                required
                class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            
            <div>
              <label for="newPassword" class="block text-sm font-medium text-gray-700">
                New Password
              </label>
              <input
                type="password"
                id="newPassword"
                v-model="passwordForm.newPassword"
                required
                minlength="12"
                class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
              <p class="mt-1 text-xs text-gray-500">
                Password must be at least 12 characters long and cannot be the same as your last 5 passwords.
              </p>
            </div>
            
            <div>
              <label for="confirmPassword" class="block text-sm font-medium text-gray-700">
                Confirm New Password
              </label>
              <input
                type="password"
                id="confirmPassword"
                v-model="passwordForm.confirmPassword"
                required
                class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div class="flex justify-between items-center">
              <button
                type="submit"
                :disabled="isChangingPassword || !isPasswordFormValid"
                class="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {{ isChangingPassword ? 'Changing...' : 'Change Password' }}
              </button>
            </div>
          </form>
        </div>

        <!-- Security Information -->
        <div class="bg-white shadow rounded-lg p-6">
          <h2 class="text-xl font-semibold text-gray-900 mb-4">Security Information</h2>
          <div class="space-y-3">
            <div class="flex items-center text-sm text-gray-600">
              <span class="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
              Account lockout protection enabled (5 failed attempts)
            </div>
            <div class="flex items-center text-sm text-gray-600">
              <span class="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
              Password history tracking (last 5 passwords)
            </div>
            <div class="flex items-center text-sm text-gray-600">
              <span class="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
              Session timeout protection (1 hour)
            </div>
            <div class="flex items-center text-sm text-gray-600">
              <span class="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
              Comprehensive audit logging enabled
            </div>
          </div>
        </div>

        <!-- Success/Error Messages -->
        <div v-if="message" class="fixed top-4 right-4 max-w-sm">
          <div :class="messageClass" class="rounded-md p-4 shadow-lg">
            <p class="text-sm">{{ message }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '../stores/auth'

const authStore = useAuthStore()
const user = computed(() => authStore.user)

const passwordForm = ref({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
})

const isChangingPassword = ref(false)
const message = ref('')
const messageType = ref('')

const isPasswordFormValid = computed(() => {
  return passwordForm.value.currentPassword &&
         passwordForm.value.newPassword &&
         passwordForm.value.confirmPassword &&
         passwordForm.value.newPassword === passwordForm.value.confirmPassword &&
         passwordForm.value.newPassword.length >= 12
})

const messageClass = computed(() => {
  return messageType.value === 'success' 
    ? 'bg-green-50 border border-green-200 text-green-800'
    : 'bg-red-50 border border-red-200 text-red-800'
})

const formatDate = (dateString) => {
  if (!dateString) return 'Never'
  return new Date(dateString).toLocaleString()
}

const changePassword = async () => {
  if (!isPasswordFormValid.value) return

  isChangingPassword.value = true
  message.value = ''

  try {
    const response = await fetch('/api/auth/change-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authStore.token}`
      },
      body: JSON.stringify({
        currentPassword: passwordForm.value.currentPassword,
        newPassword: passwordForm.value.newPassword
      })
    })

    const data = await response.json()

    if (response.ok) {
      message.value = 'Password changed successfully!'
      messageType.value = 'success'
      passwordForm.value = {
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      }
    } else {
      message.value = data.message || 'Failed to change password'
      messageType.value = 'error'
    }
  } catch (error) {
    message.value = 'An error occurred while changing password'
    messageType.value = 'error'
  } finally {
    isChangingPassword.value = false
    setTimeout(() => {
      message.value = ''
    }, 5000)
  }
}

onMounted(() => {
  if (!user.value) {
    authStore.fetchUser()
  }
})
</script>
