<template>
  <div class="min-h-screen bg-gray-50">
    <div class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div class="px-4 py-6 sm:px-0">
        <!-- Header -->
        <div class="mb-8">
          <h1 class="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p class="mt-1 text-sm text-gray-600">System overview and administrative controls</p>
        </div>

        <!-- Stats Overview -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div class="bg-white overflow-hidden shadow rounded-lg p-5">
            <div class="flex items-center">
              <div class="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                <span class="text-white text-sm">👥</span>
              </div>
              <div class="ml-5">
                <p class="text-sm font-medium text-gray-500">Total Users</p>
                <p class="text-lg font-medium text-gray-900">{{ stats.totalUsers }}</p>
              </div>
            </div>
          </div>

          <div class="bg-white overflow-hidden shadow rounded-lg p-5">
            <div class="flex items-center">
              <div class="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                <span class="text-white text-sm">📚</span>
              </div>
              <div class="ml-5">
                <p class="text-sm font-medium text-gray-500">Active Courses</p>
                <p class="text-lg font-medium text-gray-900">{{ stats.activeCourses }}</p>
              </div>
            </div>
          </div>

          <div class="bg-white overflow-hidden shadow rounded-lg p-5">
            <div class="flex items-center">
              <div class="w-8 h-8 bg-yellow-500 rounded-md flex items-center justify-center">
                <span class="text-white text-sm">🔒</span>
              </div>
              <div class="ml-5">
                <p class="text-sm font-medium text-gray-500">Security Events</p>
                <p class="text-lg font-medium text-gray-900">{{ stats.securityEvents }}</p>
              </div>
            </div>
          </div>

          <div class="bg-white overflow-hidden shadow rounded-lg p-5">
            <div class="flex items-center">
              <div class="w-8 h-8 bg-purple-500 rounded-md flex items-center justify-center">
                <span class="text-white text-sm">⚡</span>
              </div>
              <div class="ml-5">
                <p class="text-sm font-medium text-gray-500">System Status</p>
                <p class="text-lg font-medium text-green-600">Online</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Main Content Grid -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <!-- Recent Users -->
          <div class="bg-white shadow rounded-lg">
            <div class="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h3 class="text-lg font-medium text-gray-900">Recent Users</h3>
              <button
                @click="$router.push('/users')"
                class="text-sm text-indigo-600 hover:text-indigo-900"
              >
                View All
              </button>
            </div>
            <div class="p-6">
              <div v-if="loading" class="text-center py-4">
                <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                <p class="mt-2 text-sm text-gray-600">Loading users...</p>
              </div>
              <div v-else-if="users.length === 0" class="text-center py-8">
                <h3 class="text-sm font-medium text-gray-900">No users found</h3>
                <p class="mt-1 text-sm text-gray-500">Users will appear here once created.</p>
              </div>
              <div v-else class="space-y-4">
                <div v-for="user in users.slice(0, 5)" :key="user._id" class="flex items-center justify-between border border-gray-200 rounded-lg p-4">
                  <div class="flex items-center">
                    <div class="w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center">
                      <span class="text-xs font-medium text-white">
                        {{ user.firstName?.[0] }}{{ user.lastName?.[0] }}
                      </span>
                    </div>
                    <div class="ml-3">
                      <p class="text-sm font-medium text-gray-900">{{ user.firstName }} {{ user.lastName }}</p>
                      <p class="text-xs text-gray-500">{{ user.role }}</p>
                    </div>
                  </div>
                  <span :class="[
                    'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                    user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  ]">
                    {{ user.isActive ? 'Active' : 'Inactive' }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- Recent Courses -->
          <div class="bg-white shadow rounded-lg">
            <div class="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h3 class="text-lg font-medium text-gray-900">Recent Courses</h3>
              <button
                @click="$router.push('/courses')"
                class="text-sm text-indigo-600 hover:text-indigo-900"
              >
                View All
              </button>
            </div>
            <div class="p-6">
              <div v-if="loading" class="text-center py-4">
                <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600 mx-auto"></div>
                <p class="mt-2 text-sm text-gray-600">Loading courses...</p>
              </div>
              <div v-else-if="courses.length === 0" class="text-center py-8">
                <h3 class="text-sm font-medium text-gray-900">No courses found</h3>
                <p class="mt-1 text-sm text-gray-500">Courses will appear here once created.</p>
              </div>
              <div v-else class="space-y-4">
                <div v-for="course in courses.slice(0, 5)" :key="course._id" class="border border-gray-200 rounded-lg p-4">
                  <div class="flex items-center justify-between">
                    <div>
                      <h4 class="text-sm font-medium text-gray-900">{{ course.title }}</h4>
                      <p class="text-xs text-gray-500">{{ course.instructor?.firstName }} {{ course.instructor?.lastName }}</p>
                      <p class="text-xs text-gray-400 mt-1">{{ course.students?.length || 0 }} students enrolled</p>
                    </div>
                    <span :class="[
                      'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                      course.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    ]">
                      {{ course.isActive ? 'Active' : 'Inactive' }}
                    </span>
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
                  @click="showCreateUserModal = true"
                  class="flex items-center justify-center px-4 py-3 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  <span class="mr-2">👤</span>
                  Create User
                </button>
                <button
                  @click="$router.push('/users')"
                  class="flex items-center justify-center px-4 py-3 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  <span class="mr-2">👥</span>
                  Manage Users
                </button>
                <button
                  @click="$router.push('/courses')"
                  class="flex items-center justify-center px-4 py-3 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  <span class="mr-2">📚</span>
                  Manage Courses
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Create User Modal -->
  <div v-if="showCreateUserModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div class="bg-white rounded-lg p-6 w-full max-w-md mx-4">
      <h3 class="text-lg font-medium mb-4">Create User</h3>
      <form @submit.prevent="submitUser" class="space-y-4">
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700">First Name</label>
            <input v-model="userForm.firstName" type="text" required class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700">Last Name</label>
            <input v-model="userForm.lastName" type="text" required class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" />
          </div>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700">Email</label>
          <input v-model="userForm.email" type="email" required class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700">Role</label>
          <select v-model="userForm.role" required class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md">
            <option value="">Select Role</option>
            <option value="student">Student</option>
            <option value="instructor">Instructor</option>
            <option value="admin">Admin</option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700">Password</label>
          <input v-model="userForm.password" type="password" required class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" />
        </div>
        <div class="flex space-x-3">
          <button
            type="submit"
            :disabled="submitting"
            class="flex-1 bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 disabled:opacity-50"
          >
            {{ submitting ? 'Creating...' : 'Create' }}
          </button>
          <button
            type="button"
            @click="closeCreateUserModal"
            class="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  </div>

  <!-- Toast Message -->
  <div v-if="message" class="fixed top-4 right-4 max-w-sm">
    <div :class="messageClass" class="rounded-md p-4 shadow-lg">
      <p class="text-sm">{{ message }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useAuthStore } from '../stores/auth'
import { useToast } from 'vue-toastification'
import axios from 'axios'

const authStore = useAuthStore()
const toast = useToast()

const stats = ref({
  totalUsers: 0,
  activeCourses: 0,
  securityEvents: 0
})

const users = ref([])
const courses = ref([])
const showCreateUserModal = ref(false)
const submitting = ref(false)
const error = ref('')
const loading = ref(false)

const userForm = ref({
  firstName: '',
  lastName: '',
  email: '',
  role: '',
  password: ''
})

const message = ref('')
const messageClass = ref('')

const fetchStats = async () => {
  if (!authStore.isAuthenticated) {
    console.log('Not authenticated, skipping data fetch')
    return
  }

  try {
    loading.value = true
    const [usersResponse, coursesResponse, auditResponse] = await Promise.all([
      axios.get('/users'),
      axios.get('/courses'),
      axios.get('/audit').catch(() => ({ data: { logs: [] } }))
    ])

    users.value = usersResponse.data
    courses.value = coursesResponse.data
    stats.value.totalUsers = usersResponse.data.length || 0
    stats.value.activeCourses = coursesResponse.data.filter(c => c.isActive).length || 0
    stats.value.securityEvents = auditResponse.data.logs?.length || 0
  } catch (error) {
    console.error('Error fetching dashboard data:', error)
    if (error.response?.status !== 401) {
      toast.error('Failed to load dashboard data')
    }
  } finally {
    loading.value = false
  }
}

const submitUser = async () => {
  try {
    submitting.value = true
    error.value = ''

    await axios.post('/users', userForm.value)

    toast.success('User created successfully')
    closeCreateUserModal()
    await fetchStats()
  } catch (err) {
    error.value = err.response?.data?.message || 'Failed to create user'
  } finally {
    submitting.value = false
  }
}

const closeCreateUserModal = () => {
  showCreateUserModal.value = false
  error.value = ''
}

// Watch for auth initialization and fetch data when ready
watch(() => authStore.isAuthenticated, (isAuthenticated) => {
  if (isAuthenticated) {
    fetchStats()
  }
}, { immediate: true })

// Also fetch on mount if already authenticated
onMounted(() => {
  if (authStore.isAuthenticated) {
    fetchStats()
  }
})
</script>
