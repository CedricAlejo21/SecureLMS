<template>
  <div class="min-h-screen bg-gray-50">
    <div class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div class="px-4 py-6 sm:px-0">
        <div class="flex justify-between items-center mb-8">
          <div>
            <h1 class="text-3xl font-bold text-gray-900">
              {{ isStudent ? (showMyCoursesOnly ? 'My Courses' : 'Available Courses') : 'Courses' }}
            </h1>
            <p v-if="isStudent" class="mt-1 text-sm text-gray-600">
              {{ showMyCoursesOnly ? 'Courses you are enrolled in' : 'Browse and enroll in available courses' }}
            </p>
          </div>
          <div class="flex space-x-3">
            <!-- Toggle for students -->
            <div v-if="isStudent" class="flex bg-gray-100 rounded-lg p-1">
              <button
                @click="showMyCoursesOnly = true"
                :class="[
                  'px-3 py-1 rounded-md text-sm font-medium transition-colors',
                  showMyCoursesOnly 
                    ? 'bg-white text-gray-900 shadow-sm' 
                    : 'text-gray-500 hover:text-gray-700'
                ]"
              >
                My Courses
              </button>
              <button
                @click="showMyCoursesOnly = false"
                :class="[
                  'px-3 py-1 rounded-md text-sm font-medium transition-colors',
                  !showMyCoursesOnly 
                    ? 'bg-white text-gray-900 shadow-sm' 
                    : 'text-gray-500 hover:text-gray-700'
                ]"
              >
                Browse All
              </button>
            </div>
            
            <button
              v-if="canCreateCourse"
              @click="showCreateModal = true"
              class="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
            >
              Create Course
            </button>
          </div>
        </div>

        <div v-if="loading" class="text-center py-8">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
        </div>

        <div v-else-if="displayedCourses.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div v-for="course in displayedCourses" :key="course._id" class="bg-white shadow rounded-lg p-6">
            <h3 class="text-lg font-medium text-gray-900 mb-2">{{ course.title }}</h3>
            <p class="text-gray-600 mb-4">{{ course.description }}</p>
            
            <div class="text-sm text-gray-500 space-y-1 mb-4">
              <div>Instructor: {{ course.instructor?.firstName }} {{ course.instructor?.lastName }}</div>
              <div>Students: {{ course.students?.length || 0 }} / {{ course.maxStudents }}</div>
              <div v-if="course.startDate">Start: {{ new Date(course.startDate).toLocaleDateString() }}</div>
            </div>

            <!-- Enrollment status indicator for students -->
            <div v-if="isStudent && isEnrolled(course)" class="mb-3">
              <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                ✓ Enrolled
              </span>
            </div>

            <div class="flex space-x-2">
              <button 
                v-if="canViewCourse(course)" 
                @click="viewCourse(course)" 
                class="flex-1 bg-gray-100 text-gray-700 px-3 py-2 rounded text-sm hover:bg-gray-200"
              >
                View
              </button>
              
              <button v-if="canEnroll(course)" @click="enrollInCourse(course)" class="flex-1 bg-indigo-600 text-white px-3 py-2 rounded text-sm hover:bg-indigo-700">
                Enroll
              </button>
              
              <button v-if="canUnenroll(course)" @click="unenrollFromCourse(course)" class="flex-1 bg-red-600 text-white px-3 py-2 rounded text-sm hover:bg-red-700">
                Unenroll
              </button>
            </div>
          </div>
        </div>

        <div v-else class="text-center py-12">
          <div class="text-gray-400 mb-4">
            <svg class="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <h3 class="text-lg font-medium text-gray-900">
            {{ isStudent && showMyCoursesOnly ? 'No enrolled courses' : 'No courses available' }}
          </h3>
          <p class="mt-1 text-sm text-gray-500">
            {{ isStudent && showMyCoursesOnly 
                ? 'You haven\'t enrolled in any courses yet. Browse available courses to get started.' 
                : 'No courses are currently available.' 
            }}
          </p>
          <div v-if="isStudent && showMyCoursesOnly" class="mt-4">
            <button
              @click="showMyCoursesOnly = false"
              class="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
            >
              Browse Available Courses
            </button>
          </div>
        </div>

        <div v-if="showCreateModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div class="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 class="text-lg font-medium mb-4">Create Course</h3>
            
            <form @submit.prevent="submitCourse" class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-700">Title</label>
                <input v-model="courseForm.title" type="text" required class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" />
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700">Description</label>
                <textarea v-model="courseForm.description" rows="3" required class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"></textarea>
              </div>
              
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700">Start Date</label>
                  <input v-model="courseForm.startDate" type="date" required class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" />
                </div>
                
                <div>
                  <label class="block text-sm font-medium text-gray-700">End Date</label>
                  <input v-model="courseForm.endDate" type="date" required class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" />
                </div>
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700">Max Students</label>
                <input v-model.number="courseForm.maxStudents" type="number" min="1" max="100" required class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" />
              </div>
              
              <div class="flex justify-end space-x-3 pt-4">
                <button type="button" @click="closeModal" class="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50">
                  Cancel
                </button>
                <button type="submit" :disabled="submitting" class="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50">
                  {{ submitting ? 'Creating...' : 'Create' }}
                </button>
              </div>
            </form>
          </div>
        </div>

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
import { useRouter } from 'vue-router'
import axios from 'axios'

