# ⚙️ CONFIGURATION & SETUP GUIDE

> **Essential setup and configuration for EduConnectSystem**

---

## 📧 **EMAIL SYSTEM CONFIGURATION**

### **Environment Variables**
```env
# .env.local
RESEND_API_KEY=your_resend_api_key_here
FROM_EMAIL=noreply@yourdomain.com  
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### **Resend Email Service Setup**
1. **Sign up** at [resend.com](https://resend.com)
2. **Generate API Key** in dashboard
3. **Verify Domain** (for production)
4. **Configure Templates** for:
   - Grade notifications
   - Report period alerts  
   - Parent feedback requests
   - System notifications

### **Email Templates**
```typescript
// lib/services/resend-email-service.ts
export const emailTemplates = {
  gradeNotification: 'Grade Update Notification',
  reportPeriod: 'Report Period Alert',
  parentFeedback: 'Parent Feedback Request',
  systemAlert: 'System Notification'
}
```

---

## 🚀 **DEVELOPMENT SETUP**

### **Prerequisites**
- **Node.js**: 18.0+ (recommended: 20.0+)
- **Bun**: Latest version (package manager)
- **PostgreSQL**: 15.0+ (via Supabase)
- **Git**: For version control

### **Installation**
```bash
# Clone repository
git clone [repository-url]
cd EduConnectSystem

# Install dependencies  
bun install

# Setup environment variables
cp .env.example .env.local
# Configure your variables in .env.local

# Run development server
bun run dev
```

### **Available Scripts**
```json
{
  "dev": "next dev --turbopack",    # Development server
  "build": "next build",            # Production build  
  "start": "next start",            # Production server
  "lint": "next lint"               # Code quality check
}
```

---

## 🗄️ **DATABASE CONFIGURATION**

### **Supabase Setup**
1. **Create Project** at [supabase.com](https://supabase.com)
2. **Get Connection Details** from project settings
3. **Run Migrations** (if applicable)
4. **Setup Row Level Security** policies

### **Environment Variables**
```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### **Database Schema**
- **Users**: Authentication and profile management
- **Academic Years**: School year and semester management
- **Classes**: Class organization and student assignments
- **Grades**: Grade management and reporting
- **Reports**: Student progress and parent communications
- **Notifications**: System alerts and communications

---

## 🎨 **UI/UX CONFIGURATION**

### **Theme System**
```typescript
// Coordinated Loading System
const loadingConfig = {
  priorities: ['auth', 'global', 'section'],
  messages: {
    auth: "Đang xác thực tài khoản...",
    global: "Đang tải dữ liệu...", 
    section: "Đang xử lý..."
  },
  animations: {
    duration: 150,      // ms
    easing: 'easeOut'
  }
}
```

### **Design Tokens**
```typescript
// lib/design-tokens/z-index.ts
export const zIndex = {
  base: 0, elevated: 10, header: 40, sidebar: 50,
  dropdown: 1000, popover: 1100, tooltip: 1200,
  modal: 1300, toast: 1400, loading: 9999, debug: 10000
}
```

### **Performance Optimization**
- **LazyMotion**: Tree-shaking for Framer Motion
- **Dynamic Imports**: Code splitting for large components
- **GPU Acceleration**: `will-change` CSS property usage
- **Bundle Analysis**: Regular optimization monitoring

---

## 🔐 **SECURITY CONFIGURATION**

### **Authentication**  
- **Provider**: Supabase Auth
- **Methods**: Google OAuth + Email OTP
- **Session Management**: JWT tokens with refresh
- **Route Protection**: Middleware-based auth guards

### **Row Level Security**
```sql
-- Example RLS policies
ALTER TABLE grades ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own grades"
ON grades FOR SELECT
USING (auth.uid() = user_id OR auth.uid() IN (
  SELECT parent_id FROM students WHERE id = student_id
));
```

---

## 🌐 **PRODUCTION DEPLOYMENT**

### **Build Configuration**
```typescript
// next.config.ts
const nextConfig = {
  experimental: {
    turbo: {
      // Turbopack configuration
    }
  },
  images: {
    domains: ['yourdomain.com']
  },
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY
  }
}
```

### **Deployment Checklist**
- ✅ Environment variables configured
- ✅ Database migrations applied
- ✅ Email service domain verified
- ✅ SSL certificates installed
- ✅ CDN configured (if applicable)
- ✅ Monitoring and logging enabled
- ✅ Backup strategy implemented

### **Performance Monitoring**
- **Core Web Vitals**: LCP, FID, CLS tracking
- **Error Monitoring**: Sentry or similar service
- **Analytics**: User behavior and performance metrics
- **Uptime Monitoring**: Service availability tracking

---

## 🛠️ **TROUBLESHOOTING**

### **Common Issues**

**Build Errors:**
```bash
# Clear Next.js cache
rm -rf .next
bun run build

# Clear Bun cache  
bun install --force
```

**Loading System Issues:**
- Check `CoordinatedLoadingOverlay` integration in `app/providers.tsx`
- Verify `useCoordinatedLoading` import paths
- Ensure proper hook dependencies in `useCallback`/`useEffect`

**Email Not Sending:**
- Verify `RESEND_API_KEY` in environment variables
- Check domain verification status
- Review email template configuration
- Check rate limits and quotas

**Database Connection:**
- Verify Supabase URL and keys
- Check Row Level Security policies
- Review database connection pool limits
- Ensure proper SSL configuration

---

*⚙️ **Configuration Complete**: System ready for development and production  
🎯 **Next Steps**: Run `bun run dev` to start development server  
📧 **Support**: Check system logs and error monitoring for issues*
