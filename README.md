# OXO Carriers Frontend - Next.js 16

Modern HRIS & Payroll management system frontend built with Next.js 16, TypeScript, and Tailwind CSS.

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: TanStack Query + Zustand
- **Forms**: React Hook Form
- **UI Components**: Custom components with Shadcn-style architecture
- **Authentication**: JWT tokens
- **HTTP Client**: Axios

## Project Structure

```
app/
├── (auth)/                  # Auth routes (login, register, etc.)
│   ├── login/
│   ├── register/
│   ├── forgot-password/
│   └── verify-email/
├── (dashboard)/             # Protected dashboard routes
│   ├── profile/
│   ├── leaves/
│   ├── salary/
│   ├── facilities/
│   ├── medical-insurance/
│   └── work-submissions/
├── admin/                   # Admin-only routes
│   ├── users/
│   ├── leaves/
│   ├── salary/
│   └── permissions/
├── layout.tsx               # Root layout
└── globals.css              # Global styles

components/
├── layout/                  # Layout components
├── forms/                   # Form components
├── modals/                  # Modal dialogs
└── ui/                      # UI primitives

hooks/
├── queries/                 # TanStack Query hooks
├── mutations/               # Mutation hooks
└── useAuth.ts              # Authentication hook

lib/
├── api.ts                   # API client
├── utils.ts                 # Utility functions
└── queryClient.ts          # React Query config

contexts/
├── ToastContext.tsx        # Toast notifications
└── SidebarContext.tsx      # Sidebar state

store/
└── authStore.ts            # Auth state (Zustand)

types/
├── api.ts                   # API types
└── index.ts                 # Common types
```

## Prerequisites

- Node.js 20+
- pnpm 8+
- Backend API running

## Setup

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Environment Configuration

Copy the example environment file:

```bash
cp .env.example .env
```

Edit `.env`:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api

# EmailJS (optional)
NEXT_PUBLIC_EMAILJS_SERVICE_ID=your_service_id
NEXT_PUBLIC_EMAILJS_TEMPLATE_ID=your_template_id
NEXT_PUBLIC_EMAILJS_PUBLIC_KEY=your_public_key
```

### 3. Start Development Server

```bash
pnpm dev
```

Application runs at `http://localhost:3000`

## Development

### Available Scripts

```bash
pnpm dev              # Start development server
pnpm build            # Build for production
pnpm start            # Serve production build
pnpm lint             # Run ESLint
pnpm test             # Run tests with Vitest
pnpm test:watch       # Watch mode
```

### Code Style

- ESLint with flat config
- Prettier for formatting
- TypeScript strict mode
- Tailwind CSS for styling

## Features

### Authentication
- JWT-based authentication
- Email verification
- Password reset
- Protected routes
- Role-based access control

### Employee Features
- Profile management
- Leave requests
- Salary slip viewing
- Facility bookings
- Medical insurance claims
- Work submission (consultants)

### Admin Features
- User management
- Leave approval
- Salary generation
- Facility management
- Report generation
- Permission management

### UI/UX
- Responsive design
- Dark mode support (planned)
- Toast notifications
- Modal dialogs
- Loading states
- Error handling

## API Integration

### API Client

```typescript
import api from '@/lib/api';

// GET request
const response = await api.get('/users');

// POST request
const response = await api.post('/leaves', data);
```

### TanStack Query

```typescript
import { useQuery, useMutation } from '@tanstack/react-query';

// Query
const { data, isLoading } = useQuery({
  queryKey: ['users'],
  queryFn: () => api.get('/users'),
});

// Mutation
const mutation = useMutation({
  mutationFn: (data) => api.post('/leaves', data),
  onSuccess: () => {
    // Handle success
  },
});
```

## Docker

### Development
```bash
docker-compose --profile dev up frontend-dev
```

### Production
```bash
docker-compose --profile production up frontend
```

## Build & Deploy

### Static Export (for cPanel)

```bash
# Build static export
pnpm build:deploy

# Output in deploy/ directory
```

### Server Deployment

```bash
# Build
pnpm build

# Start server
pnpm start
```

## Routing

Next.js 16 App Router with:
- Server Components by default
- Client Components with 'use client'
- Route groups for auth and dashboard
- Dynamic routes for detail pages
- API route handlers (if needed)

## Styling

### Tailwind CSS

Custom configuration in `tailwind.config.ts`:
- Custom colors
- Extended spacing
- Typography plugin
- Forms plugin

### Components

Following Shadcn UI architecture:
- Radix UI primitives
- Tailwind styling
- TypeScript support
- Accessible by default

## State Management

### Server State
- **TanStack Query**: API data caching and synchronization

### Client State
- **Zustand**: Authentication state
- **Context API**: UI state (sidebar, toasts)

## Testing

```bash
# Run tests
pnpm test

# Watch mode
pnpm test:watch

# Coverage
pnpm test:coverage
```

## Environment Variables

### Required
- `NEXT_PUBLIC_API_URL`: Backend API URL

### Optional
- `NEXT_PUBLIC_EMAILJS_SERVICE_ID`: EmailJS service
- `NEXT_PUBLIC_EMAILJS_TEMPLATE_ID`: EmailJS template
- `NEXT_PUBLIC_EMAILJS_PUBLIC_KEY`: EmailJS public key

## Troubleshooting

### API Connection Failed
1. Check backend is running
2. Verify `NEXT_PUBLIC_API_URL` in `.env`
3. Check CORS settings in backend

### Build Errors
1. Clear cache: `rm -rf .next`
2. Reinstall: `rm -rf node_modules && pnpm install`
3. Check TypeScript errors: `pnpm tsc --noEmit`

### Port Already in Use
```bash
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Performance

- Server Components for better performance
- Image optimization with Next.js Image
- Font optimization
- Code splitting
- Lazy loading

## Security

- HTTPS in production
- JWT token storage in memory
- XSS protection
- CSRF protection
- Input sanitization

## License

Proprietary - OXO International FZE
