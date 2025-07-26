# Database Setup for EduConnect System

## Files
- `schema.sql` - Database schema with tables, RLS policies, and triggers
- `seeds.sql` - Sample data for testing
- `subjects_seeds.sql` - Vietnamese high school subjects data
- `README.md` - Setup instructions

## Setup Instructions

### 1. Apply Database Schema
1. Open Supabase Dashboard → SQL Editor
2. Copy and paste `schema.sql`
3. Execute to create tables, policies, and triggers

### 2. Add Sample Data (Optional)
1. Copy and paste `seeds.sql`
2. Execute to create test users

### 3. Import Vietnamese Subjects
1. Copy and paste `subjects_seeds.sql`
2. Execute to import all 17 Vietnamese high school subjects
3. Verify import with: `SELECT COUNT(*) FROM subjects;`

### 4. Configure Authentication
1. Go to Authentication > Providers → Enable Google OAuth
2. Go to Authentication > Settings → Enable Email OTP
3. Set redirect URLs: `http://localhost:3000/auth/callback`

### 5. Test Users (from seeds.sql)
- **Admin**: admin@educonnect.com / admin123
- **Teacher**: teacher@educonnect.com / teacher123
- **Student**: student@educonnect.com / student123
- **Parent**: parent@educonnect.com / parent123

### 6. Testing the Setup
After applying the schema, test the following:
1. User registration creates a profile automatically
2. Role-based access works correctly
3. RLS policies prevent unauthorized access
4. Google OAuth and Email OTP work as expected
5. Subjects are imported correctly (17 total: 8 core + 9 specialized)
6. Admin can access subject management page
7. Subject RLS policies work for different user roles

## Security Features
- Row Level Security (RLS) enabled on all tables
- Role-based access control
- Automatic profile creation with secure defaults
- Proper indexing for performance
- Subject access control (all users can view, only admins can manage)

## Vietnamese High School Subjects
The system includes 17 standardized Vietnamese high school subjects:

**Core Subjects (8):**
- Văn (Vietnamese Literature)
- Toán (Mathematics)
- Tiếng Anh (English)
- Lịch sử (History)
- Địa lý (Geography)
- Vật lý (Physics)
- Hóa học (Chemistry)
- Sinh học (Biology)

**Specialized Subjects (9):**
- Giáo dục quốc phòng - an ninh (National Defense and Security Education)
- Hoạt động trải nghiệm - hướng nghiệp (Experiential Activities - Career Guidance)
- Giáo dục địa phương (Local Education)
- Giáo dục thể chất (Physical Education)
- Giáo dục kinh tế - pháp luật (Economics and Law Education)
- Công nghệ (Technology)
- Tin học (Computer Science/Informatics)
- Âm nhạc (Music)
- Mỹ thuật (Fine Arts)
