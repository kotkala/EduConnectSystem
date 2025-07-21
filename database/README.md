# Database Setup for EduConnect Authentication

## Files
- `schema.sql` - Database schema with tables, RLS policies, and triggers
- `seeds.sql` - Sample data for testing
- `README.md` - Setup instructions

## Setup Instructions

### 1. Apply Database Schema
1. Open Supabase Dashboard → SQL Editor
2. Copy and paste `schema.sql`
3. Execute to create tables, policies, and triggers

### 2. Add Sample Data (Optional)
1. Copy and paste `seeds.sql`
2. Execute to create test users

### 3. Configure Authentication
1. Go to Authentication > Providers → Enable Google OAuth
2. Go to Authentication > Settings → Enable Email OTP
3. Set redirect URLs: `http://localhost:3000/auth/callback`

### 4. Test Users (from seeds.sql)
- **Admin**: admin@educonnect.com / admin123
- **Teacher**: teacher@educonnect.com / teacher123
- **Student**: student@educonnect.com / student123
- **Parent**: parent@educonnect.com / parent123

### 4. Testing the Setup
After applying the schema, test the following:
1. User registration creates a profile automatically
2. Role-based access works correctly
3. RLS policies prevent unauthorized access
4. Google OAuth and Email OTP work as expected

## Security Features
- Row Level Security (RLS) enabled on all tables
- Role-based access control
- Automatic profile creation with secure defaults
- Proper indexing for performance
