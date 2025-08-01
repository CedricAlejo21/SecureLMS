<template>
  <div class="min-h-screen bg-gray-50">
    <div class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div class="px-4 py-6 sm:px-0">
        <!-- Header -->
        <div class="flex justify-between items-center mb-8">
          <h1 class="text-3xl font-bold text-gray-900">Assignments</h1>
          <button
            v-if="canCreateAssignment"
            @click="showCreateModal = true"
            class="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
          >
            Create Assignment
          </button>
        </div>

        <!-- Loading -->
        <div v-if="loading" class="text-center py-8">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
        </div>

        <!-- Assignments List -->
        <div v-else-if="assignments.length > 0" class="space-y-4">
          <div v-for="assignment in assignments" :key="assignment._id" class="bg-white shadow rounded-lg p-6">
            <div class="flex justify-between items-start mb-4">
              <div>
                <h3 class="text-lg font-medium text-gray-900">{{ assignment.title }}</h3>
                <p class="text-sm text-gray-600">{{ assignment.course?.title }}</p>
              </div>
              <div class="flex items-center space-x-2">
                <!-- Submission Status for Students -->
                <div v-if="authStore.user?.role === 'student' && assignment.submissionStatus" class="flex items-center">
                  <span v-if="assignment.submissionStatus.submitted && assignment.submissionStatus.isLate" 
                        class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                    Late
                  </span>
                  <span v-else-if="assignment.submissionStatus.submitted" 
                        class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Submitted
                  </span>
                  <span v-else-if="new Date() > new Date(assignment.dueDate)" 
                        class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                    Overdue
                  </span>
                  <span v-else 
                        class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                    Not Submitted
                  </span>
                </div>
                
                <!-- Action Buttons -->
                <div class="flex space-x-2">
                  <button
                    v-if="canEdit(assignment)"
                    @click="editAssignment(assignment)"
                    class="text-indigo-600 hover:text-indigo-900 text-sm"
                  >
                    Edit
                  </button>
                  <button
                    v-if="canDelete(assignment)"
                    @click="deleteAssignment(assignment)"
                    class="text-red-600 hover:text-red-900 text-sm"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
            
            <p class="text-gray-700 mb-4">{{ assignment.description }}</p>
            
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-500 mb-4">
              <div>Due: {{ formatDate(assignment.dueDate) }}</div>
              <div>Max Points: {{ assignment.maxPoints }}</div>
              <div>Created: {{ formatDate(assignment.createdAt) }}</div>
            </div>

            <button
              @click="viewAssignment(assignment)"
              class="bg-gray-100 text-gray-700 px-4 py-2 rounded text-sm hover:bg-gray-200"
            >
              View Details
            </button>
          </div>
        </div>

        <!-- Empty State -->
        <div v-else class="text-center py-12">
          <h3 class="text-lg font-medium text-gray-900">No assignments found</h3>
          <p class="text-gray-500">{{ canCreateAssignment ? 'Create your first assignment.' : 'No assignments available.' }}</p>
        </div>

        <!-- Create Modal -->
        <div v-if="showCreateModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div class="bg-white rounded-lg p-6 w-full max-w-lg mx-4">
            <h3 class="text-lg font-medium mb-4">Create Assignment</h3>
            
            <form @submit.prevent="submitAssignment" class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-700">Title</label>
                <input v-model="form.title" type="text" required class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" />
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700">Description</label>
                <textarea v-model="form.description" rows="3" required class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"></textarea>
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700">Course</label>
                <select v-model="form.course" required class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md">
                  <option value="">Select a course</option>
                  <option v-for="course in userCourses" :key="course._id" :value="course._id">
                    {{ course.title }}
                  </option>
                </select>
              </div>
              
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700">Due Date</label>
                  <input v-model="form.dueDate" type="datetime-local" required class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" />
                </div>
                
                <div>
                  <label class="block text-sm font-medium text-gray-700">Max Points</label>
                  <input v-model.number="form.maxPoints" type="number" min="1" max="1000" required class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" />
                </div>
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

        <!-- Message -->
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

const authStore = useAuthStore()
const router = useRouter()

// State
const assignments = ref([])
const userCourses = ref([])
const loading = ref(true)
const showCreateModal = ref(false)
const submitting = ref(false)
const message = ref('')
const messageType = ref('')

const form = ref({
  title: '',
  description: '',
  course: '',
  dueDate: '',
  maxPoints: 100
})

