<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-md w-full space-y-8">
      <div class="text-center">
        <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Reset Your Password
        </h2>
        <p class="mt-2 text-center text-sm text-gray-600">
          Use your security questions to reset your password
        </p>
      </div>
      <!-- Step 1: Enter Username/Email -->
      <div v-if="currentStep === 1">
        <div class="mb-6">
          <div class="flex items-center mb-4">
            <span class="inline-flex items-center justify-center w-8 h-8 bg-blue-600 text-white rounded-full text-sm font-medium mr-3">1</span>
            <h3 class="text-lg font-medium text-gray-900">Enter Your Account Information</h3>
          </div>
        </div>
        
        <form class="space-y-6" @submit.prevent="initiateReset">
          <div>
            <label for="identifier" class="block text-sm font-medium text-gray-700">Username or Email</label>
            <input
              id="identifier"
              v-model="identifier"
              type="text"
              class="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
              placeholder="Enter your username or email"
              required
              :disabled="loading"
            />
          </div>

          <div v-if="error" class="rounded-md bg-red-50 p-4">
            <div class="text-sm text-red-700">
              {{ error }}
            </div>
          </div>

          <div>
            <button
              type="submit"
              class="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              :disabled="loading || !identifier.trim()"
            >
              {{ loading ? 'Searching...' : 'Find Account' }}
            </button>
          </div>
        </form>
      </div>

      <!-- Step 2: Answer Security Questions -->
      <div v-else-if="currentStep === 2">
        <div class="mb-6">
          <div class="flex items-center mb-4">
            <span class="inline-flex items-center justify-center w-8 h-8 bg-blue-600 text-white rounded-full text-sm font-medium mr-3">2</span>
            <h3 class="text-lg font-medium text-gray-900">Answer Security Questions</h3>
          </div>
        </div>

        <div class="rounded-md bg-blue-50 p-4 mb-6">
          <div class="text-sm text-blue-700">
            Please answer all security questions correctly to proceed with password reset.
          </div>
        </div>

        <form class="space-y-6" @submit.prevent="verifyAnswers">
          <div v-for="(question, index) in securityQuestions" :key="question.questionId" class="space-y-4">
            <div class="bg-white border border-gray-200 rounded-lg p-4">
              <div class="mb-3">
                <h6 class="text-sm font-medium text-blue-600 mb-2">
                  Question {{ index + 1 }} of {{ securityQuestions.length }}
                </h6>
                
                <p class="font-medium text-gray-900 mb-3">{{ question.question }}</p>
                
                <div v-if="question.guidance" class="bg-gray-50 rounded-md p-3 mb-3">
                  <p class="text-xs text-gray-600">
                    💡 {{ question.guidance }}
                  </p>
                </div>

                <input
                  v-model="answers[question.questionId]"
                  type="text"
                  class="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  :placeholder="getAnswerPlaceholder(question.questionId)"
                  required
                  maxlength="100"
                  :disabled="loading"
                />
              </div>
            </div>
          </div>

          <div v-if="error" class="rounded-md bg-red-50 p-4">
            <div class="text-sm text-red-700">
              {{ error }}
            </div>
          </div>

          <div class="flex space-x-3">
            <button
              type="button"
              class="flex-1 py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              @click="goBack"
              :disabled="loading"
            >
              ← Back
            </button>
            <button
              type="submit"
              class="flex-1 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              :disabled="loading || !allAnswersProvided"
            >
              {{ loading ? 'Verifying...' : 'Verify Answers' }}
            </button>
          </div>
        </form>
      </div>

      <!-- Step 3: Set New Password -->
      <div v-else-if="currentStep === 3">
        <div class="mb-6">
          <div class="flex items-center mb-4">
            <span class="inline-flex items-center justify-center w-8 h-8 bg-green-600 text-white rounded-full text-sm font-medium mr-3">3</span>
            <h3 class="text-lg font-medium text-gray-900">Set New Password</h3>
          </div>
        </div>

        <div class="rounded-md bg-green-50 p-4 mb-6">
          <div class="text-sm text-green-700">
            ✓ Security questions verified! You can now set a new password.
          </div>
        </div>

        <form class="space-y-6" @submit.prevent="resetPassword">
          <div>
            <label for="newPassword" class="block text-sm font-medium text-gray-700">New Password</label>
            <input
              id="newPassword"
              v-model="newPassword"
              type="password"
              class="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="Enter your new password"
              required
              minlength="12"
              maxlength="128"
              :disabled="loading"
            />
            <p class="mt-1 text-xs text-gray-500">
              Password must be 12-128 characters with uppercase, lowercase, number, and special character (@$!%*?&)
            </p>
          </div>

          <div>
            <label for="confirmPassword" class="block text-sm font-medium text-gray-700">Confirm New Password</label>
            <input
              id="confirmPassword"
              v-model="confirmPassword"
              type="password"
              class="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="Confirm your new password"
              required
              :disabled="loading"
            />
          </div>

          <!-- Password Strength Indicator -->
          <div v-if="newPassword">
            <div class="text-xs text-gray-500 mb-1">Password Strength:</div>
            <div class="w-full bg-gray-200 rounded-full h-2">
              <div
                class="h-2 rounded-full transition-all duration-300"
                :class="passwordStrengthClass"
                :style="{ width: passwordStrengthPercentage + '%' }"
              ></div>
            </div>
            <div class="text-xs mt-1" :class="passwordStrengthTextClass">
              {{ passwordStrengthText }}
            </div>
          </div>

          <div v-if="error" class="rounded-md bg-red-50 p-4">
            <div class="text-sm text-red-700">
              {{ error }}
            </div>
          </div>

          <div class="rounded-md bg-yellow-50 p-4">
            <div class="text-sm text-yellow-700">
              ⏰ <strong>Time Limit:</strong> You have {{ timeRemaining }} to complete the password reset.
            </div>
          </div>

          <div>
            <button
              type="submit"
              class="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
              :disabled="loading || !passwordsMatch || !isPasswordValid"
            >
              {{ loading ? 'Resetting...' : 'Reset Password' }}
            </button>
          </div>
        </form>
      </div>

      <!-- Step 4: Success -->
      <div v-else-if="currentStep === 4">
        <div class="text-center py-8">
          <div class="mb-4">
            <div class="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100">
              <svg class="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
              </svg>
            </div>
          </div>
          <h3 class="text-lg font-medium text-gray-900 mb-2">Password Reset Successful!</h3>
          <p class="text-sm text-gray-600 mb-6">
            Your password has been successfully reset. You can now log in with your new password.
          </p>
          <div>
            <router-link 
              to="/login" 
              class="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Go to Login
            </router-link>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, onUnmounted } from 'vue'

