# Next.js Base Project

Base project Next.js với tích hợp NestJS backend API.

## Features

- ✅ **Authentication**: Login, Register, Logout, Forgot/Reset Password
- ✅ **Token Management**: Auto refresh access token khi hết hạn
- ✅ **User Profile**: Xem và cập nhật thông tin profile, upload avatar
- ✅ **Notifications**: Hệ thống thông báo với phân trang
- ✅ **File Upload**: Upload file qua presigned URL (S3)
- ✅ **Role-based Access**: AuthGuard và RoleGuard components
- ✅ **Google OAuth**: Đăng nhập bằng Google

## Project Structure

```
src/
├── app/                    # App Router pages
│   ├── (auth)/            # Auth pages (login, register, ...)
│   ├── (protected)/       # Protected pages (profile, notifications)
│   ├── unauthorized/      # Unauthorized page
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page
├── components/            # React components
│   ├── auth-guard.tsx     # Auth protection component
│   ├── role-guard.tsx     # Role-based protection
│   └── providers.tsx      # Context providers
├── contexts/              # React contexts
│   ├── auth-context.tsx   # Authentication state
│   └── notification-context.tsx
├── hooks/                 # Custom hooks
│   ├── use-upload.ts      # File upload hook
│   ├── use-debounce.ts    # Debounce hook
│   ├── use-local-storage.ts
│   └── use-paginated-data.ts
├── lib/                   # Utilities
│   ├── api-client.ts      # HTTP client with auto token refresh
│   └── utils.ts           # Helper functions
├── services/              # API services
│   ├── auth.service.ts
│   ├── user.service.ts
│   ├── notification.service.ts
│   └── upload.service.ts
├── types/                 # TypeScript types
│   └── index.ts           # All types/interfaces
└── middleware.ts          # Next.js middleware
```

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create `.env.local` file:

```env
NEXT_PUBLIC_API_URL=http://localhost:3000

# VNPT eKYC script overrides (optional)
# Set these when VNPT default script URLs fail due to SSL/network issues.
NEXT_PUBLIC_VNPT_OVAL_SCRIPT_URL=
NEXT_PUBLIC_VNPT_JSQR_SCRIPT_URL=
NEXT_PUBLIC_VNPT_EKYC_SDK_SCRIPT_URL=
NEXT_PUBLIC_VNPT_EKYC_SDK_STYLE_URL=
```

3. Run development server:

```bash
npm run dev
```

## API Integration

### API Client

```typescript
import { apiClient } from "@/lib/api-client";

// Auto includes auth token and handles refresh
const data = await apiClient.get("/endpoint");
const result = await apiClient.post("/endpoint", { body });
```

### Services

```typescript
import { authService, userService } from "@/services";

// Login
await authService.login({ email, password });

// Get profile
const user = await userService.getProfile();
```

### Hooks

```typescript
import { useAuth, useNotifications } from "@/contexts";
import { useUpload, useDebounce, usePaginatedData } from "@/hooks";

// Auth
const { user, login, logout, isAuthenticated } = useAuth();

// Notifications
const { notifications, unreadCount, markAsRead } = useNotifications();

// Upload file
const { upload, isUploading, progress } = useUpload({
  maxSize: 5 * 1024 * 1024,
  allowedTypes: ["image/jpeg", "image/png"],
});
```

### Protected Routes

```typescript
import { AuthGuard, RoleGuard } from '@/components';
import { Role } from '@/types';

// Require authentication
<AuthGuard>
  <ProtectedContent />
</AuthGuard>

// Require specific roles
<RoleGuard allowedRoles={[Role.ADMIN]}>
  <AdminContent />
</RoleGuard>
```

## Backend API Endpoints

### Auth

- `POST /auth/register` - Đăng ký
- `POST /auth/login` - Đăng nhập
- `POST /auth/refresh` - Refresh token
- `POST /auth/logout` - Đăng xuất
- `GET /auth/verify-email?token=` - Xác thực email
- `POST /auth/forgot-password` - Quên mật khẩu
- `POST /auth/reset-password` - Reset mật khẩu
- `GET /auth/google` - Google OAuth

### User

- `GET /users/me` - Get current profile
- `PATCH /users/me` - Update profile

### Notifications

- `GET /notifications` - Get notifications (paginated)
- `PATCH /notifications/:id/read` - Mark as read
- `PATCH /notifications/read-all` - Mark all as read
- `DELETE /notifications/:id` - Delete notification

### Upload

- `POST /uploads/presigned-url` - Get presigned URL for upload

## Adding New Features

### 1. Add new type

```typescript
// src/types/index.ts
export interface NewEntity {
  id: string;
  // ...
}
```

### 2. Add new service

```typescript
// src/services/new.service.ts
import apiClient from "@/lib/api-client";

export const newService = {
  async getAll() {
    return apiClient.get("/endpoint");
  },
};
```

### 3. Add new page

```typescript
// src/app/(protected)/new-page/page.tsx
'use client';

import { AuthGuard } from '@/components';

function NewPageContent() {
  return <div>Content</div>;
}

export default function NewPage() {
  return (
    <AuthGuard>
      <NewPageContent />
    </AuthGuard>
  );
}
```

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State**: React Context
- **HTTP Client**: Fetch API

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
