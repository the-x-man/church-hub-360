# FMT Template 1

A comprehensive React application template for FMT Software Solutions that can be packaged as both an Electron desktop app and a web application. This template includes user management, app versioning system, and a complete Supabase backend setup.

## 🚀 Features

- **React 19** with TypeScript
- **React Router DOM** with HashRouter for Electron compatibility
- **Comprehensive Authentication System** with protected routes
- **Electron** support for desktop applications
- **Supabase** integration for backend services
- **User Management System** with authentication and profiles
- **App Versioning System** for release management
- **Row Level Security (RLS)** policies for data protection
- **Tailwind CSS v4** for styling
- **shadcn/ui** component library
- **Bun** as package manager and runtime
- **TypeScript** with comprehensive type definitions

## 📋 Prerequisites

- [Bun](https://bun.sh/) (latest version)
- [Node.js](https://nodejs.org/) (v20 or higher)
- [Supabase CLI](https://supabase.com/docs/guides/cli) (for database management)
- A Supabase project (hosted)

## 🛠️ Getting Started

### 1. Clone and Setup

```bash
git clone <repository-url>
cd fmt-template-1
```

### 2. Run Setup Script

**Important:** Run the setup script first to customize your project:

```bash
node scripts/setup.js
```

This script will:

- Prompt you for your project name
- Ask for a project description
- Update `package.json` with your project name
- Update `index.html` with your project title and description
- Customize the template for your specific project

### 3. Install Dependencies

```bash
bun install
```

### 4. Environment Setup

1. Copy the example environment file:

   ```bash
   cp .env.example .env or .env.local
   ```

2. Update `.env` with your Supabase credentials:
   ```env
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   VITE_EDGE_FUNCTION_SECRET=your_edge_function_secret_here
   ```

### 5. Database Setup

**Important:** Run the migration files in the correct order:

1. **User Profiles** (first):

   ```sql
   -- Run: supabase/migrations/user_profiles.sql
   ```

2. **Auth Users** (second):

   ```sql
   -- Run: supabase/migrations/auth_users.sql
   ```

3. **App Versions** (third):
   ```sql
   -- Run: supabase/migrations/app_versions.sql
   ```

**Using Supabase CLI:**

```bash
# Link your project
supabase link --project-ref your-project-ref

# Apply migrations
supabase db push
```

**Using Supabase Dashboard:**

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Run each migration file in the order specified above

### 6. Edge Function Authentication

**Important:** This template includes secure edge functions that use Supabase's native authentication system to prevent unauthorized access.

#### Authentication Method:

Edge functions in this template use **Supabase Auth tokens** for security:

- **Authenticated Requests:** Users with valid session tokens can access edge functions
- **Anonymous Requests:** Unauthenticated users can access specific functions (like OTP requests) using the anon key

#### Setup Steps:

1. **Deploy Edge Functions:**

   ```bash
   # Deploy the send-otp function
   supabase functions deploy send-otp
   ```

2. **Configure Email Service (Required for OTP):**
   - Go to your Supabase project dashboard
   - Navigate to Edge Functions → Settings
   - Add a new secret: `RESEND_API_KEY`
   - Get your API key from [Resend.com](https://resend.com)

#### Security Features:

- **Native Auth Integration:** Uses Supabase's authentication system
- **Token Validation:** Verifies user sessions and permissions
- **RLS Compliance:** Works seamlessly with Row Level Security
- **Flexible Access:** Supports both authenticated and anonymous requests

#### Edge Functions Included:

- **send-otp:** Secure OTP generation and email delivery for authentication
- **publish-releases:** Application release management (if applicable)

#### How It Works:

- Frontend sends requests with `Authorization: Bearer <token>` header
- Edge functions verify the token using Supabase Auth
- Authenticated users get full access, anonymous users get limited access
- No secrets exposed to the frontend bundle

### 7. Development

```bash
# Start development server
bun run dev

# Build for production
bun run build
```

### 8. Electron (Desktop App)

```bash
# Install Electron dependencies
bun add -D electron electron-builder

# Run as desktop app
bun run electron:dev

# Build desktop app
bun run electron:build
```

## 📊 Database Schema

### Tables Overview

1. **profiles** - User profile information

   - Personal details (name, email, phone, etc.)
   - Avatar and demographic data
   - RLS enabled for authenticated users

2. **auth_users** - Authentication metadata

   - Links to auth.users and profiles
   - Login tracking and user flags
   - RLS enabled for authenticated users

3. **app_versions** - Application release management
   - Version information and release notes
   - Platform-specific downloads
   - Release status and critical update flags
   - RLS enabled for authenticated users

### Security Features

- **Row Level Security (RLS)** enabled on all tables
- **Authenticated user access** - Only logged-in users can access data
- **Foreign key constraints** for data integrity
- **Unique constraints** to prevent duplicates

## 🏗️ Project Structure

```
src/
├── components/          # React components
│   ├── auth/           # Authentication components
│   │   ├── AuthRoute.tsx      # Auth page access control
│   │   └── ProtectedRoute.tsx # Protected route authentication
│   ├── layout/         # Layout components
│   │   ├── Header.tsx         # Fixed header with user info
│   │   ├── Sidebar.tsx        # Navigation sidebar
│   │   └── MainLayout.tsx     # Main layout wrapper
│   └── ui/             # shadcn/ui components
├── contexts/           # React contexts
│   └── AuthContext.tsx # Authentication state management
├── pages/              # Application pages
│   ├── auth/          # Authentication pages
│   │   ├── Login.tsx          # Login page
│   │   └── PasswordReset.tsx  # Password reset page
│   ├── Dashboard.tsx   # Main dashboard
│   ├── Users.tsx       # User management
│   ├── AppVersions.tsx # Version management
│   ├── Settings.tsx    # Application settings
│   └── TestRoutes.tsx  # Development testing (dev only)
├── router/             # Routing configuration
│   └── AppRouter.tsx   # Main router setup
├── lib/                # Utility functions
├── types/              # TypeScript type definitions
│   ├── app-versions.ts # App versioning types
│   ├── user-management.ts # User and profile types
│   └── index.ts        # Type exports
├── utils/              # Utility functions
│   └── supabase.ts     # Supabase client configuration
└── ...

supabase/
├── functions/          # Edge functions
│   └── publish-releases/ # Release publishing API
└── migrations/         # Database migrations
    ├── user_profiles.sql
    ├── auth_users.sql
    └── app_versions.sql
```

## 🧭 Routing System

### Route Structure

The application uses **HashRouter** for Electron compatibility with the following route structure:

#### Public Routes (Unauthenticated)

- `/login` - User login page
- `/password-reset` - Password reset page
- `/new-password` - New password page

#### Protected Routes (Authenticated)

- **All routes are protected by default** except those explicitly defined as public or session-required
- `/dashboard` - Main dashboard (default after login)
- Any new routes you add will automatically be protected

### Authentication Flow

1. **Unauthenticated users** are redirected to `/login`
2. **Authenticated users** accessing auth pages are redirected to `/dashboard`
3. **Route protection** uses two specialized components:
   - **AuthRoute**: Manages access to auth pages (`/login`, `/password-reset`, `/new-password`)
   - **ProtectedRoute**: Handles authentication for all protected application routes
4. **Authentication state** is managed by `AuthContext`

### Adding New Routes

When adding new routes to your application:

- **Protected routes**: Wrap with `ProtectedRoute` in AppRouter
- **Auth routes**: Wrap with `AuthRoute` in AppRouter (rare - only for new auth pages)
- **Public routes**: No wrapper needed (very rare in this template)

### Layout System

Protected routes use a consistent layout:

- **Fixed Header** - User info, notifications, sign-out
- **Fixed Sidebar** - Navigation menu with active state
- **Main Content** - Page content with proper spacing

### User Management

```typescript
import {
  Profile,
  AuthUser,
  AuthUserWithProfile,
} from './types/user-management';

// Type-safe user operations
const user: AuthUserWithProfile = {
  id: 'uuid',
  profile_id: 'uuid',
  is_first_login: false,
  profile: {
    id: 'uuid',
    email: 'user@example.com',
    first_name: 'John',
    last_name: 'Doe',
    // ... other profile fields
  },
};
```

### App Versioning

```typescript
import { AppVersion, CreateAppVersionInput } from './types/app-versions';

// Release management
const newVersion: CreateAppVersionInput = {
  version: '1.0.0',
  release_notes: 'Initial release',
  platforms: [
    {
      platform: 'win32',
      download_url: 'https://example.com/app-1.0.0-win32.exe',
      file_size: 50000000,
    },
  ],
};
```

## 🚀 Deployment

### Web Application

1. Build the project:

   ```bash
   bun run build
   ```

2. Deploy the `dist/` folder to your hosting provider

### Desktop Application

1. Configure Electron builder in `package.json`
2. Build for your target platforms:
   ```bash
   bun run electron:build
   ```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run `bun run build` to ensure no type errors
5. Submit a pull request

## 📄 License

This template is proprietary to FMT Software Solutions.

## 🆘 Support

For support and questions, contact FMT Software Solutions development team.

---

**Note:** This is a template project. Customize it according to your specific application requirements.