export default {
  name: 'PasswordReset',
  setup() {
    const currentStep = ref(1)
    const loading = ref(false)
    const error = ref('')
    
    // Step 1 data
    const identifier = ref('')
    
    // Step 2 data
    const securityQuestions = ref([])
    const answers = ref({})
    const userId = ref('')
    
    // Step 3 data
    const resetToken = ref('')
    const newPassword = ref('')
    const confirmPassword = ref('')
    const tokenExpiry = ref(null)
    const timeRemaining = ref('')
    
    // Timer for token expiry
    let countdownTimer = null

    const allAnswersProvided = computed(() => {
      return securityQuestions.value.every(q => answers.value[q.questionId]?.trim())
    })

    const passwordsMatch = computed(() => {
      return newPassword.value && confirmPassword.value && newPassword.value === confirmPassword.value
    })

    const isPasswordValid = computed(() => {
      const password = newPassword.value
      if (!password) return false
      
      const hasMinLength = password.length >= 12
      const hasMaxLength = password.length <= 128
      const hasUppercase = /[A-Z]/.test(password)
      const hasLowercase = /[a-z]/.test(password)
      const hasNumber = /\d/.test(password)
      const hasSpecialChar = /[@$!%*?&]/.test(password)
      
      return hasMinLength && hasMaxLength && hasUppercase && hasLowercase && hasNumber && hasSpecialChar
    })

    const passwordStrengthPercentage = computed(() => {
      const password = newPassword.value
      if (!password) return 0
      
      let score = 0
      if (password.length >= 12) score += 20
      if (password.length >= 16) score += 10
      if (/[A-Z]/.test(password)) score += 20
      if (/[a-z]/.test(password)) score += 20
      if (/\d/.test(password)) score += 15
      if (/[@$!%*?&]/.test(password)) score += 15
      
      return Math.min(score, 100)
    })

    const passwordStrengthClass = computed(() => {
      const percentage = passwordStrengthPercentage.value
      if (percentage < 40) return 'bg-danger'
      if (percentage < 70) return 'bg-warning'
      return 'bg-success'
    })

    const passwordStrengthText = computed(() => {
      const percentage = passwordStrengthPercentage.value
      if (percentage < 40) return 'Weak'
      if (percentage < 70) return 'Medium'
      return 'Strong'
    })

    const passwordStrengthTextClass = computed(() => {
      const percentage = passwordStrengthPercentage.value
      if (percentage < 40) return 'text-danger'
      if (percentage < 70) return 'text-warning'
      return 'text-success'
    })

    const getAnswerPlaceholder = (questionId) => {
      if (questionId.includes('number') || questionId.includes('year') || questionId.includes('digits')) {
        return 'Enter numbers only...'
      } else if (questionId.includes('name')) {
        return 'Enter the name...'
      } else {
        return 'Enter your answer...'
      }
    }

    const startCountdown = () => {
      if (!tokenExpiry.value) return
      
      countdownTimer = setInterval(() => {
        const now = new Date().getTime()
        const expiry = new Date(tokenExpiry.value).getTime()
        const distance = expiry - now
        
        if (distance > 0) {
          const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60))
          const seconds = Math.floor((distance % (1000 * 60)) / 1000)
          timeRemaining.value = `${minutes}:${seconds.toString().padStart(2, '0')}`
        } else {
          timeRemaining.value = 'Expired'
          clearInterval(countdownTimer)
          error.value = 'Reset token has expired. Please start over.'
        }
      }, 1000)
    }

    const initiateReset = async () => {
      try {
        loading.value = true
        error.value = ''
        
        const response = await fetch('/api/auth/password-reset/initiate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ identifier: identifier.value.trim() })
        })

        const data = await response.json()

        if (response.ok) {
          if (data.hasQuestions) {
            securityQuestions.value = data.questions
            userId.value = data.userId
            answers.value = {}
            currentStep.value = 2
          } else {
            error.value = 'Account not found or security questions not set up. Please contact support.'
          }
        } else {
          error.value = data.message || 'Failed to initiate password reset'
        }
      } catch (err) {
        console.error('Initiate reset error:', err)
        error.value = 'Failed to initiate password reset'
      } finally {
        loading.value = false
      }
    }

    const verifyAnswers = async () => {
      try {
        loading.value = true
        error.value = ''

        const answersArray = securityQuestions.value.map(q => ({
          questionId: q.questionId,
          answer: answers.value[q.questionId].trim()
        }))

        const response = await fetch('/api/auth/password-reset/verify', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            userId: userId.value,
            answers: answersArray
          })
        })

        const data = await response.json()

        if (response.ok) {
          resetToken.value = data.resetToken
          tokenExpiry.value = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes from now
          currentStep.value = 3
          startCountdown()
        } else {
          error.value = data.message || 'Security question verification failed'
        }
      } catch (err) {
        console.error('Verify answers error:', err)
        error.value = 'Failed to verify security questions'
      } finally {
        loading.value = false
      }
    }

    const resetPassword = async () => {
      try {
        loading.value = true
        error.value = ''

        if (!passwordsMatch.value) {
          error.value = 'Passwords do not match'
          return
        }

        if (!isPasswordValid.value) {
          error.value = 'Password does not meet security requirements'
          return
        }

        const response = await fetch('/api/auth/password-reset/complete', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            resetToken: resetToken.value,
            newPassword: newPassword.value
          })
        })

        const data = await response.json()

        if (response.ok) {
          currentStep.value = 4
          clearInterval(countdownTimer)
        } else {
          error.value = data.message || 'Failed to reset password'
        }
      } catch (err) {
        console.error('Reset password error:', err)
        error.value = 'Failed to reset password'
      } finally {
        loading.value = false
      }
    }

    const goBack = () => {
      currentStep.value = 1
      error.value = ''
      securityQuestions.value = []
      answers.value = {}
      userId.value = ''
    }

    onUnmounted(() => {
      if (countdownTimer) {
        clearInterval(countdownTimer)
      }
    })

    return {
      currentStep,
      loading,
      error,
      identifier,
      securityQuestions,
      answers,
      userId,
      resetToken,
      newPassword,
      confirmPassword,
      timeRemaining,
      allAnswersProvided,
      passwordsMatch,
      isPasswordValid,
      passwordStrengthPercentage,
      passwordStrengthClass,
      passwordStrengthText,
      passwordStrengthTextClass,
      getAnswerPlaceholder,
      initiateReset,
      verifyAnswers,
      resetPassword,
      goBack
    }
  }
}
</script>

