<template>
  <div class="min-h-screen bg-gray-50">
    <div class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div class="px-4 py-6 sm:px-0">
        <!-- Header -->
        <div class="mb-8">
          <h1 class="text-3xl font-bold text-gray-900">Student Dashboard</h1>
          <p class="mt-1 text-sm text-gray-600">Your courses, assignments, and academic progress</p>
        </div>

        <!-- Stats Overview -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div class="bg-white overflow-hidden shadow rounded-lg p-5">
            <div class="flex items-center">
              <div class="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                <span class="text-white text-sm">📚</span>
              </div>
              <div class="ml-5">
                <p class="text-sm font-medium text-gray-500">Enrolled Courses</p>
                <p class="text-lg font-medium text-gray-900">{{ stats.enrolledCourses }}</p>
              </div>
            </div>
          </div>

          <div class="bg-white overflow-hidden shadow rounded-lg p-5">
            <div class="flex items-center">
              <div class="w-8 h-8 bg-yellow-500 rounded-md flex items-center justify-center">
                <span class="text-white text-sm">📝</span>
              </div>
              <div class="ml-5">
                <p class="text-sm font-medium text-gray-500">Pending Assignments</p>
                <p class="text-lg font-medium text-gray-900">{{ stats.pendingAssignments }}</p>
              </div>
            </div>
          </div>

          <div class="bg-white overflow-hidden shadow rounded-lg p-5">
            <div class="flex items-center">
              <div class="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                <span class="text-white text-sm">✅</span>
              </div>
              <div class="ml-5">
                <p class="text-sm font-medium text-gray-500">Completed</p>
                <p class="text-lg font-medium text-gray-900">{{ stats.completedAssignments }}</p>
              </div>
            </div>
          </div>

          <div class="bg-white overflow-hidden shadow rounded-lg p-5">
            <div class="flex items-center">
              <div class="w-8 h-8 bg-purple-500 rounded-md flex items-center justify-center">
                <span class="text-white text-sm">📊</span>
              </div>
              <div class="ml-5">
                <p class="text-sm font-medium text-gray-500">Average Grade</p>
                <p class="text-lg font-medium text-gray-900">{{ stats.averageGrade }}%</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Main Content Grid -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <!-- My Courses -->
          <div class="bg-white shadow rounded-lg">
            <div class="px-6 py-4 border-b border-gray-200">
              <h3 class="text-lg font-medium text-gray-900">My Courses</h3>
            </div>
            <div class="p-6">
              <div v-if="loading" class="text-center py-4">
                <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                <p class="mt-2 text-sm text-gray-600">Loading courses...</p>
              </div>
              <div v-else-if="courses.length === 0" class="text-center py-8">
                <h3 class="text-sm font-medium text-gray-900">No courses enrolled</h3>
                <p class="mt-1 text-sm text-gray-500">Contact your administrator to enroll in courses.</p>
              </div>
              <div v-else class="space-y-4">
                <div v-for="course in courses" :key="course._id" class="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 cursor-pointer" @click="viewCourse(course._id)">
                  <div class="flex items-center justify-between">
                    <div>
                      <h4 class="text-sm font-medium text-gray-900">{{ course.title }}</h4>
                      <p class="text-sm text-gray-500">{{ course.code }}</p>
                      <p class="text-xs text-gray-400 mt-1">Instructor: {{ course.instructor?.firstName }} {{ course.instructor?.lastName }}</p>
                    </div>
                    <div class="text-right">
                      <p class="text-sm font-medium text-gray-900">{{ course.progress || 0 }}%</p>
                      <p class="text-xs text-gray-500">Progress</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Upcoming Assignments -->
          <div class="bg-white shadow rounded-lg">
            <div class="px-6 py-4 border-b border-gray-200">
              <h3 class="text-lg font-medium text-gray-900">Upcoming Assignments</h3>
            </div>
            <div class="p-6">
              <div v-if="loading" class="text-center py-4">
                <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-yellow-600 mx-auto"></div>
                <p class="mt-2 text-sm text-gray-600">Loading assignments...</p>
              </div>
              <div v-else-if="upcomingAssignments.length === 0" class="text-center py-8">
                <h3 class="text-sm font-medium text-gray-900">No upcoming assignments</h3>
                <p class="mt-1 text-sm text-gray-500">You're all caught up!</p>
              </div>
              <div v-else class="space-y-4">
                <div v-for="assignment in upcomingAssignments" :key="assignment._id" class="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                  <div class="flex items-center justify-between">
                    <div>
                      <h4 class="text-sm font-medium text-gray-900">{{ assignment.title }}</h4>
                      <p class="text-sm text-gray-500">{{ assignment.course?.title }}</p>
                      <p class="text-xs text-gray-400 mt-1">Due: {{ new Date(assignment.dueDate).toLocaleDateString() }}</p>
                    </div>
                    <div class="text-right">
                      <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        Due Soon
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
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import axios from 'axios'

const router = useRouter()
const authStore = useAuthStore()

// API base URL
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

// Reactive data
const loading = ref(false)
const courses = ref([])
const upcomingAssignments = ref([])

const stats = reactive({
  enrolledCourses: 0,
  pendingAssignments: 0,
  completedAssignments: 0,
  averageGrade: 0
})

// Fetch student's enrolled courses
const fetchCourses = async () => {
  loading.value = true
  try {
    const response = await axios.get('/courses/student', {
      headers: {
        'Authorization': `Bearer ${authStore.token}`
      }
    })
    courses.value = response.data
    stats.enrolledCourses = courses.value.length
  } catch (error) {
    console.error('Error fetching courses:', error)
    courses.value = []
  } finally {
    loading.value = false
  }
}

// Fetch upcoming assignments
const fetchUpcomingAssignments = async () => {
  try {
    const response = await axios.get(`${API_BASE}/assignments/student/upcoming`, {
      headers: {
        'Authorization': `Bearer ${authStore.token}`
      }
    })
    upcomingAssignments.value = response.data
    stats.pendingAssignments = upcomingAssignments.value.length
  } catch (error) {
    console.error('Error fetching assignments:', error)
    upcomingAssignments.value = []
  }
}

// Fetch student statistics
const fetchStats = async () => {
  try {
    const response = await axios.get(`${API_BASE}/students/stats`, {
      headers: {
        'Authorization': `Bearer ${authStore.token}`
      }
    })
    const data = response.data
    stats.completedAssignments = data.completedAssignments || 0
    stats.averageGrade = data.averageGrade || 0
  } catch (error) {
    console.error('Error fetching stats:', error)
  }
}

// Navigate to course detail
const viewCourse = (courseId) => {
  router.push(`/courses/${courseId}`)
}

// Load data on component mount
onMounted(async () => {
  await Promise.all([
    fetchCourses(),
    fetchUpcomingAssignments(),
    fetchStats()
  ])
})
</script>
