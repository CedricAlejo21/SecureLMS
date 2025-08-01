<template>
  <div class="min-h-screen bg-gray-50">
    <div class="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
      <div class="px-4 py-6 sm:px-0">
        <!-- Back Button -->
        <div class="mb-6">
          <button
            @click="$router.back()"
            class="flex items-center text-indigo-600 hover:text-indigo-900"
          >
            <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
            </svg>
            Back to Assignments
          </button>
        </div>

        <!-- Loading -->
        <div v-if="loading" class="text-center py-8">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
        </div>

        <!-- Assignment Details -->
        <div v-else-if="assignment" class="bg-white shadow rounded-lg">
          <!-- Header -->
          <div class="px-6 py-4 border-b border-gray-200">
            <div class="flex justify-between items-start">
              <div>
                <h1 class="text-2xl font-bold text-gray-900">{{ assignment.title }}</h1>
                <p class="text-sm text-gray-600 mt-1">{{ assignment.course?.title }}</p>
              </div>
              <div class="flex space-x-2">
                <button
                  v-if="canEdit"
                  @click="editAssignment"
                  class="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 text-sm"
                >
                  Edit
                </button>
                <button
                  v-if="canDelete"
                  @click="deleteAssignment"
                  class="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 text-sm"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>

          <!-- Assignment Info -->
          <div class="px-6 py-4">
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div>
                <h3 class="text-sm font-medium text-gray-500">Due Date</h3>
                <p class="mt-1 text-sm text-gray-900">{{ formatDate(assignment.dueDate) }}</p>
              </div>
              <div>
                <h3 class="text-sm font-medium text-gray-500">Max Score</h3>
                <p class="mt-1 text-sm text-gray-900">{{ assignment.maxScore }}</p>
              </div>
              <div>
                <h3 class="text-sm font-medium text-gray-500">Created</h3>
                <p class="mt-1 text-sm text-gray-900">{{ formatDate(assignment.createdAt) }}</p>
              </div>
            </div>

            <!-- Description -->
            <div class="mb-6">
              <h3 class="text-lg font-medium text-gray-900 mb-3">Description</h3>
              <div class="prose max-w-none">
                <p class="text-gray-700 whitespace-pre-wrap">{{ assignment.description }}</p>
              </div>
            </div>

            <!-- Submissions Section (for instructors/admins) -->
            <div v-if="showSubmissions && assignment.submissions?.length > 0" class="border-t pt-6">
              <h3 class="text-lg font-medium text-gray-900 mb-4">Submissions</h3>
              <div class="space-y-3">
                <div
                  v-for="submission in assignment.submissions"
                  :key="submission._id"
                  class="bg-gray-50 rounded-lg p-4"
                >
                  <div class="flex justify-between items-start">
                    <div>
                      <p class="font-medium text-gray-900">
                        {{ submission.student?.firstName }} {{ submission.student?.lastName }}
                      </p>
                      <p class="text-sm text-gray-600">{{ submission.student?.email }}</p>
                    </div>
                    <div class="text-right">
                      <p class="text-sm font-medium text-gray-900">
                        Score: {{ submission.score || 'Not graded' }}
                      </p>
                      <p class="text-xs text-gray-500">
                        Submitted: {{ formatDate(submission.submittedAt) }}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Student Submission Section -->
            <div v-else-if="isStudent" class="border-t pt-6">
              <h3 class="text-lg font-medium text-gray-900 mb-4">Your Submission</h3>
              
              <!-- Check if student has already submitted -->
              <div v-if="studentSubmission" class="bg-blue-50 rounded-lg p-4 mb-4">
                <div class="flex items-start">
                  <div class="flex-shrink-0">
                    <svg class="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                    </svg>
                  </div>
                  <div class="ml-3">
                    <h4 class="text-sm font-medium text-blue-800">
                      Submission Completed
                      <span v-if="studentSubmission.isLate" class="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        Late
                      </span>
                    </h4>
                    <p class="text-sm text-blue-700 mt-1">
                      Submitted on {{ formatDate(studentSubmission.submittedAt) }}
                    </p>
                    <p class="text-sm text-blue-700" v-if="studentSubmission.grade">
                      Grade: {{ studentSubmission.grade }}/{{ assignment.maxScore }}
                    </p>
                  </div>
                </div>
              </div>

              <!-- Submission Form -->
              <div v-else class="bg-gray-50 rounded-lg p-4">
                <form @submit.prevent="submitAssignment" class="space-y-4">
                  <div>
                    <label for="submission-text" class="block text-sm font-medium text-gray-700 mb-2">
                      Your Answer
                    </label>
                    <textarea
                      id="submission-text"
                      v-model="submissionText"
                      rows="6"
                      class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="Enter your submission here..."
                      required
                    ></textarea>
                  </div>
                  
                  <div class="flex justify-between items-center">
                    <p class="text-sm text-gray-600">
                      Due: {{ formatDate(assignment.dueDate) }}
                    </p>
                    <button
                      type="submit"
                      :disabled="submitting || !submissionText.trim()"
                      class="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                      {{ submitting ? 'Submitting...' : 'Submit Assignment' }}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>

        <!-- Error State -->
        <div v-else class="text-center py-12">
          <h3 class="text-lg font-medium text-gray-900">Assignment not found</h3>
          <p class="text-gray-500">The assignment you're looking for doesn't exist or you don't have access to it.</p>
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
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

