<template>
  <div class="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
    <div class="sm:mx-auto sm:w-full sm:max-w-4xl">
      <div class="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
        <div class="mb-8">
          <h2 class="text-center text-3xl font-extrabold text-gray-900">
            Security Questions Setup
          </h2>
          <p class="mt-2 text-center text-sm text-gray-600">
            Set up security questions for password recovery. Choose questions with answers only you would know.
          </p>
        </div>

        <!-- Security Guidelines -->
        <div class="rounded-md bg-blue-50 p-4 mb-8">
          <div class="text-sm text-blue-700">
            <p class="font-medium mb-2">Security Guidelines:</p>
            <ul class="list-disc list-inside space-y-1">
              <li>Choose questions you can answer consistently over time</li>
              <li>Avoid answers that might change or that others could easily guess</li>
              <li>Your answers are case-insensitive and will be trimmed of extra spaces</li>
              <li>Make sure you can remember your exact answers for future password resets</li>
            </ul>
          </div>
        </div>

        <!-- Good vs Bad Examples -->
        <div class="mb-8">
          <h3 class="text-lg font-medium text-gray-900 mb-4">Good vs Bad Examples</h3>
          <div class="flex flex-col space-y-4">
            <div class="bg-green-50 p-4 rounded-md">
              <h4 class="text-sm font-medium text-green-700 mb-2">Good Examples</h4>
              <ul class="list-disc list-inside space-y-1">
                <li>Specific numbers (house numbers, phone digits, years)</li>
                <li>First names of childhood friends</li>
                <li>Specific locations from your past</li>
              </ul>
            </div>
            <div class="bg-red-50 p-4 rounded-md">
              <h4 class="text-sm font-medium text-red-700 mb-2">Avoid These</h4>
              <ul class="list-disc list-inside space-y-1">
                <li>Common answers like "blue" for favorite color</li>
                <li>Popular books, movies, or songs</li>
                <li>Generic pet names like "Fluffy" or "Buddy"</li>
              </ul>
            </div>
          </div>
        </div>

        <!-- Loading State -->
        <div v-if="loading" class="flex flex-col items-center justify-center py-12">
          <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p class="mt-4 text-sm text-gray-600">Loading security questions...</p>
        </div>

        <!-- Security Questions Form -->
        <form v-else class="space-y-8" @submit.prevent="submitQuestions">
          <div v-for="(selectedQuestion, index) in selectedQuestions" :key="index" class="bg-white border border-gray-200 rounded-lg p-6">
            <div class="mb-6">
              <h3 class="text-lg font-medium text-gray-900 mb-2">
                Question {{ index + 1 }} of 3
              </h3>
            </div>

            <!-- Question Selection -->
            <div class="mb-6">
              <label :for="`question-${index}`" class="block text-sm font-medium text-gray-700 mb-2">
                Select a Question
              </label>
              <select
                :id="`question-${index}`"
                v-model="selectedQuestion.questionId"
                class="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                required
                @change="updateQuestionText(index)"
              >
                <option value="">Choose a security question...</option>
                <optgroup
                  v-for="category in questionCategories"
                  :key="category"
                  :label="formatCategoryName(category)"
                >
                  <option
                    v-for="question in getQuestionsByCategory(category)"
                    :key="question.id"
                    :value="question.id"
                    :disabled="isQuestionSelected(question.id, index)"
                    :class="{ 'text-gray-400': isQuestionSelected(question.id, index) }"
                  >
                    {{ question.question }}
                  </option>
                </optgroup>
              </select>
            </div>

            <!-- Question Guidance -->
            <div v-if="selectedQuestion.guidance" class="bg-gray-50 rounded-md p-3 mb-4">
              <p class="text-xs text-gray-600">
                💡 {{ selectedQuestion.guidance }}
              </p>
            </div>

            <!-- Answer Input -->
            <div class="mb-4">
              <label :for="`answer-${index}`" class="block text-sm font-medium text-gray-700 mb-2">
                Your Answer
              </label>
              <input
                :id="`answer-${index}`"
                v-model="selectedQuestion.answer"
                type="text"
                class="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                :placeholder="getAnswerPlaceholder(selectedQuestion.questionId)"
                required
                maxlength="100"
              />
              <p class="mt-1 text-xs text-gray-500">
                {{ selectedQuestion.answer.length }}/100 characters
              </p>
            </div>
          </div>

          <!-- Error Display -->
          <div v-if="error" class="rounded-md bg-red-50 p-4 mb-6">
            <div class="text-sm text-red-700">
              {{ error }}
            </div>
          </div>

          <!-- Success Display -->
          <div v-if="success" class="rounded-md bg-green-50 p-4 mb-6">
            <div class="text-sm text-green-700">
              {{ success }}
            </div>
          </div>

          <!-- Submit Button -->
          <div class="mt-8">
            <button
              type="submit"
              class="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              :disabled="submitting || !allQuestionsComplete"
            >
              {{ submitting ? 'Saving...' : 'Save Security Questions' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'

export default {
  name: 'SecurityQuestions',
  setup() {
    const authStore = useAuthStore()
    
    const loading = ref(true)
    const submitting = ref(false)
    const error = ref('')
    const success = ref('')
    
    const availableQuestions = ref([])
    const guidelines = ref({})
    
    const selectedQuestions = ref([
      { questionId: '', answer: '', guidance: '' },
      { questionId: '', answer: '', guidance: '' },
      { questionId: '', answer: '', guidance: '' }
    ])

    const questionCategories = computed(() => {
      const categories = [...new Set(availableQuestions.value.map(q => q.category))]
      return categories.sort()
    })

    const allQuestionsComplete = computed(() => {
      return selectedQuestions.value.every(q => q.questionId && q.answer.trim())
    })

    const loadQuestions = async () => {
      try {
        loading.value = true
        const response = await fetch('/api/auth/security-questions')
        const data = await response.json()
        
        if (response.ok) {
          availableQuestions.value = data.questions
          guidelines.value = data.guidelines
        } else {
          error.value = data.message || 'Failed to load security questions'
        }
      } catch (err) {
        console.error('Load questions error:', err)
        error.value = 'Failed to load security questions'
      } finally {
        loading.value = false
      }
    }

    const getQuestionsByCategory = (category) => {
      return availableQuestions.value.filter(q => q.category === category)
    }

    const formatCategoryName = (category) => {
      return category.split('_').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
      ).join(' ')
    }

    const isQuestionSelected = (questionId, currentIndex) => {
      return selectedQuestions.value.some((q, index) => 
        index !== currentIndex && q.questionId === questionId
      )
    }

    const updateQuestionText = (index) => {
      const questionId = selectedQuestions.value[index].questionId
      const question = availableQuestions.value.find(q => q.id === questionId)
      if (question) {
        selectedQuestions.value[index].guidance = question.guidance
      }
    }

    const getAnswerPlaceholder = (questionId) => {
      const question = availableQuestions.value.find(q => q.id === questionId)
      if (!question) return 'Enter your answer...'
      
      // Provide specific placeholders based on question type
      if (questionId.includes('number') || questionId.includes('year') || questionId.includes('digits')) {
        return 'Enter numbers only...'
      } else if (questionId.includes('name')) {
        return 'Enter the name...'
      } else {
        return 'Enter your answer...'
      }
    }

    const submitQuestions = async () => {
      try {
        submitting.value = true
        error.value = ''
        success.value = ''

        // Validate all questions are different
        const questionIds = selectedQuestions.value.map(q => q.questionId)
        if (new Set(questionIds).size !== questionIds.length) {
          error.value = 'Please select different questions for each slot'
          return
        }

        // Prepare data for submission
        const questionsData = selectedQuestions.value.map(q => ({
          questionId: q.questionId,
          answer: q.answer.trim()
        }))

        const response = await fetch('/api/auth/security-questions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authStore.token}`
          },
          body: JSON.stringify({ questions: questionsData })
        })

        const data = await response.json()

        if (response.ok) {
          success.value = 'Security questions saved successfully!'
          // Optionally redirect or emit event
          setTimeout(() => {
            success.value = ''
          }, 5000)
        } else {
          error.value = data.message || 'Failed to save security questions'
        }
      } catch (err) {
        console.error('Submit questions error:', err)
        error.value = 'Failed to save security questions'
      } finally {
        submitting.value = false
      }
    }

    onMounted(() => {
      loadQuestions()
    })

    return {
      loading,
      submitting,
      error,
      success,
      availableQuestions,
      guidelines,
      selectedQuestions,
      questionCategories,
      allQuestionsComplete,
      getQuestionsByCategory,
      formatCategoryName,
      isQuestionSelected,
      updateQuestionText,
      getAnswerPlaceholder,
      submitQuestions
    }
  }
}
</script>

