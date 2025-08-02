# SecureLMS Architecture Overview

## Architecture Pattern

This project uses a **Modern Full-Stack Architecture** with complete separation between frontend and backend, rather than traditional MVC.

```
┌─────────────────┐    HTTP API    ┌─────────────────┐
│   Frontend      │ ←────────────→ │    Backend      │
│   (Vue.js SPA)  │                │   (Express.js)  │
└─────────────────┘                └─────────────────┘
```

## Backend Structure (Express.js API)

### `/middleware/` - Security & Authentication Layer
- **`auth.js`** - JWT token validation, user authentication
- **`roleAuth.js`** - Role-based authorization (Admin/Instructor/Student)

### `/routes/` - API Endpoints (Controllers)
- **`auth.js`** - Login, register, password management
- **`users.js`** - User management (admin functions)
- **`courses.js`** - Course CRUD operations
- **`assignments.js`** - Assignment management
- **`submissions.js`** - Student submissions
- **`grades.js`** - Grading functionality
- **`audit.js`** - Security audit logs

### `/models/` - Data Layer
- Mongoose schemas with validation and business logic
- Database models for User, Course, Assignment, etc.

## Frontend Structure (Vue.js SPA)

### `/client/src/views/` - Page Components
- **`Login.vue`**, **`Dashboard.vue`**, **`Courses.vue`** - Main application pages
- Each view represents a different route/URL in the application

### `/client/src/router/` - Navigation
- **`index.js`** - Defines URL routes and maps them to views
- Handles client-side navigation (no page reloads)

### `/client/src/stores/` - State Management
- **`auth.js`** - Global authentication state using Pinia
- Manages user data, login status across all components

### `/client/src/contexts/` - Legacy (Unused)
- **`AuthContext.jsx`** - Leftover from React migration
- Not used in Vue.js applications

## Data Flow

```
1. User Interaction
   └→ Vue Views
      └→ Pinia Stores (state management)
         └→ HTTP API calls
            └→ Express Routes
               └→ Middleware (auth/validation)
                  └→ Mongoose Models
                     └→ MongoDB Database
```

## MVC vs This Architecture

| **Traditional MVC** | **This Project** |
|-------------------|------------------|
| Server-rendered pages | Client-side SPA |
| Controller → Model → View | API Routes → Models + Frontend Views → Stores |
| Tight coupling | Complete separation |
| Page reloads | Dynamic updates |

## Key Benefits

### Security
- **API-first design** allows multiple security layers
- **JWT authentication** with comprehensive middleware
- **Role-based access control** at API level
- **Audit logging** for all operations

### Scalability
- **Independent deployment** of frontend/backend
- **Horizontal scaling** possible for each tier
- **Technology flexibility** (can change frontend framework without affecting backend)

### User Experience
- **Single Page Application** - no page reloads
- **Real-time updates** through API calls
- **Responsive design** with modern UI frameworks

### Development
- **Clear separation of concerns**
- **Independent testing** of frontend/backend
- **Parallel development** by different teams
- **Modern tooling** (Vite, Vue DevTools, etc.)

This architecture is industry-standard for modern web applications and provides the foundation for secure, scalable, and maintainable software systems.