<template>
  <div class="min-h-screen bg-gray-50">
    <div class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div class="px-4 py-6 sm:px-0">
        <!-- Header -->
        <div class="mb-8">
          <h1 class="text-3xl font-bold text-gray-900">Instructor Dashboard</h1>
          <p class="mt-1 text-sm text-gray-600">Manage your courses, assignments, and student progress</p>
        </div>

        <!-- Stats Overview -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div class="bg-white overflow-hidden shadow rounded-lg p-5">
            <div class="flex items-center">
              <div class="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                <span class="text-white text-sm">📚</span>
              </div>
              <div class="ml-5">
                <p class="text-sm font-medium text-gray-500">Total Courses</p>
                <p class="text-lg font-medium text-gray-900">{{ stats.totalCourses }}</p>
              </div>
            </div>
          </div>

          <div class="bg-white overflow-hidden shadow rounded-lg p-5">
            <div class="flex items-center">
              <div class="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                <span class="text-white text-sm">👥</span>
              </div>
              <div class="ml-5">
                <p class="text-sm font-medium text-gray-500">Total Students</p>
                <p class="text-lg font-medium text-gray-900">{{ stats.totalStudents }}</p>
              </div>
            </div>
          </div>

          <div class="bg-white overflow-hidden shadow rounded-lg p-5">
            <div class="flex items-center">
              <div class="w-8 h-8 bg-yellow-500 rounded-md flex items-center justify-center">
                <span class="text-white text-sm">📝</span>
              </div>
              <div class="ml-5">
                <p class="text-sm font-medium text-gray-500">Assignments</p>
                <p class="text-lg font-medium text-gray-900">{{ stats.totalAssignments }}</p>
              </div>
            </div>
          </div>

          <div class="bg-white overflow-hidden shadow rounded-lg p-5">
            <div class="flex items-center">
              <div class="w-8 h-8 bg-red-500 rounded-md flex items-center justify-center">
                <span class="text-white text-sm">⏰</span>
              </div>
              <div class="ml-5">
                <p class="text-sm font-medium text-gray-500">Pending Reviews</p>
                <p class="text-lg font-medium text-gray-900">{{ stats.pendingReviews }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Main Content Grid -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <!-- My Courses -->
          <div class="bg-white shadow rounded-lg">
            <div class="px-6 py-4 border-b border-gray-200">
              <div class="flex items-center justify-between">
                <h3 class="text-lg font-medium text-gray-900">My Courses</h3>
                <button
                  @click="$router.push('/courses')"
                  class="text-sm text-indigo-600 hover:text-indigo-900"
                >
                  View All
                </button>
              </div>
            </div>
            <div class="p-6">
              <div v-if="loading" class="text-center py-4">
                <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                <p class="mt-2 text-sm text-gray-600">Loading courses...</p>
              </div>
              <div v-else-if="courses.length === 0" class="text-center py-8">
                <h3 class="text-sm font-medium text-gray-900">No courses</h3>
                <p class="mt-1 text-sm text-gray-500">Get started by creating your first course.</p>
              </div>
              <div v-else class="space-y-4">
                <div v-for="course in courses" :key="course._id" class="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 cursor-pointer">
                  <div class="flex items-center justify-between">
                    <div>
                      <h4 class="text-sm font-medium text-gray-900">{{ course.title }}</h4>
                      <p class="text-sm text-gray-500">{{ course.code }}</p>
                      <p class="text-xs text-gray-400 mt-1">{{ course.students?.length || 0 }} students enrolled</p>
                    </div>
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Active
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Recent Assignments -->
          <div class="bg-white shadow rounded-lg">
            <div class="px-6 py-4 border-b border-gray-200">
              <div class="flex items-center justify-between">
                <h3 class="text-lg font-medium text-gray-900">Recent Assignments</h3>
                <button
                  @click="$router.push('/assignments')"
                  class="text-sm text-indigo-600 hover:text-indigo-900"
                >
                  View All
                </button>
              </div>
            </div>
            <div class="p-6">
              <div v-if="loading" class="text-center py-4">
                <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600 mx-auto"></div>
                <p class="mt-2 text-sm text-gray-600">Loading assignments...</p>
              </div>
              <div v-else-if="assignments.length === 0" class="text-center py-8">
                <h3 class="text-sm font-medium text-gray-900">No assignments</h3>
                <p class="mt-1 text-sm text-gray-500">Create your first assignment.</p>
              </div>
              <div v-else class="space-y-4">
                <div v-for="assignment in assignments" :key="assignment._id" class="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                  <div class="flex items-center justify-between">
                    <div>
                      <h4 class="text-sm font-medium text-gray-900">{{ assignment.title }}</h4>
                      <p class="text-sm text-gray-500">{{ assignment.course?.title }}</p>
                      <p class="text-xs text-gray-400 mt-1">Due: {{ new Date(assignment.dueDate).toLocaleDateString() }}</p>
                    </div>
                    <span class="text-xs text-gray-500">{{ (assignment.submissions?.length || 0) }} submissions</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Quick Actions -->
        <div class="mt-8">
          <div class="bg-white shadow rounded-lg">
            <div class="px-6 py-4 border-b border-gray-200">
              <h3 class="text-lg font-medium text-gray-900">Quick Actions</h3>
            </div>
            <div class="p-6">
              <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                  @click="$router.push('/courses/create')"
                  class="flex items-center justify-center px-4 py-3 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  <span class="mr-2">📚</span>
                  Create Course
                </button>
                <button
                  @click="$router.push('/assignments/create')"
                  class="flex items-center justify-center px-4 py-3 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  <span class="mr-2">📝</span>
                  Create Assignment
                </button>
                <button
                  @click="$router.push('/courses')"
                  class="flex items-center justify-center px-4 py-3 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  <span class="mr-2">👥</span>
                  Manage Students
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useAuthStore } from '../stores/auth'
import axios from 'axios'

