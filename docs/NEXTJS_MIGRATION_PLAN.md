# Vyapti: Vite React to Next.js Migration Plan

> **Generated**: December 2024
> **Current Stack**: Vite + React + React Router DOM
> **Target Stack**: Next.js 14+ App Router

## Overview

Migration of the Vyapti internal tools platform from Vite React to Next.js App Router with fresh project setup, client-only rendering, and API routes as proxy.

## Migration Decisions

- **Router**: Next.js App Router
- **Strategy**: Fresh Next.js project (parallel development)
- **Rendering**: Client-only (all pages as client components)
- **API**: Next.js API routes as proxy to FastAPI backend

---

## Phase 1: Project Setup

### 1.1 Create New Next.js Project

```bash
npx create-next-app@latest vyapti-next --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"
```

### 1.2 Install Dependencies

Copy and adapt dependencies from current `package.json`:

**Core dependencies to install:**

```bash
npm install @tanstack/react-query axios zod react-hook-form @hookform/resolvers
npm install lucide-react date-fns react-markdown rehype-raw remark-gfm
npm install ag-grid-community ag-grid-react recharts xlsx sonner
npm install next-themes react-day-picker embla-carousel-react input-otp cmdk vaul
npm install react-resizable-panels
```

**Radix UI components:**

```bash
npm install @radix-ui/react-accordion @radix-ui/react-alert-dialog @radix-ui/react-avatar
npm install @radix-ui/react-checkbox @radix-ui/react-collapsible @radix-ui/react-dialog
npm install @radix-ui/react-dropdown-menu @radix-ui/react-hover-card @radix-ui/react-label
npm install @radix-ui/react-menubar @radix-ui/react-navigation-menu @radix-ui/react-popover
npm install @radix-ui/react-progress @radix-ui/react-radio-group @radix-ui/react-scroll-area
npm install @radix-ui/react-select @radix-ui/react-separator @radix-ui/react-slider
npm install @radix-ui/react-slot @radix-ui/react-switch @radix-ui/react-tabs
npm install @radix-ui/react-toast @radix-ui/react-toggle @radix-ui/react-toggle-group
npm install @radix-ui/react-tooltip @radix-ui/react-aspect-ratio @radix-ui/react-context-menu
```

**Tailwind plugins:**

```bash
npm install -D tailwindcss-animate @tailwindcss/typography class-variance-authority clsx tailwind-merge
```

### 1.3 Configure TypeScript

Update `tsconfig.json` to match current settings:

```json
{
  "compilerOptions": {
    "noImplicitAny": false,
    "noUnusedParameters": false,
    "skipLibCheck": true,
    "allowJs": true,
    "noUnusedLocals": false,
    "strictNullChecks": false
  }
}
```

### 1.4 Configure Tailwind

Copy `tailwind.config.ts` content - already compatible with Next.js. Update content paths:

```typescript
content: [
  "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
  "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
  "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
];
```

### 1.5 Setup Environment Variables

Create `.env.local`:

```env
# Changed from VITE_* to NEXT_PUBLIC_* for client-side access
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
NEXT_PUBLIC_AI_API_BASE_URL=http://localhost:8005
NEXT_PUBLIC_ENABLE_STREAMING=true

# Server-side only (for API routes)
API_BASE_URL=http://localhost:8000
AI_API_BASE_URL=http://localhost:8005
```

---

## Phase 2: Copy Static Assets and Styles

### 2.1 Copy Files

| Source          | Destination           |
| --------------- | --------------------- |
| `src/index.css` | `src/app/globals.css` |
| `public/*`      | `public/*`            |

### 2.2 Update Global CSS

The `index.css` content is compatible - copy as `globals.css`.

---

## Phase 3: Migrate Components

### 3.1 Copy Component Directories

Copy these directories to the new project maintaining structure:

- `src/components/ui/*` (all shadcn components)
- `src/components/layout/*`
- `src/components/ai-search/*`

### 3.2 Update UI Components

