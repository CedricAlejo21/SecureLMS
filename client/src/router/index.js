import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'

// Import components (we'll create these)
import Home from '../views/Home.vue'
import Login from '../views/Login.vue'
import Register from '../views/Register.vue'
import AdminDashboard from '../views/AdminDashboard.vue'
import InstructorDashboard from '../views/InstructorDashboard.vue'
import StudentDashboard from '../views/StudentDashboard.vue'
import Courses from '../views/Courses.vue'
import CourseDetail from '../views/CourseDetail.vue'
import Assignments from '../views/Assignments.vue'
import AssignmentDetail from '../views/AssignmentDetail.vue'
import Grades from '../views/Grades.vue'
import Profile from '../views/Profile.vue'
import Users from '../views/Users.vue'
import AuditLogs from '../views/AuditLogs.vue'
import Settings from '../views/Settings.vue'
import NotFound from '../views/NotFound.vue'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home,
    meta: { requiresAuth: false }
  },
  {
    path: '/login',
    name: 'Login',
    component: Login,
    meta: { requiresAuth: false, hideForAuth: true }
  },
  {
    path: '/register',
    name: 'Register',
    component: Register,
    meta: { requiresAuth: false, hideForAuth: true }
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    redirect: (to) => {
      const authStore = useAuthStore()
      const roleRedirects = {
        admin: '/admin',
        instructor: '/instructor',
        student: '/student'
      }
      return roleRedirects[authStore.user?.role] || '/admin'
    },
    meta: { requiresAuth: true }
  },
  {
    path: '/admin',
    name: 'AdminDashboard',
    component: AdminDashboard,
    meta: { requiresAuth: true, roles: ['admin'] }
  },
  {
    path: '/instructor',
    name: 'InstructorDashboard',
    component: InstructorDashboard,
    meta: { requiresAuth: true, roles: ['instructor', 'admin'] }
  },
  {
    path: '/student',
    name: 'StudentDashboard',
    component: StudentDashboard,
    meta: { requiresAuth: true, roles: ['student'] }
  },
  {
    path: '/courses',
    name: 'Courses',
    component: Courses,
    meta: { requiresAuth: true }
  },
  {
    path: '/courses/:id',
    name: 'CourseDetail',
    component: CourseDetail,
    meta: { requiresAuth: true }
  },
  {
    path: '/assignments',
    name: 'Assignments',
    component: Assignments,
    meta: { requiresAuth: true }
  },
  {
    path: '/assignments/:id',
    name: 'AssignmentDetail',
    component: AssignmentDetail,
    meta: { requiresAuth: true }
  },
  {
    path: '/grades',
    name: 'Grades',
    component: Grades,
    meta: { requiresAuth: true }
  },
  {
    path: '/profile',
    name: 'Profile',
    component: Profile,
    meta: { requiresAuth: true }
  },
  {
    path: '/users',
    name: 'Users',
    component: Users,
    meta: { requiresAuth: true, roles: ['admin'] }
  },
  {
    path: '/audit-logs',
    name: 'AuditLogs',
    component: AuditLogs,
    meta: { requiresAuth: true, roles: ['admin'] }
  },
  {
    path: '/settings',
    name: 'Settings',
    component: Settings,
    meta: { requiresAuth: true, roles: ['admin'] }
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: NotFound
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// Navigation guard for authentication
router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()
  
  // Check if route requires authentication
  if (to.meta.requiresAuth) {
    if (!authStore.isAuthenticated) {
      // Redirect to login if not authenticated
      next({ name: 'Login', query: { redirect: to.fullPath } })
      return
    }
    
    // Check role-based access
    if (to.meta.roles && !to.meta.roles.includes(authStore.user?.role)) {
      // Redirect to appropriate dashboard based on role
      const roleRedirects = {
        admin: '/admin',
        instructor: '/instructor',
        student: '/student'
      }
      
      next(roleRedirects[authStore.user?.role] || '/dashboard')
      return
    }
  }
  
  // Hide login/register pages for authenticated users
  if (to.meta.hideForAuth && authStore.isAuthenticated) {
    // Redirect to appropriate dashboard based on role
    const roleRedirects = {
      admin: '/admin',
      instructor: '/instructor',
      student: '/student'
    }
    
    next(roleRedirects[authStore.user?.role] || '/dashboard')
    return
  }
  
  next()
})

export default router