const authStore = useAuthStore()
const loading = ref(false)

// API base URL
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'

const stats = ref({
  totalCourses: 0,
  totalStudents: 0,
  totalAssignments: 0,
  pendingReviews: 0
})
const courses = ref([])
const assignments = ref([])

const fetchDashboardData = async () => {
  try {
    loading.value = true
    
    console.log('=== INSTRUCTOR DASHBOARD DEBUG ===')
    console.log('Auth store user:', authStore.user)
    console.log('Auth store token:', authStore.token ? 'Present' : 'Missing')
    console.log('User role:', authStore.user?.role)
    console.log('User ID:', authStore.user?.userId || authStore.user?.id || authStore.user?._id)
    console.log('API Base URL:', API_BASE)
    
    // Fetch courses, assignments, and other data
    const [coursesResponse, assignmentsResponse] = await Promise.all([
      axios.get(`${API_BASE}/courses`, {
        headers: { Authorization: `Bearer ${authStore.token}` }
      }),
      axios.get(`${API_BASE}/assignments`, {
        headers: { Authorization: `Bearer ${authStore.token}` }
      })
    ])

    console.log('=== API RESPONSES ===')
    console.log('Courses response status:', coursesResponse.status)
    console.log('Courses response data:', coursesResponse.data)
    console.log('Number of courses returned:', coursesResponse.data?.length || 0)
    console.log('Assignments response status:', assignmentsResponse.status)
    console.log('Assignments response data:', assignmentsResponse.data)
    console.log('Number of assignments returned:', assignmentsResponse.data?.length || 0)

    courses.value = coursesResponse.data || []
    assignments.value = assignmentsResponse.data || []
    
    // Calculate stats
    stats.value.totalCourses = courses.value.length
    stats.value.totalAssignments = assignments.value.length
    stats.value.totalStudents = courses.value.reduce((total, course) => total + (course.students?.length || 0), 0)
    stats.value.pendingReviews = assignments.value.filter(a => a.needsReview).length || 0
    
    console.log('=== CALCULATED STATS ===')
    console.log('Final stats:', stats.value)
    console.log('Final courses array:', courses.value)
    console.log('Final assignments array:', assignments.value)
    
  } catch (error) {
    console.error('=== ERROR FETCHING DASHBOARD DATA ===')
    console.error('Error object:', error)
    console.error('Error response:', error.response?.data)
    console.error('Error status:', error.response?.status)
    console.error('Error headers:', error.response?.headers)
    console.error('Request config:', error.config)
    // Set default values on error
    courses.value = []
    assignments.value = []
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchDashboardData()
})
</script>