<style scoped>
.security-questions {
  max-width: 800px;
  margin: 0 auto;
}

.card {
  border: none;
  box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.075);
}

.card-header {
  background-color: #f8f9fa;
  border-bottom: 1px solid #dee2e6;
  padding: 1.5rem;
}

.card-title {
  color: #495057;
  margin-bottom: 0.5rem;
}

.alert {
  border: none;
  border-radius: 0.5rem;
}

.alert-info {
  background-color: #e7f3ff;
  color: #0c5460;
}

.alert-success {
  background-color: #d1edff;
  color: #0a3622;
}

.alert-danger {
  background-color: #f8d7da;
  color: #721c24;
}

.alert-light {
  background-color: #fefefe;
  border: 1px solid #e9ecef;
}

.form-select:focus,
.form-control:focus {
  border-color: #86b7fe;
  box-shadow: 0 0 0 0.25rem rgba(13, 110, 253, 0.25);
}

.btn-primary {
  background-color: #0d6efd;
  border-color: #0d6efd;
}

.btn-primary:hover {
  background-color: #0b5ed7;
  border-color: #0a58ca;
}

.card.border-light {
  border: 1px solid #e9ecef !important;
}

.text-primary {
  color: #0d6efd !important;
}

.text-success {
  color: #198754 !important;
}

.text-danger {
  color: #dc3545 !important;
}
</style>