<style scoped>
.password-reset {
  max-width: 600px;
  margin: 0 auto;
  padding: 2rem 1rem;
}

.card {
  border: none;
  box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15);
  border-radius: 1rem;
}

.card-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 1rem 1rem 0 0 !important;
  padding: 2rem;
}

.card-title {
  margin-bottom: 0.5rem;
  font-weight: 600;
}

.badge {
  font-size: 0.875rem;
}

.alert {
  border: none;
  border-radius: 0.75rem;
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

.alert-warning {
  background-color: #fff3cd;
  color: #856404;
}

.alert-light {
  background-color: #fefefe;
  border: 1px solid #e9ecef;
}

.form-control:focus {
  border-color: #667eea;
  box-shadow: 0 0 0 0.25rem rgba(102, 126, 234, 0.25);
}

.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  border-radius: 0.75rem;
  font-weight: 500;
}

.btn-primary:hover {
  background: linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%);
  transform: translateY(-1px);
}

.btn-success {
  background: linear-gradient(135deg, #56ab2f 0%, #a8e6cf 100%);
  border: none;
  border-radius: 0.75rem;
  font-weight: 500;
}

.btn-outline-secondary {
  border-radius: 0.75rem;
}

.card.border-light {
  border: 1px solid #e9ecef !important;
  border-radius: 0.75rem;
}

.progress {
  border-radius: 1rem;
}

.progress-bar {
  border-radius: 1rem;
}

.text-primary {
  color: #667eea !important;
}

.text-success {
  color: #28a745 !important;
}

.text-danger {
  color: #dc3545 !important;
}

.text-warning {
  color: #ffc107 !important;
}
</style>