const authStore = useAuthStore()
const router = useRouter()

// State
const courses = ref([])
const loading = ref(true)
const showCreateModal = ref(false)
const submitting = ref(false)
const message = ref('')
const messageType = ref('')
const showMyCoursesOnly = ref(true) // Default to showing enrolled courses for students

const courseForm = ref({
  title: '',
  description: '',
  startDate: '',
  endDate: '',
  maxStudents: 30
})

// Computed
const canCreateCourse = computed(() => {
  return ['instructor', 'admin'].includes(authStore.user?.role)
})

const isStudent = computed(() => {
  return authStore.user?.role === 'student'
})

const displayedCourses = computed(() => {
  if (!isStudent.value) {
    return courses.value // Show all courses for instructors and admins
  }
  
  if (showMyCoursesOnly.value) {
    // Show only enrolled courses for students
    return courses.value.filter(course => 
      course.students?.some(s => s._id === authStore.user?.id)
    )
  } else {
    // Show all courses for browsing
    return courses.value
  }
})

const messageClass = computed(() => {
  return messageType.value === 'success' 
    ? 'bg-green-50 border border-green-200 text-green-800'
    : 'bg-red-50 border border-red-200 text-red-800'
})

// Methods
const canEnroll = (course) => {
  return authStore.user?.role === 'student' && 
         !course.students?.some(s => s._id === authStore.user?.id) &&
         course.students?.length < course.maxStudents
}

const canUnenroll = (course) => {
  return authStore.user?.role === 'student' && 
         course.students?.some(s => s._id === authStore.user?.id)
}

const isEnrolled = (course) => {
  return course.students?.some(s => s._id === authStore.user?.id)
}

const canViewCourse = (course) => {
  if (isStudent.value) {
    return isEnrolled(course)
  } else {
    return true
  }
}

const fetchCourses = async () => {
  try {
    loading.value = true
    const response = await axios.get('/courses', {
      headers: {
        'Authorization': `Bearer ${authStore.token}`
      }
    })
    
    courses.value = response.data || []
  } catch (error) {
    console.error('Error fetching courses:', error)
    showMessage('Failed to fetch courses', 'error')
  } finally {
    loading.value = false
  }
}

const submitCourse = async () => {
  try {
    submitting.value = true
    
    const response = await axios.post('/courses', courseForm.value, {
      headers: {
        'Authorization': `Bearer ${authStore.token}`
      }
    })
    
    showMessage('Course created successfully!', 'success')
    closeModal()
    fetchCourses()
  } catch (error) {
    console.error('Error creating course:', error)
    const errorMessage = error.response?.data?.message || 'Failed to create course'
    showMessage(errorMessage, 'error')
  } finally {
    submitting.value = false
  }
}

const enrollInCourse = async (course) => {
  try {
    await axios.post(`/courses/${course._id}/enroll`, {}, {
      headers: {
        'Authorization': `Bearer ${authStore.token}`
      }
    })
    
    showMessage('Successfully enrolled in course!', 'success')
    fetchCourses()
  } catch (error) {
    console.error('Error enrolling in course:', error)
    const errorMessage = error.response?.data?.message || 'Failed to enroll'
    showMessage(errorMessage, 'error')
  }
}

const unenrollFromCourse = async (course) => {
  try {
    await axios.post(`/courses/${course._id}/unenroll`, {}, {
      headers: {
        'Authorization': `Bearer ${authStore.token}`
      }
    })
    
    showMessage('Successfully unenrolled from course!', 'success')
    fetchCourses()
  } catch (error) {
    console.error('Error unenrolling from course:', error)
    const errorMessage = error.response?.data?.message || 'Failed to unenroll'
    showMessage(errorMessage, 'error')
  }
}

const viewCourse = (course) => {
  router.push(`/courses/${course._id}`)
}

const closeModal = () => {
  showCreateModal.value = false
  courseForm.value = {
    title: '',
    description: '',
    startDate: '',
    endDate: '',
    maxStudents: 30
  }
}

const showMessage = (msg, type) => {
  message.value = msg
  messageType.value = type
  setTimeout(() => {
    message.value = ''
  }, 5000)
}

onMounted(() => {
  fetchCourses()
})
</script>
