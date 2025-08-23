# @kotkala/educonnect-system

[![GitHub Package Registry](https://img.shields.io/badge/GitHub-Package%20Registry-blue)](https://github.com/kotkala/EduConnectSystem/packages)
[![Version](https://img.shields.io/github/package-json/v/kotkala/EduConnectSystem)](https://github.com/kotkala/EduConnectSystem/packages)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

EduConnect Educational Management System - A comprehensive platform for managing students, teachers, grades, violations, and communications.

## 🚀 Features

- **Student Management** - Complete student profiles and academic tracking
- **Teacher Portal** - Class management, grading, and communication tools
- **Parent Dashboard** - Real-time access to student progress and communications
- **Violation Tracking** - Comprehensive disciplinary management system
- **Grade Management** - Flexible grading system with multiple assessment types
- **AI-Powered Features** - Automated feedback and intelligent insights
- **Real-time Notifications** - Instant communication between all stakeholders
- **Comprehensive Reporting** - Detailed analytics and progress reports

## 📦 Installation

### Prerequisites

- Node.js 18+ or Bun 1.0+
- Supabase account for database
- GitHub account for package access

### Setup GitHub Packages Access

1. **Create a GitHub Personal Access Token**:
   - Go to GitHub Settings → Developer settings → Personal access tokens
   - Create a token with `read:packages` scope
   - Copy the token

2. **Configure npm/bun for GitHub Packages**:
   ```bash
   # Create or update .npmrc in your project root
   echo "@kotkala:registry=https://npm.pkg.github.com" >> .npmrc
   echo "//npm.pkg.github.com/:_authToken=YOUR_GITHUB_TOKEN" >> .npmrc
   ```

3. **Install the package**:
   ```bash
   # Using Bun (recommended)
   bun add @kotkala/educonnect-system
   
   # Using npm
   npm install @kotkala/educonnect-system
   
   # Using yarn
   yarn add @kotkala/educonnect-system
   ```

## 🛠️ Quick Start

### 1. Environment Setup

Create a `.env.local` file:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Google AI (Optional)
GOOGLE_AI_API_KEY=your_google_ai_key

# Email Configuration (Optional)
SMTP_HOST=your_smtp_host
SMTP_PORT=587
SMTP_USER=your_email
SMTP_PASS=your_password
```

### 2. Database Setup

Import the database schema:

```sql
-- Import the complete schema from database/database.sql
\i database/database.sql
```

### 3. Development

```bash
# Start development server
bun run dev

# Build for production
bun run build

# Start production server
bun run start
```

## 📚 Documentation

### Core Components

- **Authentication System** - Secure login with role-based access
- **Dashboard Components** - Role-specific dashboards for all user types
- **Grade Management** - Comprehensive grading and reporting system
- **Violation System** - Disciplinary tracking with automated workflows
- **Communication Tools** - Notifications, messaging, and parent portals

### API Routes

- `/api/auth/*` - Authentication endpoints
- `/api/students/*` - Student management
- `/api/teachers/*` - Teacher operations
- `/api/grades/*` - Grade management
- `/api/violations/*` - Violation tracking
- `/api/notifications/*` - Communication system

## 🔧 Configuration

### Supabase Setup

1. Create a new Supabase project
2. Import the database schema from `database/database.sql`
3. Configure Row Level Security (RLS) policies
4. Set up authentication providers

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | Yes |
| `GOOGLE_AI_API_KEY` | Google AI API key | No |
| `SMTP_*` | Email configuration | No |

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Issues**: [GitHub Issues](https://github.com/kotkala/EduConnectSystem/issues)
- **Documentation**: [GitHub Wiki](https://github.com/kotkala/EduConnectSystem/wiki)
- **Discussions**: [GitHub Discussions](https://github.com/kotkala/EduConnectSystem/discussions)

## 🏗️ Built With

- **Framework**: Next.js 15 with App Router
- **Runtime**: Bun (recommended) or Node.js
- **Database**: Supabase (PostgreSQL)
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI + shadcn/ui
- **State Management**: TanStack Query
- **Forms**: React Hook Form + Zod
- **Authentication**: Supabase Auth

---

Made with ❤️ for educational institutions worldwide.
