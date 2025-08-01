<template>
  <div class="min-h-screen bg-gray-50">
    <div class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div class="px-4 py-6 sm:px-0">
        <div class="flex justify-between items-center mb-8">
          <h1 class="text-3xl font-bold text-gray-900">Grades</h1>
          <button
            v-if="canManageGrades"
            @click="showGradeModal = true"
            class="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
          >
            Add Grade
          </button>
        </div>

        <div v-if="loading" class="text-center py-8">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
        </div>

        <div v-else-if="grades.length > 0" class="bg-white shadow overflow-hidden sm:rounded-md">
          <div class="px-4 py-5 sm:p-6">
            <div class="overflow-x-auto">
              <table class="min-w-full divide-y divide-gray-200">
                <thead class="bg-gray-50">
                  <tr>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {{ isStudent ? 'Assignment' : 'Student' }}
                    </th>
                    <th v-if="!isStudent" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Assignment
                    </th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Course
                    </th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Grade
                    </th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th v-if="canManageGrades" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody class="bg-white divide-y divide-gray-200">
                  <tr v-for="grade in grades" :key="grade._id" class="hover:bg-gray-50">
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {{ isStudent ? grade.assignment?.title : `${grade.student?.firstName} ${grade.student?.lastName}` }}
                    </td>
                    <td v-if="!isStudent" class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {{ grade.assignment?.title }}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {{ grade.course?.title }}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <div class="flex items-center">
                        <span class="text-sm font-medium text-gray-900">
                          {{ grade.points }} / {{ grade.assignment?.maxPoints }}
                        </span>
                        <span class="ml-2 text-xs text-gray-500">
                          ({{ getPercentage(grade.points, grade.assignment?.maxPoints) }}%)
                        </span>
                      </div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {{ formatDate(grade.gradedAt) }}
                    </td>
                    <td v-if="canManageGrades" class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div class="flex space-x-2">
                        <button @click="editGrade(grade)" class="text-indigo-600 hover:text-indigo-900">
                          Edit
                        </button>
                        <button @click="deleteGrade(grade)" class="text-red-600 hover:text-red-900">
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div v-else class="text-center py-12">
          <h3 class="text-lg font-medium text-gray-900">No grades found</h3>
          <p class="text-gray-500">
            {{ isStudent ? 'No grades available yet.' : 'No grades have been assigned yet.' }}
          </p>
        </div>

        <!-- Add Grade Modal -->
        <div v-if="showGradeModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div class="bg-white rounded-lg p-6 w-full max-w-lg mx-4">
            <h3 class="text-lg font-medium mb-4">Add Grade</h3>
            
            <form @submit.prevent="submitGrade" class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-700">Course</label>
                <select v-model="gradeForm.course" @change="loadCourseData" required class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md">
                  <option value="">Select a course</option>
                  <option v-for="course in userCourses" :key="course._id" :value="course._id">
                    {{ course.title }}
                  </option>
                </select>
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700">Assignment</label>
                <select v-model="gradeForm.assignment" required class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md">
                  <option value="">Select an assignment</option>
                  <option v-for="assignment in courseAssignments" :key="assignment._id" :value="assignment._id">
                    {{ assignment.title }} ({{ assignment.maxPoints }} pts)
                  </option>
                </select>
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700">Student</label>
                <select v-model="gradeForm.student" required class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md">
                  <option value="">Select a student</option>
                  <option v-for="student in courseStudents" :key="student._id" :value="student._id">
                    {{ student.firstName }} {{ student.lastName }}
                  </option>
                </select>
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700">Points</label>
                <input v-model.number="gradeForm.points" type="number" min="0" required class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" />
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700">Feedback (Optional)</label>
                <textarea v-model="gradeForm.feedback" rows="3" class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"></textarea>
              </div>
              
              <div class="flex justify-end space-x-3 pt-4">
                <button type="button" @click="closeModal" class="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50">
                  Cancel
                </button>
                <button type="submit" :disabled="submitting" class="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50">
                  {{ submitting ? 'Saving...' : 'Save Grade' }}
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

