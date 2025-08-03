<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-md w-full space-y-8">
      <div>
        <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Create your account
        </h2>
        <p class="mt-2 text-center text-sm text-gray-600">
          Or
          <router-link to="/login" class="font-medium text-blue-600 hover:text-blue-500">
            sign in to your existing account
          </router-link>
        </p>
      </div>

      <form class="mt-8 space-y-6" @submit.prevent="handleRegister">
        <div class="space-y-4">
          <!-- Username -->
          <div>
            <label for="username" class="block text-sm font-medium text-gray-700">
              Username
            </label>
            <input
              id="username"
              v-model="form.username"
              name="username"
              type="text"
              required
              class="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
              placeholder="Choose a username"
            />
          </div>

          <!-- Email -->
          <div>
            <label for="email" class="block text-sm font-medium text-gray-700">
              Email address
            </label>
            <input
              id="email"
              v-model="form.email"
              name="email"
              type="email"
              required
              class="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
              placeholder="your@email.com"
            />
          </div>

          <!-- First Name -->
          <div>
            <label for="firstName" class="block text-sm font-medium text-gray-700">
              First Name
            </label>
            <input
              id="firstName"
              v-model="form.firstName"
              name="firstName"
              type="text"
              required
              class="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
              placeholder="John"
            />
          </div>

          <!-- Last Name -->
          <div>
            <label for="lastName" class="block text-sm font-medium text-gray-700">
              Last Name
            </label>
            <input
              id="lastName"
              v-model="form.lastName"
              name="lastName"
              type="text"
              required
              class="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
              placeholder="Doe"
            />
          </div>

          <!-- Role -->
          <div>
            <label for="role" class="block text-sm font-medium text-gray-700">
              Account Type
            </label>
            <select
              id="role"
              v-model="form.role"
              name="role"
              required
              class="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
            >
              <option value="">Select account type</option>
              <option value="student">Student</option>
              <option value="instructor">Instructor</option>
            </select>
          </div>

          <!-- Password -->
          <div>
            <label for="password" class="block text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              id="password"
              v-model="form.password"
              name="password"
              type="password"
              required
              class="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
              placeholder="Create a strong password"
            />
            <p class="mt-1 text-xs text-gray-500">
              Must be at least 12 characters with uppercase, lowercase, numbers, and symbols
            </p>
          </div>

          <!-- Confirm Password -->
          <div>
            <label for="confirmPassword" class="block text-sm font-medium text-gray-700">
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              v-model="form.confirmPassword"
              name="confirmPassword"
              type="password"
              required
              class="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
              placeholder="Confirm your password"
            />
          </div>
        </div>

        <!-- Terms and Privacy -->
        <div class="flex items-start">
          <div class="flex items-center h-5">
            <input
              id="terms"
              v-model="form.acceptTerms"
              name="terms"
              type="checkbox"
              required
              class="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
            />
          </div>
          <div class="ml-3 text-sm">
            <label for="terms" class="font-medium text-gray-700">
              I agree to the 
              <a href="#" class="text-blue-600 hover:text-blue-500">Terms of Service</a> and 
              <a href="#" class="text-blue-600 hover:text-blue-500">Privacy Policy</a>
            </label>
          </div>
        </div>

        <!-- Error Display -->
        <div v-if="error" class="text-red-600 text-sm text-center">
          {{ error }}
        </div>

        <!-- Success Message -->
        <div v-if="success" class="text-green-600 text-sm text-center">
          {{ success }}
        </div>

        <!-- Submit Button -->
        <div>
          <button
            type="submit"
            :disabled="isLoading || !form.acceptTerms"
            class="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {{ isLoading ? 'Creating account...' : 'Create account' }}
          </button>
        </div>
      </form>

      <!-- Demo Accounts -->
      <div class="mt-8 bg-gray-100 rounded-lg p-4">
        <h3 class="text-sm font-medium text-gray-900 mb-3">Demo Accounts:</h3>
        <div class="space-y-2 text-xs text-gray-600">
          <div>
            <strong>Admin:</strong> admin@lms.edu / AdminPass123!
          </div>
          <div>
            <strong>Instructor:</strong> instructor@lms.edu / InstructorPass123!
          </div>
          <div>
            <strong>Student:</strong> student@lms.edu / StudentPass123!
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const form = reactive({
  username: '',
  email: '',
  firstName: '',
  lastName: '',
  role: '',
  password: '',
  confirmPassword: '',
  acceptTerms: false
})

const isLoading = ref(false)
const error = ref('')
const success = ref('')

const handleRegister = async () => {
  error.value = ''
  success.value = ''

  // Frontend validation
  if (!form.username.trim()) {
    error.value = 'Username is required'
    return
  }

  if (form.username.length < 3) {
    error.value = 'Username must be at least 3 characters long'
    return
  }

  if (!form.email.trim()) {
    error.value = 'Email is required'
    return
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
    error.value = 'Please enter a valid email address'
    return
  }

  if (!form.firstName.trim()) {
    error.value = 'First name is required'
    return
  }

  if (!form.lastName.trim()) {
    error.value = 'Last name is required'
    return
  }

  if (!form.role) {
    error.value = 'Please select an account type'
    return
  }

  if (form.password.length < 12) {
    error.value = 'Password must be at least 12 characters long'
    return
  }

  if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/.test(form.password)) {
    error.value = 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&)'
    return
  }

  // Check for common weak passwords
  const commonPasswords = [
    'password123!', 'Password123!', 'Admin123456!', 'Welcome123!',
    'Qwerty123456!', '123456789!', 'Password1!', 'Admin1234!'
  ];
  if (commonPasswords.includes(form.password)) {
    error.value = 'Password is too common. Please choose a more secure password';
    return;
  }

  // Check for sequential characters
  if (/123456|abcdef|qwerty/i.test(form.password)) {
    error.value = 'Password cannot contain sequential characters';
    return;
  }

  if (form.password !== form.confirmPassword) {
    error.value = 'Passwords do not match'
    return
  }

  if (!form.acceptTerms) {
    error.value = 'You must accept the terms and privacy policy'
    return
  }

  isLoading.value = true

  try {
    const response = await fetch('http://localhost:3001/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: form.username.trim(),
        email: form.email.trim().toLowerCase(),
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        role: form.role,
        password: form.password,
        confirmPassword: form.confirmPassword,
        acceptTerms: form.acceptTerms,
        acceptPrivacy: form.acceptTerms
      })
    })

    const data = await response.json()

    if (!response.ok) {
      error.value = data.message || 'Registration failed'
      return
    }

    success.value = 'Account created successfully! Redirecting...'
    
    // Store token and user info
    localStorage.setItem('token', data.token)
    
    // Redirect based on role after brief delay
    setTimeout(() => {
      const roleRedirects = {
        admin: '/admin',
        instructor: '/instructor',
        student: '/student'
      }
      const redirectPath = roleRedirects[data.user.role] || '/dashboard'
      router.push(redirectPath)
    }, 1500)

  } catch (err) {
    error.value = 'Registration failed. Please try again.'
    console.error('Registration error:', err)
  } finally {
    isLoading.value = false
  }
}
</script>