Most shadcn components work as-is. For components using client-side features, add `"use client"` directive at the top:

**Components requiring `"use client"`:**

- All components using `useState`, `useEffect`, `useContext`
- Components using event handlers (onClick, onChange, etc.)
- Components using browser APIs

### 3.3 Key Component Updates

**`src/components/ui/protected-route.tsx`** - Convert to use Next.js navigation:

```tsx
"use client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { authService } from "@/lib/auth";

export const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const router = useRouter();
  const isAuthenticated = authService.isAuthenticated();

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace("/login");
    }
  }, [isAuthenticated, router]);

  if (!isAuthenticated) return null;
  return <>{children}</>;
};
```

---

## Phase 4: Migrate Library/Utility Files

### 4.1 Copy Library Files

Copy `src/lib/*` to new project:

- `utils.ts` - No changes needed
- `auth.ts` - Update environment variable access
- `auth-api.ts` - Update environment variable access
- `ai-search-utils.ts` - Update environment variable access
- `bulk-chunks-client.ts` - Update environment variable access
- `dgtr-api-utils.ts` - Update environment variable access
- `prompt-api.ts` - Update environment variable access
- `vahan-api-utils.ts` - Update environment variable access
- `prompt-triggers-api.ts` - Update environment variable access

### 4.2 Update Environment Variable Access

Search and replace in all lib files:

```
import.meta.env.VITE_API_BASE_URL -> process.env.NEXT_PUBLIC_API_BASE_URL
import.meta.env.VITE_AI_API_BASE_URL -> process.env.NEXT_PUBLIC_AI_API_BASE_URL
```

### 4.3 Update Auth Service

In `src/lib/auth.ts`, update for server-side compatibility:

```typescript
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

// Add check for server-side execution
private handleTokenExpiration() {
  this.logout();
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('tokenExpired', {
      detail: { message: 'Your session has expired. Please log in again.' }
    }));
    window.location.href = '/login';
  }
}
```

---

## Phase 5: Migrate Hooks

### 5.1 Copy Hooks

Copy `src/hooks/*` to new project:

- `use-mobile.tsx`
- `use-toast.ts`
- `use-token-expiration.ts`
- `use-advanced-settings.ts`
- `use-ai-service-status.ts`
- `use-bulk-chunks.ts`
- `use-streaming-search.ts`

### 5.2 Add Client Directive

Add `"use client"` to all hooks that use React hooks.

---

## Phase 6: Migrate Contexts

### 6.1 Copy Contexts

Copy `src/contexts/*`:

- `BulkChunksContext.tsx`

### 6.2 Add Client Directive

```tsx
"use client";
// rest of the file
```

---

## Phase 7: Create Next.js App Structure

### 7.1 Create Root Layout

**`src/app/layout.tsx`:**

```tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Vyapti - Financial Insights Platform",
  description:
    "Professional financial insights and company documentation platform for investment funds",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
```

### 7.2 Create Providers Component

**`src/app/providers.tsx`:**

```tsx
"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BulkChunksProvider } from "@/contexts/BulkChunksContext";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { useState } from "react";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <BulkChunksProvider>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            {children}
          </TooltipProvider>
        </ThemeProvider>
      </BulkChunksProvider>
    </QueryClientProvider>
  );
}
```

### 7.3 Create Dashboard Layout

**`src/app/(dashboard)/layout.tsx`:**

```tsx
"use client";

import { ProtectedRoute } from "@/components/ui/protected-route";
import { DashboardLayout } from "@/components/layout/dashboard-layout";

export default function DashboardGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute>
      <DashboardLayout>{children}</DashboardLayout>
    </ProtectedRoute>
  );
}
```

---

## Phase 8: Migrate Pages to App Router

### 8.1 Route Mapping

