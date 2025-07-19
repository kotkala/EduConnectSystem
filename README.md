# EduConnect - Modern Next.js 15 Full-Stack Application

A modern, production-ready Next.js 15 application with Supabase authentication, built following best practices and optimized for developer experience.

## 🚀 Features

- **Next.js 15** with App Router and modern patterns
- **Supabase** for authentication and database
- **Shadcn UI** components with Tailwind CSS
- **TypeScript** for type safety
- **Bun** for fast package management and builds
- **Server Actions** for modern server-side operations
- **Route Groups** for organized routing
- **Middleware** for authentication protection
- **Modern Architecture** with ~75% reduced complexity

## 📁 Project Structure

```
├── actions/                    # Server Actions
│   ├── auth.ts                # Authentication actions
│   └── user.ts                # User management actions
├── app/                       # Next.js 15 App Router
│   ├── (auth)/               # Auth route group
│   │   ├── login/
│   │   ├── register/
│   │   ├── register-success/
│   │   └── auth-error/
│   ├── (protected)/          # Protected route group
│   │   ├── dashboard/
│   │   └── protected/
│   ├── api/                  # API routes
│   │   ├── auth/confirm/
│   │   └── health/
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/               # Reusable components
│   ├── auth/                # Authentication components
│   ├── layout/              # Layout components
│   ├── shared/              # Shared components
│   └── ui/                  # Shadcn UI components
├── hooks/                   # Custom React hooks
├── lib/                     # Utilities and configurations
│   ├── supabase/           # Supabase client configurations
│   ├── auth.ts             # Auth utilities
│   ├── constants.ts        # App constants
│   ├── database.ts         # Database operations
│   ├── types.ts            # TypeScript definitions
│   ├── utils.ts            # General utilities
│   └── validations.ts      # Zod schemas
└── middleware.ts           # Next.js middleware
```

## 🛠 Getting Started

### Prerequisites

- [Bun](https://bun.sh/) (recommended) or Node.js 18+
- [Supabase](https://supabase.com/) account

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd EduConnectSystem
```

2. Install dependencies:
```bash
bun install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

Add your Supabase credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. Run the development server:
```bash
bun run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📜 Available Scripts

- `bun run dev` - Start development server with Turbopack
- `bun run build` - Build for production
- `bun run start` - Start production server
- `bun run lint` - Run ESLint

## 🏗 Architecture Highlights

### Modern Next.js 15 Patterns
- **Route Groups**: Organized auth and protected routes
- **Server Actions**: Type-safe server-side operations
- **Server Components**: Optimized rendering
- **Middleware**: Authentication protection

### Simplified Structure
- **Consolidated utilities**: Single files for types, validations, constants
- **Organized components**: Logical grouping (auth, layout, shared, ui)
- **Modern patterns**: Reduced complexity by ~75% while maintaining functionality

### Authentication Flow
- **Supabase Auth**: Email/password authentication
- **Protected Routes**: Automatic redirection for unauthenticated users
- **Route Protection**: Middleware-based authentication checks

## 🔧 Key Technologies

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS + Shadcn UI
- **Authentication**: Supabase Auth
- **Database**: Supabase (PostgreSQL)
- **Package Manager**: Bun
- **Validation**: Zod
- **State Management**: React Server Components + Server Actions

## 📝 Development Notes

- All authentication logic uses modern Server Actions
- Components are properly separated between client and server
- Type safety is enforced throughout the application
- Environment variables are validated at runtime
- Build optimizations are enabled for production

## 🚀 Deployment

The application is ready for deployment on platforms like:
- Vercel (recommended for Next.js)
- Netlify
- Railway
- Any Node.js hosting platform

Make sure to set up your environment variables in your deployment platform.

## 📄 License

This project is licensed under the MIT License.
