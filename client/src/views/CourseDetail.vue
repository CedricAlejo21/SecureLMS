<template>
  <div class="min-h-screen bg-gray-50">
    <div class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div class="px-4 py-6 sm:px-0">
        <!-- Loading State -->
        <div v-if="loading" class="text-center py-12">
          <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p class="mt-4 text-sm text-gray-600">Loading course details...</p>
        </div>

        <!-- Course Not Found -->
        <div v-else-if="!course" class="text-center py-12">
          <h2 class="text-2xl font-bold text-gray-900">Course Not Found</h2>
          <p class="mt-2 text-sm text-gray-600">The course you're looking for doesn't exist or you don't have access to it.</p>
          <button @click="goBack" class="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium">
            Go Back
          </button>
        </div>

        <!-- Course Content -->
        <div v-else>
          <!-- Course Header -->
          <div class="bg-white shadow rounded-lg mb-8">
            <div class="px-6 py-8">
              <div class="flex items-center justify-between">
                <div>
                  <h1 class="text-3xl font-bold text-gray-900">{{ course.title }}</h1>
                  <p class="mt-1 text-lg text-gray-600">{{ course.code }}</p>
                  <p class="mt-2 text-sm text-gray-500">{{ course.description }}</p>
                  <div class="mt-4 flex items-center space-x-4">
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {{ course.credits }} Credits
                    </span>
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      {{ course.semester }}
                    </span>
                    <span class="text-sm text-gray-500">
                      Instructor: {{ course.instructor?.firstName }} {{ course.instructor?.lastName }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Course Stats -->
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div class="bg-white overflow-hidden shadow rounded-lg p-6">
              <div class="flex items-center">
                <div class="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                  <span class="text-white text-sm">👥</span>
                </div>
                <div class="ml-4">
                  <p class="text-sm font-medium text-gray-500">Enrolled Students</p>
                  <p class="text-2xl font-bold text-gray-900">{{ course.students?.length || 0 }}</p>
                </div>
              </div>
            </div>

            <div class="bg-white overflow-hidden shadow rounded-lg p-6">
              <div class="flex items-center">
                <div class="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                  <span class="text-white text-sm">📝</span>
                </div>
                <div class="ml-4">
                  <p class="text-sm font-medium text-gray-500">Assignments</p>
                  <p class="text-2xl font-bold text-gray-900">{{ assignments.length }}</p>
                </div>
              </div>
            </div>

            <div class="bg-white overflow-hidden shadow rounded-lg p-6">
              <div class="flex items-center">
                <div class="w-8 h-8 bg-purple-500 rounded-md flex items-center justify-center">
                  <span class="text-white text-sm">📊</span>
                </div>
                <div class="ml-4">
                  <p class="text-sm font-medium text-gray-500">Average Grade</p>
                  <p class="text-2xl font-bold text-gray-900">{{ course.averageGrade || 0 }}%</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Assignments Section -->
          <div class="bg-white shadow rounded-lg">
            <div class="px-6 py-4 border-b border-gray-200">
              <h3 class="text-lg font-medium text-gray-900">Assignments</h3>
            </div>
            <div class="p-6">
              <div v-if="assignments.length === 0" class="text-center py-8">
                <h4 class="text-sm font-medium text-gray-900">No assignments yet</h4>
                <p class="mt-1 text-sm text-gray-500">Assignments will appear here when created.</p>
              </div>
              <div v-else class="space-y-4">
                <div v-for="assignment in assignments" :key="assignment._id" class="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                  <div class="flex items-center justify-between">
                    <div>
                      <h4 class="text-sm font-medium text-gray-900">{{ assignment.title }}</h4>
                      <p class="text-sm text-gray-500 mt-1">{{ assignment.description }}</p>
                      <div class="mt-2 flex items-center space-x-4">
                        <span class="text-xs text-gray-500">Due: {{ new Date(assignment.dueDate).toLocaleDateString() }}</span>
                        <span class="text-xs text-gray-500">Points: {{ assignment.points }}</span>
                      </div>
                    </div>
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Published
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import axios from 'axios'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

// Reactive data
const course = ref(null)
const assignments = ref([])
const loading = ref(true)
const error = ref('')

// Computed properties
const isAdmin = computed(() => authStore.user?.role === 'admin')
const isInstructor = computed(() => authStore.user?.role === 'instructor')
const isEnrolled = computed(() => {
  if (!course.value || !authStore.user) return false
  return course.value.students?.some(student => student._id === authStore.user.id)
})

// Methods
const fetchCourseDetails = async () => {
  try {
    loading.value = true
    error.value = ''
    
    const response = await axios.get(`/courses/${route.params.id}`, {
      headers: {
        'Authorization': `Bearer ${authStore.token}`
      }
    })
    
    course.value = response.data
    assignments.value = response.data.assignments || []
    
  } catch (err) {
    console.error('Error fetching course details:', err)
    error.value = err.response?.data?.message || 'Failed to load course details'
    course.value = null
  } finally {
    loading.value = false
  }
}

const goBack = () => {
  router.go(-1)
}

// Lifecycle
onMounted(() => {
  fetchCourseDetails()
})
</script>
