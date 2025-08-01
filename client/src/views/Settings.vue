<template>
  <div class="min-h-screen bg-gray-50 py-8">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="sm:flex sm:items-center">
        <div class="sm:flex-auto">
          <h1 class="text-2xl font-semibold text-gray-900">System Settings</h1>
          <p class="mt-2 text-sm text-gray-700">
            Configure system-wide settings and security policies.
          </p>
        </div>
      </div>

      <!-- Security Settings -->
      <div class="mt-8">
        <div class="bg-white shadow rounded-lg">
          <div class="px-4 py-5 sm:p-6">
            <h3 class="text-lg leading-6 font-medium text-gray-900">Security Configuration</h3>
            <div class="mt-2 max-w-xl text-sm text-gray-500">
              <p>Current security settings and policies for the system.</p>
            </div>
            <div class="mt-5">
              <div class="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label class="block text-sm font-medium text-gray-700">Password Policy</label>
                  <div class="mt-1 text-sm text-gray-600">
                    <ul class="list-disc list-inside space-y-1">
                      <li>Minimum 12 characters</li>
                      <li>Must contain uppercase, lowercase, number, and special character</li>
                      <li>Password history: 5 passwords</li>
                      <li>Minimum age: 24 hours</li>
                    </ul>
                  </div>
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700">Account Lockout</label>
                  <div class="mt-1 text-sm text-gray-600">
                    <ul class="list-disc list-inside space-y-1">
                      <li>Failed attempts threshold: 5</li>
                      <li>Lockout duration: 15 minutes</li>
                      <li>Automatic unlock after duration</li>
                    </ul>
                  </div>
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700">Session Management</label>
                  <div class="mt-1 text-sm text-gray-600">
                    <ul class="list-disc list-inside space-y-1">
                      <li>JWT token expiration: 24 hours</li>
                      <li>Re-authentication for critical operations</li>
                      <li>Automatic logout on token expiry</li>
                    </ul>
                  </div>
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700">Audit Logging</label>
                  <div class="mt-1 text-sm text-gray-600">
                    <ul class="list-disc list-inside space-y-1">
                      <li>All security events logged</li>
                      <li>Failed login attempts tracked</li>
                      <li>User activity monitoring</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- System Information -->
      <div class="mt-8">
        <div class="bg-white shadow rounded-lg">
          <div class="px-4 py-5 sm:p-6">
            <h3 class="text-lg leading-6 font-medium text-gray-900">System Information</h3>
            <div class="mt-5">
              <dl class="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                <div>
                  <dt class="text-sm font-medium text-gray-500">Application Version</dt>
                  <dd class="mt-1 text-sm text-gray-900">1.0.0</dd>
                </div>
                <div>
                  <dt class="text-sm font-medium text-gray-500">Environment</dt>
                  <dd class="mt-1 text-sm text-gray-900">Development</dd>
                </div>
                <div>
                  <dt class="text-sm font-medium text-gray-500">Database Status</dt>
                  <dd class="mt-1 text-sm text-green-600">Connected</dd>
                </div>
                <div>
                  <dt class="text-sm font-medium text-gray-500">Security Headers</dt>
                  <dd class="mt-1 text-sm text-green-600">Enabled</dd>
                </div>
              </dl>
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

const authStore = useAuthStore()

onMounted(() => {
  // Component mounted
})
</script>
