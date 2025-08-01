# Student Violation Tracking System - Database Setup

## 🎯 Overview

Complete database schema and setup for the Student Violation Tracking System with Vietnamese violation categories and types, following Supabase best practices with Row Level Security (RLS).

## 📁 Files

- `violation_system_schema.sql` - Complete database schema with tables, RLS policies, and indexes
- `violation_system_seeds.sql` - Vietnamese violation categories and types seed data
- `apply_violation_system.sql` - Application script to set up the entire system
- `VIOLATION_SYSTEM_README.md` - This setup guide

## 🗄️ Database Schema

### Tables Created

1. **violation_categories** - Main violation categories (Kỷ luật, Học tập, etc.)
2. **violation_types** - Specific violation types within categories
3. **student_violations** - Individual violation records for students
4. **violation_notifications** - Parent notification tracking

### Key Features

- **UUID Primary Keys** - Following Supabase best practices
- **Row Level Security (RLS)** - Complete role-based access control
- **Audit Trails** - Created/updated timestamps with triggers
- **Performance Indexes** - Optimized for common queries
- **Referential Integrity** - Proper foreign key relationships

## 🔐 Security Model

### Role-Based Access Control

#### Admin Users
- **Full Access**: Can view, create, update all violation data
- **Category Management**: Complete CRUD for categories and types
- **System Administration**: Can manage all aspects of the system

#### Teacher Users
- **Homeroom Access**: Can only view violations for their homeroom students
- **Recording**: Can record violations for any student
- **Notifications**: Can send notifications to parents

#### Parent Users
- **Child-Specific**: Can only view violations for their own children
- **Notifications**: Can view and mark notifications as read
- **No Modification**: Cannot create or edit violation records

#### Student Users
- **No Direct Access**: Students access violations through parent accounts

### RLS Policies

All tables have comprehensive RLS policies that enforce:
- User authentication requirements
- Role-based data filtering
- Parent-child relationship validation
- Homeroom teacher verification

## 📊 Data Structure

### Violation Categories (5 Categories)

1. **Kỷ luật** (Discipline) - 8 violation types
2. **Học tập** (Study) - 8 violation types  
3. **Chuyên cần** (Attendance) - 6 violation types
4. **Trang phục** (Uniform) - 7 violation types
5. **Thiết bị** (Devices) - 7 violation types

**Total: 36 specific violation types**

### Severity Levels

- **minor** (Nhẹ) - Minor infractions
- **moderate** (Trung bình) - Moderate violations
- **serious** (Nghiêm trọng) - Serious violations  
- **severe** (Rất nghiêm trọng) - Severe violations

## 🚀 Setup Instructions

### Step 1: Apply Database Schema

1. Open Supabase Dashboard → SQL Editor
2. Copy and paste the contents of `violation_system_schema.sql`
3. Execute to create tables, RLS policies, and indexes

### Step 2: Add Seed Data

1. Copy and paste the contents of `violation_system_seeds.sql`
2. Execute to populate violation categories and types

### Step 3: Verify Installation

1. Copy and paste the contents of `apply_violation_system.sql`
2. Execute to verify everything was created correctly
3. Check the output for confirmation messages

### Alternative: One-Step Setup

You can also run `apply_violation_system.sql` which includes both schema and seed data.

## 🔍 Verification Queries

After setup, run these queries to verify the system:

```sql
-- Check tables were created
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE '%violation%';

-- Check categories
SELECT name, description FROM violation_categories;

-- Check violation types count by category
SELECT 
  vc.name as category,
  COUNT(vt.id) as type_count
FROM violation_categories vc
LEFT JOIN violation_types vt ON vt.category_id = vc.id
GROUP BY vc.name
ORDER BY vc.name;

-- Check RLS policies
SELECT schemaname, tablename, policyname, roles, cmd, qual
FROM pg_policies 
WHERE tablename LIKE '%violation%';
```

## 📈 Performance Optimizations

### Indexes Created

- `violation_categories_is_active_idx` - Fast active category filtering
- `violation_types_category_id_idx` - Efficient category-type joins
- `student_violations_student_id_idx` - Quick student violation lookup
- `student_violations_recorded_at_idx` - Date-based filtering
- `violation_notifications_parent_id_idx` - Parent notification queries

### Query Optimization

- RLS policies use efficient EXISTS clauses
- Indexes support common filter patterns
- Foreign keys ensure referential integrity

## 🔧 Maintenance

### Regular Tasks

1. **Monitor Performance**: Check slow query logs
2. **Update Statistics**: Run `ANALYZE` on violation tables
3. **Archive Old Data**: Consider archiving old academic year data
4. **Review Policies**: Periodically review RLS policy effectiveness

### Backup Considerations

- Include all violation tables in backup strategy
- Test restore procedures with sample data
- Document recovery procedures

## 🐛 Troubleshooting

### Common Issues

1. **RLS Policy Errors**: Ensure user roles are correctly set in profiles table
2. **Foreign Key Violations**: Verify referenced records exist
3. **Permission Denied**: Check RLS policies match user roles

### Debug Queries

```sql
-- Check user role
SELECT role FROM profiles WHERE id = auth.uid();

-- Test RLS policy
SET row_security = off; -- Admin only
SELECT * FROM student_violations;
SET row_security = on;
```

## 📝 Notes

- All timestamps use `TIMESTAMP WITH TIME ZONE` for proper timezone handling
- UUIDs are generated using `gen_random_uuid()` for security
- Triggers automatically update `updated_at` fields
- RLS policies are restrictive by default for security

## 🎉 Success Criteria

After successful setup, you should have:

- ✅ 4 violation-related tables created
- ✅ 5 violation categories with 36 violation types
- ✅ Complete RLS policies for all user roles
- ✅ Performance indexes for optimal queries
- ✅ Audit trails with automatic timestamps

The system is now ready for integration with the frontend application!
