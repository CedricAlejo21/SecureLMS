<template>
  <div id="app" class="min-h-screen bg-gray-50">
    <!-- Navigation -->
    <nav v-if="authStore.isAuthenticated" class="bg-white shadow-sm border-b border-gray-200">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between h-16">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <h1 class="text-xl font-bold text-primary-600">Secure LMS</h1>
            </div>
            <div class="hidden md:ml-6 md:flex md:space-x-8">
              <router-link
                v-for="item in navigation"
                :key="item.name"
                :to="item.href"
                class="inline-flex items-center px-1 pt-1 text-sm font-medium transition-colors duration-200"
                :class="$route.path === item.href 
                  ? 'border-b-2 border-primary-500 text-gray-900' 
                  : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'"
              >
                <component :is="item.icon" class="w-4 h-4 mr-2" />
                {{ item.name }}
              </router-link>
            </div>
          </div>
          
          <div class="flex items-center space-x-4">
            <div class="flex items-center space-x-2">
              <span class="text-sm text-gray-700">{{ authStore.user?.firstName }} {{ authStore.user?.lastName }}</span>
              <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize"
                    :class="roleClasses[authStore.user?.role]">
                {{ authStore.user?.role }}
              </span>
            </div>
            
            <Menu as="div" class="relative">
              <MenuButton class="flex items-center text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
                <UserCircleIcon class="w-8 h-8 text-gray-400" />
              </MenuButton>
              <transition
                enter-active-class="transition ease-out duration-100"
                enter-from-class="transform opacity-0 scale-95"
                enter-to-class="transform opacity-100 scale-100"
                leave-active-class="transition ease-in duration-75"
                leave-from-class="transform opacity-100 scale-100"
                leave-to-class="transform opacity-0 scale-95"
              >
                <MenuItems class="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                  <MenuItem v-slot="{ active }">
                    <router-link
                      to="/profile"
                      :class="[active ? 'bg-gray-100' : '', 'block px-4 py-2 text-sm text-gray-700']"
                    >
                      Your Profile
                    </router-link>
                  </MenuItem>
                  <MenuItem v-slot="{ active }">
                    <button
                      @click="handleLogout"
                      :class="[active ? 'bg-gray-100' : '', 'block w-full text-left px-4 py-2 text-sm text-gray-700']"
                    >
                      Sign out
                    </button>
                  </MenuItem>
                </MenuItems>
              </transition>
            </Menu>
          </div>
        </div>
      </div>
    </nav>

    <!-- Main Content -->
    <main class="flex-1">
      <router-view />
    </main>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { Menu, MenuButton, MenuItems, MenuItem } from '@headlessui/vue'
import { 
  UserCircleIcon,
  HomeIcon,
  BookOpenIcon,
  DocumentTextIcon,
  ChartBarIcon,
  UsersIcon,
  CogIcon
} from '@heroicons/vue/24/outline'
import { useAuthStore } from '@/stores/auth'
import { useToast } from 'vue-toastification'

const authStore = useAuthStore()
const router = useRouter()
const toast = useToast()

const roleClasses = {
  admin: 'bg-red-100 text-red-800',
  instructor: 'bg-blue-100 text-blue-800',
  student: 'bg-green-100 text-green-800'
}

const navigation = computed(() => {
  const baseNav = [
    { name: 'Dashboard', href: '/dashboard', icon: HomeIcon }
  ]
  
  if (authStore.user?.role === 'admin') {
    return [
      ...baseNav,
      { name: 'Users', href: '/users', icon: UsersIcon },
      { name: 'Courses', href: '/courses', icon: BookOpenIcon },
      { name: 'Audit Logs', href: '/audit', icon: DocumentTextIcon },
      { name: 'Settings', href: '/settings', icon: CogIcon }
    ]
  } else if (authStore.user?.role === 'instructor') {
    return [
      ...baseNav,
      { name: 'My Courses', href: '/courses', icon: BookOpenIcon },
      { name: 'Assignments', href: '/assignments', icon: DocumentTextIcon },
      { name: 'Grades', href: '/grades', icon: ChartBarIcon }
    ]
  } else {
    return [
      ...baseNav,
      { name: 'My Courses', href: '/courses', icon: BookOpenIcon },
      { name: 'Assignments', href: '/assignments', icon: DocumentTextIcon },
      { name: 'Grades', href: '/grades', icon: ChartBarIcon }
    ]
  }
})

const handleLogout = async () => {
  try {
    await authStore.logout()
    toast.success('Logged out successfully')
    router.push('/login')
  } catch (error) {
    toast.error('Error logging out')
  }
}
</script>