// State
const assignment = ref(null)
const loading = ref(true)
const message = ref('')
const messageType = ref('')
const studentSubmission = ref(null)
const submissionText = ref('')
const submitting = ref(false)

// Computed
const canEdit = computed(() => {
  if (!assignment.value) return false
  const userId = authStore.user?.userId || authStore.user?.id || authStore.user?._id;
  const instructorId = assignment.value.course?.instructor?._id || assignment.value.course?.instructor;
  
  return authStore.user?.role === 'admin' || 
         (authStore.user?.role === 'instructor' && userId?.toString() === instructorId?.toString())
})

const canDelete = computed(() => {
  return canEdit.value
})

const showSubmissions = computed(() => {
  return ['instructor', 'admin'].includes(authStore.user?.role)
})

const isStudent = computed(() => {
  return authStore.user?.role === 'student'
})

const messageClass = computed(() => {
  return messageType.value === 'success' 
    ? 'bg-green-50 border border-green-200 text-green-800'
    : 'bg-red-50 border border-red-200 text-red-800'
})

// Methods
const formatDate = (dateString) => {
  if (!dateString) return ''
  return new Date(dateString).toLocaleDateString()
}

const fetchAssignment = async () => {
  try {
    console.log('=== ASSIGNMENT DETAIL FETCH DEBUG ===');
    console.log('Assignment ID:', route.params.id);
    console.log('User:', authStore.user);
    
    loading.value = true
    const response = await fetch(`/api/assignments/${route.params.id}`, {
      headers: { 'Authorization': `Bearer ${authStore.token}` }
    })
    
    console.log('Assignment fetch response status:', response.status);
    
    if (response.ok) {
      assignment.value = await response.json()
      console.log('Assignment fetched:', assignment.value);
      
      // Fetch student submission if user is a student
      if (authStore.user?.role === 'student') {
        const userId = authStore.user?.userId || authStore.user?.id || authStore.user?._id;
        console.log('Fetching submission for user:', userId);
        
        const studentSubmissionResponse = await fetch(`/api/submissions/${assignment.value._id}/${userId}`, {
          headers: { 'Authorization': `Bearer ${authStore.token}` }
        })
        
        if (studentSubmissionResponse.ok) {
          studentSubmission.value = await studentSubmissionResponse.json()
          console.log('Student submission:', studentSubmission.value);
        } else {
          console.log('No submission found or error fetching submission');
        }
      }
    } else if (response.status === 404) {
      console.log('Assignment not found');
      assignment.value = null
    } else {
      const errorData = await response.json();
      console.error('Error response:', errorData);
      showMessage(errorData.message || 'Error fetching assignment', 'error')
    }
  } catch (error) {
    console.error('Error fetching assignment:', error)
    showMessage('Error fetching assignment', 'error')
  } finally {
    loading.value = false
  }
}

const editAssignment = () => {
  router.push(`/assignments/${assignment.value._id}/edit`)
}

const deleteAssignment = async () => {
  if (!confirm('Are you sure you want to delete this assignment?')) return
  
  try {
    const response = await fetch(`/api/assignments/${assignment.value._id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${authStore.token}` }
    })
    
    if (response.ok) {
      showMessage('Assignment deleted successfully!', 'success')
      setTimeout(() => {
        router.push('/assignments')
      }, 1500)
    } else {
      const data = await response.json()
      showMessage(data.message || 'Failed to delete assignment', 'error')
    }
  } catch (error) {
    showMessage('Error deleting assignment', 'error')
  }
}

const submitAssignment = async () => {
  submitting.value = true
  try {
    const userId = authStore.user?.userId || authStore.user?.id || authStore.user?._id;
    console.log('Submitting assignment for user:', userId);
    
    const response = await fetch(`/api/submissions/${assignment.value._id}/${userId}`, {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${authStore.token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ text: submissionText.value })
    })
    
    if (response.ok) {
      studentSubmission.value = await response.json()
      submissionText.value = ''
      showMessage('Assignment submitted successfully!', 'success')
    } else {
      const data = await response.json()
      showMessage(data.message || 'Failed to submit assignment', 'error')
    }
  } catch (error) {
    console.error('Error submitting assignment:', error)
    showMessage('Error submitting assignment', 'error')
  } finally {
    submitting.value = false
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
  fetchAssignment()
})
</script>