// Computed
const canCreateAssignment = computed(() => {
  return ['instructor', 'admin'].includes(authStore.user?.role)
})

const messageClass = computed(() => {
  return messageType.value === 'success' 
    ? 'bg-green-50 border border-green-200 text-green-800'
    : 'bg-red-50 border border-red-200 text-red-800'
})

// Methods
const canEdit = (assignment) => {
  return authStore.user?.role === 'admin' || 
         (authStore.user?.role === 'instructor' && assignment.course?.instructor === authStore.user?.id)
}

const canDelete = (assignment) => {
  return canEdit(assignment)
}

const formatDate = (dateString) => {
  if (!dateString) return ''
  return new Date(dateString).toLocaleString()
}

const fetchAssignments = async () => {
  try {
    loading.value = true
    // Get assignments for all courses the user has access to
    const coursePromises = userCourses.value.map(course => 
      fetch(`/api/assignments/course/${course._id}`, {
        headers: { 'Authorization': `Bearer ${authStore.token}` }
      })
    )
    
    const responses = await Promise.all(coursePromises)
    const assignmentArrays = await Promise.all(
      responses.map(res => res.ok ? res.json() : [])
    )
    
    assignments.value = assignmentArrays.flat()
    
    // For students, fetch submission status for each assignment
    if (authStore.user?.role === 'student') {
      await fetchSubmissionStatuses()
    }
  } catch (error) {
    showMessage('Error fetching assignments', 'error')
  } finally {
    loading.value = false
  }
}

const fetchSubmissionStatuses = async () => {
  try {
    const submissionPromises = assignments.value.map(async (assignment) => {
      try {
        const response = await fetch(`/api/submissions/${assignment._id}/${authStore.user?.id}`, {
          headers: { 'Authorization': `Bearer ${authStore.token}` }
        })
        
        if (response.ok) {
          const submission = await response.json()
          assignment.submissionStatus = {
            submitted: true,
            isLate: submission.isLate,
            submittedAt: submission.submittedAt,
            grade: submission.grade
          }
        } else {
          assignment.submissionStatus = {
            submitted: false,
            isLate: false
          }
        }
      } catch (error) {
        assignment.submissionStatus = {
          submitted: false,
          isLate: false
        }
      }
    })
    
    await Promise.all(submissionPromises)
  } catch (error) {
    console.error('Error fetching submission statuses:', error)
  }
}

const fetchUserCourses = async () => {
  try {
    const response = await fetch('/api/courses', {
      headers: { 'Authorization': `Bearer ${authStore.token}` }
    })
    
    if (response.ok) {
      userCourses.value = await response.json()
    }
  } catch (error) {
    console.error('Error fetching courses:', error)
  }
}

const submitAssignment = async () => {
  try {
    submitting.value = true
    
    const response = await fetch('/api/assignments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authStore.token}`
      },
      body: JSON.stringify(form.value)
    })
    
    if (response.ok) {
      showMessage('Assignment created successfully!', 'success')
      closeModal()
      fetchAssignments()
    } else {
      const data = await response.json()
      showMessage(data.message || 'Failed to create assignment', 'error')
    }
  } catch (error) {
    showMessage('Error creating assignment', 'error')
  } finally {
    submitting.value = false
  }
}

const editAssignment = (assignment) => {
  // For now, just show a message - full edit functionality can be added later
  showMessage('Edit functionality coming soon!', 'error')
}

const deleteAssignment = async (assignment) => {
  if (!confirm('Are you sure you want to delete this assignment?')) return
  
  try {
    const response = await fetch(`/api/assignments/${assignment._id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${authStore.token}` }
    })
    
    if (response.ok) {
      showMessage('Assignment deleted successfully!', 'success')
      fetchAssignments()
    } else {
      const data = await response.json()
      showMessage(data.message || 'Failed to delete assignment', 'error')
    }
  } catch (error) {
    showMessage('Error deleting assignment', 'error')
  }
}

const viewAssignment = (assignment) => {
  router.push(`/assignments/${assignment._id}`)
}

const closeModal = () => {
  showCreateModal.value = false
  form.value = {
    title: '',
    description: '',
    course: '',
    dueDate: '',
    maxPoints: 100
  }
}

const showMessage = (msg, type) => {
  message.value = msg
  messageType.value = type
  setTimeout(() => {
    message.value = ''
  }, 5000)
}

onMounted(async () => {
  await fetchUserCourses()
  await fetchAssignments()
})
</script>