| Current Route                      | Next.js App Route                                               |
| ---------------------------------- | --------------------------------------------------------------- |
| `/login`                           | `src/app/login/page.tsx`                                        |
| `/dashboard`                       | `src/app/(dashboard)/dashboard/page.tsx`                        |
| `/companies/:isin`                 | `src/app/(dashboard)/companies/[isin]/page.tsx`                 |
| `/companies/unlisted/:companyName` | `src/app/(dashboard)/companies/unlisted/[companyName]/page.tsx` |
| `/expert-interviews`               | `src/app/(dashboard)/expert-interviews/page.tsx`                |
| `/expert-interviews/:id`           | `src/app/(dashboard)/expert-interviews/[id]/page.tsx`           |
| `/triggers`                        | `src/app/(dashboard)/triggers/page.tsx`                         |
| `/prompt-triggers`                 | `src/app/(dashboard)/prompt-triggers/page.tsx`                  |
| `/prompt-triggers/:id`             | `src/app/(dashboard)/prompt-triggers/[id]/page.tsx`             |
| `/notifications`                   | `src/app/(dashboard)/notifications/page.tsx`                    |
| `/ai-search`                       | `src/app/(dashboard)/ai-search/page.tsx`                        |
| `/data-catalogue`                  | `src/app/(dashboard)/data-catalogue/page.tsx`                   |
| `/settings`                        | `src/app/(dashboard)/settings/page.tsx`                         |
| `/change-password`                 | `src/app/(dashboard)/change-password/page.tsx`                  |
| `/activity-logs`                   | `src/app/(dashboard)/activity-logs/page.tsx`                    |
| `/prompt-trigger-questions`        | `src/app/(dashboard)/prompt-trigger-questions/page.tsx`         |
| `/prompt-registry`                 | `src/app/(dashboard)/prompt-registry/page.tsx`                  |
| `/vahan-db`                        | `src/app/(dashboard)/vahan-db/page.tsx`                         |
| `/fts`                             | `src/app/(dashboard)/fts/page.tsx`                              |
| `/dgtr-db`                         | `src/app/(dashboard)/dgtr-db/page.tsx`                          |
| `/dgtr-db/:uuid`                   | `src/app/(dashboard)/dgtr-db/[uuid]/page.tsx`                   |

### 8.2 Page Template

Each page file follows this pattern:

```tsx
"use client";

import OriginalPageComponent from "@/pages/OriginalPage";

export default function PageName() {
  return <OriginalPageComponent />;
}
```

Or inline the component if preferred:

```tsx
"use client";

// Copy the component code directly with updated imports
```

### 8.3 Update Navigation in Pages

In all page components, replace:

```tsx
// Before
import { useNavigate, useParams } from "react-router-dom";
const navigate = useNavigate();
navigate("/path");

// After
import { useRouter, useParams } from "next/navigation";
const router = useRouter();
router.push("/path");
```

### 8.4 Update Link Components

```tsx
// Before
import { Link } from 'react-router-dom'
<Link to="/path">

// After
import Link from 'next/link'
<Link href="/path">
```

### 8.5 Create Root Redirect

**`src/app/page.tsx`:**

```tsx
import { redirect } from "next/navigation";

export default function Home() {
  redirect("/dashboard");
}
```

### 8.6 Create Not Found Page

**`src/app/not-found.tsx`:**

```tsx
"use client";

import NotFound from "@/pages/NotFound";

export default function NotFoundPage() {
  return <NotFound />;
}
```

---

## Phase 9: Create API Routes (Proxy Layer)

### 9.1 API Route Structure

```
src/app/api/
├── auth/
│   ├── route.ts              # POST /api/auth (login)
│   └── change-password/
│       └── route.ts          # POST /api/auth/change-password
├── companies/
│   ├── route.ts              # GET /api/companies
│   ├── names/
│   │   └── route.ts          # GET /api/companies/names
│   └── [isin]/
│       └── route.ts          # GET /api/companies/[isin]
├── search/
│   └── route.ts              # POST /api/search (AI search)
├── triggers/
│   └── route.ts              # GET /api/triggers
├── activity-logs/
│   └── route.ts              # GET /api/activity-logs
└── chunks/
    └── bulk/
        └── route.ts          # POST /api/chunks/bulk
```

