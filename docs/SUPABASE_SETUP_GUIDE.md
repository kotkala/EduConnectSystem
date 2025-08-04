# 🚀 EduConnect Supabase Setup Guide

This comprehensive guide will walk you through setting up Supabase for the EduConnect educational platform, including database schema, authentication, and security configuration.

## 📋 Prerequisites

- A Supabase account (sign up at [supabase.com](https://supabase.com))
- Basic understanding of PostgreSQL
- Access to your project's environment variables
- Node.js and Bun installed locally

## 🏗️ Step 1: Create a New Supabase Project

1. **Log in to Supabase Dashboard**
   - Go to [app.supabase.com](https://app.supabase.com)
   - Sign in with your account

2. **Create New Project**
   - Click "New Project"
   - Choose your organization
   - Enter project details:
     - **Name**: `EduConnect` (or your preferred name)
     - **Database Password**: Generate a strong password (save this!)
     - **Region**: Choose closest to your users (e.g., Southeast Asia for Vietnam)
   - Click "Create new project"

3. **Wait for Setup**
   - Project creation takes 2-3 minutes
   - You'll see a progress indicator

## 🔧 Step 2: Configure Environment Variables

1. **Get Project Credentials**
   - Go to Project Settings → API
   - Copy the following values:
     - **Project URL** (NEXT_PUBLIC_SUPABASE_URL)
     - **Anon Public Key** (NEXT_PUBLIC_SUPABASE_ANON_KEY)
     - **Service Role Key** (keep this secret!)

2. **Create Environment File**
   ```bash
   # Create .env.local in your project root
   touch .env.local
   ```

3. **Add Environment Variables**
   ```env
   # Supabase Configuration
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

   # Google AI (for chatbot functionality)
   GOOGLE_GENERATIVE_AI_API_KEY=your_google_ai_key_here

   # Site URL for OAuth redirects
   NEXT_PUBLIC_SITE_URL=http://localhost:3000
   ```

## 🗄️ Step 3: Set Up Database Schema

1. **Access SQL Editor**
   - In Supabase Dashboard, go to "SQL Editor"
   - Click "New Query"

2. **Run Schema Script**
   - Copy the entire content from `database/schema.sql`
   - Paste it into the SQL Editor
   - Click "Run" to execute
   - Wait for completion (may take 30-60 seconds)

3. **Verify Tables Created**
   - Go to "Table Editor"
   - You should see all tables listed:
     - **Core Tables**: profiles, academic_years, semesters, classes, subjects, classrooms
     - **Schedule Tables**: timetable_events, teacher_class_assignments, student_class_assignments
     - **Communication Tables**: feedback_notifications, notifications, meeting_schedules
     - **Academic Tables**: student_grade_submissions, individual_subject_grades
     - **Discipline Tables**: violation_categories, violation_types, student_violations
     - **Relationship Tables**: parent_student_relationships, schedule_exchange_requests

4. **Verify Views Created**
   - Check that these views exist:
     - `student_class_assignments_view`
     - `parent_feedback_with_ai_summary`

## 🔐 Step 4: Configure Authentication

1. **Enable Authentication Providers**
   - Go to Authentication → Providers
   - Enable the following:
     - **Email** (for OTP authentication) ✅
     - **Google** (for OAuth) ✅

2. **Configure Email OTP Settings**
   - Go to Authentication → Settings
   - Under "Auth Providers" → Email:
     - Enable "Enable email confirmations"
     - Set "Confirm email change" to enabled
     - Configure email templates (optional)

3. **Configure Google OAuth** (Recommended)
   - Get Google OAuth credentials from [Google Cloud Console](https://console.cloud.google.com)
   - In Google Cloud Console:
     - Create a new project or select existing
     - Enable Google+ API and Google Identity API
     - Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client IDs"
     - Application type: "Web application"
     - Add authorized redirect URIs:
       - `https://your-project-ref.supabase.co/auth/v1/callback`
       - `http://localhost:3000/auth/callback` (for development)
   - In Supabase:
     - Go to Authentication → Providers → Google
     - Enter Client ID and Client Secret
     - Save configuration

## 🛡️ Step 5: Set Up Row Level Security (RLS) Policies

The schema automatically enables RLS on all tables. Now create comprehensive policies:

1. **Go to SQL Editor and run these policies:**

   ```sql
   -- Basic Profile Policies
   CREATE POLICY "Users can view own profile" ON profiles
   FOR SELECT USING (auth.uid() = id);

   CREATE POLICY "Users can update own profile" ON profiles
   FOR UPDATE USING (auth.uid() = id);

   -- Admin Policies
   CREATE POLICY "Admins can view all profiles" ON profiles
   FOR ALL USING (
     EXISTS (
       SELECT 1 FROM profiles
       WHERE id = auth.uid() AND role = 'admin'
     )
   );

   -- Parent Policies
   CREATE POLICY "Parents can view their children" ON parent_student_relationships
   FOR SELECT USING (auth.uid() = parent_id);

   CREATE POLICY "Parents can view children's feedback" ON feedback_notifications
   FOR SELECT USING (
     EXISTS (
       SELECT 1 FROM parent_student_relationships psr
       WHERE psr.parent_id = auth.uid()
       AND psr.student_id = feedback_notifications.student_id
       AND psr.is_active = true
     )
   );

   -- Teacher Policies
   CREATE POLICY "Teachers can view assigned classes" ON teacher_class_assignments
   FOR SELECT USING (auth.uid() = teacher_id);

   CREATE POLICY "Teachers can manage their feedback" ON feedback_notifications
   FOR ALL USING (auth.uid() = teacher_id);

   -- Student Policies
   CREATE POLICY "Students can view own assignments" ON student_class_assignments
   FOR SELECT USING (auth.uid() = student_id);

   CREATE POLICY "Students can view own grades" ON student_grade_submissions
   FOR SELECT USING (auth.uid() = student_id);
   ```

2. **Create Additional Policies for Each Table** (run in SQL Editor):
   ```sql
   -- Academic Year Policies
   CREATE POLICY "All authenticated users can view academic years" ON academic_years
   FOR SELECT USING (auth.role() = 'authenticated');

   -- Semester Policies
   CREATE POLICY "All authenticated users can view semesters" ON semesters
   FOR SELECT USING (auth.role() = 'authenticated');

   -- Class Policies
   CREATE POLICY "All authenticated users can view classes" ON classes
   FOR SELECT USING (auth.role() = 'authenticated');

   -- Subject Policies
   CREATE POLICY "All authenticated users can view subjects" ON subjects
   FOR SELECT USING (auth.role() = 'authenticated');

   -- Notification Policies
   CREATE POLICY "Users can view notifications for their role" ON notifications
   FOR SELECT USING (
     auth.role() = 'authenticated' AND (
       target_roles IS NULL OR
       EXISTS (
         SELECT 1 FROM profiles
         WHERE id = auth.uid() AND role = ANY(notifications.target_roles)
       )
     )
   );
   ```

## 📊 Step 6: Set Up Storage (Optional)

If you need file uploads (profile pictures, attachments):

1. **Create Storage Bucket**
   - Go to Storage
   - Click "New Bucket"
   - Name: `avatars` or `attachments`
   - Set as public if needed

2. **Configure Storage Policies**
   ```sql
   -- Allow users to upload their own avatars
   CREATE POLICY "Users can upload own avatar" ON storage.objects
   FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
   ```

## 🧪 Step 7: Test Your Setup

1. **Test Database Connection**
   ```bash
   # In your project directory
   bun run dev
   ```

2. **Test Authentication**
   - Try signing up with email
   - Test Google OAuth (if configured)
   - Verify user profiles are created

3. **Test Database Operations**
   - Create a test academic year
   - Add a test class
   - Verify relationships work

## 🔍 Step 8: Monitoring and Maintenance

1. **Set Up Monitoring**
   - Go to Reports to view usage
   - Set up alerts for high usage
   - Monitor database performance

2. **Regular Backups**
   - Supabase automatically backs up your database
   - Consider setting up additional backups for critical data

3. **Update Policies as Needed**
   - Review and update RLS policies regularly
   - Test security with different user roles

## 🚨 Common Issues and Solutions

### Issue: "relation does not exist" error
**Solution**: Make sure you've run the complete schema.sql file

### Issue: Authentication not working
**Solution**:
- Check environment variables are correct
- Verify Supabase URL and keys
- Check OAuth redirect URLs

### Issue: RLS blocking queries
**Solution**:
- Review your RLS policies
- Make sure policies exist for your use case
- Test with different user roles

### Issue: Google OAuth not working
**Solution**:
- Verify Google Cloud Console setup
- Check redirect URLs match exactly
- Ensure Google+ API is enabled

## 📚 Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [Next.js with Supabase](https://supabase.com/docs/guides/getting-started/tutorials/with-nextjs)
- [Authentication Deep Dive](https://supabase.com/docs/guides/auth)

## 🎯 Next Steps

After completing this setup:

1. **Seed Initial Data** (Optional)
   - Create initial admin user
   - Add academic years and semesters
   - Set up basic subjects and classrooms

2. **Configure Production Environment**
   - Set up production Supabase project
   - Configure custom domain (if needed)
   - Set up monitoring and alerts

3. **Deploy Your Application**
   - Deploy to Vercel, Netlify, or your preferred platform
   - Update environment variables for production
   - Test all functionality in production

---

**🎉 Congratulations!** Your EduConnect Supabase backend is now ready to use!

For any issues or questions, refer to the Supabase documentation or create an issue in the project repository.

2. **Verify Data Access**
   - Create a test user account
   - Try logging in with Google OAuth
   - Test OTP email authentication

## 🔧 Step 8: Additional Configuration

### Google Generative AI Setup
Add your Google AI API key to environment variables:
```bash
GOOGLE_GENERATIVE_AI_API_KEY=your-google-ai-api-key
```

### Email Configuration
For production, configure SMTP settings:
- Go to "Authentication" → "Settings"
- Set up custom SMTP server for reliable email delivery

## 🚨 Important Security Notes

1. **Never expose Service Role Key** in client-side code
2. **Always use RLS policies** to protect sensitive data
3. **Regularly rotate API keys** in production
4. **Monitor usage** in Supabase dashboard
5. **Set up proper backup strategies**

## 📊 Monitoring and Maintenance

1. **Database Performance**
   - Monitor query performance in "Logs" section
   - Use "Database" → "Extensions" for additional features

2. **Authentication Logs**
   - Check "Authentication" → "Logs" for login issues
   - Monitor failed authentication attempts

3. **API Usage**
   - Track API calls in "Settings" → "Usage"
   - Set up alerts for high usage

## 🆘 Troubleshooting

### Common Issues:

**Connection Errors:**
- Verify environment variables are correct
- Check if Supabase project is active
- Ensure network connectivity

**Authentication Issues:**
- Verify OAuth provider configuration
- Check redirect URLs match exactly
- Ensure email templates are properly configured

**RLS Policy Errors:**
- Test policies with different user roles
- Use SQL Editor to debug policy logic
- Check if policies are properly enabled

## 📚 Next Steps

After completing this setup:

1. **Create your first admin user** through the Supabase dashboard
2. **Set up your school's academic structure** (academic years, semesters)
3. **Import or create user accounts** for teachers, students, and parents
4. **Configure the AI chatbot** with your school-specific data
5. **Test all major features** before going live

## 🔗 Useful Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [Next.js with Supabase](https://supabase.com/docs/guides/getting-started/quickstarts/nextjs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)

---

**Need Help?** Check the project's GitHub issues or create a new issue for support.
