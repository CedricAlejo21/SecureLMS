<template>
  <div class="min-h-screen bg-gray-50 py-8">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="sm:flex sm:items-center">
        <div class="sm:flex-auto">
          <h1 class="text-2xl font-semibold text-gray-900">User Management</h1>
          <p class="mt-2 text-sm text-gray-700">
            Manage system users, create new accounts, and view user activity.
          </p>
        </div>
        <div class="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <button
            @click="showCreateModal = true"
            type="button"
            class="inline-flex items-center justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:w-auto"
          >
            Add User
          </button>
        </div>
      </div>

      <!-- Users Table -->
      <div class="mt-8 flex flex-col">
        <div class="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div class="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
            <div class="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
              <table class="min-w-full divide-y divide-gray-300">
                <thead class="bg-gray-50">
                  <tr>
                    <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                      User
                    </th>
                    <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Role
                    </th>
                    <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Status
                    </th>
                    <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Last Login
                    </th>
                    <th scope="col" class="relative px-6 py-3">
                      <span class="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody class="bg-white divide-y divide-gray-200">
                  <tr v-for="user in users" :key="user._id">
                    <td class="px-6 py-4 whitespace-nowrap">
                      <div class="flex items-center">
                        <div class="flex-shrink-0 h-10 w-10">
                          <div class="h-10 w-10 rounded-full bg-indigo-500 flex items-center justify-center">
                            <span class="text-sm font-medium text-white">
                              {{ user.firstName?.[0] }}{{ user.lastName?.[0] }}
                            </span>
                          </div>
                        </div>
                        <div class="ml-4">
                          <div class="text-sm font-medium text-gray-900">
                            {{ user.firstName }} {{ user.lastName }}
                          </div>
                          <div class="text-sm text-gray-500">{{ user.email }}</div>
                        </div>
                      </div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full"
                            :class="{
                              'bg-red-100 text-red-800': user.role === 'admin',
                              'bg-blue-100 text-blue-800': user.role === 'instructor',
                              'bg-green-100 text-green-800': user.role === 'student'
                            }">
                        {{ user.role }}
                      </span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full"
                            :class="{
                              'bg-green-100 text-green-800': user.isActive,
                              'bg-red-100 text-red-800': !user.isActive
                            }">
                        {{ user.isActive ? 'Active' : 'Inactive' }}
                      </span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {{ user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never' }}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        @click="toggleUserStatus(user)"
                        class="text-indigo-600 hover:text-indigo-900 mr-4"
                      >
                        {{ user.isActive ? 'Deactivate' : 'Activate' }}
                      </button>
                      <button
                        @click="viewUserActivity(user)"
                        class="text-indigo-600 hover:text-indigo-900"
                      >
                        View Activity
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useAuthStore } from '../stores/auth'
import axios from 'axios'

const authStore = useAuthStore()
const users = ref([])
const loading = ref(false)
const showCreateModal = ref(false)

const fetchUsers = async () => {
  try {
    loading.value = true
    const response = await axios.get('/users', {
      headers: {
        Authorization: `Bearer ${authStore.token}`
      }
    })
    users.value = response.data
  } catch (error) {
    console.error('Error fetching users:', error)
  } finally {
    loading.value = false
  }
}

const toggleUserStatus = async (user) => {
  try {
    const endpoint = user.isActive ? 'deactivate' : 'activate'
    await axios.put(`/users/${user._id}/${endpoint}`, {}, {
      headers: {
        Authorization: `Bearer ${authStore.token}`
      }
    })
    await fetchUsers() // Refresh the user list
  } catch (error) {
    console.error('Error toggling user status:', error)
  }
}

const viewUserActivity = (user) => {
  // Navigate to audit logs filtered by user
  window.location.href = `/audit-logs?user=${user._id}`
}

onMounted(() => {
  fetchUsers()
})
</script>
