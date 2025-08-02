<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-md w-full space-y-8">
      <div>
        <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Change Password
        </h2>
        <p class="mt-2 text-center text-sm text-gray-600">
          For security, you'll be signed out after changing your password.
        </p>
      </div>
      
      <form class="mt-8 space-y-6" @submit.prevent="handleChangePassword">
        <div class="rounded-md shadow-sm -space-y-px">
          <div>
            <label for="currentPassword" class="sr-only">Current Password</label>
            <input
              id="currentPassword"
              name="currentPassword"
              type="password"
              required
              class="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
              placeholder="Current Password"
              v-model="form.currentPassword"
            />
          </div>
          
          <div>
            <label for="newPassword" class="sr-only">New Password</label>
            <input
              id="newPassword"
              name="newPassword"
              type="password"
              required
              class="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
              placeholder="New Password"
              v-model="form.newPassword"
            />
          </div>
          
          <div>
            <label for="confirmPassword" class="sr-only">Confirm New Password</label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              required
              class="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
              placeholder="Confirm New Password"
              v-model="form.confirmPassword"
            />
          </div>
        </div>

        <div v-if="error" class="text-red-600 text-sm text-center">
          {{ error }}
        </div>
        
        <div v-if="success" class="text-green-600 text-sm text-center">
          {{ success }}
        </div>

        <div>
          <button
            type="submit"
            :disabled="isLoading"
            class="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            <span v-if="!isLoading">Change Password</span>
            <span v-else>Processing...</span>
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const form = ref({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
})
const error = ref('')
const success = ref('')
const isLoading = ref(false)

const handleChangePassword = async () => {
  error.value = ''
  success.value = ''
  
  // Frontend validation
  if (!form.value.currentPassword || !form.value.newPassword || !form.value.confirmPassword) {
    error.value = 'All fields are required'
    return
  }
  
  if (form.value.newPassword !== form.value.confirmPassword) {
    error.value = 'New passwords do not match'
    return
  }
  
  if (form.value.newPassword.length < 12) {
    error.value = 'Password must be at least 12 characters long'
    return
  }
  
  if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/.test(form.value.newPassword)) {
    error.value = 'Password must contain uppercase, lowercase, numbers, and special characters'
    return
  }

  isLoading.value = true

  try {
    const token = localStorage.getItem('token')
    const response = await fetch('http://localhost:5000/api/users/change-password', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        currentPassword: form.value.currentPassword,
        newPassword: form.value.newPassword,
        confirmPassword: form.value.confirmPassword
      })
    })

    const data = await response.json()

    if (!response.ok) {
      error.value = data.message || 'Password change failed'
      return
    }

    success.value = data.message
    
    // Clear local storage and redirect to login
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    
    // Show success message briefly before redirect
    setTimeout(() => {
      router.push('/login')
    }, 2000)

  } catch (err) {
    error.value = 'Unable to change password. Please try again.'
    console.error('Password change error:', err)
  } finally {
    isLoading.value = false
  }
}
</script>