### 9.2 Example API Route (Auth Proxy)

**`src/app/api/auth/route.ts`:**

```typescript
import { NextRequest, NextResponse } from "next/server";

const API_BASE_URL = process.env.API_BASE_URL || "http://localhost:8000";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const response = await fetch(`${API_BASE_URL}/auth`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
```

### 9.3 Example Authenticated API Route

**`src/app/api/companies/route.ts`:**

```typescript
import { NextRequest, NextResponse } from "next/server";

const API_BASE_URL = process.env.API_BASE_URL || "http://localhost:8000";

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");

    if (!authHeader) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const response = await fetch(`${API_BASE_URL}/companies`, {
      headers: {
        Authorization: authHeader,
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
```

### 9.4 Update Frontend to Use API Routes

Update `src/lib/auth.ts` base URL:

```typescript
// For client components, can use relative URLs
const API_BASE_URL = "/api";
```

---

## Phase 10: Update Navigation Components

### 10.1 Update app-sidebar.tsx

Replace React Router Link with Next.js Link:

```tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// Replace useLocation() with usePathname()
const pathname = usePathname();

// Replace <Link to="/path"> with <Link href="/path">
```

### 10.2 Update Other Navigation

Apply same changes to:

- `src/components/layout/top-bar.tsx`
- `src/components/layout/navbar.tsx`

---

## Phase 11: Testing and Validation

### 11.1 Functionality Checklist

- [ ] Login/logout works correctly
- [ ] Protected routes redirect to login
- [ ] Token expiration handling works
- [ ] Dashboard loads and shows companies
- [ ] Company search works
- [ ] Company details page loads
- [ ] Expert interviews list/details work
- [ ] AI Search with streaming works
- [ ] Triggers page works
- [ ] Prompt triggers work
- [ ] Data catalogue works
- [ ] Settings page works
- [ ] Activity logs work
- [ ] All navigation links work
- [ ] Dark mode toggle works
- [ ] Toast notifications work
- [ ] Sidebar collapse/expand persists

### 11.2 Build Verification

```bash
npm run build
npm run start
```

### 11.3 Common Issues to Watch For

1. **Hydration mismatches** - Ensure client components have `"use client"` directive
2. **Missing "use client"** - Any component using hooks needs it
3. **Router imports** - Must use `next/navigation` not `react-router-dom`
4. **Environment variables** - Must use `NEXT_PUBLIC_` prefix for client access

---

## Phase 12: Deployment Considerations

### 12.1 Update Build Commands

**`package.json`:**

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  }
}
```

### 12.2 Configure for Deployment

**`next.config.js`:**

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  // If deploying to a subdirectory
  // basePath: '/vyapti',

  // Standalone output for Docker
  output: "standalone",

  // Environment variables
  env: {
    NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL,
  },
};

module.exports = nextConfig;
```

---

## File Migration Checklist

### Components (copy with "use client" where needed)

- [ ] `src/components/ui/*` (all shadcn components)
- [ ] `src/components/layout/dashboard-layout.tsx`
- [ ] `src/components/layout/app-sidebar.tsx`
- [ ] `src/components/layout/top-bar.tsx`
- [ ] `src/components/layout/navbar.tsx`
- [ ] `src/components/ai-search/*`

### Library Files (update env vars)

- [ ] `src/lib/utils.ts`
- [ ] `src/lib/auth.ts`
- [ ] `src/lib/auth-api.ts`
- [ ] `src/lib/ai-search-utils.ts`
- [ ] `src/lib/bulk-chunks-client.ts`
- [ ] `src/lib/dgtr-api-utils.ts`
- [ ] `src/lib/prompt-api.ts`
- [ ] `src/lib/vahan-api-utils.ts`
- [ ] `src/lib/prompt-triggers-api.ts`