const authStore = useAuthStore()
const router = useRouter()

// State
const grades = ref([])
const userCourses = ref([])
const courseAssignments = ref([])
const courseStudents = ref([])
const loading = ref(true)
const showGradeModal = ref(false)
const submitting = ref(false)
const message = ref('')
const messageType = ref('')

const gradeForm = ref({
  course: '',
  assignment: '',
  student: '',
  points: 0,
  feedback: ''
})

// Computed
const canManageGrades = computed(() => {
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

const getPercentage = (points, maxPoints) => {
  if (!maxPoints || maxPoints === 0) return 0
  return Math.round((points / maxPoints) * 100)
}

const fetchGrades = async () => {
  try {
    loading.value = true
    
    if (isStudent.value) {
      // Students fetch their own grades
      const response = await fetch(`/api/grades/student/${authStore.user.id}`, {
        headers: { 'Authorization': `Bearer ${authStore.token}` }
      })
      
      if (response.ok) {
        grades.value = await response.json()
      }
    } else {
      // Instructors/admins fetch grades for their courses
      const allGrades = []
      
      for (const course of userCourses.value) {
        const response = await fetch(`/api/grades/course/${course._id}`, {
          headers: { 'Authorization': `Bearer ${authStore.token}` }
        })
        
        if (response.ok) {
          const courseGrades = await response.json()
          allGrades.push(...courseGrades)
        }
      }
      
      grades.value = allGrades
    }
  } catch (error) {
    showMessage('Error fetching grades', 'error')
  } finally {
    loading.value = false
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

const loadCourseData = async () => {
  if (!gradeForm.value.course) return
  
  try {
    // Fetch assignments for the selected course
    const assignmentsResponse = await fetch(`/api/assignments/course/${gradeForm.value.course}`, {
      headers: { 'Authorization': `Bearer ${authStore.token}` }
    })
    
    if (assignmentsResponse.ok) {
      courseAssignments.value = await assignmentsResponse.json()
    }
    
    // Fetch course details to get students
    const courseResponse = await fetch(`/api/courses/${gradeForm.value.course}`, {
      headers: { 'Authorization': `Bearer ${authStore.token}` }
    })
    
    if (courseResponse.ok) {
      const course = await courseResponse.json()
      courseStudents.value = course.students || []
    }
  } catch (error) {
    console.error('Error loading course data:', error)
  }
}

const submitGrade = async () => {
  try {
    submitting.value = true
    
    const response = await fetch('/api/grades', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authStore.token}`
      },
      body: JSON.stringify(gradeForm.value)
    })
    
    if (response.ok) {
      showMessage('Grade saved successfully!', 'success')
      closeModal()
      fetchGrades()
    } else {
      const data = await response.json()
      showMessage(data.message || 'Failed to save grade', 'error')
    }
  } catch (error) {
    showMessage('Error saving grade', 'error')
  } finally {
    submitting.value = false
  }
}

const editGrade = (grade) => {
  showMessage('Edit functionality coming soon!', 'error')
}

const deleteGrade = async (grade) => {
  if (!confirm('Are you sure you want to delete this grade?')) return
  
  try {
    const response = await fetch(`/api/grades/${grade._id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${authStore.token}` }
    })
    
    if (response.ok) {
      showMessage('Grade deleted successfully!', 'success')
      fetchGrades()
    } else {
      const data = await response.json()
      showMessage(data.message || 'Failed to delete grade', 'error')
    }
  } catch (error) {
    showMessage('Error deleting grade', 'error')
  }
}

const closeModal = () => {
  showGradeModal.value = false
  gradeForm.value = {
    course: '',
    assignment: '',
    student: '',
    points: 0,
    feedback: ''
  }
  courseAssignments.value = []
  courseStudents.value = []
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
  await fetchGrades()
})
</script>
