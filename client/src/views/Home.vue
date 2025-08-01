<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Navigation -->
    <nav class="bg-white shadow-sm">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between h-16">
          <div class="flex items-center">
            <h1 class="text-xl font-bold text-gray-900">Secure LMS</h1>
          </div>
          <div class="flex items-center space-x-4">
            <router-link
              v-if="!authStore.isAuthenticated"
              to="/login"
              class="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
            >
              Login
            </router-link>
            <router-link
              v-if="!authStore.isAuthenticated"
              to="/register"
              class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
            >
              Register
            </router-link>
          </div>
        </div>
      </div>
    </nav>

    <!-- Hero Section -->
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div class="text-center">
        <h1 class="text-4xl font-bold text-gray-900 sm:text-5xl">
          Secure Learning Management System
        </h1>
        <p class="mt-3 max-w-md mx-auto text-base text-gray-500 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
          A comprehensive, secure platform for online education with role-based access control.
        </p>
        <div class="mt-5 max-w-md mx-auto sm:flex sm:justify-center md:mt-8">
          <div class="rounded-md shadow">
            <router-link
              to="/login"
              class="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              Get Started
            </router-link>
          </div>
        </div>
      </div>

      <!-- Demo Accounts Section -->
      <div class="mt-16 bg-white rounded-lg shadow px-6 py-8">
        <h3 class="text-lg font-medium text-gray-900 mb-4">Demo Accounts</h3>
        <p class="text-gray-600 mb-6">Try the system with these pre-configured demo accounts:</p>
        
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div class="border rounded-lg p-4">
            <h4 class="font-semibold text-gray-900">Admin</h4>
            <p class="text-sm text-gray-600 mt-1">Full system access</p>
            <div class="mt-3 text-sm">
              <p><strong>Email:</strong> admin@lms.edu</p>
              <p><strong>Password:</strong> AdminPass123!</p>
            </div>
          </div>
          
          <div class="border rounded-lg p-4">
            <h4 class="font-semibold text-gray-900">Instructor</h4>
            <p class="text-sm text-gray-600 mt-1">Course management</p>
            <div class="mt-3 text-sm">
              <p><strong>Email:</strong> instructor@lms.edu</p>
              <p><strong>Password:</strong> InstructorPass123!</p>
            </div>
          </div>
          
          <div class="border rounded-lg p-4">
            <h4 class="font-semibold text-gray-900">Student</h4>
            <p class="text-sm text-gray-600 mt-1">Course enrollment</p>
            <div class="mt-3 text-sm">
              <p><strong>Email:</strong> student@lms.edu</p>
              <p><strong>Password:</strong> StudentPass123!</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useAuthStore } from '../stores/auth'

const authStore = useAuthStore()
</script>
