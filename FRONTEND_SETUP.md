# Frontend Layout Setup - Complete ✅

## Layout Structure

### Root Layout (`app/layout.tsx`)
- Server component (Next.js 13+ App Router)
- Provides global styles and HTML structure
- No authentication logic here

### Dashboard Layout (`app/(dashboard)/layout.tsx`)
- Client component with authentication
- Includes:
  - **Sidebar** - Navigation menu with role-based items
  - **Header** - User info and logout
  - **ProtectedRoute** - Authentication guard
  - Main content area

### Auth Layout (`app/(auth)/`)
- Public routes (login, register, forgot password)
- No layout wrapper needed

## Components Created

### 1. **Header Component** (`components/layout/Header.tsx`)
- Displays user name and role
- User avatar with initials
- Logout button
- Responsive design

### 2. **Sidebar Component** (`components/layout/Sidebar.tsx`)
- Role-based navigation menu
- Icons from Heroicons
- Active route highlighting
- Menu items:
  - **All Users**: Dashboard, Profile, Leaves, Salary
  - **HR Only**: Reports
  - **HR Manager Only**: Users, Leave Management, Salary Management, Bulk Upload

### 3. **ProtectedRoute Component** (`components/layout/ProtectedRoute.tsx`)
- Authentication guard
- Role-based access control
- Loading states
- Redirects to login if not authenticated

## State Management

### Auth Store (`store/authStore.ts`)
- Zustand store with persistence
- Manages:
  - User data
  - Authentication token
  - Login/logout functions
  - Password change requirement
  - Auto token refresh

### useAuth Hook (`hooks/useAuth.ts`)
- Convenient hook for auth state
- Provides:
  - User data
  - Authentication status
  - Role helpers (isHRManager, isHRExecutive, isEmployee, isHR)
  - Auth functions

## Pages Created

### 1. **Login Page** (`app/(auth)/login/page.tsx`)
- Email/password login
- Forced password change modal (if required)
- Error handling
- Link to forgot password

### 2. **Dashboard Page** (`app/page.tsx`)
- Welcome message
- Role-based stats (HR only)
- Quick action cards
- Responsive grid layout

## Navigation Structure

```
/ (Dashboard)
├── /profile (User Profile)
├── /leaves (Leave Management)
│   ├── /leaves/request (New Leave Request)
│   └── /leaves/history (Leave History)
├── /salary (Salary Management)
│   └── /salary/slips/[id] (Salary Slip Details)
├── /reports (Reports - HR Only)
└── /admin (Admin - HR Only)
    ├── /admin/users (User Management)
    ├── /admin/leaves (Leave Approval)
    ├── /admin/salary (Salary Management)
    └── /admin/upload (Bulk Upload)
```

## Features Implemented

✅ Authentication system with JWT
✅ Role-based access control
✅ Protected routes
✅ Forced password change on first login
✅ Persistent authentication state
✅ Responsive sidebar navigation
✅ User profile display in header
✅ Dashboard with role-based content
✅ Loading states
✅ Error handling

## Dependencies Installed

- `zustand` - State management
- `@heroicons/react` - Icons
- `axios` - HTTP client (already installed)
- `react-query` - Data fetching (already installed)

## Next Steps

1. **Create remaining pages:**
   - Profile page
   - Leave request form
   - Leave history
   - Salary slips list
   - Salary slip detail
   - Admin pages (users, leaves, salary, upload)
   - Reports page

2. **Add form components:**
   - Leave request form with file upload
   - User creation form
   - Salary structure editor

3. **Add data fetching:**
   - Use React Query for API calls
   - Create custom hooks for each feature

4. **Add UI components:**
   - Tables for data display
   - Modals for confirmations
   - Forms with validation
   - File upload components

## Environment Variables

Create `.env.local` in frontend directory:
```
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

## Running the Application

```bash
cd frontend
npm install
npm run dev
```

The application will be available at `http://localhost:3000`

## Authentication Flow

1. User visits any protected route
2. `ProtectedRoute` checks authentication
3. If not authenticated → redirect to `/login`
4. After login → check if password change required
5. If required → show password change modal
6. After password change → redirect to dashboard
7. All subsequent requests include JWT token

## Role-Based Access

- **HR Manager**: Full access to all features
- **HR Executive**: Access to leaves, salary, reports (no user management)
- **Employee**: Access to own profile, leaves, salary slips

The layout automatically shows/hides menu items based on user role.