### Hooks (add "use client")

- [ ] `src/hooks/use-mobile.tsx`
- [ ] `src/hooks/use-toast.ts`
- [ ] `src/hooks/use-token-expiration.ts`
- [ ] `src/hooks/use-advanced-settings.ts`
- [ ] `src/hooks/use-ai-service-status.ts`
- [ ] `src/hooks/use-bulk-chunks.ts`
- [ ] `src/hooks/use-streaming-search.ts`

### Contexts (add "use client")

- [ ] `src/contexts/BulkChunksContext.tsx`

### Pages (convert to App Router)

- [ ] Login
- [ ] Dashboard
- [ ] CompanyDetails
- [ ] UnlistedCompanyDetails
- [ ] ExpertInterviewsList
- [ ] ExpertInterviewDetails
- [ ] Triggers
- [ ] PromptTriggers
- [ ] PromptTriggerDetails
- [ ] PromptTriggerQuestions
- [ ] Notifications
- [ ] AISearch
- [ ] DataCatalogue
- [ ] Settings
- [ ] ChangePassword
- [ ] ActivityLogs
- [ ] PromptRegistry
- [ ] VahanDashboard
- [ ] FullTextSearch
- [ ] DGTRDashboard
- [ ] InvestigationPage
- [ ] NotFound

### API Routes (create new)

- [ ] Auth endpoints
- [ ] Companies endpoints
- [ ] Search endpoints
- [ ] Triggers endpoints
- [ ] Activity logs endpoints
- [ ] Chunks endpoints

### Config Files

- [ ] `tailwind.config.ts`
- [ ] `tsconfig.json`
- [ ] `.env.local`
- [ ] `next.config.js`

---

## Estimated Effort Breakdown

| Phase       | Tasks                           |
| ----------- | ------------------------------- |
| Phase 1-2   | Project setup and config        |
| Phase 3-6   | Component and utility migration |
| Phase 7-8   | App Router structure and pages  |
| Phase 9     | API routes creation             |
| Phase 10    | Navigation updates              |
| Phase 11-12 | Testing and deployment          |

---

## Quick Reference: Key Changes Summary

### Import Changes

| Before (Vite/React Router)                       | After (Next.js)                                 |
| ------------------------------------------------ | ----------------------------------------------- |
| `import { useNavigate } from 'react-router-dom'` | `import { useRouter } from 'next/navigation'`   |
| `import { useParams } from 'react-router-dom'`   | `import { useParams } from 'next/navigation'`   |
| `import { useLocation } from 'react-router-dom'` | `import { usePathname } from 'next/navigation'` |
| `import { Link } from 'react-router-dom'`        | `import Link from 'next/link'`                  |
| `import.meta.env.VITE_*`                         | `process.env.NEXT_PUBLIC_*`                     |

### Navigation Changes

| Before                                 | After                     |
| -------------------------------------- | ------------------------- |
| `navigate('/path')`                    | `router.push('/path')`    |
| `navigate('/path', { replace: true })` | `router.replace('/path')` |
| `<Link to="/path">`                    | `<Link href="/path">`     |

### Component Patterns

```tsx
// All client-side components need this at the top
"use client";

// Server components (default in App Router) - no directive needed
// but all your current components will be client components
```

---

## Benefits After Migration

1. **Better Performance**: Automatic code splitting, image optimization, font optimization
2. **Improved SEO**: Server-side rendering capability for future public pages
3. **API Security**: Backend URLs hidden in server-side API routes
4. **Modern Architecture**: React Server Components ready for future optimization
5. **Better DX**: Built-in routing, layouts, error handling, loading states
6. **Production Ready**: Built-in deployment optimizations for Vercel, Docker, etc.

---

## Notes for Team

- The migration creates a parallel project, so the existing Vite app continues to work during migration
- Test each page after migration before moving to the next
- Consider migrating in order of dependency: lib -> hooks -> contexts -> components -> pages
- All current functionality should work identically after migration
