import { defineStore } from 'pinia'
import axios from 'axios'

// Configure axios defaults
axios.defaults.baseURL = 'http://localhost:5000/api'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    token: localStorage.getItem('token'),
    isLoading: false,
    error: null
  }),

  getters: {
    isAuthenticated: (state) => !!state.token && !!state.user,
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
      const token = localStorage.getItem('token')
      if (token) {
        this.setToken(token)
        try {
          await this.fetchUser()
        } catch (error) {
          console.error('Failed to fetch user:', error)
          this.logout()
        }
      }
    },

    // Fetch current user
    async fetchUser() {
      try {
        this.isLoading = true
        const response = await axios.get('/auth/me')
        this.user = response.data
        this.error = null
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
          await axios.post('/auth/logout')
        }
      } catch (error) {
        console.error('Logout error:', error)
      } finally {
        // Clear local state regardless of API call success
        this.user = null
        this.setToken(null)
        this.error = null
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
    }
  }
})

// Initialize axios interceptor for token refresh
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const authStore = useAuthStore()
      authStore.logout()
    }
    return Promise.reject(error)
  }
)
