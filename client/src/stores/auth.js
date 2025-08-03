import { defineStore } from 'pinia'
import axios from 'axios'

// Configure axios defaults
axios.defaults.baseURL = 'http://localhost:3001/api'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    token: null,
    isLoading: false,
    error: null,
    isInitialized: false
  }),

  getters: {
    isAuthenticated: (state) => !!state.token && !!state.user && state.isInitialized,
    isAdmin: (state) => state.user?.role === 'admin',
    isInstructor: (state) => state.user?.role === 'instructor' || state.user?.role === 'admin',
    isStudent: (state) => state.user?.role === 'student'
  },

  actions: {
    // Set authentication token
    setToken(token) {
      this.token = token
      if (token) {
        localStorage.setItem('token', token)
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
      } else {
        localStorage.removeItem('token')
        delete axios.defaults.headers.common['Authorization']
      }
    },

    // Initialize auth state from localStorage
    async initAuth() {
      try {
        this.isLoading = true
        const token = localStorage.getItem('token')
        
        if (token) {
          this.setToken(token)
          try {
            await this.fetchUser()
          } catch (error) {
            console.error('Failed to fetch user during init:', error)
            // Only logout if it's a 401 (invalid token), not network errors
            if (error.response?.status === 401) {
              this.logout()
            } else {
              // For network errors, keep the token but mark as not authenticated
              this.user = null
            }
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error)
      } finally {
        this.isInitialized = true
        this.isLoading = false
      }
    },

    // Fetch current user
    async fetchUser() {
      try {
        this.isLoading = true
        const response = await axios.get('/users/profile')
        this.user = response.data
        this.error = null
        return response.data
      } catch (error) {
        console.error('Fetch user error:', error)
        this.error = error.response?.data?.message || 'Failed to fetch user'
        throw error
      } finally {
        this.isLoading = false
      }
    },

    // Login user
    async login(credentials) {
      try {
        this.isLoading = true
        this.error = null
        
        const response = await axios.post('/auth/login', credentials)
        const { token, user } = response.data
        
        this.setToken(token)
        this.user = user
        
        return { success: true, user }
      } catch (error) {
        console.error('Login error:', error)
        this.error = error.response?.data?.message || 'Login failed'
        return { success: false, error: this.error }
      } finally {
        this.isLoading = false
      }
    },

    // Register user
    async register(userData) {
      try {
        this.isLoading = true
        this.error = null
        
        const response = await axios.post('/auth/register', userData)
        const { token, user } = response.data
        
        this.setToken(token)
        this.user = user
        
        return { success: true, user }
      } catch (error) {
        console.error('Registration error:', error)
        this.error = error.response?.data?.message || 'Registration failed'
        return { success: false, error: this.error }
      } finally {
        this.isLoading = false
      }
    },

    // Logout user
    async logout() {
      try {
        // Call logout endpoint if authenticated
        if (this.token) {
          await axios.post('/auth/logout').catch(() => {
            // Ignore logout API errors - we still want to clear local state
          })
        }
      } catch (error) {
        console.error('Logout error:', error)
      } finally {
        // Clear local state regardless of API call success
        this.user = null
        this.setToken(null)
        this.error = null
        this.isInitialized = true // Keep initialized state
      }
    },

    // Change password
    async changePassword(passwordData) {
      try {
        this.isLoading = true
        this.error = null
        
        await axios.post('/auth/change-password', passwordData)
        
        return { success: true }
      } catch (error) {
        console.error('Change password error:', error)
        this.error = error.response?.data?.message || 'Failed to change password'
        return { success: false, error: this.error }
      } finally {
        this.isLoading = false
      }
    },

    // Clear error
    clearError() {
      this.error = null
    },

    // Retry failed requests with fresh token
    async retryWithAuth(originalRequest) {
      if (this.token && !originalRequest._retry) {
        originalRequest._retry = true
        try {
          await this.fetchUser() // Refresh user data
          return axios(originalRequest)
        } catch (error) {
          this.logout()
          throw error
        }
      }
      throw new Error('Authentication failed')
    }
  }
})

// Initialize axios interceptor for token refresh
axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      const authStore = useAuthStore()
      
      // If we're already on auth routes, don't retry
      if (originalRequest.url?.includes('/auth/')) {
        authStore.logout()
        return Promise.reject(error)
      }
      
      try {
        return await authStore.retryWithAuth(originalRequest)
      } catch (retryError) {
        return Promise.reject(error)
      }
    }
    
    return Promise.reject(error)
  }
)
